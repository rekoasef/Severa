'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { Plus } from 'lucide-react';
import { getDb, type Product } from '@/lib/db';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase-client';
import Dexie from 'dexie';

type DraftProduct = Omit<Product, 'id' | 'purchaseId'>;

export default function NewPurchasePage() {
  const router = useRouter();
  const [db, setDb] = useState<Dexie | null>(null);
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const initDb = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDb(getDb(user.id));
      }
    };
    initDb();
  }, []);

  const handleProductNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setProductName(query);

    if (query.length > 1 && db) {
      const matchedProducts = await db.table('products').where('name').startsWithIgnoreCase(query).toArray();
      const matchedPantryItems = await db.table('pantry_items').where('name').startsWithIgnoreCase(query).toArray();
      
      const allNames = [...matchedProducts.map((p: any) => p.name), ...matchedPantryItems.map((p: any) => p.name)];
      const uniqueNames = [...new Set(allNames)];
      
      setSuggestions(uniqueNames.slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (name: string) => {
    setProductName(name);
    setSuggestions([]);
  };

  const handleAddProduct = () => {
    if (!productName || !price || quantity <= 0) {
      toast.error('Por favor, completa todos los campos.');
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
    setSuggestions([]);
  };

  const totalPurchaseAmount = products.reduce((sum, product) => sum + product.price * product.quantity, 0);

  const handleSavePurchase = async () => {
    if (!db || products.length === 0) return;

    try {
      await (db as any).transaction('rw', (db as any).purchases, (db as any).products, (db as any).pantry_items, async () => {
        const purchaseId = await (db as any).purchases.add({
          totalAmount: totalPurchaseAmount,
          date: new Date(),
          synced: 0,
          lastModified: Date.now(),
        });

        const productsWithPurchaseId = products.map(p => ({
          name: p.name,
          price: p.price,
          quantity: p.quantity,
          purchaseId: purchaseId,
        }));
        await (db as any).products.bulkAdd(productsWithPurchaseId);

        for (const product of products) {
          const existingPantryItem = await (db as any).pantry_items.where('name').equalsIgnoreCase(product.name).first();
          if (existingPantryItem) {
            await (db as any).pantry_items.update(existingPantryItem.id!, {
              quantity: existingPantryItem.quantity + product.quantity,
              lastModified: Date.now(),
              synced: 0,
            });
          } else {
            await (db as any).pantry_items.add({
              name: product.name,
              quantity: product.quantity,
              synced: 0,
              lastModified: Date.now(),
              running_low: 0,
            });
          }
        }
      });

      toast.success('¡Compra guardada y alacena actualizada!');
      setProducts([]);
      router.push('/alacena');

    } catch (error: any) {
      console.error('Error al guardar la compra:', error);
      toast.error('Hubo un error al procesar la compra.');
    }
  };

  if (!db) return <div className="p-8">Cargando...</div>;

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-3xl font-bold text-text">Nueva Compra</h1>
        <p className="font-body text-text/70 mt-1">Añade productos para crear una nueva compra.</p>
      </header>
      
      <div className="bg-card p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2 relative">
            <label htmlFor="product" className="block font-body text-sm font-medium text-text">Producto</label>
            <input
              type="text" id="product" placeholder="Ej: Leche"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-text"
              value={productName}
              onChange={handleProductNameChange}
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-card border border-gray-200 rounded-md mt-1 shadow-lg max-h-40 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="p-2 hover:bg-background cursor-pointer font-body text-text"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label htmlFor="price" className="block font-body text-sm font-medium text-text">Precio</label>
            <input
              type="number" id="price" placeholder="1500"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="quantity" className="block font-body text-sm font-medium text-text">Cantidad</label>
            <input
              type="number" id="quantity"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 text-text"
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