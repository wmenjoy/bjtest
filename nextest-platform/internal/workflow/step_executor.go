package workflow

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"test-management-service/internal/expression"
	"test-management-service/internal/models"
	"test-management-service/internal/testcase"
	ws "test-management-service/internal/websocket"

	"gorm.io/gorm"
)

// TestStepExecutor executes TestStep with full control flow support (loops, branches, children)
type TestStepExecutor struct {
	db               *gorm.DB
	hub              *ws.Hub
	testCaseRepo     TestCaseRepository
	unifiedExecutor  *testcase.UnifiedTestExecutor
	actionRegistry   *ActionRegistry
}

// TestStepExecutionContext contains execution context for TestStep execution
type TestStepExecutionContext struct {
	RunID       string
	Variables   map[string]interface{}
	StepOutputs map[string]interface{}
	Logger      StepLogger
	VarTracker  VariableChangeTracker
	Evaluator   *expression.Evaluator

	// Parent context for cancellation
	Ctx         context.Context
}

// NewTestStepExecutor creates a new TestStepExecutor
func NewTestStepExecutor(
	db *gorm.DB,
	hub *ws.Hub,
	testCaseRepo TestCaseRepository,
	unifiedExecutor *testcase.UnifiedTestExecutor,
) *TestStepExecutor {
	return &TestStepExecutor{
		db:               db,
		hub:              hub,
		testCaseRepo:     testCaseRepo,
		unifiedExecutor:  unifiedExecutor,
		actionRegistry:   NewActionRegistry(),
	}
}

// NewTestStepExecutionContext creates a new execution context
func NewTestStepExecutionContext(runID string, db *gorm.DB, hub *ws.Hub) *TestStepExecutionContext {
	variables := make(map[string]interface{})
	stepOutputs := make(map[string]interface{})

	return &TestStepExecutionContext{
		RunID:       runID,
		Variables:   variables,
		StepOutputs: stepOutputs,
		Logger:      NewBroadcastStepLogger(db, runID, hub),
		VarTracker:  NewDatabaseVariableChangeTracker(db, runID),
		Evaluator:   expression.NewEvaluator(variables, stepOutputs),
		Ctx:         context.Background(),
	}
}

// ExecuteStep executes a single TestStep with full control flow support
func (e *TestStepExecutor) ExecuteStep(ctx *TestStepExecutionContext, step *models.TestStep) (*models.StepExecution, error) {
	// Create step execution record
	execution := models.NewStepExecution(step.ID, step.Name, step.Type)
	execution.Start()

	// 1. Check if step is disabled
	if step.Disabled {
		ctx.Logger.Info(step.ID, "Step is disabled, skipping")
		execution.Complete(models.StepStatusSkipped)
		return execution, nil
	}

	// 2. Resolve input variables
	if err := e.resolveInputs(ctx, step, execution); err != nil {
		execution.Fail(fmt.Sprintf("Failed to resolve inputs: %v", err), models.ErrorTypeSystem)
		return execution, err
	}

	// 3. Check condition - skip if not met
	if step.Condition != "" {
		conditionMet, err := e.evaluateCondition(ctx, step.Condition)
		if err != nil {
			ctx.Logger.Warn(step.ID, fmt.Sprintf("Condition evaluation error: %v, skipping step", err))
			execution.Complete(models.StepStatusSkipped)
			return execution, nil
		}
		if !conditionMet {
			ctx.Logger.Info(step.ID, fmt.Sprintf("Condition not met: %s, skipping step", step.Condition))
			execution.Complete(models.StepStatusSkipped)
			return execution, nil
		}
	}

	// 4. Check if step has loop - wrap execution in loop
	if step.Loop != nil {
		return e.executeWithLoop(ctx, step, execution)
	}

	// 5. If type is "branch" - execute branch logic
	if step.Type == models.StepTypeBranch {
		return e.executeBranch(ctx, step, execution)
	}

	// 6. If type is "group" - execute children
	if step.Type == models.StepTypeGroup {
		return e.executeGroup(ctx, step, execution)
	}

	// 7. Otherwise execute as simple step (http, command, assert, delay, etc.)
	return e.executeSimpleStep(ctx, step, execution)
}

// resolveInputs resolves input variable mappings for the step
func (e *TestStepExecutor) resolveInputs(ctx *TestStepExecutionContext, step *models.TestStep, execution *models.StepExecution) error {
	if step.Inputs == nil {
		return nil
	}

	execution.Inputs = make(map[string]interface{})

	for targetVar, sourceExpr := range step.Inputs {
		value, err := ctx.Evaluator.Evaluate(sourceExpr)
		if err != nil {
			return fmt.Errorf("failed to resolve input '%s' from '%s': %w", targetVar, sourceExpr, err)
		}
		execution.Inputs[targetVar] = value
		// Also set in variables for use during step execution
		ctx.Variables[targetVar] = value
	}

	return nil
}

// evaluateCondition evaluates a condition expression and returns boolean result
func (e *TestStepExecutor) evaluateCondition(ctx *TestStepExecutionContext, condition string) (bool, error) {
	if condition == "" {
		return true, nil
	}

	// Refresh evaluator with current variables
	ctx.Evaluator = expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)

	return ctx.Evaluator.EvaluateBool(condition)
}

// executeWithLoop wraps step execution with loop logic based on loop type
func (e *TestStepExecutor) executeWithLoop(ctx *TestStepExecutionContext, step *models.TestStep, execution *models.StepExecution) (*models.StepExecution, error) {
	loop := step.Loop

	switch loop.Type {
	case models.LoopTypeForEach:
		return e.executeForEachLoop(ctx, step, execution)
	case models.LoopTypeWhile:
		return e.executeWhileLoop(ctx, step, execution)
	case models.LoopTypeCount:
		return e.executeCountLoop(ctx, step, execution)
	default:
		execution.Fail(fmt.Sprintf("Unknown loop type: %s", loop.Type), models.ErrorTypeSystem)
		return execution, fmt.Errorf("unknown loop type: %s", loop.Type)
	}
}

