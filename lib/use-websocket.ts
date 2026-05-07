import { useEffect, useRef, useState, useCallback } from 'react';

export interface WebSocketMessage {
  type: 'connect' | 'disconnect' | 'broadcast_start' | 'broadcast_stop' | 'viewer_join' | 'viewer_leave' | 'error';
  roomId?: string;
  viewerCount?: number;
  error?: string;
}

interface UseWebSocketOptions {
  url: string;
  role: 'broadcaster' | 'viewer';
  roomId?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: string) => void;
}

export function useWebSocket({
  url,
  role,
  roomId,
  onMessage,
  onError,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current) return;
    if (!url) return;

    setIsConnecting(true);

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setIsConnecting(false);

        // Send role and room info
        if (role === 'broadcaster') {
          ws.send(JSON.stringify({
            type: 'broadcaster_join',
            role: 'broadcaster',
          }));
        } else if (role === 'viewer' && roomId) {
          ws.send(JSON.stringify({
            type: 'viewer_join',
            role: 'viewer',
            roomId,
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          console.log('[WebSocket] Message:', message);
          onMessage?.(message);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };

      ws.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        const errorMsg = 'WebSocket connection error';
        onError?.(errorMsg);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);
        setIsConnecting(false);
        wsRef.current = null;
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Connection failed:', error);
      const errorMsg = error instanceof Error ? error.message : 'Connection failed';
      onError?.(errorMsg);
      setIsConnecting(false);
    }
  }, [url, role, roomId, onMessage, onError]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
      setIsConnected(false);
    }
  }, []);

  const send = useCallback((message: Record<string, any>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Not connected, cannot send message');
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    send,
    isConnected,
    isConnecting,
  };
}
