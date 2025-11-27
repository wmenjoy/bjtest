package service

import (
	"context"
	"fmt"
	"time"

	"test-management-service/internal/models"
	"test-management-service/internal/repository"
	"test-management-service/internal/workflow"
)

// WorkflowService handles workflow operations
type WorkflowService interface {
	CreateWorkflow(ctx context.Context, tenantID, projectID string, req *CreateWorkflowRequest) (*models.Workflow, error)
	UpdateWorkflow(ctx context.Context, workflowID, tenantID, projectID string, req *UpdateWorkflowRequest) (*models.Workflow, error)
	DeleteWorkflow(ctx context.Context, workflowID, tenantID, projectID string) error
	GetWorkflow(ctx context.Context, workflowID, tenantID, projectID string) (*models.Workflow, error)
	ListWorkflows(ctx context.Context, tenantID, projectID string, isTestCase *bool, limit, offset int) ([]models.Workflow, int64, error)

	ExecuteWorkflow(ctx context.Context, workflowID, tenantID, projectID string, variables map[string]interface{}) (*models.WorkflowRun, error)
	GetWorkflowRun(ctx context.Context, runID, tenantID, projectID string) (*models.WorkflowRun, error)
	ListWorkflowRuns(ctx context.Context, workflowID, tenantID, projectID string, limit, offset int) ([]models.WorkflowRun, int64, error)

	GetWorkflowTestCases(ctx context.Context, workflowID, tenantID, projectID string) ([]models.TestCase, error)
	GetStepExecutions(ctx context.Context, runID, tenantID, projectID string) ([]models.WorkflowStepExecution, error)
	GetStepLogs(ctx context.Context, runID, tenantID, projectID string, stepID *string, level *string) ([]models.WorkflowStepLog, error)
}

type workflowService struct {
	workflowRepo    repository.WorkflowRepository
	workflowRunRepo *repository.WorkflowRunRepository
	stepExecRepo    repository.StepExecutionRepository
	stepLogRepo     repository.StepLogRepository
	testCaseRepo    *repository.WorkflowTestCaseRepository
	executor        *workflow.WorkflowExecutorImpl
}

// NewWorkflowService creates a new workflow service
func NewWorkflowService(
	workflowRepo repository.WorkflowRepository,
	workflowRunRepo *repository.WorkflowRunRepository,
	stepExecRepo repository.StepExecutionRepository,
	stepLogRepo repository.StepLogRepository,
	testCaseRepo *repository.WorkflowTestCaseRepository,
	executor *workflow.WorkflowExecutorImpl,
) WorkflowService {
	return &workflowService{
		workflowRepo:    workflowRepo,
		workflowRunRepo: workflowRunRepo,
		stepExecRepo:    stepExecRepo,
		stepLogRepo:     stepLogRepo,
		testCaseRepo:    testCaseRepo,
		executor:        executor,
	}
}

// ===== DTOs =====

type CreateWorkflowRequest struct {
	WorkflowID  string                 `json:"workflowId" binding:"required"`
	Name        string                 `json:"name" binding:"required"`
	Version     string                 `json:"version"`
	Description string                 `json:"description"`
	Definition  map[string]interface{} `json:"definition" binding:"required"`
	IsTestCase  bool                   `json:"isTestCase"`
	CreatedBy   string                 `json:"createdBy"`
}

type UpdateWorkflowRequest struct {
	Name        string                 `json:"name"`
	Version     string                 `json:"version"`
	Description string                 `json:"description"`
	Definition  map[string]interface{} `json:"definition"`
	IsTestCase  *bool                  `json:"isTestCase"`
}

type ExecuteWorkflowRequest struct {
	Variables map[string]interface{} `json:"variables"`
}

// ===== Implementation =====

