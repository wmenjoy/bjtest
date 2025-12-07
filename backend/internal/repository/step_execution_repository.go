package repository

import (
	"context"
	"fmt"
	"test-management-service/internal/models"
	"gorm.io/gorm"
)

// StepExecutionRepository defines the interface for step execution data access
type StepExecutionRepository interface {
	Create(stepExec *models.WorkflowStepExecution) error
	Update(stepExec *models.WorkflowStepExecution) error
	ListByRunID(runID string) ([]models.WorkflowStepExecution, error)
	GetByStepID(runID, stepID string) (*models.WorkflowStepExecution, error)
	CreateWithTenant(ctx context.Context, stepExec *models.WorkflowStepExecution) error
	UpdateWithTenant(ctx context.Context, stepExec *models.WorkflowStepExecution) error
	ListByRunIDWithTenant(ctx context.Context, runID, tenantID, projectID string) ([]models.WorkflowStepExecution, error)
	GetByStepIDWithTenant(ctx context.Context, runID, stepID, tenantID, projectID string) (*models.WorkflowStepExecution, error)
	DeleteByRunIDWithTenant(ctx context.Context, runID, tenantID, projectID string) error
}

// stepExecutionRepository handles step execution data access
type stepExecutionRepository struct {
	db *gorm.DB
}

// NewStepExecutionRepository creates a new repository
func NewStepExecutionRepository(db *gorm.DB) StepExecutionRepository {
	return &stepExecutionRepository{db: db}
}

// Create creates a new step execution record
func (r *stepExecutionRepository) Create(stepExec *models.WorkflowStepExecution) error {
	result := r.db.Create(stepExec)
	if result.Error != nil {
		return fmt.Errorf("failed to create step execution: %w", result.Error)
	}
	return nil
}

// Update updates a step execution record
func (r *stepExecutionRepository) Update(stepExec *models.WorkflowStepExecution) error {
	result := r.db.Save(stepExec)
	if result.Error != nil {
		return fmt.Errorf("failed to update step execution: %w", result.Error)
	}
	return nil
}

// ListByRunID retrieves all step executions for a run
func (r *stepExecutionRepository) ListByRunID(runID string) ([]models.WorkflowStepExecution, error) {
	var executions []models.WorkflowStepExecution

	result := r.db.Where("run_id = ?", runID).Order("start_time ASC").Find(&executions)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to list step executions: %w", result.Error)
	}

	return executions, nil
}

// GetByStepID retrieves a specific step execution
func (r *stepExecutionRepository) GetByStepID(runID, stepID string) (*models.WorkflowStepExecution, error) {
	var execution models.WorkflowStepExecution

	result := r.db.Where("run_id = ? AND step_id = ?", runID, stepID).First(&execution)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("step execution not found: %s/%s", runID, stepID)
		}
		return nil, fmt.Errorf("failed to query step execution: %w", result.Error)
	}

	return &execution, nil
}

// CreateWithTenant creates a new step execution record with context
// Note: Tenant isolation is enforced at WorkflowRun level, not on child records
func (r *stepExecutionRepository) CreateWithTenant(ctx context.Context, stepExec *models.WorkflowStepExecution) error {
	result := r.db.WithContext(ctx).Create(stepExec)
	if result.Error != nil {
		return fmt.Errorf("failed to create step execution: %w", result.Error)
	}
	return nil
}

// UpdateWithTenant updates a step execution record with context
func (r *stepExecutionRepository) UpdateWithTenant(ctx context.Context, stepExec *models.WorkflowStepExecution) error {
	// Update by run_id and step_id (tenant isolation enforced at WorkflowRun level)
	result := r.db.WithContext(ctx).
		Where("run_id = ? AND step_id = ?",
			stepExec.RunID, stepExec.StepID).
		Updates(stepExec)

	if result.Error != nil {
		return fmt.Errorf("failed to update step execution: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("step execution not found")
	}

	return nil
}

// ListByRunIDWithTenant retrieves all step executions for a run with tenant isolation
// Tenant isolation is enforced by accessing WorkflowRun with tenant checks first
func (r *stepExecutionRepository) ListByRunIDWithTenant(ctx context.Context, runID, tenantID, projectID string) ([]models.WorkflowStepExecution, error) {
	var executions []models.WorkflowStepExecution

	// Simply query by runID - tenant isolation is enforced at WorkflowRun level
	result := r.db.WithContext(ctx).
		Where("run_id = ?", runID).
		Order("start_time ASC").
		Find(&executions)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to list step executions: %w", result.Error)
	}

	return executions, nil
}

// GetByStepIDWithTenant retrieves a specific step execution with tenant isolation
// Tenant isolation is enforced by accessing WorkflowRun with tenant checks first
func (r *stepExecutionRepository) GetByStepIDWithTenant(ctx context.Context, runID, stepID, tenantID, projectID string) (*models.WorkflowStepExecution, error) {
	var execution models.WorkflowStepExecution

	// Simply query by runID and stepID - tenant isolation is enforced at WorkflowRun level
	result := r.db.WithContext(ctx).
		Where("run_id = ? AND step_id = ?", runID, stepID).
		First(&execution)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("step execution not found: %s/%s", runID, stepID)
		}
		return nil, fmt.Errorf("failed to query step execution: %w", result.Error)
	}

	return &execution, nil
}

// DeleteByRunIDWithTenant deletes all step executions for a run with tenant isolation
// Tenant isolation is enforced by accessing WorkflowRun with tenant checks first
func (r *stepExecutionRepository) DeleteByRunIDWithTenant(ctx context.Context, runID, tenantID, projectID string) error {
	result := r.db.WithContext(ctx).
		Where("run_id = ?", runID).
		Delete(&models.WorkflowStepExecution{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete step executions: %w", result.Error)
	}

	return nil
}
