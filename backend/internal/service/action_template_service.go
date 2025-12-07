package service

import (
	"context"
	"fmt"
	"test-management-service/internal/models"
	"test-management-service/internal/repository"
)

// ActionTemplateService defines the interface for action template business logic
type ActionTemplateService interface {
	// Create creates a new action template
	Create(ctx context.Context, template *models.ActionTemplate) error

	// GetByID retrieves an action template by database ID
	GetByID(ctx context.Context, id uint) (*models.ActionTemplate, error)

	// GetByTemplateID retrieves an action template by template_id
	GetByTemplateID(ctx context.Context, templateID string) (*models.ActionTemplate, error)

	// List retrieves action templates with filtering and pagination
	List(ctx context.Context, filter repository.ActionTemplateFilter) ([]*models.ActionTemplate, int64, error)

	// GetAccessibleTemplates retrieves templates accessible to a tenant and project
	// Implements four-layer permission filtering:
	// Level 1: scope='system' (visible to everyone)
	// Level 2: scope='platform' AND is_public=true
	// Level 3: scope='organization' AND tenant_id=current organization
	// Level 4: scope='project' AND tenant_id=current organization AND project_id=current project
	GetAccessibleTemplates(ctx context.Context, tenantID string, projectID string, filter repository.ActionTemplateFilter) ([]*models.ActionTemplate, int64, error)

	// Update updates an existing action template
	Update(ctx context.Context, template *models.ActionTemplate) error

	// Delete soft deletes an action template
	Delete(ctx context.Context, id uint) error

	// CopyToTenant copies a system/platform template to tenant scope
	CopyToTenant(ctx context.Context, sourceTemplateID string, tenantID string, newName string) (*models.ActionTemplate, error)

	// RecordUsage increments the usage count for a template
	RecordUsage(ctx context.Context, templateID string) error
}

// actionTemplateService implements ActionTemplateService
type actionTemplateService struct {
	repo repository.ActionTemplateRepository
}

// NewActionTemplateService creates a new ActionTemplateService
func NewActionTemplateService(repo repository.ActionTemplateRepository) ActionTemplateService {
	return &actionTemplateService{
		repo: repo,
	}
}

// Create creates a new action template
func (s *actionTemplateService) Create(ctx context.Context, template *models.ActionTemplate) error {
	return s.repo.Create(ctx, template)
}

// GetByID retrieves an action template by database ID
func (s *actionTemplateService) GetByID(ctx context.Context, id uint) (*models.ActionTemplate, error) {
	return s.repo.GetByID(ctx, id)
}

// GetByTemplateID retrieves an action template by template_id
func (s *actionTemplateService) GetByTemplateID(ctx context.Context, templateID string) (*models.ActionTemplate, error) {
	return s.repo.GetByTemplateID(ctx, templateID)
}

// List retrieves action templates with filtering and pagination
func (s *actionTemplateService) List(ctx context.Context, filter repository.ActionTemplateFilter) ([]*models.ActionTemplate, int64, error) {
	return s.repo.List(ctx, filter)
}

// GetAccessibleTemplates retrieves templates accessible to a tenant and project
// Implements four-layer permission filtering:
// Level 1: scope='system' (visible to everyone)
// Level 2: scope='platform' AND is_public=true
// Level 3: scope='organization' AND tenant_id=current organization
// Level 4: scope='project' AND tenant_id=current organization AND project_id=current project
func (s *actionTemplateService) GetAccessibleTemplates(ctx context.Context, tenantID string, projectID string, filter repository.ActionTemplateFilter) ([]*models.ActionTemplate, int64, error) {
	return s.repo.GetAccessibleTemplates(ctx, tenantID, projectID, filter)
}

// Update updates an existing action template
func (s *actionTemplateService) Update(ctx context.Context, template *models.ActionTemplate) error {
	return s.repo.Update(ctx, template)
}

// Delete soft deletes an action template
func (s *actionTemplateService) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

// CopyToTenant copies a system/platform template to tenant scope
// This is the main business logic method that enforces copy rules:
// 1. Source template must be system or platform scoped
// 2. Creates a new tenant-scoped template with unique template_id
// 3. Resets usage count to 0 for the new copy
func (s *actionTemplateService) CopyToTenant(ctx context.Context, sourceTemplateID string, tenantID string, newName string) (*models.ActionTemplate, error) {
	// Get source template
	source, err := s.repo.GetByTemplateID(ctx, sourceTemplateID)
	if err != nil {
		return nil, fmt.Errorf("failed to get source template: %w", err)
	}

	// Verify source is system or platform template
	if !source.IsSystemTemplate() && source.Scope != "platform" {
		return nil, fmt.Errorf("can only copy system or platform templates")
	}

	// Create new template with tenant scope
	// Generate unique template_id by appending tenant identifier
	newTemplate := &models.ActionTemplate{
		TemplateID:     fmt.Sprintf("%s-tenant-%s", sourceTemplateID, tenantID),
		TenantID:       tenantID,
		Name:           newName,
		Description:    source.Description,
		Category:       source.Category,
		Type:           source.Type,
		ConfigTemplate: source.ConfigTemplate,
		Parameters:     source.Parameters,
		Outputs:        source.Outputs,
		Scope:          "tenant",
		IsPublic:       false, // Tenant copies are private by default
		Tags:           source.Tags,
		Version:        source.Version,
		Author:         source.Author,
		UsageCount:     0, // Reset usage count for new template
	}

	if err := s.repo.Create(ctx, newTemplate); err != nil {
		return nil, fmt.Errorf("failed to create tenant template: %w", err)
	}

	return newTemplate, nil
}

// RecordUsage increments the usage count for a template
func (s *actionTemplateService) RecordUsage(ctx context.Context, templateID string) error {
	return s.repo.IncrementUsageCount(ctx, templateID)
}
