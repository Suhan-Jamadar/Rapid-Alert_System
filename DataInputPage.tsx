import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/context/SimulationContext';
import { Play, Square, Upload, Send, Radio, MapPin, FileText, Twitter, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FeedItem } from '@/types/simulation';
import { cn } from '@/lib/utils';


const FeedItemCard = React.memo(function FeedItemCard({ item }: { item: FeedItem }) {
  const iconMap = { tweet: Twitter, image: Image, manual_report: FileText };
  const colorMap = { tweet: 'text-info', image: 'text-warning', manual_report: 'text-success' };
  const Icon = iconMap[item.type];
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, height: 0 }}
      animate={{ opacity: 1, x: 0, height: 'auto' }}
      className="glass-panel p-3 mb-2"
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", colorMap[item.type])} />
        <div className="min-w-0 flex-1">
          {item.location && (
            <div className="flex items-center gap-1 mb-2 font-bold text-xs">
              <MapPin className="w-3 h-3 text-warning" />
              <span className="text-warning bg-warning/10 px-1.5 py-0.5 rounded">{item.location}</span>
            </div>
          )}
          <p className="text-sm text-foreground leading-relaxed">{item.content}</p>
          <p className="text-xs text-muted-foreground mt-1.5 font-mono">
            {typeof item.timestamp === 'string' ? new Date(item.timestamp).toLocaleTimeString() : item.timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

export default function DataInputPage() {
  const { isSimulationRunning, startSimulation, stopSimulation, addManualReport, addImageReport, feedItems } = useSimulation();
  const [reportLocation, setReportLocation] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [imageLocation, setImageLocation] = useState('');
  const [imageDescription, setImageDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmitReport = () => {
    if (!reportLocation.trim() || !reportDescription.trim()) return;
    addManualReport(reportLocation, reportDescription);
    setReportLocation('');
    setReportDescription('');
  };

  const handleImageUpload = () => {
    if (!imageLocation.trim() || !imageDescription.trim()) return;
    addImageReport(imageLocation, imageDescription);
    setImageLocation('');
    setImageDescription('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const memoizedFeedItems = useMemo(() => feedItems, [feedItems]);
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Data Input</h1>
          <p className="text-muted-foreground">Upload disaster data, submit reports, and run the tweet simulator.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Input Forms */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tweet Simulator */}
            <div className="glass-panel p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className={cn("w-5 h-5", isSimulationRunning ? "text-critical animate-pulse" : "text-muted-foreground")} />
                  <h2 className="font-bold text-lg">Tweet Simulator</h2>
                </div>
                <Button
                  onClick={isSimulationRunning ? stopSimulation : startSimulation}
                  variant={isSimulationRunning ? "destructive" : "default"}
                  size="sm"
                  className="gap-2"
                >
                  {isSimulationRunning ? <><Square className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Start Stream</>}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {isSimulationRunning
                  ? "🔴 Streaming disaster tweets every 3-6 seconds. Watch the live feed →"
                  : "Start the simulator to stream sample disaster tweets periodically."}
              </p>
            </div>

            {/* Image Upload */}
            <div className="glass-panel p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-warning" />
                <h2 className="font-bold text-lg">Image Upload</h2>
              </div>
              <div className="space-y-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-secondary-foreground hover:file:bg-secondary/80 w-full" />
                <Input placeholder="Location (e.g., Bridge Road)" value={imageLocation} onChange={e => setImageLocation(e.target.value)} />
                <Input placeholder="Describe what the image shows" value={imageDescription} onChange={e => setImageDescription(e.target.value)} />
                <Button onClick={handleImageUpload} variant="outline" size="sm" className="gap-2">
                  <Upload className="w-3 h-3" /> Submit Image Report
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
                <Input placeholder="Location" value={reportLocation} onChange={e => setReportLocation(e.target.value)} />
                <Textarea placeholder="Describe the incident..." value={reportDescription} onChange={e => setReportDescription(e.target.value)} rows={3} />
                <Button onClick={handleSubmitReport} variant="outline" size="sm" className="gap-2">
                  <Send className="w-3 h-3" /> Submit Report
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Live Feed */}
          <div className="glass-panel p-4 flex flex-col max-h-[80vh]">
            <div className="flex items-center gap-2 mb-4 px-2 flex-shrink-0">
              <div className={cn("w-2 h-2 rounded-full", memoizedFeedItems.length > 0 ? "bg-success pulse-dot" : "bg-muted-foreground")} />
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
