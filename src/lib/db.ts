import Dexie, { type Table } from 'dexie';

export interface Product {
  id?: number;
  name: string;
  price: number;
  quantity: number;
  purchaseId: number;
  // No necesitamos campos de sync en los productos, se sincronizan con su compra
}

export interface Purchase {
  id?: number;
  totalAmount: number;
  date: Date;
  synced: boolean; // <-- AÑADIDO: para saber si está en la nube
  lastModified: number; // <-- AÑADIDO: timestamp para resolver conflictos
}

class SeveraDatabase extends Dexie {
  purchases!: Table<Purchase>;
  products!: Table<Product>;

  constructor() {
    super('severaDB');
    // Incrementamos la versión de la base de datos para aplicar los cambios
    this.version(2).stores({
      // Actualizamos el esquema para indexar los nuevos campos
      purchases: '++id, date, synced, lastModified',
      products: '++id, purchaseId, name',
    });
  }
}

export const db = new SeveraDatabase();