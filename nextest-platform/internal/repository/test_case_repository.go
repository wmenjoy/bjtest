package repository

import (
	"context"
	"fmt"
	"test-management-service/internal/models"
	"gorm.io/gorm"
)

// WorkflowTestCaseRepository handles test case data access for workflow execution
type WorkflowTestCaseRepository struct {
	db *gorm.DB
}

// NewWorkflowTestCaseRepository creates a new repository
func NewWorkflowTestCaseRepository(db *gorm.DB) *WorkflowTestCaseRepository {
	return &WorkflowTestCaseRepository{db: db}
}

// GetTestCase retrieves a test case by testID (legacy method without tenant isolation)
func (r *WorkflowTestCaseRepository) GetTestCase(testID string) (*models.TestCase, error) {
	var testCase models.TestCase

	result := r.db.Where("test_id = ? AND deleted_at IS NULL", testID).First(&testCase)
	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("test case not found: %s", testID)
		}
		return nil, fmt.Errorf("failed to query test case: %w", result.Error)
	}

	return &testCase, nil
}

// GetTestCaseWithTenant retrieves a test case with tenant isolation
func (r *WorkflowTestCaseRepository) GetTestCaseWithTenant(ctx context.Context, testID, tenantID, projectID string) (*models.TestCase, error) {
	var testCase models.TestCase

	result := r.db.WithContext(ctx).
		Where("test_id = ? AND tenant_id = ? AND project_id = ? AND deleted_at IS NULL",
			testID, tenantID, projectID).
		First(&testCase)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("test case not found: %s", testID)
		}
		return nil, fmt.Errorf("failed to query test case: %w", result.Error)
	}

	return &testCase, nil
}

// GetTestCasesByWorkflowID retrieves all test cases referencing a workflow
func (r *WorkflowTestCaseRepository) GetTestCasesByWorkflowID(workflowID string) ([]models.TestCase, error) {
	var testCases []models.TestCase

	result := r.db.Where("workflow_id = ? AND deleted_at IS NULL", workflowID).Find(&testCases)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to query test cases: %w", result.Error)
	}

	return testCases, nil
}

// GetTestCasesByWorkflowIDWithTenant retrieves all test cases referencing a workflow with tenant isolation
func (r *WorkflowTestCaseRepository) GetTestCasesByWorkflowIDWithTenant(ctx context.Context, workflowID, tenantID, projectID string) ([]models.TestCase, error) {
	var testCases []models.TestCase

	result := r.db.WithContext(ctx).
		Where("workflow_id = ? AND tenant_id = ? AND project_id = ? AND deleted_at IS NULL",
			workflowID, tenantID, projectID).
		Find(&testCases)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to query test cases: %w", result.Error)
	}

	return testCases, nil
}

// ListTestCasesWithTenant retrieves test cases with tenant isolation and pagination
func (r *WorkflowTestCaseRepository) ListTestCasesWithTenant(ctx context.Context, tenantID, projectID string, offset, limit int) ([]models.TestCase, int64, error) {
	var testCases []models.TestCase
	var total int64

	// Count total with tenant filter
	countQuery := r.db.WithContext(ctx).Model(&models.TestCase{}).
		Where("tenant_id = ? AND project_id = ? AND deleted_at IS NULL", tenantID, projectID)

	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count test cases: %w", err)
	}

	// Query with pagination and tenant filter
	query := r.db.WithContext(ctx).
		Where("tenant_id = ? AND project_id = ? AND deleted_at IS NULL", tenantID, projectID).
		Offset(offset).
		Limit(limit).
		Order("created_at DESC")

	if err := query.Find(&testCases).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list test cases: %w", err)
	}

	return testCases, total, nil
}

// CreateTestCase creates a new test case
func (r *WorkflowTestCaseRepository) CreateTestCase(testCase *models.TestCase) error {
	result := r.db.Create(testCase)
	if result.Error != nil {
		return fmt.Errorf("failed to create test case: %w", result.Error)
	}
	return nil
}

// CreateTestCaseWithTenant creates a new test case with tenant validation
func (r *WorkflowTestCaseRepository) CreateTestCaseWithTenant(ctx context.Context, testCase *models.TestCase) error {
	// Validate tenant and project are set
	if testCase.TenantID == "" {
		return fmt.Errorf("tenant_id is required")
	}
	if testCase.ProjectID == "" {
		return fmt.Errorf("project_id is required")
	}

	result := r.db.WithContext(ctx).Create(testCase)
	if result.Error != nil {
		return fmt.Errorf("failed to create test case: %w", result.Error)
	}
	return nil
}

// UpdateTestCase updates an existing test case
func (r *WorkflowTestCaseRepository) UpdateTestCase(testCase *models.TestCase) error {
	result := r.db.Save(testCase)
	if result.Error != nil {
		return fmt.Errorf("failed to update test case: %w", result.Error)
	}
	return nil
}

// UpdateTestCaseWithTenant updates an existing test case with tenant isolation
func (r *WorkflowTestCaseRepository) UpdateTestCaseWithTenant(ctx context.Context, testCase *models.TestCase) error {
	// Validate tenant and project match
	if testCase.TenantID == "" || testCase.ProjectID == "" {
		return fmt.Errorf("tenant_id and project_id are required")
	}

	// Update only if tenant and project match
	result := r.db.WithContext(ctx).
		Where("test_id = ? AND tenant_id = ? AND project_id = ?",
			testCase.TestID, testCase.TenantID, testCase.ProjectID).
		Updates(testCase)

	if result.Error != nil {
		return fmt.Errorf("failed to update test case: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("test case not found or access denied")
	}

	return nil
}

// DeleteTestCaseWithTenant soft deletes a test case with tenant isolation
func (r *WorkflowTestCaseRepository) DeleteTestCaseWithTenant(ctx context.Context, testID, tenantID, projectID string) error {
	result := r.db.WithContext(ctx).
		Where("test_id = ? AND tenant_id = ? AND project_id = ?",
			testID, tenantID, projectID).
		Delete(&models.TestCase{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete test case: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("test case not found or access denied")
	}

	return nil
}
