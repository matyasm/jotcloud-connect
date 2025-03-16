
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

// Protected route component with improved loading state and session check
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authStatus, user } = useStore();
  const [localLoading, setLocalLoading] = useState(true);
  const navigate = useNavigate();
  
  console.log("Protected route auth status:", authStatus, "user:", user?.email);
  
  // Direct session check on mount to avoid getting stuck in loading state
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Protected route session check error:", error);
          setLocalLoading(false);
          navigate('/login', { replace: true });
          return;
        }
        
        if (data.session) {
          console.log("Protected route: Session found directly");
          setLocalLoading(false);
        } else {
          console.log("Protected route: No session found, redirecting to login");
          setLocalLoading(false);
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error("Error in protected route session check:", err);
        setLocalLoading(false);
        navigate('/login', { replace: true });
      }
    };
    
    // Try store state first, but don't wait for it
    if (authStatus === 'authenticated') {
      console.log("Protected route: Already authenticated via store");
      setLocalLoading(false);
    } else if (authStatus === 'unauthenticated') {
      console.log("Protected route: Already unauthenticated via store");
      navigate('/login', { replace: true });
      setLocalLoading(false);
    } else {
      // If store state is loading, check session directly after a short delay
      const timer = setTimeout(() => {
        if (authStatus === 'loading') {
          console.log("Protected route: Store auth still loading, checking session directly");
          checkSession();
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [authStatus, navigate]);
  
  if (localLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-gray-600">Loading protected content...</p>
        </div>
      </div>
    );
  }
  
  return authStatus === 'authenticated' ? <>{children}</> : null;
};

const AppRoutes = () => {
  const { authStatus, user } = useStore();
  const navigate = useNavigate();
  
  console.log("App routes auth status:", authStatus, "user:", user?.email);
  
  // Auth route component with direct session check
  const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    const [localLoading, setLocalLoading] = useState(true);
    
    useEffect(() => {
      const checkSession = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error("Auth route session check error:", error);
            setLocalLoading(false);
            return;
          }
          
          if (data.session) {
            console.log("Auth route: Session found directly, redirecting to notes");
            navigate('/notes', { replace: true });
          } else {
            console.log("Auth route: No session found, staying on login");
            setLocalLoading(false);
          }
        } catch (err) {
          console.error("Error in auth route session check:", err);
          setLocalLoading(false);
        }
      };
      
      // Try store state first, but don't wait for it
      if (authStatus === 'authenticated') {
        console.log("Auth route: Already authenticated via store, redirecting");
        navigate('/notes', { replace: true });
      } else if (authStatus === 'unauthenticated') {
        console.log("Auth route: Already unauthenticated via store");
        setLocalLoading(false);
      } else {
        // If store state is loading, check session directly after a short delay
        const timer = setTimeout(() => {
          if (authStatus === 'loading') {
            console.log("Auth route: Store auth still loading, checking session directly");
            checkSession();
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }, [authStatus]);
    
    if (localLoading && authStatus === 'loading') {
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
