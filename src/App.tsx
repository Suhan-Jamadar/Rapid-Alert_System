import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SimulationProvider } from "@/context/SimulationContext";
import TopNav from "@/components/TopNav";
import HomePage from "./pages/HomePage";
import DataInputPage from "./pages/DataInputPage";
import ProcessingPage from "./pages/ProcessingPage";
import DashboardPage from "./pages/DashboardPage";
import ResponseConsolePage from "./pages/ResponseConsolePage";
import RespondLoginPage from "./pages/RespondLoginPage";
import DispatchHistoryPage from "./pages/DispatchHistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ── Guard: checks sessionStorage for respond auth ─────────────────────────
function RequireRespondAuth({ children }: { children: React.ReactNode }) {
  const isAuthed = sessionStorage.getItem('respond_auth') === 'true';
  if (!isAuthed) return <Navigate to="/respond-login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SimulationProvider>
          <div className="dark">
            <Routes>

              {/* ── Public routes (no login needed) ── */}
              <Route path="/" element={<><TopNav /><HomePage /></>} />
              <Route path="/data-input" element={<><TopNav /><DataInputPage /></>} />
              <Route path="/processing" element={<><TopNav /><ProcessingPage /></>} />
              <Route path="/dashboard" element={<><TopNav /><DashboardPage /></>} />
              <Route path="/history" element={<><TopNav /><DispatchHistoryPage /></>} />

              {/* ── Respond login page (no TopNav, no auth needed) ── */}
              <Route path="/respond-login" element={<RespondLoginPage />} />

              {/* ── Respond page (password protected, separate URL) ── */}
              <Route path="/respond" element={
                <RequireRespondAuth>
                  <TopNav />
                  <ResponseConsolePage />
                </RequireRespondAuth>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </SimulationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;