// executeForEachLoop executes a step for each item in a collection
func (e *TestStepExecutor) executeForEachLoop(ctx *TestStepExecutionContext, step *models.TestStep, execution *models.StepExecution) (*models.StepExecution, error) {
	loop := step.Loop

	ctx.Logger.Info(step.ID, fmt.Sprintf("Starting forEach loop over: %s", loop.Source))

	// Broadcast loop start
	e.broadcastLoopEvent(ctx.RunID, "LOOP_START", step.ID, step.Name, map[string]interface{}{
		"loopType": models.LoopTypeForEach,
		"source":   loop.Source,
	})

	// Resolve source array from variables
	ctx.Evaluator = expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)
	collection, err := ctx.Evaluator.EvaluateToArray(loop.Source)
	if err != nil {
		execution.Fail(fmt.Sprintf("Failed to evaluate loop source: %v", err), models.ErrorTypeSystem)
		return execution, fmt.Errorf("failed to evaluate loop collection: %w", err)
	}

	totalIterations := len(collection)
	ctx.Logger.Info(step.ID, fmt.Sprintf("Loop collection size: %d items", totalIterations))

	// Create LoopExecution tracker
	execution.Loop = models.NewLoopExecution(totalIterations)

	// Get max iterations safety limit
	maxIterations := loop.MaxIterations
	if maxIterations <= 0 {
		maxIterations = models.DefaultMaxIterations
	}

	// Check if parallel execution
	if loop.Parallel {
		return e.executeForEachParallel(ctx, step, execution, collection, maxIterations)
	}

	// Sequential execution
	for index, item := range collection {
		// Safety check
		if index >= maxIterations {
			ctx.Logger.Warn(step.ID, fmt.Sprintf("Reached max iterations limit: %d", maxIterations))
			execution.Loop.ExitReason = models.LoopExitMaxIterations
			break
		}

		// Check break condition before iteration
		if loop.BreakCondition != "" {
			shouldBreak, _ := e.evaluateCondition(ctx, loop.BreakCondition)
			if shouldBreak {
				ctx.Logger.Info(step.ID, fmt.Sprintf("Break condition met at iteration %d", index))
				execution.Loop.ExitReason = models.LoopExitBreak
				execution.Loop.ExitValue = loop.BreakCondition
				break
			}
		}

		// Check continue condition
		if loop.ContinueCondition != "" {
			shouldContinue, _ := e.evaluateCondition(ctx, loop.ContinueCondition)
			if shouldContinue {
				ctx.Logger.Info(step.ID, fmt.Sprintf("Continue condition met at iteration %d, skipping", index))
				iteration := models.NewIterationExecution(index, item)
				iteration.Status = models.StepStatusSkipped
				execution.Loop.Iterations = append(execution.Loop.Iterations, *iteration)
				execution.Loop.SkippedIterations++
				continue
			}
		}

		// Execute iteration
		iterResult, err := e.executeSingleIteration(ctx, step, execution, index, item, totalIterations)
		if err != nil {
			if step.OnError == models.OnErrorContinue || step.ContinueOnFail {
				ctx.Logger.Warn(step.ID, fmt.Sprintf("Iteration %d failed but continuing: %v", index, err))
				continue
			}
			execution.Loop.ExitReason = models.LoopExitError
			execution.Fail(fmt.Sprintf("Loop iteration %d failed: %v", index, err), models.ErrorTypeSystem)
			return execution, err
		}

		if iterResult.Status == models.StepStatusFailed {
			execution.Loop.FailedIterations++
		} else {
			execution.Loop.PassedIterations++
		}
	}

	// Clean up loop variables
	e.cleanupLoopVariables(ctx, loop)

	// Set final status
	if execution.Loop.ExitReason == "" {
		execution.Loop.ExitReason = models.LoopExitCompleted
	}

	// Broadcast loop complete
	e.broadcastLoopEvent(ctx.RunID, "LOOP_COMPLETE", step.ID, step.Name, map[string]interface{}{
		"totalIterations":     totalIterations,
		"completedIterations": execution.Loop.CompletedIterations,
		"passedIterations":    execution.Loop.PassedIterations,
		"failedIterations":    execution.Loop.FailedIterations,
		"exitReason":          execution.Loop.ExitReason,
	})

	// Determine overall status
	if execution.Loop.FailedIterations > 0 && !step.ContinueOnFail {
		execution.Complete(models.StepStatusFailed)
	} else {
		execution.Complete(models.StepStatusPassed)
	}

	ctx.Logger.Info(step.ID, fmt.Sprintf("ForEach loop completed: %d passed, %d failed",
		execution.Loop.PassedIterations, execution.Loop.FailedIterations))

	return execution, nil
}

