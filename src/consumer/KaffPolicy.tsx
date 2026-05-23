import type { ReactNode } from 'react';
import { Z, Icon } from './KaffUI';

export type PolicyKind = 'privacy' | 'terms';

// Sheet that slides up from the bottom and covers most of the viewport.
// Used to surface the privacy policy / ToS without leaving the checkout flow.
//
// The text below is a baseline — adequate for a closed beta but MUST be
// reviewed by a Thai PDPA / charity lawyer before scaling beyond friends &
// family. Numbers and entity names are best-effort and may need correction.
export function PolicySheet({ kind, onClose }: { kind: PolicyKind | null; onClose: () => void }) {
  if (!kind) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <button onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(13,26,20,0.55)',
        backdropFilter: 'blur(2px)',
      }} aria-label="ปิด" />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 480,
        background: '#fff', borderRadius: '20px 20px 0 0',
        maxHeight: '90dvh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.18)',
        animation: 'policySlideUp .25s cubic-bezier(.2,.8,.2,1)',
      }}>
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: `1px solid ${Z.line}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: Z.ink }}>
            {kind === 'privacy' ? 'นโยบายความเป็นส่วนตัว' : 'ข้อกำหนดการใช้งาน'}
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 8,
            background: Z.surface, color: Z.muted,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><Icon name="arrowLeft" size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px 32px' }}>
          {kind === 'privacy' ? <PrivacyContent /> : <TermsContent />}
        </div>
      </div>
      <style>{`
        @keyframes policySlideUp {
          from { transform: translateY(20px); opacity: 0 }
          to   { transform: translateY(0); opacity: 1 }
        }
      `}</style>
    </div>
  );
}

function H({ children }: { children: ReactNode }) {
  return <div style={{
    fontSize: 14, fontWeight: 800, color: Z.forest,
    marginTop: 18, marginBottom: 6, letterSpacing: '-0.005em',
  }}>{children}</div>;
}
function P({ children }: { children: ReactNode }) {
  return <div style={{
    fontSize: 13.5, color: Z.ink, lineHeight: 1.6, marginBottom: 8,
  }}>{children}</div>;
}
function L({ children }: { children: ReactNode }) {
  return <ul style={{ margin: '6px 0 10px 18px', padding: 0, fontSize: 13.5, color: Z.ink, lineHeight: 1.6 }}>{children}</ul>;
}

function PrivacyContent() {
  return (
    <>
      <div style={{ fontSize: 11, color: Z.muted, fontStyle: 'italic', marginBottom: 8 }}>
        ฉบับ beta · ปรับปรุงล่าสุด 19 พ.ค. 2569
      </div>
      <P>
        Kaff ("เรา") ดำเนินการตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
        เอกสารฉบับนี้อธิบายว่าเราเก็บอะไร เพื่ออะไร และคุณมีสิทธิ์อะไรบ้าง
      </P>

      <H>1. ข้อมูลที่เก็บ</H>
      <L>
        <li>ชื่อ-นามสกุล</li>
        <li>อีเมล · เบอร์โทรศัพท์ · LINE ID (ถ้าให้)</li>
        <li>ประวัติการบริจาค (จำนวน · ประเภท · ปลายทาง · niyyah · เวลา)</li>
        <li>หมายเลข IP และข้อมูลเบราว์เซอร์ (จาก log อัตโนมัติ)</li>
        <li>ข้อมูล authentication จาก Clerk (ถ้าสมัครสมาชิก)</li>
      </L>

      <H>2. วัตถุประสงค์</H>
      <L>
        <li>ดำเนินการบริจาคและส่งต่อให้ปลายทาง</li>
        <li>ออกใบเสร็จและ ใบเสร็จลดหย่อนภาษี (เมื่อเปิดบริการ)</li>
        <li>ติดต่อกลับเกี่ยวกับการบริจาค</li>
        <li>ประสานงานกับ partner เช่น Ummatee สำหรับ Qurban</li>
        <li>ตรวจสอบและป้องกันการฉ้อโกง / การฟอกเงิน (AMLA / ปปง.)</li>
      </L>

      <H>3. การแชร์ข้อมูล</H>
      <P>เราอาจแชร์ข้อมูลของคุณกับ:</P>
      <L>
        <li><b>Partner ปลายทาง</b> เช่น Ummatee สำหรับ Qurban — เฉพาะข้อมูลที่จำเป็น (ชื่อ + niyyah + จำนวน)</li>
        <li><b>หน่วยงานราชการ</b> เมื่อมีคำขอตามกฎหมาย — ปปง. · กรมสรรพากร · ตำรวจ</li>
        <li><b>Vendor</b>: Clerk (auth) · Neon (DB) · Vercel (hosting) — ภายใต้สัญญารักษาข้อมูล</li>
      </L>
      <P>เราไม่ขายข้อมูลให้บุคคลที่สาม</P>

      <H>4. ระยะเวลาเก็บข้อมูล</H>
      <P>
        เก็บข้อมูลการบริจาคไว้อย่างน้อย 5 ปี ตามที่ AMLA กำหนด
        ข้อมูล user profile เก็บตลอดที่บัญชี active
      </P>

      <H>5. สิทธิของคุณ</H>
      <L>
        <li>ขอดูข้อมูลที่เราเก็บเกี่ยวกับคุณ</li>
        <li>แก้ไขข้อมูลที่ไม่ถูกต้อง</li>
        <li>ขอลบข้อมูล (อยู่ภายใต้ข้อจำกัด 5 ปีของ AMLA)</li>
        <li>ขอถอนความยินยอม (อาจไม่สามารถใช้บริการต่อได้)</li>
        <li>ร้องเรียนต่อสำนักงานคุ้มครองข้อมูลส่วนบุคคล</li>
      </L>

      <H>6. ติดต่อ</H>
      <P>
        สำหรับคำขอเกี่ยวกับข้อมูลส่วนบุคคล ติดต่อทาง email: <b>privacy@kaff.me</b><br />
        เราจะตอบกลับภายใน 30 วัน
      </P>

      <H>7. การเปลี่ยนแปลง</H>
      <P>
        เราอาจปรับปรุงนโยบายนี้เป็นครั้งคราว — การใช้งานต่อหลังประกาศ
        ถือว่ายอมรับเวอร์ชั่นใหม่
      </P>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <div style={{ fontSize: 11, color: Z.muted, fontStyle: 'italic', marginBottom: 8 }}>
        ฉบับ beta · ปรับปรุงล่าสุด 19 พ.ค. 2569
      </div>
      <P>
        ข้อกำหนดการใช้งาน Kaff ("บริการ") โดยการใช้บริการคุณยอมรับเงื่อนไขเหล่านี้
      </P>

      <H>1. บริการของ Kaff</H>
      <P>
        Kaff เป็น platform ที่ช่วยให้มุสลิมในไทยจัดการการบริจาคทางการเงินตามหลักศาสนา —
        Riba clearance, Zakat, Fitrah, Fidyah, Kaffarah, Qurban, Sadaqah
        เราทำหน้าที่เป็นตัวกลางส่งต่อ — ไม่ใช่ผู้รับบริจาคโดยตรง
      </P>

      <H>2. ความรับผิดชอบของผู้บริจาค</H>
      <L>
        <li>ให้ข้อมูลที่เป็นจริงและถูกต้อง</li>
        <li>เงินที่ใช้บริจาคต้องมาจากแหล่งที่ถูกต้องตามกฎหมาย</li>
        <li>ไม่ใช้บริการเพื่อการฟอกเงิน หรือสนับสนุนการก่อการร้าย</li>
        <li>การกรอกข้อมูลเท็จเพื่อใบเสร็จลดหย่อนภาษีอาจเข้าข่ายผิดกฎหมาย</li>
      </L>

      <H>3. ค่าธรรมเนียมและการสนับสนุน Kaff</H>
      <L>
        <li><b>100% ของยอดบริจาคถึงผู้รับ/พันธมิตรปลายทาง</b> ทุกประเภทบริจาค (Riba, Zakat, Fitrah, Fidyah, Kaffarah, Qurban, Sadaqah) — Kaff ไม่หักอะไร</li>
        <li>Kaff ดำรงอยู่ด้วยการสนับสนุนโดยสมัครใจจากผู้ใช้ — หลังบริจาคจบ ท่านสามารถส่งเงินสนับสนุน Kaff ได้ตามต้องการ ไม่บังคับ</li>
        <li>เงินสนับสนุน Kaff เข้าบัญชี Kaff Foundation แยกจากบัญชี NGO ปลายทาง</li>
      </L>

      <H>4. การคืนเงิน</H>
      <P>
        การบริจาคถือเป็นการให้ที่จบสิ้น — ไม่มี refund ในกรณีปกติ
        ยกเว้น: partner ปลายทางไม่สามารถดำเนินการตาม niyyah ได้ (เช่น Qurban ไม่ถูกประกอบพิธี)
        เราจะคืนเงินเต็มจำนวนภายใน 30 วัน
      </P>

      <H>5. การปฏิเสธบริการ</H>
      <P>
        Kaff สงวนสิทธิ์ปฏิเสธหรือระงับการบริจาคที่ต้องสงสัย — รวมถึงขอเอกสารยืนยันตัวตน
        เพิ่มเติม การปฏิเสธไม่ก่อให้เกิดสิทธิเรียกร้องค่าเสียหายต่อ Kaff
      </P>

      <H>6. ข้อจำกัดความรับผิด</H>
      <P>
        Kaff ทำหน้าที่ตัวกลางและไม่รับผิดในความล้มเหลวของ partner ที่อยู่นอกการควบคุม
        ของเรา — สูงสุดที่ Kaff รับผิดชอบคือคืนเงินบริจาคเต็มจำนวน
      </P>

      <H>7. การเปลี่ยนแปลง</H>
      <P>
        เราอาจปรับเงื่อนไขเป็นครั้งคราว — การใช้งานต่อถือว่ายอมรับเวอร์ชั่นใหม่
      </P>

      <H>8. กฎหมายที่ใช้บังคับ</H>
      <P>
        บริการนี้อยู่ภายใต้กฎหมายไทย การระงับข้อพิพาทขึ้นอยู่กับศาลไทย
      </P>

      <H>9. ติดต่อ</H>
      <P>
        คำถามเกี่ยวกับข้อกำหนด: <b>hello@kaff.me</b>
      </P>
    </>
  );
}
