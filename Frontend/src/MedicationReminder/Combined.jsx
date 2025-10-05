import React, { useState } from "react";
import ReminderList from "./ReminderList";
import MedicationReminderForm from "./MedicationReminderForm";
import NavBack from "../NavBack";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next"; // Add this import

const Combined = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { t } = useTranslation(); // Add this hook initialization

  const refreshReminders = () => {
    // Trigger a refresh of the reminders list without reloading the page
    setRefreshTrigger((prev) => prev + 1);
  };

  // Framer Motion variants for animations
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delayChildren: 0.2,
        staggerChildren: 0.15,
        ease: [0.22, 1, 0.36, 1]
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10">
        <NavBack />

      <motion.h1
        className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-300 to-teal-300 drop-shadow-lg"
        initial={{ opacity: 0, y: -30, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
        }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        💊 {t('medicationReminderDashboard')}
      </motion.h1>

      <motion.div
        className="flex flex-col md:flex-row gap-6 md:gap-8 max-w-6xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left Column for the Form */}
        <motion.div
          className="w-full md:w-1/2 p-6 md:p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-green-400/30 relative overflow-hidden"
          variants={itemVariants}
          whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(34, 197, 94, 0.25)" }}
        >
          {/* Decorative gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"></div>
          <MedicationReminderForm onReminderCreated={refreshReminders} />
        </motion.div>

        {/* Right Column for the Reminder List */}
        <motion.div
          className="w-full md:w-1/2 p-6 md:p-8 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-400/30 relative overflow-hidden"
          variants={itemVariants}
          whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.25)" }}
        >
          {/* Decorative gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400"></div>
          <ReminderList refreshTrigger={refreshTrigger} />
        </motion.div>
      </motion.div>
      </div>
    </div>
  );
};

export default Combined;