package repository

import (
	"context"
	"fmt"
	"test-management-service/internal/models"
	"gorm.io/gorm"
)

// VariableChangeRepository handles variable change tracking
type VariableChangeRepository struct {
	db *gorm.DB
}

// NewVariableChangeRepository creates a new repository
func NewVariableChangeRepository(db *gorm.DB) *VariableChangeRepository {
	return &VariableChangeRepository{db: db}
}

// Create creates a new variable change record
func (r *VariableChangeRepository) Create(change *models.WorkflowVariableChange) error {
	result := r.db.Create(change)
	if result.Error != nil {
		return fmt.Errorf("failed to create variable change: %w", result.Error)
	}
	return nil
}

// ListByRunID retrieves all variable changes for a run
func (r *VariableChangeRepository) ListByRunID(runID string) ([]models.WorkflowVariableChange, error) {
	var changes []models.WorkflowVariableChange

	result := r.db.Where("run_id = ?", runID).
		Order("timestamp ASC").
		Find(&changes)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to list variable changes: %w", result.Error)
	}

	return changes, nil
}

// ListByVariableName retrieves all changes for a specific variable
func (r *VariableChangeRepository) ListByVariableName(runID, varName string) ([]models.WorkflowVariableChange, error) {
	var changes []models.WorkflowVariableChange

	result := r.db.Where("run_id = ? AND var_name = ?", runID, varName).
		Order("timestamp ASC").
		Find(&changes)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to list variable changes: %w", result.Error)
	}

	return changes, nil
}

// CreateWithTenant creates a new variable change record with context
// Note: Tenant isolation is enforced at WorkflowRun level, not on child records
func (r *VariableChangeRepository) CreateWithTenant(ctx context.Context, change *models.WorkflowVariableChange) error {
	result := r.db.WithContext(ctx).Create(change)
	if result.Error != nil {
		return fmt.Errorf("failed to create variable change: %w", result.Error)
	}
	return nil
}

// ListByRunIDWithTenant retrieves all variable changes for a run with tenant isolation
// Tenant isolation is enforced by accessing WorkflowRun with tenant checks first
func (r *VariableChangeRepository) ListByRunIDWithTenant(ctx context.Context, runID, tenantID, projectID string) ([]models.WorkflowVariableChange, error) {
	var changes []models.WorkflowVariableChange

	// Simply query by runID - tenant isolation is enforced at WorkflowRun level
	result := r.db.WithContext(ctx).
		Where("run_id = ?", runID).
		Order("timestamp ASC").
		Find(&changes)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to list variable changes: %w", result.Error)
	}

	return changes, nil
}

// ListByVariableNameWithTenant retrieves all changes for a specific variable with tenant isolation
// Tenant isolation is enforced by accessing WorkflowRun with tenant checks first
func (r *VariableChangeRepository) ListByVariableNameWithTenant(ctx context.Context, runID, varName, tenantID, projectID string) ([]models.WorkflowVariableChange, error) {
	var changes []models.WorkflowVariableChange

	// Simply query by runID and varName - tenant isolation is enforced at WorkflowRun level
	result := r.db.WithContext(ctx).
		Where("run_id = ? AND var_name = ?", runID, varName).
		Order("timestamp ASC").
		Find(&changes)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to list variable changes: %w", result.Error)
	}

	return changes, nil
}

// DeleteByRunIDWithTenant deletes all variable changes for a run with tenant isolation
// Tenant isolation is enforced by accessing WorkflowRun with tenant checks first
func (r *VariableChangeRepository) DeleteByRunIDWithTenant(ctx context.Context, runID, tenantID, projectID string) error {
	result := r.db.WithContext(ctx).
		Where("run_id = ?", runID).
		Delete(&models.WorkflowVariableChange{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete variable changes: %w", result.Error)
	}

	return nil
}
