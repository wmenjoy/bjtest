
import { NodeConfig, NodeType } from '../../types';
import { Globe, Database, GitBranch, Repeat, HardDrive, Sparkles, Monitor, Box, GitMerge } from 'lucide-react';

export type FieldType = 'string' | 'number' | 'boolean' | 'select' | 'code' | 'json' | 'kv-list';

export interface FieldSpec {
    key: keyof NodeConfig;
    label: string;
    type: FieldType;
    options?: string[];
    placeholder?: string;
    description?: string;
}

export interface NodeSpec {
    title: string;
    icon: any;
    color: string;
    groups: {
        title: string;
        fields: FieldSpec[];
    }[];
    outputMock?: any;
}

export const NODE_SPECS: Partial<Record<NodeType, NodeSpec>> = {
    [NodeType.HTTP_REQUEST]: {
        title: 'HTTP Request',
        icon: Globe,
        color: 'text-blue-600',
        groups: [
            {
                title: 'Request Setup',
                fields: [
                    { key: 'method', label: 'Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
                    { key: 'url', label: 'URL', type: 'string', placeholder: 'https://api.example.com/resource' },
                ]
            },
            {
                title: 'Parameters',
                fields: [
                    { key: 'headers', label: 'Headers', type: 'kv-list' },
                    { key: 'queryParams', label: 'Query Params', type: 'kv-list' },
                    { key: 'body', label: 'JSON Body', type: 'json' },
                ]
            }
        ],
        outputMock: { status: 200, data: { id: "123", name: "Test Item" }, headers: { "content-type": "application/json" } }
    },
    [NodeType.DB_QUERY]: {
        title: 'Database Query',
        icon: Database,
        color: 'text-emerald-600',
        groups: [
            {
                title: 'Connection',
                fields: [
                    { key: 'dbConnectionId', label: 'Connection', type: 'select', options: ['db-primary (Postgres)', 'db-analytics (MySQL)'] }
                ]
            },
            {
                title: 'Query',
                fields: [
                    { key: 'sql', label: 'SQL Query', type: 'code', placeholder: 'SELECT * FROM users WHERE id = {{userId}}' }
                ]
            }
        ],
        outputMock: { rowCount: 5, rows: [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }] }
    },
    [NodeType.CONDITION]: {
        title: 'If Condition',
        icon: GitBranch,
        color: 'text-amber-600',
        groups: [
             {
                 title: 'Logic',
                 fields: [
                     { key: 'condition', label: 'Expression', type: 'string', placeholder: '{{node.status}} == "success"', description: 'JavaScript expression returning true/false' }
                 ]
             }
        ],
        outputMock: { result: true }
    },
    [NodeType.LOOP]: {
        title: 'Loop',
        icon: Repeat,
        color: 'text-orange-600',
        groups: [
            {
                title: 'Iterator',
                fields: [
                    { key: 'loopOver', label: 'Items to Loop', type: 'string', placeholder: '{{Step1.data}}' },
                    { key: 'loopCount', label: 'Max Iterations', type: 'number' }
                ]
            }
        ],
        outputMock: { index: 0, item: { id: 1, value: "sample" }, total: 5 }
    },
    [NodeType.REDIS_CMD]: {
        title: 'Redis',
        icon: HardDrive,
        color: 'text-red-600',
        groups: [
            {
                title: 'Command',
                fields: [
                    { key: 'redisCommand', label: 'Operation', type: 'select', options: ['GET', 'SET', 'DEL', 'HGET'] },
                    { key: 'redisKey', label: 'Key', type: 'string', placeholder: 'session:{{userId}}' },
                    { key: 'redisVal', label: 'Value', type: 'string', placeholder: 'Only for SET' },
                ]
            }
        ],
        outputMock: { result: "OK", value: "cached_data" }
    },
    [NodeType.LLM_PROMPT]: {
        title: 'AI Agent',
        icon: Sparkles,
        color: 'text-purple-600',
        groups: [
            {
                title: 'Prompt Engineering',
                fields: [
                    { key: 'model', label: 'Model', type: 'select', options: ['gemini-pro', 'gpt-4'] },
                    { key: 'prompt', label: 'System Prompt', type: 'code' },
                ]
            }
        ],
        outputMock: { text: "Here is the generated response...", usage: { tokens: 150 } }
    },
    [NodeType.BROWSER_ACTION]: {
        title: 'Browser Automation',
        icon: Monitor,
        color: 'text-pink-600',
        groups: [
            {
                title: 'Action',
                fields: [
                    { key: 'browserCommand', label: 'Command', type: 'select', options: ['NAVIGATE', 'CLICK', 'TYPE', 'SCREENSHOT', 'ASSERT_TEXT'] },
                    { key: 'selector', label: 'Selector', type: 'string', placeholder: '#submit-btn' },
                    { key: 'value', label: 'Input Value', type: 'string' },
                ]
            }
        ],
        outputMock: { success: true, url: "https://example.com", textFound: "Welcome" }
    },
    [NodeType.BRANCH]: {
        title: 'Branch',
        icon: GitBranch,
        color: 'text-purple-600',
        groups: [
            {
                title: 'Branch Configuration',
                fields: [
                    { key: 'condition', label: 'Branch Condition', type: 'string', placeholder: '{{variable}} == "value"', description: 'Condition to determine branch path' }
                ]
            }
        ],
        outputMock: { branchTaken: "path_a" }
    },
    [NodeType.MERGE]: {
        title: 'Merge',
        icon: GitMerge,
        color: 'text-teal-600',
        groups: [
            {
                title: 'Merge Configuration',
                fields: [
                    { key: 'inputs', label: 'Merge Strategy', type: 'select', options: ['wait-all', 'wait-any', 'first-complete'], description: 'How to merge parallel branches' }
                ]
            }
        ],
        outputMock: { merged: true, branchCount: 2 }
    }
};

export const DEFAULT_NODE_SPEC: NodeSpec = {
    title: 'Generic Node',
    icon: Box,
    color: 'text-slate-600',
    groups: [
        {
            title: 'Settings',
            fields: [
                { key: 'inputs', label: 'Parameters', type: 'json' }
            ]
        }
    ],
    outputMock: { success: true }
};
