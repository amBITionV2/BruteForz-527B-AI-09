import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Signup = ({ onSignup }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    phone: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Variants for animations
  const formCardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        when: "beforeChildren", // Animate parent first
        staggerChildren: 0.1 // Stagger child animations
      }
    }
  };

  const brainContainerVariants = {
    hidden: { scale: 0.75, opacity: 0 },
    visible: {
      scale: 1.25,
      opacity: 1,
      transition: {
        duration: 1.2,
        ease: "easeOut",
        delay: 0.3 // Stagger after card appears
      }
    }
  };

  const brainEmojiVariants = {
    pulse: {
      filter: [
        'drop-shadow(0 0 5px rgba(255, 255, 255, 0.4))',
        'drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))',
        'drop-shadow(0 0 5px rgba(255, 255, 255, 0.4))'
      ],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror"
      }
    }
  };

  const brainGlowVariants = {
    glow: {
      opacity: [0, 0.4, 0],
      transition: {
        duration: 1.5,
        ease: "easeOut",
        repeat: Infinity,
        repeatDelay: 1
      }
    }
  };

  const inputVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: [0, -10, -5, 0], // Bounce effect
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 0.8 // Animate after inputs
      }
    }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    const requiredFields = ['name', 'email', 'password', 'confirmPassword', 'age', 'phone'];
    for (const field of requiredFields) {
      if (!formData[field]) {
        setError(`Please fill in your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}.`);
        return false;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Please enter a valid phone number (10-15 digits).');
      return false;
    }

    if (isNaN(formData.age) || parseInt(formData.age) < 1 || parseInt(formData.age) > 120) {
      setError('Please enter a valid age (1-120).');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/signup', {
      //const response = await fetch('https://echomind-6.onrender.com/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user || { email: formData.email, name: formData.name }));
        if (onSignup) onSignup();
        navigate('/');
      } else {
        setError(data.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Variants for dropdown animation
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
    <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-indigo-900 flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      {/* Abstract background shapes - softened for minimal clutter */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob animation-delay-2000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-4000"></div>

      {/* Main Form Wrapper - Enhanced for better readability */}
      <motion.div
        className="relative z-10 bg-white bg-opacity-95 backdrop-filter backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 md:p-12 w-full max-w-md lg:max-w-2xl border-2 border-purple-200"
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
            Join us today! Create your account
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
          {/* Full Name - Enhanced with icon */}
          <motion.div variants={inputVariants}>
            <label htmlFor="name" className="block text-gray-700 text-lg sm:text-xl font-bold mb-3">
              👤 Full Name
            </label>
            <motion.input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              className="w-full px-5 py-4 text-lg sm:text-xl bg-gray-50 text-gray-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 border-2 border-gray-300 placeholder-gray-400 transition-all duration-300 ease-in-out font-medium"
              whileFocus={{ scale: 1.02, borderColor: "#9333ea", boxShadow: "0 0 15px rgba(147, 51, 234, 0.3)" }}
            />
          </motion.div>

          {/* Email - Enhanced with icon */}
          <motion.div variants={inputVariants}>
            <label htmlFor="email" className="block text-gray-700 text-lg sm:text-xl font-bold mb-3">
              📧 Email Address
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

          {/* Phone and Age - Improved grid layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div variants={inputVariants}>
              <label htmlFor="phone" className="block text-gray-700 text-lg sm:text-xl font-bold mb-3">
                📱 Phone Number
              </label>
              <motion.input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1234567890"
                required
                className="w-full px-5 py-4 text-lg sm:text-xl bg-gray-50 text-gray-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 border-2 border-gray-300 placeholder-gray-400 transition-all duration-300 ease-in-out font-medium"
                whileFocus={{ scale: 1.02, borderColor: "#9333ea", boxShadow: "0 0 15px rgba(147, 51, 234, 0.3)" }}
              />
            </motion.div>

            <motion.div variants={inputVariants}>
              <label htmlFor="age" className="block text-gray-700 text-lg sm:text-xl font-bold mb-3">
                🎂 Age
              </label>
              <motion.input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g., 30"
                min="1"
                required
                className="w-full px-5 py-4 text-lg sm:text-xl bg-gray-50 text-gray-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 border-2 border-gray-300 placeholder-gray-400 transition-all duration-300 ease-in-out font-medium"
                whileFocus={{ scale: 1.02, borderColor: "#9333ea", boxShadow: "0 0 15px rgba(147, 51, 234, 0.3)" }}
              />
            </motion.div>
          </div>

          {/* Password - Enhanced with icon */}
          <motion.div variants={inputVariants}>
            <label htmlFor="password" className="block text-gray-700 text-lg sm:text-xl font-bold mb-3">
              🔒 Password
            </label>
            <motion.input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a strong password"
              required
              className="w-full px-5 py-4 text-lg sm:text-xl bg-gray-50 text-gray-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 border-2 border-gray-300 placeholder-gray-400 transition-all duration-300 ease-in-out font-medium"
              whileFocus={{ scale: 1.02, borderColor: "#9333ea", boxShadow: "0 0 15px rgba(147, 51, 234, 0.3)" }}
            />
          </motion.div>

          {/* Confirm Password - Enhanced with icon */}
          <motion.div variants={inputVariants}>
            <label htmlFor="confirmPassword" className="block text-gray-700 text-lg sm:text-xl font-bold mb-3">
              🔐 Confirm Password
            </label>
            <motion.input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              required
              className="w-full px-5 py-4 text-lg sm:text-xl bg-gray-50 text-gray-800 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 border-2 border-gray-300 placeholder-gray-400 transition-all duration-300 ease-in-out font-medium"
              whileFocus={{ scale: 1.02, borderColor: "#9333ea", boxShadow: "0 0 15px rgba(147, 51, 234, 0.3)" }}
            />
          </motion.div>

          {/* Signup Button - Enhanced size and visibility */}
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
                <span>Creating account...</span>
              </>
            ) : (
              <>🚀 Create Account</>
            )}
          </motion.button>
        </form>

        {/* Footer Link - Enhanced readability */}
        <motion.div className="mt-8 text-center" variants={textVariants}>
          <p className="text-gray-600 text-lg sm:text-xl font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 hover:text-purple-800 font-bold transition-colors duration-200 underline decoration-2 underline-offset-4">
              Log in here
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Signup;