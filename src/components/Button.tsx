import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'accent';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const Button = ({
  children,
  onClick,
  href,
  variant = 'primary',
  className = '',
  disabled = false,
  type = 'button',
}: ButtonProps) => {
  const baseClasses =
    'flex items-center gap-2 font-bold py-2 px-4 rounded-lg shadow-md transition-colors';

  const variantClasses = {
    primary: 'bg-primary text-white',
    accent: 'bg-accent text-white',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90';

  const finalClassName = `${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={finalClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={finalClassName} disabled={disabled}>
      {children}
    </button>
  );
};

export default Button;