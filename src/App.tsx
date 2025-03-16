
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

// Protected route component with improved loading state
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authStatus, user } = useStore();
  const [localLoading, setLocalLoading] = useState(true);
  
  console.log("Protected route auth status:", authStatus, "user:", user?.email);
  
  useEffect(() => {
    // Add a safety timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (authStatus === 'loading') {
        console.log("Protected route: Auth status still loading after timeout, checking session directly");
        checkSessionDirectly();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (authStatus === 'authenticated') {
      console.log("Protected route: User is authenticated");
      setLocalLoading(false);
    } else if (authStatus === 'unauthenticated') {
      console.log("Protected route: User is not authenticated, redirecting to login");
      setLocalLoading(false);
    } else {
      console.log("Protected route: Auth status is still loading");
    }
  }, [authStatus]);
  
  const checkSessionDirectly = async () => {
    try {
      console.log("Checking session directly...");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        setLocalLoading(false);
        return;
      }
      
      if (data.session) {
        console.log("Session found directly, user exists but store might not be updated");
        // We have a session but store might not be updated
        // We'll render the protected content, and the store should catch up
        setLocalLoading(false);
      } else {
        console.log("No session found directly, redirecting to login");
        setLocalLoading(false);
      }
    } catch (err) {
      console.error("Error in direct session check:", err);
      setLocalLoading(false);
    }
  };
  
  if (localLoading && authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-gray-600">Loading protected content...</p>
        </div>
      </div>
    );
  }
  
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { authStatus, user } = useStore();
  const [localLoading, setLocalLoading] = useState(true);
  
  console.log("App routes auth status:", authStatus, "user:", user?.email);
  
  useEffect(() => {
    // Add a safety timeout to prevent infinite loading
    const timer = setTimeout(() => {
      if (authStatus === 'loading') {
        console.log("Auth routes: Auth status still loading after timeout, checking session directly");
        checkSessionDirectly();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Only show loading state for protected routes, not for the entire app
  const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
      console.log("Auth route: auth status is", authStatus);
      if (authStatus === 'authenticated') {
        console.log("Auth route: User is authenticated, should redirect to /notes");
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
    
    return authStatus === 'authenticated' ? <Navigate to="/notes" /> : <>{children}</>;
  };
  
  const checkSessionDirectly = async () => {
    try {
      console.log("Checking session directly in AppRoutes...");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        setLocalLoading(false);
        return;
      }
      
      if (data.session) {
        console.log("Session found directly in AppRoutes");
      } else {
        console.log("No session found directly in AppRoutes");
      }
      
      setLocalLoading(false);
    } catch (err) {
      console.error("Error in direct session check:", err);
      setLocalLoading(false);
    }
  };
  
  useEffect(() => {
    if (authStatus !== 'loading') {
      setLocalLoading(false);
    }
  }, [authStatus]);
  
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
