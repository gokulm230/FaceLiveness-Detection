import React from 'react';
import { motion } from 'motion/react';
import { FiHome, FiArrowLeft, FiSearch, FiAlertTriangle } from 'react-icons/fi';
import { Button } from '../components/ui/Button';
import './NotFoundPage.css';

const NotFoundPage = () => {
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

  const floatingVariants = {
    float: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <motion.div 
      className="not-found-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="not-found-container">
        
        {/* Floating Elements */}
        <div className="floating-elements">
          <motion.div 
            className="floating-shape shape-1"
            variants={floatingVariants}
            animate="float"
          />
          <motion.div 
            className="floating-shape shape-2"
            variants={floatingVariants}
            animate="float"
            transition={{ delay: 1 }}
          />
          <motion.div 
            className="floating-shape shape-3"
            variants={floatingVariants}
            animate="float"
            transition={{ delay: 2 }}
          />
        </div>

        {/* Main Content */}
        <div className="not-found-content">
          
          {/* 404 Visual */}
          <motion.div className="error-visual" variants={itemVariants}>
            <div className="error-code">
              <span className="code-digit">4</span>
              <div className="face-icon">
                <FiSearch />
              </div>
              <span className="code-digit">4</span>
            </div>
            <div className="error-subtitle">Page Not Found</div>
          </motion.div>

          {/* Error Message */}
          <motion.div className="error-message" variants={itemVariants}>
            <div className="message-icon">
              <FiAlertTriangle />
            </div>
            <h1>Oops! We couldn't find that page</h1>
            <p>
              The page you're looking for might have been moved, deleted, or doesn't exist. 
              Don't worry, our face detection system is still working perfectly!
            </p>
          </motion.div>

          {/* Suggestions */}
          <motion.div className="error-suggestions" variants={itemVariants}>
            <h3>Here's what you can do:</h3>
            <div className="suggestions-list">
              <div className="suggestion-item">
                <FiHome />
                <div>
                  <h4>Go to Homepage</h4>
                  <p>Start fresh with our face authentication system</p>
                </div>
              </div>
              <div className="suggestion-item">
                <FiArrowLeft />
                <div>
                  <h4>Go Back</h4>
                  <p>Return to the previous page you were on</p>
                </div>
              </div>
              <div className="suggestion-item">
                <FiSearch />
                <div>
                  <h4>Check the URL</h4>
                  <p>Make sure the web address is correct</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div className="error-actions" variants={itemVariants}>
            <Button
              size="large"
              onClick={handleGoHome}
              className="primary-action"
            >
              <FiHome />
              Go to Homepage
            </Button>
            <Button
              variant="outline"
              onClick={handleGoBack}
              className="secondary-action"
            >
              <FiArrowLeft />
              Go Back
            </Button>
          </motion.div>

          {/* Quick Links */}
          <motion.div className="quick-links" variants={itemVariants}>
            <h4>Quick Links</h4>
            <div className="links-grid">
              <a href="/" className="quick-link">
                <FiHome />
                <span>Homepage</span>
              </a>
              <a href="/authenticate" className="quick-link">
                <FiSearch />
                <span>Face Authentication</span>
              </a>
              <a href="/test" className="quick-link">
                <FiAlertTriangle />
                <span>Liveness Test</span>
              </a>
            </div>
          </motion.div>

        </div>

        {/* Background Pattern */}
        <div className="background-pattern">
          <div className="pattern-grid">
            {Array.from({ length: 20 }, (_, i) => (
              <div key={i} className="pattern-dot" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;
