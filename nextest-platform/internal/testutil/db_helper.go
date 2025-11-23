package testutil

import (
	"testing"

	"test-management-service/internal/models"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// SetupTestDB creates an in-memory SQLite database with all models migrated
// and default tenant/project data inserted
func SetupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Auto migrate all models including multi-tenancy tables
	err = db.AutoMigrate(
		&models.Tenant{},
		&models.Project{},
		&models.TenantMember{},
		&models.ProjectMember{},
		&models.TestGroup{},
		&models.TestCase{},
		&models.TestResult{},
		&models.TestRun{},
		&models.Environment{},
		&models.EnvironmentVariable{},
		&models.Workflow{},
		&models.WorkflowRun{},
		&models.WorkflowStepExecution{},
		&models.WorkflowStepLog{},
		&models.WorkflowVariableChange{},
	)
	require.NoError(t, err)

	// Create default tenant for testing
	defaultTenant := &models.Tenant{
		TenantID:     "default",
		Name:         "Default Tenant",
		DisplayName:  "Default Tenant",
		Description:  "Default tenant for testing",
		Status:       models.TenantStatusActive,
		MaxProjects:  10,
		MaxUsers:     50,
		MaxTestCases: 1000,
	}
	err = db.Create(defaultTenant).Error
	require.NoError(t, err)

	// Create default project for testing
	defaultProject := &models.Project{
		ProjectID:   "default",
		TenantID:    "default",
		Name:        "Default Project",
		DisplayName: "Default Project",
		Description: "Default project for testing",
		Status:      models.ProjectStatusActive,
	}
	err = db.Create(defaultProject).Error
	require.NoError(t, err)

	return db
}

// CleanupTestDB closes the database connection
func CleanupTestDB(db *gorm.DB) {
	if db != nil {
		sqlDB, _ := db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}
}

// CreateTestTenant creates a test tenant with custom settings
func CreateTestTenant(t *testing.T, db *gorm.DB, tenantID string) *models.Tenant {
	tenant := &models.Tenant{
		TenantID:     tenantID,
		Name:         "Test Tenant " + tenantID,
		DisplayName:  "Test Tenant " + tenantID,
		Status:       models.TenantStatusActive,
		MaxProjects:  20,
		MaxUsers:     100,
		MaxTestCases: 5000,
	}
	err := db.Create(tenant).Error
	require.NoError(t, err)
	return tenant
}

// CreateTestProject creates a test project under a tenant
func CreateTestProject(t *testing.T, db *gorm.DB, projectID string, tenantID string) *models.Project {
	project := &models.Project{
		ProjectID:   projectID,
		TenantID:    tenantID,
		Name:        "Test Project " + projectID,
		DisplayName: "Test Project " + projectID,
		Status:      models.ProjectStatusActive,
	}
	err := db.Create(project).Error
	require.NoError(t, err)
	return project
}
