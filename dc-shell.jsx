// dc-shell.jsx — tokens, seed data, DTS/coverage validators, atoms, chrome, group list.
// Deposit & Cancellation Policy System (Group → Parent → Child).
const { useState: useSD, useRef: useRD, useEffect: useED } = React;

const T = {
  ink:'#0F172A', inkSoft:'#475569', inkFaint:'#5B6B82', inkLabel:'#5B6B82',
  bg:'#F1F5F9', panel:'#FFFFFF', fill:'#F8FAFC',
  line:'#E2E8F0', lineSoft:'#EEF2F6',
  primary:'#1B2434', primaryBg:'#EFF6FF', primaryLine:'#DBEAFE',
  teal:'#047857', tealDark:'#047857', tealLight:'#ECFDF5',
  amber:'#92400E', amberDark:'#92400E', amberLight:'#FFFBEB', amberBorder:'#FCD34D',
  red:'#DC2626', redLight:'#FEF2F2', green:'#047857', greenLight:'#F0FDF4',
};
const MONO = "'SF Mono', Menlo, monospace";

const STATUS_S = {
  Active:   { bg:'#ECFDF5', color:'#065F46', dot:'#10B981' },
  Inactive: { bg:'#F8FAFC', color:'#475569', dot:'#94A3B8' },
  Cancelled:{ bg:'#FEF2F2', color:'#991B1B', dot:'#DC2626' },
  Aborted:  { bg:'#FFFBEB', color:'#92400E', dot:'#F59E0B' },
  Confirmed:{ bg:'#ECFDF5', color:'#065F46', dot:'#10B981' },
};

const CATS = ['Interior','Ocean View','Balcony','Suites'];
const DEPOSIT_TYPE_LABELS = {
  FC:'Fixed per Cabin',
  FP:'Fixed per Person',
  PCT:'Percentage',
};
const depositTypeLabel = value => DEPOSIT_TYPE_LABELS[value] || value;
const DEP_TYPES = Object.entries(DEPOSIT_TYPE_LABELS);
const DEP_HELP = [
  ['Fixed per Cabin','Charge one flat amount per cabin, regardless of occupancy.'],
  ['Fixed per Person','Charge the same flat amount for each person.'],
  ['Percentage','Charge a percentage of the total booking amount due at that milestone.'],
];
const PEN_TYPES = [['NONE','NONE'],['FIXED','FIXED'],['PCT_CABIN_FARE','PCT_CABIN_FARE'],['FULL_DEPOSIT','FULL_DEPOSIT']];
const PEN_HELP = [
  ['NONE','No cancellation charge; full refund of amounts paid.'],
  ['FIXED','A fixed currency amount charged regardless of fare.'],
  ['PCT_CABIN_FARE','A percentage of the gross/net cabin fare charged as penalty.'],
  ['FULL_DEPOSIT','The full deposit paid is forfeited, even after subsequent modifications; no additional charge. Where PCT_CABIN_FARE and FULL_DEPOSIT both apply in the same DTS window, the system charges whichever is greater.'],
];

/* ─────────── Seed data (Part 6) ─────────── */
const DEP_GROUPS_INIT = [
  { id:'dg1', name:'IS 5-Night Retail Std', isActive:true, isDefault:true, mod:'14 Jun 2026', editor:'jane.doe@mvas.com',
    parents:[
      { id:'dp1', code:'DEP-506', name:'5 Night Standard Deposit', isActive:true, isDefault:true, usedIn:9, mod:'14 Jun 2026', editor:'jane.doe@mvas.com',
        lines:[
          { id:'506.1', marketingName:'Rate Hold Deposit',   beginDts:'', endDts:90, depositType:'PCT', amount:10,  cats:['All'], cancelApplies:false },
          { id:'506.2', marketingName:'Full Deposit',        beginDts:89, endDts:0,  depositType:'FC',  amount:150, cats:['Interior','Ocean View','Balcony'], cancelApplies:true },
          { id:'506.3', marketingName:'Full Deposit — Suites', beginDts:89, endDts:0, depositType:'FC', amount:300, cats:['Suites'], cancelApplies:true },
        ],
        usedInFaretypes:[{ code:'FT-00101', name:'Core Retail', status:'Active', mod:'15 Jun 2026' }],
        usedInFarecodes:[{ code:'FC-20101', ship:'Island Escape · 12 Jul 2026', status:'Active', mod:'16 Jun 2026' },{ code:'FC-20114', ship:'Coral Voyager · 03 Aug 2026', status:'Active', mod:'11 Jun 2026' }] },
      { id:'dp2', code:'DEP-507', name:'5 Night Promo Deposit', isActive:true, isDefault:false, usedIn:0, mod:'11 Jun 2026', editor:'jane.doe@mvas.com',
        lines:[
          { id:'507.1', marketingName:'Promo Hold',   beginDts:'', endDts:60, depositType:'FP', amount:75, cats:['All'], cancelApplies:false },
          { id:'507.2', marketingName:'Full Deposit', beginDts:59, endDts:0,  depositType:'PCT', amount:25, cats:['All'], cancelApplies:true },
        ], usedInFaretypes:[], usedInFarecodes:[] },
    ]},
  { id:'dg2', name:'Caribbean 7-Night Trade', isActive:true, isDefault:false, mod:'09 Jun 2026', editor:'admin@mvas.com',
    parents:[
      { id:'dp3', code:'DEP-712', name:'7 Night Trade Deposit', isActive:true, isDefault:true, usedIn:4, mod:'09 Jun 2026', editor:'admin@mvas.com',
        lines:[
          { id:'712.1', marketingName:'Rate Hold Deposit', beginDts:'', endDts:120, depositType:'PCT', amount:10, cats:['All'], cancelApplies:false },
          { id:'712.2', marketingName:'Full Deposit',      beginDts:119, endDts:0,  depositType:'FC', amount:250, cats:['All'], cancelApplies:true },
        ], usedInFaretypes:[{ code:'FT-00204', name:'Trade Partner', status:'Active', mod:'09 Jun 2026' }], usedInFarecodes:[] },
      { id:'dp5', code:'DEP-713', name:'3 Night Sampler Deposit', isActive:true, isDefault:false, usedIn:1, mod:'07 Jun 2026', editor:'admin@mvas.com',
        lines:[{ id:'713.1', marketingName:'Full Deposit', beginDts:'', endDts:0, depositType:'FC', amount:100, cats:['All'], cancelApplies:true }],
        usedInFaretypes:[], usedInFarecodes:[{ code:'FC-20990', ship:'Reef Dancer · 15 Nov 2026', status:'Active', mod:'07 Jun 2026' }] },
    ]},
  { id:'dg3', name:'Legacy Group Bookings', isActive:false, isDefault:false, mod:'02 Jun 2026', editor:'admin@mvas.com',
    parents:[
      { id:'dp4', code:'DEP-880', name:'Group Hold Deposit', isActive:false, isDefault:true, usedIn:0, mod:'02 Jun 2026', editor:'admin@mvas.com',
        lines:[{ id:'880.1', marketingName:'Group Hold', beginDts:'', endDts:0, depositType:'FC', amount:500, cats:['All'], cancelApplies:true }],
        usedInFaretypes:[], usedInFarecodes:[] },
    ]},
];

