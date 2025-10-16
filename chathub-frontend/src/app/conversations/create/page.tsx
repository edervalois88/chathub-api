'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Contact {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

export default function CreateConversationPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newContactName, setNewContactName] = useState('');
  const { token } = useAuth();
  const router = useRouter();

  const fetchContacts = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3000/chat/contacts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [token]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !token) return;

    try {
      const response = await fetch('http://localhost:3000/chat/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newContactName }),
      });
      if (!response.ok) throw new Error('Failed to create contact');
      setNewContactName('');
      fetchContacts(); // Refresh the list
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateConversation = async (contactId: string) => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3000/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ contactId, channel: 'web' }), // Default channel to 'web'
      });
      if (!response.ok) throw new Error('Failed to create conversation');
      const newConversation = await response.json();
      router.push(`/chat/${newConversation._id}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-japifon-gray-light">
      <header className="flex items-center justify-between p-4 bg-white shadow-md">
        <button 
          onClick={() => router.push('/')}
          className="rounded-md bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-300"
        >
          &larr; Back
        </button>
        <h1 className="text-xl font-bold text-japifon-dark-blue">Start a New Conversation</h1>
        <div className="w-20"></div> {/* Spacer */}
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {/* Create New Contact Form */}
          <div className="p-4 bg-white rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold text-japifon-dark-blue mb-3">Create New Contact</h2>
            <form onSubmit={handleCreateContact} className="flex gap-2">
              <input 
                type="text"
                placeholder="Enter new contact name..."
                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-japifon-blue"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
              />
              <button type="submit" className="px-4 py-2 rounded-md bg-japifon-green text-white font-semibold hover:bg-green-600">
                Create
              </button>
            </form>
          </div>

          {/* Contact List */}
          <div className="bg-white rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-japifon-dark-blue p-4 border-b">Or Select an Existing Contact</h2>
            {error && <p className="p-4 text-red-500">{error}</p>}
            <ul className="divide-y divide-gray-200">
              {contacts.map((contact) => (
                <li 
                  key={contact._id}
                  onClick={() => handleCreateConversation(contact._id)}
                  className="p-4 flex justify-between items-center cursor-pointer hover:bg-japifon-light-green"
                >
                  <span className="font-medium text-japifon-gray-dark">{contact.name}</span>
                  <button className="px-3 py-1 text-sm rounded-md bg-japifon-blue text-white hover:bg-japifon-dark-blue">
                    Chat
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
