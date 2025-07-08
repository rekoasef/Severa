'use client';

import { useEffect, useRef } from 'react';
import { db } from '@/lib/db';

const SeedDatabase = () => {
  const hasSeeded = useRef(false);

  useEffect(() => {
    if (hasSeeded.current) {
      return;
    }

    hasSeeded.current = true;

    const seed = async () => {
      const purchaseCount = await db.purchases.count();
      if (purchaseCount === 0) {
        console.log('Base de datos local vacía, añadiendo datos de prueba...');
        await db.purchases.add({
          totalAmount: 15750.50,
          date: new Date(),
          synced: false,
          lastModified: Date.now(),
        });
        await db.purchases.add({
          totalAmount: 8300.00,
          date: new Date(),
          synced: false,
          lastModified: Date.now(),
        });
        console.log('Datos de prueba añadidos a Dexie.');
        window.location.reload();
      }
    };

    seed();
  }, []);

  return null;
};

export default SeedDatabase;