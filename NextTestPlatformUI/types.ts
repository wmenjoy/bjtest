
export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum Status {
  DRAFT = 'Draft',
  ACTIVE = 'Active',
  DEPRECATED = 'Deprecated'
}

export enum ExecutionStatus {
  PENDING = 'Pending',
  RUNNING = 'Running',
  PASSED = 'Passed',
  FAILED = 'Failed',
  BLOCKED = 'Blocked',
  SKIPPED = 'Skipped'
}

export enum ScriptType {
  PYTHON = 'Python',
  JAVASCRIPT = 'JavaScript',
  SHELL = 'Shell',
  TEMPLATE = 'Template'
}

export interface ScriptParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  defaultValue?: string;
}

export interface TestExample {
    id: string;
    name: string;
    description?: string;
    inputValues: Record<string, string>;
}

// ===== CONTROL FLOW TYPES =====

/**
 * Loop configuration for test steps
 * Supports three loop types: forEach (iterate arrays), while (condition-based), count (fixed iterations)
 */
export interface LoopConfig {
  /** Loop type: forEach iterates arrays, while checks conditions, count runs fixed times */
  type: 'forEach' | 'while' | 'count';

  // forEach specific
  /** Data source for forEach loop - variable reference like "{{userList}}" */
  source?: string;
  /** Variable name for current item in iteration, e.g., "item" */
  itemVar?: string;
  /** Variable name for current index, e.g., "i" */
  indexVar?: string;

  // while specific
  /** Condition expression for while loop, e.g., "{{hasMore}} == true" */
  condition?: string;

  // count specific
  /** Number of iterations for count loop - can be number or variable reference */
  count?: number | string;

  /** Safety limit to prevent infinite loops, defaults to 100 */
  maxIterations?: number;
}

/**
 * Branch configuration for conditional execution paths
 * Each branch has a condition and child steps to execute when condition is met
 * NOTE: Uses WorkflowStep (defined below) for children
 */
export interface BranchConfig {
  /** Condition expression, e.g., "{{status}} == 200" or "default" for else branch */
  condition: string;
  /** Human-readable label for the branch */
  label?: string;
  /** Steps to execute when this branch is selected */
  children: WorkflowStep[];
}

// ===== STEP EXECUTION TYPES =====

/**
 * Execution state for a single loop iteration
 */
export interface IterationExecution {
  /** Zero-based iteration index */
  index: number;
  /** Value of the current item in forEach loop */
  itemValue: any;
  /** Execution status of this iteration */
  status: 'passed' | 'failed' | 'skipped';
  /** Child step executions within this iteration */
  children: StepExecution[];
  /** Duration in milliseconds */
  duration: number;
}

/**
 * Execution state for loop control flow
 */
export interface LoopExecution {
  /** Total number of iterations */
  totalIterations: number;
  /** Current iteration index (0-based) */
  currentIteration: number;
  /** Detailed execution data for each iteration */
  iterations: IterationExecution[];
}

/**
 * Execution state for branch control flow
 */
export interface BranchExecution {
  /** The condition expression that was evaluated */
  condition: string;
  /** The evaluated value of the condition */
  evaluatedValue: any;
  /** ID or label of the selected branch */
  selectedBranch: string;
}

/**
 * HTTP request details for execution tracking
 */
export interface HttpRequestExecution {
  /** HTTP method (GET, POST, etc.) */
  method: string;
  /** Full URL including query parameters */
  url: string;
  /** Request headers */
  headers: Record<string, string>;
  /** Request body (if applicable) */
  body?: any;
}

/**
 * HTTP response details for execution tracking
 */
export interface HttpResponseExecution {
  /** HTTP status code */
  statusCode: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body: any;
  /** Response time in milliseconds */
  responseTime: number;
}

/**
 * Complete execution state for a test step
 * Tracks status, timing, inputs/outputs, and control flow execution
 */
