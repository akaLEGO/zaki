import { useState, useEffect } from 'react';
import {
  Z, K, G, NUM, glass, Icon, GoldButton, ForestHeader, StickyBottom,
  Card, ProgressBar, MoneyField, Stepper, Chip, TrustBadge, Eyebrow, Amount, fmtTHB, fmtPct,
} from './KaffUI';
import type { AsnafId } from '../shared/types';
import { useData } from '../lib/data-context';

export function RibaEntry({ amount, setAmount, onBack, onNext }: {
  amount: number; setAmount: (n: number) => void; onBack: () => void; onNext: () => void;
}) {
  const presets = [50, 100, 500, 1000];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: G.paperGold }}>
      <ForestHeader
        onBack={onBack}
        title="ไม่รู้จะทำยังไงกับดอกเบี้ยที่มี?"
        sub="เคลียร์ดอกเบี้ย (Riba) ให้เกิดประโยชน์สูงสุด ส่งต่อให้สาธารณประโยชน์โดยไม่หวังบุญ"
        right={
          <div style={{
            padding: '7px 12px', ...glass('light'), color: Z.forest,
            borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          }}>RIBA · ดอกเบี้ย</div>
        }
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 24px' }}>
        <div style={{ fontSize: 13, color: Z.muted, fontWeight: 600, marginBottom: 8 }}>ดอกเบี้ยที่ได้รับ</div>
        <MoneyField value={amount} onChange={setAmount} autoFocus />

        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {presets.map(p => (
            <Chip key={p} active={amount === p} onClick={() => setAmount(p)} color={Z.forest}>
              ฿{p.toLocaleString()}
            </Chip>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <TrustBadge>✓ 100% ของเงินถึงผู้รับ — Kaff อยู่ได้ด้วยความเมตตาจากผู้ใช้</TrustBadge>
        </div>

        <div style={{
          marginTop: 14, padding: 16, background: 'rgba(255,255,255,0.72)',
          borderRadius: 18, border: `1px solid rgba(255,255,255,0.9)`,
        }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ color: Z.forest }}><Icon name="info" size={20} /></div>
            <div style={{ flex: 1, fontSize: 13, lineHeight: 1.55, color: Z.ink }}>
              <b style={{ color: Z.forest }}>ทำไมดอกเบี้ยเป็นสิ่งต้องห้าม?</b><br />
              <span style={{ color: Z.muted }}>ดอกเบี้ยตามหลักศาสนานั้นไม่สามารถใช้ส่วนตัวได้ แต่การปล่อยทิ้งไว้ในระบบธนาคารก็ไม่ใช่ทางออก Kaff ช่วยคุณเคลียร์เงินส่วนนี้ไปสร้างประโยชน์สาธารณะเพื่อความบริสุทธิ์ใจ (ไม่นับเป็นแต้มบุญทาน)</span>
            </div>
          </div>
        </div>

        {amount > 0 && (
          <div style={{
            marginTop: 14, padding: '14px 16px',
            background: Z.sageSoft, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 12, color: Z.forest, fontWeight: 600 }}>คุณจะส่งต่อ</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: Z.forest, letterSpacing: '-0.02em' }}>{fmtTHB(amount)}</div>
            </div>
            <div style={{ fontSize: 11, color: Z.forest, opacity: 0.7, textAlign: 'right', lineHeight: 1.4 }}>เพื่อสาธารณประโยชน์<br />ไม่นับบุญส่วนตัว</div>
          </div>
        )}
      </div>

      <StickyBottom tone="gold">
        <GoldButton disabled={!amount} onClick={onNext}>
          เลือกองค์กร <Icon name="arrowRight" size={20} />
        </GoldButton>
      </StickyBottom>
    </div>
  );
}

