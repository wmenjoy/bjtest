-- 005_add_multi_tenancy.sql
-- 添加多租户和项目支持
-- 创建时间: 2025-11-22
-- 版本: 005

-- ============================================================================
-- 1. 创建租户表 (tenants)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- 租户配置
    settings TEXT,

    -- 配额限制
    max_projects INTEGER DEFAULT 10,
    max_users INTEGER DEFAULT 50,
    max_test_cases INTEGER DEFAULT 1000,

    -- 联系信息
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),

    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_tenants_tenant_id ON tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_deleted_at ON tenants(deleted_at);

-- ============================================================================
-- 2. 创建项目表 (projects)
-- ============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id VARCHAR(100) NOT NULL UNIQUE,
    tenant_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- 项目配置
    settings TEXT,

    -- 项目信息
    owner_id VARCHAR(100),
    repository_url VARCHAR(500),

    -- 统计信息
    test_case_count INTEGER DEFAULT 0,
    test_group_count INTEGER DEFAULT 0,

    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,

    -- 外键约束
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_projects_project_id ON projects(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_deleted_at ON projects(deleted_at);

-- ============================================================================
-- 3. 修改现有表，添加租户和项目字段
-- ============================================================================

-- 3.1 test_groups 表
ALTER TABLE test_groups ADD COLUMN tenant_id VARCHAR(100);
ALTER TABLE test_groups ADD COLUMN project_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_test_groups_tenant_id ON test_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_test_groups_project_id ON test_groups(project_id);
CREATE INDEX IF NOT EXISTS idx_test_groups_tenant_project ON test_groups(tenant_id, project_id);

-- 3.2 test_cases 表
ALTER TABLE test_cases ADD COLUMN tenant_id VARCHAR(100);
ALTER TABLE test_cases ADD COLUMN project_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_test_cases_tenant_id ON test_cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_project_id ON test_cases(project_id);
CREATE INDEX IF NOT EXISTS idx_test_cases_tenant_project ON test_cases(tenant_id, project_id);

-- 3.3 test_results 表
ALTER TABLE test_results ADD COLUMN tenant_id VARCHAR(100);
ALTER TABLE test_results ADD COLUMN project_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_test_results_tenant_id ON test_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_test_results_project_id ON test_results(project_id);

-- 3.4 test_runs 表
ALTER TABLE test_runs ADD COLUMN tenant_id VARCHAR(100);
ALTER TABLE test_runs ADD COLUMN project_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_test_runs_tenant_id ON test_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_test_runs_project_id ON test_runs(project_id);

-- 3.5 workflows 表
ALTER TABLE workflows ADD COLUMN tenant_id VARCHAR(100);
ALTER TABLE workflows ADD COLUMN project_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_workflows_tenant_id ON workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_project_id ON workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant_project ON workflows(tenant_id, project_id);

-- 3.6 workflow_runs 表
ALTER TABLE workflow_runs ADD COLUMN tenant_id VARCHAR(100);
ALTER TABLE workflow_runs ADD COLUMN project_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_tenant_id ON workflow_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_project_id ON workflow_runs(project_id);

-- 3.7 environments 表
ALTER TABLE environments ADD COLUMN tenant_id VARCHAR(100);
ALTER TABLE environments ADD COLUMN project_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_environments_tenant_id ON environments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_environments_project_id ON environments(project_id);

-- ============================================================================
-- 4. 创建默认租户和项目（用于向后兼容）
-- ============================================================================

INSERT INTO tenants (tenant_id, name, display_name, description, status)
VALUES ('default', 'Default Tenant', 'Default Tenant', 'Default tenant for backward compatibility', 'active');

INSERT INTO projects (project_id, tenant_id, name, display_name, description, status)
VALUES ('default', 'default', 'Default Project', 'Default Project', 'Default project for backward compatibility', 'active');

-- ============================================================================
-- 5. 更新现有数据，设置默认租户和项目
-- ============================================================================

UPDATE test_groups SET tenant_id = 'default', project_id = 'default' WHERE tenant_id IS NULL;
UPDATE test_cases SET tenant_id = 'default', project_id = 'default' WHERE tenant_id IS NULL;
UPDATE test_results SET tenant_id = 'default', project_id = 'default' WHERE tenant_id IS NULL;
UPDATE test_runs SET tenant_id = 'default', project_id = 'default' WHERE tenant_id IS NULL;
UPDATE workflows SET tenant_id = 'default', project_id = 'default' WHERE tenant_id IS NULL;
UPDATE workflow_runs SET tenant_id = 'default', project_id = 'default' WHERE tenant_id IS NULL;
UPDATE environments SET tenant_id = 'default', project_id = 'default' WHERE tenant_id IS NULL;

-- ============================================================================
-- 6. 创建租户成员表 (tenant_members) - 可选
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',

    -- 权限
    permissions TEXT,

    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,

    -- 外键约束
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE,

    -- 唯一约束
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_user_id ON tenant_members(user_id);

-- ============================================================================
-- 7. 创建项目成员表 (project_members) - 可选
-- ============================================================================

CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',

    -- 权限
    permissions TEXT,

    -- 时间戳
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,

    -- 外键约束
    FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE,

    -- 唯一约束
    UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);

-- ============================================================================
-- 结束
-- ============================================================================
