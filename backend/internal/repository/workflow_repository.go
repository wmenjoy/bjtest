package repository

import (
	"context"
	"fmt"
	"test-management-service/internal/models"
	"gorm.io/gorm"
)

// WorkflowRepository defines the interface for workflow data access
type WorkflowRepository interface {
	GetWorkflow(workflowID string) (*models.Workflow, error)
	GetWorkflowWithTenant(ctx context.Context, workflowID, tenantID, projectID string) (*models.Workflow, error)
	ListWorkflows(isTestCase *bool) ([]models.Workflow, error)
	ListWorkflowsWithTenant(ctx context.Context, tenantID, projectID string, isTestCase *bool, offset, limit int) ([]models.Workflow, int64, error)
	CreateWorkflow(workflow *models.Workflow) error
	CreateWorkflowWithTenant(ctx context.Context, workflow *models.Workflow) error
	UpdateWorkflow(workflow *models.Workflow) error
	UpdateWorkflowWithTenant(ctx context.Context, workflow *models.Workflow) error
	DeleteWorkflow(workflowID string) error
	DeleteWorkflowWithTenant(ctx context.Context, workflowID, tenantID, projectID string) error
}

// workflowRepository handles workflow data access
type workflowRepository struct {
	db *gorm.DB
}

// NewWorkflowRepository creates a new repository
func NewWorkflowRepository(db *gorm.DB) WorkflowRepository {
	return &workflowRepository{db: db}
}

// GetWorkflow retrieves a workflow by workflowID (legacy method without tenant isolation)
func (r *workflowRepository) GetWorkflow(workflowID string) (*models.Workflow, error) {
	var workflow models.Workflow

	result := r.db.Where("workflow_id = ? AND deleted_at IS NULL", workflowID).First(&workflow)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("workflow not found: %s", workflowID)
		}
		return nil, fmt.Errorf("failed to query workflow: %w", result.Error)
	}

	return &workflow, nil
}

// GetWorkflowWithTenant retrieves a workflow with tenant isolation
func (r *workflowRepository) GetWorkflowWithTenant(ctx context.Context, workflowID, tenantID, projectID string) (*models.Workflow, error) {
	var workflow models.Workflow

	result := r.db.WithContext(ctx).
		Where("workflow_id = ? AND tenant_id = ? AND project_id = ? AND deleted_at IS NULL",
			workflowID, tenantID, projectID).
		First(&workflow)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("workflow not found: %s", workflowID)
		}
		return nil, fmt.Errorf("failed to query workflow: %w", result.Error)
	}

	return &workflow, nil
}

// ListWorkflows retrieves all workflows with optional filters
func (r *workflowRepository) ListWorkflows(isTestCase *bool) ([]models.Workflow, error) {
	var workflows []models.Workflow

	query := r.db.Where("deleted_at IS NULL")
	if isTestCase != nil {
		query = query.Where("is_test_case = ?", *isTestCase)
	}

	result := query.Find(&workflows)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to list workflows: %w", result.Error)
	}

	return workflows, nil
}

// ListWorkflowsWithTenant retrieves workflows with tenant isolation and pagination
func (r *workflowRepository) ListWorkflowsWithTenant(ctx context.Context, tenantID, projectID string, isTestCase *bool, offset, limit int) ([]models.Workflow, int64, error) {
	var workflows []models.Workflow
	var total int64

	// Build query with tenant filter
	query := r.db.WithContext(ctx).Model(&models.Workflow{}).
		Where("tenant_id = ? AND project_id = ? AND deleted_at IS NULL", tenantID, projectID)

	if isTestCase != nil {
		query = query.Where("is_test_case = ?", *isTestCase)
	}

	// Count total
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count workflows: %w", err)
	}

	// Query with pagination
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&workflows).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list workflows: %w", err)
	}

	return workflows, total, nil
}

// CreateWorkflow creates a new workflow
func (r *workflowRepository) CreateWorkflow(workflow *models.Workflow) error {
	result := r.db.Create(workflow)
	if result.Error != nil {
		return fmt.Errorf("failed to create workflow: %w", result.Error)
	}
	return nil
}

// CreateWorkflowWithTenant creates a new workflow with tenant validation
func (r *workflowRepository) CreateWorkflowWithTenant(ctx context.Context, workflow *models.Workflow) error {
	// Validate tenant and project are set
	if workflow.TenantID == "" {
		return fmt.Errorf("tenant_id is required")
	}
	if workflow.ProjectID == "" {
		return fmt.Errorf("project_id is required")
	}

	result := r.db.WithContext(ctx).Create(workflow)
	if result.Error != nil {
		return fmt.Errorf("failed to create workflow: %w", result.Error)
	}
	return nil
}

// UpdateWorkflow updates an existing workflow
func (r *workflowRepository) UpdateWorkflow(workflow *models.Workflow) error {
	result := r.db.Save(workflow)
	if result.Error != nil {
		return fmt.Errorf("failed to update workflow: %w", result.Error)
	}
	return nil
}

// UpdateWorkflowWithTenant updates a workflow with tenant isolation
func (r *workflowRepository) UpdateWorkflowWithTenant(ctx context.Context, workflow *models.Workflow) error {
	// Validate tenant and project match
	if workflow.TenantID == "" || workflow.ProjectID == "" {
		return fmt.Errorf("tenant_id and project_id are required")
	}

	// Update only if tenant and project match
	result := r.db.WithContext(ctx).
		Where("workflow_id = ? AND tenant_id = ? AND project_id = ?",
			workflow.WorkflowID, workflow.TenantID, workflow.ProjectID).
		Updates(workflow)

	if result.Error != nil {
		return fmt.Errorf("failed to update workflow: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("workflow not found or access denied")
	}

	return nil
}

// DeleteWorkflow soft deletes a workflow
func (r *workflowRepository) DeleteWorkflow(workflowID string) error {
	result := r.db.Where("workflow_id = ?", workflowID).Delete(&models.Workflow{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete workflow: %w", result.Error)
	}
	return nil
}

// DeleteWorkflowWithTenant soft deletes a workflow with tenant isolation
func (r *workflowRepository) DeleteWorkflowWithTenant(ctx context.Context, workflowID, tenantID, projectID string) error {
	result := r.db.WithContext(ctx).
		Where("workflow_id = ? AND tenant_id = ? AND project_id = ?",
			workflowID, tenantID, projectID).
		Delete(&models.Workflow{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete workflow: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("workflow not found or access denied")
	}

	return nil
}

