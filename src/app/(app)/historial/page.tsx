'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import PurchaseCard from '@/components/PurchaseCard';
import { Database } from '@/types/database.types';

// Definimos el tipo para una compra que viene de Supabase
type Purchase = Database['public']['Tables']['purchases']['Row'];

export default function HistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      // Hacemos la consulta a la tabla 'purchases' de Supabase
      const { data, error } = await supabase
        .from('purchases')
        .select('*') // Seleccionamos todas las columnas
        .order('date', { ascending: false }); // Ordenamos por fecha descendente

      if (error) {
        console.error('Error fetching purchases:', error);
        alert('No se pudo cargar el historial.');
      } else {
        setPurchases(data);
      }
      setLoading(false);
    };

    fetchPurchases();
  }, []); // El array vacío asegura que se ejecute solo una vez, al montar el componente

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">
          Historial de Compras
        </h1>
        <p className="font-body text-text/70 mt-1">
          Aquí puedes ver todas tus compras guardadas en la nube.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {loading && (
          <p className="font-body text-text/70">Cargando historial...</p>
        )}
        
        {!loading && purchases.length === 0 && (
          <p className="font-body text-text/70">No tienes ninguna compra registrada todavía.</p>
        )}

        {!loading && purchases.map((purchase) => (
          <PurchaseCard key={purchase.id} purchase={purchase} />
        ))}
      </div>
    </div>
  );
}