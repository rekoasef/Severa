'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';

export default function PurchaseDetailPage({ params }: { params: { id: string } }) {
  const purchaseId = parseInt(params.id, 10);

  const purchase = useLiveQuery(
    () => db.purchases.get(purchaseId),
    [purchaseId]
  );

  const products = useLiveQuery(
    () => db.products.where({ purchaseId: purchaseId }).toArray(),
    [purchaseId]
  );

  if (purchase === undefined || products === undefined) {
    return <p className="font-body text-text/70">Cargando detalles de la compra...</p>;
  }

  if (!purchase) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">
          Detalle de la Compra
        </h1>
        <p className="font-body text-text/70 mt-1">
          Realizada el: {new Date(purchase.date).toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' })}
        </p>
      </header>

      <div className="bg-card p-6 rounded-lg shadow-sm">
        <h2 className="font-heading text-xl text-text mb-4">Productos</h2>
        <div className="flex flex-col gap-3">
          {products.map(product => (
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
        <p className="font-body text-3xl font-bold text-primary">${purchase.totalAmount.toFixed(2)}</p>
      </div>
    </div>
  );
}