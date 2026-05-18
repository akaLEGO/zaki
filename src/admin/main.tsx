import { createRoot } from 'react-dom/client';
import {
  ClerkProvider, SignedIn, SignedOut, SignIn,
} from '@clerk/clerk-react';
import { AdminApp } from './AdminApp';
import { DataProvider } from '../lib/data-context';
import { ClerkTokenBridge } from '../lib/clerk-token-bridge';
import { AZ } from './AdminUI';
import { KaffGlyph } from '../lib/brand';

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

function SignInGate() {
  return (
    <div className="stage" style={{ minHeight: '100vh' }}>
      <div style={{
        background: '#fff', borderRadius: 18, padding: 28,
        boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: AZ.gold, color: AZ.forest,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}><KaffGlyph size={30} /></div>
        <div style={{ fontSize: 16, fontWeight: 700, color: AZ.ink }}>Kaff Admin · Back Office</div>
        <div style={{ fontSize: 12.5, color: AZ.muted, textAlign: 'center', maxWidth: 320 }}>
          กรุณาเข้าสู่ระบบเพื่อจัดการแคมเปญและองค์กร
        </div>
        <SignIn routing="hash" signUpUrl="/admin.html#/sign-up" />
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  if (!publishableKey) {
    createRoot(root).render(
      <div style={{ padding: 40, fontFamily: 'system-ui' }}>
        <h2>Missing VITE_CLERK_PUBLISHABLE_KEY</h2>
        <p>Set this env var on Vercel (Project Settings → Environment Variables) and redeploy.</p>
      </div>,
    );
  } else {
    createRoot(root).render(
      <ClerkProvider publishableKey={publishableKey}>
        <ClerkTokenBridge />
        <SignedOut><SignInGate /></SignedOut>
        <SignedIn>
          <DataProvider>
            <AdminApp />
          </DataProvider>
        </SignedIn>
      </ClerkProvider>,
    );
  }
}
