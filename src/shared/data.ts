import type {
  Org, AsnafGroup, AsnafRecipients, Campaign,
  QurbanOption, QurbanLocation, KaffarahType,
} from './types';

export const ORG_LIST: Org[] = [
  {
    id: 'siriraj',
    icon: 'hospital',
    name: 'มูลนิธิโรงพยาบาลรามาธิบดี',
    goal: 'เครื่องช่วยหายใจสำหรับผู้ป่วย ICU',
    raised: 184500, target: 200000,
    pitch: 'จัดซื้อเครื่องช่วยหายใจ 4 เครื่องสำหรับ ICU เด็กแรกเกิด — ใกล้บรรลุเป้าหมายแล้ว เหลืออีก ฿15,500',
    hot: true,
  },
  {
    id: 'road',
    icon: 'road',
    name: 'กลุ่มอาสาฯ ปัตตานี',
    goal: 'ซ่อมถนนเข้าหมู่บ้านสุไหงปาดี',
    raised: 67200, target: 90000,
    pitch: 'ถนนยาว 1.2 กม. เข้าหมู่บ้านที่มี 240 ครอบครัว — เทคอนกรีตเส้นใหม่ ลดอุบัติเหตุ',
  },
  {
    id: 'toilet',
    icon: 'toilet',
    name: 'โครงการน้ำสะอาด นราธิวาส',
    goal: 'ห้องน้ำสาธารณะ ตลาดสดบาเจาะ',
    raised: 23000, target: 60000,
    pitch: 'ตลาดมีผู้ใช้บริการกว่า 500 คน/วัน แต่ไม่มีห้องน้ำสะอาด — สร้าง 4 ห้อง พร้อมระบบบำบัด',
  },
  {
    id: 'fund',
    icon: 'community',
    name: 'กองทุนชุมชนบ้านโต๊ะหยง',
    goal: 'ทุนหมุนเวียนกลุ่มแม่บ้าน',
    raised: 14800, target: 50000,
    pitch: 'กลุ่มแม่บ้าน 18 คน ทำผ้าบาติก ต้องการเงินทุนซื้อวัตถุดิบและเครื่องเย็บผ้าใหม่',
  },
];

export const ASNAF: AsnafGroup[] = [
  { id: 'poor',      label: 'คนยากจน',          sub: 'ไม่มีรายได้ · ฟุกอรออ์' },
  { id: 'masakin',   label: 'คนขัดสน',          sub: 'รายได้ไม่พอกิน · มะซากีน' },
  { id: 'needy',     label: 'ผู้มีหนี้สิน',        sub: 'แก้หนี้สินจำเป็น · ฆอริมีน' },
  { id: 'muallaf',   label: 'มุสลิมใหม่',        sub: 'มุอัลลัฟ' },
  { id: 'fisabil',   label: 'ส่งเสริมศาสนา',     sub: 'ทุนเรียนศาสนา · ฟีซาบีลิลลาฮ์' },
  { id: 'traveller', label: 'คนพลัดถิ่น',        sub: 'อิบนุสสะบีล' },
  { id: 'slave',     label: 'เหยื่อค้ามนุษย์',    sub: 'ผู้ไร้อิสรภาพ · ริก็อบ' },
  { id: 'amil',      label: 'ทีมงานซะกาต',      sub: 'อามิลีน' },
];

