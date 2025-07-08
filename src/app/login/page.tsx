'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client'; // 1. Importamos nuestro cliente de Supabase
import { useRouter } from 'next/navigation'; // 2. Importamos el router para redirigir

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter(); // Inicializamos el router

  // 3. Convertimos la función en async y añadimos la lógica
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert('Error al iniciar sesión: ' + error.message);
    } else {
      // Si el inicio de sesión es exitoso, data.user no será nulo
      alert('¡Inicio de sesión exitoso!');
      router.push('/'); // Redirigimos al Panel de Control
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image src="/logo.png" alt="Logo de Severa" width={180} height={48} />
        </div>

        <div className="bg-card p-8 rounded-lg shadow-md">
          <h1 className="font-heading text-2xl font-bold text-text mb-4 text-center">
            Iniciar Sesión
          </h1>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block font-body text-sm font-medium text-text"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 text-text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block font-body text-sm font-medium text-text"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 text-text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="primary" className="mt-4 w-full justify-center">
              Iniciar Sesión
            </Button>
          </form>
        </div>
        
        <p className="text-center text-sm text-text/80 mt-6">
          ¿No tienes una cuenta?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}