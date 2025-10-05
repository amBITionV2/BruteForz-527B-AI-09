import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion'; // Import motion and AnimatePresence
import GameNav from './GameNav'; // Assuming GameNav is a separate component

function VisualLocationMemory() {
  const [user, setUser] = useState(null);
  const [gameState, setGameState] = useState('idle'); // idle, memorize, recall, complete
  const [grid, setGrid] = useState([]);
  const [correctLocations, setCorrectLocations] = useState([]);
  const [playerSelections, setPlayerSelections] = useState([]);
  const [gridSize, setGridSize] = useState(4); // 4x4 grid to start
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(null);
  const [timeToMemorize, setTimeToMemorize] = useState(3); // Changed from 5 to 3 seconds
  const [saveError, setSaveError] = useState(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [remainingLives, setRemainingLives] = useState(3);

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

  const cellVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 15 } },
    hasObject: {
      backgroundColor: ["#475569", "#3b82f6"], // From gray-600 to blue-500
      boxShadow: "0 0 20px rgba(59, 130, 246, 0.7)",
      scale: [1, 1.1, 1], // Small pulse
      transition: { duration: 0.5, ease: "easeOut" }
    },
    selected: {
      backgroundColor: ["#e0e0e0", "#22c55e"], // From light gray (hover) or gray-600 to green-500
      color: "#fff",
      boxShadow: "0 0 15px rgba(34, 197, 94, 0.7)",
      scale: [1, 1.05], // Small pop
      transition: { duration: 0.2, ease: "easeOut" }
    },
    recallHover: { scale: 1.05, backgroundColor: "#4b5563" }, // dark gray
    recallTap: { scale: 0.95, backgroundColor: "#374151" } // even darker gray
  };

  const textVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2 } },
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

  // When game state changes to complete, save the score
  useEffect(() => {
    if (gameState === 'complete' && score > 0 && user?.user_id) {
      saveScore();
    }
  }, [gameState, score, user]);

  useEffect(() => {
    let interval;
    if (gameState === 'memorize' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => Math.max(0, prevTimer - 1));
      }, 1000);
    } else if (gameState === 'memorize' && timer === 0) {
      setGameState('recall');
    }
    return () => clearInterval(interval);
  }, [gameState, timer]);

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
        game_name: 'visual-location-memory',
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
    setLevel(1);
    setRemainingLives(3);
    setSaveError(null);
    setScoreSaved(false);
    setGridSize(4); // Start with 4x4 grid
    setTimeToMemorize(3); // Initial timer
    startNewRound();
  };

  const startNewRound = () => {
    const emptyGrid = Array(gridSize * gridSize).fill(false);

    let objectCount = Math.min(3 + Math.floor(level / 2), Math.floor(gridSize * gridSize * 0.4)); // Max 40% of grid
    if (objectCount === 0) { // Ensure at least one object
      objectCount = 1;
    }
    
    const objectLocations = [];
    while (objectLocations.length < objectCount) {
      const randomPosition = Math.floor(Math.random() * (gridSize * gridSize));
      if (!objectLocations.includes(randomPosition)) {
        objectLocations.push(randomPosition);
      }
    }

    const newGrid = [...emptyGrid];
    objectLocations.forEach(position => {
      newGrid[position] = true;
    });

    setGrid(newGrid);
    setCorrectLocations(objectLocations);
    setPlayerSelections([]);
    setTimer(Math.ceil(timeToMemorize)); // Ensure timer is an integer for display
    setGameState('memorize');
  };

  const handleCellClick = (index) => {
    if (gameState !== 'recall') return;

    // Toggle selection
    let newSelections;
    if (playerSelections.includes(index)) {
      newSelections = playerSelections.filter(pos => pos !== index);
    } else {
      newSelections = [...playerSelections, index];
    }

    setPlayerSelections(newSelections);
  };

  const submitAnswers = () => {
    if (gameState !== 'recall') return;

    let correct = true;
    let matches = 0;

    // Check if player selected all correct locations
    if (playerSelections.length !== correctLocations.length) {
      correct = false;
    } else {
      // Check each selection
      for (const selection of playerSelections) {
        if (correctLocations.includes(selection)) {
          matches++;
        } else {
          correct = false;
          break;
        }
      }
    }

    const pointsPerCorrect = 10;
    const earnedPoints = matches * pointsPerCorrect;

    if (correct) {
      setScore(prevScore => prevScore + earnedPoints);
      setLevel(prevLevel => prevLevel + 1);

      // Increase grid size every 3 levels, max 6x6
      if (level % 3 === 0 && gridSize < 6) {
        setGridSize(prevSize => prevSize + 1);
      }

      // Decrease memorization time as levels progress, but not below 1.5 seconds
      if (level % 2 === 0) {
        setTimeToMemorize(prevTime => Math.max(1.5, prevTime - 0.5));
      }

      startNewRound();
    } else {
      setScore(prevScore => prevScore + earnedPoints); // Add partial points for partial matches

      const newLives = remainingLives - 1;
      setRemainingLives(newLives);

      if (newLives <= 0) {
        setGameState('complete');
      } else {
        startNewRound();
      }
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-orange-900 via-pink-900 to-purple-900 text-gray-100 py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
      <GameNav user={user} />

      <div className="flex justify-between items-center max-w-4xl mx-auto mb-8 px-4">
        <Link to="/games" className="flex items-center space-x-2 text-orange-300 hover:text-orange-400 transition-colors duration-300 text-sm md:text-base font-semibold">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>⬅️ Back to Games</span>
        </Link>
        <div className="flex items-center gap-4 text-base font-extrabold">
          <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
            Score: <span className="text-white">{score}</span>
          </span>
          <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            Level: <span className="text-white">{level}</span>
          </span>
          <span className="text-pink-300">
            Lives: <span className="text-white">{'💚'.repeat(remainingLives)}</span>
          </span>
        </div>
      </div>

      <motion.div
        className="max-w-md mx-auto text-center bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20 relative overflow-hidden"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {/* Decorative gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500"></div>
        
        <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 mb-6 drop-shadow-lg">
          🎯 Visual Location Memory
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
              <p className="text-orange-200 text-lg font-medium">Remember the locations of the stars shown on the grid.</p>
              <p className="text-orange-200 text-lg font-medium">After they disappear, click on the cells where you saw them.</p>
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-transparent relative overflow-hidden group"
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
              <h3 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400">
                🏁 Game Over!
              </h3>
              <p className="text-xl text-orange-200 font-bold">Your final score: <span className="text-white text-2xl">{score}</span></p>
              <p className="text-xl text-pink-200 font-bold">You reached level: <span className="text-white text-2xl">{level}</span></p>
              {scoreSaved && <p className="text-green-300 font-bold text-lg">✅ Score saved successfully!</p>}
              {saveError && <p className="text-red-300 font-bold text-lg">❌ Error: {saveError}</p>}
              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-transparent relative overflow-hidden group"
                onClick={startGame}
                {...buttonHoverTap}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <span className="relative z-10">🔄 Play Again</span>
              </motion.button>
            </motion.div>
          )}

          {gameState === 'memorize' && (
            <motion.div
              key="memorize"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={timer} // Key changes to animate timer text
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-2xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400"
                >
                  ⏱️ Memorize the star positions: <span className="text-white">{timer}</span> seconds
                </motion.div>
              </AnimatePresence>

              <motion.div
                className="grid gap-2 mx-auto w-full max-w-xs md:max-w-sm aspect-square p-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl shadow-inner border border-white/20"
                style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.05, delayChildren: 0.2 }
                  }
                }}
              >
                {grid.map((hasObject, index) => (
                  <motion.div
                    key={index}
                    className={`aspect-square bg-gradient-to-br from-orange-700 to-pink-700 rounded-lg flex items-center justify-center text-3xl font-bold shadow-lg border-2 border-orange-500/30`}
                    variants={cellVariants}
                    initial="hidden"
                    animate={hasObject ? "hasObject" : "visible"} // Animate directly to hasObject if true
                  >
                    {hasObject && '⭐'}
                  </motion.div>
                ))}
              </motion.div>

              <AnimatePresence>
                <motion.div
                  key="instruction-mem"
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-xl font-extrabold my-6 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400"
                >
                  🌟 Remember where the stars are located!
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {gameState === 'recall' && (
            <motion.div
              key="recall"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full"
            >
              <AnimatePresence>
                <motion.div
                  key="instruction-rec"
                  variants={textVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-xl font-extrabold my-6 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400"
                >
                  <strong>👆 Click on the cells where you saw the stars!</strong>
                </motion.div>
              </AnimatePresence>

              <motion.div
                className="grid gap-2 mx-auto w-full max-w-xs md:max-w-sm aspect-square p-4 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl shadow-inner border border-white/20"
                style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.05, delayChildren: 0.2 }
                  }
                }}
              >
                {grid.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`aspect-square bg-gradient-to-br from-orange-700 to-pink-700 rounded-lg flex items-center justify-center text-2xl font-bold shadow-lg border-2 cursor-pointer transition-all duration-200
                      ${playerSelections.includes(index) ? 'border-green-400 from-green-600 to-emerald-600' : 'border-orange-500/30 hover:border-orange-400'}
                    `}
                    onClick={() => handleCellClick(index)}
                    variants={cellVariants}
                    initial="hidden" // Each cell fades in when grid appears
                    animate={playerSelections.includes(index) ? "selected" : "visible"} // Animate to 'selected' or 'visible' base state
                    whileHover="recallHover"
                    whileTap="recallTap"
                  >
                    {playerSelections.includes(index) && '✅'}
                  </motion.div>
                ))}
              </motion.div>

              <AnimatePresence mode="wait">
                {playerSelections.length > 0 && ( // Only show selection info if something is selected
                  <motion.div
                    key="selection-info"
                    variants={textVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="mt-6 text-lg font-bold text-orange-200"
                  >
                    📍 You've selected {playerSelections.length} cells.
                    {correctLocations.length > 0 && ` (Need to select ${correctLocations.length} in total)`}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-xl shadow-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent mt-6 relative overflow-hidden group"
                onClick={submitAnswers}
                {...buttonHoverTap}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                <span className="relative z-10">✓ Submit Answers</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      </div>
    </motion.div>
  );
}

export default VisualLocationMemory;