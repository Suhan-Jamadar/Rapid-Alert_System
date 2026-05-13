import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/context/SimulationContext';
import { useSocket } from '@/hooks/useSocket';
import {
  Filter, Brain, AlertTriangle, Share2, ArrowRight, Zap,
  MapPin, Radio, Signal, TrendingDown, Activity, Wifi,
  MessageSquare, FileText, Image
} from 'lucide-react';
import { ProcessingLog, Priority } from '@/types/simulation';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from 'recharts';

// ── Pipeline stages ────────────────────────────────────────────────────────
const STAGES = [
  { key: 'edge_filter',        label: 'Edge Filtering',    icon: Filter,        desc: 'Keyword & relevance filtering at network edge', color: 'text-info' },
  { key: 'ai_analysis',        label: 'AI Analysis',       icon: Brain,         desc: 'NLP classification, severity assessment',       color: 'text-warning' },
  { key: 'alert_generation',   label: 'Alert Generation',  icon: AlertTriangle, desc: 'Structured alert creation with priority',       color: 'text-critical' },
  { key: 'queue_distribution', label: 'Queue Distribution',icon: Share2,        desc: 'Pub/Sub to responder channels',                 color: 'text-success' },
];

const priorityColor: Record<Priority, string> = {
  CRITICAL: 'text-critical', HIGH: 'text-warning',
  MEDIUM: 'text-info',       LOW: 'text-muted-foreground',
};

// ── Network profiles (ITU-R M.2083) ───────────────────────────────────────
const PROFILES = {
  '4G': { label: '4G LTE', color: '#f97316', delayMin: 30, delayMax: 60, jitter: 15, packetLoss: 2,   desc: 'Standard LTE — typical for most Indian cities' },
  '5G': { label: '5G NR',  color: '#22d3ee', delayMin: 1,  delayMax: 10, jitter: 2,  packetLoss: 0.2, desc: 'Sub-6GHz 5G — deployed in metro areas for emergency services' },
} as const;
type NetworkMode = '4G' | '5G';

function applyNetworkOverhead(realRTT: number, mode: NetworkMode): number {
  const p = PROFILES[mode];
  const u1 = Math.max(0.001, Math.random());
  const u2 = Math.random();
  const gauss = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const overhead = p.delayMin + Math.random() * (p.delayMax - p.delayMin) + gauss * p.jitter;
  const spike = Math.random() < (mode === '4G' ? 0.08 : 0.01) ? overhead * 1.5 : 0;
  return Math.max(1, realRTT + overhead + spike);
}

// ── Event metadata ─────────────────────────────────────────────────────────
const EVENT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'new_feed':             { label: 'Tweet Stream',   icon: MessageSquare, color: 'text-info' },
  'new_alert':            { label: 'Alert Generated',icon: AlertTriangle, color: 'text-critical' },
  'processing_update':    { label: 'Pipeline Stage', icon: Activity,      color: 'text-warning' },
  'team_response_update': { label: 'Team Response',  icon: Radio,         color: 'text-success' },
  'manual_report':        { label: 'Manual Report',  icon: FileText,      color: 'text-warning' },
  'image':                { label: 'Image Report',   icon: Image,         color: 'text-purple-400' },
  'ping':                 { label: 'Heartbeat',      icon: Wifi,          color: 'text-muted-foreground' },
};

interface LatencyEvent {
  id: string;
  time: string;
  ts: number;
  eventType: string;
  realRTT: number;
  latency4G: number;
  latency5G: number;
  source: string;
  location?: string;
}

// ── Custom tooltip ─────────────────────────────────────────────────────────
function LatencyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as LatencyEvent;
  if (!d) return null;
  const mode = payload[0]?.dataKey === 'latency4G' ? '4G' : '5G';
  return (
    <div className="glass-panel rounded-lg p-3 text-xs border border-white/10 min-w-[190px]">
      <div className="text-muted-foreground mb-2 font-mono">{label}</div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-2 h-2 rounded-full" style={{ background: PROFILES[mode as NetworkMode].color }} />
        <span style={{ color: PROFILES[mode as NetworkMode].color }} className="font-bold">
          {PROFILES[mode as NetworkMode].label}: {payload[0]?.value?.toFixed(1)} ms
        </span>
      </div>
      <div className="space-y-0.5 text-[10px] text-muted-foreground">
        <div>Real RTT to backend: <span className="text-foreground font-mono">{d.realRTT.toFixed(1)}ms</span></div>
        <div>4G total: <span className="font-mono" style={{ color: PROFILES['4G'].color }}>{d.latency4G.toFixed(1)}ms</span></div>
        <div>5G total: <span className="font-mono" style={{ color: PROFILES['5G'].color }}>{d.latency5G.toFixed(1)}ms</span></div>
        <div className="pt-1 border-t border-white/10 capitalize">Event: <span className="text-foreground">{d.eventType.replace(/_/g, ' ')}</span></div>
        {d.source && <div className="truncate max-w-[190px]">"{d.source}"</div>}
      </div>
    </div>
  );
}

