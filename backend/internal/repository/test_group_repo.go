package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"test-management-service/internal/models"

	apierrors "test-management-service/internal/errors"
	"gorm.io/gorm"
)

// TestGroupRepository 测试分组数据访问接口
type TestGroupRepository interface {
	// Legacy methods
	Create(group *models.TestGroup) error
	Update(group *models.TestGroup) error
	Delete(groupID string) error
	FindByID(groupID string) (*models.TestGroup, error)
	FindByParentID(parentID string) ([]models.TestGroup, error)
	FindAll() ([]models.TestGroup, error)
	GetTree() ([]models.TestGroup, error)

	// Multi-tenant methods
	CreateWithTenant(ctx context.Context, group *models.TestGroup) error
	UpdateWithTenant(ctx context.Context, group *models.TestGroup) error
	DeleteWithTenant(ctx context.Context, groupID, tenantID, projectID string) error
	FindByIDWithTenant(ctx context.Context, groupID, tenantID, projectID string) (*models.TestGroup, error)
	FindByParentIDWithTenant(ctx context.Context, parentID, tenantID, projectID string) ([]models.TestGroup, error)
	FindAllWithTenant(ctx context.Context, tenantID, projectID string) ([]models.TestGroup, error)
	GetTreeWithTenant(ctx context.Context, tenantID, projectID string) ([]models.TestGroup, error)
}

// testGroupRepository 实现
type testGroupRepository struct {
	db *gorm.DB
}

// NewTestGroupRepository 创建Repository实例
func NewTestGroupRepository(db *gorm.DB) TestGroupRepository {
	return &testGroupRepository{db: db}
}

func (r *testGroupRepository) Create(group *models.TestGroup) error {
	return r.db.Create(group).Error
}

func (r *testGroupRepository) Update(group *models.TestGroup) error {
	return r.db.Save(group).Error
}

func (r *testGroupRepository) Delete(groupID string) error {
	return r.db.Where("group_id = ?", groupID).Delete(&models.TestGroup{}).Error
}

func (r *testGroupRepository) FindByID(groupID string) (*models.TestGroup, error) {
	var group models.TestGroup
	err := r.db.Where("group_id = ?", groupID).First(&group).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &group, nil
}

func (r *testGroupRepository) FindByParentID(parentID string) ([]models.TestGroup, error) {
	var groups []models.TestGroup
	err := r.db.Where("parent_id = ?", parentID).Find(&groups).Error
	return groups, err
}

func (r *testGroupRepository) FindAll() ([]models.TestGroup, error) {
	var groups []models.TestGroup
	err := r.db.Find(&groups).Error
	return groups, err
}

func (r *testGroupRepository) GetTree() ([]models.TestGroup, error) {
	var groups []models.TestGroup
	// 获取所有分组
	if err := r.db.Find(&groups).Error; err != nil {
		return nil, err
	}

	// 构建 map 用于快速查找
	groupMap := make(map[string]*models.TestGroup)
	childMap := make(map[string][]string) // parentID -> []childID

	for i := range groups {
		groupMap[groups[i].GroupID] = &groups[i]
		if groups[i].ParentID != "" && groups[i].ParentID != "root" {
			childMap[groups[i].ParentID] = append(childMap[groups[i].ParentID], groups[i].GroupID)
		}
	}

	// 递归构建节点及其子节点
	var buildNode func(groupID string) models.TestGroup
	buildNode = func(groupID string) models.TestGroup {
		group := *groupMap[groupID]
		group.Children = []models.TestGroup{}

		if childIDs, ok := childMap[groupID]; ok {
			for _, childID := range childIDs {
				group.Children = append(group.Children, buildNode(childID))
			}
		}

		return group
	}

	// 构建根节点
	var roots []models.TestGroup
	for i := range groups {
		if groups[i].ParentID == "" || groups[i].ParentID == "root" {
			roots = append(roots, buildNode(groups[i].GroupID))
		}
	}

	return roots, nil
}

// CreateWithTenant creates a new test group with tenant validation
func (r *testGroupRepository) CreateWithTenant(ctx context.Context, group *models.TestGroup) error {
	// Validate tenant and project are set
	if group.TenantID == "" {
		return fmt.Errorf("tenant_id is required")
	}
	if group.ProjectID == "" {
		return fmt.Errorf("project_id is required")
	}

	result := r.db.WithContext(ctx).Create(group)
	if result.Error != nil {
		// Check if it's a UNIQUE constraint violation
		errMsg := result.Error.Error()
		if strings.Contains(errMsg, "UNIQUE constraint") ||
		   strings.Contains(errMsg, "Duplicate entry") ||
		   errors.Is(result.Error, gorm.ErrDuplicatedKey) {
			return fmt.Errorf("group already exists: %w", apierrors.ErrAlreadyExists)
		}
		return fmt.Errorf("failed to create test group: %w", result.Error)
	}
	return nil
}

