package repository

import (
	"context"
	"fmt"
	"time"
	"test-management-service/internal/models"
	"gorm.io/gorm"
)

// TestCaseFilter defines advanced search criteria for test cases
type TestCaseFilter struct {
	Keywords       string
	Priorities     []string
	Statuses       []string
	Tags           []string
	SuccessRateMin *int
	SuccessRateMax *int
	OwnerID        string
	LastRunBefore  string // RFC3339 format
	IsFlaky        *bool
	Page           int
	PageSize       int
}

// TestStatistics aggregates test case statistics
type TestStatistics struct {
	TotalTests       int            `json:"totalTests"`
	MyTests          int            `json:"myTests"`
	P0Tests          int            `json:"p0Tests"`
	FlakyTests       int            `json:"flakyTests"`
	LongRunningTests int            `json:"longRunningTests"`
	NotRunRecently   int            `json:"notRunRecently"`
	TagCloud         map[string]int `json:"tagCloud"`
}

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

// AdvancedSearch performs multi-condition search with pagination
func (r *WorkflowTestCaseRepository) AdvancedSearch(ctx context.Context, tenantID string, filter TestCaseFilter) ([]*models.TestCase, int64, error) {
	query := r.db.WithContext(ctx).Model(&models.TestCase{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID)

	// Keyword search (search in name, description, objective)
	if filter.Keywords != "" {
		query = query.Where("name LIKE ? OR objective LIKE ?", "%"+filter.Keywords+"%", "%"+filter.Keywords+"%")
	}

	// Priority filter
	if len(filter.Priorities) > 0 {
		query = query.Where("priority IN ?", filter.Priorities)
	}

	// Status filter
	if len(filter.Statuses) > 0 {
		query = query.Where("status IN ?", filter.Statuses)
	}

	// Tags filter (JSON array contains - use LIKE for SQLite)
	if len(filter.Tags) > 0 {
		for _, tag := range filter.Tags {
			query = query.Where("tags LIKE ?", "%\""+tag+"\"%")
		}
	}

	// Success rate range
	if filter.SuccessRateMin != nil {
		query = query.Where("success_rate >= ?", *filter.SuccessRateMin)
	}
	if filter.SuccessRateMax != nil {
		query = query.Where("success_rate <= ?", *filter.SuccessRateMax)
	}

	// Owner filter
	if filter.OwnerID != "" {
		query = query.Where("owner_id = ?", filter.OwnerID)
	}

	// Last run before date
	if filter.LastRunBefore != "" {
		query = query.Where("last_run_at < ?", filter.LastRunBefore)
	}

	// Flaky filter
	if filter.IsFlaky != nil {
		query = query.Where("is_flaky = ?", *filter.IsFlaky)
	}

	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count test cases: %w", err)
	}

	// Apply pagination
	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	offset := (page - 1) * pageSize

	var testCases []*models.TestCase
	if err := query.Offset(offset).Limit(pageSize).Order("updated_at DESC").Find(&testCases).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to search test cases: %w", err)
	}

	return testCases, total, nil
}

// GetStatistics calculates aggregated statistics for test cases
func (r *WorkflowTestCaseRepository) GetStatistics(ctx context.Context, tenantID string, currentUserID string) (*TestStatistics, error) {
	stats := &TestStatistics{
		TagCloud: make(map[string]int),
	}

	baseQuery := r.db.WithContext(ctx).Model(&models.TestCase{}).Where("tenant_id = ? AND deleted_at IS NULL", tenantID)

	// Total tests
	var totalTests int64
	if err := baseQuery.Count(&totalTests).Error; err != nil {
		return nil, fmt.Errorf("failed to count total tests: %w", err)
	}
	stats.TotalTests = int(totalTests)

	// My tests (owner_id = currentUserID)
	if currentUserID != "" {
		var myTests int64
		if err := r.db.WithContext(ctx).Model(&models.TestCase{}).
			Where("tenant_id = ? AND owner_id = ? AND deleted_at IS NULL", tenantID, currentUserID).
			Count(&myTests).Error; err != nil {
			return nil, fmt.Errorf("failed to count my tests: %w", err)
		}
		stats.MyTests = int(myTests)
	}

	// P0 tests
	var p0Tests int64
	if err := r.db.WithContext(ctx).Model(&models.TestCase{}).
		Where("tenant_id = ? AND priority = ? AND deleted_at IS NULL", tenantID, "P0").
		Count(&p0Tests).Error; err != nil {
		return nil, fmt.Errorf("failed to count P0 tests: %w", err)
	}
	stats.P0Tests = int(p0Tests)

	// Flaky tests
	var flakyTests int64
	if err := r.db.WithContext(ctx).Model(&models.TestCase{}).
		Where("tenant_id = ? AND is_flaky = ? AND deleted_at IS NULL", tenantID, true).
		Count(&flakyTests).Error; err != nil {
		return nil, fmt.Errorf("failed to count flaky tests: %w", err)
	}
	stats.FlakyTests = int(flakyTests)

	// Long running tests (avg_duration > 30000ms = 30 seconds)
	var longRunningTests int64
	if err := r.db.WithContext(ctx).Model(&models.TestCase{}).
		Where("tenant_id = ? AND avg_duration > ? AND deleted_at IS NULL", tenantID, 30000).
		Count(&longRunningTests).Error; err != nil {
		return nil, fmt.Errorf("failed to count long running tests: %w", err)
	}
	stats.LongRunningTests = int(longRunningTests)

	// Not run recently (last_run_at < 30 days ago OR last_run_at IS NULL)
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30).Format(time.RFC3339)
	var notRunRecently int64
	if err := r.db.WithContext(ctx).Model(&models.TestCase{}).
		Where("tenant_id = ? AND (last_run_at < ? OR last_run_at IS NULL) AND deleted_at IS NULL", tenantID, thirtyDaysAgo).
		Count(&notRunRecently).Error; err != nil {
		return nil, fmt.Errorf("failed to count tests not run recently: %w", err)
	}
	stats.NotRunRecently = int(notRunRecently)

	// Tag cloud - get from separate method
	tagCloud, err := r.GetTagCloud(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tag cloud: %w", err)
	}
	stats.TagCloud = tagCloud

	return stats, nil
}

// GetTagCloud returns tag frequency map
func (r *WorkflowTestCaseRepository) GetTagCloud(ctx context.Context, tenantID string) (map[string]int, error) {
	tagCloud := make(map[string]int)

	var testCases []*models.TestCase
	if err := r.db.WithContext(ctx).
		Select("tags").
		Where("tenant_id = ? AND deleted_at IS NULL", tenantID).
		Find(&testCases).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch test case tags: %w", err)
	}

	// Parse tags JSON array and count
	for _, tc := range testCases {
		if tc.Tags == nil {
			continue
		}

		// Convert JSONArray to string slice
		tags := make([]string, 0)
		for _, tag := range tc.Tags {
			if tagStr, ok := tag.(string); ok && tagStr != "" {
				tags = append(tags, tagStr)
			}
		}

		for _, tag := range tags {
			tagCloud[tag]++
		}
	}

	return tagCloud, nil
}

// GetFlakyTests returns tests identified as flaky
func (r *WorkflowTestCaseRepository) GetFlakyTests(ctx context.Context, tenantID string, flakyScoreThreshold int) ([]*models.TestCase, error) {
	var testCases []*models.TestCase

	if err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND (is_flaky = ? OR flaky_score >= ?) AND deleted_at IS NULL", tenantID, true, flakyScoreThreshold).
		Order("flaky_score DESC").
		Find(&testCases).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch flaky tests: %w", err)
	}

	return testCases, nil
}

