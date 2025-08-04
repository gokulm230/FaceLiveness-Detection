import axios from 'axios';

// API configuration
const API_BASE_URL =  'http://localhost:3003/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    
    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        data: config.data
      });
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (process.env.NODE_ENV === 'development') {
      console.log('API Response:', {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
    }
    
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear auth token
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

// Auth service
export const authService = {
  // Start authentication session
  async startSession(aadhaarNumber) {
    try {
      const response = await apiClient.post('/auth/start-session', {
        aadhaarNumber
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to start session');
    }
  },

  // Submit liveness proof
  async submitLivenessProof(sessionId, images) {
    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      
      images.forEach((image, index) => {
        if (image instanceof Blob) {
          formData.append('images', image, `liveness_${index}.jpg`);
        } else if (typeof image === 'string') {
          // Convert base64 to blob
          const blob = dataURLToBlob(image);
          formData.append('images', blob, `liveness_${index}.jpg`);
        }
      });

      const response = await apiClient.post('/auth/submit-liveness', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to submit liveness proof');
    }
  },

  // Complete authentication
  async completeAuthentication(sessionId, referenceImage) {
    try {
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      
      if (referenceImage instanceof Blob) {
        formData.append('referenceImage', referenceImage, 'reference.jpg');
      } else if (typeof referenceImage === 'string') {
        const blob = dataURLToBlob(referenceImage);
        formData.append('referenceImage', blob, 'reference.jpg');
      }

      const response = await apiClient.post('/auth/complete', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to complete authentication');
    }
  },

  // Get session status
  async getSessionStatus(sessionId) {
    try {
      const response = await apiClient.get(`/auth/session/${sessionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get session status');
    }
  },

  // End session
  async endSession(sessionId) {
    try {
      const response = await apiClient.post('/auth/end-session', {
        sessionId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to end session');
    }
  }
};

// Face detection service
export const faceDetectionService = {
  // Detect faces in image
  async detectFaces(imageBlob) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'face.jpg');

      const response = await apiClient.post('/face/detect', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to detect faces');
    }
  },

  // Extract face features
  async extractFeatures(imageBlob) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'face.jpg');

      const response = await apiClient.post('/face/extract-features', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to extract face features');
    }
  },

  // Compare two faces
  async compareFaces(image1Blob, image2Blob) {
    try {
      const formData = new FormData();
      formData.append('image1', image1Blob, 'face1.jpg');
      formData.append('image2', image2Blob, 'face2.jpg');

      const response = await apiClient.post('/face/compare', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to compare faces');
    }
  },

  // Analyze face quality
  async analyzeFaceQuality(imageBlob) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'face.jpg');

      const response = await apiClient.post('/face/analyze-quality', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to analyze face quality');
    }
  }
};

// Liveness detection service
export const livenessService = {
  // Detect eye blink
  async detectBlink(imageBlob) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'blink.jpg');

      const response = await apiClient.post('/liveness/detect-blink', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to detect eye blink');
    }
  },

  // Detect smile
  async detectSmile(imageBlob) {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'smile.jpg');

      const response = await apiClient.post('/liveness/detect-smile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to detect smile');
    }
  },

  // Detect head movement
  async detectHeadMovement(imageBlobs) {
    try {
      const formData = new FormData();
      
      imageBlobs.forEach((blob, index) => {
        formData.append('images', blob, `movement_${index}.jpg`);
      });

      const response = await apiClient.post('/liveness/detect-head-movement', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to detect head movement');
    }
  },

  // Comprehensive liveness check
  async comprehensiveCheck(imageBlobs) {
    try {
      const formData = new FormData();
      
      imageBlobs.forEach((blob, index) => {
        formData.append('images', blob, `comprehensive_${index}.jpg`);
      });

      const response = await apiClient.post('/liveness/comprehensive-check', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to perform comprehensive liveness check');
    }
  },

  // Real-time liveness check
  async realTimeCheck(frameData) {
    try {
      const response = await apiClient.post('/liveness/real-time-check', {
        frameData
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to perform real-time liveness check');
    }
  }
};

// Utility functions
const dataURLToBlob = (dataURL) => {
  const arr = dataURL.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new Blob([u8arr], { type: mime });
};

// API health check
export const healthCheck = async () => {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('API health check failed');
  }
};

export default {
  authService,
  faceDetectionService,
  livenessService,
  healthCheck
};
