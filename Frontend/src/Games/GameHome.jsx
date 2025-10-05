import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import GameNav from './GameNav';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import React from 'react';
import { useTranslation } from 'react-i18next'; // Import translation hook

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function GameHome() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gameData, setGameData] = useState([]);
  const [chartType, setChartType] = useState('line'); // Toggle between line and bar charts
  const { t } = useTranslation(); // Initialize translation hook

  // Load user data from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    console.log('User data from localStorage:', userData); // Keep this essential log

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        console.log('Parsed user data:', {
          id: parsedUser.user_id,
          name: parsedUser.name
        });

        if (!parsedUser.user_id) {
          console.error('No valid user_id found in user data');
          return;
        }

        setUser({
          ...parsedUser,
          _id: parsedUser.user_id
        });
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    } else {
      console.log('No user data found in localStorage');
    }
    setLoading(false);
  }, []);

  // Fetch game data
  useEffect(() => {
    const fetchGameData = async () => {
      if (user && user._id) {
        try {
          console.log('Fetching data for user ID:', user._id);

          const response = await fetch(`http://localhost:5000/api/games/${user._id}`, {
          //const response = await fetch(`https://echomind-6.onrender.com/api/games/${user._id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }

          // Just log the raw data from backend
          const result = await response.json();
          console.log('======= BACKEND DATA ========');
          console.log('Games from backend:', result.games);
          console.log('======= END BACKEND DATA ========');

          // Process the data without logging
          const validGames = result.games.filter(game =>
            game &&
            typeof game.score === 'number' &&
            game.game_name &&
            game.timestamp
          );

          if (validGames.length === 0) {
            setGameData([]);
            return;
          }

          const sortedGames = validGames.sort((a, b) =>
            new Date(a.timestamp) - new Date(b.timestamp)
          );

          setGameData(sortedGames);
        } catch (err) {
          console.error('Failed to fetch game data:', err);
          setGameData([]);
        }
      }
    };

    fetchGameData();
  }, [user]);

  // Generate sample data if no real data is available (for demonstration)
  const getSampleData = () => {
    const today = new Date();
    const sampleData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      // Generate sample scores for each game
      sampleData.push(
        {
          game_name: 'simon-says',
          score: Math.floor(Math.random() * 50) + 10,
          timestamp: date.toISOString()
        },
        {
          game_name: 'word-scramble',
          score: Math.floor(Math.random() * 80) + 20,
          timestamp: date.toISOString()
        },
        {
          game_name: 'visual-location-memory',
          score: Math.floor(Math.random() * 60) + 15,
          timestamp: date.toISOString()
        },
        {
          game_name: 'picture-match',
          score: Math.floor(Math.random() * 70) + 25,
          timestamp: date.toISOString()
        }
      );
    }

    return sampleData;
  };

  // Use real data if available, otherwise use sample data
  const displayData = gameData.length > 0 ? gameData : getSampleData();

  // Calculate average scores for each game
  const getAverageScores = () => {
    const gameTypes = ['simon-says', 'word-scramble', 'visual-location-memory', 'picture-match'];
    const averages = {};

    gameTypes.forEach(gameType => {
      const scores = displayData
        .filter(game => game.game_name === gameType)
        .map(game => game.score);

      if (scores.length > 0) {
        averages[gameType] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      } else {
        averages[gameType] = 0;
      }
    });

    return averages;
  };

  // Prepare data for line chart (performance over time)
  const getLineChartData = () => {
    const dates = [...new Set(displayData.map(game =>
      new Date(game.timestamp).toLocaleDateString()
    ))].sort((a, b) => new Date(a) - new Date(b));

    const chartData = {
      labels: dates,
      datasets: [
        {
          label: 'Simon Says',
          data: dates.map(date => {
            const dayGames = displayData.filter(game =>
              game.game_name === 'simon-says' &&
              new Date(game.timestamp).toLocaleDateString() === date
            );
            return dayGames.length > 0 ?
              Math.round(dayGames.reduce((sum, game) => sum + game.score, 0) / dayGames.length) :
              null;
          }),
          borderColor: 'rgb(255, 99, 132)', // Tailwind equivalent: red-500 (approx)
          backgroundColor: 'rgba(255, 99, 132, 0.2)', // Tailwind equivalent: red-500/20 (approx)
          tension: 0.4,
          spanGaps: true
        },
        {
          label: 'Word Scramble',
          data: dates.map(date => {
            const dayGames = displayData.filter(game =>
              game.game_name === 'word-scramble' &&
              new Date(game.timestamp).toLocaleDateString() === date
            );
            return dayGames.length > 0 ?
              Math.round(dayGames.reduce((sum, game) => sum + game.score, 0) / dayGames.length) :
              null;
          }),
          borderColor: 'rgb(75, 192, 192)', // Tailwind equivalent: teal-500 (approx)
          backgroundColor: 'rgba(75, 192, 192, 0.2)', // Tailwind equivalent: teal-500/20 (approx)
          tension: 0.4,
          spanGaps: true
        },
        {
          label: 'Visual Location Memory',
          data: dates.map(date => {
            const dayGames = displayData.filter(game =>
              game.game_name === 'visual-location-memory' &&
              new Date(game.timestamp).toLocaleDateString() === date
            );
            return dayGames.length > 0 ?
              Math.round(dayGames.reduce((sum, game) => sum + game.score, 0) / dayGames.length) :
              null;
          }),
          borderColor: 'rgb(53, 162, 235)', // Tailwind equivalent: blue-500 (approx)
          backgroundColor: 'rgba(53, 162, 235, 0.2)', // Tailwind equivalent: blue-500/20 (approx)
          tension: 0.4,
          spanGaps: true
        },
        {
          label: 'Picture Match',
          data: dates.map(date => {
            const dayGames = displayData.filter(game =>
              game.game_name === 'picture-match' &&
              new Date(game.timestamp).toLocaleDateString() === date
            );
            return dayGames.length > 0 ?
              Math.round(dayGames.reduce((sum, game) => sum + game.score, 0) / dayGames.length) :
              null;
          }),
          borderColor: 'rgb(255, 159, 64)', // Tailwind equivalent: orange-400 (approx)
          backgroundColor: 'rgba(255, 159, 64, 0.2)', // Tailwind equivalent: orange-400/20 (approx)
          tension: 0.4,
          spanGaps: true
        }
      ]
    };

    return chartData;
  };

  // Prepare data for bar chart (average performance comparison)
  const getBarChartData = () => {
    const averages = getAverageScores();

    return {
      labels: ['Simon Says', 'Word Scramble', 'Visual Location Memory', 'Picture Match'],
      datasets: [
        {
          label: 'Average Score',
          data: [
            averages['simon-says'],
            averages['word-scramble'],
            averages['visual-location-memory'],
            averages['picture-match']
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)', // Tailwind equivalent: bg-red-500/80 (approx)
            'rgba(75, 192, 192, 0.8)', // Tailwind equivalent: bg-teal-500/80 (approx)
            'rgba(53, 162, 235, 0.8)', // Tailwind equivalent: bg-blue-500/80 (approx)
            'rgba(255, 159, 64, 0.8)' // Tailwind equivalent: bg-orange-400/80 (approx)
          ],
          borderColor: [
            'rgb(255, 99, 132)', // Tailwind equivalent: border-red-500 (approx)
            'rgb(75, 192, 192)', // Tailwind equivalent: border-teal-500 (approx)
            'rgb(53, 162, 235)', // Tailwind equivalent: border-blue-500 (approx)
            'rgb(255, 159, 64)' // Tailwind equivalent: border-orange-400 (approx)
          ],
          borderWidth: 2
        }
      ]
    };
  };

  // Chart options
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
            color: '#333333', // Dark gray for legend text for readability on white background
        }
      },
      title: {
        display: true,
        font: {
          size: 16,
          weight: 'bold',
          color: '#333333' // Dark gray for title text
        },
        color: '#333333' // Fallback for older Chart.js versions or specific setups
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: t('score'),
          color: '#333333' // Dark gray for Y-axis title
        },
        ticks: {
            color: '#333333' // Dark gray for Y-axis ticks
        },
        grid: {
            color: 'rgba(0, 0, 0, 0.1)' // Light gray grid lines for contrast
        }
      },
      x: {
        title: {
          display: true,
          text: t('date'),
          color: '#333333' // Dark gray for X-axis title
        },
        ticks: {
            color: '#333333' // Dark gray for X-axis ticks
        },
        grid: {
            color: 'rgba(0, 0, 0, 0.1)' // Light gray grid lines for contrast
        }
      }
    },
  };

  const lineChartOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      title: {
        ...commonChartOptions.plugins.title,
        text: t('gamePerformanceOverTime'),
      }
    },
    scales: {
      ...commonChartOptions.scales,
      y: {
        ...commonChartOptions.scales.y,
        text: 'Score',
      },
      x: {
        ...commonChartOptions.scales.x,
        text: 'Date',
      }
    },
    interaction: {
      mode: 'index',
      intersect: false,
    }
  };

  const barChartOptions = {
    ...commonChartOptions,
    plugins: {
      ...commonChartOptions.plugins,
      legend: {
        display: false
      },
      title: {
        ...commonChartOptions.plugins.title,
        text: t('averagePerformanceComparison'),
      }
    },
    scales: {
      ...commonChartOptions.scales,
      y: {
        ...commonChartOptions.scales.y,
        text: 'Average Score',
      },
      x: {
        ...commonChartOptions.scales.x,
        title: {
          display: false, // No title for X-axis on bar chart, labels are self-explanatory
        }
      }
    }
  };


  // Get performance statistics
  const getPerformanceStats = () => {
    if (displayData.length === 0) return null;

    const totalGames = displayData.length;
    const averages = getAverageScores();
    const overallAverage = Math.round(
      Object.values(averages).reduce((a, b) => a + b, 0) / Object.values(averages).length
    );

    // Find best performing game based on average score
    let bestGameName = '';
    let maxAvgScore = -1;
    for (const gameName in averages) {
        if (averages[gameName] > maxAvgScore) {
            maxAvgScore = averages[gameName];
            bestGameName = gameName;
        }
    }

    // Find most played game
    const gamePlayCounts = displayData.reduce((acc, game) => {
        acc[game.game_name] = (acc[game.game_name] || 0) + 1;
        return acc;
    }, {});

    let mostPlayedGameName = '';
    let maxPlayCount = -1;
    for (const gameName in gamePlayCounts) {
        if (gamePlayCounts[gameName] > maxPlayCount) {
            maxPlayCount = gamePlayCounts[gameName];
            mostPlayedGameName = gameName;
        }
    }


    return {
      totalGames,
      overallAverage,
      bestGame: bestGameName,
      mostPlayedGame: mostPlayedGameName
    };
  };

  const stats = getPerformanceStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 sm:p-6 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <GameNav user={user} />
        <div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-center mb-8 sm:mb-10 drop-shadow-lg">
            🎮 {t('echoMindGames')}
          </h2>

          {/* Performance Dashboard */}
          <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl mb-10 sm:mb-12 p-6 sm:p-8 border border-white/20 relative overflow-hidden">
            {/* Decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            
            {/* Chart Controls */}
            <div className="flex flex-col sm:flex-row justify-center mb-6 sm:mb-8 space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                className={`w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-bold transition-all duration-300 relative overflow-hidden group
                  ${chartType === 'line' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl' : 'bg-white/10 text-purple-200 hover:bg-white/20 border border-white/20'}`}
                onClick={() => setChartType('line')}
              >
                {chartType === 'line' && <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>}
                <span className="relative z-10">📈 {t('performanceOverTime')}</span>
              </button>
              <button
                className={`w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-bold transition-all duration-300 relative overflow-hidden group
                  ${chartType === 'bar' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl' : 'bg-white/10 text-purple-200 hover:bg-white/20 border border-white/20'}`}
                onClick={() => setChartType('bar')}
              >
                {chartType === 'bar' && <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>}
                <span className="relative z-10">📊 {t('averageComparison')}</span>
              </button>
            </div>

            {/* Chart Container - Add height style to ensure visibility */}
            <div className="relative h-[300px] sm:h-[400px] w-full bg-white/95 backdrop-blur-sm rounded-2xl p-3 sm:p-4 shadow-xl border-2 border-white/30">
              {displayData && displayData.length > 0 ? (
                chartType === 'line' ? (
                  <Line
                    options={lineChartOptions}
                    data={getLineChartData()}
                  />
                ) : (
                  <Bar
                    options={barChartOptions}
                    data={getBarChartData()}
                  />
                )
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-purple-600 text-base sm:text-xl font-bold">
                  {loading ? '⏳ ' + t('loadingGameData') : '🎮 ' + t('playGamesToSeeChart')}
                </div>
              )}
            </div>

            {/* Performance Statistics */}
            {stats && (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl mt-8 sm:mt-10 border border-white/20">
                <h3 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 text-center mb-6 sm:mb-8">
                  📊 {t('performanceSummary')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 text-center">
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm p-4 sm:p-6 rounded-xl border-2 border-green-400/30 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <div className="text-4xl sm:text-6xl font-extrabold text-green-400 mb-2 sm:mb-3">{stats.totalGames}</div>
                    <div className="text-sm sm:text-lg text-green-200 font-semibold">{t('totalGamesPlayed')}</div>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm p-4 sm:p-6 rounded-xl border-2 border-yellow-400/30 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <div className="text-4xl sm:text-6xl font-extrabold text-yellow-400 mb-2 sm:mb-3">{stats.overallAverage}</div>
                    <div className="text-sm sm:text-lg text-yellow-200 font-semibold">{t('overallAverageScore')}</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm p-4 sm:p-6 rounded-xl border-2 border-blue-400/30 shadow-lg transform hover:scale-105 transition-transform duration-300">
                    <div className="text-xl sm:text-3xl font-bold text-blue-300 mb-2 sm:mb-3">
                      {t(stats.bestGame.replace(/-/g, ''))}
                    </div>
                    <div className="text-sm sm:text-lg text-blue-200 font-semibold">{t('bestPerformingGame')}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mt-10 sm:mt-12">
            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 border border-white/20 relative group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-green-500"></div>
              <div className="p-5 sm:p-7 text-center">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400 mb-3 sm:mb-4">
                  🟢 {t('simonSays')}
                </h3>
                <p className="text-purple-200 text-sm sm:text-base mb-5 sm:mb-6 font-medium">{t('simonSaysDesc')}</p>
                <Link to="/games/simon-says" className="inline-block bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold transition-all duration-300 text-sm sm:text-base shadow-xl relative overflow-hidden group">
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <span className="relative z-10">🎮 {t('play')}</span>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl hover:shadow-yellow-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 border border-white/20 relative group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 to-orange-500"></div>
              <div className="p-5 sm:p-7 text-center">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 mb-3 sm:mb-4">
                  🔤 {t('wordScramble')}
                </h3>
                <p className="text-purple-200 text-sm sm:text-base mb-5 sm:mb-6 font-medium">{t('wordScrambleDesc')}</p>
                <Link to="/games/word-scramble" className="inline-block bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold transition-all duration-300 text-sm sm:text-base shadow-xl relative overflow-hidden group">
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <span className="relative z-10">🎮 {t('play')}</span>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 border border-white/20 relative group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
              <div className="p-5 sm:p-7 text-center">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 mb-3 sm:mb-4">
                  🧠 {t('visualLocationMemory')}
                </h3>
                <p className="text-purple-200 text-sm sm:text-base mb-5 sm:mb-6 font-medium">{t('visualLocationMemoryDesc')}</p>
                <Link to="/games/visual-location" className="inline-block bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold transition-all duration-300 text-sm sm:text-base shadow-xl relative overflow-hidden group">
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <span className="relative z-10">🎮 {t('play')}</span>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl hover:shadow-pink-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 border border-white/20 relative group">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 to-rose-500"></div>
              <div className="p-5 sm:p-7 text-center">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-rose-400 mb-3 sm:mb-4">
                  🖼️ {t('pictureMatch')}
                </h3>
                <p className="text-purple-200 text-sm sm:text-base mb-5 sm:mb-6 font-medium">{t('pictureMatchDesc')}</p>
                <Link to="/games/picture-match" className="inline-block bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-xl font-bold transition-all duration-300 text-sm sm:text-base shadow-xl relative overflow-hidden group">
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <span className="relative z-10">🎮 {t('play')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameHome;