
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
import SharedNotes from "./pages/SharedNotes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authStatus } = useStore();
  
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { authStatus } = useStore();
  
  // Redirect authenticated users away from auth pages
  const AuthRoute = ({ children }: { children: React.ReactNode }) => {
    return authStatus === 'authenticated' ? <Navigate to="/notes" /> : <>{children}</>;
  };
  
  return (
    <Routes>
      {/* Landing page as the root route */}
      <Route path="/" element={<Landing />} />
      
      <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><Register /></AuthRoute>} />
      
      {/* Protected routes */}
      <Route path="/notes" element={<ProtectedRoute><Notes /></ProtectedRoute>} />
      <Route path="/shared" element={<ProtectedRoute><SharedNotes /></ProtectedRoute>} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <StoreProvider>
      <ThemeProvider defaultTheme="light">
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
