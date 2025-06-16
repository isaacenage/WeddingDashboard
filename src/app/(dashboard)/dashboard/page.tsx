'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, PolarArea, Doughnut, Radar } from 'react-chartjs-2';
import CountUp from 'react-countup';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart color palette
const chartColors = {
  pink: '#EC4899',
  lightPink: '#ffd5e0',
  darkPink: '#4a1d39',
  green: '#10B981',
  red: '#EF4444',
  yellow: '#F59E0B',
  blue: '#3B82F6',
  purple: '#8B5CF6',
};

// Type definitions
interface BudgetContribution {
  amount: number;
  contributor: string;
  date: string;
}

interface BudgetExpense {
  amount: number;
  date: string;
  vendorType: string;
  paidBy: string;
}

interface Guest {
  name: string;
  email: string;
  phone: string;
  rsvp: 'No Response' | 'Attending' | "Won't Attend";
  invitation: 'Not Sent' | 'Sent';
  transport: string;
  accommodation: string;
  tags: string[];
}

interface Task {
  description: string;
  date: string;
  completed: boolean;
  owner: string;
}

interface Vendor {
  name: string;
  type: string;
  price: number;
  final: boolean;
}

interface DashboardData {
  budgetContributions: BudgetContribution[];
  budgetExpenses: BudgetExpense[];
  guests: Guest[];
  checklist: Task[];
  vendors: Vendor[];
  setup: {
    groomName: string;
    brideName: string;
    weddingVenue: string;
    weddingDate: string;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    budgetContributions: [],
    budgetExpenses: [],
    guests: [],
    checklist: [],
    vendors: [],
    setup: {
      groomName: '',
      brideName: '',
      weddingVenue: '',
      weddingDate: '',
    },
  });

  useEffect(() => {
    if (!user) return;

    const fetchData = () => {
      const paths = [
        'budgetContributions',
        'budgetExpenses',
        'guests',
        'checklist',
        'vendors',
        'setup',
      ];

      const unsubscribes = paths.map((path) => {
        const dataRef = ref(db, `${path}/${user.uid}`);
        return onValue(dataRef, (snapshot) => {
          const value = snapshot.val();
          setData((prev) => ({
            ...prev,
            [path]: value ? (path === 'setup' ? value : Object.values(value)) : [],
          }));
        });
      });

      setLoading(false);
      return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    };

    fetchData();
  }, [user]);

  // Calculate days remaining
  const daysRemaining = data.setup.weddingDate
    ? Math.ceil((new Date(data.setup.weddingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Chart 1: Total Budget Contributed
  const totalBudget = data.budgetContributions.reduce(
    (sum, contribution) => sum + (contribution.amount || 0),
    0
  );

  // New Budget Metrics
  const totalPaid = data.budgetExpenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );
  const budgetLeft = totalBudget - totalPaid;

  // New Vendor Stats
  const vendorsPaid = new Set(
    data.budgetExpenses
      .filter(expense => expense.vendorType)
      .map(expense => expense.vendorType)
  ).size;
  const totalVendors = data.vendors.length;

  // Chart 2: Expense Trend Over Time
  const expenseTrendData = {
    labels: [...new Set(data.budgetExpenses.map((expense) => expense.date))].sort(),
    datasets: [
      {
        label: 'Expenses',
        data: data.budgetExpenses.map((expense) => expense.amount),
        borderColor: chartColors.pink,
        backgroundColor: chartColors.lightPink,
        fill: true,
      },
    ],
  };

  // Chart 3: Expenses by Vendor Type
  const vendorTypeExpenses = data.budgetExpenses.reduce<Record<string, number>>((acc, expense) => {
    acc[expense.vendorType] = (acc[expense.vendorType] || 0) + expense.amount;
    return acc;
  }, {});

  const vendorTypeData = {
    labels: Object.keys(vendorTypeExpenses),
    datasets: [
      {
        label: 'Expenses by Vendor Type',
        data: Object.values(vendorTypeExpenses),
        backgroundColor: Object.keys(vendorTypeExpenses).map(
          (_, i) => `hsla(330, 81%, 60%, ${0.3 + (i * 0.1)})`
        ),
      },
    ],
  };

  // Chart 4: RSVP Breakdown
  const rsvpCounts = data.guests.reduce<Record<string, number>>(
    (acc, guest) => {
      acc[guest.rsvp] = (acc[guest.rsvp] || 0) + 1;
      return acc;
    },
    { 'No Response': 0, Attending: 0, "Won't Attend": 0 }
  );

  const rsvpData = {
    labels: Object.keys(rsvpCounts),
    datasets: [
      {
        data: Object.values(rsvpCounts),
        backgroundColor: [chartColors.yellow, chartColors.green, chartColors.red],
      },
    ],
  };

  // Chart 5: Guest Tags Distribution
  const tagCounts = data.guests.reduce<Record<string, number>>((acc, guest) => {
    guest.tags?.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

  const tagData = {
    labels: Object.keys(tagCounts),
    datasets: [
      {
        data: Object.values(tagCounts),
        backgroundColor: Object.keys(tagCounts).map(
          (_, i) => `hsla(330, 81%, 60%, ${0.3 + (i * 0.1)})`
        ),
      },
    ],
  };

  // Chart 6: Task Completion Status
  const totalTasks = data.checklist.length;
  const completedTasks = data.checklist.filter((task) => task.completed).length;
  const completionPercentage = totalTasks ? (completedTasks / totalTasks) * 100 : 0;

  // Chart 7: Daily Tasks Added
  const dailyTasks = data.checklist.reduce<Record<string, number>>((acc, task) => {
    acc[task.date] = (acc[task.date] || 0) + 1;
    return acc;
  }, {});

  const dailyTasksData = {
    labels: Object.keys(dailyTasks).sort(),
    datasets: [
      {
        label: 'Tasks Added',
        data: Object.values(dailyTasks),
        backgroundColor: chartColors.lightPink,
        borderColor: chartColors.pink,
        fill: true,
      },
    ],
  };

  // Chart 8: Confirmed vs Pending Vendors
  const vendorStatus = data.vendors.reduce<Record<string, number>>(
    (acc, vendor) => {
      acc[vendor.final ? 'Confirmed' : 'Pending']++;
      return acc;
    },
    { Confirmed: 0, Pending: 0 }
  );

  const vendorStatusData = {
    labels: ['Confirmed', 'Pending'],
    datasets: [
      {
        data: [vendorStatus.Confirmed, vendorStatus.Pending],
        backgroundColor: [chartColors.green, chartColors.yellow],
      },
    ],
  };

  // Chart 9: Vendor Prices by Category
  const vendorPrices = data.vendors.reduce<Record<string, number[]>>((acc, vendor) => {
    if (!acc[vendor.type]) {
      acc[vendor.type] = [];
    }
    acc[vendor.type].push(vendor.price);
    return acc;
  }, {});

  const vendorPriceData = {
    labels: Object.keys(vendorPrices),
    datasets: [
      {
        label: 'Average Price',
        data: Object.values(vendorPrices).map(
          (prices) => prices.reduce((a, b) => a + b, 0) / prices.length
        ),
        backgroundColor: chartColors.lightPink,
        borderColor: chartColors.pink,
      },
    ],
  };

  // Chart 10: Accommodation Distribution
  const accommodationCounts = data.guests.reduce<Record<string, number>>((acc, guest) => {
    acc[guest.accommodation || 'Not Specified'] = (acc[guest.accommodation || 'Not Specified'] || 0) + 1;
    return acc;
  }, {});

  const accommodationData = {
    labels: Object.keys(accommodationCounts),
    datasets: [
      {
        label: 'Guests per Accommodation',
        data: Object.values(accommodationCounts),
        backgroundColor: Object.keys(accommodationCounts).map(
          (_, i) => `hsla(330, 81%, 60%, ${0.3 + (i * 0.1)})`
        ),
      },
    ],
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#FFE5EC] p-4 sm:p-6">
          <div className="text-center py-8 text-[#4a1d39]">Loading dashboard...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFE5EC] p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#EC4899]">Wedding Dashboard</h1>
            <p className="text-sm sm:text-base text-[#4a1d39] mt-1">Track your wedding planning progress</p>
          </div>

          {/* Metrics and Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Wedding Details Card */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Wedding Details</h3>
              <div className="space-y-2 sm:space-y-3">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[#EC4899]">Groom</div>
                  <div className="text-xs sm:text-sm text-[#4a1d39]">{data.setup.groomName}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[#EC4899]">Bride</div>
                  <div className="text-xs sm:text-sm text-[#4a1d39]">{data.setup.brideName}</div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[#EC4899]">Date</div>
                  <div className="text-xs sm:text-sm text-[#4a1d39]">
                    {new Date(data.setup.weddingDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-[#EC4899]">Venue</div>
                  <div className="text-xs sm:text-sm text-[#4a1d39]">{data.setup.weddingVenue}</div>
                </div>
              </div>
            </div>

            {/* Countdown Card */}
            <div className="bg-gradient-to-br from-[#f72585] to-[#EC4899] rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 text-white h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Countdown to the Big Day</h3>
              <div className="flex-grow flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold">
                    {daysRemaining.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm mt-1 sm:mt-2">days remaining</div>
                </div>
              </div>
            </div>

            {/* Budget Overview Card */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Budget Overview</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    ₱{totalBudget.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-[#4a1d39]">Total Budget</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-teal-600">
                    ₱{totalPaid.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-[#4a1d39]">Total Paid</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-purple-600">
                    ₱{budgetLeft.toLocaleString()}
                  </div>
                  <div className="text-xs sm:text-sm text-[#4a1d39]">Budget Left</div>
                </div>
              </div>
            </div>

            {/* Vendor Progress Card */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Vendor Progress</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-pink-600">
                    {totalVendors}
                  </div>
                  <div className="text-xs sm:text-sm text-[#4a1d39]">Vendors Sourced</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">
                    {vendorsPaid}
                  </div>
                  <div className="text-xs sm:text-sm text-[#4a1d39]">Vendors Paid</div>
                </div>
              </div>
            </div>

            {/* Guest Status Card */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Guest Status</h3>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-indigo-600">
                    {data.guests.length}
                  </div>
                  <div className="text-xs sm:text-sm text-[#4a1d39]">Total Guests</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {data.guests.filter(guest => guest.rsvp === 'Attending').length}
                  </div>
                  <div className="text-xs sm:text-sm text-[#4a1d39]">Confirmed Guests</div>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Expense Trend Chart */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Expense Trend</h3>
              <div className="w-full h-[200px] sm:h-[250px] md:h-[300px]">
                <Line
                  data={expenseTrendData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Expenses by Vendor Type Chart */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Expenses by Vendor Type</h3>
              <div className="w-full h-[200px] sm:h-[250px] md:h-[300px]">
                <Bar
                  data={vendorTypeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* RSVP Status Chart */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">RSVP Status</h3>
              <div className="w-full h-[200px] sm:h-[250px] md:h-[300px]">
                <Pie
                  data={rsvpData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 10,
                          font: {
                            size: 11
                          }
                        }
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Guest Tags Distribution Chart */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Guest Tags</h3>
              <div className="w-full h-[200px] sm:h-[250px] md:h-[300px]">
                <PolarArea
                  data={tagData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 10,
                          font: {
                            size: 11
                          }
                        }
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Task Completion Card */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Task Completion</h3>
              <div className="text-3xl sm:text-4xl font-bold text-[#4a1d39] text-center flex-grow flex items-center justify-center">
                <CountUp end={completionPercentage} duration={2.5} decimals={1} />%
              </div>
              <div className="text-xs sm:text-sm text-[#4a1d39]/70 text-center mt-2">
                {completedTasks} of {totalTasks} tasks completed
              </div>
            </div>

            {/* Daily Tasks Added Chart */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Daily Tasks</h3>
              <div className="w-full h-[200px] sm:h-[250px] md:h-[300px]">
                <Line
                  data={dailyTasksData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Confirmed vs Pending Vendors Chart */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Vendor Status</h3>
              <div className="w-full h-[200px] sm:h-[250px] md:h-[300px]">
                <Doughnut
                  data={vendorStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 10,
                          font: {
                            size: 11
                          }
                        }
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Vendor Prices by Category Chart */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Vendor Prices</h3>
              <div className="w-full h-[200px] sm:h-[250px] md:h-[300px]">
                <Radar
                  data={vendorPriceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>

            {/* Accommodation Distribution Chart */}
            <div className="bg-[#ffe5ec]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 h-full flex flex-col justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-[#4a1d39] mb-3 sm:mb-4">Accommodation Distribution</h3>
              <div className="w-full h-[200px] sm:h-[250px] md:h-[300px]">
                <Bar
                  data={accommodationData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}