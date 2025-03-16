import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import { ThemeProvider } from "./components/ThemeProvider";
import { useEffect, useState } from "react";
import { supabase, syncSession } from "./integrations/supabase/client";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import Tasks from "./pages/Tasks";
import SharedNotes from "./pages/SharedNotes";
import PublicNotes from "./pages/PublicNotes";
import NotFound from "./pages/NotFound";

// Create query client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
      }
    }
  },
});

// Simple wrapper that replaces the protected route
const SimpleWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Landing page is accessible without authentication checks */}
      <Route path="/" element={<Landing />} />
      
      {/* Auth routes - simplified, no longer using wrapper component */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* No longer protected routes */}
      <Route path="/notes" element={<SimpleWrapper><Notes /></SimpleWrapper>} />
      <Route path="/tasks" element={<SimpleWrapper><Tasks /></SimpleWrapper>} />
      <Route path="/shared" element={<SimpleWrapper><SharedNotes /></SimpleWrapper>} />
      <Route path="/public" element={<SimpleWrapper><PublicNotes /></SimpleWrapper>} />
      
      {/* Fallback route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setError(event.error);
      setHasError(true);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/20 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">Something went wrong</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            The application encountered an unexpected error.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded overflow-auto text-sm">
              <p>{error.toString()}</p>
            </div>
          )}
          <button 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const App = () => {
  // Initialize auth listener at the app level
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("App - Auth state change event:", event);
    });
    
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
};

export default App;
