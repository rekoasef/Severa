import Dexie, { type Table } from 'dexie';

// --- Interfaces ---
export interface Product {
  id?: number;
  name: string;
  price: number;
  quantity: number;
  purchaseId: number;
}
export interface Purchase {
  id?: number;
  totalAmount: number;
  date: Date;
  synced: number;
  lastModified: number;
}
export interface Category {
  id?: number;
  name: string;
  synced: number;
  lastModified: number;
}
export interface Pantry {
  id?: number;
  supabase_id?: number;
  name: string;
  pantry_type: 'personal' | 'shared';
  owner_id: string;
  synced: number;
  lastModified: number;
}
// 1. AÑADIMOS 'email' a la interfaz de PantryMember
export interface PantryMember {
  id?: number;
  pantry_id: number;
  user_id: string;
  status: 'pending' | 'accepted' | 'declined';
  email?: string; // <-- AÑADIDO
}
export interface PantryInvitation {
  id: number;
  pantry_id: number;
  pantry_name: string;
  owner_email: string;
}
export interface PantryItem {
  id?: number;
  pantry_id: number;
  name: string;
  description?: string;
  quantity: number;
  expiration_date?: string;
  category_id?: number;
  running_low: number;
  synced: number;
  lastModified: number;
}

class SeveraDatabase extends Dexie {
  purchases!: Table<Purchase>;
  products!: Table<Product>;
  categories!: Table<Category>;
  pantry_items!: Table<PantryItem>;
  pantries!: Table<Pantry>;
  pantry_members!: Table<PantryMember>;
  pantry_invitations!: Table<PantryInvitation>;

  constructor(dbName: string) {
    super(dbName);
    // 2. INCREMENTAMOS LA VERSIÓN A 9
    this.version(9).stores({
      purchases: '++id, date, synced, lastModified',
      products: '++id, purchaseId, name',
      categories: '++id, name, synced, lastModified',
      pantry_items: '++id, &supabase_id, name, synced, lastModified, running_low, category_id, pantry_id',
      pantries: '++id, &supabase_id, name, synced, lastModified',
      // 3. AÑADIMOS 'email' al esquema de pantry_members
      pantry_members: '++id, &[pantry_id+user_id], status, email',
      pantry_invitations: 'id',
    });
  }
}

let db: SeveraDatabase | null = null;

// (El resto de las funciones getDb y deleteDb no cambian)
export function getDb(userId: string): SeveraDatabase {
  if (!userId) {
    throw new Error("Se requiere un ID de usuario para inicializar la base de datos.");
  }
  
  if (!db || db.name !== `severaDB_${userId}`) {
    if (db) {
      db.close();
    }
    console.log(`Inicializando base de datos para el usuario: ${userId}`);
    db = new SeveraDatabase(`severaDB_${userId}`);
  }
  
  return db;
}

export async function deleteDb(userId: string) {
  const dbName = `severaDB_${userId}`;
  if (db && db.name === dbName) {
    db.close();
    db = null;
  }
  await Dexie.delete(dbName);
  console.log(`Base de datos ${dbName} eliminada.`);
}