// executeForEachParallel executes forEach loop iterations in parallel
func (e *TestStepExecutor) executeForEachParallel(ctx *TestStepExecutionContext, step *models.TestStep, execution *models.StepExecution, collection []interface{}, maxIterations int) (*models.StepExecution, error) {
	loop := step.Loop
	totalIterations := len(collection)

	ctx.Logger.Info(step.ID, fmt.Sprintf("Starting parallel forEach loop with %d items", totalIterations))

	// Determine concurrency
	concurrency := loop.Concurrency
	if concurrency <= 0 {
		concurrency = 10 // Default max concurrency
	}

	// Create semaphore for concurrency control
	semaphore := make(chan struct{}, concurrency)
	var wg sync.WaitGroup
	var mu sync.Mutex
	errorsChan := make(chan error, totalIterations)

	for index, item := range collection {
		if index >= maxIterations {
			break
		}

		wg.Add(1)
		semaphore <- struct{}{} // Acquire semaphore

		go func(idx int, itm interface{}) {
			defer wg.Done()
			defer func() { <-semaphore }() // Release semaphore

			// Create isolated context for this iteration
			iterCtx := e.createIterationContext(ctx, step, idx, itm, totalIterations)

			// Create iteration record
			iteration := models.NewIterationExecution(idx, itm)
			iteration.Status = models.StepStatusRunning
			iteration.StartTime = time.Now()

			// Broadcast iteration start
			e.broadcastLoopEvent(ctx.RunID, "ITERATION_START", step.ID, step.Name, map[string]interface{}{
				"index": idx,
				"item":  itm,
				"total": totalIterations,
			})

			// Execute the step content
			var childResults []models.StepExecution
			var iterErr error

			if step.Type == models.StepTypeGroup && len(step.Children) > 0 {
				childResults, iterErr = e.executeChildren(iterCtx, step.Children)
			} else {
				result, err := e.executeSimpleStep(iterCtx, step, models.NewStepExecution(step.ID, step.Name, step.Type))
				if err != nil {
					iterErr = err
				} else if result.Status == models.StepStatusFailed {
					iterErr = fmt.Errorf("step failed: %s", result.Error)
				}
				if result != nil {
					childResults = []models.StepExecution{*result}
				}
			}

			// Update iteration record
			now := time.Now()
			iteration.EndTime = &now
			iteration.Duration = now.Sub(iteration.StartTime).Milliseconds()
			iteration.Children = childResults
			iteration.Variables = copyMap(iterCtx.Variables)

			if iterErr != nil {
				iteration.Status = models.StepStatusFailed
				iteration.Error = iterErr.Error()
				if step.OnError != models.OnErrorContinue && !step.ContinueOnFail {
					errorsChan <- iterErr
				}
			} else {
				iteration.Status = models.StepStatusPassed
			}

			// Thread-safe update of loop execution
			mu.Lock()
			execution.Loop.Iterations = append(execution.Loop.Iterations, *iteration)
			execution.Loop.CompletedIterations++
			if iteration.Status == models.StepStatusFailed {
				execution.Loop.FailedIterations++
			} else {
				execution.Loop.PassedIterations++
			}
			mu.Unlock()

			// Broadcast iteration complete
			e.broadcastLoopEvent(ctx.RunID, "ITERATION_COMPLETE", step.ID, step.Name, map[string]interface{}{
				"index":    idx,
				"status":   iteration.Status,
				"duration": iteration.Duration,
			})
		}(index, item)
	}

	wg.Wait()
	close(errorsChan)

	// Check for errors
	var firstError error
	for err := range errorsChan {
		if firstError == nil {
			firstError = err
		}
	}

	// Clean up loop variables
	e.cleanupLoopVariables(ctx, loop)

	// Set final status
	execution.Loop.ExitReason = models.LoopExitCompleted

	// Broadcast loop complete
	e.broadcastLoopEvent(ctx.RunID, "LOOP_COMPLETE", step.ID, step.Name, map[string]interface{}{
		"totalIterations":     totalIterations,
		"completedIterations": execution.Loop.CompletedIterations,
		"passedIterations":    execution.Loop.PassedIterations,
		"failedIterations":    execution.Loop.FailedIterations,
		"exitReason":          execution.Loop.ExitReason,
	})

	if firstError != nil && !step.ContinueOnFail {
		execution.Fail(firstError.Error(), models.ErrorTypeSystem)
		return execution, firstError
	}

	execution.Complete(models.StepStatusPassed)
	return execution, nil
}

// executeSingleIteration executes a single loop iteration
func (e *TestStepExecutor) executeSingleIteration(ctx *TestStepExecutionContext, step *models.TestStep, execution *models.StepExecution, index int, item interface{}, totalIterations int) (*models.IterationExecution, error) {
	loop := step.Loop

	// Create iteration record
	iteration := models.NewIterationExecution(index, item)
	iteration.Status = models.StepStatusRunning
	iteration.StartTime = time.Now()

	ctx.Logger.Info(step.ID, fmt.Sprintf("Loop iteration %d/%d", index+1, totalIterations))

	// Broadcast iteration start
	e.broadcastLoopEvent(ctx.RunID, "ITERATION_START", step.ID, step.Name, map[string]interface{}{
		"index": index,
		"item":  item,
		"total": totalIterations,
	})

	// Set loop variables in context
	e.setLoopVariables(ctx, loop, index, item, totalIterations)

	// Update evaluator with new variables
	ctx.Evaluator = expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)

	// Execute the step content
	var childResults []models.StepExecution
	var iterErr error

	if step.Type == models.StepTypeGroup && len(step.Children) > 0 {
		// Execute children for group steps
		childResults, iterErr = e.executeChildren(ctx, step.Children)
	} else {
		// Execute simple step
		result, err := e.executeSimpleStep(ctx, step, models.NewStepExecution(
			fmt.Sprintf("%s_iter_%d", step.ID, index),
			fmt.Sprintf("%s [%d]", step.Name, index),
			step.Type,
		))
		if err != nil {
			iterErr = err
		} else if result.Status == models.StepStatusFailed {
			iterErr = fmt.Errorf("step failed: %s", result.Error)
		}
		if result != nil {
			childResults = []models.StepExecution{*result}
		}
	}

	// Update iteration record
	now := time.Now()
	iteration.EndTime = &now
	iteration.Duration = now.Sub(iteration.StartTime).Milliseconds()
	iteration.Children = childResults
	iteration.Variables = copyMap(ctx.Variables)

	if iterErr != nil {
		iteration.Status = models.StepStatusFailed
		iteration.Error = iterErr.Error()
	} else {
		iteration.Status = models.StepStatusPassed
	}

	// Add to loop execution
	execution.Loop.Iterations = append(execution.Loop.Iterations, *iteration)
	execution.Loop.CompletedIterations++
	execution.Loop.CurrentIteration = index

	// Broadcast iteration complete
	e.broadcastLoopEvent(ctx.RunID, "ITERATION_COMPLETE", step.ID, step.Name, map[string]interface{}{
		"index":    index,
		"status":   iteration.Status,
		"duration": iteration.Duration,
	})

	return iteration, iterErr
}

