'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Plus } from 'lucide-react';
import { db } from '@/lib/db';
import type { Product } from '@/lib/db';

type DraftProduct = Omit<Product, 'id' | 'purchaseId'>;

export default function NewPurchasePage() {
  const router = useRouter();
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [products, setProducts] = useState<DraftProduct[]>([]);

  const handleAddProduct = () => {
    if (!productName || !price || quantity <= 0) {
      alert('Por favor, completa todos los campos correctamente.');
      return;
    }
    const newProduct: DraftProduct = {
      name: productName,
      price: parseFloat(price),
      quantity: quantity,
    };
    setProducts([...products, newProduct]);
    setProductName('');
    setPrice('');
    setQuantity(1);
  };

  const totalPurchaseAmount = products.reduce((sum, product) => sum + product.price * product.quantity, 0);

  const handleSavePurchase = async () => {
    if (products.length === 0) return;

    try {
      await db.transaction('rw', db.purchases, db.products, async () => {
        const purchaseId = await db.purchases.add({
          totalAmount: totalPurchaseAmount,
          date: new Date(),
          synced: false,
          lastModified: Date.now(),
        });

        const productsWithPurchaseId = products.map(product => ({
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          purchaseId: purchaseId,
        }));

        await db.products.bulkAdd(productsWithPurchaseId);
      });

      alert('¡Compra guardada localmente con éxito!');
      setProducts([]);
      router.push('/historial');

    } catch (error: any) {
      console.error('Error al guardar la compra localmente:', error);
      alert('Hubo un error al guardar la compra: ' + error.message);
    }
  };

  return (
    <div className="flex flex-col gap-8">
       <header>
        <h1 className="font-heading text-3xl font-bold text-text">
          Nueva Compra
        </h1>
        <p className="font-body text-text/70 mt-1">
          Añade productos para crear una nueva compra.
        </p>
      </header>
      
      <div className="bg-card p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label htmlFor="product" className="block font-body text-sm font-medium text-text">Producto</label>
            <input
              type="text" id="product" placeholder="Ej: Leche"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 text-text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="price" className="block font-body text-sm font-medium text-text">Precio</label>
            <input
              type="number" id="price" placeholder="1500"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 text-text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block font-body text-sm font-medium text-text">Cantidad</label>
            <input
              type="number" id="quantity"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 p-2 text-text"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
            />
          </div>
          <div className="md:col-start-4">
            <Button variant="primary" className="w-full justify-center" onClick={handleAddProduct}>
              <Plus size={20} />
              <span>Agregar Producto</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-bold text-text">Productos en esta compra</h2>
        {products.length === 0 ? (
          <p className="font-body text-text/70">Aún no hay productos en esta compra.</p>
        ) : (
          products.map((product, index) => (
            <div key={index} className="bg-card p-4 rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <p className="font-body font-bold text-text">{product.name}</p>
                <p className="font-body text-sm text-text/70">{product.quantity} unidad(es) x ${product.price.toFixed(2)}</p>
              </div>
              <p className="font-body text-lg font-bold text-primary">${(product.price * product.quantity).toFixed(2)}</p>
            </div>
          ))
        )}

        {products.length > 0 && (
          <div className="flex flex-col md:flex-row justify-end items-center mt-4 gap-4">
            <p className="font-body text-xl">
              <span className="font-bold text-text">Total: </span>
              <span className="font-bold text-primary">${totalPurchaseAmount.toFixed(2)}</span>
            </p>
            <Button 
              variant="accent" 
              className="w-full md:w-auto justify-center"
              onClick={handleSavePurchase}
              disabled={products.length === 0}
            >
              Guardar Compra
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}