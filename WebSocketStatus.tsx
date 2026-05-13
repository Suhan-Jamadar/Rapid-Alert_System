import { useSocket } from '@/hooks/useSocket';

/**
 * Drop this anywhere in your UI — TopNav is ideal.
 * Shows live WebSocket connection status with last event received.
 *
 * Usage in TopNav.tsx:
 *   import { WebSocketStatus } from '@/components/WebSocketStatus';
 *   <WebSocketStatus />
 */
export function WebSocketStatus() {
  const { isConnected, socketId, lastEvent } = useSocket();

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      {/* Pulse dot */}
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-500'
        }`}
      />

      {isConnected ? (
        <span className="text-green-400 hidden sm:inline">
          WS ✓ {socketId ? `[${socketId.slice(0, 6)}]` : ''}
        </span>
      ) : (
        <span className="text-red-400 hidden sm:inline">WS ✗ offline</span>
      )}

      {lastEvent && (
        <span className="text-muted-foreground hidden md:inline">
          · {lastEvent.type.replace('_', ' ')} {lastEvent.time.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
