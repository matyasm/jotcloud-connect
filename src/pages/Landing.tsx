
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import LandingNavbar from "@/components/LandingNavbar";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 dark:from-background dark:to-background/80">
      {/* Landing page specific navbar */}
      <LandingNavbar />

      <main>
        {/* Hero section */}
        <section className="pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 max-w-4xl mx-auto dark:text-gray-100"
            >
              Note-taking reimagined for the modern world
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto dark:text-gray-300"
            >
              Notifly helps you organize thoughts, ideas, and important information all in one place, with powerful sharing and search capabilities.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-x-6"
            >
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto px-8 group relative overflow-hidden">
                  <span className="relative z-10">Get Started</span>
                  <span className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Log in
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white dark:from-blue-800 dark:to-blue-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold">Start taking better notes today</h2>
            <div className="mt-10">
              <Link to="/register">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="px-8 bg-white text-blue-700 hover:bg-blue-50 dark:bg-blue-100"
                >
                  Create your account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white py-12 border-t border-gray-100 dark:bg-background dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700 mb-6 dark:from-blue-400 dark:to-blue-600">
            Notifly
          </div>
          <p className="text-gray-500 text-sm dark:text-gray-400">
            &copy; {new Date().getFullYear()} Notifly. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
