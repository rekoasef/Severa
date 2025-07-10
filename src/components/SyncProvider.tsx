'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getDb } from '@/lib/db';
import toast from 'react-hot-toast';
import { Session } from '@supabase/supabase-js';
import Dexie from 'dexie';

// --- Funciones Auxiliares para la Sincronización ---

async function pushLocalChanges(db: Dexie, userId: string) {
  // (La lógica de PUSH no cambia)
  // 1. Subir Alacenas nuevas
  const unsyncedPantries = await (db as any).pantries.where({ synced: 0 }).toArray();
  for (const pantry of unsyncedPantries) {
    const { data: remotePantry, error } = await supabase
      .from('pantries')
      .insert({ name: pantry.name, pantry_type: pantry.pantry_type, owner_id: pantry.owner_id })
      .select('id')
      .single();
    if (error) throw error;
    
    await (db as any).pantries.update(pantry.id!, { supabase_id: remotePantry.id, synced: 1 });
    await supabase.from('pantry_members').insert({ pantry_id: remotePantry.id, user_id: userId, status: 'accepted' });
  }

  // 2. Subir Ítems de Alacena nuevos o modificados
  const unsyncedPantryItems = await (db as any).pantry_items.where({ synced: 0 }).toArray();
  for (const item of unsyncedPantryItems) {
    const localPantry = await (db as any).pantries.get(item.pantry_id);
    if (localPantry?.supabase_id) { 
      const { error } = await supabase.from('pantry_items').upsert({
        pantry_id: localPantry.supabase_id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        running_low: item.running_low,
        category_id: item.category_id,
        last_modified: new Date(item.lastModified).toISOString(),
      }, { onConflict: 'pantry_id, name' });

      if (error) throw error;
      await (db as any).pantry_items.update(item.id!, { synced: 1 });
    }
  }

  // 3. Subir Compras y sus Productos
  const unsyncedPurchases = await (db as any).purchases.where('synced').equals(0).toArray();
  for (const purchase of unsyncedPurchases) {
    const products = await (db as any).products.where({ purchaseId: purchase.id }).toArray();
    const { data: remotePurchase, error: pError } = await supabase
      .from('purchases').insert({ total_amount: purchase.totalAmount, date: purchase.date.toISOString(), last_modified: new Date(purchase.lastModified).toISOString(), user_id: userId })
      .select().single();
    if (pError) throw pError;
    const productsToInsert = products.map((p: any) => ({ ...p, purchase_id: remotePurchase.id, user_id: userId, id: undefined }));
    await supabase.from('products').insert(productsToInsert);
    await (db as any).purchases.update(purchase.id!, { synced: 1 });
  }
}

async function pullRemoteChanges(db: Dexie, userId: string) {
  const { data: memberships, error } = await supabase.functions.invoke('get-my-data');
  if (error) throw error;
  if (!memberships) return;

  const acceptedPantries: any[] = [];
  const pendingInvitations: any[] = [];
  const allMembers: any[] = [];

  for (const member of memberships) {
    if (member.pantries) {
      if (member.status === 'accepted') {
        acceptedPantries.push(member.pantries);
        // Por cada alacena aceptada, descargamos la lista completa de sus miembros
        const { data: membersOfPantry } = await supabase.from('pantry_members').select('*, users(email)').eq('pantry_id', member.pantries.id);
        if (membersOfPantry) {
          allMembers.push(...membersOfPantry);
        }
      } else if (member.status === 'pending') {
        pendingInvitations.push({
          id: member.id,
          pantry_id: member.pantries.id,
          pantry_name: member.pantries.name,
          owner_email: 'Un usuario',
        });
      }
    }
  }

  await (db as any).transaction('rw', (db as any).pantries, (db as any).pantry_invitations, (db as any).pantry_members, async () => {
    // Sincronizar alacenas
    if (acceptedPantries.length > 0) {
      const localPantries = acceptedPantries.map((p: any) => ({
        id: p.id,
        supabase_id: p.id,
        name: p.name,
        pantry_type: p.pantry_type,
        owner_id: p.owner_id,
        synced: 1,
        lastModified: new Date(p.created_at).getTime(),
      }));
      await (db as any).pantries.bulkPut(localPantries);
    }
    
    // Sincronizar invitaciones
    await (db as any).pantry_invitations.clear();
    if (pendingInvitations.length > 0) {
      await (db as any).pantry_invitations.bulkAdd(pendingInvitations);
    }

    // Sincronizar miembros
    await (db as any).pantry_members.clear();
    if (allMembers.length > 0) {
      const localMembers = allMembers.map((m: any) => ({
        id: m.id,
        pantry_id: m.pantry_id,
        user_id: m.user_id,
        status: m.status,
        email: m.users.email, // Guardamos el email para mostrarlo en la UI
      }));
      await (db as any).pantry_members.bulkPut(localMembers);
    }
  });
}

// --- Componente Principal ---
const SyncProvider = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (typeof window.navigator !== 'undefined') {
      setIsOnline(window.navigator.onLine);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (isOnline && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        syncAllData(session);
      }
    });
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      subscription.unsubscribe();
    };
  }, [isOnline]);

  const syncAllData = async (session: Session | null) => {
    if (!session?.user) return;
    
    const db = getDb(session.user.id);
    
    window.dispatchEvent(new CustomEvent('sync-status', { detail: 'syncing' }));
    toast.loading('Sincronizando...', { id: 'sync' });

    try {
      await pushLocalChanges(db, session.user.id);
      await pullRemoteChanges(db, session.user.id);
    } catch (e: any) {
      console.error("Error de Sincronización:", e);
      toast.error(`Error: ${e.message}`, { id: 'sync' });
    } finally {
      window.dispatchEvent(new CustomEvent('sync-status', { detail: 'idle' }));
      toast.success('Datos Sincronizados', { id: 'sync' });
    }
  };

  return null; 
};

export default SyncProvider;