export const ASNAF_RECIPIENTS: AsnafRecipients = {
  poor: [
    { name: 'ครอบครัวอาดัม (4 คน)', received: 800, fair: 'แนะนำให้กระจาย', area: 'ยะลา' },
    { name: 'แม่อามีนะห์ (เลี้ยงเดี่ยว)', received: 1200, area: 'ปัตตานี' },
    { name: 'ลุงยูซุฟ ผู้สูงอายุ', received: 600, fair: 'แนะนำให้กระจาย', area: 'นราธิวาส' },
    { name: 'ครอบครัวฮัสซัน (6 คน)', received: 2400, area: 'สงขลา' },
  ],
  needy: [
    { name: 'ครอบครัวอิบรอฮีม — หนี้รักษาพยาบาล', received: 1500, area: 'กรุงเทพฯ' },
    { name: 'นางสาวมารียัม — หนี้การศึกษา', received: 900, fair: 'แนะนำให้กระจาย', area: 'เชียงใหม่' },
  ],
  muallaf: [
    { name: 'กลุ่มมุอัลลัฟใหม่ บางกอกน้อย', received: 1100, area: 'กรุงเทพฯ' },
    { name: 'พี่อาลี — เพิ่งเข้ารับอิสลาม', received: 400, fair: 'แนะนำให้กระจาย', area: 'ภูเก็ต' },
  ],
};

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'iftar', tag: 'IFTAR', emoji: '🌙',
    title: 'เลี้ยงอาหารละศีลอด',
    sub: 'ร่วมกับร้านอาหารฮาลาลในไทย',
    raised: 412, target: 1000, unit: 'มื้อ', perUnit: 60,
    color: '#0D3B2E',
    pitch: 'จับมือร้านอาหารฮาลาล 12 ร้านในกรุงเทพฯ จัดละศีลอดให้คนงานต่างชาติและผู้ขัดสนทุกเย็นในเดือนรอมฎอน',
    featured: true,
  },
  {
    id: 'edu', tag: 'EDUCATION', emoji: '📚',
    title: 'ทุนการศึกษา เด็กชายแดนใต้',
    sub: '120 คน · ปีการศึกษา 2568',
    raised: 86400, target: 150000, unit: 'บาท',
    color: '#3B5E48',
    pitch: 'ค่าเทอม ค่าหนังสือ ค่าเดินทาง สำหรับนักเรียนชั้นมัธยมในยะลา ปัตตานี นราธิวาส',
  },
  {
    id: 'water', tag: 'WATER', emoji: '💧',
    title: 'น้ำสะอาด หมู่บ้านโรฮิงญา',
    sub: 'บ่อน้ำบาดาล 8 บ่อ',
    raised: 28000, target: 80000, unit: 'บาท',
    color: '#0D3B2E',
    pitch: 'ขุดเจาะน้ำบาดาล 8 บ่อ ในค่ายผู้ลี้ภัยค๊อกซ์บาซาร์ ครอบคลุม 4,200 ครอบครัว',
  },
  {
    id: 'mosque', tag: 'COMMUNITY', emoji: '⚡',
    title: 'ค่าไฟมัสยิดบ้านท่าด่าน',
    sub: 'ค้างชำระ 3 เดือน',
    raised: 6200, target: 14000, unit: 'บาท',
    color: '#3B5E48',
    pitch: 'มัสยิดเก่าแก่ชุมชนเล็ก ๆ ในจังหวัดสตูล — ค่าไฟค้างชำระจากการเปิดหอกระจายเสียงและไฟสนาม',
  },
];

export const QURBAN_OPTIONS: QurbanOption[] = [
  { country: 'ไทย', flag: '🇹🇭', price: 3000, currency: '฿', sub: 'ท้องถิ่นในไทย', animal: 'แพะ 1 ตัว' },
  { country: 'บังกลาเทศ', flag: '🇧🇩', price: 1400, currency: '฿', sub: 'ราคาประหยัด', animal: 'แพะ 1 ตัว', popular: true },
  { country: 'มาเลเซีย', flag: '🇲🇾', price: 2100, currency: '฿', sub: '~RM 289', animal: 'แพะ 1 ตัว' },
  { country: 'กาซา', flag: '🇵🇸', price: 1800, currency: '฿', sub: 'ราคาพิเศษ · พื้นที่สงคราม', animal: 'แพะ 1 ตัว', special: true },
];

export const QURBAN_LOCATIONS: QurbanLocation[] = [
  { id: 'thailand', flag: '🇹🇭', name: 'ท้องถิ่นในไทย', impact: 'แจกใน 5 จังหวัดชายแดนใต้ · 1 ตัว ≈ 30 ครอบครัว' },
  { id: 'bangladesh', flag: '🇧🇩', name: 'บังกลาเทศ', impact: 'ราคาประหยัด · เนื้อแจกใน 4 เขตห่างไกล' },
  { id: 'africa', flag: '🌍', name: 'แอฟริกาตะวันออก', impact: 'โซมาเลีย/ซูดาน · เนื้อสด แจกในวันอีด' },
  { id: 'gaza', flag: '🇵🇸', name: 'กาซา / เลบานอน', impact: 'พื้นที่สงคราม · 1 ตัว ≈ 45 ครอบครัว' },
  { id: 'rohingya', flag: '🏕️', name: 'ค่ายผู้ลี้ภัยโรฮิงญา', impact: 'ค๊อกซ์บาซาร์ บังกลาเทศ · 1.2 ล้านชีวิต' },
];

export const COMPULSORY_TYPES = ['fitrah', 'fidyah', 'kaffarah'] as const;

export const KAFFARAH_TYPES: KaffarahType[] = [
  { id: 'oath', label: 'ผิดคำสาบาน', amount: 600, sub: '(يَمِين) เลี้ยงอาหารผู้ขัดสน 10 คน' },
  { id: 'fast', label: 'ขาดศีลอด (โดยเจตนา)', amount: 1800, sub: 'เลี้ยงอาหาร 60 คน · ฿30/คน' },
  { id: 'dhihar', label: 'ซิฮารฺ', amount: 1800, sub: 'เลี้ยงอาหารผู้ขัดสน 60 คน' },
  { id: 'general', label: 'ทั่วไป / ไม่ระบุ', amount: 600, sub: 'ปรับตามที่ท่านพิจารณา' },
];