const CAN_GROUPS_INIT = [
  { id:'cg1', name:'Standard', isActive:true, isRefundable:true, isDefault:true, mod:'14 Jun 2026', editor:'jane.doe@mvas.com',
    parents:[
      { id:'cp1', code:'CAN-101', name:'Standard Cancellation', isActive:true, isDefault:true, isRefundable:true, usedIn:12, mod:'14 Jun 2026', editor:'jane.doe@mvas.com',
        bands:[
          { id:'101.1', beginDts:'', endDts:30, penaltyType:'NONE', penaltyValue:'', cats:['All'] },
          { id:'101.2', beginDts:29, endDts:15, penaltyType:'PCT_CABIN_FARE', penaltyValue:25, cats:['All'] },
          { id:'101.3', beginDts:14, endDts:0,  penaltyType:'FULL_DEPOSIT', penaltyValue:'', cats:['All'] },
        ],
        usedInFaretypes:[{ code:'FT-00101', name:'Core Retail', status:'Active', mod:'15 Jun 2026' }],
        usedInFarecodes:[{ code:'FC-20101', ship:'Island Escape · 12 Jul 2026', status:'Active', mod:'16 Jun 2026' }] },
      { id:'cp2', code:'CAN-104', name:'Standard — Suites Enhanced', isActive:true, isDefault:false, isRefundable:true, usedIn:2, mod:'12 Jun 2026', editor:'jane.doe@mvas.com',
        bands:[
          { id:'104.1', beginDts:'', endDts:45, penaltyType:'NONE', penaltyValue:'', cats:['All'] },
          { id:'104.2', beginDts:44, endDts:0,  penaltyType:'PCT_CABIN_FARE', penaltyValue:40, cats:['All'] },
        ],
        usedInFaretypes:[{ code:'FT-00103', name:'International Agency', status:'Draft', mod:'10 Jun 2026' }],
        usedInFarecodes:[{ code:'FC-20106', ship:'Island Escape · 05 Dec 2026', status:'Active', mod:'11 Jun 2026' }] },
    ]},
  { id:'cg2', name:'Non-Refundable', isActive:true, isRefundable:false, isDefault:false, mod:'10 Jun 2026', editor:'admin@mvas.com',
    parents:[
      { id:'cp3', code:'CAN-900', name:'Non-Refundable', isActive:true, isDefault:true, isRefundable:false, usedIn:5, mod:'10 Jun 2026', editor:'admin@mvas.com',
        bands:[{ id:'900.1', beginDts:'', endDts:0, penaltyType:'FULL_DEPOSIT', penaltyValue:'', cats:['All'] }],
        usedInFaretypes:[], usedInFarecodes:[{ code:'FC-20140', ship:'Coral Voyager · 21 Sep 2026', status:'Active', mod:'10 Jun 2026' }] },
    ]},
  { id:'cg3', name:'Trade Partner', isActive:false, isRefundable:true, isDefault:false, mod:'04 Jun 2026', editor:'admin@mvas.com',
    parents:[
      { id:'cp4', code:'CAN-310', name:'Trade Flexible', isActive:false, isDefault:true, isRefundable:true, usedIn:0, mod:'04 Jun 2026', editor:'admin@mvas.com',
        bands:[
          { id:'310.1', beginDts:'', endDts:60, penaltyType:'NONE', penaltyValue:'', cats:['All'] },
          { id:'310.2', beginDts:59, endDts:0,  penaltyType:'FIXED', penaltyValue:200, cats:['All'] },
        ], usedInFaretypes:[], usedInFarecodes:[] },
    ]},
];

/* ─────────── Helpers ─────────── */
const num = v => v === '' || v === null || v === undefined ? '' : Number(v);
const isBlank = v => v === '' || v === null || v === undefined;
const catsCover = cats => cats.includes('All') ? CATS.slice() : cats.slice();
const catLabel = cats => cats.includes('All') || CATS.every(c => cats.includes(c)) ? 'All types' : cats.join(', ');
const winLabel = r => isBlank(r.beginDts) ? `${r.endDts === '' ? '—' : r.endDts}+ days` : `${r.endDts}–${r.beginDts} days`;
const money = n => '$' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits:2 });
const depAmountLabel = r => r.depositType === 'PCT' ? `${r.amount}%` : `${money(r.amount)} ${r.depositType === 'FP' ? '/ person' : '/ cabin'}`;
const penAmountLabel = r => r.penaltyType === 'PCT_CABIN_FARE' ? `${r.penaltyValue}% of cabin fare`
  : r.penaltyType === 'FIXED' ? `${money(r.penaltyValue)} fixed`
  : r.penaltyType === 'FULL_DEPOSIT' ? 'Full deposit forfeited' : 'No charge';

// Window semantics: end_dts = nearest day to sailing (0 = sailing date), begin_dts = furthest day
// out covered by the line. Blank begin_dts = open-ended (no upper bound).
function windowGroups(rows) {
  const map = new Map();
  rows.forEach((r, i) => {
    const k = `${r.endDts}|${isBlank(r.beginDts) ? '∞' : r.beginDts}`;
    if (!map.has(k)) map.set(k, { endDts:num(r.endDts), beginDts:isBlank(r.beginDts) ? Infinity : num(r.beginDts), rows:[], idx:[] });
    map.get(k).rows.push(r); map.get(k).idx.push(i);
  });
  return [...map.values()].sort((a,b) => b.endDts - a.endDts);
}

// A DTS window includes whole days, so the next continuous window starts one day
// below the prior End DTS (30 -> 29). Blank means the first/open-ended window.
const continuationBeginDts = endDts => {
  if (isBlank(endDts) || isNaN(num(endDts)) || num(endDts) <= 0) return '';
  return String(num(endDts) - 1);
};

