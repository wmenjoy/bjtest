
import { TestFolder, Script, ScriptType, TestCase, Priority, Status, TestRun, ExecutionStatus, Workflow, NodeType, User, Role, Organization, Environment, Project, Permission } from '../types';

export const SYSTEM_PERMISSIONS: Permission[] = [
    // Menu Permissions
    { code: 'VIEW_DASHBOARD', name: 'View Dashboard', category: 'Menu', description: 'Access the main dashboard' },
    { code: 'VIEW_APIS', name: 'View API Center', category: 'Menu', description: 'Access the API management center' },
    { code: 'VIEW_CASES', name: 'View Test Repository', category: 'Menu', description: 'Access test cases and folders' },
    { code: 'VIEW_AUTOMATION', name: 'View Automation Lab', category: 'Menu', description: 'Access the workflow and script editor' },
    { code: 'VIEW_LIBRARY', name: 'View Action Library', category: 'Menu', description: 'Access the library of actions and templates' },
    { code: 'VIEW_DATABASE', name: 'View Database', category: 'Menu', description: 'Access the data schema manager' },
    { code: 'VIEW_HISTORY', name: 'View History', category: 'Menu', description: 'Access execution history' },
    { code: 'VIEW_ADMIN', name: 'View Admin Portal', category: 'Menu', description: 'Access user and system management' },
    { code: 'VIEW_SETTINGS', name: 'View Settings', category: 'Menu', description: 'Access system configuration' },
    { code: 'VIEW_DOCS', name: 'View Documentation', category: 'Menu', description: 'Access project documentation hub' },

    // Action Permissions
    { code: 'CREATE_CASE', name: 'Create Test Case', category: 'Action', description: 'Create new test cases' },
    { code: 'EDIT_CASE', name: 'Edit Test Case', category: 'Action', description: 'Modify existing test cases' },
    { code: 'DELETE_CASE', name: 'Delete Test Case', category: 'Action', description: 'Remove test cases' },
    { code: 'EXECUTE_RUN', name: 'Execute Tests', category: 'Action', description: 'Run tests manually or via automation' },
    { code: 'MANAGE_SCRIPTS', name: 'Manage Scripts', category: 'Action', description: 'Create, edit, or delete automation scripts' },
    { code: 'MANAGE_USERS', name: 'Manage Users', category: 'System', description: 'Create and edit user accounts' },
    { code: 'MANAGE_PROJECTS', name: 'Manage Projects', category: 'System', description: 'Create and edit projects' },
];

export const MOCK_ORGS: Organization[] = [
    { id: 'org-1', name: 'Acme Corp Global', type: 'department' },
    { id: 'org-2', name: 'Startup Inc', type: 'department' },
];

export const MOCK_PROJECTS: Project[] = [
    { id: 'proj-1', orgId: 'org-1', name: 'E-Commerce Core', key: 'ECC', description: 'Main platform backend and frontend tests' },
    { id: 'proj-2', orgId: 'org-1', name: 'Mobile App', key: 'MOB', description: 'iOS and Android automation' },
    { id: 'proj-3', orgId: 'org-2', name: 'Website MVP', key: 'WEB', description: 'Marketing site tests' },
];

export const MOCK_FOLDERS: TestFolder[] = [
    { id: 'f-1', projectId: 'proj-1', name: 'Checkout Module', parentId: 'root', type: 'module' },
    { id: 'f-2', projectId: 'proj-1', name: 'Authentication', parentId: 'root', type: 'module' },
    { id: 'f-3', projectId: 'proj-1', name: 'Payment Gateway', parentId: 'f-1', type: 'folder' },
    { id: 'f-4', projectId: 'proj-2', name: 'Login Screen', parentId: 'root', type: 'module' },
];