// UpdateWithTenant updates a test group with tenant isolation
func (r *testGroupRepository) UpdateWithTenant(ctx context.Context, group *models.TestGroup) error {
	// Validate tenant and project match
	if group.TenantID == "" || group.ProjectID == "" {
		return fmt.Errorf("tenant_id and project_id are required")
	}

	// Update only if tenant and project match
	result := r.db.WithContext(ctx).
		Where("group_id = ? AND tenant_id = ? AND project_id = ?",
			group.GroupID, group.TenantID, group.ProjectID).
		Updates(group)

	if result.Error != nil {
		return fmt.Errorf("failed to update test group: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("test group not found: %w", apierrors.ErrNotFound)
	}

	return nil
}

// DeleteWithTenant soft deletes a test group with tenant isolation
func (r *testGroupRepository) DeleteWithTenant(ctx context.Context, groupID, tenantID, projectID string) error {
	result := r.db.WithContext(ctx).
		Where("group_id = ? AND tenant_id = ? AND project_id = ?",
			groupID, tenantID, projectID).
		Delete(&models.TestGroup{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete test group: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("test group not found: %w", apierrors.ErrNotFound)
	}

	return nil
}

// FindByIDWithTenant retrieves a test group with tenant isolation
func (r *testGroupRepository) FindByIDWithTenant(ctx context.Context, groupID, tenantID, projectID string) (*models.TestGroup, error) {
	var group models.TestGroup

	result := r.db.WithContext(ctx).
		Where("group_id = ? AND tenant_id = ? AND project_id = ? AND deleted_at IS NULL",
			groupID, tenantID, projectID).
		First(&group)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to query test group: %w", result.Error)
	}

	return &group, nil
}

// FindByParentIDWithTenant retrieves test groups by parent ID with tenant isolation
func (r *testGroupRepository) FindByParentIDWithTenant(ctx context.Context, parentID, tenantID, projectID string) ([]models.TestGroup, error) {
	var groups []models.TestGroup

	result := r.db.WithContext(ctx).
		Where("parent_id = ? AND tenant_id = ? AND project_id = ? AND deleted_at IS NULL",
			parentID, tenantID, projectID).
		Find(&groups)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to query test groups: %w", result.Error)
	}

	return groups, nil
}

// FindAllWithTenant retrieves all test groups with tenant isolation
func (r *testGroupRepository) FindAllWithTenant(ctx context.Context, tenantID, projectID string) ([]models.TestGroup, error) {
	var groups []models.TestGroup

	result := r.db.WithContext(ctx).
		Where("tenant_id = ? AND project_id = ? AND deleted_at IS NULL",
			tenantID, projectID).
		Find(&groups)

	if result.Error != nil {
		return nil, fmt.Errorf("failed to query test groups: %w", result.Error)
	}

	return groups, nil
}

// GetTreeWithTenant retrieves hierarchical test group tree with tenant isolation
func (r *testGroupRepository) GetTreeWithTenant(ctx context.Context, tenantID, projectID string) ([]models.TestGroup, error) {
	var groups []models.TestGroup

	// Get all groups for this tenant and project
	if err := r.db.WithContext(ctx).
		Where("tenant_id = ? AND project_id = ? AND deleted_at IS NULL", tenantID, projectID).
		Find(&groups).Error; err != nil {
		return nil, fmt.Errorf("failed to query test groups: %w", err)
	}

	// Build map for quick lookup
	groupMap := make(map[string]*models.TestGroup)
	childMap := make(map[string][]string) // parentID -> []childID

	for i := range groups {
		groupMap[groups[i].GroupID] = &groups[i]
		if groups[i].ParentID != "" && groups[i].ParentID != "root" {
			childMap[groups[i].ParentID] = append(childMap[groups[i].ParentID], groups[i].GroupID)
		}
	}

	// Recursively build node and its children
	var buildNode func(groupID string) models.TestGroup
	buildNode = func(groupID string) models.TestGroup {
		group := *groupMap[groupID]
		group.Children = []models.TestGroup{}

		if childIDs, ok := childMap[groupID]; ok {
			for _, childID := range childIDs {
				group.Children = append(group.Children, buildNode(childID))
			}
		}

		return group
	}

	// Build root nodes
	var roots []models.TestGroup
	for i := range groups {
		if groups[i].ParentID == "" || groups[i].ParentID == "root" {
			roots = append(roots, buildNode(groups[i].GroupID))
		}
	}

	return roots, nil
}
