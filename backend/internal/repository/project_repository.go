package repository

import (
	"errors"
	"test-management-service/internal/models"

	"gorm.io/gorm"
)

// ProjectRepository 项目数据访问接口
type ProjectRepository interface {
	Create(project *models.Project) error
	Update(project *models.Project) error
	Delete(projectID string) error
	FindByID(projectID string) (*models.Project, error)
	FindByTenantID(tenantID string) ([]models.Project, error)
	FindAll() ([]models.Project, error)
	FindByStatus(status string) ([]models.Project, error)
	GetWithTestGroups(projectID string) (*models.Project, error)
	GetWithTestCases(projectID string) (*models.Project, error)
	GetWithMembers(projectID string) (*models.Project, error)
	UpdateTestCaseCount(projectID string, count int) error
	UpdateTestGroupCount(projectID string, count int) error
}

// projectRepository 实现
type projectRepository struct {
	db *gorm.DB
}

// NewProjectRepository 创建Repository实例
func NewProjectRepository(db *gorm.DB) ProjectRepository {
	return &projectRepository{db: db}
}

func (r *projectRepository) Create(project *models.Project) error {
	return r.db.Create(project).Error
}

func (r *projectRepository) Update(project *models.Project) error {
	return r.db.Save(project).Error
}

func (r *projectRepository) Delete(projectID string) error {
	return r.db.Where("project_id = ?", projectID).Delete(&models.Project{}).Error
}

func (r *projectRepository) FindByID(projectID string) (*models.Project, error) {
	var project models.Project
	err := r.db.Where("project_id = ?", projectID).First(&project).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &project, nil
}

func (r *projectRepository) FindByTenantID(tenantID string) ([]models.Project, error) {
	var projects []models.Project
	err := r.db.Where("tenant_id = ?", tenantID).Find(&projects).Error
	return projects, err
}

func (r *projectRepository) FindAll() ([]models.Project, error) {
	var projects []models.Project
	err := r.db.Find(&projects).Error
	return projects, err
}

func (r *projectRepository) FindByStatus(status string) ([]models.Project, error) {
	var projects []models.Project
	err := r.db.Where("status = ?", status).Find(&projects).Error
	return projects, err
}

func (r *projectRepository) GetWithTestGroups(projectID string) (*models.Project, error) {
	var project models.Project
	err := r.db.Where("project_id = ?", projectID).Preload("TestGroups").First(&project).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &project, nil
}

func (r *projectRepository) GetWithTestCases(projectID string) (*models.Project, error) {
	var project models.Project
	err := r.db.Where("project_id = ?", projectID).Preload("TestCases").First(&project).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &project, nil
}

func (r *projectRepository) GetWithMembers(projectID string) (*models.Project, error) {
	var project models.Project
	err := r.db.Where("project_id = ?", projectID).Preload("Members").First(&project).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return &project, nil
}

func (r *projectRepository) UpdateTestCaseCount(projectID string, count int) error {
	return r.db.Model(&models.Project{}).
		Where("project_id = ?", projectID).
		Update("test_case_count", count).Error
}

func (r *projectRepository) UpdateTestGroupCount(projectID string, count int) error {
	return r.db.Model(&models.Project{}).
		Where("project_id = ?", projectID).
		Update("test_group_count", count).Error
}
