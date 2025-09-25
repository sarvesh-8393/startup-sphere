"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [industries, setIndustries] = useState<string[]>([]);
  const [stage, setStage] = useState("");
  const [region, setRegion] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(false);
  }, [session, status, router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-pink-500 to-rose-500 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  const steps = [
    {
      id: "industries",
      title: "What industries excite you?",
      subtitle: "Select all that apply to personalize your feed",
      component: "industries"
    },
    {
      id: "stage",
      title: "What is your current stage?",
      subtitle: "This helps us show relevant opportunities",
      component: "stage"
    },
    {
      id: "region",
      title: "Which startup hub inspires you?",
      subtitle: "Choose your preferred entrepreneurial ecosystem",
      component: "region"
    }
  ];

  const handleIndustryChange = (industry: string) => {
    setIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    );
  };



  const canProceedFromStep = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: return industries.length > 0;
      case 1: return stage !== "";
      case 2: return region.trim() !== "";
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: session.user.email,
          tags: industries,
          size: stage,
          location: region,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }

      setIsComplete(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  // Background animation based on current step
  const backgroundVariants = {
    step0: { backgroundPosition: "0% 50%" },
    step1: { backgroundPosition: "10% 50%" },
    step2: { backgroundPosition: "20% 50%" }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  const stepVariants = {
    hidden: {
      x: 400,
      opacity: 0,
      scale: 0.9
    },
    visible: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        stiffness: 80,
        damping: 20
      }
    },
    exit: {
      x: -400,
      opacity: 0,
      scale: 0.9,
      transition: {
        duration: 0.5
      }
    }
  };

  const buttonVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { delay: 0.4, duration: 0.5 }
    }
  };

  const industryOptions = [
    { value: "SaaS", label: "SaaS", icon: "💻" },
    { value: "FinTech", label: "FinTech", icon: "💰" },
    { value: "AI", label: "AI", icon: "🤖" },
    { value: "HealthTech", label: "HealthTech", icon: "🏥" },
    { value: "EdTech", label: "EdTech", icon: "📚" },
    { value: "E-commerce", label: "E-commerce", icon: "🛒" },
    { value: "GreenTech", label: "GreenTech", icon: "🌱" },
    { value: "FoodTech", label: "FoodTech", icon: "🍔" }
  ];

  const stageOptions = [
    { value: "Idea", label: "Idea Stage", desc: "Just getting started with concepts" },
    { value: "MVP", label: "MVP", desc: "Building minimum viable product" },
    { value: "Seed", label: "Seed", desc: "Early funding & development" },
    { value: "Series A", label: "Series A", desc: "Scaling & growth phase" },
    { value: "Series B+", label: "Series B+", desc: "Mature & expanding rapidly" }
  ];

  const countryOptions = [
    { value: "USA", label: "United States", flag: "🇺🇸", hub: "Silicon Valley" },
    { value: "India", label: "India", flag: "🇮🇳", hub: "Bengaluru" },
    { value: "UK", label: "United Kingdom", flag: "🇬🇧", hub: "London" },
    { value: "Singapore", label: "Singapore", flag: "🇸🇬", hub: "Southeast Asia" },
    { value: "Germany", label: "Germany", flag: "🇩🇪", hub: "Berlin" },
    { value: "Canada", label: "Canada", flag: "🇨🇦", hub: "Toronto" },
    { value: "Israel", label: "Israel", flag: "🇮🇱", hub: "Tel Aviv" },
    { value: "China", label: "China", flag: "🇨🇳", hub: "Shenzhen" },
    { value: "Australia", label: "Australia", flag: "🇦🇺", hub: "Sydney" },
    { value: "Netherlands", label: "Netherlands", flag: "🇳🇱", hub: "Amsterdam" }
  ];



  if (isComplete) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-gradient-to-br from-yellow-400 via-pink-500 to-rose-500 flex items-center justify-center"
      >
        <div className="text-center text-white">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl"
          >
            <span className="text-4xl">🎉</span>
          </motion.div>
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold mb-4"
          >
            Amazing! You&apos;re all set! ✨
          </motion.h1>
          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xl opacity-90 mb-4"
          >
            Your personalized experience is ready
          </motion.p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="w-16 h-1 bg-white mx-auto rounded-full"
          />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      variants={backgroundVariants}
      initial="step0"
      animate={`step${currentStep}`}
      transition={{ duration: 0.8 }}
      className="min-h-screen bg-gradient-to-br from-yellow-400 via-pink-500 to-rose-500 flex items-center justify-center p-4 overflow-hidden relative"
    >
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            rotate: 360,
            x: [0, 100, 0],
            y: [0, -50, 0]
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full"
        />
        <motion.div
          animate={{ 
            rotate: -360,
            x: [0, -80, 0],
            y: [0, 70, 0]
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute bottom-20 right-20 w-24 h-24 bg-yellow-300/20 rounded-full"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
            transition={{
              duration: 15,
              repeat: Infinity
            }}
          className="absolute top-1/2 right-10 w-16 h-16 bg-pink-300/20 rounded-full transform rotate-45"
        />
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-3xl relative z-10"
      >
        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ 
                  scale: index <= currentStep ? 1.1 : 0.8,
                  opacity: index <= currentStep ? 1 : 0.4 
                }}
                transition={{ duration: 0.4 }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  index <= currentStep 
                    ? 'bg-white text-pink-500 border-white shadow-lg' 
                    : 'bg-white/10 text-white/60 border-white/30'
                }`}
              >
                {index < currentStep ? '✓' : index + 1}
              </motion.div>
            ))}
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 1 }}
              className="h-full bg-gradient-to-r from-yellow-300 to-pink-400 rounded-full shadow-sm"
            />
          </div>
          <motion.p
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-white/80 mt-3 font-medium"
          >
            Step {currentStep + 1} of {steps.length}
          </motion.p>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bg-white/15 backdrop-blur-xl rounded-3xl p-10 border border-white/30 shadow-2xl"
          >
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl font-bold text-white mb-3">
                {steps[currentStep].title}
              </h1>
              <p className="text-white/80 text-xl">
                {steps[currentStep].subtitle}
              </p>
            </motion.div>

            {/* Industries Step */}
            {currentStep === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {industryOptions.map((option, index) => (
                  <motion.label
                    key={option.value}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 ${
                      industries.includes(option.value)
                        ? 'border-yellow-300 bg-yellow-400/30 shadow-lg shadow-yellow-400/30'
                        : 'border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20'
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="text-center">
                      <input
                        type="checkbox"
                        value={option.value}
                        checked={industries.includes(option.value)}
                        onChange={() => handleIndustryChange(option.value)}
                        className="sr-only"
                      />
                      <div className="text-3xl mb-2">{option.icon}</div>
                      <div className="text-white font-semibold text-sm">{option.label}</div>
                    </div>
                  </motion.label>
                ))}
              </motion.div>
            )}

            {/* Stage Step */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="space-y-4"
              >
                {stageOptions.map((option, index) => (
                  <motion.label
                    key={option.value}
                    initial={{ x: 60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className={`cursor-pointer block p-5 rounded-2xl border-2 transition-all duration-300 ${
                      stage === option.value
                        ? 'border-pink-300 bg-pink-400/30 shadow-lg shadow-pink-400/30'
                        : 'border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20'
                    }`}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <input
                      type="radio"
                      name="stage"
                      value={option.value}
                      checked={stage === option.value}
                      onChange={(e) => setStage(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-white font-semibold text-xl">{option.label}</div>
                        <div className="text-white/70 text-base">{option.desc}</div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-3 ${
                        stage === option.value 
                          ? 'border-pink-300 bg-pink-300' 
                          : 'border-white/50'
                      }`} />
                    </div>
                  </motion.label>
                ))}
              </motion.div>
            )}

            {/* Region Step */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-2 gap-4"
              >
                {countryOptions.map((option, index) => (
                  <motion.label
                    key={option.value}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                    className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 ${
                      region === option.value
                        ? 'border-yellow-300 bg-yellow-400/30 shadow-lg shadow-yellow-400/30'
                        : 'border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/20'
                    }`}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setRegion(option.value)}
                  >
                    <div className="text-center">
                      <input
                        type="radio"
                        name="region"
                        value={option.value}
                        checked={region === option.value}
                        onChange={() => setRegion(option.value)}
                        className="sr-only"
                      />
                      <div className="text-3xl mb-2">{option.flag}</div>
                      <div className="text-white font-semibold text-base">{option.label}</div>
                      <div className="text-white/70 text-sm mt-1">{option.hub}</div>
                    </div>
                  </motion.label>
                ))}
              </motion.div>
            )}



            {/* Navigation Buttons */}
            <motion.div
              variants={buttonVariants}
              initial="hidden"
              animate="visible"
              className="mt-10 flex justify-between items-center"
            >
              {/* Back Button */}
              {currentStep > 0 && (
                <motion.button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-3 rounded-xl font-semibold text-white/80 border-2 border-white/30 hover:border-white/50 hover:bg-white/10 transition-all duration-300"
                  whileHover={{ scale: 1.05, x: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ← Back
                </motion.button>
              )}

              {/* Next/Complete Button */}
              <motion.button
                type="button"
                onClick={handleNext}
                disabled={!canProceedFromStep(currentStep)}
                className={`px-10 py-4 rounded-2xl font-bold text-xl transition-all duration-300 ${
                  canProceedFromStep(currentStep)
                    ? 'bg-white text-pink-500 shadow-2xl shadow-white/30 hover:shadow-white/50 hover:scale-105'
                    : 'bg-white/20 text-white/40 cursor-not-allowed'
                } ${currentStep === 0 ? 'ml-auto' : ''}`}
                whileHover={canProceedFromStep(currentStep) ? { scale: 1.05, y: -2 } : {}}
                whileTap={canProceedFromStep(currentStep) ? { scale: 0.95 } : {}}
              >
                {currentStep === steps.length - 1 ? 'Complete Setup! 🚀' : 'Continue →'}
              </motion.button>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}