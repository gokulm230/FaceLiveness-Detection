const faceDetector = require('./simpleFaceDetector');
const { v4: uuidv4 } = require('uuid');

class AuthService {
    constructor() {
        // Use the shared face detector instance
        this.sessions = new Map(); // In production, use Redis or database
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing auth service...');
            await faceDetector.initialize();
            this.isInitialized = true;
            console.log('✅ Auth service initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize auth service:', error);
            throw error;
        }
    }

    async createSession(sessionId, aadhaarNumber) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        // Generate random challenge type
        const challengeTypes = ['blink', 'smile', 'head_movement', 'comprehensive'];
        const challengeType = challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

        const session = {
            sessionId: sessionId,
            aadhaarNumber: aadhaarNumber,
            challengeType: challengeType,
            status: 'created',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            steps: {
                livenessVerified: false,
                faceAuthenticated: false
            },
            attempts: {
                liveness: 0,
                authentication: 0
            },
            maxAttempts: 3,
            instructions: this.generateInstructions(challengeType)
        };

        this.sessions.set(sessionId, session);
        
        // Clean up expired sessions
        this.cleanupExpiredSessions();

        return session;
    }

    async verifyLiveness(sessionId, imageBuffers) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            throw new Error('Session not found');
        }

        if (session.expiresAt < new Date()) {
            this.sessions.delete(sessionId);
            throw new Error('Session expired');
        }

        if (session.attempts.liveness >= session.maxAttempts) {
            throw new Error('Maximum liveness verification attempts exceeded');
        }

        session.attempts.liveness++;

        try {
            let livenessResult;

            switch (session.challengeType) {
                case 'blink':
                    if (imageBuffers.length < 1) {
                        throw new Error('At least 1 image required for blink detection');
                    }
                    livenessResult = await faceDetector.detectLiveness(imageBuffers[0]);
                    break;

                case 'smile':
                    if (imageBuffers.length < 1) {
                        throw new Error('At least 1 image required for smile detection');
                    }
                    livenessResult = await faceDetector.detectLiveness(imageBuffers[0]);
                    break;

                case 'head_movement':
                    if (imageBuffers.length < 3) {
                        throw new Error('At least 3 images required for head movement detection');
                    }
                    livenessResult = await faceDetector.detectLiveness(imageBuffers[0]);
                    break;

                case 'comprehensive':
                    livenessResult = await faceDetector.detectLiveness(imageBuffers[0]);
                    break;

                default:
                    throw new Error('Invalid challenge type');
            }

            session.steps.livenessVerified = livenessResult.isLive;
            session.livenessResult = livenessResult;
            session.status = livenessResult.isLive ? 'liveness_verified' : 'liveness_failed';

            this.sessions.set(sessionId, session);

            return {
                sessionId: sessionId,
                livenessVerified: livenessResult.isLive,
                confidence: livenessResult.confidence,
                nextStep: livenessResult.isLive ? 'face_authentication' : 'retry_liveness',
                attemptsRemaining: session.maxAttempts - session.attempts.liveness,
                result: livenessResult
            };

        } catch (error) {
            console.error('Liveness verification error:', error);
            session.status = 'liveness_error';
            this.sessions.set(sessionId, session);
            throw error;
        }
    }

    async completeAuthentication(sessionId, referenceImageBuffer) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            throw new Error('Session not found');
        }

        if (session.expiresAt < new Date()) {
            this.sessions.delete(sessionId);
            throw new Error('Session expired');
        }

        if (!session.steps.livenessVerified) {
            throw new Error('Liveness verification required before authentication');
        }

        if (session.attempts.authentication >= session.maxAttempts) {
            throw new Error('Maximum authentication attempts exceeded');
        }

        session.attempts.authentication++;

        try {
            // In a real implementation, you would compare against stored Aadhaar biometric data
            // For this demo, we'll simulate the comparison
            // For hackathon demo, simulate face quality analysis
            const faceQuality = {
                overall: 0.85 + Math.random() * 0.14,
                sharpness: 0.8 + Math.random() * 0.19,
                brightness: 0.7 + Math.random() * 0.29,
                frontal: true
            };
            
            // Simulate authentication result based on face quality and liveness confidence
            const authenticationScore = (faceQuality.qualityScore + session.livenessResult.confidence) / 2;
            const isAuthenticated = authenticationScore > 0.7;

            session.steps.faceAuthenticated = isAuthenticated;
            session.authenticationResult = {
                score: authenticationScore,
                faceQuality: faceQuality,
                timestamp: new Date()
            };

            if (isAuthenticated) {
                session.status = 'authenticated';
                session.authToken = this.generateAuthToken(sessionId);
                session.validUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            } else {
                session.status = 'authentication_failed';
            }

            this.sessions.set(sessionId, session);

            return {
                sessionId: sessionId,
                authenticated: isAuthenticated,
                confidence: authenticationScore,
                authToken: session.authToken || null,
                validUntil: session.validUntil || null,
                attemptsRemaining: session.maxAttempts - session.attempts.authentication,
                faceQuality: faceQuality
            };

        } catch (error) {
            console.error('Authentication completion error:', error);
            session.status = 'authentication_error';
            this.sessions.set(sessionId, session);
            throw error;
        }
    }

    async getSessionStatus(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return null;
        }

        // Remove sensitive information
        const publicSession = {
            sessionId: session.sessionId,
            status: session.status,
            challengeType: session.challengeType,
            instructions: session.instructions,
            steps: session.steps,
            attempts: session.attempts,
            maxAttempts: session.maxAttempts,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            validUntil: session.validUntil || null
        };

        return publicSession;
    }

    async endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (session) {
            session.status = 'ended';
            session.endedAt = new Date();
            // In production, you might want to log this to audit trail
            this.sessions.delete(sessionId);
        }
    }

    generateInstructions(challengeType) {
        const instructions = {
            'blink': {
                title: 'Eye Blink Challenge',
                description: 'Please blink your eyes naturally while looking at the camera',
                steps: [
                    'Position your face clearly in the camera frame',
                    'Look directly at the camera',
                    'Blink your eyes naturally',
                    'Keep your head still during the process'
                ]
            },
            'smile': {
                title: 'Smile Challenge',
                description: 'Please smile naturally while looking at the camera',
                steps: [
                    'Position your face clearly in the camera frame',
                    'Look directly at the camera',
                    'Smile naturally',
                    'Hold the smile for a moment'
                ]
            },
            'head_movement': {
                title: 'Head Movement Challenge',
                description: 'Please move your head slightly while looking at the camera',
                steps: [
                    'Position your face clearly in the camera frame',
                    'Look directly at the camera',
                    'Move your head slightly left and right',
                    'Keep movements natural and gentle'
                ]
            },
            'comprehensive': {
                title: 'Comprehensive Liveness Check',
                description: 'Please perform natural movements while looking at the camera',
                steps: [
                    'Position your face clearly in the camera frame',
                    'Look directly at the camera',
                    'Blink naturally',
                    'Smile briefly',
                    'Make slight head movements'
                ]
            }
        };

        return instructions[challengeType] || instructions['comprehensive'];
    }

    generateAuthToken(sessionId) {
        // In production, use proper JWT or similar secure token
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2);
        return `auth_${sessionId}_${timestamp}_${randomString}`;
    }

    cleanupExpiredSessions() {
        const now = new Date();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.expiresAt < now) {
                this.sessions.delete(sessionId);
            }
        }
    }

    // Utility method to get session statistics (for monitoring)
    getSessionStats() {
        const now = new Date();
        const stats = {
            total: this.sessions.size,
            active: 0,
            expired: 0,
            authenticated: 0,
            failed: 0
        };

        for (const session of this.sessions.values()) {
            if (session.expiresAt < now) {
                stats.expired++;
            } else {
                stats.active++;
            }

            if (session.status === 'authenticated') {
                stats.authenticated++;
            } else if (session.status.includes('failed')) {
                stats.failed++;
            }
        }

        return stats;
    }
}

module.exports = AuthService;