export function RibaOrgSelect({ amount, selectedOrg, setSelectedOrg, onBack, onNext }: {
  amount: number; selectedOrg: string | null; setSelectedOrg: (id: string) => void; onBack: () => void; onNext: () => void;
}) {
  const { orgs: ORG_LIST } = useData();
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: G.paperGold }}>
      <ForestHeader
        onBack={onBack}
        title="เลือกองค์กรที่ต้องการส่งต่อ"
        sub={`ดอกเบี้ย ${fmtTHB(amount)} · เรียงตามใกล้บรรลุเป้าหมาย`}
        compact
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 24px' }}>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 4px 12px',
        }}>
          <div style={{ fontSize: 12, color: Z.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="flame" size={14} color={Z.gold} /> เรียงตามใกล้บรรลุเป้าหมาย
          </div>
          <button style={{ fontSize: 12, color: Z.forest, fontWeight: 600 }}>เปลี่ยน</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ORG_LIST.map(org => {
            const pct = (org.raised / org.target) * 100;
            const isSel = selectedOrg === org.id;
            const isExp = expanded === org.id;
            return (
              <Card key={org.id}
                onClick={() => setSelectedOrg(org.id)}
                selected={isSel}
                padding={0}
                style={{ overflow: 'hidden' }}
              >
                {org.hot && (
                  <div style={{
                    background: `linear-gradient(90deg, ${Z.gold} 0%, #E2C26E 100%)`,
                    color: '#3d2c08', padding: '6px 14px',
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Icon name="flame" size={12} color="#3d2c08" /> ใกล้สำเร็จ · เหลืออีก {fmtTHB(org.target - org.raised)}
                  </div>
                )}
                <div style={{ padding: 14, display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: Z.sageSoft, color: Z.forest,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon name={org.icon} size={22} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: Z.ink, lineHeight: 1.3 }}>{org.name}</div>
                    <div style={{ fontSize: 12.5, color: Z.muted, fontStyle: 'italic', marginTop: 2, lineHeight: 1.4 }}>{org.goal}</div>
                  </div>
                  <div style={{
                    width: 26, height: 26, borderRadius: 999,
                    border: `2px solid ${isSel ? Z.forest : Z.line}`,
                    background: isSel ? Z.forest : '#fff',
                    color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all .15s',
                  }}>
                    {isSel && <Icon name="check" size={14} strokeWidth={2.5} />}
                  </div>
                </div>
                <div style={{ padding: '0 14px 14px' }}>
                  <ProgressBar value={pct} color={org.hot ? Z.gold : Z.sage} />
                  <div style={{
                    marginTop: 8, display: 'flex', justifyContent: 'space-between',
                    fontSize: 12, color: Z.muted,
                  }}>
                    <span><b style={{ color: Z.ink, fontWeight: 700 }}>{fmtTHB(org.raised)}</b> / {fmtTHB(org.target)}</span>
                    <span style={{ color: Z.sage, fontWeight: 700 }}>{fmtPct(pct)}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setExpanded(isExp ? null : org.id); }}
                    style={{
                      marginTop: 10, fontSize: 12, color: Z.forest, fontWeight: 600,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    📖 อ่านรายละเอียด
                    <Icon name={isExp ? 'chevUp' : 'chevDown'} size={14} />
                  </button>
                  {isExp && (
                    <div style={{
                      marginTop: 10, padding: 12, background: Z.surface, borderRadius: 12,
                      fontSize: 12.5, color: Z.ink, lineHeight: 1.55,
                    }}>{org.pitch}</div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <StickyBottom tone="gold">
        <GoldButton disabled={!selectedOrg} onClick={onNext}>
          ถัดไป <Icon name="arrowRight" size={20} />
        </GoldButton>
      </StickyBottom>
    </div>
  );
}

export interface ZakatValues { cash: number; gold: number; stocks: number }

export function ZakatCalc({ values, setValues, onBack, onNext }: {
  values: ZakatValues; setValues: (v: ZakatValues) => void; onBack: () => void; onNext: () => void;
}) {
  const total = (values.cash || 0) + (values.gold || 0) + (values.stocks || 0);
  const zakat = Math.round(total * 0.025);
  const NISAB = 195500;
  const meetsNisab = total >= NISAB;

  const setV = (k: keyof ZakatValues, v: number) => setValues({ ...values, [k]: v });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: G.paperGold }}>
      <ForestHeader
        onBack={onBack}
        title={<>รู้ได้ไงว่าซะกาตที่ให้<br />ได้ประโยชน์สูงสุด?</>}
        sub="คำนวณ 2.5% ของทรัพย์สินที่ครอบครองครบ 1 ปี"
        right={<div style={{ padding: '7px 12px', ...glass('light'), color: Z.forest, borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>ZAKAT · ซะกาต</div>}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <MoneyField value={values.cash} onChange={(v) => setV('cash', v)} label="เงินสด / เงินฝาก" />
          <MoneyField value={values.gold} onChange={(v) => setV('gold', v)} label="มูลค่าทองคำ" />
          <MoneyField value={values.stocks} onChange={(v) => setV('stocks', v)} label="มูลค่าหุ้น / การลงทุน" />
        </div>

        <div style={{
          marginTop: 18, padding: 18,
          background: meetsNisab ? Z.forest : '#FFF6E0',
          color: meetsNisab ? '#fff' : '#5a4400',
          borderRadius: 20, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 999,
            background: meetsNisab ? 'rgba(46,194,126,0.2)' : 'rgba(201,169,74,0.2)',
            color: meetsNisab ? '#B6F1D4' : '#7a5e10',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
          }}>
            {meetsNisab ? '✓ ถึงเกณฑ์นิศอบแล้ว' : '⚠ ยังไม่ถึงเกณฑ์นิศอบ'}
          </div>
          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.7 }}>ซะกาตที่ต้องจ่าย (2.5%)</div>
          <div style={{
            ...NUM, fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em', marginTop: 2,
            fontVariantNumeric: 'tabular-nums',
          }}>{fmtTHB(zakat)}</div>
          <div style={{
            marginTop: 10, paddingTop: 12,
            borderTop: `1px solid ${meetsNisab ? 'rgba(255,255,255,0.12)' : 'rgba(122,94,16,0.18)'}`,
            display: 'flex', justifyContent: 'space-between', fontSize: 12.5, opacity: 0.85,
          }}>
            <span>ทรัพย์รวม</span>
            <span style={{ fontWeight: 700 }}>{fmtTHB(total)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, opacity: 0.85, marginTop: 4 }}>
            <span>นิศอบ (85g · ทอง)</span>
            <span style={{ fontWeight: 600 }}>{fmtTHB(NISAB)}</span>
          </div>
        </div>

        <div style={{ marginTop: 14, padding: '12px 14px', fontSize: 12, color: Z.muted, lineHeight: 1.55 }}>
          ที่ปรึกษาชะรีอะฮ์ของเรารับรองสูตรนี้ · ถามรายละเอียดเพิ่มเติมได้ที่หน้าโปรไฟล์
        </div>
      </div>

      <StickyBottom tone="gold">
        <GoldButton disabled={!meetsNisab || zakat === 0} onClick={onNext}>
          เลือกกลุ่มผู้รับ <Icon name="arrowRight" size={20} />
        </GoldButton>
      </StickyBottom>
    </div>
  );
}

export function ZakatAsnaf({ zakatAmount, asnaf, setAsnaf, recipient, setRecipient, onBack, onNext }: {
  zakatAmount: number; asnaf: AsnafId; setAsnaf: (a: AsnafId) => void;
  recipient: number | null; setRecipient: (i: number | null) => void;
  onBack: () => void; onNext: () => void;
}) {
  const { asnaf: ASNAF, recipients: ASNAF_RECIPIENTS } = useData();
  const recipients = ASNAF_RECIPIENTS[asnaf] || [];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: G.paperGold }}>
      <ForestHeader
        onBack={onBack}
        title="เลือกกลุ่มที่ต้องการช่วย"
        sub={`ซะกาต ${fmtTHB(zakatAmount)} · 8 อัศนาฟตามอัล-กุรอาน`}
        compact
      />
      <div style={{
        background: 'rgba(255,255,255,0.72)', borderBottom: `1px solid ${Z.line}`,
        padding: '12px 0',
      }}>
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px',
          scrollbarWidth: 'none',
        } as React.CSSProperties}>
          {ASNAF.map(a => (
            <Chip key={a.id} active={asnaf === a.id} onClick={() => { setAsnaf(a.id); setRecipient(null); }} color={Z.forest}>
              {a.label}
            </Chip>
          ))}
        </div>
        {asnaf && (
          <div style={{ padding: '8px 20px 0', fontSize: 11.5, color: Z.muted }}>
            {ASNAF.find(a => a.id === asnaf)?.sub}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 24px' }}>
        {!asnaf && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: Z.muted }}>
            เลือกกลุ่มอัศนาฟด้านบนเพื่อดูผู้รับ
          </div>
        )}
        {asnaf && recipients.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: Z.muted, fontSize: 13.5 }}>
            ยังไม่มีผู้รับในกลุ่มนี้ในพื้นที่ของคุณ<br />
            <span style={{ fontSize: 12 }}>ลองเลือกกลุ่มอื่น</span>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {recipients.map((r, i) => (
            <Card key={i}
              onClick={() => setRecipient(i)}
              selected={recipient === i}
              padding={14}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: Z.sageSoft, color: Z.forest,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 14, flexShrink: 0,
                }}>{r.name.charAt(0)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: Z.ink, lineHeight: 1.3 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: Z.muted, marginTop: 2 }}>{r.area} · ได้รับเดือนนี้ {fmtTHB(r.received)}</div>
                  {r.fair && (
                    <div style={{
                      marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', background: 'rgba(201,169,74,0.16)', color: '#7a5e10',
                      borderRadius: 999, fontSize: 11, fontWeight: 600,
                    }}>
                      <Icon name="sparkle" size={11} /> {r.fair}
                    </div>
                  )}
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: 999,
                  border: `2px solid ${recipient === i ? Z.forest : Z.line}`,
                  background: recipient === i ? Z.forest : '#fff',
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{recipient === i && <Icon name="check" size={14} strokeWidth={2.5} />}</div>
              </div>
            </Card>
          ))}
        </div>

        {asnaf && recipients.length > 0 && (
          <div style={{
            marginTop: 14, padding: 12, background: Z.sageSoft, borderRadius: 14,
            fontSize: 12.5, color: Z.forest, lineHeight: 1.5,
          }}>
            <b>Fairness Engine</b> · ระบบแนะนำให้กระจายไปยังผู้รับที่ได้รับเดือนนี้น้อยกว่า เพื่อความเป็นธรรม
          </div>
        )}
      </div>

      <StickyBottom tone="gold">
        <GoldButton disabled={recipient === null} onClick={onNext}>
          ถัดไป <Icon name="arrowRight" size={20} />
        </GoldButton>
      </StickyBottom>
    </div>
  );
}

