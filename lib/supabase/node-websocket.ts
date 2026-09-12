import type { WebSocketLikeConstructor } from '@supabase/supabase-js'
import WebSocket from 'ws'

/** Node 20 has no native WebSocket; supabase-js requires an explicit transport. */
export const nodeWebSocketTransport = WebSocket as unknown as WebSocketLikeConstructor

export const nodeRealtimeOptions = {
  realtime: { transport: nodeWebSocketTransport },
} as const
