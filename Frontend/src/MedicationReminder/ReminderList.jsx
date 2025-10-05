import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, Edit3, Trash2, Clock } from 'react-feather'; // Added Clock for pending status
import { motion, AnimatePresence } from "framer-motion"; // Import motion and AnimatePresence
import { useTranslation } from "react-i18next"; // Import translation hook

const ReminderList = ({ refreshTrigger }) => {
  const { t, i18n } = useTranslation(); // Initialize translation hook
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    instruction: "",
    date_time: "",
    frequency: "daily",
    email: "",
  });

  const fetchReminders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:5000/api/medication-reminders");
      //const response = await fetch("https://echomind-6.onrender.com/api/medication-reminders");
      const result = await response.json();
      
      if (result.success) {
        // Sort reminders: pending first, then by date, then completed/missed
        const sortedReminders = (result.reminders || []).sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          
          if (a.status === 'completed' && b.status === 'missed') return 1;
          if (a.status === 'missed' && b.status === 'completed') return -1;

          // For pending items, sort by date_time ascending
          if (a.status === 'pending' && b.status === 'pending') {
            return new Date(a.date_time) - new Date(b.date_time);
          }
          
          // For completed/missed, sort by date_time descending (most recent first)
          return new Date(b.date_time) - new Date(a.date_time);
        });
        setReminders(sortedReminders);
      } else {
        setError(result.message || t("failedToFetchReminders"));
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
      setError(t("errorFetchingReminders"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t("confirmDeleteReminder"))) return;
    
    try {
      //const response = await fetch(`http://localhost:5000/api/medication-reminders/${id}`, {
      const response = await fetch(`https://echomind-6.onrender.com/api/medication-reminders/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      
      if (result.success) {
        fetchReminders();
      } else {
        setError(result.message || t("failedToDeleteReminder"));
      }
    } catch (error) {
      console.error("Error deleting reminder:", error);
      setError(t("errorDeletingReminder"));
    }
  };

  const handleComplete = async (id) => {
    try {
      //const response = await fetch(`http://localhost:5000/api/medication-reminders/${id}/complete`, {
      const response = await fetch(`https://echomind-6.onrender.com/api/medication-reminders/${id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        fetchReminders();
      } else {
        setError(result.message || t('failedToMarkMedication'));
      }
    } catch (error) {
      console.error('Error marking medication as taken:', error);
      setError(t('errorMarkingMedication'));
    }
  };

  const startEdit = (reminder) => {
    const dateTime = new Date(reminder.date_time);
    const formattedDateTime = dateTime.toISOString().slice(0, 16);

    setFormData({
      name: reminder.name,
      dosage: reminder.dosage,
      instruction: reminder.instruction,
      date_time: formattedDateTime,
      frequency: reminder.frequency,
      email: reminder.email,
    });
    
    setEditingReminder(reminder._id);
  };

  const cancelEdit = () => {
    setEditingReminder(null);
    setError(""); // Clear error on cancel edit
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    
    try {
      const formattedData = {
        ...formData,
        date_time: formData.date_time.replace("T", " ") + ":00",
      };

      //const response = await fetch(`http://localhost:5000/api/medication-reminders/${editingReminder}`, {
      const response = await fetch(`https://echomind-6.onrender.com/api/medication-reminders/${editingReminder}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setEditingReminder(null);
        fetchReminders();
      } else {
        setError(result.message || t("failedToUpdateReminder"));
      }
    } catch (error) {
      console.error("Error updating reminder:", error);
      setError(t("errorUpdatingReminder"));
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(i18n.language === 'hi' ? 'hi-IN' : 'en-US', options);
  };

  useEffect(() => {
    fetchReminders();
  }, [refreshTrigger]);

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
  };

  return (
    <motion.div 
      className="p-6 rounded-2xl bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-md shadow-2xl text-gray-800 relative overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Decorative corner accents */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/20 to-transparent rounded-tr-full"></div>
      
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
        🔔 {t('activeMedicationReminders')}
      </h2>
      
      {error && (
        <motion.div 
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" 
          role="alert"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <strong className="font-bold">{t('error')}!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </motion.div>
      )}
      
      {loading && reminders.length === 0 ? (
        <div className="text-center p-4">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="mt-4 text-gray-600">{t('loadingReminders')}</p>
        </div>
      ) : reminders.length === 0 ? (
        <p className="text-gray-500 italic text-center py-4">{t('noRemindersFound')}</p>
      ) : (
        <div className="space-y-4">
          <AnimatePresence> {/* Enable exit animations */}
            {reminders.map((reminder) => (
              <motion.div 
                key={reminder._id} 
                className={`p-5 border-2 rounded-2xl shadow-lg flex flex-col transition-all duration-300 ease-in-out relative overflow-hidden
                  ${reminder.status === 'completed' ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 opacity-90' : 
                    reminder.status === 'missed' ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300 opacity-90' : 
                    'bg-gradient-to-br from-white to-gray-50 border-purple-200 hover:shadow-xl hover:border-purple-300'
                  }`}
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={reminder.status === 'pending' ? { y: -3, scale: 1.01 } : {}}
              >
                {/* Status indicator bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${reminder.status === 'completed' ? 'bg-gradient-to-r from-green-400 to-emerald-400' : reminder.status === 'missed' ? 'bg-gradient-to-r from-red-400 to-pink-400' : 'bg-gradient-to-r from-purple-400 to-indigo-400'}`}></div>
                {editingReminder === reminder._id ? (
                  <form onSubmit={handleUpdate} className="space-y-3 bg-gradient-to-br from-purple-50 to-indigo-50 p-4 rounded-xl border-2 border-purple-200">
                    <div className="flex flex-col">
                      <label htmlFor={`edit-name-${reminder._id}`} className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <span>💊</span> {t('medicationName')}:
                      </label>
                      <input 
                        type="text" 
                        name="name" 
                        id={`edit-name-${reminder._id}`}
                        value={formData.name} 
                        onChange={handleChange} 
                        className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 text-sm bg-white" 
                        required 
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor={`edit-dosage-${reminder._id}`} className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <span>🧪</span> {t('dosage')}:
                      </label>
                      <input 
                        type="text" 
                        name="dosage" 
                        id={`edit-dosage-${reminder._id}`}
                        value={formData.dosage} 
                        onChange={handleChange} 
                        className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 text-sm bg-white" 
                        required 
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor={`edit-instruction-${reminder._id}`} className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <span>📝</span> {t('instructions')}:
                      </label>
                      <input 
                        type="text" 
                        name="instruction" 
                        id={`edit-instruction-${reminder._id}`}
                        value={formData.instruction} 
                        onChange={handleChange} 
                        className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 text-sm bg-white" 
                        required 
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor={`edit-datetime-${reminder._id}`} className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <span>📅</span> {t('startDateTime')}:
                      </label>
                      <input 
                        type="datetime-local" 
                        name="date_time" 
                        id={`edit-datetime-${reminder._id}`}
                        value={formData.date_time} 
                        onChange={handleChange} 
                        className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 text-sm bg-white" 
                        required 
                      />
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor={`edit-frequency-${reminder._id}`} className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <span>🔁</span> {t('frequency')}:
                      </label>
                      <div className="relative">
                        <select 
                          name="frequency" 
                          id={`edit-frequency-${reminder._id}`}
                          value={formData.frequency} 
                          onChange={handleChange}
                          className="block appearance-none w-full bg-white border-2 border-purple-200 text-gray-800 py-2 px-3 pr-8 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        >
                          <option value="daily">{t('daily')}</option>
                          <option value="weekly">{t('weekly')}</option>
                          <option value="monthly">{t('monthly')}</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-purple-600">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label htmlFor={`edit-email-${reminder._id}`} className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
                        <span>📧</span> {t('email')}:
                      </label>
                      <input 
                        type="email" 
                        name="email" 
                        id={`edit-email-${reminder._id}`}
                        value={formData.email} 
                        onChange={handleChange} 
                        className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-700 text-sm bg-white" 
                        required 
                      />
                    </div>
                    <div className="flex justify-end space-x-2 mt-4 pt-3 border-t-2 border-purple-200">
                      <motion.button 
                        type="submit" 
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-5 rounded-lg text-sm transition-all duration-200 shadow-md"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ✔️ {t('save')}
                      </motion.button>
                      <motion.button 
                        type="button" 
                        onClick={cancelEdit} 
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-5 rounded-lg text-sm transition-all duration-200 shadow-md"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        ❌ {t('cancel')}
                      </motion.button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3 flex-grow">
                        <div className="mt-0.5 flex-shrink-0">
                          {reminder.status === 'completed' ? (
                            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          ) : reminder.status === 'missed' ? (
                            <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-pink-500 rounded-full flex items-center justify-center shadow-md">
                              <XCircle className="w-5 h-5 text-white" />
                            </div>
                          ) : (
                            <motion.button
                              onClick={() => handleComplete(reminder._id)}
                              className="w-8 h-8 border-3 border-purple-400 bg-white rounded-full flex items-center justify-center text-purple-500 hover:bg-gradient-to-br hover:from-purple-500 hover:to-indigo-500 hover:text-white hover:border-purple-600 transition-all duration-200 shadow-md"
                              title={t('markAsTaken')}
                              whileHover={{ scale: 1.15, rotate: 10 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Clock className="w-5 h-5" />
                            </motion.button>
                          )}
                        </div>
                        <div className="flex-grow">
                          <h3 className={`text-lg font-bold text-gray-800 ${
                            reminder.status === 'completed' ? 'line-through text-gray-600' : ''
                          }`}>
                            {reminder.name}
                          </h3>
                          <p className="text-gray-700 text-sm font-medium mt-0.5">💧 {reminder.dosage}</p>
                        </div>
                      </div>
                      <div className="text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0 ${
                        reminder.status === 'completed' ? 'bg-green-100 text-green-700' :
                        reminder.status === 'missed' ? 'bg-red-100 text-red-700' :
                        'bg-purple-100 text-purple-700'
                      }">
                        {t(reminder.frequency)}
                      </div>
                    </div>
                    
                    <p className={`my-3 text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border-l-4 ${
                      reminder.status === 'completed' ? 'line-through text-gray-500 border-green-400' : 'border-purple-400'
                    }`}>
                      📝 {reminder.instruction}
                    </p>
                    
                    <div className="flex flex-wrap justify-between items-center mt-3 text-xs text-gray-600 gap-2">
                      <p className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200">
                        <span>📅</span> {t('next')}: <span className="font-bold text-orange-700">{formatDate(reminder.date_time)}</span>
                      </p>
                      <p className="flex items-center gap-1.5 bg-pink-50 px-3 py-1.5 rounded-full border border-pink-200">
                        <span>📧</span> <span className="font-medium text-pink-700">{reminder.email}</span>
                      </p>
                    </div>
                    
                    {reminder.status !== 'completed' && (
                      <div className="mt-4 flex space-x-3 justify-end">
                        <motion.button 
                          onClick={() => startEdit(reminder)}
                          className="text-blue-600 hover:text-white bg-blue-50 hover:bg-gradient-to-r hover:from-blue-600 hover:to-cyan-600 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center border-2 border-blue-200 hover:border-blue-600 shadow-sm"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Edit3 className="w-4 h-4 mr-1.5" /> {t('edit')}
                        </motion.button>
                        <motion.button 
                          onClick={() => handleDelete(reminder._id)}
                          className="text-red-600 hover:text-white bg-red-50 hover:bg-gradient-to-r hover:from-red-600 hover:to-pink-600 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 flex items-center border-2 border-red-200 hover:border-red-600 shadow-sm"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" /> {t('delete')}
                        </motion.button>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default ReminderList;