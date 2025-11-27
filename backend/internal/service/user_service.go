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

// userService implements UserService
type userService struct {
	roleRepo repository.RoleRepository
}

// NewUserService creates a new user service
func NewUserService(roleRepo repository.RoleRepository) UserService {
	return &userService{
		roleRepo: roleRepo,
	}
}

// ListRoles retrieves all active roles from the repository
func (s *userService) ListRoles(ctx context.Context) ([]*models.Role, error) {
	return s.roleRepo.GetAll(ctx)
}
