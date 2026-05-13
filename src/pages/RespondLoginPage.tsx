import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function RespondLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!password) { toast.error('Enter password'); return; }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        // Store in sessionStorage — survives refresh, cleared on tab close
        sessionStorage.setItem('respond_auth', 'true');
        toast.success('Access granted');
        navigate('/respond');
      } else {
        toast.error(data.message || 'Wrong password');
      }
    } catch {
      toast.error('Cannot reach server. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 dark">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold">Rapid Alert Nexus</span>
          </div>
          <p className="text-sm text-muted-foreground">Response Console Access</p>
        </div>

        {/* Login card */}
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
            <Lock className="w-6 h-6 text-primary" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm text-muted-foreground">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="Enter access password"
                className="bg-muted/30 border-border pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? 'Verifying...' : 'Enter Response Console'}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Contact your admin for access credentials
        </p>
      </div>
    </div>
  );
}