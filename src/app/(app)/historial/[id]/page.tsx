'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getDb } from '@/lib/db';
import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { notFound } from 'next/navigation';

export default function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const purchaseId = parseInt(params.id, 10);
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

  const purchase = useLiveQuery(
    () => db?.table('purchases').get(purchaseId),
    [db, purchaseId]
  );

  const products = useLiveQuery(
    () => db?.table('products').where({ purchaseId: purchaseId }).toArray(),
    [db, purchaseId]
  );
  
  if (db === null) return <div>Cargando...</div>

  if (purchase === undefined) {
    return <p className="font-body text-text/70">Buscando compra...</p>;
  }

  if (!purchase) {
    notFound();
  }

  const p = purchase as any;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">Detalle de la Compra</h1>
        <p className="font-body text-text/70 mt-1">
          Realizada el: {new Date(p.date).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}
        </p>
      </header>

      <div className="bg-card p-6 rounded-lg shadow-sm">
        <h2 className="font-heading text-xl text-text mb-4">Productos</h2>
        <div className="flex flex-col gap-3">
          {products?.map((product: any) => (
            <div key={product.id} className="flex justify-between items-center border-b border-gray-200 pb-2">
              <div>
                <p className="font-body font-bold text-text">{product.name}</p>
                <p className="font-body text-sm text-text/70">{product.quantity} x ${product.price.toFixed(2)}</p>
              </div>
              <p className="font-body text-lg font-bold text-text">${(product.price * product.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-card p-6 rounded-lg shadow-sm flex justify-between items-center">
        <h2 className="font-heading text-2xl font-bold text-text">Total de la Compra</h2>
        <p className="font-body text-3xl font-bold text-primary">${p.totalAmount.toFixed(2)}</p>
      </div>
    </div>
  );
}