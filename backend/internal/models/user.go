package models

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	UserID    string         `gorm:"column:user_id;primaryKey;size:50" json:"userId"`
	Name      string         `gorm:"column:name;size:100;not null" json:"name"`
	Email     string         `gorm:"column:email;size:255;uniqueIndex;not null" json:"email"`
	RoleID    string         `gorm:"column:role_id;size:50;index" json:"roleId"`
	OrgID     string         `gorm:"column:org_id;size:50;index" json:"orgId"`
	Status    string         `gorm:"column:status;size:20;default:active" json:"status"` // active, inactive
	Avatar    string         `gorm:"column:avatar;size:500" json:"avatar"`
	CreatedAt time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"column:deleted_at;index" json:"deletedAt,omitempty"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}

// Role represents a role with permissions
type Role struct {
	RoleID          string         `gorm:"column:role_id;primaryKey;size:50" json:"roleId"`
	Name            string         `gorm:"column:name;size:100;not null" json:"name"`
	Description     string         `gorm:"column:description;size:500" json:"description"`
	PermissionCodes JSONArray      `gorm:"column:permission_codes;type:text" json:"permissionCodes"`
	CreatedAt       time.Time      `gorm:"column:created_at;autoCreateTime" json:"createdAt"`
	UpdatedAt       time.Time      `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
	DeletedAt       gorm.DeletedAt `gorm:"column:deleted_at;index" json:"deletedAt,omitempty"`
}

// TableName specifies the table name for Role model
func (Role) TableName() string {
	return "roles"
}