// executeWhileLoop executes a step while a condition is true
func (e *TestStepExecutor) executeWhileLoop(ctx *TestStepExecutionContext, step *models.TestStep, execution *models.StepExecution) (*models.StepExecution, error) {
	loop := step.Loop

	ctx.Logger.Info(step.ID, fmt.Sprintf("Starting while loop with condition: %s", loop.Condition))

	// Broadcast loop start
	e.broadcastLoopEvent(ctx.RunID, "LOOP_START", step.ID, step.Name, map[string]interface{}{
		"loopType":  models.LoopTypeWhile,
		"condition": loop.Condition,
	})

	// Get max iterations safety limit
	maxIterations := loop.MaxIterations
	if maxIterations <= 0 {
		maxIterations = models.DefaultMaxIterations
	}

	// Create LoopExecution tracker (unknown total for while loops)
	execution.Loop = models.NewLoopExecution(-1) // -1 indicates unknown total

	iteration := 0
	for iteration < maxIterations {
		// Update evaluator with current variables
		ctx.Evaluator = expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)

		// Check loop condition
		shouldContinue, err := ctx.Evaluator.EvaluateBool(loop.Condition)
		if err != nil {
			execution.Fail(fmt.Sprintf("Failed to evaluate loop condition: %v", err), models.ErrorTypeSystem)
			return execution, fmt.Errorf("failed to evaluate loop condition: %w", err)
		}

		if !shouldContinue {
			ctx.Logger.Info(step.ID, fmt.Sprintf("While loop condition became false after %d iterations", iteration))
			execution.Loop.ExitReason = models.LoopExitConditionFalse
			break
		}

		// Check break condition
		if loop.BreakCondition != "" {
			shouldBreak, _ := e.evaluateCondition(ctx, loop.BreakCondition)
			if shouldBreak {
				ctx.Logger.Info(step.ID, fmt.Sprintf("Break condition met at iteration %d", iteration))
				execution.Loop.ExitReason = models.LoopExitBreak
				execution.Loop.ExitValue = loop.BreakCondition
				break
			}
		}

		// Execute iteration
		iterResult, err := e.executeSingleIteration(ctx, step, execution, iteration, nil, -1)
		if err != nil {
			if step.OnError == models.OnErrorContinue || step.ContinueOnFail {
				ctx.Logger.Warn(step.ID, fmt.Sprintf("While loop iteration %d failed but continuing: %v", iteration, err))
			} else {
				execution.Loop.ExitReason = models.LoopExitError
				execution.Fail(fmt.Sprintf("While loop iteration %d failed: %v", iteration, err), models.ErrorTypeSystem)
				return execution, err
			}
		}

		if iterResult.Status == models.StepStatusFailed {
			execution.Loop.FailedIterations++
		} else {
			execution.Loop.PassedIterations++
		}

		iteration++
	}

	// Check if max iterations reached
	if iteration >= maxIterations {
		ctx.Logger.Warn(step.ID, fmt.Sprintf("While loop reached max iterations limit: %d", maxIterations))
		execution.Loop.ExitReason = models.LoopExitMaxIterations
	}

	// Clean up loop variables
	e.cleanupLoopVariables(ctx, loop)

	// Set final status
	if execution.Loop.ExitReason == "" {
		execution.Loop.ExitReason = models.LoopExitCompleted
	}
	execution.Loop.TotalIterations = iteration

	// Broadcast loop complete
	e.broadcastLoopEvent(ctx.RunID, "LOOP_COMPLETE", step.ID, step.Name, map[string]interface{}{
		"totalIterations":     iteration,
		"completedIterations": execution.Loop.CompletedIterations,
		"passedIterations":    execution.Loop.PassedIterations,
		"failedIterations":    execution.Loop.FailedIterations,
		"exitReason":          execution.Loop.ExitReason,
	})

	// Determine overall status
	if execution.Loop.FailedIterations > 0 && !step.ContinueOnFail {
		execution.Complete(models.StepStatusFailed)
	} else {
		execution.Complete(models.StepStatusPassed)
	}

	ctx.Logger.Info(step.ID, fmt.Sprintf("While loop completed after %d iterations", iteration))
	return execution, nil
}

