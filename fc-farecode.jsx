// fc-farecode.jsx — full Farecode list + create/edit panel.
// Ported from the standalone "Farecode Create-Edit Panel" prototype and wrapped in an IIFE: it keeps
// its own T / Field / Sel / Toggle / StatusBadge / IcSearch primitives, which would otherwise collide
// with the identically-named globals in dc-shell.jsx.
// Its Policies section (S2) reads live Group→Parent policy records passed down from the shell.
(function () {
const { useState, useRef, useEffect } = React;

/* ── Design tokens ── */
const T = {
  ink:'#0F172A', inkSoft:'#475569', inkFaint:'#94A3B8', inkLabel:'#64748B',
  bg:'#F1F5F9', panel:'#FFFFFF', fill:'#F8FAFC', navFill:'#F9FAFB',
  line:'#E2E8F0', lineSoft:'#EEF2F6',
  primary:'#1B2434', primaryBg:'#EEF2F6',
  teal:'#10B981', tealDark:'#059669', tealLight:'#ECFDF5',
  amber:'#F59E0B', amberDark:'#D97706', amberLight:'#FFFBEB', amberBorder:'#FCD34D',
  red:'#DC2626', redLight:'#FEF2F2',
};

/* ── Form / override data ── */
const SHIPS_DATA = {
  'Island Escape': ['IS-2026-08-20','IS-2026-09-01','IS-2026-10-15','IS-2026-11-20','IS-2026-12-05'],
  'Paradise Bay':  ['PB-2026-08-05','PB-2026-09-10','PB-2026-10-20','PB-2026-11-05'],
  'Northern Star': ['NS-2026-09-15','NS-2026-10-01','NS-2026-11-15','NS-2026-12-10'],
};

/* ── Sailing dates ──
   A sailing owns its own departure and return, so every farecode priced on it reports the
   same window. The code already carries the departure (<SHIP>-YYYY-MM-DD); SAIL_NIGHTS
   carries the duration that sets the return. */
const SAIL_NIGHTS = {
  'IS-2026-08-20':5,  'IS-2026-09-01':7,  'IS-2026-10-15':5,  'IS-2026-11-20':7,  'IS-2026-12-05':10,
  'PB-2026-08-05':7,  'PB-2026-09-10':5,  'PB-2026-10-20':7,  'PB-2026-11-05':10,
  'NS-2026-09-15':7,  'NS-2026-10-01':10, 'NS-2026-11-15':7,  'NS-2026-12-10':5,
};
const MON_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDay = d => `${String(d.getDate()).padStart(2,'0')} ${MON_ABBR[d.getMonth()]} ${d.getFullYear()}`;
function sailDates(code) {
  const m = /(\d{4})-(\d{2})-(\d{2})$/.exec(code || '');
  if (!m) return { start:'—', end:'—' };
  const start = new Date(+m[1], +m[2]-1, +m[3]);
  const end = new Date(start);
  end.setDate(end.getDate() + (SAIL_NIGHTS[code] || 7));
  return { start:fmtDay(start), end:fmtDay(end), nights:SAIL_NIGHTS[code] || 7 };
}
const FT_DATA = [
  { code:'FT-00101', basis:'CORE-RETAIL', group:'Core',
    vals:{ cancellationPolicy:'Standard Cancellation', depositPolicy:'5 Night Standard Deposit', residency:'Any', minAge:18, minOccupancy:1, maxOccupancy:4, standbyEligible:false, upgradeEligible:true, couponEligible:true, advancedPurchase:'', cruiseControlAccess:true, chMVASB2C:true, chMVASB2B:true, chCC:true, chTradeAPI:false, chCRM:true, chGroup:false, chInternal:false, includeDiscount:false, discountMessage:'', offerPrimary:'', offerSecondary:'', offerTertiary:'', waiveGovTaxes:false, waiveCruiseExp:false, noFareDisplay:false }},
  { code:'FT-00102', basis:'NR-PROMO', group:'Non-Refundable',
    vals:{ cancellationPolicy:'Non-Refundable', depositPolicy:'5 Night Promo Deposit', residency:'US Only', minAge:21, minOccupancy:2, maxOccupancy:4, standbyEligible:false, upgradeEligible:false, couponEligible:false, advancedPurchase:30, cruiseControlAccess:true, chMVASB2C:true, chMVASB2B:false, chCC:true, chTradeAPI:false, chCRM:true, chGroup:false, chInternal:false, includeDiscount:false, discountMessage:'', offerPrimary:'OFFER-2026-SPRING', offerSecondary:'', offerTertiary:'', waiveGovTaxes:false, waiveCruiseExp:false, noFareDisplay:false }},
  { code:'FT-00103', basis:'INT-AGENCY', group:'Interline',
    vals:{ cancellationPolicy:'Standard — Suites Enhanced', depositPolicy:'7 Night Trade Deposit', residency:'Any', minAge:18, minOccupancy:1, maxOccupancy:3, standbyEligible:true, upgradeEligible:true, couponEligible:true, advancedPurchase:'', cruiseControlAccess:false, chMVASB2C:false, chMVASB2B:false, chCC:false, chTradeAPI:true, chCRM:true, chGroup:true, chInternal:false, includeDiscount:false, discountMessage:'', offerPrimary:'', offerSecondary:'', offerTertiary:'', waiveGovTaxes:false, waiveCruiseExp:false, noFareDisplay:false }},
];
const OVRD_KEYS = ['cancellationPolicy','depositPolicy','minOccupancy','maxOccupancy','advancedPurchase','standbyEligible','upgradeEligible','couponEligible','cruiseControlAccess','channelVisibility','includeDiscount','discountMessage','offerPrimary','offerSecondary','offerTertiary','waiveGovTaxes','waiveCruiseExp','noFareDisplay'];
const DEFAULT_FORM  = () => ({ ship:'', sailing:'', faretype:'', cancellationPolicy:'', depositPolicy:'', residency:'Any', minAge:18, minOccupancy:'', maxOccupancy:'', advancedPurchase:'', standbyEligible:false, upgradeEligible:true, couponEligible:true, cruiseControlAccess:true, chMVASB2C:true, chMVASB2B:true, chCC:true, chTradeAPI:false, chCRM:true, chGroup:false, chInternal:false, channelPartners:[], includeDiscount:false, discountMessage:'', offerPrimary:'', offerSecondary:'', offerTertiary:'', waiveGovTaxes:false, waiveCruiseExp:false, noFareDisplay:false });
const DEFAULT_OVRD  = () => Object.fromEntries(OVRD_KEYS.map(k => [k,'inherited']));
const GUEST_ROWS = [
  { grp:'Occupancy 1–2', rows:[{ k:'single',l:'Single Guest' },{ k:'dbl1',l:'Double Guest 1' },{ k:'dbl2',l:'Double Guest 2' }] },
  { grp:'Extra adult',   rows:[{ k:'adult3',l:'3rd guest' },{ k:'adult4',l:'4th guest' }] },
  { grp:'Extra child',   rows:[{ k:'child3',l:'3rd guest' },{ k:'child4',l:'4th guest' }] },
  { grp:'Extra infant',  rows:[{ k:'infant3',l:'3rd guest' },{ k:'infant4',l:'4th guest' }] },
];
const GUEST_KEYS = GUEST_ROWS.flatMap(g => g.rows.map(r => r.k));
const EMPTY_ROW = () => Object.fromEntries(GUEST_KEYS.map(k => [k,'']));
const SYSTEM_PRICING_CABINS = ['Interior','Ocean View','Balcony','Suite'];
const MAX_PRICING_COLUMNS = 8;
const DEFAULT_PRICING = () => Object.fromEntries(SYSTEM_PRICING_CABINS.map(cabin => [cabin, EMPTY_ROW()]));

/* ── Mock data for the History tab ── */
const MOCK_AUDIT = [
  { color:'#F59E0B', event:'Pricing updated',                  detail:'Interior Adult $1,099 → $1,299 · Ocean View Adult $1,499 → $1,699', ts:'12 Jun 2026, 02:14 PM', editor:'jane.doe@mvas.com' },
  { color:'#10B981', event:'Farecode activated',               detail:'Status: Draft → Active',                                             ts:'12 Jun 2026, 11:42 AM', editor:'jane.doe@mvas.com' },
  { color:'#F59E0B', event:'Channels updated',                 detail:'MVAS B2B: Enabled → Disabled',                                       ts:'11 Jun 2026, 04:30 PM', editor:'john.smith@mvas.com' },
  { color:'#F59E0B', event:'Cancellation Policy overridden',   detail:'Standard → Non-Refundable',                                          ts:'11 Jun 2026, 03:17 PM', editor:'john.smith@mvas.com' },
  { color:'#F59E0B', event:'Min Occupancy overridden',         detail:'Inherited → 2',                                                      ts:'11 Jun 2026, 03:15 PM', editor:'john.smith@mvas.com' },
  { color:'#10B981', event:'Farecode created',                 detail:'Draft record created from FT-00101',                                 ts:'09 Jun 2026, 02:00 PM', editor:'jane.doe@mvas.com' },
];

/* ─────────────────────────────────────────────
   EDIT MODE primitives
─────────────────────────────────────────────── */
function iS(err, dis) {
  return { width:'100%', padding:'9px 12px', border:`1.5px solid ${err?T.red:dis?'#E8EDF3':'#D8DFE8'}`, borderRadius:7, fontSize:13, color:dis?T.inkFaint:T.ink, background:dis?'#F3F4F6':'#fff', outline:'none', cursor:dis?'not-allowed':undefined };
}
function Field({ label, required, helper, error, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{label}{required && <span style={{ color:T.red, marginLeft:3 }}>*</span>}</label>}
      {children}
      {error  && <span style={{ fontSize:11, color:T.red }}>{error}</span>}
      {!error && helper && <span style={{ fontSize:11, color:T.inkFaint, lineHeight:1.4 }}>{helper}</span>}
    </div>
  );
}
function OField({ label, required, status, onOverride, onRevert, helper, error, noOvr, children }) {
  const showLock  = status === 'locked' || status === 'inherited';
  const showBtn   = status === 'inherited' && !noOvr;
  const showBadge = status === 'overridden';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:17 }}>
        {label && <label style={{ fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{label}{required && <span style={{ color:T.red, marginLeft:3 }}>*</span>}</label>}
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          {showBtn   && <button onClick={onOverride} style={{ padding:'2px 7px', borderRadius:4, border:`1px solid #D1D5DB`, background:'#fff', fontSize:10, fontWeight:600, color:T.inkSoft, cursor:'pointer' }}>Override</button>}
          {showBadge && <span onClick={onRevert} title="Revert to inherited" style={{ padding:'2px 7px', borderRadius:4, background:'#E1F5EE', color:'#0F6E56', fontSize:10, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:3 }}>Overridden <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
          {showLock  && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        </div>
      </div>
      {children}
      {error  && <span style={{ fontSize:11, color:T.red }}>{error}</span>}
      {!error && helper && <span style={{ fontSize:11, color:T.inkFaint, lineHeight:1.4 }}>{helper}</span>}
    </div>
  );
}
function Sel({ value, onChange, opts, err, dis }) {
  return (
    <div style={{ position:'relative' }}>
      <select className="fi" value={value} onChange={e => !dis && onChange(e.target.value)} disabled={dis}
        style={{ ...iS(err, dis), appearance:'none', cursor:dis?'not-allowed':'pointer', paddingRight:28 }}>
        {opts.map(([v,l]) => <option key={v} value={v}>{l !== undefined ? l : v}</option>)}
      </select>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.5" style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><polyline points="6 9 12 15 18 9"/></svg>
    </div>
  );
}
function Toggle({ on, onChange, dis }) {
  return (
    <div onClick={() => !dis && onChange(!on)}
      style={{ width:38, height:22, borderRadius:11, flexShrink:0, background:dis?'#E2E8F0':on?T.primary:'#CBD5E1', cursor:dis?'not-allowed':'pointer', position:'relative', transition:'background .2s', opacity:dis?.65:1 }}>
      <div style={{ position:'absolute', top:3, left:on?19:3, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }}/>
    </div>
  );
}
function WarnBanner({ children }) {
  return (
    <div style={{ background:T.amberLight, border:`1px solid ${T.amberBorder}`, borderRadius:9, padding:'11px 14px', display:'flex', gap:9, alignItems:'flex-start' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth="2.2" style={{ flexShrink:0, marginTop:1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <div>{children}</div>
    </div>
  );
}
function OTRow({ label, helper, on, onChange, status, onOverride, onRevert }) {
  const dis = status === 'locked' || status === 'inherited';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:500, color:T.ink }}>{label}</div>
        {helper && <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:2 }}>{helper}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
        {status==='inherited'  && <button onClick={onOverride} style={{ padding:'2px 7px', borderRadius:4, border:`1px solid #D1D5DB`, background:'#fff', fontSize:10, fontWeight:600, color:T.inkSoft, cursor:'pointer' }}>Override</button>}
        {status==='overridden' && <span onClick={onRevert} style={{ padding:'2px 7px', borderRadius:4, background:'#E1F5EE', color:'#0F6E56', fontSize:10, fontWeight:600, cursor:'pointer' }}>Overridden ×</span>}
        {dis && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        <Toggle on={on} onChange={onChange} dis={dis}/>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   READ-ONLY primitives
─────────────────────────────────────────────── */
function ROSection({ n, title, action, children }) {
  return (
    <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius:10, padding:'18px 20px 20px', boxShadow:'0 1px 3px rgba(15,23,42,.04)', marginBottom:10 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
          {n !== undefined && (
            <div style={{ width:22, height:22, borderRadius:'50%', background:T.primaryBg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:9, fontWeight:800, color:T.primary }}>{String(n).padStart(2,'0')}</span>
            </div>
          )}
          <span style={{ fontSize:13.5, fontWeight:700, color:T.ink }}>{title}</span>
        </div>
        {action && <div style={{ display:'flex', alignItems:'center', flexShrink:0 }}>{action}</div>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{children}</div>
    </div>
  );
}
function ROField({ label, value, status, mono, teal, extra }) {
  const isLock = status === 'inherited' || status === 'locked';
  const isOvrd = status === 'overridden';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:16 }}>
        <span style={{ fontSize:10, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.6px' }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {isOvrd && <span style={{ padding:'2px 7px', borderRadius:4, background:'#E1F5EE', color:'#0F6E56', fontSize:10, fontWeight:600 }}>Overridden</span>}
          {isLock && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        </div>
      </div>
      <div style={{ padding:'8px 12px', borderRadius:6, fontSize:13, lineHeight:1.5, background:isLock?'#F3F4F6':'#F9FAFB', color:teal?T.tealDark:T.ink, fontFamily:mono?"'SF Mono',Menlo,monospace":undefined, fontWeight:mono&&teal?700:400 }}>
        {value || <span style={{ color:T.inkFaint }}>—</span>}
        {extra && <span style={{ fontFamily:'inherit', fontSize:11.5, color:T.inkSoft, fontWeight:400, marginLeft:6 }}>{extra}</span>}
      </div>
    </div>
  );
}
function ROToggle({ label, helper, value, status }) {
  const isLock = status === 'inherited' || status === 'locked';
  const isOvrd = status === 'overridden';
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:isLock?'#F8FAFC':'#fff', border:`1.5px solid ${isOvrd?'#A7F3D0':'#E8EDF3'}`, borderRadius:8 }}>
      <div>
        <div style={{ fontSize:13, fontWeight:500, color:T.ink }}>{label}</div>
        {helper && <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:2 }}>{helper}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {isOvrd && <span style={{ padding:'2px 7px', borderRadius:4, background:'#E1F5EE', color:'#0F6E56', fontSize:10, fontWeight:600 }}>Overridden</span>}
        {isLock && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        <span style={{ padding:'3px 10px', borderRadius:999, fontSize:12, fontWeight:600, background:value?T.tealLight:T.fill, color:value?T.tealDark:T.inkSoft }}>{value?'Enabled':'Disabled'}</span>
      </div>
    </div>
  );
}

function IcExpand({ size=15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 3 21 3 21 9"/><line x1="14" y1="10" x2="21" y2="3"/>
      <polyline points="9 21 3 21 3 15"/><line x1="10" y1="14" x2="3" y2="21"/>
    </svg>
  );
}

function PricingReadOnlyTable({ pricing, expanded=false }) {
  const cabins = Object.keys(pricing);
  const fmtCur = n => new Intl.NumberFormat('en-US',{ minimumFractionDigits:2, maximumFractionDigits:2 }).format(n);
  const parseCur = v => parseFloat(String(v||'').replace(/[^0-9.]/g,'')) || 0;
  const val = (cab,k) => parseCur(pricing[cab][k]);
  const isPriced = cab => GUEST_KEYS.some(k => val(cab,k) > 0);
  const firstCol = expanded ? 180 : 128;
  const cabinCol = expanded ? 150 : 76;
  const pGrid = `${firstCol}px repeat(${cabins.length}, minmax(${cabinCol}px,1fr))`;
  const cellPad = expanded ? '13px 16px' : '9px 10px';
  const labelPad = expanded ? '13px 18px' : '9px 12px';
  const valueSize = expanded ? 13.5 : 12.5;

  return (
    <div className="hscroll" style={{ border:`1px solid ${T.line}`, borderRadius:9, overflowX:'auto', background:'#fff' }}>
      <div style={{ minWidth:cabins.length*cabinCol+firstCol }}>
        <div style={{ display:'grid', gridTemplateColumns:pGrid, background:'#F7F9FC', borderBottom:`1px solid ${T.line}`, position:'sticky', top:0, zIndex:1 }}>
          <div style={{ padding:expanded?'11px 18px':'8px 12px', fontSize:10, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px' }}>Guest Type</div>
          {cabins.map(cabin => (
            <div key={cabin} style={{ padding:expanded?'11px 16px':'8px 10px', fontSize:expanded?11:10.5, fontWeight:700, color:isPriced(cabin)?T.ink:T.inkFaint, textAlign:'right', borderLeft:`1px solid ${T.lineSoft}`, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }} title={cabin}>{cabin}</div>
          ))}
        </div>
        {GUEST_ROWS.map((g, gi) => (
          <div key={g.grp}>
            <div style={{ display:'grid', gridTemplateColumns:pGrid, background:'#FAFBFD', borderBottom:`1px solid ${T.lineSoft}`, borderTop:gi>0?`1px solid ${T.lineSoft}`:'none' }}>
              <div style={{ padding:expanded?'8px 18px':'6px 12px', fontSize:9.5, fontWeight:700, color:T.inkFaint, textTransform:'uppercase', letterSpacing:'.6px', gridColumn:`span ${cabins.length+1}` }}>{g.grp}</div>
            </div>
            {g.rows.map((r, ri) => (
              <div key={r.k} style={{ display:'grid', gridTemplateColumns:pGrid, alignItems:'center', borderBottom:ri<g.rows.length-1?`1px solid ${T.lineSoft}`:'none', background:'#fff' }}>
                <div style={{ padding:labelPad, fontSize:expanded?13.5:12.5, color:T.ink, whiteSpace:'nowrap' }}>{r.l}</div>
                {cabins.map(cabin => (
                  <div key={cabin} style={{ padding:cellPad, fontSize:valueSize, textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace", color:val(cabin,r.k)>0?T.ink:T.inkFaint, borderLeft:`1px solid ${T.lineSoft}` }}>
                    {val(cabin,r.k)>0?fmtCur(val(cabin,r.k)):'—'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
        <div style={{ display:'grid', gridTemplateColumns:pGrid, alignItems:'center', borderTop:`1px solid ${T.line}`, background:T.fill }}>
          <div style={{ padding:expanded?'13px 18px':'10px 12px', fontSize:11, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px' }}>Cabin · Double</div>
          {cabins.map(cabin => {
            const total = val(cabin,'dbl1')+val(cabin,'dbl2');
            return <div key={cabin} style={{ padding:expanded?'13px 16px':'10px', fontSize:valueSize, fontWeight:700, textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace", color:total>0?T.ink:T.inkFaint, borderLeft:`1px solid ${T.lineSoft}` }}>{total>0?fmtCur(total):'—'}</div>;
          })}
        </div>
      </div>
    </div>
  );
}

function PricingExpandedModal({ pricing, leadIn, onClose }) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    const previousAriaHidden = appRoot?.getAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    appRoot?.setAttribute('aria-hidden','true');
    closeBtnRef.current?.focus();
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) return;
        const first = focusable[0], last = focusable[focusable.length-1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousAriaHidden === null || previousAriaHidden === undefined) appRoot?.removeAttribute('aria-hidden');
      else appRoot?.setAttribute('aria-hidden', previousAriaHidden);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return ReactDOM.createPortal(
    <div onMouseDown={onClose} style={{ position:'fixed', inset:0, zIndex:1800, background:'rgba(15,23,42,.58)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', padding:32 }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pricing-modal-title" tabIndex="-1" onMouseDown={e => e.stopPropagation()}
        style={{ width:'min(1240px, calc(100vw - 64px))', maxHeight:'calc(100vh - 64px)', background:'#fff', borderRadius:14, boxShadow:'0 28px 80px rgba(15,23,42,.3)', display:'flex', flexDirection:'column', outline:'none', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, padding:'20px 24px', borderBottom:`1px solid ${T.line}`, flexShrink:0 }}>
          <div>
            <div id="pricing-modal-title" style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:4 }}>Pricing matrix</div>
            <div style={{ fontSize:12.5, color:T.inkSoft }}>Fare per guest in USD, by guest position and cabin category.</div>
          </div>
          <button ref={closeBtnRef} onClick={onClose} aria-label="Close expanded pricing view" title="Close"
            style={{ width:34, height:34, borderRadius:8, border:`1px solid ${T.line}`, background:'#fff', color:T.inkSoft, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.background=T.fill; e.currentTarget.style.color=T.ink; }}
            onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color=T.inkSoft; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="pscroll" style={{ padding:24, overflow:'auto', minHeight:0 }}>
          <PricingReadOnlyTable pricing={pricing} expanded/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, marginTop:14, padding:'12px 16px', background:T.fill, borderRadius:8, border:`1px solid ${T.lineSoft}` }}>
            <span style={{ fontSize:12.5, color:T.inkSoft }}>Lead-in cabin fare <span style={{ color:T.inkFaint }}>· lowest category, 2 guests</span></span>
            <span style={{ fontSize:16, fontWeight:700, color:T.ink, fontFamily:"'SF Mono',Menlo,monospace" }}>{leadIn}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Read-only overview (all 7 sections) ── */
function OverviewReadOnly({ form, overrides, pricing }) {
  const [pricingExpanded, setPricingExpanded] = useState(false);
  const expandBtnRef = useRef(null);
  const selFT = FT_DATA.find(ft => ft.code === form.faretype);
  const getO  = k => overrides[k] || 'inherited';
  const CHS = [
    { k:'chMVASB2C', l:'MVAS B2C' }, { k:'chMVASB2B', l:'MVAS B2B' },
    { k:'chCC', l:'Cruise Control' }, { k:'chTradeAPI', l:'Trade API' },
    { k:'chCRM', l:'CRM' }, { k:'chGroup', l:'Group' }, { k:'chInternal', l:'Internal' },
  ];
  const vis = CHS.filter(c => form[c.k]).map(c => c.l);
  const hid = CHS.filter(c => !form[c.k]).map(c => c.l);
  function fmtCur(n) { return new Intl.NumberFormat('en-US',{ minimumFractionDigits:2, maximumFractionDigits:2 }).format(n); }
  function parseCur(v) { return parseFloat(String(v||'').replace(/[^0-9.]/g,'')) || 0; }
  const CABINS = Object.keys(pricing);
  const val = (cab,k) => parseCur(pricing[cab][k]);
  const isPriced = cab => GUEST_KEYS.some(k => val(cab,k) > 0);
  const leadIn = Math.min(...CABINS.filter(isPriced).map(c => val(c,'dbl1')+val(c,'dbl2')).concat([Infinity]));
  const leadInLabel = isFinite(leadIn)&&leadIn>0?`$${fmtCur(leadIn)}`:'—';
  const closeExpandedPricing = () => {
    setPricingExpanded(false);
    requestAnimationFrame(() => expandBtnRef.current?.focus());
  };

  return (
    <div>
      {/* 1. Ship & Sailing */}
      <ROSection n={1} title="Ship & Sailing">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <ROField label="Ship"    value={form.ship}/>
          <ROField label="Sailing" value={form.sailing} mono/>
          <ROField label="Start Date" value={sailDates(form.sailing).start}/>
          <ROField label="End Date"   value={sailDates(form.sailing).end}/>
        </div>
        <ROField label="Faretype" value={form.faretype} mono teal extra={selFT?`· ${selFT.basis} · ${selFT.group}`:''}/>
      </ROSection>

      {/* 2. Policies */}
      <ROSection n={2} title="Policies">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <ROField label="Cancellation Policy" value={form.cancellationPolicy} status={getO('cancellationPolicy')}/>
          <ROField label="Deposit Policy"      value={form.depositPolicy}      status={getO('depositPolicy')}/>
        </div>
      </ROSection>

      {/* 3. Eligibility */}
      <ROSection n={3} title="Eligibility">
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          <ROField label="Residency"     value={form.residency}                            status="locked"/>
          <ROField label="Min Age"       value={String(form.minAge)}                       status="locked"/>
          <ROField label="Min Occupancy" value={form.minOccupancy?String(form.minOccupancy):'—'} status={getO('minOccupancy')}/>
          <ROField label="Max Occupancy" value={form.maxOccupancy?String(form.maxOccupancy):'—'} status={getO('maxOccupancy')}/>
        </div>
        <ROField label="Advanced Purchase" value={form.advancedPurchase?`${form.advancedPurchase} days`:'No restriction'} status={getO('advancedPurchase')}/>
        <ROToggle label="Standby Eligible" helper="Allow standby booking."  value={form.standbyEligible} status={getO('standbyEligible')}/>
        <ROToggle label="Upgrade Eligible" helper="Allow cabin upgrades."   value={form.upgradeEligible} status={getO('upgradeEligible')}/>
        <ROToggle label="Coupon Eligible"  helper="Allow coupon codes."     value={form.couponEligible}  status={getO('couponEligible')}/>
      </ROSection>

      {/* 4. Channels */}
      <ROSection n={4} title="Channels & Access">
        <ROToggle label="Show in Cruise Control" helper="Internal CRM booking visibility." value={form.cruiseControlAccess} status={getO('cruiseControlAccess')}/>
        <ROField label="Distribution Channels" value={vis.length?vis.join(', '):'None'} status={getO('channelVisibility')}/>
        <div style={{ fontSize:12, color:T.inkFaint, padding:'8px 12px', background:T.fill, borderRadius:7, lineHeight:1.5 }}>
          <strong style={{ color:T.inkSoft }}>Visible:</strong> {vis.length?vis.join(', '):'None'} &nbsp;·&nbsp; <strong style={{ color:T.inkSoft }}>Hidden:</strong> {hid.length?hid.join(', '):'None'}
        </div>
      </ROSection>

      {/* 5. Marketing */}
      <ROSection n={5} title="Marketing & Messaging">
        <ROToggle label="Discount Message" value={form.includeDiscount} status={getO('includeDiscount')}/>
        {form.includeDiscount && <ROField label="Message Copy" value={form.discountMessage||'—'} status={getO('discountMessage')}/>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
          <ROField label="Primary Offer"   value={form.offerPrimary  ||'None'} status={getO('offerPrimary')}/>
          <ROField label="Secondary Offer" value={form.offerSecondary||'None'} status={getO('offerSecondary')}/>
          <ROField label="Tertiary Offer"  value={form.offerTertiary ||'None'} status={getO('offerTertiary')}/>
        </div>
      </ROSection>

      {/* 6. Taxes */}
      <ROSection n={6} title="Taxes & Privacy">
        <WarnBanner><span style={{ fontSize:12.5, color:T.amberDark, fontWeight:500, lineHeight:1.45 }}>These settings override core financial calculations. Use only for comp, crew, or special promotional fares.</span></WarnBanner>
        <ROToggle label="Waive All Government Taxes"         helper="Zeros out all government taxes."    value={form.waiveGovTaxes}  status={getO('waiveGovTaxes')}/>
        <ROToggle label="Waive All Cruise Expenses"          helper="Zeros out port fees and expenses."  value={form.waiveCruiseExp} status={getO('waiveCruiseExp')}/>
        <ROToggle label="Hide Fares on PDFs & Cruise Control" helper="Pricing hidden from confirmations." value={form.noFareDisplay}  status={getO('noFareDisplay')}/>
      </ROSection>

      {/* 7. Pricing */}
      <ROSection n={7} title="Pricing" action={
        <button ref={expandBtnRef} onClick={() => setPricingExpanded(true)} aria-label="Expand pricing table" title="Expand pricing table"
          style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.line}`, background:'#fff', color:T.inkSoft, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'background .12s, color .12s, border-color .12s' }}
          onMouseEnter={e => { e.currentTarget.style.background=T.fill; e.currentTarget.style.color=T.ink; e.currentTarget.style.borderColor='#CBD5E1'; }}
          onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color=T.inkSoft; e.currentTarget.style.borderColor=T.line; }}>
          <IcExpand/>
        </button>
      }>
        <div style={{ fontSize:12.5, color:T.inkSoft, lineHeight:1.45, marginTop:-4 }}>Fare <strong style={{ color:T.ink, fontWeight:600 }}>per guest</strong> in USD, by guest position and cabin category.</div>
        <PricingReadOnlyTable pricing={pricing}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'10px 14px', background:T.fill, borderRadius:8, border:`1px solid ${T.lineSoft}` }}>
          <span style={{ fontSize:12, color:T.inkSoft }}>Lead-in cabin fare <span style={{ color:T.inkFaint }}>· lowest category, 2 guests</span></span>
          <span style={{ fontSize:15, fontWeight:700, color:T.ink, fontFamily:"'SF Mono',Menlo,monospace" }}>{leadInLabel}</span>
        </div>
      </ROSection>
      {pricingExpanded && <PricingExpandedModal pricing={pricing} leadIn={leadInLabel} onClose={closeExpandedPricing}/>} 
    </div>
  );
}

/* ─────────────────────────────────────────────
   EDIT mode sections S1–S7
─────────────────────────────────────────────── */
function S1({ form, set, mode, errors, onFaretypeSelect }) {
  const [ftQ, setFtQ]       = useState('');
  const [ftOpen, setFtOpen] = useState(false);
  const ftRef = useRef();
  useEffect(() => {
    if (!ftOpen) return;
    const h = e => { if (ftRef.current && !ftRef.current.contains(e.target)) setFtOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [ftOpen]);
  const sailings   = form.ship ? (SHIPS_DATA[form.ship]||[]) : [];
  const filteredFTs = FT_DATA.filter(ft => ft.code.toLowerCase().includes(ftQ.toLowerCase()) || ft.basis.toLowerCase().includes(ftQ.toLowerCase()));
  const selFT  = FT_DATA.find(ft => ft.code === form.faretype);
  const locked = mode !== 'create';
  const LockNote = () => <span style={{ fontSize:11, color:T.inkFaint, marginTop:3, display:'flex', alignItems:'center', gap:4 }}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Locked after creation</span>;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div><h2 style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:4 }}>Ship &amp; Sailing</h2><p style={{ fontSize:13, color:T.inkSoft, lineHeight:1.5 }}>Select the ship, sailing, and parent faretype.</p></div>
      <Field label="Ship" required error={errors.ship}>
        <Sel value={form.ship} onChange={v => { set('ship',v); set('sailing',''); }} disabled={locked} err={errors.ship} opts={[['','Select ship…'],...Object.keys(SHIPS_DATA).map(s=>[s,s])]}/>
        {locked && <LockNote/>}
      </Field>
      <Field label="Sailing" required error={errors.sailing}>
        <Sel value={form.sailing} onChange={v => set('sailing',v)} disabled={locked||!form.ship} err={errors.sailing} opts={[['','Select sailing…'],...sailings.map(s=>[s,s])]}/>
        {locked && <LockNote/>}
      </Field>
      <Field label="Faretype" required helper={!locked?"Selecting a faretype auto-populates all inherited fields.":undefined} error={errors.faretype}>
        {locked ? (
          <div style={{ ...iS(false,true), display:'flex', alignItems:'center', gap:8 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:12.5, fontWeight:700 }}>{form.faretype}</span>
            {selFT && <span style={{ fontSize:11.5, color:T.inkSoft }}>· {selFT.basis} · {selFT.group}</span>}
          </div>
        ) : (
          <div ref={ftRef} style={{ position:'relative' }}>
            <div onClick={() => setFtOpen(true)} style={{ ...iS(!!errors.faretype,false), display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
              {selFT ? <><span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:12.5, fontWeight:700 }}>{form.faretype}</span><span style={{ fontSize:11.5, color:T.inkSoft }}>· {selFT.basis} · {selFT.group}</span></> : <span style={{ color:T.inkFaint }}>Search by code or basis…</span>}
            </div>
            {ftOpen && (
              <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:4, background:'#fff', border:`1px solid ${T.line}`, borderRadius:9, boxShadow:'0 8px 24px rgba(0,0,0,.1)', zIndex:600 }}>
                <div style={{ padding:'8px 12px', borderBottom:`1px solid ${T.lineSoft}`, display:'flex', gap:6, alignItems:'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input autoFocus value={ftQ} onChange={e => setFtQ(e.target.value)} placeholder="Search faretype…" style={{ border:'none', outline:'none', fontSize:13, color:T.ink, background:'transparent', width:'100%' }}/>
                </div>
                {filteredFTs.map(ft => (
                  <div key={ft.code} onClick={() => { onFaretypeSelect(ft); setFtOpen(false); setFtQ(''); }} style={{ padding:'10px 14px', cursor:'pointer', display:'flex', gap:8, alignItems:'center' }} onMouseEnter={e => e.currentTarget.style.background=T.fill} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    <span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:12.5, fontWeight:700, color:T.primary }}>{ft.code}</span>
                    <span style={{ fontSize:11.5, color:T.inkSoft }}>· {ft.basis}</span>
                    <span style={{ marginLeft:'auto', padding:'2px 7px', borderRadius:999, fontSize:10.5, fontWeight:600, background:T.primaryBg, color:T.primary }}>{ft.group}</span>
                  </div>
                ))}
                {filteredFTs.length===0 && <div style={{ padding:14, fontSize:13, color:T.inkFaint, textAlign:'center' }}>No match</div>}
              </div>
            )}
          </div>
        )}
      </Field>
      {form.faretype && !locked && (
        <div style={{ padding:'10px 14px', background:T.tealLight, border:`1px solid #A7F3D0`, borderRadius:8, fontSize:12.5, color:T.tealDark, display:'flex', gap:8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink:0, marginTop:1 }}><polyline points="20 6 9 17 4 12"/></svg>
          Fields auto-populated from <strong style={{ fontFamily:"'SF Mono',Menlo,monospace" }}>{form.faretype}</strong>.
        </div>
      )}
    </div>
  );
}
function S2({ form, set, overrides, toggleOverride, errors, policies }) {
  const hasFT = !!form.faretype;
  /* Options come from the live Policies module — active parent policies only. */
  const polOpts = (type, cur) => {
    const list = (policies || []).filter(g => g.type === type)
      .flatMap(g => g.parents.filter(p => p.status === 'Active').map(p => [p.name, `${p.code} · ${p.name}`]));
    if (cur && !list.some(o => o[0] === cur)) list.unshift([cur, cur]);
    return [['','Select…'], ...list];
  };
  const getS  = k => hasFT?(overrides[k]||'inherited'):'free';
  const isD   = k => hasFT && getS(k)!=='overridden';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div><h2 style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:4 }}>Policies</h2><p style={{ fontSize:13, color:T.inkSoft, lineHeight:1.5 }}>Cancellation and deposit policies. Inherited from faretype — override as needed.</p></div>
      <OField label="Cancellation Policy" required status={getS('cancellationPolicy')} error={errors.cancellationPolicy} onOverride={() => toggleOverride('cancellationPolicy')} onRevert={() => toggleOverride('cancellationPolicy')}>
        <Sel value={form.cancellationPolicy} onChange={v => set('cancellationPolicy',v)} dis={isD('cancellationPolicy')} err={errors.cancellationPolicy} opts={polOpts('cancel', form.cancellationPolicy)}/>
      </OField>
      <OField label="Deposit Policy" required status={getS('depositPolicy')} error={errors.depositPolicy} onOverride={() => toggleOverride('depositPolicy')} onRevert={() => toggleOverride('depositPolicy')}>
        <Sel value={form.depositPolicy} onChange={v => set('depositPolicy',v)} dis={isD('depositPolicy')} err={errors.depositPolicy} opts={polOpts('deposit', form.depositPolicy)}/>
      </OField>
    </div>
  );
}
function S3({ form, set, overrides, toggleOverride }) {
  const hasFT = !!form.faretype;
  const getS  = (k, noOvr=false) => noOvr?(hasFT?'locked':'free'):(hasFT?(overrides[k]||'inherited'):'free');
  const isD   = k => hasFT && getS(k)!=='overridden' && getS(k)!=='free';
  const FLAGS = [{ k:'standbyEligible',l:'Standby Eligible',h:'Allow standby booking.' },{ k:'upgradeEligible',l:'Upgrade Eligible',h:'Allow cabin upgrades.' },{ k:'couponEligible',l:'Coupon Eligible',h:'Allow coupon codes.' }];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div><h2 style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:4 }}>Eligibility</h2><p style={{ fontSize:13, color:T.inkSoft, lineHeight:1.5 }}>Residency and Min Age are set at the faretype level and cannot be overridden.</p></div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <OField label="Residency"    status={getS('residency',true)}    noOvr><Sel value={form.residency}    onChange={v => set('residency',v)}    dis={isD('residency')}    opts={[['Any','Any'],['US Only','US Only'],['Non-US','Non-US'],['Canada','Canada'],['UK','UK']]}/></OField>
        <OField label="Min Age"      status={getS('minAge',true)}       noOvr><input className="fi" type="number" style={iS(false,isD('minAge'))}       value={form.minAge}       disabled={isD('minAge')}       min={0} max={99}  onChange={e => set('minAge',e.target.value)}/></OField>
        <OField label="Min Occupancy" status={getS('minOccupancy')} onOverride={() => toggleOverride('minOccupancy')} onRevert={() => toggleOverride('minOccupancy')}><input className="fi" type="number" style={iS(false,isD('minOccupancy'))} value={form.minOccupancy} disabled={isD('minOccupancy')} placeholder="1" onChange={e => set('minOccupancy',e.target.value)}/></OField>
        <OField label="Max Occupancy" status={getS('maxOccupancy')} onOverride={() => toggleOverride('maxOccupancy')} onRevert={() => toggleOverride('maxOccupancy')}><input className="fi" type="number" style={iS(false,isD('maxOccupancy'))} value={form.maxOccupancy} disabled={isD('maxOccupancy')} placeholder="4" onChange={e => set('maxOccupancy',e.target.value)}/></OField>
      </div>
      <OField label="Advanced Purchase (days)" status={getS('advancedPurchase')} helper="Min days before sailing. Blank = no restriction." onOverride={() => toggleOverride('advancedPurchase')} onRevert={() => toggleOverride('advancedPurchase')}><input className="fi" type="number" style={iS(false,isD('advancedPurchase'))} value={form.advancedPurchase} disabled={isD('advancedPurchase')} onChange={e => set('advancedPurchase',e.target.value)}/></OField>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {FLAGS.map(({ k,l,h }) => (
          <div key={k} style={{ border:`1.5px solid ${overrides[k]==='overridden'?'#A7F3D0':'#E8EDF3'}`, borderRadius:8, padding:'11px 14px', background:isD(k)?'#F8FAFC':'#fff', transition:'all .15s' }}>
            <OTRow label={l} helper={h} on={form[k]} onChange={v => set(k,v)} status={getS(k)} onOverride={() => toggleOverride(k)} onRevert={() => toggleOverride(k)}/>
          </div>
        ))}
      </div>
    </div>
  );
}
function S4({ form, set, overrides, toggleOverride }) {
  const hasFT = !!form.faretype;
  const getS  = k => hasFT?(overrides[k]||'inherited'):'free';
  const chLocked = hasFT && getS('channelVisibility')!=='overridden';
  const CHS = [{ k:'chMVASB2C',l:'MVAS B2C' },{ k:'chMVASB2B',l:'MVAS B2B' },{ k:'chCC',l:'Cruise Control' },{ k:'chTradeAPI',l:'Trade API' },{ k:'chCRM',l:'CRM' },{ k:'chGroup',l:'Group' },{ k:'chInternal',l:'Internal' }];
  const vis = CHS.filter(c => form[c.k]).map(c => c.l);
  const hid = CHS.filter(c => !form[c.k]).map(c => c.l);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div><h2 style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:4 }}>Channels &amp; Access</h2><p style={{ fontSize:13, color:T.inkSoft, lineHeight:1.5 }}>Control where this farecode is visible and bookable.</p></div>
      <div style={{ border:`1.5px solid ${overrides.cruiseControlAccess==='overridden'?'#A7F3D0':'#E8EDF3'}`, borderRadius:8, padding:'11px 14px', background:hasFT&&getS('cruiseControlAccess')!=='overridden'?'#F8FAFC':'#fff' }}>
        <OTRow label="Show in Cruise Control" helper="Internal CRM booking visibility." on={form.cruiseControlAccess} onChange={v => set('cruiseControlAccess',v)} status={getS('cruiseControlAccess')} onOverride={() => toggleOverride('cruiseControlAccess')} onRevert={() => toggleOverride('cruiseControlAccess')}/>
      </div>
      <OField label="Distribution Channels" status={getS('channelVisibility')} onOverride={() => toggleOverride('channelVisibility')} onRevert={() => toggleOverride('channelVisibility')}>
        <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:4 }}>
          {CHS.map(c => (
            <div key={c.k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', border:`1.5px solid #E8EDF3`, borderRadius:7, background:chLocked?'#F8FAFC':'#fff' }}>
              <span style={{ fontSize:13, color:T.ink }}>{c.l}</span>
              <Toggle on={form[c.k]} onChange={v => set(c.k,v)} dis={chLocked}/>
            </div>
          ))}
        </div>
      </OField>
      <div style={{ fontSize:12, color:T.inkFaint, padding:'9px 12px', background:T.fill, borderRadius:7, border:`1px solid ${T.lineSoft}`, lineHeight:1.5 }}>
        <strong style={{ color:T.inkSoft }}>Visible:</strong> {vis.length?vis.join(', '):'None'} &nbsp;·&nbsp; <strong style={{ color:T.inkSoft }}>Hidden:</strong> {hid.length?hid.join(', '):'None'}
      </div>
    </div>
  );
}
function S5({ form, set, overrides, toggleOverride }) {
  const hasFT = !!form.faretype;
  const getS  = k => hasFT?(overrides[k]||'inherited'):'free';
  const isD   = k => hasFT && getS(k)!=='overridden';
  const OFFERS = [['','None'],['OFFER-2026-SPRING','OFFER-2026-SPRING'],['OFFER-2026-SUMMER','OFFER-2026-SUMMER'],['OFFER-CASINO-Q2','OFFER-CASINO-Q2']];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div><h2 style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:4 }}>Marketing &amp; Messaging</h2><p style={{ fontSize:13, color:T.inkSoft, lineHeight:1.5 }}>Attach discount messages and offers. All optional.</p></div>
      <div style={{ border:`1.5px solid ${overrides.includeDiscount==='overridden'?'#A7F3D0':'#E8EDF3'}`, borderRadius:8, padding:'11px 14px' }}>
        <OTRow label="Add Discount Message" on={form.includeDiscount} onChange={v => set('includeDiscount',v)} status={getS('includeDiscount')} onOverride={() => toggleOverride('includeDiscount')} onRevert={() => toggleOverride('includeDiscount')}/>
        {form.includeDiscount && (
          <div style={{ marginTop:12 }}>
            <OField label="Discount Message Copy" status={getS('discountMessage')} onOverride={() => toggleOverride('discountMessage')} onRevert={() => toggleOverride('discountMessage')}>
              <div style={{ position:'relative' }}>
                <textarea className="fi" style={{ ...iS(false,isD('discountMessage')), minHeight:72, resize:'vertical', lineHeight:1.6 }} value={form.discountMessage} disabled={isD('discountMessage')} maxLength={200} placeholder="e.g. Last-minute savings — book by Friday for 25% off" onChange={e => set('discountMessage',e.target.value)}/>
                <span style={{ position:'absolute', bottom:8, right:10, fontSize:11, color:T.inkFaint }}>{(form.discountMessage||'').length}/200</span>
              </div>
            </OField>
          </div>
        )}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
        {[['offerPrimary','Primary Offer'],['offerSecondary','Secondary Offer'],['offerTertiary','Tertiary Offer']].map(([k,l]) => (
          <OField key={k} label={l} status={getS(k)} onOverride={() => toggleOverride(k)} onRevert={() => toggleOverride(k)}>
            <Sel value={form[k]} onChange={v => set(k,v)} dis={isD(k)} opts={OFFERS}/>
          </OField>
        ))}
      </div>
    </div>
  );
}
function S6({ form, set, overrides, toggleOverride }) {
  const hasFT = !!form.faretype;
  const getS  = k => hasFT?(overrides[k]||'inherited'):'free';
  const ITEMS = [{ k:'waiveGovTaxes',l:'Waive All Government Taxes',h:'Zeros out all government taxes. Comp/crew only.' },{ k:'waiveCruiseExp',l:'Waive All Cruise Expenses',h:'Zeros out port fees and cruise expenses.' },{ k:'noFareDisplay',l:'Hide Fares on PDFs & Cruise Control',h:'Pricing hidden from confirmations and CRM view.' }];
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div><h2 style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:4 }}>Taxes &amp; Privacy</h2><p style={{ fontSize:13, color:T.inkSoft, lineHeight:1.5 }}>Advanced financial settings. Apply with care.</p></div>
      <WarnBanner><span style={{ fontSize:12.5, color:T.amberDark, fontWeight:500, lineHeight:1.45 }}>These settings override core financial calculations. Use only for comp, crew, or special promotional fares.</span></WarnBanner>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {ITEMS.map(({ k,l,h }) => (
          <div key={k} style={{ border:`1.5px solid ${form[k]?T.amberBorder:overrides[k]==='overridden'?'#A7F3D0':'#E8EDF3'}`, borderRadius:8, padding:'12px 14px', background:hasFT&&getS(k)!=='overridden'?'#F8FAFC':'#fff', transition:'all .15s' }}>
            <OTRow label={l} helper={h} on={form[k]} onChange={v => set(k,v)} status={getS(k)} onOverride={() => toggleOverride(k)} onRevert={() => toggleOverride(k)}/>
            {form[k] && <div style={{ marginTop:9, padding:'8px 11px', background:T.amberLight, border:`1px solid ${T.amberBorder}`, borderRadius:6, fontSize:11.5, color:T.amberDark }}>{h}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
function PricingEditorExpandedModal({ pricing, setPricing, errors, onClose, onColumnRemoved }) {
  const [newColumn, setNewColumn] = useState('');
  const [addError, setAddError] = useState('');
  const [pendingRemove, setPendingRemove] = useState(null);
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const addInputRef = useRef(null);
  const removeCancelRef = useRef(null);
  const cabins = Object.keys(pricing);
  const atLimit = cabins.length >= MAX_PRICING_COLUMNS;
  const fmtCur = n => new Intl.NumberFormat('en-US',{ minimumFractionDigits:2, maximumFractionDigits:2 }).format(n);
  const parseCur = v => parseFloat(String(v||'').replace(/[^0-9.]/g,'')) || 0;
  const val = (cabin,key) => parseCur(pricing[cabin][key]);
  const updatePrice = (cabin,key,value) => setPricing(p => ({ ...p, [cabin]:{ ...p[cabin], [key]:value } }));
  const formatPrice = (cabin,key) => { const n=val(cabin,key); if (n>0) updatePrice(cabin,key,fmtCur(n)); };
  const pGrid = `180px repeat(${cabins.length}, minmax(150px,1fr))`;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById('root');
    const previousAriaHidden = appRoot?.getAttribute('aria-hidden');
    document.body.style.overflow = 'hidden';
    appRoot?.setAttribute('aria-hidden','true');
    closeBtnRef.current?.focus();
    const onKey = e => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable?.length) return;
      const first=focusable[0], last=focusable[focusable.length-1];
      if (e.shiftKey && document.activeElement===first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement===last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown',onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousAriaHidden===null || previousAriaHidden===undefined) appRoot?.removeAttribute('aria-hidden'); else appRoot?.setAttribute('aria-hidden',previousAriaHidden);
      document.removeEventListener('keydown',onKey);
    };
  }, []);

  useEffect(() => {
    if (!pendingRemove) return;
    removeCancelRef.current?.focus();
    const onRemoveKey = e => {
      if (e.key !== 'Escape') return;
      e.preventDefault(); e.stopPropagation();
      setPendingRemove(null);
    };
    document.addEventListener('keydown',onRemoveKey,true);
    return () => document.removeEventListener('keydown',onRemoveKey,true);
  }, [pendingRemove]);

  const addColumn = () => {
    const name = newColumn.trim().replace(/\s+/g,' ');
    if (!name) { setAddError('Enter a category name.'); addInputRef.current?.focus(); return; }
    if (name.length>24) { setAddError('Use 24 characters or fewer.'); addInputRef.current?.focus(); return; }
    if (cabins.some(c => c.toLowerCase()===name.toLowerCase())) { setAddError('That category already exists.'); addInputRef.current?.focus(); return; }
    if (atLimit) { setAddError(`A maximum of ${MAX_PRICING_COLUMNS} categories is supported.`); return; }
    setPricing(p => ({ ...p, [name]:EMPTY_ROW() }));
    setNewColumn(''); setAddError('');
    requestAnimationFrame(() => addInputRef.current?.focus());
  };
  const removeColumn = name => {
    setPricing(p => Object.fromEntries(Object.entries(p).filter(([key]) => key!==name)));
    onColumnRemoved?.(name);
    setPendingRemove(null);
  };

  return ReactDOM.createPortal(
    <div onMouseDown={onClose} style={{ position:'fixed', inset:0, zIndex:1850, background:'rgba(15,23,42,.6)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pricing-editor-modal-title" tabIndex="-1" onMouseDown={e => e.stopPropagation()}
        style={{ position:'relative', width:'min(1360px, calc(100vw - 48px))', maxHeight:'calc(100vh - 48px)', background:'#fff', borderRadius:14, boxShadow:'0 28px 80px rgba(15,23,42,.32)', display:'flex', flexDirection:'column', outline:'none', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, padding:'18px 22px', borderBottom:`1px solid ${T.line}`, flexShrink:0 }}>
          <div><div id="pricing-editor-modal-title" style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:4 }}>Edit pricing matrix</div><div style={{ fontSize:12.5, color:T.inkSoft }}>Set fares per guest and manage custom cabin categories.</div></div>
          <button ref={closeBtnRef} onClick={onClose} aria-label="Close expanded pricing editor" title="Close" style={{ width:34, height:34, borderRadius:8, border:`1px solid ${T.line}`, background:'#fff', color:T.inkSoft, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 22px', background:T.fill, borderBottom:`1px solid ${T.line}`, flexShrink:0 }}>
          <div style={{ flex:'0 1 390px' }}>
            <div style={{ display:'flex', gap:8 }}>
              <input ref={addInputRef} value={newColumn} disabled={atLimit} maxLength={24} onChange={e => { setNewColumn(e.target.value); if(addError)setAddError(''); }} onKeyDown={e => { if(e.key==='Enter')addColumn(); }} placeholder="New category name, e.g. Veranda" aria-label="New pricing category name" style={{ ...iS(!!addError,atLimit), padding:'8px 11px' }}/>
              <button onClick={addColumn} disabled={atLimit} style={{ padding:'8px 14px', border:'none', borderRadius:7, background:atLimit?'#CBD5E1':T.primary, color:'#fff', fontSize:12.5, fontWeight:600, cursor:atLimit?'not-allowed':'pointer', whiteSpace:'nowrap' }}>+ Add column</button>
            </div>
            {addError && <div style={{ fontSize:11, color:T.red, marginTop:4 }}>{addError}</div>}
          </div>
          <div style={{ marginLeft:'auto', fontSize:11.5, color:T.inkFaint, paddingTop:9 }}>{cabins.length} of {MAX_PRICING_COLUMNS} categories · custom columns can be removed</div>
        </div>
        <div className="pscroll" style={{ padding:22, overflow:'auto', minHeight:0 }}>
          <div className="hscroll" style={{ border:`1px solid ${T.line}`, borderRadius:9, overflowX:'auto', background:'#fff' }}>
            <div style={{ minWidth:cabins.length*150+180 }}>
              <div style={{ display:'grid', gridTemplateColumns:pGrid, background:'#F7F9FC', borderBottom:`1px solid ${T.line}`, position:'sticky', top:0, zIndex:2 }}>
                <div style={{ padding:'11px 16px', fontSize:10, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px' }}>Guest Type</div>
                {cabins.map(cabin => { const custom=!SYSTEM_PRICING_CABINS.includes(cabin); return (
                  <div key={cabin} style={{ padding:'7px 10px', borderLeft:`1px solid ${T.lineSoft}`, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:7, minWidth:0, background:errors.pricing?.[cabin]?'#FFFBEB':'transparent' }}>
                    {errors.pricing?.[cabin] && <span title="Add at least one price" style={{ color:T.amber, fontSize:12 }}>!</span>}
                    <span title={cabin} style={{ fontSize:11, fontWeight:700, color:T.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cabin}</span>
                    {custom && <button onClick={() => setPendingRemove(cabin)} aria-label={`Remove ${cabin} column`} title={`Remove ${cabin}`} style={{ width:24, height:24, borderRadius:5, border:'none', background:'transparent', color:T.inkFaint, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6m3 0V4h8v2"/></svg></button>}
                  </div>
                ); })}
              </div>
              {GUEST_ROWS.map((group,gi) => <div key={group.grp}>
                <div style={{ display:'grid', gridTemplateColumns:pGrid, background:'#FAFBFD', borderBottom:`1px solid ${T.lineSoft}`, borderTop:gi?`1px solid ${T.lineSoft}`:'none' }}><div style={{ padding:'8px 16px', fontSize:9.5, fontWeight:700, color:T.inkFaint, textTransform:'uppercase', letterSpacing:'.6px', gridColumn:`span ${cabins.length+1}` }}>{group.grp}</div></div>
                {group.rows.map(row => <div key={row.k} style={{ display:'grid', gridTemplateColumns:pGrid, alignItems:'center', background:'#fff' }}>
                  <div style={{ padding:'10px 16px', fontSize:13, color:T.ink, whiteSpace:'nowrap' }}>{row.l}</div>
                  {cabins.map(cabin => <div key={cabin} style={{ padding:'5px 7px', borderLeft:`1px solid ${T.lineSoft}` }}><input value={pricing[cabin][row.k]} onChange={e => updatePrice(cabin,row.k,e.target.value)} onBlur={() => formatPrice(cabin,row.k)} placeholder="—" aria-label={`${cabin} ${row.l} price`} className="price-input" style={{ width:'100%', padding:'8px 10px', border:`1.5px solid ${T.line}`, borderRadius:6, fontSize:13, color:T.ink, background:'#fff', outline:'none', textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace" }}/></div>)}
                </div>)}
              </div>)}
              <div style={{ display:'grid', gridTemplateColumns:pGrid, alignItems:'center', borderTop:`1px solid ${T.line}`, background:T.fill }}>
                <div style={{ padding:'12px 16px', fontSize:11, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px' }}>Cabin · Double</div>
                {cabins.map(cabin => { const total=val(cabin,'dbl1')+val(cabin,'dbl2'); return <div key={cabin} style={{ padding:'12px 16px', fontSize:13, fontWeight:700, textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace", color:total?T.ink:T.inkFaint, borderLeft:`1px solid ${T.lineSoft}` }}>{total?fmtCur(total):'—'}</div>; })}
              </div>
            </div>
          </div>
        </div>
        {pendingRemove && <div style={{ position:'absolute', inset:0, zIndex:30, background:'rgba(15,23,42,.44)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} onMouseDown={() => setPendingRemove(null)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="remove-pricing-column-title" onMouseDown={e => e.stopPropagation()} style={{ width:390, background:'#fff', borderRadius:12, padding:24, boxShadow:'0 20px 50px rgba(15,23,42,.25)' }}>
            <div id="remove-pricing-column-title" style={{ fontSize:16, fontWeight:700, color:T.ink, marginBottom:7 }}>Remove “{pendingRemove}”?</div>
            <div style={{ fontSize:13, color:T.inkSoft, lineHeight:1.55, marginBottom:20 }}>This removes the custom category and every price entered in it. The removal is final after you save the farecode.</div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}><button ref={removeCancelRef} onClick={() => setPendingRemove(null)} style={{ padding:'8px 14px', border:`1px solid ${T.line}`, borderRadius:7, background:'#fff', color:T.inkSoft, fontSize:12.5, fontWeight:600, cursor:'pointer' }}>Cancel</button><button onClick={() => removeColumn(pendingRemove)} style={{ padding:'8px 14px', border:'none', borderRadius:7, background:T.red, color:'#fff', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>Remove column</button></div>
          </div>
        </div>}
      </div>
    </div>, document.body
  );
}

function S7({ pricing, setPricing, errors, setErrors }) {
  const CABINS = Object.keys(pricing);
  const [expanded, setExpanded] = useState(false);
  const [copyOpen, setCopyOpen] = useState(null);
  const expandBtnRef = useRef(null);
  const copyRef = useRef();
  useEffect(() => {
    if (!copyOpen) return;
    const h = e => { if (copyRef.current && !copyRef.current.contains(e.target)) setCopyOpen(null); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [copyOpen]);
  function fmtCur(n) { return new Intl.NumberFormat('en-US',{ minimumFractionDigits:2, maximumFractionDigits:2 }).format(n); }
  function parseCur(v) { return parseFloat(String(v||'').replace(/[^0-9.]/g,'')) || 0; }
  const val = (cab,k) => parseCur(pricing[cab][k]);
  const isPriced = cab => GUEST_KEYS.some(k => val(cab,k) > 0);
  function upd(cabin, k, v) { setPricing(p => ({ ...p, [cabin]:{ ...p[cabin], [k]:v } })); }
  function blur(cabin, k) { const n = parseCur(pricing[cabin][k]); if (n>0) upd(cabin,k,fmtCur(n)); }
  function copyCol(from, to) { setPricing(p => ({ ...p, [to]:{ ...p[from] } })); setCopyOpen(null); }
  function closeExpanded() { setExpanded(false); requestAnimationFrame(() => expandBtnRef.current?.focus()); }
  function clearRemovedError(name) {
    setErrors?.(p => {
      if (!p.pricing?.[name]) return p;
      const pricingErrors={ ...p.pricing }; delete pricingErrors[name];
      const next={ ...p };
      if (Object.keys(pricingErrors).length) next.pricing=pricingErrors; else delete next.pricing;
      return next;
    });
  }
  const PGRID = `120px repeat(${CABINS.length}, minmax(106px,1fr))`;
  const nPriced = CABINS.filter(isPriced).length;
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
        <div><h2 style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:4 }}>Pricing</h2><p style={{ fontSize:13, color:T.inkSoft, lineHeight:1.5 }}>Set the fare <strong style={{ color:T.ink, fontWeight:600 }}>per guest</strong> for each guest position and cabin category. Each cabin needs at least one price to activate.</p></div>
        <button ref={expandBtnRef} onClick={() => setExpanded(true)} aria-label="Expand pricing editor" title="Expand pricing editor" style={{ width:32, height:32, borderRadius:7, border:`1px solid ${T.line}`, background:'#fff', color:T.inkSoft, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }} onMouseEnter={e => { e.currentTarget.style.background=T.fill; e.currentTarget.style.color=T.ink; }} onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color=T.inkSoft; }}><IcExpand/></button>
      </div>
      <div className="hscroll" style={{ border:`1px solid ${T.line}`, borderRadius:9, overflowX:'auto' }}>
        <div style={{ minWidth:CABINS.length*106+120 }}>
          {/* Column header: cabin categories + copy action */}
          <div style={{ display:'grid', gridTemplateColumns:PGRID, background:'#F7F9FC', borderBottom:`1px solid ${T.line}` }}>
            <div style={{ padding:'8px 10px', fontSize:10, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px' }}>Guest Type</div>
            {CABINS.map(cabin => {
              const hasErr = errors.pricing?.[cabin];
              const others = CABINS.filter(c => c !== cabin);
              return (
                <div key={cabin} style={{ padding:'5px 8px', borderLeft:`1px solid ${T.lineSoft}`, display:'flex', alignItems:'center', justifyContent:'flex-end', gap:5, position:'relative', background:hasErr?'#FFFBEB':'transparent' }} ref={copyOpen===cabin?copyRef:null}>
                  {hasErr && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth="2.5" style={{ flexShrink:0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>}
                  <span style={{ fontSize:10.5, fontWeight:700, color:T.ink, lineHeight:1.3, textAlign:'right' }}>{cabin}</span>
                  <button onClick={() => setCopyOpen(copyOpen===cabin?null:cabin)} title={`Copy ${cabin} prices to another category`}
                    style={{ width:20, height:20, borderRadius:4, border:`1px solid ${T.line}`, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.inkFaint, flexShrink:0 }}
                    onMouseEnter={e => { e.currentTarget.style.background=T.fill; e.currentTarget.style.color=T.ink; }}
                    onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color=T.inkFaint; }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                  {copyOpen===cabin && (
                    <div style={{ position:'absolute', right:4, top:'100%', marginTop:3, background:'#fff', border:`1px solid ${T.line}`, borderRadius:8, boxShadow:'0 8px 20px rgba(0,0,0,.1)', zIndex:500, minWidth:150, overflow:'hidden' }}>
                      <div style={{ padding:'6px 12px', fontSize:10, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px', borderBottom:`1px solid ${T.lineSoft}` }}>Copy to…</div>
                      {others.map(to => (
                        <div key={to} onClick={() => copyCol(cabin,to)} style={{ padding:'8px 12px', fontSize:12.5, color:T.ink, cursor:'pointer', whiteSpace:'nowrap' }} onMouseEnter={e => e.currentTarget.style.background=T.fill} onMouseLeave={e => e.currentTarget.style.background='transparent'}>{to}</div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {/* Grouped guest-position rows */}
          {GUEST_ROWS.map((g, gi) => (
            <div key={g.grp}>
              <div style={{ display:'grid', gridTemplateColumns:PGRID, background:'#FAFBFD', borderBottom:`1px solid ${T.lineSoft}`, borderTop:gi>0?`1px solid ${T.lineSoft}`:'none' }}>
                <div style={{ padding:'6px 10px', fontSize:9.5, fontWeight:700, color:T.inkFaint, textTransform:'uppercase', letterSpacing:'.6px', gridColumn:`span ${CABINS.length+1}` }}>{g.grp}</div>
              </div>
              {g.rows.map(r => (
                <div key={r.k} style={{ display:'grid', gridTemplateColumns:PGRID, alignItems:'center', background:'#fff' }}>
                  <div style={{ padding:'7px 10px', fontSize:12.5, color:T.ink, whiteSpace:'nowrap' }}>{r.l}</div>
                  {CABINS.map(cabin => (
                    <div key={cabin} style={{ padding:'4px', borderLeft:`1px solid ${T.lineSoft}` }}>
                      <input type="text" value={pricing[cabin][r.k]} onChange={e => upd(cabin,r.k,e.target.value)} onBlur={() => blur(cabin,r.k)} placeholder="—" className="price-input"
                        style={{ width:'100%', padding:'6px 7px', border:`1.5px solid #E2E8F0`, borderRadius:6, fontSize:12, color:T.ink, background:'#fff', outline:'none', textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace" }}/>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
          {/* Footer: double-occupancy cabin fare */}
          <div style={{ display:'grid', gridTemplateColumns:PGRID, alignItems:'center', borderTop:`1px solid ${T.line}`, background:T.fill }}>
            <div style={{ padding:'9px 10px', fontSize:11, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px' }}>Cabin · Double</div>
            {CABINS.map(cabin => {
              const t = val(cabin,'dbl1')+val(cabin,'dbl2');
              return <div key={cabin} style={{ padding:'9px 10px', fontSize:12.5, fontWeight:700, textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace", color:t>0?T.ink:T.inkFaint, borderLeft:`1px solid ${T.lineSoft}` }}>{t>0?fmtCur(t):'—'}</div>;
            })}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'10px 14px', background:T.fill, borderRadius:8, border:`1px solid ${T.lineSoft}` }}>
        {errors.pricing ? <span style={{ fontSize:12, color:T.amber, display:'flex', alignItems:'center', gap:5 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>All cabins need at least one price to activate.</span> : <span style={{ fontSize:12, color:T.inkFaint }}>Tip: expand the matrix to add a custom category or copy prices.</span>}
        <span style={{ fontSize:12, color:T.inkSoft, whiteSpace:'nowrap' }}>{nPriced} of {CABINS.length} categories priced</span>
      </div>
      {expanded && <PricingEditorExpandedModal pricing={pricing} setPricing={setPricing} errors={errors} onClose={closeExpanded} onColumnRemoved={clearRemovedError}/>} 
    </div>
  );
}

/* ── List data ── */
const INIT_DATA = [
  { id:1,  code:'FC-20101', ship:'Island Escape',  sailing:'IS-2026-09-01', cabins:['Interior','Balcony'],                               faretype:'FT-00101', status:'Active',   mod:'12 Jun 2026' },
  { id:2,  code:'FC-20102', ship:'Island Escape',  sailing:'IS-2026-10-15', cabins:['Ocean View'],                                        faretype:'FT-00101', status:'Active',   mod:'10 Jun 2026' },
  { id:3,  code:'FC-20103', ship:'Island Escape',  sailing:'IS-2026-11-20', cabins:['Interior','Suite'],                                  faretype:'FT-00101', status:'Active',   mod:'08 Jun 2026' },
  { id:4,  code:'FC-20104', ship:'Paradise Bay',   sailing:'PB-2026-08-05', cabins:['Interior','Ocean View','Balcony','Veranda','Suite'], faretype:'FT-00102', status:'Draft',    mod:'14 Jun 2026' },
  { id:5,  code:'FC-20105', ship:'Paradise Bay',   sailing:'PB-2026-09-10', cabins:['Balcony','Veranda'],                                 faretype:'FT-00101', status:'Inactive', mod:'06 Jun 2026' },
  { id:6,  code:'FC-20106', ship:'Island Escape',  sailing:'IS-2026-12-05', cabins:['Interior','Ocean View','Balcony'],                  faretype:'FT-00103', status:'Active',   mod:'11 Jun 2026' },
  { id:7,  code:'FC-20107', ship:'Paradise Bay',   sailing:'PB-2026-10-20', cabins:['Suite','Penthouse'],                                 faretype:'FT-00102', status:'Active',   mod:'09 Jun 2026' },
  { id:8,  code:'FC-20108', ship:'Northern Star',  sailing:'NS-2026-09-15', cabins:['Interior','Balcony','Suite'],                       faretype:'FT-00101', status:'Active',   mod:'07 Jun 2026' },
  { id:9,  code:'FC-20109', ship:'Northern Star',  sailing:'NS-2026-10-01', cabins:['Ocean View','Veranda'],                             faretype:'FT-00103', status:'Draft',    mod:'05 Jun 2026' },
  { id:10, code:'FC-20110', ship:'Island Escape',  sailing:'IS-2026-08-20', cabins:['Balcony','Suite','Penthouse'],                      faretype:'FT-00102', status:'Active',   mod:'04 Jun 2026' },
].map(r => ({ ...r, ...sailDates(r.sailing) }));
const SHIPS       = ['Island Escape','Paradise Bay','Northern Star'];
const CABIN_CATS  = ['Interior','Ocean View','Balcony','Veranda','Suite','Penthouse'];
const FARETYPES   = ['FT-00101','FT-00102','FT-00103'];
const ALL_SAILINGS = [...new Set(INIT_DATA.map(r => r.sailing))].sort();
const PAGE_SIZE   = 10;
const CHIP_S = { 'Interior':{ bg:'#EEF2FF',color:'#3730A3' }, 'Ocean View':{ bg:'#ECFEFF',color:'#0E7490' }, 'Balcony':{ bg:'#F0FDF4',color:'#166534' }, 'Veranda':{ bg:'#FFF7ED',color:'#C2410C' }, 'Suite':{ bg:'#FDF4FF',color:'#7E22CE' }, 'Penthouse':{ bg:'#FFF1F2',color:'#9F1239' } };
const STATUS_S = { Active:{ bg:'#ECFDF5',color:'#065F46',dot:'#10B981' }, Draft:{ bg:'#FFFBEB',color:'#92400E',dot:'#F59E0B' }, Inactive:{ bg:'#F8FAFC',color:'#475569',dot:'#94A3B8' } };

const SECTS = [{ n:1,l:'Ship & Sailing' },{ n:2,l:'Policies' },{ n:3,l:'Eligibility' },{ n:4,l:'Channels & Access' },{ n:5,l:'Marketing' },{ n:6,l:'Taxes & Privacy' },{ n:7,l:'Pricing' }];
function sComplete(n, form, pricing) {
  if (n===1) return !!(form.ship && form.sailing && form.faretype);
  if (n===2) return !!(form.cancellationPolicy && form.depositPolicy);
  if (n>=3 && n<=6) return !!form.faretype;
  if (n===7) return Object.values(pricing).some(r => Object.values(r).some(v => v!==''));
  return false;
}
function sHasErr(n, errors) {
  if (n===1) return !!(errors.ship||errors.sailing||errors.faretype);
  if (n===2) return !!(errors.cancellationPolicy||errors.depositPolicy);
  if (n===7) return !!errors.pricing;
  return false;
}

/* ── Shared UI atoms ── */
function StatusBadge({ status }) {
  const s = STATUS_S[status] || STATUS_S.Inactive;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:999, fontSize:11.5, fontWeight:600, background:s.bg, color:s.color, whiteSpace:'nowrap' }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>{status}
    </span>
  );
}
function CabinChip({ cat }) {
  const s = CHIP_S[cat] || { bg:T.fill, color:T.inkSoft };
  return <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:999, fontSize:11.5, fontWeight:500, background:s.bg, color:s.color, whiteSpace:'nowrap' }}>{cat}</span>;
}
function CabinsCell({ cabins }) {
  const shown = cabins.slice(0,2); const rest = cabins.length-2;
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'nowrap' }}>
      {shown.map(c => <CabinChip key={c} cat={c}/>)}
      {rest>0 && <span style={{ fontSize:11.5, color:T.inkFaint, padding:'2px 7px', borderRadius:999, background:T.fill }}>+{rest}</span>}
    </div>
  );
}
function IcSearch() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IcChevron({ up }) { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points={up?"18 15 12 9 6 15":"6 9 12 15 18 9"}/></svg>; }
function useDropdown() {
  const [open, setOpen] = useState(false); const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return [open, setOpen, ref];
}

/* ── Section nav (edit mode) ── */
function PanelNav({ active, onNav, form, pricing, errors, visited }) {
  const pct = Math.round(SECTS.filter(s => sComplete(s.n,form,pricing)).length/7*100);
  return (
    <div style={{ width:196, flexShrink:0, background:T.navFill, borderRight:`1px solid ${T.line}`, display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, padding:'16px 0 0', overflowY:'auto' }}>
        {SECTS.map(({ n,l }) => {
          const isAct=active===n, done=!isAct&&sComplete(n,form,pricing)&&(visited.has(n)||n<=2), hasErr=sHasErr(n,errors);
          return (
            <div key={n} onClick={() => onNav(n)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', cursor:'pointer', position:'relative', transition:'background .12s' }}
              onMouseEnter={e => { if(!isAct) e.currentTarget.style.background='rgba(27,36,52,.04)'; }}
              onMouseLeave={e => { if(!isAct) e.currentTarget.style.background='transparent'; }}>
              {isAct && <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:T.primary, borderRadius:'0 2px 2px 0' }}/>}
              <div style={{ width:24, height:24, borderRadius:'50%', background:isAct||done?T.primary:'transparent', border:isAct||done?'none':`2px solid ${hasErr?T.amber:'#CBD5E1'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all .2s' }}>
                {done&&!hasErr ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : <span style={{ fontSize:9, fontWeight:800, color:isAct||done?'#fff':hasErr?T.amber:T.inkFaint }}>{String(n).padStart(2,'0')}</span>}
              </div>
              <span style={{ fontSize:12, fontWeight:isAct?700:500, color:isAct?T.ink:hasErr?T.amber:T.inkSoft, lineHeight:1.3 }}>{l}</span>
            </div>
          );
        })}
      </div>
      <div style={{ padding:'12px 14px', borderTop:`1px solid ${T.line}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
          <span style={{ fontSize:9.5, fontWeight:700, color:T.inkFaint, textTransform:'uppercase', letterSpacing:'.6px' }}>Completion</span>
          <span style={{ fontSize:11, fontWeight:700, color:pct===100?T.primary:T.inkSoft }}>{pct}%</span>
        </div>
        <div style={{ height:4, background:'#E8EDF3', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${pct}%`, background:T.primary, borderRadius:3, transition:'width .4s ease' }}/>
        </div>
      </div>
    </div>
  );
}

/* ── Audit log tab ── */
function AuditLogTab() {
  return (
    <div>
      <div style={{ fontSize:13, color:T.inkSoft, marginBottom:16 }}>{MOCK_AUDIT.length} recorded events — newest first</div>
      <div style={{ border:`1px solid ${T.line}`, borderRadius:9, overflow:'hidden', background:T.panel }}>
        {MOCK_AUDIT.map((ev, i) => (
          <div key={i} style={{ display:'flex', gap:14, padding:'14px 18px', borderBottom:i<MOCK_AUDIT.length-1?`1px solid ${T.lineSoft}`:'none' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:4, flexShrink:0 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:ev.color, flexShrink:0 }}/>
              {i<MOCK_AUDIT.length-1 && <div style={{ width:1, flex:1, background:T.lineSoft, marginTop:5 }}/>}
            </div>
            <div style={{ flex:1, minHeight:44 }}>
              <div style={{ fontSize:13, fontWeight:600, color:T.ink, marginBottom:3 }}>{ev.event}</div>
              <div style={{ fontSize:12.5, color:T.inkSoft, marginBottom:6, lineHeight:1.5 }}>{ev.detail}</div>
              <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                <span style={{ fontSize:11.5, color:T.inkFaint }}>{ev.ts}</span>
                <span style={{ color:T.lineSoft }}>·</span>
                <span style={{ fontSize:11.5, color:T.inkFaint }}>{ev.editor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   FARECODE PANEL — main component
   mode: 'create' | 'view'
   viewRow: the farecode record (view mode only)
   initialEdit: open directly in edit mode
══════════════════════════════════════════════ */
function FarecodePanel({ mode, viewRow, initialEdit, inline, onClose, policies }) {
  const buildForm = () => {
    if (mode==='view' && viewRow) {
      const ft = FT_DATA.find(f => f.code===viewRow.faretype);
      return { ...DEFAULT_FORM(), ship:viewRow.ship, sailing:viewRow.sailing, faretype:viewRow.faretype, ...(ft?.vals||{}) };
    }
    return DEFAULT_FORM();
  };
  const buildOvrd = () => {
    if (mode==='view') return { ...DEFAULT_OVRD(), cancellationPolicy:'overridden', minOccupancy:'overridden' };
    return DEFAULT_OVRD();
  };
  const buildPricing = () => {
    if (mode==='view') return {
      'Interior':  { single:'1,689.00', dbl1:'1,299.00', dbl2:'1,299.00', adult3:'899.00',   adult4:'849.00',   child3:'649.00',   child4:'599.00',   infant3:'199.00', infant4:'199.00' },
      'Ocean View':{ single:'2,209.00', dbl1:'1,699.00', dbl2:'1,699.00', adult3:'999.00',   adult4:'949.00',   child3:'699.00',   child4:'',         infant3:'199.00', infant4:'' },
      'Balcony':   { single:'2,729.00', dbl1:'2,099.00', dbl2:'2,099.00', adult3:'1,149.00', adult4:'1,099.00', child3:'799.00',   child4:'749.00',   infant3:'249.00', infant4:'249.00' },
      'Suite':     { single:'4,549.00', dbl1:'3,499.00', dbl2:'3,499.00', adult3:'1,699.00', adult4:'1,649.00', child3:'1,199.00', child4:'1,149.00', infant3:'299.00', infant4:'299.00' },
    };
    return DEFAULT_PRICING();
  };

  const [isEditing,   setIsEditing]   = useState(mode==='create' || !!initialEdit);
  const [activeTab,   setActiveTab]   = useState('overview');
  const [form,        setForm]        = useState(buildForm);
  const [overrides,   setOverrides]   = useState(buildOvrd);
  const [pricing,     setPricing]     = useState(buildPricing);
  const [active,      setActive]      = useState(1);
  const [visited,     setVisited]     = useState(new Set([1]));
  const [errors,      setErrors]      = useState({});
  const [saved,       setSaved]       = useState(false);
  const [savedDraft,  setSavedDraft]  = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [discardCb,   setDiscardCb]   = useState(null);
  const [mounted,     setMounted]     = useState(false);
  const snapRef = useRef(null);

  useEffect(() => {
    snapRef.current = JSON.stringify(form) + JSON.stringify(pricing);
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const set         = (k,v) => setForm(p => ({ ...p, [k]:v }));
  const navTo       = n => { setActive(n); setVisited(p => new Set([...p,n])); setErrors({}); };
  const isDirty     = () => snapRef.current !== (JSON.stringify(form)+JSON.stringify(pricing));
  const onFTSelect  = ft => { setForm(p => ({ ...p, faretype:ft.code, ...ft.vals })); setOverrides(DEFAULT_OVRD()); };
  const toggleOvrd  = k  => setOverrides(p => ({ ...p, [k]:p[k]==='overridden'?'inherited':'overridden' }));

  const guardDirty = cb => {
    if (isDirty()) { setDiscardCb(() => cb); setShowDiscard(true); }
    else cb();
  };
  const handleClose     = () => guardDirty(onClose);
  const handleCancel    = () => guardDirty(() => { setIsEditing(false); setErrors({}); setForm(buildForm()); setOverrides(buildOvrd()); setPricing(buildPricing()); });
  const handleEnterEdit = () => { snapRef.current = JSON.stringify(form)+JSON.stringify(pricing); setIsEditing(true); setActiveTab('overview'); };

  const validate = full => {
    const e = {};
    if (!form.ship)    e.ship    = 'Required';
    if (!form.sailing) e.sailing = 'Required';
    if (!form.faretype) e.faretype = 'Required';
    if (full) {
      if (!form.cancellationPolicy) e.cancellationPolicy = 'Required';
      if (!form.depositPolicy)      e.depositPolicy      = 'Required';
      const pErr = {};
      Object.entries(pricing).forEach(([cab,row]) => { if (!Object.values(row).some(v=>v&&v!=='')) pErr[cab]=true; });
      if (Object.keys(pErr).length) e.pricing = pErr;
    }
    return e;
  };

  const handleSaveDraft = () => {
    const e = validate(false);
    if (Object.keys(e).length) { setErrors(e); setActive(1); return; }
    setSavedDraft(true); setTimeout(() => setSavedDraft(false), 2200);
  };
  const handleActivate = () => {
    const e = validate(true);
    if (Object.keys(e).length) { setErrors(e); if (e.ship||e.sailing||e.faretype) setActive(1); else if (e.cancellationPolicy||e.depositPolicy) setActive(2); else if (e.pricing) setActive(7); return; }
    setSaved(true); setTimeout(() => { setSaved(false); onClose(); }, 1500);
  };
  const handleSaveChanges = () => {
    const e = validate(true);
    if (Object.keys(e).length) { setErrors(e); if (e.pricing) setActive(7); return; }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      snapRef.current = JSON.stringify(form)+JSON.stringify(pricing);
      setIsEditing(false); setErrors({});
    }, 1000);
  };

  const sectProps = { form, set, overrides, toggleOverride:toggleOvrd, errors, policies };
  const selFT = FT_DATA.find(ft => ft.code === form.faretype);
  const showSectionNav = isEditing && activeTab==='overview';

  const content = (
    <>
        {/* ─── Header ─── */}
        <div style={{ padding:'16px 24px 0', borderBottom:`1px solid ${T.line}`, flexShrink:0, background:T.panel }}>
          {/* Top row: icon + identity + action buttons */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, gap:12 }}>
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', minWidth:0 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:T.primary, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                  {mode==='create' ? <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></> : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>}
                </svg>
              </div>
              <div style={{ minWidth:0 }}>
                {/* Title */}
                <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:5 }}>
                  {mode==='create' ? 'Create Farecode' : 'Farecode details'}
                </div>
                {/* Identity: code + status + faretype */}
                {mode==='view' && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                    <span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:13.5, fontWeight:800, color:T.ink }}>{viewRow?.code}</span>
                    <StatusBadge status={viewRow?.status||'Draft'}/>
                    <span style={{ fontSize:12, color:T.inkFaint }}>·</span>
                    <span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:12.5, fontWeight:600, color:T.tealDark, cursor:'pointer' }}>{form.faretype}</span>
                    {selFT && <span style={{ fontSize:11.5, color:T.inkFaint }}>· {selFT.basis}</span>}
                  </div>
                )}
                {/* Meta line: ship · sailing · modified · editor */}
                {mode==='view' && (
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap', fontSize:12, color:T.inkFaint }}>
                    <span>{viewRow?.ship}</span><span>·</span>
                    <span style={{ fontFamily:"'SF Mono',Menlo,monospace" }}>{viewRow?.sailing}</span><span>·</span>
                    <span>Modified {viewRow?.mod}</span><span>·</span>
                    <span>jane.doe@mvas.com</span>
                  </div>
                )}
                {mode==='create' && <div style={{ fontSize:12, color:T.inkFaint }}>New farecode from blank</div>}
              </div>
            </div>

            {/* Right action buttons */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              {savedDraft && <span style={{ fontSize:12, color:T.tealDark, display:'flex', alignItems:'center', gap:5 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><polyline points="20 6 9 17 4 12"/></svg>Draft saved</span>}
              {saved      && <span style={{ fontSize:12, color:T.tealDark, display:'flex', alignItems:'center', gap:5 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><polyline points="20 6 9 17 4 12"/></svg>{mode==='create'?'Activated!':'Saved!'}</span>}

              {/* View mode: show Edit button */}
              {mode==='view' && !isEditing && (
                <button onClick={handleEnterEdit} style={{ padding:'7px 15px', border:'none', borderRadius:7, background:T.primary, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 1px 4px rgba(27,36,52,.2)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit
                </button>
              )}
              {/* View mode editing: Cancel + Save Changes */}
              {mode==='view' && isEditing && (
                <>
                  <button onClick={handleCancel} style={{ padding:'7px 14px', border:`1.5px solid ${T.line}`, borderRadius:7, background:'#fff', fontSize:13, fontWeight:500, color:T.inkSoft, cursor:'pointer' }}>Cancel</button>
                  <button onClick={handleSaveChanges} style={{ padding:'7px 15px', border:'none', borderRadius:7, background:T.primary, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 1px 4px rgba(27,36,52,.2)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Save Changes
                  </button>
                </>
              )}
              {/* Create mode: Save Draft + Activate */}
              {mode==='create' && (
                <>
                  <button onClick={handleSaveDraft} style={{ padding:'7px 14px', border:`1.5px solid ${T.line}`, borderRadius:7, background:'#fff', fontSize:13, fontWeight:600, color:T.inkSoft, cursor:'pointer' }}>Save as Draft</button>
                  <button onClick={handleActivate} style={{ padding:'7px 15px', border:'none', borderRadius:7, background:T.primary, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 1px 4px rgba(27,36,52,.2)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Activate
                  </button>
                </>
              )}
              {/* Close */}
              <button onClick={handleClose} style={{ width:32, height:32, borderRadius:7, border:`1.5px solid ${T.line}`, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.inkSoft }}
                onMouseEnter={e => { e.currentTarget.style.background=T.fill; e.currentTarget.style.color=T.ink; }}
                onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color=T.inkSoft; }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          {/* Tab bar (view mode only) */}
          {mode==='view' && (
            <div style={{ display:'flex', gap:0, marginBottom:-1 }}>
              {[{ k:'overview',l:'Overview' },{ k:'auditlog',l:'History',badge:MOCK_AUDIT.length }].map(tab => (
                <button key={tab.k} onClick={() => setActiveTab(tab.k)}
                  style={{ background:'none', border:'none', padding:'0 18px 12px 0', fontSize:13.5, fontWeight:activeTab===tab.k?600:500, color:activeTab===tab.k?T.ink:T.inkFaint, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7, borderBottom:activeTab===tab.k?`2px solid ${T.primary}`:'2px solid transparent', transition:'color .12s' }}>
                  {tab.l}
                  {tab.badge!==undefined && <span style={{ fontSize:11.5, fontWeight:600, padding:'1px 6px', borderRadius:999, background:activeTab===tab.k?T.primaryBg:'transparent', color:activeTab===tab.k?T.primary:T.inkFaint }}>{tab.badge}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── Body ─── */}
        <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
          {/* Section nav (edit/create mode, overview only) */}
          {showSectionNav && (
            <PanelNav active={active} onNav={navTo} form={form} pricing={pricing} errors={errors} visited={visited}/>
          )}
          {mode==='create' && !isEditing && null}

          {/* Scrollable content */}
          <div className="pscroll" style={{ flex:1, overflowY:'auto', padding:'26px 30px 100px', background: (!isEditing && mode==='view') ? '#EFF3F8' : T.panel }}>
            {/* OVERVIEW tab */}
            {(mode==='create' || activeTab==='overview') && (
              <>
                {/* Read-only overview */}
                {mode==='view' && !isEditing && (
                  <OverviewReadOnly form={form} overrides={overrides} pricing={pricing}/>
                )}
                {/* Edit sections (create or view-edit) */}
                {isEditing && (
                  <div style={{ maxWidth:780 }}>
                    {active===1 && <S1 {...sectProps} onFaretypeSelect={onFTSelect} mode={mode}/>}
                    {active===2 && <S2 {...sectProps}/>}
                    {active===3 && <S3 {...sectProps}/>}
                    {active===4 && <S4 {...sectProps}/>}
                    {active===5 && <S5 {...sectProps}/>}
                    {active===6 && <S6 {...sectProps}/>}
                    {active===7 && <S7 pricing={pricing} setPricing={setPricing} errors={errors} setErrors={setErrors}/>} 
                  </div>
                )}
              </>
            )}

            {/* AUDIT LOG tab */}
            {mode==='view' && activeTab==='auditlog' && <AuditLogTab/>}
          </div>
        </div>

        {/* ─── Footer (edit/create mode only, overview tab) ─── */}
        {isEditing && activeTab==='overview' && (
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 22px', background:T.panel, borderTop:`1px solid ${T.line}`, display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:10 }}>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => active>1 && navTo(active-1)} disabled={active===1}
                style={{ padding:'7px 14px', border:`1.5px solid ${T.line}`, borderRadius:7, background:'#fff', fontSize:13, fontWeight:500, color:active===1?T.inkFaint:T.inkSoft, cursor:active===1?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:5 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>Prev
              </button>
              <button onClick={() => active<7 && navTo(active+1)} disabled={active===7}
                style={{ padding:'7px 14px', border:`1.5px solid ${T.line}`, borderRadius:7, background:'#fff', fontSize:13, fontWeight:500, color:active===7?T.inkFaint:T.inkSoft, cursor:active===7?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:5 }}>
                Next<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            {Object.keys(errors).length>0 && (
              <span style={{ fontSize:11.5, color:T.amber, display:'flex', alignItems:'center', gap:5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>Fix errors before saving
              </span>
            )}
          </div>
        )}

        {/* ─── Discard dialog ─── */}
        {showDiscard && (
          <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.42)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ background:'#fff', borderRadius:12, padding:28, width:360, boxShadow:'0 20px 50px rgba(0,0,0,.2)' }}>
              <div style={{ fontSize:16, fontWeight:700, color:T.ink, marginBottom:8 }}>Discard changes?</div>
              <div style={{ fontSize:13, color:T.inkSoft, lineHeight:1.5, marginBottom:22 }}>You have unsaved changes. They'll be lost if you continue.</div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={() => setShowDiscard(false)} style={{ padding:'9px 18px', border:`1.5px solid ${T.line}`, borderRadius:7, background:'#fff', fontSize:13, fontWeight:500, color:T.inkSoft, cursor:'pointer' }}>Keep Editing</button>
                <button onClick={() => { setShowDiscard(false); discardCb && discardCb(); }} style={{ padding:'9px 18px', border:'none', borderRadius:7, background:'#DC2626', fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer' }}>Discard</button>
              </div>
            </div>
          </div>
        )}
    </>
  );

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.32)', backdropFilter:'blur(2px)', zIndex:900, opacity:mounted?1:0, transition:'opacity .25s' }}/>

      {/* Panel */}
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:720, background:T.panel, zIndex:901, display:'flex', flexDirection:'column', boxShadow:'-8px 0 40px rgba(0,0,0,.14)', transform:mounted?'translateX(0)':'translateX(100%)', transition:'transform .3s cubic-bezier(.32,0,.67,0)' }}>
        {content}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   LIST VIEW FILTERS
═══════════════════════════════════════ */
// Delegates to the shared FilterPill in ui-list.jsx — the bespoke Ship/Sailing/Cabin/Faretype
// dropdowns below keep their own popovers but share one trigger style with every other list.
function FilterBtn(props) { return <FilterPill {...props}/>; }
function ShipFilter({ selected, onChange }) {
  const [open, setOpen, ref] = useDropdown();
  const label = selected.length===0?'All Ships':selected.length===1?selected[0]:`${selected.length} ships`;
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <FilterBtn label={label} active={selected.length>0} open={open} onClick={() => setOpen(p=>!p)}/>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background:T.panel, border:`1px solid ${T.line}`, borderRadius:9, boxShadow:'0 8px 28px rgba(15,23,42,.1)', zIndex:500, minWidth:200, overflow:'hidden' }}>
          <div style={{ padding:'9px 14px', borderBottom:`1px solid ${T.lineSoft}`, fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px' }}>Ship</div>
          {SHIPS.map(ship => (
            <label key={ship} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', cursor:'pointer', fontSize:13, color:T.ink }} onMouseEnter={e => e.currentTarget.style.background=T.fill} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <input type="checkbox" checked={selected.includes(ship)} onChange={() => onChange(selected.includes(ship)?selected.filter(s=>s!==ship):[...selected,ship])} style={{ accentColor:T.primary, width:14, height:14, cursor:'pointer', flexShrink:0 }}/>{ship}
            </label>
          ))}
          {selected.length>0 && <div style={{ borderTop:`1px solid ${T.lineSoft}`, padding:'7px 14px' }}><button onClick={() => { onChange([]); setOpen(false); }} style={{ background:'none', border:'none', fontSize:12, color:T.primary, cursor:'pointer', fontWeight:600, padding:0 }}>Clear selection</button></div>}
        </div>
      )}
    </div>
  );
}
function SailingFilter({ value, onChange }) {
  const [open, setOpen, ref] = useDropdown();
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <FilterBtn label={value||'All Sailings'} active={!!value} open={open} onClick={() => setOpen(p=>!p)}/>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background:T.panel, border:`1px solid ${T.line}`, borderRadius:9, boxShadow:'0 8px 28px rgba(15,23,42,.1)', zIndex:500, minWidth:200, maxHeight:280, overflowY:'auto' }} className="pscroll">
          <div style={{ padding:'9px 14px', borderBottom:`1px solid ${T.lineSoft}`, fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px', position:'sticky', top:0, background:T.panel }}>Sailing</div>
          <div onClick={() => { onChange(''); setOpen(false); }} style={{ padding:'9px 14px', fontSize:13, color:!value?T.primary:T.ink, fontWeight:!value?600:400, cursor:'pointer', background:!value?T.primaryBg:'transparent' }}>All Sailings</div>
          {ALL_SAILINGS.map(s => (
            <div key={s} onClick={() => { onChange(s); setOpen(false); }} style={{ padding:'9px 14px', fontSize:12.5, fontFamily:"'SF Mono',Menlo,monospace", color:value===s?T.primary:T.ink, fontWeight:value===s?600:400, cursor:'pointer', background:value===s?T.primaryBg:'transparent' }}
              onMouseEnter={e => { if(value!==s) e.currentTarget.style.background=T.fill; }} onMouseLeave={e => { if(value!==s) e.currentTarget.style.background='transparent'; }}>{s}</div>
          ))}
        </div>
      )}
    </div>
  );
}
function CabinCatFilter({ selected, onChange }) {
  const [open, setOpen, ref] = useDropdown();
  const label = selected.length===0?'Cabin Categories':`${selected.length} categor${selected.length===1?'y':'ies'} (AND)`;
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <FilterBtn label={label} active={selected.length>0} open={open} onClick={() => setOpen(p=>!p)}/>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background:T.panel, border:`1px solid ${T.line}`, borderRadius:9, boxShadow:'0 8px 28px rgba(15,23,42,.1)', zIndex:500, minWidth:230, overflow:'hidden' }}>
          <div style={{ padding:'10px 14px', borderBottom:`1px solid ${T.lineSoft}` }}>
            <div style={{ fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px', marginBottom:3 }}>Cabin Categories</div>
            <div style={{ fontSize:11.5, color:T.inkFaint }}>AND logic — all selected must be present</div>
          </div>
          {CABIN_CATS.map(cat => {
            const on = selected.includes(cat); const s = CHIP_S[cat]||{ bg:T.fill, color:T.inkSoft };
            return (
              <label key={cat} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 14px', cursor:'pointer' }} onMouseEnter={e => e.currentTarget.style.background=T.fill} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <input type="checkbox" checked={on} onChange={() => onChange(on?selected.filter(c=>c!==cat):[...selected,cat])} style={{ accentColor:T.primary, width:14, height:14, cursor:'pointer', flexShrink:0 }}/>
                <span style={{ padding:'2px 9px', borderRadius:999, fontSize:12, fontWeight:500, background:s.bg, color:s.color }}>{cat}</span>
              </label>
            );
          })}
          {selected.length>0 && <div style={{ borderTop:`1px solid ${T.lineSoft}`, padding:'7px 14px' }}><button onClick={() => { onChange([]); setOpen(false); }} style={{ background:'none', border:'none', fontSize:12, color:T.primary, cursor:'pointer', fontWeight:600, padding:0 }}>Clear selection</button></div>}
        </div>
      )}
    </div>
  );
}
function FaretypeFilter({ value, onChange }) {
  const [open, setOpen, ref] = useDropdown(); const [q, setQ] = useState('');
  const filtered = FARETYPES.filter(ft => ft.toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <FilterBtn label={value||'Linked Faretype'} active={!!value} open={open} onClick={() => setOpen(p=>!p)}/>
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0, background:T.panel, border:`1px solid ${T.line}`, borderRadius:9, boxShadow:'0 8px 28px rgba(15,23,42,.1)', zIndex:500, minWidth:200, overflow:'hidden' }}>
          <div style={{ padding:'8px 12px', borderBottom:`1px solid ${T.lineSoft}`, display:'flex', alignItems:'center', gap:7 }}>
            <IcSearch/>
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search faretype…" style={{ border:'none', outline:'none', fontSize:13, color:T.ink, background:'transparent', width:'100%' }}/>
          </div>
          <div onClick={() => { onChange(''); setQ(''); setOpen(false); }} style={{ padding:'9px 14px', fontSize:13, color:!value?T.primary:T.inkSoft, cursor:'pointer', fontWeight:!value?600:400 }}>All Faretypes</div>
          {filtered.map(ft => (
            <div key={ft} onClick={() => { onChange(ft); setQ(''); setOpen(false); }} style={{ padding:'9px 14px', fontSize:12.5, fontFamily:"'SF Mono',Menlo,monospace", color:value===ft?T.primary:T.ink, fontWeight:value===ft?700:400, background:value===ft?T.primaryBg:'transparent', cursor:'pointer' }}
              onMouseEnter={e => { if(value!==ft) e.currentTarget.style.background=T.fill; }} onMouseLeave={e => { if(value!==ft) e.currentTarget.style.background=value===ft?T.primaryBg:'transparent'; }}>{ft}</div>
          ))}
          {filtered.length===0 && <div style={{ padding:'14px', fontSize:13, color:T.inkFaint, textAlign:'center' }}>No match</div>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   APP
═══════════════════════════════════════ */
function FarecodeListScreen({ policies }) {
  const [data,      setData]     = useState(INIT_DATA);
  const [search,    setSearch]   = useState('');
  const [shipF,     setShipF]    = useState([]);
  const [sailingF,  setSailingF] = useState('');
  const [cabinF,    setCabinF]   = useState([]);
  const [ftF,       setFtF]      = useState('');
  const [sortCol,   setSortCol]  = useState('mod');
  const [sortDir,   setSortDir]  = useState('desc');
  const [selected,  setSelected] = useState(new Set());
  const [page,      setPage]     = useState(1);
  const [panel,     setPanel]    = useState(null);

  let filtered = data.filter(r => {
    const q = search.trim().toLowerCase();
    if (q && !r.code.toLowerCase().includes(q) && !r.ship.toLowerCase().includes(q) && !r.sailing.toLowerCase().includes(q)) return false;
    if (shipF.length>0 && !shipF.includes(r.ship)) return false;
    if (sailingF && r.sailing!==sailingF) return false;
    if (cabinF.length>0 && !cabinF.every(c => r.cabins.includes(c))) return false;
    if (ftF && r.faretype!==ftF) return false;
    return true;
  });
  const MONTHS = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
  const parseDate = d => { const [day,mon,yr]=d.split(' '); return new Date(yr,MONTHS[mon]-1,parseInt(day)); };
  const DATE_COLS = ['mod','start','end'];
  if (sortCol) filtered=[...filtered].sort((a,b) => { let cmp=DATE_COLS.includes(sortCol)?parseDate(a[sortCol])-parseDate(b[sortCol]):String(a[sortCol]).localeCompare(String(b[sortCol])); return sortDir==='asc'?cmp:-cmp; });

  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)), pageRows=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const hasFilter=search||shipF.length>0||sailingF||cabinF.length>0||ftF;
  const clearFilters=()=>{ setSearch('');setShipF([]);setSailingF('');setCabinF([]);setFtF('');setPage(1); };
  const handleSort=col=>{ if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortCol(col);setSortDir('asc');} };
  const toggleRow=id=>setSelected(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleAll=rows=>{ const all=rows.every(r=>selected.has(r.id)); setSelected(p=>{ const n=new Set(p); rows.forEach(r=>all?n.delete(r.id):n.add(r.id)); return n; }); };
  useEffect(()=>setPage(1),[search,shipF,sailingF,cabinF,ftF]);

  /* Start/End sit next to Sailing — they describe that sailing's window, not the farecode. */
  const COLS=[{ key:'code',label:'Farecode ID',sort:true },{ key:'ship',label:'Ship',sort:false },{ key:'sailing',label:'Sailing',sort:true },{ key:'start',label:'Start Date',sort:true,width:'125px' },{ key:'end',label:'End Date',sort:true,width:'125px' },{ key:'cabins',label:'Cabin Categories',sort:false },{ key:'faretype',label:'Linked Faretype',sort:true },{ key:'status',label:'Status',sort:false },{ key:'mod',label:'Last Modified',sort:true }];
  const mono = "'SF Mono',Menlo,monospace";
  const cell = (row, key) => {
    if (key==='code') return <span style={{ fontFamily:mono, fontSize:12.5, fontWeight:700, color:T.tealDark }}>{row.code}</span>;
    if (key==='ship') return <span style={{ color:T.ink, fontWeight:450 }}>{row.ship}</span>;
    if (key==='sailing') return <span style={{ fontFamily:mono, fontSize:12, color:T.inkSoft }}>{row.sailing}</span>;
    if (key==='start'||key==='end') return <span style={{ color:T.inkSoft, fontSize:12.5, whiteSpace:'nowrap' }}>{row[key]}</span>;
    if (key==='cabins') return <CabinsCell cabins={row.cabins}/>;
    if (key==='faretype') return <span style={{ fontFamily:mono, fontSize:12.5, fontWeight:600, color:T.tealDark }}>{row.faretype}</span>;
    if (key==='status') return <StatusBadge status={row.status}/>;
    if (key==='mod') return <span style={{ color:T.inkSoft, fontSize:12.5 }}>{row.mod}</span>;
    return null;
  };

  return (
    <>

      {/* Main */}
      <div style={{ gridColumn:2, gridRow:2, overflow:'auto', display:'flex', flexDirection:'column' }} className="pscroll">
        {/* Page header */}
        <div style={{ padding:'16px 28px 20px', flexShrink:0 }}>
          <div style={{ fontSize:11.5, color:T.inkFaint, marginBottom:8, fontWeight:500, letterSpacing:'.3px' }}>
            FARES &amp; PRICING <span style={{ margin:'0 5px' }}>›</span> <span style={{ color:T.inkSoft }}>FARECODES</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:700, lineHeight:1, margin:'0 0 5px 0' }}>Farecodes</h1>
              <div style={{ fontSize:13, color:T.inkSoft }}>Priced instances of faretypes, bound to ships and sailings.</div>
            </div>
            <button onClick={() => setPanel({ mode:'create' })} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', background:T.primary, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0, boxShadow:'0 2px 6px rgba(27,36,52,.2)' }}
              onMouseEnter={e => e.currentTarget.style.opacity='.88'} onMouseLeave={e => e.currentTarget.style.opacity='1'}>
              + New Farecode
            </button>
          </div>
        </div>

        {/* Table card */}
        <div style={{ flex:1, padding:'0 28px 28px' }}>
          <ListCard>

            {/* Filters */}
            <ListToolbar>
              <FilterRow>
                <ListSearch value={search} onChange={setSearch} placeholder="Filter by farecode ID, ship, sailing…"/>
                <ShipFilter selected={shipF} onChange={setShipF}/>
                <SailingFilter value={sailingF} onChange={setSailingF}/>
                <CabinCatFilter selected={cabinF} onChange={setCabinF}/>
                <FaretypeFilter value={ftF} onChange={setFtF}/>
                {hasFilter && <ClearFilters onClick={clearFilters}/>}
                <ResultCount>{filtered.length} of {data.length} farecodes</ResultCount>
              </FilterRow>
            </ListToolbar>

            <DataTable
              cols={COLS} rows={pageRows} cell={cell} minWidth={1180}
              sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
              onRowClick={row => setPanel({ mode:'view', row })}
              emptyTitle={hasFilter ? 'No farecodes match your filters' : 'No farecodes yet'}/>

            <ListPager page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} noun="farecodes"/>
          </ListCard>
        </div>
      </div>

      {/* Panel overlay */}
      {panel && (
        <FarecodePanel mode={panel.mode} viewRow={panel.row} initialEdit={!!panel.initialEdit} policies={policies} onClose={() => setPanel(null)}/>
      )}
    </>
  );
}

Object.assign(window, { FarecodeListScreen });
})();
