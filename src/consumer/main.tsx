import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { App } from './ZakiApp';
import { DataProvider } from '../lib/data-context';
import { ClerkTokenBridge } from '../lib/clerk-token-bridge';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

if (!publishableKey) {
  console.warn('VITE_CLERK_PUBLISHABLE_KEY is missing — auth UI will be disabled.');
}

const root = document.getElementById('root');
if (root) {
  const tree = (
    <DataProvider>
      <App />
    </DataProvider>
  );
  createRoot(root).render(
    publishableKey ? (
      <ClerkProvider publishableKey={publishableKey}>
        <ClerkTokenBridge />
        {tree}
      </ClerkProvider>
    ) : tree,
  );
}
