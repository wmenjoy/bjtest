# Action Template Fixes Summary

**Date**: 2025-11-24
**Context**: User feedback - "一个HTTP Action为什么整这么多个Action？原先Action的详情页，测试页怎么也没有了？"

## Issue 1: Missing Action Details and Test Page

### Problem
- Action template cards had `cursor-pointer` CSS but NO onClick handler
- ActionDetails component existed (with Overview/Source/Test tabs) but was not accessible
- ActionTestBench component existed but couldn't be reached

### Root Cause
- Template cards at line 292 in ActionLibrary.tsx had no onClick event
- Backend ActionTemplate format needed conversion to frontend ActionDef format

### Solution
**File**: `/Users/liujinliang/workspace/ai/bjtest/NextTestPlatformUI/components/ActionLibrary.tsx`

1. **Added conversion function** (lines 185-199):
```typescript
const convertTemplateToActionDef = (template: ActionTemplate): ActionDef => {
    return {
        id: template.templateId,
        name: template.name,
        description: template.description,
        type: ScriptType.PYTHON,
        category: template.category || 'General',
        isBuiltIn: template.scope === 'system',
        parameters: template.parameters || [],
        outputs: template.outputs || [],
        content: template.sourceCode || '',
        testExamples: []
    };
};
```

2. **Added handler function** (lines 201-204):
```typescript
const handleViewTemplate = (template: ActionTemplate) => {
    const actionDef = convertTemplateToActionDef(template);
    setViewingAction(actionDef);
};
```

3. **Added onClick to template cards** (line 315):
```typescript
<div
    key={template.templateId}
    onClick={() => handleViewTemplate(template)}  // ← ADDED
    className="bg-white p-5 rounded-xl ... cursor-pointer"
>
```

### Result
✅ Clicking any Action template now opens ActionDetails modal
✅ Modal shows 3 tabs: Overview (inputs/outputs), Source (code), Test (ActionTestBench)
✅ Users can test actions directly from the Action Library

---

## Issue 2: Too Many HTTP Actions

### Problem
- Backend had 4 separate HTTP action templates:
  - HTTP GET Request
  - HTTP POST Request
  - HTTP PUT Request
  - HTTP DELETE Request
- User questioned: "一个HTTP Action为什么整这么多个Action？"
- Original design in `types.ts` showed unified approach with method as parameter

### Root Cause
- Migration 005 created separate templates for each HTTP method
- This violates DRY principle and creates unnecessary complexity

### Solution
**File**: `/Users/liujinliang/workspace/ai/bjtest/nextest-platform/migrations/007_consolidate_http_actions.sql`

1. **Deleted 4 separate templates**:
```sql
DELETE FROM action_templates WHERE template_id IN (
    'action-http-get',
    'action-http-post',
    'action-http-put',
    'action-http-delete'
);
```

2. **Created unified HTTP Request template**:
```sql
INSERT INTO action_templates (
    template_id: 'action-http-request',
    name: 'HTTP Request',
    description: 'Send REST API requests (GET, POST, PUT, DELETE, PATCH)...',
    parameters: [
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
            "description": "Target URL for the HTTP request"
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
            "description": "Query parameters as key-value pairs"
        },
        {
            "name": "body",
            "type": "object",
            "required": false,
            "description": "Request body (for POST/PUT/PATCH)"
        }
    ]
)
```

### Result
✅ Reduced from 10 system templates to 7
✅ Single unified "HTTP Request" action with method parameter
✅ Supports GET, POST, PUT, DELETE, PATCH via dropdown
✅ Matches original design in `types.ts`

---

## Current System Templates

After consolidation, the database now has **7 well-organized system templates**:

### Control (2)
- Conditional Branch
- Wait/Delay

### Data (2)
- Extract Value
- Set Variable

### Network (1)
- **HTTP Request** ← Unified from 4 separate actions ✅

### System (1)
- Execute Command