export type CompulsorySub = 'fitrah' | 'fidyah' | 'kaffarah';
export type KaffType = 'oath' | 'fast' | 'dhihar' | 'general';

export function CompulsoryScreen({
  subtab, setSubtab, fitrahCount, setFitrahCount, fidyahDays, setFidyahDays, kaffType, setKaffType, onBack, onNext,
}: {
  subtab: CompulsorySub; setSubtab: (s: CompulsorySub) => void;
  fitrahCount: number; setFitrahCount: (n: number) => void;
  fidyahDays: number; setFidyahDays: (n: number) => void;
  kaffType: KaffType; setKaffType: (k: KaffType) => void;
  onBack: () => void; onNext: () => void;
}) {
  const { kaffarahTypes: KAFFARAH_TYPES } = useData();
  const tabs: { id: CompulsorySub; label: string; sub: string }[] = [
    { id: 'fitrah', label: 'Fitrah', sub: 'ฟิฏร' },
    { id: 'fidyah', label: 'Fidyah', sub: 'ฟิดยะห์' },
    { id: 'kaffarah', label: 'Kaffarah', sub: 'กัฟฟารอฮ์' },
  ];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: G.paperGreen }}>
      <ForestHeader
        onBack={onBack}
        title="เปลี่ยนเรื่องวาญิบให้ง่ายยิ่งกว่า"
        sub="หน้าที่ฟิดยะห์ · ฟิฏร · กัฟฟารอฮ์ ระบบจัดการให้ง่ายขึ้น"
        compact
      />
      <div style={{
        background: 'rgba(255,255,255,0.72)', borderBottom: `1px solid ${Z.line}`,
        padding: '0 20px', display: 'flex', gap: 4,
      }}>
        {tabs.map(t => {
          const active = subtab === t.id;
          return (
            <button key={t.id} onClick={() => setSubtab(t.id)}
              style={{
                padding: '14px 4px', flex: 1, position: 'relative',
                color: active ? Z.forest : Z.muted, fontWeight: active ? 700 : 500,
                fontSize: 15,
              }}>
              {t.label}
              <div style={{ fontSize: 10, color: Z.muted, marginTop: 1 }}>{t.sub}</div>
              {/* Wajib is a green context — gold stays reserved for
                  Zakat / Qurban / Riba-cleanse. */}
              {active && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 4, right: 4,
                  height: 3, background: Z.forest, borderRadius: 2,
                }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>
        {subtab === 'fitrah' && <FitrahPanel count={fitrahCount} setCount={setFitrahCount} />}
        {subtab === 'fidyah' && <FidyahPanel days={fidyahDays} setDays={setFidyahDays} />}
        {subtab === 'kaffarah' && <KaffarahPanel type={kaffType} setType={setKaffType} types={KAFFARAH_TYPES} />}
      </div>

      <StickyBottom>
        <GoldButton onClick={onNext}>
          {subtab === 'fitrah' && `ชำระ Fitrah · ${fmtTHB(fitrahCount * 30)}`}
          {subtab === 'fidyah' && `ชำระ Fidyah · ${fmtTHB(fidyahDays * 15)}`}
          {subtab === 'kaffarah' && `ชำระแบบส่วนตัว · ${fmtTHB((KAFFARAH_TYPES.find(k => k.id === kaffType) || KAFFARAH_TYPES[0]).amount)}`}
          {' '}<Icon name="arrowRight" size={20} />
        </GoldButton>
      </StickyBottom>
    </div>
  );
}

function FitrahPanel({ count, setCount }: { count: number; setCount: (n: number) => void }) {
  const total = count * 30;
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: Z.forest, lineHeight: 1.3 }}>
        ปีนี้คุณจ่าย Fitrah<br />ให้คุณหรือครอบครัวแล้วหรือยัง?
      </div>
      <div style={{ fontSize: 13, color: Z.muted, marginTop: 6, lineHeight: 1.5 }}>
        วาญิบสำหรับมุสลิมทุกคน · 1 คน = ฿30 (เทียบเท่า 2.5 กก. ข้าว)
      </div>

      <div style={{ marginTop: 30, padding: 22, background: 'rgba(255,255,255,0.72)', borderRadius: 22, border: `1px solid rgba(255,255,255,0.9)` }}>
        <div style={{ fontSize: 12, color: Z.muted, fontWeight: 600, textAlign: 'center' }}>จำนวนสมาชิกในบ้าน</div>
        <div style={{ marginTop: 14 }}>
          <Stepper value={count} onChange={setCount} min={1} max={20} />
        </div>
        <div style={{
          marginTop: 22, padding: '14px 16px', background: Z.sageSoft,
          borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <div>
            <div style={{ fontSize: 11, color: Z.forest, fontWeight: 600 }}>รวมทั้งหมด</div>
            <div style={{ fontSize: 11, color: Z.muted }}>{count} คน × ฿30</div>
          </div>
          <div style={{ ...NUM, fontSize: 28, fontWeight: 700, color: Z.forest, letterSpacing: '-0.03em' }}>{fmtTHB(total)}</div>
        </div>
      </div>

      <div style={{ marginTop: 14, padding: '12px 14px', fontSize: 12, color: Z.muted, lineHeight: 1.55 }}>
        Fitrah ต้องจ่ายก่อนละหมาดอีดิลฟิตริ — Kaff ส่งต่อให้ผู้ขัดสนภายใน 24 ชั่วโมง
      </div>
    </div>
  );
}

function FidyahPanel({ days, setDays }: { days: number; setDays: (n: number) => void }) {
  const total = days * 15;
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: Z.forest, lineHeight: 1.3 }}>
        ขาดบวชกี่วัน?<br />ระบบจัดการให้
      </div>
      <div style={{ fontSize: 13, color: Z.muted, marginTop: 6, lineHeight: 1.5 }}>
        สำหรับผู้ที่ไม่สามารถถือศีลอดได้ (สูงอายุ ป่วยเรื้อรัง ตั้งครรภ์) · 1 วัน = ฿15
      </div>

      <div style={{ marginTop: 30, padding: 22, background: 'rgba(255,255,255,0.72)', borderRadius: 22, border: `1px solid rgba(255,255,255,0.9)` }}>
        <div style={{ fontSize: 12, color: Z.muted, fontWeight: 600, textAlign: 'center' }}>จำนวนวันที่ขาดบวช</div>
        <div style={{ marginTop: 14 }}>
          <Stepper value={days} onChange={setDays} min={1} max={30} />
        </div>
        <div style={{
          marginTop: 22, padding: '14px 16px', background: Z.sageSoft,
          borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <div>
            <div style={{ fontSize: 11, color: Z.forest, fontWeight: 600 }}>รวมทั้งหมด</div>
            <div style={{ fontSize: 11, color: Z.muted }}>{days} วัน × ฿15</div>
          </div>
          <div style={{ ...NUM, fontSize: 28, fontWeight: 700, color: Z.forest, letterSpacing: '-0.03em' }}>{fmtTHB(total)}</div>
        </div>
      </div>
    </div>
  );
}

