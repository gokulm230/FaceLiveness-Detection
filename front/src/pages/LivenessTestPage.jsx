import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FiEye,
  FiEyeOff,
  FiRotateCcw,
  FiCheck,
  FiX,
  FiPlay,
  FiPause,
  FiRefreshCw,
} from "react-icons/fi";
import { useFaceDetection } from "../contexts/FaceDetectionContext";
import { Button } from "../components/ui/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import "./LivenessTestPage.css";

const LIVENESS_TESTS = [
  {
    id: "blink",
    type: "blink",
    title: "Eye Blink Detection",
    instruction: "Please blink your eyes naturally",
    description:
      "We will detect when you blink your eyes to verify you are a real person. Just blink normally when the test starts.",
    icon: FiEye,
    duration: 5000,
    threshold: 0.25,
  },
  {
    id: "smile",
    type: "smile",
    title: "Smile Detection",
    instruction: "Please smile naturally",
    description:
      "We will detect your facial expressions to verify liveness. Smile when prompted - a natural smile works best.",
    icon: FiCheck,
    duration: 3000,
    threshold: 0.7,
  },
  {
    id: "head_left",
    type: "head_movement",
    direction: "left",
    title: "Head Movement - Left",
    instruction: "Please turn your head slowly to the left",
    description:
      "Turn your head slowly to the left when instructed. Move naturally and keep your face visible.",
    icon: FiRotateCcw,
    duration: 4000,
    threshold: 15,
  },
  {
    id: "head_right",
    type: "head_movement",
    direction: "right",
    title: "Head Movement - Right",
    instruction: "Please turn your head slowly to the right",
    description:
      "Turn your head slowly to the right when instructed. Move naturally and keep your face visible.",
    icon: FiRotateCcw,
    duration: 4000,
    threshold: 15,
  },
];

