'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Verificamos que las contraseñas coincidan
    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    // 2. Llamamos a la función de registro de Supabase
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      alert('Error al registrarse: ' + error.message);
    } else {
      // 3. Mostramos un mensaje de éxito y redirigimos
      alert('¡Registro exitoso! Por favor, inicia sesión.');
      router.push('/login');
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
            Crear una Cuenta
          </h1>
          <form onSubmit={handleSignUp} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" className="block font-body text-sm font-medium text-text">
                Email
              </label>
              <input
                type="email" id="email" required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 text-text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password"className="block font-body text-sm font-medium text-text">
                Contraseña
              </label>
              <input
                type="password" id="password" required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 text-text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password"className="block font-body text-sm font-medium text-text">
                Confirmar Contraseña
              </label>
              <input
                type="password" id="confirm-password" required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 text-text"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" className="mt-4 w-full justify-center">
              Registrarse
            </Button>
          </form>
        </div>
        
        <p className="text-center text-sm text-text/80 mt-6">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}