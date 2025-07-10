'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getDb } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import PurchaseCard from '@/components/PurchaseCard';
import { AlertCircle } from 'lucide-react';
import Dexie from 'dexie';

export default function HistoryPage() {
  const [db, setDb] = useState<Dexie | null>(null);

  useEffect(() => {
    const initDb = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDb(getDb(user.id));
      }
    };
    initDb();
  }, []);

  const purchases = useLiveQuery(
    () => db?.table('purchases').orderBy('date').reverse().toArray(),
    [db]
  );

  if (!db) return <div className="p-8">Cargando...</div>;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">
          Historial de Compras
        </h1>
        <p className="font-body text-text/70 mt-1">
          Mostrando datos locales. Se sincronizará con la nube cuando haya conexión.
        </p>
      </header>
      <div className="bg-primary/10 border border-primary/20 text-primary p-3 rounded-lg flex items-center gap-3 text-sm">
        <AlertCircle size={20} />
        <span>Este ícono indica que la compra aún no se ha sincronizado con la nube. Desaparecerá automáticamente al conectar a internet.</span>
      </div>
      <div className="flex flex-col gap-4">
        {!purchases ? (
          <p className="font-body text-text/70">Cargando historial...</p>
        ) : purchases.length === 0 ? (
          <p className="font-body text-text/70">No tienes ninguna compra registrada todavía.</p>
        ) : (
          purchases.map((purchase: any) => (
            <PurchaseCard key={purchase.id} purchase={purchase} />
          ))
        )}
      </div>
    </div>
  );
}