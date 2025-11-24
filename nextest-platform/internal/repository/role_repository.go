package repository

import (
	"context"
	"test-management-service/internal/models"

	"gorm.io/gorm"
)

// RoleRepository defines the interface for role data operations
type RoleRepository interface {
	// GetAll retrieves all active roles
	GetAll(ctx context.Context) ([]*models.Role, error)

	// GetByID retrieves a role by ID
	GetByID(ctx context.Context, roleID string) (*models.Role, error)

	// Create creates a new role
	Create(ctx context.Context, role *models.Role) error

	// Update updates an existing role
	Update(ctx context.Context, role *models.Role) error

	// Delete soft deletes a role
	Delete(ctx context.Context, roleID string) error
}

// roleRepositoryImpl implements RoleRepository
type roleRepositoryImpl struct {
	db *gorm.DB
}

// NewRoleRepository creates a new role repository
func NewRoleRepository(db *gorm.DB) RoleRepository {
	return &roleRepositoryImpl{db: db}
}

// GetAll retrieves all active roles
func (r *roleRepositoryImpl) GetAll(ctx context.Context) ([]*models.Role, error) {
	var roles []*models.Role
	err := r.db.WithContext(ctx).
		Where("deleted_at IS NULL").
		Order("role_id ASC").
		Find(&roles).Error
	return roles, err
}

// GetByID retrieves a role by ID
func (r *roleRepositoryImpl) GetByID(ctx context.Context, roleID string) (*models.Role, error) {
	var role models.Role
	err := r.db.WithContext(ctx).
		Where("role_id = ? AND deleted_at IS NULL", roleID).
		First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

// Create creates a new role
func (r *roleRepositoryImpl) Create(ctx context.Context, role *models.Role) error {
	return r.db.WithContext(ctx).Create(role).Error
}

// Update updates an existing role
func (r *roleRepositoryImpl) Update(ctx context.Context, role *models.Role) error {
	return r.db.WithContext(ctx).
		Model(&models.Role{}).
		Where("role_id = ?", role.RoleID).
		Updates(role).Error
}

// Delete soft deletes a role
func (r *roleRepositoryImpl) Delete(ctx context.Context, roleID string) error {
	return r.db.WithContext(ctx).
		Model(&models.Role{}).
		Where("role_id = ?", roleID).
		Update("deleted_at", gorm.Expr("datetime('now')")).Error
}
