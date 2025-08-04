import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Add this import
import {
  Shield,
  Eye,
  CheckCircle,
  ArrowRight,
  Scan,
  Lock,
  Zap,
  Users,
  Home,
  Banknote,
  Heart,
  GraduationCap,
  Car,
  Briefcase,
  Calendar,
} from "lucide-react";
import BackgroundFaceDetection from '../components/BackgroundFaceDetection';
import BackgroundLivenessDetection from '../components/BackgroundLivenessDetection';
import InitializationStatus from '../components/InitializationStatus';
// import DebugPanel from '../components/DebugPanel';

const SchemesPage = () => {
  const navigate = useNavigate(); // Add this hook
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState({});
  
  // Background detection states
  const [backgroundDetection, setBackgroundDetection] = useState({
    faceCount: 0,
    confidence: 0,
    isActive: false,
    livenessScore: 0,
    userVerified: false,
    systemReady: false,
  });
  
  const [showInitialization, setShowInitialization] = useState(true);

  const handleSchemeForms = () => {
    console.log("🔍 Redirecting to scheme-forms page");
    navigate("/scheme-forms");
  };

  // Handle background face detection updates
  const handleDetectionUpdate = (detectionData) => {
    setBackgroundDetection(prev => ({
      ...prev,
      faceCount: detectionData.faceCount,
      confidence: detectionData.confidence,
      isActive: detectionData.status === 'active',
      systemReady: detectionData.status === 'active' || prev.systemReady,
    }));
    
    // Hide initialization screen when system is ready
    if (detectionData.status === 'active' && showInitialization) {
      setTimeout(() => setShowInitialization(false), 500);
    }
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

  const categories = [
    { id: "all", name: "All Schemes", icon: <Shield className="w-5 h-5" /> },
    {
      id: "social",
      name: "Social Welfare",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "financial",
      name: "Financial",
      icon: <Banknote className="w-5 h-5" />,
    },
    { id: "health", name: "Healthcare", icon: <Heart className="w-5 h-5" /> },
    {
      id: "education",
      name: "Education",
      icon: <GraduationCap className="w-5 h-5" />,
    },
    {
      id: "employment",
      name: "Employment",
      icon: <Briefcase className="w-5 h-5" />,
    },
  ];

  const schemes = [
    {
      id: "pmjay",
      title: "Pradhan Mantri Jan Arogya Yojana",
      category: "health",
      description:
        "Comprehensive health insurance coverage up to ₹5 lakh per family per year for secondary and tertiary care hospitalization.",
      benefits: [
        "₹5 lakh coverage",
        "Cashless treatment",
        "1,400+ procedures covered",
        "No age limit",
      ],
      eligibility: "BPL families and rural/urban poor",
      gradient: "from-green-500 to-teal-600",
      icon: <Heart className="w-8 h-8" />,
      deadline: "2024-12-31",
      applicants: "10.74 Cr+",
    },
    {
      id: "pmkisan",
      title: "PM-KISAN Samman Nidhi",
      category: "financial",
      description:
        "Direct income support of ₹6,000 per year to small and marginal farmer families having combined land holding up to 2 hectares.",
      benefits: [
        "₹2,000 per installment",
        "3 installments per year",
        "Direct bank transfer",
        "No processing fee",
      ],
      eligibility: "Small & marginal farmers with up to 2 hectares land",
      gradient: "from-blue-500 to-purple-600",
      icon: <Banknote className="w-8 h-8" />,
      deadline: "Ongoing",
      applicants: "11 Cr+",
    },
    {
      id: "pmawas",
      title: "Pradhan Mantri Awas Yojana",
      category: "social",
      description:
        "Housing scheme providing financial assistance for construction or enhancement of houses to eligible beneficiaries.",
      benefits: [
        "Up to ₹2.67 lakh subsidy",
        "Easy loan approval",
        "Interest subsidy",
        "Quality construction",
      ],
      eligibility: "EWS, LIG, MIG families without pucca house",
      gradient: "from-purple-500 to-pink-600",
      icon: <Home className="w-8 h-8" />,
      deadline: "2024-03-31",
      applicants: "1.2 Cr+",
    },
    {
      id: "nss",
      title: "National Scholarship Scheme",
      category: "education",
      description:
        "Financial assistance to meritorious students from economically weaker sections to pursue higher education.",
      benefits: [
        "Up to ₹20,000 per year",
        "Merit-based selection",
        "Renewable scholarship",
        "Direct benefit transfer",
      ],
      eligibility: "Students with family income < ₹2.5 lakh",
      gradient: "from-indigo-500 to-blue-600",
      icon: <GraduationCap className="w-8 h-8" />,
      deadline: "2024-10-31",
      applicants: "82 Lakh+",
    },
    {
      id: "mgnrega",
      title: "MGNREGA Employment Scheme",
      category: "employment",
      description:
        "Guaranteed 100 days of wage employment in rural areas to enhance livelihood security of households.",
      benefits: [
        "100 days guaranteed work",
        "₹261 daily wage",
        "Work within 5km radius",
        "Unemployment allowance",
      ],
      eligibility: "Adult members of rural households",
      gradient: "from-orange-500 to-red-600",
      icon: <Briefcase className="w-8 h-8" />,
      deadline: "Ongoing",
      applicants: "15 Cr+",
    },
    {
      id: "pmjjby",
      title: "PM Jeevan Jyoti Bima Yojana",
      category: "financial",
      description:
        "Life insurance scheme offering coverage of ₹2 lakh for one year in case of death due to any reason.",
      benefits: [
        "₹2 lakh coverage",
        "₹330 annual premium",
        "Auto-renewal",
        "Easy claim process",
      ],
      eligibility: "Age 18-50 years with bank account",
      gradient: "from-teal-500 to-green-600",
      icon: <Shield className="w-8 h-8" />,
      deadline: "Ongoing",
      applicants: "13.5 Cr+",
    },
    {
      id: "ayushman",
      title: "Ayushman Bharat Digital Health",
      category: "health",
      description:
        "Digital health ecosystem providing digital health ID and access to health records across the country.",
      benefits: [
        "Digital Health ID",
        "Health records access",
        "Telemedicine support",
        "Medicine tracking",
      ],
      eligibility: "All Indian citizens",
      gradient: "from-cyan-500 to-blue-600",
      icon: <Scan className="w-8 h-8" />,
      deadline: "Ongoing",
      applicants: "34 Cr+",
    },
    {
      id: "swayam",
      title: "SWAYAM Online Learning",
      category: "education",
      description:
        "Online education platform offering courses from Class 9 to post-graduation level with free certification.",
      benefits: [
        "Free courses",
        "Certificate available",
        "2000+ courses",
        "Top faculty",
      ],
      eligibility: "Students from Class 9 onwards",
      gradient: "from-violet-500 to-purple-600",
      icon: <GraduationCap className="w-8 h-8" />,
      deadline: "Ongoing",
      applicants: "4.7 Cr+",
    },
  ];

  const filteredSchemes =
    selectedCategory === "all"
      ? schemes
      : schemes.filter((scheme) => scheme.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white">
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
                Xyndrix Schemes
              </span>
            </div>
            <div className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-green-50 rounded-full">
              <Shield className="w-4 h-4 text-green-600 shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-green-700 whitespace-nowrap">
                UIDAI Verified
              </span>
              {!backgroundDetection.systemReady && (
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse ml-2"></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_50%)]"></div>

        <div className="max-w-7xl mx-auto py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                Government Schemes Portal
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="block">Aadhaar-Enabled</span>
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent">
                Government Schemes
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8">
              Access and apply for government schemes seamlessly using your
              Aadhaar. Secure, fast, and transparent application process with
              real-time status tracking.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                  500+
                </div>
                <div className="text-sm text-gray-600">Schemes Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                  50Cr+
                </div>
                <div className="text-sm text-gray-600">Beneficiaries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                  99.9%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-gray-800">
                  24/7
                </div>
                <div className="text-sm text-gray-600">Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-white border-b border-gray-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  selectedCategory === category.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Schemes Grid */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {filteredSchemes.map((scheme) => (
              <div key={scheme.id} className="group relative">
                <div
                  className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl blur-xl"
                  style={{
                    background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                  }}
                ></div>
                <div className="relative bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-6 shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 h-full flex flex-col">
                  {/* Scheme Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${scheme.gradient} text-white`}
                    >
                      {scheme.icon}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500">Applicants</div>
                      <div className="text-sm font-bold text-gray-800">
                        {scheme.applicants}
                      </div>
                    </div>
                  </div>

                  {/* Scheme Content */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 leading-tight">
                      {scheme.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                      {scheme.description}
                    </p>

                    {/* Benefits */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">
                        Key Benefits:
                      </h4>
                      <div className="space-y-1">
                        {scheme.benefits.slice(0, 3).map((benefit, index) => (
                          <div
                            key={index}
                            className="flex items-center space-x-2"
                          >
                            <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                            <span className="text-xs text-gray-600">
                              {benefit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Eligibility */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">
                        Eligibility:
                      </h4>
                      <p className="text-xs text-gray-600">
                        {scheme.eligibility}
                      </p>
                    </div>

                    {/* Deadline */}
                    <div className="flex items-center space-x-2 mb-4">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span className="text-xs text-gray-600">
                        Deadline:{" "}
                        <span className="font-medium">{scheme.deadline}</span>
                      </span>
                    </div>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={() => handleSchemeForms()}
                    className={`group w-full px-4 py-3 bg-gradient-to-r ${scheme.gradient} text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-2`}
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Apply Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
              How to Apply
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Simple 4-step process to apply for any government scheme using
              your Aadhaar
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Select Scheme",
                description:
                  "Browse and select the scheme you want to apply for",
                icon: <Eye className="w-6 h-6" />,
              },
              {
                step: "02",
                title: "Aadhaar Verification",
                description:
                  "Verify your identity using Aadhaar authentication",
                icon: <Shield className="w-6 h-6" />,
              },
              {
                step: "03",
                title: "Fill Application",
                description:
                  "Complete the application form with required details",
                icon: <Scan className="w-6 h-6" />,
              },
              {
                step: "04",
                title: "Track Status",
                description: "Monitor your application status in real-time",
                icon: <CheckCircle className="w-6 h-6" />,
              },
            ].map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 text-center">
                  <div className="text-4xl font-bold text-gray-200 mb-4">
                    {step.step}
                  </div>
                  <div className="inline-flex p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Start Your Application Today
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-8 leading-relaxed">
            Don't miss out on government benefits. Apply now with your Aadhaar
            in just a few clicks.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-gray-800 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300">
              Browse All Schemes
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-xl font-bold text-lg hover:bg-white hover:text-gray-800 transform hover:-translate-y-1 transition-all duration-300">
              Check Eligibility
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center space-x-3 mb-6 sm:mb-8">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center transform rotate-12">
              <span className="text-white font-bold text-xl sm:text-2xl transform -rotate-12">
                X
              </span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold">
              Xyndrix Schemes
            </span>
          </div>
          <p className="text-center text-gray-400 text-sm sm:text-base">
            © 2024 Xyndrix. Empowering citizens through digital governance and
            secure Aadhaar integration.
          </p>
        </div>
      </footer>

      {/* Background Face Detection */}
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

      {/* Initialization Status */}
      <InitializationStatus 
        show={showInitialization} 
        onComplete={() => setShowInitialization(false)}
      />

      {/* Debug Panel (development only) */}
      {/* <DebugPanel /> */}
    </div>
  );
};

export default SchemesPage;
