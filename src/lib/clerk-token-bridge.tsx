import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setTokenGetter } from './api';

// Connects Clerk's session token to apiFetch().
// Mount once inside <ClerkProvider>.
export function ClerkTokenBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}
