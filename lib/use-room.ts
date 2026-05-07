import { useState, useCallback, useEffect } from 'react';

export interface RoomState {
  roomId: string;
  broadcasterConnected: boolean;
  viewerCount: number;
  isActive: boolean;
}

export function useRoom(role: 'broadcaster' | 'viewer') {
  const [roomState, setRoomState] = useState<RoomState>({
    roomId: '',
    broadcasterConnected: false,
    viewerCount: 0,
    isActive: false,
  });

  const generateRoomId = useCallback(() => {
    // Generate a simple room ID (uppercase alphanumeric, 12 characters)
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    setRoomState((prev) => ({
      ...prev,
      roomId: id,
      isActive: true,
    }));

    return id;
  }, []);

  const updateViewerCount = useCallback((count: number) => {
    setRoomState((prev) => ({
      ...prev,
      viewerCount: count,
    }));
  }, []);

  const updateBroadcasterStatus = useCallback((connected: boolean) => {
    setRoomState((prev) => ({
      ...prev,
      broadcasterConnected: connected,
    }));
  }, []);

  const resetRoom = useCallback(() => {
    setRoomState({
      roomId: '',
      broadcasterConnected: false,
      viewerCount: 0,
      isActive: false,
    });
  }, []);

  return {
    roomState,
    generateRoomId,
    updateViewerCount,
    updateBroadcasterStatus,
    resetRoom,
  };
}
