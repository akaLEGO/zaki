import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { IOSDevice } from './IosFrame';
import {
  HomeScreen, HistoryScreen, ProfileScreen,
} from './KaffHome';
import type { ServiceId, CompulsoryWording, HomeLayout } from './KaffHome';
import { FAQScreen } from './KaffFaq';
import {
  RibaEntry, RibaOrgSelect,
  ZakatCalc, ZakatAsnaf,
  CompulsoryScreen,
  QurbanPrices,
  SadaqahCampaigns,
} from './KaffServices';
import type { ZakatValues, CompulsorySub, KaffType, QurbanAnimal } from './KaffServices';
import {
  CheckoutScreen, QRPayment, BankTransfer, BaseUSDCPayment, SuccessScreen,
  IS_TESTING_MODE,
} from './KaffPayment';
import type { PayMethod, Summary, Donor } from './KaffPayment';
import type { AsnafId } from '../shared/types';
import type { Tab } from './KaffUI';
import { TweaksPanel, TweakSection, TweakRadio, useTweaks } from './TweaksPanel';
import { useData } from '../lib/data-context';
import { apiFetch } from '../lib/api';

type Screen =
  | 'home' | 'history' | 'profile' | 'faq'
  | 'riba-1' | 'riba-2'
  | 'zakat-1' | 'zakat-2'
  | 'compulsory'
  | 'qurban-1'
  | 'sadaqah'
  | 'checkout' | 'pay-qr' | 'pay-bank' | 'pay-usdc' | 'success';

type ActiveFlow =
  | null | 'riba' | 'zakat'
  | 'fitrah' | 'fidyah' | 'kaffarah'
  | 'qurban' | 'sadaqah';

const SCREEN_GROUPS: { key: Screen; label: string }[] = [
  { key: 'home', label: 'Home Dashboard' },
  { key: 'faq', label: 'FAQ' },
  { key: 'profile', label: 'Profile' },
  { key: 'history', label: 'History (via Profile)' },
  { key: 'riba-1', label: 'Riba — Entry' },
  { key: 'riba-2', label: 'Riba — Org Select' },
  { key: 'zakat-1', label: 'Zakat — Calculator' },
  { key: 'zakat-2', label: 'Zakat — 8 Asnaf' },
  { key: 'compulsory', label: 'Fitrah/Fidyah/Kaffarah' },
  { key: 'qurban-1', label: 'Qurban — Prices' },
  { key: 'sadaqah', label: 'Sadaqah — Campaigns' },
  { key: 'checkout', label: 'Checkout · Niyyah' },
  { key: 'pay-qr', label: 'Payment — Thai QR' },
  { key: 'pay-bank', label: 'Payment — Bank Transfer' },
  { key: 'success', label: 'Success + Receipt' },
];

interface Tweaks {
  compulsoryWording: CompulsoryWording;
  homeLayout: HomeLayout;
}

