
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import { ThemeProvider } from "./components/ThemeProvider";

// Pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import Tasks from "./pages/Tasks";
import SharedNotes from "./pages/SharedNotes";
import PublicNotes from "./pages/PublicNotes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authStatus } = useStore();
  
  console.log("Protected route auth status:", authStatus);
  
  if (authStatus === 'loading') {
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
  const { authStatus } = useStore();
  
  console.log("App routes auth status:", authStatus);
  
  // Only show loading state for protected routes, not for the entire app
  const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    if (authStatus === 'loading') {
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
