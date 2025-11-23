package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"test-management-service/internal/models"
)

// UserHandler handles user-related requests
type UserHandler struct {
	// db *gorm.DB // Will add database support later
}

// NewUserHandler creates a new user handler
func NewUserHandler() *UserHandler {
	return &UserHandler{}
}

// ListUsers returns all users
func (h *UserHandler) ListUsers(c *gin.Context) {
	// Hardcoded data for now
	users := []models.User{
		{
			UserID: "u1",
			Name:   "Admin User",
			Email:  "admin@company.com",
			RoleID: "admin",
			OrgID:  "org-1",
			Status: "active",
			Avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
		},
		{
			UserID: "u2",
			Name:   "Test User",
			Email:  "test@company.com",
			RoleID: "editor",
			OrgID:  "org-1",
			Status: "active",
			Avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Test",
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  users,
		"total": len(users),
	})
}

// GetCurrentUser returns the current logged-in user (mock for now)
func (h *UserHandler) GetCurrentUser(c *gin.Context) {
	// Return admin user as default current user
	user := models.User{
		UserID: "u1",
		Name:   "Admin User",
		Email:  "admin@company.com",
		RoleID: "admin",
		OrgID:  "org-1",
		Status: "active",
		Avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin",
	}

	c.JSON(http.StatusOK, user)
}

// ListRoles returns all roles
func (h *UserHandler) ListRoles(c *gin.Context) {
	// All permissions
	allPerms := []string{
		"VIEW_DASHBOARD", "VIEW_CASES", "VIEW_AUTOMATION", "VIEW_LIBRARY",
		"VIEW_DATABASE", "VIEW_HISTORY", "VIEW_ADMIN", "VIEW_SETTINGS", "VIEW_DOCS",
		"CREATE_CASE", "EDIT_CASE", "DELETE_CASE", "EXECUTE_RUN",
		"MANAGE_SCRIPTS", "MANAGE_USERS", "MANAGE_PROJECTS",
	}

	// Editor permissions (no admin/settings)
	editorPerms := []string{
		"VIEW_DASHBOARD", "VIEW_CASES", "VIEW_AUTOMATION", "VIEW_LIBRARY",
		"VIEW_DATABASE", "VIEW_HISTORY", "VIEW_DOCS",
		"CREATE_CASE", "EDIT_CASE", "DELETE_CASE", "EXECUTE_RUN", "MANAGE_SCRIPTS",
	}

	// Viewer permissions (read-only)
	viewerPerms := []string{
		"VIEW_DASHBOARD", "VIEW_CASES", "VIEW_AUTOMATION", "VIEW_LIBRARY",
		"VIEW_DATABASE", "VIEW_HISTORY", "VIEW_DOCS",
	}

	// Convert to JSONArray ([]interface{})
	toJSONArray := func(strs []string) models.JSONArray {
		result := make([]interface{}, len(strs))
		for i, s := range strs {
			result[i] = s
		}
		return result
	}

	roles := []models.Role{
		{
			RoleID:          "admin",
			Name:            "Administrator",
			Description:     "Full system access",
			PermissionCodes: toJSONArray(allPerms),
		},
		{
			RoleID:          "editor",
			Name:            "Editor",
			Description:     "Can manage test cases and execute runs",
			PermissionCodes: toJSONArray(editorPerms),
		},
		{
			RoleID:          "viewer",
			Name:            "Viewer",
			Description:     "Read-only access to dashboards and reports",
			PermissionCodes: toJSONArray(viewerPerms),
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  roles,
		"total": len(roles),
	})
}
