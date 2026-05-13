import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/context/SimulationContext';
import { Alert as AlertType, Priority, ResponderRole, DispatchReport, CoordinationStatus } from '@/types/simulation';
import { cn } from '@/lib/utils';
import {
  AlertTriangle, Flame, Droplets, Activity, Shield, Truck, Stethoscope, Users,
  MapPin, Clock, Send, CheckCircle, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import AlertHeatMap from '@/components/AlertHeatMap';
import StatsPanel from '@/components/StatsPanel';
import DispatchReportDialog from '@/components/DispatchReportDialog';
import { toast } from 'sonner';

const ROLE_OPTIONS: { value: ResponderRole; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All Teams', icon: Users },
  { value: 'fire_department', label: 'Fire Dept', icon: Flame },
  { value: 'flood_rescue', label: 'Flood Rescue', icon: Droplets },
  { value: 'medical', label: 'Medical', icon: Stethoscope },
  { value: 'police', label: 'Police', icon: Shield },
];

const priorityConfig: Record<Priority, { color: string; bg: string; label: string }> = {
  CRITICAL: { color: 'text-critical', bg: 'bg-critical/10 border-critical/30', label: 'CRITICAL' },
  HIGH: { color: 'text-warning', bg: 'bg-warning/10 border-warning/30', label: 'HIGH' },
  MEDIUM: { color: 'text-info', bg: 'bg-info/10 border-info/30', label: 'MEDIUM' },
  LOW: { color: 'text-muted-foreground', bg: 'bg-muted/50 border-border', label: 'LOW' },
};

const incidentIcon: Record<string, React.ElementType> = {
  fire: Flame,
  flood: Droplets,
  earthquake: Activity,
  rescue: Truck,
  medical: Stethoscope,
  infrastructure: Shield,
  storm: Droplets,
};

const roleLabel: Record<string, string> = {
  fire_department: 'Fire', flood_rescue: 'Flood', medical: 'Medical', police: 'Police',
};

const statusColors: Record<CoordinationStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
};

