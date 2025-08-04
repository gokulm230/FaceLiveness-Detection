import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  User,
  Check,
  X,
  AlertCircle,
  Eye,
  ArrowRight,
  ArrowLeft,
  Shield,
  Scan,
  Lock,
} from "lucide-react";
import * as THREE from "three";
import { useFaceDetection } from "../contexts/FaceDetectionContext";
import { toast } from "react-toastify";

const LIVENESS_TESTS = [

  
  // {
  //   id: "turn_left",
  //   type: "head_movement", // ✅ CHANGED FROM "turn" TO "head_movement"
  //   instruction: "Please turn your head left slowly",
  //   icon: ArrowLeft,
  //   duration: 3000,
  //   direction: "left",
  // },
  // {
  //   id: "turn_right",
  //   type: "head_movement", // ✅ CHANGED FROM "turn" TO "head_movement"
  //   instruction: "Please turn your head right slowly",
  //   icon: ArrowRight,
  //   duration: 3000,
  //   direction: "right",
  // },
];

const AuthenticationPage = () => {
  // Get face detection context
  const {
    isInitialized: faceDetectionInitialized,
    modelsLoaded,
    faces,
    faceCount,
    confidence,
    initializeFaceDetection,
    startCamera,
    startDetection,
    stopDetection,
    stopCamera,
    detectFaces,
    captureReference,
    getStoredFaceReference,
    clearStoredFaceReference,
    performLivenessTest, // ✅ ADD THIS TO THE DESTRUCTURED VARIABLES
    error: faceDetectionError,
    loading: faceDetectionLoading,
    isCameraActive,
  } = useFaceDetection();

  const [currentStep, setCurrentStep] = useState("setup");
  const [currentTest, setCurrentTest] = useState(0);
  const [compatibility, setCompatibility] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [otpNumber, setOtpNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const streamRef = useRef(null);

  // Add the missing computed values for face detection
  const faceDetected = faceCount === 1 && confidence > 0.6;
  const multipleFacesDetected = faceCount > 1; // Add this line
  const noFaceDetected = faceCount === 0;

  // Computed values for face detection
  // const faceDetected = faceCount > 0 && confidence > 0.6;

  // 3D Scene Setup for setup step
  useEffect(() => {
    if (!mountRef.current || currentStep !== "setup") return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 300 / 200, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(300, 200);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create authentication icon
    const iconGeometry = new THREE.SphereGeometry(0.8, 32, 16);
    const iconMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.6,
    });
    const iconMesh = new THREE.Mesh(iconGeometry, iconMaterial);
    scene.add(iconMesh);

    // Shield effect
    const shieldGeometry = new THREE.RingGeometry(0.6, 1.2, 6);
    const shieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.4,
    });
    const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
    scene.add(shield);

    camera.position.z = 3;
    sceneRef.current = { scene, camera, renderer, iconMesh, shield };

    const animate = () => {
      if (!sceneRef.current) return;

      const { iconMesh, shield } = sceneRef.current;

      iconMesh.rotation.y += 0.01;
      shield.rotation.z += 0.005;

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [currentStep]);

  // Initialize face detection models and compatibility
  useEffect(() => {
    const initializeSystem = async () => {
      setLoading(true);
      try {
        // Check compatibility first
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const compat = {
          isCompatible: true,
          hasWebGL: !!window.WebGLRenderingContext,
          hasGetUserMedia: !!(
            navigator.mediaDevices && navigator.mediaDevices.getUserMedia
          ),
        };
        setCompatibility(compat);

        // Check camera permission
        try {
          await navigator.mediaDevices.getUserMedia({ video: true });
          setCameraPermission({ status: "granted" });
        } catch (err) {
          setCameraPermission({ status: "denied" });
        }

        // Initialize face detection models
        if (!faceDetectionInitialized && !modelsLoaded) {
          console.log("Initializing face detection models...");
          await initializeFaceDetection();
        }
      } catch (err) {
        console.error("System initialization failed:", err);
        setError(
          "Failed to initialize face detection system. Please refresh and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    initializeSystem();
  }, [faceDetectionInitialized, modelsLoaded, initializeFaceDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopContinuousDetection();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStartAuthentication = async () => {
    try {
      setError(null);
      setLoading(true);

      if (
        !aadhaarNumber ||
        aadhaarNumber.length !== 12 ||
        !/^\d+$/.test(aadhaarNumber)
      ) {
        setError("Please enter a valid 12-digit Aadhaar number");
        return;
      }

      if (!otpNumber || otpNumber.length === 0) {
        setError("Please enter the OTP");
        return;
      }

      // Simulate session start
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSessionId("session_" + Date.now());
      setCurrentStep("camera");
      setProgress(10);

      // Start camera and get stream
      try {
        console.log("Starting camera...");

        // Get camera stream directly
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: false,
        });

        // Store stream reference
        streamRef.current = stream;

        // Assign stream to video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video to be ready
          await new Promise((resolve) => {
            const onLoadedMetadata = () => {
              videoRef.current.removeEventListener(
                "loadedmetadata",
                onLoadedMetadata
              );
              resolve();
            };
            videoRef.current.addEventListener(
              "loadedmetadata",
              onLoadedMetadata
            );
          });

          console.log("Video stream assigned successfully");
        }

        // Start face detection context
        await startCamera();

        // Wait a moment for camera to stabilize
        setTimeout(async () => {
          console.log("Starting face detection...");
          await startDetection();

          // Start continuous detection loop
          startContinuousDetection();
        }, 1000);
      } catch (detectionError) {
        console.error("Camera or detection start failed:", detectionError);
        setError(
          "Failed to access camera or start face detection. Please check permissions and ensure camera is not in use by another application."
        );
      }
    } catch (err) {
      console.error("Failed to start authentication:", err);
      setError("Failed to start authentication session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Start continuous face detection
  const startContinuousDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(async () => {
      try {
        // Use video element for detection
        if (videoRef.current && videoRef.current.videoWidth > 0) {
          await detectFaces(videoRef.current);
        }
      } catch (error) {
        console.warn("Detection frame failed:", error);
      }
    }, 100); // Detect every 100ms for smooth detection
  };

  // Stop continuous detection
  const stopContinuousDetection = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  // Update the handleCaptureReference function
  const handleCaptureReference = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!faceDetected) {
        setError("Please position your face properly before capturing");
        return;
      }

      if (multipleFacesDetected) {
        setError(
          "Multiple faces detected. Please ensure only one person is visible."
        );
        return;
      }

      console.log("Capturing face reference...");

      // Capture and store the reference
      const result = await captureReference();

      if (result.success) {
        console.log("Face reference captured successfully:", result.data);

        // Show success message
        toast.success("Face reference captured and stored successfully!", {
          position: "top-center",
          autoClose: 3000,
        });

        // Move to next step after successful capture
        setTimeout(() => {
          setCurrentStep("liveness");
          setProgress(40);
        }, 1500);
      }
    } catch (error) {
      console.error("Failed to capture reference:", error);
      setError(error.message || "Failed to capture face reference");

      toast.error(error.message || "Failed to capture face reference", {
        position: "top-center",
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Add function to check if face reference exists
  const checkStoredReference = useCallback(() => {
    const stored = getStoredFaceReference();
    return stored !== null;
  }, [getStoredFaceReference]);

  // Add useEffect to check for existing reference on component mount
  useEffect(() => {
    const hasStoredReference = checkStoredReference();
    if (hasStoredReference) {
      const lastCapture = JSON.parse(
        localStorage.getItem("lastFaceCapture") || "{}"
      );
      console.log("Found existing face reference:", lastCapture);
    }
  }, [checkStoredReference]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopContinuousDetection();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleStartLivenessTest = async () => {
    try {
      setError(null);
      setCurrentStep("verification");
      setProgress(50);

      // ❌ REMOVE THIS LINE - DON'T CALL HOOK INSIDE FUNCTION
      // const { performLivenessTest } = useFaceDetection();

      // ✅ USE THE FUNCTION DIRECTLY FROM THE DESTRUCTURED CONTEXT
      for (let i = 0; i < LIVENESS_TESTS.length; i++) {
        const test = LIVENESS_TESTS[i];
        setCurrentTest(i);

        try {
          console.log(`Starting ${test.type} test:`, test);

          // ✅ Use performLivenessTest directly (already available from context)
          const result = await performLivenessTest(test.type, {
            duration: test.duration,
            threshold: test.threshold,
            direction: test.direction,
          });

          console.log(`${test.type} test result:`, result);

          if (!result.success) {
            throw new Error(`${test.instruction} failed. Please try again.`);
          }

          // Show success feedback
          toast.success(`${test.instruction} - Success!`, {
            position: "top-center",
            autoClose: 1500,
          });
        } catch (testError) {
          console.error(`${test.type} test failed:`, testError);
          setError(`${test.instruction} failed: ${testError.message}`);
          setCurrentStep("liveness");
          return;
        }

        setProgress(50 + ((i + 1) / LIVENESS_TESTS.length) * 40);
      }

      setCurrentStep("complete");
      setProgress(100);

      toast.success("All liveness tests completed successfully!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Liveness test sequence failed:", err);
      setError("Liveness verification failed. Please try again.");
      setCurrentStep("liveness");
    }
  };

  const handleCompleteAuthentication = async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Navigate to results or dashboard
      alert("Authentication successful! Redirecting to dashboard...");
    } catch (err) {
      console.error("Failed to complete authentication:", err);
      setError("Failed to complete authentication. Please try again.");
    }
  };

  const handleReset = async () => {
    try {
      // Stop detection and camera
      stopContinuousDetection();
      await stopDetection();
      await stopCamera();

      // Stop local stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Clear video element
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.warn("Error during reset:", error);
    }

    setCurrentStep("setup");
    setCurrentTest(0);
    setProgress(0);
    setError(null);
    setSessionId(null);
  };

  // Handle video errors
  useEffect(() => {
    const handleVideoError = (error) => {
      console.error("Video element error:", error);
      setError(
        "Camera feed error. Please check camera permissions and try again."
      );
    };

    if (videoRef.current) {
      videoRef.current.addEventListener("error", handleVideoError);
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener("error", handleVideoError);
        }
      };
    }
  }, [currentStep]);

  if (!compatibility && (loading || faceDetectionLoading)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {faceDetectionLoading
              ? "Loading face detection models..."
              : "Checking browser compatibility..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center transform rotate-12">
                <span className="text-white font-bold text-xl transform -rotate-12">
                  X
                </span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Xyndrix
              </span>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-full">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Secure Authentication
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="bg-white rounded-full p-1 shadow-lg">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            {progress}% Complete
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700 flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Setup Step */}
        {currentStep === "setup" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <div
                  ref={mountRef}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4"
                ></div>
              </div>
              <h1 className="text-4xl font-bold text-gray-800 mb-4">
                Face Authentication
              </h1>
              <p className="text-xl text-gray-600">
                Secure and fast authentication using advanced face liveness
                detection
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  System Requirements
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Browser Compatibility",
                      status: compatibility?.isCompatible,
                    },
                    { label: "WebGL Support", status: compatibility?.hasWebGL },
                    {
                      label: "Camera Access",
                      status: compatibility?.hasGetUserMedia,
                    },
                    {
                      label: "Camera Permission",
                      status: cameraPermission?.status === "granted",
                    },
                    { label: "Face Detection Models", status: modelsLoaded },
                    {
                      label: "Detection System",
                      status: faceDetectionInitialized,
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          item.status
                            ? "bg-green-100 text-green-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {item.status ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-gray-700">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">
                  Before we begin:
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Ensure good lighting on your face</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>
                      Remove any face coverings or glasses if possible
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>
                      Position yourself directly in front of the camera
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>Keep your face centered in the frame</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 12);
                    setAadhaarNumber(value);
                  }}
                  placeholder="Enter 12-digit Aadhaar number"
                  maxLength="12"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                {aadhaarNumber && aadhaarNumber.length === 12 && (
                  <div className="flex items-center space-x-2 mt-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Valid Aadhaar format</span>
                  </div>
                )}
                {aadhaarNumber &&
                  aadhaarNumber.length > 0 &&
                  aadhaarNumber.length < 12 && (
                    <div className="flex items-center space-x-2 mt-2 text-red-600">
                      <X className="w-4 h-4" />
                      <span className="text-sm">Must be exactly 12 digits</span>
                    </div>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP
                </label>
                <input
                  type="text"
                  value={otpNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpNumber(value);
                  }}
                  placeholder="Enter OTP"
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                {otpNumber && otpNumber.length > 0 && (
                  <div className="flex items-center space-x-2 mt-2 text-green-600">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">OTP entered</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 mt-2 text-blue-600">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">
                    For demo purposes, any number can be entered as OTP
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartAuthentication}
              disabled={
                !compatibility?.isCompatible ||
                cameraPermission?.status !== "granted" ||
                !faceDetectionInitialized ||
                !modelsLoaded ||
                !aadhaarNumber ||
                aadhaarNumber.length !== 12 ||
                !otpNumber ||
                otpNumber.length === 0 ||
                loading ||
                faceDetectionLoading
              }
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="flex items-center justify-center space-x-3">
                {loading || faceDetectionLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>
                      {faceDetectionLoading
                        ? "Loading Models..."
                        : "Initializing..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    <span>Start Authentication</span>
                  </>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Camera Step */}
        {currentStep === "camera" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">
                Position Your Face
              </h2>
              <p className="text-red-600 font-medium mb-2">
                *You Will be Monitored Throughout The Session*
              </p>
              <p className="text-gray-600">
                Position your face in the center of the frame and remain still
              </p>
            </div>

            {/* Add storage status indicator */}
            {checkStoredReference() && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 flex items-center space-x-3">
                <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-blue-700 font-medium">
                    Previous face reference found
                  </p>
                  <p className="text-blue-600 text-sm">
                    You can capture a new reference or continue with existing
                    one.
                  </p>
                </div>
                <button
                  onClick={() => {
                    clearStoredFaceReference();
                    toast.info("Previous face reference cleared");
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  Clear
                </button>
              </div>
            )}

            <div
              className="relative bg-gray-900 rounded-2xl overflow-hidden mb-8"
              style={{ aspectRatio: "4/3" }}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ transform: "scaleX(-1)" }}
                onLoadedMetadata={() => {
                  console.log("Video metadata loaded", {
                    width: videoRef.current?.videoWidth,
                    height: videoRef.current?.videoHeight,
                  });
                }}
                onError={(e) => {
                  console.error("Video error:", e);
                  setError("Video display error. Please check camera access.");
                }}
              />

              {/* Loading overlay when no video */}
              {(!streamRef.current || !videoRef.current?.videoWidth) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-white">Loading camera feed...</p>
                  </div>
                </div>
              )}

              {/* Face guide overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-80 border-4 border-blue-500 rounded-full opacity-50 animate-pulse"></div>
              </div>

              {/* Single face detection indicator */}
              {faceDetected && (
                <div className="absolute top-4 left-4 bg-green-500 text-white px-4 py-2 rounded-full flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Face Detected ({confidence.toFixed(2)})
                  </span>
                </div>
              )}

              {/* Multiple faces warning */}
              {multipleFacesDetected && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2 animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Multiple Faces Detected ({faceCount})
                  </span>
                </div>
              )}

              {/* No face detected */}
              {noFaceDetected && streamRef.current && (
                <div className="absolute top-4 left-4 bg-yellow-500 text-white px-4 py-2 rounded-full flex items-center space-x-2">
                  <Scan className="w-4 h-4" />
                  <span className="text-sm font-medium">No Face Detected</span>
                </div>
              )}

              {/* Camera status indicator */}
              <div className="absolute top-4 right-4">
                {streamRef.current ? (
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm">Live</span>
                  </div>
                ) : (
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-sm">No Signal</span>
                  </div>
                )}
              </div>

              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
            </div>

            {/* Multiple faces warning message */}
            {multipleFacesDetected && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-700 font-medium">
                    Multiple faces detected!
                  </p>
                  <p className="text-red-600 text-sm">
                    Please ensure only one person is visible in the camera
                    frame.
                  </p>
                </div>
              </div>
            )}

            {/* Debug info */}
            {process.env.NODE_ENV === "development" && (
              <div className="bg-gray-100 rounded-lg p-4 mb-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Camera Status:</strong>
                    <br />
                    Stream: {streamRef.current ? "✅ Active" : "❌ Inactive"}
                    <br />
                    Video Dimensions: {videoRef.current?.videoWidth || 0} x{" "}
                    {videoRef.current?.videoHeight || 0}
                  </div>
                  <div>
                    <strong>Detection Status:</strong>
                    <br />
                    Faces: {faceCount}
                    <br />
                    Confidence: {confidence.toFixed(2)}
                    <br />
                    Multiple Faces: {multipleFacesDetected ? "⚠️ Yes" : "✅ No"}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleReset}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handleCaptureReference}
                disabled={
                  !faceDetected ||
                  loading ||
                  !streamRef.current ||
                  multipleFacesDetected
                }
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-2xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Camera className="w-5 h-5" />
                )}
                <span>Capture Reference</span>
              </button>
            </div>
          </div>
        )}

        {/* Liveness Test Step */}
        {currentStep === "liveness" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Liveness Verification
              </h2>
              <p className="text-gray-600">
                Follow the instructions to prove you're a real person
              </p>
            </div>

            <div className="space-y-4 mb-8">
              {LIVENESS_TESTS.map((test, index) => {
                const IconComponent = test.icon;
                return (
                  <div
                    key={test.id}
                    className={`flex items-center space-x-4 p-4 rounded-2xl transition-all ${
                      index === currentTest
                        ? "bg-blue-50 border-2 border-blue-500"
                        : index < currentTest
                        ? "bg-green-50 border-2 border-green-500"
                        : "bg-gray-50 border-2 border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        index === currentTest
                          ? "bg-blue-500 text-white"
                          : index < currentTest
                          ? "bg-green-500 text-white"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-lg font-medium text-gray-800 flex-1">
                      {test.instruction}
                    </span>
                    {index < currentTest && (
                      <Check className="w-6 h-6 text-green-500" />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleStartLivenessTest}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
            >
              Begin Tests
            </button>
          </div>
        )}

        {/* Verification in Progress */}
        {currentStep === "verification" && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Performing Liveness Test
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              {LIVENESS_TESTS[currentTest]?.instruction}
            </p>

            <div className="flex flex-col items-center space-y-6">
              {/* Show current test icon */}
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {React.createElement(LIVENESS_TESTS[currentTest]?.icon, {
                  className: "w-16 h-16 text-white",
                })}
              </div>

              <div className="text-lg font-medium text-gray-700">
                Test {currentTest + 1} of {LIVENESS_TESTS.length}
              </div>

              {/* Real-time feedback */}
              <div className="bg-blue-50 rounded-2xl p-4 w-full max-w-md">
                <div className="text-center">
                  <div className="text-sm text-blue-600 font-medium mb-2">
                    Follow the instruction above
                  </div>
                  {faceDetected ? (
                    <div className="flex items-center justify-center space-x-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">
                        Face detected - perform the action
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2 text-yellow-600">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">
                        Position your face in the frame
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && (
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">
                Authentication Complete
              </h2>
              <p className="text-gray-600">
                Face liveness verification successful
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Test Results:
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {LIVENESS_TESTS.map((test, index) => {
                  const IconComponent = test.icon;
                  return (
                    <div
                      key={test.id}
                      className="flex items-center space-x-3 bg-white rounded-xl p-4"
                    >
                      <IconComponent className="w-6 h-6 text-blue-600" />
                      <span className="text-gray-700 flex-1">
                        {test.instruction}
                      </span>
                      <Check className="w-5 h-5 text-green-500" />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-2xl font-medium hover:bg-gray-50 transition-colors"
              >
                Start New Session
              </button>
              <button
                onClick={handleCompleteAuthentication}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-2xl font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthenticationPage;
