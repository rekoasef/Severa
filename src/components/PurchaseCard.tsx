'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDb, type Purchase } from '@/lib/db';
import { supabase } from '@/lib/supabase-client';
import { Calendar, Hash, DollarSign, ChevronRight, AlertCircle } from 'lucide-react';
import Dexie from 'dexie';

interface PurchaseCardProps {
  purchase: Purchase;
}

const PurchaseCard = ({ purchase }: PurchaseCardProps) => {
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

  const productCount = useLiveQuery(
    () => {
      if (!db || !purchase.id) return 0;
      return (db as any).products.where({ purchaseId: purchase.id }).count();
    },
    [db, purchase.id] // Dependemos de la BD y del ID de la compra
  );

  if (!db || !purchase.id) return null; // No renderizar nada si la BD o la compra no están listas

  return (
    <Link href={`/historial/${purchase.id}`}>
      <div className="bg-card p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
          {purchase.synced === 0 && <AlertCircle size={16} className="text-accent" title="No sincronizado" />}
          
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-primary" />
            <span className="font-body text-sm text-text">
              {new Date(purchase.date).toLocaleDateString('es-AR', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Hash size={16} className="text-primary" />
            <span className="font-body text-sm text-text">
              {productCount ?? 0} productos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-primary" />
            <span className="font-body text-sm font-bold text-text">
              ${purchase.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
        <div>
          <ChevronRight size={24} className="text-text/50" />
        </div>
      </div>
    </Link>
  );
};

export default PurchaseCard;