export function App() {
  const data = useData();
  const {
    orgs: ORG_LIST, campaigns: CAMPAIGNS,
    asnaf: ASNAF, recipients: ASNAF_RECIPIENTS,
    qurbanOptions: QURBAN_OPTIONS,
    kaffarahTypes: KAFFARAH_TYPES,
  } = data;
  const [tweaks, setTweak] = useTweaks<Tweaks>({
    compulsoryWording: 'wajib',
    homeLayout: 'stacked',
  });

  const [screen, setScreen] = useState<Screen>('home');
  const [tab, setTab] = useState<Tab>('home');

  const [ribaAmount, setRibaAmount] = useState(350);
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);

  const [zakatValues, setZakatValues] = useState<ZakatValues>({ cash: 200000, gold: 50000, stocks: 0 });
  const [asnaf, setAsnaf] = useState<AsnafId>('poor');
  const [zakatRecipient, setZakatRecipient] = useState<number | null>(null);

  const [compulsoryTab, setCompulsoryTab] = useState<CompulsorySub>('fitrah');
  const [fitrahCount, setFitrahCount] = useState(4);
  const [fidyahDays, setFidyahDays] = useState(7);
  const [kaffType, setKaffType] = useState<KaffType>('oath');

  const [qurbanCountry, setQurbanCountry] = useState<string | null>('บังกลาเทศ');
  const [qurbanAnimal, setQurbanAnimal] = useState<QurbanAnimal>('goat');
  const [qurbanCowShares, setQurbanCowShares] = useState<number>(1);

  const [campaign, setCampaign] = useState<string | null>('iftar');
  const [iftarMeals, setIftarMeals] = useState(5);

  const [payMethod, setPayMethod] = useState<PayMethod>('qr');
  const [niyyahConfirmed, setNiyyahConfirmed] = useState(false);

  const { user, isSignedIn } = useUser();
  const [donor, setDonor] = useState<Donor>(() => {
    if (typeof window === 'undefined') {
      return { firstName: '', lastName: '', email: '', phone: '', lineId: '' };
    }
    try {
      const cached = window.localStorage.getItem('kaff:donor');
      if (cached) return JSON.parse(cached) as Donor;
    } catch { /* ignore parse errors */ }
    return { firstName: '', lastName: '', email: '', phone: '', lineId: '' };
  });

  // When user signs in, prefer Clerk's identity over localStorage for the
  // base fields (donor can still edit them). Phone + LINE ID stay from
  // whatever they entered last time.
  useEffect(() => {
    if (!isSignedIn || !user) return;
    setDonor(prev => ({
      ...prev,
      firstName: prev.firstName || user.firstName || '',
      lastName:  prev.lastName  || user.lastName  || '',
      email:     prev.email     || user.primaryEmailAddress?.emailAddress || '',
      phone:     prev.phone     || user.primaryPhoneNumber?.phoneNumber  || '',
    }));
  }, [isSignedIn, user]);

  // Persist donor to localStorage so next-visit pre-fills work.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem('kaff:donor', JSON.stringify(donor)); }
    catch { /* quota / private-mode etc — ignore */ }
  }, [donor]);

  const [activeFlow, setActiveFlow] = useState<ActiveFlow>(null);

  const summary: Summary = useMemo(() => {
    switch (activeFlow) {
      case 'riba': {
        const org = ORG_LIST.find(o => o.id === selectedOrg);
        return {
          flow: activeFlow || "",
          amount: ribaAmount,
          type: 'Riba · ดอกเบี้ย',
          dest: org ? org.name : '—',
          niyyah: 'ฉันตั้งใจชำระดอกเบี้ยนี้เพื่อสาธารณประโยชน์ — โดยไม่หวังบุญส่วนตัว',
          shortImpact: 'เคลียร์ดอกเบี้ย',
          impactText: org
            ? `ส่งต่อให้ ${org.name}\nไปสร้าง ${org.goal} แล้ว`
            : 'ส่งต่อสาธารณประโยชน์แล้ว',
        };
      }
      case 'zakat': {
        const total = zakatValues.cash + zakatValues.gold + zakatValues.stocks;
        const amount = Math.round(total * 0.025);
        const recipients = ASNAF_RECIPIENTS[asnaf] || [];
        const r = zakatRecipient !== null ? recipients[zakatRecipient] : undefined;
        const asnafLabel = ASNAF.find(a => a.id === asnaf)?.label || '';
        return {
          flow: activeFlow || "",
          amount,
          type: 'Zakat · ซะกาต',
          dest: r ? r.name : asnafLabel,
          niyyah: 'ฉันตั้งใจจ่ายซะกาตนี้เพื่ออัลลอฮ์ — เพื่อทำหน้าที่ที่พระองค์ทรงบัญชา',
          shortImpact: 'จ่ายซะกาต',
          impactText: r
            ? `ช่วยเหลือ ${r.name}\nในชุมชน${r.area}แล้ว`
            : `ส่งต่อให้กลุ่มผู้รับ ${asnafLabel} แล้ว`,
        };
      }
      case 'fitrah':
        return {
          flow: activeFlow || "",
          amount: fitrahCount * 30,
          type: 'Fitrah · ฟิฏร',
          dest: `${fitrahCount} คน ในครอบครัว`,
          niyyah: 'ฉันตั้งใจจ่าย Zakat al-Fitr ของฉันและครอบครัวเพื่ออัลลอฮ์',
          shortImpact: 'จ่ายฟิฏร',
          impactText: `แจกข้าวสารให้ ${fitrahCount} ครอบครัว\nก่อนละหมาดอีดิลฟิตริแล้ว`,
        };
      case 'fidyah':
        return {
          flow: activeFlow || "",
          amount: fidyahDays * 15,
          type: 'Fidyah · ฟิดยะห์',
          dest: `${fidyahDays} วัน · เลี้ยงผู้ขัดสน`,
          niyyah: 'ฉันตั้งใจชำระ Fidyah ทดแทนวันที่ขาดบวชเพื่ออัลลอฮ์',
          shortImpact: 'ชำระฟิดยะห์',
          impactText: `เลี้ยงอาหารผู้ขัดสน\n${fidyahDays} มื้อ ทดแทนวันขาดบวชแล้ว`,
        };
      case 'kaffarah': {
        const k = KAFFARAH_TYPES.find(x => x.id === kaffType) || KAFFARAH_TYPES[0];
        if (!k) return { flow: '', amount: 0, type: '—', dest: '—', niyyah: '', shortImpact: '' };
        return {
          flow: activeFlow || "",
          amount: k.amount,
          type: 'Kaffarah · กัฟฟารอฮ์',
          dest: 'แจกผู้ขัดสน · ไม่ระบุชื่อ',
          niyyah: 'ฉันตั้งใจชำระ Kaffarah นี้เพื่อชดเชยและทำสิ่งที่ถูกต้องเพื่ออัลลอฮ์',
          shortImpact: 'ชำระแบบส่วนตัว',
          impactText: 'เลี้ยงอาหารผู้ขัดสน\nเริ่มต้นใหม่ได้แล้ว',
        };
      }
      case 'qurban': {
        const q = QURBAN_OPTIONS.find(x => x.country === qurbanCountry);
        const shares = qurbanAnimal === 'cow' ? qurbanCowShares : 1;
        const animalLabel = qurbanAnimal === 'goat'
          ? 'แพะ 1 ตัว'
          : shares === 7 ? 'วัวเต็มตัว' : `วัว ${shares}/7 ส่วน`;
        const countryImpact: Record<string, string> = {
          'ไทย':        'แจกจ่ายเนื้อให้ชาวไทยชายแดนใต้',
          'บังกลาเทศ': 'แจกจ่ายเนื้อให้ชาวบังกลาเทศ',
          'มาเลเซีย':  'แจกจ่ายเนื้อให้ชุมชนมาเลเซีย',
          'กาซา':      'แจกจ่ายเนื้อให้ชาวปาเลสไตน์',
        };
        return {
          flow: activeFlow || "",
          amount: q ? q.price * shares : 0,
          type: 'Qurban · กุรบ่าน',
          dest: q ? `${q.country} · ${animalLabel}` : '—',
          niyyah: 'ฉันตั้งใจทำกุรบ่านนี้เพื่ออัลลอฮ์ — ตามแบบอย่างของนบีอิบรอฮีม',
          shortImpact: 'ทำกุรบ่าน',
          impactText: q
            ? `${countryImpact[q.country] || 'แจกจ่ายเนื้อสด'} · ${animalLabel}`
            : 'แจกจ่ายเนื้อสดในวันอีดอัฎฮา',
        };
      }
      case 'sadaqah': {
        const c = CAMPAIGNS.find(x => x.id === campaign);
        const amount = campaign === 'iftar' ? iftarMeals * 60 : 200;
        return {
          flow: activeFlow || "",
          amount,
          type: 'Sadaqah · ศ่อดะเกาะฮ์',
          dest: c ? c.title : '—',
          niyyah: 'ฉันตั้งใจบริจาคศ่อดะเกาะฮ์นี้เพื่ออัลลอฮ์ — เพื่อช่วยเหลือผู้อื่นด้วยใจบริสุทธิ์',
          shortImpact: 'บริจาคศ่อดะเกาะฮ์',
          impactText: c
            ? (campaign === 'iftar'
              ? `เลี้ยงละศีลอด\n${iftarMeals} มื้อ ผ่านร้านฮาลาลในไทยแล้ว`
              : `สมทบแคมเปญ\n${c.title} แล้ว`)
            : 'สมทบแคมเปญแล้ว',
        };
      }
      default:
        return { flow: '', amount: 0, type: '—', dest: '—', niyyah: '', shortImpact: '' };
    }
  }, [activeFlow, ribaAmount, selectedOrg, zakatValues, asnaf, zakatRecipient, fitrahCount, fidyahDays, kaffType, qurbanCountry, qurbanAnimal, qurbanCowShares, campaign, iftarMeals]);

  const goHome = () => { setScreen('home'); setTab('home'); setNiyyahConfirmed(false); setActiveFlow(null); };
  const goCheckout = (flow: ActiveFlow) => { setActiveFlow(flow); setNiyyahConfirmed(false); setScreen('checkout'); };
  const goPay = () => setScreen(
    payMethod === 'bank' ? 'pay-bank' :
    payMethod === 'usdc' ? 'pay-usdc' :
    'pay-qr'
  );

  const recordDonation = async () => {
    if (!activeFlow) return;
    try {
      await apiFetch('/api/donations', {
        method: 'POST',
        body: JSON.stringify({
          flow: activeFlow,
          amount: summary.amount,
          destination: summary.dest,
          payMethod,
          niyyah: summary.niyyah,
          donorFirstName: donor.firstName.trim(),
          donorLastName:  donor.lastName.trim(),
          donorEmail:     donor.email.trim(),
          donorPhone:     donor.phone.trim(),
          donorLineId:    donor.lineId.trim() || undefined,
          // Tag this row as test so admin can filter/purge before going live.
          // Flips off when VITE_KAFF_TESTING_MODE=false is set on Vercel.
          isTest: IS_TESTING_MODE,
          // Server picks initial status: 'paid' if a partner handles this flow
          // (Qurban → Ummatee), 'completed' otherwise.
        }),
      });
      void data.refresh();
    } catch (e) {
      console.error('donation save failed', e);
    }
  };

  const handleTab = (t: Tab) => {
    setTab(t);
    if (t === 'home') setScreen('home');
    else if (t === 'faq') setScreen('faq');
    else if (t === 'profile') setScreen('profile');
  };

  const openService = (s: ServiceId) => {
    if (s === 'riba') setScreen('riba-1');
    else if (s === 'zakat') setScreen('zakat-1');
    else if (s === 'compulsory') setScreen('compulsory');
    else if (s === 'qurban') setScreen('qurban-1');
    else if (s === 'sadaqah') setScreen('sadaqah');
  };

  let view;
  switch (screen) {
    case 'home':
      view = <HomeScreen
        onService={openService} tab={tab} onTab={handleTab}
        compulsoryWording={tweaks.compulsoryWording}
        homeLayout={tweaks.homeLayout}
      />;
      break;
    case 'history':
      view = <HistoryScreen onBack={() => { setScreen('profile'); setTab('profile'); }} />;
      break;
    case 'faq':
      view = <FAQScreen tab={tab} onTab={handleTab} />;
      break;
    case 'profile':
      view = <ProfileScreen tab={tab} onTab={handleTab} onHistory={() => setScreen('history')} />;
      break;
    case 'riba-1':
      view = <RibaEntry
        amount={ribaAmount} setAmount={setRibaAmount}
        onBack={goHome}
        onNext={() => setScreen('riba-2')}
      />;
      break;
    case 'riba-2':
      view = <RibaOrgSelect
        amount={ribaAmount}
        selectedOrg={selectedOrg} setSelectedOrg={setSelectedOrg}
        onBack={() => setScreen('riba-1')}
        onNext={() => goCheckout('riba')}
      />;
      break;
    case 'zakat-1':
      view = <ZakatCalc
        values={zakatValues} setValues={setZakatValues}
        onBack={goHome}
        onNext={() => setScreen('zakat-2')}
      />;
      break;
    case 'zakat-2': {
      const z = Math.round((zakatValues.cash + zakatValues.gold + zakatValues.stocks) * 0.025);
      view = <ZakatAsnaf
        zakatAmount={z}
        asnaf={asnaf} setAsnaf={setAsnaf}
        recipient={zakatRecipient} setRecipient={setZakatRecipient}
        onBack={() => setScreen('zakat-1')}
        onNext={() => goCheckout('zakat')}
      />;
      break;
    }
    case 'compulsory':
      view = <CompulsoryScreen
        subtab={compulsoryTab} setSubtab={setCompulsoryTab}
        fitrahCount={fitrahCount} setFitrahCount={setFitrahCount}
        fidyahDays={fidyahDays} setFidyahDays={setFidyahDays}
        kaffType={kaffType} setKaffType={setKaffType}
        onBack={goHome}
        onNext={() => goCheckout(compulsoryTab)}
      />;
      break;
    case 'qurban-1':
      view = <QurbanPrices
        selected={qurbanCountry} setSelected={setQurbanCountry}
        animal={qurbanAnimal} setAnimal={setQurbanAnimal}
        cowShares={qurbanCowShares} setCowShares={setQurbanCowShares}
        onBack={goHome}
        onNext={() => goCheckout('qurban')}
      />;
      break;
    case 'sadaqah':
      view = <SadaqahCampaigns
        campaign={campaign} setCampaign={setCampaign}
        iftarMeals={iftarMeals} setIftarMeals={setIftarMeals}
        onBack={goHome}
        onNext={() => goCheckout('sadaqah')}
      />;
      break;
    case 'checkout':
      view = <CheckoutScreen
        summary={summary}
        payMethod={payMethod} setPayMethod={setPayMethod}
        niyyahConfirmed={niyyahConfirmed} setNiyyahConfirmed={setNiyyahConfirmed}
        donor={donor} setDonor={setDonor}
        onBack={() => {
          const map: Record<string, Screen> = {
            riba: 'riba-2', zakat: 'zakat-2',
            fitrah: 'compulsory', fidyah: 'compulsory', kaffarah: 'compulsory',
            qurban: 'qurban-1', sadaqah: 'sadaqah',
          };
          setScreen((activeFlow && map[activeFlow]) || 'home');
        }}
        onNext={goPay}
      />;
      break;
    case 'pay-qr':
      view = <QRPayment amount={summary.amount} onBack={() => setScreen('checkout')} onConfirm={() => { void recordDonation(); setScreen('success'); }} />;
      break;
    case 'pay-bank':
      view = <BankTransfer amount={summary.amount} onBack={() => setScreen('checkout')} onConfirm={() => { void recordDonation(); setScreen('success'); }} />;
      break;
    case 'pay-usdc':
      view = <BaseUSDCPayment amount={summary.amount} onBack={() => setScreen('checkout')} onConfirm={() => { void recordDonation(); setScreen('success'); }} />;
      break;
    case 'success':
      view = <SuccessScreen summary={{ ...summary, payMethod }} donor={donor} onHome={goHome} />;
      break;
    default:
      view = <HomeScreen onService={openService} tab={tab} onTab={handleTab} />;
  }

  const showPreviewPanel = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('preview');

  if (!showPreviewPanel) {
    return (
      <div className="app-fullscreen">
        <div className="app-canvas" key={screen} style={{ animation: 'zakiFade .25s ease-out' }}>
          {view}
        </div>
      </div>
    );
  }

  return (
    <div className="stage">
      <div className="wrap">
        {showPreviewPanel && (
        <div className="credits">
          <span className="logo">
            <span className="dot">ك</span>
            Kaff
          </span>
          <h1>Islamic Finance OS for Thai Muslims</h1>
          <p className="tag">"Be the Upper Hand" · เป็นมือที่พร้อมให้ ในหนทางที่ถูกต้อง — เคลียร์ดอกเบี้ย ซะกาต ฟิฏร กุรบ่าน ศ่อดะเกาะฮ์ ในที่เดียว</p>

          <div className="swatchrow">
            <div className="s" style={{ background: '#0D3B2E' }} title="Forest"></div>
            <div className="s" style={{ background: '#2EC27E' }} title="Sage"></div>
            <div className="s" style={{ background: '#C9A94A' }} title="Gold"></div>
            <div className="s" style={{ background: '#F5F8F5' }} title="Surface"></div>
            <div className="s" style={{ background: '#0A0A0A' }} title="Ink"></div>
          </div>

          <div className="meta">
            <b>Platform</b><span>iOS · 390 × 844</span>
            <b>Type</b><span>Sarabun · Inter</span>
            <b>Screens</b><span>{SCREEN_GROUPS.length} flow</span>
            <b>Flow</b><span>3-tap max</span>
          </div>

          <div style={{ marginTop: 24, fontSize: 12, fontWeight: 700, color: '#0D3B2E', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Jump to screen</div>
          <div className="screen-buttons">
            {SCREEN_GROUPS.map(g => (
              <button
                key={g.key}
                className={screen === g.key ? 'active' : ''}
                onClick={() => {
                  setScreen(g.key);
                  if (g.key === 'checkout' && !activeFlow) setActiveFlow('riba');
                  if ((g.key === 'pay-qr' || g.key === 'pay-bank' || g.key === 'success') && !activeFlow) setActiveFlow('riba');
                  if (g.key === 'home') setTab('home');
                  else if (g.key === 'faq') setTab('faq');
                  else if (g.key === 'profile' || g.key === 'history') setTab('profile');
                }}
              >{g.label}</button>
            ))}
          </div>

          <div style={{ marginTop: 18, fontSize: 11.5, color: '#6e7c73', lineHeight: 1.6, fontStyle: 'italic' }}>
            ทั้งหมดเป็น prototype สามารถกดปุ่ม Back · ปุ่ม CTA · Niyyah ทำงานจริง · ตัวเลขคำนวณสด
          </div>

          <a href="admin.html" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 18, padding: '10px 14px',
            background: '#0D3B2E', color: '#C9A94A',
            borderRadius: 10, textDecoration: 'none',
            fontFamily: 'Inter, system-ui', fontSize: 12.5, fontWeight: 700,
            letterSpacing: '0.01em',
          }}>
            🔐 เปิด Admin Panel (Back Office)
            <span style={{ opacity: 0.6 }}>→</span>
          </a>
        </div>
        )}

        <IOSDevice width={390} height={844}>
          <div key={screen} style={{
            width: '100%', height: '100%',
            animation: 'zakiFade .25s ease-out',
          }}>
            {view}
          </div>
        </IOSDevice>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Home layout" />
        <TweakRadio
          label="Cards"
          value={tweaks.homeLayout}
          options={[
            { value: 'stacked', label: 'Stacked' },
            { value: 'flat', label: 'Flat' },
          ]}
          onChange={(v) => setTweak('homeLayout', v)}
        />
        <TweakSection label="Wajib tab wording" />
        <TweakRadio
          label="Label"
          value={tweaks.compulsoryWording}
          options={[
            { value: 'wajib', label: 'WAJIB' },
            { value: 'duty', label: 'หน้าที่' },
            { value: 'complete', label: 'ครบถ้วน' },
            { value: 'compulsory', label: 'COMPULSORY' },
          ]}
          onChange={(v) => setTweak('compulsoryWording', v)}
        />
      </TweaksPanel>
      <style>{`
        @keyframes zakiFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: none; }
        }
        ::-webkit-scrollbar { width: 0; height: 0; }
      `}</style>
    </div>
  );
}
