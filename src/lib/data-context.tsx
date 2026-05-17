import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { apiFetch } from './api';
import type {
  Org, AsnafGroup, AsnafRecipients, Campaign,
  QurbanOption, QurbanLocation, KaffarahType,
} from '../shared/types';

interface ReferenceData {
  asnaf: AsnafGroup[];
  recipients: AsnafRecipients;
  qurbanOptions: QurbanOption[];
  qurbanLocations: QurbanLocation[];
  kaffarahTypes: KaffarahType[];
}

interface DataState {
  loading: boolean;
  error: string | null;
  orgs: Org[];
  campaigns: Campaign[];
  asnaf: AsnafGroup[];
  recipients: AsnafRecipients;
  qurbanOptions: QurbanOption[];
  qurbanLocations: QurbanLocation[];
  kaffarahTypes: KaffarahType[];
  refresh: () => Promise<void>;
}

const Ctx = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [ref, setRef] = useState<ReferenceData>({
    asnaf: [], recipients: {}, qurbanOptions: [], qurbanLocations: [], kaffarahTypes: [],
  });

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [o, c, r] = await Promise.all([
        apiFetch<Org[]>('/api/orgs'),
        apiFetch<Campaign[]>('/api/campaigns'),
        apiFetch<ReferenceData>('/api/reference'),
      ]);
      setOrgs(o);
      setCampaigns(c);
      setRef(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <Ctx.Provider value={{
      loading, error, orgs, campaigns,
      asnaf: ref.asnaf, recipients: ref.recipients,
      qurbanOptions: ref.qurbanOptions, qurbanLocations: ref.qurbanLocations,
      kaffarahTypes: ref.kaffarahTypes,
      refresh,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useData() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useData must be inside <DataProvider>');
  return v;
}