function KaffarahPanel({ type, setType, types: KAFFARAH_TYPES }: {
  type: KaffType; setType: (k: KaffType) => void;
  types: Array<{ id: KaffType; label: string; amount: number; sub: string }>;
}) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: Z.forest, lineHeight: 1.3 }}>
        ถ้ามีสิ่งที่ต้องเคลียร์<br />— เป็นส่วนตัว ไม่ต้องบอกใคร
      </div>

      <div style={{
        marginTop: 14, padding: '12px 14px', background: '#1a1a1a',
        color: '#fff', borderRadius: 14,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Icon name="lock" size={20} color={Z.gold} />
        <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
          <b style={{ color: Z.gold }}>ไม่ระบุชื่อ</b> (ค่าเริ่มต้น)
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>ไม่มีใครเห็น · ไม่ปรากฏในประวัติแชร์</div>
        </div>
      </div>

      <div style={{ marginTop: 18, fontSize: 13, color: Z.muted, fontWeight: 600, marginBottom: 8 }}>เลือกประเภทการชดเชย</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {KAFFARAH_TYPES.map(k => {
          const isSel = type === k.id;
          return (
            <button key={k.id} onClick={() => setType(k.id)} style={{
              textAlign: 'left', padding: 14, borderRadius: 16,
              background: isSel ? Z.forest : '#fff',
              color: isSel ? '#fff' : Z.ink,
              border: `1.5px solid ${isSel ? Z.forest : Z.line}`,
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all .15s',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{k.label}</div>
                <div style={{ fontSize: 12, color: isSel ? 'rgba(255,255,255,0.65)' : Z.muted, marginTop: 2 }}>{k.sub}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: isSel ? Z.gold : Z.forest, fontVariantNumeric: 'tabular-nums' }}>
                {fmtTHB(k.amount)}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{
        marginTop: 16, padding: 14,
        background: 'transparent', borderRadius: 12,
        fontSize: 12, color: Z.muted, lineHeight: 1.55,
        textAlign: 'center', fontStyle: 'italic',
      }}>
        "ทุกคนมีเรื่องที่อยากเคลียร์ — Kaff ช่วยให้คุณทำสิ่งที่ถูกต้องโดยไม่ต้องอธิบายใคร"
      </div>
    </div>
  );
}

export type QurbanAnimal = 'goat' | 'cow';

export function QurbanPrices({ selected, setSelected, animal, setAnimal, cowShares, setCowShares, onBack, onNext }: {
  selected: string | null; setSelected: (s: string) => void;
  animal: QurbanAnimal; setAnimal: (a: QurbanAnimal) => void;
  cowShares: number; setCowShares: (n: number) => void;
  onBack: () => void; onNext: () => void;
}) {
  const { qurbanOptions: QURBAN_OPTIONS } = useData();
  const animals: { id: QurbanAnimal; label: string; sub: string }[] = [
    { id: 'cow', label: 'วัว 1 ส่วน', sub: '1–7 ส่วน' },
    { id: 'goat', label: 'แพะ 1 ตัว', sub: '1 ครอบครัว' },
  ];
  const animalLabel = animal === 'goat' ? 'แพะ 1 ตัว' : 'วัว 1 ส่วน';
  const filteredOptions = QURBAN_OPTIONS.filter(q => q.animal === animalLabel);

  // If toggling animal strands the current country selection, clear it so the
  // user explicitly picks from the new list (and the bottom CTA stays disabled
  // until they do).
  useEffect(() => {
    if (selected && !filteredOptions.some(q => q.country === selected)) {
      setSelected('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animal]);

  const selectedOption = filteredOptions.find(q => q.country === selected);
  const totalAmount = selectedOption
    ? selectedOption.price * (animal === 'cow' ? cowShares : 1)
    : 0;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: G.paperGold }}>
      <ForestHeader
        onBack={onBack}
        title="อยากทำกุรบ่านแต่ราคาสูงไป?"
        sub="ค้นหากุรบ่านในแบบที่พอดีกับคุณ"
        right={<div style={{ padding: '7px 12px', ...glass('light'), color: Z.forest, borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>QURBAN · กุรบ่าน</div>}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 24px' }}>

        <div style={{
          background: 'rgba(255,255,255,0.72)', padding: 4, borderRadius: 14,
          border: `1px solid rgba(255,255,255,0.9)`, display: 'flex', gap: 4,
          marginBottom: 16,
        }}>
          {animals.map(a => (
            <button key={a.id} onClick={() => setAnimal(a.id)}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 10,
                background: animal === a.id ? Z.forest : 'transparent',
                color: animal === a.id ? '#fff' : Z.ink,
                fontWeight: 600,
                transition: 'all .15s',
              }}>
              <div style={{ fontSize: 13.5 }}>{a.label}</div>
              <div style={{ fontSize: 10.5, opacity: 0.65, marginTop: 1 }}>{a.sub}</div>
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: Z.muted, fontWeight: 600, padding: '0 4px 8px' }}>
          เปรียบเทียบราคา {animal === 'goat' ? 'แพะ' : 'วัว · ต่อ 1 ส่วน'}
        </div>
        {filteredOptions.length === 0 ? (
          <div style={{
            padding: '24px 16px', textAlign: 'center',
            background: 'rgba(255,255,255,0.72)', borderRadius: 14, border: `1px dashed rgba(13,59,46,0.22)`,
            color: Z.muted, fontSize: 13.5, lineHeight: 1.5,
          }}>
            ยังไม่มีตัวเลือก {animal === 'goat' ? 'แพะ' : 'วัว'} ในระบบ<br />
            <span style={{ fontSize: 12, color: '#9aa39e' }}>admin กำลังเปิดเพิ่ม — ลองเลือกประเภทอื่นก่อนได้</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredOptions.map((q, i) => {
              const isSel = selected === q.country;
              return (
                <Card key={i}
                  onClick={() => setSelected(q.country)}
                  selected={isSel}
                  padding={14}
                  style={{ position: 'relative' }}
                >
                  {q.popular && (
                    <div style={{
                      position: 'absolute', top: -6, right: 14,
                      padding: '3px 10px', background: Z.gold,
                      color: '#3d2c08', borderRadius: 999,
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    }}>POPULAR</div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontSize: 32 }}>{q.flag}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: Z.ink }}>{q.country}</div>
                      <div style={{ fontSize: 12, color: Z.muted, marginTop: 1 }}>{q.sub}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: Z.muted, fontWeight: 600 }}>
                        {animal === 'cow' ? 'ต่อ 1 ส่วน' : 'ตั้งแต่'}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: Z.forest, letterSpacing: '-0.01em' }}>{q.currency}{q.price.toLocaleString()}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {animal === 'cow' && selectedOption && (
          <div style={{
            marginTop: 16, padding: 18, borderRadius: 18,
            background: `linear-gradient(135deg, ${Z.forest} 0%, ${Z.forestDeep} 100%)`,
            color: '#fff',
          }}>
            <div style={{ fontSize: 11, color: Z.gold, fontWeight: 700, letterSpacing: '0.08em' }}>เลือกจำนวนส่วน</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, lineHeight: 1.45 }}>
              วัว 1 ตัว = 7 ส่วน · เลือก {cowShares} ส่วนได้เลย ระบบจะจับคู่ผู้ร่วมส่วนที่เหลือให้
            </div>
            <div style={{
              marginTop: 14, display: 'flex', alignItems: 'center', gap: 14,
              background: 'rgba(0,0,0,0.25)', padding: '10px 14px', borderRadius: 14,
            }}>
              <button
                onClick={() => setCowShares(Math.max(1, cowShares - 1))}
                disabled={cowShares <= 1}
                style={{
                  width: 40, height: 40, borderRadius: 999,
                  background: cowShares <= 1 ? 'rgba(255,255,255,0.06)' : Z.gold,
                  color: cowShares <= 1 ? 'rgba(255,255,255,0.3)' : '#3d2c08',
                  fontSize: 24, fontWeight: 800, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: cowShares <= 1 ? 'not-allowed' : 'pointer',
                }}
              >−</button>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ ...NUM, fontSize: 32, fontWeight: 700, lineHeight: 1 }}>{cowShares}<span style={{ fontSize: 16, opacity: 0.55 }}>/7</span></div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>
                  {cowShares === 7 ? 'วัวเต็มตัว · ทำคนเดียว' : `ร่วม ${cowShares} ส่วน · ${7 - cowShares} ส่วนที่ระบบจัดสรร`}
                </div>
              </div>
              <button
                onClick={() => setCowShares(Math.min(7, cowShares + 1))}
                disabled={cowShares >= 7}
                style={{
                  width: 40, height: 40, borderRadius: 999,
                  background: cowShares >= 7 ? 'rgba(255,255,255,0.06)' : Z.gold,
                  color: cowShares >= 7 ? 'rgba(255,255,255,0.3)' : '#3d2c08',
                  fontSize: 24, fontWeight: 800, lineHeight: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: cowShares >= 7 ? 'not-allowed' : 'pointer',
                }}
              >+</button>
            </div>
            <div style={{
              marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)' }}>รวม</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: Z.gold, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                {selectedOption.currency}{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        <div style={{
          marginTop: 14, padding: '10px 14px',
          background: 'rgba(255,255,255,0.72)', border: `1px solid rgba(255,255,255,0.9)`,
          borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#1a3d8e', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12,
          }}>U</div>
          <div style={{ flex: 1, fontSize: 12.5, color: Z.muted, lineHeight: 1.4 }}>
            <b style={{ color: Z.ink }}>ร่วมกับ Ummatee</b><br />
            <span>เครือข่ายฮาลาลกุรบ่านทั่วโลก · ตรวจสอบได้</span>
          </div>
        </div>
      </div>

      <StickyBottom tone="gold">
        <GoldButton tone="gold" disabled={!selected} onClick={onNext}>
          ดำเนินการต่อ <Icon name="arrowRight" size={20} />
        </GoldButton>
      </StickyBottom>
    </div>
  );
}

export function QurbanLocation({ location, setLocation, onBack, onNext }: {
  location: string | null; setLocation: (id: string) => void; onBack: () => void; onNext: () => void;
}) {
  const { qurbanLocations: QURBAN_LOCATIONS } = useData();
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: G.paperGold }}>
      <ForestHeader onBack={onBack} title="เลือกพื้นที่แจกจ่าย" sub="เนื้อกุรบ่านจะแจกในวันอีดิลอัฎฮา" compact />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {QURBAN_LOCATIONS.map(loc => {
            const isSel = location === loc.id;
            return (
              <Card key={loc.id} onClick={() => setLocation(loc.id)} selected={isSel} padding={14}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: Z.sageSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, flexShrink: 0,
                  }}>{loc.flag}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: Z.ink }}>{loc.name}</div>
                    <div style={{ fontSize: 12, color: Z.muted, marginTop: 2, lineHeight: 1.4 }}>{loc.impact}</div>
                  </div>
                  <div style={{
                    width: 26, height: 26, borderRadius: 999,
                    border: `2px solid ${isSel ? Z.forest : Z.line}`,
                    background: isSel ? Z.forest : '#fff', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{isSel && <Icon name="check" size={14} strokeWidth={2.5} />}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <StickyBottom tone="gold">
        <GoldButton tone="gold" disabled={!location} onClick={onNext}>
          ยืนยันการจอง <Icon name="arrowRight" size={20} />
        </GoldButton>
      </StickyBottom>
    </div>
  );
}

