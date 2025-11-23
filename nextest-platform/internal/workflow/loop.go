package workflow

import (
	"fmt"
	"sync"

	"test-management-service/internal/expression"
)

// executeWithLoop wraps step execution with loop logic
func (e *WorkflowExecutorImpl) executeWithLoop(ctx *ExecutionContext, step *WorkflowStep) error {
	// 检查是否需要循环
	if step.LoopOver == "" && step.LoopCondition == "" {
		// 无循环，直接执行
		return e.executeStep(ctx, step)
	}

	// ForEach循环
	if step.LoopOver != "" {
		if step.Parallel {
			return e.executeForEachParallel(ctx, step)
		}
		return e.executeForEach(ctx, step)
	}

	// While循环
	if step.LoopCondition != "" {
		return e.executeWhileLoop(ctx, step)
	}

	return nil
}

// executeForEach executes a step for each item in a collection (sequential)
func (e *WorkflowExecutorImpl) executeForEach(ctx *ExecutionContext, step *WorkflowStep) error {
	ctx.Logger.Info(step.ID, fmt.Sprintf("Starting forEach loop over: %s", step.LoopOver))

	// 获取表达式求值器
	evaluator := expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)

	// 求值循环集合
	collection, err := evaluator.EvaluateToArray(step.LoopOver)
	if err != nil {
		return fmt.Errorf("failed to evaluate loop collection: %w", err)
	}

	ctx.Logger.Info(step.ID, fmt.Sprintf("Loop collection size: %d items", len(collection)))

	// 遍历集合
	for index, item := range collection {
		ctx.Logger.Info(step.ID, fmt.Sprintf("Loop iteration %d/%d", index+1, len(collection)))

		// 设置循环变量
		if step.LoopVar != "" {
			ctx.Variables[step.LoopVar] = item
		}
		ctx.Variables["$loopIndex"] = index
		ctx.Variables["$loopCount"] = index + 1
		ctx.Variables["$loopTotal"] = len(collection)
		ctx.Variables["$loopFirst"] = (index == 0)
		ctx.Variables["$loopLast"] = (index == len(collection)-1)
		ctx.Variables["$loopItem"] = item

		// 更新求值器
		ctx.Evaluator = expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)

		// 执行步骤
		if err := e.executeStep(ctx, step); err != nil {
			if step.OnError == "continue" {
				ctx.Logger.Warn(step.ID, fmt.Sprintf("Loop iteration %d failed but continuing: %v", index, err))
				continue
			}
			return fmt.Errorf("loop iteration %d failed: %w", index, err)
		}
	}

	// 清理循环变量
	if step.LoopVar != "" {
		delete(ctx.Variables, step.LoopVar)
	}
	delete(ctx.Variables, "$loopIndex")
	delete(ctx.Variables, "$loopCount")
	delete(ctx.Variables, "$loopTotal")
	delete(ctx.Variables, "$loopFirst")
	delete(ctx.Variables, "$loopLast")
	delete(ctx.Variables, "$loopItem")

	ctx.Logger.Info(step.ID, "ForEach loop completed successfully")
	return nil
}