export const MOCK_SCRIPTS: Script[] = [
    { 
        id: 'sc-1',
        projectId: 'proj-1',
        name: 'Setup Test Database', 
        description: 'Initializes the testing database environment. It clears existing user data and seeds the table with a default admin user for regression testing.',
        type: ScriptType.PYTHON, 
        content: `import db_connector
import time

def run(env_config):
    print("Connecting to DB at " + env_config['host'])
    # Simulation of DB work
    time.sleep(1)
    user_id = db_connector.seed_user("admin", "password123")
    print(f"Seeded user with ID: {user_id}")
    return {"userId": user_id, "status": "ready"}`, 
        parameters: [
            { name: 'target_env', type: 'string', description: 'Environment (dev/staging)', defaultValue: 'dev' }
        ], 
        outputs: [
            { name: 'userId', type: 'string', description: 'ID of the created test user' },
            { name: 'status', type: 'string', description: 'Database readiness status' }
        ],
        isTemplate: false, 
        tags: ['Database', 'Setup', 'Python'], 
        lastModified: new Date().toISOString(),
        testExamples: [
            { id: 'te-1', name: 'Dev Environment', inputValues: { target_env: 'dev' } },
            { id: 'te-2', name: 'Staging Environment', inputValues: { target_env: 'staging' } }
        ]
    },
    { 
        id: 'sc-2', 
        projectId: 'proj-1',
        name: 'Clean Temp Files',
        description: 'Maintenance script to clear temporary log files from the server /tmp directory to prevent disk fullness during high-load tests.',
        type: ScriptType.SHELL, 
        content: 'rm -rf /tmp/logs/*\necho "Logs cleared"', 
        parameters: [
            { name: 'path', type: 'string', description: 'Directory to clean', defaultValue: '/tmp/logs' }
        ], 
        outputs: [
             { name: 'freed_space', type: 'string', description: 'Amount of space freed (MB)' }
        ],
        isTemplate: false, 
        tags: ['System', 'Maintenance'], 
        lastModified: new Date().toISOString(),
        testExamples: [
            { id: 'te-default', name: 'Default Path', inputValues: { path: '/tmp/logs' } }
        ]
    },
    {
        id: 'tpl-1',
        projectId: 'proj-1',
        name: 'REST API Validator',
        description: 'A comprehensive template for validating RESTful API endpoints. Checks status codes, response time, and payload structure. Use this for any API integration tests.',
        type: ScriptType.PYTHON,
        content: `import requests
import time

def validate_endpoint(url, method, expected_status):
    print(f"Testing {method} {url}...")
    start = time.time()
    try:
        # Simulated request
        # resp = requests.request(method, url)
        
        duration = time.time() - start
        print(f"Status: {expected_status}, Time: {duration:.2f}s")
        
        return {"success": True, "payload": {"id": 1}, "duration": duration}
    except Exception as e:
        return {"success": False, "error": str(e)}`,
        parameters: [
            { name: 'url', type: 'string', description: 'Target API Endpoint', defaultValue: 'https://api.example.com/health' },
            { name: 'method', type: 'string', description: 'HTTP Method (GET, POST, etc)', defaultValue: 'GET' },
            { name: 'expected_status', type: 'number', description: 'Expected HTTP Status Code', defaultValue: '200' }
        ],
        outputs: [
            { name: 'success', type: 'boolean', description: 'True if validation passed' },
            { name: 'payload', type: 'object', description: 'Response body JSON' },
            { name: 'duration', type: 'number', description: 'Response time in seconds' }
        ],
        isTemplate: true,
        tags: ['API', 'Validation', 'Python'],
        lastModified: new Date().toISOString(),
        testExamples: [
            { id: 'te-1', name: 'Health Check', inputValues: { url: 'https://api.test/health', method: 'GET', expected_status: '200' } },
            { id: 'te-2', name: 'Create User 201', inputValues: { url: 'https://api.test/users', method: 'POST', expected_status: '201' } }
        ]
    },
    {
        id: 'tpl-2',
        projectId: 'proj-1',
        name: 'Data ETL Transformer',
        description: 'Template for processing raw JSON data arrays into simplified object structures for reporting. Useful for transforming API responses before asserting.',
        type: ScriptType.JAVASCRIPT,
        content: `// Transform input JSON array to simplified format
function transform(rawData) {
    try {
        const data = JSON.parse(rawData);
        if (!Array.isArray(data)) throw new Error("Input must be an array");
        
        const result = data.map(item => ({
            id: item.userId || item.id,
            fullName: \`\${item.firstName} \${item.lastName}\`,
            isActive: item.status === 'active'
        }));
        
        console.log(\`Processed \${result.length} records.\`);
        return { count: result.length, data: result };
    } catch (e) {
        console.error(e.message);
        return { count: 0, error: e.message };
    }
}`,
        parameters: [
            { name: 'rawData', type: 'string', description: 'JSON Array String', defaultValue: '[{"id":1, "firstName":"John", "lastName":"Doe", "status":"active"}]' }
        ],
        outputs: [
            { name: 'count', type: 'number', description: 'Number of processed records' },
            { name: 'data', type: 'object', description: 'Transformed array' }
        ],
        isTemplate: true,
        tags: ['Data', 'ETL', 'JavaScript'],
        lastModified: new Date().toISOString(),
        testExamples: [
            { id: 'te-1', name: 'Simple List', inputValues: { rawData: '[{"id":1, "firstName":"A", "lastName":"B", "status":"active"}]' } }
        ]
    },
    {
        id: 'tpl-3',
        projectId: 'proj-1',
        name: 'Log Pattern Analyzer',
        description: 'Shell script template to scan specific log files for error patterns and report critical status. Can be scheduled to run periodically.',
        type: ScriptType.SHELL,
        content: `#!/bin/bash
# Grep for error patterns in log file
LOG_FILE=$1
PATTERN=$2

echo "Scanning $LOG_FILE for '$PATTERN'..."
# Simulating grep logic
echo "Found 5 occurrences."

if [ 5 -gt 0 ]; then
  echo "status=CRITICAL"
  echo "found_count=5"
else
  echo "status=OK"
  echo "found_count=0"
fi`,
        parameters: [
            { name: 'log_file', type: 'string', description: 'Path to log file', defaultValue: '/var/log/app.log' },
            { name: 'pattern', type: 'string', description: 'Error pattern regex', defaultValue: 'ERROR' }
        ],
        outputs: [
            { name: 'status', type: 'string', description: 'OK or CRITICAL' },
            { name: 'found_count', type: 'number', description: 'Number of matches' }
        ],
        isTemplate: true,
        tags: ['System', 'Monitoring', 'Bash'],
        lastModified: new Date().toISOString(),
        testExamples: [
            { id: 'te-1', name: 'Check Errors', inputValues: { log_file: '/var/log/nginx/error.log', pattern: '500 Internal Server Error' } }
        ]
    }
];