// Returns blocking cell/issues plus non-blocking DTS continuity warnings.
// Warnings are deliberately separate so an intentional override can be activated.
function validateRows(rows, { policyCoverage } = {}) {
  const cell = {}, warnCell = {}, issues = [], warnings = [];
  if (!rows.length) return { cell, warnCell, issues:[{ level:'error', text:'At least one line is required.' }], warnings };
  const policyScopedCoverage = Array.isArray(policyCoverage);
  const isDepositPlan = rows.some(r => r.depositType !== undefined || r.marketingName !== undefined);
  const planLabel = isDepositPlan ? 'deposit plan' : 'cancellation plan';
  const rowLabel = isDepositPlan ? 'Line' : 'Band';
  const warn = (row, field, text, detail) => {
    warnCell[`${row}:${field}`] = text;
    warnings.push({ level:'warning', row, field, text:detail || text });
  };
  rows.forEach((r, i) => {
    if (isBlank(r.endDts) || isNaN(num(r.endDts)) || num(r.endDts) < 0) cell[`${i}:endDts`] = 'Required, ≥ 0';
    if (!isBlank(r.beginDts) && (isNaN(num(r.beginDts)) || num(r.beginDts) <= num(r.endDts))) cell[`${i}:beginDts`] = 'Must exceed End DTS';
    if (!policyScopedCoverage && (!r.cats || r.cats.length === 0)) cell[`${i}:cats`] = 'Pick at least one';
    if (r.marketingName !== undefined && !r.marketingName) cell[`${i}:marketingName`] = 'Required';
    if (r.depositType !== undefined) {
      if (isBlank(r.amount) || isNaN(num(r.amount)) || num(r.amount) < 0) cell[`${i}:amount`] = 'Required';
      else if (r.depositType === 'PCT' && num(r.amount) > 100) cell[`${i}:amount`] = '0–100';
    }
    if (r.penaltyType !== undefined && (r.penaltyType === 'FIXED' || r.penaltyType === 'PCT_CABIN_FARE')) {
      if (isBlank(r.penaltyValue) || isNaN(num(r.penaltyValue)) || num(r.penaltyValue) < 0) cell[`${i}:penaltyValue`] = 'Required';
      else if (r.penaltyType === 'PCT_CABIN_FARE' && num(r.penaltyValue) > 100) cell[`${i}:penaltyValue`] = '0–100';
    }
  });
  const openEnded = rows.filter(r => isBlank(r.beginDts));
  const groups = windowGroups(rows);
  if (openEnded.length === 0) warn(0, 'beginDts', `No ${planLabel} exists for bookings before this day`, `The first ${rowLabel.toLowerCase()} does not begin at infinity. No ${planLabel} exists for bookings before this day.`);

  rows.forEach((r, i) => {
    if (i === 0) return;
    const prev = rows[i - 1];
    if (isBlank(prev.endDts) || isBlank(r.beginDts) || isNaN(num(prev.endDts)) || isNaN(num(r.beginDts))) return;
    const sameWindow = String(prev.beginDts) === String(r.beginDts) && String(prev.endDts) === String(r.endDts);
    if (sameWindow) return; // Multiple category-specific rows may intentionally share a window.
    const expected = continuationBeginDts(prev.endDts);
    if (expected !== '' && String(r.beginDts) !== expected) {
      const relation = num(r.beginDts) > num(expected) ? 'overlap' : 'gap';
      warn(i, 'beginDts', `Prior line ends at ${prev.endDts}`, `${rowLabel} ${i + 1}: Prior line ends at ${prev.endDts}. Continuous coverage begins at ${expected}; the current override creates a ${relation}.`);
    }
  });

  if (!policyScopedCoverage) {
    groups.forEach(g => {
      const covered = new Set();
      g.rows.forEach(r => catsCover(r.cats || []).forEach(c => covered.add(c)));
      const missing = CATS.filter(c => !covered.has(c));
      if (missing.length) issues.push({ level:'error', text:`Stateroom coverage gap in ${g.endDts}–${g.beginDts === Infinity ? '∞' : g.beginDts} days: ${missing.join(', ')} not covered.` });
    });
  }
  const last = groups[groups.length - 1];
  if (last && last.endDts !== 0) {
    const lastRow = rows.reduce((best, r, i) => num(r.endDts) < num(rows[best].endDts) ? i : best, 0);
    warn(lastRow, 'endDts', `No ${planLabel} exists for bookings before this day`, `Lowest window ends at ${last.endDts} days. No ${planLabel} exists for bookings before this day.`);
  }
  if (Object.keys(cell).length) issues.unshift({ level:'error', text:'Some fields are incomplete or out of range.' });
  return { cell, warnCell, issues, warnings };
}

function refundabilityIssues(bands, isRefundable) {
  if (isRefundable) return [];
  const bad = bands.filter(b => b.penaltyType !== 'PCT_CABIN_FARE' && b.penaltyType !== 'FULL_DEPOSIT');
  return bad.map(b => ({ level:'error', text:`Non-refundable policy: band ${winLabel(b)} is set to ${b.penaltyType || 'unset'} — must be PCT_CABIN_FARE or FULL_DEPOSIT.` }));
}

const inWindow = (r, dts) => num(r.endDts) <= dts && (isBlank(r.beginDts) || dts <= num(r.beginDts));
const rowForCat = (rows, dts, cat) => (rows || []).find(r => inWindow(r, dts) && (r.cats.includes('All') || r.cats.includes(cat)));

function depositAmountFor(line, { fare, pax }) {
  if (!line) return 0;
  if (line.depositType === 'PCT') return Math.round(fare * num(line.amount) / 100);
  if (line.depositType === 'FP') return num(line.amount) * pax;
  return num(line.amount);
}
function cancelCharge({ band, depLine, cabinFare, portFees, depositPaid }) {
  const base = cabinFare + portFees;
  let pctAmt = 0, fixedAmt = 0;
  if (band) {
    if (band.penaltyType === 'PCT_CABIN_FARE') pctAmt = Math.round(base * num(band.penaltyValue) / 100);
    if (band.penaltyType === 'FIXED') fixedAmt = num(band.penaltyValue);
  }
  const depFloorApplies = !!(depLine && depLine.cancelApplies) && (!band || band.penaltyType !== 'NONE' || true);
  const depFloor = depFloorApplies ? depositPaid : 0;
  const bandAmt = band && band.penaltyType === 'FULL_DEPOSIT' ? depositPaid : Math.max(pctAmt, fixedAmt);
  const total = Math.max(bandAmt, depFloor);
  return { base, pctAmt, fixedAmt, bandAmt, depFloor, depFloorApplies, total, governing: total === depFloor && depFloor >= bandAmt ? 'deposit' : 'band' };
}

