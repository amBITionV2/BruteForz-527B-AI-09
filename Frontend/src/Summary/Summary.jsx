import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

function Summary() {
  const { t } = useTranslation();
  const [knownPersons, setKnownPersons] = useState([]);
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [summaryData, setSummaryData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const patientId = user ? user.user_id : null;

  // Chatbot states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const chatMessagesEndRef = useRef(null);

  const scrollToBottom = () => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    const fetchKnownPersons = async () => {
      try {
        setIsLoading(true);

        if (!patientId) {
          setError(t('authMissing'));
          setIsLoading(false);
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/known-persons/${patientId}`);

        if (response.data.success) {
          setKnownPersons(response.data.known_persons || []);

          if (response.data.known_persons && response.data.known_persons.length > 0 && !selectedPersonId) {
            setSelectedPersonId(response.data.known_persons[0].known_person_id);
          }
        } else {
          setError(response.data.error || t('failedToFetchPersons'));
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error details:', err);
        if (err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
        }
        setError(t('failedToFetchPersonsTryAgain'));
        setIsLoading(false);
      }
    };

    if (patientId) {
      fetchKnownPersons();
    }
  }, [patientId, selectedPersonId, t]);

  const fetchDateSummary = async () => {
    if (!selectedPersonId) {
      setError(t('pleaseSelectPerson'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSummaryData(null);

      const response = await axios.get('http://localhost:5000/api/summarize-conversation', {
        params: {
          patient_id: patientId,
          known_person_id: selectedPersonId,
          date: selectedDate
        }
      });

      setSummaryData(response.data);
      setIsLoading(false);
    } catch (err) {
      setError(t('failedToFetchSummary'));
      setIsLoading(false);
      console.error('Error fetching summary:', err);
    }
  };

  const fetchAllSummaries = async () => {
    if (!selectedPersonId) {
      setError(t('pleaseSelectPerson'));
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSummaryData(null);

      const response = await axios.get('http://localhost:5000/api/summarize-all-conversations', {
        params: {
          patient_id: patientId,
          known_person_id: selectedPersonId
        }
      });

      setSummaryData(response.data);
      setIsLoading(false);
    } catch (err) {
      setError(t('failedToFetchAllSummaries'));
      setIsLoading(false);
      console.error('Error fetching all summaries:', err);
    }
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handlePersonChange = (e) => {
    setSelectedPersonId(e.target.value);
    setSummaryData(null);
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const getSelectedPersonName = () => {
    const person = knownPersons.find(p => p.known_person_id === selectedPersonId);
    return person ? person.name : t('unknownPerson');
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    
    if (!chatInput.trim()) return;
    
    const userMessage = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/chatbot/ask', {
        question: chatInput,
        patient_id: patientId
      });
      
      if (response.data.success) {
        const botMessage = {
          role: 'assistant',
          content: response.data.answer,
          metadata: {
            conversation_count: response.data.conversation_count,
            people_involved: response.data.people_involved
          }
        };
        setChatMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your question. Please try again.'
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error('Error asking chatbot:', err);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I could not connect to the chatbot service. Please try again later.'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderSummaryContent = (summary) => {
    if (!summary) return null;

    const sections = {};
    let currentSection = null;
    let currentContent = [];

    summary.split('\n').forEach(line => {
      const sectionMatch = line.match(/\*\*(.*?):\*\*/);

      if (sectionMatch) {
        if (currentSection) {
          sections[currentSection] = currentContent.join('\n');
          currentContent = [];
        }

        currentSection = sectionMatch[1];
        const remainingContent = line.replace(sectionMatch[0], '').trim();
        if (remainingContent) {
          currentContent.push(remainingContent);
        }
      } else if (line.trim()) {
        currentContent.push(line);
      }
    });

    if (currentSection) {
      sections[currentSection] = currentContent.join('\n');
    }

    if (Object.keys(sections).length === 0 && summary.trim()) {
      sections[t('summary')] = summary;
    }

    return (
      <div className="space-y-4">
        {Object.entries(sections).map(([title, content], index) => (
          <motion.div
            key={index}
            className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-md rounded-xl p-5 shadow-lg border border-purple-500/20 relative overflow-hidden group hover:border-purple-400/40 transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -2 }}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/0 via-purple-400/50 to-purple-500/0"></div>
            <h4 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2">{title}</h4>
            <div className="text-gray-200 text-sm leading-relaxed">
              {content.split('\n').map((paragraph, idx) => {
                if (paragraph.trim().startsWith('*')) {
                  return (
                    <ul key={idx} className="list-disc list-inside ml-4 space-y-1">
                      {paragraph.split('*').filter(item => item.trim()).map((item, bulletIdx) => (
                        <li key={bulletIdx}>{item.trim()}</li>
                      ))}
                    </ul>
                  );
                } else {
                  return <p key={idx} className="mb-2 last:mb-0">{paragraph}</p>;
                }
              })}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
        delayChildren: 0.2,
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const navbarVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      }
    }
  };

  const navItemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const brainGlowVariants = {
    initial: { textShadow: "0 0px 0px rgba(255,255,255,0.7)" },
    animate: {
      textShadow: ["0 0 0px rgba(255,255,255,0.7)", "0 0 20px rgba(255,255,255,0.9)", "0 0 0px rgba(255,255,255,0.7)"],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut"
      }
    }
  };

  const floatVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 text-white p-4 sm:p-8 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10">
      {/* Navigation Bar - NavBack Style */}
      <motion.nav
        className="bg-gradient-to-r from-purple-600/90 via-purple-700/90 to-indigo-700/90 backdrop-blur-xl shadow-2xl rounded-2xl mb-8 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 sticky top-0 z-50 border border-white/10"
        variants={navbarVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex justify-between items-center">
          {/* Left section: Back/Home button */}
          <motion.div className="flex items-center space-x-2 sm:space-x-3" variants={navItemVariants}>
            <motion.button
              onClick={handleDashboardClick}
              className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-3 rounded-xl text-white font-semibold transition-all duration-300 border-2 border-white/30 shadow-lg text-base sm:text-lg"
              whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              aria-label="Back to Dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span className="hidden sm:inline">{t('dashboard')}</span>
            </motion.button>
          </motion.div>

          {/* Center section: App Brand */}
          <motion.div className="flex items-center space-x-3" variants={navItemVariants}>
            <motion.span
              className="text-5xl sm:text-6xl"
              variants={brainGlowVariants}
              initial="initial"
              animate="animate"
            >
              🧠
            </motion.span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-wide drop-shadow-lg">
              EchoMind
            </h1>
          </motion.div>

          {/* Right section: Logout */}
          <motion.div className="flex items-center space-x-3 sm:space-x-4" variants={navItemVariants}>
            <motion.button
              className="flex items-center space-x-2 px-4 sm:px-5 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg transition-all duration-300 text-base sm:text-lg border-2 border-red-400"
              onClick={handleLogoutClick}
              whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(220, 38, 38, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              aria-label="Logout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 sm:w-6 sm:h-6">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span className="hidden sm:inline">{t('logout')}</span>
            </motion.button>
          </motion.div>
        </div>
      </motion.nav>

      {/* Error Message */}
      {error && (
        <motion.div
          className="bg-red-500 bg-opacity-70 text-white p-4 rounded-lg flex items-center gap-3 mb-6 shadow-md border border-black"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p className="font-medium">{error}</p>
        </motion.div>
      )}

      {/* Floating Chatbot Button */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              boxShadow: [
                "0 0 20px rgba(147, 51, 234, 0.5)",
                "0 0 40px rgba(147, 51, 234, 0.8)",
                "0 0 20px rgba(147, 51, 234, 0.5)"
              ]
            }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.15, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatOpen(true)}
            transition={{
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center border-2 border-white/30 backdrop-blur-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              <path d="M9 10h.01"></path>
              <path d="M15 10h.01"></path>
            </svg>
            {chatMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold border-2 border-white">
                {chatMessages.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chatbot Popup */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-gray-900 bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl border border-purple-500 flex flex-col overflow-hidden"
          >
            {/* Chatbot Header */}
            <div className="bg-gradient-to-r from-purple-600/95 to-indigo-600/95 backdrop-blur-md p-4 flex items-center justify-between border-b border-purple-400/30">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 bg-gradient-to-br from-white/30 to-white/10 rounded-full flex items-center justify-center shadow-lg border-2 border-white/20"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <span className="text-2xl">🤖</span>
                </motion.div>
                <div>
                  <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    Chat Assistant
                    <motion.span
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-2 h-2 bg-green-400 rounded-full"
                    />
                  </h3>
                  <p className="text-purple-200 text-xs">✨ Ask about your conversations</p>
                </div>
              </div>
              <motion.button
                onClick={() => setIsChatOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </motion.button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.length === 0 ? (
                <motion.div 
                  className="text-center text-gray-400 py-8"
                  variants={floatVariants}
                  animate="animate"
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <span className="text-6xl mb-4 block">💬</span>
                  </motion.div>
                  <p className="text-sm font-medium">Start by asking a question!</p>
                  <p className="text-xs mt-2 px-4 text-gray-500">For example: "What did we talk about yesterday?"</p>
                </motion.div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-none'
                          : 'bg-gray-700 text-gray-100 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.metadata && (
                        <p className="text-xs opacity-70 mt-2">
                          Based on {msg.metadata.conversation_count} messages
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
              {isChatLoading && (
                <motion.div
                  className="flex justify-start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="bg-gray-700 text-gray-100 p-3 rounded-lg rounded-bl-none">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleChatSubmit} className="p-4 border-t border-gray-700 bg-gray-800 bg-opacity-50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your question..."
                  className="flex-1 p-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200 text-sm"
                  disabled={isChatLoading}
                />
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={isChatLoading || !chatInput.trim()}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Panel */}
      <motion.div
        className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 mb-8 shadow-2xl flex flex-col gap-6 max-w-3xl mx-auto border border-white/20 relative overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 10, delay: 0.3 }}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400"></div>
        <div className="flex flex-col sm:flex-row gap-6">
          <motion.div variants={itemVariants} className="flex-1">
            <label htmlFor="personSelect" className="block text-gray-200 text-sm font-semibold mb-2">
              {t('selectKnownPerson')}
            </label>
            <select
              id="personSelect"
              value={selectedPersonId}
              onChange={handlePersonChange}
              className="w-full p-3 rounded-xl bg-gray-800/50 backdrop-blur-md border border-white/10 text-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 shadow-lg hover:border-white/20"
              disabled={isLoading || knownPersons.length === 0}
            >
              <option value="" className="bg-gray-800 text-gray-300">{t('selectPerson')}</option>
              {knownPersons.map((person) => (
                <option key={person.known_person_id} value={person.known_person_id} className="bg-gray-800 text-white">
                  {person.name}
                </option>
              ))}
            </select>
          </motion.div>

          <motion.div variants={itemVariants} className="flex-1">
            <label htmlFor="dateSelect" className="block text-gray-200 text-sm font-semibold mb-2">
              {t('selectDateForSummary')}
            </label>
            <input
              type="date"
              id="dateSelect"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-full p-3 rounded-xl bg-gray-800/50 backdrop-blur-md border border-white/10 text-white focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200 shadow-lg hover:border-white/20"
              max={format(new Date(), 'yyyy-MM-dd')}
              disabled={isLoading}
            />
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchDateSummary}
            disabled={isLoading || !selectedPersonId}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed border border-blue-400/30 relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            {isLoading ? (
              <span className="relative animate-pulse">{t('loading')}</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 drop-shadow-lg">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <span className="relative z-10">{t('getSummaryForSelectedDate')}</span>
              </>)}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAllSummaries}
            disabled={isLoading || !selectedPersonId}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed border border-green-400/30 relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
            {isLoading ? (
              <span className="relative animate-pulse">{t('loading')}</span>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10 drop-shadow-lg">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span className="relative z-10">{t('getAllConversationsSummary')}</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Results Card */}
      {summaryData && (
        <motion.div
          className={`
            bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 shadow-2xl
            max-w-4xl mx-auto mt-8 border border-white/20 relative overflow-hidden
          `}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          key={summaryData.date || 'all'}
        >
          {/* Decorative corner accents */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-500/20 to-transparent rounded-tr-full"></div>
          <div className="border-b border-gray-600 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <h2 className="text-3xl font-extrabold text-white mb-2 sm:mb-0">
              {summaryData.date
                ? `Summary for ${formatDate(summaryData.date)}`
                : `All Conversation Insights with ${getSelectedPersonName()}`}
            </h2>
            <div className="flex items-center gap-4 text-gray-300 text-sm mt-2 sm:mt-0">
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <span>{t('messagesCount', { count: summaryData.conversation_count })}</span>
              </div>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                <span>{summaryData.conversation_length } Characters </span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Key Insights Section */}
            <motion.div
              className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-purple-500/30 relative overflow-hidden"
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                {t('keyInsights')}
              </h3>
              {summaryData.success ? (
                <div className="text-gray-100 text-lg leading-relaxed">
                  {renderSummaryContent(summaryData.summary)}
                </div>
              ) : (
                <p className="text-yellow-400 text-lg">
                  {summaryData.summary || t('noSummaryAvailable')}
                </p>
              )}
            </motion.div>

            {/* Original Messages Section */}
            {summaryData.original_messages && summaryData.original_messages.length > 0 && (
              <motion.div
                className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-blue-500/30 relative overflow-hidden"
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500"></div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  {t('originalMessages')}
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {summaryData.original_messages.map((message, index) => (
                    <motion.div
                      key={index}
                      className={`
                        flex flex-col p-3 rounded-lg shadow-md border border-gray-600
                        ${message.speaker === 'You' ? 'bg-blue-600 bg-opacity-50 ml-auto text-right items-end' : 'bg-gray-600 bg-opacity-50 mr-auto text-left items-start'}
                        max-w-[80%] backdrop-blur-sm
                      `}
                      initial={{ opacity: 0, x: message.speaker === 'You' ? 50 : -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-semibold text-sm">
                          {message.speaker === 'You' ? t('you') : getSelectedPersonName()}
                        </span>
                        <span className="text-xs opacity-80">
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm">{message.text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Conversation History Section (for "All Conversations" view) */}
            {summaryData.messages_by_date && Object.keys(summaryData.messages_by_date).length > 0 && (
              <motion.div
                className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-green-500/30 relative overflow-hidden"
                variants={itemVariants}
                whileHover={{ scale: 1.01 }}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"></div>
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-300">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {t('conversationHistory')}
                </h3>
                <div className="relative border-l-2 border-gray-600 pl-6 max-h-96 overflow-y-auto">
                  {summaryData.conversation_dates && summaryData.conversation_dates.map((date, idx) => (
                    <motion.div key={date} className="mb-8 relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: idx * 0.1 }}>
                      <div className="absolute -left-7 top-0 flex items-center justify-center w-6 h-6 bg-purple-500 rounded-full border-2 border-purple-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                      <h4 className="text-xl font-semibold text-white mb-2">{formatDate(date)}</h4>
                      <div className="space-y-3">
                        {summaryData.messages_by_date[date].map((message, index) => (
                          <motion.div
                            key={index}
                            className={`
                              flex flex-col p-3 rounded-lg shadow-md border border-gray-600
                              ${message.speaker === 'You' ? 'bg-blue-600 bg-opacity-50 ml-auto text-right items-end' : 'bg-gray-600 bg-opacity-50 mr-auto text-left items-start'}
                              max-w-[80%] backdrop-blur-sm
                            `}
                            initial={{ opacity: 0, x: message.speaker === 'You' ? 50 : -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: (idx * 0.1) + (index * 0.05) }}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="font-semibold text-sm">
                                {message.speaker === 'You' ? t('you') : getSelectedPersonName()}
                              </span>
                              <span className="text-xs opacity-80">
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{message.text}</p>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && !summaryData && (
        <motion.div
          className="flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl max-w-sm mx-auto mt-12 border border-black"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="animate-spin h-12 w-12 border-4 border-purple-400 border-t-transparent rounded-full mb-4"></div>
          <p className="text-white text-lg font-semibold">{t('analyzingConversations')}</p>
        </motion.div>
      )}

      {/* Empty State */}
      {!isLoading && !summaryData && selectedPersonId && (
        <motion.div
          className="flex flex-col items-center justify-center p-8 bg-white/10 backdrop-blur-md rounded-2xl shadow-xl max-w-sm mx-auto mt-12 text-gray-300 border border-black"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50 mb-4">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <p className="text-lg text-center">{t('selectOptionsToSeeSummaries')}</p>
          <p className="text-sm text-center mt-2">{t('noSummaryDataFound')}</p>
        </motion.div>
      )}
      </div>
    </div>
  );
}

export default Summary;