// executeCountLoop executes a step a fixed number of times
func (e *TestStepExecutor) executeCountLoop(ctx *TestStepExecutionContext, step *models.TestStep, execution *models.StepExecution) (*models.StepExecution, error) {
	loop := step.Loop

	// Resolve count value (can be number or expression)
	var count int
	switch v := loop.Count.(type) {
	case int:
		count = v
	case int64:
		count = int(v)
	case float64:
		count = int(v)
	case string:
		// Evaluate as expression
		ctx.Evaluator = expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)
		result, err := ctx.Evaluator.Evaluate(v)
		if err != nil {
			execution.Fail(fmt.Sprintf("Failed to evaluate loop count: %v", err), models.ErrorTypeSystem)
			return execution, fmt.Errorf("failed to evaluate loop count: %w", err)
		}
		switch r := result.(type) {
		case int:
			count = r
		case int64:
			count = int(r)
		case float64:
			count = int(r)
		default:
			execution.Fail(fmt.Sprintf("Loop count must be a number, got: %T", result), models.ErrorTypeSystem)
			return execution, fmt.Errorf("loop count must be a number")
		}
	default:
		execution.Fail(fmt.Sprintf("Invalid loop count type: %T", loop.Count), models.ErrorTypeSystem)
		return execution, fmt.Errorf("invalid loop count type: %T", loop.Count)
	}

	ctx.Logger.Info(step.ID, fmt.Sprintf("Starting count loop with %d iterations", count))

	// Broadcast loop start
	e.broadcastLoopEvent(ctx.RunID, "LOOP_START", step.ID, step.Name, map[string]interface{}{
		"loopType": models.LoopTypeCount,
		"count":    count,
	})

	// Get max iterations safety limit
	maxIterations := loop.MaxIterations
	if maxIterations <= 0 {
		maxIterations = models.DefaultMaxIterations
	}

	// Apply safety limit
	if count > maxIterations {
		ctx.Logger.Warn(step.ID, fmt.Sprintf("Loop count %d exceeds max iterations %d, limiting", count, maxIterations))
		count = maxIterations
	}

	// Create LoopExecution tracker
	execution.Loop = models.NewLoopExecution(count)

	// Execute iterations
	for index := 0; index < count; index++ {
		// Check break condition
		if loop.BreakCondition != "" {
			shouldBreak, _ := e.evaluateCondition(ctx, loop.BreakCondition)
			if shouldBreak {
				ctx.Logger.Info(step.ID, fmt.Sprintf("Break condition met at iteration %d", index))
				execution.Loop.ExitReason = models.LoopExitBreak
				execution.Loop.ExitValue = loop.BreakCondition
				break
			}
		}

		// Check continue condition
		if loop.ContinueCondition != "" {
			shouldContinue, _ := e.evaluateCondition(ctx, loop.ContinueCondition)
			if shouldContinue {
				ctx.Logger.Info(step.ID, fmt.Sprintf("Continue condition met at iteration %d, skipping", index))
				iteration := models.NewIterationExecution(index, index)
				iteration.Status = models.StepStatusSkipped
				execution.Loop.Iterations = append(execution.Loop.Iterations, *iteration)
				execution.Loop.SkippedIterations++
				continue
			}
		}

		// Execute iteration with index as item value
		iterResult, err := e.executeSingleIteration(ctx, step, execution, index, index, count)
		if err != nil {
			if step.OnError == models.OnErrorContinue || step.ContinueOnFail {
				ctx.Logger.Warn(step.ID, fmt.Sprintf("Count loop iteration %d failed but continuing: %v", index, err))
				continue
			}
			execution.Loop.ExitReason = models.LoopExitError
			execution.Fail(fmt.Sprintf("Count loop iteration %d failed: %v", index, err), models.ErrorTypeSystem)
			return execution, err
		}

		if iterResult.Status == models.StepStatusFailed {
			execution.Loop.FailedIterations++
		} else {
			execution.Loop.PassedIterations++
		}
	}

	// Clean up loop variables
	e.cleanupLoopVariables(ctx, loop)

	// Set final status
	if execution.Loop.ExitReason == "" {
		execution.Loop.ExitReason = models.LoopExitCompleted
	}

	// Broadcast loop complete
	e.broadcastLoopEvent(ctx.RunID, "LOOP_COMPLETE", step.ID, step.Name, map[string]interface{}{
		"totalIterations":     count,
		"completedIterations": execution.Loop.CompletedIterations,
		"passedIterations":    execution.Loop.PassedIterations,
		"failedIterations":    execution.Loop.FailedIterations,
		"exitReason":          execution.Loop.ExitReason,
	})

	// Determine overall status
	if execution.Loop.FailedIterations > 0 && !step.ContinueOnFail {
		execution.Complete(models.StepStatusFailed)
	} else {
		execution.Complete(models.StepStatusPassed)
	}

	ctx.Logger.Info(step.ID, fmt.Sprintf("Count loop completed: %d passed, %d failed",
		execution.Loop.PassedIterations, execution.Loop.FailedIterations))

	return execution, nil
}