const AUDIT = (label, status) => ([
  { color:'#10B981', event:`${label} activated`, detail:'Status: Inactive → Active', ts:'14 Jun 2026, 11:42 AM', editor:'jane.doe@mvas.com' },
  { color:'#F59E0B', event:'Configuration updated', detail:'DTS windows and stateroom scoping revised', ts:'12 Jun 2026, 03:15 PM', editor:'jane.doe@mvas.com' },
  { color:'#F59E0B', event:'Default flag changed', detail:'is_default: OFF → ON', ts:'11 Jun 2026, 09:08 AM', editor:'admin@mvas.com' },
  { color:'#10B981', event:`${label} created`, detail:'Record created', ts:'08 Jun 2026, 02:30 PM', editor:'jane.doe@mvas.com' },
].concat(status === 'Inactive' ? [{ color:'#DC2626', event:`${label} deactivated`, detail:'Status: Active → Inactive', ts:'16 Jun 2026, 04:00 PM', editor:'admin@mvas.com' }] : []));

/* ─────────── Icons ─────────── */
const IcSearch = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IcChevron = ({ up }) => (<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points={up ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}/></svg>);
const IcX = ({ size = 12 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IcTrash = ({ size = 14 }) => (<svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M8 6V4h8v2"/><line x1="10" y1="10" x2="10" y2="17"/><line x1="14" y1="10" x2="14" y2="17"/></svg>);
const IcEdit = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IcCheck = ({ size = 12 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IcWarn = ({ color, size = 14 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IcGrip = () => (<svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor"><circle cx="2" cy="2" r="1.3"/><circle cx="8" cy="2" r="1.3"/><circle cx="2" cy="7" r="1.3"/><circle cx="8" cy="7" r="1.3"/><circle cx="2" cy="12" r="1.3"/><circle cx="8" cy="12" r="1.3"/></svg>);
const IcInfo = ({ color, size = 13 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>);

/* ─────────── Atoms ─────────── */
function StatusBadge({ status }) {
  const s = STATUS_S[status] || STATUS_S.Inactive;
  return (<span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:999, fontSize:11.5, fontWeight:600, background:s.bg, color:s.color, whiteSpace:'nowrap' }}><span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>{status}</span>);
}
function Pill({ children, bg, color, mono }) {
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:999, fontSize:11.5, fontWeight:600, background:bg || T.primaryBg, color:color || T.primary, whiteSpace:'nowrap', fontFamily:mono ? MONO : undefined }}>{children}</span>;
}
function CoverPill({ ok, label }) {
  return <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11.5, fontWeight:600, color: ok ? T.green : T.amberDark }}>{ok ? <IcCheck size={11}/> : <IcWarn color={T.amberDark} size={12}/>}{label || (ok ? 'Complete' : 'Check windows')}</span>;
}
function iS(err, dis) {
  return { width:'100%', padding:'9px 12px', border:`1.5px solid ${err ? T.red : dis ? '#E8EDF3' : '#D8DFE8'}`, borderRadius:7, fontSize:13, color:dis?T.inkFaint:T.ink, background:dis?'#F3F4F6':'#fff', outline:'none', cursor:dis?'not-allowed':undefined };
}

/* Associates the visible Field label and supporting copy with the first form control,
   including controls nested inside a styled wrapper or implemented as a component. */
function bindFieldControl(node, { id, label, describedBy, invalid, required }) {
  let bound = false;
  let controlId = id;
  const joinIds = (...ids) => [...new Set(ids.filter(Boolean).flatMap(v => String(v).split(/\s+/)))].join(' ') || undefined;
  const walk = child => {
    if (!React.isValidElement(child) || bound) return child;
    const native = typeof child.type === 'string';
    const formControl = native && (['input','select','textarea'].includes(child.type) || (child.type === 'button' && child.props.role === 'combobox'));
    if (formControl) {
      bound = true;
      controlId = child.props.id || id;
      return React.cloneElement(child, {
        id:controlId,
        'aria-describedby':joinIds(child.props['aria-describedby'], describedBy),
        'aria-invalid':invalid || child.props['aria-invalid'] || undefined,
        'aria-required':required || child.props['aria-required'] || undefined,
      });
    }
    if (!native) {
      bound = true;
      controlId = child.props.inputId || id;
      return React.cloneElement(child, {
        inputId:controlId,
        ariaLabel:child.props.ariaLabel || label,
        ariaDescribedBy:joinIds(child.props.ariaDescribedBy, describedBy),
        ariaInvalid:invalid || child.props.ariaInvalid || undefined,
        ariaRequired:required || child.props.ariaRequired || undefined,
      });
    }
    if (child.props.children === undefined) return child;
    return React.cloneElement(child, undefined, React.Children.map(child.props.children, walk));
  };
  return { node:walk(node), bound, controlId };
}

function Field({ label, required, helper, error, children }) {
  const uid = React.useId().replace(/:/g, '');
  const controlId = `field-${uid}`;
  const labelId = `${controlId}-label`;
  const helpId = `${controlId}-help`;
  const errorId = `${controlId}-error`;
  const describedBy = error ? errorId : helper ? helpId : undefined;
  const bound = bindFieldControl(children, { id:controlId, label, describedBy, invalid:!!error, required:!!required });
  return (
    <div role={label ? 'group' : undefined} aria-labelledby={label ? labelId : undefined} style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label id={labelId} htmlFor={bound.bound ? bound.controlId : undefined} style={{ fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{label}{required && <span aria-hidden="true" style={{ color:T.red, marginLeft:3 }}>*</span>}</label>}
      {bound.node}
      {error && <span id={errorId} role="alert" style={{ fontSize:11, color:T.red }}>{error}</span>}
      {!error && helper && <span id={helpId} style={{ fontSize:11, color:T.inkFaint, lineHeight:1.45, fontStyle:'italic' }}>{helper}</span>}
    </div>
  );
}
function Sel({ value, onChange, opts, err, dis, compact, inputId, ariaLabel, ariaDescribedBy, ariaInvalid, ariaRequired }) {
  return (
    <div style={{ position:'relative' }}>
      <select id={inputId} className="fi" value={value} onChange={e => !dis && onChange(e.target.value)} disabled={dis} aria-label={ariaLabel} aria-describedby={ariaDescribedBy} aria-invalid={ariaInvalid || !!err} aria-required={ariaRequired}
        style={{ ...iS(err, dis), appearance:'none', cursor:dis?'not-allowed':'pointer', paddingRight:26, ...(compact ? { padding:'6px 24px 6px 9px', fontSize:12.5 } : {}) }}>
        {opts.map(([v,l]) => <option key={v} value={v}>{l !== undefined ? l : v}</option>)}
      </select>
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.5" style={{ position:'absolute', right:9, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  );
}
function Toggle({ on, onChange, dis, label = 'Toggle setting' }) {
  return (
    <div role="switch" aria-label={label} aria-checked={on} aria-disabled={dis || undefined} tabIndex={dis ? -1 : 0}
      onClick={() => !dis && onChange(!on)}
      onKeyDown={e => { if (!dis && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onChange(!on); } }}
      style={{ width:38, height:22, borderRadius:11, flexShrink:0, background:dis?'#E2E8F0':on?T.primary:'#CBD5E1', cursor:dis?'not-allowed':'pointer', position:'relative', transition:'background .2s', opacity:dis ? .65 : 1 }}>
      <div style={{ position:'absolute', top:3, left:on?19:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
    </div>
  );
}
function SectionHead({ title, helper }) {
  return (<div><h2 style={{ fontSize:16.5, fontWeight:700, color:T.ink, marginBottom:4 }}>{title}</h2>{helper && <p style={{ fontSize:12.5, color:T.inkSoft, lineHeight:1.5 }}>{helper}</p>}</div>);
}
function SCard({ title, right, children, pad }) {
  return (
    <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(15,23,42,.04)' }}>
      {title && (
        <div style={{ padding:'11px 16px', borderBottom:`1px solid ${T.line}`, background:'#FAFBFC', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
          <span style={{ fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{title}</span>
          {right}
        </div>
      )}
      <div style={{ padding: pad || '14px 16px', display:'flex', flexDirection:'column', gap:12 }}>{children}</div>
    </div>
  );
}
function DRow({ label, children }) {
  return (<div style={{ display:'flex', alignItems:'flex-start', gap:14 }}><span style={{ width:170, flexShrink:0, fontSize:12, fontWeight:500, color:T.inkSoft, paddingTop:2 }}>{label}</span><div style={{ fontSize:13, color:T.ink, lineHeight:1.55, flex:1 }}>{children}</div></div>);
}
function Banner({ level, title, children, action }) {
  const map = { info:{ bg:'#F0F9FF', bd:'#BAE6FD', c:'#075985' }, warn:{ bg:T.amberLight, bd:T.amberBorder, c:T.amberDark }, error:{ bg:T.redLight, bd:'#FCA5A5', c:'#991B1B' }, success:{ bg:T.greenLight, bd:'#A7F3D0', c:'#065F46' } };
  const s = map[level] || map.info;
  return (
    <div style={{ display:'flex', gap:10, padding:'11px 14px', background:s.bg, border:`1px solid ${s.bd}`, borderRadius:8, alignItems:'flex-start' }}>
      <span style={{ flexShrink:0, paddingTop:1 }}>{level === 'error' || level === 'warn' ? <IcWarn color={s.c}/> : level === 'success' ? <span style={{ color:s.c, display:'flex' }}><IcCheck size={13}/></span> : <IcInfo color={s.c}/>}</span>
      <div style={{ flex:1, minWidth:0 }}>
        {title && <div style={{ fontSize:12.5, fontWeight:700, color:s.c, marginBottom:2 }}>{title}</div>}
        <div style={{ fontSize:12.5, color:s.c, lineHeight:1.55 }}>{children}</div>
      </div>
      {action}
    </div>
  );
}
function HelpList({ items }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4, padding:'10px 12px', background:T.fill, border:`1px solid ${T.lineSoft}`, borderRadius:8 }}>
      {items.map(([k, v]) => (
        <div key={k} style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.5 }}>
          <span style={{ fontFamily:MONO, fontWeight:700, color:T.ink }}>{k}</span> — {v}
        </div>
      ))}
    </div>
  );
}
function AuditList({ status, label }) {
  const log = AUDIT(label, status);
  return (
    <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius:10, overflow:'hidden' }}>
      {log.map((e, i) => (
        <div key={i} style={{ display:'flex', gap:14, padding:'14px 18px', borderBottom: i < log.length-1 ? '1px solid #F1F5F9' : 'none' }}>
          <div style={{ paddingTop:5, flexShrink:0 }}><div style={{ width:8, height:8, borderRadius:'50%', background:e.color }}/></div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:2 }}>{e.event}</div>
            <div style={{ fontSize:12, color:T.inkSoft }}>{e.detail}</div>
          </div>
          <div style={{ flexShrink:0, textAlign:'right' }}>
            <div style={{ fontSize:11.5, color:T.inkSoft, whiteSpace:'nowrap' }}>{e.ts}</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:2 }}>{e.editor}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
function UsedInTables({ row }) {
  const fts = row?.usedInFaretypes || [], fcs = row?.usedInFarecodes || [];
  const visibleCount = fts.length + fcs.length;
  const totalCount = Math.max(Number(row?.usedIn) || 0, visibleCount);
  if (!totalCount) return (<div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius:10, padding:'48px 24px', textAlign:'center', fontSize:13.5, color:T.inkSoft }}>Not currently referenced by any Faretype or Farecode.</div>);
  const rs = { display:'grid', gridTemplateColumns:'110px 1fr 90px 110px', gap:10, padding:'9px 14px', fontSize:12.5, alignItems:'center', borderBottom:'1px solid #F1F5F9' };
  const head = { ...rs, background:T.fill, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', fontSize:10.5, letterSpacing:'.5px' };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {totalCount > visibleCount && (
        <div role="note" style={{ padding:'10px 12px', border:`1px solid ${T.primaryLine}`, borderRadius:8, background:T.primaryBg, color:T.inkSoft, fontSize:11.5, lineHeight:1.45 }}>
          <strong style={{ color:T.ink }}>{totalCount} total references.</strong> Showing {visibleCount} detailed {visibleCount === 1 ? 'record' : 'records'} available in this prototype.
        </div>
      )}
      {fts.length > 0 && (
        <SCard title="Faretypes Using This Policy">
          <div style={{ border:`1px solid ${T.lineSoft}`, borderRadius:8, overflow:'hidden' }}>
            <div style={head}><span>Code</span><span>Name</span><span>Status</span><span>Modified</span></div>
            {fts.map((f,i) => (<div key={i} style={rs}><span style={{ fontFamily:MONO, fontWeight:700, color:T.primary }}>{f.code}</span><span>{f.name}</span><StatusBadge status={f.status}/><span style={{ color:T.inkSoft }}>{f.mod}</span></div>))}
          </div>
        </SCard>
      )}
      {fcs.length > 0 && (
        <SCard title="Farecodes Using This Policy">
          <div style={{ border:`1px solid ${T.lineSoft}`, borderRadius:8, overflow:'hidden' }}>
            <div style={head}><span>Code</span><span>Ship / Sailing</span><span>Status</span><span>Modified</span></div>
            {fcs.map((f,i) => (<div key={i} style={rs}><span style={{ fontFamily:MONO, fontWeight:700, color:T.primary }}>{f.code}</span><span>{f.ship}</span><StatusBadge status={f.status}/><span style={{ color:T.inkSoft }}>{f.mod}</span></div>))}
          </div>
        </SCard>
      )}
      {visibleCount === 0 && (
        <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius:10, padding:'36px 24px', textAlign:'center', fontSize:13, color:T.inkSoft }}>Detailed reference records are not available in this prototype.</div>
      )}
    </div>
  );
}

