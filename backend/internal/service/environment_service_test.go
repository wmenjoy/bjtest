package service

import (
	"context"
	"errors"
	"testing"

	"test-management-service/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockEnvironmentRepository 是 EnvironmentRepository 的 mock 实现
type MockEnvironmentRepository struct {
	mock.Mock
}

// Legacy methods
func (m *MockEnvironmentRepository) Create(env *models.Environment) error {
	args := m.Called(env)
	return args.Error(0)
}

func (m *MockEnvironmentRepository) Update(env *models.Environment) error {
	args := m.Called(env)
	return args.Error(0)
}

func (m *MockEnvironmentRepository) Delete(envID string) error {
	args := m.Called(envID)
	return args.Error(0)
}

func (m *MockEnvironmentRepository) FindByID(envID string) (*models.Environment, error) {
	args := m.Called(envID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Environment), args.Error(1)
}

func (m *MockEnvironmentRepository) FindAll(limit, offset int) ([]models.Environment, int64, error) {
	args := m.Called(limit, offset)
	return args.Get(0).([]models.Environment), args.Get(1).(int64), args.Error(2)
}

func (m *MockEnvironmentRepository) FindActive() (*models.Environment, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Environment), args.Error(1)
}

func (m *MockEnvironmentRepository) SetActive(envID string) error {
	args := m.Called(envID)
	return args.Error(0)
}

// Multi-tenant methods
func (m *MockEnvironmentRepository) CreateWithTenant(ctx context.Context, env *models.Environment) error {
	args := m.Called(ctx, env)
	return args.Error(0)
}

func (m *MockEnvironmentRepository) FindByIDWithTenant(ctx context.Context, envID, tenantID, projectID string) (*models.Environment, error) {
	args := m.Called(ctx, envID, tenantID, projectID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Environment), args.Error(1)
}

func (m *MockEnvironmentRepository) UpdateWithTenant(ctx context.Context, env *models.Environment) error {
	args := m.Called(ctx, env)
	return args.Error(0)
}

func (m *MockEnvironmentRepository) DeleteWithTenant(ctx context.Context, envID, tenantID, projectID string) error {
	args := m.Called(ctx, envID, tenantID, projectID)
	return args.Error(0)
}

func (m *MockEnvironmentRepository) FindAllWithTenant(ctx context.Context, tenantID, projectID string, limit, offset int) ([]models.Environment, int64, error) {
	args := m.Called(ctx, tenantID, projectID, limit, offset)
	return args.Get(0).([]models.Environment), args.Get(1).(int64), args.Error(2)
}

func (m *MockEnvironmentRepository) FindActiveWithTenant(ctx context.Context, tenantID, projectID string) (*models.Environment, error) {
	args := m.Called(ctx, tenantID, projectID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Environment), args.Error(1)
}

func (m *MockEnvironmentRepository) SetActiveWithTenant(ctx context.Context, envID, tenantID, projectID string) error {
	args := m.Called(ctx, envID, tenantID, projectID)
	return args.Error(0)
}

// MockEnvironmentVariableRepository 是 EnvironmentVariableRepository 的 mock 实现
type MockEnvironmentVariableRepository struct {
	mock.Mock
}

func (m *MockEnvironmentVariableRepository) Create(envVar *models.EnvironmentVariable) error {
	args := m.Called(envVar)
	return args.Error(0)
}

func (m *MockEnvironmentVariableRepository) Update(envVar *models.EnvironmentVariable) error {
	args := m.Called(envVar)
	return args.Error(0)
}

func (m *MockEnvironmentVariableRepository) Delete(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockEnvironmentVariableRepository) FindByEnvID(envID string) ([]models.EnvironmentVariable, error) {
	args := m.Called(envID)
	return args.Get(0).([]models.EnvironmentVariable), args.Error(1)
}

func (m *MockEnvironmentVariableRepository) FindByKey(envID, key string) (*models.EnvironmentVariable, error) {
	args := m.Called(envID, key)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.EnvironmentVariable), args.Error(1)
}

func (m *MockEnvironmentVariableRepository) BatchCreate(envVars []models.EnvironmentVariable) error {
	args := m.Called(envVars)
	return args.Error(0)
}

// ===== CreateEnvironment Tests =====

