package service

import (
	"context"
	"fmt"
	"test-management-service/internal/models"
	"test-management-service/internal/repository"

	apierrors "test-management-service/internal/errors"
)

// EnvironmentService 环境管理服务接口
type EnvironmentService interface {
	// Environment CRUD
	CreateEnvironment(ctx context.Context, tenantID, projectID string, req *CreateEnvironmentRequest) (*models.Environment, error)
	UpdateEnvironment(ctx context.Context, envID, tenantID, projectID string, req *UpdateEnvironmentRequest) (*models.Environment, error)
	DeleteEnvironment(ctx context.Context, envID, tenantID, projectID string) error
	GetEnvironment(ctx context.Context, envID, tenantID, projectID string) (*models.Environment, error)
	ListEnvironments(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.Environment, int64, error)

	// Environment Activation
	GetActiveEnvironment(ctx context.Context, tenantID, projectID string) (*models.Environment, error)
	ActivateEnvironment(ctx context.Context, envID, tenantID, projectID string) error

	// Variable Management
	GetVariables(ctx context.Context, envID, tenantID, projectID string) (map[string]interface{}, error)
	GetVariable(ctx context.Context, envID, tenantID, projectID, key string) (interface{}, error)
	SetVariable(ctx context.Context, envID, tenantID, projectID, key string, value interface{}) error
	DeleteVariable(ctx context.Context, envID, tenantID, projectID, key string) error
}

type environmentService struct {
	envRepo    repository.EnvironmentRepository
	envVarRepo repository.EnvironmentVariableRepository
}

// NewEnvironmentService 创建环境管理服务
func NewEnvironmentService(
	envRepo repository.EnvironmentRepository,
	envVarRepo repository.EnvironmentVariableRepository,
) EnvironmentService {
	return &environmentService{
		envRepo:    envRepo,
		envVarRepo: envVarRepo,
	}
}

// ===== Request/Response DTOs =====

type CreateEnvironmentRequest struct {
	EnvID       string                 `json:"envId" binding:"required"`
	Name        string                 `json:"name" binding:"required"`
	Description string                 `json:"description"`
	Variables   map[string]interface{} `json:"variables"`
}

type UpdateEnvironmentRequest struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Variables   map[string]interface{} `json:"variables"`
}

type SetVariableRequest struct {
	Value interface{} `json:"value" binding:"required"`
}

// ===== Implementation =====

func (s *environmentService) CreateEnvironment(ctx context.Context, tenantID, projectID string, req *CreateEnvironmentRequest) (*models.Environment, error) {
	// 检查 envId 是否已存在 (with tenant isolation)
	existing, _ := s.envRepo.FindByIDWithTenant(ctx, req.EnvID, tenantID, projectID)
	if existing != nil {
		return nil, fmt.Errorf("environment with envId '%s' already exists", req.EnvID)
	}

	env := &models.Environment{
		EnvID:       req.EnvID,
		TenantID:    tenantID,
		ProjectID:   projectID,
		Name:        req.Name,
		Description: req.Description,
		IsActive:    false, // 新环境默认不激活
		Variables:   models.JSONB(req.Variables),
	}

	if err := s.envRepo.CreateWithTenant(ctx, env); err != nil {
		return nil, fmt.Errorf("failed to create environment: %w", err)
	}

	return env, nil
}

func (s *environmentService) UpdateEnvironment(ctx context.Context, envID, tenantID, projectID string, req *UpdateEnvironmentRequest) (*models.Environment, error) {
	env, err := s.envRepo.FindByIDWithTenant(ctx, envID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to find environment: %w", err)
	}
	if env == nil {
		return nil, fmt.Errorf("environment not found: %s", envID)
	}

	if req.Name != "" {
		env.Name = req.Name
	}
	if req.Description != "" {
		env.Description = req.Description
	}
	if req.Variables != nil {
		env.Variables = models.JSONB(req.Variables)
	}

	if err := s.envRepo.UpdateWithTenant(ctx, env); err != nil {
		return nil, fmt.Errorf("failed to update environment: %w", err)
	}

	return env, nil
}

