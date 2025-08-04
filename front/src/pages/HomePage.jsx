import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Eye,
  CheckCircle,
  ArrowRight,
  Scan,
  Lock,
  Zap,
} from "lucide-react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [livenessLoading, setLivenessLoading] = useState(false); // Add this state
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);

  // 3D Scene Setup
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 400 / 300, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(400, 300);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Create realistic 3D face structure
    const faceGroup = new THREE.Group();

    // Create face mesh using more detailed geometry
    const createFaceGeometry = () => {
      const geometry = new THREE.BufferGeometry();

      // Define face vertices (simplified human face structure)
      const vertices = new Float32Array([
        // Face outline
        0,
        1.2,
        0, // Top of head
        -0.8,
        0.8,
        0.3, // Left temple
        0.8,
        0.8,
        0.3, // Right temple
        -0.6,
        0.4,
        0.5, // Left cheek upper
        0.6,
        0.4,
        0.5, // Right cheek upper
        -0.7,
        0,
        0.4, // Left cheek mid
        0.7,
        0,
        0.4, // Right cheek mid
        -0.5,
        -0.4,
        0.3, // Left jaw
        0.5,
        -0.4,
        0.3, // Right jaw
        0,
        -0.8,
        0.2, // Chin

        // Eye area
        -0.3,
        0.2,
        0.6, // Left eye inner
        -0.15,
        0.25,
        0.65, // Left eye top
        -0.45,
        0.15,
        0.55, // Left eye outer
        0.3,
        0.2,
        0.6, // Right eye inner
        0.15,
        0.25,
        0.65, // Right eye top
        0.45,
        0.15,
        0.55, // Right eye outer

        // Nose
        0,
        0.1,
        0.7, // Nose bridge
        -0.1,
        -0.1,
        0.6, // Left nostril
        0.1,
        -0.1,
        0.6, // Right nostril
        0,
        -0.15,
        0.55, // Nose tip

        // Mouth
        -0.2,
        -0.35,
        0.4, // Left mouth corner
        0,
        -0.3,
        0.45, // Mouth center
        0.2,
        -0.35,
        0.4, // Right mouth corner
      ]);

      // Define face indices for triangles
      const indices = [
        // Face outline triangles
        0, 1, 3, 0, 3, 4, 0, 4, 2, 1, 5, 3, 3, 5, 6, 3, 6, 4, 5, 7, 6, 6, 7, 8,
        6, 8, 4, 7, 9, 8, 8, 9, 4,

        // Eye areas
        10, 11, 12, 13, 14, 15,

        // Nose
        16, 17, 19, 16, 19, 18,

        // Mouth
        20, 21, 22,
      ];

      geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      return geometry;
    };

    // Main face mesh
    const faceGeometry = createFaceGeometry();
    const faceMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdbac, // Skin tone
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const faceMesh = new THREE.Mesh(faceGeometry, faceMaterial);
    faceGroup.add(faceMesh);

    // Face wireframe overlay
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const wireframeMesh = new THREE.Mesh(faceGeometry, wireframeMaterial);
    faceGroup.add(wireframeMesh);

    // Eyes with more detail
    const eyeGeometry = new THREE.SphereGeometry(0.08, 12, 8);
    const eyeballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const irisMaterial = new THREE.MeshBasicMaterial({ color: 0x4a90e2 });
    const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    // Left eye
    const leftEyeball = new THREE.Mesh(eyeGeometry, eyeballMaterial);
    leftEyeball.position.set(-0.3, 0.2, 0.6);
    faceGroup.add(leftEyeball);

    const leftIris = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 8),
      irisMaterial
    );
    leftIris.position.set(-0.3, 0.2, 0.68);
    faceGroup.add(leftIris);

    const leftPupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 6),
      pupilMaterial
    );
    leftPupil.position.set(-0.3, 0.2, 0.7);
    faceGroup.add(leftPupil);

    // Right eye
    const rightEyeball = new THREE.Mesh(eyeGeometry, eyeballMaterial);
    rightEyeball.position.set(0.3, 0.2, 0.6);
    faceGroup.add(rightEyeball);

    const rightIris = new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 8),
      irisMaterial
    );
    rightIris.position.set(0.3, 0.2, 0.68);
    faceGroup.add(rightIris);

    const rightPupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 6),
      pupilMaterial
    );
    rightPupil.position.set(0.3, 0.2, 0.7);
    faceGroup.add(rightPupil);

    // Facial feature detection points
    const createDetectionPoints = () => {
      const pointsGroup = new THREE.Group();

      // Key facial landmarks
      const landmarks = [
        [-0.3, 0.2, 0.7], // Left eye
        [0.3, 0.2, 0.7], // Right eye
        [0, -0.15, 0.6], // Nose tip
        [-0.2, -0.35, 0.45], // Left mouth corner
        [0.2, -0.35, 0.45], // Right mouth corner
        [0, -0.3, 0.5], // Mouth center
        [-0.6, 0.4, 0.5], // Left cheek
        [0.6, 0.4, 0.5], // Right cheek
        [0, -0.8, 0.3], // Chin
        [0, 0.8, 0.4], // Forehead
      ];

      landmarks.forEach((pos, i) => {
        const pointGeometry = new THREE.SphereGeometry(0.02, 8, 6);
        const pointMaterial = new THREE.MeshBasicMaterial({
          color: 0x10b981,
          transparent: true,
          opacity: 0.8,
        });
        const point = new THREE.Mesh(pointGeometry, pointMaterial);
        point.position.set(pos[0], pos[1], pos[2]);
        pointsGroup.add(point);
      });

      return pointsGroup;
    };

    const detectionPoints = createDetectionPoints();
    faceGroup.add(detectionPoints);

    scene.add(faceGroup);

    // Create scanning effect
    const scanGeometry = new THREE.RingGeometry(0.5, 1.5, 32);
    const scanMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const scanRing = new THREE.Mesh(scanGeometry, scanMaterial);
    scene.add(scanRing);

    // Add particles
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 100;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x6366f1,
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    camera.position.z = 4;
    sceneRef.current = {
      scene,
      camera,
      renderer,
      faceGroup,
      scanRing,
      particles,
    };

    // Animation loop
    const animate = () => {
      if (!sceneRef.current) return;

      const { faceGroup, scanRing, particles } = sceneRef.current;

      // Gentle face rotation
      faceGroup.rotation.y += 0.005;
      faceGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.05;

      // Animate detection points
      const detectionPoints = faceGroup.children[faceGroup.children.length - 1];
      if (detectionPoints && detectionPoints.children) {
        detectionPoints.children.forEach((point, i) => {
          const time = Date.now() * 0.003 + i * 0.5;
          point.scale.setScalar(1 + Math.sin(time) * 0.3);
          point.material.opacity = 0.6 + Math.sin(time * 2) * 0.4;
        });
      }

      // Eye blinking animation
      const leftEyeball = faceGroup.children[2];
      const rightEyeball = faceGroup.children[5];

      if (leftEyeball && rightEyeball) {
        const blinkTime = Date.now() * 0.002;
        const shouldBlink = Math.sin(blinkTime) > 0.98;
        const blinkScale = shouldBlink ? 0.1 : 1;

        leftEyeball.scale.y = blinkScale;
        rightEyeball.scale.y = blinkScale;
      }

      // Scanning ring animation
      scanRing.rotation.z += 0.02;
      scanRing.scale.setScalar(1.5 + Math.sin(Date.now() * 0.003) * 0.2);

      // Particle system
      particles.rotation.y += 0.002;

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
  }, []);

  const handleStartAuthentication = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
      navigate("/authenticate");
      console.log("Authentication started");
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Updated function with liveness detection logic
  const handleTestLivenessPage = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🔍 Test Liveness button clicked!");
    setLivenessLoading(true);

    try {
      // Step 1: Initialize liveness detection
      console.log("🚀 Initializing liveness detection...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 2: Simulate liveness checks
      console.log("👁️ Checking eye blink detection...");
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("😊 Checking smile detection...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("🔄 Checking head movement...");
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Step 3: Face verification
      console.log("🎯 Performing face verification...");
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step 4: Liveness passed - redirect to schemes
      console.log("✅ Liveness detection completed successfully!");
      console.log("🚀 Navigating to /aadhaar-scheme");
      
      navigate("/aadhaar-scheme");
      console.log("✅ Navigation command executed");

    } catch (error) {
      console.error("❌ Liveness detection error:", error);
      alert("Liveness detection failed. Please try again.");
    } finally {
      setLivenessLoading(false);
    }
  };

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Advanced Security",
      description:
        "Multi-layer face liveness detection prevents spoofing attacks using photos, videos, or masks.",
      gradient: "from-blue-500 to-purple-600",
    },
    {
      icon: <Scan className="w-8 h-8" />,
      title: "Real-time Detection",
      description:
        "Instant face detection and liveness verification with sub-500ms response time.",
      gradient: "from-green-500 to-teal-600",
    },
    {
      icon: <Lock className="w-8 h-8" />,
      title: "UIDAI Compliant",
      description:
        "Fully compliant with UIDAI security standards and guidelines for biometric authentication.",
      gradient: "from-purple-500 to-pink-600",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Enter Aadhaar Number",
      description:
        "Provide your 12-digit Aadhaar number to start the authentication process.",
      icon: <Eye className="w-6 h-6" />,
    },
    {
      number: "02",
      title: "Liveness Detection",
      description:
        "Follow on-screen instructions for eye blink, smile, or head movement detection.",
      icon: <Scan className="w-6 h-6" />,
    },
    {
      number: "03",
      title: "Face Authentication",
      description:
        "Your face is verified against secure biometric data for final authentication.",
      icon: <CheckCircle className="w-6 h-6" />,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Fixed alignment */}
      <header className="sticky z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center transform rotate-12 shrink-0">
                <span className="text-white font-bold text-xl transform -rotate-12">
                  X
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Xyndrix
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-50 rounded-full">
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-green-700 whitespace-nowrap">
                UIDAI Certified
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Better responsive layout */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_50%)]"></div>

        <div className="max-w-7xl mx-auto py-12 sm:py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 sm:px-4 py-2 bg-blue-50 rounded-full mx-auto lg:mx-0">
                <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-blue-700">
                  Next-Gen Biometric Authentication
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                <span className="block">Secure Face</span>
                <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                  Authentication
                </span>
                <span className="block text-gray-800">with Liveness</span>
              </h1>

              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Revolutionary biometric authentication powered by advanced AI.
                Experience military-grade security with seamless user experience
                in milliseconds.
              </p>

              {/* Buttons - Better responsive layout */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleStartAuthentication}
                  disabled={loading || livenessLoading}
                  className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 min-h-[52px] flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Initializing...</span>
                      </>
                    ) : (
                      <>
                        <span>Start Authentication</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>

                {/* Updated Test Liveness button with loading state */}
                <button
                  type="button"
                  onClick={handleTestLivenessPage}
                  disabled={loading || livenessLoading}
                  style={{ pointerEvents: "auto", zIndex: 10 }}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl sm:rounded-2xl font-semibold text-base sm:text-lg hover:border-gray-300 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 min-h-[52px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {livenessLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                      <span>Running Liveness...</span>
                    </div>
                  ) : (
                    "Test Liveness Detection"
                  )}
                </button>
              </div>

              {/* Stats - Better alignment */}
              <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 lg:pt-8 max-w-md mx-auto lg:max-w-none lg:mx-0">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                    99.9%
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Accuracy Rate
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                    &lt;500ms
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Response Time
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                    10M+
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">
                    Authentications
                  </div>
                </div>
              </div>
            </div>

            {/* Right 3D Demo - Better responsive sizing */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl w-full max-w-md lg:max-w-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl sm:rounded-3xl"></div>
                <div
                  ref={mountRef}
                  className="relative z-10 flex justify-center items-center h-64 sm:h-80"
                ></div>

                {/* Updated status indicator */}
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex items-center space-x-2 px-2 sm:px-3 py-1 sm:py-2 bg-green-100 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${livenessLoading ? 'bg-blue-500 animate-pulse' : 'bg-green-500 animate-pulse'}`}></div>
                  <span className="text-xs sm:text-sm font-medium text-green-700">
                    {livenessLoading ? 'Testing Liveness' : 'Live Detection'}
                  </span>
                </div>

                {/* Updated bottom status */}
                <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <div className={`w-3 h-3 rounded-full ${livenessLoading ? 'bg-blue-500 animate-pulse' : 'bg-blue-500 animate-pulse'}`}></div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          {livenessLoading ? 'Processing liveness tests...' : 'Scanning biometric data...'}
                        </span>
                      </div>
                      <span className={`text-xs sm:text-sm font-bold ${livenessLoading ? 'text-blue-600' : 'text-green-600'}`}>
                        {livenessLoading ? 'Testing' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Better spacing */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              Why Choose Xyndrix?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of biometric authentication with our
              cutting-edge technology
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                <div
                  className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl sm:rounded-3xl blur-xl"
                  style={{
                    background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  }}
                ></div>
                <div className="relative bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                  <div
                    className={`inline-flex p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r ${feature.gradient} text-white mb-4 sm:mb-6`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Better mobile layout */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-blue-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              How It Works
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, secure, and lightning-fast authentication in three steps
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-6 lg:p-8 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="text-4xl sm:text-6xl font-bold text-gray-200">
                      {step.number}
                    </div>
                    <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl text-white">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector - hide on mobile */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Better responsive text */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
            Ready for the Future of Authentication?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 sm:mb-10 leading-relaxed">
            Join millions who trust Xyndrix for secure, seamless biometric
            authentication
          </p>

          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
            <button
              onClick={handleStartAuthentication}
              disabled={loading || livenessLoading}
              className="group px-8 sm:px-10 py-4 sm:py-5 bg-white text-gray-800 rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 min-h-[56px] flex items-center justify-center"
            >
              <div className="flex items-center justify-center space-x-3">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                    <span>Getting Ready...</span>
                  </>
                ) : (
                  <>
                    <span>Experience Xyndrix Now</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>

            <button 
              onClick={handleTestLivenessPage}
              disabled={loading || livenessLoading}
              className="px-8 sm:px-10 py-4 sm:py-5 border-2 border-white text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg hover:bg-white hover:text-gray-800 transform hover:-translate-y-1 transition-all duration-300 min-h-[56px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {livenessLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Testing Liveness...</span>
                </div>
              ) : (
                "Test Liveness"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Footer - Better responsive layout */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-6 sm:mb-8">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center transform rotate-12">
              <span className="text-white font-bold text-xl sm:text-2xl transform -rotate-12">
                X
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold">Xyndrix</span>
          </div>
          <p className="text-center text-gray-400 text-sm sm:text-base">
            © 2024 Xyndrix. Securing the future with advanced biometric
            technology.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
