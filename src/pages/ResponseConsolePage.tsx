import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimulation } from '@/context/SimulationContext';
import { DispatchReport, ResponderRole, TeamResponse, Priority, CoordinationStatus } from '@/types/simulation';
import { cn } from '@/lib/utils';
import {
  Flame, Droplets, Stethoscope, Shield, MapPin, Clock, Users, AlertTriangle,
  CheckCircle, Navigation, Truck, Radio, Send, FileText, ShieldAlert,
  MessageSquare, Activity, Pencil
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

// ← Helper function: Convert TeamResponse currentStatus to CoordinationStatus
function getCoordinationStatus(teamResponseStatus: TeamResponse['currentStatus']): CoordinationStatus {
  switch (teamResponseStatus) {
    case 'resolved':
      return 'completed';
    case 'en_route':
    case 'on_scene':
    case 'need_backup':
      return 'in_progress';
    default:
      return 'in_progress';
  }
}

const ROLE_OPTIONS: { value: ResponderRole; label: string; icon: React.ElementType }[] = [
  { value: 'fire_department', label: 'Fire Department', icon: Flame },
  { value: 'flood_rescue',    label: 'Flood Rescue',    icon: Droplets },
  { value: 'medical',         label: 'Medical Team',    icon: Stethoscope },
  { value: 'police',          label: 'Police',          icon: Shield },
];

const priorityConfig: Record<Priority, { color: string; bg: string }> = {
  CRITICAL: { color: 'text-critical',         bg: 'bg-critical/10 border-critical/30' },
  HIGH:     { color: 'text-warning',          bg: 'bg-warning/10 border-warning/30' },
  MEDIUM:   { color: 'text-info',             bg: 'bg-info/10 border-info/30' },
  LOW:      { color: 'text-muted-foreground', bg: 'bg-muted/50 border-border' },
};

const roleLabel: Record<string, string> = {
  fire_department: 'Fire', flood_rescue: 'Flood', medical: 'Medical', police: 'Police',
};

const statusColors: Record<CoordinationStatus, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-warning/20 text-warning',
  completed:   'bg-success/20 text-success',
};

const statusDescriptions: Record<TeamResponse['currentStatus'], string> = {
  en_route: 'en route to scene',
  on_scene: 'arrived on scene',
  resolved: 'rescued victims and resolved incident',
  need_backup: 'requesting additional backup',
};

const STATUS_STEPS: {
  value: TeamResponse['currentStatus'];
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}[] = [
  { value: 'en_route',    label: 'En Route',    icon: Navigation,    color: 'text-info',     bg: 'bg-info/20 border-info/40 hover:bg-info/30' },
  { value: 'on_scene',    label: 'On Scene',    icon: Activity,      color: 'text-warning',  bg: 'bg-warning/20 border-warning/40 hover:bg-warning/30' },
  { value: 'resolved',    label: 'Rescued',     icon: CheckCircle,   color: 'text-success',  bg: 'bg-success/20 border-success/40 hover:bg-success/30' },
  { value: 'need_backup', label: 'Need Backup', icon: AlertTriangle, color: 'text-critical', bg: 'bg-critical/20 border-critical/40 hover:bg-critical/30' },
];

async function saveResponseToBackend(response: TeamResponse) {
  try {
    await fetch('http://localhost:4000/api/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(response),
    });
  } catch (err) {
    console.warn('Failed to save response:', err);
  }
}

// ── Editable dialog — opens on every status button click ──────────────────
function EditStatusDialog({ open, onOpenChange, report, existingResponse, selectedStatus, onSave }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  report: DispatchReport;
  existingResponse: TeamResponse;
  selectedStatus: typeof STATUS_STEPS[0];
  onSave: (updated: TeamResponse) => void;
}) {
  const [teamLeader,        setTeamLeader]        = useState(existingResponse.teamLeader);
  const [teamSize,          setTeamSize]          = useState(String(existingResponse.teamSize));
  const [eta,               setEta]               = useState(existingResponse.eta);
  const [equipmentDeployed, setEquipmentDeployed] = useState(existingResponse.equipmentDeployed);
  const [currentStatus,     setCurrentStatus]     = useState<TeamResponse['currentStatus']>(selectedStatus.value);
  const [situationUpdate,   setSituationUpdate]   = useState(existingResponse.situationUpdate);
  const [casualties,        setCasualties]        = useState(String(existingResponse.casualties));
  const [rescued,           setRescued]           = useState(String(existingResponse.rescued));
  const [hazards,           setHazards]           = useState(existingResponse.hazards);
  const [accessRoute,       setAccessRoute]       = useState(existingResponse.accessRoute);

  const handleSave = () => {
    if (!teamLeader.trim() || !teamSize || !eta.trim() || !situationUpdate.trim() || !equipmentDeployed.trim() || !hazards.trim() || !accessRoute.trim()) {
      toast.error('All fields are required — please fill everything.'); return;
    }
    onSave({
      ...existingResponse,
      teamLeader:        teamLeader.trim(),
      teamSize:          parseInt(teamSize, 10) || existingResponse.teamSize,
      eta:               eta.trim(),
      equipmentDeployed: equipmentDeployed.trim(),
      currentStatus,
      situationUpdate:   situationUpdate.trim(),
      casualties:        parseInt(casualties, 10) || 0,
      rescued:           parseInt(rescued, 10) || 0,
      hazards:           hazards.trim(),
      accessRoute:       accessRoute.trim(),
      timestamp:         new Date(),
    });
    onOpenChange(false);
  };

  const Icon = selectedStatus.icon;
  const config = priorityConfig[report.criticality];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className={cn('w-5 h-5', selectedStatus.color)} />
            Update Response — {roleLabel[existingResponse.respondingRole] || existingResponse.respondingRole}
          </DialogTitle>
        </DialogHeader>

        <div className={cn('rounded-md border p-3 text-xs', config.bg)}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className={cn('font-bold', config.color)}>{report.criticality} — {report.incidentType.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3 h-3" /> {report.location}</div>
        </div>

        <div className="space-y-3 mt-1">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status *</Label>
            <Select value={currentStatus} onValueChange={v => setCurrentStatus(v as TeamResponse['currentStatus'])}>
              <SelectTrigger className="bg-muted/30 border-border"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_STEPS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Team Leader *</Label>
              <Input value={teamLeader} onChange={e => setTeamLeader(e.target.value)} className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Team Size *</Label>
              <Input type="number" min="1" value={teamSize} onChange={e => setTeamSize(e.target.value)} className="bg-muted/30 border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> ETA *</Label>
              <Input value={eta} onChange={e => setEta(e.target.value)} className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" /> Equipment *</Label>
              <Input value={equipmentDeployed} onChange={e => setEquipmentDeployed(e.target.value)} className="bg-muted/30 border-border" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Casualties</Label>
              <Input type="number" min="0" value={casualties} onChange={e => setCasualties(e.target.value)} className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Rescued</Label>
              <Input type="number" min="0" value={rescued} onChange={e => setRescued(e.target.value)} className="bg-muted/30 border-border" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Hazards *</Label>
            <Input value={hazards} onChange={e => setHazards(e.target.value)} className="bg-muted/30 border-border" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Navigation className="w-3 h-3" /> Access Route *</Label>
            <Input value={accessRoute} onChange={e => setAccessRoute(e.target.value)} className="bg-muted/30 border-border" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> Situation Update *</Label>
            <Textarea value={situationUpdate} onChange={e => setSituationUpdate(e.target.value)} rows={3} className="bg-muted/30 border-border resize-none" />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave}>
            <Send className="w-3.5 h-3.5" /> Save &amp; Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── First-time response form ───────────────────────────────────────────────
function ResponseFormDialog({ report, role, open, onOpenChange, onSubmit }: {
  report: DispatchReport; role: ResponderRole;
  open: boolean; onOpenChange: (v: boolean) => void;
  onSubmit: (r: TeamResponse) => void;
}) {
  const [teamLeader, setTeamLeader] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [eta, setEta] = useState('');
  const [equipmentDeployed, setEquipmentDeployed] = useState('');
  const [currentStatus, setCurrentStatus] = useState<TeamResponse['currentStatus']>('en_route');
  const [situationUpdate, setSituationUpdate] = useState('');
  const [casualties, setCasualties] = useState('0');
  const [rescued, setRescued] = useState('0');
  const [hazards, setHazards] = useState('');
  const [accessRoute, setAccessRoute] = useState('');

  const handleSubmit = () => {
    if (!teamLeader || !teamSize || !eta || !situationUpdate || !hazards || !accessRoute || !equipmentDeployed) {
      toast.error('Fill all required fields.'); return;
    }
    onSubmit({
      id: `response-${Date.now()}`,
      dispatchReportId: report.id,
      alertId: report.alertId,
      respondingRole: role,
      teamLeader, teamSize: parseInt(teamSize, 10) || 1, eta,
      equipmentDeployed, currentStatus, situationUpdate,
      casualties: parseInt(casualties, 10) || 0,
      rescued: parseInt(rescued, 10) || 0,
      hazards, accessRoute, timestamp: new Date(),
    });
    onOpenChange(false);
  };

  const config = priorityConfig[report.criticality];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Radio className="w-5 h-5 text-primary" /> Team Response — {roleLabel[role] || role}
          </DialogTitle>
        </DialogHeader>
        <div className={cn('rounded-md border p-3 text-xs', config.bg)}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className={cn('font-bold', config.color)}>{report.criticality} — {report.incidentType.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {report.location}</div>
          <p className="mt-1 opacity-80">{report.notes}</p>
        </div>
        <div className="space-y-3 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Team Leader *</Label><Input value={teamLeader} onChange={e => setTeamLeader(e.target.value)} placeholder="Name" className="bg-muted/30 border-border" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Size *</Label><Input type="number" min="1" value={teamSize} onChange={e => setTeamSize(e.target.value)} placeholder="#" className="bg-muted/30 border-border" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">ETA *</Label><Input value={eta} onChange={e => setEta(e.target.value)} placeholder="e.g. 12 min" className="bg-muted/30 border-border" /></div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Initial Status</Label>
              <Select value={currentStatus} onValueChange={v => setCurrentStatus(v as TeamResponse['currentStatus'])}>
                <SelectTrigger className="bg-muted/30 border-border"><SelectValue /></SelectTrigger>
                <SelectContent>{STATUS_STEPS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Equipment *</Label><Input value={equipmentDeployed} onChange={e => setEquipmentDeployed(e.target.value)} placeholder="e.g. 2 trucks, hazmat" className="bg-muted/30 border-border" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Casualties</Label><Input type="number" min="0" value={casualties} onChange={e => setCasualties(e.target.value)} className="bg-muted/30 border-border" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Rescued</Label><Input type="number" min="0" value={rescued} onChange={e => setRescued(e.target.value)} className="bg-muted/30 border-border" /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Hazards *</Label><Input value={hazards} onChange={e => setHazards(e.target.value)} placeholder="e.g. gas leak" className="bg-muted/30 border-border" /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Access Route *</Label><Input value={accessRoute} onChange={e => setAccessRoute(e.target.value)} placeholder="e.g. North via Hwy 4" className="bg-muted/30 border-border" /></div>
          <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Situation Update *</Label><Textarea value={situationUpdate} onChange={e => setSituationUpdate(e.target.value)} placeholder="Current conditions..." rows={2} className="bg-muted/30 border-border resize-none" /></div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="gap-1.5" onClick={handleSubmit}><Send className="w-3.5 h-3.5" /> Submit Response</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Dispatch card ──────────────────────────────────────────────────────────
function DispatchCard({ report, activeRole, onRespond, existingResponse, onUpdateResponse }: {
  report: DispatchReport; activeRole: ResponderRole;
  onRespond: () => void; existingResponse?: TeamResponse;
  onUpdateResponse: (updated: TeamResponse) => void;
}) {
  const { addCoordinationNote } = useSimulation();
  const config = priorityConfig[report.criticality];
  const [noteText, setNoteText] = useState('');
  const [editDialog, setEditDialog] = useState<typeof STATUS_STEPS[0] | null>(null);

  const handleAddNote = () => {
    if (!noteText.trim()) return;
    addCoordinationNote(report.id, activeRole, roleLabel[activeRole] || 'Team', noteText.trim());
    setNoteText('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={cn('border rounded-lg p-4 mb-3', config.bg)}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-bold font-mono', config.color)}>{report.criticality}</span>
          <Badge variant="outline" className="text-[10px] capitalize">{report.incidentType}</Badge>
        </div>
        <span className="text-[10px] text-muted-foreground font-mono">{new Date(report.timestamp).toLocaleTimeString()}</span>
      </div>
      <div className="flex items-center gap-1 mb-1"><MapPin className="w-3 h-3 text-muted-foreground" /><span className="text-sm font-semibold">{report.location}</span></div>
      <p className="text-xs text-muted-foreground mb-2">{report.notes}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        {report.teamAssignments.map(ta => (
          <span key={ta.role} className={cn('text-[9px] px-1.5 py-0.5 rounded-full border font-medium', statusColors[ta.status])}>
            {roleLabel[ta.role] || ta.role}: {ta.status.replace('_', ' ')}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground mb-3">
        <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {report.peopleAffected} affected</div>
        {report.resourcesNeeded && <div className="flex items-center gap-1"><Truck className="w-3 h-3" /> {report.resourcesNeeded}</div>}
      </div>
      {report.coordinationNotes.length > 0 && (
        <div className="space-y-1 border-t border-border/40 pt-2 mb-2">
          {report.coordinationNotes.slice(-3).map(n => (
            <div key={n.id} className="text-[10px] text-muted-foreground">
              <span className="font-mono text-[9px]">{new Date(n.timestamp).toLocaleTimeString()}</span>{' '}
              <span className="font-semibold text-foreground">{n.author}:</span> {n.text}
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-1 mb-3">
        <Input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add note..." className="h-6 text-[10px] bg-muted/30 border-border" onKeyDown={e => e.key === 'Enter' && handleAddNote()} />
        <Button size="sm" variant="ghost" className="h-6 px-2" onClick={handleAddNote}><MessageSquare className="w-3 h-3" /></Button>
      </div>

      {existingResponse ? (
        <div className="space-y-3">
          {/* Summary card */}
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success" /> Response Submitted</span>
              <span className="font-mono text-[10px] text-muted-foreground">{new Date(existingResponse.timestamp).toLocaleTimeString()}</span>
            </div>
            <p><span className="text-muted-foreground">Leader:</span> <span className="font-medium">{existingResponse.teamLeader}</span> · {existingResponse.teamSize} personnel</p>
            <p><span className="text-muted-foreground">ETA:</span> <span className="font-medium">{existingResponse.eta}</span> · <span className="text-muted-foreground">Status:</span> <span className="font-medium capitalize text-warning">{statusDescriptions[existingResponse.currentStatus] || existingResponse.currentStatus.replace('_', ' ')}</span></p>
            <p><span className="text-muted-foreground">Equipment:</span> <span className="font-medium">{existingResponse.equipmentDeployed}</span></p>
            <p><span className="text-muted-foreground">Hazards:</span> <span className="font-medium">{existingResponse.hazards}</span></p>
            <p><span className="text-muted-foreground">Access Route:</span> <span className="font-medium">{existingResponse.accessRoute}</span></p>
            <p><span className="text-muted-foreground">Casualties:</span> {existingResponse.casualties} · <span className="text-muted-foreground">Rescued:</span> {existingResponse.rescued}</p>
            <p className="text-muted-foreground italic">{existingResponse.situationUpdate}</p>
          </div>

          {/* Status buttons */}
          <div>
            <p className="text-[10px] text-muted-foreground mb-1.5 font-medium uppercase tracking-wider flex items-center gap-1">
              <Pencil className="w-3 h-3" /> Click any status to edit &amp; update
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_STEPS.map(step => {
                const Icon = step.icon;
                const isActive = existingResponse.currentStatus === step.value;
                return (
                  <button
                    key={step.value}
                    onClick={() => setEditDialog(step)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all text-left',
                      step.bg, step.color,
                      isActive && 'ring-2 ring-current ring-offset-1 ring-offset-background'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{step.label}</span>
                    {isActive && <CheckCircle className="w-3 h-3 ml-auto shrink-0 opacity-70" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <Button size="sm" className="w-full gap-1.5 text-xs" onClick={onRespond}>
          <Radio className="w-3.5 h-3.5" /> Respond
        </Button>
      )}

      {editDialog && existingResponse && (
        <EditStatusDialog
          open={!!editDialog}
          onOpenChange={open => { if (!open) setEditDialog(null); }}
          report={report}
          existingResponse={existingResponse}
          selectedStatus={editDialog}
          onSave={onUpdateResponse}
        />
      )}
    </motion.div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function ResponseConsolePage() {
  const { dispatchedReports, teamResponses, addTeamResponse, selectedRole, setSelectedRole, updateTeamStatus } = useSimulation();
  const [respondingReport, setRespondingReport] = useState<DispatchReport | null>(null);
  const [localResponses, setLocalResponses] = useState<TeamResponse[]>([]);

  const activeRole = selectedRole === 'all' ? null : selectedRole;
  const filteredReports = activeRole
    ? dispatchedReports.filter(r => r.assignedRoles.includes(activeRole))
    : dispatchedReports;

  // Merge context + local edits (local wins on conflict)
  const allResponses = [...teamResponses];
  localResponses.forEach(lr => {
    const idx = allResponses.findIndex(r => r.dispatchReportId === lr.dispatchReportId && r.respondingRole === lr.respondingRole);
    if (idx >= 0) allResponses[idx] = lr; else allResponses.push(lr);
  });
  const responseMap = new Map(allResponses.map(r => [`${r.dispatchReportId}-${r.respondingRole}`, r]));

  const pendingCount = activeRole
    ? filteredReports.filter(r => !responseMap.has(`${r.id}-${activeRole}`)).length
    : filteredReports.filter(r => r.status !== 'acknowledged').length;
  const respondedCount = filteredReports.length - pendingCount;

  const handleFirstResponse = (response: TeamResponse) => {
    addTeamResponse(response);
    setLocalResponses(prev => [...prev, response]);
    if (activeRole) updateTeamStatus(response.dispatchReportId, activeRole, getCoordinationStatus(response.currentStatus), response.situationUpdate);
    saveResponseToBackend(response); // → WebSocket → /history live update
    toast.success(`Response submitted by ${response.teamLeader}`);
  };

  const handleUpdateResponse = (updated: TeamResponse) => {
    setLocalResponses(prev => {
      const idx = prev.findIndex(r => r.dispatchReportId === updated.dispatchReportId && r.respondingRole === updated.respondingRole);
      if (idx >= 0) { const next = [...prev]; next[idx] = updated; return next; }
      return [...prev, updated];
    });
    if (activeRole) updateTeamStatus(updated.dispatchReportId, activeRole, getCoordinationStatus(updated.currentStatus), updated.situationUpdate);
    saveResponseToBackend(updated); // → WebSocket → /history live update
    toast.success('Response updated — History page updated live');
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1">Response Console</h1>
          <p className="text-sm text-muted-foreground">Select your team to view and respond to assigned incidents</p>
        </div>
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {ROLE_OPTIONS.map(role => (
            <Button key={role.value} variant={selectedRole === role.value ? 'default' : 'outline'} size="sm" className="gap-1.5 text-xs" onClick={() => setSelectedRole(role.value)}>
              <role.icon className="w-3.5 h-3.5" /> {role.label}
            </Button>
          ))}
          <Button variant={selectedRole === 'all' ? 'default' : 'outline'} size="sm" className="gap-1.5 text-xs" onClick={() => setSelectedRole('all')}>
            <Users className="w-3.5 h-3.5" /> All Teams
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-panel p-4 text-center"><p className="text-2xl font-bold">{filteredReports.length}</p><p className="text-xs text-muted-foreground">Dispatches</p></div>
          <div className="glass-panel p-4 text-center"><p className="text-2xl font-bold text-warning">{pendingCount}</p><p className="text-xs text-muted-foreground">Awaiting</p></div>
          <div className="glass-panel p-4 text-center"><p className="text-2xl font-bold text-success">{respondedCount}</p><p className="text-xs text-muted-foreground">Responded</p></div>
        </div>
        {activeRole === null && (
          <div className="glass-panel p-4 mb-4 border-warning/30 bg-warning/5">
            <p className="text-xs text-warning flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Select your team role above to see assigned dispatches.</p>
          </div>
        )}
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          {filteredReports.length === 0 ? (
            <div className="glass-panel p-12 text-center">
              <Radio className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">{activeRole ? 'No dispatches assigned to your team.' : 'No dispatches yet.'}</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredReports.map(report => (
                <DispatchCard
                  key={report.id}
                  report={report}
                  activeRole={activeRole || 'all'}
                  existingResponse={activeRole ? responseMap.get(`${report.id}-${activeRole}`) : undefined}
                  onRespond={() => setRespondingReport(report)}
                  onUpdateResponse={handleUpdateResponse}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
      {respondingReport && activeRole && (
        <ResponseFormDialog
          report={respondingReport} role={activeRole}
          open={!!respondingReport}
          onOpenChange={open => { if (!open) setRespondingReport(null); }}
          onSubmit={handleFirstResponse}
        />
      )}
    </div>
  );
}