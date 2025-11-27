package repository

import (
	"context"
	"errors"
	"fmt"
	"test-management-service/internal/models"

	apierrors "test-management-service/internal/errors"
	"gorm.io/gorm"
)

// TestCaseRepository 测试案例数据访问接口
type TestCaseRepository interface {
	// Legacy methods
	Create(testCase *models.TestCase) error
	Update(testCase *models.TestCase) error
	Delete(testID string) error
	FindByID(testID string) (*models.TestCase, error)
	GetTestCase(testID string) (*models.TestCase, error) // Alias for FindByID for compatibility
	FindByGroupID(groupID string) ([]models.TestCase, error)
	FindAll(limit, offset int) ([]models.TestCase, int64, error)
	FindByType(testType string) ([]models.TestCase, error)
	FindByTags(tags []string) ([]models.TestCase, error)
	Search(query string) ([]models.TestCase, error)

	// Multi-tenant methods
	CreateWithTenant(ctx context.Context, testCase *models.TestCase) error
	UpdateWithTenant(ctx context.Context, testCase *models.TestCase) error
	DeleteWithTenant(ctx context.Context, testID, tenantID, projectID string) error
	FindByIDWithTenant(ctx context.Context, testID, tenantID, projectID string) (*models.TestCase, error)
	FindByGroupIDWithTenant(ctx context.Context, groupID, tenantID, projectID string) ([]models.TestCase, error)
	FindAllWithTenant(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.TestCase, int64, error)
	FindByTypeWithTenant(ctx context.Context, testType, tenantID, projectID string) ([]models.TestCase, error)
	SearchWithTenant(ctx context.Context, tenantID, projectID, query string) ([]models.TestCase, error)
}

// testCaseRepository 实现
type testCaseRepository struct {
	db *gorm.DB
}

// NewTestCaseRepository 创建Repository实例
func NewTestCaseRepository(db *gorm.DB) TestCaseRepository {
	return &testCaseRepository{db: db}
}

func (r *testCaseRepository) Create(testCase *models.TestCase) error {
	return r.db.Create(testCase).Error
}

func (r *testCaseRepository) Update(testCase *models.TestCase) error {
	return r.db.Save(testCase).Error
}

func (r *testCaseRepository) Delete(testID string) error {
	return r.db.Where("test_id = ?", testID).Delete(&models.TestCase{}).Error
}

func (r *testCaseRepository) FindByID(testID string) (*models.TestCase, error) {
	var testCase models.TestCase
	err := r.db.Where("test_id = ?", testID).First(&testCase).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &testCase, nil
}

// GetTestCase is an alias for FindByID for compatibility with testcase package
func (r *testCaseRepository) GetTestCase(testID string) (*models.TestCase, error) {
	return r.FindByID(testID)
}

func (r *testCaseRepository) FindByGroupID(groupID string) ([]models.TestCase, error) {
	var testCases []models.TestCase
	err := r.db.Where("group_id = ?", groupID).Find(&testCases).Error
	return testCases, err
}

