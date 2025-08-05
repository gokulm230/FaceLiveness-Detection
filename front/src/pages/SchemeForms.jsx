import React, { useState, useEffect } from "react";
import {
  Shield,
  Eye,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Scan,
  Lock,
  Zap,
  Upload,
  FileText,
  User,
  Phone,
  MapPin,
  Calendar,
  IndianRupee,
  AlertCircle,
  CheckSquare,
} from "lucide-react";
import BackgroundFaceDetection from '../components/BackgroundFaceDetection';
import BackgroundLivenessDetection from '../components/BackgroundLivenessDetection';

const SchemesFormPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  
  // Add background detection states similar to AadhaarScheme.jsx
  const [backgroundDetection, setBackgroundDetection] = useState({
    faceCount: 0,
    confidence: 0,
    isActive: false,
    livenessScore: 0,
    userVerified: false,
    systemReady: false,
  });
  
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: "",
    fatherName: "",
    motherName: "",
    dateOfBirth: "",
    gender: "",
    aadhaarNumber: "",
    mobileNumber: "",
    email: "",

    // Address Information
    address: "",
    village: "",
    district: "",
    state: "",
    pincode: "",

    // Financial Information
    annualIncome: "",
    bankAccountNumber: "",
    ifscCode: "",
    bankName: "",

    // Scheme Specific
    selectedScheme: "pmjay",
    category: "",
    landHolding: "",
    familyMembers: "",

    // Documents
    documents: {
      aadhaarCard: null,
      incomeProof: null,
      bankPassbook: null,
      photograph: null,
      additionalDoc: null,
    },
  });

  // Handle background face detection updates
  const handleDetectionUpdate = (detectionData) => {
    setBackgroundDetection(prev => ({
      ...prev,
      faceCount: detectionData.faceCount,
      confidence: detectionData.confidence,
      isActive: detectionData.status === 'active',
      systemReady: detectionData.status === 'active' || prev.systemReady,
    }));
  };

  // Handle background liveness updates
  const handleLivenessUpdate = (livenessData) => {
    setBackgroundDetection(prev => ({
      ...prev,
      livenessScore: livenessData.overallScore,
      userVerified: livenessData.status === 'completed' && livenessData.overallScore > 0.7,
      systemReady: livenessData.status !== 'initializing' || prev.systemReady,
    }));
  };

  const schemes = {
    pmjay: {
      name: "Pradhan Mantri Jan Arogya Yojana",
      category: "health",
      gradient: "from-green-500 to-teal-600",
      icon: "🏥",
    },
    pmkisan: {
      name: "PM-KISAN Samman Nidhi",
      category: "financial",
      gradient: "from-blue-500 to-purple-600",
      icon: "🌾",
    },
    pmawas: {
      name: "Pradhan Mantri Awas Yojana",
      category: "social",
      gradient: "from-purple-500 to-pink-600",
      icon: "🏠",
    },
  };

  const steps = [
    {
      number: 1,
      title: "Aadhaar Verification",
      icon: <Shield className="w-5 h-5" />,
    },
    {
      number: 2,
      title: "Personal Details",
      icon: <User className="w-5 h-5" />,
    },
    {
      number: 3,
      title: "Address & Contact",
      icon: <MapPin className="w-5 h-5" />,
    },
    {
      number: 4,
      title: "Financial Details",
      icon: <IndianRupee className="w-5 h-5" />,
    },
    {
      number: 5,
      title: "Documents Upload",
      icon: <Upload className="w-5 h-5" />,
    },
    {
      number: 6,
      title: "Review & Submit",
      icon: <CheckCircle className="w-5 h-5" />,
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDocumentUpload = (docType, file) => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docType]: file,
      },
    }));
  };

  const handleAadhaarVerification = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate API call
      setAadhaarVerified(true);
      // Auto-fill some data from Aadhaar
      setFormData((prev) => ({
        ...prev,
        fullName: "John Doe",
        dateOfBirth: "1990-01-15",
        gender: "male",
        address: "123 Main Street, Sample Area",
      }));
    } catch (error) {
      console.error("Aadhaar verification failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitApplication = async () => {
    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate API call
      alert("Application submitted successfully! Reference ID: XYN2024001234");
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Aadhaar Verification
              </h3>
              <p className="text-gray-600">
                Enter your 12-digit Aadhaar number for secure verification
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  maxLength="12"
                  value={formData.aadhaarNumber}
                  onChange={(e) =>
                    handleInputChange(
                      "aadhaarNumber",
                      e.target.value.replace(/\D/g, "")
                    )
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-wider"
                  placeholder="XXXX XXXX XXXX"
                />
              </div>

              {!aadhaarVerified ? (
                <button
                  onClick={handleAadhaarVerification}
                  disabled={loading || formData.aadhaarNumber.length !== 12}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Scan className="w-5 h-5" />
                      <span>Verify Aadhaar</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium">
                      Aadhaar Verified Successfully!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
              Personal Information
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="As per Aadhaar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Father's Name *
                </label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) =>
                    handleInputChange("fatherName", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Father's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mother's Name *
                </label>
                <input
                  type="text"
                  value={formData.motherName}
                  onChange={(e) =>
                    handleInputChange("motherName", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mother's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    handleInputChange("dateOfBirth", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender *
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Category</option>
                  <option value="general">General</option>
                  <option value="obc">OBC</option>
                  <option value="sc">SC</option>
                  <option value="st">ST</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
              Address & Contact Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complete Address *
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="House No., Street, Area, Landmark"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Village/City *
                  </label>
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) =>
                      handleInputChange("village", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Village or City name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District *
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) =>
                      handleInputChange("district", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="District name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select State</option>
                    <option value="andhra-pradesh">Andhra Pradesh</option>
                    <option value="gujarat">Gujarat</option>
                    <option value="karnataka">Karnataka</option>
                    <option value="maharashtra">Maharashtra</option>
                    <option value="tamil-nadu">Tamil Nadu</option>
                    <option value="uttar-pradesh">Uttar Pradesh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    value={formData.pincode}
                    onChange={(e) =>
                      handleInputChange(
                        "pincode",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="6-digit PIN code"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    maxLength="10"
                    value={formData.mobileNumber}
                    onChange={(e) =>
                      handleInputChange(
                        "mobileNumber",
                        e.target.value.replace(/\D/g, "")
                      )
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
              Financial & Additional Details
            </h3>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Income *
                </label>
                <select
                  value={formData.annualIncome}
                  onChange={(e) =>
                    handleInputChange("annualIncome", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Income Range</option>
                  <option value="below-1-lakh">Below ₹1 Lakh</option>
                  <option value="1-2-lakh">₹1 - 2 Lakh</option>
                  <option value="2-3-lakh">₹2 - 3 Lakh</option>
                  <option value="3-5-lakh">₹3 - 5 Lakh</option>
                  <option value="above-5-lakh">Above ₹5 Lakh</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Family Members
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.familyMembers}
                  onChange={(e) =>
                    handleInputChange("familyMembers", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Number of family members"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account Number *
                </label>
                <input
                  type="text"
                  value={formData.bankAccountNumber}
                  onChange={(e) =>
                    handleInputChange("bankAccountNumber", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bank account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code *
                </label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) =>
                    handleInputChange("ifscCode", e.target.value.toUpperCase())
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="IFSC Code"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) =>
                    handleInputChange("bankName", e.target.value)
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bank name and branch"
                />
              </div>

              {formData.selectedScheme === "pmkisan" && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Land Holding (in acres)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.landHolding}
                    onChange={(e) =>
                      handleInputChange("landHolding", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Total land holding in acres"
                  />
                </div>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
              Document Upload
            </h3>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { key: "aadhaarCard", label: "Aadhaar Card", required: true },
                {
                  key: "incomeProof",
                  label: "Income Certificate",
                  required: true,
                },
                { key: "bankPassbook", label: "Bank Passbook", required: true },
                {
                  key: "photograph",
                  label: "Recent Photograph",
                  required: true,
                },
                {
                  key: "additionalDoc",
                  label: "Additional Document",
                  required: false,
                },
              ].map((doc) => (
                <div
                  key={doc.key}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-500 transition-colors"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h4 className="font-medium text-gray-800 mb-2">
                    {doc.label}{" "}
                    {doc.required && <span className="text-red-500">*</span>}
                  </h4>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) =>
                      handleDocumentUpload(doc.key, e.target.files[0])
                    }
                    className="hidden"
                    id={`upload-${doc.key}`}
                  />
                  <label
                    htmlFor={`upload-${doc.key}`}
                    className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                  >
                    Choose File
                  </label>
                  {formData.documents[doc.key] && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {formData.documents[doc.key].name}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    PDF, JPG, PNG (Max 5MB)
                  </p>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Document Guidelines:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• All documents should be clear and readable</li>
                    <li>• File size should not exceed 5MB per document</li>
                    <li>• Accepted formats: PDF, JPG, JPEG, PNG</li>
                    <li>• Ensure all information is visible and not cut off</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
              Review & Submit Application
            </h3>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
              <h4 className="font-bold text-lg text-gray-800 mb-4">
                Application Summary
              </h4>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Scheme:</span>
                  <p className="text-gray-800">
                    {schemes[formData.selectedScheme]?.name}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Applicant Name:
                  </span>
                  <p className="text-gray-800">{formData.fullName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Aadhaar Number:
                  </span>
                  <p className="text-gray-800">
                    XXXX XXXX {formData.aadhaarNumber.slice(-4)}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Mobile Number:
                  </span>
                  <p className="text-gray-800">{formData.mobileNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">
                    Annual Income:
                  </span>
                  <p className="text-gray-800">
                    {formData.annualIncome
                      .replace("-", " - ")
                      .replace("lakh", "Lakh")}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">State:</span>
                  <p className="text-gray-800">
                    {formData.state
                      .replace("-", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Please verify all information before submitting</li>
                    <li>• Once submitted, changes cannot be made</li>
                    <li>
                      • You will receive SMS/Email updates on your application
                      status
                    </li>
                    <li>• Processing time may vary from 15-30 working days</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="terms"
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="terms" className="text-sm text-gray-700">
                I declare that all information provided is true and accurate. I
                agree to the{" "}
                <span className="text-blue-600 hover:underline cursor-pointer">
                  Terms & Conditions
                </span>
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center transform rotate-12 shrink-0">
                <span className="text-white font-bold text-xl transform -rotate-12">
                  X
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Scheme Application
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-50 rounded-full">
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-green-700 whitespace-nowrap">
                Secure Form
              </span>
              {!backgroundDetection.systemReady && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse ml-2"></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep >= step.number
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 sm:w-16 h-1 mx-2 ${
                      currentStep > step.number
                        ? "bg-gradient-to-r from-blue-600 to-purple-600"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-800">
              {steps[currentStep - 1]?.title}
            </h2>
            <p className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {/* Scheme Selection Header */}
          <div className="mb-8">
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 bg-gradient-to-r ${
                  schemes[formData.selectedScheme]?.gradient
                } rounded-full flex items-center justify-center mx-auto mb-4`}
              >
                <span className="text-3xl">
                  {schemes[formData.selectedScheme]?.icon}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {schemes[formData.selectedScheme]?.name}
              </h1>
              <p className="text-gray-600">
                Government Scheme Application Form
              </p>
            </div>

            {/* Scheme Selector */}
            {currentStep === 1 && (
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {Object.entries(schemes).map(([key, scheme]) => (
                  <button
                    key={key}
                    onClick={() => handleInputChange("selectedScheme", key)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.selectedScheme === key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-2xl mb-2">{scheme.icon}</div>
                    <h3 className="font-semibold text-sm text-gray-800">
                      {scheme.name}
                    </h3>
                    <p className="text-xs text-gray-600 capitalize">
                      {scheme.category}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">{renderStepContent()}</div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handlePrevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {currentStep} of {steps.length}
              </span>
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {currentStep < steps.length ? (
              <button
                onClick={handleNextStep}
                disabled={
                  (currentStep === 1 && !aadhaarVerified) ||
                  (currentStep === 2 &&
                    (!formData.fullName ||
                      !formData.fatherName ||
                      !formData.motherName ||
                      !formData.dateOfBirth ||
                      !formData.gender)) ||
                  (currentStep === 3 &&
                    (!formData.address ||
                      !formData.village ||
                      !formData.district ||
                      !formData.state ||
                      !formData.pincode ||
                      !formData.mobileNumber)) ||
                  (currentStep === 4 &&
                    (!formData.annualIncome ||
                      !formData.bankAccountNumber ||
                      !formData.ifscCode ||
                      !formData.bankName)) ||
                  (currentStep === 5 &&
                    (!formData.documents.aadhaarCard ||
                      !formData.documents.incomeProof ||
                      !formData.documents.bankPassbook ||
                      !formData.documents.photograph))
                }
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitApplication}
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckSquare className="w-5 h-5" />
                    <span>Submit Application</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
            Need Help?
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl">
              <Phone className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-blue-800">Helpline</p>
                <p className="text-blue-700">1800-123-4567</p>
                <p className="text-xs text-blue-600">9 AM - 6 PM (Mon-Fri)</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-xl">
              <FileText className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-green-800">Documentation</p>
                <p className="text-green-700">View Guidelines</p>
                <p className="text-xs text-green-600">
                  Required documents list
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-xl">
              <Eye className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-purple-800">Track Application</p>
                <p className="text-purple-700">Check Status</p>
                <p className="text-xs text-purple-600">Real-time updates</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            {[
              {
                question: "How long does the application process take?",
                answer:
                  "Typically 15-30 working days after document verification.",
              },
              {
                question: "Can I edit my application after submission?",
                answer:
                  "No, applications cannot be modified once submitted. Please review carefully.",
              },
              {
                question: "What documents are required?",
                answer:
                  "Aadhaar card, income certificate, bank passbook, and recent photograph are mandatory.",
              },
              {
                question: "How will I know my application status?",
                answer:
                  "You'll receive SMS and email updates at each stage of processing.",
              },
            ].map((faq, index) => (
              <details key={index} className="group">
                <summary className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <span className="font-medium text-gray-800">
                    {faq.question}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-600 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-2 p-4 bg-white border border-gray-200 rounded-xl">
                  <p className="text-gray-700 text-sm">{faq.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p className="mb-2">🔒 Your data is secure and encrypted</p>
          <p>Government of India • Digital India Initiative</p>
          <div className="flex items-center justify-center space-x-4 mt-4">
            <span className="flex items-center space-x-1">
              <Shield className="w-4 h-4 text-green-600" />
              <span>SSL Secured</span>
            </span>
            <span className="flex items-center space-x-1">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>Data Protected</span>
            </span>
            <span className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-purple-600" />
              <span>Fast Processing</span>
            </span>
          </div>
        </div>
      </div>

      {/* Success Modal (if needed) */}
      {currentStep > steps.length && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Application Submitted!
            </h3>
            <p className="text-gray-600 mb-4">
              Your application has been submitted successfully. You will receive
              updates via SMS and email.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Reference ID:{" "}
              <span className="font-mono font-bold">XYN2024001234</span>
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium"
            >
              Start New Application
            </button>
          </div>
        </div>
      )}

      {/* Background Face Detection - Add at the end before closing div */}
      <BackgroundFaceDetection onDetectionUpdate={handleDetectionUpdate} />
      
      {/* Background Liveness Detection */}
      <BackgroundLivenessDetection 
        onLivenessUpdate={handleLivenessUpdate}
        isEnabled={backgroundDetection.faceCount > 0}
      />

      {/* User verification status indicator */}
      {backgroundDetection.userVerified && (
        <div className="fixed top-4 right-4 z-40 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">User Verified</span>
        </div>
      )}

      {/* Security monitoring indicator */}
      {backgroundDetection.faceCount > 1 && (
        <div className="fixed top-16 right-4 z-40 bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Multiple Faces Detected</span>
        </div>
      )}
    </div>
  );
};

export default SchemesFormPage;
