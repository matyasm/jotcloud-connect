
import { useState } from "react";
import LoginHeader from "@/components/auth/LoginHeader";
import LoginCard from "@/components/auth/LoginCard";
import SessionCheck from "@/components/auth/SessionCheck";

const Login = () => {
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  const handleSessionCheckComplete = () => {
    setIsSessionChecked(true);
  };

  return (
    <SessionCheck onSessionCheckComplete={handleSessionCheckComplete}>
      {isSessionChecked && (
        <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
          <LoginHeader />
          <div className="flex-grow flex items-center justify-center px-4 sm:px-6 py-12">
            <LoginCard />
          </div>
        </div>
      )}
    </SessionCheck>
  );
};

export default Login;
