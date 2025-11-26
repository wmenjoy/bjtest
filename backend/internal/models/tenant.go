package models

import (
	"time"

	"gorm.io/gorm"
)

// Tenant represents a tenant/organization in the system
type Tenant struct {
	ID        uint           `gorm:"primaryKey" json:"-"`
	TenantID  string         `gorm:"uniqueIndex;size:100;not null" json:"tenantId"`
	Name      string         `gorm:"size:255;not null" json:"name"`
	DisplayName string       `gorm:"size:255" json:"displayName,omitempty"`
	Description string       `gorm:"type:text" json:"description,omitempty"`
	Status    string         `gorm:"size:20;default:active;not null" json:"status"` // active, suspended, deleted

	// 租户配置
	Settings JSONB          `gorm:"type:text" json:"settings,omitempty"`

	// 配额限制
	MaxProjects   int        `gorm:"default:10" json:"maxProjects,omitempty"`
	MaxUsers      int        `gorm:"default:50" json:"maxUsers,omitempty"`
	MaxTestCases  int        `gorm:"default:1000" json:"maxTestCases,omitempty"`

	// 联系信息
	ContactEmail  string     `gorm:"size:255" json:"contactEmail,omitempty"`
	ContactPhone  string     `gorm:"size:50" json:"contactPhone,omitempty"`

	// 时间戳
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`

	// 关联
	Projects  []Project      `gorm:"foreignKey:TenantID;references:TenantID" json:"projects,omitempty"`
	Members   []TenantMember `gorm:"foreignKey:TenantID;references:TenantID" json:"members,omitempty"`
}

// TableName specifies the table name for Tenant
func (Tenant) TableName() string {
	return "tenants"
}

// Project represents a project within a tenant
type Project struct {
	ID          uint           `gorm:"primaryKey" json:"-"`
	ProjectID   string         `gorm:"uniqueIndex;size:100;not null" json:"projectId"`
	TenantID    string         `gorm:"index;size:100;not null" json:"tenantId"`
	Name        string         `gorm:"size:255;not null" json:"name"`
	DisplayName string         `gorm:"size:255" json:"displayName,omitempty"`
	Description string         `gorm:"type:text" json:"description,omitempty"`
	Status      string         `gorm:"size:20;default:active;not null" json:"status"` // active, archived, deleted

	// 项目配置
	Settings    JSONB          `gorm:"type:text" json:"settings,omitempty"`

	// 项目信息
	OwnerID       string       `gorm:"size:100" json:"ownerId,omitempty"`
	RepositoryURL string       `gorm:"size:500" json:"repositoryUrl,omitempty"`

	// 统计信息
	TestCaseCount  int         `gorm:"default:0" json:"testCaseCount"`
	TestGroupCount int         `gorm:"default:0" json:"testGroupCount"`

	// 时间戳
	CreatedAt time.Time         `json:"createdAt"`
	UpdatedAt time.Time         `json:"updatedAt"`
	DeletedAt gorm.DeletedAt    `gorm:"index" json:"deletedAt,omitempty"`

	// 关联
	Tenant      Tenant           `gorm:"foreignKey:TenantID;references:TenantID" json:"tenant,omitempty"`
	Members     []ProjectMember  `gorm:"foreignKey:ProjectID;references:ProjectID" json:"members,omitempty"`
	TestGroups  []TestGroup      `gorm:"foreignKey:ProjectID;references:ProjectID" json:"testGroups,omitempty"`
	TestCases   []TestCase       `gorm:"foreignKey:ProjectID;references:ProjectID" json:"testCases,omitempty"`
}

// TableName specifies the table name for Project
func (Project) TableName() string {
	return "projects"
}

// TenantMember represents a member of a tenant
type TenantMember struct {
	ID       uint           `gorm:"primaryKey" json:"-"`
	TenantID string         `gorm:"index;size:100;not null" json:"tenantId"`
	UserID   string         `gorm:"index;size:100;not null" json:"userId"`
	Role     string         `gorm:"size:50;default:member;not null" json:"role"` // owner, admin, member, viewer

	// 权限
	Permissions JSONB        `gorm:"type:text" json:"permissions,omitempty"`

	// 时间戳
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`

	// 关联
	Tenant  Tenant           `gorm:"foreignKey:TenantID;references:TenantID" json:"tenant,omitempty"`
}

// TableName specifies the table name for TenantMember
func (TenantMember) TableName() string {
	return "tenant_members"
}

// ProjectMember represents a member of a project
type ProjectMember struct {
	ID        uint           `gorm:"primaryKey" json:"-"`
	ProjectID string         `gorm:"index;size:100;not null" json:"projectId"`
	UserID    string         `gorm:"index;size:100;not null" json:"userId"`
	Role      string         `gorm:"size:50;default:member;not null" json:"role"` // owner, maintainer, developer, tester, viewer

	// 权限
	Permissions JSONB        `gorm:"type:text" json:"permissions,omitempty"`

	// 时间戳
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`

	// 关联
	Project Project          `gorm:"foreignKey:ProjectID;references:ProjectID" json:"project,omitempty"`
}

// TableName specifies the table name for ProjectMember
func (ProjectMember) TableName() string {
	return "project_members"
}

// TenantStatus constants
const (
	TenantStatusActive    = "active"
	TenantStatusSuspended = "suspended"
	TenantStatusDeleted   = "deleted"
)

// ProjectStatus constants
const (
	ProjectStatusActive   = "active"
	ProjectStatusArchived = "archived"
	ProjectStatusDeleted  = "deleted"
)

// TenantRole constants
const (
	TenantRoleOwner  = "owner"
	TenantRoleAdmin  = "admin"
	TenantRoleMember = "member"
	TenantRoleViewer = "viewer"
)

// ProjectRole constants
const (
	ProjectRoleOwner      = "owner"
	ProjectRoleMaintainer = "maintainer"
	ProjectRoleDeveloper  = "developer"
	ProjectRoleTester     = "tester"
	ProjectRoleViewer     = "viewer"
)
