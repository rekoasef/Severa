'use client'; // 1. Convertimos este en un Componente de Cliente

import { Wallet, ReceiptText, Star, Plus } from 'lucide-react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useLiveQuery } from 'dexie-react-hooks'; // 2. Importamos el hook
import { db } from '@/lib/db'; // 3. Importamos nuestra instancia de la BD

export default function DashboardPage() {
  // 4. Creamos una consulta en vivo para el gasto del mes
  const monthlyExpense = useLiveQuery(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return db.purchases
      .where('date')
      .between(startOfMonth, endOfMonth)
      .toArray();
  }, []); // El array vacío asegura que la consulta se ejecute solo una vez

  // 5. Calculamos el total a partir de los datos obtenidos
  const totalAmount = monthlyExpense?.reduce((sum, purchase) => sum + purchase.totalAmount, 0) ?? 0;

  // 6. Formateamos el total como moneda
  const formattedAmount = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(totalAmount);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-center">
        <h1 className="font-heading text-3xl font-bold text-text">
          Panel de Control
        </h1>
        <Button href="/nueva-compra" variant="accent">
          <Plus size={20} />
          <span>Nueva Compra</span>
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7. Mostramos el dato real en la tarjeta */}
        <Card
          title="Gasto Total del Mes"
          icon={<Wallet size={24} />}
          className="lg:col-span-2"
        >
          <p className="font-body text-4xl font-bold text-primary">
            {formattedAmount}
          </p>
          <p className="font-body text-sm text-text/60 mt-1">
            Actualizado en tiempo real
          </p>
        </Card>

        {/* Las otras tarjetas permanecen con datos de ejemplo por ahora */}
        <Card title="Última Compra" icon={<ReceiptText size={20} />}>
          <p className="font-body text-2xl font-bold text-text">N/A</p>
          <p className="font-body text-sm text-text/60 mt-1">Sin compras registradas</p>
        </Card>

        <Card title="Producto más Comprado" icon={<Star size={20} />}>
          <p className="font-body text-2xl font-bold text-text">N/A</p>
          <p className="font-body text-sm text-text/60 mt-1">Basado en el mes actual</p>
        </Card>
      </div>
    </div>
  );
}