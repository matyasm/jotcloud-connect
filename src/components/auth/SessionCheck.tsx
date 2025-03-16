
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SessionCheckProps {
  children: React.ReactNode;
  onSessionCheckComplete: () => void;
}

const SessionCheck = ({ children, onSessionCheckComplete }: SessionCheckProps) => {
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log("SessionCheck - Authentication check disabled");
        
        // Check if there's an active session to help with login state tracking
        const { data } = await supabase.auth.getSession();
        console.log("SessionCheck - Session check result:", data.session ? "Has session" : "No session");
        
        // Complete the session check regardless of result
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

  // Always render children after session check is complete
  return <>{children}</>;
};

export default SessionCheck;