func TestCreateEnvironment_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	req := &CreateEnvironmentRequest{
		EnvID:       "dev",
		Name:        "Development",
		Description: "Dev environment",
		Variables: map[string]interface{}{
			"API_URL": "http://localhost:8080",
		},
	}

	// Mock: 环境不存在
	mockRepo.On("FindByIDWithTenant", ctx, "dev", tenantID, projectID).Return(nil, nil)
	// Mock: 创建成功
	mockRepo.On("CreateWithTenant", ctx, mock.AnythingOfType("*models.Environment")).Return(nil)

	// Act
	result, err := service.CreateEnvironment(ctx, tenantID, projectID, req)

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "dev", result.EnvID)
	assert.Equal(t, "Development", result.Name)
	assert.Equal(t, tenantID, result.TenantID)
	assert.Equal(t, projectID, result.ProjectID)
	assert.False(t, result.IsActive, "New environment should not be active by default")
	mockRepo.AssertExpectations(t)
}

func TestCreateEnvironment_DuplicateEnvID(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	req := &CreateEnvironmentRequest{
		EnvID: "dev",
		Name:  "Development",
	}

	existingEnv := &models.Environment{
		EnvID:     "dev",
		TenantID:  tenantID,
		ProjectID: projectID,
	}

	// Mock: 环境已存在
	mockRepo.On("FindByIDWithTenant", ctx, "dev", tenantID, projectID).Return(existingEnv, nil)

	// Act
	result, err := service.CreateEnvironment(ctx, tenantID, projectID, req)

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "already exists")
	mockRepo.AssertExpectations(t)
}

func TestCreateEnvironment_RepositoryError(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	req := &CreateEnvironmentRequest{
		EnvID: "dev",
		Name:  "Development",
	}

	// Mock: 环境不存在
	mockRepo.On("FindByIDWithTenant", ctx, "dev", tenantID, projectID).Return(nil, nil)
	// Mock: 创建失败
	mockRepo.On("CreateWithTenant", ctx, mock.AnythingOfType("*models.Environment")).
		Return(errors.New("database error"))

	// Act
	result, err := service.CreateEnvironment(ctx, tenantID, projectID, req)

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "failed to create environment")
	mockRepo.AssertExpectations(t)
}

// ===== UpdateEnvironment Tests =====

func TestUpdateEnvironment_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"

	existingEnv := &models.Environment{
		EnvID:       envID,
		TenantID:    tenantID,
		ProjectID:   projectID,
		Name:        "Development",
		Description: "Old description",
	}

	req := &UpdateEnvironmentRequest{
		Name:        "Dev Environment",
		Description: "Updated description",
		Variables: map[string]interface{}{
			"NEW_VAR": "value",
		},
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(existingEnv, nil)
	mockRepo.On("UpdateWithTenant", ctx, existingEnv).Return(nil)

	// Act
	result, err := service.UpdateEnvironment(ctx, envID, tenantID, projectID, req)

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "Dev Environment", result.Name)
	assert.Equal(t, "Updated description", result.Description)
	mockRepo.AssertExpectations(t)
}

func TestUpdateEnvironment_PartialUpdate(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"

	existingEnv := &models.Environment{
		EnvID:       envID,
		TenantID:    tenantID,
		ProjectID:   projectID,
		Name:        "Development",
		Description: "Original description",
	}

	req := &UpdateEnvironmentRequest{
		Name: "Dev Environment",
		// Description 和 Variables 不更新
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(existingEnv, nil)
	mockRepo.On("UpdateWithTenant", ctx, existingEnv).Return(nil)

	// Act
	result, err := service.UpdateEnvironment(ctx, envID, tenantID, projectID, req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, "Dev Environment", result.Name)
	assert.Equal(t, "Original description", result.Description, "Description should not change")
	mockRepo.AssertExpectations(t)
}

func TestUpdateEnvironment_NotFound(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "non-existent"

	req := &UpdateEnvironmentRequest{
		Name: "Updated Name",
	}

	// Mock: 环境不存在
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(nil, nil)

	// Act
	result, err := service.UpdateEnvironment(ctx, envID, tenantID, projectID, req)

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "not found")
	mockRepo.AssertExpectations(t)
}

// ===== DeleteEnvironment Tests =====

