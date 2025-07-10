'use client';

import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    // Contenedor principal del modal (overlay)
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      {/* Contenedor del contenido del modal (la tarjeta) */}
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
        {/* Cabecera del Modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="font-heading text-xl text-text">{title}</h2>
          <button onClick={onClose} className="text-text/70 hover:text-accent">
            <X size={24} />
          </button>
        </div>
        
        {/* Contenido del Modal (el formulario de edición irá aquí) */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;