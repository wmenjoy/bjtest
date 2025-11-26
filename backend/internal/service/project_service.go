package service

import (
	"errors"
	"fmt"
	"test-management-service/internal/models"
	"test-management-service/internal/repository"
)

// ProjectService 项目服务接口
type ProjectService interface {
	CreateProject(req *CreateProjectRequest) (*models.Project, error)
	UpdateProject(projectID string, req *UpdateProjectRequest) (*models.Project, error)
	DeleteProject(projectID string) error
	GetProject(projectID string) (*models.Project, error)
	ListProjects(tenantID string) ([]models.Project, error)
	ListAllProjects() ([]models.Project, error)
	ListActiveProjects(tenantID string) ([]models.Project, error)
	GetProjectWithTestGroups(projectID string) (*models.Project, error)
	GetProjectWithTestCases(projectID string) (*models.Project, error)
	GetProjectWithMembers(projectID string) (*models.Project, error)
	ArchiveProject(projectID string) error
	ActivateProject(projectID string) error
	UpdateProjectStats(projectID string) error
}

type projectService struct {
	projectRepo repository.ProjectRepository
	tenantRepo  repository.TenantRepository
}

// NewProjectService creates a new project service
func NewProjectService(
	projectRepo repository.ProjectRepository,
	tenantRepo repository.TenantRepository,
) ProjectService {
	return &projectService{
		projectRepo: projectRepo,
		tenantRepo:  tenantRepo,
	}
}

// ===== Request/Response DTOs =====

type CreateProjectRequest struct {
	ProjectID     string                 `json:"projectId" binding:"required"`
	TenantID      string                 `json:"tenantId" binding:"required"`
	Name          string                 `json:"name" binding:"required"`
	DisplayName   string                 `json:"displayName"`
	Description   string                 `json:"description"`
	Settings      map[string]interface{} `json:"settings"`
	OwnerID       string                 `json:"ownerId"`
	RepositoryURL string                 `json:"repositoryUrl"`
}

type UpdateProjectRequest struct {
	Name          string                 `json:"name"`
	DisplayName   string                 `json:"displayName"`
	Description   string                 `json:"description"`
	Settings      map[string]interface{} `json:"settings"`
	OwnerID       string                 `json:"ownerId"`
	RepositoryURL string                 `json:"repositoryUrl"`
}

// ===== Implementation =====

func (s *projectService) CreateProject(req *CreateProjectRequest) (*models.Project, error) {
	// Verify tenant exists
	tenant, err := s.tenantRepo.FindByID(req.TenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to check tenant: %w", err)
	}
	if tenant == nil {
		return nil, errors.New("tenant not found")
	}

	// Check if project already exists
	existing, err := s.projectRepo.FindByID(req.ProjectID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing project: %w", err)
	}
	if existing != nil {
		return nil, errors.New("project with this ID already exists")
	}

	// Check tenant's project quota
	existingProjects, err := s.projectRepo.FindByTenantID(req.TenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to check project count: %w", err)
	}
	if len(existingProjects) >= tenant.MaxProjects {
		return nil, fmt.Errorf("tenant has reached maximum project limit (%d)", tenant.MaxProjects)
	}

	// Create project
	project := &models.Project{
		ProjectID:     req.ProjectID,
		TenantID:      req.TenantID,
		Name:          req.Name,
		DisplayName:   req.DisplayName,
		Description:   req.Description,
		Status:        models.ProjectStatusActive,
		Settings:      req.Settings,
		OwnerID:       req.OwnerID,
		RepositoryURL: req.RepositoryURL,
	}

	if err := s.projectRepo.Create(project); err != nil {
		return nil, fmt.Errorf("failed to create project: %w", err)
	}

	return project, nil
}