/* ─────────── Stateroom multi-select ─────────── */
function CatSelect({ value, onChange, err, inputId, ariaLabel = 'Stateroom types', ariaDescribedBy, ariaInvalid, ariaRequired }) {
  const [open, setOpen] = useSD(false);
  const ref = useRD();
  const menuId = useRD(`category-select-${Math.random().toString(36).slice(2)}`).current;
  useED(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const all = value.includes('All');
  const toggle = c => {
    if (c === 'All') return onChange(all ? [] : ['All']);
    const next = (all ? CATS.slice() : value.slice()).filter(x => x !== 'All');
    const i = next.indexOf(c);
    i === -1 ? next.push(c) : next.splice(i, 1);
    onChange(CATS.every(x => next.includes(x)) ? ['All'] : next);
  };
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button id={inputId} type="button" aria-label={ariaLabel} aria-describedby={ariaDescribedBy} aria-invalid={ariaInvalid || !!err} aria-required={ariaRequired} aria-haspopup="dialog" aria-controls={menuId} aria-expanded={open} onClick={() => setOpen(p => !p)} style={{ ...iS(err), padding:'6px 22px 6px 9px', fontSize:12, textAlign:'left', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', gap:6 }}>
        <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value.length === 0 ? 'Select…' : catLabel(value)}</span>
        <span style={{ color:T.inkFaint, position:'absolute', right:8, display:'flex' }}><IcChevron up={open}/></span>
      </button>
      {open && (
        <div id={menuId} role="dialog" aria-label={`${ariaLabel} options`} style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background:'#fff', border:`1px solid ${T.line}`, borderRadius:9, boxShadow:'0 8px 28px rgba(15,23,42,.12)', zIndex:600, minWidth:170, overflow:'hidden' }}>
          {['All', ...CATS].map(c => {
            const on = c === 'All' ? all : all || value.includes(c);
            return (
              <label key={c} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 12px', cursor:'pointer', fontSize:12.5, color:T.ink, borderBottom: c === 'All' ? `1px solid ${T.lineSoft}` : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = T.fill} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <input type="checkbox" checked={on} onChange={() => toggle(c)} style={{ accentColor:T.primary, width:13, height:13, cursor:'pointer' }}/>{c}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────── Chrome ─────────── */
function Sidebar({ screen, onNav }) {
  const nav = [
    { id:'dashboard', label:'Dashboard', icon:'◉' },
    { id:'bookings', label:'Bookings', icon:'☰', subs:[{ id:'flows', label:'Booking & Mod Flows' }] },
    { id:'sailings', label:'Sailings', icon:'⛴' },
    { id:'inventory', label:'Inventory', icon:'▦' },
    { id:'fares', label:'Fares & Pricing', icon:'$', subs:[
      { id:'faretypes', label:'Faretypes', plain:true },
      { id:'farecode', label:'Farecodes' },
      { id:'deposit', label:'Deposit Policies' },
      { id:'cancel', label:'Cancellation Policies' },
      { id:'supplements', label:'Supplements', plain:true },
      { id:'channels', label:'Channels', plain:true },
    ]},
    { id:'reports', label:'Reports', icon:'▤' },
    { id:'audit', label:'History', icon:'◷' },
  ];
  const inGroup = g => g.subs && g.subs.some(s => s.id === screen);
  return (
    <div className="pscroll" style={{ gridColumn:1, gridRow:'1 / span 2', background:T.panel, borderRight:`1px solid ${T.line}`, display:'flex', flexDirection:'column', overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'18px 16px', marginBottom:6 }}>
        <span style={{ fontWeight:800, fontSize:13, letterSpacing:'2.5px', color:T.ink }}>FARECODE</span>
      </div>
      {nav.map(item => {
        const open = inGroup(item);
        return (
          <div key={item.id}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 16px', margin:'1px 8px', borderRadius:6, fontSize:12.5, color:open?T.ink:T.inkSoft, background:open?T.fill:'transparent', fontWeight:open?600:500, cursor:'pointer' }}>
              <span style={{ width:15, textAlign:'center', color:open?T.primary:T.inkFaint, fontSize:12, flexShrink:0 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            {item.subs && (
              <div style={{ paddingLeft:40, marginTop:2, marginBottom:6 }}>
                {item.subs.map(sub => {
                  const active = sub.id === screen;
                  return (
                    <div key={sub.id} onClick={() => !sub.plain && onNav(sub.id)}
                      style={{ padding:'5px 10px', marginLeft:-10, fontSize:12, color:active?T.ink:sub.plain?T.inkFaint:T.inkSoft, fontWeight:active?700:400, borderLeft:active?`2px solid ${T.primary}`:'2px solid transparent', cursor:sub.plain?'default':'pointer', borderRadius:'0 4px 4px 0' }}>
                      {sub.label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
function TopBar() {
  return (
    <div style={{ gridColumn:2, gridRow:1, display:'flex', alignItems:'center', padding:'0 20px', background:T.panel, borderBottom:`1px solid ${T.line}`, justifyContent:'flex-end', gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 12px', border:`1px solid ${T.line}`, borderRadius:7, background:T.fill, fontSize:12.5, color:T.inkFaint, minWidth:260 }}><IcSearch/><span>Search bookings, farecodes…</span></div>
      <div style={{ width:30, height:30, borderRadius:'50%', background:'#E2E8F0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:T.inkSoft }}>JD</div>
    </div>
  );
}
function PageHead({ crumb, title, sub, cta, onCta }) {
  return (
    <div style={{ padding:'16px 28px 20px', flexShrink:0 }}>
      <div style={{ fontSize:11.5, color:T.inkFaint, marginBottom:8, fontWeight:500, letterSpacing:'.3px' }}>{crumb}</div>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, lineHeight:1, margin:'0 0 5px' }}>{title}</h1>
          <div style={{ fontSize:13, color:T.inkSoft, maxWidth:760 }}>{sub}</div>
        </div>
        {cta && (
          <button onClick={onCta} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', background:T.primary, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, boxShadow:'0 2px 6px rgba(27,36,52,.2)' }}
            onMouseEnter={e => e.currentTarget.style.opacity='.88'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>{cta}</button>
        )}
      </div>
    </div>
  );
}
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${T.line}` }}>
      {tabs.map(t => (
        <button key={t.k} onClick={() => onChange(t.k)}
          style={{ background:'none', border:'none', padding:'0 20px 10px 0', fontSize:13.5, fontWeight:active===t.k?600:500, color:active===t.k?T.ink:T.inkFaint, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7, borderBottom:active===t.k?`2px solid ${T.primary}`:'2px solid transparent', marginBottom:-1 }}>
          {t.l}
          {t.count !== undefined && <span style={{ fontSize:12, fontWeight:600, padding:'1px 7px', borderRadius:999, background:active===t.k?T.primaryBg:'transparent', color:active===t.k?T.primary:T.inkFaint }}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}
// size: trigger box in px. Defaults to 28; list views pass a smaller value so the trigger
// never exceeds the tallest cell content and inflates row height.
function RowMenu({ items, size = 28 }) {
  const [open, setOpen] = useSD(false);
  const ref = useRD();
  useED(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div ref={ref} style={{ position:'relative', display:'flex', justifyContent:'center' }}>
      <button onClick={e => { e.stopPropagation(); setOpen(p => !p); }} style={{ width:size, height:size, borderRadius:6, background:'none', border:'none', cursor:'pointer', color:T.inkFaint, fontSize:16, lineHeight:1, padding:0, display:'flex', alignItems:'center', justifyContent:'center' }}
        onMouseEnter={e => { e.currentTarget.style.background = T.fill; e.currentTarget.style.color = T.ink; }} onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = T.inkFaint; }}>⋯</button>
      {open && (
        <div style={{ position:'absolute', right:0, top:'100%', marginTop:4, background:'#fff', border:`1px solid ${T.line}`, borderRadius:9, boxShadow:'0 8px 28px rgba(15,23,42,.12)', minWidth:190, zIndex:400, overflow:'hidden' }}>
          {items.map((it, i) => it.sep ? <div key={i} style={{ height:1, background:T.line, margin:'3px 0' }}/> : (
            <div key={i} title={it.title} onClick={e => { e.stopPropagation(); if (it.disabled) return; setOpen(false); it.onClick(); }}
              style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 14px', fontSize:13, color: it.disabled ? T.inkFaint : it.danger ? T.red : it.success ? '#15803D' : T.ink, cursor: it.disabled ? 'not-allowed' : 'pointer' }}
              onMouseEnter={e => { if (!it.disabled) e.currentTarget.style.background = it.danger ? T.redLight : it.success ? T.greenLight : T.fill; }}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ width:14, textAlign:'center', opacity:.7 }}>{it.icon}</span>{it.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function Modal({ title, icon, children, actions, width = 420, onClose }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.45)', zIndex:1200, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div onClick={e => e.stopPropagation()} className="pscroll" style={{ background:'#fff', borderRadius:12, padding:26, width, maxHeight:'82vh', overflowY:'auto', boxShadow:'0 20px 50px rgba(0,0,0,.2)' }}>
        <div style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:12 }}>
          {icon}<div style={{ fontSize:15.5, fontWeight:700, color:T.ink }}>{title}</div>
        </div>
        <div style={{ fontSize:13, color:T.inkSoft, lineHeight:1.6, marginBottom:20 }}>{children}</div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>{actions}</div>
      </div>
    </div>
  );
}

/* ─────────── Group list view (1.1 / 2.1) ─────────── */
function DCGroupList({ kind, groups, onOpen, onCreate, onDelete }) {
  const isDep = kind === 'deposit';
  const [tab, setTab] = useSD('all');
  const [q, setQ] = useSD('');
  const [refund, setRefund] = useSD('all');
  const [page, setPage] = useSD(1);
  const PAGE = 10;

  let rows = groups.filter(g => {
    if (q && !g.name.toLowerCase().includes(q.trim().toLowerCase())) return false;
    if (tab === 'active' && !g.isActive) return false;
    if (tab === 'inactive' && g.isActive) return false;
    if (!isDep && refund !== 'all' && String(g.isRefundable) !== (refund === 'refundable' ? 'true' : 'false')) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE));
  const pageRows = rows.slice((page-1)*PAGE, page*PAGE);
  const TH = { padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:600, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap', background:'#F7F9FC', borderBottom:`1px solid ${T.line}` };
  const TD = { padding:'11px 14px', verticalAlign:'middle' };
  const parentCount = g => g.parents.length;
  const coverageOk = g => g.parents.every(p => validateRows(isDep ? p.lines : p.bands).issues.length === 0);

  return (
    <div className="pscroll" style={{ gridColumn:2, gridRow:2, overflow:'auto', display:'flex', flexDirection:'column' }}>
      <PageHead
        crumb={<>FARES &amp; PRICING <span style={{ margin:'0 5px' }}>›</span> <span style={{ color:T.inkSoft }}>{isDep ? 'DEPOSIT POLICIES' : 'CANCELLATION POLICIES'}</span></>}
        title={isDep ? 'Deposit Policy Groups' : 'Cancellation Policy Groups'}
        sub={isDep ? 'Reusable deposit configurations, organized into groups.' : 'Reusable cancellation configurations, organized into groups.'}
        cta="+ New Group" onCta={onCreate}/>
      <div style={{ flex:1, padding:'0 28px 28px' }}>
        <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(15,23,42,.04)' }}>
          <div style={{ padding:'16px 20px 12px', borderBottom:`1px solid ${T.line}`, background:T.fill }}>
            <div style={{ marginBottom:14 }}>
              <Tabs active={tab} onChange={k => { setTab(k); setPage(1); }} tabs={[
                { k:'all', l:'All Groups', count:groups.length },
                { k:'active', l:'Active', count:groups.filter(g => g.isActive).length },
                { k:'inactive', l:'Inactive', count:groups.filter(g => !g.isActive).length },
              ]}/>
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ flex:'1 1 240px', display:'flex', alignItems:'center', gap:8, padding:'7px 12px', border:`1px solid ${T.line}`, borderRadius:8, background:'#fff' }}>
                <span style={{ color:T.inkFaint, display:'flex' }}><IcSearch/></span>
                <input aria-label="Filter policy groups" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Filter by group name…" style={{ border:'none', outline:'none', background:'transparent', fontSize:13, color:T.ink, width:'100%' }}/>
                {q && <button type="button" aria-label="Clear group search" onClick={() => setQ('')} style={{ background:'none', border:'none', cursor:'pointer', color:T.inkFaint, display:'flex', padding:0 }}><IcX size={11}/></button>}
              </div>
              {!isDep && (
                <div style={{ width:190 }}>
                  <Sel compact ariaLabel="Filter by refundability" value={refund} onChange={v => { setRefund(v); setPage(1); }} opts={[['all','All refundability'],['refundable','Refundable'],['nonrefundable','Non-Refundable']]}/>
                </div>
              )}
              <span style={{ fontSize:11, color:T.inkFaint, marginLeft:'auto' }}>{rows.length} of {groups.length} groups</span>
            </div>
          </div>
          <div className="hscroll" style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:900 }}>
              <thead><tr>
                <th style={TH}>Group Name</th>
                <th style={TH}>Parent Policies</th>
                {!isDep && <th style={TH}>Refundability</th>}
                <th style={TH}>Default</th>
                <th style={TH}>Status</th>
                <th style={TH}>Last Modified</th>
                <th style={{ ...TH, width:44 }}></th>
              </tr></thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr><td colSpan={isDep?6:7} style={{ padding:'72px 20px', textAlign:'center' }}>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="1.4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <div style={{ fontSize:15, fontWeight:600, color:T.inkSoft }}>{q || tab !== 'all' ? 'No groups match your filters' : `No ${isDep?'deposit':'cancellation'} policy groups yet`}</div>
                      <div style={{ fontSize:13, color:T.inkFaint }}>{q || tab !== 'all' ? 'Try adjusting your search or filters.' : `No ${isDep?'deposit':'cancellation'} policy groups yet. Create your first by clicking "+ New Group" above.`}</div>
                    </div>
                  </td></tr>
                ) : pageRows.map(g => (
                  <tr key={g.id} onClick={() => onOpen(g)} style={{ background:'#fff', borderBottom:`1px solid ${T.lineSoft}`, cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.fill} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <td style={{ ...TD, fontWeight:600 }}>
                      <div>{g.name}</div>
                      <div style={{ marginTop:3 }}><CoverPill ok={coverageOk(g)} label={coverageOk(g) ? 'Windows complete' : 'Window/coverage gaps'}/></div>
                    </td>
                    <td style={{ ...TD, color:T.inkSoft }}>{parentCount(g)} {parentCount(g)===1?'policy':'policies'}</td>
                    {!isDep && <td style={TD}><Pill bg={g.isRefundable?'#ECFDF5':'#FEF2F2'} color={g.isRefundable?'#065F46':'#991B1B'}>{g.isRefundable ? 'Refundable' : 'Non-Refundable'}</Pill></td>}
                    <td style={TD}>{g.isDefault ? <Pill>Default</Pill> : <span style={{ color:T.inkFaint }}>—</span>}</td>
                    <td style={TD}><StatusBadge status={g.isActive ? 'Active' : 'Inactive'}/></td>
                    <td style={{ ...TD, color:T.inkSoft, fontSize:12.5 }}>{g.mod}</td>
                    <td style={{ ...TD, width:44 }} onClick={e => e.stopPropagation()}>
                      <RowMenu items={[
                        { icon:'↗', label:'View', onClick:() => onOpen(g) },
                        { icon:'✎', label:'Edit', onClick:() => onOpen(g, true) },
                        { sep:true },
                        { icon:<IcTrash size={13}/>, label:'Delete', danger:true, disabled:g.parents.some(p => p.usedIn > 0), title: g.parents.some(p => p.usedIn > 0) ? 'Cannot delete — parent policies are in use.' : undefined, onClick:() => onDelete(g) },
                      ]}/>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderTop:`1px solid ${T.line}`, background:T.fill }}>
            <span style={{ fontSize:12.5, color:T.inkSoft }}>{rows.length === 0 ? 'No results' : `Showing ${(page-1)*PAGE+1}–${Math.min(page*PAGE, rows.length)} of ${rows.length} groups`}</span>
            {totalPages > 1 && (
              <div style={{ display:'flex', gap:4 }}>
                {Array.from({ length:totalPages }, (_,i) => i+1).map(p => (
                  <button key={p} type="button" aria-label={`Page ${p}`} aria-current={p===page ? 'page' : undefined} onClick={() => setPage(p)} style={{ width:32, height:32, borderRadius:6, border:`1px solid ${p===page?T.primary:T.line}`, background:p===page?T.primary:'#fff', color:p===page?'#fff':T.ink, fontSize:13, cursor:'pointer', fontWeight:p===page?700:400 }}>{p}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  T, MONO, STATUS_S, CATS, DEPOSIT_TYPE_LABELS, depositTypeLabel, DEP_TYPES, DEP_HELP, PEN_TYPES, PEN_HELP,
  DEP_GROUPS_INIT, CAN_GROUPS_INIT,
  num, isBlank, catsCover, catLabel, winLabel, money, depAmountLabel, penAmountLabel,
  windowGroups, continuationBeginDts, validateRows, refundabilityIssues, inWindow, rowForCat, depositAmountFor, cancelCharge, AUDIT,
  IcSearch, IcChevron, IcX, IcEdit, IcCheck, IcWarn, IcGrip, IcInfo,
  StatusBadge, Pill, CoverPill, iS, Field, Sel, Toggle, SectionHead, SCard, DRow, Banner, HelpList, AuditList, UsedInTables, CatSelect,
  Sidebar, TopBar, PageHead, Tabs, RowMenu, Modal, DCGroupList,
});
