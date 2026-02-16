
import React from 'react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster'; // Import the Toaster component

const GlobalLayoutWrapper = ({ children, className }) => {
  return (
    <>
      <div className={cn("w-full mx-auto px-4 py-6 md:px-6 md:py-8 animate-in fade-in duration-500", className)}>
        {children}
      </div>
      <Toaster /> {/* Add the Toaster component here */}
    </>
  );
};

export default GlobalLayoutWrapper;
