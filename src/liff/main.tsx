// LIFF entry point. Initializes the LINE SDK, runs the OAuth flow if
// needed, then mounts the regular consumer App. The donor form is already
// pre-filled via localStorage by the time React renders.

import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { Analytics } from '@vercel/analytics/react';
import { App } from '../consumer/KaffApp';
import { DataProvider } from '../lib/data-context';
import { bootstrapLiff } from './liff-init';

const liffId = import.meta.env.VITE_LIFF_ID as string | undefined;
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

function renderError(message: string) {
  const root = document.getElementById('root');
  if (!root) return;
  root.innerHTML = `
    <div style="position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#0D3B2E;color:#fff;padding:24px;font-family:'Manrope',system-ui,sans-serif;text-align:center;">
      <div style="width:60px;height:60px;border-radius:16px;background:#C0392B;color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;">!</div>
      <div style="font-size:18px;font-weight:800;">เปิด LIFF ไม่สำเร็จ</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.7);max-width:320px;line-height:1.5;">${message}</div>
      <a href="https://kaff.me/" style="margin-top:12px;color:#D4AF37;text-decoration:underline;font-size:13px;">ใช้ผ่าน Web แทน →</a>
    </div>
  `;
}

async function start() {
  if (!liffId) {
    renderError('VITE_LIFF_ID ยังไม่ตั้งใน Vercel — รอ admin ตั้งค่า แล้วลองใหม่');
    return;
  }

  try {
    const profile = await bootstrapLiff(liffId);
    if (!profile) {
      // bootstrapLiff returned null because it redirected to LINE login.
      // The page will reload after auth — nothing to render here.
      return;
    }
  } catch (e) {
    renderError(String(e instanceof Error ? e.message : e));
    return;
  }

  const root = document.getElementById('root');
  if (!root) return;

  // Wrap with ClerkProvider so any Clerk hooks inside App (useUser etc.)
  // don't throw. LIFF users won't be signed into Clerk — they'll just be
  // anonymous from Clerk's point of view, with identity coming from the
  // LIFF profile via localStorage. If VITE_CLERK_PUBLISHABLE_KEY isn't set,
  // we render without it (Clerk hooks gracefully return isSignedIn=false).
  const tree = (
    <DataProvider>
      <App />
      <Analytics />
    </DataProvider>
  );
  // Clear the splash before mounting.
  root.innerHTML = '';
  createRoot(root).render(
    clerkKey
      ? <ClerkProvider publishableKey={clerkKey}>{tree}</ClerkProvider>
      : tree,
  );
}

void start();
