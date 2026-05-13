import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Activity, Database, Cpu, LayoutDashboard, Zap, Radio, History } from 'lucide-react';
import { WebSocketStatus } from '@/components/WebSocketStatus';  // ← ADD THIS LINE

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: Zap },
  { path: '/data-input', label: 'Data Input', icon: Database },
  { path: '/processing', label: 'Processing', icon: Cpu },
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  // { path: '/response', label: 'Response', icon: Radio },
  { path: '/history', label: 'History', icon: History },
];

export default function TopNav() {
  const location = useLocation();

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-border/50 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Activity className="w-5 h-5 text-primary group-hover:drop-shadow-[0_0_8px_hsl(var(--primary))] transition-all" />
          <span className="font-bold text-sm tracking-wider text-gradient-primary">5G-DIS</span>
        </Link>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                location.pathname === path
                  ? "bg-primary/10 text-primary glow-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
        </div>

        {/* ← ADD THIS — shows live WebSocket connection status on the right side of nav */}
        <WebSocketStatus />

      </div>
    </nav>
  );
}