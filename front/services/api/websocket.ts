/**
 * WebSocket Client - 工作流实时监控
 */

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8090/api';

// ===== 消息类型 =====

export type WebSocketMessageType = 'step_start' | 'step_complete' | 'step_log' | 'variable_change';

export interface WebSocketMessage {
  runId: string;
  type: WebSocketMessageType;
  payload: StepStartPayload | StepCompletePayload | StepLogPayload | VariableChangePayload;
}

export interface StepStartPayload {
  stepId: string;
  stepName: string;
}

export interface StepCompletePayload {
  stepId: string;
  stepName: string;
  status: 'success' | 'failed';
  duration: number;
}

export interface StepLogPayload {
  stepId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface VariableChangePayload {
  stepId: string;
  varName: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'create' | 'update' | 'delete';
}

// ===== 回调类型 =====

export interface WorkflowStreamCallbacks {
  onStepStart?: (payload: StepStartPayload) => void;
  onStepComplete?: (payload: StepCompletePayload) => void;
  onStepLog?: (payload: StepLogPayload) => void;
  onVariableChange?: (payload: VariableChangePayload) => void;
  onError?: (error: Event) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

// ===== WebSocket 客户端 =====

export class WorkflowStreamClient {
  private ws: WebSocket | null = null;
  private runId: string | null = null;
  private callbacks: WorkflowStreamCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;

  /**
   * 连接到工作流执行流
   */
  connect(runId: string, callbacks: WorkflowStreamCallbacks): void {
    this.runId = runId;
    this.callbacks = callbacks;
    this.doConnect();
  }

  private doConnect(): void {
    if (!this.runId) return;

    const url = `${WS_BASE_URL}/workflows/runs/${this.runId}/stream`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log(`[WebSocket] Connected to workflow run: ${this.runId}`);
      this.reconnectAttempts = 0;
      this.callbacks.onOpen?.();
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('[WebSocket] Failed to parse message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      this.callbacks.onError?.(error);
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Connection closed');
      this.callbacks.onClose?.();

      // 尝试重连
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`[WebSocket] Reconnecting... (attempt ${this.reconnectAttempts})`);
        setTimeout(() => this.doConnect(), this.reconnectDelay * this.reconnectAttempts);
      }
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'step_start':
        this.callbacks.onStepStart?.(message.payload as StepStartPayload);
        break;
      case 'step_complete':
        this.callbacks.onStepComplete?.(message.payload as StepCompletePayload);
        break;
      case 'step_log':
        this.callbacks.onStepLog?.(message.payload as StepLogPayload);
        break;
      case 'variable_change':
        this.callbacks.onVariableChange?.(message.payload as VariableChangePayload);
        break;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.maxReconnectAttempts = 0; // 防止自动重连
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.runId = null;
    this.callbacks = {};
  }

  /**
   * 获取连接状态
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * 获取当前 runId
   */
  get currentRunId(): string | null {
    return this.runId;
  }
}

// 单例实例
export const workflowStreamClient = new WorkflowStreamClient();
