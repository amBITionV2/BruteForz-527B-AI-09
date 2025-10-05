import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import GameNav from './GameNav';
function SimonSays() {
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState('idle'); // idle, sequence, player, gameOver
  const [sequence, setSequence] = useState([]);
  const [playerSequence, setPlayerSequence] = useState([]);
  const [score, setScore] = useState(0);
  const [saveError, setSaveError] = useState(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [activeFlashColor, setActiveFlashColor] = useState(null); // State to control the currently flashing color

  const colors = ['red', 'blue', 'green', 'yellow'];
  // We can still keep colorRefs if needed for direct DOM access for other reasons,
  // but for the flash, activeFlashColor state is better.
  // const colorRefs = useRef({});

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

  const simonButtonInteractionProps = {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.92 }
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

  // When gameState changes to gameOver, save the score
  useEffect(() => {
    if (gameState === 'gameOver' && score > 0 && user?.user_id) {
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
        game_name: 'simon-says',
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
    setGameState('sequence');
    setScore(0);
    setSequence([getRandomColor()]);
    setPlayerSequence([]);
    setScoreSaved(false);
    setSaveError(null);
  };

  const getRandomColor = () => {
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const playSequence = async () => {
    setGameState('sequence');
    setPlayerSequence([]);

    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      flashColor(sequence[i]);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setGameState('player');
  };

  useEffect(() => {
    if (gameState === 'sequence' && sequence.length > 0) {
      playSequence();
    }
  }, [sequence, gameState]);

  // Modified flashColor to use state and Framer Motion's animate prop
  const flashColor = (color) => {
    setActiveFlashColor(color);
    setTimeout(() => {
      setActiveFlashColor(null);
    }, 300); // Duration of the flash
  };

  const handleColorClick = (color) => {
    if (gameState !== 'player') return;

    flashColor(color); // Flash clicked color

    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);

    const index = playerSequence.length;
    if (color !== sequence[index]) {
      setGameState('gameOver');
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      setScore(prevScore => prevScore + 1);

      setTimeout(() => {
        const newSequence = [...sequence, getRandomColor()];
        setSequence(newSequence);
        setGameState('sequence');
      }, 1000);
    }
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
      <GameNav user={user} />

      <div className="flex justify-between items-center max-w-4xl mx-auto mb-8 px-4">
        <Link to="/games" className="flex items-center space-x-2 text-blue-300 hover:text-blue-400 transition-colors duration-300 text-sm md:text-base font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>⬅️ Back to Games</span>
        </Link>
        <div className="text-xl font-extrabold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
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
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500"></div>
        
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-pink-400 to-purple-400 mb-6 drop-shadow-lg">
          🟢 Simon Says
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
              <p className="text-purple-200 text-lg font-medium">Watch the sequence of colors and repeat it by clicking the colors in the same order.</p>
              <p className="text-purple-200 text-lg font-medium">Get ready to test your memory!</p>
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent relative overflow-hidden group"
                onClick={startGame}
                {...buttonHoverTap}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <span className="relative z-10">🎮 Start Game</span>
              </motion.button>
            </motion.div>
          )}

          {gameState === 'gameOver' && (
            <motion.div
              key="gameOver"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4 mb-6"
            >
              <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                🎯 Game Over!
              </h3>
              <p className="text-xl text-purple-200 font-bold">Your score: <span className="text-white text-2xl">{score}</span></p>
              {scoreSaved && <p className="text-green-300 font-bold text-lg">✅ Score saved successfully!</p>}
              {saveError && <p className="text-red-300 font-bold text-lg">❌ Error: {saveError}</p>}
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent relative overflow-hidden group"
                onClick={startGame}
                {...buttonHoverTap}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <span className="relative z-10">🔄 Play Again</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`grid grid-cols-2 grid-rows-2 gap-6 w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto rounded-full p-6 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm border-4 border-white/20 shadow-2xl ${gameState === 'player' ? 'cursor-pointer' : ''}`}>
          {colors.map(color => (
            <motion.div
              key={color}
              className={`w-full h-full rounded-2xl transition-all duration-150 ease-in-out
                ${color === 'red' ? 'bg-red-600' : color === 'blue' ? 'bg-blue-600' : color === 'green' ? 'bg-green-500' : 'bg-yellow-400'}
              `}
              onClick={() => handleColorClick(color)}
              initial={{ opacity: 0.7, boxShadow: "none" }} // Base state for all buttons
              animate={{
                opacity: activeFlashColor === color ? 1 : 0.7,
                boxShadow: activeFlashColor === color ? "0 0 40px rgba(255, 255, 255, 0.9)" : "none",
              }}
              transition={{ duration: 0.15, ease: "easeOut" }} // Quick transition for the flash
              // Framer Motion specific props for user interaction (only when it's player's turn)
              whileHover={gameState === 'player' ? simonButtonInteractionProps.whileHover : {}}
              whileTap={gameState === 'player' ? simonButtonInteractionProps.whileTap : {}}
            ></motion.div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {gameState === 'sequence' && (
            <motion.div
              key="watch"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-6 text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"
            >
              👀 Watch the sequence...
            </motion.div>
          )}

          {gameState === 'player' && (
            <motion.div
              key="repeat"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="mt-6 text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400"
            >
              ✋ Your turn! Repeat the sequence.
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </div>
    </motion.div>
  );
}

export default SimonSays;