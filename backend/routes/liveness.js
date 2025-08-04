const express = require('express');
const router = express.Router();
const multer = require('multer');
const faceDetector = require('../services/simpleFaceDetector');
const { validateImageData } = require('../utils/simpleValidation');

const upload = multer({ storage: multer.memoryStorage() });

// Initialize the liveness detector
(async () => {
    try {
        await faceDetector.initialize();
        console.log('✅ Liveness detector initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize liveness detector:', error);
    }
})();

// Active liveness detection - eye blink detection
router.post('/detect-blink', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image provided'
            });
        }

        const result = await faceDetector.detectLiveness(req.file.buffer);
        
        res.json({
            success: true,
            data: {
                isLive: result.isLive,
                confidence: result.confidence,
                eyeStates: result.eyeStates,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Eye blink detection error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to detect eye blink',
            message: error.message
        });
    }
});

// Active liveness detection - smile detection
router.post('/detect-smile', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image provided'
            });
        }

        const result = await faceDetector.detectLiveness(req.file.buffer);
        
        res.json({
            success: true,
            data: {
                isLive: result.isLive,
                confidence: result.confidence,
                smileIntensity: result.smileIntensity,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Smile detection error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to detect smile',
            message: error.message
        });
    }
});

// Active liveness detection - head movement
router.post('/detect-head-movement', upload.array('images', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length < 2) {
            return res.status(400).json({
                success: false,
                error: 'At least 2 images required for head movement detection'
            });
        }

        const imageBuffers = req.files.map(file => file.buffer);
        const result = await faceDetector.detectLiveness(imageBuffers[0]);
        
        res.json({
            success: true,
            data: {
                isLive: result.isLive,
                confidence: result.confidence,
                movements: result.movements,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Head movement detection error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to detect head movement',
            message: error.message
        });
    }
});

// Passive liveness detection - texture analysis
router.post('/detect-texture', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image provided'
            });
        }

        const result = await faceDetector.detectLiveness(req.file.buffer);
        
        res.json({
            success: true,
            data: {
                isLive: result.isLive,
                confidence: result.confidence,
                textureScore: result.textureScore,
                spoofingIndicators: result.spoofingIndicators,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Texture analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze texture',
            message: error.message
        });
    }
});

// Comprehensive liveness detection
router.post('/comprehensive-check', upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No images provided'
            });
        }

        const imageBuffers = req.files.map(file => file.buffer);
        const result = await faceDetector.detectLiveness(imageBuffers[0]);
        
        res.json({
            success: true,
            data: {
                isLive: result.isLive,
                overallConfidence: result.overallConfidence,
                checks: result.checks,
                recommendation: result.recommendation,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Comprehensive liveness check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform comprehensive liveness check',
            message: error.message
        });
    }
});

// Real-time liveness detection for video frames
router.post('/real-time-check', async (req, res) => {
    try {
        const { frameData } = req.body;
        
        if (!frameData) {
            return res.status(400).json({
                success: false,
                error: 'No frame data provided'
            });
        }

        // Convert base64 to buffer
        const imageBuffer = Buffer.from(frameData.split(',')[1], 'base64');
        const result = await faceDetector.detectLiveness(imageBuffer);
        
        res.json({
            success: true,
            data: {
                isLive: result.isLive,
                confidence: result.confidence,
                checks: result.checks,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Real-time liveness check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to perform real-time liveness check',
            message: error.message
        });
    }
});

module.exports = router;
