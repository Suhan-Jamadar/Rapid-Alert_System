import React, { useState, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/context/SimulationContext';
import {
  Play, Square, Upload, Send, Radio, MapPin, FileText, Twitter,
  Image as ImageIcon, Loader2, CheckCircle2, AlertCircle, Sparkles,
  PencilLine, RefreshCw, ShieldAlert, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FeedItem } from '@/types/simulation';
import { cn } from '@/lib/utils';
import { geocodeAddress } from '@/lib/geocode';
import { useImageAnalysis, ImageAnalysisResult } from '@/lib/useImageAnalysis';

type GeoStatus = 'idle' | 'loading' | 'success' | 'fallback';

// ─── Geo status badge (unchanged) ──────────────────────────────────────────
function GeoStatusBadge({ status, displayName }: { status: GeoStatus; displayName?: string }) {
  if (status === 'idle') return null;
  if (status === 'loading') return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
      <Loader2 className="w-3 h-3 animate-spin" />
      <span>Geocoding address…</span>
    </div>
  );
  if (status === 'success') return (
    <div className="flex items-center gap-1.5 text-xs text-success mt-1">
      <CheckCircle2 className="w-3 h-3" />
      <span className="truncate" title={displayName}>📍 {displayName}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1.5 text-xs text-warning mt-1">
      <AlertCircle className="w-3 h-3" />
      <span>Location not found on map — using nearest known area</span>
    </div>
  );
}

// ─── Priority pill ──────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-500/15 text-red-400 border border-red-500/30',
  HIGH:     'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  MEDIUM:   'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  LOW:      'bg-gray-500/15 text-gray-400 border border-gray-500/30',
};

function PriorityPill({ priority }: { priority: string }) {
  return (
    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider', PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.LOW)}>
      {priority}
    </span>
  );
}

