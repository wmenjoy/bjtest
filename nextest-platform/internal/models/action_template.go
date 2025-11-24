package models

import (
	"time"

	"gorm.io/gorm"
)

// ActionTemplate represents a reusable action template
// Supports three-tier scoping: System (built-in), Platform (shared), Tenant (private)
//
// Scope levels:
// - system: Built-in templates provided by the platform (e.g., HTTP requests, database queries)
// - platform: Shared templates across all tenants (created by platform admins)
// - tenant: Private templates specific to a tenant (created by tenant users)
//
// Example usage:
//   System template: Login action with configurable endpoints
//   Platform template: Common API health check shared across tenants
//   Tenant template: Organization-specific user provisioning workflow
type ActionTemplate struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	TemplateID string `gorm:"uniqueIndex;size:255;not null" json:"templateId"` // e.g., "action-user-login"
	TenantID   string `gorm:"index;size:100" json:"tenantId,omitempty"`        // null for system/platform templates

	// Basic Info
	Name        string `gorm:"size:255;not null" json:"name"`        // Display name
	Description string `gorm:"type:text" json:"description"`         // Detailed description of what this action does
	Category    string `gorm:"index;size:100;not null" json:"category"` // Network, Database, Messaging, Script, Custom
	Type        string `gorm:"index;size:50;not null" json:"type"`   // http, command, database, script

	// Template Configuration
	// ConfigTemplate stores the base configuration for this action type
	// Example for HTTP action:
	// {
	//   "method": "POST",
	//   "url": "{{baseUrl}}/api/login",
	//   "headers": {"Content-Type": "application/json"},
	//   "body": {"username": "{{username}}", "password": "{{password}}"}
	// }
	ConfigTemplate JSONB `gorm:"type:text;column:config_template" json:"configTemplate"`

	// Parameters defines input parameter schema for this template
	// Example structure (stored as JSONArray):
	// [
	//   {
	//     "name": "username",
	//     "type": "string",
	//     "required": true,
	//     "description": "Login username",
	//     "defaultValue": "{{testUser}}"
	//   },
	//   {
	//     "name": "password",
	//     "type": "string",
	//     "required": true,
	//     "description": "Login password",
	//     "defaultValue": "{{testPassword}}"
	//   }
	// ]
	Parameters JSONArray `gorm:"type:text" json:"parameters"`

	// Outputs defines what data this action produces
	// Example structure (stored as JSONArray):
	// [
	//   {
	//     "name": "authToken",
	//     "path": "response.body.token",
	//     "description": "JWT authentication token"
	//   },
	//   {
	//     "name": "userId",
	//     "path": "response.body.user.id",
	//     "description": "Authenticated user ID"
	//   }
	// ]
	Outputs JSONArray `gorm:"type:text" json:"outputs"`

	// Scope and Permissions
	Scope    string `gorm:"index;size:20;not null" json:"scope"`   // system, platform, tenant
	IsPublic bool   `gorm:"default:false" json:"isPublic"`         // For platform/tenant templates

	// Metadata
	Tags    JSONArray `gorm:"type:text" json:"tags"`      // e.g., ["auth", "api", "v1"]
	Version string    `gorm:"size:50" json:"version"`     // e.g., "1.0.0"
	Author  string    `gorm:"size:255" json:"author"`     // Creator username or system

	// Statistics
	UsageCount int `gorm:"default:0" json:"usageCount"` // Number of times this template has been used

	// Timestamps
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deletedAt,omitempty"`
}

// TableName specifies the table name for GORM
func (ActionTemplate) TableName() string {
	return "action_templates"
}

// BeforeCreate GORM hook - called before creating a new record
func (at *ActionTemplate) BeforeCreate(tx *gorm.DB) error {
	// Set default values if needed
	if at.UsageCount == 0 {
		at.UsageCount = 0
	}
	return nil
}

// IsSystemTemplate checks if this is a system-level template
func (at *ActionTemplate) IsSystemTemplate() bool {
	return at.Scope == "system"
}

// IsPlatformTemplate checks if this is a platform-level template
func (at *ActionTemplate) IsPlatformTemplate() bool {
	return at.Scope == "platform"
}

// IsTenantTemplate checks if this is a tenant-specific template
func (at *ActionTemplate) IsTenantTemplate() bool {
	return at.Scope == "tenant"
}

// CanBeAccessedBy checks if the template can be accessed by a given tenant
// System templates are accessible to all
// Platform templates are accessible to all if IsPublic is true
// Tenant templates are only accessible to their own tenant
func (at *ActionTemplate) CanBeAccessedBy(tenantID string) bool {
	switch at.Scope {
	case "system":
		return true
	case "platform":
		return at.IsPublic
	case "tenant":
		return at.TenantID == tenantID
	default:
		return false
	}
}
