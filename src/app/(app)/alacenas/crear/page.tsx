'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDb } from '@/lib/db';
import { supabase } from '@/lib/supabase-client';
import toast from 'react-hot-toast';
import Button from '@/components/Button';
import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import Dexie from 'dexie';

export default function CreatePantryPage() {
  const router = useRouter();
  const [db, setDb] = useState<Dexie | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'personal' | 'shared'>('personal');

  useEffect(() => {
    const initDb = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDb(getDb(user.id));
      }
    };
    initDb();
  }, []);

  const handleCreatePantry = async () => {
    if (!db) {
      toast.error('La base de datos no está lista. Inténtalo de nuevo.');
      return;
    }
    if (!name) {
      toast.error('El nombre de la alacena es obligatorio.');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Debes estar autenticado para crear una alacena.');
      return;
    }

    try {
      const newPantryId = await (db as any).pantries.add({
        name,
        pantry_type: type,
        owner_id: user.id,
        synced: 0,
        lastModified: Date.now(),
      });

      await (db as any).pantry_members.add({
        pantry_id: newPantryId,
        user_id: user.id,
        status: 'accepted',
      });

      toast.success(`Alacena "${name}" creada con éxito.`);
      router.push('/alacena');

    } catch (e) {
      console.error(e);
      toast.error('No se pudo crear la alacena.');
    }
  };
  
  if (!db) return <div className="p-8">Cargando...</div>;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <Link href="/alacena" className="flex items-center gap-2 text-sm text-text/70 hover:text-primary mb-4">
          <ArrowLeft size={16} />
          Volver a Mis Alacenas
        </Link>
        <h1 className="font-heading text-3xl font-bold text-text">Crear Nueva Alacena</h1>
      </header>

      <div className="bg-card p-6 rounded-lg shadow-sm flex flex-col gap-4">
        <div>
          <label htmlFor="pantry-name" className="block font-body text-sm font-medium text-text">Nombre de la Alacena</label>
          <input
            type="text"
            id="pantry-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Cocina de Casa"
            className="mt-1 block w-full rounded-md p-2 text-text"
          />
        </div>
        <div>
          <label className="block font-body text-sm font-medium text-text">Tipo de Alacena</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'personal' | 'shared')}
            className="mt-1 block w-full rounded-md p-2 text-text"
          >
            <option value="personal">Personal (solo para ti)</option>
            <option value="shared">Compartida (para invitar a otros)</option>
          </select>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" onClick={handleCreatePantry}>
            <Check size={20} />
            <span>Crear Alacena</span>
          </Button>
        </div>
      </div>
    </div>
  );
}