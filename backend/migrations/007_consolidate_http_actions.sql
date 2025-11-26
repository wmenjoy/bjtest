-- Migration: Consolidate 4 separate HTTP actions into 1 unified HTTP Request action
-- Created: 2025-11-24
-- Reason: User feedback - "一个HTTP Action为什么整这么多个Action？"

BEGIN TRANSACTION;

-- Step 1: Delete the 4 separate HTTP action templates
DELETE FROM action_templates WHERE template_id IN (
    'action-http-get',
    'action-http-post',
    'action-http-put',
    'action-http-delete'
);

-- Step 2: Create unified HTTP Request template
INSERT INTO action_templates (
    template_id,
    tenant_id,
    name,
    description,
    category,
    type,
    config_template,
    parameters,
    outputs,
    scope,
    is_public,
    tags,
    version,
    author,
    usage_count,
    created_at,
    updated_at
) VALUES (
    'action-http-request',
    NULL,
    'HTTP Request',
    'Send REST API requests (GET, POST, PUT, DELETE, PATCH). Supports custom headers, query parameters, and JSON request body.',
    'Network',
    'http',
    '{"method":"{{method}}","url":"{{url}}","headers":"{{headers}}","queryParams":"{{queryParams}}","body":"{{body}}"}',
    '[
        {
            "name": "method",
            "type": "string",
            "required": true,
            "description": "HTTP method (GET, POST, PUT, DELETE, PATCH)",
            "default": "GET",
            "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"]
        },
        {
            "name": "url",
            "type": "string",
            "required": true,
            "description": "Target URL for the HTTP request",
            "default": ""
        },
        {
            "name": "headers",
            "type": "object",
            "required": false,
            "description": "HTTP headers as key-value pairs",
            "default": {"Content-Type": "application/json"}
        },
        {
            "name": "queryParams",
            "type": "object",
            "required": false,
            "description": "Query parameters as key-value pairs",
            "default": {}
        },
        {
            "name": "body",
            "type": "object",
            "required": false,
            "description": "Request body (for POST/PUT/PATCH)",
            "default": {}
        }
    ]',
    '[
        {
            "name": "statusCode",
            "path": "response.statusCode",
            "description": "HTTP response status code"
        },
        {
            "name": "body",
            "path": "response.body",
            "description": "Response body"
        },
        {
            "name": "headers",
            "path": "response.headers",
            "description": "Response headers"
        }
    ]',
    'system',
    1,
    '["http", "rest", "api", "network"]',
    '1.0.0',
    'System',
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

COMMIT;
