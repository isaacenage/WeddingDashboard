'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { ref, set, onValue, remove } from 'firebase/database';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import { Guest, WeddingSetup } from '@/types';

export default function GuestsPage() {
  const { user } = useAuth();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [weddingSetup, setWeddingSetup] = useState<WeddingSetup | null>(null);
  const [newGuest, setNewGuest] = useState<Omit<Guest, 'id'>>({
    name: '',
    email: '',
    phone: '',
    rsvp: 'No Response',
    invitation: 'Not Sent',
    transport: '',
    accommodation: '',
    tags: [],
  });
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [filterRSVP, setFilterRSVP] = useState('all');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (!user) return;

    // Fetch guests
    const guestsRef = ref(db, `guests/${user.uid}`);
    const unsubscribeGuests = onValue(guestsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const guestsArray = Object.entries(data).map(([id, guest]) => ({
          id,
          ...(guest as Omit<Guest, 'id'>),
        }));
        setGuests(guestsArray.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        setGuests([]);
      }
    });

    // Fetch wedding setup for tags and accommodations
    const setupRef = ref(db, `weddingSetup/${user.uid}`);
    const unsubscribeSetup = onValue(setupRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Ensure accommodations is always an array
        setWeddingSetup({
          ...data,
          accommodations: data.accommodations || [],
          guestTags: data.guestTags || [],
        } as WeddingSetup);
      } else {
        // Initialize with empty arrays and default values if no data exists
        setWeddingSetup({
          groomName: '',
          brideName: '',
          weddingDate: '',
          weddingVenue: '',
          currency: '₱',
          accommodations: [],
          guestTags: [],
        } as WeddingSetup);
      }
    });

    return () => {
      unsubscribeGuests();
      unsubscribeSetup();
    };
  }, [user]);

  const handleAddGuest = () => {
    if (!user || !newGuest.name) return;

    const guestsRef = ref(db, `guests/${user.uid}`);
    const newGuestRef = ref(db, `guests/${user.uid}/${Date.now()}`);
    set(newGuestRef, newGuest);
    setNewGuest({
      name: '',
      email: '',
      phone: '',
      rsvp: 'No Response',
      invitation: 'Not Sent',
      transport: '',
      accommodation: '',
      tags: [],
    });
  };

  const handleUpdateGuest = () => {
    if (!user || !editingGuest) return;

    const guestRef = ref(db, `guests/${user.uid}/${editingGuest.id}`);
    set(guestRef, {
      name: editingGuest.name,
      email: editingGuest.email,
      phone: editingGuest.phone,
      rsvp: editingGuest.rsvp,
      invitation: editingGuest.invitation,
      transport: editingGuest.transport,
      accommodation: editingGuest.accommodation,
      tags: editingGuest.tags,
    });
    setEditingGuest(null);
  };

  const handleDeleteGuest = (guestId: string) => {
    if (!user) return;

    const guestRef = ref(db, `guests/${user.uid}/${guestId}`);
    remove(guestRef);
  };

  const handleEditClick = (guest: Guest) => {
    setEditingGuest(guest);
  };

  const handleAddTag = (guest: Guest) => {
    if (!user || !newTag || guest.tags.includes(newTag)) return;

    const guestRef = ref(db, `guests/${user.uid}/${guest.id}`);
    set(guestRef, {
      ...guest,
      tags: [...guest.tags, newTag],
    });
    setNewTag('');
  };

  const handleRemoveTag = (guest: Guest, tagToRemove: string) => {
    if (!user) return;

    const guestRef = ref(db, `guests/${user.uid}/${guest.id}`);
    set(guestRef, {
      ...guest,
      tags: guest.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  if (!Array.isArray(guests)) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-[#FFE5EC] p-4 sm:p-6">
          <div className="text-center py-8 text-[#4a1d39]">
          Loading guests...
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  const filteredGuests = guests.filter((guest) => {
    const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = filterTag === 'all' || guest.tags.includes(filterTag);
    const matchesRSVP = filterRSVP === 'all' || guest.rsvp === filterRSVP;
    return matchesSearch && matchesTag && matchesRSVP;
  });

  const uniqueTags = Array.from(new Set(guests.flatMap((g) => g.tags || [])));

  const rsvpStats = {
    attending: guests.filter((g) => g.rsvp === 'Attending').length,
    notAttending: guests.filter((g) => g.rsvp === "Won't Attend").length,
    noResponse: guests.filter((g) => g.rsvp === 'No Response').length,
  };

  const totalGuests = guests.length;
  const totalAttending = rsvpStats.attending;

  return (
    <ProtectedRoute>
      <Layout>
        <div className="min-h-screen bg-[#FFE5EC] p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#EC4899]">Guest List</h1>
              <p className="text-[#4a1d39] mt-1">Manage your wedding guests and track RSVPs</p>
            </div>

        {/* Guest Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
                <h3 className="text-sm font-medium text-[#EC4899]">Total Guests</h3>
                <p className="mt-2 text-3xl font-semibold text-[#4a1d39]">{totalGuests}</p>
          </div>
              <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
                <h3 className="text-sm font-medium text-[#EC4899]">Attending</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">{rsvpStats.attending}</p>
          </div>
              <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
                <h3 className="text-sm font-medium text-[#EC4899]">Not Attending</h3>
            <p className="mt-2 text-3xl font-semibold text-red-600">{rsvpStats.notAttending}</p>
          </div>
              <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
                <h3 className="text-sm font-medium text-[#EC4899]">No Response</h3>
            <p className="mt-2 text-3xl font-semibold text-yellow-600">{rsvpStats.noResponse}</p>
          </div>
        </div>

        {/* Add/Edit Guest Form */}
            <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
              <h2 className="text-xl font-semibold text-[#EC4899] mb-4">
            {editingGuest ? 'Edit Guest' : 'Add New Guest'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                  <label className="block text-sm font-medium text-[#EC4899]">Name</label>
              <input
                type="text"
                value={editingGuest?.name || newGuest.name}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, name: e.target.value })
                    : setNewGuest({ ...newGuest, name: e.target.value })
                }
                    className="mt-1 block w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
              />
            </div>
            <div>
                  <label className="block text-sm font-medium text-[#EC4899]">Email</label>
              <input
                type="email"
                value={editingGuest?.email || newGuest.email}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, email: e.target.value })
                    : setNewGuest({ ...newGuest, email: e.target.value })
                }
                    className="mt-1 block w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
              />
            </div>
            <div>
                  <label className="block text-sm font-medium text-[#EC4899]">Phone</label>
              <input
                type="tel"
                value={editingGuest?.phone || newGuest.phone}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, phone: e.target.value })
                    : setNewGuest({ ...newGuest, phone: e.target.value })
                }
                    className="mt-1 block w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
              />
            </div>
            <div>
                  <label className="block text-sm font-medium text-[#EC4899]">RSVP Status</label>
              <select
                value={editingGuest?.rsvp || newGuest.rsvp}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, rsvp: e.target.value as Guest['rsvp'] })
                    : setNewGuest({ ...newGuest, rsvp: e.target.value as Guest['rsvp'] })
                }
                    className="mt-1 block w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
              >
                    <option value="No Response">No Response</option>
                    <option value="Attending">Attending</option>
                    <option value="Won't Attend">Won't Attend</option>
              </select>
            </div>
            <div>
                  <label className="block text-sm font-medium text-[#EC4899]">Invitation Status</label>
              <select
                value={editingGuest?.invitation || newGuest.invitation}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, invitation: e.target.value as Guest['invitation'] })
                    : setNewGuest({ ...newGuest, invitation: e.target.value as Guest['invitation'] })
                }
                    className="mt-1 block w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
              >
                    <option value="Not Sent">Not Sent</option>
                    <option value="Sent">Sent</option>
              </select>
            </div>
            <div>
                  <label className="block text-sm font-medium text-[#EC4899]">Transport</label>
              <select
                value={editingGuest?.transport || newGuest.transport}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, transport: e.target.value as Guest['transport'] })
                    : setNewGuest({ ...newGuest, transport: e.target.value as Guest['transport'] })
                }
                    className="mt-1 block w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
              >
                    <option value="">Select Transport</option>
                    <option value="Van Rental">Van Rental</option>
                    <option value="Own Mode">Own Mode</option>
              </select>
            </div>
            <div>
                  <label className="block text-sm font-medium text-[#EC4899]">Accommodation</label>
              <select
                value={editingGuest?.accommodation || newGuest.accommodation}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, accommodation: e.target.value })
                    : setNewGuest({ ...newGuest, accommodation: e.target.value })
                }
                    className="mt-1 block w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
              >
                    <option value="">Select Accommodation</option>
                {Array.isArray(weddingSetup?.accommodations) ? weddingSetup.accommodations.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                )) : null}
              </select>
            </div>
            <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-[#EC4899]">Tags</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {(editingGuest?.tags || newGuest.tags || []).map((tag) => (
                  <span
                    key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EC4899]/20 text-[#EC4899]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        editingGuest
                          ? handleRemoveTag(editingGuest, tag)
                          : setNewGuest({ ...newGuest, tags: newGuest.tags.filter((t) => t !== tag) })
                      }
                          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#EC4899]/30"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag..."
                        className="block w-32 p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      editingGuest
                        ? handleAddTag(editingGuest)
                        : setNewGuest({ ...newGuest, tags: [...newGuest.tags, newTag] })
                    }
                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-[#EC4899] bg-[#EC4899]/20 hover:bg-[#EC4899]/30"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {editingGuest && (
              <button
                onClick={() => setEditingGuest(null)}
                    className="px-4 py-2 text-sm font-medium text-[#4a1d39] bg-white/50 border border-[#EC4899]/30 rounded-lg hover:bg-white/70 transition-all"
              >
                Cancel
              </button>
            )}
            <button
              onClick={editingGuest ? handleUpdateGuest : handleAddGuest}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#EC4899] rounded-lg hover:bg-pink-600 active:scale-95 transition-all shadow-lg hover:shadow-xl"
            >
              {editingGuest ? 'Update Guest' : 'Add Guest'}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
            <div className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39] placeholder-[#EC4899]/70"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
                    className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
            >
                    <option value="all">All Tags</option>
              {Array.isArray(weddingSetup?.guestTags) ? weddingSetup.guestTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              )) : null}
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterRSVP}
              onChange={(e) => setFilterRSVP(e.target.value)}
                    className="w-full p-2 sm:p-3 border border-[#EC4899]/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EC4899] focus:border-transparent transition-all text-sm text-[#4a1d39]"
            >
                    <option value="all">All RSVPs</option>
                    <option value="Attending">Attending</option>
                    <option value="Won't Attend">Not Attending</option>
                    <option value="No Response">No Response</option>
            </select>
                </div>
          </div>
        </div>

        {/* Guests List */}
        <div className="space-y-4">
          {filteredGuests.map((guest) => (
            <div
              key={guest.id}
                  className="bg-[#ffd5e0]/90 rounded-2xl shadow-[0_10px_25px_rgba(236,72,153,0.3)] p-4 sm:p-6"
            >
              <div className="flex justify-between items-start">
                <div>
                      <h3 className="text-lg font-semibold text-[#4a1d39]">{guest.name}</h3>
                  {guest.email && (
                        <p className="text-sm text-[#4a1d39]/70">Email: {guest.email}</p>
                  )}
                  {guest.phone && (
                        <p className="text-sm text-[#4a1d39]/70">Phone: {guest.phone}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(guest.tags || []).map((tag) => (
                      <span
                        key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EC4899]/20 text-[#EC4899]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(guest)}
                        className="text-[#EC4899] hover:text-pink-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGuest(guest.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                      <span className="text-sm font-medium text-[#EC4899]">RSVP Status: </span>
                  <span
                    className={`text-sm ${
                      guest.rsvp === 'Attending'
                        ? 'text-green-600'
                        : guest.rsvp === "Won't Attend"
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {guest.rsvp}
                  </span>
                </div>
                <div>
                      <span className="text-sm font-medium text-[#EC4899]">Invitation: </span>
                  <span
                    className={`text-sm ${
                      guest.invitation === 'Sent' ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    {guest.invitation}
                  </span>
                </div>
                <div>
                      <span className="text-sm font-medium text-[#EC4899]">Transport: </span>
                      <span className="text-sm text-[#4a1d39]/70">
                    {guest.transport || 'Not specified'}
                  </span>
                </div>
                <div>
                      <span className="text-sm font-medium text-[#EC4899]">Accommodation: </span>
                      <span className="text-sm text-[#4a1d39]/70">
                    {guest.accommodation || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredGuests.length === 0 && (
                <div className="text-center py-8 text-[#4a1d39]">
              No guests found. Add a new guest to get started!
            </div>
          )}
        </div>
      </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
} 