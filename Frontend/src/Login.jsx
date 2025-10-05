import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import { useTranslation } from "react-i18next";
import { Globe, ChevronDown } from 'react-feather';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // Use the hook to access translations

  // Language options with flags
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'bn', name: 'বাংলা', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // --- Framer Motion Variants ---

  // Main card fade-in and subtle scale
  const formCardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        when: "beforeChildren", // Ensures parent animates before its children
        staggerChildren: 0.1 // Staggers the animation of direct children
      }
    }
  };

  // Brain container (initial scale and opacity)
  const brainContainerVariants = {
    hidden: { scale: 0.75, opacity: 0 },
    visible: {
      scale: 1.25, // Zooms in
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut",
        delay: 0.3 // Starts animating slightly after the form card
      }
    }
  };

  // Brain emoji pulsing glow effect
  const brainEmojiVariants = {
    pulse: {
      filter: [
        'drop-shadow(0 0 5px rgba(255, 255, 255, 0.4))', // Soft glow
        'drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))', // Brighter glow
        'drop-shadow(0 0 5px rgba(255, 255, 255, 0.4))'
      ],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror" // Repeats the animation back and forth
      }
    }
  };

  // Blue glow animation behind the brain
  const brainGlowVariants = {
    glow: {
      opacity: [0, 0.4, 0],
      transition: {
        duration: 1.5,
        ease: "easeOut",
        repeat: Infinity,
        repeatDelay: 1 // Delay before repeating
      }
    }
  };

  // Input field slide-in effect
  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  // Button initial bounce effect
  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: [0, -10, -5, 0], // Keyframes for a subtle bounce
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.6 // Appears after inputs
      }
    }
  };

  // Text fade-in effect for titles and descriptions
  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  // --- Form Handlers ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.email || !formData.password) {
      setError('Both email and password are required.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
      //const response = await fetch('https://echomind-6.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      // Store user data in localStorage (consider more secure methods for production)
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setLoading(false);
    }
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

  // --- Component Render ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-indigo-900 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      {/* Abstract background shapes - softened for minimal clutter */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-4000"></div>

      {/* Language Selector - Top Right */}
      <motion.div
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <motion.button
          onClick={() => setIsLanguageOpen(!isLanguageOpen)}
          className="flex items-center space-x-2 bg-white/90 hover:bg-white backdrop-blur-sm px-4 py-3 rounded-xl text-purple-700 font-semibold transition-all duration-300 border-2 border-purple-200 shadow-lg text-base sm:text-lg"
          whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(147, 51, 234, 0.3)" }}
          whileTap={{ scale: 0.95 }}
          aria-label="Select Language"
        >
          <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
          <span className="text-xl">{currentLanguage.flag}</span>
          <span className="hidden sm:inline">{currentLanguage.name}</span>
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

      {/* Main Form Wrapper - Enhanced for elders */}
      <motion.div
        className="relative z-10 bg-white bg-opacity-95 backdrop-filter backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 md:p-12 w-full max-w-md lg:max-w-lg border-2 border-purple-200"
        variants={formCardVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col items-center mb-8">
          {/* Brain Logo - Enhanced size */}
          <motion.div
            className="relative mb-6"
            variants={brainContainerVariants}
          >
            <motion.div
              className="text-7xl sm:text-8xl text-purple-600 drop-shadow-2xl"
              variants={brainEmojiVariants}
              animate="pulse"
            >
              🧠
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-purple-400 rounded-full filter blur-xl"
              variants={brainGlowVariants}
              animate="glow"
            ></motion.div>
          </motion.div>
          <motion.h1 className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 mb-3 tracking-wide" variants={textVariants}>
            EchoMind
          </motion.h1>
          <motion.p className="text-gray-600 text-lg sm:text-xl text-center font-medium" variants={textVariants}>
            Welcome back! Please login
          </motion.p>
        </div>

        {/* Error message - Enhanced visibility */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-50 border-2 border-red-300 text-red-700 p-4 rounded-xl mb-6 text-center font-semibold text-base sm:text-lg"
          >
            ⚠️ {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input - Enhanced with icon and larger text */}
          <motion.div variants={inputVariants}>
            <label htmlFor="email" className="block text-gray-700 text-lg sm:text-xl font-bold mb-3">
              📧 {t("email")}
            </label>
            <motion.input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              required
              className="w-full px-5 py-4 text-lg sm:text-xl bg-gray-50 text-gray-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 border-2 border-gray-300 placeholder-gray-400 transition-all duration-300 ease-in-out font-medium"
              whileFocus={{ scale: 1.02, borderColor: "#9333ea", boxShadow: "0 0 15px rgba(147, 51, 234, 0.3)" }}
            />
          </motion.div>

          {/* Password Input - Enhanced with icon and larger text */}
          <motion.div variants={inputVariants}>
            <label htmlFor="password" className="block text-gray-700 text-lg sm:text-xl font-bold mb-3">
              🔒 {t("password")}
            </label>
            <motion.input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              className="w-full px-5 py-4 text-lg sm:text-xl bg-gray-50 text-gray-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 border-2 border-gray-300 placeholder-gray-400 transition-all duration-300 ease-in-out font-medium"
              whileFocus={{ scale: 1.02, borderColor: "#9333ea", boxShadow: "0 0 15px rgba(147, 51, 234, 0.3)" }}
            />
          </motion.div>

          {/* Login Button - Enhanced size and visibility */}
          <motion.button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-5 px-6 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-400 transition-all duration-300 ease-in-out transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xl sm:text-2xl shadow-lg hover:shadow-xl"
            disabled={loading}
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-6 w-6 text-white mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Logging in...</span>
              </>
            ) : (
              <>✨ {t("login")}</>
            )}
          </motion.button>
        </form>

        {/* Footer Link - Enhanced readability */}
        <motion.div className="mt-8 text-center" variants={textVariants}>
          <p className="text-gray-600 text-lg sm:text-xl font-medium">
            {t("dontHaveAccount")}{' '}
            <Link to="/signup" className="text-purple-600 hover:text-purple-800 font-bold transition-colors duration-200 underline decoration-2 underline-offset-4">
              {t("register")}
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Login;