func (s *workflowService) CreateWorkflow(ctx context.Context, tenantID, projectID string, req *CreateWorkflowRequest) (*models.Workflow, error) {
	wf := &models.Workflow{
		WorkflowID:  req.WorkflowID,
		TenantID:    tenantID,
		ProjectID:   projectID,
		Name:        req.Name,
		Version:     req.Version,
		Description: req.Description,
		Definition:  models.JSONB(req.Definition),
		IsTestCase:  req.IsTestCase,
		CreatedBy:   req.CreatedBy,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	if err := s.workflowRepo.CreateWorkflowWithTenant(ctx, wf); err != nil {
		return nil, fmt.Errorf("failed to create workflow: %w", err)
	}

	return wf, nil
}

func (s *workflowService) UpdateWorkflow(ctx context.Context, workflowID, tenantID, projectID string, req *UpdateWorkflowRequest) (*models.Workflow, error) {
	wf, err := s.workflowRepo.GetWorkflowWithTenant(ctx, workflowID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("workflow not found: %w", err)
	}

	if req.Name != "" {
		wf.Name = req.Name
	}
	if req.Version != "" {
		wf.Version = req.Version
	}
	if req.Description != "" {
		wf.Description = req.Description
	}
	if req.Definition != nil {
		wf.Definition = models.JSONB(req.Definition)
	}
	if req.IsTestCase != nil {
		wf.IsTestCase = *req.IsTestCase
	}

	wf.UpdatedAt = time.Now()

	if err := s.workflowRepo.UpdateWorkflowWithTenant(ctx, wf); err != nil {
		return nil, fmt.Errorf("failed to update workflow: %w", err)
	}

	return wf, nil
}

func (s *workflowService) DeleteWorkflow(ctx context.Context, workflowID, tenantID, projectID string) error {
	return s.workflowRepo.DeleteWorkflowWithTenant(ctx, workflowID, tenantID, projectID)
}

func (s *workflowService) GetWorkflow(ctx context.Context, workflowID, tenantID, projectID string) (*models.Workflow, error) {
	return s.workflowRepo.GetWorkflowWithTenant(ctx, workflowID, tenantID, projectID)
}

func (s *workflowService) ListWorkflows(ctx context.Context, tenantID, projectID string, isTestCase *bool, limit, offset int) ([]models.Workflow, int64, error) {
	return s.workflowRepo.ListWorkflowsWithTenant(ctx, tenantID, projectID, isTestCase, offset, limit)
}

func (s *workflowService) ExecuteWorkflow(ctx context.Context, workflowID, tenantID, projectID string, variables map[string]interface{}) (*models.WorkflowRun, error) {
	// Get workflow definition from database with tenant isolation
	wf, err := s.workflowRepo.GetWorkflowWithTenant(ctx, workflowID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("workflow not found: %w", err)
	}

	// Execute workflow via executor (executor handles run creation internally)
	result, err := s.executor.Execute(workflowID, wf.Definition, &workflow.ExecutionParams{
		TenantID:  tenantID,
		ProjectID: projectID,
	})
	if err != nil {
		return nil, fmt.Errorf("workflow execution failed: %w", err)
	}

	// Update run with tenant info
	run, err := s.workflowRunRepo.GetByRunID(result.RunID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve run record: %w", err)
	}

	// Set tenant info on the run if not set by executor
	if run.TenantID == "" {
		run.TenantID = tenantID
		run.ProjectID = projectID
		if err := s.workflowRunRepo.Update(run); err != nil {
			return nil, fmt.Errorf("failed to update run with tenant info: %w", err)
		}
	}

	return run, nil
}

func (s *workflowService) GetWorkflowRun(ctx context.Context, runID, tenantID, projectID string) (*models.WorkflowRun, error) {
	return s.workflowRunRepo.GetByRunIDWithTenant(ctx, runID, tenantID, projectID)
}

func (s *workflowService) ListWorkflowRuns(ctx context.Context, workflowID, tenantID, projectID string, limit, offset int) ([]models.WorkflowRun, int64, error) {
	runs, err := s.workflowRunRepo.ListByWorkflowIDWithTenant(ctx, workflowID, tenantID, projectID, 0)
	if err != nil {
		return nil, 0, err
	}

	total := int64(len(runs))
	start := offset
	end := offset + limit
	if start > len(runs) {
		start = len(runs)
	}
	if end > len(runs) {
		end = len(runs)
	}

	return runs[start:end], total, nil
}

func (s *workflowService) GetWorkflowTestCases(ctx context.Context, workflowID, tenantID, projectID string) ([]models.TestCase, error) {
	// First verify the workflow exists and belongs to this tenant
	_, err := s.workflowRepo.GetWorkflowWithTenant(ctx, workflowID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("workflow not found: %w", err)
	}

	// Get test cases that reference this workflow
	return s.testCaseRepo.GetTestCasesByWorkflowID(workflowID)
}

func (s *workflowService) GetStepExecutions(ctx context.Context, runID, tenantID, projectID string) ([]models.WorkflowStepExecution, error) {
	// Verify run exists and belongs to tenant
	_, err := s.workflowRunRepo.GetByRunIDWithTenant(ctx, runID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("workflow run not found: %w", err)
	}

	return s.stepExecRepo.ListByRunID(runID)
}

func (s *workflowService) GetStepLogs(ctx context.Context, runID, tenantID, projectID string, stepID *string, level *string) ([]models.WorkflowStepLog, error) {
	// Verify run exists and belongs to tenant
	_, err := s.workflowRunRepo.GetByRunIDWithTenant(ctx, runID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("workflow run not found: %w", err)
	}

	if stepID != nil {
		return s.stepLogRepo.ListByStepID(runID, *stepID)
	}
	return s.stepLogRepo.ListByRunID(runID, level)
}
