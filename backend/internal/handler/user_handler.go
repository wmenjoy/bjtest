package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"test-management-service/internal/models"
	"test-management-service/internal/repository"
)

// UserHandler handles user-related requests
type UserHandler struct {
	roleRepo repository.RoleRepository
}

// NewUserHandler creates a new user handler
func NewUserHandler(roleRepo repository.RoleRepository) *UserHandler {
	return &UserHandler{
		roleRepo: roleRepo,
	}
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

// ListRoles returns all roles from database
func (h *UserHandler) ListRoles(c *gin.Context) {
	roles, err := h.roleRepo.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch roles from database",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":  roles,
		"total": len(roles),
	})
}
