import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LogOut, Home } from 'react-feather';

function GameNav({ user }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navbarVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const brainGlowVariants = {
    initial: { textShadow: "0 0px 0px rgba(255,255,255,0.7)" },
    animate: {
      textShadow: ["0 0 0px rgba(255,255,255,0.7)", "0 0 8px rgba(255,255,255,0.7)", "0 0 0px rgba(255,255,255,0.7)"],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut"
      }
    }
  };

  const brandVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const logoutButtonVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.clear();
    navigate("/login");
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  return (
    <motion.nav
      className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-2xl sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 mb-8"
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        {/* Left section: Back button */}
        <motion.div className="flex items-center space-x-2 sm:space-x-3" variants={brandVariants}>
          <motion.button
            onClick={handleBack}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-xl text-white font-semibold transition-all duration-300 border-2 border-white/30 shadow-lg text-base sm:text-lg"
            whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
            whileTap={{ scale: 0.95 }}
            aria-label={t('goBackToDashboard')}
          >
            <Home className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">{t('dashboard')}</span>
          </motion.button>
        </motion.div>

        {/* Brand Section */}
        <motion.div
          className="flex items-center space-x-3 sm:space-x-4"
          variants={brandVariants}
        >
          <motion.span
            className="text-5xl sm:text-6xl lg:text-7xl"
            variants={brainGlowVariants}
            initial="initial"
            animate="animate"
          >
            🧠
          </motion.span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-wide drop-shadow-2xl">
            EchoMind
          </h1>
        </motion.div>

        {/* Right Section: Logout */}
        <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
          {/* Logout Button */}
          <motion.button
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 sm:px-5 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg text-base sm:text-lg border-2 border-red-400"
            onClick={handleLogout}
            variants={logoutButtonVariants}
            whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(220, 38, 38, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="hidden sm:inline">{t('logout')}</span>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}

export default GameNav;