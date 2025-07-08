import React from 'react';

interface CardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Card = ({ title, icon, children, className = '' }: CardProps) => {
  return (
    <div className={`bg-card p-6 rounded-lg shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="text-primary">{icon}</div>
        <h2 className="font-heading text-xl text-text">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
};

export default Card;