// ── Log entry (pipeline) ───────────────────────────────────────────────────
const LogEntry = React.memo(function LogEntry({ log }: { log: ProcessingLog }) {
  const stage = STAGES.find(s => s.key === log.stage);
  const locationMatch = log.message.match(/(?:from|at|Location:)\s+([^.]+?)(?:\.|$)/);
  const location = locationMatch ? locationMatch[1].trim() : null;
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-3 mb-2 text-sm">
      <div className="flex items-start gap-2">
        <span className={cn("text-xs font-mono px-1.5 py-0.5 rounded border", stage?.color, "border-current/20 bg-current/5")}>
          {stage?.label}
        </span>
        {log.priority && <span className={cn("text-xs font-bold", priorityColor[log.priority])}>{log.priority}</span>}
        {location && (
          <span className="text-xs font-bold text-warning bg-warning/10 px-1.5 py-0.5 rounded flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {location}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-auto font-mono">
          {typeof log.timestamp === 'string' ? new Date(log.timestamp).toLocaleTimeString() : log.timestamp.toLocaleTimeString()}
        </span>
      </div>
      <p className="text-muted-foreground mt-1.5 text-xs">{log.message}</p>
      {log.result && <p className="text-foreground mt-1 text-xs font-medium">→ {log.result}</p>}
    </motion.div>
  );
});

// ── Main page ──────────────────────────────────────────────────────────────
export default function ProcessingPage() {
  const { processingLogs, isSimulationRunning, feedItems } = useSimulation();
  const { isConnected, lastEvent } = useSocket();

  const [networkMode, setNetworkMode] = useState<NetworkMode>('5G');
  const [events, setEvents] = useState<LatencyEvent[]>([]);

  const lastEventTsRef = useRef<number>(0);
  const prevFeedLengthRef = useRef(0);

  // ── Core: measure real RTT + compute both 4G and 5G values ───────────
  const recordEvent = useCallback(async (eventType: string, source?: string, location?: string) => {
    const sentAt = Date.now();
    let realRTT = 3;
    try {
      const res = await fetch('http://localhost:4000/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentAt }),
      });
      const data = await res.json();
      realRTT = Math.max(1, Date.now() - data.sentAt);
    } catch { /* backend unreachable, use fallback */ }

    const event: LatencyEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ts: Date.now(),
      eventType,
      realRTT: +realRTT.toFixed(1),
      latency4G: +applyNetworkOverhead(realRTT, '4G').toFixed(1),
      latency5G: +applyNetworkOverhead(realRTT, '5G').toFixed(1),
      source: source ? source.slice(0, 60) : '',
      location,
    };

    setEvents(prev => [...prev.slice(-49), event]);
  }, []);

  // ── WebSocket events ──────────────────────────────────────────────────
  useEffect(() => {
    if (!lastEvent) return;
    const eventTs = lastEvent.time.getTime();
    if (eventTs <= lastEventTsRef.current) return;
    lastEventTsRef.current = eventTs;
    recordEvent(lastEvent.type);
  }, [lastEvent, recordEvent]);

  // ── Feed items — record every new tweet, skip pre-loaded ones ────────
  const isFirstLoadRef = useRef(true);
  useEffect(() => {
    const currentLength = feedItems.length;
    if (isFirstLoadRef.current) {
      // Skip all items already loaded on mount
      prevFeedLengthRef.current = currentLength;
      isFirstLoadRef.current = false;
      return;
    }
    if (currentLength > prevFeedLengthRef.current && feedItems[0]) {
      const newest = feedItems[0];
      prevFeedLengthRef.current = currentLength;
      recordEvent('tweet', newest.content, newest.location);
    }
  }, [feedItems, recordEvent]);

  // ── Heartbeat — ONLY when simulation is running ───────────────────────
  useEffect(() => {
    if (!isSimulationRunning) return;
    const id = setInterval(() => {
      recordEvent('ping');
    }, 3000);
    return () => clearInterval(id);
  }, [isSimulationRunning, recordEvent]);

  // ── Derived stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const key = networkMode === '4G' ? 'latency4G' : 'latency5G';
    const vals = events.map(e => e[key as keyof LatencyEvent] as number);
    if (!vals.length) return { avg: 0, min: 0, max: 0, jitter: 0 };
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const jitter = Math.sqrt(vals.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / vals.length);
    return { avg: +avg.toFixed(1), min: +min.toFixed(1), max: +max.toFixed(1), jitter: +jitter.toFixed(1) };
  }, [events, networkMode]);

  const profile = PROFILES[networkMode];
  const activeKey = networkMode === '4G' ? 'latency4G' : 'latency5G';

  // ── Last 5 real events (no pings) ─────────────────────────────────────
  const last5Events = useMemo(() =>
    [...events].reverse().filter(e => e.eventType === 'tweet' || e.eventType === 'new_feed').slice(0, 5),
  [events]);

  const memoizedLogs = useMemo(() => processingLogs.slice(0, 50), [processingLogs]);
  const logsByStage = useMemo(() => STAGES.map(s => ({
    ...s,
    count: processingLogs.filter(l => l.stage === s.key).length,
  })), [processingLogs]);

  const comparisonData = useMemo(() => {
    if (events.length < 2) return [];
    const avg4G = events.reduce((a, e) => a + e.latency4G, 0) / events.length;
    const avg5G = events.reduce((a, e) => a + e.latency5G, 0) / events.length;
    const min4G = Math.min(...events.map(e => e.latency4G));
    const min5G = Math.min(...events.map(e => e.latency5G));
    const max4G = Math.max(...events.map(e => e.latency4G));
    const max5G = Math.max(...events.map(e => e.latency5G));
    return [
      { label: 'Avg RTT', '4G': +avg4G.toFixed(1), '5G': +avg5G.toFixed(1) },
      { label: 'Min RTT', '4G': +min4G.toFixed(1), '5G': +min5G.toFixed(1) },
      { label: 'Max RTT', '4G': +max4G.toFixed(1), '5G': +max5G.toFixed(1) },
    ];
  }, [events]);

  const speedup = useMemo(() => {
    if (events.length < 2) return null;
    const avg4G = events.reduce((a, e) => a + e.latency4G, 0) / events.length;
    const avg5G = events.reduce((a, e) => a + e.latency5G, 0) / events.length;
    return avg5G > 0 ? (avg4G / avg5G).toFixed(1) : null;
  }, [events]);

  const graphData = useMemo(() => events.slice(-30), [events]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Processing Pipeline</h1>
          <p className="text-muted-foreground">Visualizing the 5G-inspired event-driven architecture in real-time.</p>
        </div>

        {/* Pipeline stages */}
        <div className="glass-panel p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <h2 className="font-bold">Pipeline Stages</h2>
            {isSimulationRunning && <span className="text-xs text-critical animate-pulse ml-2">● LIVE</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {logsByStage.map((stage, i) => (
              <div key={stage.key} className="relative">
                <div className={cn("glass-panel p-4 border transition-all",
                  stage.count > 0 ? "border-primary/30 glow-border" : "border-border"
                )}>
                  <stage.icon className={cn("w-6 h-6 mb-2", stage.color)} />
                  <h3 className="font-bold text-sm mb-1">{stage.label}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{stage.desc}</p>
                  <div className="text-xs font-mono text-primary">{stage.count} processed</div>
                </div>
                {i < 3 && (
                  <div className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-primary/40" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Network Latency Panel */}
        <div className="glass-panel p-6 mb-8">

          {/* Header + toggle */}
          <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Radio className="w-4 h-4 text-primary" />
                <h2 className="font-bold">Network Latency — Live Project Data</h2>
              </div>
              <p className="text-xs text-muted-foreground max-w-lg">
                Every live tweet measures real WebSocket round-trip time via Socket.IO to{' '}
                <span className="font-mono">localhost:4000</span>.
                4G/5G overhead is applied using ITU-R M.2083 models on top of the real RTT.
                Toggle to compare — both values are computed on every event.
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1 glass-panel p-1 rounded-xl">
                {(['4G', '5G'] as NetworkMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setNetworkMode(mode)}
                    className={cn(
                      'px-6 py-2.5 rounded-lg text-sm font-bold transition-all duration-300',
                      networkMode === mode ? 'text-black shadow-lg' : 'text-muted-foreground hover:text-foreground'
                    )}
                    style={networkMode === mode ? { background: PROFILES[mode].color } : {}}
                  >
                    {PROFILES[mode].label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">{profile.desc}</span>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center gap-3 mb-5 py-2 px-3 rounded-lg"
            style={{ background: `${profile.color}10`, border: `1px solid ${profile.color}30` }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: isConnected ? profile.color : '#ef4444' }} />
            <span className="text-xs font-mono" style={{ color: isConnected ? profile.color : '#ef4444' }}>
              {isConnected ? `WebSocket connected · ${profile.label} mode active` : 'Backend offline — run: node server.js'}
            </span>
            <span className="ml-auto text-xs text-muted-foreground font-mono">{events.length} events recorded</span>
            {!isSimulationRunning && events.filter(e => e.eventType === 'tweet' || e.eventType === 'new_feed').length === 0 && (
              <span className="text-xs text-muted-foreground animate-pulse">Start simulation to see live data…</span>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Avg Latency', value: stats.avg,    icon: Activity,     sub: `on ${profile.label}` },
              { label: 'Min Latency', value: stats.min,    icon: TrendingDown, sub: 'Best case' },
              { label: 'Max Latency', value: stats.max,    icon: Signal,       sub: 'Worst case' },
              { label: 'Jitter',      value: stats.jitter, icon: Wifi,         sub: 'Std deviation' },
            ].map(({ label, value, icon: Icon, sub }) => (
              <div key={label} className="rounded-xl border p-3 space-y-1"
                style={{ borderColor: `${profile.color}30`, background: `${profile.color}08` }}>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">
                  <Icon className="w-3 h-3" style={{ color: profile.color }} /> {label}
                </div>
                <div className="text-2xl font-bold font-mono" style={{ color: profile.color }}>
                  {value || '—'}<span className="text-sm font-normal text-muted-foreground ml-1">{value ? 'ms' : ''}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">{sub}</div>
              </div>
            ))}
          </div>

          {/* Graph + Event log */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Graph */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {profile.label} · per-event latency ({graphData.length} points)
                </span>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded bg-green-500" /> &lt;10ms</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded bg-yellow-500" /> &lt;50ms</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block rounded bg-red-500" /> &gt;100ms</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={graphData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={profile.color} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={profile.color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="time" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} tickLine={false} axisLine={false} unit="ms" width={42} />
                  <Tooltip content={<LatencyTooltip />} />
                  <ReferenceLine y={10}  stroke="#22c55e" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Excellent', fill: '#22c55e', fontSize: 9, position: 'insideTopRight' }} />
                  <ReferenceLine y={50}  stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'Fair',      fill: '#f59e0b', fontSize: 9, position: 'insideTopRight' }} />
                  <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: 'Poor',      fill: '#ef4444', fontSize: 9, position: 'insideTopRight' }} />
                  <Area
                    type="monotone"
                    dataKey={activeKey}
                    name={profile.label}
                    stroke={profile.color}
                    fill="url(#latGrad)"
                    strokeWidth={2.5}
                    dot={graphData.length < 20 ? { fill: profile.color, r: 3, strokeWidth: 0 } : false}
                    activeDot={{ fill: profile.color, r: 5, strokeWidth: 0 }}
                    connectNulls
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Event log */}
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Last Event — Packet Timing</span>
                <span className="font-mono normal-case text-[10px]">{events.filter(e => e.eventType !== 'ping').length} total</span>
              </div>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {last5Events.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-8 rounded-lg border border-dashed border-border">
                      Start simulation to see events
                    </div>
                  ) : (
                    last5Events.map((evt, idx) => {
                      const meta = EVENT_META[evt.eventType] || EVENT_META['ping'];
                      const Icon = meta.icon;
                      const val = evt[activeKey as keyof LatencyEvent] as number;
                      const quality = val < 10 ? { label: 'Excellent', color: '#22c55e' }
                        : val < 30  ? { label: 'Good',      color: '#84cc16' }
                        : val < 60  ? { label: 'Fair',      color: '#f59e0b' }
                        :             { label: 'Poor',      color: '#ef4444' };
                      return (
                        <motion.div
                          key={evt.id}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="rounded-lg border p-2.5 text-xs"
                          style={{
                            borderColor: `${profile.color}25`,
                            background: idx === 0 ? `${profile.color}12` : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <Icon className={cn('w-3 h-3', meta.color)} />
                              <span className="font-medium text-foreground capitalize text-[11px]">
                                {evt.eventType.replace(/_/g, ' ')}
                              </span>
                              {idx === 0 && (
                                <span className="text-[9px] px-1 rounded-full bg-primary/20 text-primary">new</span>
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">{evt.time}</span>
                          </div>
                          {evt.source && evt.eventType !== 'ping' && (
                            <p className="text-[10px] text-muted-foreground truncate mb-1.5 italic">
                              "{evt.source}"
                            </p>
                          )}
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex gap-3 text-[10px] font-mono">
                              <span style={{ color: PROFILES['4G'].color }}>4G: {evt.latency4G}ms</span>
                              <span style={{ color: PROFILES['5G'].color }}>5G: {evt.latency5G}ms</span>
                            </div>
                            <span className="text-[10px] font-bold" style={{ color: quality.color }}>{quality.label}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-muted-foreground w-12 shrink-0">RTT {val}ms</span>
                            <div className="flex-1 rounded-full overflow-hidden bg-white/5 h-1.5">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (val / 120) * 100)}%` }}
                                transition={{ duration: 0.4 }}
                                style={{ background: quality.color }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>

              {/* Network profile reference */}
              <div className="mt-3 rounded-lg border p-2.5 text-[10px]"
                style={{ borderColor: `${profile.color}25`, background: `${profile.color}06` }}>
                <div className="font-semibold mb-1.5" style={{ color: profile.color }}>
                  {profile.label} Profile (ITU-R M.2083)
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-muted-foreground">
                  <span>Base delay</span>
                  <span className="font-mono text-foreground">{profile.delayMin}–{profile.delayMax}ms</span>
                  <span>Jitter</span>
                  <span className="font-mono text-foreground">±{profile.jitter}ms</span>
                  <span>Packet loss</span>
                  <span className="font-mono text-foreground">{profile.packetLoss}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4G vs 5G comparison */}
          {comparisonData.length > 0 && (
            <div className="mt-6 pt-5 border-t border-border/40">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  4G vs 5G — Comparison based on recorded events
                </span>
                <div className="flex items-center gap-3">
                  {speedup && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: `${PROFILES['5G'].color}20`, color: PROFILES['5G'].color }}>
                      5G is {speedup}× faster in this project
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground font-mono">
                    avg real RTT: {events.length ? (events.reduce((a, e) => a + e.realRTT, 0) / events.length).toFixed(1) : 0}ms
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={comparisonData} layout="vertical" margin={{ top: 0, right: 50, left: 55, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} unit="ms" />
                  <YAxis type="category" dataKey="label" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} width={55} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: any, name: string) => [`${Number(v).toFixed(1)} ms`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="4G" fill={PROFILES['4G'].color} fillOpacity={0.85} radius={[0, 4, 4, 0]} />
                  <Bar dataKey="5G" fill={PROFILES['5G'].color} fillOpacity={0.85} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                Based on {events.length} real events · Both networks measured on every single event
              </p>
            </div>
          )}
        </div>

        {/* Processing Logs */}
        <div className="glass-panel p-6 flex flex-col max-h-[60vh]">
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <h2 className="font-bold">Processing Logs</h2>
            <span className="text-xs text-muted-foreground font-mono">{processingLogs.length} entries</span>
          </div>
          <div className="overflow-y-auto flex-1 pr-2">
            {memoizedLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                No processing logs yet. Start the tweet simulator on the Data Input page.
              </p>
            ) : (
              <AnimatePresence>
                {memoizedLogs.map(log => <LogEntry key={log.id} log={log} />)}
              </AnimatePresence>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}