### Validation (1)
- Validate JSON

---

## Testing Instructions

1. **Frontend**: http://localhost:8081
2. **Navigate to**: Action Library page
3. **Verify Fix #1**: Click any Action template card
   - Should open ActionDetails modal
   - Should show Overview/Source/Test tabs
   - Test tab should load ActionTestBench

4. **Verify Fix #2**: Check Action template count
   - Should show 7 templates instead of 10
   - HTTP actions should show single "HTTP Request" card
   - Clicking it should show method parameter with enum dropdown

---

## Files Changed

### Frontend
- `/Users/liujinliang/workspace/ai/bjtest/NextTestPlatformUI/components/ActionLibrary.tsx`
  - Added `convertTemplateToActionDef()` function
  - Added `handleViewTemplate()` function
  - Added onClick handler to template cards

### Backend
- `/Users/liujinliang/workspace/ai/bjtest/nextest-platform/migrations/007_consolidate_http_actions.sql`
  - New migration to consolidate HTTP actions
  - Deleted 4 separate HTTP templates
  - Created 1 unified HTTP Request template

---

## Issue 3: JSON Parsing Error (500 Error)

### Problem
- API endpoint `/api/action-templates/accessible` returned 500 Internal Server Error
- Error message: `sql: Scan error on column index 7, name "config_template": invalid character '{' looking for beginning of object key string`

### Root Cause
- The unified HTTP Request template's `config_template` field had invalid JSON syntax
- Variable placeholders like `{{headers}}`, `{{queryParams}}`, `{{body}}` were not enclosed in quotes
- Invalid: `"headers":{{headers}}`
- Valid: `"headers":"{{headers}}"`

### Solution
**Database Fix**:
```sql
UPDATE action_templates
SET config_template = '{"method":"{{method}}","url":"{{url}}","headers":"{{headers}}","queryParams":"{{queryParams}}","body":"{{body}}"}'
WHERE template_id = 'action-http-request';
```

**Migration File Updated**: `007_consolidate_http_actions.sql` - Fixed to use correct JSON syntax

**Backend Restart**: Killed old process (PID 2928) and restarted with PID 18995

### Result
✅ API now returns 200 OK with 7 templates
✅ HTTP Request template has correct JSON structure
✅ All 5 parameters properly defined (method with enum, url, headers, queryParams, body)

---

## Verification Results

### API Test (curl)
```bash
$ curl http://localhost:8090/api/action-templates/accessible?limit=10
{
  "data": [
    {
      "name": "HTTP Request",
      "category": "Network",
      "scope": "system",
      "parameters": [
        {"name": "method", "type": "string", "enum": ["GET","POST","PUT","DELETE","PATCH"]},
        {"name": "url", "type": "string"},
        {"name": "headers", "type": "object"},
        {"name": "queryParams", "type": "object"},
        {"name": "body", "type": "object"}
      ]
    },
    ... (6 more templates)
  ],
  "total": 7
}
```

### Database Verification
```sql
SELECT template_id, name, category FROM action_templates;
-- Returns 7 templates:
-- action-http-request      | HTTP Request        | Network
-- action-conditional-branch| Conditional Branch  | Control
-- action-wait-delay        | Wait/Delay          | Control
-- action-extract-value     | Extract Value       | Data
-- action-set-variable      | Set Variable        | Data
-- action-command-exec      | Execute Command     | System
-- action-validate-json     | Validate JSON       | Validation
```

---

## User Feedback Addressed

1. ✅ **"原先Action的详情页，测试页怎么也没有了？"**
   → Fixed: Details and test pages now accessible via onClick handler

2. ✅ **"一个HTTP Action为什么整这么多个Action？"**
   → Fixed: Consolidated 4 HTTP actions into 1 unified template with method parameter

3. ✅ **500 Error on action-templates API**
   → Fixed: JSON syntax error in config_template field, server restarted
