'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/Button';
import Modal from '@/components/Modal';
import { Plus, Trash2, AlertTriangle, Check, ArrowLeft, Settings, Users, Mail, User, Shield } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getDb, type PantryItem, type Category, type PantryMember } from '@/lib/db';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import Dexie from 'dexie';

export default function PantryDetailPage({ params }: { params: { pantryId: string } }) {
  const pantryId = parseInt(params.pantryId, 10);
  const [db, setDb] = useState<Dexie | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // --- Estados para los formularios ---
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newCategoryId, setNewCategoryId] = useState<number | undefined>();
  
  // --- Estados para los modales ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  
  // --- Estados para la edición ---
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editQuantity, setEditQuantity] = useState(1);
  const [editRunningLow, setEditRunningLow] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | undefined>();
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setDb(getDb(user.id));
        setCurrentUser(user);
      }
    };
    init();
  }, []);

  // --- Hooks para leer datos de Dexie ---
  const pantry = useLiveQuery(() => db ? (db as any).pantries.get(pantryId) : null, [db, pantryId]);
  const members = useLiveQuery(() => db ? (db as any).pantry_members.where({ pantry_id: pantry.id }).toArray() : [], [db, pantry]);
  const pantryItems = useLiveQuery(() => db ? (db as any).pantry_items.where({ pantry_id: pantry.id }).toArray() : [], [db, pantry]);
  const categories = useLiveQuery(() => db ? (db as any).categories.toArray() : [], [db]);
  
  const groupedItems = pantryItems?.reduce((acc: any, item: PantryItem) => {
    const categoryName = categories?.find((c: any) => c.id === item.category_id)?.name || 'Sin Categoría';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(item);
    return acc;
  }, {} as Record<string, PantryItem[]>);

  // --- Lógica de Acciones ---
  const handleAddItem = async () => {
    if (!db) return;
    if (!newName || newQuantity <= 0) {
      toast.error('El nombre y la cantidad son obligatorios.');
      return;
    }
    await (db as any).pantry_items.add({
      pantry_id: pantry.id,
      name: newName,
      description: newDescription,
      quantity: newQuantity,
      category_id: newCategoryId,
      synced: 0,
      lastModified: Date.now(),
      running_low: 0,
    });
    toast.success(`'${newName}' añadido a la alacena.`);
    setNewName(''); setNewDescription(''); setNewQuantity(1); setNewCategoryId(undefined);
  };

  const handleSaveChanges = async () => {
    if (!db || !editingItem) return;
    await (db as any).pantry_items.update(editingItem.id!, {
      description: editDescription,
      quantity: editQuantity,
      running_low: editRunningLow ? 1 : 0,
      category_id: editCategoryId,
      lastModified: Date.now(),
      synced: 0,
    });
    toast.success(`'${editingItem.name}' actualizado.`);
    setIsEditModalOpen(false);
  };

  const handleDeleteItem = async (id: number) => {
    if (!db) return;
    if (confirm('¿Seguro que quieres eliminar este producto?')) {
      await (db as any).pantry_items.delete(id);
      toast.success('Producto eliminado.');
    }
  };

  const handleEditClick = (item: PantryItem) => {
    setEditingItem(item);
    setEditDescription(item.description || '');
    setEditQuantity(item.quantity);
    setEditRunningLow(item.running_low === 1);
    setEditCategoryId(item.category_id);
    setIsEditModalOpen(true);
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) {
      toast.error('Por favor, introduce un email.');
      return;
    }
    if (!pantry || !pantry.supabase_id) {
        toast.error('Esta alacena aún no se ha sincronizado. Inténtalo de nuevo en unos segundos.');
        return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { pantry_id: pantry.supabase_id, invitee_email: inviteEmail },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      toast.success(data.message || '¡Invitación enviada!');
      setInviteEmail('');
      setIsInviteModalOpen(false);
    } catch (e: any) {
      const errorMessage = e.data?.error || e.message;
      toast.error(`Error al invitar: ${errorMessage}`);
    }
  };

  const handleRemoveMember = async (userIdToRemove: string) => {
    if (!pantry || !pantry.supabase_id) return;
    if (!confirm('¿Estás seguro de que quieres eliminar a este miembro?')) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('remove-member', {
        body: { pantry_id: pantry.supabase_id, user_id_to_remove: userIdToRemove },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(data.message);
      window.dispatchEvent(new Event('online'));
    } catch (e: any) {
      toast.error(`Error al eliminar: ${e.message}`);
    }
  };

  const isOwner = pantry && currentUser && pantry.owner_id === currentUser.id;

  if (!db || !pantry) return <div className="p-8">Cargando alacena...</div>;

  return (
    <>
      <div className="flex flex-col gap-8">
        <header>
          <Link href="/alacena" className="flex items-center gap-2 text-sm text-text/70 hover:text-primary mb-4">
            <ArrowLeft size={16} />
            Volver a Mis Alacenas
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-heading text-3xl font-bold text-text">{pantry?.name}</h1>
              <p className="font-body text-text/70 mt-1 capitalize flex items-center gap-2">
                {pantry?.pantry_type === 'shared' ? <Users size={16} /> : <User size={16} />}
                Alacena {pantry?.pantry_type === 'shared' ? 'Compartida' : 'Personal'}
              </p>
            </div>
            <div className="flex gap-2">
              {isOwner && pantry?.pantry_type === 'shared' && (
                <>
                  <Button variant="accent" onClick={() => setIsInviteModalOpen(true)} disabled={!pantry.supabase_id} title={!pantry.supabase_id ? 'Sincronizando...' : 'Invitar'}><Mail size={20} /><span>Invitar</span></Button>
                  <Button onClick={() => setIsManageModalOpen(true)}><Users size={20} /><span>Miembros</span></Button>
                </>
              )}
              <Link href="/categorias"><Button variant="primary"><Settings size={20} /><span>Categorías</span></Button></Link>
            </div>
          </div>
        </header>

        <div className="bg-card p-6 rounded-lg shadow-sm">
          <h2 className="font-heading text-xl font-bold text-text mb-4">Añadir Producto a esta Alacena</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                  <label htmlFor="pantry-product" className="block font-body text-sm font-medium text-text">Nombre</label>
                  <input type="text" id="pantry-product" value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1 block w-full rounded-md p-2 text-text" placeholder="Ej: Arroz" />
              </div>
              <div>
                  <label htmlFor="pantry-quantity" className="block font-body text-sm font-medium text-text">Cantidad</label>
                  <input type="number" id="pantry-quantity" value={newQuantity} onChange={(e) => setNewQuantity(Number(e.target.value))} className="mt-1 block w-full rounded-md p-2 text-text" />
              </div>
              <div>
                  <label htmlFor="new-category" className="block font-body text-sm font-medium text-text">Categoría</label>
                  <select id="new-category" value={newCategoryId || ''} onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : undefined)} className="mt-1 block w-full rounded-md p-2 text-text">
                      <option value="">Sin Categoría</option>
                      {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
              </div>
              <div className="md:col-span-3">
                  <label htmlFor="pantry-description" className="block font-body text-sm font-medium text-text">Descripción (Opcional)</label>
                  <input type="text" id="pantry-description" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="mt-1 block w-full rounded-md p-2 text-text" placeholder="Paquete de 1kg" />
              </div>
              <div className="md:col-start-3">
                  <Button variant="primary" className="w-full justify-center" onClick={handleAddItem}><Plus size={20} /><span>Añadir</span></Button>
              </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {groupedItems && Object.keys(groupedItems).length > 0 ? Object.keys(groupedItems).map(categoryName => (
            <div key={categoryName}>
              <h2 className="font-heading text-2xl font-bold text-text mb-2">{categoryName}</h2>
              <div className="bg-card rounded-lg shadow-sm overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {groupedItems[categoryName].map((item: PantryItem) => (
                    <li key={item.id} className="p-4 flex justify-between items-center hover:bg-background/50 cursor-pointer" onClick={() => handleEditClick(item)}>
                      <div className="flex items-center gap-3">
                        {item.running_low === 1 && <AlertTriangle className="text-accent flex-shrink-0" size={20} />}
                        <div>
                          <p className="font-body font-bold text-text">{item.name}</p>
                          <p className="font-body text-sm text-text/70">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-body font-bold text-lg text-primary">{item.quantity}</span>
                        <Button variant="accent" className="p-2 h-9 w-9 !rounded-full z-10" onClick={(e) => { e.stopPropagation(); handleDeleteItem(item.id!); }}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )) : <p className="font-body text-text/70 p-4 text-center">No hay productos en esta alacena todavía.</p>}
        </div>
      </div>

      <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invitar Miembro a la Alacena">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="invite-email" className="block font-body text-sm font-medium text-text">Email del usuario a invitar</label>
            <input
              type="email"
              id="invite-email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@ejemplo.com"
              className="mt-1 block w-full rounded-md p-2 text-text"
            />
          </div>
          <Button variant="primary" className="w-full justify-center" onClick={handleInviteUser}>
            <Check size={20} />
            <span>Enviar Invitación</span>
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Editar: ${editingItem?.name}`}>
        {editingItem && (
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="edit-quantity" className="block font-body text-sm font-medium text-text">Cantidad</label>
              <input type="number" id="edit-quantity" value={editQuantity} onChange={(e) => setEditQuantity(Number(e.target.value))} className="mt-1 block w-full rounded-md p-2 text-text" />
            </div>
            <div>
                <label htmlFor="edit-category" className="block font-body text-sm font-medium text-text">Categoría</label>
                <select id="edit-category" value={editCategoryId || ''} onChange={(e) => setEditCategoryId(e.target.value ? Number(e.target.value) : undefined)} className="mt-1 block w-full rounded-md p-2 text-text">
                    <option value="">Sin Categoría</option>
                    {categories?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div>
              <label htmlFor="edit-description" className="block font-body text-sm font-medium text-text">Descripción</label>
              <input type="text" id="edit-description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="mt-1 block w-full rounded-md p-2 text-text" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="edit-running-low" checked={editRunningLow} onChange={(e) => setEditRunningLow(e.target.checked)} className="h-4 w-4 rounded" />
              <label htmlFor="edit-running-low" className="font-body text-sm text-text">Marcar como "se está por terminar"</label>
            </div>
            <Button variant="primary" className="mt-4 w-full justify-center" onClick={handleSaveChanges}>
              <Check size={20} />
              <span>Guardar Cambios</span>
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}