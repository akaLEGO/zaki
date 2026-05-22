// LIFF bootstrap helpers — separated from React so we can call them before
// mounting anything. Donor pre-fill writes into the same localStorage key
// the consumer App reads on first render, so the form is already populated
// by the time the user hits Checkout.

import liff from '@line/liff';

const DONOR_KEY = 'kaff:donor';
const LIFF_PROFILE_KEY = 'kaff:liff_profile';

interface DonorCache {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lineId: string;
}

export interface LiffProfileCache {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
}

function readDonor(): DonorCache {
  if (typeof window === 'undefined') {
    return { firstName: '', lastName: '', email: '', phone: '', lineId: '' };
  }
  try {
    const raw = window.localStorage.getItem(DONOR_KEY);
    if (raw) return JSON.parse(raw) as DonorCache;
  } catch { /* ignore */ }
  return { firstName: '', lastName: '', email: '', phone: '', lineId: '' };
}

function writeDonor(d: DonorCache) {
  try { window.localStorage.setItem(DONOR_KEY, JSON.stringify(d)); }
  catch { /* quota / private mode */ }
}

export function getLiffProfile(): LiffProfileCache | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LIFF_PROFILE_KEY);
    if (raw) return JSON.parse(raw) as LiffProfileCache;
  } catch { /* ignore */ }
  return null;
}

function writeLiffProfile(p: LiffProfileCache) {
  try { window.localStorage.setItem(LIFF_PROFILE_KEY, JSON.stringify(p)); }
  catch { /* ignore */ }
}

/**
 * Initialize LIFF, force login if needed, and pre-fill the donor form with
 * the LINE user's identity. Returns the LIFF profile or null on failure.
 *
 * Returns synchronously after redirecting to login when not logged in (the
 * page will re-enter this function after the LINE OAuth round-trip).
 */
export async function bootstrapLiff(liffId: string): Promise<LiffProfileCache | null> {
  await liff.init({ liffId });

  // Outside LINE in-app browser, isLoggedIn() can return false. Force the
  // OAuth flow — LIFF handles the redirect + token exchange.
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return null; // page will reload after auth
  }

  const profile = await liff.getProfile();
  // ID token contains email only if `email` scope was granted on the LIFF app.
  let email: string | undefined;
  try {
    const idToken = liff.getDecodedIDToken();
    if (idToken && typeof idToken.email === 'string') email = idToken.email;
  } catch { /* scope not granted — fall back without email */ }

  const cached: LiffProfileCache = {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl,
    email,
  };
  writeLiffProfile(cached);

  // Pre-fill donor info — only fill fields that are still empty so the user's
  // own edits never get overwritten.
  const existing = readDonor();
  const [firstName, ...rest] = (profile.displayName || '').trim().split(/\s+/);
  const lastName = rest.join(' ');
  writeDonor({
    firstName: existing.firstName || firstName || '',
    lastName:  existing.lastName  || lastName  || '',
    email:     existing.email     || email     || '',
    phone:     existing.phone, // LIFF profile doesn't expose phone
    lineId:    existing.lineId, // leave the user-facing @display alone
  });

  return cached;
}

/** Picker-based share to a LINE chat / group / oneOnOne / room. */
export async function liffShareReceipt(text: string): Promise<{ shared: boolean; reason?: string }> {
  if (!liff.isInClient || !liff.isInClient()) {
    return { shared: false, reason: 'not in LINE app' };
  }
  if (!liff.shareTargetPicker) {
    return { shared: false, reason: 'shareTargetPicker not available' };
  }
  try {
    const res = await liff.shareTargetPicker([{ type: 'text', text }]);
    return { shared: !!res };
  } catch (e) {
    return { shared: false, reason: String(e instanceof Error ? e.message : e) };
  }
}