export interface StepExecution {
  /** ID of the step being executed */
  stepId: string;
  /** Name/title of the step */
  stepName: string;
  /** Current execution status */
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  /** ISO timestamp when execution started */
  startTime: string;
  /** ISO timestamp when execution completed */
  endTime?: string;
  /** Duration in milliseconds */
  duration?: number;

  // ===== Data Flow =====
  /** Resolved input values at execution time */
  inputs?: Record<string, any>;
  /** Output values produced by this step */
  outputs?: Record<string, any>;

  // ===== Control Flow Execution =====
  /** Loop execution details (if step has loop) */
  loop?: LoopExecution;
  /** Branch execution details (if step has branches) */
  branch?: BranchExecution;
  /** Child step executions (for loops, branches, or groups) */
  children?: StepExecution[];

  // ===== Error Handling =====
  /** Error message if execution failed */
  error?: string;

  // ===== HTTP Execution Details =====
  /** HTTP request details (for http type steps) */
  httpRequest?: HttpRequestExecution;
  /** HTTP response details (for http type steps) */
  httpResponse?: HttpResponseExecution;
}

export interface TestData {
  id: string;
  name: string;
  data: string; // JSON string representing key-value pairs
}

export interface TestCase {
  id: string;
  projectId: string; // Multi-tenancy support
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  steps: TestStep[];

  // Context / First Principles
  variables?: Record<string, string>; // "Given" data / Environment variables
  preconditions?: string[]; // "Given" state

  testData?: TestData[]; // Imported data for the case
  tags: string[];
  folderId: string;
  lastUpdated: string;

  // Automation Strategy
  automationType?: 'MANUAL' | 'WORKFLOW';
  linkedWorkflowId?: string;

  // Value Scoring (from backend migration 006)
  coverageScore?: number;       // 0-100
  stabilityScore?: number;      // 0-100
  efficiencyScore?: number;     // 0-100
  maintainabilityScore?: number; // 0-100
  overallScore?: number;        // 0-100

  // Execution Statistics
  executionCount?: number;
  successRate?: number;         // 0-100 percentage
  avgDuration?: number;         // milliseconds
  lastRunAt?: string;           // ISO datetime

  // Flaky Test Detection
  isFlaky?: boolean;
  flakyScore?: number;          // 0-100, higher = more flaky

  // Ownership
  ownerId?: string;
}

export interface TestFolder {
  id: string;
  projectId: string; // Multi-tenancy support
  name: string;
  parentId: string | 'root';
  type: 'service' | 'module' | 'folder';
  folderType?: 'service' | 'module'; // Additional metadata for display
}

export interface TestRun {
  id: string;
  projectId: string; // Multi-tenancy support
  name: string;
  caseId: string;
  executedAt: string;
  status: ExecutionStatus;
  notes?: string;
  logs?: string[]; // Detailed execution logs
  environmentName?: string; // Which env was this run on
}

export interface Script {
  id: string;
  projectId: string; // Multi-tenancy support
  name: string;
  description?: string; 
  type: ScriptType;
  content: string;
  parameters: ScriptParameter[]; // Inputs required by this script
  outputs?: ScriptParameter[]; // Outputs produced by this script
  testExamples?: TestExample[]; // Saved test scenarios
  isTemplate: boolean;
  tags: string[];
  lastModified: string;
}

export enum NodeType {
  TEST_CASE = 'TEST_CASE',
  STEP = 'STEP', // Single step from a case
  SCRIPT = 'SCRIPT',
  LOOP = 'LOOP',
  CONDITION = 'CONDITION',
  HTTP_REQUEST = 'HTTP_REQUEST',
  
  // Core Utilities (n8n style)
  JSON_TRANSFORM = 'JSON_TRANSFORM', // Map/Filter/Reduce JSON
  WAIT = 'WAIT', // Delay execution
  WEBHOOK = 'WEBHOOK', // Trigger
  SCHEDULE = 'SCHEDULE', // Trigger