// ─── AI Analysis result card ────────────────────────────────────────────────
function AnalysisCard({
  result,
  onReanalyse,
  isLoading,
}: {
  result: ImageAnalysisResult;
  onReanalyse: () => void;
  isLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      className="rounded-lg border border-border bg-secondary/40 overflow-hidden"
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">AI Analysis</span>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-mono text-muted-foreground">{result.confidence}% confidence</span>
          <span className="text-xs font-medium text-foreground capitalize">{result.incidentType}</span>
          <PriorityPill priority={result.priority} />
          <button
            onClick={onReanalyse}
            disabled={isLoading}
            className="ml-1 p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground disabled:opacity-40"
            title="Re-analyse"
          >
            <RefreshCw className={cn('w-3 h-3', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-3">
        <p className="text-sm text-foreground/90 leading-relaxed">{result.description}</p>
      </div>

      {/* Risks & Recommendations — collapsible */}
      <div className="border-t border-border/50">
        <button
          onClick={() => setExpanded(p => !p)}
          className="w-full flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Risks &amp; recommendations
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-4 px-4 pb-4">
                <div>
                  <p className="text-xs font-semibold text-orange-400 mb-2">Risks</p>
                  <ul className="space-y-1">
                    {result.risks.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-orange-400/60 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold text-cyan-400 mb-2">Recommendations</p>
                  <ul className="space-y-1">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="mt-1.5 w-1 h-1 rounded-full bg-cyan-400/60 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Feed item card (unchanged) ─────────────────────────────────────────────
const FeedItemCard = React.memo(function FeedItemCard({ item }: { item: FeedItem }) {
  const iconMap = { tweet: Twitter, image: ImageIcon, manual_report: FileText };
  const colorMap = { tweet: 'text-info', image: 'text-warning', manual_report: 'text-success' };
  const Icon = iconMap[item.type];
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      className="glass-panel p-3 mb-2"
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', colorMap[item.type])} />
        <div className="min-w-0 flex-1">
          {item.location && (
            <div className="flex items-center gap-1 mb-2 font-bold text-xs">
              <MapPin className="w-3 h-3 text-warning" />
              <span className="text-warning bg-warning/10 px-1.5 py-0.5 rounded">{item.location}</span>
            </div>
          )}
          <p className="text-sm text-foreground leading-relaxed">{item.content}</p>
          {(item as any).translatedContent && (
            <div className="mt-1.5 pl-2 border-l-2 border-purple-400/40">
              <span className="text-xs text-purple-400 font-semibold uppercase tracking-wide">
                🌐 {(item as any).detectedLanguage?.toUpperCase()} → EN
              </span>
              <p className="text-xs text-muted-foreground mt-0.5 italic">"{(item as any).translatedContent}"</p>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1.5 font-mono">
            {typeof item.timestamp === 'string'
              ? new Date(item.timestamp).toLocaleTimeString()
              : item.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Main page ───────────────────────────────────────────────────────────────
export default function DataInputPage() {
  const { isSimulationRunning, startSimulation, stopSimulation, addManualReport, addImageReport, feedItems } = useSimulation();

  // — Manual report state —
  const [reportLocation, setReportLocation] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportGeoStatus, setReportGeoStatus] = useState<GeoStatus>('idle');
  const [reportGeoDisplay, setReportGeoDisplay] = useState('');

  // — Image upload state —
  const [imageLocation, setImageLocation] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const [imageGeoStatus, setImageGeoStatus] = useState<GeoStatus>('idle');
  const [imageGeoDisplay, setImageGeoDisplay] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status: aiStatus, result: aiResult, analyse, reset: resetAI } = useImageAnalysis();

  // When user selects a file → trigger AI analysis immediately
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    resetAI();
    setImageDescription('');

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    // Generate preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Kick off AI analysis
    const result = await analyse(file);
    if (result) {
      // Pre-fill description (editable by user)
      setImageDescription(result.description);
    }
  }, [analyse, resetAI]);

  // Re-analyse with same file
  const handleReanalyse = useCallback(async () => {
    if (!selectedFile) return;
    const result = await analyse(selectedFile);
    if (result) setImageDescription(result.description);
  }, [selectedFile, analyse]);

  const handleImageUpload = async () => {
    if (!imageLocation.trim() || !imageDescription.trim()) return;
    setImageGeoStatus('loading');
    const geo = await geocodeAddress(imageLocation);
    if (geo) {
      setImageGeoStatus('success');
      setImageGeoDisplay(geo.displayName);
      addImageReport(imageLocation, imageDescription, { lat: geo.lat, lng: geo.lng });
    } else {
      setImageGeoStatus('fallback');
      addImageReport(imageLocation, imageDescription);
    }
    // Reset
    setImageLocation('');
    setImageDescription('');
    setSelectedFile(null);
    setPreviewUrl(null);
    resetAI();
    if (fileInputRef.current) fileInputRef.current.value = '';
    setTimeout(() => setImageGeoStatus('idle'), 4000);
  };

  const handleSubmitReport = async () => {
    if (!reportLocation.trim() || !reportDescription.trim()) return;
    setReportGeoStatus('loading');
    const geo = await geocodeAddress(reportLocation);
    if (geo) {
      setReportGeoStatus('success');
      setReportGeoDisplay(geo.displayName);
      addManualReport(reportLocation, reportDescription, { lat: geo.lat, lng: geo.lng });
    } else {
      setReportGeoStatus('fallback');
      addManualReport(reportLocation, reportDescription);
    }
    setReportLocation('');
    setReportDescription('');
    setTimeout(() => setReportGeoStatus('idle'), 4000);
  };

  const memoizedFeedItems = useMemo(() => feedItems, [feedItems]);

  const isAnalysing = aiStatus === 'analysing';
  const canSubmitImage = imageLocation.trim() && imageDescription.trim() && !isAnalysing && imageGeoStatus !== 'loading';

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Data Input</h1>
          <p className="text-muted-foreground">Upload disaster data, submit reports, and run the tweet simulator.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left: Forms ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tweet Simulator */}
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className={cn('w-5 h-5', isSimulationRunning ? 'text-critical animate-pulse' : 'text-muted-foreground')} />
                  <h2 className="font-bold text-lg">Tweet Simulator</h2>
                </div>
                <Button
                  onClick={isSimulationRunning ? stopSimulation : startSimulation}
                  variant={isSimulationRunning ? 'destructive' : 'default'}
                  size="sm"
                  className="gap-2"
                >
                  {isSimulationRunning
                    ? <><Square className="w-3 h-3" /> Stop</>
                    : <><Play className="w-3 h-3" /> Start Stream</>}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {isSimulationRunning
                  ? '🔴 Streaming disaster tweets every 3-6 seconds. Watch the live feed →'
                  : 'Start the simulator to stream sample disaster tweets periodically.'}
              </p>
            </div>

            {/* ── Image Upload with AI Analysis ── */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-warning" />
                <h2 className="font-bold text-lg">Image Upload</h2>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-purple-400">
                  <Sparkles className="w-3 h-3" />
                  AI-powered analysis
                </span>
              </div>

              <div className="space-y-3">
                {/* File picker */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tiff"
                  className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 w-full"
                  onChange={handleFileChange}
                />

                {/* Preview + AI status row */}
                <AnimatePresence>
                  {previewUrl && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex gap-3 items-start"
                    >
                      {/* Thumbnail */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded-lg border border-border"
                        />
                        {isAnalysing && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                            <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* AI status / result */}
                      <div className="flex-1 min-w-0">
                        {isAnalysing && (
                          <div className="flex items-center gap-2 text-xs text-purple-400 py-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Agent analysing image…</span>
                          </div>
                        )}

                        {aiStatus === 'done' && aiResult && (
                          <AnalysisCard
                            result={aiResult}
                            onReanalyse={handleReanalyse}
                            isLoading={isAnalysing}
                          />
                        )}

                        {/* Subtle failure notice */}
                        {aiStatus === 'failed' && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 py-1">
                            <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                            <span>Auto-analysis unavailable — please describe the image manually.</span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Location input */}
                <div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      className="pl-8"
                      placeholder="Location in India (e.g., Belagavi Bus Stop, KA)"
                      value={imageLocation}
                      onChange={e => { setImageLocation(e.target.value); setImageGeoStatus('idle'); }}
                    />
                  </div>
                  <GeoStatusBadge status={imageGeoStatus} displayName={imageGeoDisplay} />
                </div>

                {/* Description — pre-filled by AI, always editable */}
                <div className="relative">
                  <Textarea
                    placeholder={isAnalysing ? 'Analysing image…' : 'Describe what the image shows (AI will pre-fill this)'}
                    value={imageDescription}
                    onChange={e => setImageDescription(e.target.value)}
                    rows={3}
                    disabled={isAnalysing}
                    className={cn(
                      'resize-none transition-colors',
                      aiStatus === 'done' && 'border-purple-500/30 focus:border-purple-500/60'
                    )}
                  />
                  {aiStatus === 'done' && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-purple-400/70 pointer-events-none">
                      <PencilLine className="w-2.5 h-2.5" />
                      <span>AI-filled · editable</span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleImageUpload}
                  disabled={!canSubmitImage}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {imageGeoStatus === 'loading'
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Upload className="w-3 h-3" />}
                  Submit Image Report
                </Button>
              </div>
            </div>

            {/* Manual Report */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-success" />
                <h2 className="font-bold text-lg">Manual Incident Report</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      className="pl-8"
                      placeholder="Location in India (e.g., Belagavi Bus Stop, KA)"
                      value={reportLocation}
                      onChange={e => { setReportLocation(e.target.value); setReportGeoStatus('idle'); }}
                    />
                  </div>
                  <GeoStatusBadge status={reportGeoStatus} displayName={reportGeoDisplay} />
                </div>
                <Textarea
                  placeholder="Describe the incident..."
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  rows={3}
                />
                <Button
                  onClick={handleSubmitReport}
                  disabled={reportGeoStatus === 'loading'}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {reportGeoStatus === 'loading'
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Send className="w-3 h-3" />}
                  Submit Report
                </Button>
              </div>
            </div>
          </div>

          {/* ── Right: Live Feed ── */}
          <div className="glass-panel p-4 flex flex-col max-h-[80vh]">
            <div className="flex items-center gap-2 mb-4 px-2 flex-shrink-0">
              <div className={cn('w-2 h-2 rounded-full', memoizedFeedItems.length > 0 ? 'bg-success pulse-dot' : 'bg-muted-foreground')} />
              <h3 className="font-bold text-sm">Live Feed</h3>
              <span className="text-xs text-muted-foreground ml-auto font-mono">{memoizedFeedItems.length} items</span>
            </div>
            <div className="overflow-y-auto flex-1 pr-1">
              <AnimatePresence>
                {memoizedFeedItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data yet. Start the simulator or submit a report.</p>
                ) : (
                  memoizedFeedItems.map(item => <FeedItemCard key={item.id} item={item} />)
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
