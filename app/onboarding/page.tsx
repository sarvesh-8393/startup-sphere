"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";

const steps = [
  {
    id: "welcome",
    title: "Hey there, welcome to StartupShare",
    subtitle: "Let's get to know you a bit — takes less than a minute!",
    type: "welcome",
  },
  {
    id: "role",
    title: "What best describes your role?",
    subtitle: "Select your role.",
    options: ["Investor", "Explorer", "Founder"],
  },
  {
    id: "interests",
    title: "What topics are you most interested in?",
    subtitle: "Choose your interests (select multiple).",
    options: ["AI", "SaaS", "FinTech", "HealthTech", "E-commerce", "Web3", "EdTech", "Marketing", "Analytics", "Productivity", "Developer Tools", "Sustainability"],
    multiple: true,
  },
  {
    id: "location",
    title: "Where are you based?",
    subtitle: "Select your city or region.",
    options: ["Mumbai", "Bangalore", "Delhi", "Other"],
    optional: true,
  },
  {
    id: "stage",
    title: "What stage is your startup at?",
    subtitle: "Select the current stage.",
    options: ["Just an idea", "MVP built", "Got first users", "Raising funds", "Scaling up"],
    roles: ["Founder"], // Only show for Founders
  },
  {
    id: "looking_for",
    title: "What are you here to find?",
    subtitle: "Select what you're looking for.",
    options: {
      Founder: ["Co-founders or collaborators", "Funding or investors", "Early users / testers", "Mentorship or feedback", "Startup inspiration"],
      Investor: ["Promising startups to invest in", "Portfolio company updates", "Investment opportunities", "Networking with founders", "Market insights"],
      Explorer: ["Startup inspiration", "Learning about entrepreneurship", "Networking opportunities", "Industry trends", "Success stories"]
    },
    multiple: true,
  },
  {
    id: "wrapup",
    title: "Nice! You're all set.",
    subtitle: "We've tuned StartupShare to fit your vibe. Let's get building something legendary",
    type: "wrapup",
  },
];

