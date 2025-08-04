import React, { useState, useEffect, useRef } from 'react';
import { Smile, MoveVertical, RotateCcw, CheckCircle, AlertTriangle, Activity } from 'lucide-react';
import { useFaceDetection } from '../contexts/FaceDetectionContext';

const BackgroundLivenessDetection = ({ onLivenessUpdate, isEnabled = true }) => {
  const {
    isInitialized,
    faces,
    faceCount,
    detectSmile,
    detectHeadMovement,
    performLivenessTest,
    initializeFaceDetection,
  } = useFaceDetection();

  const [livenessState, setLivenessState] = useState({
    smileDetected: false,
    headMovementDetected: false,
    overallScore: 0,
    status: 'monitoring', // monitoring, testing, completed, failed, initializing
  });

  const [testHistory, setTestHistory] = useState([]);
  const [isMinimized, setIsMinimized] = useState(true);

  const livenessIntervalRef = useRef(null);
  const initializationAttempted = useRef(false);

  // Initialize when component mounts
  useEffect(() => {
    if (isEnabled && !initializationAttempted.current) {
      initializationAttempted.current = true;
      initializeLiveness();
    }
  }, [isEnabled]);

  // Start background liveness monitoring when initialized and faces detected
  useEffect(() => {
    if (isEnabled && isInitialized && faceCount > 0) {
      startBackgroundLiveness();
    } else {
      stopBackgroundLiveness();
    }

    return () => {
      stopBackgroundLiveness();
    };
  }, [isEnabled, isInitialized, faceCount]);

  const initializeLiveness = async () => {
    try {
      setLivenessState(prev => ({ ...prev, status: 'initializing' }));
      
      if (!isInitialized) {
        console.log('🔄 Initializing face detection for liveness...');
        await initializeFaceDetection();
      }
      
      setLivenessState(prev => ({ ...prev, status: 'monitoring' }));
      console.log('✅ Liveness detection initialized');
    } catch (error) {
      console.error('❌ Failed to initialize liveness detection:', error);
      setLivenessState(prev => ({ ...prev, status: 'failed' }));
    }
  };

  // Monitor faces for liveness indicators
  useEffect(() => {
    if (faces.length > 0 && isEnabled) {
      checkLivenessIndicators();
    }
  }, [faces, isEnabled]);

  const startBackgroundLiveness = () => {
    if (livenessIntervalRef.current) {
      clearInterval(livenessIntervalRef.current);
    }

    livenessIntervalRef.current = setInterval(async () => {
      try {
        if (faces.length > 0) {
          await runLivenessCheck();
        }
      } catch (error) {
        console.warn('Background liveness check failed:', error);
      }
    }, 1000); // Check every second
  };

  const stopBackgroundLiveness = () => {
    if (livenessIntervalRef.current) {
      clearInterval(livenessIntervalRef.current);
      livenessIntervalRef.current = null;
    }
  };

  const checkLivenessIndicators = async () => {
    if (faces.length === 0) return;

    try {
      const face = faces[0]; // Use first detected face
      
      // Use individual detection methods for real-time checking
      const smileResult = await detectSmile(face);
      const headResult = await detectHeadMovement(face);

      const newState = {
        smileDetected: smileResult.isSmiling,
        headMovementDetected: headResult.movementDetected,
        overallScore: (smileResult.confidence + (headResult.movementDetected ? 0.8 : 0)) / 2,
        status: livenessState.status,
      };

      // Update status based on detections
      if (newState.smileDetected && newState.headMovementDetected) {
        newState.status = 'completed';
      } else if (newState.smileDetected || newState.headMovementDetected) {
        newState.status = 'testing';
      } else {
        newState.status = 'monitoring';
      }

      setLivenessState(newState);

      // Notify parent component
      if (onLivenessUpdate) {
        onLivenessUpdate({
          ...newState,
          timestamp: new Date(),
          face: face,
        });
      }

    } catch (error) {
      console.warn('Liveness check error:', error);
      setLivenessState(prev => ({
        ...prev,
        status: 'failed'
      }));
    }
  };

  const runLivenessCheck = async () => {
    try {
      // Run both smile and head movement tests
      const smileResult = await performLivenessTest('smile', { 
        duration: 1000, 
        threshold: 0.6 
      });
      
      const headResult = await performLivenessTest('head_movement', { 
        direction: 'any', 
        duration: 1000 
      });
      
      // Combine results
      const overallScore = (smileResult.confidence + (headResult.success ? 0.8 : 0.2)) / 2;
      const success = smileResult.success || headResult.success;
      
      const result = {
        success,
        overallScore,
        smileResult,
        headResult,
        timestamp: new Date()
      };
      
      if (success) {
        const historyEntry = {
          timestamp: new Date(),
          score: result.overallScore,
          details: result,
        };

        setTestHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 results

        setLivenessState(prev => ({
          ...prev,
          overallScore: result.overallScore,
          status: result.overallScore > 0.7 ? 'completed' : 'testing',
          smileDetected: smileResult.success,
          headMovementDetected: headResult.success,
        }));
      }
    } catch (error) {
      console.warn('Comprehensive liveness test failed, using fallback:', error);
      // Fallback to individual detection methods
      await runFallbackLivenessCheck();
    }
  };

  const runFallbackLivenessCheck = async () => {
    try {
      if (faces.length === 0) return;

      const face = faces[0];
      
      // Use individual detection methods as fallback
      const smileResult = await detectSmile(face);
      const headResult = await detectHeadMovement(face);

      const newState = {
        smileDetected: smileResult.isSmiling,
        headMovementDetected: headResult.movementDetected,
        overallScore: (smileResult.confidence + (headResult.movementDetected ? 0.8 : 0)) / 2,
        status: livenessState.status,
      };

      // Update status based on detections
      if (newState.smileDetected && newState.headMovementDetected) {
        newState.status = 'completed';
      } else if (newState.smileDetected || newState.headMovementDetected) {
        newState.status = 'testing';
      } else {
        newState.status = 'monitoring';
      }

      setLivenessState(newState);

      // Notify parent component
      if (onLivenessUpdate) {
        onLivenessUpdate({
          ...newState,
          timestamp: new Date(),
          face: face,
        });
      }

    } catch (error) {
      console.warn('Fallback liveness check failed:', error);
      setLivenessState(prev => ({
        ...prev,
        status: 'failed'
      }));
    }
  };

  const getStatusIcon = () => {
    switch (livenessState.status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'testing': return <Activity className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'initializing': return <Activity className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = () => {
    switch (livenessState.status) {
      case 'completed': return 'bg-green-500';
      case 'testing': return 'bg-yellow-500';
      case 'initializing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isEnabled) return null;

  return (
    <div className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${
      isMinimized ? 'w-16 h-16' : 'w-80 h-72'
    }`}>
      {/* Liveness detection widget */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
            <span className="text-white text-sm font-medium">
              {isMinimized ? 'LD' : 'Liveness Detection'}
            </span>
          </div>
          <button
            onClick={toggleMinimize}
            className="text-white hover:text-gray-200 transition-colors"
          >
            {isMinimized ? '👁️' : '−'}
          </button>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4">
            {/* Status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="font-medium text-gray-700 capitalize">
                  {livenessState.status}
                </span>
              </div>
              <div className="text-lg font-bold text-purple-600">
                {(livenessState.overallScore * 100).toFixed(0)}%
              </div>
            </div>

            {/* Liveness indicators */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <Smile className={`w-4 h-4 ${
                    livenessState.smileDetected ? 'text-green-500' : 'text-gray-400'
                  }`} />
                  <span className="text-sm text-gray-700">Smile</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  livenessState.smileDetected ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              </div>

              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center space-x-2">
                  <MoveVertical className={`w-4 h-4 ${
                    livenessState.headMovementDetected ? 'text-green-500' : 'text-gray-400'
                  }`} />
                  <span className="text-sm text-gray-700">Head Movement</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  livenessState.headMovementDetected ? 'bg-green-500' : 'bg-gray-300'
                }`}></div>
              </div>
            </div>

            {/* Test history */}
            {testHistory.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-2">Recent Tests</div>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {testHistory.slice(0, 3).map((test, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">
                        {test.timestamp.toLocaleTimeString()}
                      </span>
                      <span className={`font-medium ${
                        test.score > 0.7 ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {(test.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No face warning */}
            {faceCount === 0 && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-700 text-xs">No face detected</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Minimized indicator */}
      {isMinimized && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
        </div>
      )}
    </div>
  );
};

export default BackgroundLivenessDetection;
