export interface LogMessage {
  type: 'log' | 'system' | 'error';
  timestamp: string;
  content?: string;
  message?: string;
}

export type LogListener = (msg: LogMessage) => void;

class LogWebSocketClient {
  private socket: WebSocket | null = null;
  private listeners: Set<LogListener> = new Set();
  private reconnectInterval = 3000;
  private isExplicitlyClosed = false;

  connect() {
    this.isExplicitlyClosed = false;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket('ws://localhost:8080/ws/logs');

      this.socket.onopen = () => {
        this.notifyListeners({
          type: 'system',
          timestamp: new Date().toISOString(),
          message: 'Connected to Go Docker Engine Live Stream',
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data: LogMessage = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (_) {
          this.notifyListeners({
            type: 'log',
            timestamp: new Date().toISOString(),
            content: event.data,
          });
        }
      };

      this.socket.onclose = () => {
        if (!this.isExplicitlyClosed) {
          setTimeout(() => this.connect(), this.reconnectInterval);
        }
      };

      this.socket.onerror = () => {
        // Handled via onclose
      };
    } catch (_) {
      setTimeout(() => this.connect(), this.reconnectInterval);
    }
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  subscribe(listener: LogListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(msg: LogMessage) {
    this.listeners.forEach((listener) => listener(msg));
  }
}

export const logWebSocket = new LogWebSocketClient();
