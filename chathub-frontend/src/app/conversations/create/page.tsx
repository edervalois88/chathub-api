'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Contact {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export default function CreateConversationPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newContactName, setNewContactName] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchContacts = async () => {
    if (!token) return;
    setLoadingContacts(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/contacts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error('No fue posible obtener los contactos');
      }
      const data = await response.json();
      setContacts(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [token]);

  const handleCreateContact = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newContactName.trim() || !token) return;

    try {
      setCreating(true);
      const response = await fetch(`${API_BASE_URL}/chat/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newContactName }),
      });
      if (!response.ok) throw new Error('No se pudo crear el contacto');
      setNewContactName('');
      await fetchContacts();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleCreateConversation = async (contactId: string) => {
    if (!token) return;
    setCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contactId, channel: 'Web Chat' }),
      });
      if (!response.ok) throw new Error('No se pudo crear la conversación');
      const newConversation = await response.json();
      router.push(`/chat/${newConversation._id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-[#FFE8F5]">
      <header className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur">
        <button
          onClick={() => router.back()}
          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-[#255FED] hover:text-[#255FED]"
        >
          ← Regresar
        </button>
        <div className="text-center">
          <h1 className="text-lg font-semibold text-[#10276F]">
            Nueva conversación
          </h1>
          <p className="text-xs text-slate-500">
            {user?.organization?.name ?? 'Japifon'} · Selecciona o crea un
            contacto
          </p>
        </div>
        <div className="w-24" />
      </header>

      <main className="flex flex-1 justify-center overflow-y-auto px-6 py-8">
        <div className="flex w-full max-w-4xl flex-col gap-6 md:flex-row">
          <section className="flex-1 rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#10276F]">
              Crear contacto
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Registra rápidamente un contacto para iniciar la conversación.
            </p>
            <form onSubmit={handleCreateContact} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="contactName"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  Nombre del contacto
                </label>
                <input
                  id="contactName"
                  type="text"
                  placeholder="Ej. María López · Compras"
                  className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2 shadow-sm focus:border-[#255FED] focus:outline-none focus:ring-2 focus:ring-[#255FED]/40"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                />
              </div>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={creating || !newContactName.trim()}
                className="rounded-full bg-gradient-to-r from-[#255FED] to-[#E4007C] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#255FED] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear contacto'}
              </button>
            </form>
          </section>

          <section className="flex-[1.2] rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#10276F]">
                  Contactos existentes
                </h2>
                <p className="text-xs text-slate-500">
                  Selecciona un contacto para abrir una nueva conversación.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                {contacts.length} contactos
              </span>
            </div>

            {loadingContacts ? (
              <p className="mt-6 text-sm text-slate-500">
                Cargando contactos...
              </p>
            ) : contacts.length === 0 ? (
              <p className="mt-6 text-sm text-slate-500">
                Aún no tienes contactos registrados. ¡Crea uno para empezar!
              </p>
            ) : (
              <ul className="mt-6 divide-y divide-slate-100">
                {contacts.map((contact) => (
                  <li key={contact._id} className="py-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#10276F]">
                          {contact.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {contact.email ?? contact.phone ?? 'Sin datos extra'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCreateConversation(contact._id)}
                        className="rounded-full border border-transparent bg-[#255FED] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-[#173DA6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#255FED]"
                      >
                        Iniciar chat
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