export const MOCK_CASES: TestCase[] = [
  {
    id: 'TC-101',
    projectId: 'proj-1',
    title: 'Verify Login with Valid Credentials',
    description: 'Ensure user can login with correct username and password',
    priority: Priority.CRITICAL,
    status: Status.ACTIVE,
    variables: {
        testUser: 'admin_01'
    },
    preconditions: [
        'User account exists in DB',
        'System is accessible'
    ],
    steps: [
        { id: 's1', summary: 'Navigate to Login', instruction: 'Navigate to {{baseUrl}}/login', expectedResult: 'Login form displayed' },
        { id: 's2', summary: 'Enter User', instruction: 'Enter valid username "{{testUser}}"', expectedResult: 'Field populated' },
        { id: 's3', summary: 'Enter Password', instruction: 'Enter valid password', expectedResult: 'Field populated (masked)' },
        { id: 's4', summary: 'Submit Login', instruction: 'Click Login button', expectedResult: 'Redirected to Dashboard' }
    ],
    tags: ['Auth', 'Smoke'],
    folderId: 'f-2',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'TC-102',
    projectId: 'proj-1',
    title: 'Verify Cart Calculation',
    description: 'Check if total price updates when items are added',
    priority: Priority.HIGH,
    status: Status.ACTIVE,
    variables: {
        itemA_price: '10.00',
        itemB_price: '20.00'
    },
    steps: [
        { id: 's1', summary: 'Add Item A', instruction: 'Add Item A (${{itemA_price}}) to cart', expectedResult: 'Cart count: 1', linkedScriptId: 'sc-1', outputMapping: { 'testUserId': 'currentUser' } },
        { id: 's2', summary: 'Add Item B', instruction: 'Add Item B (${{itemB_price}}) to cart', expectedResult: 'Cart count: 2', condition: 'currentUser != null' },
        { id: 's3', summary: 'Check Total', instruction: 'View Cart', expectedResult: 'Total should be $30' }
    ],
    tags: ['E-commerce'],
    folderId: 'f-1',
    lastUpdated: new Date().toISOString()
  },
  {
      id: 'TC-104',
      projectId: 'proj-1',
      title: 'Bulk User Import Verification',
      description: 'Read from a dataset and process each user',
      priority: Priority.MEDIUM,
      status: Status.ACTIVE,
      variables: {
          userList: '[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"},{"id":3,"name":"Charlie"}]'
      },
      steps: [
          { id: 's1', summary: 'Initialize Import', instruction: 'Open import wizard', expectedResult: 'Wizard Open' },
          { 
              id: 's2', 
              summary: 'Process Users', 
              instruction: 'Import each user from file', 
              expectedResult: 'All users processed', 
              linkedScriptId: 'sc-4', 
              loopOver: '{{userList}}', 
              loopVar: 'user',
              parameterValues: { 'user': '{{user}}' }
          },
          { id: 's3', summary: 'Verify Count', instruction: 'Check total imported users', expectedResult: 'Count matches file length' }
      ],
      tags: ['Data-Driven'],
      folderId: 'f-2',
      lastUpdated: new Date().toISOString()
  },
  {
    id: 'TC-103',
    projectId: 'proj-1',
    title: 'Automated Checkout Regression',
    description: 'Full E2E browser test for checkout process',
    priority: Priority.CRITICAL,
    status: Status.ACTIVE,
    steps: [], // Workflow driven
    folderId: 'f-3',
    tags: ['Automated'],
    lastUpdated: new Date().toISOString(),
    linkedWorkflowId: 'wf-2',
    automationType: 'WORKFLOW'
  },
  // Project 2 Case
  {
    id: 'TC-201',
    projectId: 'proj-2',
    title: 'Mobile Login Screen',
    description: 'Verify iOS Login rendering',
    priority: Priority.HIGH,
    status: Status.ACTIVE,
    steps: [],
    folderId: 'f-4',
    tags: ['Mobile'],
    lastUpdated: new Date().toISOString(),
    automationType: 'MANUAL'
  }
];