// executeBranch handles conditional branching
func (e *TestStepExecutor) executeBranch(ctx *TestStepExecutionContext, step *models.TestStep, execution *models.StepExecution) (*models.StepExecution, error) {
	if len(step.Branches) == 0 {
		execution.Fail("Branch step has no branches defined", models.ErrorTypeSystem)
		return execution, fmt.Errorf("branch step has no branches defined")
	}

	ctx.Logger.Info(step.ID, fmt.Sprintf("Evaluating %d branches", len(step.Branches)))

	// Create BranchExecution tracker
	execution.Branch = &models.BranchExecution{
		EvaluatedConditions: make([]models.ConditionEvaluation, 0, len(step.Branches)),
	}

	// Update evaluator
	ctx.Evaluator = expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)

	// Find matching branch
	var selectedBranch *models.BranchConfig
	var selectedIndex int = -1
	var defaultBranch *models.BranchConfig
	var defaultIndex int = -1

	for i, branch := range step.Branches {
		// Evaluate condition
		condEval := models.ConditionEvaluation{
			BranchLabel: branch.Label,
			Condition:   branch.Condition,
		}

		// Check for default branch
		if branch.Condition == "" || branch.Condition == "default" {
			condEval.Result = true
			defaultBranch = &step.Branches[i]
			defaultIndex = i
			execution.Branch.EvaluatedConditions = append(execution.Branch.EvaluatedConditions, condEval)
			continue
		}

		// Evaluate the condition
		result, err := ctx.Evaluator.EvaluateBool(branch.Condition)
		if err != nil {
			condEval.Error = err.Error()
			condEval.Result = false
		} else {
			condEval.Result = result
			condEval.Value = result
		}

		execution.Branch.EvaluatedConditions = append(execution.Branch.EvaluatedConditions, condEval)

		// Select first matching branch
		if result && selectedBranch == nil {
			selectedBranch = &step.Branches[i]
			selectedIndex = i
		}
	}

	// Use default branch if no other matched
	if selectedBranch == nil && defaultBranch != nil {
		selectedBranch = defaultBranch
		selectedIndex = defaultIndex
		execution.Branch.IsDefaultBranch = true
	}

	// No matching branch
	if selectedBranch == nil {
		ctx.Logger.Info(step.ID, "No branch condition matched, skipping")
		execution.Branch.SelectedBranch = "none"
		execution.Complete(models.StepStatusSkipped)
		return execution, nil
	}

	// Set selected branch info
	execution.Branch.SelectedBranch = selectedBranch.Label
	if execution.Branch.SelectedBranch == "" {
		execution.Branch.SelectedBranch = fmt.Sprintf("branch_%d", selectedIndex)
	}
	execution.Branch.SelectedBranchIndex = selectedIndex
	execution.Branch.Condition = selectedBranch.Condition

	ctx.Logger.Info(step.ID, fmt.Sprintf("Selected branch: %s (index %d)", execution.Branch.SelectedBranch, selectedIndex))

	// Broadcast branch decision
	e.broadcastBranchEvent(ctx.RunID, "BRANCH_DECISION", step.ID, step.Name, map[string]interface{}{
		"selectedBranch": execution.Branch.SelectedBranch,
		"branchIndex":    selectedIndex,
		"isDefault":      execution.Branch.IsDefaultBranch,
		"condition":      execution.Branch.Condition,
	})

	// Execute selected branch children
	if len(selectedBranch.Children) > 0 {
		childResults, err := e.executeChildren(ctx, selectedBranch.Children)
		execution.Children = childResults

		if err != nil {
			execution.Fail(fmt.Sprintf("Branch execution failed: %v", err), models.ErrorTypeSystem)
			return execution, err
		}

		// Check if any child failed
		for _, child := range childResults {
			if child.Status == models.StepStatusFailed {
				execution.Complete(models.StepStatusFailed)
				return execution, nil
			}
		}
	}

	execution.Complete(models.StepStatusPassed)
	return execution, nil
}

// executeGroup executes a group step's children
func (e *TestStepExecutor) executeGroup(ctx *TestStepExecutionContext, step *models.TestStep, execution *models.StepExecution) (*models.StepExecution, error) {
	ctx.Logger.Info(step.ID, fmt.Sprintf("Executing group with %d children", len(step.Children)))

	if len(step.Children) == 0 {
		execution.Complete(models.StepStatusPassed)
		return execution, nil
	}

	childResults, err := e.executeChildren(ctx, step.Children)
	execution.Children = childResults

	if err != nil {
		execution.Fail(fmt.Sprintf("Group execution failed: %v", err), models.ErrorTypeSystem)
		return execution, err
	}

	// Check if any child failed
	for _, child := range childResults {
		if child.Status == models.StepStatusFailed && !step.ContinueOnFail {
			execution.Complete(models.StepStatusFailed)
			return execution, nil
		}
	}

	execution.Complete(models.StepStatusPassed)
	return execution, nil
}

// executeChildren executes an array of child steps in sequence
func (e *TestStepExecutor) executeChildren(ctx *TestStepExecutionContext, children []models.TestStep) ([]models.StepExecution, error) {
	results := make([]models.StepExecution, 0, len(children))

	for i := range children {
		child := &children[i]

		ctx.Logger.Info(child.ID, fmt.Sprintf("Executing child step: %s", child.Name))

		result, err := e.ExecuteStep(ctx, child)
		if result != nil {
			results = append(results, *result)
		}

		if err != nil {
			// Check if we should continue on error
			if child.OnError == models.OnErrorContinue || child.ContinueOnFail {
				ctx.Logger.Warn(child.ID, fmt.Sprintf("Child step failed but continuing: %v", err))
				continue
			}
			return results, err
		}

		// Map outputs to parent context
		if result != nil && result.Status == models.StepStatusPassed {
			e.mapOutputs(ctx, child, result)
		}
	}

	return results, nil
}

