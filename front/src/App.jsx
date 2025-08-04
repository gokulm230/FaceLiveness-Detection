import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { FaceDetectionProvider } from './contexts/FaceDetectionContext';
import './App.css';

// Lazy load components for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const AuthenticationPage = lazy(() => import('./pages/AuthenticationPage'));
const LivenessTestPage = lazy(() => import('./pages/LivenessTestPage'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AadhaarSchemePage = lazy(() => import('./pages/AadhaarScheme'));
const SchemeFormsPage = lazy(() => import('./pages/SchemeForms'));

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <FaceDetectionProvider>
          <div className="App">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="app-container"
            >
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/authenticate" element={<AuthenticationPage />} />
                  <Route path="/liveness-test" element={<LivenessTestPage />} />
                  <Route path="/results" element={<ResultsPage />} />
                  <Route path="/404" element={<NotFoundPage />} />
                  <Route path="/aadhaar-scheme" element={<AadhaarSchemePage />} />
                  <Route path="/scheme-forms" element={<SchemeFormsPage />} />
                  {/* Redirect all unknown routes to NotFoundPage */}
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </Suspense>
            </motion.div>
          </div>
        </FaceDetectionProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
