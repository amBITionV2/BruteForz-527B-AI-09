import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence
import GameNav from './GameNav'; // Assuming GameNav is a separate component

// Words related to everyday objects and activities
const wordBank = [
  "apple", "table", "chair", "clock", "water",
  "house", "bread", "shirt", "phone", "smile",
  "beach", "plant", "brush", "sleep", "happy",
  "music", "paper", "light", "plate", "sunny"
];

function WordScramble() {
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState('idle'); // idle, playing, complete
  const [currentWord, setCurrentWord] = useState('');
  const [scrambledWord, setScrambledWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(60); // 60-second timer
  const [feedback, setFeedback] = useState('');
  const [usedWords, setUsedWords] = useState([]);
  const [saveError, setSaveError] = useState(null);
  const [scoreSaved, setScoreSaved] = useState(false);

  // Framer Motion Variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4, ease: "easeIn" } },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
  };

  const buttonHoverTap = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 }
  };

  const scrambledWordVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const feedbackVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };


  // Load user data from localStorage on component mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (gameState === 'playing' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (timer === 0 && gameState === 'playing') {
      endGame();
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

  useEffect(() => {
    if (gameState === 'complete' && score > 0 && user?.user_id) {
      saveScore();
    }
  }, [gameState, score, user]);

  const saveScore = async () => {
    setSaveError(null);
    setScoreSaved(false);

    if (!user?.user_id) {
      setSaveError("No user ID available");
      return;
    }

    try {
      const scoreData = {
        patient_id: user.user_id,
        game_name: 'word-scramble',
        score: score,
        user_name: user.name || 'Unknown User'
      };

      console.log("Saving score:", scoreData);

      const response = await axios.post('http://localhost:5000/api/games', scoreData);
      //const response = await axios.post('https://echomind-6.onrender.com/api/games', scoreData);

      console.log("Save score response:", response.data);

      if (response.data.success) {
        setScoreSaved(true);
      } else {
        setSaveError("Failed to save score: " + response.data.error);
      }
    } catch (error) {
      console.error('Error saving score:', error);
      const errorMessage = error.response?.data?.error || error.message;
      setSaveError("Error saving score: " + errorMessage);
    }
  };

  const startGame = () => {
    setScore(0);
    setTimer(60);
    setUsedWords([]);
    setFeedback('');
    setGameState('playing');
    setSaveError(null);
    setScoreSaved(false);
    generateNewWord();
  };

  const endGame = () => {
    setGameState('complete');
  };

  const generateNewWord = () => {
    const availableWords = wordBank.filter(word => !usedWords.includes(word));

    if (availableWords.length === 0) {
      endGame();
      return;
    }

    const randomIndex = Math.floor(Math.random() * availableWords.length);
    const word = availableWords[randomIndex];

    const scrambled = scrambleWord(word);

    setCurrentWord(word);
    setScrambledWord(scrambled);
    setUserInput('');
    setFeedback('');
  };

  const scrambleWord = (word) => {
    const wordArray = word.split('');
    let scrambled;

    do {
      scrambled = [...wordArray].sort(() => Math.random() - 0.5).join('');
    } while (scrambled === word);

    return scrambled;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanInput = userInput.trim().toLowerCase();

    if (cleanInput === currentWord) {
      setScore(prevScore => prevScore + 10);
      setFeedback('Correct! +10 points');
      setUsedWords(prev => [...prev, currentWord]);

      setTimeout(() => {
        generateNewWord();
      }, 1000);
    } else {
      setFeedback('Try again!');
    }
  };

  const skipWord = () => {
    setUsedWords(prev => [...prev, currentWord]);
    setScore(prevScore => Math.max(0, prevScore - 2)); // Penalty for skipping
    setFeedback('Word skipped. -2 points');

    setTimeout(() => {
      generateNewWord();
    }, 1000);
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-gray-100 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
      <GameNav user={user} />

      <div className="flex justify-between items-center max-w-4xl mx-auto mb-8 px-4">
        <Link to="/games" className="flex items-center space-x-2 text-yellow-300 hover:text-yellow-400 transition-colors duration-300 text-sm md:text-base font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>⬅️ Back to Games</span>
        </Link>
        <div className="text-xl font-extrabold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
          Score: <span className="text-white">{score}</span>
        </div>
      </div>

      <motion.div
        className="max-w-md mx-auto text-center bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* Decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
        
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 mb-6 drop-shadow-lg">
          🔤 Word Scramble
        </h2>

        <AnimatePresence mode="wait">
          {gameState === 'idle' && (
            <motion.div
              key="idle"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 mb-6"
            >
              <p className="text-purple-200 text-lg font-medium">Unscramble the letters to form a valid word.</p>
              <p className="text-purple-200 text-lg font-medium">You have 60 seconds to solve as many words as you can!</p>
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-transparent relative overflow-hidden group"
                onClick={startGame}
                {...buttonHoverTap}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <span className="relative z-10">🎮 Start Game</span>
              </motion.button>
            </motion.div>
          )}

          {gameState === 'complete' && (
            <motion.div
              key="complete"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 mb-6"
            >
              <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                ⏰ Time's Up!
              </h3>
              <p className="text-xl text-purple-200 font-bold">Your final score: <span className="text-white text-2xl">{score}</span></p>
              {scoreSaved && <p className="text-green-300 font-bold text-lg">✅ Score saved successfully!</p>}
              {saveError && <p className="text-red-300 font-bold text-lg">❌ Error: {saveError}</p>}
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-transparent relative overflow-hidden group"
                onClick={startGame}
                {...buttonHoverTap}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <span className="relative z-10">🔄 Play Again</span>
              </motion.button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div
              key="playing"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <div className="text-2xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                ⏱️ Time Remaining: <span className="text-white">{timer}</span> seconds
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={scrambledWord} // Key changes on new word, triggering animation
                  variants={scrambledWordVariants}
                  initial="hidden"
                  animate="visible"
                  className="text-5xl font-extrabold my-6 tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 uppercase drop-shadow-lg"
                >
                  {scrambledWord}
                </motion.div>
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 max-w-xs w-full mx-auto">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Enter your answer"
                  autoFocus
                  className="w-full p-4 text-xl border-2 border-yellow-400/50 rounded-xl outline-none text-center bg-white/10 backdrop-blur-sm text-white placeholder-purple-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 font-bold"
                />
                <div className="flex gap-4 w-full">
                  <motion.button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl py-3 px-6 text-lg cursor-pointer transition-all duration-300 shadow-xl relative overflow-hidden group"
                    {...buttonHoverTap}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                    <span className="relative z-10">✓ Submit</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold rounded-xl py-3 px-6 text-lg cursor-pointer transition-all duration-300 shadow-xl relative overflow-hidden group"
                    onClick={skipWord}
                    {...buttonHoverTap}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                    <span className="relative z-10">⏭️ Skip</span>
                  </motion.button>
                </div>
              </form>

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    key="feedback"
                    variants={feedbackVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className={`mt-4 text-xl font-extrabold ${feedback.includes('Correct') ? 'text-green-300' : feedback.includes('skipped') ? 'text-orange-300' : 'text-red-300'}`}
                  >
                    {feedback.includes('Correct') ? '✅ ' : feedback.includes('skipped') ? '⏭️ ' : '❌ '}{feedback}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </div>
    </motion.div>
  );
}

export default WordScramble;