const LivenessTestPage = () => {
  const {
    isInitialized,
    isDetecting,
    faceData,
    livenessResults,
    videoRef,
    initializeFaceDetection,
    startCamera,
    startDetection,
    stopDetection,
    performLivenessTest,
  } = useFaceDetection();

  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [testState, setTestState] = useState("preparing"); // preparing, ready, countdown, testing, result, complete
  const [countdown, setCountdown] = useState(3);
  const [testProgress, setTestProgress] = useState(0);
  const [testResults, setTestResults] = useState([]);
  const [overallResult, setOverallResult] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [cameraInitialized, setCameraInitialized] = useState(false);

  const countdownRef = useRef(null);
  const testTimerRef = useRef(null);
  const progressRef = useRef(null);
  const localVideoRef = useRef(null);

  const currentTest = LIVENESS_TESTS[currentTestIndex];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  // Initialize detection on mount
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        if (!isInitialized) {
          await initializeFaceDetection();
        }

        if (!cameraInitialized) {
          await startCamera();
          setCameraInitialized(true);
        }

        if (isInitialized && !isDetecting) {
          await startDetection();
        }
      } catch (err) {
        console.error("Failed to initialize camera and detection:", err);
        setError(
          "Failed to initialize camera. Please ensure camera permissions are granted."
        );
      }
    };

    initializeCamera();
  }, [
    isInitialized,
    initializeFaceDetection,
    startCamera,
    startDetection,
    cameraInitialized,
  ]);

  // Sync video elements
  useEffect(() => {
    if (videoRef.current && localVideoRef.current) {
      // Copy the stream from the context video to our local video
      localVideoRef.current.srcObject = videoRef.current.srcObject;
    }
  }, [videoRef, cameraInitialized]);

  // Check if face is detected and ready for testing
  useEffect(() => {
    if (testState === "preparing" && faceData?.detected) {
      setTestState("ready");
    } else if (testState === "ready" && !faceData?.detected) {
      setTestState("preparing");
    }
  }, [faceData?.detected, testState]);

  // Countdown timer
  useEffect(() => {
    if (testState === "countdown" && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (testState === "countdown" && countdown === 0) {
      startTest();
    }

    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [testState, countdown]);

  // Test progress timer
  useEffect(() => {
    if (testState === "testing") {
      const startTime = Date.now();
      const duration = currentTest.duration;

      progressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setTestProgress(progress);

        // The test completion is now handled by the actual detection result
        // rather than just the timer
      }, 50);
    }

    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [testState, currentTest]);

  // Start countdown
  const handleStartTest = () => {
    setError(null);
    setCountdown(3);
    setTestState("countdown");
  };

  // Start the actual test
  const startTest = async () => {
    try {
      setTestState("testing");
      setTestProgress(0);

      // Start the specific liveness test with real detection
      console.log(`Starting ${currentTest.type} test with options:`, {
        direction: currentTest.direction,
        threshold: currentTest.threshold,
        duration: currentTest.duration,
      });

      const testResult = await performLivenessTest(currentTest.type, {
        direction: currentTest.direction,
        threshold: currentTest.threshold,
        duration: currentTest.duration,
      });

      console.log(`Test result for ${currentTest.type}:`, testResult);

      // Record result
      const result = {
        testId: currentTest.id,
        type: currentTest.type,
        passed: testResult.success,
        confidence: testResult.confidence || 0,
        error: testResult.error,
        timestamp: new Date().toISOString(),
      };

      setTestResults((prev) => [...prev, result]);
      setTestState("result");

      // Auto-advance after showing result
      setTimeout(() => {
        if (currentTestIndex < LIVENESS_TESTS.length - 1) {
          nextTest();
        } else {
          completeAllTests();
        }
      }, 2000);
    } catch (err) {
      console.error("Test failed:", err);
      setError(`Test failed: ${err.message}`);
      setTestState("ready");
    }
  };

  // Complete current test
  const completeTest = () => {
    if (testTimerRef.current) {
      clearTimeout(testTimerRef.current);
    }
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
    setTestProgress(100);
  };

  // Move to next test
  const nextTest = () => {
    setCurrentTestIndex((prev) => prev + 1);
    setTestState("preparing");
    setTestProgress(0);
    setRetryCount(0);
  };

  // Retry current test
  const retryTest = () => {
    setRetryCount((prev) => prev + 1);
    setTestState("ready");
    setTestProgress(0);
    setError(null);
  };

  // Complete all tests
  const completeAllTests = () => {
    const passedTests = testResults.filter((result) => result.passed).length;
    const totalTests = testResults.length;
    const successRate = (passedTests / totalTests) * 100;

    setOverallResult({
      passed: successRate >= 75, // Require 75% success rate
      successRate,
      passedTests,
      totalTests,
      details: testResults,
    });

    setTestState("complete");
  };

  // Reset all tests
  const resetTests = () => {
    setCurrentTestIndex(0);
    setTestState("preparing");
    setTestResults([]);
    setOverallResult(null);
    setTestProgress(0);
    setRetryCount(0);
    setError(null);
  };

  if (!isInitialized) {
    return (
      <div className="liveness-test-page">
        <div className="test-container">
          <LoadingSpinner size="large" />
          <p>Initializing camera and face detection...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="liveness-test-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="test-container">
        {/* Header */}
        <motion.div className="test-header" variants={itemVariants}>
          <h1>Liveness Detection Test</h1>
          <div className="test-progress-indicator">
            <div className="progress-steps">
              {LIVENESS_TESTS.map((test, index) => (
                <div
                  key={test.id}
                  className={`progress-step ${
                    index < currentTestIndex
                      ? "completed"
                      : index === currentTestIndex
                      ? "active"
                      : "pending"
                  }`}
                >
                  <div className="step-circle">
                    {index < currentTestIndex ? (
                      <FiCheck />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className="step-label">{test.title}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-banner"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              variants={itemVariants}
            >
              <FiX />
              <span>{error}</span>
              <Button
                variant="ghost"
                size="small"
                onClick={() => setError(null)}
              >
                <FiX />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Test States */}
        <AnimatePresence mode="wait">
          {/* Complete State */}
          {testState === "complete" && (
            <motion.div
              key="complete"
              className="test-complete"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <div className="completion-header">
                <div
                  className={`result-icon ${
                    overallResult?.passed ? "success" : "failure"
                  }`}
                >
                  {overallResult?.passed ? <FiCheck /> : <FiX />}
                </div>
                <h2>
                  {overallResult?.passed
                    ? "Liveness Verified"
                    : "Verification Failed"}
                </h2>
                <p>
                  {overallResult?.passed
                    ? "You have successfully completed the liveness detection tests"
                    : "Some tests failed. Please try again or contact support."}
                </p>
              </div>

              <div className="results-summary">
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-value">
                      {overallResult?.passedTests}
                    </span>
                    <span className="stat-label">Tests Passed</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">
                      {overallResult?.totalTests}
                    </span>
                    <span className="stat-label">Total Tests</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">
                      {Math.round(overallResult?.successRate || 0)}%
                    </span>
                    <span className="stat-label">Success Rate</span>
                  </div>
                </div>

                <div className="test-details">
                  <h3>Test Results</h3>
                  <div className="results-list">
                    {testResults.map((result, index) => {
                      const test = LIVENESS_TESTS.find(
                        (t) => t.id === result.testId
                      );
                      return (
                        <div
                          key={result.testId}
                          className={`result-item ${
                            result.passed ? "passed" : "failed"
                          }`}
                        >
                          <test.icon />
                          <span>{test.title}</span>
                          <div className="result-status">
                            {result.passed ? <FiCheck /> : <FiX />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="completion-actions">
                <Button variant="secondary" onClick={resetTests}>
                  <FiRefreshCw />
                  Test Again
                </Button>
                <Button size="large">Continue</Button>
              </div>
            </motion.div>
          )}

          {/* Active Test States */}
          {testState !== "complete" && (
            <motion.div
              key="test"
              className="test-content"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {/* Current Test Info */}
              <div className="current-test-info">
                <div className="test-icon">
                  <currentTest.icon />
                </div>
                <h2>{currentTest.title}</h2>
                <p>{currentTest.description}</p>
              </div>

              {/* Camera Feed */}
              <div className="camera-section">
                <div className="camera-container">
                  <div className="camera-frame">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="camera-video"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        transform: "scaleX(-1)", // Mirror effect
                      }}
                    />
                    <div className="face-overlay">
                      {!faceData?.detected && (
                        <div className="no-face-detected">
                          <FiEyeOff />
                          <span>Position your face in the frame</span>
                        </div>
                      )}

                      {faceData?.detected && (
                        <div className="face-detected">
                          <div className="face-bounds" />
                          {testState === "testing" && (
                            <div className="test-indicator">
                              <span>{currentTest.instruction}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Test Progress */}
                {testState === "testing" && (
                  <div className="test-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${testProgress}%` }}
                      />
                    </div>
                    <span>{Math.round(testProgress)}%</span>
                  </div>
                )}
              </div>

              {/* Instructions and Controls */}
              <div className="test-controls">
                {/* Preparing State */}
                {testState === "preparing" && (
                  <div className="instruction-panel">
                    <h3>Get Ready</h3>
                    <p>
                      Please position your face clearly in the camera frame to
                      begin this test.
                    </p>
                    <div className="requirements">
                      <div
                        className={`requirement ${
                          faceData?.detected ? "met" : "unmet"
                        }`}
                      >
                        <FiEye />
                        <span>Face detected</span>
                        {faceData?.detected ? <FiCheck /> : <FiX />}
                      </div>
                    </div>
                  </div>
                )}

                {/* Ready State */}
                {testState === "ready" && (
                  <div className="instruction-panel">
                    <h3>Ready to Test</h3>
                    <p className="instruction">{currentTest.instruction}</p>
                    <Button size="large" onClick={handleStartTest}>
                      <FiPlay />
                      Start Test
                    </Button>
                    {retryCount > 0 && (
                      <p className="retry-notice">Attempt {retryCount + 1}</p>
                    )}
                  </div>
                )}

                {/* Countdown State */}
                {testState === "countdown" && (
                  <div className="countdown-display">
                    <div className="countdown-number">{countdown}</div>
                    <p>Get ready...</p>
                  </div>
                )}

                {/* Testing State */}
                {testState === "testing" && (
                  <div className="testing-display">
                    <h3>Testing in Progress</h3>
                    <p className="active-instruction">
                      {currentTest.instruction}
                    </p>
                    <div className="testing-indicator">
                      <LoadingSpinner size="small" />
                      <span>Analyzing...</span>
                    </div>
                    <div className="test-tips">
                      {currentTest.type === "blink" && (
                        <p className="tip">
                          💡 Blink naturally - close and open your eyes
                        </p>
                      )}
                      {currentTest.type === "smile" && (
                        <p className="tip">💡 Show a natural smile</p>
                      )}
                      {currentTest.type === "head_movement" && (
                        <p className="tip">
                          💡 Turn your head slowly{" "}
                          {currentTest.direction === "left" ? "left" : "right"}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Result State */}
                {testState === "result" && (
                  <div className="result-display">
                    {(() => {
                      const lastResult = testResults[testResults.length - 1];
                      return (
                        <div
                          className={`result-panel ${
                            lastResult?.passed ? "success" : "failure"
                          }`}
                        >
                          <div className="result-icon">
                            {lastResult?.passed ? <FiCheck /> : <FiX />}
                          </div>
                          <h3>
                            {lastResult?.passed ? "Test Passed" : "Test Failed"}
                          </h3>
                          <p>
                            {lastResult?.passed
                              ? "Great! Moving to the next test..."
                              : "Please try again or skip this test."}
                          </p>
                          {!lastResult?.passed && (
                            <div className="result-actions">
                              <Button variant="secondary" onClick={retryTest}>
                                Retry
                              </Button>
                              <Button onClick={nextTest}>Skip</Button>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default LivenessTestPage;
