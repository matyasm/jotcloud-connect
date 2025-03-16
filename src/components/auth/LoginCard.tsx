
import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import GoogleLoginButton from "./GoogleLoginButton";
import EmailLoginForm from "./EmailLoginForm";

const LoginCard = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-panel p-8 sm:p-10 rounded-xl w-full max-w-md"
    >
      <div className="text-center mb-8">
        <Link to="/" className="inline-block">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
            Notifly
          </h1>
        </Link>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-gray-600">Sign in to your account</p>
      </div>

      <GoogleLoginButton 
        isSubmitting={isSubmitting} 
        setIsSubmitting={setIsSubmitting} 
      />

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <Separator className="w-full" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or continue with email</span>
        </div>
      </div>

      <EmailLoginForm 
        isSubmitting={isSubmitting} 
        setIsSubmitting={setIsSubmitting} 
      />

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  );
};

export default LoginCard;
