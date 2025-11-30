'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import { motion } from 'framer-motion';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-amber-50">
      <Navbar />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="pt-24 pb-16 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-pink-700 mb-6">
            About <span className="text-amber-400">StartupSphere</span>
          </h1>
          <p className="text-xl text-gray-700 leading-relaxed">
            Connecting innovative startups with passionate supporters and investors in a vibrant, community-driven ecosystem.
          </p>
        </div>
      </motion.section>

      {/* What is StartupSphere */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-16 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-pink-700 mb-8 text-center">What is StartupSphere?</h2>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Born from the vision of democratizing startup discovery and funding, our platform serves as a comprehensive directory where innovation meets opportunity.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                At its core, StartupSphere is more than just a listing service—it&apos;s a thriving ecosystem that empowers founders to tell their stories, showcase their progress, and connect with the right people who can help turn their visions into reality. Whether you&apos;re a tech startup disrupting industries or a social enterprise solving real-world problems, StartupSphere provides the visibility and tools you need to grow.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Our platform combines the best of modern web technology with intuitive design, making it easy for anyone to explore, engage, and invest in the future of entrepreneurship. From seed-stage ventures to established companies seeking expansion, StartupSphere is where innovation finds its champions.
              </p>
            </div>
            <motion.div
              initial={{ scale: 0.8 }}
              whileInView={{ scale: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-gradient-to-br from-pink-100 to-amber-100 p-8 rounded-lg shadow-lg"
            >
              <h3 className="text-2xl font-semibold text-pink-700 mb-4">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed">
                To create a world where every great idea has the opportunity to flourish, by connecting passionate founders with supportive communities and strategic investors who believe in their vision.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-50 to-amber-50"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-pink-700 mb-12 text-center">What Makes StartupSphere Special</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold text-pink-700 mb-3">Comprehensive Startup Profiles</h3>
              <p className="text-gray-700 leading-relaxed">
                Founders can create detailed profiles showcasing their mission, team, traction, and vision. From problem statements to milestone achievements, every aspect of your startup journey is beautifully presented.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-pink-700 mb-3">Smart Discovery Tools</h3>
              <p className="text-gray-700 leading-relaxed">
                Advanced filtering by industry, funding stage, location, and more. Our intelligent search helps users find startups that match their interests and investment criteria effortlessly.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-semibold text-pink-700 mb-3">Community Engagement</h3>
              <p className="text-gray-700 leading-relaxed">
                Like, follow, and support startups you believe in. Build meaningful connections, track progress, and be part of the entrepreneurial journey from idea to impact.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-pink-700 mb-3">Funding Simulation</h3>
              <p className="text-gray-700 leading-relaxed">
                Experience the funding process with our simulation tools. Learn how investments work, track mock transactions, and prepare for real fundraising opportunities.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold text-pink-700 mb-3">Analytics & Insights</h3>
              <p className="text-gray-700 leading-relaxed">
                Gain valuable insights into startup trends, market opportunities, and community preferences. Make data-driven decisions for your entrepreneurial journey.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">🌟</span>
              </div>
              <h3 className="text-xl font-semibold text-pink-700 mb-3">Storytelling Focus</h3>
              <p className="text-gray-700 leading-relaxed">
                Every startup has a unique story. Our platform emphasizes narrative—helping founders share their why, challenges overcome, and dreams for the future.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Who Uses StartupSphere */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-16 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-pink-700 mb-12 text-center">Who Uses StartupSphere?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-pink-100 to-amber-100 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold text-pink-700 mb-4">Founders & Entrepreneurs</h3>
              <p className="text-gray-700 leading-relaxed">
                Ambitious individuals with groundbreaking ideas seeking visibility, feedback, and funding. Whether you&apos;re building the next unicorn or solving local community problems, StartupSphere gives you a platform to shine.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-pink-100 to-amber-100 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold text-pink-700 mb-4">Angel Investors</h3>
              <p className="text-gray-700 leading-relaxed">
                Sophisticated investors looking for promising opportunities. Discover vetted startups, track their progress, and make informed investment decisions in a transparent, community-driven environment.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-pink-100 to-amber-100 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold text-pink-700 mb-4">Venture Capitalists</h3>
              <p className="text-gray-700 leading-relaxed">
                VC firms scouting for portfolio companies. Access a curated selection of startups across various stages and industries, with detailed insights into team, traction, and market potential.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-pink-100 to-amber-100 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold text-pink-700 mb-4">Mentors & Advisors</h3>
              <p className="text-gray-700 leading-relaxed">
                Experienced professionals wanting to give back. Share your expertise, guide emerging entrepreneurs, and build your network while contributing to the startup ecosystem.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-pink-100 to-amber-100 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold text-pink-700 mb-4">Aspiring Entrepreneurs</h3>
              <p className="text-gray-700 leading-relaxed">
                Students, professionals, and dreamers exploring entrepreneurship. Learn from real startups, get inspired by success stories, and discover opportunities in various industries.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-pink-100 to-amber-100 p-6 rounded-lg"
            >
              <h3 className="text-xl font-semibold text-pink-700 mb-4">Corporate Partners</h3>
              <p className="text-gray-700 leading-relaxed">
                Established companies seeking innovation partnerships, acquisitions, or collaboration opportunities. Find startups that complement your business strategy.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Why Choose StartupSphere */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-pink-50 to-amber-50"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-pink-700 mb-8">Why Choose StartupSphere?</h2>
          <div className="space-y-8">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-xl font-semibold text-pink-700 mb-4">Community-Driven Approach</h3>
              <p className="text-gray-700 leading-relaxed">
                Unlike traditional platforms, StartupSphere emphasizes genuine connections and community support. Every interaction—from likes to investments—helps build a supportive ecosystem where success is celebrated collectively.
              </p>
            </motion.div>
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-xl font-semibold text-pink-700 mb-4">Focus on Storytelling</h3>
              <p className="text-gray-700 leading-relaxed">
                We believe every startup has a compelling story. Our platform provides the tools to tell your narrative authentically, helping you connect emotionally with potential supporters and investors.
              </p>
            </motion.div>
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-xl font-semibold text-pink-700 mb-4">Transparent and Accessible</h3>
              <p className="text-gray-700 leading-relaxed">
                No hidden fees, no complex processes. StartupSphere is designed to be intuitive and accessible to everyone, from first-time entrepreneurs to seasoned investors, fostering an inclusive entrepreneurial community.
              </p>
            </motion.div>
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-xl font-semibold text-pink-700 mb-4">Innovation at Scale</h3>
              <p className="text-gray-700 leading-relaxed">
                Our platform scales with your growth. Whether you&apos;re just starting out or expanding globally, StartupSphere provides the tools and visibility you need at every stage of your entrepreneurial journey.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Call to Action */}
      <motion.section
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="py-16 px-4 sm:px-6 lg:px-8 bg-pink-700 text-white"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Join the StartupSphere Community</h2>
          <p className="text-xl mb-8 leading-relaxed">
            Ready to be part of the future of entrepreneurship? Whether you&apos;re launching your dream startup or seeking the next big opportunity, StartupSphere is your gateway to innovation and success.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-amber-400 text-pink-700 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-amber-300 transition-colors"
          >
            Get Started Today
          </motion.button>
        </div>
      </motion.section>
    </div>
  );
};

export default AboutPage;