// executeForEachParallel executes a step for each item in parallel
func (e *WorkflowExecutorImpl) executeForEachParallel(ctx *ExecutionContext, step *WorkflowStep) error {
	ctx.Logger.Info(step.ID, fmt.Sprintf("Starting parallel forEach loop over: %s", step.LoopOver))

	// 获取表达式求值器
	evaluator := expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)

	// 求值循环集合
	collection, err := evaluator.EvaluateToArray(step.LoopOver)
	if err != nil {
		return fmt.Errorf("failed to evaluate loop collection: %w", err)
	}

	ctx.Logger.Info(step.ID, fmt.Sprintf("Parallel loop collection size: %d items", len(collection)))

	// 确定并发数
	maxConcurrency := step.MaxConcurrency
	if maxConcurrency <= 0 {
		maxConcurrency = 10 // 默认最大10个并发
	}

	// 创建信号量控制并发数
	semaphore := make(chan struct{}, maxConcurrency)
	var wg sync.WaitGroup
	errorsChan := make(chan error, len(collection))

	// 并行执行
	for index, item := range collection {
		wg.Add(1)
		semaphore <- struct{}{} // 获取信号量

		go func(idx int, itm interface{}) {
			defer wg.Done()
			defer func() { <-semaphore }() // 释放信号量

			// 创建独立的执行上下文副本
			loopCtx := &ExecutionContext{
				RunID:       ctx.RunID,
				Variables:   copyMap(ctx.Variables),
				StepOutputs: ctx.StepOutputs, // 共享outputs
				StepResults: ctx.StepResults, // 共享results
				Logger:      ctx.Logger,
				VarTracker:  ctx.VarTracker,
			}

			// 设置循环变量
			if step.LoopVar != "" {
				loopCtx.Variables[step.LoopVar] = itm
			}
			loopCtx.Variables["$loopIndex"] = idx
			loopCtx.Variables["$loopCount"] = idx + 1
			loopCtx.Variables["$loopTotal"] = len(collection)
			loopCtx.Variables["$loopFirst"] = (idx == 0)
			loopCtx.Variables["$loopLast"] = (idx == len(collection)-1)
			loopCtx.Variables["$loopItem"] = itm

			// 初始化求值器
			loopCtx.Evaluator = expression.NewEvaluator(loopCtx.Variables, loopCtx.StepOutputs)

			// 执行步骤
			if err := e.executeStep(loopCtx, step); err != nil {
				if step.OnError != "continue" {
					errorsChan <- fmt.Errorf("parallel loop iteration %d failed: %w", idx, err)
				} else {
					ctx.Logger.Warn(step.ID, fmt.Sprintf("Parallel loop iteration %d failed but continuing: %v", idx, err))
				}
			}
		}(index, item)
	}

	wg.Wait()
	close(errorsChan)

	// 检查错误
	for err := range errorsChan {
		if err != nil {
			return err
		}
	}

	ctx.Logger.Info(step.ID, "Parallel forEach loop completed successfully")
	return nil
}

// executeWhileLoop executes a step while a condition is true
func (e *WorkflowExecutorImpl) executeWhileLoop(ctx *ExecutionContext, step *WorkflowStep) error {
	ctx.Logger.Info(step.ID, fmt.Sprintf("Starting while loop with condition: %s", step.LoopCondition))

	maxIterations := step.MaxIterations
	if maxIterations <= 0 {
		maxIterations = 100 // 默认最大100次迭代（安全限制）
	}

	iteration := 0
	for iteration < maxIterations {
		// 更新求值器
		evaluator := expression.NewEvaluator(ctx.Variables, ctx.StepOutputs)
		ctx.Evaluator = evaluator

		// 检查循环条件
		shouldContinue, err := evaluator.EvaluateBool(step.LoopCondition)
		if err != nil {
			return fmt.Errorf("failed to evaluate loop condition: %w", err)
		}

		if !shouldContinue {
			ctx.Logger.Info(step.ID, fmt.Sprintf("While loop condition became false after %d iterations", iteration))
			break
		}

		ctx.Logger.Info(step.ID, fmt.Sprintf("While loop iteration %d", iteration+1))

		// 设置循环变量
		ctx.Variables["$loopIndex"] = iteration
		ctx.Variables["$loopCount"] = iteration + 1

		// 执行步骤
		if err := e.executeStep(ctx, step); err != nil {
			if step.OnError == "continue" {
				ctx.Logger.Warn(step.ID, fmt.Sprintf("While loop iteration %d failed but continuing: %v", iteration, err))
			} else {
				return fmt.Errorf("while loop iteration %d failed: %w", iteration, err)
			}
		}

		iteration++
	}

	if iteration >= maxIterations {
		ctx.Logger.Warn(step.ID, fmt.Sprintf("While loop reached max iterations limit: %d", maxIterations))
	}

	// 清理循环变量
	delete(ctx.Variables, "$loopIndex")
	delete(ctx.Variables, "$loopCount")

	ctx.Logger.Info(step.ID, fmt.Sprintf("While loop completed after %d iterations", iteration))
	return nil
}

// copyMap creates a deep copy of a map
func copyMap(original map[string]interface{}) map[string]interface{} {
	copy := make(map[string]interface{})
	for key, value := range original {
		copy[key] = value
	}
	return copy
}
