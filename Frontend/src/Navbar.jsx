import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { LogOut, Globe, ChevronDown } from 'react-feather';

function Navbar({ user }) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);

  // Language options with flags - including Kannada
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

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
        repeat: Infinity, // Repeat the glow animation indefinitely
        repeatType: "mirror", // Make it pulse in and out smoothly
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

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
    setIsLanguageOpen(false);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: "easeOut" }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15, ease: "easeIn" }
    }
  };

  return (
    <motion.nav
      className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-2xl sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex justify-between items-center max-w-7xl mx-auto">
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
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-wide drop-shadow-2xl">
            EchoMind
          </h1>
        </motion.div>

        {/* Right Section: User, Language, Logout */}
        <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-6">
          {/* User Greeting */}
          {user && (
            <motion.div
              className="hidden md:flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-white/30"
              variants={logoutButtonVariants}
            >
              <span className="text-lg lg:text-xl font-semibold whitespace-nowrap">
                👤 {t('hi')}, {user.name}
              </span>
            </motion.div>
          )}

          {/* Language Dropdown */}
          <motion.div
            className="relative"
            variants={logoutButtonVariants}
          >
            <motion.button
              onClick={() => setIsLanguageOpen(!isLanguageOpen)}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-xl text-white font-semibold transition-all duration-300 border-2 border-white/30 shadow-lg text-base sm:text-lg"
              whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              aria-label="Select Language"
            >
              <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline text-xl">{currentLanguage.flag}</span>
              <span className="hidden lg:inline">{currentLanguage.name}</span>
              <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${isLanguageOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isLanguageOpen && (
                <motion.div
                  className="absolute right-0 mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-purple-200"
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {languages.map((lang) => (
                    <motion.button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors duration-200 text-base sm:text-lg font-semibold ${
                        currentLanguage.code === lang.code
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-700 hover:bg-purple-50'
                      }`}
                      whileHover={{ backgroundColor: currentLanguage.code === lang.code ? '#e9d5ff' : '#f3e8ff' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      <span>{lang.name}</span>
                      {currentLanguage.code === lang.code && (
                        <span className="ml-auto text-purple-600">✓</span>
                      )}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

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

      {/* Mobile User Greeting */}
      {user && (
        <motion.div
          className="md:hidden mt-3 text-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl border-2 border-white/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-base sm:text-lg font-semibold">
            👤 {t('hi')}, {user.name}
          </span>
        </motion.div>
      )}
    </motion.nav>
  );
}

export default Navbar;