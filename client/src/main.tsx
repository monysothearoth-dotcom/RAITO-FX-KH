import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {CurrencyProvider} from './context/CurrencyContext.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from './lib/trpc';
import superjson from 'superjson';
import './index.css';

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({ links: [httpBatchLink({ url: '/api/trpc', transformer: superjson })] });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
);
