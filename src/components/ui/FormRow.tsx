"use client";

import React from 'react';

interface FormRowProps {
  label?: React.ReactNode;
  help?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  children?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export default function FormRow({ 
  label, 
  help, 
  error,
  required = false,
  children, 
  className = '',
  fullWidth = true
}: FormRowProps) {
  return (
    <div className={`flex flex-col gap-2 ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label className="text-sm font-semibold text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div>{children}</div>
      {error && <p className="text-xs text-destructive font-medium">{error}</p>}
      {help && !error && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
