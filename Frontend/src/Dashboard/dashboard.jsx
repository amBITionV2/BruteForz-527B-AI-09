import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import Navbar from "../Navbar";
import { useTranslation } from "react-i18next"; // Import translation hook

// If using npm install for Font Awesome, make sure this is imported somewhere:
// import '@fortawesome/fontawesome-free/css/all.min.css';

function Dashboard({ patients, selectedPatient, loading, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("user"));
  const [isRecording, setIsRecording] = useState(false);
  const { t } = useTranslation(); // Initialize translation hook
  
  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.15 },
    },
  };

  const profileCardVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  const sosButtonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { 
        duration: 0.6, 
        ease: "easeOut", 
        delay: 0.3,
      },
    },
  };

  const tileVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
    },
    hover: { 
      y: -8,
      scale: 1.02,
      transition: { duration: 0.3, ease: "easeOut" } 
    },
    tap: { scale: 0.98 },
  };

  const recordButtonVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut", delay: 0.6 },
    },
    pulse: {
      scale: [1, 1.03, 1],
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "mirror",
      },
    },
  };

  // --- Utility ---
  const isActive = (path) =>
    location.pathname.includes(path)
      ? "bg-purple-600 text-white shadow-lg"
      : "bg-white/10 text-white";

  const handleNavigation = (path) => {
    navigate(path);
  };

  const handleSOS = () => {
    navigate("/sos");
  };

 const toggleRecording = async () => {
    try {
      const endpoint = isRecording
        ? "https://3bttfh6b-8000.inc1.devtunnels.ms/stop"
        : "https://3bttfh6b-8000.inc1.devtunnels.ms/recognize";

      console.log(`Calling endpoint: ${endpoint}`);

      let response;
      if (isRecording) {
        // If currently recording, send POST to stop
        response = await axios.post(endpoint);
      } else {
        // If not recording, send GET to recognize (start)
        response = await axios.get(endpoint);
      }

      if (response.status === 200) {
        // Successfully toggled, update the state
        setIsRecording(!isRecording);
        console.log(`Recording state toggled to: ${!isRecording}`);
      } else {
        console.error(`Unexpected response status: ${response.status}`);
        // If the API call failed, don't change the recording state.
        // Optionally, you could add an alert or some user feedback here
      }
    } catch (error) {
      console.error("Error toggling recording:", error);
      // If there's an error, don't change the recording state.
      // Optionally, you could add an alert or some user feedback here
    }
  };

  // --- Loading Screen ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-700 to-indigo-900">
        <div className="p-4 bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl shadow-xl flex flex-col items-center">
          <div className="animate-spin h-12 w-12 border-4 border-white border-t-transparent rounded-full mb-4"></div>
          <p className="text-white text-lg font-semibold">
            {t('loadingProfile')}
          </p>
        </div>
      </div>
    );
  }

  // --- Main Component ---
  return (
    <>
      <Navbar user={user} />
      <motion.div
        className="min-h-screen bg-gradient-to-br from-purple-700 via-purple-800 to-indigo-900 flex flex-col items-center px-4 sm:px-6 py-8 text-white relative overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-20 left-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        {/* Greeting + SOS Card */}
        <motion.div
          className="w-full max-w-5xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 sm:p-10 mt-6 relative overflow-hidden"
          variants={profileCardVariants}
        >
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full filter blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            {/* Greeting Section */}
            <div className="flex-1">
              <motion.div 
                className="inline-block mb-3"
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <span className="text-6xl">👋</span>
              </motion.div>
              <motion.h2
                className="text-4xl sm:text-5xl font-extrabold mb-3 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent"
                variants={profileCardVariants}
              >
                {t('hello')}, {userData?.name || t('user')}!
              </motion.h2>
              <motion.p
                className="text-lg text-white/80 font-medium flex items-center gap-2"
                variants={profileCardVariants}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {t('todayIs')}{" "}
                {new Date().toLocaleDateString(
                  t('locale') === 'hi' ? 'hi-IN' : 'en-US', 
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </motion.p>
            </div>

            {/* SOS Button */}
            <motion.div
              className="flex justify-center lg:justify-end"
              variants={sosButtonVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.button
                onClick={handleSOS}
                className="relative group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-5 px-12 rounded-2xl shadow-2xl flex items-center gap-4 text-xl overflow-hidden transition-all duration-300"
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(220, 38, 38, 0.4)" }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <motion.i 
                  className="fas fa-exclamation-circle text-3xl relative z-10" 
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                  }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatDelay: 2,
                  }}
                />
                <span className="relative z-10 font-extrabold">{t('sendSOS')}</span>
                
                {/* Pulse effect */}
                <motion.div
                  className="absolute inset-0 border-4 border-white rounded-2xl opacity-0"
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0, 0.3, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Dashboard Tiles Grid */}
        <motion.div 
          className="grid grid-cols-2 lg:grid-cols-3 gap-6 mt-12 w-full max-w-5xl"
          variants={containerVariants}
        >
          {[
            {icon: "fas fa-chart-line", label: t('summary'), path: "/summary", gradient: "from-blue-500/20 to-cyan-500/20", iconColor: "text-cyan-300", hoverGradient: "from-blue-500/30 to-cyan-500/30" },
            { icon: "fas fa-gamepad", label: t('games'), path: "/games", gradient: "from-pink-500/20 to-rose-500/20", iconColor: "text-rose-300", hoverGradient: "from-pink-500/30 to-rose-500/30" },
            {
              icon: "fas fa-calendar-alt",
              label: t('routineAndMedication'),
              path: "/medication-reminder",
              gradient: "from-green-500/20 to-emerald-500/20",
              iconColor: "text-emerald-300",
              hoverGradient: "from-green-500/30 to-emerald-500/30"
            },
            {
              icon: "fas fa-address-book",
              label: t('contacts'),
              path: "/contacts",
              gradient: "from-orange-500/20 to-amber-500/20",
              iconColor: "text-amber-300",
              hoverGradient: "from-orange-500/30 to-amber-500/30"
            },
            { 
              icon: "fas fa-map-marked-alt",
              label: t('geoFencing'),
              path: "/geofence-guardian",
              gradient: "from-purple-500/20 to-indigo-500/20",
              iconColor: "text-indigo-300",
              hoverGradient: "from-purple-500/30 to-indigo-500/30"
            }
          ].map(({ icon, label, path, gradient, iconColor, hoverGradient }, index) => (
            <motion.button
              key={path}
              onClick={() => handleNavigation(path)}
              className={`group relative flex flex-col items-center justify-center text-center bg-gradient-to-br ${gradient} backdrop-blur-xl border border-white/20 hover:border-white/40 rounded-3xl shadow-xl hover:shadow-2xl p-8 sm:p-10 font-semibold text-white transition-all duration-300 overflow-hidden ${
                location.pathname.includes(path) ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-purple-900' : ''
              }`}
              variants={tileVariants}
              whileHover="hover"
              whileTap="tap"
              custom={index}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${hoverGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
              
              {/* Icon container with glow effect */}
              <motion.div 
                className="relative mb-4"
                whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <div className={`absolute inset-0 ${iconColor} blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300`}></div>
                <i className={`${icon} text-5xl sm:text-6xl ${iconColor} relative z-10 drop-shadow-lg`} />
              </motion.div>
              
              {/* Label */}
              <span className="relative z-10 text-base sm:text-lg font-bold text-white group-hover:text-white transition-colors duration-300">
                {label}
              </span>
              
              {/* Arrow indicator on hover */}
              <motion.div
                className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={{ x: -10 }}
                whileHover={{ x: 0 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </motion.div>
            </motion.button>
          ))}
        </motion.div>

        {/* Record Button */}
        <motion.button
          className={`mt-12 mb-8 px-12 py-6 rounded-2xl text-white font-bold text-xl shadow-2xl flex items-center gap-4 relative overflow-hidden transition-all duration-300 ${
            isRecording 
              ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
              : 'bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700'
          }`}
          onClick={toggleRecording}
          variants={recordButtonVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)" }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Animated background shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {isRecording ? (
            <motion.span
              className="flex items-center gap-3 text-white relative z-10"
              animate="pulse"
              variants={recordButtonVariants}
            >
              <motion.i 
                className="fas fa-stop-circle text-4xl" 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
              <span className="font-extrabold">{t('stopRecording')}</span>
              <motion.span
                className="w-3 h-3 bg-red-300 rounded-full"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.span>
          ) : (
            <span className="flex items-center gap-3 text-white relative z-10">
              <i className="fas fa-microphone text-4xl" />
              <span className="font-extrabold">{t('startRecording')}</span>
            </span>
          )}
        </motion.button>
      </motion.div>
    </>
  );
}

export default Dashboard;