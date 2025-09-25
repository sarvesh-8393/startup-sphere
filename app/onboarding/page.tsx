"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // multiple industry selection
  const [industries, setIndustries] = useState<string[]>([]);
  const [stage, setStage] = useState("");
  const [region, setRegion] = useState("");

  const handleIndustryChange = (industry: string) => {
    setIndustries((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry) // uncheck = remove
        : [...prev, industry]                // check = add
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) {
      console.log("No session");
      return;
    }

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: session.user.email, // backend will find profile_id
    tags: industries,              // ✅ matches DB column 'tags'
    stage: stage,                  // ✅ matches DB column 'stage'
    location: region, 
      }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      alert("Error saving preferences. Try again!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <h2 className="text-xl font-bold mb-2">Select Industries</h2>

      <label>
        <input
          type="checkbox"
          value="SaaS"
          checked={industries.includes("SaaS")}
          onChange={() => handleIndustryChange("SaaS")}
        />
        SaaS
      </label>

      <label>
        <input
          type="checkbox"
          value="FinTech"
          checked={industries.includes("FinTech")}
          onChange={() => handleIndustryChange("FinTech")}
        />
        FinTech
      </label>

      <label>
        <input
          type="checkbox"
          value="AI"
          checked={industries.includes("AI")}
          onChange={() => handleIndustryChange("AI")}
        />
        AI
      </label>

      <h2 className="text-xl font-bold mt-4">Stage</h2>
      <select value={stage} onChange={(e) => setStage(e.target.value)}>
        <option value="">Select...</option>
        <option value="Seed">Seed</option>
        <option value="Series A">Series A</option>
        <option value="Growth">Growth</option>
      </select>

      <h2 className="text-xl font-bold mt-4">Region</h2>
      <input
        type="text"
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        placeholder="e.g. India"
      />

      <button
        type="submit"
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        Save Preferences
      </button>
    </form>
  );
}
