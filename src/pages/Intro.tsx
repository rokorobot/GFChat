import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Intro() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-2xl shadow-xl p-10 max-w-xl w-full text-center"
      >
        {/* Dominant Logo - Even Bigger */}
        <h1 className="text-8xl font-extrabold mb-6 text-pink-600 tracking-tight">
          GF.Chat
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          Your AI companion — playful, caring, and always there for you.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <FeatureCard title="Fun & Playful" emoji="🎀" text="Lighthearted banter and flirty vibes." />
          <FeatureCard title="Supportive" emoji="💖" text="A safe space to share your thoughts." />
          <FeatureCard title="Personalized" emoji="✨" text="Pick your favorite personality style." />
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleStart}
          className="px-8 py-4 rounded-full bg-gradient-to-r from-pink-500 to-pink-400 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition"
        >
          Start Chatting
        </motion.button>
      </motion.div>
    </div>
  );
}

function FeatureCard({ title, emoji, text }: { title: string; emoji: string; text: string }) {
  return (
    <div className="bg-pink-50 rounded-xl p-4 shadow-sm">
      <div className="text-3xl mb-2">{emoji}</div>
      <div className="font-medium text-pink-700">{title}</div>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}