export const MOCK_RUNS: TestRun[] = [
    { id: 'r1', projectId: 'proj-1', name: 'Run: TC-101', caseId: 'TC-101', executedAt: new Date(Date.now() - 86400000).toISOString(), status: ExecutionStatus.PASSED, logs: ['> Step 1 Passed', '> Step 2 Passed'], environmentName: 'Staging' },
    { id: 'r2', projectId: 'proj-1', name: 'Run: TC-102', caseId: 'TC-102', executedAt: new Date().toISOString(), status: ExecutionStatus.FAILED, notes: 'Calculation off by $1', logs: ['> Step 1 Passed', '> Step 2 Failed: Assertion Error'], environmentName: 'Dev' },
    { id: 'r3', projectId: 'proj-1', name: 'Run: TC-101', caseId: 'TC-101', executedAt: new Date().toISOString(), status: ExecutionStatus.PASSED, logs: ['> Step 1 Passed', '> Step 2 Passed'], environmentName: 'Staging' },
];

export const MOCK_WORKFLOWS: Workflow[] = [
    { 
        id: 'wf-1',
        projectId: 'proj-1', 
        name: 'Nightly Critical Path', 
        description: 'Runs login and checks logic. If login fails, sends alert.', 
        nodes: [
            { id: 'n1', type: NodeType.SCRIPT, referenceId: 'sc-1', name: 'DataSetup.py', config: { scriptId: 'sc-1' } },
            {
                id: 'n2',
                type: NodeType.CONDITION,
                name: 'Check Environment',
                config: { condition: 'env.isReady == true' },
                children: [
                     { id: 'n2-1', type: NodeType.STEP, referenceId: 'TC-101', stepId: 's1', name: 'Step 1: Navigate to login' },
                     { id: 'n2-2', type: NodeType.STEP, referenceId: 'TC-101', stepId: 's4', name: 'Step 4: Click Login' }
                ],
                elseChildren: [
                     { id: 'n2-3', type: NodeType.SCRIPT, referenceId: 'sc-3', name: 'SendAlert.py', config: { scriptId: 'sc-3', inputs: { team: 'devops' } } }
                ]
            },
            { 
                id: 'n3', 
                type: NodeType.LOOP, 
                name: 'Stress Test Cart',
                config: { loopCount: 5 },
                children: [
                    { id: 'n3-1', type: NodeType.TEST_CASE, referenceId: 'TC-102', name: 'Verify Cart Calculation' }
                ]
            },
            {
                id: 'n4',
                type: NodeType.HTTP_REQUEST,
                name: 'Sync to Jira',
                config: {
                    method: 'POST',
                    url: 'https://jira.api/v2/sync',
                    inputs: {
                        "ticket_type": "TestRun",
                        "details": {
                            "runner": "{{user.name}}",
                            "status": "{{n3.status}}"
                        }
                    }
                }
            }
        ],
        lastRunStatus: ExecutionStatus.PASSED
    },
    {
        id: 'wf-2',
        projectId: 'proj-1',
        name: 'Browser Regression (Checkout)',
        description: 'E2E browser automation flow',
        nodes: [
             { 
                 id: 'bn1', 
                 type: NodeType.BROWSER_ACTION, 
                 name: 'Go to Store',
                 config: { browserCommand: 'NAVIGATE', value: 'https://store.example.com' }
             },
             {
                 id: 'bn2', 
                 type: NodeType.BROWSER_ACTION, 
                 name: 'Add to Cart', 
                 config: { browserCommand: 'CLICK', selector: '#add-to-cart-btn' }
             },
             {
                 id: 'bn3', 
                 type: NodeType.BROWSER_ACTION, 
                 name: 'Verify Cart Badge', 
                 config: { browserCommand: 'ASSERT_TEXT', selector: '.cart-badge', value: '1' }
             },
             {
                 id: 'bn4', 
                 type: NodeType.BROWSER_ACTION, 
                 name: 'Screenshot Result', 
                 config: { browserCommand: 'SCREENSHOT' }
             }
        ],
        lastRunStatus: ExecutionStatus.PENDING
    },
    {
        id: 'wf-3',
        projectId: 'proj-1',
        name: 'User Verification Protocol',
        description: 'Sub-workflow for KYC checks',
        inputSchema: [{name: 'userId', type: 'string'}],
        outputSchema: [{name: 'isVerified', type: 'boolean'}],
        nodes: [
            {
                id: 'wf3-n1',
                type: NodeType.HTTP_REQUEST,
                name: 'Fetch ID Info',
                config: {
                    method: 'GET',
                    url: 'https://api.gov.id/users/{{userId}}'
                }
            },
            {
                id: 'wf3-n2',
                type: NodeType.CONDITION,
                name: 'Risk Score Check',
                config: { condition: 'score > 80' },
                children: [
                    { id: 'wf3-n2-1', type: NodeType.REDIS_CMD, name: 'Cache Verified', config: { redisCommand: 'SET', redisKey: 'user:{{userId}}:status', redisVal: 'verified' } }
                ],
                elseChildren: [
                     { id: 'wf3-n2-2', type: NodeType.HTTP_REQUEST, name: 'Flag Manual Review (Fail)', config: { method: 'POST', url: 'https://internal.ops/review' } }
                ]
            }
        ],
        lastRunStatus: ExecutionStatus.PASSED
    },
    {
        id: 'wf-4',
        projectId: 'proj-1',
        name: 'Batch User Onboarding Pipeline',
        description: 'Complex loop processing with sub-workflow integration',
        nodes: [
            {
                id: 'wf4-n1',
                type: NodeType.DB_QUERY,
                name: 'Fetch New Users',
                config: {
                    sql: 'SELECT id, email FROM pending_users WHERE status = "NEW"'
                }
            },
            {
                id: 'wf4-n2',
                type: NodeType.LOOP,
                name: 'Process Each User',
                config: {
                    loopOver: '{{wf4-n1.rows}}',
                    loopCount: 10
                },
                children: [
                    {
                        id: 'wf4-n2-1',
                        type: NodeType.CALL_WORKFLOW,
                        name: 'Call Verification',
                        config: {
                            targetWorkflowId: 'wf-3',
                            inputs: { userId: '{{item.id}}' }
                        }
                    },
                    {
                        id: 'wf4-n2-2',
                        type: NodeType.KAFKA_PUB,
                        name: 'Publish UserActive',
                        config: {
                            kafkaTopic: 'user-events',
                            kafkaMessage: '{"id": "{{item.id}}", "event": "ACTIVATED"}'
                        }
                    }
                ]
            },
            {
                id: 'wf4-n3',
                type: NodeType.SHELL_CMD,
                name: 'Cleanup Logs',
                config: {
                    shellCommand: 'rm -rf /tmp/processing_buffer'
                }
            }
        ],
        lastRunStatus: ExecutionStatus.PENDING
    }
];

