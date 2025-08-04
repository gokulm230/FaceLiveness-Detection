import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle, AlertCircle, Camera, Brain } from 'lucide-react';

const InitializationStatus = ({ show, onComplete }) => {
  const [steps, setSteps] = useState([
    { id: 'models', label: 'Loading AI Models', status: 'pending', icon: Brain },
    { id: 'camera', label: 'Starting Camera', status: 'pending', icon: Camera },
    { id: 'detection', label: 'Initializing Detection', status: 'pending', icon: CheckCircle },
  ]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!show) return;

    const timer = setInterval(() => {
      setSteps(prev => {
        const newSteps = [...prev];
        if (currentStep < newSteps.length) {
          newSteps[currentStep].status = 'completed';
          if (currentStep < newSteps.length - 1) {
            setCurrentStep(currentStep + 1);
            newSteps[currentStep + 1].status = 'loading';
          } else {
            setIsComplete(true);
            setTimeout(() => {
              onComplete?.();
            }, 1000);
          }
        }
        return newSteps;
      });
    }, 2000);

    // Start first step
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[0].status = 'loading';
      return newSteps;
    });

    return () => clearInterval(timer);
  }, [show, currentStep, onComplete]);

  if (!show || isComplete) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
        >
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Initializing Face Detection
            </h3>
            <p className="text-gray-600 text-sm">
              Setting up secure biometric verification...
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={step.id} className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'completed' 
                      ? 'bg-green-100 text-green-600' 
                      : step.status === 'loading'
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.status === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : step.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <IconComponent className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      step.status === 'completed' 
                        ? 'text-green-600' 
                        : step.status === 'loading'
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }`}>
                      {step.label}
                    </div>
                  </div>
                  {step.status === 'loading' && (
                    <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2 }}
                        className="h-full bg-blue-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <div className="text-xs text-gray-500">
              This may take a few moments on first load
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default InitializationStatus;
