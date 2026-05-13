import { Alert } from '@/types/simulation';
import { AlertTriangle, Flame, Activity, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsPanelProps {
  alerts: Alert[];
}

export default function StatsPanel({ alerts }: StatsPanelProps) {
  const totalAlerts = alerts.length;
  const criticalAlerts = alerts.filter(a => a.priority === 'CRITICAL').length;
  
  // Most affected area
  const areaCounts: Record<string, number> = {};
  alerts.forEach(a => { areaCounts[a.location] = (areaCounts[a.location] || 0) + 1; });
  const mostAffected = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0];
  
  // Incident types
  const typeCounts: Record<string, number> = {};
  alerts.forEach(a => { typeCounts[a.incidentType] = (typeCounts[a.incidentType] || 0) + 1; });
  const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const stats = [
    { label: 'Total Alerts', value: totalAlerts, icon: Activity, color: 'text-primary' },
    { label: 'Critical', value: criticalAlerts, icon: AlertTriangle, color: 'text-critical' },
    { label: 'Most Affected', value: mostAffected ? mostAffected[0] : '—', icon: MapPin, color: 'text-warning', small: true },
    { label: 'Top Incidents', value: topTypes.map(t => t[0]).join(', ') || '—', icon: Flame, color: 'text-info', small: true },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <s.icon className={cn("w-4 h-4", s.color)} />
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
          <p className={cn(
            "font-bold truncate",
            s.small ? "text-sm" : "text-2xl font-mono"
          )}>
            {s.value}
          </p>
        </div>
      ))}
    </div>
  );
}
