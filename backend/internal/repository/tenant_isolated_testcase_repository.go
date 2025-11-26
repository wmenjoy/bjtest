package repository

import (
	"context"
	"fmt"
	"test-management-service/internal/models"

	"gorm.io/gorm"
)

// TenantIsolatedTestCaseRepository 示例：支持租户隔离的TestCase Repository
// 这是一个参考实现，展示如何在Repository层实现租户隔离
type TenantIsolatedTestCaseRepository interface {
	// Create creates a new test case (tenant/project are set in the model)
	Create(ctx context.Context, testCase *models.TestCase) error

	// GetByID retrieves a test case by ID with tenant isolation
	GetByID(ctx context.Context, testID, tenantID, projectID string) (*models.TestCase, error)

	// List retrieves test cases with tenant isolation and pagination
	List(ctx context.Context, tenantID, projectID string, offset, limit int) ([]models.TestCase, int64, error)

	// Update updates a test case with tenant isolation
	Update(ctx context.Context, testCase *models.TestCase) error

	// Delete soft deletes a test case with tenant isolation
	Delete(ctx context.Context, testID, tenantID, projectID string) error

	// GetByGroupID retrieves all test cases in a group with tenant isolation
	GetByGroupID(ctx context.Context, groupID, tenantID, projectID string) ([]models.TestCase, error)

	// Search searches test cases by name with tenant isolation
	Search(ctx context.Context, query, tenantID, projectID string, limit int) ([]models.TestCase, error)

	// GetByWorkflowID retrieves all test cases referencing a workflow with tenant isolation
	GetByWorkflowID(ctx context.Context, workflowID, tenantID, projectID string) ([]models.TestCase, error)
}

// tenantIsolatedTestCaseRepo implementation
type tenantIsolatedTestCaseRepo struct {
	db *gorm.DB
}

// NewTenantIsolatedTestCaseRepository creates a new repository with tenant isolation
func NewTenantIsolatedTestCaseRepository(db *gorm.DB) TenantIsolatedTestCaseRepository {
	return &tenantIsolatedTestCaseRepo{db: db}
}

// Create creates a new test case
// Tenant ID and Project ID should be set in the testCase model before calling this
func (r *tenantIsolatedTestCaseRepo) Create(ctx context.Context, testCase *models.TestCase) error {
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

// GetByID retrieves a test case with tenant isolation
func (r *tenantIsolatedTestCaseRepo) GetByID(ctx context.Context, testID, tenantID, projectID string) (*models.TestCase, error) {
	var testCase models.TestCase

	// CRITICAL: Always filter by tenant_id and project_id to ensure isolation
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

// List retrieves test cases with pagination and tenant isolation
func (r *tenantIsolatedTestCaseRepo) List(ctx context.Context, tenantID, projectID string, offset, limit int) ([]models.TestCase, int64, error) {
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

// Update updates a test case with tenant isolation
func (r *tenantIsolatedTestCaseRepo) Update(ctx context.Context, testCase *models.TestCase) error {
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

// Delete soft deletes a test case with tenant isolation
func (r *tenantIsolatedTestCaseRepo) Delete(ctx context.Context, testID, tenantID, projectID string) error {
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

// GetByGroupID retrieves all test cases in a group with tenant isolation
func (r *tenantIsolatedTestCaseRepo) GetByGroupID(ctx context.Context, groupID, tenantID, projectID string) ([]models.TestCase, error) {
	var testCases []models.TestCase

	result := r.db.WithContext(ctx).
		Where("group_id = ? AND tenant_id = ? AND project_id = ? AND deleted_at IS NULL",
			groupID, tenantID, projectID).
		Find(&testCases)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to query test cases by group: %w", result.Error)
	}

	return testCases, nil
}

// Search searches test cases by name with tenant isolation
func (r *tenantIsolatedTestCaseRepo) Search(ctx context.Context, query, tenantID, projectID string, limit int) ([]models.TestCase, error) {
	var testCases []models.TestCase

	searchPattern := "%" + query + "%"
	result := r.db.WithContext(ctx).
		Where("tenant_id = ? AND project_id = ? AND deleted_at IS NULL", tenantID, projectID).
		Where("name LIKE ? OR description LIKE ?", searchPattern, searchPattern).
		Limit(limit).
		Find(&testCases)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to search test cases: %w", result.Error)
	}

	return testCases, nil
}

// GetByWorkflowID retrieves all test cases referencing a workflow with tenant isolation
func (r *tenantIsolatedTestCaseRepo) GetByWorkflowID(ctx context.Context, workflowID, tenantID, projectID string) ([]models.TestCase, error) {
	var testCases []models.TestCase

	result := r.db.WithContext(ctx).
		Where("workflow_id = ? AND tenant_id = ? AND project_id = ? AND deleted_at IS NULL",
			workflowID, tenantID, projectID).
		Find(&testCases)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to query test cases by workflow: %w", result.Error)
	}

	return testCases, nil
}
