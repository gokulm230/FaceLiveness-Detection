import React, { useState } from 'react';
import { Bug, ChevronDown, ChevronUp } from 'lucide-react';
import { useFaceDetection } from '../contexts/FaceDetectionContext';

const DebugPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const faceDetectionContext = useFaceDetection();

  const debugInfo = {
    'Initialized': faceDetectionContext.isInitialized,
    'Models Loaded': faceDetectionContext.modelsLoaded,
    'Camera Active': faceDetectionContext.isCameraActive,
    'Detecting': faceDetectionContext.isDetecting,
    'Face Count': faceDetectionContext.faceCount,
    'Confidence': faceDetectionContext.confidence.toFixed(3),
    'Loading': faceDetectionContext.loading,
    'Error': faceDetectionContext.error || 'None',
  };

  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 bg-black/80 text-white rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center space-x-2 p-3 w-full hover:bg-white/10 transition-colors"
      >
        <Bug className="w-4 h-4" />
        <span className="text-sm font-medium">Debug</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      
      {isExpanded && (
        <div className="p-3 border-t border-white/20 max-h-64 overflow-y-auto">
          <div className="space-y-1">
            {Object.entries(debugInfo).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center text-xs">
                <span className="text-gray-300">{key}:</span>
                <span className={`font-mono ${
                  typeof value === 'boolean' 
                    ? value ? 'text-green-400' : 'text-red-400'
                    : value === 'None' ? 'text-gray-400' : 'text-white'
                }`}>
                  {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
