const sharp = require('sharp');

const validateImageData = (imageBuffer, options = {}) => {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB
        minWidth = 200,
        minHeight = 200,
        maxWidth = 4000,
        maxHeight = 4000,
        allowedFormats = ['jpeg', 'jpg', 'png', 'webp']
    } = options;

    if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
        throw new Error('Invalid image data: Buffer required');
    }

    if (imageBuffer.length > maxSize) {
        throw new Error(`Image too large: Maximum size is ${maxSize / (1024 * 1024)}MB`);
    }

    return true;
};

const validateImageFormat = async (imageBuffer) => {
    try {
        const metadata = await sharp(imageBuffer).metadata();
        
        const allowedFormats = ['jpeg', 'png', 'webp'];
        if (!allowedFormats.includes(metadata.format)) {
            throw new Error(`Unsupported image format: ${metadata.format}. Allowed formats: ${allowedFormats.join(', ')}`);
        }

        if (metadata.width < 200 || metadata.height < 200) {
            throw new Error('Image too small: Minimum size is 200x200 pixels');
        }

        if (metadata.width > 4000 || metadata.height > 4000) {
            throw new Error('Image too large: Maximum size is 4000x4000 pixels');
        }

        return {
            valid: true,
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            channels: metadata.channels,
            hasAlpha: metadata.hasAlpha
        };
    } catch (error) {
        throw new Error(`Image validation failed: ${error.message}`);
    }
};

const validateAadhaarNumber = (aadhaarNumber) => {
    if (!aadhaarNumber || typeof aadhaarNumber !== 'string') {
        throw new Error('Aadhaar number must be a string');
    }

    // Remove spaces and hyphens
    const cleanNumber = aadhaarNumber.replace(/[\s-]/g, '');

    if (!/^\d{12}$/.test(cleanNumber)) {
        throw new Error('Aadhaar number must be exactly 12 digits');
    }

    // Validate using Verhoeff algorithm (basic check)
    if (!verifyVerhoeffChecksum(cleanNumber)) {
        throw new Error('Invalid Aadhaar number: Checksum verification failed');
    }

    return cleanNumber;
};

const verifyVerhoeffChecksum = (num) => {
    // Verhoeff algorithm implementation for Aadhaar validation
    const d = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];

    const p = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];

    const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

    let c = 0;
    const myArray = num.split('').reverse();

    for (let i = 0; i < myArray.length; i++) {
        c = d[c][p[((i + 1) % 8)][parseInt(myArray[i], 10)]];
    }

    return c === 0;
};

const validateSessionId = (sessionId) => {
    if (!sessionId || typeof sessionId !== 'string') {
        throw new Error('Session ID must be a string');
    }

    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
        throw new Error('Invalid session ID format');
    }

    return true;
};

const validateChallengeType = (challengeType) => {
    const validTypes = ['blink', 'smile', 'head_movement', 'comprehensive'];
    
    if (!challengeType || !validTypes.includes(challengeType)) {
        throw new Error(`Invalid challenge type. Must be one of: ${validTypes.join(', ')}`);
    }

    return true;
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') {
        return input;
    }

    // Remove potentially dangerous characters
    return input
        .replace(/[<>\"'%;()&+]/g, '')
        .trim()
        .substring(0, 1000); // Limit length
};

const validateFileUpload = (file, options = {}) => {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB
        allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp']
    } = options;

    if (!file) {
        throw new Error('No file provided');
    }

    if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
        throw new Error('Invalid file buffer');
    }

    if (file.size > maxSize) {
        throw new Error(`File too large: Maximum size is ${maxSize / (1024 * 1024)}MB`);
    }

    if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`);
    }

    return true;
};

const validateCoordinates = (x, y, width, height) => {
    if (typeof x !== 'number' || typeof y !== 'number' || 
        typeof width !== 'number' || typeof height !== 'number') {
        throw new Error('Coordinates must be numbers');
    }

    if (x < 0 || y < 0 || width <= 0 || height <= 0) {
        throw new Error('Invalid coordinates: All values must be positive');
    }

    return true;
};

const validateConfidenceScore = (score) => {
    if (typeof score !== 'number' || isNaN(score)) {
        throw new Error('Confidence score must be a number');
    }

    if (score < 0 || score > 1) {
        throw new Error('Confidence score must be between 0 and 1');
    }

    return true;
};

const normalizeImageBuffer = async (imageBuffer, options = {}) => {
    const {
        width = 224,
        height = 224,
        format = 'jpeg',
        quality = 85
    } = options;

    try {
        const normalizedBuffer = await sharp(imageBuffer)
            .resize(width, height, { fit: 'cover' })
            .toFormat(format, { quality })
            .toBuffer();

        return normalizedBuffer;
    } catch (error) {
        throw new Error(`Failed to normalize image: ${error.message}`);
    }
};

module.exports = {
    validateImageData,
    validateImageFormat,
    validateAadhaarNumber,
    validateSessionId,
    validateChallengeType,
    sanitizeInput,
    validateFileUpload,
    validateCoordinates,
    validateConfidenceScore,
    normalizeImageBuffer,
    verifyVerhoeffChecksum
};
