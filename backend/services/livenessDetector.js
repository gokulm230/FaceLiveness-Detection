const tf = require('@tensorflow/tfjs-node');
const canvas = require('canvas');
const faceapi = require('face-api.js');
const sharp = require('sharp');
const Jimp = require('jimp');

// Configure face-api.js with node.js canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

class LivenessDetector {
    constructor() {
        this.isInitialized = false;
        this.models = {};
        this.confidenceThreshold = parseFloat(process.env.LIVENESS_THRESHOLD) || 0.7;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing liveness detector...');
            
            // Load face-api.js models
            await faceapi.nets.tinyFaceDetector.loadFromDisk('./models');
            await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
            await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
            await faceapi.nets.faceExpressionNet.loadFromDisk('./models');
            
            this.isInitialized = true;
            console.log('✅ Liveness detector initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize liveness detector:', error);
            throw error;
        }
    }

    async detectEyeBlink(imageBuffer) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const img = await this.bufferToCanvas(imageBuffer);
            const detections = await faceapi
                .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            if (detections.length === 0) {
                throw new Error('No face detected in the image');
            }

            const face = detections[0];
            const landmarks = face.landmarks;
            
            // Calculate Eye Aspect Ratio (EAR) for both eyes
            const leftEyeEAR = this.calculateEyeAspectRatio(landmarks.getLeftEye());
            const rightEyeEAR = this.calculateEyeAspectRatio(landmarks.getRightEye());
            const avgEAR = (leftEyeEAR + rightEyeEAR) / 2;

            // Threshold for blink detection (typically around 0.25)
            const blinkThreshold = 0.25;
            const isBlink = avgEAR < blinkThreshold;
            const confidence = isBlink ? Math.max(0, (blinkThreshold - avgEAR) / blinkThreshold) : avgEAR;

            return {
                isLive: isBlink && confidence > this.confidenceThreshold,
                confidence: confidence,
                eyeStates: {
                    leftEyeEAR: leftEyeEAR,
                    rightEyeEAR: rightEyeEAR,
                    avgEAR: avgEAR,
                    isBlink: isBlink
                }
            };
        } catch (error) {
            console.error('Eye blink detection error:', error);
            throw error;
        }
    }

    async detectSmile(imageBuffer) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const img = await this.bufferToCanvas(imageBuffer);
            const detections = await faceapi
                .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            if (detections.length === 0) {
                throw new Error('No face detected in the image');
            }

            const face = detections[0];
            const expressions = face.expressions;
            const smileIntensity = expressions.happy;

            // Smile threshold
            const smileThreshold = 0.6;
            const isSmiling = smileIntensity > smileThreshold;
            const confidence = isSmiling ? smileIntensity : (1 - smileIntensity);

            return {
                isLive: isSmiling && confidence > this.confidenceThreshold,
                confidence: confidence,
                smileIntensity: smileIntensity,
                expressions: expressions
            };
        } catch (error) {
            console.error('Smile detection error:', error);
            throw error;
        }
    }

    async detectHeadMovement(imageBuffers) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const movements = [];
            let previousLandmarks = null;

            for (let i = 0; i < imageBuffers.length; i++) {
                const img = await this.bufferToCanvas(imageBuffers[i]);
                const detections = await faceapi
                    .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
                    .withFaceLandmarks();

                if (detections.length === 0) {
                    continue;
                }

                const currentLandmarks = detections[0].landmarks;

                if (previousLandmarks) {
                    const movement = this.calculateHeadMovement(previousLandmarks, currentLandmarks);
                    movements.push(movement);
                }

                previousLandmarks = currentLandmarks;
            }

            if (movements.length === 0) {
                throw new Error('Insufficient face detections for movement analysis');
            }

            // Analyze movement patterns
            const totalMovement = movements.reduce((sum, mov) => sum + mov.magnitude, 0);
            const avgMovement = totalMovement / movements.length;
            const movementVariance = this.calculateVariance(movements.map(m => m.magnitude));
            
            // Determine if movement indicates liveness
            const movementThreshold = 5; // pixels
            const varianceThreshold = 2;
            const isLive = avgMovement > movementThreshold && movementVariance > varianceThreshold;
            const confidence = Math.min(1, (avgMovement + movementVariance) / 10);

            return {
                isLive: isLive && confidence > this.confidenceThreshold,
                confidence: confidence,
                movements: movements,
                averageMovement: avgMovement,
                movementVariance: movementVariance
            };
        } catch (error) {
            console.error('Head movement detection error:', error);
            throw error;
        }
    }

    async analyzeTexture(imageBuffer) {
        try {
            // Convert to grayscale and analyze texture patterns
            const image = await sharp(imageBuffer)
                .grayscale()
                .resize(224, 224)
                .raw()
                .toBuffer();

            const textureFeatures = await this.extractTextureFeatures(image);
            const spoofingScore = await this.detectSpoofingPatterns(textureFeatures);
            
            const isLive = spoofingScore < 0.5; // Lower score means more likely to be live
            const confidence = isLive ? (1 - spoofingScore) : spoofingScore;

            return {
                isLive: isLive && confidence > this.confidenceThreshold,
                confidence: confidence,
                textureScore: spoofingScore,
                spoofingIndicators: textureFeatures.indicators
            };
        } catch (error) {
            console.error('Texture analysis error:', error);
            throw error;
        }
    }

    async comprehensiveLivenessCheck(imageBuffers) {
        try {
            const checks = {
                eyeBlink: null,
                smile: null,
                headMovement: null,
                texture: null
            };

            // Perform individual checks
            if (imageBuffers.length >= 1) {
                try {
                    checks.texture = await this.analyzeTexture(imageBuffers[0]);
                } catch (error) {
                    console.warn('Texture analysis failed:', error.message);
                }
            }

            if (imageBuffers.length >= 2) {
                try {
                    checks.eyeBlink = await this.detectEyeBlink(imageBuffers[0]);
                    checks.smile = await this.detectSmile(imageBuffers[1]);
                } catch (error) {
                    console.warn('Expression analysis failed:', error.message);
                }
            }

            if (imageBuffers.length >= 3) {
                try {
                    checks.headMovement = await this.detectHeadMovement(imageBuffers.slice(0, 3));
                } catch (error) {
                    console.warn('Head movement analysis failed:', error.message);
                }
            }

            // Calculate overall confidence
            const validChecks = Object.values(checks).filter(check => check !== null);
            if (validChecks.length === 0) {
                throw new Error('No valid liveness checks could be performed');
            }

            const overallConfidence = validChecks.reduce((sum, check) => sum + check.confidence, 0) / validChecks.length;
            const liveChecks = validChecks.filter(check => check.isLive).length;
            const isLive = liveChecks >= Math.ceil(validChecks.length / 2); // Majority vote

            return {
                isLive: isLive && overallConfidence > this.confidenceThreshold,
                overallConfidence: overallConfidence,
                checks: checks,
                recommendation: this.generateRecommendation(checks, isLive, overallConfidence)
            };
        } catch (error) {
            console.error('Comprehensive liveness check error:', error);
            throw error;
        }
    }

    async realTimeLivenessCheck(frameBuffer) {
        try {
            // Lightweight checks for real-time processing
            const img = await this.bufferToCanvas(frameBuffer);
            const detections = await faceapi
                .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions();

            if (detections.length === 0) {
                return {
                    isLive: false,
                    confidence: 0,
                    checks: { faceDetected: false }
                };
            }

            const face = detections[0];
            const landmarks = face.landmarks;
            const expressions = face.expressions;

            // Quick liveness indicators
            const eyeOpenness = this.calculateEyeOpenness(landmarks);
            const faceAngle = this.calculateFaceAngle(landmarks);
            const expressionVariation = this.calculateExpressionVariation(expressions);

            const livenessScore = (eyeOpenness + expressionVariation + (1 - Math.abs(faceAngle) / 45)) / 3;
            const isLive = livenessScore > 0.5;

            return {
                isLive: isLive,
                confidence: livenessScore,
                checks: {
                    faceDetected: true,
                    eyeOpenness: eyeOpenness,
                    faceAngle: faceAngle,
                    expressionVariation: expressionVariation
                }
            };
        } catch (error) {
            console.error('Real-time liveness check error:', error);
            throw error;
        }
    }

    // Helper methods
    async bufferToCanvas(buffer) {
        const img = new Image();
        img.src = buffer;
        return img;
    }

    calculateEyeAspectRatio(eyePoints) {
        // EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
        const p1 = eyePoints[0];
        const p2 = eyePoints[1];
        const p3 = eyePoints[2];
        const p4 = eyePoints[3];
        const p5 = eyePoints[4];
        const p6 = eyePoints[5];

        const numerator = this.euclideanDistance(p2, p6) + this.euclideanDistance(p3, p5);
        const denominator = 2 * this.euclideanDistance(p1, p4);

        return numerator / denominator;
    }

    calculateHeadMovement(landmarks1, landmarks2) {
        const nose1 = landmarks1.getNose()[3]; // Nose tip
        const nose2 = landmarks2.getNose()[3];

        const dx = nose2.x - nose1.x;
        const dy = nose2.y - nose1.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);

        return {
            dx: dx,
            dy: dy,
            magnitude: magnitude,
            angle: Math.atan2(dy, dx) * (180 / Math.PI)
        };
    }

    async extractTextureFeatures(imageBuffer) {
        // Simple texture analysis using statistical measures
        const pixels = new Uint8Array(imageBuffer);
        const mean = pixels.reduce((sum, val) => sum + val, 0) / pixels.length;
        
        let variance = 0;
        let entropy = 0;
        const histogram = new Array(256).fill(0);
        
        for (let i = 0; i < pixels.length; i++) {
            const pixel = pixels[i];
            variance += Math.pow(pixel - mean, 2);
            histogram[pixel]++;
        }
        
        variance /= pixels.length;
        const stdDev = Math.sqrt(variance);
        
        // Calculate entropy
        for (let i = 0; i < histogram.length; i++) {
            if (histogram[i] > 0) {
                const p = histogram[i] / pixels.length;
                entropy -= p * Math.log2(p);
            }
        }

        return {
            mean: mean,
            variance: variance,
            stdDev: stdDev,
            entropy: entropy,
            indicators: {
                lowVariance: variance < 100,
                highUniformity: entropy < 6,
                suspiciousPattern: stdDev < 10
            }
        };
    }

    async detectSpoofingPatterns(textureFeatures) {
        // Simple spoofing detection based on texture uniformity
        let spoofingScore = 0;
        
        // Low variance indicates flat surface (screen/photo)
        if (textureFeatures.variance < 100) spoofingScore += 0.3;
        
        // Low entropy indicates repetitive patterns
        if (textureFeatures.entropy < 6) spoofingScore += 0.3;
        
        // Low standard deviation indicates smooth surface
        if (textureFeatures.stdDev < 10) spoofingScore += 0.4;
        
        return Math.min(1, spoofingScore);
    }

    calculateEyeOpenness(landmarks) {
        const leftEyeEAR = this.calculateEyeAspectRatio(landmarks.getLeftEye());
        const rightEyeEAR = this.calculateEyeAspectRatio(landmarks.getRightEye());
        return (leftEyeEAR + rightEyeEAR) / 2;
    }

    calculateFaceAngle(landmarks) {
        const leftEye = landmarks.getLeftEye()[0];
        const rightEye = landmarks.getRightEye()[3];
        const angle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
        return angle;
    }

    calculateExpressionVariation(expressions) {
        const values = Object.values(expressions);
        const max = Math.max(...values);
        const min = Math.min(...values);
        return max - min;
    }

    calculateVariance(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance;
    }

    euclideanDistance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    generateRecommendation(checks, isLive, confidence) {
        if (isLive && confidence > 0.8) {
            return "High confidence liveness detected. Authentication can proceed.";
        } else if (isLive && confidence > 0.6) {
            return "Moderate confidence liveness detected. Consider additional verification.";
        } else {
            return "Low confidence or potential spoofing detected. Additional verification required.";
        }
    }
}

module.exports = LivenessDetector;
