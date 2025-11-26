package repository

import (
	"context"
	"errors"
	"fmt"
	"test-management-service/internal/models"

	"gorm.io/gorm"
)

// EnvironmentRepository defines the interface for environment data access operations
// Provides methods for CRUD operations and environment activation management
type EnvironmentRepository interface {
	// Legacy methods (without tenant isolation)
	Create(env *models.Environment) error
	Update(env *models.Environment) error
	Delete(envID string) error
	FindByID(envID string) (*models.Environment, error)
	FindAll(limit, offset int) ([]models.Environment, int64, error)
	FindActive() (*models.Environment, error)
	SetActive(envID string) error

	// Multi-tenant methods
	CreateWithTenant(ctx context.Context, env *models.Environment) error
	UpdateWithTenant(ctx context.Context, env *models.Environment) error
	DeleteWithTenant(ctx context.Context, envID, tenantID, projectID string) error
	FindByIDWithTenant(ctx context.Context, envID, tenantID, projectID string) (*models.Environment, error)
	FindAllWithTenant(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.Environment, int64, error)
	FindActiveWithTenant(ctx context.Context, tenantID, projectID string) (*models.Environment, error)
	SetActiveWithTenant(ctx context.Context, envID, tenantID, projectID string) error
}

// environmentRepository implements EnvironmentRepository interface
type environmentRepository struct {
	db *gorm.DB
}

// NewEnvironmentRepository creates a new EnvironmentRepository instance
func NewEnvironmentRepository(db *gorm.DB) EnvironmentRepository {
	return &environmentRepository{db: db}
}

// Create creates a new environment in the database
func (r *environmentRepository) Create(env *models.Environment) error {
	return r.db.Create(env).Error
}

// Update updates an existing environment in the database
func (r *environmentRepository) Update(env *models.Environment) error {
	return r.db.Save(env).Error
}

// Delete soft-deletes an environment by envID
func (r *environmentRepository) Delete(envID string) error {
	return r.db.Where("env_id = ?", envID).Delete(&models.Environment{}).Error
}

// FindByID retrieves an environment by envID
// Preloads associated environment variables and filters soft-deleted records
func (r *environmentRepository) FindByID(envID string) (*models.Environment, error) {
	var env models.Environment
	err := r.db.Preload("EnvironmentVariables").
		Where("env_id = ?", envID).
		First(&env).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &env, nil
}

// FindAll retrieves all environments with pagination
// Returns environments, total count, and error
func (r *environmentRepository) FindAll(limit, offset int) ([]models.Environment, int64, error) {
	var environments []models.Environment
	var total int64

	// Count total records (excluding soft-deleted)
	if err := r.db.Model(&models.Environment{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Fetch paginated results with preloaded variables
	err := r.db.Preload("EnvironmentVariables").
		Limit(limit).
		Offset(offset).
		Find(&environments).Error

	return environments, total, err
}

// FindActive retrieves the currently active environment
// Preloads associated environment variables
func (r *environmentRepository) FindActive() (*models.Environment, error) {
	var env models.Environment
	err := r.db.Preload("EnvironmentVariables").
		Where("is_active = ?", true).
		First(&env).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &env, nil
}

// SetActive sets the specified environment as active
// Uses transaction to ensure atomicity:
// 1. Deactivates all environments
// 2. Activates the specified environment
func (r *environmentRepository) SetActive(envID string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Deactivate all environments
		if err := tx.Model(&models.Environment{}).
			Where("is_active = ?", true).
			Update("is_active", false).Error; err != nil {
			return err
		}

		// Activate the specified environment
		result := tx.Model(&models.Environment{}).
			Where("env_id = ?", envID).
			Update("is_active", true)

		if result.Error != nil {
			return result.Error
		}

		// Check if the environment exists
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}

		return nil
	})
}

// ===== Multi-tenant Methods =====

// CreateWithTenant creates a new environment with tenant validation
func (r *environmentRepository) CreateWithTenant(ctx context.Context, env *models.Environment) error {
	if env.TenantID == "" {
		return fmt.Errorf("tenant_id is required")
	}
	if env.ProjectID == "" {
		return fmt.Errorf("project_id is required")
	}

	result := r.db.WithContext(ctx).Create(env)
	if result.Error != nil {
		return fmt.Errorf("failed to create environment: %w", result.Error)
	}
	return nil
}

