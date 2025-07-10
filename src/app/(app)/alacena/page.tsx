'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getDb } from '@/lib/db'; // Se importa getDb en lugar de db
import { useLiveQuery } from 'dexie-react-hooks';
import Link from 'next/link';
import { ChevronRight, Plus, Users, User, Check, X } from 'lucide-react';
import Button from '@/components/Button';
import toast from 'react-hot-toast';
import Dexie from 'dexie';

export default function PantriesListPage() {
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

  // Leemos tanto las alacenas como las invitaciones pendientes de la BD del usuario
  const pantries = useLiveQuery(() => db?.table('pantries').toArray(), [db]);
  const invitations = useLiveQuery(() => db?.table('pantry_invitations').toArray(), [db]);

  // --- Lógica para Aceptar o Rechazar ---
  const handleAcceptInvitation = async (invitationId: number) => {
    if (!db) return;
    const { error } = await supabase
      .from('pantry_members')
      .update({ status: 'accepted' })
      .eq('id', invitationId);

    if (error) {
      toast.error('Error al aceptar la invitación.');
    } else {
      toast.success('¡Invitación aceptada! Sincronizando...');
      await (db as any).pantry_invitations.delete(invitationId);
      // Forzamos una resincronización para que la nueva alacena aparezca inmediatamente
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('online'));
      }
    }
  };

  const handleDeclineInvitation = async (invitationId: number) => {
    if (!db) return;
    await supabase.from('pantry_members').delete().eq('id', invitationId);
    await (db as any).pantry_invitations.delete(invitationId);
    toast.success('Invitación rechazada.');
  };

  if (!db) {
    return <div className="p-8">Cargando datos del usuario...</div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="font-heading text-3xl font-bold text-text">Mis Alacenas</h1>
          <p className="font-body text-text/70 mt-1">Gestiona y comparte tus alacenas.</p>
        </div>
        <Link href="/alacenas/crear">
          <Button variant="primary"><Plus size={20} /><span>Crear Alacena</span></Button>
        </Link>
      </header>

      {/* SECCIÓN DE INVITACIONES PENDIENTES */}
      {invitations && invitations.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-bold text-accent">Invitaciones Pendientes</h2>
          {invitations.map((inv: any) => (
            <div key={inv.id} className="bg-card p-4 rounded-lg shadow-sm flex justify-between items-center">
              <div>
                <p className="font-body text-text">
                  Has sido invitado a unirte a la alacena <span className="font-bold text-primary">{inv.pantry_name}</span>.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleAcceptInvitation(inv.id)} className="bg-primary hover:bg-primary/90 text-white p-2 h-9 w-9 !rounded-full" title="Aceptar">
                  <Check size={16} />
                </Button>
                <Button onClick={() => handleDeclineInvitation(inv.id)} className="bg-accent hover:bg-accent/90 text-white p-2 h-9 w-9 !rounded-full" title="Rechazar">
                  <X size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Grilla de alacenas existentes */}
      <h2 className="font-heading text-2xl font-bold text-text mt-4">Tus Alacenas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pantries?.map((pantry: any) => (
          <Link href={`/alacenas/${pantry.id}`} key={pantry.id}>
            <div className="bg-card p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-32">
              <div className="flex justify-between items-start">
                <span className="font-heading text-xl font-bold text-text">{pantry.name}</span>
                <ChevronRight size={24} className="text-text/50 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 text-sm text-text/60">
                {pantry.pantry_type === 'shared' ? <Users size={16} /> : <User size={16} />}
                <span className="capitalize">{pantry.pantry_type === 'shared' ? 'Compartida' : 'Personal'}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}