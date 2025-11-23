
import { ScriptParameter, TestExample, ScriptType, NodeType } from '../../types';

export interface ActionDef {
    id: string;
    name: string;
    description?: string;
    type: ScriptType | NodeType;
    category?: string;
    parameters: ScriptParameter[];
    outputs?: ScriptParameter[];
    testExamples?: TestExample[];
    isBuiltIn: boolean;
    // Custom specific
    content?: string;
    isTemplate?: boolean;
    tags?: string[];
    lastModified?: string;
}

export const BUILT_IN_ACTIONS: ActionDef[] = [
    { 
        id: 'bi-http', 
        name: 'HTTP Request', 
        description: 'Send REST API requests (GET, POST, PUT, DELETE). Supports custom headers and JSON bodies.',
        type: NodeType.HTTP_REQUEST, 
        category: 'Network',
        isBuiltIn: true,
        parameters: [
            { name: 'method', type: 'string', description: 'HTTP Method', defaultValue: 'GET' },
            { name: 'url', type: 'string', description: 'Target URL', defaultValue: 'https://' },
            { name: 'headers', type: 'object', description: 'Key-value pairs for headers' },
            { name: 'body', type: 'object', description: 'JSON payload for POST/PUT' }
        ],
        outputs: [
            { name: 'status', type: 'number', description: 'HTTP Status Code' },
            { name: 'data', type: 'object', description: 'Response JSON body' }
        ],
        testExamples: [
            { id: 'ex-1', name: 'Get Users', inputValues: { method: 'GET', url: 'https://api.example.com/users' } },
            { id: 'ex-2', name: 'Post Data', inputValues: { method: 'POST', url: 'https://api.example.com/submit', body: '{"foo":"bar"}' } }
        ]
    },
    { 
        id: 'bi-db', 
        name: 'Database Query', 
        description: 'Execute SQL queries against configured databases (Postgres/MySQL). Returns rows as an array of objects.',
        type: NodeType.DB_QUERY, 
        category: 'Data',
        isBuiltIn: true,
        parameters: [
            { name: 'sql', type: 'string', description: 'SQL Statement', defaultValue: 'SELECT * FROM users LIMIT 10' }
        ],
        outputs: [
            { name: 'rowCount', type: 'number', description: 'Number of rows affected/returned' },
            { name: 'rows', type: 'array', description: 'Result set' }
        ],
        testExamples: [
            { id: 'ex-1', name: 'Select All', inputValues: { sql: 'SELECT * FROM items' } }
        ]
    },
    { 
        id: 'bi-redis', 
        name: 'Redis Command', 
        description: 'Execute Redis commands like GET, SET, DEL to manage cache state.',
        type: NodeType.REDIS_CMD, 
        category: 'Data',
        isBuiltIn: true,
        parameters: [
            { name: 'command', type: 'string', description: 'GET, SET, DEL, etc.', defaultValue: 'GET' },
            { name: 'key', type: 'string', description: 'Key name' },
            { name: 'value', type: 'string', description: 'Value (for SET)' }
        ],
        outputs: [
            { name: 'result', type: 'string', description: 'Command result' }
        ],
        testExamples: [
            { id: 'ex-1', name: 'Get Session', inputValues: { command: 'GET', key: 'session:12345' } }
        ]
    },
    { id: 'bi-kafka', name: 'Kafka Publish', description: 'Publish messages to a Kafka topic.', type: NodeType.KAFKA_PUB, category: 'Messaging', isBuiltIn: true, parameters: [{name: 'topic', type: 'string'}, {name: 'message', type: 'string'}], outputs: [{name: 'offset', type: 'number'}], testExamples: [] },
    { id: 'bi-es', name: 'Elasticsearch', description: 'Query ES indices using JSON DSL.', type: NodeType.ES_QUERY, category: 'Data', isBuiltIn: true, parameters: [{name: 'index', type: 'string'}, {name: 'query', type: 'string'}], outputs: [{name: 'hits', type: 'array'}], testExamples: [] },
    { id: 'bi-shell', name: 'Shell Command', description: 'Execute shell commands on the runner host.', type: NodeType.SHELL_CMD, category: 'System', isBuiltIn: true, parameters: [{name: 'cmd', type: 'string'}], outputs: [{name: 'stdout', type: 'string'}, {name: 'exitCode', type: 'number'}], testExamples: [{id: 'ex-1', name: 'List Files', inputValues: {cmd: 'ls -la'}}] },
    { id: 'bi-browser', name: 'Browser Action', description: 'Automate browser interactions (Puppeteer/Playwright).', type: NodeType.BROWSER_ACTION, category: 'UI', isBuiltIn: true, parameters: [{name: 'action', type: 'string'}, {name: 'selector', type: 'string'}], outputs: [{name: 'text', type: 'string'}], testExamples: [] }
];
