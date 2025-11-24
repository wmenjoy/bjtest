-- Migration 005: Add Action Templates
-- This migration creates the action_templates table for reusable action definitions

CREATE TABLE IF NOT EXISTS action_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(100),

    -- Basic Info
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,

    -- Template Configuration
    config_template TEXT,  -- JSON
    parameters TEXT,       -- JSON Array
    outputs TEXT,          -- JSON Array

    -- Scope and Permissions
    scope VARCHAR(20) NOT NULL,
    is_public BOOLEAN DEFAULT 0,

    -- Metadata
    tags TEXT,             -- JSON Array
    version VARCHAR(50),
    author VARCHAR(255),

    -- Statistics
    usage_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,

    -- Constraints
    CONSTRAINT unique_template_id UNIQUE (template_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_action_templates_tenant_id ON action_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_action_templates_category ON action_templates(category);
CREATE INDEX IF NOT EXISTS idx_action_templates_type ON action_templates(type);
CREATE INDEX IF NOT EXISTS idx_action_templates_scope ON action_templates(scope);
CREATE INDEX IF NOT EXISTS idx_action_templates_deleted_at ON action_templates(deleted_at);
CREATE INDEX IF NOT EXISTS idx_action_templates_is_public ON action_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_action_templates_usage_count ON action_templates(usage_count);

-- Insert system-level built-in templates
INSERT INTO action_templates (template_id, name, description, category, type, scope, is_public, version, author, config_template, parameters, outputs) VALUES
('action-http-get', 'HTTP GET Request', 'Standard HTTP GET request with configurable headers and query parameters', 'Network', 'http', 'system', 1, '1.0.0', 'system',
 '{"method":"GET","url":"{{url}}","headers":{"Content-Type":"application/json"},"queryParams":"{{queryParams}}"}',
 '[{"name":"url","type":"string","required":true,"description":"Target URL","default":""},{"name":"queryParams","type":"object","required":false,"description":"Query parameters","default":{}}]',
 '[{"name":"statusCode","path":"response.statusCode"},{"name":"body","path":"response.body"},{"name":"headers","path":"response.headers"}]'),

('action-http-post', 'HTTP POST Request', 'Standard HTTP POST request with JSON body', 'Network', 'http', 'system', 1, '1.0.0', 'system',
 '{"method":"POST","url":"{{url}}","headers":{"Content-Type":"application/json"},"body":"{{body}}"}',
 '[{"name":"url","type":"string","required":true,"description":"Target URL","default":""},{"name":"body","type":"object","required":true,"description":"Request body","default":{}}]',
 '[{"name":"statusCode","path":"response.statusCode"},{"name":"body","path":"response.body"},{"name":"headers","path":"response.headers"}]'),

('action-http-put', 'HTTP PUT Request', 'Standard HTTP PUT request for updating resources', 'Network', 'http', 'system', 1, '1.0.0', 'system',
 '{"method":"PUT","url":"{{url}}","headers":{"Content-Type":"application/json"},"body":"{{body}}"}',
 '[{"name":"url","type":"string","required":true,"description":"Target URL","default":""},{"name":"body","type":"object","required":true,"description":"Request body","default":{}}]',
 '[{"name":"statusCode","path":"response.statusCode"},{"name":"body","path":"response.body"},{"name":"headers","path":"response.headers"}]'),

('action-http-delete', 'HTTP DELETE Request', 'Standard HTTP DELETE request for removing resources', 'Network', 'http', 'system', 1, '1.0.0', 'system',
 '{"method":"DELETE","url":"{{url}}","headers":{"Content-Type":"application/json"}}',
 '[{"name":"url","type":"string","required":true,"description":"Target URL","default":""}]',
 '[{"name":"statusCode","path":"response.statusCode"},{"name":"body","path":"response.body"}]'),

('action-command-exec', 'Execute Command', 'Run shell command with timeout control', 'System', 'command', 'system', 1, '1.0.0', 'system',
 '{"command":"{{command}}","timeout":30000,"workingDir":"{{workingDir}}"}',
 '[{"name":"command","type":"string","required":true,"description":"Command to execute","default":""},{"name":"workingDir","type":"string","required":false,"description":"Working directory","default":""}]',
 '[{"name":"stdout","path":"result.stdout"},{"name":"stderr","path":"result.stderr"},{"name":"exitCode","path":"result.exitCode"}]'),

('action-wait-delay', 'Wait/Delay', 'Pause execution for specified duration', 'Control', 'wait', 'system', 1, '1.0.0', 'system',
 '{"duration":"{{duration}}"}',
 '[{"name":"duration","type":"number","required":true,"description":"Wait duration in milliseconds","default":1000}]',
 '[{"name":"elapsed","path":"result.elapsed"}]'),

('action-validate-json', 'Validate JSON', 'Validate JSON structure against schema', 'Validation', 'validation', 'system', 1, '1.0.0', 'system',
 '{"data":"{{data}}","schema":"{{schema}}"}',
 '[{"name":"data","type":"object","required":true,"description":"JSON data to validate","default":{}},{"name":"schema","type":"object","required":true,"description":"JSON schema","default":{}}]',
 '[{"name":"isValid","path":"result.isValid"},{"name":"errors","path":"result.errors"}]'),

('action-extract-value', 'Extract Value', 'Extract value from JSON using JSONPath', 'Data', 'extraction', 'system', 1, '1.0.0', 'system',
 '{"source":"{{source}}","path":"{{path}}"}',
 '[{"name":"source","type":"object","required":true,"description":"Source JSON object","default":{}},{"name":"path","type":"string","required":true,"description":"JSONPath expression","default":"$"}]',
 '[{"name":"value","path":"result.value"}]'),

('action-set-variable', 'Set Variable', 'Set or update workflow variable', 'Data', 'variable', 'system', 1, '1.0.0', 'system',
 '{"name":"{{name}}","value":"{{value}}"}',
 '[{"name":"name","type":"string","required":true,"description":"Variable name","default":""},{"name":"value","type":"any","required":true,"description":"Variable value","default":""}]',
 '[{"name":"previous","path":"result.previous"},{"name":"current","path":"result.current"}]'),

('action-conditional-branch', 'Conditional Branch', 'Execute based on condition evaluation', 'Control', 'conditional', 'system', 1, '1.0.0', 'system',
 '{"condition":"{{condition}}","operator":"{{operator}}","expected":"{{expected}}"}',
 '[{"name":"condition","type":"any","required":true,"description":"Value to evaluate","default":""},{"name":"operator","type":"string","required":true,"description":"Comparison operator (eq, ne, gt, lt, contains)","default":"eq"},{"name":"expected","type":"any","required":true,"description":"Expected value","default":""}]',
 '[{"name":"result","path":"result.matched"},{"name":"actual","path":"result.actual"}]');