// executeSimpleStep executes a simple step (http, command, assert, delay, script)
func (e *TestStepExecutor) executeSimpleStep(ctx *TestStepExecutionContext, step *models.TestStep, execution *models.StepExecution) (*models.StepExecution, error) {
	ctx.Logger.Info(step.ID, fmt.Sprintf("Executing %s step: %s", step.Type, step.Name))

	// Broadcast step start
	if e.hub != nil {
		e.hub.Broadcast(ctx.RunID, "step_start", map[string]interface{}{
			"stepId":   step.ID,
			"stepName": step.Name,
			"stepType": step.Type,
		})
	}

	// Get step configuration
	config := make(map[string]interface{})
	if step.Config != nil {
		config = map[string]interface{}(step.Config)
	}

	// Interpolate variables in config
	interpolatedConfig, err := e.interpolateConfig(config, ctx)
	if err != nil {
		execution.Fail(fmt.Sprintf("Variable interpolation failed: %v", err), models.ErrorTypeSystem)
		return execution, err
	}

	// Create action context
	actionCtx := &ActionContext{
		StepID:          step.ID,
		Variables:       ctx.Variables,
		StepOutputs:     ctx.StepOutputs,
		TestCaseRepo:    e.testCaseRepo,
		UnifiedExecutor: e.unifiedExecutor,
		Logger:          ctx.Logger,
	}

	// Execute based on step type
	var result *ActionResult
	switch step.Type {
	case models.StepTypeHTTP:
		action := &HTTPActionWrapper{Config: interpolatedConfig}
		result, err = action.Execute(actionCtx)

	case models.StepTypeCommand:
		action := &CommandActionWrapper{Config: interpolatedConfig}
		result, err = action.Execute(actionCtx)

	case models.StepTypeAssert:
		action := &AssertActionWrapper{Config: interpolatedConfig}
		result, err = action.Execute(actionCtx)
		if result != nil && result.Output != nil {
			execution.Assertions = e.extractAssertionResults(result.Output)
		}

	case models.StepTypeDelay:
		err = e.executeDelay(step, ctx)
		if err == nil {
			result = &ActionResult{Status: "success"}
		}

	case models.StepTypeScript:
		action := &ScriptActionWrapper{Config: interpolatedConfig}
		result, err = action.Execute(actionCtx)

	default:
		err = fmt.Errorf("unsupported step type: %s", step.Type)
	}

	// Handle retry logic
	if err != nil && step.RetryCount > 0 {
		for attempt := 1; attempt <= step.RetryCount; attempt++ {
			ctx.Logger.Info(step.ID, fmt.Sprintf("Retry attempt %d/%d", attempt, step.RetryCount))

			if step.RetryDelay > 0 {
				time.Sleep(time.Duration(step.RetryDelay) * time.Millisecond)
			}

			// Re-execute based on type
			switch step.Type {
			case models.StepTypeHTTP:
				action := &HTTPActionWrapper{Config: interpolatedConfig}
				result, err = action.Execute(actionCtx)
			case models.StepTypeCommand:
				action := &CommandActionWrapper{Config: interpolatedConfig}
				result, err = action.Execute(actionCtx)
			default:
				break
			}

			if err == nil && (result == nil || result.Status == "success") {
				execution.RetryCount = attempt
				break
			}
		}
	}

	// Update execution based on result
	if err != nil {
		execution.Fail(err.Error(), models.ErrorTypeSystem)
	} else if result != nil && result.Status == "failed" {
		errMsg := "step failed"
		if result.Error != nil {
			errMsg = result.Error.Error()
		}
		execution.Fail(errMsg, models.ErrorTypeSystem)
	} else {
		execution.Complete(models.StepStatusPassed)
		if result != nil && result.Output != nil {
			execution.Outputs = result.Output
			// Store in step outputs for later reference
			ctx.StepOutputs[step.ID] = result.Output
		}
	}

	// Map outputs
	if execution.Status == models.StepStatusPassed {
		e.mapOutputs(ctx, step, execution)
	}

	// Broadcast step complete
	if e.hub != nil {
		e.hub.Broadcast(ctx.RunID, "step_complete", map[string]interface{}{
			"stepId":   step.ID,
			"stepName": step.Name,
			"status":   execution.Status,
			"duration": execution.Duration,
		})
	}

	return execution, nil
}

// executeDelay executes a delay step
func (e *TestStepExecutor) executeDelay(step *models.TestStep, ctx *TestStepExecutionContext) error {
	config := make(map[string]interface{})
	if step.Config != nil {
		config = map[string]interface{}(step.Config)
	}

	// Parse delay configuration
	var delayConfig models.DelayStepConfig
	configData, _ := json.Marshal(config)
	if err := json.Unmarshal(configData, &delayConfig); err != nil {
		// Try simple duration field
		if duration, ok := config["duration"].(float64); ok {
			delayConfig.Duration = int(duration)
		} else {
			return fmt.Errorf("invalid delay configuration")
		}
	}

	// Calculate delay in milliseconds
	durationMs := delayConfig.Duration
	switch delayConfig.Unit {
	case "s":
		durationMs *= 1000
	case "m":
		durationMs *= 60000
	}

	ctx.Logger.Info(step.ID, fmt.Sprintf("Delaying for %d ms", durationMs))
	time.Sleep(time.Duration(durationMs) * time.Millisecond)

	return nil
}

// mapOutputs maps step outputs to variables based on output configuration
func (e *TestStepExecutor) mapOutputs(ctx *TestStepExecutionContext, step *models.TestStep, execution *models.StepExecution) {
	if step.Outputs == nil || execution.Outputs == nil {
		return
	}

	for stepOutput, targetVar := range step.Outputs {
		if value, exists := execution.Outputs[stepOutput]; exists {
			oldValue := ctx.Variables[targetVar]
			ctx.Variables[targetVar] = value
			ctx.VarTracker.Track(step.ID, targetVar, oldValue, value, "update")
		}
	}
}

// interpolateConfig interpolates variables in configuration map
func (e *TestStepExecutor) interpolateConfig(config map[string]interface{}, ctx *TestStepExecutionContext) (map[string]interface{}, error) {
	if config == nil {
		return nil, nil
	}

	result := make(map[string]interface{})
	for key, value := range config {
		interpolatedValue, err := e.interpolateValue(value, ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to interpolate key '%s': %w", key, err)
		}
		result[key] = interpolatedValue
	}

	return result, nil
}

