/**
 * Device and browser compatibility utilities for face detection
 */

/**
 * Check if the current browser supports face detection requirements
 * @returns {Promise<Object>} Compatibility information
 */
export const checkBrowserCompatibility = async () => {
  const compatibility = {
    isCompatible: false,
    hasWebGL: false,
    hasGetUserMedia: false,
    hasWebAssembly: false,
    browser: getBrowserInfo(),
    issues: []
  };

  try {
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    compatibility.hasWebGL = !!gl;
    
    if (!compatibility.hasWebGL) {
      compatibility.issues.push('WebGL not supported - required for TensorFlow.js operations');
    }

    // Check getUserMedia support
    compatibility.hasGetUserMedia = !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getUserMedia
    );
    
    if (!compatibility.hasGetUserMedia) {
      compatibility.issues.push('Camera access not supported - getUserMedia API not available');
    }

    // Check WebAssembly support
    compatibility.hasWebAssembly = typeof WebAssembly === 'object' && 
                                   typeof WebAssembly.instantiate === 'function';
    
    if (!compatibility.hasWebAssembly) {
      compatibility.issues.push('WebAssembly not supported - may impact performance');
    }

    // Overall compatibility
    compatibility.isCompatible = 
      compatibility.hasWebGL && 
      compatibility.hasGetUserMedia;

    // Browser-specific checks
    if (compatibility.browser.name === 'Safari' && compatibility.browser.version < 14) {
      compatibility.issues.push('Safari version may have limited support - please update to v14+');
    }

    if (compatibility.browser.name === 'Firefox' && compatibility.browser.version < 85) {
      compatibility.issues.push('Firefox version may have limited support - please update to v85+');
    }

    if (compatibility.browser.name === 'Chrome' && compatibility.browser.version < 88) {
      compatibility.issues.push('Chrome version may have limited support - please update to v88+');
    }

  } catch (error) {
    console.error('Browser compatibility check failed:', error);
    compatibility.issues.push('Failed to perform compatibility check');
  }

  return compatibility;
};

/**
 * Get browser information
 * @returns {Object} Browser name and version
 */
export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  let browser = { name: 'Unknown', version: 0 };

  // Chrome
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    browser = { name: 'Chrome', version: match ? parseInt(match[1]) : 0 };
  }
  // Firefox
  else if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    browser = { name: 'Firefox', version: match ? parseInt(match[1]) : 0 };
  }
  // Safari
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    browser = { name: 'Safari', version: match ? parseInt(match[1]) : 0 };
  }
  // Edge
  else if (userAgent.includes('Edg')) {
    const match = userAgent.match(/Edg\/(\d+)/);
    browser = { name: 'Edge', version: match ? parseInt(match[1]) : 0 };
  }

  return browser;
};

/**
 * Check camera permission status
 * @returns {Promise<Object>} Permission information
 */
export const checkCameraPermission = async () => {
  const permission = {
    status: 'unknown',
    canRequest: false,
    error: null
  };

  try {
    // Check if Permissions API is available
    if (navigator.permissions && navigator.permissions.query) {
      const result = await navigator.permissions.query({ name: 'camera' });
      permission.status = result.state; // 'granted', 'denied', or 'prompt'
      permission.canRequest = result.state === 'prompt';
      
      // Listen for permission changes
      result.addEventListener('change', () => {
        console.log('Camera permission changed to:', result.state);
      });
    } else {
      // Fallback: Try to access camera directly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1, height: 1 } 
        });
        stream.getTracks().forEach(track => track.stop());
        permission.status = 'granted';
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          permission.status = 'denied';
        } else if (err.name === 'NotFoundError') {
          permission.status = 'unavailable';
          permission.error = 'No camera device found';
        } else {
          permission.status = 'unknown';
          permission.error = err.message;
        }
      }
    }
  } catch (error) {
    console.error('Permission check failed:', error);
    permission.error = error.message;
  }

  return permission;
};

/**
 * Request camera permission and return stream
 * @param {Object} constraints - Media constraints
 * @returns {Promise<MediaStream>} Camera stream
 */
export const requestCameraAccess = async (constraints = {}) => {
  const defaultConstraints = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30 },
      facingMode: 'user'
    },
    audio: false
  };

  const finalConstraints = {
    ...defaultConstraints,
    ...constraints
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(finalConstraints);
    return stream;
  } catch (error) {
    console.error('Camera access request failed:', error);
    
    // Provide user-friendly error messages
    let userMessage = 'Failed to access camera';
    
    switch (error.name) {
      case 'NotAllowedError':
        userMessage = 'Camera access was denied. Please enable camera permissions in your browser settings.';
        break;
      case 'NotFoundError':
        userMessage = 'No camera device was found. Please connect a camera and try again.';
        break;
      case 'NotReadableError':
        userMessage = 'Camera is already in use by another application. Please close other applications and try again.';
        break;
      case 'OverconstrainedError':
        userMessage = 'Camera does not support the required settings. Please try with a different camera.';
        break;
      case 'SecurityError':
        userMessage = 'Camera access is not allowed from this location. Please ensure you are on a secure (HTTPS) connection.';
        break;
      default:
        userMessage = `Camera error: ${error.message}`;
    }
    
    throw new Error(userMessage);
  }
};

/**
 * Get available camera devices
 * @returns {Promise<Array>} List of camera devices
 */
export const getCameraDevices = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Failed to enumerate camera devices:', error);
    return [];
  }
};

/**
 * Check if device has sufficient resources for face detection
 * @returns {Object} Performance information
 */
export const checkDevicePerformance = () => {
  const performance = {
    isHighPerformance: false,
    memoryAvailable: false,
    hardwareConcurrency: navigator.hardwareConcurrency || 1,
    recommendations: []
  };

  // Check CPU cores
  if (performance.hardwareConcurrency >= 4) {
    performance.isHighPerformance = true;
  } else if (performance.hardwareConcurrency < 2) {
    performance.recommendations.push('Device may experience slower face detection. Consider using a device with more CPU cores.');
  }

  // Check memory (if available)
  if (navigator.deviceMemory) {
    performance.memoryAvailable = navigator.deviceMemory >= 4; // 4GB+
    if (navigator.deviceMemory < 2) {
      performance.recommendations.push('Low memory detected. Face detection may be slower or less reliable.');
    }
  }

  // Check connection (for model loading)
  if (navigator.connection) {
    const connection = navigator.connection;
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      performance.recommendations.push('Slow network connection detected. Initial model loading may take longer.');
    }
  }

  return performance;
};

/**
 * Check if the current context is secure (HTTPS)
 * @returns {boolean} True if secure context
 */
export const isSecureContext = () => {
  return window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost';
};

/**
 * Get optimal camera constraints based on device capabilities
 * @param {Array} devices - Available camera devices
 * @returns {Object} Optimized constraints
 */
export const getOptimalConstraints = (devices = []) => {
  const constraints = {
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30 },
      facingMode: 'user'
    },
    audio: false
  };

  // If multiple cameras available, prefer front-facing
  if (devices.length > 1) {
    const frontCamera = devices.find(device => 
      device.label.toLowerCase().includes('front') ||
      device.label.toLowerCase().includes('user')
    );
    
    if (frontCamera) {
      constraints.video.deviceId = { exact: frontCamera.deviceId };
    }
  }

  // Adjust quality based on device performance
  const devicePerf = checkDevicePerformance();
  
  if (!devicePerf.isHighPerformance) {
    // Lower quality for better performance
    constraints.video.width = { ideal: 480 };
    constraints.video.height = { ideal: 360 };
    constraints.video.frameRate = { ideal: 20 };
  }

  return constraints;
};