export const MOCK_USERS: User[] = [
    { id: 'u1', name: 'Alice Admin', email: 'alice@company.com', roleId: 'admin', orgId: 'org-1', status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
    { id: 'u2', name: 'Bob Tester', email: 'bob@company.com', roleId: 'editor', orgId: 'org-1', status: 'active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
    { id: 'u3', name: 'Charlie Dev', email: 'charlie@company.com', roleId: 'viewer', orgId: 'org-2', status: 'inactive', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
];

// All permissions
const ALL_PERMS = SYSTEM_PERMISSIONS.map(p => p.code);

// Editor permissions (All except Admin system stuff)
const EDITOR_PERMS = SYSTEM_PERMISSIONS.filter(p => p.category !== 'System' && p.code !== 'VIEW_ADMIN' && p.code !== 'VIEW_SETTINGS').map(p => p.code);

// Viewer permissions (Read only menus)
const VIEWER_PERMS = SYSTEM_PERMISSIONS.filter(p => p.category === 'Menu' && p.code !== 'VIEW_ADMIN' && p.code !== 'VIEW_SETTINGS').map(p => p.code);

export const MOCK_ROLES: Role[] = [
    { id: 'admin', name: 'Administrator', permissionCodes: ALL_PERMS, description: 'Full system access' },
    { id: 'editor', name: 'Editor', permissionCodes: [...EDITOR_PERMS, 'VIEW_DOCS'], description: 'Can manage test cases and execute runs' },
    { id: 'viewer', name: 'Viewer', permissionCodes: [...VIEWER_PERMS, 'VIEW_DOCS'], description: 'Read-only access to dashboards and reports' },
];

export const MOCK_ENVS: Environment[] = [
    { 
        id: 'env-1', 
        projectId: 'proj-1',
        name: 'Development', 
        color: 'bg-emerald-500', 
        variables: [
            { key: 'baseUrl', value: 'https://dev.api.local', isSecret: false },
            { key: 'dbHost', value: 'localhost:5432', isSecret: false },
            { key: 'apiKey', value: 'dev-key-123', isSecret: true }
        ] 
    },
    { 
        id: 'env-2', 
        projectId: 'proj-1',
        name: 'Staging', 
        color: 'bg-amber-500', 
        variables: [
            { key: 'baseUrl', value: 'https://staging.app.com', isSecret: false },
            { key: 'dbHost', value: 'staging-db.cloud', isSecret: false },
            { key: 'apiKey', value: 'staging-secret-x8z', isSecret: true }
        ] 
    },
    { 
        id: 'env-3', 
        projectId: 'proj-1',
        name: 'Production', 
        color: 'bg-red-600', 
        variables: [
            { key: 'baseUrl', value: 'https://app.com', isSecret: false },
            { key: 'dbHost', value: 'prod-db-primary', isSecret: false },
            { key: 'apiKey', value: 'prod-live-key', isSecret: true }
        ] 
    },
    // Project 2 Envs
    {
        id: 'env-4',
        projectId: 'proj-2',
        name: 'iOS Sim',
        color: 'bg-blue-500',
        variables: []
    }
];
