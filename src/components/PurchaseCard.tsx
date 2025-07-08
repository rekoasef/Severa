'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Database } from '@/types/database.types';
import { Calendar, Hash, DollarSign, ChevronRight } from 'lucide-react';

type Purchase = Database['public']['Tables']['purchases']['Row'];

interface PurchaseCardProps {
  purchase: Purchase;
}

const PurchaseCard = ({ purchase }: PurchaseCardProps) => {
  const [productCount, setProductCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchProductCount = async () => {
      if (!purchase.id) return;

      // Consulta a Supabase para CONTAR productos asociados a esta compra
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true }) // head:true para no descargar datos, solo contar
        .eq('purchase_id', purchase.id);

      if (error) {
        console.error('Error counting products:', error);
      } else {
        setProductCount(count);
      }
    };

    fetchProductCount();
  }, [purchase.id]);

  return (
    <Link href={`/historial/${purchase.id}`}>
      <div className="bg-card p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex justify-between items-center">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
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
              {productCount ?? '...'} productos
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={16} className="text-primary" />
            <span className="font-body text-sm font-bold text-text">
              ${Number(purchase.total_amount).toFixed(2)}
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