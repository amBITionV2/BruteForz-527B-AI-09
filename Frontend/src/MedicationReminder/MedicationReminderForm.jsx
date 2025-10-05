import React, { useState } from "react";
import { motion } from "framer-motion"; // Import motion from framer-motion
import { useTranslation } from "react-i18next"; // Import translation hook

const MedicationReminderForm = ({ onReminderCreated }) => {
  const { t } = useTranslation(); // Initialize translation hook
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    instruction: "",
    date_time: "",
    frequency: "daily",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError(""); // Clear error when user makes changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Make sure the date is in the future
      const reminderDate = new Date(formData.date_time.replace("T", " "));
      if (reminderDate <= new Date()) {
        setError(t("reminderDateFuture"));
        setLoading(false);
        return;
      }
      
      // Format date_time to match the backend's expected format
      const formattedData = {
        ...formData,
        date_time: formData.date_time.replace("T", " ") + ":00", // Convert 'YYYY-MM-DDTHH:mm' to 'YYYY-MM-DD HH:MM:SS'
      };

      const response = await fetch("http://localhost:5000/api/medication-reminders", {
      //const response = await fetch("https://echomind-6.onrender.com/api/medication-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Reset form and notify parent component
        setFormData({
          name: "",
          dosage: "",
          instruction: "",
          date_time: "",
          frequency: "daily",
          email: "",
        });
        onReminderCreated();
      } else {
        setError(result.message || t("failedToCreateReminder"));
      }
    } catch (error) {
      console.error("Error creating reminder:", error);
      setError(t("errorCreatingReminder"));
    } finally {
      setLoading(false);
    }
  };

  // Framer Motion variants for form elements
  const formItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    // Removed max-w-md mx-auto as it's already centered by parent Combined.jsx
    <motion.div 
      className="p-6 rounded-2xl bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-md shadow-2xl text-gray-800 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-400/20 to-transparent rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-400/20 to-transparent rounded-tr-full"></div>
      
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
        📋 {t("createNewMedicationReminder")}
      </h2>
      
      {error && (
        <motion.div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" 
          role="alert"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <strong className="font-bold">{t("error")}!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5"> {/* Increased space-y for better spacing */}
        <motion.div className="form-group" variants={formItemVariants}>
          <label htmlFor="name" className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2">
            <span className="text-green-500">💊</span> {t("medicationName")}:
          </label>
          <input 
            type="text" 
            name="name" 
            id="name"
            value={formData.name} 
            onChange={handleChange} 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 ease-in-out placeholder-gray-400 hover:border-gray-300 bg-white shadow-sm" 
            required 
          />
        </motion.div>
        
        <motion.div className="form-group" variants={formItemVariants}>
          <label htmlFor="dosage" className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2">
            <span className="text-blue-500">🧪</span> {t("dosage")}:
          </label>
          <input 
            type="text" 
            name="dosage" 
            id="dosage"
            value={formData.dosage} 
            onChange={handleChange} 
            placeholder={t("dosagePlaceholder")} 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out placeholder-gray-400 hover:border-gray-300 bg-white shadow-sm" 
            required 
          />
        </motion.div>
        
        <motion.div className="form-group" variants={formItemVariants}>
          <label htmlFor="instruction" className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2">
            <span className="text-purple-500">📝</span> {t("instructions")}:
          </label>
          <input 
            type="text" 
            name="instruction" 
            id="instruction"
            value={formData.instruction} 
            onChange={handleChange}
            placeholder={t("instructionsPlaceholder")} 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ease-in-out placeholder-gray-400 hover:border-gray-300 bg-white shadow-sm" 
            required 
          />
        </motion.div>
        
        <motion.div className="form-group" variants={formItemVariants}>
          <label htmlFor="date_time" className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2">
            <span className="text-orange-500">📅</span> {t("startDateTime")}:
          </label>
          <input 
            type="datetime-local" 
            name="date_time" 
            id="date_time"
            value={formData.date_time} 
            onChange={handleChange} 
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ease-in-out hover:border-gray-300 bg-white shadow-sm" 
            required 
          />
        </motion.div>
        
        <motion.div className="form-group" variants={formItemVariants}>
          <label htmlFor="frequency" className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2">
            <span className="text-indigo-500">🔁</span> {t("frequency")}:
          </label>
          <div className="relative">
            <select 
              name="frequency" 
              id="frequency"
              value={formData.frequency} 
              onChange={handleChange}
              className="block appearance-none w-full bg-white border-2 border-gray-200 text-gray-800 py-3 px-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 ease-in-out hover:border-gray-300"
            >
              <option value="daily">{t("daily")}</option>
              <option value="weekly">{t("weekly")}</option>
              <option value="monthly">{t("monthly")}</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-indigo-600">
              <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </motion.div>
        
        <motion.div className="form-group" variants={formItemVariants}>
          <label htmlFor="email" className="block text-sm font-bold mb-2 text-gray-700 flex items-center gap-2">
            <span className="text-pink-500">📧</span> {t("emailForNotifications")}:
          </label>
          <input 
            type="email" 
            name="email" 
            id="email"
            value={formData.email} 
            onChange={handleChange} 
            placeholder="example@email.com"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all duration-200 ease-in-out placeholder-gray-400 hover:border-gray-300 bg-white shadow-sm" 
            required 
          />
        </motion.div>
        
        <motion.button 
          type="submit" 
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-xl hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center relative overflow-hidden group"
          disabled={loading}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          variants={formItemVariants}
        >
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
          {loading ? (
            <div className="flex items-center relative z-10">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t("creating")}...
            </div> 
            ) : (
              <span className="relative z-10 flex items-center gap-2">
                <span>✨</span> {t("createReminder")}
              </span>
            )
          }
        </motion.button>
      </form>
    </motion.div>
  );
};

export default MedicationReminderForm;