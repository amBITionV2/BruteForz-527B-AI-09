import { useEffect, useState, useRef } from 'react';
import { MapPin, Shield, AlertTriangle, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NavBack from "../NavBack";
import { useTranslation } from 'react-i18next'; // Add this import

// Enhanced SOS Button component with auto-trigger functionality
const SosButton = ({ autoTrigger = false, user, apiUrl = 'http://localhost:5000/api' }) => {
  const { t } = useTranslation(); // Add translation hook
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  const [battery, setBattery] = useState(null);
  const [location, setLocation] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Get battery level if available
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBattery(Math.round(battery.level * 100));
      });
    }
  }, []);

  // Auto-trigger SOS countdown when autoTrigger prop changes to true
  useEffect(() => {
    if (autoTrigger && countdown === null && !sending && status?.type !== 'success') {
      console.log('Auto-triggering SOS due to geofence breach');
      startSosCountdown();
    }
  }, [autoTrigger, countdown, sending, status]);

  // Clear status message after 8 seconds
  useEffect(() => {
    if (status) {
      const timer = setTimeout(() => {
        setStatus(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Handle countdown timer
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Send SOS when countdown reaches 0
      sendSos();
    }
  }, [countdown]);

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setLocation(locationData);
          resolve(locationData);
        },
        error => {
          console.error("Error getting location:", error);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  };

  const startSosCountdown = async () => {
    // Get location first
    await getLocation();

    // Start a 10-second countdown for auto-triggered SOS, 5 seconds for manual
    setCountdown(autoTrigger ? 10 : 5);
    setExpanded(true);
  };

  const cancelSos = () => {
    setCountdown(null);
    setExpanded(false);
    setStatus({ type: 'info', message: t('sosCanceled') });
  };

  const sendSos = async () => {
    setSending(true);

    try {
      // If location wasn't already fetched, try again
      const locationData = location || await getLocation();

      // Use real API call instead of mock
      const response = await fetch(`${apiUrl}/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.user_id,
          name: user?.name || t('anonymousUser'),
          location: locationData,
          battery: battery
        })
      });

      const data = await response.json();

      if (data.success) {
        setStatus({
          type: 'success',
          message: t('sosAlertSentSuccessfully'),
          details: data
        });
      } else {
        throw new Error(data.message || t('failedToSendSOS'));
      }
    } catch (error) {
      console.error('SOS error:', error);
      setStatus({
        type: 'error',
        message: `${t('sosAlertFailed')}: ${error.message}`,
      });
    } finally {
      setSending(false);
      setCountdown(null);
      setExpanded(false);
    }
  };

  return (
    <div className={`sos-container ${expanded ? 'expanded' : ''} max-w-md mx-auto`}>
      {autoTrigger && (
        <motion.div 
          className="mb-4 p-4 bg-gradient-to-r from-red-600/80 to-orange-600/80 backdrop-blur-md border-2 border-red-400 rounded-xl text-white text-center font-bold shadow-xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            boxShadow: [
              "0 0 20px rgba(239, 68, 68, 0.6)",
              "0 0 40px rgba(239, 68, 68, 0.9)",
              "0 0 20px rgba(239, 68, 68, 0.6)"
            ]
          }}
          transition={{
            boxShadow: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          <AlertTriangle size={24} className="inline mr-2 text-red-200" />
          <strong>🚨 {t('automaticSOSTriggered')}</strong>
        </motion.div>
      )}

      {countdown !== null ? (
        <motion.div 
          className="countdown-container text-center p-8 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl border-2 border-red-500 shadow-2xl text-white relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            boxShadow: [
              "0 0 30px rgba(239, 68, 68, 0.6)",
              "0 0 60px rgba(239, 68, 68, 0.9)",
              "0 0 30px rgba(239, 68, 68, 0.6)"
            ]
          }}
          transition={{
            scale: { duration: 0.3 },
            boxShadow: {
              duration: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          {/* Decorative gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
          <div className="countdown-timer mb-6">
            <motion.div 
              className="text-8xl font-extrabold text-red-400 mb-4"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1]
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity
              }}
            >
              {countdown}
            </motion.div>
            <div className="text-xl text-purple-100 mb-4 font-bold">
              {autoTrigger ? t('autoSendingSosAlert', {seconds: countdown}) : t('sendingSosIn', {seconds: countdown})}
            </div>
            <div className="text-base text-purple-200 mb-6 font-medium bg-black/20 p-3 rounded-xl">
              {location ? <span className="text-green-300">✅ {t('locationAcquired')}</span> : <span className="text-yellow-300">📍 {t('gettingLocation')}</span>}
              {battery && <span className="ml-4">🔋 {t('batteryPercent', {percent: battery})}</span>}
            </div>
          </div>
          <motion.button
            className="cancel-button bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform active:scale-95 shadow-xl"
            onClick={cancelSos}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ❌ {t('cancelSOS')}
          </motion.button>
        </motion.div>
      ) : (
        <>
          {!autoTrigger && (
            <motion.button
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-6 text-2xl font-extrabold rounded-full shadow-2xl transition-all duration-300 relative overflow-hidden group"
              onClick={startSosCountdown}
              disabled={sending}
              aria-label={t('sendEmergencyAlert')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={!sending ? {
                boxShadow: [
                  "0 0 20px rgba(220, 38, 38, 0.5)",
                  "0 0 40px rgba(220, 38, 38, 0.8)",
                  "0 0 20px rgba(220, 38, 38, 0.5)"
                ]
              } : {}}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              <span className="relative z-10">
                {sending ? <span>📡 {t('sending')}</span> : <span>🚨 {t('emergencySOS')}</span>}
              </span>
            </motion.button>
          )}

          {status && (
            <motion.div 
              className={`mt-6 p-5 rounded-2xl text-center font-bold shadow-xl ${
                status.type === 'success' ? 'bg-gradient-to-r from-green-600/80 to-emerald-600/80 backdrop-blur-md border-2 border-green-400 text-white' :
                status.type === 'error' ? 'bg-gradient-to-r from-red-600/80 to-orange-600/80 backdrop-blur-md border-2 border-red-400 text-white' :
                'bg-gradient-to-r from-blue-600/80 to-indigo-600/80 backdrop-blur-md border-2 border-blue-400 text-white'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-xl mb-2">
                {status.type === 'success' ? '✅' : status.type === 'error' ? '❌' : 'ℹ️'}
                {status.message}
              </div>
              {status.details && (
                <div className="text-sm opacity-90 text-white bg-black/20 p-3 rounded-xl mt-3">
                  <div>🕒 {t('time')}: {new Date(status.details.timestamp).toLocaleTimeString()}</div>
                  {status.details.location && (
                    <div className="mt-1">📍 {t('location')}: {status.details.location.latitude.toFixed(5)}, {status.details.location.longitude.toFixed(5)}</div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </>
      )}

      {expanded && countdown === null && !autoTrigger && (
        <motion.div 
          className="mt-6 p-5 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl text-center text-base text-white border border-white/20 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="grid grid-cols-2 gap-4 font-semibold">
            <div className="bg-black/20 p-3 rounded-xl">
              {location ? (
                <span className="text-green-300">✅ {t('locationAvailable')}</span>
              ) : (
                <span className="text-red-300">❌ {t('locationUnavailable')}</span>
              )}
            </div>
            {battery !== null && (
              <div className="bg-black/20 p-3 rounded-xl">
                🔋 {t('battery')}: {battery}%
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Simple Map Component
const GeofenceMap = ({ center, radius, currentLocation, isOutside }) => {
  const { t } = useTranslation(); // Add translation hook
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !center) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background (darker to fit the theme)
    ctx.fillStyle = '#1e0c3a'; // Dark purple background
    ctx.fillRect(0, 0, width, height);

    // Calculate scale (roughly 1 pixel per meter for visualization)
    const scale = Math.min(width, height) / (radius * 3);
    const centerX = width / 2;
    const centerY = height / 2;

    // Draw geofence circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * scale, 0, 2 * Math.PI);
    ctx.fillStyle = isOutside ? 'rgba(239, 68, 68, 0.15)' : 'rgba(129, 140, 248, 0.15)'; // Red for outside, light purple for inside
    ctx.fill();
    ctx.strokeStyle = isOutside ? '#ef4444' : '#818cf8'; // Red for outside, vibrant purple for inside
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw center point
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#a78bfa'; // Lighter purple for center
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw current location if available
    if (currentLocation && center) {
      const distance = getDistance(
        center.latitude, center.longitude,
        currentLocation.latitude, currentLocation.longitude
      );

      // Simple projection (not accurate for large distances, but fine for this demo)
      const deltaLat = (currentLocation.latitude - center.latitude) * 111320; // rough meters per degree
      const deltaLon = (currentLocation.longitude - center.longitude) * 111320 * Math.cos(center.latitude * Math.PI / 180);

      const currentX = centerX + (deltaLon * scale);
      const currentY = centerY - (deltaLat * scale); // Y is inverted in canvas

      // Draw current position
      ctx.beginPath();
      ctx.arc(currentX, currentY, 10, 0, 2 * Math.PI);
      ctx.fillStyle = isOutside ? '#ef4444' : '#818cf8'; // Red for outside, light purple for inside
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw distance line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(currentX, currentY);
      ctx.strokeStyle = isOutside ? '#ef4444' : '#c4b5fd'; // Red for outside, even lighter purple for inside
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Add labels
    ctx.fillStyle = '#e0c9ff'; // Light purple text for labels
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(t('geofenceCenter'), centerX, height - 20);

  }, [center, radius, currentLocation, isOutside, t]);

  // Haversine formula for distance in meters
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = x => x * Math.PI / 180;
    const R = 6371e3;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="border-2 border-purple-500 rounded-2xl p-5 bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-sm shadow-xl">
      <canvas
        ref={canvasRef}
        width="400"
        height="300"
        className="w-full h-auto border-2 border-purple-400 rounded-xl shadow-lg"
      />
      <div className="mt-4 text-sm text-white text-center font-semibold">
        <div className="flex justify-center items-center gap-6">
          <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg">
            <div className="w-4 h-4 bg-purple-400 rounded-full shadow-lg"></div>
            <span>{t('center')}</span>
          </div>
          <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-lg">
            <div className={`w-4 h-4 ${isOutside ? 'bg-red-500' : 'bg-green-500'} rounded-full shadow-lg`}></div>
            <span>{t('currentPosition')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Geofencing Component
const GeofenceGuardian = () => {
  const { t } = useTranslation(); // Add translation hook
  
  // Add new state variables
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [trackingStatus, setTrackingStatus] = useState('inactive');

  const [location, setLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [tempRadius, setTempRadius] = useState(100); // temporary radius for setting
  const [confirmedRadius, setConfirmedRadius] = useState(null); // confirmed radius
  const [isOutsideGeofence, setIsOutsideGeofence] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [isGeofenceActive, setIsGeofenceActive] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [sosTriggered, setSosTriggered] = useState(false);
  const [breachDetected, setBreachDetected] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [lastDistance, setLastDistance] = useState(0);

  // Mock user for demo - in real app this would come from props or context
  const mockUser = {
    user_id: 'demo_user_123',
    name: t('demoUser')
  };

  // Add tracking status display helper
  const getTrackingStatusDisplay = () => {
    switch (trackingStatus) {
      case 'getting_location':
        return { color: 'text-yellow-400', text: t('gettingLocation') };
      case 'location_set':
        return { color: 'text-blue-400', text: t('locationSet') };
      case 'geofence_activating':
        return { color: 'text-yellow-400', text: t('activating') };
      case 'tracking_active':
        return { color: 'text-green-400', text: t('trackingActive') };
      case 'tracking_error':
        return { color: 'text-red-400', text: t('trackingError') };
      case 'error':
        return { color: 'text-red-400', text: t('error') };
      default:
        return { color: 'text-gray-400', text: t('inactive') };
    }
  };

  const statusDisplay = getTrackingStatusDisplay();

  // Update handleGetLocation function
  const handleGetLocation = () => {
    setLocationError(null);
    setTrackingStatus('getting_location');

    if (!navigator.geolocation) {
      setLocationError(t('geolocationNotSupported'));
      setTrackingStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLocation({ latitude, longitude });
        setCurrentLocation({ latitude, longitude });
        setOrigin({ latitude, longitude });
        setLocationAccuracy(accuracy);
        setIsOutsideGeofence(false);
        setIsGeofenceActive(false);
        setSosTriggered(false);
        setBreachDetected(false);
        setLastDistance(0);

        // Clear any existing watch
        if (watchId) {
          navigator.geolocation.clearWatch(watchId);
          setWatchId(null);
        }

        setTrackingStatus('location_set');
      },
      (error) => {
        setTrackingStatus('error');
        setLocationError(`${t('locationError')}: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSetPerimeter = () => {
    if (!origin) {
      alert(t('pleaseSetLocationFirst'));
      return;
    }

    setConfirmedRadius(tempRadius);
    setIsGeofenceActive(true);
    setIsOutsideGeofence(false);
    setSosTriggered(false);
    setBreachDetected(false);
    setLastDistance(0);
    setTrackingStatus('geofence_activating');

    console.log(`Geofence activated with ${tempRadius}m radius at`, origin);
  };

  // Haversine formula for distance in meters
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = x => x * Math.PI / 180;
    const R = 6371e3;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Watch position changes with improved tracking
  useEffect(() => {
    if (!origin || !isGeofenceActive || confirmedRadius === null) {
      // Clear watch if conditions aren't met
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      return;
    }

    console.log('Starting location tracking...');
    setTrackingStatus('tracking_active');

    const newWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const newLocation = { latitude, longitude };
        setCurrentLocation(newLocation);

        const distance = getDistance(origin.latitude, origin.longitude, latitude, longitude);
        setLastDistance(distance);
        const isOutside = distance > confirmedRadius;

        console.log(`Distance from center: ${distance.toFixed(2)}m, Radius: ${confirmedRadius}m, Outside: ${isOutside}, Accuracy: ${accuracy}m`);

        setIsOutsideGeofence(isOutside);

        // Trigger SOS automatically when device leaves geofence (only once per breach)
        if (isOutside && !breachDetected) {
          console.log('GEOFENCE BREACH DETECTED! Triggering SOS...');
          setBreachDetected(true);
          setSosTriggered(true);
        } else if (!isOutside && breachDetected) {
          // Reset breach detection when back inside (with small buffer to prevent oscillation)
          if (distance < confirmedRadius * 0.9) {
            console.log('Back inside geofence, resetting breach detection');
            setBreachDetected(false);
            setSosTriggered(false);
          }
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
        setTrackingStatus('tracking_error');
        setLocationError(`${t('trackingError')}: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000 // Accept cached location up to 5 seconds old
      }
    );

    setWatchId(newWatchId);

    // Cleanup function
    return () => {
      if (newWatchId) {
        console.log('Clearing location watch');
        navigator.geolocation.clearWatch(newWatchId);
      }
    };
  }, [origin, confirmedRadius, isGeofenceActive, breachDetected, t]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-4 font-sans text-white relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10">
        <NavBack className="mb-6" />
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-3 flex items-center justify-center gap-4">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Shield className="text-transparent bg-clip-text" style={{fill: 'url(#shieldGradient)'}} size={50} />
            </motion.div>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 drop-shadow-lg">
              {t('geofenceGuardian')}
            </span>
          </h1>
          <p className="text-purple-200 text-xl font-medium">🛡️ {t('safetyPerimeterTagline')}</p>
          <svg width="0" height="0">
            <defs>
              <linearGradient id="shieldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor: '#60a5fa', stopOpacity: 1}} />
                <stop offset="50%" style={{stopColor: '#a78bfa', stopOpacity: 1}} />
                <stop offset="100%" style={{stopColor: '#f472b6', stopOpacity: 1}} />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Control Panel */}
          <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
            {/* Decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              <Settings className="text-purple-400" size={28} />
              {t('controlPanel')}
            </h2>

            {locationError && (
              <div className="bg-red-800/60 border border-red-700 text-white px-4 py-3 rounded-lg mb-4 text-sm font-semibold">
                {locationError}
              </div>
            )}

            <motion.button
              onClick={handleGetLocation}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 text-lg rounded-xl transition-all duration-300 shadow-xl mb-6 flex items-center justify-center gap-3 font-bold relative overflow-hidden group"
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative z-10"
              >
                <MapPin size={24} />
              </motion.div>
              <span className="relative z-10">{t('setCurrentLocation')}</span>
            </motion.button>

            {location && (
              <>
                <motion.div 
                  className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-xl p-5 mb-6 border border-blue-400/30 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="font-bold mb-3 text-blue-200 flex items-center gap-2">
                    <span className="text-xl">📍</span> {t('locationSet')}
                  </h3>
                  <p className="text-sm text-purple-100 font-mono bg-black/20 p-2 rounded">
                    {t('lat')}: {location.latitude.toFixed(6)}<br/>
                    {t('lng')}: {location.longitude.toFixed(6)}
                  </p>
                  {isGeofenceActive && currentLocation && (
                    <p className="text-sm text-green-300 mt-3 font-semibold flex items-center gap-2">
                      <span>📏</span> {t('distanceFromCenter', {distance: lastDistance.toFixed(1)})}
                    </p>
                  )}
                </motion.div>

                <div className="mb-6">
                  <label className="block text-center mb-4 font-bold text-white text-lg">
                    📏 Safety Perimeter: <span className="text-blue-300">{tempRadius}</span> meters
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2000"
                    step="0.1"
                    value={tempRadius}
                    onChange={e => setTempRadius(Number(e.target.value))}
                    className="w-full h-3 rounded-lg appearance-none cursor-pointer shadow-lg"
                    style={{
                      background: `linear-gradient(to right, #60a5fa 0%, #a78bfa ${((tempRadius-0.1)/(2000-0.1))*100}%, #312e81 ${((tempRadius-0.1)/(2000-0.1))*100}%, #312e81 100%)`
                    }}
                  />
                  <div className="flex justify-between text-sm text-purple-300 mt-2 font-semibold">
                    <span>0.1m</span>
                    <span>1000m</span>
                    <span>2000m</span>
                  </div>
                </div>

                <motion.button
                  onClick={handleSetPerimeter}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 text-lg rounded-xl transition-all duration-300 shadow-xl mb-4 font-bold relative overflow-hidden group"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Shield size={20} />
                    {t('activateGeofenceProtection')}
                  </span>
                </motion.button>

                {isGeofenceActive && (
                  <motion.div 
                    className="bg-gradient-to-r from-green-600/80 to-emerald-600/80 backdrop-blur-md border-2 border-green-400 text-white px-5 py-4 rounded-xl shadow-xl"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      boxShadow: [
                        "0 0 20px rgba(34, 197, 94, 0.5)",
                        "0 0 40px rgba(34, 197, 94, 0.8)",
                        "0 0 20px rgba(34, 197, 94, 0.5)"
                      ]
                    }}
                    transition={{
                      boxShadow: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Shield size={24} className="text-green-200" />
                      <span className="font-bold text-lg">
                        ✅ {t('geofenceActiveRadius', {radius: confirmedRadius})}
                      </span>
                    </div>
                    <div className="text-sm mt-1 text-green-100 font-medium">
                      📡 {t('realtimeTracking')}: {watchId ? <span className="text-green-300 font-bold">{t('on')}</span> : t('off')}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* Visual Map */}
          <div className="bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20 relative overflow-hidden">
            {/* Decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>
            <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-blue-400">
              🗺️ {t('visualMap')}
            </h2>

            {location ? (
              <GeofenceMap
                center={origin}
                radius={isGeofenceActive ? confirmedRadius : tempRadius}
                currentLocation={currentLocation}
                isOutside={isOutsideGeofence}
              />
            ) : (
              <div className="border-2 border-dashed border-purple-500 rounded-2xl p-12 text-center bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm">
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MapPin size={64} className="mx-auto mb-4 text-purple-400" />
                </motion.div>
                <p className="text-purple-200 text-lg font-medium">{t('setLocationToSeeMap')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Alert Section */}
        {isOutsideGeofence && (
          <motion.div 
            className="mt-8 bg-gradient-to-r from-red-600/80 to-orange-600/80 backdrop-blur-xl border-2 border-red-400 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              boxShadow: [
                "0 0 30px rgba(239, 68, 68, 0.6)",
                "0 0 60px rgba(239, 68, 68, 0.9)",
                "0 0 30px rgba(239, 68, 68, 0.6)"
              ]
            }}
            transition={{
              duration: 0.5,
              boxShadow: {
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }
            }}
          >
            {/* Decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500"></div>
            <div className="flex items-center justify-center gap-4 mb-6">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <AlertTriangle className="text-red-200" size={40} />
              </motion.div>
              <h3 className="text-3xl font-extrabold text-white drop-shadow-lg">
                ⚠️ {t('geofenceBreachDetected')}
              </h3>
            </div>
            <p className="text-red-50 mb-8 text-xl font-bold">
              🚨 {t('movedOutsideSafeArea', {distance: lastDistance.toFixed(1)})}
            </p>
            <SosButton
              autoTrigger={sosTriggered}
              user={mockUser}
             apiUrl="http://localhost:5000/api"
             // apiUrl="https://echomind-6.onrender.com/api"
            />
          </motion.div>
        )}

        {/* Status Bar */}
        <motion.div 
          className="mt-8 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-white/20 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Decorative gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"></div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm font-bold">
            <div className="flex items-center gap-2">
              <motion.div 
                className={`w-4 h-4 rounded-full ${location ? 'bg-green-400' : 'bg-gray-500'}`}
                animate={location ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-white">{t('location')} {location ? <span className="text-green-400">{t('set')}</span> : <span className="text-gray-400">{t('notSet')}</span>}</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div 
                className={`w-4 h-4 rounded-full ${isGeofenceActive ? 'bg-green-400' : 'bg-gray-500'}`}
                animate={isGeofenceActive ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-white">{t('geofence')} {isGeofenceActive ? <span className="text-green-400">{t('active')}</span> : <span className="text-gray-400">{t('inactive')}</span>}</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div 
                className={`w-4 h-4 rounded-full ${watchId ? 'bg-green-400' : 'bg-gray-500'}`}
                animate={watchId ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className={statusDisplay.color}>{statusDisplay.text}</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div 
                className={`w-4 h-4 rounded-full ${locationAccuracy && locationAccuracy < 20 ? 'bg-green-400' : 'bg-yellow-400'}`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-white">{t('accuracy')}: {locationAccuracy ? `±${locationAccuracy.toFixed(1)}m` : 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <motion.div 
                className={`w-4 h-4 rounded-full ${isOutsideGeofence ? 'bg-red-400' : 'bg-green-400'}`}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-white">{isOutsideGeofence ? <span className="text-red-400">{t('outside')}</span> : <span className="text-green-400">{t('inside')}</span>} {t('perimeter')}</span>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
};

export default GeofenceGuardian;