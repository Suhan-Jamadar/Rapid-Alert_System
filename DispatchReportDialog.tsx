import React, { useState } from 'react';
import { Alert as AlertType, Priority, ResponderRole, DispatchReport } from '@/types/simulation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Send, MapPin, Users, AlertTriangle, FileText, Flame, Droplets, Stethoscope, Shield } from 'lucide-react';
import { toast } from 'sonner';

const PRIORITY_OPTIONS: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

const TEAM_OPTIONS: { value: ResponderRole; label: string; icon: React.ElementType }[] = [
  { value: 'fire_department', label: 'Fire Department', icon: Flame },
  { value: 'flood_rescue', label: 'Flood Rescue', icon: Droplets },
  { value: 'medical', label: 'Medical Team', icon: Stethoscope },
  { value: 'police', label: 'Police', icon: Shield },
];

const priorityStyles: Record<Priority, string> = {
  CRITICAL: 'bg-critical/20 text-critical border-critical/40',
  HIGH: 'bg-warning/20 text-warning border-warning/40',
  MEDIUM: 'bg-info/20 text-info border-info/40',
  LOW: 'bg-muted text-muted-foreground border-border',
};

interface Props {
  alert: AlertType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDispatch: (report: DispatchReport) => void;
}

export default function DispatchReportDialog({ alert, open, onOpenChange, onDispatch }: Props) {
  const [criticality, setCriticality] = useState<Priority>(alert.priority);
  const [peopleAffected, setPeopleAffected] = useState('');
  const [location, setLocation] = useState(alert.location);
  const [selectedTeams, setSelectedTeams] = useState<ResponderRole[]>(
    alert.responderRoles.filter(r => r !== 'all') as ResponderRole[]
  );
  const [notes, setNotes] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [resourcesNeeded, setResourcesNeeded] = useState('');

  const toggleTeam = (role: ResponderRole) => {
    setSelectedTeams(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = () => {
    if (!peopleAffected || !location || !notes) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (selectedTeams.length === 0) {
      toast.error('Assign at least one team.');
      return;
    }

    const report: DispatchReport = {
      id: `dispatch-${Date.now()}`,
      alertId: alert.id,
      criticality,
      peopleAffected: parseInt(peopleAffected, 10) || 0,
      location,
      coordinates: alert.coordinates,
      incidentType: alert.incidentType,
      assignedRoles: selectedTeams,
      teamAssignments: selectedTeams.map(role => ({
        role,
        status: 'not_started' as const,
        updatedAt: new Date(),
      })),
      notes,
      contactInfo: contactInfo || undefined,
      resourcesNeeded: resourcesNeeded || undefined,
      timestamp: new Date(),
      status: 'dispatched',
      coordinationNotes: [],
    };

    onDispatch(report);
    onOpenChange(false);
    setPeopleAffected(''); setNotes(''); setContactInfo(''); setResourcesNeeded('');
    setSelectedTeams([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Send className="w-5 h-5 text-primary" />
            Quick Dispatch
          </DialogTitle>
        </DialogHeader>

        {/* Alert summary */}
        <div className={cn('rounded-md border p-3 text-xs', priorityStyles[alert.priority])}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-bold">{alert.priority} — {alert.incidentType.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" /> <span>{alert.location}</span>
          </div>
          <p className="mt-1 opacity-80 truncate">{alert.description}</p>
        </div>

        <div className="space-y-3 mt-1">
          {/* Criticality */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Criticality *</Label>
            <div className="flex gap-1.5">
              {PRIORITY_OPTIONS.map(p => (
                <button
                  key={p}
                  onClick={() => setCriticality(p)}
                  className={cn(
                    'flex-1 text-[10px] font-mono py-1.5 rounded-md border transition-all',
                    criticality === p ? priorityStyles[p] : 'bg-muted/30 text-muted-foreground border-border hover:border-muted-foreground/30'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Assign Teams — checkboxes */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Assign Teams * (multi-select)</Label>
            <div className="grid grid-cols-2 gap-2">
              {TEAM_OPTIONS.map(t => {
                const checked = selectedTeams.includes(t.value);
                return (
                  <label
                    key={t.value}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-all text-xs',
                      checked ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/20 border-border text-muted-foreground hover:border-muted-foreground/40'
                    )}
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggleTeam(t.value)} />
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> People Affected *</Label>
              <Input type="number" min="0" placeholder="Est. count" value={peopleAffected} onChange={e => setPeopleAffected(e.target.value)} className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Location *</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} className="bg-muted/30 border-border" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Resources Needed</Label>
              <Input value={resourcesNeeded} onChange={e => setResourcesNeeded(e.target.value)} placeholder="e.g. 2 trucks" className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Contact</Label>
              <Input value={contactInfo} onChange={e => setContactInfo(e.target.value)} placeholder="Phone #" className="bg-muted/30 border-border" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="w-3 h-3" /> Notes *</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Situation details..." rows={2} className="bg-muted/30 border-border resize-none" />
          </div>
        </div>

        <DialogFooter className="mt-1">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" className="gap-1.5" onClick={handleSubmit}>
            <Send className="w-3.5 h-3.5" /> Dispatch to {selectedTeams.length} team{selectedTeams.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