function DispatchedIncidentCard({ report }: { report: DispatchReport }) {
  const { updateTeamStatus, addCoordinationNote } = useSimulation();
  const [expanded, setExpanded] = useState(false);
  const [noteText, setNoteText] = useState('');

  const config = priorityConfig[report.criticality];
  const Icon = incidentIcon[report.incidentType] || AlertTriangle;

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addCoordinationNote(report.id, 'all', 'Command', noteText.trim());
    setNoteText('');
  };

  const cycleStatus = (role: ResponderRole) => {
    const assignment = report.teamAssignments.find(ta => ta.role === role);
    if (!assignment) return;
    const next: CoordinationStatus =
      assignment.status === 'not_started' ? 'in_progress' :
      assignment.status === 'in_progress' ? 'completed' : 'not_started';
    updateTeamStatus(report.id, role, next);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('border rounded-lg p-3 mb-2', config.bg)}>
      <div className="flex items-start gap-2">
        <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn('text-[10px] font-bold font-mono', config.color)}>{report.criticality}</span>
              <span className="text-[10px] text-muted-foreground capitalize">• {report.incidentType}</span>
            </div>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">{report.location}</span>
          </div>

          {/* Team assignment chips */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {report.teamAssignments.map(ta => (
              <button
                key={ta.role}
                onClick={() => cycleStatus(ta.role)}
                className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-medium cursor-pointer transition-all', statusColors[ta.status])}
                title={`Click to update status of ${roleLabel[ta.role] || ta.role}`}
              >
                {roleLabel[ta.role] || ta.role}: {ta.status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {expanded && (
            <div className="mt-2 space-y-2">
              <p className="text-[10px] text-muted-foreground">{report.notes}</p>
              {report.resourcesNeeded && <p className="text-[10px] text-muted-foreground"><span className="font-semibold">Resources:</span> {report.resourcesNeeded}</p>}

              {/* Coordination notes */}
              {report.coordinationNotes.length > 0 && (
                <div className="space-y-1 border-t border-border/40 pt-1.5">
                  {report.coordinationNotes.map(n => (
                    <div key={n.id} className="text-[10px] text-muted-foreground">
                      <span className="font-mono text-[9px]">{new Date(n.timestamp).toLocaleTimeString()}</span>{' '}
                      <span className="font-semibold text-foreground">{n.author}:</span> {n.text}
                    </div>
                  ))}
                </div>
              )}

              {/* Quick note input */}
              <div className="flex gap-1">
                <Input
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add coordination note..."
                  className="h-6 text-[10px] bg-muted/30 border-border"
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                />
                <Button size="sm" variant="ghost" className="h-6 px-2" onClick={handleAddNote}>
                  <MessageSquare className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AlertCard({ alert, onDispatch, isDispatched }: { alert: AlertType; onDispatch: () => void; isDispatched: boolean }) {
  const config = priorityConfig[alert.priority];
  const Icon = incidentIcon[alert.incidentType] || AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("border rounded-lg p-3 mb-2", config.bg)}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-bold font-mono", config.color)}>{config.label}</span>
            <span className="text-xs text-muted-foreground capitalize">• {alert.incidentType}</span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{alert.location}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{alert.description}</p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
            {isDispatched ? (
              <Badge variant="outline" className="text-[10px] gap-1 border-success/40 text-success bg-success/10">
                <CheckCircle className="w-3 h-3" /> Dispatched
              </Badge>
            ) : (
              <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 border-primary/40 text-primary hover:bg-primary/10" onClick={onDispatch}>
                <Send className="w-3 h-3" /> Dispatch
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { filteredAlerts, selectedRole, setSelectedRole, isSimulationRunning, alerts, dispatchedReports, addDispatchReport } = useSimulation();
  const [dispatchAlert, setDispatchAlert] = useState<AlertType | null>(null);

  const dispatchedAlertIds = new Set(dispatchedReports.map(r => r.alertId));

  const handleDispatch = (report: DispatchReport) => {
    addDispatchReport(report);
    toast.success(`Dispatched to ${report.assignedRoles.map(r => roleLabel[r] || r).join(', ')}`, {
      description: `${report.criticality} — ${report.peopleAffected} people at ${report.location}`,
    });
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Command Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Real-time emergency coordination
              {isSimulationRunning && <span className="text-critical ml-2 animate-pulse">● LIVE</span>}
            </p>
          </div>
          {dispatchedReports.length > 0 && (
            <Badge variant="outline" className="gap-1 border-success/40 text-success bg-success/10">
              <Send className="w-3 h-3" /> {dispatchedReports.length} Dispatched
            </Badge>
          )}
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {ROLE_OPTIONS.map(role => (
            <Button
              key={role.value}
              variant={selectedRole === role.value ? "default" : "outline"}
              size="sm"
              className="gap-1.5 text-xs"
              onClick={() => setSelectedRole(role.value)}
            >
              <role.icon className="w-3.5 h-3.5" />
              {role.label}
            </Button>
          ))}
        </div>

        {/* Stats */}
        <StatsPanel alerts={alerts} />

        {/* Map + Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-panel p-4">
              <h2 className="font-bold mb-3 text-sm">Emergency Heatmap</h2>
              <AlertHeatMap alerts={filteredAlerts} />
            </div>

            {/* Dispatched Incidents Coordination */}
            {dispatchedReports.length > 0 && (
              <div className="glass-panel p-4 max-h-[50vh] overflow-hidden flex flex-col">
                <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Active Dispatches
                  <span className="text-[10px] text-muted-foreground font-mono ml-auto">{dispatchedReports.length} incidents</span>
                </h2>
                <div className="overflow-y-auto flex-1 pr-1">
                  {dispatchedReports.map(report => (
                    <DispatchedIncidentCard key={report.id} report={report} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Alert Feed */}
          <div className="lg:col-span-2 glass-panel p-4 flex flex-col max-h-[70vh]">
            <div className="flex items-center justify-between mb-3 flex-shrink-0">
              <h2 className="font-bold text-sm">Alert Feed</h2>
              <span className="text-xs text-muted-foreground font-mono">{filteredAlerts.length} alerts</span>
            </div>
            <div className="overflow-y-auto flex-1 pr-1">
              {filteredAlerts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  No alerts yet. Start the simulation from the Data Input page.
                </p>
              ) : (
                <AnimatePresence>
                  {filteredAlerts.map(alert => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      isDispatched={dispatchedAlertIds.has(alert.id)}
                      onDispatch={() => setDispatchAlert(alert)}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Dialog */}
      {dispatchAlert && (
        <DispatchReportDialog
          alert={dispatchAlert}
          open={!!dispatchAlert}
          onOpenChange={open => { if (!open) setDispatchAlert(null); }}
          onDispatch={handleDispatch}
        />
      )}
    </div>
  );
}
