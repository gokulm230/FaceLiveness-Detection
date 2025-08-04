import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FiCheck, FiX, FiDownload, FiShare2, FiRefreshCw, FiClock, FiUser, FiShield, FiAlertTriangle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useFaceDetection } from '../contexts/FaceDetectionContext';
import { Button } from '../components/ui/Button';
import { formatDateTime, calculateDuration } from '../utils/dateUtils';
import './ResultsPage.css';

const ResultsPage = () => {
  const { user, getSessionResults } = useAuth();
  const { livenessResults } = useFaceDetection();
  
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingCert, setDownloadingCert] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  // Load session results on mount
  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get latest session results
        const results = await getSessionResults();
        setSessionData(results);
        
      } catch (err) {
        console.error('Failed to load results:', err);
        setError('Failed to load authentication results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [getSessionResults]);

  // Calculate overall success metrics
  const calculateMetrics = () => {
    if (!sessionData) return null;

    const tests = sessionData.livenessTests || [];
    const passedTests = tests.filter(test => test.passed).length;
    const totalTests = tests.length;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    return {
      passedTests,
      totalTests,
      successRate,
      overallPassed: successRate >= 75,
      duration: calculateDuration(sessionData.startTime, sessionData.endTime),
      confidence: sessionData.confidence || 0
    };
  };

  // Download certificate
  const handleDownloadCertificate = async () => {
    try {
      setDownloadingCert(true);
      
      // Create certificate data
      const certData = {
        sessionId: sessionData.sessionId,
        userId: user?.id,
        timestamp: new Date().toISOString(),
        results: sessionData,
        metrics: calculateMetrics()
      };

      // Generate PDF certificate (mock implementation)
      const blob = new Blob([JSON.stringify(certData, null, 2)], { 
        type: 'application/json' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `liveness-certificate-${sessionData.sessionId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Failed to download certificate:', err);
      setError('Failed to download certificate. Please try again.');
    } finally {
      setDownloadingCert(false);
    }
  };

  // Share results
  const handleShareResults = async () => {
    try {
      const metrics = calculateMetrics();
      const shareText = `Face Liveness Verification Complete!\n\nSuccess Rate: ${Math.round(metrics.successRate)}%\nTests Passed: ${metrics.passedTests}/${metrics.totalTests}\nStatus: ${metrics.overallPassed ? 'VERIFIED' : 'FAILED'}\n\nPowered by UIDAI Face Authentication`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Face Liveness Verification Results',
          text: shareText
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareText);
        alert('Results copied to clipboard!');
      }
    } catch (err) {
      console.error('Failed to share results:', err);
    }
  };

  // Start new session
  const handleNewSession = () => {
    // Navigate to authentication page
    window.location.href = '/authenticate';
  };

  if (loading) {
    return (
      <div className="results-page">
        <div className="results-container">
          <div className="loading-state">
            <div className="loading-spinner" />
            <h2>Loading Results...</h2>
            <p>Please wait while we compile your authentication results.</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="results-page">
        <div className="results-container">
          <div className="error-state">
            <FiAlertTriangle />
            <h2>Unable to Load Results</h2>
            <p>{error || 'No session data available.'}</p>
            <Button onClick={() => window.location.href = '/authenticate'}>
              Start New Authentication
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <motion.div 
      className="results-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="results-container">
        
        {/* Header */}
        <motion.div className="results-header" variants={itemVariants}>
          <div className={`verification-badge ${metrics.overallPassed ? 'success' : 'failure'}`}>
            {metrics.overallPassed ? <FiCheck /> : <FiX />}
          </div>
          <h1>
            {metrics.overallPassed ? 'Verification Complete' : 'Verification Failed'}
          </h1>
          <p className="session-info">
            Session ID: {sessionData.sessionId} • {formatDateTime(sessionData.endTime)}
          </p>
        </motion.div>

        {/* Quick Stats */}
        <motion.div className="quick-stats" variants={itemVariants}>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon success">
                <FiCheck />
              </div>
              <div className="stat-content">
                <span className="stat-value">{metrics.passedTests}</span>
                <span className="stat-label">Tests Passed</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon info">
                <FiClock />
              </div>
              <div className="stat-content">
                <span className="stat-value">{metrics.duration}</span>
                <span className="stat-label">Duration</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon primary">
                <FiShield />
              </div>
              <div className="stat-content">
                <span className="stat-value">{Math.round(metrics.successRate)}%</span>
                <span className="stat-label">Success Rate</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon warning">
                <FiUser />
              </div>
              <div className="stat-content">
                <span className="stat-value">{Math.round(metrics.confidence)}%</span>
                <span className="stat-label">Confidence</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Overall Status */}
        <motion.div className="overall-status" variants={itemVariants}>
          <div className={`status-card ${metrics.overallPassed ? 'success' : 'failure'}`}>
            <div className="status-header">
              <div className="status-icon">
                {metrics.overallPassed ? <FiCheck /> : <FiX />}
              </div>
              <h2>
                {metrics.overallPassed ? 'Liveness Verified' : 'Verification Failed'}
              </h2>
            </div>
            <div className="status-content">
              <p>
                {metrics.overallPassed 
                  ? 'Your identity has been successfully verified using advanced face liveness detection. You have passed all required security checks.'
                  : 'The liveness verification process was unable to confirm your identity. Some tests may have failed or the confidence level was below the required threshold.'
                }
              </p>
              
              <div className="status-details">
                <div className="detail-item">
                  <span className="detail-label">Verification Method:</span>
                  <span className="detail-value">Multi-Factor Face Liveness</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Security Level:</span>
                  <span className="detail-value">High (UIDAI Compliant)</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Timestamp:</span>
                  <span className="detail-value">{formatDateTime(sessionData.endTime)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Test Results Breakdown */}
        <motion.div className="test-breakdown" variants={itemVariants}>
          <h3>Test Results Breakdown</h3>
          <div className="tests-list">
            {sessionData.livenessTests?.map((test, index) => (
              <div key={test.testId || index} className={`test-result-card ${test.passed ? 'passed' : 'failed'}`}>
                <div className="test-header">
                  <div className="test-info">
                    <h4>{test.testName || test.type}</h4>
                    <span className="test-type">{test.type}</span>
                  </div>
                  <div className="test-status">
                    {test.passed ? <FiCheck /> : <FiX />}
                  </div>
                </div>
                
                <div className="test-metrics">
                  <div className="metric">
                    <span className="metric-label">Confidence:</span>
                    <span className="metric-value">{Math.round(test.confidence || 0)}%</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Duration:</span>
                    <span className="metric-value">{test.duration || 'N/A'}ms</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Attempts:</span>
                    <span className="metric-value">{test.attempts || 1}</span>
                  </div>
                </div>
                
                {test.error && (
                  <div className="test-error">
                    <FiAlertTriangle />
                    <span>{test.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security Information */}
        <motion.div className="security-info" variants={itemVariants}>
          <h3>Security & Compliance</h3>
          <div className="security-grid">
            <div className="security-card">
              <FiShield />
              <h4>UIDAI Compliant</h4>
              <p>This verification meets UIDAI standards for face authentication and liveness detection.</p>
            </div>
            <div className="security-card">
              <FiCheck />
              <h4>Anti-Spoofing</h4>
              <p>Advanced algorithms detected and prevented photo, video, and mask-based spoofing attempts.</p>
            </div>
            <div className="security-card">
              <FiUser />
              <h4>Real-Time Analysis</h4>
              <p>All tests were performed in real-time with live camera feed analysis.</p>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div className="results-actions" variants={itemVariants}>
          <div className="action-buttons">
            <Button
              variant="secondary"
              onClick={handleDownloadCertificate}
              disabled={downloadingCert}
            >
              <FiDownload />
              {downloadingCert ? 'Generating...' : 'Download Certificate'}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleShareResults}
            >
              <FiShare2 />
              Share Results
            </Button>
            
            <Button
              onClick={handleNewSession}
            >
              <FiRefreshCw />
              New Verification
            </Button>
          </div>
          
          <div className="disclaimer">
            <p>
              <strong>Important:</strong> This verification result is valid for the current session only. 
              For official authentication purposes, ensure you're accessing this from an authorized system.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ResultsPage;
