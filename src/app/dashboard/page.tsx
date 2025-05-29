'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebase } from '@/contexts/FirebaseContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CalendarIcon, UserGroupIcon, ClipboardDocumentCheckIcon, BanknotesIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user } = useAuth();
  const { setup, guests, tasks, contributions, expenses } = useFirebase();
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (setup?.weddingDate) {
      const today = new Date();
      const wedding = new Date(setup.weddingDate);
      const daysLeft = Math.ceil((wedding.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setCountdown(`${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`);
    }
  }, [setup?.weddingDate]);

  const totalBudget = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <ProtectedRoute>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
        </div>

        {/* Wedding Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Wedding Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Groom:</span>
                <span className="text-gray-800">{setup?.groomName || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Bride:</span>
                <span className="text-gray-800">{setup?.brideName || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Date:</span>
                <span className="text-gray-800">{setup?.weddingDate || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Venue:</span>
                <span className="text-gray-800">{setup?.weddingVenue || 'Not set'}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <h2 className="text-xl font-semibold text-white mb-4">Countdown</h2>
            <p className="text-3xl font-bold text-white">
              {countdown || 'Wedding date not set'}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-pink-100 rounded-lg">
                <BanknotesIcon className="h-6 w-6 text-pink-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Budget</h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {setup?.currency || '₱'}{totalBudget.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Budget</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-600">
                  {setup?.currency || '₱'}{totalExpenses.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">Total Expenses</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Guests</h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-blue-600">{guests.length}</p>
                <p className="text-sm text-gray-500">Total Guests</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">
                  {guests.filter(g => g.rsvp === 'Attending').length}
                </p>
                <p className="text-sm text-gray-500">Confirmed Guests</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <ClipboardDocumentCheckIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-purple-600">{completedTasks}</p>
                <p className="text-sm text-gray-500">Completed Tasks</p>
              </div>
              <div>
                <p className="text-xl font-bold text-yellow-600">{tasks.length - completedTasks}</p>
                <p className="text-sm text-gray-500">Remaining Tasks</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-teal-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Timeline</h3>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-teal-600">
                  {tasks.filter(t => new Date(t.date) > new Date()).length}
                </p>
                <p className="text-sm text-gray-500">Upcoming Tasks</p>
              </div>
              <div>
                <p className="text-xl font-bold text-orange-600">
                  {tasks.filter(t => new Date(t.date) < new Date() && !t.completed).length}
                </p>
                <p className="text-sm text-gray-500">Overdue Tasks</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 