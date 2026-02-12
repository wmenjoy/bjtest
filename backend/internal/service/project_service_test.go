package service

import (
	"errors"
	"testing"

	"test-management-service/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockProjectRepository 是 ProjectRepository 的 mock 实现
type MockProjectRepository struct {
	mock.Mock
}

func (m *MockProjectRepository) Create(project *models.Project) error {
	args := m.Called(project)
	return args.Error(0)
}

func (m *MockProjectRepository) Update(project *models.Project) error {
	args := m.Called(project)
	return args.Error(0)
}

func (m *MockProjectRepository) Delete(projectID string) error {
	args := m.Called(projectID)
	return args.Error(0)
}

func (m *MockProjectRepository) FindByID(projectID string) (*models.Project, error) {
	args := m.Called(projectID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Project), args.Error(1)
}

func (m *MockProjectRepository) FindByTenantID(tenantID string) ([]models.Project, error) {
	args := m.Called(tenantID)
	return args.Get(0).([]models.Project), args.Error(1)
}

func (m *MockProjectRepository) FindAll() ([]models.Project, error) {
	args := m.Called()
	return args.Get(0).([]models.Project), args.Error(1)
}

func (m *MockProjectRepository) FindByStatus(status string) ([]models.Project, error) {
	args := m.Called(status)
	return args.Get(0).([]models.Project), args.Error(1)
}

func (m *MockProjectRepository) GetWithTestGroups(projectID string) (*models.Project, error) {
	args := m.Called(projectID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Project), args.Error(1)
}

func (m *MockProjectRepository) GetWithTestCases(projectID string) (*models.Project, error) {
	args := m.Called(projectID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Project), args.Error(1)
}

func (m *MockProjectRepository) GetWithMembers(projectID string) (*models.Project, error) {
	args := m.Called(projectID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Project), args.Error(1)
}

func (m *MockProjectRepository) UpdateTestCaseCount(projectID string, count int) error {
	args := m.Called(projectID, count)
	return args.Error(0)
}

func (m *MockProjectRepository) UpdateTestGroupCount(projectID string, count int) error {
	args := m.Called(projectID, count)
	return args.Error(0)
}

// MockTenantRepository 是 TenantRepository 的 mock 实现
type MockTenantRepository struct {
	mock.Mock
}

func (m *MockTenantRepository) Create(tenant *models.Tenant) error {
	args := m.Called(tenant)
	return args.Error(0)
}

func (m *MockTenantRepository) Update(tenant *models.Tenant) error {
	args := m.Called(tenant)
	return args.Error(0)
}

func (m *MockTenantRepository) Delete(tenantID string) error {
	args := m.Called(tenantID)
	return args.Error(0)
}

func (m *MockTenantRepository) FindByID(tenantID string) (*models.Tenant, error) {
	args := m.Called(tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Tenant), args.Error(1)
}

func (m *MockTenantRepository) FindAll() ([]models.Tenant, error) {
	args := m.Called()
	return args.Get(0).([]models.Tenant), args.Error(1)
}

func (m *MockTenantRepository) FindByStatus(status string) ([]models.Tenant, error) {
	args := m.Called(status)
	return args.Get(0).([]models.Tenant), args.Error(1)
}

func (m *MockTenantRepository) GetWithProjects(tenantID string) (*models.Tenant, error) {
	args := m.Called(tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Tenant), args.Error(1)
}

func (m *MockTenantRepository) GetWithMembers(tenantID string) (*models.Tenant, error) {
	args := m.Called(tenantID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Tenant), args.Error(1)
}

// ===== CreateProject Tests =====

func TestCreateProject_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	req := &CreateProjectRequest{
		ProjectID:   "proj1",
		TenantID:    "tenant1",
		Name:        "Test Project",
		DisplayName: "Test Project Display",
		Description: "A test project",
		OwnerID:     "user1",
	}

	tenant := &models.Tenant{
		TenantID:    "tenant1",
		Name:        "Test Tenant",
		MaxProjects: 10,
	}

	// Mock: Tenant exists
	mockTenantRepo.On("FindByID", "tenant1").Return(tenant, nil)
	// Mock: Project doesn't exist
	mockProjectRepo.On("FindByID", "proj1").Return(nil, nil)
	// Mock: Tenant has 0 projects (within quota)
	mockProjectRepo.On("FindByTenantID", "tenant1").Return([]models.Project{}, nil)
	// Mock: Create succeeds
	mockProjectRepo.On("Create", mock.AnythingOfType("*models.Project")).Return(nil)

	// Act
	result, err := service.CreateProject(req)

	// Assert
	require.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, "proj1", result.ProjectID)
	assert.Equal(t, "tenant1", result.TenantID)
	assert.Equal(t, "Test Project", result.Name)
	assert.Equal(t, models.ProjectStatusActive, result.Status)
	mockTenantRepo.AssertExpectations(t)
	mockProjectRepo.AssertExpectations(t)
}

