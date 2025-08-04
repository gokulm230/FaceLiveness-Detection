import React from 'react';
import { motion } from 'motion/react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  message = 'Loading...', 
  overlay = false,
  color = 'primary' 
}) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  const colorClasses = {
    primary: 'spinner-primary',
    white: 'spinner-white',
    success: 'spinner-success',
    error: 'spinner-error'
  };

  const Spinner = () => (
    <motion.div 
      className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="spinner-circle">
        <div className="spinner-inner" />
      </div>
      {message && (
        <motion.p 
          className="spinner-message"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );

  if (overlay) {
    return (
      <motion.div 
        className="loading-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Spinner />
      </motion.div>
    );
  }

  return <Spinner />;
};

export default LoadingSpinner;