export default function StartupOnboarding() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasPreferences, setHasPreferences] = useState<boolean | null>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const currentStep = steps[step];

  // Get options for current step based on role
  const getCurrentOptions = () => {
    if (typeof currentStep.options === 'object' && !Array.isArray(currentStep.options)) {
      // Role-based options
      const role = answers.role as keyof typeof currentStep.options;
      return currentStep.options[role] || [];
    }
    return currentStep.options || [];
  };

  // Check if current step should be shown based on role
  const shouldShowStep = useCallback(() => {
    if (currentStep.roles && answers.role) {
      return currentStep.roles.includes(answers.role as string);
    }
    return true;
  }, [currentStep.roles, answers.role]);

  // Get the next valid step index
  const getNextValidStep = useCallback((currentIndex: number) => {
    for (let i = currentIndex + 1; i < steps.length; i++) {
      const step = steps[i];
      if (!step.roles || !answers.role || step.roles.includes(answers.role as string)) {
        return i;
      }
    }
    return steps.length - 1; // wrapup
  }, [answers.role]);

  useEffect(() => {
    const checkUserPreferences = async () => {
      if (session?.user?.email) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", session.user.email)
            .single();

          if (profileError || !profile) {
            // Profile not found or error, assume no preferences
            setHasPreferences(false);
            return;
          }

          const { data: preferences, error: prefsError } = await supabase
            .from("user_preferences")
            .select("id")
            .eq("profile_id", profile.id)
            .single();

          if (prefsError) {
            // Error fetching preferences, assume no preferences
            setHasPreferences(false);
            return;
          }

          setHasPreferences(!!preferences);
          if (preferences) {
            // User has preferences, redirect to home
            router.push("/");
            return;
          }
        } catch (error) {
          // Supabase not configured or error, assume no preferences
          console.error("Error checking preferences:", error);
          setHasPreferences(false);
        }
      } else {
        // No session, assume no preferences
        setHasPreferences(false);
      }
    };

    checkUserPreferences();
  }, [session, router]);

  useEffect(() => {
    // Skip invalid steps based on role
    if (!shouldShowStep() && step < steps.length - 1) {
      const nextValid = getNextValidStep(step - 1); // Check from current step
      if (nextValid !== step) {
        setStep(nextValid);
        return; // Prevent animation on invalid step
      }
    }

    // Luxury parallax background motion
    if (bgRef.current) {
      gsap.to(bgRef.current, {
        x: -step * window.innerWidth * 0.15, // Reduced offset for subtlety
        duration: 2.5, // Slower for elegance
        ease: "cubic-bezier(0.16, 1, 0.3, 1)", // Apple's signature easing
      });
    }

    // Layered text reveal with micro-overshoot
    if (textRef.current) {
      const tl = gsap.timeline();

      // Title with gentle overshoot
      tl.fromTo(
        textRef.current.querySelector('h1'),
        { y: -20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          ease: "power3.inOut"
        }
      )
      // Subtitle with delay and overlap
      .fromTo(
        textRef.current.querySelector('p'),
        { y: -15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power4.out"
        },
        "-=0.4" // Overlap with title animation
      );
    }
  }, [step, answers.role, shouldShowStep, getNextValidStep]);

  const handleSelect = (option: string) => {
    if (isMultiple) {
      // For multiple selection, toggle the option
      const currentSelections = (answers[currentStep.id] as string[]) || [];
      const isSelected = currentSelections.includes(option);
      const newSelections = isSelected
        ? currentSelections.filter((item) => item !== option)
        : [...currentSelections, option];
      setAnswers((prev) => ({ ...prev, [currentStep.id]: newSelections }));
    } else {
      // For single selection, set the option
      const newAnswers = { ...answers, [currentStep.id]: option };
      setAnswers(newAnswers);

      // Navigate to next valid step
      const nextStep = getNextValidStep(step);
      if (nextStep < steps.length - 1) {
        setStep(nextStep);
      } else {
        // Last step: save preferences and redirect
        savePreferences(newAnswers);
      }
    }
  };

  const handleNext = () => {
    const nextStep = getNextValidStep(step);
    if (nextStep < steps.length - 1) {
      setStep(nextStep);
    } else {
      // Last step: save preferences and redirect
      savePreferences(answers);
    }
  };

  const handleContinue = () => {
    const nextStep = getNextValidStep(step);
    if (nextStep < steps.length - 1) {
      setStep(nextStep);
    } else {
      // Last step: show loading wheel and redirect
      setIsLoading(true);
      savePreferences(answers);
    }
  };

  const savePreferences = async (finalAnswers: Record<string, string | string[]>) => {
    const email = session?.user?.email;
    if (!email) {
      alert("Session expired. Please log in again.");
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          tags: finalAnswers.interests,
          stage: finalAnswers.stage,
          location: finalAnswers.location,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save preferences");
      }

      // Redirect based on role
      if (finalAnswers.role === "Founder") {
        router.push("/founder-details");
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      alert("Failed to save preferences. Please try again.");
    }
  };

  // Fix for TypeScript error: currentStep.multiple may not exist
  const isMultiple = (currentStep as { multiple?: boolean }).multiple || false;

  // Show loading while checking preferences
  if (hasPreferences === null) {
  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-pink-50 via-yellow-50 to-pink-100 flex flex-col items-center justify-center pt-20">
        <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If user has preferences, don't show onboarding
  if (hasPreferences) {
    return null;
  }

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-pink-50 via-yellow-50 to-pink-100 flex flex-col items-center justify-center">
      {/* Moving Background */}
      <div ref={bgRef} className="absolute top-0 left-0 h-full w-[300vw] flex">
        <div className="w-screen h-full bg-gradient-to-br from-pink-50 via-yellow-50 to-pink-100" />
        <div className="w-screen h-full bg-gradient-to-br from-yellow-50 via-pink-50 to-yellow-100" />
        <div className="w-screen h-full bg-gradient-to-br from-pink-100 via-yellow-100 to-pink-50" />
      </div>





      {/* Text */}
      <div ref={textRef} className="z-10 text-center max-w-3xl px-4">
        <motion.h1
          key={currentStep.title}
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4"
        >
          {currentStep.title}
        </motion.h1>
        <motion.p
          key={currentStep.subtitle}
          initial={{ y: -30 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="text-xl md:text-2xl text-gray-700 mb-12"
        >
          {currentStep.subtitle}
        </motion.p>
      </div>

      {/* Options / Cards */}
      {currentStep.type === "welcome" ? (
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          className="mt-8 px-8 py-4 bg-pink-400 text-white rounded-xl font-semibold shadow-lg text-lg z-10"
        >
          Let&apos;s Go!
        </motion.button>
      ) : currentStep.type === "wrapup" ? (
        isLoading ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-8 z-10"
          >
            <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setIsLoading(true);
              savePreferences(answers);
            }}
            disabled={isLoading}
            className="mt-8 px-8 py-4 bg-pink-400 text-white rounded-xl font-semibold shadow-lg text-lg z-10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Finish
          </motion.button>
        )
      ) : (
        <>
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              staggerChildren: 0.07, // 70ms stagger for elegance
              delayChildren: 0.3 // Wait for text to settle
            }}
            className="z-10 flex flex-col md:flex-row gap-6 items-center justify-center flex-wrap"
          >
            {getCurrentOptions().map((option: string, idx: number) => {
              const isSelected = isMultiple
                ? (answers[currentStep.id] as string[])?.includes(option)
                : answers[currentStep.id] === option;

              return (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1], // Apple's cubic-bezier as array
                    delay: idx * 0.07
                  }}
                  whileHover={{
                    scale: 1.02, // Micro elevation
                    transition: { duration: 0.2, ease: "easeOut" }
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelect(option)}
                  className={`px-6 py-4 rounded-xl font-semibold shadow-lg text-lg ${
                    isSelected
                      ? "bg-pink-400 text-white"
                      : "bg-yellow-200 text-gray-900"
                  }`}
                >
                  {option}
                </motion.button>
              );
            })}
          </motion.div>

          {/* Next Button for Multiple Selections */}
          {isMultiple && (answers[currentStep.id] as string[])?.length > 0 && (
            currentStep.id === "looking_for" ? (
              isLoading ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mt-8 z-10"
                >
                  <div className="w-16 h-16 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </motion.div>
              ) : (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setIsLoading(true);
                    savePreferences(answers);
                  }}
                  disabled={isLoading}
                  className="mt-8 px-8 py-4 bg-pink-400 text-white rounded-xl font-semibold shadow-lg text-lg z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Let&apos;s Go
                </motion.button>
              )
            ) : (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleNext}
                className="mt-8 px-8 py-4 bg-blue-500 text-white rounded-xl font-semibold shadow-lg text-lg z-10"
              >
                Next
              </motion.button>
            )
          )}
        </>
      )}
    </div>
  );
}