func TestDeleteEnvironment_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"

	existingEnv := &models.Environment{
		EnvID:     envID,
		TenantID:  tenantID,
		ProjectID: projectID,
		IsActive:  false, // 非激活状态
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(existingEnv, nil)
	mockRepo.On("DeleteWithTenant", ctx, envID, tenantID, projectID).Return(nil)

	// Act
	err := service.DeleteEnvironment(ctx, envID, tenantID, projectID)

	// Assert
	require.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestDeleteEnvironment_CannotDeleteActive(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"

	existingEnv := &models.Environment{
		EnvID:     envID,
		TenantID:  tenantID,
		ProjectID: projectID,
		IsActive:  true, // 激活状态
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(existingEnv, nil)

	// Act
	err := service.DeleteEnvironment(ctx, envID, tenantID, projectID)

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "cannot delete active environment")
	mockRepo.AssertExpectations(t)
	mockRepo.AssertNotCalled(t, "DeleteWithTenant")
}

func TestDeleteEnvironment_NotFound(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "non-existent"

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(nil, nil)

	// Act
	err := service.DeleteEnvironment(ctx, envID, tenantID, projectID)

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
	mockRepo.AssertExpectations(t)
}

// ===== GetEnvironment Tests =====

func TestGetEnvironment_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"

	expectedEnv := &models.Environment{
		EnvID:     envID,
		TenantID:  tenantID,
		ProjectID: projectID,
		Name:      "Development",
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(expectedEnv, nil)

	// Act
	result, err := service.GetEnvironment(ctx, envID, tenantID, projectID)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedEnv, result)
	mockRepo.AssertExpectations(t)
}

// ===== ListEnvironments Tests =====

func TestListEnvironments_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"

	expectedEnvs := []models.Environment{
		{EnvID: "dev", Name: "Development"},
		{EnvID: "staging", Name: "Staging"},
	}

	// Mock
	mockRepo.On("FindAllWithTenant", ctx, tenantID, projectID, 10, 0).
		Return(expectedEnvs, int64(2), nil)

	// Act
	result, total, err := service.ListEnvironments(ctx, tenantID, projectID, 10, 0)

	// Assert
	require.NoError(t, err)
	assert.Len(t, result, 2)
	assert.Equal(t, int64(2), total)
	mockRepo.AssertExpectations(t)
}

func TestListEnvironments_EmptyList(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"

	// Mock: 返回空列表
	mockRepo.On("FindAllWithTenant", ctx, tenantID, projectID, 10, 0).
		Return([]models.Environment{}, int64(0), nil)

	// Act
	result, total, err := service.ListEnvironments(ctx, tenantID, projectID, 10, 0)

	// Assert
	require.NoError(t, err)
	assert.Empty(t, result)
	assert.Equal(t, int64(0), total)
	mockRepo.AssertExpectations(t)
}

// ===== GetActiveEnvironment Tests =====

func TestGetActiveEnvironment_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"

	activeEnv := &models.Environment{
		EnvID:    "prod",
		Name:     "Production",
		IsActive: true,
	}

	// Mock
	mockRepo.On("FindActiveWithTenant", ctx, tenantID, projectID).Return(activeEnv, nil)

	// Act
	result, err := service.GetActiveEnvironment(ctx, tenantID, projectID)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, activeEnv, result)
	mockRepo.AssertExpectations(t)
}

func TestGetActiveEnvironment_NoActiveEnvironment(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"

	// Mock: 没有激活的环境
	mockRepo.On("FindActiveWithTenant", ctx, tenantID, projectID).Return(nil, nil)

	// Act
	result, err := service.GetActiveEnvironment(ctx, tenantID, projectID)

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "no active environment found")
	mockRepo.AssertExpectations(t)
}

// ===== ActivateEnvironment Tests =====

