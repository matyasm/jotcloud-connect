
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SessionCheckProps {
  children: React.ReactNode;
  onSessionCheckComplete: () => void;
}

const SessionCheck = ({ children, onSessionCheckComplete }: SessionCheckProps) => {
  useEffect(() => {
    // Simply complete the session check immediately without authentication checks
    console.log("SessionCheck - Authentication check disabled");
    onSessionCheckComplete();
    
    return () => {
      console.log("SessionCheck - Cleaning up");
    };
  }, [onSessionCheckComplete]);

  // Always render children immediately
  return <>{children}</>;
};

export default SessionCheck;
