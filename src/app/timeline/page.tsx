'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFirebase } from '@/contexts/FirebaseContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Task } from '@/types/firebase';

type Priority = 'High' | 'Medium' | 'Low';
type Owner = 'Isaac' | 'Andrea' | 'Both';

export default function TimelinePage() {
  const { user } = useAuth();
  const { tasks, addTask, updateTask, deleteTask } = useFirebase();
  const [newTask, setNewTask] = useState<Omit<Task, 'id'>>({
    date: '',
    description: '',
    owner: 'Isaac',
    priority: 'Medium' as Priority,
    completed: false
  });

  // Sorting state
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filtering state
  const [filterOwner, setFilterOwner] = useState<Owner | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [filterCompleted, setFilterCompleted] = useState<'All' | 'Done' | 'Not Done'>('All');

  const handleAddTask = () => {
    if (!newTask.date || !newTask.description) {
      alert('Please fill out all fields.');
      return;
    }
    addTask(newTask);
    setNewTask({
      date: '',
      description: '',
      owner: 'Isaac',
      priority: 'Medium' as Priority,
      completed: false
    });
  };

  const handleToggleTask = (id: string, completed: boolean) => {
    updateTask(id, { completed });
  };

  const handleDeleteTask = (id: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(id);
    }
  };

  const handlePriorityChange = (priority: Priority) => {
    setNewTask({ ...newTask, priority });
  };

  const handleOwnerChange = (owner: Owner) => {
    setNewTask({ ...newTask, owner });
  }

  // Filtered and sorted tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filteredTasks = tasks;

    // Apply filters
    if (filterOwner !== 'All') {
      filteredTasks = filteredTasks.filter(task => task.owner === filterOwner);
    }
    if (filterPriority !== 'All') {
      filteredTasks = filteredTasks.filter(task => task.priority === filterPriority);
    }
    if (filterCompleted !== 'All') {
      filteredTasks = filteredTasks.filter(task => 
        filterCompleted === 'Done' ? task.completed : !task.completed
      );
    }

    // Apply sorting
    return filteredTasks.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (sortDirection === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }, [tasks, filterOwner, filterPriority, filterCompleted, sortDirection]);

  const toggleSortDirection = () => {
    setSortDirection(prevDir => prevDir === 'asc' ? 'desc' : 'asc');
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFE5EC] p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#EC4899]">Wedding Tasks</h1>

        {/* Add Task Form */}
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-[#EC4899] mb-4">Add New Task</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Date</label>
              <input
                type="date"
                value={newTask.date}
                onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Description</label>
              <input
                type="text"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Assigned To</label>
              <select
                value={newTask.owner}
                onChange={(e) => handleOwnerChange(e.target.value as Owner)}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
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
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleAddTask}
                className="px-4 py-2 sm:py-3 rounded-lg bg-[#EC4899] text-white hover:bg-pink-600 active:scale-95 transition-all text-sm font-medium shadow-lg hover:shadow-xl"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Filter Owner:</label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value as Owner | 'All')}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
            >
              <option value="All">All</option>
              <option value="Isaac">Isaac</option>
              <option value="Andrea">Andrea</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Filter Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as Priority | 'All')}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
            >
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
                <label className="block text-sm font-medium text-[#EC4899] mb-1">Filter Status:</label>
            <select
              value={filterCompleted}
              onChange={(e) => setFilterCompleted(e.target.value as 'All' | 'Done' | 'Not Done')}
                  className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
            >
              <option value="All">All</option>
              <option value="Done">Done</option>
              <option value="Not Done">Not Done</option>
            </select>
              </div>
          </div>
        </div>

        {/* Tasks Table */}
          <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/50">
                <thead>
                  <tr className="bg-white/50">
                <th 
                      className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-[#EC4899] cursor-pointer hover:text-pink-700"
                  onClick={toggleSortDirection}
                >
                  Date {sortDirection === 'asc' ? '↑' : '↓'}
                </th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-[#EC4899]">Task</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-[#EC4899]">Assigned To</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-[#EC4899]">Priority</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-[#EC4899]">Done</th>
                    <th className="px-3 sm:px-4 py-2 text-left text-xs sm:text-sm font-medium text-[#EC4899]">Actions</th>
              </tr>
            </thead>
                <tbody className="divide-y divide-white/50">
              {filteredAndSortedTasks.map((task) => (
                    <tr key={task.id} className={`hover:bg-white/30 transition-colors ${task.completed ? 'bg-white/50' : ''}`}>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39]">{task.date}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39]">{task.description}</td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39]">{task.owner}</td>
                      <td className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium ${
                        task.priority === 'High' ? 'text-[#EC4899]' :
                        task.priority === 'Medium' ? 'text-[#EC4899]/80' :
                        'text-[#EC4899]/60'
                  }`}>
                    {task.priority}
                  </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39]">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                          className="rounded border-[#EC4899]/30 text-[#EC4899] focus:ring-[#EC4899]"
                    />
                  </td>
                      <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-[#4a1d39]">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                          className="text-[#EC4899] hover:text-pink-700 transition-colors"
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