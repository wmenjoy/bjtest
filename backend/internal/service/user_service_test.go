package service_test

import (
	"context"
	"errors"
	"testing"

	"test-management-service/internal/models"
	"test-management-service/internal/service"
)

// mockRoleRepository is a mock implementation of RoleRepository for testing
type mockRoleRepository struct {
	roles []*models.Role
	err   error
}

func (m *mockRoleRepository) GetAll(ctx context.Context) ([]*models.Role, error) {
	return m.roles, m.err
}

func (m *mockRoleRepository) GetByID(ctx context.Context, roleID string) (*models.Role, error) {
	return nil, errors.New("not implemented")
}

func (m *mockRoleRepository) Create(ctx context.Context, role *models.Role) error {
	return errors.New("not implemented")
}

func (m *mockRoleRepository) Update(ctx context.Context, role *models.Role) error {
	return errors.New("not implemented")
}

func (m *mockRoleRepository) Delete(ctx context.Context, roleID string) error {
	return errors.New("not implemented")
}

func TestUserService_ListRoles(t *testing.T) {
	// Test case 1: Success case - return roles
	t.Run("Success", func(t *testing.T) {
		expectedRoles := []*models.Role{
			{RoleID: "admin", Name: "Administrator"},
			{RoleID: "editor", Name: "Editor"},
		}
		mockRepo := &mockRoleRepository{roles: expectedRoles}
		svc := service.NewUserService(mockRepo)

		result, err := svc.ListRoles(context.Background())
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if len(result) != 2 {
			t.Errorf("expected 2 roles, got %d", len(result))
		}
		if result[0].RoleID != "admin" {
			t.Errorf("expected first role ID to be 'admin', got '%s'", result[0].RoleID)
		}
	})

	// Test case 2: Error case - repository returns error
	t.Run("RepositoryError", func(t *testing.T) {
		expectedError := errors.New("database error")
		mockRepo := &mockRoleRepository{err: expectedError}
		svc := service.NewUserService(mockRepo)

		result, err := svc.ListRoles(context.Background())
		if err == nil {
			t.Fatal("expected error, got nil")
		}
		if err != expectedError {
			t.Errorf("expected error '%v', got '%v'", expectedError, err)
		}
		if result != nil {
			t.Errorf("expected nil result, got %v", result)
		}
	})

	// Test case 3: Empty result
	t.Run("EmptyResult", func(t *testing.T) {
		mockRepo := &mockRoleRepository{roles: []*models.Role{}}
		svc := service.NewUserService(mockRepo)

		result, err := svc.ListRoles(context.Background())
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		if len(result) != 0 {
			t.Errorf("expected 0 roles, got %d", len(result))
		}
	})
}