  // Existing Actions
  DB_QUERY = 'DB_QUERY',
  BROWSER_ACTION = 'BROWSER_ACTION',
  RPC_CALL = 'RPC_CALL',
  LLM_PROMPT = 'LLM_PROMPT',
  REPORT_GEN = 'REPORT_GEN',

  // New Infrastructure Actions
  REDIS_CMD = 'REDIS_CMD',
  KAFKA_PUB = 'KAFKA_PUB',
  ES_QUERY = 'ES_QUERY',
  SHELL_CMD = 'SHELL_CMD',
  
  // Protocol
  MCP_TOOL = 'MCP_TOOL', // Model Context Protocol

  // Logic Flow
  CALL_WORKFLOW = 'CALL_WORKFLOW',
  BRANCH = 'BRANCH',
  MERGE = 'MERGE'
}

export interface DataTypeSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  properties?: Record<string, DataTypeSchema>; // For objects
  items?: DataTypeSchema; // For arrays
}

export interface NodeConfig {
  // Logic
  condition?: string; // Expression for Conditions
  loopCount?: number; // For Loops
  loopOver?: string; // Variable to iterate over (array)
  
  // Script / Action
  scriptId?: string;

  // Sub-Workflow
  targetWorkflowId?: string;
  
  // Data Mapping / Protocol
  inputs?: Record<string, any>; 
  
  // Interface Definition (Protocol)
  inputSchema?: Record<string, DataTypeSchema>;
  outputSchema?: Record<string, DataTypeSchema>;
  
  // Output Extraction (New)
  // Map result path (e.g. "body.data.token") to Variable Name (e.g. "authToken")
  outputTransform?: Record<string, string>; 

  // HTTP Specific
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  body?: any;

  // Database
  dbConnectionId?: string; // Reference to a configured DB connection
  sql?: string;
  dbType?: 'POSTGRES' | 'MYSQL' | 'MONGO';
  
  // Browser Automation
  browserCommand?: 'NAVIGATE' | 'CLICK' | 'TYPE' | 'SCREENSHOT' | 'ASSERT_TEXT';
  selector?: string; // CSS/XPath
  value?: string; // Input value

  // RPC
  service?: string;
  rpcMethod?: string;

  // AI
  prompt?: string;
  model?: string;

  // Redis
  redisCommand?: 'GET' | 'SET' | 'DEL' | 'HGET';
  redisKey?: string;
  redisVal?: string;

  // Kafka
  kafkaTopic?: string;
  kafkaMessage?: string; // JSON

  // Elasticsearch
  esIndex?: string;
  esQuery?: string; // JSON

  // Shell
  shellCommand?: string;
  shellCwd?: string;

  // MCP
  mcpServer?: string; // Name of the MCP server (e.g., "filesystem", "github")
  mcpToolName?: string; // e.g., "read_file"
  mcpArgs?: Record<string, any>;

  // Triggers & Utilities
  cronExpression?: string; // For SCHEDULE
  webhookMethod?: 'GET' | 'POST'; // For WEBHOOK
  webhookPath?: string; 
  waitDurationMs?: number; // For WAIT
  jsonTransformCode?: string; // For JSON_TRANSFORM (e.g., JQ or JS)
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  
  // Links
  referenceId?: string; // ID of the case or script
  stepId?: string; // Specific step ID if type is STEP
  
  // Configuration
  config?: NodeConfig;
  
  // Nested Structure
  children?: WorkflowNode[]; // For Loop body or Condition True branch
  elseChildren?: WorkflowNode[]; // For Condition False branch
}

export interface Workflow {
  id: string;
  projectId: string; // Multi-tenancy support
  name: string;
  description: string;
  nodes: WorkflowNode[];
  inputSchema?: ScriptParameter[]; // Global inputs for the workflow
  outputSchema?: ScriptParameter[]; // Global outputs for the workflow
  lastRunStatus?: ExecutionStatus;
  lastRunAt?: string;
}

// --- NEW MANAGEMENT TYPES ---

