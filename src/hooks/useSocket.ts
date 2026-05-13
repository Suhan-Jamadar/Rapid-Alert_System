// import { useEffect, useRef, useCallback, useState } from 'react';
// import { io, Socket } from 'socket.io-client';

// const SOCKET_URL = 'http://localhost:4000';

// interface UseSocketOptions {
//   onNewAlert?: (alert: any) => void;
//   onNewFeed?: (feed: any) => void;
//   onProcessingUpdate?: (data: { log: any; summary: any }) => void;
// }

// // ─── Single shared socket instance across all tabs/components ─────────────
// // This prevents creating multiple socket connections when the hook
// // is used in more than one component.
// let globalSocket: Socket | null = null;
// let globalSocketRefCount = 0;

// function getSharedSocket(): Socket {
//   if (!globalSocket || !globalSocket.connected) {
//     globalSocket = io(SOCKET_URL, {
//       reconnection: true,
//       reconnectionAttempts: 10,
//       reconnectionDelay: 1000,
//       reconnectionDelayMax: 5000,
//       // Try WebSocket first, fall back to polling if blocked
//       transports: ['websocket', 'polling'],
//       forceNew: false,
//     });
//   }
//   return globalSocket;
// }

// export function useSocket(options: UseSocketOptions = {}) {
//   const optionsRef = useRef(options);
//   optionsRef.current = options;

//   // ✅ FIX 1: Track connection status as real React state so components re-render
//   const [isConnected, setIsConnected] = useState(false);
//   const [socketId, setSocketId] = useState<string | undefined>(undefined);
//   const [lastEvent, setLastEvent] = useState<{ type: string; time: Date } | null>(null);

//   useEffect(() => {
//     const socket = getSharedSocket();
//     globalSocketRefCount++;

//     // ── Connection events ──────────────────────────────────────────────
//     const onConnect = () => {
//       console.log('✅ Socket connected:', socket.id);
//       setIsConnected(true);
//       setSocketId(socket.id);
//     };

//     const onDisconnect = (reason: string) => {
//       console.log('❌ Socket disconnected:', reason);
//       setIsConnected(false);
//       setSocketId(undefined);
//     };

//     const onConnectError = (error: Error) => {
//       console.error('🔴 Socket connection error:', error.message);
//       setIsConnected(false);
//     };

//     // ── Data events ────────────────────────────────────────────────────
//     const onNewAlert = (alert: any) => {
//       console.log('📨 RECEIVED ALERT via WebSocket:', alert.id, alert.incidentType);
//       setLastEvent({ type: 'new_alert', time: new Date() });
//       optionsRef.current.onNewAlert?.(alert);
//     };

//     const onNewFeed = (feed: any) => {
//       console.log('📨 RECEIVED FEED via WebSocket:', feed.id);
//       setLastEvent({ type: 'new_feed', time: new Date() });
//       optionsRef.current.onNewFeed?.(feed);
//     };

//     const onProcessingUpdate = (data: { log: any; summary: any }) => {
//       console.log('📨 RECEIVED PROCESSING UPDATE via WebSocket:', data.log?.id, data.log?.stage);
//       setLastEvent({ type: 'processing_update', time: new Date() });
//       optionsRef.current.onProcessingUpdate?.(data);
//     };

//     // ── Register listeners ─────────────────────────────────────────────
//     socket.on('connect', onConnect);
//     socket.on('disconnect', onDisconnect);
//     socket.on('connect_error', onConnectError);
//     socket.on('new_alert', onNewAlert);
//     socket.on('new_feed', onNewFeed);
//     socket.on('processing_update', onProcessingUpdate);

//     // If socket already connected when this hook mounts (e.g. second component),
//     // sync the state immediately instead of waiting for next 'connect' event
//     if (socket.connected) {
//       setIsConnected(true);
//       setSocketId(socket.id);
//     }

//     // ── Cleanup: remove THIS component's listeners only ────────────────
//     // We do NOT disconnect the socket itself — the shared socket stays alive
//     return () => {
//       socket.off('connect', onConnect);
//       socket.off('disconnect', onDisconnect);
//       socket.off('connect_error', onConnectError);
//       socket.off('new_alert', onNewAlert);
//       socket.off('new_feed', onNewFeed);
//       socket.off('processing_update', onProcessingUpdate);

//       globalSocketRefCount--;
//       // Only disconnect the actual socket when no components are using it
//       if (globalSocketRefCount <= 0) {
//         console.log('🧹 Last socket consumer unmounted — disconnecting');
//         globalSocket?.disconnect();
//         globalSocket = null;
//         globalSocketRefCount = 0;
//       }
//     };
//   }, []); // empty deps — socket is created once

