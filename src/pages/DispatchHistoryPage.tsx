import React, { useState, useMemo } from 'react';
import { useSimulation } from '@/context/SimulationContext';
import { DispatchReport, ResponderRole, CoordinationStatus, Priority } from '@/types/simulation';
import { cn } from '@/lib/utils';
import {
  Clock, MapPin, Users, Flame, Droplets, Stethoscope, Shield, AlertTriangle,
  Filter, ChevronDown, ChevronUp, Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const roleLabel: Record<string, string> = {
  fire_department: 'Fire', flood_rescue: 'Flood', medical: 'Medical', police: 'Police', all: 'All',
};

const priorityConfig: Record<Priority, { color: string; bg: string }> = {
  CRITICAL: { color: 'text-critical', bg: 'bg-critical/10 border-critical/30' },
  HIGH: { color: 'text-warning', bg: 'bg-warning/10 border-warning/30' },
  MEDIUM: { color: 'text-info', bg: 'bg-info/10 border-info/30' },
  LOW: { color: 'text-muted-foreground', bg: 'bg-muted/50 border-border' },
};

const statusColors: Record<CoordinationStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
};

const logActionStyles: Record<string, string> = {
  created: 'border-primary/30 text-primary',
  team_assigned: 'border-info/30 text-info',
  status_update: 'border-warning/30 text-warning',
  note_added: 'border-muted-foreground/30 text-muted-foreground',
  resolved: 'border-success/30 text-success',
};


const IncidentTimeline = React.memo(function IncidentTimeline({ report }: { report: DispatchReport }) {
  const { dispatchLogs } = useSimulation();
  const [expanded, setExpanded] = useState(false);
  const logs = useMemo(() => dispatchLogs.filter(l => l.dispatchId === report.id), [dispatchLogs, report.id]);
  const config = priorityConfig[report.criticality];
  return (
    <div className={cn('border rounded-lg p-4 mb-3', config.bg)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs font-bold font-mono', config.color)}>{report.criticality}</span>
            <Badge variant="outline" className="text-[10px] capitalize">{report.incidentType}</Badge>
            <Badge variant="outline" className={cn('text-[10px]',
              report.status === 'resolved' ? 'border-success/40 text-success bg-success/10' :
              report.status === 'acknowledged' ? 'border-info/40 text-info bg-info/10' :
              'border-warning/40 text-warning bg-warning/10'
            )}>
              {report.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">{report.location}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1.5">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{typeof report.timestamp === 'string' ? new Date(report.timestamp).toLocaleDateString() : report.timestamp.toLocaleDateString()} {typeof report.timestamp === 'string' ? new Date(report.timestamp).toLocaleTimeString() : report.timestamp.toLocaleTimeString()}</span>
            <span className="mx-1">•</span>
            <Users className="w-3 h-3" /> {report.peopleAffected} affected
          </div>
          <div className="flex flex-wrap gap-1 mb-1">
            {report.teamAssignments.map(ta => (
              <span key={ta.role} className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-medium', statusColors[ta.status])}>
                {roleLabel[ta.role]}: {ta.status.replace('_', ' ')}
              </span>
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
      </div>
      {expanded && (
        <div className="mt-3 border-t border-border/40 pt-3">
          <p className="text-xs text-muted-foreground mb-2">{report.notes}</p>
          {report.coordinationNotes.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-foreground mb-1">Coordination Notes</p>
              {report.coordinationNotes.map(n => (
                <div key={n.id} className="text-[10px] text-muted-foreground ml-2">
                  <span className="font-mono text-[9px]">{typeof n.timestamp === 'string' ? new Date(n.timestamp).toLocaleTimeString() : n.timestamp.toLocaleTimeString()}</span>{' '}
                  <span className="font-semibold text-foreground">{n.author}:</span> {n.text}
                </div>
              ))}
            </div>
          )}
          <p className="text-[10px] font-semibold text-foreground mb-1">Activity Log ({logs.length})</p>
          <div className="space-y-1 ml-2 border-l border-border/50 pl-3">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-2 text-[10px]">
                <span className="font-mono text-[9px] text-muted-foreground shrink-0 w-16">{typeof log.timestamp === 'string' ? new Date(log.timestamp).toLocaleTimeString() : log.timestamp.toLocaleTimeString()}</span>
                <span className={cn('px-1 rounded text-[9px] font-medium border', logActionStyles[log.action] || 'text-muted-foreground')}>
                  {log.action.replace('_', ' ')}
                </span>
                <span className="text-muted-foreground">{log.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default function DispatchHistoryPage() {
  const { dispatchedReports, dispatchLogs } = useSimulation();
  const [locationFilter, setLocationFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  const filtered = useMemo(() =>
    dispatchedReports.filter(r => {
      if (locationFilter && !r.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (teamFilter !== 'all' && !r.assignedRoles.includes(teamFilter as ResponderRole)) return false;
      return true;
    }),
    [dispatchedReports, locationFilter, teamFilter]
  );

  const resolvedCount = useMemo(() => filtered.filter(r => r.status === 'resolved').length, [filtered]);
  const activeCount = useMemo(() => filtered.length - resolvedCount, [filtered, resolvedCount]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Dispatch History</h1>
          <p className="text-sm text-muted-foreground">Full incident timeline and audit trail</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-warning">{activeCount}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-success">{resolvedCount}</p>
            <p className="text-[10px] text-muted-foreground">Resolved</p>
          </div>
          <div className="glass-panel p-3 text-center">
            <p className="text-2xl font-bold text-info">{dispatchLogs.length}</p>
            <p className="text-[10px] text-muted-foreground">Log Entries</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Filter:</span>
          </div>
          <Input
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            placeholder="Search location..."
            className="h-8 w-48 text-xs bg-muted/30 border-border"
          />
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="h-8 w-40 text-xs bg-muted/30 border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              <SelectItem value="fire_department">Fire Dept</SelectItem>
              <SelectItem value="flood_rescue">Flood Rescue</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="police">Police</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Incident list */}
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No dispatch records found.</p>
            </div>
          ) : (
            filtered.map(report => <IncidentTimeline key={report.id} report={report} />)
          )}
        </div>
      </div>
    </div>
  );
}