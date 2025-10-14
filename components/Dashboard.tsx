"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Startup {
  id: string;
  name: string;
  description: string;
  tags: string[];
  stage: string;
  location: string;
  views: number;
  likes: number;
  created_at: string;
}

interface DashboardProps {
  startups: Startup[];
  user: { name?: string | null | undefined };
}

export default function Dashboard({ startups, user }: DashboardProps) {
  const [stats, setStats] = useState({
    totalStartups: 0,
    totalViews: 0,
    totalLikes: 0,
    recentGrowth: 0,
  });

  useEffect(() => {
    if (startups) {
      const totalStartups = startups.length;
      const totalViews = startups.reduce((sum, s) => sum + s.views, 0);
      const totalLikes = startups.reduce((sum, s) => sum + s.likes, 0);
      const recentGrowth = Math.floor(Math.random() * 20) + 5; // Mock growth

      setStats({ totalStartups, totalViews, totalLikes, recentGrowth });
    }
  }, [startups]);

  const chartData = [
    { name: "Jan", views: 400, likes: 240 },
    { name: "Feb", views: 300, likes: 139 },
    { name: "Mar", views: 200, likes: 980 },
    { name: "Apr", views: 278, likes: 390 },
    { name: "May", views: 189, likes: 480 },
    { name: "Jun", views: 239, likes: 380 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-purple-50 pt-24 p-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12"
      >
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Welcome back, {user?.name || "Entrepreneur"}! 🚀
        </h1>
        <p className="text-xl text-gray-600">
          Your startup dashboard is ready. Let&apos;s build something amazing.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Startups", value: stats.totalStartups, icon: "🏢", color: "from-blue-500 to-blue-600" },
          { label: "Total Views", value: stats.totalViews, icon: "👁️", color: "from-green-500 to-green-600" },
          { label: "Total Likes", value: stats.totalLikes, icon: "❤️", color: "from-red-500 to-red-600" },
          { label: "Growth", value: `${stats.recentGrowth}%`, icon: "📈", color: "from-purple-500 to-purple-600" },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`bg-gradient-to-r ${stat.color} text-white p-6 rounded-2xl shadow-lg backdrop-blur-sm bg-opacity-90`}
          >
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm opacity-80">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl mb-12"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Analytics Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="views" stroke="#8884d8" strokeWidth={2} />
            <Line type="monotone" dataKey="likes" stroke="#82ca9d" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Startups */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl"
      >
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Recent Startups</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {startups.slice(0, 6).map((startup, index) => (
            <motion.div
              key={startup.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{startup.name}</h3>
              <p className="text-gray-600 mb-4">{startup.description.slice(0, 100)}...</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{startup.stage}</span>
                <div className="flex space-x-2">
                  <span className="text-sm text-blue-600">👁️ {startup.views}</span>
                  <span className="text-sm text-red-600">❤️ {startup.likes}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