func TestActivateEnvironment_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "staging"

	existingEnv := &models.Environment{
		EnvID:    envID,
		IsActive: false,
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(existingEnv, nil)
	mockRepo.On("SetActiveWithTenant", ctx, envID, tenantID, projectID).Return(nil)

	// Act
	err := service.ActivateEnvironment(ctx, envID, tenantID, projectID)

	// Assert
	require.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestActivateEnvironment_NotFound(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "non-existent"

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(nil, nil)

	// Act
	err := service.ActivateEnvironment(ctx, envID, tenantID, projectID)

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
	mockRepo.AssertExpectations(t)
	mockRepo.AssertNotCalled(t, "SetActiveWithTenant")
}

// ===== Variable Management Tests =====

func TestGetVariables_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"

	expectedVars := models.JSONB{
		"API_URL":  "http://localhost:8080",
		"DB_NAME":  "testdb",
		"LOG_LEVEL": "debug",
	}

	env := &models.Environment{
		EnvID:     envID,
		Variables: expectedVars,
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(env, nil)

	// Act
	result, err := service.GetVariables(ctx, envID, tenantID, projectID)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, map[string]interface{}(expectedVars), result)
	mockRepo.AssertExpectations(t)
}

func TestGetVariable_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"
	key := "API_URL"

	env := &models.Environment{
		EnvID: envID,
		Variables: models.JSONB{
			"API_URL": "http://localhost:8080",
		},
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(env, nil)

	// Act
	result, err := service.GetVariable(ctx, envID, tenantID, projectID, key)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, "http://localhost:8080", result)
	mockRepo.AssertExpectations(t)
}

func TestGetVariable_NotFound(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"
	key := "NON_EXISTENT_VAR"

	env := &models.Environment{
		EnvID: envID,
		Variables: models.JSONB{
			"API_URL": "http://localhost:8080",
		},
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(env, nil)

	// Act
	result, err := service.GetVariable(ctx, envID, tenantID, projectID, key)

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "variable 'NON_EXISTENT_VAR' not found")
	mockRepo.AssertExpectations(t)
}

func TestSetVariable_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"
	key := "NEW_VAR"
	value := "new_value"

	env := &models.Environment{
		EnvID: envID,
		Variables: models.JSONB{
			"API_URL": "http://localhost:8080",
		},
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(env, nil)
	mockRepo.On("UpdateWithTenant", ctx, env).Return(nil)

	// Act
	err := service.SetVariable(ctx, envID, tenantID, projectID, key, value)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, "new_value", env.Variables[key])
	mockRepo.AssertExpectations(t)
}

func TestSetVariable_InitializeVariablesIfNil(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"
	key := "FIRST_VAR"
	value := "first_value"

	env := &models.Environment{
		EnvID:     envID,
		Variables: nil, // Variables 为 nil
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(env, nil)
	mockRepo.On("UpdateWithTenant", ctx, env).Return(nil)

	// Act
	err := service.SetVariable(ctx, envID, tenantID, projectID, key, value)

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, env.Variables)
	assert.Equal(t, "first_value", env.Variables[key])
	mockRepo.AssertExpectations(t)
}

func TestDeleteVariable_Success(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"
	key := "OLD_VAR"

	env := &models.Environment{
		EnvID: envID,
		Variables: models.JSONB{
			"API_URL": "http://localhost:8080",
			"OLD_VAR": "old_value",
		},
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(env, nil)
	mockRepo.On("UpdateWithTenant", ctx, env).Return(nil)

	// Act
	err := service.DeleteVariable(ctx, envID, tenantID, projectID, key)

	// Assert
	require.NoError(t, err)
	_, exists := env.Variables[key]
	assert.False(t, exists, "Variable should be deleted")
	mockRepo.AssertExpectations(t)
}

func TestDeleteVariable_NoVariablesInEnvironment(t *testing.T) {
	// Arrange
	mockRepo := new(MockEnvironmentRepository)
	mockVarRepo := new(MockEnvironmentVariableRepository)
	service := NewEnvironmentService(mockRepo, mockVarRepo)

	ctx := context.Background()
	tenantID := "tenant1"
	projectID := "project1"
	envID := "dev"
	key := "SOME_VAR"

	env := &models.Environment{
		EnvID:     envID,
		Variables: nil, // 没有变量
	}

	// Mock
	mockRepo.On("FindByIDWithTenant", ctx, envID, tenantID, projectID).Return(env, nil)

	// Act
	err := service.DeleteVariable(ctx, envID, tenantID, projectID, key)

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "no variables found")
	mockRepo.AssertExpectations(t)
	mockRepo.AssertNotCalled(t, "UpdateWithTenant")
}
