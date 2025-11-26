-- Sample Action Templates for Four-Layer Permission Testing
-- This file creates sample data to demonstrate the four-layer permission model:
-- Level 1: System (visible to all)
-- Level 2: Platform (visible to all if public)
-- Level 3: Organization (visible within organization)
-- Level 4: Project (visible within specific project)

-- Clean existing data (optional)
-- DELETE FROM action_templates;

-- ============================================
-- Level 1: System Templates (Built-in)
-- ============================================

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'system-http-get',
    NULL,
    NULL,
    'HTTP GET Request',
    'Generic HTTP GET request with configurable URL and headers',
    'System.Network',
    'http',
    '{"method": "GET", "url": "{{url}}", "headers": {}}',
    '[{"name": "url", "type": "string", "required": true, "description": "Target URL"}]',
    '[{"name": "response", "type": "object", "path": "response", "description": "HTTP response"}]',
    'system',
    true,
    '["http", "get", "network"]',
    '1.0.0',
    'system',
    0
);

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'system-http-post',
    NULL,
    NULL,
    'HTTP POST Request',
    'Generic HTTP POST request with body and headers',
    'System.Network',
    'http',
    '{"method": "POST", "url": "{{url}}", "headers": {"Content-Type": "application/json"}, "body": "{{body}}"}',
    '[{"name": "url", "type": "string", "required": true}, {"name": "body", "type": "object", "required": true}]',
    '[{"name": "response", "type": "object", "path": "response"}]',
    'system',
    true,
    '["http", "post", "network"]',
    '1.0.0',
    'system',
    0
);

-- ============================================
-- Level 2: Platform Templates (Shared)
-- ============================================

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'platform-health-check',
    NULL,
    NULL,
    'Health Check',
    'Standard health check endpoint for monitoring',
    'API.Monitoring',
    'http',
    '{"method": "GET", "url": "{{baseUrl}}/health", "headers": {}}',
    '[{"name": "baseUrl", "type": "string", "required": true, "description": "Base URL of the service"}]',
    '[{"name": "status", "type": "string", "path": "response.body.status"}, {"name": "uptime", "type": "number", "path": "response.body.uptime"}]',
    'platform',
    true,
    '["health", "monitoring", "api"]',
    '1.0.0',
    'platform-admin',
    0
);

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'platform-status-page',
    NULL,
    NULL,
    'Status Page Check',
    'Check service status page',
    'API.Monitoring',
    'http',
    '{"method": "GET", "url": "{{baseUrl}}/status", "headers": {}}',
    '[{"name": "baseUrl", "type": "string", "required": true}]',
    '[{"name": "services", "type": "array", "path": "response.body.services"}]',
    'platform',
    true,
    '["status", "monitoring"]',
    '1.0.0',
    'platform-admin',
    0
);

-- ============================================
-- Level 3: Organization Templates
-- ============================================

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'org-internal-login',
    'org-123',
    NULL,
    'Internal User Login',
    'Login to internal authentication system',
    'API.Authentication',
    'http',
    '{"method": "POST", "url": "https://internal.org123.com/api/auth/login", "headers": {"Content-Type": "application/json"}, "body": {"username": "{{username}}", "password": "{{password}}"}}',
    '[{"name": "username", "type": "string", "required": true}, {"name": "password", "type": "string", "required": true}]',
    '[{"name": "token", "type": "string", "path": "response.body.token"}, {"name": "userId", "type": "string", "path": "response.body.userId"}]',
    'organization',
    false,
    '["auth", "login", "internal"]',
    '1.0.0',
    'org-admin',
    0
);

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'org-sso-login',
    'org-123',
    NULL,
    'SSO Login',
    'Single Sign-On login for organization',
    'API.Authentication',
    'http',
    '{"method": "POST", "url": "https://sso.org123.com/login", "headers": {"Content-Type": "application/json"}, "body": {"ticket": "{{ticket}}"}}',
    '[{"name": "ticket", "type": "string", "required": true, "description": "SSO ticket"}]',
    '[{"name": "sessionToken", "type": "string", "path": "response.body.sessionToken"}]',
    'organization',
    false,
    '["auth", "sso", "login"]',
    '1.0.0',
    'org-admin',
    0
);

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'org-user-list',
    'org-123',
    NULL,
    'List Organization Users',
    'Get list of users in the organization',
    'API.User',
    'http',
    '{"method": "GET", "url": "https://api.org123.com/users", "headers": {"Authorization": "Bearer {{token}}"}}',
    '[{"name": "token", "type": "string", "required": true}]',
    '[{"name": "users", "type": "array", "path": "response.body.users"}]',
    'organization',
    false,
    '["user", "list"]',
    '1.0.0',
    'org-admin',
    0
);

