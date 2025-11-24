package repository

import (
	"context"
	"fmt"
	"strings"
	"test-management-service/internal/models"

	"gorm.io/gorm"
)

// ActionTemplateRepository defines the interface for action template data access
type ActionTemplateRepository interface {
	// Create creates a new action template
	Create(ctx context.Context, template *models.ActionTemplate) error

	// GetByID retrieves an action template by ID
	GetByID(ctx context.Context, id uint) (*models.ActionTemplate, error)

	// GetByTemplateID retrieves an action template by template_id
	GetByTemplateID(ctx context.Context, templateID string) (*models.ActionTemplate, error)

	// List retrieves action templates with filtering and pagination
	List(ctx context.Context, filter ActionTemplateFilter) ([]*models.ActionTemplate, int64, error)

	// Update updates an existing action template
	Update(ctx context.Context, template *models.ActionTemplate) error

	// Delete soft deletes an action template
	Delete(ctx context.Context, id uint) error

	// IncrementUsageCount increments the usage counter for a template
	IncrementUsageCount(ctx context.Context, templateID string) error

	// GetAccessibleTemplates retrieves templates accessible to a tenant and project
	// Implements four-layer permission filtering:
	// Level 1: scope='system' (visible to everyone)
	// Level 2: scope='platform' AND is_public=true
	// Level 3: scope='organization' AND tenant_id=current organization
	// Level 4: scope='project' AND tenant_id=current organization AND project_id=current project
	GetAccessibleTemplates(ctx context.Context, tenantID string, projectID string, filter ActionTemplateFilter) ([]*models.ActionTemplate, int64, error)
}

// ActionTemplateFilter defines filtering options for action templates
type ActionTemplateFilter struct {
	Category string   // Filter by category (Network, Database, etc.)
	Type     string   // Filter by type (http, command, etc.)
	Scope    string   // Filter by scope (system, platform, tenant)
	IsPublic *bool    // Filter by public flag (nil = no filter)
	Tags     []string // Filter by tags (AND logic)
	Search   string   // Search in name and description
	Page     int      // Page number (1-indexed)
	PageSize int      // Items per page
}

// actionTemplateRepositoryImpl implements ActionTemplateRepository
type actionTemplateRepositoryImpl struct {
	db *gorm.DB
}

// NewActionTemplateRepository creates a new ActionTemplateRepository
func NewActionTemplateRepository(db *gorm.DB) ActionTemplateRepository {
	return &actionTemplateRepositoryImpl{db: db}
}

// Create creates a new action template
func (r *actionTemplateRepositoryImpl) Create(ctx context.Context, template *models.ActionTemplate) error {
	// Validate required fields
	if template.TemplateID == "" {
		return fmt.Errorf("template_id is required")
	}
	if template.Name == "" {
		return fmt.Errorf("name is required")
	}
	if template.Category == "" {
		return fmt.Errorf("category is required")
	}
	if template.Type == "" {
		return fmt.Errorf("type is required")
	}
	if template.Scope == "" {
		return fmt.Errorf("scope is required")
	}

	// Validate scope values
	if template.Scope != "system" && template.Scope != "platform" && template.Scope != "tenant" {
		return fmt.Errorf("scope must be one of: system, platform, tenant")
	}

	// Validate tenant-scoped templates have tenant_id
	if template.Scope == "tenant" && template.TenantID == "" {
		return fmt.Errorf("tenant_id is required for tenant-scoped templates")
	}

	// System and platform templates should not have tenant_id
	if (template.Scope == "system" || template.Scope == "platform") && template.TenantID != "" {
		return fmt.Errorf("tenant_id must be empty for system/platform templates")
	}

	result := r.db.WithContext(ctx).Create(template)
	if result.Error != nil {
		// Check for unique constraint violation on template_id
		if strings.Contains(result.Error.Error(), "UNIQUE constraint failed") ||
			strings.Contains(result.Error.Error(), "duplicate key") {
			return fmt.Errorf("template with template_id '%s' already exists", template.TemplateID)
		}
		return fmt.Errorf("failed to create action template: %w", result.Error)
	}

	return nil
}

// GetByID retrieves an action template by ID
func (r *actionTemplateRepositoryImpl) GetByID(ctx context.Context, id uint) (*models.ActionTemplate, error) {
	var template models.ActionTemplate

	result := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&template)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("action template with id %d not found", id)
		}
		return nil, fmt.Errorf("failed to query action template: %w", result.Error)
	}

	return &template, nil
}

// GetByTemplateID retrieves an action template by template_id
func (r *actionTemplateRepositoryImpl) GetByTemplateID(ctx context.Context, templateID string) (*models.ActionTemplate, error) {
	var template models.ActionTemplate

	result := r.db.WithContext(ctx).
		Where("template_id = ? AND deleted_at IS NULL", templateID).
		First(&template)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("action template '%s' not found", templateID)
		}
		return nil, fmt.Errorf("failed to query action template: %w", result.Error)
	}

	return &template, nil
}

// List retrieves action templates with filtering and pagination
func (r *actionTemplateRepositoryImpl) List(ctx context.Context, filter ActionTemplateFilter) ([]*models.ActionTemplate, int64, error) {
	var templates []*models.ActionTemplate
	var total int64

	// Build base query
	query := r.db.WithContext(ctx).Model(&models.ActionTemplate{})

	// Apply filters
	query = r.applyFilters(query, filter)

	// Count total matching records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count action templates: %w", err)
	}

	// Apply pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 10
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100 // Maximum page size limit
	}

	offset := (filter.Page - 1) * filter.PageSize

	// Execute query with pagination
	if err := query.
		Offset(offset).
		Limit(filter.PageSize).
		Order("usage_count DESC, created_at DESC").
		Find(&templates).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list action templates: %w", err)
	}

	return templates, total, nil
}