func (s *environmentService) DeleteEnvironment(ctx context.Context, envID, tenantID, projectID string) error {
	// 不允许删除激活的环境
	env, err := s.envRepo.FindByIDWithTenant(ctx, envID, tenantID, projectID)
	if err != nil {
		return fmt.Errorf("failed to find environment: %w", err)
	}
	if env == nil {
		return fmt.Errorf("environment not found: %s", envID)
	}

	if env.IsActive {
		return fmt.Errorf("cannot delete active environment '%s': %w", envID, apierrors.ErrConflict)
	}

	return s.envRepo.DeleteWithTenant(ctx, envID, tenantID, projectID)
}

func (s *environmentService) GetEnvironment(ctx context.Context, envID, tenantID, projectID string) (*models.Environment, error) {
	return s.envRepo.FindByIDWithTenant(ctx, envID, tenantID, projectID)
}

func (s *environmentService) ListEnvironments(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.Environment, int64, error) {
	return s.envRepo.FindAllWithTenant(ctx, tenantID, projectID, limit, offset)
}

func (s *environmentService) GetActiveEnvironment(ctx context.Context, tenantID, projectID string) (*models.Environment, error) {
	env, err := s.envRepo.FindActiveWithTenant(ctx, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get active environment: %w", err)
	}
	if env == nil {
		return nil, fmt.Errorf("no active environment found")
	}
	return env, nil
}

func (s *environmentService) ActivateEnvironment(ctx context.Context, envID, tenantID, projectID string) error {
	// 检查环境是否存在
	env, err := s.envRepo.FindByIDWithTenant(ctx, envID, tenantID, projectID)
	if err != nil {
		return fmt.Errorf("failed to find environment: %w", err)
	}
	if env == nil {
		return fmt.Errorf("environment not found: %s", envID)
	}

	return s.envRepo.SetActiveWithTenant(ctx, envID, tenantID, projectID)
}

func (s *environmentService) GetVariables(ctx context.Context, envID, tenantID, projectID string) (map[string]interface{}, error) {
	env, err := s.envRepo.FindByIDWithTenant(ctx, envID, tenantID, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to find environment: %w", err)
	}
	if env == nil {
		return nil, fmt.Errorf("environment not found: %s", envID)
	}

	return env.Variables, nil
}

func (s *environmentService) GetVariable(ctx context.Context, envID, tenantID, projectID, key string) (interface{}, error) {
	vars, err := s.GetVariables(ctx, envID, tenantID, projectID)
	if err != nil {
		return nil, err
	}

	value, exists := vars[key]
	if !exists {
		return nil, fmt.Errorf("variable '%s' not found in environment '%s'", key, envID)
	}

	return value, nil
}

func (s *environmentService) SetVariable(ctx context.Context, envID, tenantID, projectID, key string, value interface{}) error {
	env, err := s.envRepo.FindByIDWithTenant(ctx, envID, tenantID, projectID)
	if err != nil {
		return fmt.Errorf("failed to find environment: %w", err)
	}
	if env == nil {
		return fmt.Errorf("environment not found: %s", envID)
	}

	if env.Variables == nil {
		env.Variables = make(models.JSONB)
	}

	env.Variables[key] = value

	return s.envRepo.UpdateWithTenant(ctx, env)
}

func (s *environmentService) DeleteVariable(ctx context.Context, envID, tenantID, projectID, key string) error {
	env, err := s.envRepo.FindByIDWithTenant(ctx, envID, tenantID, projectID)
	if err != nil {
		return fmt.Errorf("failed to find environment: %w", err)
	}
	if env == nil {
		return fmt.Errorf("environment not found: %s", envID)
	}

	if env.Variables == nil {
		return fmt.Errorf("no variables found in environment '%s'", envID)
	}

	delete(env.Variables, key)

	return s.envRepo.UpdateWithTenant(ctx, env)
}
