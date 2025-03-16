
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
        console.log("Login component - Checking session on mount");
        
        // Clear any previous sessions first to avoid conflicts
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error in Login session check:", error);
          setIsCheckingSession(false);
          onSessionCheckComplete();
          return;
        }
        
        if (data && data.session) {
          console.log("Login component - Valid session found, redirecting to /notes");
          
          // Use setTimeout to ensure UI updates before navigation
          setTimeout(() => {
            navigate('/notes', { replace: true });
          }, 0);
        } else {
          console.log("Login component - No session found, showing login form");
          setIsCheckingSession(false);
          onSessionCheckComplete();
        }
      } catch (err) {
        console.error("Exception in Login session check:", err);
        setIsCheckingSession(false);
        onSessionCheckComplete();
      }
    };
    
    checkSession();
    
    // Cleanup any potential listeners when component unmounts
    return () => {
      console.log("Login component - Cleaning up");
    };
  }, [navigate, onSessionCheckComplete]);

  // Show loading state while checking session
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
