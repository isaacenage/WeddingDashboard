'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { ref, set, onValue, remove } from 'firebase/database';
import ProtectedRoute from '@/components/ProtectedRoute';

type Owner = 'Isaac' | 'Andrea' | 'Both';
type Priority = 'Low' | 'Medium' | 'High';

interface Task {
  id: string;
  date: string;
  description: string;
  owner: Owner;
  priority: Priority;
  completed: boolean;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    date: '',
    description: '',
    owner: 'Both',
    priority: 'Medium',
    completed: false,
  });
  const [filterOwner, setFilterOwner] = useState<Owner | ''>('');
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('');
  const [filterCompleted, setFilterCompleted] = useState('All');
  const [sortBy, setSortBy] = useState<'date' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i);

  useEffect(() => {
    if (!user) return;

    const tasksRef = ref(db, `checklist/${user.uid}`);
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tasksArray = Object.entries(data).map(([id, task]: [string, any]) => ({
          id,
          ...task,
        }));
        setTasks(tasksArray);
      } else {
        setTasks([]);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleDateClick = (day: number | null) => {
    if (day) {
      const date = new Date(selectedYear, selectedMonth, day);
      setSelectedDate(date);
      setNewTask(prev => ({ ...prev, date: format(date, 'yyyy-MM-dd') }));
    }
  };

  const handleOwnerChange = (owner: Owner) => {
    setNewTask(prev => ({ ...prev, owner }));
  };

  const handlePriorityChange = (priority: Priority) => {
    setNewTask(prev => ({ ...prev, priority }));
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const taskId = Math.random().toString(36).substr(2, 9);
    const task: Task = {
      id: taskId,
      ...newTask,
    };

    try {
      await set(ref(db, `checklist/${user.uid}/${taskId}`), task);
      setNewTask({
        date: '',
        description: '',
        owner: 'Both',
        priority: 'Medium',
        completed: false,
      });
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const handleToggleTask = async (id: string, completed: boolean) => {
    if (!user) return;

    try {
      await set(ref(db, `checklist/${user.uid}/${id}/completed`), completed);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!user) return;

    try {
      await remove(ref(db, `checklist/${user.uid}/${id}`));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return tasks.filter(task => task.date === dateStr);
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'High':
        return 'bg-red-500/20 text-red-700';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-700';
      case 'Low':
        return 'bg-green-500/20 text-green-700';
      default:
        return 'bg-gray-500/20 text-gray-700';
    }
  };

  const getOwnerColor = (owner: Owner) => {
    switch (owner) {
      case 'Isaac':
        return 'bg-blue-500/20 text-blue-700';
      case 'Andrea':
        return 'bg-purple-500/20 text-purple-700';
      case 'Both':
        return 'bg-pink-500/20 text-pink-700';
      default:
        return 'bg-gray-500/20 text-gray-700';
    }
  };

  const calendarDays = (() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }

    return days;
  })();

  const handleSort = (by: 'date' | 'description') => {
    if (sortBy === by) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(by);
    }
  };

  const sortedFilteredTasks = [...tasks]
    .filter(task => (filterOwner === '' || task.owner === filterOwner) &&
      (filterPriority === '' || task.priority === filterPriority) &&
      (filterCompleted === 'All' || (task.completed ? 'Done' : 'Not Done') === filterCompleted))
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return a.description.localeCompare(b.description);
      }
    });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFE5EC] p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Calendar Header */}
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#EC4899]">Wedding Calendar</h1>
                <p className="text-[#4a1d39] mt-1">Plan your wedding events and track important dates</p>
              </div>
              <div className="flex items-center gap-4">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] bg-white/50"
                >
                  {months.map((month, index) => (
                    <option key={month} value={index} className="text-[#4a1d39]">
                      {month}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] bg-white/50"
                >
                  {years.map((year) => (
                    <option key={year} value={year} className="text-[#4a1d39]">
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <div className="grid grid-cols-7 gap-1 sm:gap-4">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] sm:text-sm font-medium text-[#EC4899] py-1 sm:py-2"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((day, index) => {
                const date = day ? new Date(selectedYear, selectedMonth, day) : null;
                const hasTasks = date ? getTasksForDate(date).length > 0 : false;
                const isSelected = selectedDate && day && selectedDate.getDate() === day;

                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(day)}
                    className={`relative aspect-square p-1 sm:p-2 rounded-lg cursor-pointer transition-all ${
                      day ? 'hover:bg-white/70' : ''
                    } ${
                      hasTasks ? 'bg-[#EC4899]' : 'bg-white/50'
                    } ${
                      isSelected ? 'ring-2 ring-[#EC4899]' : ''
                    }`}
                  >
                    {day && (
                      <span className={`text-[10px] sm:text-sm font-bold ${
                        hasTasks ? 'text-white' : 'text-[#4a1d39]'
                      }`}>
                        {day}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar */}
          {selectedDate && (
            <div 
              className="fixed inset-0 bg-[#ffe5ec] flex items-center justify-center p-4 sm:p-6 z-50"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedDate(null);
                }
              }}
            >
              <div 
                className="bg-[#ffd5e0] rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl sm:text-2xl font-semibold text-[#EC4899]">
                    {format(selectedDate, 'MMMM d, yyyy')}
                  </h2>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="text-[#EC4899] hover:text-pink-700 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Add Task Form */}
                <form onSubmit={handleAddTask} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-[#EC4899] mb-1">Task Description</label>
                    <input
                      type="text"
                      value={newTask.description}
                      onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#EC4899] mb-1">Assigned To</label>
                    <select
                      value={newTask.owner}
                      onChange={(e) => handleOwnerChange(e.target.value as Owner)}
                      className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] bg-white"
                    >
                      <option value="Isaac">Isaac</option>
                      <option value="Andrea">Andrea</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#EC4899] mb-1">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                      className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] bg-white"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 sm:py-3 rounded-lg bg-[#EC4899] text-white hover:bg-pink-600 active:scale-95 transition-all text-sm font-medium shadow-lg hover:shadow-xl"
                  >
                    Add Task
                  </button>
                </form>

                {/* Tasks List */}
                <div className="space-y-2">
                  {getTasksForDate(selectedDate).map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-lg p-3 sm:p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                          className="w-4 h-4 text-[#EC4899] border-[#EC4899]/30 rounded focus:ring-[#EC4899]"
                        />
                        <div>
                          <p className={`text-sm font-medium ${task.completed ? 'line-through text-[#4a1d39]/50' : 'text-[#4a1d39]'}`}>
                            {task.description}
                          </p>
                          <div className="flex gap-2 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getOwnerColor(task.owner)}`}>
                              {task.owner}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-[#EC4899] hover:text-pink-700 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Task Table */}
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#EC4899] mb-4">All Tasks</h2>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Assigned To</label>
                <select
                  value={filterOwner}
                  onChange={(e) => setFilterOwner(e.target.value as Owner | '')}
                  className="w-full p-2 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] bg-white"
                >
                  <option value="">All</option>
                  <option value="Isaac">Isaac</option>
                  <option value="Andrea">Andrea</option>
                  <option value="Both">Both</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value as Priority | '')}
                  className="w-full p-2 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] bg-white"
                >
                  <option value="">All</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Status</label>
                <select
                  value={filterCompleted}
                  onChange={(e) => setFilterCompleted(e.target.value)}
                  className="w-full p-2 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] bg-white"
                >
                  <option value="All">All</option>
                  <option value="Done">Done</option>
                  <option value="Not Done">Not Done</option>
                </select>
              </div>
            </div>

            {/* Task Table Content */}
            <div className="overflow-x-auto rounded-xl shadow">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th 
                      className="px-4 py-2 text-left text-xs sm:text-sm font-bold text-[#4a1d39] uppercase tracking-wider bg-[#ffcce4] cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      {sortBy === 'date' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </th>
                    <th className="px-4 py-2 text-left text-xs sm:text-sm font-bold text-[#4a1d39] uppercase tracking-wider bg-[#ffcce4]">Task</th>
                    <th className="px-4 py-2 text-left text-xs sm:text-sm font-bold text-[#4a1d39] uppercase tracking-wider bg-[#ffcce4]">Assigned To</th>
                    <th className="px-4 py-2 text-left text-xs sm:text-sm font-bold text-[#4a1d39] uppercase tracking-wider bg-[#ffcce4]">Priority</th>
                    <th className="px-4 py-2 text-left text-xs sm:text-sm font-bold text-[#4a1d39] uppercase tracking-wider bg-[#ffcce4]">Done</th>
                    <th className="px-4 py-2 text-left text-xs sm:text-sm font-bold text-[#4a1d39] uppercase tracking-wider bg-[#ffcce4]"></th>{/* Delete column */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedFilteredTasks.map((task, index) => (
                    <tr key={task.id} className={index % 2 === 0 ? 'bg-pink-50' : 'bg-pink-100'}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 sm:text-base">{format(new Date(task.date), 'yyyy-MM-dd')}</td>
                      <td className="px-4 py-2 whitespace-pre-wrap text-sm text-gray-800 sm:text-base">{task.description}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 sm:text-base">{task.owner}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 sm:text-base">{task.priority}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800 sm:text-base">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                          className="w-4 h-4 text-[#EC4899] border-[#EC4899]/30 rounded focus:ring-[#EC4899]"
                        />
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium sm:text-base">
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}