// GetAccessibleTemplates retrieves templates accessible to a tenant and project
// Implements four-layer permission filtering:
// Level 1: scope='system' (visible to everyone)
// Level 2: scope='platform' AND is_public=true
// Level 3: scope='organization' AND tenant_id=current organization
// Level 4: scope='project' AND tenant_id=current organization AND project_id=current project
func (r *actionTemplateRepositoryImpl) GetAccessibleTemplates(ctx context.Context, tenantID string, projectID string, filter ActionTemplateFilter) ([]*models.ActionTemplate, int64, error) {
	var templates []*models.ActionTemplate
	var total int64

	// Build base query with four-layer access control
	// Uses OR conditions to combine different permission levels
	query := r.db.WithContext(ctx).Model(&models.ActionTemplate{}).
		Where(
			r.db.Where("scope = ?", "system").                                              // Level 1: System templates
				Or("scope = ? AND is_public = ?", "platform", true).                        // Level 2: Public platform templates
				Or("scope = ? AND tenant_id = ?", "organization", tenantID).                // Level 3: Organization templates
				Or("scope = ? AND tenant_id = ? AND project_id = ?", "project", tenantID, projectID), // Level 4: Project templates
		)

	// Apply additional filters
	query = r.applyFilters(query, filter)

	// Count total matching records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count accessible templates: %w", err)
	}

	// Apply pagination
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 {
		filter.PageSize = 10
	}
	if filter.PageSize > 100 {
		filter.PageSize = 100
	}

	offset := (filter.Page - 1) * filter.PageSize

	// Execute query with pagination
	// Order by usage count (popular first) then by creation date (newest first)
	if err := query.
		Offset(offset).
		Limit(filter.PageSize).
		Order("usage_count DESC, created_at DESC").
		Find(&templates).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to list accessible templates: %w", err)
	}

	return templates, total, nil
}

// Update updates an existing action template
func (r *actionTemplateRepositoryImpl) Update(ctx context.Context, template *models.ActionTemplate) error {
	// Check if template exists
	var existing models.ActionTemplate
	if err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", template.ID).
		First(&existing).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("action template with id %d not found", template.ID)
		}
		return fmt.Errorf("failed to query action template: %w", err)
	}

	// Validate required fields
	if template.Name == "" {
		return fmt.Errorf("name is required")
	}
	if template.Category == "" {
		return fmt.Errorf("category is required")
	}
	if template.Type == "" {
		return fmt.Errorf("type is required")
	}

	// Perform update
	result := r.db.WithContext(ctx).
		Model(&models.ActionTemplate{}).
		Where("id = ?", template.ID).
		Updates(template)

	if result.Error != nil {
		return fmt.Errorf("failed to update action template: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("action template with id %d not found or no changes made", template.ID)
	}

	return nil
}

// Delete soft deletes an action template
func (r *actionTemplateRepositoryImpl) Delete(ctx context.Context, id uint) error {
	// Check if template exists
	var existing models.ActionTemplate
	if err := r.db.WithContext(ctx).
		Where("id = ? AND deleted_at IS NULL", id).
		First(&existing).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("action template with id %d not found", id)
		}
		return fmt.Errorf("failed to query action template: %w", err)
	}

	// Perform soft delete
	result := r.db.WithContext(ctx).
		Where("id = ?", id).
		Delete(&models.ActionTemplate{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete action template: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("action template with id %d not found", id)
	}

	return nil
}

// IncrementUsageCount atomically increments the usage counter for a template
// Uses atomic increment to avoid race conditions
func (r *actionTemplateRepositoryImpl) IncrementUsageCount(ctx context.Context, templateID string) error {
	// Use atomic increment: UPDATE action_templates SET usage_count = usage_count + 1 WHERE template_id = ?
	// This is safer than fetch-increment-update as it prevents race conditions
	result := r.db.WithContext(ctx).
		Model(&models.ActionTemplate{}).
		Where("template_id = ? AND deleted_at IS NULL", templateID).
		UpdateColumn("usage_count", gorm.Expr("usage_count + ?", 1))

	if result.Error != nil {
		return fmt.Errorf("failed to increment usage count: %w", result.Error)
	}

	// Note: RowsAffected might be 0 if template doesn't exist, but we don't treat it as an error
	// as this is a non-critical statistics update
	if result.RowsAffected == 0 {
		return fmt.Errorf("action template '%s' not found or already deleted", templateID)
	}

	return nil
}

// applyFilters applies common filters to a GORM query
func (r *actionTemplateRepositoryImpl) applyFilters(query *gorm.DB, filter ActionTemplateFilter) *gorm.DB {
	// Filter by category
	if filter.Category != "" {
		query = query.Where("category = ?", filter.Category)
	}

	// Filter by type
	if filter.Type != "" {
		query = query.Where("type = ?", filter.Type)
	}

	// Filter by scope
	if filter.Scope != "" {
		query = query.Where("scope = ?", filter.Scope)
	}

	// Filter by public flag
	if filter.IsPublic != nil {
		query = query.Where("is_public = ?", *filter.IsPublic)
	}

	// Filter by tags (AND logic - all tags must be present)
	// TODO: This uses JSON string matching which may not be efficient
	// Consider using a separate tags table with many-to-many relationship for better performance
	for _, tag := range filter.Tags {
		query = query.Where("tags LIKE ?", "%\""+tag+"\"%")
	}

	// Search in name and description
	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Where(
			r.db.Where("name LIKE ?", searchTerm).
				Or("description LIKE ?", searchTerm),
		)
	}

	// Exclude soft-deleted records
	query = query.Where("deleted_at IS NULL")

	return query
}
