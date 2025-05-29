'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { ref, set, onValue, remove } from 'firebase/database';
import ProtectedRoute from '@/components/ProtectedRoute';
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
        <div className="text-center py-8 text-gray-500">
          Loading guests...
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
      <div className="space-y-6">


        {/* Guest Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Guests</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{totalGuests}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Attending</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">{rsvpStats.attending}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Not Attending</h3>
            <p className="mt-2 text-3xl font-semibold text-red-600">{rsvpStats.notAttending}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">No Response</h3>
            <p className="mt-2 text-3xl font-semibold text-yellow-600">{rsvpStats.noResponse}</p>
          </div>
        </div>

        {/* Add/Edit Guest Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            {editingGuest ? 'Edit Guest' : 'Add New Guest'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={editingGuest?.name || newGuest.name}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, name: e.target.value })
                    : setNewGuest({ ...newGuest, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={editingGuest?.email || newGuest.email}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, email: e.target.value })
                    : setNewGuest({ ...newGuest, email: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={editingGuest?.phone || newGuest.phone}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, phone: e.target.value })
                    : setNewGuest({ ...newGuest, phone: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">RSVP Status</label>
              <select
                value={editingGuest?.rsvp || newGuest.rsvp}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, rsvp: e.target.value as Guest['rsvp'] })
                    : setNewGuest({ ...newGuest, rsvp: e.target.value as Guest['rsvp'] })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              >
                <option key="no-response" value="No Response">No Response</option>
                <option key="attending" value="Attending">Attending</option>
                <option key="wont-attend" value="Won't Attend">Won't Attend</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Invitation Status</label>
              <select
                value={editingGuest?.invitation || newGuest.invitation}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, invitation: e.target.value as Guest['invitation'] })
                    : setNewGuest({ ...newGuest, invitation: e.target.value as Guest['invitation'] })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              >
                <option key="not-sent" value="Not Sent">Not Sent</option>
                <option key="sent" value="Sent">Sent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Transport</label>
              <select
                value={editingGuest?.transport || newGuest.transport}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, transport: e.target.value as Guest['transport'] })
                    : setNewGuest({ ...newGuest, transport: e.target.value as Guest['transport'] })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              >
                <option key="select" value="">Select Transport</option>
                <option key="van-rental" value="Van Rental">Van Rental</option>
                <option key="own-mode" value="Own Mode">Own Mode</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Accommodation</label>
              <select
                value={editingGuest?.accommodation || newGuest.accommodation}
                onChange={(e) =>
                  editingGuest
                    ? setEditingGuest({ ...editingGuest, accommodation: e.target.value })
                    : setNewGuest({ ...newGuest, accommodation: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              >
                <option key="select" value="">Select Accommodation</option>
                {Array.isArray(weddingSetup?.accommodations) ? weddingSetup.accommodations.map((acc) => (
                  <option key={acc} value={acc}>
                    {acc}
                  </option>
                )) : null}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Tags</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {(editingGuest?.tags || newGuest.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        editingGuest
                          ? handleRemoveTag(editingGuest, tag)
                          : setNewGuest({ ...newGuest, tags: newGuest.tags.filter((t) => t !== tag) })
                      }
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-pink-200"
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
                    className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      editingGuest
                        ? handleAddTag(editingGuest)
                        : setNewGuest({ ...newGuest, tags: [...newGuest.tags, newTag] })
                    }
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-pink-700 bg-pink-100 hover:bg-pink-200"
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
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={editingGuest ? handleUpdateGuest : handleAddGuest}
              className="px-4 py-2 text-sm font-medium text-white bg-pink-500 rounded-md hover:bg-pink-600"
            >
              {editingGuest ? 'Update Guest' : 'Add Guest'}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search guests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            >
              <option key="all" value="all">All Tags</option>
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
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
            >
              <option key="all" value="all">All RSVPs</option>
              <option key="attending" value="Attending">Attending</option>
              <option key="wont-attend" value="Won't Attend">Not Attending</option>
              <option key="no-response" value="No Response">No Response</option>
            </select>
          </div>
        </div>

        {/* Guests List */}
        <div className="space-y-4">
          {filteredGuests.map((guest) => (
            <div
              key={guest.id}
              className="bg-white p-6 rounded-lg shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{guest.name}</h3>
                  {guest.email && (
                    <p className="text-sm text-gray-600">Email: {guest.email}</p>
                  )}
                  {guest.phone && (
                    <p className="text-sm text-gray-600">Phone: {guest.phone}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(guest.tags || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(guest)}
                    className="text-pink-600 hover:text-pink-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGuest(guest.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">RSVP Status: </span>
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
                  <span className="text-sm font-medium text-gray-700">Invitation: </span>
                  <span
                    className={`text-sm ${
                      guest.invitation === 'Sent' ? 'text-green-600' : 'text-yellow-600'
                    }`}
                  >
                    {guest.invitation}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Transport: </span>
                  <span className="text-sm text-gray-600">
                    {guest.transport || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">Accommodation: </span>
                  <span className="text-sm text-gray-600">
                    {guest.accommodation || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {filteredGuests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No guests found. Add a new guest to get started!
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 