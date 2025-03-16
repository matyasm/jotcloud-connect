
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SessionCheckProps {
  children: React.ReactNode;
  onSessionCheckComplete: () => void;
}

const SessionCheck = ({ children, onSessionCheckComplete }: SessionCheckProps) => {
  const navigate = useNavigate();
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("SessionCheck - Checking session on mount");
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("SessionCheck - Error checking session:", error);
          setIsCheckingSession(false);
          onSessionCheckComplete();
          return;
        }
        
        if (data?.session) {
          console.log("SessionCheck - Valid session found, redirecting to /notes");
          navigate('/notes', { replace: true });
        } else {
          console.log("SessionCheck - No session found, showing login form");
          setIsCheckingSession(false);
          onSessionCheckComplete();
        }
      } catch (err) {
        console.error("SessionCheck - Exception in session check:", err);
        setIsCheckingSession(false);
        onSessionCheckComplete();
      }
    };
    
    // Add a small delay to ensure UI and session state are in sync
    const timer = setTimeout(() => checkSession(), 100);
    
    // Set up an auth state listener to catch changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("SessionCheck - Auth state change event:", event);
      
      if (event === 'SIGNED_IN' && session) {
        console.log("SessionCheck - User signed in via auth state change");
        navigate('/notes', { replace: true });
      }
    });
    
    return () => {
      console.log("SessionCheck - Cleaning up");
      clearTimeout(timer);
      authListener.subscription.unsubscribe();
    };
  }, [navigate, onSessionCheckComplete]);

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-gray-600">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SessionCheck;