//   const disconnect = useCallback(() => {
//     globalSocket?.disconnect();
//     globalSocket = null;
//     setIsConnected(false);
//   }, []);

//   const reconnect = useCallback(() => {
//     if (globalSocket && !globalSocket.connected) {
//       globalSocket.connect();
//     } else if (!globalSocket) {
//       globalSocket = getSharedSocket();
//     }
//   }, []);

//   return {
//     isConnected,
//     socketId,
//     lastEvent,
//     disconnect,
//     reconnect,
//   };
// }

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:4000';

interface UseSocketOptions {
  onNewAlert?: (alert: any) => void;
  onNewFeed?: (feed: any) => void;
  onProcessingUpdate?: (data: { log: any; summary: any }) => void;
  onTeamResponseUpdate?: (response: any) => void; // ← NEW
  onDispatchLogUpdate?: (log: any) => void; // ← NEW
}

let globalSocket: Socket | null = null;
let globalSocketRefCount = 0;

function getSharedSocket(): Socket {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket', 'polling'],
      forceNew: false,
    });
  }
  return globalSocket;
}

export function useSocket(options: UseSocketOptions = {}) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | undefined>(undefined);
  const [lastEvent, setLastEvent] = useState<{ type: string; time: Date } | null>(null);

  useEffect(() => {
    const socket = getSharedSocket();
    globalSocketRefCount++;

    const onConnect = () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
      setSocketId(socket.id);
    };

    const onDisconnect = (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
      setSocketId(undefined);
    };

    const onConnectError = (error: Error) => {
      console.error('🔴 Socket connection error:', error.message);
      setIsConnected(false);
    };

    const onNewAlert = (alert: any) => {
      console.log('📨 RECEIVED ALERT via WebSocket:', alert.id);
      setLastEvent({ type: 'new_alert', time: new Date() });
      optionsRef.current.onNewAlert?.(alert);
    };

    const onNewFeed = (feed: any) => {
      console.log('📨 RECEIVED FEED via WebSocket:', feed.id);
      setLastEvent({ type: 'new_feed', time: new Date() });
      optionsRef.current.onNewFeed?.(feed);
    };

    const onProcessingUpdate = (data: { log: any; summary: any }) => {
      console.log('📨 RECEIVED PROCESSING UPDATE via WebSocket:', data.log?.id);
      setLastEvent({ type: 'processing_update', time: new Date() });
      optionsRef.current.onProcessingUpdate?.(data);
    };

    // ← NEW: listen for team response updates
    const onTeamResponseUpdate = (response: any) => {
      console.log('📨 RECEIVED TEAM RESPONSE via WebSocket:', response.id, response.respondingRole, response.currentStatus);
      setLastEvent({ type: 'team_response_update', time: new Date() });
      optionsRef.current.onTeamResponseUpdate?.(response);
    };

    // ← NEW: listen for dispatch log updates
    const onDispatchLogUpdate = (log: any) => {
      console.log('📨 RECEIVED DISPATCH LOG via WebSocket:', log.id, log.action);
      setLastEvent({ type: 'dispatch_log_update', time: new Date() });
      optionsRef.current.onDispatchLogUpdate?.(log);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('new_alert', onNewAlert);
    socket.on('new_feed', onNewFeed);
    socket.on('processing_update', onProcessingUpdate);
    socket.on('team_response_update', onTeamResponseUpdate); // ← NEW
    socket.on('dispatch_log_update', onDispatchLogUpdate); // ← NEW

    if (socket.connected) {
      setIsConnected(true);
      setSocketId(socket.id);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('new_alert', onNewAlert);
      socket.off('new_feed', onNewFeed);
      socket.off('processing_update', onProcessingUpdate);
      socket.off('team_response_update', onTeamResponseUpdate); // ← NEW
      socket.off('dispatch_log_update', onDispatchLogUpdate); // ← NEW

      globalSocketRefCount--;
      if (globalSocketRefCount <= 0) {
        console.log('🧹 Last socket consumer unmounted — disconnecting');
        globalSocket?.disconnect();
        globalSocket = null;
        globalSocketRefCount = 0;
      }
    };
  }, []);

  const disconnect = useCallback(() => {
    globalSocket?.disconnect();
    globalSocket = null;
    setIsConnected(false);
  }, []);

  const reconnect = useCallback(() => {
    if (globalSocket && !globalSocket.connected) {
      globalSocket.connect();
    } else if (!globalSocket) {
      globalSocket = getSharedSocket();
    }
  }, []);

  return { isConnected, socketId, lastEvent, disconnect, reconnect };
}