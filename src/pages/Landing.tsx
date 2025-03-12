
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, BookOpenCheck, Share2, Search, Lock } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <header className="py-6 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
              JotCloud
            </div>
            <div className="flex items-center space-x-4">
              <Link 
                to="/login" 
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Log in
              </Link>
              <Link to="/register">
                <Button>Sign up</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero section */}
        <section className="pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 max-w-4xl mx-auto"
            >
              Capture your ideas with beautiful simplicity
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto"
            >
              JotCloud helps you organize your thoughts in a clean, minimal workspace designed for focus and productivity.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
              className="mt-10 flex justify-center gap-x-6"
            >
              <Link to="/register">
                <Button size="lg" className="px-8 group relative overflow-hidden">
                  <span className="relative z-10">Get Started</span>
                  <span className="absolute inset-0 bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Log in
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Beautifully designed for your notes</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                With a focus on simplicity and elegance, JotCloud helps you create, organize, and share your notes with ease.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass-panel p-6 rounded-xl flex flex-col"
                >
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-5">
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-gray-600 flex-grow">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-3xl font-bold">Start taking better notes today</h2>
            <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
              Join thousands of users who have improved their productivity with JotCloud's elegant note-taking experience.
            </p>
            <div className="mt-10">
              <Link to="/register">
                <Button 
                  size="lg" 
                  variant="secondary" 
                  className="px-8 bg-white text-blue-700 hover:bg-blue-50"
                >
                  Create your account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700 mb-6">
            JotCloud
          </div>
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} JotCloud. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const features = [
  {
    title: "Beautiful Minimalism",
    description: "A clean, distraction-free interface that helps you focus on what matters - your ideas.",
    icon: BookOpenCheck,
  },
  {
    title: "Secure Storage",
    description: "Your notes are private and secure by default, with end-to-end protection.",
    icon: Lock,
  },
  {
    title: "Easy Sharing",
    description: "Share your notes with colleagues and friends with just a few clicks.",
    icon: Share2,
  },
  {
    title: "Fast Search",
    description: "Find any note instantly with powerful full-text search capabilities.",
    icon: Search,
  },
  {
    title: "Works Everywhere",
    description: "Access your notes from any device with our responsive, mobile-friendly design.",
    icon: Check,
  },
  {
    title: "Simple Organization",
    description: "Keep your notes organized with tags and custom categories.",
    icon: BookOpenCheck,
  },
];

export default Landing;
