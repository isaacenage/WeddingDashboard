'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebase } from '@/contexts/FirebaseContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Task } from '@/types/firebase';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

type Priority = 'High' | 'Medium' | 'Low';
type Owner = 'Isaac' | 'Andrea' | 'Both';

export default function CalendarPage() {
  const { user } = useAuth();
  const { tasks, addTask } = useFirebase();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newTask, setNewTask] = useState<Omit<Task, 'id'> & { date: string }>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    owner: 'Isaac',
    priority: 'Medium' as Priority,
    completed: false
  });

  // State for month and year dropdowns
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  // Update currentDate when month or year changes
  useEffect(() => {
    setCurrentDate(new Date(selectedYear, selectedMonth, 1));
  }, [selectedMonth, selectedYear]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      const taskDate = new Date(task.date);
      taskDate.setHours(0, 0, 0, 0);
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      return taskDate.getTime() === compareDate.getTime();
    });
  };

  const handlePrevMonth = () => {
    setSelectedMonth(prevMonth => (prevMonth === 0 ? 11 : prevMonth - 1));
    if (selectedMonth === 0) {
      setSelectedYear(prevYear => prevYear - 1);
    }
  };

  const handleNextMonth = () => {
    setSelectedMonth(prevMonth => (prevMonth === 11 ? 0 : prevMonth + 1));
    if (selectedMonth === 11) {
      setSelectedYear(prevYear => prevYear + 1);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsSidebarOpen(true);
  };

  const handleAddTaskClick = (date?: Date) => {
    if (date) {
      setNewTask(prev => ({ ...prev, date: date.toISOString().split('T')[0] }));
    } else {
      setNewTask(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
    }
    setIsAddTaskModalOpen(true);
  };

  const handleAddTaskSubmit = () => {
    if (!newTask.date || !newTask.description) {
      alert('Please fill out all fields.');
      return;
    }

    addTask(newTask);
    setIsAddTaskModalOpen(false);
    setNewTask({
      date: new Date().toISOString().split('T')[0],
      description: '',
      owner: 'Isaac',
      priority: 'Medium' as Priority,
      completed: false
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);
    const days = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-gray-50"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dayTasks = getTasksForDate(date);
      const isSelected = selectedDate &&
        selectedDate.getDate() === day &&
        selectedDate.getMonth() === currentDate.getMonth() &&
        selectedDate.getFullYear() === currentDate.getFullYear();

      days.push(
        <div
          key={day}
          onClick={() => handleDateClick(date)}
          className={`
            h-32 p-2 border border-gray-200 cursor-pointer
            transition-all duration-200 ease-in-out
            hover:bg-gray-50 hover:shadow-sm
            ${isSelected ? 'bg-pink-50 border-pink-300 shadow-md' : ''}
          `}
        >
          <div className="font-semibold text-gray-700">{day}</div>
          <div className="mt-1 space-y-1">
            {dayTasks.map((task) => {
              let bgColor = '';
              let textColor = '';
              if (task.owner === 'Isaac') {
                bgColor = 'bg-[#cbeef3]';
                textColor = 'text-black';
              } else if (task.owner === 'Andrea') {
                bgColor = 'bg-[#fb6f92]';
                textColor = 'text-white';
              } else {
                bgColor = 'bg-[#cdb4db]';
                textColor = 'text-white';
              }

              const completionStatus = task.completed ? '✅ Done' : '⏳ Pending';
              const tooltip = `📅 Date: ${task.date}\n📝 Task: ${task.description}\n👤 Owner: ${task.owner}\n⚠️ Priority: ${task.priority}\n${completionStatus}`;

              return (
                <div
                  key={task.id}
                  className={`
                    text-xs p-1 rounded truncate ${bgColor} ${textColor}
                    transition-all duration-200 ease-in-out
                    hover:shadow-sm
                  `}
                  title={tooltip}
                >
                  {task.description}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-lg">
        {/* Month and Year Selects */}
        <div className="flex items-center justify-between p-4 border-b">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            ←
          </button>
          <div className="flex space-x-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>{month}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            >
              {[...Array(20)].map((_, i) => {
                const year = new Date().getFullYear() - 10 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700"
            >
              {day}
            </div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFE5EC] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => handleAddTaskClick()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600 active:scale-95 transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              Add New Task
            </button>
          </div>

          {/* Calendar Layout with Sidebar */}
          <div className="flex gap-6">
            {/* Slide-in Sidebar */}
            <div
              className={`
                fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white shadow-lg
                transform transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              `}
            >
              <div className="h-full flex flex-col">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-800">Selected Date</h2>
                    <button
                      onClick={() => setIsSidebarOpen(false)}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                    >
                      <XMarkIcon className="h-6 w-6 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {selectedDate ? (
                    <>
                      <div className="text-center mb-6">
                        <div className="text-6xl font-bold text-pink-500 mb-2">
                          {selectedDate.getDate()}
                        </div>
                        <div className="text-xl font-semibold text-gray-700">
                          {selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800">Tasks</h3>
                        {getTasksForDate(selectedDate).length === 0 ? (
                          <p className="text-gray-500 text-sm">No tasks scheduled for this day.</p>
                        ) : (
                          <div className="space-y-2">
                            {getTasksForDate(selectedDate).map((task) => {
                              let bgColor = 'bg-pink-100';
                              let textColor = 'text-pink-800';
                              if (task.owner === 'Isaac') {
                                bgColor = 'bg-[#cbeef3]';
                                textColor = 'text-[#0f766e]';
                              } else if (task.owner === 'Andrea') {
                                bgColor = 'bg-[#fb6f92]';
                                textColor = 'text-white';
                              }

                              return (
                                <div
                                  key={task.id}
                                  className={`
                                    p-3 rounded-lg ${bgColor} ${textColor}
                                    transition-all duration-200 ease-in-out
                                    hover:shadow-md
                                  `}
                                >
                                  <div className="font-medium">{task.description}</div>
                                  <div className="text-sm mt-1">
                                    <span className="font-medium">Owner:</span> {task.owner}
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Priority:</span> {task.priority}
                                  </div>
                                  <div className="text-sm">
                                    <span className="font-medium">Status:</span>{' '}
                                    {task.completed ? '✅ Done' : '⏳ Pending'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleAddTaskClick(selectedDate)}
                        className="w-full mt-6 px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600 active:scale-95 transition-all duration-200"
                      >
                        + Add Task for {selectedDate.toLocaleDateString()}
                      </button>
                    </>
                  ) : (
                    <div className="text-center text-gray-500">
                      Select a date to view tasks
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-grow">
              {renderCalendar()}
            </div>
          </div>

          {/* Add Task Modal */}
          {isAddTaskModalOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm overflow-y-auto h-full w-full flex justify-center items-center">
              <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full mx-4">
                <h3 className="text-xl font-semibold mb-4">Add New Task</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <input
                      type="date"
                      value={newTask.date}
                      onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <select
                      value={newTask.owner}
                      onChange={(e) => setNewTask({ ...newTask, owner: e.target.value as Owner })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    >
                      <option value="Isaac">Isaac</option>
                      <option value="Andrea">Andrea</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Priority })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    onClick={() => setIsAddTaskModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 active:scale-95 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTaskSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600 active:scale-95 transition-all duration-200"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 