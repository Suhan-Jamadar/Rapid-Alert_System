import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Database, Cpu, LayoutDashboard, Zap, Radio, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MODULES = [
  {
    path: '/data-input',
    icon: Database,
    title: 'Data Input',
    description: 'Upload images, submit reports, and simulate disaster tweet streams in real-time.',
    color: 'text-info',
  },
  {
    path: '/processing',
    icon: Cpu,
    title: 'Processing Pipeline',
    description: 'Watch edge filtering, AI analysis, and alert generation in action.',
    color: 'text-warning',
  },
  {
    path: '/dashboard',
    icon: LayoutDashboard,
    title: 'Command Dashboard',
    description: 'Live alerts, heatmap visualization, and role-based responder views.',
    color: 'text-critical',
  },
];

const FEATURES = [
  { icon: Zap, label: 'Ultra-Low Latency', desc: 'Edge-processed alerts in <500ms' },
  { icon: Radio, label: 'Event-Driven', desc: 'Pub/Sub message queue distribution' },
  { icon: Shield, label: 'Role-Based Access', desc: 'Filtered views per responder team' },
];

export default function HomePage() {
  return (
    <div className="min-h-screen grid-pattern scanline">
      {/* Hero */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-mono mb-6">
              <Activity className="w-3 h-3 animate-pulse-glow" />
              5G-INSPIRED DISASTER INTELLIGENCE
            </div>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4">
              <span className="text-gradient-primary">Disaster Response</span>
              <br />
              <span className="text-foreground">Command Platform</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              A real-time simulation platform demonstrating how 5G-style communication principles—edge filtering, 
              event-driven alerts, and distributed processing—can revolutionize emergency response coordination.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2 font-semibold">
                <Link to="/dashboard">
                  Open Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link to="/data-input">Start Simulation</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-y border-border/50 bg-card/30">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/50">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center gap-3 px-6 py-5"
            >
              <f.icon className="w-5 h-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">System Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MODULES.map((m, i) => (
              <motion.div
                key={m.path}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Link
                  to={m.path}
                  className="glass-panel p-6 block group hover:glow-border transition-all duration-300 h-full"
                >
                  <m.icon className={`w-8 h-8 ${m.color} mb-4 group-hover:scale-110 transition-transform`} />
                  <h3 className="font-bold text-lg mb-2 text-foreground">{m.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.description}</p>
                  <div className="mt-4 text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Open Module <ArrowRight className="w-3 h-3" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