// interpolateValue recursively interpolates a single value
func (e *TestStepExecutor) interpolateValue(value interface{}, ctx *TestStepExecutionContext) (interface{}, error) {
	switch v := value.(type) {
	case string:
		return ctx.Evaluator.EvaluateString(v)

	case map[string]interface{}:
		result := make(map[string]interface{})
		for key, val := range v {
			interpolatedVal, err := e.interpolateValue(val, ctx)
			if err != nil {
				return nil, err
			}
			result[key] = interpolatedVal
		}
		return result, nil

	case []interface{}:
		result := make([]interface{}, len(v))
		for i, item := range v {
			interpolatedItem, err := e.interpolateValue(item, ctx)
			if err != nil {
				return nil, err
			}
			result[i] = interpolatedItem
		}
		return result, nil

	default:
		return value, nil
	}
}

// setLoopVariables sets loop-related variables in context
func (e *TestStepExecutor) setLoopVariables(ctx *TestStepExecutionContext, loop *models.LoopConfig, index int, item interface{}, total int) {
	// Set item variable if configured
	if loop.ItemVar != "" {
		ctx.Variables[loop.ItemVar] = item
	}

	// Set index variable if configured
	if loop.IndexVar != "" {
		ctx.Variables[loop.IndexVar] = index
	}

	// Set standard loop variables
	ctx.Variables["$loopIndex"] = index
	ctx.Variables["$loopCount"] = index + 1
	ctx.Variables["$loopItem"] = item

	if total > 0 {
		ctx.Variables["$loopTotal"] = total
		ctx.Variables["$loopFirst"] = (index == 0)
		ctx.Variables["$loopLast"] = (index == total-1)
	}
}

// cleanupLoopVariables removes loop-related variables from context
func (e *TestStepExecutor) cleanupLoopVariables(ctx *TestStepExecutionContext, loop *models.LoopConfig) {
	if loop.ItemVar != "" {
		delete(ctx.Variables, loop.ItemVar)
	}
	if loop.IndexVar != "" {
		delete(ctx.Variables, loop.IndexVar)
	}

	delete(ctx.Variables, "$loopIndex")
	delete(ctx.Variables, "$loopCount")
	delete(ctx.Variables, "$loopTotal")
	delete(ctx.Variables, "$loopFirst")
	delete(ctx.Variables, "$loopLast")
	delete(ctx.Variables, "$loopItem")
}

// createIterationContext creates an isolated context for parallel loop iteration
func (e *TestStepExecutor) createIterationContext(parentCtx *TestStepExecutionContext, step *models.TestStep, index int, item interface{}, total int) *TestStepExecutionContext {
	iterCtx := &TestStepExecutionContext{
		RunID:       parentCtx.RunID,
		Variables:   copyMap(parentCtx.Variables),
		StepOutputs: parentCtx.StepOutputs, // Shared
		Logger:      parentCtx.Logger,
		VarTracker:  parentCtx.VarTracker,
		Ctx:         parentCtx.Ctx,
	}

	// Set loop variables
	e.setLoopVariables(iterCtx, step.Loop, index, item, total)

	// Create new evaluator with updated variables
	iterCtx.Evaluator = expression.NewEvaluator(iterCtx.Variables, iterCtx.StepOutputs)

	return iterCtx
}

// extractAssertionResults extracts assertion results from action output
func (e *TestStepExecutor) extractAssertionResults(output map[string]interface{}) []models.AssertionResult {
	results := make([]models.AssertionResult, 0)

	if assertResults, ok := output["results"].([]interface{}); ok {
		for _, r := range assertResults {
			if resultMap, ok := r.(map[string]interface{}); ok {
				result := models.AssertionResult{
					Type:   fmt.Sprintf("%v", resultMap["type"]),
					Target: fmt.Sprintf("%v", resultMap["target"]),
					Passed: resultMap["passed"] == true,
				}
				if expected, ok := resultMap["expected"]; ok {
					result.Expected = expected
				}
				if actual, ok := resultMap["actual"]; ok {
					result.Actual = actual
				}
				if message, ok := resultMap["message"].(string); ok {
					result.Message = message
				}
				results = append(results, result)
			}
		}
	}

	return results
}

// broadcastLoopEvent broadcasts a loop-related event via WebSocket
func (e *TestStepExecutor) broadcastLoopEvent(runID, eventType, stepID, stepName string, payload map[string]interface{}) {
	if e.hub == nil {
		return
	}

	payload["stepId"] = stepID
	payload["stepName"] = stepName

	e.hub.Broadcast(runID, eventType, payload)
}

// broadcastBranchEvent broadcasts a branch-related event via WebSocket
func (e *TestStepExecutor) broadcastBranchEvent(runID, eventType, stepID, stepName string, payload map[string]interface{}) {
	if e.hub == nil {
		return
	}

	payload["stepId"] = stepID
	payload["stepName"] = stepName

	e.hub.Broadcast(runID, eventType, payload)
}

// StoreStepExecution saves step execution to database
func (e *TestStepExecutor) StoreStepExecution(runID string, execution *models.StepExecution) error {
	if e.db == nil {
		return nil
	}

	// Convert StepExecution to WorkflowStepExecution for database storage
	stepExec := &models.WorkflowStepExecution{
		RunID:     runID,
		StepID:    execution.StepID,
		StepName:  execution.StepName,
		Status:    execution.Status,
		StartTime: execution.StartTime,
		EndTime:   time.Now(),
		Duration:  int(execution.Duration),
		Error:     execution.Error,
	}

	// Store input/output data as JSONB
	if execution.Inputs != nil {
		stepExec.InputData = models.JSONB(execution.Inputs)
	}
	if execution.Outputs != nil {
		stepExec.OutputData = models.JSONB(execution.Outputs)
	}

	return e.db.Create(stepExec).Error
}
