
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SessionCheckProps {
  children: React.ReactNode;
  onSessionCheckComplete: () => void;
}

const SessionCheck = ({ children, onSessionCheckComplete }: SessionCheckProps) => {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if there's an active session
        const { data } = await supabase.auth.getSession();
        console.log("SessionCheck - Session check result:", data.session ? "Has session" : "No session");
        
        // Complete the session check
        setIsChecking(false);
        onSessionCheckComplete();
      } catch (error) {
        console.error("SessionCheck - Error checking session:", error);
        setIsChecking(false);
        onSessionCheckComplete();
      }
    };

    checkSession();
    
    return () => {
      console.log("SessionCheck - Cleaning up");
    };
  }, [onSessionCheckComplete]);

  // Only render children after session check is complete
  if (isChecking) {
    return null;
  }
  
  return <>{children}</>;
};

export default SessionCheck;
