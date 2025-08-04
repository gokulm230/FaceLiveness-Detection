const express = require('express');
const router = express.Router();
const multer = require('multer');
const faceDetector = require('../services/simpleFaceDetector');
const { validateImageData } = require('../utils/simpleValidation');

const upload = multer({ storage: multer.memoryStorage() });

// Initialize the face detector
(async () => {
    try {
        await faceDetector.initialize();
        console.log('✅ Face detector initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize face detector:', error);
    }
})();

// Detect faces in image
router.post('/detect', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image provided'
            });
        }

        // Validate image format
        const validation = validateImageData(req.file.buffer);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Invalid image format',
                details: validation.errors
            });
        }

        console.log(`📸 Processing image: ${req.file.size} bytes, type: ${req.file.mimetype}`);
        
        const result = await faceDetector.detectFaces(req.file.buffer);
        
        res.json({
            success: true,
            data: {
                faces: result.faces,
                count: result.count,
                processing_time: result.processingTime,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Face detection error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to detect faces',
            message: error.message,
            fallback_used: true
        });
    }
});

// Extract face features for authentication
router.post('/extract-features', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image provided'
            });
        }

        const result = await faceDetector.extractFaceFeatures(req.file.buffer);
        
        res.json({
            success: true,
            data: {
                features: result.features,
                landmarks: result.landmarks,
                quality_score: result.qualityScore,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Feature extraction error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to extract face features',
            message: error.message
        });
    }
});

// Compare two faces for authentication
router.post('/compare', upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files.image1 || !req.files.image2) {
            return res.status(400).json({
                success: false,
                error: 'Two images required for comparison'
            });
        }

        const result = await faceDetector.compareFaces(
            req.files.image1[0].buffer,
            req.files.image2[0].buffer
        );
        
        res.json({
            success: true,
            data: {
                similarity: result.similarity,
                is_match: result.isMatch,
                confidence: result.confidence,
                threshold_used: result.threshold,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Face comparison error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to compare faces',
            message: error.message
        });
    }
});

// Analyze face quality
router.post('/analyze-quality', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No image provided'
            });
        }

        const result = await faceDetector.analyzeFaceQuality(req.file.buffer);
        
        res.json({
            success: true,
            data: {
                quality_score: result.qualityScore,
                brightness: result.brightness,
                sharpness: result.sharpness,
                pose: result.pose,
                recommendations: result.recommendations,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Face quality analysis error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze face quality',
            message: error.message
        });
    }
});

module.exports = router;