func TestCreateProject_TenantNotFound(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	req := &CreateProjectRequest{
		ProjectID: "proj1",
		TenantID:  "nonexistent",
		Name:      "Test Project",
	}

	// Mock: Tenant not found
	mockTenantRepo.On("FindByID", "nonexistent").Return(nil, nil)

	// Act
	result, err := service.CreateProject(req)

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "tenant not found")
	mockTenantRepo.AssertExpectations(t)
}

func TestCreateProject_TenantCheckError(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	req := &CreateProjectRequest{
		ProjectID: "proj1",
		TenantID:  "tenant1",
		Name:      "Test Project",
	}

	// Mock: Database error when checking tenant
	mockTenantRepo.On("FindByID", "tenant1").Return(nil, errors.New("database error"))

	// Act
	result, err := service.CreateProject(req)

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "failed to check tenant")
	mockTenantRepo.AssertExpectations(t)
}

func TestCreateProject_ProjectAlreadyExists(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	req := &CreateProjectRequest{
		ProjectID: "proj1",
		TenantID:  "tenant1",
		Name:      "Test Project",
	}

	tenant := &models.Tenant{
		TenantID:    "tenant1",
		MaxProjects: 10,
	}

	existingProject := &models.Project{
		ProjectID: "proj1",
		Name:      "Existing Project",
	}

	// Mock: Tenant exists
	mockTenantRepo.On("FindByID", "tenant1").Return(tenant, nil)
	// Mock: Project already exists
	mockProjectRepo.On("FindByID", "proj1").Return(existingProject, nil)

	// Act
	result, err := service.CreateProject(req)

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "already exists")
	mockTenantRepo.AssertExpectations(t)
	mockProjectRepo.AssertExpectations(t)
}

func TestCreateProject_QuotaExceeded(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	req := &CreateProjectRequest{
		ProjectID: "proj11",
		TenantID:  "tenant1",
		Name:      "Test Project",
	}

	tenant := &models.Tenant{
		TenantID:    "tenant1",
		MaxProjects: 2, // Quota is 2
	}

	existingProjects := []models.Project{
		{ProjectID: "proj1"},
		{ProjectID: "proj2"},
	}

	// Mock: Tenant exists
	mockTenantRepo.On("FindByID", "tenant1").Return(tenant, nil)
	// Mock: Project doesn't exist
	mockProjectRepo.On("FindByID", "proj11").Return(nil, nil)
	// Mock: Tenant already has 2 projects (quota reached)
	mockProjectRepo.On("FindByTenantID", "tenant1").Return(existingProjects, nil)

	// Act
	result, err := service.CreateProject(req)

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "maximum project limit")
	mockTenantRepo.AssertExpectations(t)
	mockProjectRepo.AssertExpectations(t)
}

func TestCreateProject_RepositoryError(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	req := &CreateProjectRequest{
		ProjectID: "proj1",
		TenantID:  "tenant1",
		Name:      "Test Project",
	}

	tenant := &models.Tenant{
		TenantID:    "tenant1",
		MaxProjects: 10,
	}

	// Mock: All checks pass
	mockTenantRepo.On("FindByID", "tenant1").Return(tenant, nil)
	mockProjectRepo.On("FindByID", "proj1").Return(nil, nil)
	mockProjectRepo.On("FindByTenantID", "tenant1").Return([]models.Project{}, nil)
	// Mock: Create fails
	mockProjectRepo.On("Create", mock.AnythingOfType("*models.Project")).
		Return(errors.New("database error"))

	// Act
	result, err := service.CreateProject(req)

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "failed to create project")
	mockTenantRepo.AssertExpectations(t)
	mockProjectRepo.AssertExpectations(t)
}

// ===== UpdateProject Tests =====

func TestUpdateProject_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	existingProject := &models.Project{
		ProjectID:   "proj1",
		Name:        "Old Name",
		Description: "Old Description",
	}

	req := &UpdateProjectRequest{
		Name:        "New Name",
		Description: "New Description",
	}

	// Mock
	mockProjectRepo.On("FindByID", "proj1").Return(existingProject, nil)
	mockProjectRepo.On("Update", existingProject).Return(nil)

	// Act
	result, err := service.UpdateProject("proj1", req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, "New Name", result.Name)
	assert.Equal(t, "New Description", result.Description)
	mockProjectRepo.AssertExpectations(t)
}

