import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
} from "react";
import { toast } from "react-toastify";
import * as faceapi from "face-api.js";
// import { faceDetectionService } from '../services/faceDetectionService';
import { livenessService } from "../services/api";

// Initial state
const initialState = {
  isInitialized: false,
  isDetecting: false,
  loading: false,
  error: null,

  // Face detection results
  faces: [],
  faceCount: 0,
  confidence: 0,

  // Liveness detection results
  livenessResults: null,
  isLive: false,
  livenessConfidence: 0,

  // Camera state
  isCameraActive: false,
  cameraError: null,

  // Models loading state
  modelsLoaded: false,
  modelLoadingProgress: 0,
  expressionModelAvailable: false,
};

// Action types
const ActionTypes = {
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_INITIALIZED: "SET_INITIALIZED",
  SET_DETECTING: "SET_DETECTING",
  SET_FACES: "SET_FACES",
  SET_LIVENESS_RESULTS: "SET_LIVENESS_RESULTS",
  SET_CAMERA_STATE: "SET_CAMERA_STATE",
  SET_CAMERA_ACTIVE: "SET_CAMERA_ACTIVE", // Add this
  SET_STREAM: "SET_STREAM", // Add this
  SET_CAMERA_ERROR: "SET_CAMERA_ERROR",
  SET_MODELS_LOADED: "SET_MODELS_LOADED",
  SET_MODEL_LOADING_PROGRESS: "SET_MODEL_LOADING_PROGRESS",
  SET_EXPRESSION_MODEL_AVAILABLE: "SET_EXPRESSION_MODEL_AVAILABLE",
  CLEAR_ERROR: "CLEAR_ERROR",
  RESET_DETECTION: "RESET_DETECTION",
  SET_FACE_DATA: "SET_FACE_DATA",
};

