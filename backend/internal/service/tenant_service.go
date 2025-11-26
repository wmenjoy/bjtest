package service

import (
	"errors"
	"fmt"
	"test-management-service/internal/models"
	"test-management-service/internal/repository"
)

// TenantService 租户服务接口
type TenantService interface {
	CreateTenant(req *CreateTenantRequest) (*models.Tenant, error)
	UpdateTenant(tenantID string, req *UpdateTenantRequest) (*models.Tenant, error)
	DeleteTenant(tenantID string) error
	GetTenant(tenantID string) (*models.Tenant, error)
	ListTenants() ([]models.Tenant, error)
	ListActiveTenants() ([]models.Tenant, error)
	GetTenantWithProjects(tenantID string) (*models.Tenant, error)
	GetTenantWithMembers(tenantID string) (*models.Tenant, error)
	SuspendTenant(tenantID string) error
	ActivateTenant(tenantID string) error
}

type tenantService struct {
	tenantRepo repository.TenantRepository
}

// NewTenantService creates a new tenant service
func NewTenantService(tenantRepo repository.TenantRepository) TenantService {
	return &tenantService{
		tenantRepo: tenantRepo,
	}
}

// ===== Request/Response DTOs =====

type CreateTenantRequest struct {
	TenantID     string                 `json:"tenantId" binding:"required"`
	Name         string                 `json:"name" binding:"required"`
	DisplayName  string                 `json:"displayName"`
	Description  string                 `json:"description"`
	Settings     map[string]interface{} `json:"settings"`
	MaxProjects  int                    `json:"maxProjects"`
	MaxUsers     int                    `json:"maxUsers"`
	MaxTestCases int                    `json:"maxTestCases"`
	ContactEmail string                 `json:"contactEmail"`
	ContactPhone string                 `json:"contactPhone"`
}

type UpdateTenantRequest struct {
	Name         string                 `json:"name"`
	DisplayName  string                 `json:"displayName"`
	Description  string                 `json:"description"`
	Settings     map[string]interface{} `json:"settings"`
	MaxProjects  int                    `json:"maxProjects"`
	MaxUsers     int                    `json:"maxUsers"`
	MaxTestCases int                    `json:"maxTestCases"`
	ContactEmail string                 `json:"contactEmail"`
	ContactPhone string                 `json:"contactPhone"`
}

// ===== Implementation =====

func (s *tenantService) CreateTenant(req *CreateTenantRequest) (*models.Tenant, error) {
	// Check if tenant already exists
	existing, err := s.tenantRepo.FindByID(req.TenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing tenant: %w", err)
	}
	if existing != nil {
		return nil, errors.New("tenant with this ID already exists")
	}

	// Create tenant
	tenant := &models.Tenant{
		TenantID:     req.TenantID,
		Name:         req.Name,
		DisplayName:  req.DisplayName,
		Description:  req.Description,
		Status:       models.TenantStatusActive,
		Settings:     req.Settings,
		MaxProjects:  req.MaxProjects,
		MaxUsers:     req.MaxUsers,
		MaxTestCases: req.MaxTestCases,
		ContactEmail: req.ContactEmail,
		ContactPhone: req.ContactPhone,
	}

	// Set defaults if not provided
	if tenant.MaxProjects == 0 {
		tenant.MaxProjects = 10
	}
	if tenant.MaxUsers == 0 {
		tenant.MaxUsers = 50
	}
	if tenant.MaxTestCases == 0 {
		tenant.MaxTestCases = 1000
	}

	if err := s.tenantRepo.Create(tenant); err != nil {
		return nil, fmt.Errorf("failed to create tenant: %w", err)
	}

	return tenant, nil
}

