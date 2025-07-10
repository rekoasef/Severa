'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getDb } from '@/lib/db';
import Dexie from 'dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { Wallet, ReceiptText, Star, Plus } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function DashboardPage() {
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

  const monthlyExpenseData = useLiveQuery(() => {
    if (!db) return [];
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return db.table('purchases').where('date').between(startOfMonth, endOfMonth).toArray();
  }, [db]);
  
  const lastPurchase = useLiveQuery(
    () => db?.table('purchases').orderBy('date').last(),
    [db]
  );

  const mostPurchasedProduct = useLiveQuery(async () => {
    if (!db) return null;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const monthlyPurchases = await db.table('purchases').where('date').between(startOfMonth, endOfMonth).toArray();
    if (monthlyPurchases.length === 0) return null;
    
    const purchaseIds = monthlyPurchases.map((p: any) => p.id!);

    const products = await db.table('products').where('purchaseId').anyOf(purchaseIds).toArray();
    if (products.length === 0) return null;

    const productCounts = products.reduce((acc: any, product: any) => {
      acc[product.name] = (acc[product.name] || 0) + product.quantity;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
  }, [db]);

  if (!db) return <div className="p-8">Cargando datos del usuario...</div>;

  const totalAmount = monthlyExpenseData?.reduce((sum: number, purchase: any) => sum + purchase.totalAmount, 0) ?? 0;
  const formattedAmount = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totalAmount);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <h1 className="font-heading text-3xl font-bold text-text">Panel de Control</h1>
        <Button href="/nueva-compra" variant="accent"><Plus size={20} /><span>Nueva Compra</span></Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Gasto Total del Mes" icon={<Wallet size={24} />} className="lg:col-span-2">
          <p className="font-body text-4xl font-bold text-primary">{formattedAmount}</p>
          <p className="font-body text-sm text-text/60 mt-1">Actualizado en tiempo real (local)</p>
        </Card>
        <Card title="Última Compra" icon={<ReceiptText size={20} />}>
          {lastPurchase ? (
            <>
              <p className="font-body text-2xl font-bold text-text">
                {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format((lastPurchase as any).totalAmount)}
              </p>
              <p className="font-body text-sm text-text/60 mt-1">
                {new Date((lastPurchase as any).date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
              </p>
            </>
          ) : (
            <>
              <p className="font-body text-2xl font-bold text-text">N/A</p>
              <p className="font-body text-sm text-text/60 mt-1">Sin compras registradas</p>
            </>
          )}
        </Card>
        <Card title="Producto más Comprado" icon={<Star size={20} />}>
          {mostPurchasedProduct ? (
            <>
              <p className="font-body text-2xl font-bold text-text capitalize">
                {mostPurchasedProduct[0]}
              </p>
              <p className="font-body text-sm text-text/60 mt-1">
                Comprado {mostPurchasedProduct[1]} veces este mes
              </p>
            </>
          ) : (
            <>
              <p className="font-body text-2xl font-bold text-text">N/A</p>
              <p className="font-body text-sm text-text/60 mt-1">Basado en el mes actual</p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}