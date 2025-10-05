import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, LogOut, Home } from 'react-feather';

function NavBack({ user, title }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear session/local storage if used
    localStorage.removeItem("user");
    sessionStorage.clear();
    
    // Redirect to login
    navigate("/login");
  };

  const handleBack = () => {
    // Navigate to dashboard
    navigate("/dashboard");
  };

  // Framer Motion variants for the navbar elements
  const navbarVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 }
  };

  // Framer Motion variants for the glowing brain
  const brainGlowVariants = {
    initial: { textShadow: "0 0px 0px rgba(255,255,255,0.7)" },
    animate: {
      textShadow: ["0 0 0px rgba(255,255,255,0.7)", "0 0 8px rgba(255,255,255,0.7)", "0 0 0px rgba(255,255,255,0.7)"],
      transition: {
        duration: 2,
        repeat: Infinity, // Repeat the glow animation indefinitely
        repeatType: "mirror", // Make it pulse in and out smoothly
        ease: "easeInOut"
      }
    }
  };


  return (
    <motion.nav
      className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 shadow-2xl rounded-2xl mb-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 sticky top-0 z-50"
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center">
        {/* Left section: Back/Home button */}
        <motion.div className="flex items-center space-x-2 sm:space-x-3" variants={itemVariants}>
          {window.location.pathname !== "/dashboard" && (
            <motion.button
              onClick={handleBack}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-xl text-white font-semibold transition-all duration-300 border-2 border-white/30 shadow-lg text-base sm:text-lg"
              whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              aria-label="Back to Dashboard"
            >
              <Home className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline">Dashboard</span>
            </motion.button>
          )}
        </motion.div>

        {/* Center section: App Brand */}
        <motion.div className="flex items-center space-x-3" variants={itemVariants}>
          <motion.span
            className="text-5xl sm:text-6xl"
            variants={brainGlowVariants}
            initial="initial"
            animate="animate"
          >
            🧠
          </motion.span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-wide drop-shadow-lg">
            {title || "EchoMind"}
          </h1>
        </motion.div>

        {/* Right section: User info and Logout */}
        <motion.div className="flex items-center space-x-3 sm:space-x-4" variants={itemVariants}>
          {user && (
            <motion.div
              className="hidden lg:flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-white/30"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <span className="text-base sm:text-lg text-white font-semibold">
                👤 {user.name}
              </span>
            </motion.div>
          )}
          <motion.button
            className="flex items-center space-x-2 px-4 sm:px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all duration-300 text-base sm:text-lg border-2 border-red-400"
            onClick={handleLogout}
            whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(220, 38, 38, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </motion.div>
      </div>
    </motion.nav>
  );
}

export default NavBack;