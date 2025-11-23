-- Migration: Add users and roles tables
-- Version: 005
-- Date: 2025-11-23

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    role_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    permission_codes TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE INDEX idx_roles_deleted_at ON roles(deleted_at);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role_id VARCHAR(50),
    org_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    avatar VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Insert default roles
INSERT OR IGNORE INTO roles (role_id, name, description, permission_codes) VALUES
('admin', 'Administrator', 'Full system access', '["VIEW_DASHBOARD","VIEW_CASES","VIEW_AUTOMATION","VIEW_LIBRARY","VIEW_DATABASE","VIEW_HISTORY","VIEW_ADMIN","VIEW_SETTINGS","VIEW_DOCS","CREATE_CASE","EDIT_CASE","DELETE_CASE","EXECUTE_RUN","MANAGE_SCRIPTS","MANAGE_USERS","MANAGE_PROJECTS"]'),
('editor', 'Editor', 'Can manage test cases and execute runs', '["VIEW_DASHBOARD","VIEW_CASES","VIEW_AUTOMATION","VIEW_LIBRARY","VIEW_DATABASE","VIEW_HISTORY","VIEW_DOCS","CREATE_CASE","EDIT_CASE","DELETE_CASE","EXECUTE_RUN","MANAGE_SCRIPTS"]'),
('viewer', 'Viewer', 'Read-only access to dashboards and reports', '["VIEW_DASHBOARD","VIEW_CASES","VIEW_AUTOMATION","VIEW_LIBRARY","VIEW_DATABASE","VIEW_HISTORY","VIEW_DOCS"]');

-- Insert default admin user
INSERT OR IGNORE INTO users (user_id, name, email, role_id, org_id, status, avatar) VALUES
('u1', 'Admin User', 'admin@company.com', 'admin', 'org-1', 'active', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin');