func (s *projectService) UpdateProject(projectID string, req *UpdateProjectRequest) (*models.Project, error) {
	project, err := s.projectRepo.FindByID(projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to find project: %w", err)
	}
	if project == nil {
		return nil, errors.New("project not found")
	}

	// Update fields
	if req.Name != "" {
		project.Name = req.Name
	}
	if req.DisplayName != "" {
		project.DisplayName = req.DisplayName
	}
	if req.Description != "" {
		project.Description = req.Description
	}
	if req.Settings != nil {
		project.Settings = req.Settings
	}
	if req.OwnerID != "" {
		project.OwnerID = req.OwnerID
	}
	if req.RepositoryURL != "" {
		project.RepositoryURL = req.RepositoryURL
	}

	if err := s.projectRepo.Update(project); err != nil {
		return nil, fmt.Errorf("failed to update project: %w", err)
	}

	return project, nil
}

func (s *projectService) DeleteProject(projectID string) error {
	project, err := s.projectRepo.FindByID(projectID)
	if err != nil {
		return fmt.Errorf("failed to find project: %w", err)
	}
	if project == nil {
		return errors.New("project not found")
	}

	if err := s.projectRepo.Delete(projectID); err != nil {
		return fmt.Errorf("failed to delete project: %w", err)
	}

	return nil
}

func (s *projectService) GetProject(projectID string) (*models.Project, error) {
	project, err := s.projectRepo.FindByID(projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get project: %w", err)
	}
	if project == nil {
		return nil, errors.New("project not found")
	}

	return project, nil
}

func (s *projectService) ListProjects(tenantID string) ([]models.Project, error) {
	projects, err := s.projectRepo.FindByTenantID(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list projects: %w", err)
	}

	return projects, nil
}

func (s *projectService) ListAllProjects() ([]models.Project, error) {
	projects, err := s.projectRepo.FindAll()
	if err != nil {
		return nil, fmt.Errorf("failed to list all projects: %w", err)
	}

	return projects, nil
}

func (s *projectService) ListActiveProjects(tenantID string) ([]models.Project, error) {
	allProjects, err := s.projectRepo.FindByTenantID(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to list projects: %w", err)
	}

	// Filter active projects
	var activeProjects []models.Project
	for _, project := range allProjects {
		if project.Status == models.ProjectStatusActive {
			activeProjects = append(activeProjects, project)
		}
	}

	return activeProjects, nil
}

func (s *projectService) GetProjectWithTestGroups(projectID string) (*models.Project, error) {
	project, err := s.projectRepo.GetWithTestGroups(projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get project with test groups: %w", err)
	}
	if project == nil {
		return nil, errors.New("project not found")
	}

	return project, nil
}

func (s *projectService) GetProjectWithTestCases(projectID string) (*models.Project, error) {
	project, err := s.projectRepo.GetWithTestCases(projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get project with test cases: %w", err)
	}
	if project == nil {
		return nil, errors.New("project not found")
	}

	return project, nil
}

func (s *projectService) GetProjectWithMembers(projectID string) (*models.Project, error) {
	project, err := s.projectRepo.GetWithMembers(projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get project with members: %w", err)
	}
	if project == nil {
		return nil, errors.New("project not found")
	}

	return project, nil
}

func (s *projectService) ArchiveProject(projectID string) error {
	project, err := s.projectRepo.FindByID(projectID)
	if err != nil {
		return fmt.Errorf("failed to find project: %w", err)
	}
	if project == nil {
		return errors.New("project not found")
	}

	project.Status = models.ProjectStatusArchived
	if err := s.projectRepo.Update(project); err != nil {
		return fmt.Errorf("failed to archive project: %w", err)
	}

	return nil
}

func (s *projectService) ActivateProject(projectID string) error {
	project, err := s.projectRepo.FindByID(projectID)
	if err != nil {
		return fmt.Errorf("failed to find project: %w", err)
	}
	if project == nil {
		return errors.New("project not found")
	}

	project.Status = models.ProjectStatusActive
	if err := s.projectRepo.Update(project); err != nil {
		return fmt.Errorf("failed to activate project: %w", err)
	}

	return nil
}

func (s *projectService) UpdateProjectStats(projectID string) error {
	// This method would typically count test cases and test groups
	// For now, it's a placeholder
	// TODO: Implement actual counting logic
	return nil
}