-- ============================================
-- Level 4: Project Templates (E-Commerce)
-- ============================================

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'proj-create-order',
    'org-123',
    'proj-ecommerce',
    'Create Order',
    'Create a new order in e-commerce system',
    'API.Order',
    'http',
    '{"method": "POST", "url": "{{baseUrl}}/api/orders", "headers": {"Authorization": "Bearer {{token}}", "Content-Type": "application/json"}, "body": {"userId": "{{userId}}", "items": "{{items}}", "totalAmount": "{{totalAmount}}"}}',
    '[{"name": "userId", "type": "string", "required": true}, {"name": "items", "type": "array", "required": true}, {"name": "totalAmount", "type": "number", "required": true}]',
    '[{"name": "orderId", "type": "string", "path": "response.body.orderId"}, {"name": "status", "type": "string", "path": "response.body.status"}]',
    'project',
    false,
    '["order", "create", "ecommerce"]',
    '1.0.0',
    'dev-team',
    0
);

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'proj-get-order',
    'org-123',
    'proj-ecommerce',
    'Get Order Details',
    'Retrieve order details by ID',
    'API.Order',
    'http',
    '{"method": "GET", "url": "{{baseUrl}}/api/orders/{{orderId}}", "headers": {"Authorization": "Bearer {{token}}"}}',
    '[{"name": "orderId", "type": "string", "required": true}]',
    '[{"name": "order", "type": "object", "path": "response.body"}]',
    'project',
    false,
    '["order", "get", "ecommerce"]',
    '1.0.0',
    'dev-team',
    0
);

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'proj-payment-process',
    'org-123',
    'proj-ecommerce',
    'Process Payment',
    'Process payment for an order',
    'API.Payment',
    'http',
    '{"method": "POST", "url": "{{baseUrl}}/api/payments", "headers": {"Authorization": "Bearer {{token}}", "Content-Type": "application/json"}, "body": {"orderId": "{{orderId}}", "amount": "{{amount}}", "paymentMethod": "{{paymentMethod}}"}}',
    '[{"name": "orderId", "type": "string", "required": true}, {"name": "amount", "type": "number", "required": true}, {"name": "paymentMethod", "type": "string", "required": true}]',
    '[{"name": "transactionId", "type": "string", "path": "response.body.transactionId"}, {"name": "status", "type": "string", "path": "response.body.status"}]',
    'project',
    false,
    '["payment", "process", "ecommerce"]',
    '1.0.0',
    'dev-team',
    0
);

-- ============================================
-- Level 4: Project Templates (CRM)
-- ============================================

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'proj-create-customer',
    'org-123',
    'proj-crm',
    'Create Customer',
    'Create a new customer in CRM system',
    'API.Customer',
    'http',
    '{"method": "POST", "url": "{{baseUrl}}/api/customers", "headers": {"Authorization": "Bearer {{token}}", "Content-Type": "application/json"}, "body": {"name": "{{name}}", "email": "{{email}}", "phone": "{{phone}}"}}',
    '[{"name": "name", "type": "string", "required": true}, {"name": "email", "type": "string", "required": true}, {"name": "phone", "type": "string", "required": false}]',
    '[{"name": "customerId", "type": "string", "path": "response.body.customerId"}]',
    'project',
    false,
    '["customer", "create", "crm"]',
    '1.0.0',
    'crm-team',
    0
);

INSERT INTO action_templates (
    template_id, tenant_id, project_id, name, description, category, type,
    config_template, parameters, outputs, scope, is_public, tags, version, author, usage_count
) VALUES (
    'proj-update-lead-status',
    'org-123',
    'proj-crm',
    'Update Lead Status',
    'Update status of a sales lead',
    'API.Lead',
    'http',
    '{"method": "PUT", "url": "{{baseUrl}}/api/leads/{{leadId}}/status", "headers": {"Authorization": "Bearer {{token}}", "Content-Type": "application/json"}, "body": {"status": "{{status}}"}}',
    '[{"name": "leadId", "type": "string", "required": true}, {"name": "status", "type": "string", "required": true, "enum": ["new", "contacted", "qualified", "lost", "won"]}]',
    '[{"name": "updatedLead", "type": "object", "path": "response.body"}]',
    'project',
    false,
    '["lead", "update", "crm"]',
    '1.0.0',
    'crm-team',
    0
);

-- Summary of created templates:
-- System Level: 2 templates (HTTP GET, HTTP POST)
-- Platform Level: 2 templates (Health Check, Status Page)
-- Organization Level: 3 templates (Internal Login, SSO Login, User List)
-- Project Level (E-Commerce): 3 templates (Create Order, Get Order, Process Payment)
-- Project Level (CRM): 2 templates (Create Customer, Update Lead Status)
-- Total: 12 templates across 4 permission levels
