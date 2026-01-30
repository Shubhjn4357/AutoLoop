/**
 * Enhanced Workflow Node Types
 * Includes social media integration nodes
 */

export type NodeType =
  | 'trigger'
  | 'ai_agent'
  | 'api_request'
  | 'email'
  | 'condition'
  | 'delay'
  | 'webhook'
  | 'database'
  | 'notification'
  | 'social_post'        // New: Post to social media
  | 'social_reply'       // New: Auto-reply configuration
  | 'social_monitor';    // New: Monitor social activity

export interface BaseNode {
  id: string;
  type: NodeType;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

// Existing node types
export interface TriggerNode extends BaseNode {
  type: 'trigger';
  data: {
    triggerType: 'schedule' | 'webhook' | 'manual' | 'email_received' | 'form_submission';
    config: Record<string, unknown>;
  };
}

export interface AIAgentNode extends BaseNode {
  type: 'ai_agent';
  data: {
    prompt: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface EmailNode extends BaseNode {
  type: 'email';
  data: {
    to: string;
    subject: string;
    body: string;
    templateId?: string;
  };
}

export interface ConditionNode extends BaseNode {
  type: 'condition';
  data: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
   value: unknown;
  };
}

// NEW: Social Media Nodes

export interface SocialPostNode extends BaseNode {
  type: 'social_post';
  data: {
    platforms: Array<'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'youtube'>;
    content: string;
    mediaUrl?: string;
    scheduledFor?: string; // ISO date string
    accountId: string; // Connected account ID
  };
}

export interface SocialReplyNode extends BaseNode {
  type: 'social_reply';
  data: {
    platform: 'facebook' | 'instagram' | 'linkedin';
    accountId: string;
    triggerType: 'comment_keyword' | 'dm_keyword' | 'story_mention' | 'any_comment';
    keywords?: string[];
    responseTemplate: string;
    actionType: 'reply_comment' | 'send_dm' | 'whatsapp_reply';
  };
}

export interface SocialMonitorNode extends BaseNode {
  type: 'social_monitor';
  data: {
    platform: 'facebook' | 'instagram' | 'linkedin' | 'youtube';
    accountId: string;
    monitorType: 'comments' | 'mentions' | 'messages' | 'followers';
    keywords?: string[];
    saveToVariable?: string; // Variable name to store results
  };
}

export type WorkflowNode =
  | TriggerNode
  | AIAgentNode
  | EmailNode
  | ConditionNode
  | SocialPostNode
  | SocialReplyNode
  | SocialMonitorNode
  | BaseNode; // For other node types

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables: Record<string, unknown>;
}

// Node execution result
export interface NodeExecutionResult {
  success: boolean;
  output?: unknown;
  error?: string;
  nextNodeId?: string;
}

// Node categories for UI organization
export const NODE_CATEGORIES = {
  TRIGGERS: ['trigger'],
  ACTIONS: ['email', 'webhook', 'database', 'notification'],
  SOCIAL: ['social_post', 'social_reply', 'social_monitor'],
  LOGIC: ['condition', 'delay'],
  AI: ['ai_agent', 'api_request'],
} as const;

// Node metadata for UI
export interface NodeMetadata {
  type: NodeType;
  label: string;
  description: string;
  icon: string;
  category: keyof typeof NODE_CATEGORIES;
  color: string;
}

export const NODE_METADATA: Record<NodeType, NodeMetadata> = {
  trigger: {
    type: 'trigger',
    label: 'Trigger',
    description: 'Start workflow based on an event',
    icon: 'Zap',
    category: 'TRIGGERS',
    color: 'text-yellow-600',
  },
  ai_agent: {
    type: 'ai_agent',
    label: 'AI Agent',
    description: 'Process data with AI',
    icon: 'Brain',
    category: 'AI',
    color: 'text-purple-600',
  },
  api_request: {
    type: 'api_request',
    label: 'API Request',
    description: 'Make HTTP requests to external APIs',
    icon: 'Globe',
    category: 'AI',
    color: 'text-blue-600',
  },
  email: {
    type: 'email',
    label: 'Send Email',
    description: 'Send an email message',
    icon: 'Mail',
    category: 'ACTIONS',
    color: 'text-green-600',
  },
  condition: {
    type: 'condition',
    label: 'Condition',
    description: 'Branch based on conditions',
    icon: 'GitBranch',
    category: 'LOGIC',
    color: 'text-orange-600',
  },
  delay: {
    type: 'delay',
    label: 'Delay',
    description: 'Wait for a specified time',
    icon: 'Clock',
    category: 'LOGIC',
    color: 'text-gray-600',
  },
  webhook: {
    type: 'webhook',
    label: 'Webhook',
    description: 'Send data to a webhook URL',
    icon: 'Webhook',
    category: 'ACTIONS',
    color: 'text-indigo-600',
  },
  database: {
    type: 'database',
    label: 'Database',
    description: 'Read or write to database',
    icon: 'Database',
    category: 'ACTIONS',
    color: 'text-cyan-600',
  },
  notification: {
    type: 'notification',
    label: 'Notification',
    description: 'Send a notification',
    icon: 'Bell',
    category: 'ACTIONS',
    color: 'text-pink-600',
  },
  social_post: {
    type: 'social_post',
    label: 'Social Post',
    description: 'Post content to social media',
    icon: 'Share2',
    category: 'SOCIAL',
    color: 'text-blue-500',
  },
  social_reply: {
    type: 'social_reply',
    label: 'Auto-Reply',
    description: 'Setup automatic replies to comments/DMs',
    icon: 'MessageSquare',
    category: 'SOCIAL',
    color: 'text-green-500',
  },
  social_monitor: {
    type: 'social_monitor',
    label: 'Social Monitor',
    description: 'Monitor social media activity',
    icon: 'Eye',
    category: 'SOCIAL',
    color: 'text-purple-500',
  },
};