export function SadaqahCampaigns({ campaign, setCampaign, iftarMeals, setIftarMeals, onBack, onNext }: {
  campaign: string | null; setCampaign: (id: string) => void;
  iftarMeals: number; setIftarMeals: (n: number) => void;
  onBack: () => void; onNext: () => void;
}) {
  const { campaigns: CAMPAIGNS } = useData();
  const featured = CAMPAIGNS.find(c => c.featured);
  const others = CAMPAIGNS.filter(c => !c.featured);
  if (!featured) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: Z.muted }}>
        ยังไม่มีแคมเปญในระบบ
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: G.paperGreen }}>
      <ForestHeader
        onBack={onBack}
        title="บริจาคตามศรัทธา ให้ถูกที่ถูกเวลา"
        sub="แคมเปญที่ทีม Kaff คัดมาแล้ว"
        right={<div style={{ padding: '7px 12px', ...glass('light'), color: Z.forest, borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>SADAQAH</div>}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0 24px' }}>

        <div style={{ padding: '0 16px' }}>
          <Card padding={0} style={{
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.72)',
            border: `2px solid ${campaign === featured.id ? Z.forest : Z.line}`,
          }}>
            <div style={{
              height: 120, position: 'relative', overflow: 'hidden',
              background: `linear-gradient(135deg, ${Z.forest} 0%, #1A5240 100%)`,
            }}>
              <svg width="100%" height="100%" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
                {Array.from({length: 14}).map((_, i) => (
                  <line key={i} x1={-20 + i*30} y1="140" x2={140 + i*30} y2="-20" stroke="rgba(201,169,74,0.10)" strokeWidth="1" />
                ))}
                <circle cx="260" cy="40" r="32" fill="none" stroke="#C9A94A" strokeWidth="1.5" />
                <circle cx="268" cy="34" r="32" fill={Z.forest} />
              </svg>
              <div style={{
                position: 'absolute', left: 16, bottom: 14,
                fontSize: 11, color: Z.gold, fontWeight: 700, letterSpacing: '0.12em',
              }}>FEATURED · เด่นเดือนนี้</div>
              <div style={{
                position: 'absolute', left: 16, bottom: 32,
                fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1.2,
              }}>เลี้ยงอาหาร<br />ละศีลอด</div>
            </div>

            <div style={{ padding: 16 }}>
              <div style={{ fontSize: 13, color: Z.muted }}>{featured.sub}</div>
              <div style={{ marginTop: 10 }}>
                <ProgressBar value={(featured.raised / featured.target) * 100} color={Z.gold} />
                <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: Z.ink, fontWeight: 700 }}>{featured.raised.toLocaleString()} / {featured.target.toLocaleString()} {featured.unit}</span>
                  <span style={{ color: Z.gold, fontWeight: 700 }}>{Math.round((featured.raised / featured.target) * 100)}%</span>
                </div>
              </div>

              <div style={{ marginTop: 14, padding: '12px 14px', background: Z.surface, borderRadius: 14 }}>
                <div style={{ fontSize: 12, color: Z.muted, fontWeight: 600, marginBottom: 8 }}>จำนวนคนที่อยากเลี้ยง</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Stepper value={iftarMeals} onChange={setIftarMeals} min={1} max={500} />
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: Z.muted }}>{iftarMeals} × ฿60</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: Z.forest, letterSpacing: '-0.01em' }}>{fmtTHB(iftarMeals * 60)}</div>
                  </div>
                </div>
              </div>

              <button onClick={() => setCampaign(featured.id)} style={{
                marginTop: 12, width: '100%', padding: '12px',
                background: campaign === featured.id ? Z.forest : '#fff',
                color: campaign === featured.id ? Z.gold : Z.forest,
                border: `1.5px solid ${Z.forest}`,
                borderRadius: 12, fontWeight: 700, fontSize: 14,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                {campaign === featured.id ? <><Icon name="check" size={16} strokeWidth={2.5} /> เลือกแล้ว</> : 'เลือกแคมเปญนี้'}
              </button>
            </div>
          </Card>
        </div>

        <div style={{ padding: '20px 16px 6px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: Z.forest }}>แคมเปญอื่น ๆ</div>
          <div style={{ fontSize: 12, color: Z.muted }}>{others.length} แคมเปญ</div>
        </div>
        <div style={{
          display: 'flex', gap: 12, padding: '6px 16px 8px', overflowX: 'auto',
          scrollbarWidth: 'none',
        } as React.CSSProperties}>
          {others.map(c => {
            const isSel = campaign === c.id;
            const pct = (c.raised / c.target) * 100;
            return (
              <button key={c.id} onClick={() => setCampaign(c.id)} style={{
                flex: '0 0 220px', textAlign: 'left',
                background: 'rgba(255,255,255,0.72)', borderRadius: 18, padding: 0,
                border: `2px solid ${isSel ? Z.forest : Z.line}`,
                overflow: 'hidden',
                transition: 'border-color .15s',
              }}>
                <div style={{
                  height: 96, position: 'relative', overflow: 'hidden',
                  background: c.color,
                }}>
                  <svg width="100%" height="100%" viewBox="0 0 220 96" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0 }}>
                    {Array.from({length: 8}).map((_, i) => (
                      <line key={i} x1={-20 + i*32} y1="110" x2={110 + i*32} y2="-20" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                    ))}
                  </svg>
                  <div style={{
                    position: 'absolute', top: 10, left: 12,
                    padding: '3px 8px', background: 'rgba(255,255,255,0.16)', borderRadius: 999,
                    fontSize: 10, color: '#fff', fontWeight: 700, letterSpacing: '0.06em',
                  }}>{c.tag}</div>
                  <div style={{ position: 'absolute', right: 10, bottom: 8, fontSize: 32 }}>{c.emoji}</div>
                </div>
                <div style={{ padding: 12 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: Z.ink, lineHeight: 1.3 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: Z.muted, marginTop: 2 }}>{c.sub}</div>
                  <div style={{ marginTop: 10 }}>
                    <ProgressBar value={pct} height={6} />
                    <div style={{ marginTop: 6, fontSize: 11, color: Z.muted, display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: Z.ink, fontWeight: 700 }}>{fmtTHB(c.raised)}</span>
                      <span style={{ color: Z.sage, fontWeight: 700 }}>{Math.round(pct)}%</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <StickyBottom>
        <GoldButton disabled={!campaign} onClick={onNext}>
          ถัดไป <Icon name="arrowRight" size={20} />
        </GoldButton>
      </StickyBottom>
    </div>
  );
}