export interface Permission {
    code: string;
    name: string;
    category: 'Menu' | 'Action' | 'System';
    description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  orgId: string;
  avatar?: string;
  status: 'active' | 'inactive';
}

export interface Role {
  id: string;
  name: string;
  permissionCodes: string[]; // List of Permission.code
  description?: string;
}

export interface Organization {
  id: string;
  name: string;
  parentId?: string;
  type: 'department' | 'team';
}

export interface Project {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  key: string; // e.g. "PROJ-1"
}

export interface TableColumn {
  name: string;
  type: 'VARCHAR' | 'INT' | 'BOOLEAN' | 'JSON' | 'TIMESTAMP' | 'TEXT';
  isPrimaryKey?: boolean;
  isNullable?: boolean;
}

export interface TableSchema {
  id: string;
  projectId: string; // Multi-tenancy support
  name: string;
  description?: string;
  columns: TableColumn[];
}

export interface SystemConfig {
  companyName: string;
  ssoEnabled: boolean;
  ssoProviders: ('wechat' | 'qq' | 'dingtalk')[];
  allowRegistration: boolean;
  defaultUserRole: string;
  themeColor: string;
}

// --- ENVIRONMENT TYPES ---

export interface EnvironmentVariable {
    key: string;
    value: string;
    isSecret: boolean;
}

export interface Environment {
    id: string;
    projectId: string; // Multi-tenancy support (Env per project)
    name: string;
    variables: EnvironmentVariable[];
    color: string;
}

// --- DOCUMENTATION TYPES ---
export interface ApiEndpoint {
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    summary: string;
    description?: string;
    parameters?: { name: string, in: 'query' | 'body' | 'path', type: string, required: boolean }[];
}

export interface BusinessRule {
    id: string;
    title: string;
    rule: string;
    impact: 'High' | 'Medium' | 'Low';
}

// ===== UNIFIED WORKFLOW ARCHITECTURE TYPES =====

/**
 * Position on the visual canvas for Advanced Mode
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Data Mapper for visual data flow configuration
 * Maps output from a source step to input parameter of current step
 */
export interface DataMapper {
  /** Unique identifier for this mapper */
  id: string;
  /** Source step ID, e.g., "step-login" */
  sourceStep: string;
  /** JSONPath to the output field, e.g., "response.body.token" */
  sourcePath: string;
  /** Target input parameter name, e.g., "authToken" */
  targetParam: string;
  /** Optional transform function: "uppercase", "parseInt", "trim", etc. */
  transform?: string;
}

/**
 * Action Parameter Definition
 * Describes an input parameter for an Action Template
 */
export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  required: boolean;
  defaultValue?: any;
  enum?: string[]; // Enumeration values if applicable
}

/**
 * Action Output Definition
 * Describes an output field from an Action Template
 */
export interface ActionOutput {
  name: string;
  type: string;
  path: string; // JSONPath, e.g., "response.body.token"
  description?: string;
}

/**
 * Action Template - Reusable action definition
 * Can be referenced by multiple WorkflowSteps across different workflows
 */
export interface ActionTemplate {
  id: string;
  name: string;
  description?: string;
  category: string; // "Authentication", "Database", "HTTP", etc.
  type: string; // "http", "command", "database", "script"

  /** Configuration template with parameter placeholders */
  configTemplate: Record<string, any>;

  /** Input parameters definition */
  parameters: ActionParameter[];

  /** Output fields definition */
  outputs: ActionOutput[];

  /** Tags for search and categorization */
  tags?: string[];

  /** Multi-tenant scope: system, platform, tenant */
  scope: 'system' | 'platform' | 'tenant';
  tenantId?: string; // NULL for system/platform scope

  /** Permission control */
  isPublic: boolean;
  allowCopy: boolean;

