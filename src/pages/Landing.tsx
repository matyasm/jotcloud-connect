
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BookText, Check, CloudLightning, ExternalLink, Lock, Search, Shield, Sparkles } from "lucide-react";
import LandingNavbar from "@/components/LandingNavbar";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
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
              className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 max-w-4xl mx-auto"
            >
              Note-taking reimagined for the modern world
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto"
            >
              JotCloud helps you organize thoughts, ideas, and important information all in one place, with powerful sharing and search capabilities.
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

        {/* What is JotCloud section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">What is JotCloud?</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                JotCloud is a modern note-taking application that helps you capture, organize, and share your ideas effortlessly.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-5">
                  <BookText size={24} />
                </div>
                <h3 className="text-xl font-medium text-gray-900">Intuitive Note-Taking</h3>
                <p className="mt-3 text-gray-600">
                  Create beautiful, organized notes with a clean and distraction-free interface designed for focus.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-5">
                  <ExternalLink size={24} />
                </div>
                <h3 className="text-xl font-medium text-gray-900">Easy Sharing</h3>
                <p className="mt-3 text-gray-600">
                  Share your notes with others in just a few clicks. Collaborate with friends and colleagues seamlessly.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-5">
                  <Search size={24} />
                </div>
                <h3 className="text-xl font-medium text-gray-900">Powerful Search</h3>
                <p className="mt-3 text-gray-600">
                  Find any note instantly with our powerful full-text search capabilities. Never lose an important thought again.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="py-20 bg-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Features that make a difference</h2>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Designed with simplicity and productivity in mind, JotCloud provides everything you need without the clutter.
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
                  className="bg-white p-6 rounded-xl shadow-sm flex flex-col"
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
    icon: Sparkles,
  },
  {
    title: "Secure Storage",
    description: "Your notes are private and secure by default, with end-to-end protection.",
    icon: Lock,
  },
  {
    title: "Cloud Sync",
    description: "Access your notes from any device with automatic cloud synchronization.",
    icon: CloudLightning,
  },
  {
    title: "Fast Search",
    description: "Find any note instantly with powerful full-text search capabilities.",
    icon: Search,
  },
  {
    title: "Privacy First",
    description: "Your data is yours alone. We don't share or sell your information.",
    icon: Shield,
  },
  {
    title: "Simple Organization",
    description: "Keep your notes organized with tags and custom categories.",
    icon: Check,
  },
];

export default Landing;
