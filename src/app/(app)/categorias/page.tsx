'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getDb } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import Button from '@/components/Button';
import { Plus, Trash2 } from 'lucide-react';
import Dexie from 'dexie';

export default function CategoriesPage() {
  const [db, setDb] = useState<Dexie | null>(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const initDb = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDb(getDb(user.id));
      }
    };
    initDb();
  }, []);

  const categories = useLiveQuery(() => db?.table('categories').toArray(), [db]);

  const handleAddCategory = async () => {
    if (!db) return;
    if (!name) {
      toast.error('El nombre de la categoría es obligatorio.');
      return;
    }
    try {
      await (db as any).categories.add({
        name,
        synced: 0,
        lastModified: Date.now(),
      });
      toast.success(`Categoría '${name}' creada.`);
      setName('');
    } catch (e) {
      toast.error('No se pudo crear la categoría.');
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!db) return;
    if (confirm('¿Seguro que quieres eliminar esta categoría? Los productos no se borrarán, solo perderán la categoría.')) {
      await (db as any).categories.delete(id);
      toast.success('Categoría eliminada.');
    }
  };

  if (!db) return <div className="p-8">Cargando...</div>;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">Gestionar Categorías</h1>
      </header>
      <div className="bg-card p-6 rounded-lg shadow-sm">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Nombre de la nueva categoría"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-grow block w-full rounded-md border-gray-300 shadow-sm p-2 text-text"
          />
          <Button variant="primary" onClick={handleAddCategory}>
            <Plus size={20} />
            <span>Añadir</span>
          </Button>
        </div>
      </div>
      <div className="bg-card rounded-lg shadow-sm">
        <ul className="divide-y divide-gray-200">
          {categories?.map((cat: any) => (
            <li key={cat.id} className="p-4 flex justify-between items-center">
              <span className="font-body text-text">{cat.name}</span>
              <Button variant="accent" className="p-2 h-9 w-9 !rounded-full" onClick={() => handleDeleteCategory(cat.id!)}>
                <Trash2 size={16} />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}