  /** Metadata */
  isBuiltIn?: boolean;
  isTemplate?: boolean;
  version: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Merge Node Configuration
 * Waits for multiple parallel branches to complete and merges results
 */
export interface MergeConfig {
  /** Merge strategy */
  strategy: 'waitAll' | 'waitAny' | 'waitN';
  /** Number to wait for when strategy is 'waitN' */
  waitCount?: number;
  /** Merge mode: combine into object or array */
  mode: 'object' | 'array';
  /** Custom mapping for merged results */
  mapping?: Record<string, string>;
}

/**
 * Assertion Definition
 * Used in test-focused workflows to validate results
 */
export interface Assertion {
  type: 'equals' | 'contains' | 'matches' | 'greaterThan' | 'lessThan';
  actual: string; // Variable reference, e.g., "{{response.status}}"
  expected: any;
  message?: string;
}

/**
 * Unified Workflow Step
 * Replaces TestStep with richer structure supporting:
 * - Action Template references
 * - Data flow mapping
 * - Control flow (branches, loops)
 * - Assertions
 * - Parallel execution (DAG)
 */
export interface WorkflowStep {
  id: string;
  name?: string; // Optional for backward compatibility
  type?: string; // Optional for backward compatibility - http, command, database, script, branch, loop, merge

  // 【核心】两种配置方式（互斥）
  // Method 1: Reference Action Template (recommended)
  actionTemplateId?: string;
  actionVersion?: string;

  // Method 2: Inline config (backward compatibility)
  config?: Record<string, any>;

  // Data Flow
  inputs?: Record<string, string>; // Parameter bindings, e.g., { "username": "{{testUser}}" }
  outputs?: Record<string, string>; // Output mappings, e.g., { "authToken": "currentToken" }
  dataMappers?: DataMapper[]; // Visual data mapping configuration

  // Control Flow
  condition?: string; // Condition expression for execution
  dependsOn?: string[]; // Step IDs that must complete before this step (DAG)
  loop?: LoopConfig; // Loop configuration
  branches?: BranchConfig[]; // Branch configuration
  children?: WorkflowStep[]; // Nested steps (for branch children, loop body, group) - complete objects, not IDs

  // Error Handling
  onError?: 'abort' | 'continue' | 'retry';
  retryCount?: number;
  retryDelay?: number; // seconds
  timeout?: number; // seconds

  // Assertions (test perspective)
  assertions?: Assertion[];

  // UI Related (for Advanced Mode)
  position?: Position;
  collapsed?: boolean;
  disabled?: boolean;

  // ===== Legacy fields (kept for backward compatibility) =====
  /** Brief summary of step purpose */
  summary?: string;
  /** Detailed description/instruction for manual testing */
  instruction?: string;
  /** Expected result description */
  expectedResult?: string;
  /** Parameter values for linked actions/scripts */
  parameterValues?: Record<string, any>;
  /** Legacy output mapping (kept for backward compatibility) */
  outputMapping?: Record<string, string>;
  /** @deprecated Use loop.source instead */
  loopOver?: string;
  /** @deprecated Use loop.itemVar instead */
  loopVar?: string;
  /** Linked script ID for automation */
  linkedScriptId?: string;
  /** Linked workflow ID for sub-workflow execution */
  linkedWorkflowId?: string;
}

/**
 * Backward compatibility alias
 * TestStep is now an alias for WorkflowStep
 */
export type TestStep = WorkflowStep;

/**
 * Workflow Definition (Unified)
 * Represents both traditional workflows and test cases
 */
export interface UnifiedWorkflow {
  id: string;
  name: string;
  description?: string;
  type: 'workflow' | 'testcase'; // Differentiates perspective

  /** Steps in the workflow/testcase */
  steps: WorkflowStep[];

  /** Global variables */
  variables?: Record<string, any>;

  /** Lifecycle */
  setupSteps?: string[]; // Step IDs for setup
  teardownSteps?: string[]; // Step IDs for teardown

  /** Multi-tenancy */
  tenantId?: string;
  projectId?: string;

  /** Metadata */
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: string;
}

