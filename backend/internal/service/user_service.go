package service

import (
	"context"
	"test-management-service/internal/models"
	"test-management-service/internal/repository"
)

// UserService defines the interface for user-related business logic
type UserService interface {
	// ListRoles retrieves all active roles
	ListRoles(ctx context.Context) ([]*models.Role, error)
	// Add other user-related methods as needed
}

// userServiceImpl implements UserService
type userServiceImpl struct {
	roleRepo repository.RoleRepository
}

// NewUserService creates a new user service
func NewUserService(roleRepo repository.RoleRepository) UserService {
	return &userServiceImpl{
		roleRepo: roleRepo,
	}
}

// ListRoles retrieves all active roles from the repository
func (s *userServiceImpl) ListRoles(ctx context.Context) ([]*models.Role, error) {
	return s.roleRepo.GetAll(ctx)
}