func TestUpdateProject_PartialUpdate(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	existingProject := &models.Project{
		ProjectID:   "proj1",
		Name:        "Old Name",
		Description: "Old Description",
		OwnerID:     "user1",
	}

	req := &UpdateProjectRequest{
		Name: "New Name",
		// Description 不更新
	}

	// Mock
	mockProjectRepo.On("FindByID", "proj1").Return(existingProject, nil)
	mockProjectRepo.On("Update", existingProject).Return(nil)

	// Act
	result, err := service.UpdateProject("proj1", req)

	// Assert
	require.NoError(t, err)
	assert.Equal(t, "New Name", result.Name)
	assert.Equal(t, "Old Description", result.Description, "Description should not change")
	mockProjectRepo.AssertExpectations(t)
}

func TestUpdateProject_NotFound(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	req := &UpdateProjectRequest{
		Name: "New Name",
	}

	// Mock: Project not found
	mockProjectRepo.On("FindByID", "nonexistent").Return(nil, nil)

	// Act
	result, err := service.UpdateProject("nonexistent", req)

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "not found")
	mockProjectRepo.AssertExpectations(t)
}

// ===== DeleteProject Tests =====

func TestDeleteProject_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	existingProject := &models.Project{
		ProjectID: "proj1",
		Name:      "Test Project",
	}

	// Mock
	mockProjectRepo.On("FindByID", "proj1").Return(existingProject, nil)
	mockProjectRepo.On("Delete", "proj1").Return(nil)

	// Act
	err := service.DeleteProject("proj1")

	// Assert
	require.NoError(t, err)
	mockProjectRepo.AssertExpectations(t)
}

func TestDeleteProject_NotFound(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	// Mock: Project not found
	mockProjectRepo.On("FindByID", "nonexistent").Return(nil, nil)

	// Act
	err := service.DeleteProject("nonexistent")

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
	mockProjectRepo.AssertExpectations(t)
}

// ===== GetProject Tests =====

func TestGetProject_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	expectedProject := &models.Project{
		ProjectID: "proj1",
		Name:      "Test Project",
	}

	// Mock
	mockProjectRepo.On("FindByID", "proj1").Return(expectedProject, nil)

	// Act
	result, err := service.GetProject("proj1")

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedProject, result)
	mockProjectRepo.AssertExpectations(t)
}

func TestGetProject_NotFound(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	// Mock
	mockProjectRepo.On("FindByID", "nonexistent").Return(nil, nil)

	// Act
	result, err := service.GetProject("nonexistent")

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "not found")
	mockProjectRepo.AssertExpectations(t)
}

// ===== ListProjects Tests =====

func TestListProjects_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	expectedProjects := []models.Project{
		{ProjectID: "proj1", Name: "Project 1"},
		{ProjectID: "proj2", Name: "Project 2"},
	}

	// Mock
	mockProjectRepo.On("FindByTenantID", "tenant1").Return(expectedProjects, nil)

	// Act
	result, err := service.ListProjects("tenant1")

	// Assert
	require.NoError(t, err)
	assert.Len(t, result, 2)
	mockProjectRepo.AssertExpectations(t)
}

func TestListProjects_EmptyList(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	// Mock: Empty list
	mockProjectRepo.On("FindByTenantID", "tenant1").Return([]models.Project{}, nil)

	// Act
	result, err := service.ListProjects("tenant1")

	// Assert
	require.NoError(t, err)
	assert.Empty(t, result)
	mockProjectRepo.AssertExpectations(t)
}

// ===== ListAllProjects Tests =====

func TestListAllProjects_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	expectedProjects := []models.Project{
		{ProjectID: "proj1"},
		{ProjectID: "proj2"},
		{ProjectID: "proj3"},
	}

	// Mock
	mockProjectRepo.On("FindAll").Return(expectedProjects, nil)

	// Act
	result, err := service.ListAllProjects()

	// Assert
	require.NoError(t, err)
	assert.Len(t, result, 3)
	mockProjectRepo.AssertExpectations(t)
}

// ===== ListActiveProjects Tests =====

func TestListActiveProjects_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	allProjects := []models.Project{
		{ProjectID: "proj1", Status: models.ProjectStatusActive},
		{ProjectID: "proj2", Status: models.ProjectStatusArchived},
		{ProjectID: "proj3", Status: models.ProjectStatusActive},
	}

	// Mock
	mockProjectRepo.On("FindByTenantID", "tenant1").Return(allProjects, nil)

	// Act
	result, err := service.ListActiveProjects("tenant1")

	// Assert
	require.NoError(t, err)
	assert.Len(t, result, 2, "Should only return active projects")
	assert.Equal(t, models.ProjectStatusActive, result[0].Status)
	assert.Equal(t, models.ProjectStatusActive, result[1].Status)
	mockProjectRepo.AssertExpectations(t)
}

