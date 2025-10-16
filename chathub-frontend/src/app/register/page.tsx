'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export default function RegisterPage() {
  const router = useRouter();
  const { setToken } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    password: '',
    organizationName: '',
    organizationSlug: '',
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () =>
      formData.username.trim().length > 0 &&
      formData.password.trim().length >= 8 &&
      formData.organizationName.trim().length > 0,
    [formData],
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (slugTouched) {
      return;
    }
    const autoSlug = slugify(formData.organizationName).slice(0, 48);
    setFormData((prev) =>
      prev.organizationSlug === autoSlug
        ? prev
        : { ...prev, organizationSlug: autoSlug },
    );
  }, [formData.organizationName, slugTouched]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!registerResponse.ok) {
        const errorData = await registerResponse.json();
        throw new Error(errorData.message || 'No fue posible registrarte');
      }

      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      if (!loginResponse.ok) {
        throw new Error(
          'Registro completado, pero ocurrio un error al iniciar sesion. Intenta ingresar manualmente.',
        );
      }

      const authData = await loginResponse.json();
      setToken(authData.access_token, authData.user);
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#10276F] via-[#173DA6] to-[#E4007C] px-4 py-16">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl lg:grid lg:grid-cols-2">
        <div className="hidden bg-[#10276F] p-10 text-white lg:block">
          <h1 className="text-3xl font-bold">Japifon - ChatHub</h1>
          <p className="mt-6 text-sm text-white/80">
            Activa tu bandeja omnicanal en minutos. Crea tu organizacion, invita
            agentes y centraliza conversaciones.
          </p>
          <div className="mt-12 space-y-4 text-sm text-white/85">
            <p>- Plataforma multiempresa</p>
            <p>- Conversaciones en tiempo real</p>
            <p>- Control de agentes y contactos</p>
          </div>
        </div>
        <div className="p-10">
          <h2 className="text-2xl font-semibold text-[#10276F]">
            Crea tu cuenta empresarial
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Completa los datos para generar tu organizacion en Japifon.
          </p>
          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="organizationName"
                className="text-sm font-medium text-slate-700"
              >
                Nombre de la organizacion
              </label>
              <input
                id="organizationName"
                name="organizationName"
                type="text"
                required
                placeholder="Ej. Japifon Telecom"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-[#E4007C] focus:outline-none focus:ring-2 focus:ring-[#E4007C]/40"
                value={formData.organizationName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label
                htmlFor="organizationSlug"
                className="text-sm font-medium text-slate-700"
              >
                Identificador publico (slug)
              </label>
              <input
                id="organizationSlug"
                name="organizationSlug"
                type="text"
                placeholder="ej. japifon-telecom"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-[#E4007C] focus:outline-none focus:ring-2 focus:ring-[#E4007C]/40"
                value={formData.organizationSlug}
                onChange={(event) => {
                  setSlugTouched(true);
                  setFormData((prev) => ({
                    ...prev,
                    organizationSlug: slugify(event.target.value).slice(0, 48),
                  }));
                }}
                onFocus={() => setSlugTouched(true)}
              />
            </div>
            <div>
              <label
                htmlFor="displayName"
                className="text-sm font-medium text-slate-700"
              >
                Nombre completo
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                placeholder="Tu nombre"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-[#255FED] focus:outline-none focus:ring-2 focus:ring-[#255FED]/40"
                value={formData.displayName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-700"
              >
                Correo corporativo
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="tucorreo@empresa.com"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-[#255FED] focus:outline-none focus:ring-2 focus:ring-[#255FED]/40"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-slate-700"
                >
                  Usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  placeholder="usuario"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-[#255FED] focus:outline-none focus:ring-2 focus:ring-[#255FED]/40"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Contrasena
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="********"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 shadow-sm focus:border-[#255FED] focus:outline-none focus:ring-2 focus:ring-[#255FED]/40"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="w-full rounded-lg bg-gradient-to-r from-[#255FED] to-[#E4007C] px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#255FED] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Ya tienes cuenta?{' '}
            <Link
              href="/login"
              className="font-semibold text-[#255FED] hover:text-[#10276F]"
            >
              Inicia sesion
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
