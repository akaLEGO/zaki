export type OrgIcon = 'hospital' | 'road' | 'toilet' | 'community';

export interface Org {
  id: string;
  icon: OrgIcon;
  name: string;
  goal: string;
  raised: number;
  target: number;
  pitch: string;
  hot?: boolean;
}

export type AsnafId =
  | 'poor' | 'masakin' | 'needy' | 'muallaf'
  | 'fisabil' | 'traveller' | 'slave' | 'amil';

export interface AsnafGroup {
  id: AsnafId;
  label: string;
  sub: string;
}

export interface Recipient {
  name: string;
  received: number;
  area: string;
  fair?: string;
}

export type AsnafRecipients = Partial<Record<AsnafId, Recipient[]>>;

export interface Campaign {
  id: string;
  tag: string;
  emoji: string;
  title: string;
  sub: string;
  raised: number;
  target: number;
  unit: string;
  color: string;
  pitch: string;
  featured?: boolean;
  perUnit?: number;
}

export interface QurbanOption {
  country: string;
  flag: string;
  price: number;
  currency: string;
  sub: string;
  animal: string;
  popular?: boolean;
  special?: boolean;
}

export interface QurbanLocation {
  id: string;
  flag: string;
  name: string;
  impact: string;
}

export interface KaffarahType {
  id: 'oath' | 'fast' | 'dhihar' | 'general';
  label: string;
  amount: number;
  sub: string;
}
