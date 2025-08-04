// Simple validation without native dependencies for hackathon demo

const validateImageData = (imageBuffer, options = {}) => {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB
        minWidth = 200,
        minHeight = 200,
        maxWidth = 4000,
        maxHeight = 4000,
        allowedFormats = ['jpeg', 'jpg', 'png', 'webp']
    } = options;

    try {
        // Basic validations
        if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
            return {
                isValid: false,
                error: 'Invalid image buffer'
            };
        }

        if (imageBuffer.length === 0) {
            return {
                isValid: false,
                error: 'Empty image buffer'
            };
        }

        if (imageBuffer.length > maxSize) {
            return {
                isValid: false,
                error: `Image size too large. Maximum allowed: ${maxSize / (1024 * 1024)}MB`
            };
        }

        // Simple format detection based on file signatures
        const format = detectImageFormat(imageBuffer);
        if (!format) {
            return {
                isValid: false,
                error: 'Unsupported image format'
            };
        }

        if (!allowedFormats.includes(format)) {
            return {
                isValid: false,
                error: `Unsupported format: ${format}. Allowed: ${allowedFormats.join(', ')}`
            };
        }

        // For hackathon demo, assume valid dimensions
        const dimensions = {
            width: 640,
            height: 480
        };

        return {
            isValid: true,
            metadata: {
                width: dimensions.width,
                height: dimensions.height,
                format,
                size: imageBuffer.length,
                channels: 3,
                hasAlpha: false,
                density: 72
            }
        };
    } catch (error) {
        return {
            isValid: false,
            error: `Validation error: ${error.message}`
        };
    }
};

const detectImageFormat = (buffer) => {
    // Check file signatures
    if (buffer.length < 4) return null;
    
    // JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
        return 'jpeg';
    }
    
    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'png';
    }
    
    // WebP
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
        return 'webp';
    }
    
    return null;
};

const validateFaceDetectionRequest = (req) => {
    const errors = [];

    // Check if file exists
    if (!req.file) {
        errors.push('No image file provided');
        return { isValid: false, errors };
    }

    // Validate file size
    if (req.file.size > 10 * 1024 * 1024) { // 10MB limit
        errors.push('File size too large (max 10MB)');
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(req.file.mimetype)) {
        errors.push('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const validateLivenessRequest = (req) => {
    const errors = [];

    // Check if file exists
    if (!req.file) {
        errors.push('No image file provided');
        return { isValid: false, errors };
    }

    // Validate file size
    if (req.file.size > 10 * 1024 * 1024) { // 10MB limit
        errors.push('File size too large (max 10MB)');
    }

    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(req.file.mimetype)) {
        errors.push('Invalid file type. Only JPEG, PNG, and WebP are allowed');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove potentially dangerous characters
    return input
        .replace(/[<>'"&]/g, '')
        .trim()
        .substring(0, 1000); // Limit length
};

const validateUserId = (userId) => {
    if (!userId || typeof userId !== 'string') {
        return { isValid: false, error: 'Invalid user ID' };
    }
    
    // Simple alphanumeric validation
    if (!/^[a-zA-Z0-9_-]+$/.test(userId) || userId.length > 50) {
        return { isValid: false, error: 'User ID must be alphanumeric and under 50 characters' };
    }
    
    return { isValid: true };
};

const validateSessionId = (sessionId) => {
    if (!sessionId || typeof sessionId !== 'string') {
        return { isValid: false, error: 'Invalid session ID' };
    }
    
    // UUID-like pattern validation
    if (!/^[a-f0-9-]{36}$/.test(sessionId)) {
        return { isValid: false, error: 'Session ID must be a valid UUID' };
    }
    
    return { isValid: true };
};

module.exports = {
    validateImageData,
    validateFaceDetectionRequest,
    validateLivenessRequest,
    sanitizeInput,
    validateUserId,
    validateSessionId,
    detectImageFormat
};
