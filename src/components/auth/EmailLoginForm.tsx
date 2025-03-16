
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailLoginFormProps {
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
}

const EmailLoginForm = ({ isSubmitting, setIsSubmitting }: EmailLoginFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validateForm = () => {
    let valid = true;
    const newErrors = { email: "", password: "" };

    if (!email) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      valid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    console.log("Login component - Attempting login with email:", email);
    
    try {
      setIsSubmitting(true);
      
      // Clear any existing sessions first
      await supabase.auth.signOut();
      
      console.log("Login component - Signing in with credentials");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.session) {
        console.log("Login component - Login successful, session established");
        toast.success("Login successful!");
        
        // Force session persistence
        await supabase.auth.setSession(data.session);
        
        console.log("Login component - Session set, navigating to /notes");
        
        // Use setTimeout to ensure component state updates before navigation
        setTimeout(() => {
          navigate('/notes', { replace: true });
        }, 100);
      } else {
        console.error("Login component - No session returned from login");
        toast.error("Login failed. Please try again.");
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Login component - Login error:", error);
      
      if (error.message && error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password");
      } else if (error.message && error.message.includes("Email not confirmed")) {
        toast.error("Please confirm your email before logging in");
      } else {
        toast.error(error.message || "Login failed. Please try again.");
      }
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link 
            to="/forgot-password" 
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <div className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Signing in...
          </div>
        ) : (
          <div className="flex items-center">
            <LogIn className="h-5 w-5 mr-2" />
            Sign in with Email
          </div>
        )}
      </Button>
    </form>
  );
};

export default EmailLoginForm;
