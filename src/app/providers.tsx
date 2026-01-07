'use client';

declare global {
  interface Window {
    __MSW_WORKER_STARTED__?: boolean;
  }
}
import { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());

 useEffect(() => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // @ts-ignore
    if (!window.__MSW_WORKER_STARTED__) {
      import('@/lib/msw/browser').then(({ worker }) => {
        worker.start({ onUnhandledRequest: 'bypass' });
        // @ts-ignore
        window.__MSW_WORKER_STARTED__ = true; // prevent duplicate
      });
    }
  }
}, []);

  return (
    <QueryClientProvider client={client}>
      {children}
      <Toaster richColors />
    </QueryClientProvider>
  );
}
