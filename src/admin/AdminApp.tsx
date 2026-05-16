import { useState } from 'react';
import { AZ, AIcon, ABtn } from './AdminUI';
import type { IconName } from './AdminUI';
import { ChromeWindow } from './BrowserWindow';
import { AdminDashboard, AdminCampaigns, AdminOrgs } from './AdminScreens';

type ScreenId = 'dashboard' | 'campaigns' | 'orgs' | 'rates' | 'transactions' | 'shariah' | 'settings';

interface NavItem {
  id: ScreenId;
  icon: IconName;
  label: string;
  badge?: string;
  soon?: boolean;
}
interface NavGroup { label: string; items: NavItem[] }

function Sidebar({ screen, setScreen }: { screen: ScreenId; setScreen: (s: ScreenId) => void }) {
  const groups: NavGroup[] = [
    { label: 'OVERVIEW', items: [
      { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    ]},
    { label: 'CATALOG', items: [
      { id: 'campaigns', icon: 'campaign', label: 'Campaigns', badge: '12' },
      { id: 'orgs',      icon: 'orgs',     label: 'Orgs & Recipients' },
      { id: 'rates',     icon: 'rates',    label: 'Rates & Prices', soon: true },
    ]},
    { label: 'OPERATIONS', items: [
      { id: 'transactions', icon: 'transactions', label: 'Transactions', soon: true },
      { id: 'shariah',      icon: 'shariah',      label: 'Shariah Board', soon: true, badge: '3' },
    ]},
    { label: 'SETTINGS', items: [
      { id: 'settings', icon: 'settings', label: 'Roles & Audit', soon: true },
    ]},
  ];

  return (
    <div style={{
      width: 230, flexShrink: 0,
      background: 'linear-gradient(180deg, #0D3B2E 0%, #082A21 100%)',
      color: '#fff', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(0,0,0,0.2)',
    }}>
      <div style={{ padding: '20px 18px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: AZ.gold, color: AZ.forest,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: 18, fontFamily: 'Sarabun',
        }}>ز</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em' }}>Zaki Admin</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', fontWeight: 600, marginTop: 1 }}>BACK OFFICE</div>
        </div>
      </div>

      <div style={{
        margin: '0 14px 16px', padding: '8px 12px',
        background: 'rgba(255,255,255,0.05)', borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: 12,
      }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: AZ.sage }} />
          <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Production</span>
        </span>
        <AIcon name="chev" size={14} color="rgba(255,255,255,0.5)" />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 14px' }}>
        {groups.map((g, gi) => (
          <div key={gi} style={{ marginBottom: 12 }}>
            <div style={{
              padding: '8px 12px 6px', fontSize: 10,
              color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '0.14em',
            }}>{g.label}</div>
            {g.items.map(it => {
              const active = screen === it.id;
              const disabled = it.soon && !active;
              return (
                <button
                  key={it.id}
                  disabled={disabled}
                  onClick={() => !disabled && setScreen(it.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '8px 12px', marginBottom: 2,
                    background: active ? 'rgba(201,169,74,0.12)' : 'transparent',
                    color: active ? AZ.gold : disabled ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.78)',
                    borderRadius: 8, borderLeft: active ? `2px solid ${AZ.gold}` : '2px solid transparent',
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 13.5, fontWeight: active ? 700 : 500,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'background .12s',
                  }}
                >
                  <AIcon name={it.icon} size={17} color={active ? AZ.gold : disabled ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.7)'} />
                  <span style={{ flex: 1 }}>{it.label}</span>
                  {it.badge && (
                    <span style={{
                      padding: '1px 7px', borderRadius: 999,
                      background: active ? 'rgba(201,169,74,0.2)' : 'rgba(255,255,255,0.08)',
                      color: active ? AZ.gold : 'rgba(255,255,255,0.65)',
                      fontSize: 10, fontWeight: 700,
                    }}>{it.badge}</span>
                  )}
                  {it.soon && !it.badge && (
                    <span style={{
                      padding: '1px 6px', borderRadius: 999,
                      background: 'rgba(255,255,255,0.06)',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                    }}>SOON</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{
        padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 999,
          background: 'linear-gradient(135deg, #2EC27E 0%, #1F8A5B 100%)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14,
        }}>น</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>เนตร W.</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>super-admin</div>
        </div>
        <button style={{
          width: 28, height: 28, borderRadius: 7,
          color: 'rgba(255,255,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><AIcon name="chev" size={14} color="rgba(255,255,255,0.5)" /></button>
      </div>
    </div>
  );
}

export function AdminApp() {
  const [screen, setScreen] = useState<ScreenId>('dashboard');

  let view;
  switch (screen) {
    case 'dashboard':
      view = <AdminDashboard onNav={setScreen} />;
      break;
    case 'campaigns':
      view = <AdminCampaigns />;
      break;
    case 'orgs':
      view = <AdminOrgs />;
      break;
    default:
      view = (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            gap: 12,
          }}>
            <AIcon name="settings" size={36} color={AZ.mutedLite} />
            <div style={{ fontSize: 18, fontWeight: 700, color: AZ.ink }}>เร็วๆ นี้</div>
            <div style={{ fontSize: 13, color: AZ.muted, maxWidth: 400 }}>
              หน้า {screen} ยังเป็น mock — เริ่มใช้งานจริงพร้อมกับ Rates, Transactions, Shariah Board และ Roles+Audit Log ในเฟส 2
            </div>
            <ABtn kind="ghost" onClick={() => setScreen('dashboard')}>กลับ Dashboard</ABtn>
          </div>
        </div>
      );
  }

  return (
    <div className="stage">
      <ChromeWindow
        width={1280} height={820}
        tabs={[
          { title: 'Zaki Admin · Back Office' },
          { title: 'Shariah Committee' },
          { title: 'BoT Reports' },
        ]}
        activeIndex={0}
        url={"admin.zaki.app/" + (screen === 'dashboard' ? '' : screen)}
      >
        <div style={{
          height: '100%', display: 'flex',
          background: AZ.surface,
          fontFamily: 'Sarabun, Inter, system-ui, sans-serif',
        }}>
          <Sidebar screen={screen} setScreen={setScreen} />
          <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
            {view}
          </div>
        </div>
      </ChromeWindow>
    </div>
  );
}