// UpdateWithTenant updates an environment with tenant isolation
func (r *environmentRepository) UpdateWithTenant(ctx context.Context, env *models.Environment) error {
	if env.TenantID == "" || env.ProjectID == "" {
		return fmt.Errorf("tenant_id and project_id are required")
	}

	result := r.db.WithContext(ctx).
		Where("env_id = ? AND tenant_id = ? AND project_id = ?",
			env.EnvID, env.TenantID, env.ProjectID).
		Updates(env)

	if result.Error != nil {
		return fmt.Errorf("failed to update environment: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("environment not found or access denied")
	}

	return nil
}

// DeleteWithTenant soft deletes an environment with tenant isolation
func (r *environmentRepository) DeleteWithTenant(ctx context.Context, envID, tenantID, projectID string) error {
	result := r.db.WithContext(ctx).
		Where("env_id = ? AND tenant_id = ? AND project_id = ?",
			envID, tenantID, projectID).
		Delete(&models.Environment{})

	if result.Error != nil {
		return fmt.Errorf("failed to delete environment: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("environment not found or access denied")
	}

	return nil
}

// FindByIDWithTenant retrieves an environment with tenant isolation
func (r *environmentRepository) FindByIDWithTenant(ctx context.Context, envID, tenantID, projectID string) (*models.Environment, error) {
	var env models.Environment

	result := r.db.WithContext(ctx).
		Preload("EnvironmentVariables").
		Where("env_id = ? AND tenant_id = ? AND project_id = ?",
			envID, tenantID, projectID).
		First(&env)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to query environment: %w", result.Error)
	}

	return &env, nil
}

// FindAllWithTenant retrieves all environments with tenant isolation and pagination
func (r *environmentRepository) FindAllWithTenant(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.Environment, int64, error) {
	var environments []models.Environment
	var total int64

	// Count total with tenant filter
	if err := r.db.WithContext(ctx).Model(&models.Environment{}).
		Where("tenant_id = ? AND project_id = ?", tenantID, projectID).
		Count(&total).Error; err != nil {
		return nil, 0, fmt.Errorf("failed to count environments: %w", err)
	}

	// Query with pagination and tenant filter
	err := r.db.WithContext(ctx).
		Preload("EnvironmentVariables").
		Where("tenant_id = ? AND project_id = ?", tenantID, projectID).
		Limit(limit).
		Offset(offset).
		Find(&environments).Error

	if err != nil {
		return nil, 0, fmt.Errorf("failed to list environments: %w", err)
	}

	return environments, total, nil
}

// FindActiveWithTenant retrieves the active environment with tenant isolation
func (r *environmentRepository) FindActiveWithTenant(ctx context.Context, tenantID, projectID string) (*models.Environment, error) {
	var env models.Environment

	result := r.db.WithContext(ctx).
		Preload("EnvironmentVariables").
		Where("is_active = ? AND tenant_id = ? AND project_id = ?",
			true, tenantID, projectID).
		First(&env)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to query active environment: %w", result.Error)
	}

	return &env, nil
}

// SetActiveWithTenant sets an environment as active with tenant isolation
func (r *environmentRepository) SetActiveWithTenant(ctx context.Context, envID, tenantID, projectID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Deactivate all environments for this tenant/project
		if err := tx.Model(&models.Environment{}).
			Where("is_active = ? AND tenant_id = ? AND project_id = ?",
				true, tenantID, projectID).
			Update("is_active", false).Error; err != nil {
			return fmt.Errorf("failed to deactivate environments: %w", err)
		}

		// Activate the specified environment
		result := tx.Model(&models.Environment{}).
			Where("env_id = ? AND tenant_id = ? AND project_id = ?",
				envID, tenantID, projectID).
			Update("is_active", true)

		if result.Error != nil {
			return fmt.Errorf("failed to activate environment: %w", result.Error)
		}

		if result.RowsAffected == 0 {
			return fmt.Errorf("environment not found or access denied")
		}

		return nil
	})
}
