package repository

import (
	"context"
	"fmt"
	"test-management-service/internal/models"
	"gorm.io/gorm"
)

// WorkflowRunRepository defines the interface for workflow run data access
type WorkflowRunRepository interface {
	Create(run *models.WorkflowRun) error
	Update(run *models.WorkflowRun) error
	GetByRunID(runID string) (*models.WorkflowRun, error)
	ListByWorkflowID(workflowID string, limit int) ([]models.WorkflowRun, error)
	CreateWithTenant(ctx context.Context, run *models.WorkflowRun) error
	UpdateWithTenant(ctx context.Context, run *models.WorkflowRun) error
	GetByRunIDWithTenant(ctx context.Context, runID, tenantID, projectID string) (*models.WorkflowRun, error)
	ListByWorkflowIDWithTenant(ctx context.Context, workflowID, tenantID, projectID string, limit int) ([]models.WorkflowRun, error)
	ListWithTenant(ctx context.Context, tenantID, projectID string, offset, limit int) ([]models.WorkflowRun, int64, error)
	DeleteWithTenant(ctx context.Context, runID, tenantID, projectID string) error
}

// workflowRunRepository handles workflow run data access
type workflowRunRepository struct {
	db *gorm.DB
}

// NewWorkflowRunRepository creates a new repository
func NewWorkflowRunRepository(db *gorm.DB) WorkflowRunRepository {
	return &workflowRunRepository{db: db}
}

// Create creates a new workflow run record
func (r *workflowRunRepository) Create(run *models.WorkflowRun) error {
	result := r.db.Create(run)
	if result.Error != nil {
		return fmt.Errorf("failed to create workflow run: %w", result.Error)
	}
	return nil
}

// Update updates a workflow run record
func (r *workflowRunRepository) Update(run *models.WorkflowRun) error {
	result := r.db.Save(run)
	if result.Error != nil {
		return fmt.Errorf("failed to update workflow run: %w", result.Error)
	}
	return nil
}

// GetByRunID retrieves a workflow run by runID
func (r *workflowRunRepository) GetByRunID(runID string) (*models.WorkflowRun, error) {
	var run models.WorkflowRun

	result := r.db.Where("run_id = ?", runID).First(&run)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("workflow run not found: %s", runID)
		}
		return nil, fmt.Errorf("failed to query workflow run: %w", result.Error)
	}

	return &run, nil
}

// ListByWorkflowID retrieves all runs for a workflow
func (r *workflowRunRepository) ListByWorkflowID(workflowID string, limit int) ([]models.WorkflowRun, error) {
	var runs []models.WorkflowRun

	query := r.db.Where("workflow_id = ?", workflowID).Order("start_time DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}

	result := query.Find(&runs)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to list workflow runs: %w", result.Error)
	}

	return runs, nil
}

// CreateWithTenant creates a new workflow run record with tenant validation
func (r *workflowRunRepository) CreateWithTenant(ctx context.Context, run *models.WorkflowRun) error {
	// Validate tenant and project are set
	if run.TenantID == "" {
		return fmt.Errorf("tenant_id is required")
	}
	if run.ProjectID == "" {
		return fmt.Errorf("project_id is required")
	}

	result := r.db.WithContext(ctx).Create(run)
	if result.Error != nil {
		return fmt.Errorf("failed to create workflow run: %w", result.Error)
	}
	return nil
}

// UpdateWithTenant updates a workflow run record with tenant isolation
func (r *workflowRunRepository) UpdateWithTenant(ctx context.Context, run *models.WorkflowRun) error {
	// Validate tenant and project match
	if run.TenantID == "" || run.ProjectID == "" {
		return fmt.Errorf("tenant_id and project_id are required")
	}

	// Update only if tenant and project match
	result := r.db.WithContext(ctx).
		Where("run_id = ? AND tenant_id = ? AND project_id = ?",
			run.RunID, run.TenantID, run.ProjectID).
		Updates(run)

	if result.Error != nil {
		return fmt.Errorf("failed to update workflow run: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("workflow run not found or access denied")
	}

	return nil
}

// GetByRunIDWithTenant retrieves a workflow run with tenant isolation
func (r *workflowRunRepository) GetByRunIDWithTenant(ctx context.Context, runID, tenantID, projectID string) (*models.WorkflowRun, error) {
	var run models.WorkflowRun

	result := r.db.WithContext(ctx).
		Where("run_id = ? AND tenant_id = ? AND project_id = ?",
			runID, tenantID, projectID).
		First(&run)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("workflow run not found: %s", runID)
		}
		return nil, fmt.Errorf("failed to query workflow run: %w", result.Error)
	}

	return &run, nil
}

// ListByWorkflowIDWithTenant retrieves all runs for a workflow with tenant isolation
func (r *workflowRunRepository) ListByWorkflowIDWithTenant(ctx context.Context, workflowID, tenantID, projectID string, limit int) ([]models.WorkflowRun, error) {
	var runs []models.WorkflowRun

	query := r.db.WithContext(ctx).
		Where("workflow_id = ? AND tenant_id = ? AND project_id = ?",
			workflowID, tenantID, projectID).
		Order("start_time DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	result := query.Find(&runs)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to list workflow runs: %w", result.Error)
	}

	return runs, nil
}

// ListWithTenant retrieves workflow runs with tenant isolation and pagination
func (r *workflowRunRepository) ListWithTenant(ctx context.Context, tenantID, projectID string, offset, limit int) ([]models.WorkflowRun, int64, error) {
	var runs []models.WorkflowRun
	var total int64

	// Count total with tenant filter
	countQuery := r.db.WithContext(ctx).Model(&models.WorkflowRun{}).
		Where("tenant_id = ? AND project_id = ?", tenantID, projectID)

	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count workflow runs: %w", err)
	}

	// Query with pagination and tenant filter
	query := r.db.WithContext(ctx).
		Where("tenant_id = ? AND project_id = ?", tenantID, projectID).
		Offset(offset).
		Limit(limit).
		Order("start_time DESC")

	if err := query.Find(&runs).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list workflow runs: %w", err)
	}

	return runs, total, nil
}

// DeleteWithTenant soft deletes a workflow run with tenant isolation
func (r *workflowRunRepository) DeleteWithTenant(ctx context.Context, runID, tenantID, projectID string) error {
	result := r.db.WithContext(ctx).
		Where("run_id = ? AND tenant_id = ? AND project_id = ?",
			runID, tenantID, projectID).
		Delete(&models.WorkflowRun{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete workflow run: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("workflow run not found or access denied")
	}

	return nil
}