func (s *tenantService) UpdateTenant(tenantID string, req *UpdateTenantRequest) (*models.Tenant, error) {
	tenant, err := s.tenantRepo.FindByID(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to find tenant: %w", err)
	}
	if tenant == nil {
		return nil, errors.New("tenant not found")
	}

	// Update fields
	if req.Name != "" {
		tenant.Name = req.Name
	}
	if req.DisplayName != "" {
		tenant.DisplayName = req.DisplayName
	}
	if req.Description != "" {
		tenant.Description = req.Description
	}
	if req.Settings != nil {
		tenant.Settings = req.Settings
	}
	if req.MaxProjects > 0 {
		tenant.MaxProjects = req.MaxProjects
	}
	if req.MaxUsers > 0 {
		tenant.MaxUsers = req.MaxUsers
	}
	if req.MaxTestCases > 0 {
		tenant.MaxTestCases = req.MaxTestCases
	}
	if req.ContactEmail != "" {
		tenant.ContactEmail = req.ContactEmail
	}
	if req.ContactPhone != "" {
		tenant.ContactPhone = req.ContactPhone
	}

	if err := s.tenantRepo.Update(tenant); err != nil {
		return nil, fmt.Errorf("failed to update tenant: %w", err)
	}

	return tenant, nil
}

func (s *tenantService) DeleteTenant(tenantID string) error {
	tenant, err := s.tenantRepo.FindByID(tenantID)
	if err != nil {
		return fmt.Errorf("failed to find tenant: %w", err)
	}
	if tenant == nil {
		return errors.New("tenant not found")
	}

	if err := s.tenantRepo.Delete(tenantID); err != nil {
		return fmt.Errorf("failed to delete tenant: %w", err)
	}

	return nil
}

func (s *tenantService) GetTenant(tenantID string) (*models.Tenant, error) {
	tenant, err := s.tenantRepo.FindByID(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant: %w", err)
	}
	if tenant == nil {
		return nil, errors.New("tenant not found")
	}

	return tenant, nil
}

func (s *tenantService) ListTenants() ([]models.Tenant, error) {
	tenants, err := s.tenantRepo.FindAll()
	if err != nil {
		return nil, fmt.Errorf("failed to list tenants: %w", err)
	}

	return tenants, nil
}

func (s *tenantService) ListActiveTenants() ([]models.Tenant, error) {
	tenants, err := s.tenantRepo.FindByStatus(models.TenantStatusActive)
	if err != nil {
		return nil, fmt.Errorf("failed to list active tenants: %w", err)
	}

	return tenants, nil
}

func (s *tenantService) GetTenantWithProjects(tenantID string) (*models.Tenant, error) {
	tenant, err := s.tenantRepo.GetWithProjects(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant with projects: %w", err)
	}
	if tenant == nil {
		return nil, errors.New("tenant not found")
	}

	return tenant, nil
}

func (s *tenantService) GetTenantWithMembers(tenantID string) (*models.Tenant, error) {
	tenant, err := s.tenantRepo.GetWithMembers(tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tenant with members: %w", err)
	}
	if tenant == nil {
		return nil, errors.New("tenant not found")
	}

	return tenant, nil
}

func (s *tenantService) SuspendTenant(tenantID string) error {
	tenant, err := s.tenantRepo.FindByID(tenantID)
	if err != nil {
		return fmt.Errorf("failed to find tenant: %w", err)
	}
	if tenant == nil {
		return errors.New("tenant not found")
	}

	tenant.Status = models.TenantStatusSuspended
	if err := s.tenantRepo.Update(tenant); err != nil {
		return fmt.Errorf("failed to suspend tenant: %w", err)
	}

	return nil
}

func (s *tenantService) ActivateTenant(tenantID string) error {
	tenant, err := s.tenantRepo.FindByID(tenantID)
	if err != nil {
		return fmt.Errorf("failed to find tenant: %w", err)
	}
	if tenant == nil {
		return errors.New("tenant not found")
	}

	tenant.Status = models.TenantStatusActive
	if err := s.tenantRepo.Update(tenant); err != nil {
		return fmt.Errorf("failed to activate tenant: %w", err)
	}

	return nil
}
