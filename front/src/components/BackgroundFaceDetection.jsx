import React, { useState, useEffect, useRef } from 'react';
import { Camera, Eye, Scan, Shield, AlertCircle, CheckCircle, Users, X } from 'lucide-react';
import { useFaceDetection } from '../contexts/FaceDetectionContext';

const BackgroundFaceDetection = ({ onDetectionUpdate }) => {
  const {
    isInitialized,
    isCameraActive,
    faces,
    faceCount,
    confidence,
    startCamera,
    startDetection,
    stopDetection,
    stopCamera,
    detectFaces,
    initializeFaceDetection,
    error: faceDetectionError,
    loading: faceDetectionLoading,
  } = useFaceDetection();

  const [isMinimized, setIsMinimized] = useState(false);
  const [detectionStatus, setDetectionStatus] = useState('idle'); // idle, initializing, starting, active, error
  const [showMultiFaceWarning, setShowMultiFaceWarning] = useState(false);
  const [backgroundStats, setBackgroundStats] = useState({
    totalDetections: 0,
    averageConfidence: 0,
    lastDetectionTime: null,
  });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const streamRef = useRef(null);
  const initializationAttempted = useRef(false);

  // Initialize background detection when component mounts
  useEffect(() => {
    if (!initializationAttempted.current) {
      initializationAttempted.current = true;
      initializeBackgroundDetection();
    }
    return () => {
      cleanup();
    };
  }, []);

  // Start detection when models are loaded
  useEffect(() => {
    if (isInitialized && detectionStatus === 'initializing') {
      startBackgroundCamera();
    }
  }, [isInitialized, detectionStatus]);

  // Update detection stats and check for multiple faces
  useEffect(() => {
    if (faceCount > 0) {
      setBackgroundStats(prev => ({
        totalDetections: prev.totalDetections + 1,
        averageConfidence: ((prev.averageConfidence * prev.totalDetections) + confidence) / (prev.totalDetections + 1),
        lastDetectionTime: new Date(),
      }));
      
      // Check for multiple faces and show warning
      if (faceCount > 1) {
        setShowMultiFaceWarning(true);
      } else {
        setShowMultiFaceWarning(false);
      }
      
      // Notify parent component
      if (onDetectionUpdate) {
        onDetectionUpdate({
          faceCount,
          confidence,
          faces,
          status: detectionStatus,
          multipleFaces: faceCount > 1,
        });
      }
    } else {
      // Hide warning when no faces detected
      setShowMultiFaceWarning(false);
    }
  }, [faceCount, confidence, faces, detectionStatus, onDetectionUpdate]);

  const initializeBackgroundDetection = async () => {
    try {
      setDetectionStatus('initializing');
      console.log('🔄 Initializing background face detection...');

      // First, ensure face detection is initialized
      if (!isInitialized) {
        console.log('🔄 Face detection not initialized, initializing models...');
        await initializeFaceDetection();
      }

      // Wait for initialization to complete
      if (!isInitialized) {
        console.log('⏳ Waiting for face detection initialization...');
        return; // useEffect will handle starting when isInitialized becomes true
      }

      await startBackgroundCamera();
    } catch (error) {
      console.error('❌ Failed to initialize background detection:', error);
      setDetectionStatus('error');
    }
  };

  const startBackgroundCamera = async () => {
    try {
      setDetectionStatus('starting');
      console.log('🔄 Starting background camera...');

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          const onLoadedMetadata = () => {
            videoRef.current.removeEventListener('loadedmetadata', onLoadedMetadata);
            resolve();
          };
          videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
        });
      }

      // Start face detection using context methods
      try {
        await startCamera();
        await startDetection();
      } catch (detectionError) {
        console.warn('Context detection failed, using fallback:', detectionError);
        // Start our own detection loop as fallback
        startBackgroundDetection();
      }

      setDetectionStatus('active');
      console.log('✅ Background face detection active');

    } catch (error) {
      console.error('❌ Failed to start background camera:', error);
      setDetectionStatus('error');
    }
  };

  const startBackgroundDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(async () => {
      try {
        if (videoRef.current && videoRef.current.videoWidth > 0) {
          await detectFaces(videoRef.current);
        }
      } catch (error) {
        console.warn('Background detection frame failed:', error);
      }
    }, 200); // Detect every 200ms for background process
  };

  const cleanup = async () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    try {
      await stopDetection();
      await stopCamera();
    } catch (error) {
      console.warn('Cleanup error:', error);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const dismissMultiFaceWarning = () => {
    setShowMultiFaceWarning(false);
  };

  const getStatusColor = () => {
    switch (detectionStatus) {
      case 'active': return 'bg-green-500';
      case 'starting': return 'bg-yellow-500';
      case 'initializing': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (detectionStatus) {
      case 'active': return `Monitoring (${faceCount} face${faceCount !== 1 ? 's' : ''})`;
      case 'starting': return 'Starting Camera...';
      case 'initializing': return 'Loading Models...';
      case 'error': return 'Detection Error';
      default: return 'Idle';
    }
  };

  return (
    <>
      {/* Full-screen warning for multiple faces */}
      {showMultiFaceWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Multiple Faces Detected
            </h2>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              We've detected <span className="font-semibold text-orange-600">{faceCount} faces</span> in the camera view. 
              For security and accuracy, please ensure <span className="font-semibold">only one person</span> is 
              visible during the application process.
            </p>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-orange-800">
                  <p className="font-medium mb-1">Security Requirements:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Only the applicant should be visible</li>
                    <li>Ensure good lighting and clear face visibility</li>
                    <li>Remove any reflections or background people</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={dismissMultiFaceWarning}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Continue Anyway
              </button>
              <button
                onClick={dismissMultiFaceWarning}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                I'll Adjust
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-4 right-4 z-50 transition-all duration-300 ${
        isMinimized ? 'w-16 h-16' : 'w-80 h-64'
      }`}>
      {/* Background detection widget */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} animate-pulse`}></div>
            <span className="text-white text-sm font-medium">
              {isMinimized ? 'FD' : 'Face Detection'}
            </span>
          </div>
          <button
            onClick={toggleMinimize}
            className="text-white hover:text-gray-200 transition-colors"
          >
            {isMinimized ? '📹' : '−'}
          </button>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="p-4">
            {/* Video feed (hidden but active) */}
            <div className="relative mb-3">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-24 object-cover rounded-lg bg-gray-900"
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
              />
              
              {/* Status overlay */}
              <div className="absolute top-2 left-2">
                <div className={`px-2 py-1 rounded ${getStatusColor()} text-white text-xs`}>
                  {getStatusText()}
                </div>
              </div>

              {/* Face detection indicator */}
              {faceCount > 0 && (
                <div className="absolute top-2 right-2">
                  {faceCount > 1 ? (
                    <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs flex items-center space-x-1 animate-pulse">
                      <Users className="w-3 h-3" />
                      <span>{faceCount} faces</span>
                    </div>
                  ) : (
                    <div className="bg-green-500 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{confidence.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )} 
            </div>

            {/* Multiple faces warning */}
            {faceCount > 1 && (
              <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded flex items-center space-x-2">
                <Users className="w-4 h-4 text-orange-500" />
                <span className="text-orange-700 text-xs font-medium">
                  {faceCount} faces detected - Only one person should be visible
                </span>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <div className="font-medium text-gray-700">Total Detections</div>
                <div className="text-lg font-bold text-blue-600">
                  {backgroundStats.totalDetections}
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <div className="font-medium text-gray-700">Avg Confidence</div>
                <div className="text-lg font-bold text-green-600">
                  {backgroundStats.averageConfidence.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Error message */}
            {faceDetectionError && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-700 text-xs">{faceDetectionError}</span>
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
    </>
  );
};

export default BackgroundFaceDetection;