func (r *testCaseRepository) FindAll(limit, offset int) ([]models.TestCase, int64, error) {
	var testCases []models.TestCase
	var total int64

	if err := r.db.Model(&models.TestCase{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Limit(limit).Offset(offset).Find(&testCases).Error
	return testCases, total, err
}

func (r *testCaseRepository) FindByType(testType string) ([]models.TestCase, error) {
	var testCases []models.TestCase
	err := r.db.Where("type = ?", testType).Find(&testCases).Error
	return testCases, err
}

func (r *testCaseRepository) FindByTags(tags []string) ([]models.TestCase, error) {
	var testCases []models.TestCase
	// 简化实现：这里需要JSON查询，SQLite支持有限
	// 生产环境建议使用PostgreSQL的JSONB查询
	err := r.db.Find(&testCases).Error
	if err != nil {
		return nil, err
	}

	// 在内存中过滤（简化版本）
	var filtered []models.TestCase
	for _, tc := range testCases {
		if containsAny(tc.Tags, tags) {
			filtered = append(filtered, tc)
		}
	}
	return filtered, nil
}

func (r *testCaseRepository) Search(query string) ([]models.TestCase, error) {
	var testCases []models.TestCase
	err := r.db.Where("name LIKE ? OR objective LIKE ?", "%"+query+"%", "%"+query+"%").
		Find(&testCases).Error
	return testCases, err
}

// 辅助函数
func containsAny(slice []interface{}, items []string) bool {
	for _, item := range items {
		for _, s := range slice {
			if str, ok := s.(string); ok && str == item {
				return true
			}
		}
	}
	return false
}

// CreateWithTenant creates a new test case with tenant validation
func (r *testCaseRepository) CreateWithTenant(ctx context.Context, testCase *models.TestCase) error {
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

// UpdateWithTenant updates a test case with tenant isolation
func (r *testCaseRepository) UpdateWithTenant(ctx context.Context, testCase *models.TestCase) error {
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

// DeleteWithTenant soft deletes a test case with tenant isolation
func (r *testCaseRepository) DeleteWithTenant(ctx context.Context, testID, tenantID, projectID string) error {
	result := r.db.WithContext(ctx).
		Where("test_id = ? AND tenant_id = ? AND project_id = ?",
			testID, tenantID, projectID).
		Delete(&models.TestCase{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete test case: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("test case not found: %w", apierrors.ErrNotFound)
	}

	return nil
}

// FindByIDWithTenant retrieves a test case with tenant isolation
func (r *testCaseRepository) FindByIDWithTenant(ctx context.Context, testID, tenantID, projectID string) (*models.TestCase, error) {
	var testCase models.TestCase

	result := r.db.WithContext(ctx).
		Where("test_id = ? AND tenant_id = ? AND project_id = ? AND deleted_at IS NULL",
			testID, tenantID, projectID).
		First(&testCase)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to query test case: %w", result.Error)
	}

	return &testCase, nil
}

// FindByGroupIDWithTenant retrieves test cases by group ID with tenant isolation
func (r *testCaseRepository) FindByGroupIDWithTenant(ctx context.Context, groupID, tenantID, projectID string) ([]models.TestCase, error) {
	var testCases []models.TestCase

	result := r.db.WithContext(ctx).
		Where("group_id = ? AND tenant_id = ? AND project_id = ? AND deleted_at IS NULL",
			groupID, tenantID, projectID).
		Find(&testCases)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to query test cases: %w", result.Error)
	}

	return testCases, nil
}

// FindAllWithTenant retrieves all test cases with tenant isolation and pagination
func (r *testCaseRepository) FindAllWithTenant(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.TestCase, int64, error) {
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
		Limit(limit).
		Offset(offset).
		Order("created_at DESC")

	if err := query.Find(&testCases).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list test cases: %w", err)
	}

	return testCases, total, nil
}

// FindByTypeWithTenant retrieves test cases by type with tenant isolation
func (r *testCaseRepository) FindByTypeWithTenant(ctx context.Context, testType, tenantID, projectID string) ([]models.TestCase, error) {
	var testCases []models.TestCase

	result := r.db.WithContext(ctx).
		Where("type = ? AND tenant_id = ? AND project_id = ? AND deleted_at IS NULL",
			testType, tenantID, projectID).
		Find(&testCases)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to query test cases: %w", result.Error)
	}

	return testCases, nil
}

// SearchWithTenant searches test cases with tenant isolation
func (r *testCaseRepository) SearchWithTenant(ctx context.Context, query, tenantID, projectID string) ([]models.TestCase, error) {
	var testCases []models.TestCase

	result := r.db.WithContext(ctx).
		Where("tenant_id = ? AND project_id = ? AND deleted_at IS NULL", tenantID, projectID).
		Where("name LIKE ? OR objective LIKE ?", "%"+query+"%", "%"+query+"%").
		Find(&testCases)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to search test cases: %w", result.Error)
	}

	return testCases, nil
}
