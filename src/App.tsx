
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import { ThemeProvider } from "./components/ThemeProvider";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import Tasks from "./pages/Tasks";
import SharedNotes from "./pages/SharedNotes";
import PublicNotes from "./pages/PublicNotes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple protected route - only checks session directly
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  
  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("Protected route checking session directly");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          navigate('/login', { replace: true });
          return;
        }
        
        if (data.session) {
          console.log("Protected route: Session found");
          setChecking(false);
        } else {
          console.log("Protected route: No session found, redirecting");
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error("Error checking session:", err);
        navigate('/login', { replace: true });
      }
    };
    
    checkSession();
  }, [navigate]);
  
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const navigate = useNavigate();
  
  // Auth route component with direct session check
  const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    const [checking, setChecking] = useState(true);
    
    useEffect(() => {
      const checkSession = async () => {
        try {
          console.log("Auth route checking session directly");
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Session check error:", error);
            setChecking(false);
            return;
          }
          
          if (data.session) {
            console.log("Auth route: Session found, redirecting");
            navigate('/notes', { replace: true });
          } else {
            console.log("Auth route: No session found, showing login");
            setChecking(false);
          }
        } catch (err) {
          console.error("Error checking session:", err);
          setChecking(false);
        }
      };
      
      checkSession();
    }, []);
    
    if (checking) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-center">
            <p className="text-gray-600">Checking authentication...</p>
          </div>
        </div>
      );
    }
    
    return <>{children}</>;
  };
  
  return (
    <Routes>
      {/* Landing page is accessible without authentication checks */}
      <Route path="/" element={<Landing />} />
      
      {/* Auth routes */}
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      
      {/* Protected routes */}
      <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
      <Route path="/shared" element={<ProtectedRoute><SharedNotes /></ProtectedRoute>} />
      <Route path="/public" element={<ProtectedRoute><PublicNotes /></ProtectedRoute>} />
      
      {/* Fallback route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StoreProvider>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </StoreProvider>
  </QueryClientProvider>
);

export default App;