// Reducer
const faceDetectionReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error,
      };

    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        isDetecting: false,
      };

    case ActionTypes.SET_INITIALIZED:
      return {
        ...state,
        isInitialized: action.payload,
        loading: false,
        error: action.payload ? null : state.error,
      };

    case ActionTypes.SET_DETECTING:
      return {
        ...state,
        isDetecting: action.payload,
      };

    case ActionTypes.SET_FACES:
      return {
        ...state,
        faces: action.payload.faces || [],
        faceCount: action.payload.count || 0,
        confidence: action.payload.confidence || 0,
        isDetecting: false,
      };

    case ActionTypes.SET_LIVENESS_RESULTS:
      return {
        ...state,
        livenessResults: action.payload,
        isLive: action.payload?.isLive || false,
        livenessConfidence: action.payload?.confidence || 0,
        isDetecting: false,
      };

    case ActionTypes.SET_CAMERA_STATE:
      return {
        ...state,
        isCameraActive: action.payload,
        cameraError: action.payload ? null : state.cameraError,
      };

    case ActionTypes.SET_CAMERA_ACTIVE:
      return {
        ...state,
        isCameraActive: action.payload,
        cameraError: action.payload ? null : state.cameraError,
      };

    case ActionTypes.SET_STREAM:
      return {
        ...state,
        stream: action.payload,
      };

    case ActionTypes.SET_CAMERA_ERROR:
      return {
        ...state,
        cameraError: action.payload,
        isCameraActive: false,
      };

    case ActionTypes.SET_MODELS_LOADED:
      return {
        ...state,
        modelsLoaded: action.payload,
      };

    case ActionTypes.SET_MODEL_LOADING_PROGRESS:
      return {
        ...state,
        modelLoadingProgress: action.payload,
      };

    case ActionTypes.SET_EXPRESSION_MODEL_AVAILABLE:
      return {
        ...state,
        expressionModelAvailable: action.payload,
      };

    case ActionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null,
        cameraError: null,
      };

    case ActionTypes.RESET_DETECTION:
      return {
        ...state,
        faces: [],
        faceCount: 0,
        confidence: 0,
        livenessResults: null,
        isLive: false,
        livenessConfidence: 0,
        isDetecting: false,
      };
    case ActionTypes.SET_FACE_DATA:
      return {
        ...state,
        faceData: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const FaceDetectionContext = createContext();

// Face detection provider component
export const FaceDetectionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(faceDetectionReducer, initialState);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const videoRef = useRef(null);

  // Initialize face detection models
  const initializeFaceDetection = useCallback(async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      // Check if models are already loaded
      if (state.modelsLoaded) {
        dispatch({ type: ActionTypes.SET_INITIALIZED, payload: true });
        return;
      }

      // Load models with proper error handling
      const modelUrl = "/models";
      console.log("Loading models from:", modelUrl);

      dispatch({ type: ActionTypes.SET_MODEL_LOADING_PROGRESS, payload: 10 });

      try {
        // Load only the essential models we have
        console.log("Loading TinyFaceDetector...");
        await faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
        dispatch({ type: ActionTypes.SET_MODEL_LOADING_PROGRESS, payload: 30 });

        console.log("Loading FaceLandmark68Net...");
        await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
        dispatch({ type: ActionTypes.SET_MODEL_LOADING_PROGRESS, payload: 60 });

        console.log("Loading FaceRecognitionNet...");
        await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
        dispatch({ type: ActionTypes.SET_MODEL_LOADING_PROGRESS, payload: 80 });

        // Try to load face expression model if available
        try {
          console.log("Attempting to load FaceExpressionNet...");
          await faceapi.nets.faceExpressionNet.loadFromUri(modelUrl);
          console.log("FaceExpressionNet loaded successfully");
          dispatch({
            type: ActionTypes.SET_EXPRESSION_MODEL_AVAILABLE,
            payload: true,
          });
        } catch (expressionError) {
          console.warn(
            "FaceExpressionNet model files not found - using landmark-based smile detection"
          );
          console.warn("Expression error details:", expressionError.message);
          dispatch({
            type: ActionTypes.SET_EXPRESSION_MODEL_AVAILABLE,
            payload: false,
          });
        }

        dispatch({
          type: ActionTypes.SET_MODEL_LOADING_PROGRESS,
          payload: 100,
        });

        dispatch({ type: ActionTypes.SET_MODELS_LOADED, payload: true });
        console.log("All face detection models loaded successfully");
      } catch (modelError) {
        console.error("Model loading failed:", modelError);
        throw new Error(
          `Failed to load face detection models: ${modelError.message}`
        );
      }

      dispatch({ type: ActionTypes.SET_INITIALIZED, payload: true });
      console.log("Face detection initialized successfully");
    } catch (error) {
      console.error("Failed to initialize face detection:", error);
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: `Failed to initialize face detection: ${error.message}`,
      });
      // Still set as initialized but with error state
      dispatch({ type: ActionTypes.SET_INITIALIZED, payload: false });
      throw error;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, [state.modelsLoaded]);

  // Start camera
  // Update the startCamera function

  const startCamera = useCallback(async () => {
    try {
      dispatch({ type: ActionTypes.SET_LOADING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      // Store stream reference
      streamRef.current = stream;

      // Create or get video element
      let videoElement = videoRef.current;
      if (!videoElement) {
        videoElement = document.createElement("video");
        videoElement.setAttribute("autoplay", "");
        videoElement.setAttribute("muted", "");
        videoElement.setAttribute("playsinline", "");
        videoRef.current = videoElement;
      }

      // Attach stream to video
      videoElement.srcObject = stream;

      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Video loading timeout"));
        }, 10000);

        videoElement.onloadedmetadata = () => {
          clearTimeout(timeout);
          videoElement.play().then(resolve).catch(reject);
        };
      });

      dispatch({ type: ActionTypes.SET_CAMERA_ACTIVE, payload: true });
      dispatch({ type: ActionTypes.SET_STREAM, payload: stream });

      console.log("Camera started successfully", {
        width: videoElement.videoWidth,
        height: videoElement.videoHeight,
      });

      return videoElement;
    } catch (error) {
      console.error("Failed to start camera:", error);
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: "Failed to access camera. Please check permissions.",
      });
      throw error;
    } finally {
      dispatch({ type: ActionTypes.SET_LOADING, payload: false });
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }

    dispatch({ type: ActionTypes.SET_CAMERA_STATE, payload: false });
  }, []);

  // Detect faces in image
  const detectFaces = useCallback(
    async (imageElement = null) => {
      if (!state.isInitialized || !state.modelsLoaded) {
        console.warn("Face detection not initialized or models not loaded");
        return { faces: [], count: 0, confidence: 0 };
      }

      try {
        // Use provided element or default to video ref
        const element = imageElement || videoRef.current;

        if (!element) {
          console.warn("No video element available for detection");
          return { faces: [], count: 0, confidence: 0 };
        }

        // Check if video is ready
        if (element.readyState !== element.HAVE_ENOUGH_DATA) {
          console.warn("Video not ready for detection");
          return { faces: [], count: 0, confidence: 0 };
        }

        dispatch({ type: ActionTypes.SET_DETECTING, payload: true });

        const detections = await faceapi
          .detectAllFaces(
            element,
            new faceapi.TinyFaceDetectorOptions({
              inputSize: 320,
              scoreThreshold: 0.5,
            })
          )
          .withFaceLandmarks()
          .withFaceDescriptors();

        const faces = detections.map((detection, index) => ({
          id: index,
          confidence: detection.detection.score,
          box: {
            x: detection.detection.box.x,
            y: detection.detection.box.y,
            width: detection.detection.box.width,
            height: detection.detection.box.height,
          },
          landmarks: detection.landmarks,
          descriptor: detection.descriptor,
        }));

        const avgConfidence =
          faces.length > 0
            ? faces.reduce((sum, face) => sum + face.confidence, 0) /
              faces.length
            : 0;

        const result = {
          faces: faces,
          count: faces.length,
          confidence: avgConfidence,
        };

        dispatch({ type: ActionTypes.SET_FACES, payload: result });
        return result;
      } catch (error) {
        console.error("Face detection error:", error);
        return { faces: [], count: 0, confidence: 0 };
      } finally {
        dispatch({ type: ActionTypes.SET_DETECTING, payload: false });
      }
    },
    [state.isInitialized, state.modelsLoaded]
  );

  // Perform liveness detection
  const detectLiveness = useCallback(
    async (images, challengeType = "comprehensive") => {
      try {
        dispatch({ type: ActionTypes.SET_DETECTING, payload: true });
        dispatch({ type: ActionTypes.CLEAR_ERROR });

        let result;

        switch (challengeType) {
          case "blink":
            result = await livenessService.detectBlink(images[0]);
            break;
          case "smile":
            result = await livenessService.detectSmile(images[0]);
            break;
          case "head_movement":
            result = await livenessService.detectHeadMovement(images);
            break;
          case "comprehensive":
          default:
            result = await livenessService.comprehensiveCheck(images);
            break;
        }

        if (result.success) {
          dispatch({
            type: ActionTypes.SET_LIVENESS_RESULTS,
            payload: result.data,
          });
          return result.data;
        } else {
          throw new Error(result.error || "Liveness detection failed");
        }
      } catch (error) {
        console.error("Liveness detection error:", error);
        const errorMessage =
          error.message || "Failed to perform liveness detection";
        dispatch({ type: ActionTypes.SET_ERROR, payload: errorMessage });
        throw error;
      }
    },
    []
  );

  // Real-time liveness detection
  const detectLivenessRealTime = useCallback(async (frameData) => {
    try {
      const result = await livenessService.realTimeCheck(frameData);

      if (result.success) {
        dispatch({
          type: ActionTypes.SET_LIVENESS_RESULTS,
          payload: result.data,
        });
        return result.data;
      } else {
        throw new Error(result.error || "Real-time liveness detection failed");
      }
    } catch (error) {
      console.error("Real-time liveness detection error:", error);
      // Don't dispatch error for real-time detection as it's continuous
      return null;
    }
  }, []);

  // Start continuous face detection
  const startContinuousDetection = useCallback(
    (videoElement, callback, interval = 500) => {
      if (!state.isInitialized || !videoElement) {
        console.warn(
          "Cannot start continuous detection: not initialized or no video element"
        );
        return;
      }

      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }

      detectionIntervalRef.current = setInterval(async () => {
        try {
          if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
            const result = await detectFaces(videoElement);
            if (callback) {
              callback(result);
            }
          }
        } catch (error) {
          console.error("Continuous detection error:", error);
        }
      }, interval);

      return () => {
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
          detectionIntervalRef.current = null;
        }
      };
    },
    [state.isInitialized, detectFaces]
  );

  // Stop continuous detection
  const stopContinuousDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  }, []);

  // Capture frame from video
  const captureFrame = useCallback((videoElement, canvas) => {
    if (!videoElement || !canvas) {
      throw new Error("Video element and canvas are required");
    }

    const ctx = canvas.getContext("2d");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0);

    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  // Convert canvas to blob
  const canvasToBlob = useCallback((canvas, quality = 0.8) => {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", quality);
    });
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  // Reset detection results
  const resetDetection = useCallback(() => {
    dispatch({ type: ActionTypes.RESET_DETECTION });
  }, []);

  // Start detection
  // Add a ref to manage detection loop
  const detectionLoopRef = useRef(null);

  // Update the startDetection function
  const startDetection = useCallback(async () => {
    try {
      // Check if models are loaded first
      if (!state.modelsLoaded) {
        throw new Error("Face detection models not loaded yet");
      }

      dispatch({ type: ActionTypes.SET_DETECTING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      // Start camera if not already active
      if (!state.isCameraActive) {
        await startCamera();
      }

      // Stop any existing detection loop
      if (detectionLoopRef.current) {
        detectionLoopRef.current = false;
      }

      // Start new detection loop
      detectionLoopRef.current = true;

      const runDetectionLoop = async () => {
        if (!detectionLoopRef.current) return;

        try {
          const result = await detectFaces();

          if (result && result.faces.length > 0) {
            dispatch({
              type: ActionTypes.SET_FACE_DATA,
              payload: {
                detected: true,
                faces: result.faces,
                count: result.count,
                confidence: result.confidence,
                timestamp: Date.now(),
              },
            });
            console.log(
              `Detected ${
                result.count
              } face(s) with confidence: ${result.confidence.toFixed(2)}`
            );
          } else {
            dispatch({
              type: ActionTypes.SET_FACE_DATA,
              payload: {
                detected: false,
                faces: [],
                count: 0,
                confidence: 0,
                timestamp: Date.now(),
              },
            });
          }
        } catch (error) {
          console.warn("Detection frame failed:", error);
        }

        // Continue loop if still active
        if (detectionLoopRef.current) {
          setTimeout(runDetectionLoop, 500); // Run every 500ms (slower to reduce load)
        }
      };

      // Start the detection loop
      runDetectionLoop();

      console.log("Face detection started successfully");
      return true;
    } catch (error) {
      console.error("Failed to start detection:", error);
      dispatch({
        type: ActionTypes.SET_ERROR,
        payload: "Failed to start face detection",
      });
      throw error;
    }
  }, [state.isCameraActive, state.modelsLoaded, startCamera, detectFaces]);

  // Add stopDetection function
  const stopDetection = useCallback(() => {
    detectionLoopRef.current = false;
    dispatch({ type: ActionTypes.SET_DETECTING, payload: false });
    console.log("Face detection stopped");
  }, []);

  // Capture reference
  const captureReference = useCallback(async () => {
    try {
      if (!state.isCameraActive) {
        throw new Error("Camera not active");
      }

      const videoElement = videoRef.current;
      if (!videoElement || videoElement.readyState !== videoElement.HAVE_ENOUGH_DATA) {
        throw new Error("Video not ready for capture");
      }

      // Detect faces first to ensure we have a good capture
      const detectionResult = await detectFaces(videoElement);
      
      if (detectionResult.count === 0) {
        throw new Error("No face detected for capture");
      }

      if (detectionResult.count > 1) {
        throw new Error("Multiple faces detected. Please ensure only one person is visible.");
      }

      // Create a canvas to capture the frame
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      // Draw the current video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      
      // Convert to base64 image data
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      
      // Prepare face reference data
      const faceReference = {
        id: `face_ref_${Date.now()}`,
        timestamp: new Date().toISOString(),
        imageData: imageData,
        faceData: {
          count: detectionResult.count,
          confidence: detectionResult.confidence,
          faces: detectionResult.faces.map(face => ({
            id: face.id,
            confidence: face.confidence,
            box: face.box,
            // Don't store full landmarks and descriptors in localStorage (too large)
            hasLandmarks: !!face.landmarks,
            hasDescriptor: !!face.descriptor
          }))
        },
        videoMetadata: {
          width: videoElement.videoWidth,
          height: videoElement.videoHeight
        }
      };

      // Store in localStorage
      try {
        localStorage.setItem('faceReference', JSON.stringify(faceReference));
        console.log('Face reference stored successfully:', faceReference.id);
        
        // Also store just the latest capture info for quick access
        localStorage.setItem('lastFaceCapture', JSON.stringify({
          id: faceReference.id,
          timestamp: faceReference.timestamp,
          confidence: detectionResult.confidence,
          faceCount: detectionResult.count
        }));
        
      } catch (storageError) {
        console.error('Failed to store face reference in localStorage:', storageError);
        throw new Error('Failed to save face reference. Storage may be full.');
      }

      return { 
        success: true, 
        message: "Face reference captured and stored successfully",
        data: {
          id: faceReference.id,
          confidence: detectionResult.confidence,
          timestamp: faceReference.timestamp
        }
      };
      
    } catch (error) {
      console.error("Failed to capture reference:", error);
      throw error;
    }
  }, [state.isCameraActive, detectFaces]);

  // Add helper function to retrieve stored face reference
  const getStoredFaceReference = useCallback(() => {
    try {
      const stored = localStorage.getItem('faceReference');
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Failed to retrieve face reference from localStorage:', error);
      return null;
    }
  }, []);

  // Add helper function to clear stored face reference
  const clearStoredFaceReference = useCallback(() => {
    try {
      localStorage.removeItem('faceReference');
      localStorage.removeItem('lastFaceCapture');
      console.log('Face reference cleared from localStorage');
      return true;
    } catch (error) {
      console.error('Failed to clear face reference from localStorage:', error);
      return false;
    }
  }, []);

  // Update the performLivenessTest function
  const performLivenessTest = useCallback(async (testType, options = {}) => {
    try {
      dispatch({ type: ActionTypes.SET_DETECTING, payload: true });
      dispatch({ type: ActionTypes.CLEAR_ERROR });

      // console.log(`Starting ${testType} liveness test with options:`, options);

      const videoElement = videoRef.current;
      if (!videoElement) {
        throw new Error("Video element not available");
      }

      let result;

      switch (testType) {
        case 'smile':
          result = await detectSmile(options.duration || 3000, options.threshold || 0.7);
          break;
        case 'head_movement':
          result = await detectHeadMovement(options.direction || 'left', options.duration || 3000);
          break;
        default:
          throw new Error(`Unknown test type: ${testType}`);
      }

      return result;
    } catch (error) {
      console.error(`Liveness test ${testType} failed:`, error);
      dispatch({ type: ActionTypes.SET_ERROR, payload: error.message });
      throw error;
    } finally {
      dispatch({ type: ActionTypes.SET_DETECTING, payload: false });
    }
  }, []);

  // Helper functions - moved before other functions to fix initialization order
  // Helper function to calculate distance between two points
  const distance = useCallback((point1, point2) => {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Helper function to get nose position from landmarks
  const getNosePosition = useCallback((landmarks) => {
    if (!landmarks || !landmarks.getNose) {
      return { x: 0, y: 0 };
    }
    
    try {
      const nose = landmarks.getNose();
      const points = Array.isArray(nose) ? nose : nose._positions;
      
      if (!points || points.length === 0) {
        return { x: 0, y: 0 };
      }
      
      // Use the nose tip (usually the center point)
      const noseTip = points[Math.floor(points.length / 2)];
      return { x: noseTip.x, y: noseTip.y };
    } catch (error) {
      console.warn('Failed to get nose position:', error);
      return { x: 0, y: 0 };
    }
  }, []);

  // Improve calculateSmileScore function - moved before detectSmile to fix initialization order
  const calculateSmileScore = useCallback((landmarks) => {
    if (!landmarks || !landmarks.getMouth) {
      return 0;
    }

    try {
      const mouth = landmarks.getMouth();
      const points = Array.isArray(mouth) ? mouth : mouth._positions;
      
      if (!points || points.length < 12) return 0;

      // Get mouth corner points (left and right corners)
      const leftCorner = points[0];   // Left corner
      const rightCorner = points[6];  // Right corner
      const topLip = points[3];       // Top center
      const bottomLip = points[9];    // Bottom center

      // Calculate mouth width and height
      const width = distance(leftCorner, rightCorner);
      const height = distance(topLip, bottomLip);

      // Calculate mouth curvature (smile indicator)
      const mouthCenter = {
        x: (leftCorner.x + rightCorner.x) / 2,
        y: (leftCorner.y + rightCorner.y) / 2
      };

      // Check if corners are higher than center (smile curve)
      const leftCornerHeight = mouthCenter.y - leftCorner.y;
      const rightCornerHeight = mouthCenter.y - rightCorner.y;
      const averageCornerHeight = (leftCornerHeight + rightCornerHeight) / 2;

      // Combine width/height ratio with corner elevation
      const widthHeightRatio = width / height;
      const smileScore = (widthHeightRatio / 4) + (averageCornerHeight / 10);

      // Normalize to 0-1 range
      return Math.min(Math.max(smileScore, 0), 1);
    } catch (error) {
      console.warn('Smile score calculation failed:', error);
      return 0;
    }
  }, []);

  // Remove the detectBlink function completely and update detectSmile
  const detectSmile = useCallback(async (duration = 3000, threshold = 0.7) => {
    // console.log(`Starting smile detection for ${duration}ms with threshold ${threshold}`);
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      let smileDetected = false;
      let maxSmileConfidence = 0;
      let frameCount = 0;
      let smileFrameCount = 0;

      const checkSmile = async () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed >= duration) {
          const success = smileDetected && smileFrameCount >= 10; // Need at least 10 frames of smile
          resolve({
            success: success,
            confidence: maxSmileConfidence,
            details: {
              smileDetected: success,
              maxConfidence: maxSmileConfidence,
              duration: elapsed,
              frameCount,
              smileFrameCount
            }
          });
          return;
        }

        try {
          // Check if face detection is ready
          if (!state.isInitialized || !state.modelsLoaded) {
            // console.warn("Face detection not initialized or models not loaded");
            setTimeout(checkSmile, 100);
            return;
          }

          const detectionResult = await detectFaces();
          
          if (detectionResult.faces.length > 0) {
            const face = detectionResult.faces[0];
            frameCount++;
            
            if (face.landmarks) {
              const smileScore = calculateSmileScore(face.landmarks);
              maxSmileConfidence = Math.max(maxSmileConfidence, smileScore);
              
              if (smileScore > threshold) {
                smileFrameCount++;
                if (!smileDetected) {
                  // console.log(`Smile detected with confidence: ${smileScore.toFixed(3)}`);
                  smileDetected = true;
                }
              }
            }
          }
        } catch (error) {
          console.warn('Smile detection frame failed:', error);
        }

        setTimeout(checkSmile, 100); // Check every 100ms
      };

      checkSmile();
    });
  }, [detectFaces, calculateSmileScore, state.isInitialized, state.modelsLoaded]);

  // Update detectHeadMovement for better detection
  const detectHeadMovement = useCallback(async (direction = 'left', duration = 3000) => {
    // console.log(`Starting head movement detection (${direction}) for ${duration}ms`);
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      let movementDetected = false;
      let initialNosePosition = null;
      let maxMovement = 0;
      let frameCount = 0;
      let movementFrameCount = 0;
      const requiredMovement = 30; // Pixels

      const checkMovement = async () => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed >= duration) {
          const success = movementDetected && movementFrameCount >= 15; // Need sustained movement
          resolve({
            success: success,
            confidence: success ? 0.8 : 0.2,
            details: {
              movementDetected: success,
              maxMovement,
              direction,
              duration: elapsed,
              frameCount,
              movementFrameCount,
              requiredMovement
            }
          });
          return;
        }

        try {
          // Check if face detection is ready
          if (!state.isInitialized || !state.modelsLoaded) {
            // console.warn("Face detection not initialized or models not loaded");
            setTimeout(checkMovement, 100);
            return;
          }

          const detectionResult = await detectFaces();
          
          if (detectionResult.faces.length > 0) {
            const face = detectionResult.faces[0];
            frameCount++;
            
            if (face.landmarks) {
              const nosePosition = getNosePosition(face.landmarks);
              
              if (initialNosePosition === null) {
                initialNosePosition = nosePosition;
                console.log(`Initial nose position: (${nosePosition.x.toFixed(1)}, ${nosePosition.y.toFixed(1)})`);
              } else {
                const movement = direction === 'left' 
                  ? initialNosePosition.x - nosePosition.x
                  : nosePosition.x - initialNosePosition.x;
                
                maxMovement = Math.max(maxMovement, movement);
                
                // Detect significant movement
                if (movement > requiredMovement) {
                  movementFrameCount++;
                  if (!movementDetected) {
                    console.log(`Head movement (${direction}) detected: ${movement.toFixed(1)}px`);
                    movementDetected = true;
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('Head movement detection frame failed:', error);
        }

        setTimeout(checkMovement, 100); // Check every 100ms
      };

      checkMovement();
    });
  }, [detectFaces, getNosePosition, state.isInitialized, state.modelsLoaded]);

  // Update context value to remove blink-related functions
  const contextValue = {
    // State
    ...state,

    // Refs
    videoRef,

    // Camera methods
    startCamera,
    stopCamera,

    // Detection methods
    detectFaces,
    detectLiveness,
    detectLivenessRealTime,
    startContinuousDetection,
    stopContinuousDetection,
    startDetection,
    stopDetection,

    // Utility methods
    captureFrame,
    canvasToBlob,
    clearError,
    resetDetection,
    initializeFaceDetection,
    captureReference,
    performLivenessTest,

    // Liveness test methods (removed detectBlink)
    detectSmile,
    detectHeadMovement,
    calculateSmileScore, // Make this available for debugging
    
    // Helper functions
    distance,
    getNosePosition,
    
    // Storage methods
    getStoredFaceReference,
    clearStoredFaceReference,
  };

  return (
    <FaceDetectionContext.Provider value={contextValue}>
      {children}
    </FaceDetectionContext.Provider>
  );
};

// Custom hook to use face detection context
export const useFaceDetection = () => {
  const context = useContext(FaceDetectionContext);
  if (!context) {
    throw new Error(
      "useFaceDetection must be used within a FaceDetectionProvider"
    );
  }
  return context;
};

export default FaceDetectionContext;
