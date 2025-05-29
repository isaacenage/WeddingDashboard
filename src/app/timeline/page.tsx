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
      <div className="space-y-6">
        <h1 className="text-3xl font-gitalian">Wedding Tasks</h1>

        {/* Add Task Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Task</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                onChange={(e) => handleOwnerChange(e.target.value as Owner)}
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
                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
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
              className="px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600"
            >
              Add Task
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="bg-white p-4 rounded-lg shadow flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter Owner:</label>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value as Owner | 'All')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            >
              <option value="All">All</option>
              <option value="Isaac">Isaac</option>
              <option value="Andrea">Andrea</option>
              <option value="Both">Both</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter Priority:</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value as Priority | 'All')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            >
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter Status:</label>
            <select
              value={filterCompleted}
              onChange={(e) => setFilterCompleted(e.target.value as 'All' | 'Done' | 'Not Done')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            >
              <option value="All">All</option>
              <option value="Done">Done</option>
              <option value="Not Done">Not Done</option>
            </select>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={toggleSortDirection}
                >
                  Date {sortDirection === 'asc' ? '↑' : '↓'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Done</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedTasks.map((task) => (
                <tr key={task.id} className={task.completed ? 'bg-purple-100' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{task.owner}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                    task.priority === 'High' ? 'text-red-600' :
                    task.priority === 'Medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {task.priority}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => handleToggleTask(task.id, e.target.checked)}
                      className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-500 hover:text-red-700"
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
    </ProtectedRoute>
  );
} 