func TestListActiveProjects_NoActiveProjects(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	allProjects := []models.Project{
		{ProjectID: "proj1", Status: models.ProjectStatusArchived},
		{ProjectID: "proj2", Status: models.ProjectStatusArchived},
	}

	// Mock
	mockProjectRepo.On("FindByTenantID", "tenant1").Return(allProjects, nil)

	// Act
	result, err := service.ListActiveProjects("tenant1")

	// Assert
	require.NoError(t, err)
	assert.Empty(t, result, "Should return empty list when no active projects")
	mockProjectRepo.AssertExpectations(t)
}

// ===== GetProjectWithTestGroups Tests =====

func TestGetProjectWithTestGroups_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	expectedProject := &models.Project{
		ProjectID: "proj1",
		Name:      "Test Project",
	}

	// Mock
	mockProjectRepo.On("GetWithTestGroups", "proj1").Return(expectedProject, nil)

	// Act
	result, err := service.GetProjectWithTestGroups("proj1")

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedProject, result)
	mockProjectRepo.AssertExpectations(t)
}

func TestGetProjectWithTestGroups_NotFound(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	// Mock
	mockProjectRepo.On("GetWithTestGroups", "nonexistent").Return(nil, nil)

	// Act
	result, err := service.GetProjectWithTestGroups("nonexistent")

	// Assert
	require.Error(t, err)
	assert.Nil(t, result)
	assert.Contains(t, err.Error(), "not found")
	mockProjectRepo.AssertExpectations(t)
}

// ===== GetProjectWithTestCases Tests =====

func TestGetProjectWithTestCases_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	expectedProject := &models.Project{
		ProjectID: "proj1",
		Name:      "Test Project",
	}

	// Mock
	mockProjectRepo.On("GetWithTestCases", "proj1").Return(expectedProject, nil)

	// Act
	result, err := service.GetProjectWithTestCases("proj1")

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedProject, result)
	mockProjectRepo.AssertExpectations(t)
}

// ===== GetProjectWithMembers Tests =====

func TestGetProjectWithMembers_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	expectedProject := &models.Project{
		ProjectID: "proj1",
		Name:      "Test Project",
	}

	// Mock
	mockProjectRepo.On("GetWithMembers", "proj1").Return(expectedProject, nil)

	// Act
	result, err := service.GetProjectWithMembers("proj1")

	// Assert
	require.NoError(t, err)
	assert.Equal(t, expectedProject, result)
	mockProjectRepo.AssertExpectations(t)
}

// ===== ArchiveProject Tests =====

func TestArchiveProject_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	existingProject := &models.Project{
		ProjectID: "proj1",
		Status:    models.ProjectStatusActive,
	}

	// Mock
	mockProjectRepo.On("FindByID", "proj1").Return(existingProject, nil)
	mockProjectRepo.On("Update", existingProject).Return(nil)

	// Act
	err := service.ArchiveProject("proj1")

	// Assert
	require.NoError(t, err)
	assert.Equal(t, models.ProjectStatusArchived, existingProject.Status)
	mockProjectRepo.AssertExpectations(t)
}

func TestArchiveProject_NotFound(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	// Mock
	mockProjectRepo.On("FindByID", "nonexistent").Return(nil, nil)

	// Act
	err := service.ArchiveProject("nonexistent")

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
	mockProjectRepo.AssertExpectations(t)
}

// ===== ActivateProject Tests =====

func TestActivateProject_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	existingProject := &models.Project{
		ProjectID: "proj1",
		Status:    models.ProjectStatusArchived,
	}

	// Mock
	mockProjectRepo.On("FindByID", "proj1").Return(existingProject, nil)
	mockProjectRepo.On("Update", existingProject).Return(nil)

	// Act
	err := service.ActivateProject("proj1")

	// Assert
	require.NoError(t, err)
	assert.Equal(t, models.ProjectStatusActive, existingProject.Status)
	mockProjectRepo.AssertExpectations(t)
}

func TestActivateProject_NotFound(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	// Mock
	mockProjectRepo.On("FindByID", "nonexistent").Return(nil, nil)

	// Act
	err := service.ActivateProject("nonexistent")

	// Assert
	require.Error(t, err)
	assert.Contains(t, err.Error(), "not found")
	mockProjectRepo.AssertExpectations(t)
}

// ===== UpdateProjectStats Tests =====

func TestUpdateProjectStats_Success(t *testing.T) {
	// Arrange
	mockProjectRepo := new(MockProjectRepository)
	mockTenantRepo := new(MockTenantRepository)
	service := NewProjectService(mockProjectRepo, mockTenantRepo)

	// Act
	err := service.UpdateProjectStats("proj1")

	// Assert
	require.NoError(t, err, "UpdateProjectStats is a placeholder and should not error")
}
