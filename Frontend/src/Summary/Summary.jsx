import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion'; // Import motion from framer-motion
import { useTranslation } from 'react-i18next'; // Import translation hook

function Summary() {
  const { t } = useTranslation(); // Initialize translation hook
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
        //const response = await axios.get(`https://echomind-6.onrender.com/api/known-persons/${patientId}`);

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
     /* const response = await axios.get('https://echomind-6.onrender.com/api/summarize-conversation', {*/
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
      /*const response = await axios.get('https://echomind-6.onrender.com/api/summarize-all-conversations', {*/
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
    setSummaryData(null); // Clear summary when person changes
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
        /* const response = await axios.post('https://echomind-6.onrender.com/api/chatbot/ask', { */
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
            className="bg-gray-700 bg-opacity-10 rounded-lg p-4 shadow-inner border border-black backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <h4 className="text-xl font-bold text-purple-300 mb-2">{title}</h4>
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

  // Framer Motion Variants for repeated animations
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
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 text-white p-4 sm:p-8">
      {/* Navigation Bar */}
      <motion.nav
        className="flex flex-col sm:flex-row justify-between items-center bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-8 shadow-lg border border-black"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
      >
        <h1 className="text-3xl font-extrabold text-white mb-4 sm:mb-0">{t('conversationInsights')}</h1>
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDashboardClick}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md transition duration-300 ease-in-out text-white font-semibold border border-black"
          >
            {t('dashboard')}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogoutClick}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg shadow-md transition duration-300 ease-in-out text-white font-semibold border border-black"
          >
            {t('logout')}
          </motion.button>
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

      {/* Chatbot Section */}
      <motion.div
        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 shadow-xl max-w-3xl mx-auto border border-black"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 10, delay: 0.2 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-300">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <path d="M9 10h.01"></path>
            <path d="M15 10h.01"></path>
          </svg>
          <h2 className="text-2xl font-bold text-white">Ask About Your Conversations</h2>
        </div>
        
        <p className="text-gray-300 text-sm mb-4">
          Ask me anything about your recorded conversations. I'll answer based only on what has been discussed.
        </p>

        {/* Chat Messages */}
        <div className="bg-gray-800 bg-opacity-40 rounded-xl p-4 mb-4 max-h-80 overflow-y-auto space-y-3 custom-scrollbar">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 opacity-50">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <p className="text-lg">Start by asking a question!</p>
              <p className="text-sm mt-2">For example: "What did we talk about yesterday?" or "Who did I speak with recently?"</p>
            </div>
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
                      Based on {msg.metadata.conversation_count} messages with {msg.metadata.people_involved?.join(', ')}
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
        </div>

        {/* Chat Input */}
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask a question about your conversations..."
            className="flex-1 p-3 rounded-lg bg-gray-700 bg-opacity-50 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200"
            disabled={isChatLoading}
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={isChatLoading || !chatInput.trim()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed border border-black flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Ask
          </motion.button>
        </form>
      </motion.div>

      {/* Control Panel */}
      <motion.div
        className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 shadow-xl flex flex-col gap-6 max-w-3xl mx-auto border border-black"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 80, damping: 10, delay: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row gap-6">
          <motion.div variants={itemVariants} className="flex-1">
            <label htmlFor="personSelect" className="block text-gray-200 text-sm font-semibold mb-2">
              {t('selectKnownPerson')}
            </label>
            <select
              id="personSelect"
              value={selectedPersonId}
              onChange={handlePersonChange}
              className="w-full p-3 rounded-lg bg-gray-700 bg-opacity-50 border border-black text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200 backdrop-blur-sm"
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
              className="w-full p-3 rounded-lg bg-gray-700 bg-opacity-50 border border-black text-white focus:ring-2 focus:ring-purple-400 focus:border-transparent transition duration-200 backdrop-blur-sm"
              max={format(new Date(), 'yyyy-MM-dd')}
              disabled={isLoading}
            />
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchDateSummary}
            disabled={isLoading || !selectedPersonId}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed border border-black"
          >
            {isLoading ? (
              <>
                <span className="animate-pulse">{t('loading')}</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                {t('getSummaryForSelectedDate')}
              </>)}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAllSummaries}
            disabled={isLoading || !selectedPersonId}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed border border-black"
          >
            {isLoading ? (
              <>
                <span className="animate-pulse">{t('loading')}</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                {t('getAllConversationsSummary')}
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Results Card */}
      {summaryData && (
        <motion.div
          className={`
            bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl
            max-w-4xl mx-auto mt-8 border border-black
          `}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          key={summaryData.date || 'all'}
        >
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
              className="bg-gray-800 bg-opacity-30 rounded-xl p-6 shadow-inner border border-black backdrop-blur-sm"
              variants={itemVariants}
            >
              <h3 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
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
                className="bg-gray-800 bg-opacity-30 rounded-xl p-6 shadow-inner border border-black backdrop-blur-sm"
                variants={itemVariants}
              >
                <h3 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-300">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  {t('originalMessages')}
                </h3>
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
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
                className="bg-gray-800 bg-opacity-30 rounded-xl p-6 shadow-inner border border-black backdrop-blur-sm"
                variants={itemVariants}
              >
                <h3 className="text-2xl font-bold text-green-400 mb-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-300">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  {t('conversationHistory')}
                </h3>
                <div className="relative border-l-2 border-gray-600 pl-6 custom-scrollbar max-h-96 overflow-y-auto">
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
  );
}

export default Summary;