const express = require('express');
const router = express.Router();
const multer = require('multer');
const AuthService = require('../services/authService');
const { v4: uuidv4 } = require('uuid');

const upload = multer({ storage: multer.memoryStorage() });
const authService = new AuthService();

// Initialize the auth service
(async () => {
    try {
        await authService.initialize();
        console.log('✅ Auth service initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize auth service:', error);
    }
})();

// Start authentication session
router.post('/start-session', async (req, res) => {
    try {
        const { aadhaarNumber } = req.body;
        
        if (!aadhaarNumber || aadhaarNumber.length !== 12) {
            return res.status(400).json({
                success: false,
                error: 'Valid 12-digit Aadhaar number required'
            });
        }

        const sessionId = uuidv4();
        const session = await authService.createSession(sessionId, aadhaarNumber);
        
        res.json({
            success: true,
            data: {
                sessionId: session.sessionId,
                challengeType: session.challengeType,
                instructions: session.instructions,
                expiresAt: session.expiresAt,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create authentication session',
            message: error.message
        });
    }
});

// Submit liveness proof
router.post('/submit-liveness', upload.array('images', 10), async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID required'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Images required for liveness verification'
            });
        }

        const imageBuffers = req.files.map(file => file.buffer);
        const result = await authService.verifyLiveness(sessionId, imageBuffers);
        
        res.json({
            success: true,
            data: {
                sessionId: result.sessionId,
                livenessVerified: result.livenessVerified,
                confidence: result.confidence,
                nextStep: result.nextStep,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Liveness verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to verify liveness',
            message: error.message
        });
    }
});

// Complete authentication
router.post('/complete', upload.single('referenceImage'), async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Reference image required for authentication'
            });
        }

        const result = await authService.completeAuthentication(sessionId, req.file.buffer);
        
        res.json({
            success: true,
            data: {
                sessionId: result.sessionId,
                authenticated: result.authenticated,
                confidence: result.confidence,
                authToken: result.authToken,
                validUntil: result.validUntil,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Authentication completion error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete authentication',
            message: error.message
        });
    }
});

// Get session status
router.get('/session/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await authService.getSessionStatus(sessionId);
        
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session not found'
            });
        }
        
        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        console.error('Session status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get session status',
            message: error.message
        });
    }
});

// End session
router.post('/end-session', async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                error: 'Session ID required'
            });
        }

        await authService.endSession(sessionId);
        
        res.json({
            success: true,
            message: 'Session ended successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Session end error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to end session',
            message: error.message
        });
    }
});

module.exports = router;
