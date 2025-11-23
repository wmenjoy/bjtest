package repository

import (
	"errors"
	"test-management-service/internal/models"

	"gorm.io/gorm"
)

// TenantRepository 租户数据访问接口
type TenantRepository interface {
	Create(tenant *models.Tenant) error
	Update(tenant *models.Tenant) error
	Delete(tenantID string) error
	FindByID(tenantID string) (*models.Tenant, error)
	FindAll() ([]models.Tenant, error)
	FindByStatus(status string) ([]models.Tenant, error)
	GetWithProjects(tenantID string) (*models.Tenant, error)
	GetWithMembers(tenantID string) (*models.Tenant, error)
}

// tenantRepo 实现
type tenantRepo struct {
	db *gorm.DB
}

// NewTenantRepository 创建Repository实例
func NewTenantRepository(db *gorm.DB) TenantRepository {
	return &tenantRepo{db: db}
}

func (r *tenantRepo) Create(tenant *models.Tenant) error {
	return r.db.Create(tenant).Error
}

func (r *tenantRepo) Update(tenant *models.Tenant) error {
	return r.db.Save(tenant).Error
}

func (r *tenantRepo) Delete(tenantID string) error {
	return r.db.Where("tenant_id = ?", tenantID).Delete(&models.Tenant{}).Error
}

func (r *tenantRepo) FindByID(tenantID string) (*models.Tenant, error) {
	var tenant models.Tenant
	err := r.db.Where("tenant_id = ?", tenantID).First(&tenant).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &tenant, nil
}

func (r *tenantRepo) FindAll() ([]models.Tenant, error) {
	var tenants []models.Tenant
	err := r.db.Find(&tenants).Error
	return tenants, err
}

func (r *tenantRepo) FindByStatus(status string) ([]models.Tenant, error) {
	var tenants []models.Tenant
	err := r.db.Where("status = ?", status).Find(&tenants).Error
	return tenants, err
}

func (r *tenantRepo) GetWithProjects(tenantID string) (*models.Tenant, error) {
	var tenant models.Tenant
	err := r.db.Where("tenant_id = ?", tenantID).Preload("Projects").First(&tenant).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &tenant, nil
}

func (r *tenantRepo) GetWithMembers(tenantID string) (*models.Tenant, error) {
	var tenant models.Tenant
	err := r.db.Where("tenant_id = ?", tenantID).Preload("Members").First(&tenant).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &tenant, nil
}
