import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FFHAuthProvider, useFFHAuth } from "./contexts/FFHAuthContext";
import FFHLayout from "./components/FFHLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Keys from "./pages/Keys";
import Packages from "./pages/Packages";
import Prefixes from "./pages/Prefixes";
import Users from "./pages/Users";
import Logs from "./pages/Logs";
import Credits from "./pages/Credits";
import ApiDocs from "./pages/ApiDocs";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, loading } = useFFHAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "oklch(0.08 0.01 260)" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "oklch(0.65 0.22 260)" }} />
          <p className="text-sm" style={{ color: "oklch(0.5 0.02 260)" }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/" />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  return <FFHLayout>{children}</FFHLayout>;
}

function AppRouter() {
  const { user, loading } = useFFHAuth();
  const [location] = useLocation();

  return (
    <Switch>
      <Route path="/">
        {!loading && user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>

      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>

      <Route path="/keys">
        <ProtectedRoute><Keys /></ProtectedRoute>
      </Route>

      <Route path="/packages">
        <ProtectedRoute><Packages /></ProtectedRoute>
      </Route>

      <Route path="/prefixes">
        <ProtectedRoute><Prefixes /></ProtectedRoute>
      </Route>

      <Route path="/users">
        <ProtectedRoute adminOnly><Users /></ProtectedRoute>
      </Route>

      <Route path="/logs">
        <ProtectedRoute adminOnly><Logs /></ProtectedRoute>
      </Route>

      <Route path="/credits">
        <ProtectedRoute adminOnly><Credits /></ProtectedRoute>
      </Route>

      <Route path="/api-docs">
        <ProtectedRoute><ApiDocs /></ProtectedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <FFHAuthProvider>
            <AppRouter />
          </FFHAuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
