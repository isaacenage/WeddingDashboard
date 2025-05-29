'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFE5EC] relative flex items-center justify-center">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0"
      >
        <source
          src="https://videos.pexels.com/video-files/8997516/8997516-hd_1920_1080_30fps.mp4"
          type="video/mp4"
        />
      </video>

      <div className="relative z-10 w-full px-4 sm:mx-auto sm:w-[90%] max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-gitalian text-white mb-2 drop-shadow-lg">
            Andrea&Isaac
          </h1>
          <p className="text-xl text-white mb-2 drop-shadow-lg">
            Wedding Planner
          </p>
        </div>

        <div className="w-full bg-white bg-opacity-80 rounded-lg shadow-lg p-6 sm:p-8 box-border">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
            Enter the Wedding Portal
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-pink-500 text-white py-3 rounded-md hover:bg-pink-600 transition-colors active:scale-95"
            >
              Proceed
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
