package repository

import (
	"context"
	"fmt"
	"test-management-service/internal/models"
	"time"

	"gorm.io/gorm"
)

// TestResultRepository 测试结果数据访问接口
type TestResultRepository interface {
	// Legacy methods
	Create(result *models.TestResult) error
	FindByID(id uint) (*models.TestResult, error)
	FindByTestID(testID string, limit int) ([]models.TestResult, error)
	FindByRunID(runID string) ([]models.TestResult, error)
	DeleteOlderThan(days int) error

	// Multi-tenant methods
	CreateWithTenant(ctx context.Context, result *models.TestResult) error
	FindByTestIDWithTenant(ctx context.Context, testID, tenantID, projectID string, limit int) ([]models.TestResult, error)
	FindByRunIDWithTenant(ctx context.Context, runID, tenantID, projectID string) ([]models.TestResult, error)
}

type testResultRepository struct {
	db *gorm.DB
}

func NewTestResultRepository(db *gorm.DB) TestResultRepository {
	return &testResultRepository{db: db}
}

func (r *testResultRepository) Create(result *models.TestResult) error {
	return r.db.Create(result).Error
}

func (r *testResultRepository) FindByID(id uint) (*models.TestResult, error) {
	var result models.TestResult
	err := r.db.First(&result, id).Error
	if err != nil {
		return nil, err
	}
	return &result, nil
}

func (r *testResultRepository) FindByTestID(testID string, limit int) ([]models.TestResult, error) {
	var results []models.TestResult
	query := r.db.Where("test_id = ?", testID).Order("created_at DESC")
	if limit > 0 {
		query = query.Limit(limit)
	}
	err := query.Find(&results).Error
	return results, err
}

func (r *testResultRepository) FindByRunID(runID string) ([]models.TestResult, error) {
	var results []models.TestResult
	err := r.db.Where("run_id = ?", runID).Find(&results).Error
	return results, err
}

func (r *testResultRepository) DeleteOlderThan(days int) error {
	cutoff := time.Now().AddDate(0, 0, -days)
	return r.db.Where("created_at < ?", cutoff).Delete(&models.TestResult{}).Error
}

// TestRunRepository 测试批次数据访问接口
type TestRunRepository interface {
	// Legacy methods
	Create(run *models.TestRun) error
	Update(run *models.TestRun) error
	FindByID(runID string) (*models.TestRun, error)
	FindAll(limit, offset int) ([]models.TestRun, int64, error)

	// Multi-tenant methods
	CreateWithTenant(ctx context.Context, run *models.TestRun) error
	UpdateWithTenant(ctx context.Context, run *models.TestRun) error
	FindByIDWithTenant(ctx context.Context, runID, tenantID, projectID string) (*models.TestRun, error)
	FindAllWithTenant(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.TestRun, int64, error)
}

type testRunRepository struct {
	db *gorm.DB
}

func NewTestRunRepository(db *gorm.DB) TestRunRepository {
	return &testRunRepository{db: db}
}

func (r *testRunRepository) Create(run *models.TestRun) error {
	return r.db.Create(run).Error
}

func (r *testRunRepository) Update(run *models.TestRun) error {
	return r.db.Save(run).Error
}

func (r *testRunRepository) FindByID(runID string) (*models.TestRun, error) {
	var run models.TestRun
	err := r.db.Preload("Results").Where("run_id = ?", runID).First(&run).Error
	if err != nil {
		return nil, err
	}
	return &run, nil
}

func (r *testRunRepository) FindAll(limit, offset int) ([]models.TestRun, int64, error) {
	var runs []models.TestRun
	var total int64

	if err := r.db.Model(&models.TestRun{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&runs).Error
	return runs, total, err
}

// CreateWithTenant creates a new test result with tenant validation (TestResultRepository)
func (r *testResultRepository) CreateWithTenant(ctx context.Context, result *models.TestResult) error {
	// Validate tenant and project are set
	if result.TenantID == "" {
		return fmt.Errorf("tenant_id is required")
	}
	if result.ProjectID == "" {
		return fmt.Errorf("project_id is required")
	}

	dbResult := r.db.WithContext(ctx).Create(result)
	if dbResult.Error != nil {
		return fmt.Errorf("failed to create test result: %w", dbResult.Error)
	}
	return nil
}

// FindByTestIDWithTenant retrieves test results by test ID with tenant isolation
func (r *testResultRepository) FindByTestIDWithTenant(ctx context.Context, testID, tenantID, projectID string, limit int) ([]models.TestResult, error) {
	var results []models.TestResult

	query := r.db.WithContext(ctx).
		Where("test_id = ? AND tenant_id = ? AND project_id = ?",
			testID, tenantID, projectID).
		Order("created_at DESC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&results).Error; err != nil {
		return nil, fmt.Errorf("failed to query test results: %w", err)
	}

	return results, nil
}

// FindByRunIDWithTenant retrieves test results by run ID with tenant isolation
func (r *testResultRepository) FindByRunIDWithTenant(ctx context.Context, runID, tenantID, projectID string) ([]models.TestResult, error) {
	var results []models.TestResult

	err := r.db.WithContext(ctx).
		Where("run_id = ? AND tenant_id = ? AND project_id = ?",
			runID, tenantID, projectID).
		Find(&results).Error

	if err != nil {
		return nil, fmt.Errorf("failed to query test results: %w", err)
	}

	return results, nil
}

// CreateTestRunWithTenant creates a new test run with tenant validation
func (r *testRunRepository) CreateWithTenant(ctx context.Context, run *models.TestRun) error {
	// Validate tenant and project are set
	if run.TenantID == "" {
		return fmt.Errorf("tenant_id is required")
	}
	if run.ProjectID == "" {
		return fmt.Errorf("project_id is required")
	}

	result := r.db.WithContext(ctx).Create(run)
	if result.Error != nil {
		return fmt.Errorf("failed to create test run: %w", result.Error)
	}
	return nil
}

// UpdateTestRunWithTenant updates a test run with tenant isolation
func (r *testRunRepository) UpdateWithTenant(ctx context.Context, run *models.TestRun) error {
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
		return fmt.Errorf("failed to update test run: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("test run not found or access denied")
	}

	return nil
}

// FindByIDWithTenant retrieves a test run with tenant isolation
func (r *testRunRepository) FindByIDWithTenant(ctx context.Context, runID, tenantID, projectID string) (*models.TestRun, error) {
	var run models.TestRun

	err := r.db.WithContext(ctx).
		Preload("Results").
		Where("run_id = ? AND tenant_id = ? AND project_id = ?",
			runID, tenantID, projectID).
		First(&run).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("test run not found: %s", runID)
		}
		return nil, fmt.Errorf("failed to query test run: %w", err)
	}

	return &run, nil
}

// FindAllWithTenant retrieves all test runs with tenant isolation and pagination
func (r *testRunRepository) FindAllWithTenant(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.TestRun, int64, error) {
	var runs []models.TestRun
	var total int64

	// Count total with tenant filter
	if err := r.db.WithContext(ctx).Model(&models.TestRun{}).
		Where("tenant_id = ? AND project_id = ?", tenantID, projectID).
		Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count test runs: %w", err)
	}

	// Query with pagination and tenant filter
	err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND project_id = ?", tenantID, projectID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&runs).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to list test runs: %w", err)
	}

	return runs, total, nil
}
