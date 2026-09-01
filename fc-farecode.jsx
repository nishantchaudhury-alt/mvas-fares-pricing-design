// fc-farecode.jsx — full Farecode list + create/edit panel.
// Ported from the standalone "Farecode Create-Edit Panel" prototype and wrapped in an IIFE: it keeps
// its own T / Field / Sel / Toggle / StatusBadge / IcSearch primitives, which would otherwise collide
// with the identically-named globals in dc-shell.jsx.
// Its Policies section (S2) reads live Group→Parent policy records passed down from the shell.
(function () {
const { useState, useRef, useEffect } = React;

/* ── Design tokens ── */
const T = {
  ink:'#0F172A', inkSoft:'#475569', inkFaint:'#5B6B82', inkLabel:'#5B6B82',
  bg:'#F1F5F9', panel:'#FFFFFF', fill:'#F8FAFC', navFill:'#F9FAFB',
  line:'#E2E8F0', lineSoft:'#EEF2F6',
  primary:'#1B2434', primaryBg:'#EFF6FF', primaryLine:'#DBEAFE',
  teal:'#047857', tealDark:'#047857', tealLight:'#ECFDF5',
  amber:'#92400E', amberDark:'#92400E', amberLight:'#FFFBEB', amberBorder:'#FCD34D',
  red:'#DC2626', redLight:'#FEF2F2', green:'#047857', greenLight:'#F0FDF4',
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
const farecodeSailingValues = form => {
  if (Array.isArray(form?.sailings)) return form.sailings;
  return form?.sailing ? [form.sailing] : [];
};
const farecodeSailingLabel = form => {
  const sailings = farecodeSailingValues(form);
  return sailings.length ? sailings.join(', ') : '—';
};
const mkSupp = (id, title, type) => ({ id, title, type, custom:false, enabled:false, name:'', cabin:'', cabins:[], rule:'Booking', maxCount:'', farePos:[] });
const defaultSupplements = () => [
  mkSupp('complimentary', 'Complementary Supplement', 'comp'),
  mkSupp('paid', 'Paid Supplement', 'paid'),
];
const cloneSupplements = list => (list || []).map(item => ({
  ...item,
  cabins:Array.isArray(item.cabins) ? [...item.cabins] : item.cabin && !['Any', 'All', 'Any cabin', 'All cabin categories'].includes(item.cabin) ? [item.cabin] : [],
  farePos:[...(item.farePos || [])],
}));
const FT_DATA = [
  { code:'FT-00101', basis:'CORE-RETAIL', group:'Core',
    vals:{ cancellationPolicy:'Standard Cancellation', depositPolicy:'5 Night Standard Deposit', residency:'Any', minAge:18, minOccupancy:1, maxOccupancy:4, standbyEligible:false, upgradeEligible:true, couponEligible:true, advancedPurchase:'', cruiseControlAccess:true, chMVASB2C:true, chMVASB2B:true, chCC:true, chTradeAPI:false, chCRM:true, chGroup:false, channelPartners:[], includeDiscount:false, discountMessage:'', offerPrimary:'', offerSecondary:'', offerTertiary:[], waiveGovTaxes:false, waiveCruiseExp:false, noFareDisplay:false,
      supp:[
        { ...mkSupp('complimentary', 'Complementary Supplement', 'comp'), enabled:true, name:'Drinks Package', cabin:'', rule:'Booking', maxCount:1, farePos:['Fare Position 1'] },
        mkSupp('paid', 'Paid Supplement', 'paid'),
      ] }},
  { code:'FT-00102', basis:'NR-PROMO', group:'Non-Refundable',
    vals:{ cancellationPolicy:'Non-Refundable', depositPolicy:'5 Night Promo Deposit', residency:'US Only', minAge:21, minOccupancy:2, maxOccupancy:4, standbyEligible:false, upgradeEligible:false, couponEligible:false, advancedPurchase:30, cruiseControlAccess:true, chMVASB2C:true, chMVASB2B:false, chCC:true, chTradeAPI:false, chCRM:true, chGroup:false, channelPartners:[], includeDiscount:false, discountMessage:'', offerPrimary:'OFFER-2026-SPRING', offerSecondary:'', offerTertiary:[], waiveGovTaxes:false, waiveCruiseExp:false, noFareDisplay:false }},
  { code:'FT-00103', basis:'INT-AGENCY', group:'Interline',
    vals:{ cancellationPolicy:'Standard — Suites Enhanced', depositPolicy:'7 Night Trade Deposit', residency:'Any', minAge:18, minOccupancy:1, maxOccupancy:3, standbyEligible:true, upgradeEligible:true, couponEligible:true, advancedPurchase:'', cruiseControlAccess:false, chMVASB2C:false, chMVASB2B:false, chCC:false, chTradeAPI:true, chCRM:true, chGroup:true, channelPartners:[], includeDiscount:false, discountMessage:'', offerPrimary:'', offerSecondary:'', offerTertiary:[], waiveGovTaxes:false, waiveCruiseExp:false, noFareDisplay:false }},
];
const CHANNEL_PARTNERS = ['Virtuoso', 'AMEX Travel', 'Ensemble', 'Signature Travel', 'Travel Leaders', 'Nexion', 'Avoya Travel'];
const OVRD_KEYS = ['cancellationPolicy','depositPolicy','minOccupancy','maxOccupancy','advancedPurchase','standbyEligible','upgradeEligible','couponEligible','cruiseControlAccess','channelVisibility','includeDiscount','discountMessage','offerPrimary','offerSecondary','offerTertiary','waiveGovTaxes','waiveCruiseExp','noFareDisplay'];
const DEFAULT_FORM  = () => ({ ship:'', sailing:'', sailings:[], faretype:'', cancellationPolicy:'', depositPolicy:'', residency:'Any', minAge:18, minOccupancy:'', maxOccupancy:'', advancedPurchase:'', standbyEligible:false, upgradeEligible:true, couponEligible:true, cruiseControlAccess:true, chMVASB2C:true, chMVASB2B:true, chCC:true, chTradeAPI:false, chCRM:true, chGroup:false, channelPartners:[], includeDiscount:false, discountMessage:'', offerPrimary:'', offerSecondary:'', offerTertiary:[], waiveGovTaxes:false, waiveCruiseExp:false, noFareDisplay:false, supp:defaultSupplements() });
const DEFAULT_OVRD  = () => Object.fromEntries(OVRD_KEYS.map(k => [k,'inherited']));
const POLICY_ELIGIBILITY_KEYS = ['cancellationPolicy','depositPolicy','residency','minAge','minOccupancy','maxOccupancy','advancedPurchase','standbyEligible','upgradeEligible','couponEligible'];
const policyEligibilityValues = record => Object.fromEntries(POLICY_ELIGIBILITY_KEYS.filter(k => record && Object.prototype.hasOwnProperty.call(record,k)).map(k => [k,record[k]]));
const GUEST_ROWS = [
  { grp:'Occupancy 1–2', rows:[{ k:'single',l:'Single Guest' },{ k:'dbl1',l:'Double Guest 1' },{ k:'dbl2',l:'Double Guest 2' }] },
  { grp:'Extra adult',   rows:[{ k:'adult3',l:'3rd guest' },{ k:'adult4',l:'4th guest' }] },
  { grp:'Extra child',   rows:[{ k:'child3',l:'3rd guest' },{ k:'child4',l:'4th guest' }] },
  { grp:'Extra infant',  rows:[{ k:'infant3',l:'3rd guest' },{ k:'infant4',l:'4th guest' }] },
];
const DEFAULT_PRICING_COLUMNS = GUEST_ROWS.flatMap(group => group.rows.map(row => ({ key:row.k, label:row.l, group:group.grp, custom:false })));
const GUEST_KEYS = DEFAULT_PRICING_COLUMNS.map(column => column.key);
const EMPTY_ROW = () => Object.fromEntries(GUEST_KEYS.map(k => [k,'']));
const SYSTEM_PRICING_CABINS = ['Interior','Ocean View','Balcony','Suite'];
const MAX_GUEST_COLUMNS = 14;
const DEFAULT_COLUMN_CONFIG = () => DEFAULT_PRICING_COLUMNS.map(column => ({ ...column }));
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
  const uid = React.useId().replace(/:/g, '');
  const controlId = `fc-field-${uid}`;
  const labelId = `${controlId}-label`, helpId = `${controlId}-help`, errorId = `${controlId}-error`;
  const describedBy = error ? errorId : helper ? helpId : undefined;
  const bound = bindFieldControl(children, { id:controlId, label, describedBy, invalid:!!error, required:!!required });
  return (
    <div role={label ? 'group' : undefined} aria-labelledby={label ? labelId : undefined} style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label id={labelId} htmlFor={bound.bound ? bound.controlId : undefined} style={{ fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{label}{required && <span aria-hidden="true" style={{ color:T.red, marginLeft:3 }}>*</span>}</label>}
      {bound.node}
      {error  && <span id={errorId} role="alert" style={{ fontSize:11, color:T.red }}>{error}</span>}
      {!error && helper && <span id={helpId} style={{ fontSize:11, color:T.inkFaint, lineHeight:1.4 }}>{helper}</span>}
    </div>
  );
}
function OField({ label, required, status, onOverride, onRevert, helper, error, noOvr, children }) {
  const uid = React.useId().replace(/:/g, '');
  const controlId = `fc-override-field-${uid}`;
  const labelId = `${controlId}-label`, helpId = `${controlId}-help`, errorId = `${controlId}-error`;
  const describedBy = error ? errorId : helper ? helpId : undefined;
  const bound = bindFieldControl(children, { id:controlId, label, describedBy, invalid:!!error, required:!!required });
  const showLock  = status === 'locked' || status === 'inherited';
  const showBtn   = status === 'inherited' && !noOvr;
  const showBadge = status === 'overridden';
  return (
    <div role={label ? 'group' : undefined} aria-labelledby={label ? labelId : undefined} style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:17 }}>
        {label && <label id={labelId} htmlFor={bound.bound ? bound.controlId : undefined} style={{ fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{label}{required && <span aria-hidden="true" style={{ color:T.red, marginLeft:3 }}>*</span>}</label>}
        <div style={{ display:'flex', alignItems:'center', gap:5 }}>
          {showBtn   && <button onClick={onOverride} style={{ padding:'2px 7px', borderRadius:4, border:`1px solid ${T.primaryLine}`, background:'#fff', fontSize:10, fontWeight:600, color:T.primary, cursor:'pointer' }}>Override</button>}
          {showBadge && <span onClick={onRevert} title="Revert to inherited" style={{ padding:'2px 7px', borderRadius:4, background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.primary, fontSize:10, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:3 }}>Overridden <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>}
          {showLock  && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        </div>
      </div>
      {bound.node}
      {error  && <span id={errorId} role="alert" style={{ fontSize:11, color:T.red }}>{error}</span>}
      {!error && helper && <span id={helpId} style={{ fontSize:11, color:T.inkFaint, lineHeight:1.4 }}>{helper}</span>}
    </div>
  );
}
function Sel({ value, onChange, opts, err, dis, ariaLabel='Select option', inputId, ariaDescribedBy, ariaInvalid, ariaRequired }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPos, setMenuPos] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useRef(`fc-select-${Math.random().toString(36).slice(2)}`).current;
  const selectedIndex = Math.max(0, opts.findIndex(([v]) => v === value));
  const selected = opts[selectedIndex] || ['', 'Select…'];
  const selectedLabel = selected[1] !== undefined ? selected[1] : selected[0];
  const isPlaceholder = value === '' || value === null || value === undefined;

  useEffect(() => {
    if (dis && open) setOpen(false);
  }, [dis, open]);

  useEffect(() => {
    if (!open) { setMenuPos(null); return; }
    setActiveIndex(selectedIndex);
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const menuWidth = Math.min(Math.max(rect.width, 260), viewportW - 16);
      const left = Math.min(Math.max(8, rect.left), viewportW - menuWidth - 8);
      const spaceBelow = viewportH - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const opensUp = spaceBelow < 170 && spaceAbove > spaceBelow;
      const available = Math.max(96, (opensUp ? spaceAbove : spaceBelow) - 5);
      setMenuPos({
        left,
        width:menuWidth,
        top:opensUp ? undefined : rect.bottom + 5,
        bottom:opensUp ? viewportH - rect.top + 5 : undefined,
        maxHeight:Math.min(240, available),
      });
    };
    const onPointerDown = e => {
      if (!rootRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false);
    };
    updatePosition();
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open, selectedIndex]);

  const choose = index => {
    const option = opts[index];
    if (!option) return;
    onChange(option[0]);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const move = delta => {
    if (!open) { setOpen(true); return; }
    setActiveIndex(i => (i + delta + opts.length) % opts.length);
  };
  const onKeyDown = e => {
    if (dis) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
    else if (e.key === 'Home' && open) { e.preventDefault(); setActiveIndex(0); }
    else if (e.key === 'End' && open) { e.preventDefault(); setActiveIndex(opts.length-1); }
    else if ((e.key === 'Enter' || e.key === ' ') && open) { e.preventDefault(); choose(activeIndex); }
    else if ((e.key === 'Enter' || e.key === ' ') && !open) { e.preventDefault(); setOpen(true); }
    else if (e.key === 'Escape' && open) { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Tab' && open) setOpen(false);
  };
  const triggerStyle = iS(err,dis);

  return (
    <div ref={rootRef} style={{ position:'relative' }}>
      <button id={inputId} ref={triggerRef} type="button" role="combobox" className="fi" disabled={dis} aria-label={ariaLabel} aria-describedby={ariaDescribedBy} aria-haspopup="listbox" aria-controls={menuId} aria-expanded={open} aria-invalid={ariaInvalid || !!err} aria-required={ariaRequired} aria-activedescendant={open?`${menuId}-option-${activeIndex}`:undefined}
        onClick={() => !dis && setOpen(v => !v)} onKeyDown={onKeyDown}
        style={{ ...triggerStyle, minHeight:37, padding:'8px 10px 8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, textAlign:'left', fontFamily:'inherit', cursor:dis?'not-allowed':'pointer', border:open?`1.5px solid ${T.primary}`:triggerStyle.border, boxShadow:open?'0 0 0 3px rgba(27,36,52,.1)':undefined }}>
        <span style={{ minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:dis?T.inkFaint:isPlaceholder?T.inkFaint:T.ink }}>{selectedLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open?T.primary:T.inkFaint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, transform:open?'rotate(180deg)':'none', transition:'transform .15s ease' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      {open && menuPos && ReactDOM.createPortal(
        <div ref={menuRef} id={menuId} role="listbox" aria-label={`${ariaLabel} options`} style={{ position:'fixed', left:menuPos.left, top:menuPos.top, bottom:menuPos.bottom, width:menuPos.width, maxHeight:menuPos.maxHeight, overflowY:'auto', zIndex:2200, padding:4, background:T.panel, border:`1px solid ${T.line}`, borderRadius:8, boxShadow:'0 8px 24px rgba(15,23,42,.14)' }}>
          {opts.map(([v,l], index) => {
            const label = l !== undefined ? l : v;
            const isSelected = v === value;
            const isActive = index === activeIndex;
            return (
              <button key={`${v}-${index}`} id={`${menuId}-option-${index}`} type="button" role="option" aria-selected={isSelected} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(index)}
                style={{ width:'100%', padding:'8px 9px', border:'none', borderRadius:6, background:isSelected?T.primaryBg:isActive?T.fill:'transparent', color:v===''?T.inkFaint:isSelected?T.primary:T.ink, fontSize:12.5, fontWeight:isSelected?700:500, lineHeight:1.35, fontFamily:'inherit', textAlign:'left', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                <span style={{ minWidth:0, overflow:'hidden', textOverflow:'ellipsis' }}>{label}</span>
                {isSelected && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
            );
          })}
        </div>, document.body
      )}
    </div>
  );
}
function MultiChip({ values, onChange, opts, placeholder, inputId, ariaLabel, ariaDescribedBy, ariaInvalid, ariaRequired, disabled=false }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPos, setMenuPos] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useRef(`fc-multi-${Math.random().toString(36).slice(2)}`).current;
  const filtered = opts.filter(o => !values.includes(o) && o.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    if (!open) { setMenuPos(null); return; }
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;
      const menuWidth = Math.min(Math.max(rect.width, 260), viewportW - 16);
      const left = Math.min(Math.max(8, rect.left), viewportW - menuWidth - 8);
      const spaceBelow = viewportH - rect.bottom - 8;
      const spaceAbove = rect.top - 8;
      const opensUp = spaceBelow < 170 && spaceAbove > spaceBelow;
      const available = Math.max(96, (opensUp ? spaceAbove : spaceBelow) - 5);
      setMenuPos({ left, width:menuWidth, top:opensUp ? undefined : rect.bottom + 5, bottom:opensUp ? viewportH - rect.top + 5 : undefined, maxHeight:Math.min(240, available) });
    };
    const onPointerDown = e => {
      if (!rootRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false);
    };
    updatePosition();
    document.addEventListener('mousedown', onPointerDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => { setActiveIndex(0); }, [q, values.length]);

  const choose = option => {
    if (!option || disabled) return;
    onChange([...values, option]);
    setQ('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const onKeyDown = e => {
    if (disabled) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActiveIndex(i => filtered.length ? (i + 1) % filtered.length : 0); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); setActiveIndex(i => filtered.length ? (i - 1 + filtered.length) % filtered.length : 0); }
    else if (e.key === 'Enter' && open && filtered[activeIndex]) { e.preventDefault(); choose(filtered[activeIndex]); }
    else if (e.key === 'Escape' && open) { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Tab' && open) setOpen(false);
  };

  return (
    <div ref={rootRef} aria-disabled={disabled || undefined} style={{ position:'relative' }}>
      <div ref={triggerRef} onClick={() => { if (!disabled) { setOpen(true); inputRef.current?.focus(); } }}
      style={{ minHeight:42, padding:'5px 8px', border:`1.5px solid ${open ? T.primary : ariaInvalid ? T.red : disabled ? '#E8EDF3' : '#D8DFE8'}`, borderRadius:7, display:'flex', flexWrap:'wrap', gap:5, cursor:disabled?'not-allowed':'text', alignItems:'center', background:disabled?'#F3F4F6':'#fff', boxShadow:open ? '0 0 0 3px rgba(27,36,52,.1)' : 'none', transition:'border-color .15s, box-shadow .15s' }}>
        {values.map(v => (
          <span key={v} style={{ display:'flex', alignItems:'center', gap:4, padding:'3px 7px', borderRadius:6, background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.primary, fontSize:11.5, fontWeight:600 }}>
            {v}
            {!disabled && <button type="button" aria-label={`Remove ${v}`} onClick={e => { e.stopPropagation(); onChange(values.filter(x => x !== v)); }}
            style={{ width:14, height:14, padding:0, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'none', background:'none', cursor:'pointer', color:T.inkFaint, fontSize:14, lineHeight:1 }}>×</button>
            }
          </span>
        ))}
        <input id={inputId} ref={inputRef} role="combobox" aria-label={ariaLabel || placeholder || 'Search options'} aria-describedby={ariaDescribedBy} aria-invalid={ariaInvalid} aria-required={ariaRequired} aria-haspopup="listbox" aria-controls={menuId} aria-expanded={open} aria-activedescendant={open && filtered[activeIndex] ? `${menuId}-option-${activeIndex}` : undefined}
        disabled={disabled} value={q} onChange={e => setQ(e.target.value)} onFocus={() => !disabled && setOpen(true)} onKeyDown={onKeyDown} placeholder={values.length ? '' : placeholder}
        style={{ border:'none', outline:'none', fontSize:13, color:disabled?T.inkFaint:T.ink, flex:1, minWidth:100, background:'transparent', padding:4, cursor:disabled?'not-allowed':undefined }}/>
      </div>
      {open && menuPos && ReactDOM.createPortal(
        <div ref={menuRef} id={menuId} role="listbox" aria-label={`${placeholder || 'Search'} options`} className="pscroll" style={{ position:'fixed', left:menuPos.left, top:menuPos.top, bottom:menuPos.bottom, width:menuPos.width, maxHeight:menuPos.maxHeight, overflowY:'auto', zIndex:2200, padding:4, background:T.panel, border:`1px solid ${T.line}`, borderRadius:8, boxShadow:'0 8px 24px rgba(15,23,42,.14)' }}>
          {filtered.length ? filtered.map((o, index) => (
            <button key={o} id={`${menuId}-option-${index}`} type="button" role="option" aria-selected="false" onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(o)}
            style={{ width:'100%', padding:'8px 9px', border:'none', borderRadius:6, background:index === activeIndex ? T.fill : 'transparent', color:T.ink, fontSize:12.5, fontWeight:500, lineHeight:1.35, fontFamily:'inherit', textAlign:'left', cursor:'pointer' }}>{o}</button>
          )) : <div style={{ padding:'10px 9px', color:T.inkFaint, fontSize:12, lineHeight:1.4 }}>No matching options</div>}
        </div>, document.body)
      }
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
        {status==='inherited'  && <button onClick={onOverride} style={{ padding:'2px 7px', borderRadius:4, border:`1px solid ${T.primaryLine}`, background:'#fff', fontSize:10, fontWeight:600, color:T.primary, cursor:'pointer' }}>Override</button>}
        {status==='overridden' && <span onClick={onRevert} title="Revert to inherited" style={{ padding:'2px 7px', borderRadius:4, background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.primary, fontSize:10, fontWeight:700, cursor:'pointer' }}>Overridden ×</span>}
        {dis && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        <Toggle on={on} onChange={onChange} dis={dis} label={label}/>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   READ-ONLY primitives
─────────────────────────────────────────────── */
function ROSection({ n, title, action, children }) {
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.04)', marginBottom:10, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'11px 16px', background:T.fill, borderBottom:`1px solid ${T.lineSoft}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
          {n !== undefined && (
            <div style={{ padding:'3px 7px', borderRadius:5, background:T.primary, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:9.5, fontWeight:800, color:'#fff' }}>{String(n).padStart(2,'0')}</span>
            </div>
          )}
          <span style={{ fontSize:14, fontWeight:700, color:T.ink }}>{title}</span>
        </div>
        {action && <div style={{ display:'flex', alignItems:'center', flexShrink:0 }}>{action}</div>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, padding:'14px 16px 16px' }}>{children}</div>
    </div>
  );
}
function ROField({ label, value, status, mono, teal, extra }) {
  const isLock = status === 'inherited' || status === 'locked';
  const isOvrd = status === 'overridden';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:16 }}>
        <span style={{ fontSize:9.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          {isOvrd && <span style={{ padding:'2px 7px', borderRadius:4, background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.primary, fontSize:10, fontWeight:700 }}>Overridden</span>}
          {isLock && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        </div>
      </div>
      <div style={{ padding:'9px 11px', minHeight:36, borderRadius:7, border:`1px solid ${T.line}`, fontSize:13, lineHeight:1.35, background:isLock?T.fill:'#fff', color:teal?T.primary:T.ink, fontFamily:mono?"'SF Mono',Menlo,monospace":undefined, fontWeight:mono&&teal?700:400, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
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
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background:value?T.greenLight:isLock?T.fill:'#fff', border:`1px solid ${isOvrd?T.primaryLine:T.line}`, borderRadius:8, gap:12 }}>
      <div>
        <div style={{ fontSize:12.5, fontWeight:600, color:T.ink }}>{label}</div>
        {helper && <div style={{ fontSize:11, color:T.inkSoft, marginTop:2 }}>{helper}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {isOvrd && <span style={{ padding:'2px 7px', borderRadius:4, background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.primary, fontSize:10, fontWeight:700 }}>Overridden</span>}
        {isLock && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 8px', borderRadius:999, fontSize:11.5, fontWeight:700, background:value?'#fff':T.fill, color:value?T.green:T.inkSoft }}><span style={{ width:6, height:6, borderRadius:'50%', background:value?T.green:T.inkFaint }}/>{value?'Enabled':'Disabled'}</span>
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

function PricingMatrixHeader({ grid, columns=DEFAULT_PRICING_COLUMNS, expanded=false, onRemoveColumn }) {
  let nextColumn = 2;
  const groupedColumns = GUEST_ROWS.map(group => ({ label:group.grp, columns:columns.filter(column => column.group===group.grp) })).filter(group => group.columns.length);
  const totalColumn = columns.length + 2;
  return (
    <div role="rowgroup" style={{ display:'grid', gridTemplateColumns:grid, gridTemplateRows:'auto auto', background:'#F7F9FC', borderBottom:`1px solid ${T.line}`, position:'sticky', top:0, zIndex:2 }}>
      <div role="columnheader" style={{ gridColumn:'1', gridRow:'1 / span 2', position:'sticky', left:0, zIndex:4, display:'flex', alignItems:'center', padding:expanded?'11px 16px':'8px 10px', background:'#F7F9FC', borderRight:`1px solid ${T.line}`, fontSize:10, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px', whiteSpace:'nowrap' }}>Cabin Category</div>
      {groupedColumns.map(group => {
        const start = nextColumn;
        nextColumn += group.columns.length;
        return <div key={group.label} role="columnheader" style={{ gridColumn:`${start} / span ${group.columns.length}`, gridRow:'1', padding:expanded?'8px 12px':'6px 8px', borderLeft:`1px solid ${T.lineSoft}`, borderBottom:`1px solid ${T.lineSoft}`, fontSize:9.5, fontWeight:800, color:T.inkFaint, textTransform:'uppercase', letterSpacing:'.6px', textAlign:'center', whiteSpace:'nowrap' }}>{group.label}</div>;
      })}
      {columns.map((column, index) => (
        <div key={column.key} role="columnheader" title={`${column.group} · ${column.label}`} style={{ gridColumn:String(index+2), gridRow:'2', padding:expanded?'7px 8px':'6px 8px', borderLeft:`1px solid ${T.lineSoft}`, fontSize:expanded?10.5:10, fontWeight:700, color:T.inkSoft, textAlign:'right', whiteSpace:'nowrap', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:5 }}>
          <span style={{ minWidth:0, overflow:'hidden', textOverflow:'ellipsis' }}>{column.label}</span>
          {column.custom && onRemoveColumn && <button type="button" onClick={() => onRemoveColumn(column)} aria-label={`Remove ${column.label} from ${column.group}`} title="Remove custom column" style={{ width:20, height:20, flexShrink:0, display:'inline-flex', alignItems:'center', justifyContent:'center', border:'none', borderRadius:4, background:'transparent', color:T.inkFaint, cursor:'pointer' }}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
        </div>
      ))}
      <div role="columnheader" style={{ gridColumn:String(totalColumn), gridRow:'1 / span 2', display:'flex', alignItems:'center', justifyContent:'flex-end', padding:expanded?'11px 14px':'8px 10px', borderLeft:`1px solid ${T.line}`, background:T.fill, fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px', textAlign:'right', whiteSpace:'nowrap' }}>Cabin · Double</div>
    </div>
  );
}

function PricingReadOnlyTable({ pricing, columns=DEFAULT_PRICING_COLUMNS, expanded=false }) {
  const cabins = Object.keys(pricing);
  const fmtCur = n => new Intl.NumberFormat('en-US',{ minimumFractionDigits:2, maximumFractionDigits:2 }).format(n);
  const parseCur = v => parseFloat(String(v||'').replace(/[^0-9.]/g,'')) || 0;
  const val = (cab,k) => parseCur(pricing[cab][k]);
  const isPriced = cab => columns.some(column => val(cab,column.key) > 0);
  const firstCol = expanded ? 170 : 118;
  const guestCol = expanded ? 132 : 104;
  const totalCol = expanded ? 150 : 126;
  const pGrid = `${firstCol}px repeat(${columns.length}, minmax(${guestCol}px,1fr)) ${totalCol}px`;
  const cellPad = expanded ? '13px 16px' : '9px 10px';
  const labelPad = expanded ? '13px 18px' : '9px 12px';
  const valueSize = expanded ? 13.5 : 12.5;

  return (
    <div className="hscroll" role="table" aria-label="Pricing by cabin category and guest position" style={{ border:`1px solid ${T.line}`, borderRadius:9, overflowX:'auto', background:'#fff' }}>
      <div style={{ minWidth:firstCol+columns.length*guestCol+totalCol }}>
        <PricingMatrixHeader grid={pGrid} columns={columns} expanded={expanded}/>
        <div role="rowgroup">
          {cabins.map((cabin, index) => {
            const total = val(cabin,'dbl1')+val(cabin,'dbl2');
            return (
              <div key={cabin} role="row" style={{ display:'grid', gridTemplateColumns:pGrid, alignItems:'stretch', borderBottom:index<cabins.length-1?`1px solid ${T.lineSoft}`:'none', background:'#fff' }}>
                <div role="rowheader" style={{ position:'sticky', left:0, zIndex:1, display:'flex', alignItems:'center', padding:labelPad, background:'#fff', borderRight:`1px solid ${T.line}`, fontSize:expanded?13.5:12.5, fontWeight:700, color:isPriced(cabin)?T.ink:T.inkFaint, whiteSpace:'nowrap' }}>{cabin}</div>
                {columns.map(column => (
                  <div key={column.key} role="cell" style={{ padding:cellPad, fontSize:valueSize, textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace", color:val(cabin,column.key)>0?T.ink:T.inkFaint, borderLeft:`1px solid ${T.lineSoft}` }}>
                    {val(cabin,column.key)>0?fmtCur(val(cabin,column.key)):'—'}
                  </div>
                ))}
                <div role="cell" style={{ padding:cellPad, fontSize:valueSize, fontWeight:700, textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace", color:total>0?T.ink:T.inkFaint, borderLeft:`1px solid ${T.line}`, background:T.fill }}>{total>0?fmtCur(total):'—'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PricingExpandedModal({ pricing, columns, leadIn, onClose }) {
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
            <div style={{ fontSize:12.5, color:T.inkSoft }}>Fare per guest in USD, by cabin category and guest position.</div>
          </div>
          <button ref={closeBtnRef} onClick={onClose} aria-label="Close expanded pricing view" title="Close"
            style={{ width:34, height:34, borderRadius:8, border:`1px solid ${T.line}`, background:'#fff', color:T.inkSoft, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
            onMouseEnter={e => { e.currentTarget.style.background=T.fill; e.currentTarget.style.color=T.ink; }}
            onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color=T.inkSoft; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="pscroll" style={{ padding:24, overflow:'auto', minHeight:0 }}>
          <PricingReadOnlyTable pricing={pricing} columns={columns} expanded/>
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

/* ── Read-only overview (all 8 sections) ── */
function OverviewReadOnly({ form, overrides, pricing, pricingColumns }) {
  const [pricingExpanded, setPricingExpanded] = useState(false);
  const expandBtnRef = useRef(null);
  const selFT = FT_DATA.find(ft => ft.code === form.faretype);
  const getO  = k => overrides[k] || 'inherited';
  const CHS = [
    { k:'chMVASB2C', l:'MVAS B2C' }, { k:'chMVASB2B', l:'MVAS B2B' },
    { k:'chCC', l:'Cruise Control' }, { k:'chTradeAPI', l:'Trade API' },
    { k:'chCRM', l:'CRM' }, { k:'chGroup', l:'Group' },
  ];
  const vis = CHS.filter(c => form[c.k]).map(c => c.l);
  const hid = CHS.filter(c => !form[c.k]).map(c => c.l);
  const enabledSupplements = (form.supp || []).filter(supp => supp.enabled);
  const selectedSailings = farecodeSailingValues(form);
  const sailingWindows = selectedSailings.map(sailDates);
  function fmtCur(n) { return new Intl.NumberFormat('en-US',{ minimumFractionDigits:2, maximumFractionDigits:2 }).format(n); }
  function parseCur(v) { return parseFloat(String(v||'').replace(/[^0-9.]/g,'')) || 0; }
  const CABINS = Object.keys(pricing);
  const val = (cab,k) => parseCur(pricing[cab][k]);
  const isPriced = cab => pricingColumns.some(column => val(cab,column.key) > 0);
  const leadIn = Math.min(...CABINS.filter(isPriced).map(c => val(c,'dbl1')+val(c,'dbl2')).concat([Infinity]));
  const leadInLabel = isFinite(leadIn)&&leadIn>0?`$${fmtCur(leadIn)}`:'—';
  const closeExpandedPricing = () => {
    setPricingExpanded(false);
    requestAnimationFrame(() => expandBtnRef.current?.focus());
  };

  return (
    <div>
      {/* 1. Ship & Sailings */}
      <ROSection n={1} title="Ship & Sailings">
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0, 1fr))', gap:10 }}>
          <ROField label="Ship"    value={form.ship}/>
          <ROField label="Sailings" value={farecodeSailingLabel(form)} mono/>
          <ROField label="Departure Dates" value={sailingWindows.length ? sailingWindows.map(window => window.start).join(', ') : '—'}/>
          <ROField label="Return Dates" value={sailingWindows.length ? sailingWindows.map(window => window.end).join(', ') : '—'}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, background:T.primaryBg, border:`1px solid ${T.primaryLine}` }}>
          <span style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px', flexShrink:0 }}>Faretype Source</span>
          <span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:12.5, fontWeight:800, color:T.primary }}>{form.faretype}</span>
          {selFT && <><span style={{ color:T.inkFaint }}>·</span><span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:11.5, color:T.inkSoft }}>{selFT.basis}</span><span style={{ color:T.inkFaint }}>·</span><span style={{ padding:'2px 7px', borderRadius:999, background:'#fff', color:T.primary, fontSize:10.5, fontWeight:700 }}>{selFT.group}</span></>}
        </div>
      </ROSection>

      {/* 2. Channels */}
      <ROSection n={2} title="Channel Access">
        <ROToggle label="Show in Cruise Control" helper="Internal CRM booking visibility." value={form.cruiseControlAccess} status={getO('cruiseControlAccess')}/>
        <ROField label="Distribution Channels" value={vis.length?vis.join(', '):'None'} status={getO('channelVisibility')}/>
        <div style={{ fontSize:12, color:T.inkFaint, padding:'8px 12px', background:T.fill, borderRadius:7, lineHeight:1.5 }}>
          <strong style={{ color:T.inkSoft }}>Visible:</strong> {vis.length?vis.join(', '):'None'} &nbsp;·&nbsp; <strong style={{ color:T.inkSoft }}>Hidden:</strong> {hid.length?hid.join(', '):'None'}
        </div>
      </ROSection>

      {/* 3. Partner Access */}
      <ROSection n={3} title="Partner Access">
        <ROField label="Applicable Channel Partners" value={form.channelPartners.length?form.channelPartners.join(', '):'All agencies'}/>
        <div style={{ fontSize:12, color:T.inkSoft, padding:'8px 12px', background:T.fill, borderRadius:7, lineHeight:1.5 }}>
          {form.channelPartners.length ? `${form.channelPartners.length} selected partner${form.channelPartners.length===1?'':'s'} can access this Farecode through MVAS B2B.` : 'No partner restriction is applied; every agency can access this Farecode when MVAS B2B is enabled.'}
        </div>
      </ROSection>

      {/* 4. Marketing */}
      <ROSection n={4} title="Marketing & Messaging">
        <ROToggle label="Discount Message" value={form.includeDiscount} status={getO('includeDiscount')}/>
        {form.includeDiscount && <ROField label="Message Copy" value={form.discountMessage||'—'} status={getO('discountMessage')}/>}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
          <ROField label="Primary Offer"   value={form.offerPrimary  ||'None'} status={getO('offerPrimary')}/>
          <ROField label="Secondary Offer" value={form.offerSecondary||'None'} status={getO('offerSecondary')}/>
          <ROField label="Tertiary Offers" value={(Array.isArray(form.offerTertiary) ? form.offerTertiary.join(', ') : form.offerTertiary) || 'None'} status={getO('offerTertiary')}/>
        </div>
      </ROSection>

      {/* 5. Taxes */}
      <ROSection n={5} title="Taxes & Privacy">
        <WarnBanner><span style={{ fontSize:12.5, color:T.amberDark, fontWeight:500, lineHeight:1.45 }}>These settings override core financial calculations. Use only for comp, crew, or special promotional fares.</span></WarnBanner>
        <ROToggle label="Waive All Government Taxes"         helper="Zeros out all government taxes."    value={form.waiveGovTaxes}  status={getO('waiveGovTaxes')}/>
        <ROToggle label="Waive All Cruise Expenses"          helper="Zeros out port fees and expenses."  value={form.waiveCruiseExp} status={getO('waiveCruiseExp')}/>
        <ROToggle label="Hide Fares on PDFs & Cruise Control" helper="Pricing hidden from confirmations." value={form.noFareDisplay}  status={getO('noFareDisplay')}/>
      </ROSection>

      {/* 6. Supplements */}
      <ROSection n={6} title="Supplements">
        {enabledSupplements.length ? enabledSupplements.map((supp, index) => (
          <div key={supp.id || index} style={{ border:`1px solid ${T.line}`, borderRadius:9, background:'#fff', overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 11px', background:T.fill, borderBottom:`1px solid ${T.lineSoft}` }}>
              <FCSuppBadge type={supp.type}/>
              <span style={{ minWidth:0, flex:1, fontSize:12.5, fontWeight:700, color:T.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{supp.name || `Configuration ${index+1}`}</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:T.green, fontSize:10.5, fontWeight:700 }}><span style={{ width:5, height:5, borderRadius:'50%', background:T.green }}/>Included</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:10, padding:'11px' }}>
              <div><div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Cabin scope</div><div style={{ fontSize:12, color:T.ink, marginTop:4 }}>{fcSuppCabinLabel(supp)}</div></div>
              <div><div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Application</div><div style={{ fontSize:12, color:T.ink, marginTop:4 }}>{fcSuppRuleLabel(supp.rule)}{supp.maxCount ? ` · Max ${supp.maxCount}` : ''}</div></div>
              <div><div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Fare positions</div><div style={{ fontSize:12, color:T.ink, marginTop:4 }}>{supp.farePos?.length ? supp.farePos.join(', ') : 'All positions'}</div></div>
            </div>
          </div>
        )) : (
          <div style={{ padding:'18px 14px', borderRadius:8, background:T.fill, border:`1px solid ${T.line}`, textAlign:'center' }}>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.inkSoft }}>No supplements included</div>
            <div style={{ fontSize:11, color:T.inkFaint, lineHeight:1.45, marginTop:4 }}>This Farecode has no complimentary or paid extras configured.</div>
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'9px 11px', borderRadius:8, background:T.primaryBg, border:`1px solid ${T.primaryLine}` }}>
          <span style={{ fontSize:11.5, color:T.inkSoft }}>Sailing scope</span>
          <span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:11.5, fontWeight:700, color:T.primary }}>{farecodeSailingLabel(form)}</span>
        </div>
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
        <div style={{ fontSize:12.5, color:T.inkSoft, lineHeight:1.45, marginTop:-4 }}>Fare <strong style={{ color:T.ink, fontWeight:600 }}>per guest</strong> in USD, by cabin category and guest position.</div>
        <PricingReadOnlyTable pricing={pricing} columns={pricingColumns}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'10px 14px', background:T.fill, borderRadius:8, border:`1px solid ${T.lineSoft}` }}>
          <span style={{ fontSize:12, color:T.inkSoft }}>Lead-in cabin fare <span style={{ color:T.inkFaint }}>· lowest category, 2 guests</span></span>
          <span style={{ fontSize:15, fontWeight:700, color:T.ink, fontFamily:"'SF Mono',Menlo,monospace" }}>{leadInLabel}</span>
        </div>
      </ROSection>
      {pricingExpanded && <PricingExpandedModal pricing={pricing} columns={pricingColumns} leadIn={leadInLabel} onClose={closeExpandedPricing}/>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   EDIT mode sections S1–S8
─────────────────────────────────────────────── */
function S1({ form, set, mode, errors, onFaretypeSelect }) {
  const [ftQ, setFtQ]       = useState('');
  const [ftOpen, setFtOpen] = useState(false);
  const ftRef = useRef();
  const ftMenuId = useRef(`faretype-search-${Math.random().toString(36).slice(2)}`).current;
  useEffect(() => {
    if (!ftOpen) return;
    const h = e => { if (ftRef.current && !ftRef.current.contains(e.target)) setFtOpen(false); };
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h);
  }, [ftOpen]);
  const sailings   = form.ship ? (SHIPS_DATA[form.ship]||[]) : [];
  const filteredFTs = FT_DATA.filter(ft => ft.code.toLowerCase().includes(ftQ.toLowerCase()) || ft.basis.toLowerCase().includes(ftQ.toLowerCase()));
  const selFT  = FT_DATA.find(ft => ft.code === form.faretype);
  const locked = mode !== 'create';
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.05)', overflow:'visible' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}`, borderRadius:'10px 10px 0 0' }}>
        <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>01</span>
        <div>
          <h2 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Ship &amp; Sailings</h2>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Choose the ship, one or more departures, and the parent Faretype for this Farecode.</p>
        </div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'16px' }}>
        <div>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:10 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Sailing Context</div>
              <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>The ship and departures that this Farecode prices.</div>
            </div>
            {locked && (
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 7px', borderRadius:5, background:T.fill, border:`1px solid ${T.line}`, color:T.inkSoft, fontSize:10.5, fontWeight:600, whiteSpace:'nowrap' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>Locked after creation
              </span>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Field label="Ship" required error={errors.ship}>
              <Sel ariaLabel="Ship" value={form.ship} onChange={v => { set('ship',v); set('sailing',''); set('sailings',[]); }} dis={locked} err={errors.ship} opts={[['','Select ship…'],...Object.keys(SHIPS_DATA).map(s=>[s,s])]}/>
            </Field>
            <Field label="Sailings" required helper="Select one or more departures for this Farecode." error={errors.sailing}>
              <MultiChip values={farecodeSailingValues(form)}
                onChange={values => { set('sailings', values); set('sailing', values[0] || ''); }}
                opts={sailings} placeholder={form.ship ? 'Select sailings…' : 'Select a ship first'}
                ariaLabel="Sailings" ariaInvalid={!!errors.sailing} ariaRequired="true" disabled={locked || !form.ship} />
            </Field>
          </div>
        </div>

        <div style={{ paddingTop:14, borderTop:`1px solid ${T.lineSoft}` }}>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Parent Faretype</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>Supplies inherited policies, eligibility, access, and pricing defaults.</div>
          </div>
          <Field label="Faretype Code" required helper={!locked?"Selecting a Faretype auto-populates inherited settings.":undefined} error={errors.faretype}>
            {locked ? (
              <div style={{ ...iS(false,true), display:'flex', alignItems:'center', gap:8 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:12.5, fontWeight:700 }}>{form.faretype}</span>
                {selFT && <span style={{ fontSize:11.5, color:T.inkSoft }}>· {selFT.basis} · {selFT.group}</span>}
              </div>
            ) : (
              <div ref={ftRef} style={{ position:'relative' }}>
                <button type="button" role="combobox" aria-haspopup="listbox" aria-controls={ftMenuId} aria-expanded={ftOpen}
                  onClick={() => setFtOpen(true)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); setFtOpen(true); } else if (e.key === 'Escape') setFtOpen(false); }}
                  style={{ ...iS(!!errors.faretype,false), display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
                  {selFT ? <><span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:12.5, fontWeight:700 }}>{form.faretype}</span><span style={{ fontSize:11.5, color:T.inkSoft }}>· {selFT.basis} · {selFT.group}</span></> : <span style={{ color:T.inkFaint }}>Search by code or basis…</span>}
                </button>
                {ftOpen && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:4, background:'#fff', border:`1px solid ${T.line}`, borderRadius:9, boxShadow:'0 8px 24px rgba(0,0,0,.1)', zIndex:600, overflow:'hidden' }}>
                    <div style={{ padding:'8px 12px', borderBottom:`1px solid ${T.lineSoft}`, display:'flex', gap:6, alignItems:'center' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input autoFocus aria-label="Search Faretypes" value={ftQ} onChange={e => setFtQ(e.target.value)} placeholder="Search faretype…" style={{ border:'none', outline:'none', fontSize:13, color:T.ink, background:'transparent', width:'100%' }}/>
                    </div>
                    <div id={ftMenuId} role="listbox" aria-label="Faretype options">
                      {filteredFTs.map(ft => (
                        <button key={ft.code} type="button" role="option" aria-selected={ft.code === form.faretype} onClick={() => { onFaretypeSelect(ft); setFtOpen(false); setFtQ(''); }} style={{ width:'100%', padding:'10px 14px', border:'none', background:ft.code === form.faretype ? T.primaryBg : '#fff', cursor:'pointer', display:'flex', gap:8, alignItems:'center', fontFamily:'inherit', textAlign:'left' }} onMouseEnter={e => e.currentTarget.style.background=T.fill} onMouseLeave={e => e.currentTarget.style.background=ft.code === form.faretype ? T.primaryBg : '#fff'}>
                          <span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:12.5, fontWeight:700, color:T.primary }}>{ft.code}</span>
                          <span style={{ fontSize:11.5, color:T.inkSoft }}>· {ft.basis}</span>
                          <span style={{ marginLeft:'auto', padding:'2px 7px', borderRadius:999, fontSize:10.5, fontWeight:600, background:T.primaryBg, color:T.primary }}>{ft.group}</span>
                        </button>
                      ))}
                      {filteredFTs.length===0 && <div style={{ padding:14, fontSize:13, color:T.inkFaint, textAlign:'center' }}>No match</div>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Field>
          {form.faretype && !locked && (
            <div style={{ marginTop:12, padding:'10px 12px', background:T.greenLight, border:'1px solid #BBF7D0', borderRadius:7, fontSize:12, color:T.green, display:'flex', alignItems:'center', gap:8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink:0 }}><polyline points="20 6 9 17 4 12"/></svg>
              Inherited settings loaded from <strong style={{ fontFamily:"'SF Mono',Menlo,monospace" }}>{form.faretype}</strong>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function S2({ form, set, overrides, toggleOverride, errors, policies, number=2, title='Policies', description='Assign the cancellation and deposit rules that govern this Farecode.', merged=false, showSource=true }) {
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
  const policyCardStyle = k => ({
    padding:'12px',
    border:`1px solid ${getS(k)==='overridden'?T.primaryLine:T.line}`,
    borderRadius:8,
    background:isD(k)?T.fill:'#fff',
  });
  return (
    <div style={merged ? { background:'transparent' } : { background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.05)', overflow:'hidden' }}>
      {!merged && <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>{String(number).padStart(2,'0')}</span>
        <div>
          <h2 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>{title}</h2>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>{description}</p>
        </div>
      </div>}
      <div style={{ display:'flex', flexDirection:'column', gap:14, padding:merged?'16px 16px 15px':'16px' }}>
        {showSource && <div style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'10px 12px', borderRadius:8, background:hasFT?T.primaryBg:T.fill, border:`1px solid ${hasFT?T.primaryLine:T.line}` }}>
          <div style={{ width:26, height:26, borderRadius:6, background:'#fff', border:`1px solid ${hasFT?T.primaryLine:T.line}`, color:hasFT?T.primary:T.inkFaint, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.ink }}>{hasFT?'Inherited policy source':'No parent Faretype selected'}</div>
            <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.4, marginTop:2 }}>
              {hasFT ? <><span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontWeight:700, color:T.primary }}>{form.faretype}</span> supplies the defaults. Override only when this Farecode needs an exception.</> : <>Choose a parent Faretype in Ship &amp; Sailing to prefill defaults, or assign policies directly here.</>}
            </div>
          </div>
        </div>}

        <div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Policy Assignment</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>Review both rules together to keep payment and refund terms aligned.</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={policyCardStyle('cancellationPolicy')}>
              <OField label="Cancellation Policy" required helper="Controls cancellation charges and refund treatment." status={getS('cancellationPolicy')} error={errors.cancellationPolicy} onOverride={() => toggleOverride('cancellationPolicy')} onRevert={() => toggleOverride('cancellationPolicy')}>
                <Sel ariaLabel="Cancellation Policy" value={form.cancellationPolicy} onChange={v => set('cancellationPolicy',v)} dis={isD('cancellationPolicy')} err={errors.cancellationPolicy} opts={polOpts('cancel', form.cancellationPolicy)}/>
              </OField>
            </div>
            <div style={policyCardStyle('depositPolicy')}>
              <OField label="Deposit Policy" required helper="Defines deposit amount and payment timing." status={getS('depositPolicy')} error={errors.depositPolicy} onOverride={() => toggleOverride('depositPolicy')} onRevert={() => toggleOverride('depositPolicy')}>
                <Sel ariaLabel="Deposit Policy" value={form.depositPolicy} onChange={v => set('depositPolicy',v)} dis={isD('depositPolicy')} err={errors.depositPolicy} opts={polOpts('deposit', form.depositPolicy)}/>
              </OField>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function S3({ form, set, overrides, toggleOverride, number=3, title='Eligibility', description='Define who can book, party limits, and permitted booking paths.', merged=false, showSource=true }) {
  const hasFT = !!form.faretype;
  const getS  = (k, noOvr=false) => noOvr?(hasFT?'locked':'free'):(hasFT?(overrides[k]||'inherited'):'free');
  const isD   = (k, noOvr=false) => {
    const status = getS(k, noOvr);
    return status === 'locked' || status === 'inherited';
  };
  const fieldCardStyle = (k, noOvr=false) => {
    const status = getS(k, noOvr);
    return {
      padding:'12px',
      border:`1px solid ${status==='overridden'?T.primaryLine:T.line}`,
      borderRadius:8,
      background:isD(k,noOvr)?T.fill:'#fff',
      transition:'border-color .15s, background .15s',
    };
  };
  const FLAGS = [{ k:'standbyEligible',l:'Standby Eligible',h:'Allow standby booking.' },{ k:'upgradeEligible',l:'Upgrade Eligible',h:'Allow cabin upgrades.' },{ k:'couponEligible',l:'Coupon Eligible',h:'Allow coupon codes.' }];
  return (
    <div style={merged ? { background:'transparent' } : { background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.05)', overflow:'hidden' }}>
      {!merged && <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>{String(number).padStart(2,'0')}</span>
        <div>
          <h2 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>{title}</h2>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>{description}</p>
        </div>
      </div>}
      <div style={{ display:'flex', flexDirection:'column', gap:16, padding:merged?'15px 16px 16px':'16px' }}>
        {showSource && <div style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'10px 12px', borderRadius:8, background:hasFT?T.primaryBg:T.fill, border:`1px solid ${hasFT?T.primaryLine:T.line}` }}>
          <div style={{ width:26, height:26, borderRadius:6, background:'#fff', border:`1px solid ${hasFT?T.primaryLine:T.line}`, color:hasFT?T.primary:T.inkFaint, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.ink }}>{hasFT?'Inherited eligibility source':'Farecode-level eligibility'}</div>
            <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.4, marginTop:2 }}>
              {hasFT ? <><span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontWeight:700, color:T.primary }}>{form.faretype}</span> controls residency and minimum age. Other inherited rules can be overridden for this Farecode.</> : <>Select a parent Faretype to inherit its rules. Until then, eligibility is configured directly here.</>}
            </div>
          </div>
        </div>}
        <div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Guest Requirements</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>{hasFT?'Parent-controlled qualification rules for this Farecode.':'Core qualification rules for eligible guests.'}</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={fieldCardStyle('residency',true)}>
              <OField label="Residency" status={getS('residency',true)} noOvr>
                <Sel ariaLabel="Residency" value={form.residency} onChange={v => set('residency',v)} dis={isD('residency',true)} opts={[['Any','Any'],['US Only','US Only'],['Non-US','Non-US'],['Canada','Canada'],['UK','UK']]}/>
              </OField>
            </div>
            <div style={fieldCardStyle('minAge',true)}>
              <OField label="Minimum Age" status={getS('minAge',true)} noOvr>
                <input className="fi" type="number" style={iS(false,isD('minAge',true))} value={form.minAge} disabled={isD('minAge',true)} min={0} max={99} onChange={e => set('minAge',e.target.value)}/>
              </OField>
            </div>
          </div>
        </div>

        <div style={{ paddingTop:14, borderTop:`1px solid ${T.lineSoft}` }}>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Booking Constraints</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>Set party-size boundaries and the minimum booking lead time.</div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={fieldCardStyle('minOccupancy')}>
              <OField label="Min Occupancy" status={getS('minOccupancy')} onOverride={() => toggleOverride('minOccupancy')} onRevert={() => toggleOverride('minOccupancy')}>
                <input className="fi" type="number" style={iS(false,isD('minOccupancy'))} value={form.minOccupancy} disabled={isD('minOccupancy')} placeholder="1" onChange={e => set('minOccupancy',e.target.value)}/>
              </OField>
            </div>
            <div style={fieldCardStyle('maxOccupancy')}>
              <OField label="Max Occupancy" status={getS('maxOccupancy')} onOverride={() => toggleOverride('maxOccupancy')} onRevert={() => toggleOverride('maxOccupancy')}>
                <input className="fi" type="number" style={iS(false,isD('maxOccupancy'))} value={form.maxOccupancy} disabled={isD('maxOccupancy')} placeholder="4" onChange={e => set('maxOccupancy',e.target.value)}/>
              </OField>
            </div>
            <div style={{ ...fieldCardStyle('advancedPurchase'), gridColumn:'1 / -1' }}>
              <OField label="Advanced Purchase" status={getS('advancedPurchase')} helper="Minimum days before sailing. Leave blank for no restriction." onOverride={() => toggleOverride('advancedPurchase')} onRevert={() => toggleOverride('advancedPurchase')}>
                <input className="fi" type="number" style={iS(false,isD('advancedPurchase'))} value={form.advancedPurchase} disabled={isD('advancedPurchase')} placeholder="No restriction" onChange={e => set('advancedPurchase',e.target.value)}/>
              </OField>
            </div>
          </div>
        </div>
        <div style={{ paddingTop:14, borderTop:`1px solid ${T.lineSoft}` }}>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Booking Permissions</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>Control optional booking paths and commercial entitlements.</div>
          </div>
          <div style={{ border:`1px solid ${T.line}`, borderRadius:8, overflow:'hidden' }}>
            {FLAGS.map(({ k,l,h }, index) => (
              <div key={k} style={{ padding:'11px 12px', borderBottom:index<FLAGS.length-1?`1px solid ${T.lineSoft}`:'none', background:getS(k)==='overridden'?T.primaryBg:isD(k)?T.fill:'#fff', transition:'background .15s' }}>
                <OTRow label={l} helper={h} on={form[k]} onChange={v => set(k,v)} status={getS(k)} onOverride={() => toggleOverride(k)} onRevert={() => toggleOverride(k)}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function PartnerAccessStep({ form, set }) {
  const selected = form.channelPartners.length;
  const hasFT = !!form.faretype;
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.05)', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>03</span>
        <div>
          <h2 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Partner Access</h2>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Choose which agency partners can access this Farecode through the MVAS B2B channel.</p>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'16px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'10px 12px', borderRadius:8, background:form.chMVASB2B?T.primaryBg:T.amberLight, border:`1px solid ${form.chMVASB2B?T.primaryLine:T.amberBorder}` }}>
          <div style={{ width:26, height:26, borderRadius:6, background:'#fff', border:`1px solid ${form.chMVASB2B?T.primaryLine:T.amberBorder}`, color:form.chMVASB2B?T.primary:T.amberDark, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><path d="M7 7l3 3M17 7l-3 3"/></svg>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:form.chMVASB2B?T.ink:T.amberDark }}>{form.chMVASB2B?'MVAS B2B is enabled':'MVAS B2B is disabled in Step 4'}</div>
            <div style={{ fontSize:11.5, color:form.chMVASB2B?T.inkSoft:T.amberDark, lineHeight:1.4, marginTop:2 }}>
              {hasFT ? <><span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontWeight:700 }}>{form.faretype}</span> supplies the initial partner access. Changes here apply only to this Farecode.</> : <>Partner selections are retained and apply whenever the B2B channel is enabled.</>}
            </div>
          </div>
        </div>

        <div style={{ border:`1px solid ${T.lineSoft}`, borderRadius:9, background:T.fill, padding:14 }}>
          <div style={{ marginBottom:11 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Partner Restrictions</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, lineHeight:1.4, marginTop:3 }}>Optional — leave empty to make this Farecode available to every agency.</div>
          </div>
          <label style={{ display:'block', fontSize:10.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px', marginBottom:6 }}>Applicable Channel Partners</label>
          <MultiChip values={form.channelPartners} onChange={v => set('channelPartners',v)} opts={CHANNEL_PARTNERS} placeholder="Search agencies…" ariaLabel="Search channel partners"/>
        </div>

        <div style={{ padding:'10px 12px', border:`1px solid ${T.line}`, borderRadius:8, background:'#fff', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Partner Availability</div>
            <div style={{ fontSize:11.5, color:T.inkSoft, marginTop:4 }}>{selected?`${selected} selected partner${selected===1?'':'s'}`:'Available to every agency'}</div>
          </div>
          <span style={{ minWidth:30, height:24, padding:'0 8px', borderRadius:999, display:'inline-flex', alignItems:'center', justifyContent:'center', background:selected?T.primaryBg:T.fill, border:`1px solid ${selected?T.primaryLine:T.line}`, color:selected?T.primary:T.inkSoft, fontSize:11, fontWeight:800 }}>{selected||'All'}</span>
        </div>
      </div>
    </div>
  );
}

function ChannelAccessStep({ form, set, overrides, toggleOverride }) {
  const hasFT = !!form.faretype;
  const getS  = k => hasFT?(overrides[k]||'inherited'):'free';
  const chLocked = hasFT && getS('channelVisibility')!=='overridden';
  const CHS = [
    { k:'chMVASB2C', l:'MVAS B2C',       h:'Consumer booking channel' },
    { k:'chMVASB2B', l:'MVAS B2B',       h:'Travel advisor sales' },
    { k:'chCC',      l:'Cruise Control',  h:'Internal booking workspace' },
    { k:'chTradeAPI',l:'Trade API',       h:'Partner integrations' },
    { k:'chCRM',     l:'CRM',             h:'Agent servicing workspace' },
    { k:'chGroup',   l:'Group',           h:'Group sales tools' },
  ];
  const vis = CHS.filter(c => form[c.k]).map(c => c.l);
  const hid = CHS.filter(c => !form[c.k]).map(c => c.l);
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.05)', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>02</span>
        <div>
          <h2 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Channel Access</h2>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Control where this Farecode can be booked and which systems can surface it.</p>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'16px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'10px 12px', borderRadius:8, background:hasFT?T.primaryBg:T.fill, border:`1px solid ${hasFT?T.primaryLine:T.line}` }}>
          <div style={{ width:26, height:26, borderRadius:6, background:'#fff', border:`1px solid ${hasFT?T.primaryLine:T.line}`, color:hasFT?T.primary:T.inkFaint, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3"/></svg>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.ink }}>{hasFT?'Inherited access source':'Farecode-level access'}</div>
            <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.4, marginTop:2 }}>
              {hasFT ? <><span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontWeight:700, color:T.primary }}>{form.faretype}</span> supplies the default access and channel reach. Override a section only when this Farecode needs an exception.</> : <>Configure access directly here. Selecting a parent Faretype will prefill its channel rules.</>}
            </div>
          </div>
        </div>

        <div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Internal Workspace</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>Decide whether internal teams can find and book this Farecode.</div>
          </div>
          <div style={{ padding:'12px', border:`1px solid ${getS('cruiseControlAccess')==='overridden'?T.primaryLine:T.line}`, borderRadius:8, background:hasFT&&getS('cruiseControlAccess')!=='overridden'?T.fill:'#fff' }}>
            <OTRow label="Available in Cruise Control" helper="Shows this Farecode in the internal booking workspace." on={form.cruiseControlAccess} onChange={v => set('cruiseControlAccess',v)} status={getS('cruiseControlAccess')} onOverride={() => toggleOverride('cruiseControlAccess')} onRevert={() => toggleOverride('cruiseControlAccess')}/>
          </div>
        </div>

        <div style={{ paddingTop:14, borderTop:`1px solid ${T.lineSoft}` }}>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Distribution Reach</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>Choose the customer, partner, and operations channels that can surface this Farecode.</div>
          </div>
          <OField label="Visibility Rules" status={getS('channelVisibility')} onOverride={() => toggleOverride('channelVisibility')} onRevert={() => toggleOverride('channelVisibility')}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:4 }}>
              {CHS.map((c,index) => (
                <div key={c.k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'10px 11px', border:`1px solid ${T.line}`, borderRadius:8, background:chLocked?T.fill:form[c.k]?'#fff':T.fill, gridColumn:CHS.length % 2 === 1 && index === CHS.length - 1?'1 / -1':undefined }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight:600, color:T.ink }}>{c.l}</div>
                    <div style={{ fontSize:10.5, color:T.inkFaint, marginTop:2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.h}</div>
                  </div>
                  <Toggle on={form[c.k]} onChange={v => set(c.k,v)} dis={chLocked} label={c.l}/>
                </div>
              ))}
            </div>
          </OField>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
            <div style={{ padding:'10px 11px', borderRadius:8, background:T.greenLight, border:'1px solid #BBF7D0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11.5, fontWeight:700, color:T.green }}><span style={{ width:6, height:6, borderRadius:'50%', background:T.green }}/>{vis.length} visible</div>
              <div style={{ fontSize:10.5, color:T.inkSoft, lineHeight:1.45, marginTop:5 }}>{vis.length?vis.join(' · '):'No channels selected'}</div>
            </div>
            <div style={{ padding:'10px 11px', borderRadius:8, background:T.fill, border:`1px solid ${T.line}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11.5, fontWeight:700, color:T.inkSoft }}><span style={{ width:6, height:6, borderRadius:'50%', background:T.inkFaint }}/>{hid.length} hidden</div>
              <div style={{ fontSize:10.5, color:T.inkSoft, lineHeight:1.45, marginTop:5 }}>{hid.length?hid.join(' · '):'All channels visible'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function S6({ form, set, overrides, toggleOverride }) {
  const hasFT = !!form.faretype;
  const getS  = k => hasFT?(overrides[k]||'inherited'):'free';
  const isD   = k => hasFT && getS(k)!=='overridden';
  const OFFERS = [['','None'],['OFFER-2026-SPRING','OFFER-2026-SPRING'],['OFFER-2026-SUMMER','OFFER-2026-SUMMER'],['OFFER-CASINO-Q2','OFFER-CASINO-Q2']];
  const MULTI_OFFERS = OFFERS.filter(([value]) => value).map(([value]) => value);
  const SLOTS = [
    { k:'offerPrimary',   n:'01', l:'Primary offer',   h:'First promotion evaluated for this Farecode.' },
    { k:'offerSecondary', n:'02', l:'Secondary offer', h:'Fallback when the primary offer is unavailable.' },
    { k:'offerTertiary',  n:'03', l:'Tertiary offers', h:'Final fallbacks in the offer sequence. Select one or more offers.' },
  ];
  const slotCardStyle = k => ({
    padding:'12px',
    border:`1px solid ${getS(k)==='overridden'?T.primaryLine:T.line}`,
    borderRadius:8,
    background:isD(k)?T.fill:'#fff',
  });
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.05)', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>04</span>
        <div>
          <h2 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Marketing &amp; Messaging</h2>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Manage optional promotional copy and the prioritized offer sequence.</p>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'16px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'10px 12px', borderRadius:8, background:hasFT?T.primaryBg:T.fill, border:`1px solid ${hasFT?T.primaryLine:T.line}` }}>
          <div style={{ width:26, height:26, borderRadius:6, background:'#fff', border:`1px solid ${hasFT?T.primaryLine:T.line}`, color:hasFT?T.primary:T.inkFaint, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11v2a2 2 0 0 0 2 2h2l4 4V5L7 9H5a2 2 0 0 0-2 2z"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M18 6a8 8 0 0 1 0 12"/></svg>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.ink }}>{hasFT?'Inherited marketing source':'Farecode-level marketing'}</div>
            <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.4, marginTop:2 }}>
              {hasFT ? <><span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontWeight:700, color:T.primary }}>{form.faretype}</span> supplies the default message and offer stack. Override only the item that needs to differ.</> : <>Configure optional messaging and offers directly here. A parent Faretype can prefill these defaults.</>}
            </div>
          </div>
        </div>

        <div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Guest-facing Message</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>Add concise promotional copy where supported by the booking channel.</div>
          </div>
          <div style={{ padding:'12px', border:`1px solid ${getS('includeDiscount')==='overridden'?T.primaryLine:T.line}`, borderRadius:8, background:isD('includeDiscount')?T.fill:'#fff' }}>
            <OTRow label="Show discount message" helper="Displays promotional copy alongside this Farecode." on={form.includeDiscount} onChange={v => set('includeDiscount',v)} status={getS('includeDiscount')} onOverride={() => toggleOverride('includeDiscount')} onRevert={() => toggleOverride('includeDiscount')}/>
            {form.includeDiscount ? (
              <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${T.lineSoft}` }}>
                <OField label="Message Copy" status={getS('discountMessage')} helper="Keep the message specific, factual, and under 200 characters." onOverride={() => toggleOverride('discountMessage')} onRevert={() => toggleOverride('discountMessage')}>
                  <div style={{ position:'relative' }}>
                    <textarea className="fi" style={{ ...iS(false,isD('discountMessage')), minHeight:78, resize:'vertical', lineHeight:1.55, paddingRight:48 }} value={form.discountMessage} disabled={isD('discountMessage')} maxLength={200} placeholder="e.g. Last-minute savings — book by Friday for 25% off" onChange={e => set('discountMessage',e.target.value)}/>
                    <span style={{ position:'absolute', bottom:9, right:10, fontSize:10.5, color:T.inkFaint }}>{(form.discountMessage||'').length}/200</span>
                  </div>
                </OField>
              </div>
            ) : (
              <div style={{ marginTop:10, paddingTop:10, borderTop:`1px solid ${T.lineSoft}`, fontSize:11.5, color:T.inkFaint }}>No guest-facing discount message will be shown.</div>
            )}
          </div>
        </div>
        <div style={{ paddingTop:14, borderTop:`1px solid ${T.lineSoft}` }}>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Offer Priority</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>Offers are evaluated in sequence. Primary and Secondary accept one offer; Tertiary can include multiple fallbacks.</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {SLOTS.map(slot => (
              <div key={slot.k} style={slotCardStyle(slot.k)}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                  <span style={{ minWidth:28, height:24, padding:'0 6px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>{slot.n}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12.5, fontWeight:700, color:T.ink }}>{slot.l}</div>
                    <div style={{ fontSize:10.5, color:T.inkFaint, lineHeight:1.4, marginTop:2 }}>{slot.h}</div>
                    <div style={{ marginTop:10 }}>
                      <OField label={slot.k==='offerTertiary'?'Offers':'Offer'} status={getS(slot.k)} helper={slot.k==='offerTertiary'?'Leave empty when no tertiary fallback is needed.':undefined} onOverride={() => toggleOverride(slot.k)} onRevert={() => toggleOverride(slot.k)}>
                        {slot.k==='offerTertiary' ?
                          <MultiChip values={Array.isArray(form[slot.k]) ? form[slot.k] : form[slot.k] ? [form[slot.k]] : []} onChange={v => set(slot.k,v)} opts={MULTI_OFFERS} placeholder="Select one or more offers…" ariaLabel="Tertiary offers" disabled={isD(slot.k)}/> :
                          <Sel ariaLabel={slot.l} value={form[slot.k]} onChange={v => set(slot.k,v)} dis={isD(slot.k)} opts={OFFERS}/>
                        }
                      </OField>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function S7({ form, set, overrides, toggleOverride }) {
  const hasFT = !!form.faretype;
  const getS  = k => hasFT?(overrides[k]||'inherited'):'free';
  const isD   = k => hasFT && getS(k)!=='overridden';
  const FINANCIALS = [
    { k:'waiveGovTaxes', l:'Waive government taxes', h:'Sets all government-tax charges to zero.', impact:'Government taxes will calculate at $0.' },
    { k:'waiveCruiseExp',l:'Waive cruise expenses',  h:'Sets port fees and cruise expenses to zero.', impact:'Port fees and cruise expenses will calculate at $0.' },
  ];
  const waiverCount = FINANCIALS.filter(item => form[item.k]).length;
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.05)', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>05</span>
        <div>
          <h2 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Taxes &amp; Privacy</h2>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Manage restricted financial waivers and fare-display privacy.</p>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'16px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'10px 12px', borderRadius:8, background:hasFT?T.primaryBg:T.fill, border:`1px solid ${hasFT?T.primaryLine:T.line}` }}>
          <div style={{ width:26, height:26, borderRadius:6, background:'#fff', border:`1px solid ${hasFT?T.primaryLine:T.line}`, color:hasFT?T.primary:T.inkFaint, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9.5 9.5c0-1 1-1.7 2.5-1.7s2.5.6 2.5 1.7-1 1.5-2.5 1.8-2.5.8-2.5 1.9 1 1.8 2.5 1.8 2.5-.7 2.5-1.8"/><path d="M12 6.5v10"/></svg>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.ink }}>{hasFT?'Inherited control source':'Farecode-level safeguards'}</div>
            <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.4, marginTop:2 }}>
              {hasFT ? <><span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontWeight:700, color:T.primary }}>{form.faretype}</span> supplies the defaults. Override only with documented approval for this Farecode.</> : <>All restricted controls default to off and are configured directly for this Farecode.</>}
            </div>
          </div>
        </div>

        <div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Financial Waivers</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>Exceptions that directly change the Farecode's calculated charges.</div>
          </div>
          <WarnBanner>
            <div>
              <div style={{ fontSize:12, color:T.amberDark, fontWeight:700 }}>Restricted financial controls</div>
              <div style={{ fontSize:11.5, color:T.amberDark, lineHeight:1.45, marginTop:2 }}>Use only for approved comp, crew, or promotional fares. Activating a waiver sets the related charge to zero.</div>
            </div>
          </WarnBanner>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
            {FINANCIALS.map(item => (
              <div key={item.k} style={{ padding:'12px', border:`1px solid ${form[item.k]?T.amberBorder:getS(item.k)==='overridden'?T.primaryLine:T.line}`, borderRadius:8, background:form[item.k]?T.amberLight:isD(item.k)?T.fill:'#fff', transition:'border-color .15s, background .15s' }}>
                <OTRow label={item.l} helper={item.h} on={form[item.k]} onChange={v => set(item.k,v)} status={getS(item.k)} onOverride={() => toggleOverride(item.k)} onRevert={() => toggleOverride(item.k)}/>
                {form[item.k] && <div style={{ marginTop:10, paddingTop:9, borderTop:`1px solid ${T.amberBorder}`, fontSize:11.5, color:T.amberDark }}><strong>Impact:</strong> {item.impact}</div>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ paddingTop:14, borderTop:`1px solid ${T.lineSoft}` }}>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Fare Privacy</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3 }}>Control whether fare amounts appear in customer and internal outputs.</div>
          </div>
          <div style={{ padding:'12px', border:`1px solid ${form.noFareDisplay||getS('noFareDisplay')==='overridden'?T.primaryLine:T.line}`, borderRadius:8, background:form.noFareDisplay?T.primaryBg:isD('noFareDisplay')?T.fill:'#fff' }}>
            <OTRow label="Hide fare amounts" helper="Suppresses pricing on confirmation PDFs and the Cruise Control view." on={form.noFareDisplay} onChange={v => set('noFareDisplay',v)} status={getS('noFareDisplay')} onOverride={() => toggleOverride('noFareDisplay')} onRevert={() => toggleOverride('noFareDisplay')}/>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, paddingTop:14, borderTop:`1px solid ${T.lineSoft}` }}>
          <div style={{ padding:'10px 11px', borderRadius:8, background:waiverCount?T.amberLight:T.fill, border:`1px solid ${waiverCount?T.amberBorder:T.line}` }}>
            <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Calculation</div>
            <div style={{ fontSize:12.5, fontWeight:700, color:waiverCount?T.amberDark:T.ink, marginTop:4 }}>{waiverCount?`${waiverCount} waiver${waiverCount===1?'':'s'} active`:'Standard charges'}</div>
          </div>
          <div style={{ padding:'10px 11px', borderRadius:8, background:form.noFareDisplay?T.primaryBg:T.fill, border:`1px solid ${form.noFareDisplay?T.primaryLine:T.line}` }}>
            <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Fare Display</div>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.ink, marginTop:4 }}>{form.noFareDisplay?'Amounts hidden':'Amounts visible'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section 8 · Supplements ── */
const FC_SUPP_CABIN = ['Interior', 'Ocean View', 'Balcony', 'Suite'];
const FC_SUPP_RULE = [['Booking', 'Per booking'], ['Cabin', 'Per cabin'], ['Guest', 'Per guest']];
const FC_SUPP_FPOS = ['Fare Position 1', 'Fare Position 2', 'Fare Position 3', 'Fare Position 4'];
const FC_SUPP_TYPES = ['comp', 'paid'];
const fcSuppTypeLabel = type => type === 'comp' ? 'Complementary' : 'Paid';
const fcSuppRuleLabel = rule => ({ Booking:'Per booking', Cabin:'Per cabin', Guest:'Per guest' })[rule] || rule;
const fcSuppCabinValues = supp => {
  if (Array.isArray(supp?.cabins)) return supp.cabins;
  if (supp?.cabin && !['Any', 'All', 'Any cabin', 'All cabin categories'].includes(supp.cabin)) return [supp.cabin];
  return [];
};
const fcSuppCabinLabel = supp => {
  const cabins = fcSuppCabinValues(supp);
  return cabins.length ? cabins.join(', ') : 'All cabin categories';
};
let fcSuppSeq = 0;
const mkCustomFarecodeSupp = type => ({ ...mkSupp(`fc-sup-custom-${++fcSuppSeq}`, `${fcSuppTypeLabel(type)} Supplement`, type), enabled:true, custom:true });

function FCSuppBadge({ type }) {
  const comp = type === 'comp';
  return (
    <span style={{ padding:'2px 7px', borderRadius:999, background:comp?T.tealLight:T.primaryBg, color:comp?T.tealDark:T.inkSoft, fontSize:9.5, fontWeight:750, whiteSpace:'nowrap' }}>
      {comp ? 'Comp' : 'Paid'}
    </span>
  );
}

function fcSuppRecap(supp) {
  const positions = Array.isArray(supp.farePos) ? supp.farePos.join(', ') : supp.farePos;
  return [fcSuppCabinLabel(supp), fcSuppRuleLabel(supp.rule), supp.maxCount && `Max ${supp.maxCount}`, positions].filter(Boolean).join(' · ');
}

function FCSuppDetail({ supp, sailing, onUpdate, onAdd }) {
  const setValue = (key, value) => onUpdate({ ...supp, [key]:value });
  return (
    <div style={{ padding:'14px 13px 15px', background:'#FBFCFE', borderRadius:'0 0 9px 9px', display:'flex', flexDirection:'column', gap:12 }}>
      <Field label="Supplement Name" required>
        <input className="fi" style={iS()} value={supp.name} onChange={e => setValue('name', e.target.value)} placeholder="e.g. Drinks Package" />
      </Field>
      <Field label="Cabin Categories" helper="Select one or more. Leave empty to include all cabin categories.">
        <MultiChip values={fcSuppCabinValues(supp)} onChange={value => setValue('cabins', value)} opts={FC_SUPP_CABIN}
          placeholder="All cabin categories" ariaLabel="Cabin categories" />
      </Field>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="Rule" helper="Counting and application method.">
          <Sel ariaLabel="Supplement rule" value={supp.rule} onChange={value => setValue('rule', value)} opts={FC_SUPP_RULE} />
        </Field>
        <Field label="Max Count">
          <input className="fi" type="number" min="1" style={iS()} value={supp.maxCount} onChange={e => setValue('maxCount', e.target.value)} placeholder="1" />
        </Field>
      </div>
      <Field label="Allocation to Fare Positions" helper="Select one or more fare positions.">
        <MultiChip values={Array.isArray(supp.farePos) ? supp.farePos : supp.farePos ? [supp.farePos] : []}
          onChange={value => setValue('farePos', value)} opts={FC_SUPP_FPOS} placeholder="Select fare positions…" ariaLabel="Fare position allocation" />
      </Field>
      <div style={{ padding:'10px 11px', borderRadius:8, background:T.fill, border:`1px solid ${T.line}` }}>
        <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Sailing scope</div>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:5, color:T.ink }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.2" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:11.5, fontWeight:700 }}>{sailing || 'Choose sailings in Ship & Sailings'}</span>
        </div>
        <div style={{ fontSize:10.5, color:T.inkFaint, lineHeight:1.4, marginTop:4 }}>This supplement automatically applies across the selected departures.</div>
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:2 }}>
        <button type="button" onClick={onAdd}
          style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7, minHeight:34, padding:'7px 12px', borderRadius:8, border:`1px solid ${T.primary}`, background:T.primary, color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add supplement
        </button>
      </div>
    </div>
  );
}

function FCSuppCard({ supp, position, open, sailing, onToggleOpen, onUpdate, onSetEnabled, onRemove, onAdd }) {
  const enabled = supp.enabled;
  const incomplete = enabled && !supp.name;
  const displayName = supp.name || `Configuration ${position}`;
  return (
    <div style={{ border:`1px solid ${open?'#CBD5E1':enabled?T.line:'#EAEFF4'}`, borderRadius:10, background:enabled?'#fff':'#FBFCFD', boxShadow:enabled?'0 1px 2px rgba(15,23,42,.04)':'none', overflow:'visible' }}>
      <div role={enabled?'button':undefined} tabIndex={enabled?0:undefined} aria-expanded={enabled?open:undefined}
        onClick={() => enabled && onToggleOpen()}
        onKeyDown={e => { if (enabled && (e.key==='Enter' || e.key===' ')) { e.preventDefault(); onToggleOpen(); } }}
        style={{ display:'flex', alignItems:open?'flex-start':'center', gap:7, padding:open?'10px 11px 9px 9px':'8px 10px 8px 8px', minHeight:open?52:42, cursor:enabled?'pointer':'default', borderRadius:open?'9px 9px 0 0':9 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"
          style={{ flexShrink:0, marginTop:open?4:0, opacity:enabled?1:0, transform:open?'rotate(90deg)':'none', transition:'transform .18s' }}><polyline points="9 6 15 12 9 18"/></svg>
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:12.5, fontWeight:650, color:enabled?T.ink:T.inkSoft, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{displayName}</div>
          {enabled && <div style={{ marginTop:open?3:1, fontSize:11, lineHeight:1.3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
            {incomplete ? <span style={{ color:T.amberDark, fontWeight:600 }}>Needs configuration</span> : <span style={{ color:T.inkSoft }}>{fcSuppRecap(supp)}</span>}
          </div>}
        </div>
        <div onClick={e => e.stopPropagation()} style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0, marginTop:open?1:0 }}>
          {supp.custom && <button type="button" onClick={onRemove} aria-label={`Remove ${displayName}`} title="Remove supplement"
            style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center', border:'none', borderRadius:5, background:'transparent', color:T.inkFaint, cursor:'pointer', padding:0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>}
          <Toggle on={enabled} onChange={onSetEnabled} label={`${displayName} included`} />
        </div>
      </div>
      {open && enabled && <div style={{ borderTop:`1px solid ${T.lineSoft}` }}><FCSuppDetail supp={supp} sailing={sailing} onUpdate={onUpdate} onAdd={onAdd} /></div>}
    </div>
  );
}

function FCSuppGroup({ type, entries, open, sailing, onMark, onUpdate, onSetEnabled, onRemove, onAdd }) {
  const label = fcSuppTypeLabel(type);
  const included = entries.filter(({ supp }) => supp.enabled).length;
  const helper = type === 'comp' ? 'Benefits included at no additional charge.' : 'Chargeable extras added to this Farecode.';
  return (
    <section aria-label={`${label} supplement configurations`} style={{ border:`1px solid ${T.line}`, borderRadius:10, background:'#fff', boxShadow:'0 1px 2px rgba(15,23,42,.04)', overflow:'visible' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:'10px 10px 0 0', borderBottom:`1px solid ${T.line}`, background:T.fill }}>
        <FCSuppBadge type={type} />
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:T.ink }}>{label} Supplement</div>
          <div style={{ marginTop:1, fontSize:10.5, color:T.inkFaint, lineHeight:1.35 }}>{helper}</div>
        </div>
        <span style={{ padding:'2px 7px', borderRadius:999, background:included?T.tealLight:'#fff', border:`1px solid ${included?'#D1FAE5':T.line}`, color:included?T.tealDark:T.inkFaint, fontSize:9.5, fontWeight:750, whiteSpace:'nowrap' }}>{included} of {entries.length} included</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, padding:8, background:'#FBFCFE', borderRadius:'0 0 10px 10px' }}>
        {entries.map(({ supp, index }, position) => <FCSuppCard key={supp.id} supp={supp} position={position+1} open={open.has(supp.id)} sailing={sailing}
          onToggleOpen={() => onMark(supp.id, !open.has(supp.id))} onUpdate={value => onUpdate(index, value)}
          onSetEnabled={value => onSetEnabled(index, value)} onRemove={() => onRemove(supp.id)} onAdd={() => onAdd(supp.id, type)} />)}
      </div>
    </section>
  );
}

function S8Supp({ form, setForm }) {
  const [open, setOpen] = useState(() => {
    const firstEnabled = form.supp.find(supp => supp.enabled);
    return new Set(firstEnabled ? [firstEnabled.id] : []);
  });
  const mark = (id, isOpen) => setOpen(new Set(isOpen ? [id] : []));
  const updateSupp = (index, value) => setForm(previous => {
    const supp = [...previous.supp];
    supp[index] = value;
    return { ...previous, supp };
  });
  const setEnabled = (index, value) => {
    const id = form.supp[index].id;
    setOpen(previous => value ? new Set([id]) : previous.has(id) ? new Set() : new Set(previous));
    updateSupp(index, { ...form.supp[index], enabled:value });
  };
  const addSuppAfter = (currentId, type) => {
    const nextSupp = mkCustomFarecodeSupp(type);
    setForm(previous => {
      const supp = [...previous.supp];
      const currentIndex = supp.findIndex(item => item.id === currentId);
      const lastTypeIndex = supp.reduce((last, item, index) => item.type === type ? index : last, -1);
      const insertAt = currentIndex >= 0 ? currentIndex + 1 : lastTypeIndex >= 0 ? lastTypeIndex + 1 : supp.length;
      supp.splice(insertAt, 0, nextSupp);
      return { ...previous, supp };
    });
    setOpen(new Set([nextSupp.id]));
  };
  const removeSupp = id => {
    setForm(previous => ({ ...previous, supp:previous.supp.filter(item => item.id !== id) }));
    setOpen(previous => previous.has(id) ? new Set() : new Set(previous));
  };
  const activeCount = form.supp.filter(supp => supp.enabled).length;
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.05)', overflow:'visible' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}`, borderRadius:'10px 10px 0 0' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
          <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>06</span>
          <div>
            <h2 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Supplements</h2>
            <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Define which extras are included or charged on this Farecode.</p>
          </div>
        </div>
        <span style={{ fontSize:10.5, fontWeight:700, whiteSpace:'nowrap', padding:'3px 9px', borderRadius:999, color:activeCount?T.tealDark:T.inkFaint, background:activeCount?T.tealLight:T.fill, border:`1px solid ${activeCount?'#D1FAE5':T.line}` }}>{activeCount} of {form.supp.length} included</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14, padding:16 }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'10px 12px', borderRadius:8, background:T.primaryBg, border:`1px solid ${T.primaryLine}` }}>
          <div style={{ width:26, height:26, borderRadius:6, background:'#fff', border:`1px solid ${T.primaryLine}`, color:T.primary, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:T.ink }}>Faretype supplement source</div>
            <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.4, marginTop:2 }}>
              {form.faretype ? <><span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontWeight:700, color:T.primary }}>{form.faretype}</span> supplied the starting configuration. Changes here apply only to this Farecode.</> : <>Choose a parent Faretype to load its supplement defaults.</>}
            </div>
          </div>
        </div>
        {!activeCount && <div style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'10px 12px', background:T.fill, border:`1px solid ${T.line}`, borderRadius:8, fontSize:11.5, color:T.inkSoft, lineHeight:1.45 }}>
          <span aria-hidden="true" style={{ color:T.inkFaint, fontWeight:800 }}>i</span>
          No supplements are included. Turn on a configuration to set its product, cabin scope, application rule, and fare positions.
        </div>}
        <div>
          <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Available supplements</div>
          <div style={{ fontSize:11.5, color:T.inkFaint, lineHeight:1.4, marginTop:3, marginBottom:9 }}>Enabled supplements become part of this Farecode configuration.</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {FC_SUPP_TYPES.map(type => <FCSuppGroup key={type} type={type}
              entries={form.supp.map((supp, index) => ({ supp, index })).filter(({ supp }) => supp.type === type)}
              open={open} sailing={farecodeSailingLabel(form)} onMark={mark} onUpdate={updateSupp} onSetEnabled={setEnabled}
              onRemove={removeSupp} onAdd={addSuppAfter} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingEditorExpandedModal({ pricing:sourcePricing, setPricing:commitPricing, columns:sourceColumns, setColumns:commitColumns, errors, onClose }) {
  const [newColumn, setNewColumn] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(GUEST_ROWS[0].grp);
  const [addError, setAddError] = useState('');
  const [pendingRemove, setPendingRemove] = useState(null);
  const [pricing, setPricing] = useState(() => JSON.parse(JSON.stringify(sourcePricing)));
  const [columns, setColumns] = useState(() => sourceColumns.map(column => ({ ...column })));
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const addInputRef = useRef(null);
  const removeCancelRef = useRef(null);
  const cabins = Object.keys(pricing);
  const atLimit = columns.length >= MAX_GUEST_COLUMNS;
  const fmtCur = n => new Intl.NumberFormat('en-US',{ minimumFractionDigits:2, maximumFractionDigits:2 }).format(n);
  const parseCur = v => parseFloat(String(v||'').replace(/[^0-9.]/g,'')) || 0;
  const val = (cabin,key) => parseCur(pricing[cabin][key]);
  const updatePrice = (cabin,key,value) => setPricing(p => ({ ...p, [cabin]:{ ...p[cabin], [key]:value } }));
  const formatPrice = (cabin,key) => { const n=val(cabin,key); if (n>0) updatePrice(cabin,key,fmtCur(n)); };
  const firstCol = 190;
  const guestCol = 132;
  const totalCol = 150;
  const pGrid = `${firstCol}px repeat(${columns.length}, minmax(${guestCol}px,1fr)) ${totalCol}px`;
  const hasChanges = JSON.stringify(pricing)!==JSON.stringify(sourcePricing) || JSON.stringify(columns)!==JSON.stringify(sourceColumns);
  const applyChanges = () => {
    commitPricing(JSON.parse(JSON.stringify(pricing)));
    commitColumns(columns.map(column => ({ ...column })));
    onClose();
  };

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
    const label = newColumn.trim().replace(/\s+/g,' ');
    if (!label) { setAddError('Enter a guest-position label.'); addInputRef.current?.focus(); return; }
    if (label.length>24) { setAddError('Use 24 characters or fewer.'); addInputRef.current?.focus(); return; }
    if (columns.some(column => column.group===selectedGroup && column.label.toLowerCase()===label.toLowerCase())) { setAddError(`“${label}” already exists in ${selectedGroup}.`); addInputRef.current?.focus(); return; }
    if (atLimit) { setAddError(`A maximum of ${MAX_GUEST_COLUMNS} guest-position columns is supported.`); return; }
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'') || 'guest';
    const groupSlug = selectedGroup.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
    const baseKey = `custom_${groupSlug}_${slug}`;
    let key = baseKey;
    let suffix = 2;
    while (columns.some(column => column.key===key)) key = `${baseKey}_${suffix++}`;
    const nextColumn = { key, label, group:selectedGroup, custom:true };
    setColumns(current => {
      const next = [...current];
      let insertAt = -1;
      current.forEach((column,index) => { if (column.group===selectedGroup) insertAt=index; });
      next.splice(insertAt+1,0,nextColumn);
      return next;
    });
    setPricing(current => Object.fromEntries(Object.entries(current).map(([cabin,row]) => [cabin,{ ...row, [key]:'' }])));
    setNewColumn(''); setAddError('');
    requestAnimationFrame(() => addInputRef.current?.focus());
  };
  const removeColumn = column => {
    setColumns(current => current.filter(item => item.key!==column.key));
    setPricing(current => Object.fromEntries(Object.entries(current).map(([cabin,row]) => {
      const nextRow = { ...row };
      delete nextRow[column.key];
      return [cabin,nextRow];
    })));
    setPendingRemove(null);
  };

  return ReactDOM.createPortal(
    <div onMouseDown={onClose} style={{ position:'fixed', inset:0, zIndex:1850, background:'rgba(15,23,42,.6)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="pricing-editor-modal-title" tabIndex="-1" onMouseDown={e => e.stopPropagation()}
        style={{ position:'relative', width:'min(1360px, calc(100vw - 48px))', maxHeight:'calc(100vh - 48px)', background:'#fff', borderRadius:14, boxShadow:'0 28px 80px rgba(15,23,42,.32)', display:'flex', flexDirection:'column', outline:'none', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, padding:'18px 22px', borderBottom:`1px solid ${T.line}`, flexShrink:0 }}>
          <div><div id="pricing-editor-modal-title" style={{ fontSize:18, fontWeight:700, color:T.ink, marginBottom:4 }}>Edit pricing matrix</div><div style={{ fontSize:12.5, color:T.inkSoft }}>Set fares for fixed cabin categories and add guest-position columns where needed.</div></div>
          <button ref={closeBtnRef} onClick={onClose} aria-label="Close expanded pricing editor" title="Close" style={{ width:34, height:34, borderRadius:8, border:`1px solid ${T.line}`, background:'#fff', color:T.inkSoft, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 22px', background:T.fill, borderBottom:`1px solid ${T.line}`, flexShrink:0 }}>
          <div style={{ minWidth:150 }}>
            <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px', marginBottom:5 }}>Occupancy group</div>
            <Sel value={selectedGroup} onChange={value => { setSelectedGroup(value); setAddError(''); }} opts={GUEST_ROWS.map(group => [group.grp,group.grp])} dis={atLimit} ariaLabel="Occupancy group for new guest-position column"/>
          </div>
          <div style={{ flex:'0 1 310px' }}>
            <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px', marginBottom:5 }}>Guest-position label</div>
            <div style={{ display:'flex', gap:8 }}>
              <input ref={addInputRef} value={newColumn} disabled={atLimit} maxLength={24} onChange={e => { setNewColumn(e.target.value); if(addError)setAddError(''); }} onKeyDown={e => { if(e.key==='Enter')addColumn(); }} placeholder="e.g. Triple Guest" aria-label="New guest-position column label" style={{ ...iS(!!addError,atLimit), padding:'8px 11px' }}/>
              <button type="button" onClick={addColumn} disabled={atLimit} style={{ padding:'8px 14px', border:'none', borderRadius:7, background:atLimit?'#CBD5E1':T.primary, color:'#fff', fontSize:12.5, fontWeight:600, cursor:atLimit?'not-allowed':'pointer', whiteSpace:'nowrap' }}>Add column</button>
            </div>
            {addError && <div role="alert" style={{ fontSize:11, color:T.red, marginTop:4 }}>{addError}</div>}
          </div>
          <div style={{ marginLeft:'auto', maxWidth:250, fontSize:11.5, color:T.inkFaint, lineHeight:1.4, paddingTop:21 }}>{columns.length} of {MAX_GUEST_COLUMNS} guest-position columns · cabin categories are fixed</div>
        </div>
        <div className="pscroll" style={{ padding:22, overflow:'auto', minHeight:0 }}>
          <div className="hscroll" role="table" aria-label="Editable pricing by cabin category and guest position" style={{ border:`1px solid ${T.line}`, borderRadius:9, overflowX:'auto', background:'#fff' }}>
            <div style={{ minWidth:firstCol+columns.length*guestCol+totalCol }}>
              <PricingMatrixHeader grid={pGrid} columns={columns} expanded onRemoveColumn={setPendingRemove}/>
              <div role="rowgroup">
                {cabins.map((cabin,index) => {
                  const hasError = !!errors.pricing?.[cabin];
                  const total = val(cabin,'dbl1')+val(cabin,'dbl2');
                  return (
                    <div key={cabin} role="row" style={{ display:'grid', gridTemplateColumns:pGrid, alignItems:'stretch', borderBottom:index<cabins.length-1?`1px solid ${T.lineSoft}`:'none', background:'#fff' }}>
                      <div role="rowheader" style={{ position:'sticky', left:0, zIndex:1, display:'flex', alignItems:'center', gap:8, padding:'8px 12px', background:hasError?T.amberLight:'#fff', borderRight:`1px solid ${T.line}`, minWidth:0 }}>
                        {hasError && <span title="Add at least one price" style={{ color:T.amber, fontSize:12, fontWeight:800, flexShrink:0 }}>!</span>}
                        <span title={cabin} style={{ flex:1, minWidth:0, fontSize:12.5, fontWeight:700, color:T.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cabin}</span>
                      </div>
                      {columns.map(column => (
                        <div key={column.key} role="cell" style={{ padding:'5px 7px', borderLeft:`1px solid ${T.lineSoft}` }}>
                          <input value={pricing[cabin][column.key] || ''} onChange={e => updatePrice(cabin,column.key,e.target.value)} onBlur={() => formatPrice(cabin,column.key)} placeholder="—" aria-label={`${cabin} ${column.group} ${column.label} price`} className="price-input" style={{ width:'100%', padding:'8px 10px', border:`1.5px solid ${T.line}`, borderRadius:6, fontSize:13, color:T.ink, background:'#fff', outline:'none', textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace" }}/>
                        </div>
                      ))}
                      <div role="cell" style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'10px 14px', fontSize:13, fontWeight:700, textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace", color:total?T.ink:T.inkFaint, borderLeft:`1px solid ${T.line}`, background:T.fill }}>{total?fmtCur(total):'—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'12px 22px', borderTop:`1px solid ${T.line}`, background:'#fff', flexShrink:0 }}>
          <div style={{ fontSize:11.5, color:T.inkFaint, lineHeight:1.4 }}>Pricing updates remain a draft until you apply them.</div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button type="button" onClick={onClose} style={{ padding:'8px 14px', border:`1px solid ${T.line}`, borderRadius:7, background:'#fff', color:T.inkSoft, fontSize:12.5, fontWeight:600, cursor:'pointer' }}>Cancel</button>
            <button type="button" onClick={applyChanges} disabled={!hasChanges} style={{ padding:'8px 14px', border:`1px solid ${hasChanges?T.primary:'#CBD5E1'}`, borderRadius:7, background:hasChanges?T.primary:'#CBD5E1', color:'#fff', fontSize:12.5, fontWeight:650, cursor:hasChanges?'pointer':'not-allowed' }}>Apply changes</button>
          </div>
        </div>
        {pendingRemove && <div style={{ position:'absolute', inset:0, zIndex:30, background:'rgba(15,23,42,.44)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }} onMouseDown={() => setPendingRemove(null)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="remove-pricing-column-title" onMouseDown={e => e.stopPropagation()} style={{ width:390, background:'#fff', borderRadius:12, padding:24, boxShadow:'0 20px 50px rgba(15,23,42,.25)' }}>
            <div id="remove-pricing-column-title" style={{ fontSize:16, fontWeight:700, color:T.ink, marginBottom:7 }}>Remove “{pendingRemove.label}”?</div>
            <div style={{ fontSize:13, color:T.inkSoft, lineHeight:1.55, marginBottom:20 }}>This removes the custom guest-position column from {pendingRemove.group} and deletes every price entered in it. The removal is final after you save the Farecode.</div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}><button ref={removeCancelRef} onClick={() => setPendingRemove(null)} style={{ padding:'8px 14px', border:`1px solid ${T.line}`, borderRadius:7, background:'#fff', color:T.inkSoft, fontSize:12.5, fontWeight:600, cursor:'pointer' }}>Cancel</button><button onClick={() => removeColumn(pendingRemove)} style={{ padding:'8px 14px', border:'none', borderRadius:7, background:T.red, color:'#fff', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>Remove column</button></div>
          </div>
        </div>}
      </div>
    </div>, document.body
  );
}

function S8({ pricing, setPricing, pricingColumns, setPricingColumns, errors, setErrors }) {
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
  const isPriced = cab => pricingColumns.some(column => val(cab,column.key) > 0);
  function upd(cabin, k, v) { setPricing(p => ({ ...p, [cabin]:{ ...p[cabin], [k]:v } })); }
  function blur(cabin, k) { const n = parseCur(pricing[cabin][k]); if (n>0) upd(cabin,k,fmtCur(n)); }
  function copyCol(from, to) { setPricing(p => ({ ...p, [to]:{ ...p[from] } })); setCopyOpen(null); }
  function closeExpanded() { setExpanded(false); requestAnimationFrame(() => expandBtnRef.current?.focus()); }
  const FIRST_COL = 150;
  const GUEST_COL = 106;
  const TOTAL_COL = 126;
  const PGRID = `${FIRST_COL}px repeat(${pricingColumns.length}, minmax(${GUEST_COL}px,1fr)) ${TOTAL_COL}px`;
  const nPriced = CABINS.filter(isPriced).length;
  const completionPct = CABINS.length ? Math.round((nPriced / CABINS.length) * 100) : 0;
  const isComplete = CABINS.length > 0 && nPriced === CABINS.length;
  const hasPricingErrors = !!errors.pricing;
  const remaining = Math.max(CABINS.length - nPriced, 0);
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.05)', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, minWidth:0 }}>
          <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>07</span>
          <div style={{ minWidth:0 }}>
            <h2 style={{ fontSize:15, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Pricing</h2>
            <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Set per-guest fares by cabin category and occupancy.</p>
          </div>
        </div>
        <button ref={expandBtnRef} onClick={() => setExpanded(true)} aria-label="Expand pricing matrix" title="Open the full pricing editor"
          style={{ height:30, padding:'0 10px', borderRadius:7, border:`1px solid ${T.line}`, background:'#fff', color:T.primary, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6, flexShrink:0, fontSize:11.5, fontWeight:700 }}
          onMouseEnter={e => { e.currentTarget.style.background=T.primaryBg; e.currentTarget.style.borderColor=T.primaryLine; }}
          onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.borderColor=T.line; }}>
          <IcExpand/><span>Expand matrix</span>
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'16px' }}>
        <div style={{ padding:'11px 12px', borderRadius:8, background:isComplete?T.greenLight:hasPricingErrors?T.amberLight:T.primaryBg, border:`1px solid ${isComplete?'#A7F3D0':hasPricingErrors?T.amberBorder:T.primaryLine}` }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:8 }}>
            <div>
              <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Pricing coverage</div>
              <div style={{ fontSize:12.5, fontWeight:700, color:T.ink, marginTop:3 }}>{nPriced} of {CABINS.length} cabin categories priced</div>
            </div>
            <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 7px', borderRadius:999, background:'#fff', border:`1px solid ${isComplete?'#A7F3D0':hasPricingErrors?T.amberBorder:T.primaryLine}`, color:isComplete?T.green:hasPricingErrors?T.amberDark:T.primary, fontSize:10.5, fontWeight:700, whiteSpace:'nowrap' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor' }}/>
              {isComplete?'Ready':hasPricingErrors?'Needs attention':'In progress'}
            </span>
          </div>
          <div role="progressbar" aria-label="Cabin category pricing coverage" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completionPct} style={{ height:5, borderRadius:999, background:'rgba(148,163,184,.28)', overflow:'hidden' }}>
            <div style={{ width:`${completionPct}%`, height:'100%', borderRadius:999, background:isComplete?T.green:T.primary, transition:'width .2s ease' }}/>
          </div>
          {!isComplete && <div style={{ fontSize:10.5, color:hasPricingErrors?T.amberDark:T.inkSoft, marginTop:7 }}>{remaining} categor{remaining===1?'y':'ies'} still need{remaining===1?'s':''} at least one fare.</div>}
        </div>

        <div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12, marginBottom:9 }}>
            <div>
              <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Fare matrix</div>
              <div style={{ fontSize:11.5, color:T.inkFaint, lineHeight:1.4, marginTop:3 }}>Enter at least one fare in each cabin category.</div>
            </div>
            <span style={{ fontSize:10.5, color:T.inkFaint, whiteSpace:'nowrap' }}>Per guest</span>
          </div>

          <div className="hscroll" role="table" aria-label="Editable fare pricing by cabin category and guest position" style={{ border:`1px solid ${T.line}`, borderRadius:8, overflowX:'auto', background:'#fff' }}>
            <div style={{ minWidth:FIRST_COL+pricingColumns.length*GUEST_COL+TOTAL_COL }}>
              <PricingMatrixHeader grid={PGRID} columns={pricingColumns}/>
              <div role="rowgroup">
                {CABINS.map((cabin,index) => {
                  const hasErr = errors.pricing?.[cabin];
                  const others = CABINS.filter(c => c !== cabin);
                  const total = val(cabin,'dbl1')+val(cabin,'dbl2');
                  return (
                    <div key={cabin} role="row" style={{ display:'grid', gridTemplateColumns:PGRID, alignItems:'stretch', borderBottom:index<CABINS.length-1?`1px solid ${T.lineSoft}`:'none', background:'#fff' }}>
                      <div role="rowheader" ref={copyOpen===cabin?copyRef:null} style={{ position:'sticky', left:0, zIndex:copyOpen===cabin?5:1, display:'flex', alignItems:'center', gap:6, padding:'5px 8px', background:hasErr?T.amberLight:'#fff', borderRight:`1px solid ${T.line}`, minWidth:0 }}>
                        {hasErr && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth="2.5" style={{ flexShrink:0 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>}
                        <span title={cabin} style={{ flex:1, minWidth:0, fontSize:11.5, fontWeight:700, color:T.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{cabin}</span>
                        <button onClick={() => setCopyOpen(copyOpen===cabin?null:cabin)} aria-label={`Copy ${cabin} fares to another category`} title={`Copy ${cabin} fares to another category`}
                          style={{ width:22, height:22, borderRadius:4, border:`1px solid ${T.line}`, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.inkFaint, flexShrink:0 }}
                          onMouseEnter={e => { e.currentTarget.style.background=T.fill; e.currentTarget.style.color=T.ink; }}
                          onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color=T.inkFaint; }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                        {copyOpen===cabin && (
                          <div style={{ position:'absolute', left:8, top:'100%', marginTop:3, background:'#fff', border:`1px solid ${T.line}`, borderRadius:8, boxShadow:'0 8px 20px rgba(0,0,0,.1)', zIndex:500, minWidth:150, overflow:'hidden' }}>
                            <div style={{ padding:'6px 12px', fontSize:10, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px', borderBottom:`1px solid ${T.lineSoft}` }}>Copy to…</div>
                            {others.map(to => (
                              <button key={to} onClick={() => copyCol(cabin,to)} style={{ display:'block', width:'100%', padding:'8px 12px', border:'none', background:'transparent', fontSize:12.5, color:T.ink, cursor:'pointer', whiteSpace:'nowrap', textAlign:'left' }} onMouseEnter={e => e.currentTarget.style.background=T.fill} onMouseLeave={e => e.currentTarget.style.background='transparent'}>{to}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      {pricingColumns.map(column => (
                        <div key={column.key} role="cell" style={{ padding:'4px', borderLeft:`1px solid ${T.lineSoft}` }}>
                          <input type="text" value={pricing[cabin][column.key] || ''} onChange={e => upd(cabin,column.key,e.target.value)} onBlur={() => blur(cabin,column.key)} placeholder="—" className="price-input" aria-label={`${cabin} ${column.group} ${column.label} fare`}
                            style={{ width:'100%', padding:'6px 7px', border:`1.5px solid ${T.line}`, borderRadius:6, fontSize:12, color:T.ink, background:'#fff', outline:'none', textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace" }}/>
                        </div>
                      ))}
                      <div role="cell" style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', padding:'8px 10px', fontSize:12.5, fontWeight:700, textAlign:'right', fontFamily:"'SF Mono',Menlo,monospace", color:total>0?T.ink:T.inkFaint, borderLeft:`1px solid ${T.line}`, background:T.fill }}>{total>0?fmtCur(total):'—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'10px 11px', borderRadius:8, background:hasPricingErrors?T.amberLight:isComplete?T.greenLight:T.fill, border:`1px solid ${hasPricingErrors?T.amberBorder:isComplete?'#A7F3D0':T.line}` }}>
          {hasPricingErrors ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth="2.5" style={{ flexShrink:0, marginTop:1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg> : isComplete ? <span style={{ color:T.green, fontSize:13, fontWeight:800, flexShrink:0 }}>✓</span> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2.2" style={{ flexShrink:0, marginTop:1 }}><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
          <div style={{ fontSize:11.5, color:hasPricingErrors?T.amberDark:isComplete?T.green:T.inkSoft, lineHeight:1.45 }}>
            {hasPricingErrors ? 'Add at least one fare to every highlighted cabin category before activating.' : isComplete ? 'Every cabin category has a fare and is ready for activation.' : 'Use Expand matrix to add guest-position columns or work in a larger view.'}
          </div>
        </div>
      </div>
      {expanded && <PricingEditorExpandedModal pricing={pricing} setPricing={setPricing} columns={pricingColumns} setColumns={setPricingColumns} errors={errors} onClose={closeExpanded}/>}
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
const INIT_POLICY_ELIGIBILITY = INIT_DATA.slice(0,6).map(row => {
  const faretype = FT_DATA.find(item => item.code === row.faretype);
  const inherited = faretype?.vals || {};
  return {
    id:row.id,
    farecode:row.code,
    ship:row.ship,
    sailing:row.sailing,
    sailings:[row.sailing],
    faretype:row.faretype,
    ...policyEligibilityValues(inherited),
    overrides:row.code === 'FC-20101'
      ? { ...DEFAULT_OVRD(), cancellationPolicy:'overridden', minOccupancy:'overridden' }
      : DEFAULT_OVRD(),
    status:row.status,
    mod:row.mod,
  };
});
const SHIPS       = ['Island Escape','Paradise Bay','Northern Star'];
const FARETYPES   = ['FT-00101','FT-00102','FT-00103'];
const PAGE_SIZE   = 10;
const CHIP_S = { 'Interior':{ bg:'#EEF2FF',color:'#3730A3' }, 'Ocean View':{ bg:'#ECFEFF',color:'#0E7490' }, 'Balcony':{ bg:'#F0FDF4',color:'#166534' }, 'Veranda':{ bg:'#FFF7ED',color:'#C2410C' }, 'Suite':{ bg:'#FDF4FF',color:'#7E22CE' }, 'Penthouse':{ bg:'#FFF1F2',color:'#9F1239' } };
const STATUS_S = { Active:{ bg:'#ECFDF5',color:'#065F46',dot:'#10B981' }, Draft:{ bg:'#FFFBEB',color:'#92400E',dot:'#F59E0B' }, Inactive:{ bg:'#F8FAFC',color:'#475569',dot:'#94A3B8' } };

const SECTS = [{ n:1,l:'Ship & Sailings' },{ n:2,l:'Channel Access' },{ n:3,l:'Partner Access' },{ n:4,l:'Marketing' },{ n:5,l:'Taxes & Privacy' },{ n:6,l:'Supplements' },{ n:7,l:'Pricing' }];
const REVIEW_SECT = { n:8, l:'Review Changes' };

const FC_REVIEW_FIELDS = {
  ship:[1,'Ship'], sailings:[1,'Sailings'], faretype:[1,'Parent Faretype'],
  cruiseControlAccess:[2,'Cruise Control Access'], chMVASB2C:[2,'MVAS B2C'], chMVASB2B:[2,'MVAS B2B'], chCC:[2,'Cruise Control'], chTradeAPI:[2,'Trade API'], chCRM:[2,'CRM'], chGroup:[2,'Group Desk'],
  channelPartners:[3,'Partner Access'],
  includeDiscount:[4,'Discount Message'], discountMessage:[4,'Message Copy'], offerPrimary:[4,'Primary Offer'], offerSecondary:[4,'Secondary Offer'], offerTertiary:[4,'Tertiary Offers'],
  waiveGovTaxes:[5,'Waive Government Taxes'], waiveCruiseExp:[5,'Waive Cruise Expenses'], noFareDisplay:[5,'Hide Fare Amounts'],
};
const FC_REVIEW_SUPP_FIELDS = { enabled:'Status', name:'Supplement Name', cabins:'Cabin Categories', rule:'Rule', maxCount:'Max Count', farePos:'Fare Positions' };

function fcReviewValue(value) {
  if (value === true) return 'Enabled';
  if (value === false) return 'Disabled';
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'None';
  if (value === '' || value === null || value === undefined) return '—';
  return String(value);
}
const fcReviewSuppName = supplement => supplement.name || supplement.title || 'Untitled supplement';
const fcReviewSuppValue = (key, value) => key === 'rule' ? fcSuppRuleLabel(value) : fcReviewValue(value);
const cloneFarecodeReviewState = ({ form, overrides, pricing, pricingColumns }) => JSON.parse(JSON.stringify({ form, overrides, pricing, pricingColumns }));

function diffFarecodeState(before, after) {
  if (!before) return [];
  const changes = [];
  Object.entries(FC_REVIEW_FIELDS).forEach(([key, [section, label]]) => {
    const from = before.form?.[key], to = after.form?.[key];
    if (JSON.stringify(from) !== JSON.stringify(to)) changes.push({ section, label, from:fcReviewValue(from), to:fcReviewValue(to) });
  });

  const beforeSupplements = new Map((before.form?.supp || []).map(supplement => [supplement.id, supplement]));
  (after.form?.supp || []).forEach(supplement => {
    const previous = beforeSupplements.get(supplement.id);
    if (!previous) {
      changes.push({ section:6, label:`${fcReviewSuppName(supplement)} · ${fcSuppTypeLabel(supplement.type)}`, from:'Not present', to:'Added' });
      return;
    }
    Object.entries(FC_REVIEW_SUPP_FIELDS).forEach(([key, label]) => {
      const from = key === 'cabins' ? fcSuppCabinValues(previous) : previous[key];
      const to = key === 'cabins' ? fcSuppCabinValues(supplement) : supplement[key];
      if (JSON.stringify(from) !== JSON.stringify(to)) changes.push({ section:6, label:`${fcReviewSuppName(supplement)} · ${label}`, from:fcReviewSuppValue(key, from), to:fcReviewSuppValue(key, to) });
    });
  });
  const currentSupplementIds = new Set((after.form?.supp || []).map(supplement => supplement.id));
  (before.form?.supp || []).forEach(supplement => {
    if (!currentSupplementIds.has(supplement.id)) changes.push({ section:6, label:`${fcReviewSuppName(supplement)} · ${fcSuppTypeLabel(supplement.type)}`, from:'Present', to:'Removed' });
  });

  Object.keys(after.overrides || {}).forEach(key => {
    if (before.overrides?.[key] === after.overrides?.[key] || !FC_REVIEW_FIELDS[key]) return;
    const [section, fieldLabel] = FC_REVIEW_FIELDS[key];
    changes.push({ section, label:`${fieldLabel} · Assignment`, from:before.overrides?.[key] === 'overridden' ? 'Farecode override' : 'Inherited', to:after.overrides?.[key] === 'overridden' ? 'Farecode override' : 'Inherited' });
  });

  const beforeColumns = new Map((before.pricingColumns || []).map(column => [column.key, column]));
  const afterColumns = new Map((after.pricingColumns || []).map(column => [column.key, column]));
  (after.pricingColumns || []).forEach(column => {
    if (!beforeColumns.has(column.key)) changes.push({ section:7, label:`${column.group} · ${column.label}`, from:'Not present', to:'Column added' });
  });
  (before.pricingColumns || []).forEach(column => {
    if (!afterColumns.has(column.key)) changes.push({ section:7, label:`${column.group} · ${column.label}`, from:'Present', to:'Column removed' });
  });
  const cabins = new Set([...Object.keys(before.pricing || {}), ...Object.keys(after.pricing || {})]);
  cabins.forEach(cabin => {
    const columnKeys = new Set([...Object.keys(before.pricing?.[cabin] || {}), ...Object.keys(after.pricing?.[cabin] || {})]);
    columnKeys.forEach(key => {
      const from = before.pricing?.[cabin]?.[key] || '';
      const to = after.pricing?.[cabin]?.[key] || '';
      if (from === to) return;
      const column = afterColumns.get(key) || beforeColumns.get(key) || { group:'Pricing', label:key };
      changes.push({ section:7, label:`${cabin} · ${column.group} · ${column.label}`, from:fcReviewValue(from), to:fcReviewValue(to) });
    });
  });
  return changes;
}

function FCReviewValue({ label, value, after }) {
  return (
    <div style={{ minWidth:0 }}>
      <div style={{ fontSize:9.5, fontWeight:750, color:after?T.primary:T.inkFaint, letterSpacing:'.65px', textTransform:'uppercase', marginBottom:5 }}>{label}</div>
      <div style={{ minHeight:34, display:'flex', alignItems:'center', padding:'7px 9px', borderRadius:7, border:`1px solid ${after?T.primaryLine:T.line}`, background:after?T.primaryBg:T.fill, color:after?T.primary:T.inkSoft, fontSize:11.5, fontWeight:after?650:500, lineHeight:1.35, fontFamily:"'SF Mono',Menlo,monospace", wordBreak:'break-word' }}>{value}</div>
    </div>
  );
}

function FCReviewRow({ change, first }) {
  return (
    <div style={{ padding:'12px 14px 14px', borderTop:first?'none':`1px solid ${T.lineSoft}` }}>
      <div style={{ fontSize:12.5, fontWeight:650, color:T.ink, lineHeight:1.35 }}>{change.label}</div>
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 24px minmax(0,1fr)', gap:7, alignItems:'end', marginTop:9 }}>
        <FCReviewValue label="Current" value={change.from}/>
        <div aria-hidden="true" style={{ width:24, height:24, marginBottom:5, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.primary }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="18" y2="12"/><polyline points="13 7 18 12 13 17"/></svg>
        </div>
        <FCReviewValue label="After save" value={change.to} after/>
      </div>
    </div>
  );
}

function FarecodeReviewStep({ changes, onNav }) {
  const groups = SECTS.map(section => ({ ...section, items:changes.filter(change => change.section === section.n) })).filter(section => section.items.length);
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.05)', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>08</span>
        <div style={{ flex:1, minWidth:0 }}>
          <h2 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Review Changes</h2>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Confirm the exact Farecode updates before saving.</p>
        </div>
        <span style={{ display:'inline-flex', alignItems:'center', padding:'3px 9px', borderRadius:999, border:`1px solid ${T.primaryLine}`, background:T.primaryBg, color:T.primary, fontSize:10.5, fontWeight:700, whiteSpace:'nowrap' }}>{changes.length} {changes.length===1?'update':'updates'}</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:14, padding:'16px' }}>
        {!changes.length ? (
          <div style={{ padding:'28px 18px', textAlign:'center', border:`1px dashed ${T.line}`, borderRadius:10, background:T.fill }}>
            <div style={{ width:34, height:34, margin:'0 auto 9px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.primary }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>No changes to review</div>
            <div style={{ fontSize:11.5, color:T.inkFaint, lineHeight:1.5, marginTop:4 }}>Return to a section to make an update. This Farecode will remain unchanged.</div>
          </div>
        ) : (
          <div style={{ border:`1px solid ${T.line}`, borderRadius:10, overflow:'hidden', background:'#fff' }}>
            <div style={{ padding:'12px 14px', background:T.fill, display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
              <div>
                <div style={{ fontSize:12.5, fontWeight:700, color:T.ink }}>Proposed updates</div>
                <div style={{ fontSize:11, color:T.inkFaint, lineHeight:1.4, marginTop:2 }}>Current and after-save values are paired for quick verification.</div>
              </div>
              <span style={{ padding:'2px 7px', borderRadius:999, background:'#fff', border:`1px solid ${T.line}`, color:T.inkSoft, fontSize:10.5, fontWeight:700, whiteSpace:'nowrap' }}>{changes.length} total</span>
            </div>
            {groups.map(group => (
              <div key={group.n} style={{ borderTop:`1px solid ${T.line}` }}>
                <div style={{ padding:'9px 12px', background:'#FBFCFE', borderBottom:`1px solid ${T.lineSoft}`, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:23, height:19, borderRadius:5, background:T.primary, color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:800, flexShrink:0 }}>{String(group.n).padStart(2,'0')}</span>
                  <span style={{ fontSize:12.5, fontWeight:700, color:T.ink, minWidth:0 }}>{group.l}</span>
                  <span style={{ padding:'1px 6px', borderRadius:999, background:T.primaryBg, border:`1px solid ${T.primaryLine}`, fontSize:10, fontWeight:700, color:T.primary }}>{group.items.length}</span>
                  <button type="button" onClick={() => onNav(group.n)} style={{ marginLeft:'auto', background:'none', border:'none', padding:'3px 0', cursor:'pointer', fontSize:11, fontWeight:650, color:T.inkSoft }}>Edit section</button>
                </div>
                {group.items.map((change, index) => <FCReviewRow key={`${group.n}-${index}`} change={change} first={index===0}/>)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function sComplete(n, form, pricing) {
  if (n===1) return !!(form.ship && farecodeSailingValues(form).length && form.faretype);
  if (n>=2 && n<=6) return !!form.faretype;
  if (n===7) return Object.values(pricing).some(r => Object.values(r).some(v => v!==''));
  return false;
}
function sHasErr(n, errors) {
  if (n===1) return !!(errors.ship||errors.sailing||errors.faretype);
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
function PanelNav({ active, onNav, form, pricing, errors, visited, sections=SECTS }) {
  return (
    <div style={{ width:196, flexShrink:0, background:T.navFill, borderRight:`1px solid ${T.line}`, display:'flex', flexDirection:'column' }}>
      <div style={{ flex:1, padding:'16px 0 0', overflowY:'auto' }}>
        {sections.map(({ n,l }) => {
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
    </div>
  );
}

/* ── Audit log tab ── */
function AuditLogTab() {
  return (
    <div style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.04)', overflow:'hidden' }}>
      <div style={{ padding:'10px 13px', background:T.fill, borderBottom:`1px solid ${T.line}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:T.ink }}>Activity History</span>
          <span style={{ padding:'2px 7px', borderRadius:999, background:'#fff', border:`1px solid ${T.line}`, color:T.inkSoft, fontSize:10.5, fontWeight:700 }}>{MOCK_AUDIT.length}</span>
        </div>
        <span style={{ fontSize:10.5, color:T.inkFaint }}>Newest first</span>
      </div>
      <div style={{ padding:'2px 0' }}>
        {MOCK_AUDIT.map((ev, i) => {
          const positive = /activated|created/i.test(ev.event);
          return (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'34px minmax(0,1fr) auto', gap:10, padding:'12px 14px', position:'relative', borderBottom:i<MOCK_AUDIT.length-1?`1px solid ${T.lineSoft}`:'none' }}>
              <div style={{ position:'relative', display:'flex', justifyContent:'center' }}>
                {i<MOCK_AUDIT.length-1 && (
                  <span style={{ position:'absolute', top:24, bottom:-18, width:1, background:T.line }}/>
                )}
                <span style={{ width:24, height:24, borderRadius:'50%', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', background:positive?T.greenLight:T.primaryBg, border:`1px solid ${positive?'#A7F3D0':T.primaryLine}`, color:positive?T.green:T.primary, fontSize:11, fontWeight:800 }}>{positive?'✓':'•'}</span>
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.ink, lineHeight:1.3 }}>{ev.event}</div>
                <span style={{ display:'inline-flex', marginTop:6, padding:'4px 7px', borderRadius:5, background:T.fill, border:`1px solid ${T.lineSoft}`, color:T.inkSoft, fontSize:11.5, lineHeight:1.2 }}>{ev.detail}</span>
              </div>
              <div style={{ textAlign:'right', paddingTop:1, minWidth:138 }}>
                <div style={{ fontSize:11, color:T.inkSoft, whiteSpace:'nowrap' }}>{ev.ts}</div>
                <span style={{ display:'inline-flex', marginTop:6, padding:'2px 6px', borderRadius:5, background:T.fill, color:T.inkFaint, fontSize:10.5 }}>{ev.editor}</span>
              </div>
            </div>
          );
        })}
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
function FarecodePanel({ mode, viewRow, initialEdit, inline, onClose, policies, policyEligibilityRecord }) {
  const buildForm = () => {
    if (mode==='view' && viewRow) {
      const ft = FT_DATA.find(f => f.code===viewRow.faretype);
      return { ...DEFAULT_FORM(), ship:viewRow.ship, sailing:viewRow.sailing, sailings:[viewRow.sailing], faretype:viewRow.faretype, ...(ft?.vals||{}), ...policyEligibilityValues(policyEligibilityRecord), supp:cloneSupplements(ft?.vals?.supp || defaultSupplements()) };
    }
    return DEFAULT_FORM();
  };
  const buildOvrd = () => {
    if (mode==='view') return policyEligibilityRecord?.overrides ? { ...DEFAULT_OVRD(), ...policyEligibilityRecord.overrides } : { ...DEFAULT_OVRD(), cancellationPolicy:'overridden', minOccupancy:'overridden' };
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
  const buildPricingColumns = () => DEFAULT_COLUMN_CONFIG();

  const [isEditing,   setIsEditing]   = useState(mode==='create' || !!initialEdit);
  const [activeTab,   setActiveTab]   = useState('overview');
  const [form,        setForm]        = useState(buildForm);
  const [overrides,   setOverrides]   = useState(buildOvrd);
  const [pricing,     setPricing]     = useState(buildPricing);
  const [pricingColumns, setPricingColumns] = useState(buildPricingColumns);
  const [active,      setActive]      = useState(1);
  const [visited,     setVisited]     = useState(new Set([1]));
  const [errors,      setErrors]      = useState({});
  const [saved,       setSaved]       = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [discardCb,   setDiscardCb]   = useState(null);
  const [mounted,     setMounted]     = useState(false);
  const snapRef = useRef(null);
  const reviewBaselineRef = useRef(null);

  useEffect(() => {
    snapRef.current = JSON.stringify({ form, overrides, pricing, pricingColumns });
    reviewBaselineRef.current = cloneFarecodeReviewState({ form, overrides, pricing, pricingColumns });
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const set         = (k,v) => setForm(p => ({ ...p, [k]:v }));
  const navTo       = n => { setActive(n); setVisited(p => new Set([...p,n])); setErrors({}); };
  const isDirty     = () => snapRef.current !== JSON.stringify({ form, overrides, pricing, pricingColumns });
  const onFTSelect  = ft => { setForm(p => ({ ...p, faretype:ft.code, ...ft.vals, supp:cloneSupplements(ft.vals.supp || defaultSupplements()) })); setOverrides(DEFAULT_OVRD()); };
  const toggleOvrd  = k  => setOverrides(p => ({ ...p, [k]:p[k]==='overridden'?'inherited':'overridden' }));

  const guardDirty = cb => {
    if (isDirty()) { setDiscardCb(() => cb); setShowDiscard(true); }
    else cb();
  };
  const handleClose     = () => guardDirty(onClose);
  const handleCancel    = () => guardDirty(() => { setIsEditing(false); setErrors({}); setForm(buildForm()); setOverrides(buildOvrd()); setPricing(buildPricing()); setPricingColumns(buildPricingColumns()); });
  const handleEnterEdit = () => {
    snapRef.current = JSON.stringify({ form, overrides, pricing, pricingColumns });
    reviewBaselineRef.current = cloneFarecodeReviewState({ form, overrides, pricing, pricingColumns });
    setIsEditing(true); setActiveTab('overview'); setActive(1); setVisited(new Set([1]));
  };

  const validate = full => {
    const e = {};
    if (!form.ship)    e.ship    = 'Required';
    if (!farecodeSailingValues(form).length) e.sailing = 'Select at least one sailing';
    if (!form.faretype) e.faretype = 'Required';
    if (full) {
      const pErr = {};
      Object.entries(pricing).forEach(([cab,row]) => { if (!Object.values(row).some(v=>v&&v!=='')) pErr[cab]=true; });
      if (Object.keys(pErr).length) e.pricing = pErr;
    }
    return e;
  };

  const validateStep = n => {
    const e = {};
    if (n===1) {
      if (!form.ship)     e.ship = 'Required';
      if (!farecodeSailingValues(form).length) e.sailing = 'Select at least one sailing';
      if (!form.faretype) e.faretype = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const handleBack = () => {
    if (active>1) navTo(active-1);
  };
  const handleNext = () => {
    if (!validateStep(active)) return;
    if (active<sections.length) navTo(active+1);
  };

  const handleActivate = () => {
    const e = validate(true);
    if (Object.keys(e).length) { setErrors(e); if (e.ship||e.sailing||e.faretype) setActive(1); else if (e.pricing) setActive(7); return; }
    setSaved(true); setTimeout(() => { setSaved(false); onClose(); }, 1500);
  };
  const handleSaveChanges = () => {
    const e = validate(true);
    if (Object.keys(e).length) { setErrors(e); if (e.pricing) setActive(7); return; }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      snapRef.current = JSON.stringify({ form, overrides, pricing, pricingColumns });
      reviewBaselineRef.current = cloneFarecodeReviewState({ form, overrides, pricing, pricingColumns });
      setIsEditing(false); setErrors({});
    }, 1000);
  };

  const sectProps = { form, set, overrides, toggleOverride:toggleOvrd, errors, policies };
  const selFT = FT_DATA.find(ft => ft.code === form.faretype);
  const showSectionNav = isEditing && activeTab==='overview';
  const sections = mode==='view' && isEditing ? [...SECTS, REVIEW_SECT] : SECTS;
  const reviewChanges = diffFarecodeState(reviewBaselineRef.current, { form, overrides, pricing, pricingColumns });
  const isLast = active===sections.length;

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
                  {mode==='create' ? 'Configure New Farecode' : 'Farecode details'}
                </div>
                {/* Identity: code + status + faretype */}
                {mode==='view' && (
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:4 }}>
                    <span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:13.5, fontWeight:800, color:T.ink }}>{viewRow?.code}</span>
                    <StatusBadge status={viewRow?.status||'Draft'}/>
                    <span style={{ fontSize:12, color:T.inkFaint }}>·</span>
                    <span style={{ fontFamily:"'SF Mono',Menlo,monospace", fontSize:12.5, fontWeight:600, color:T.primary, cursor:'pointer' }}>{form.faretype}</span>
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
                {mode==='create' && <div style={{ fontSize:12, color:T.inkFaint }}>Configure sailing context, access, marketing, supplements, and pricing inherited from a Faretype.</div>}
              </div>
            </div>

            {/* Right action buttons */}
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              {saved      && <span style={{ fontSize:12, color:T.tealDark, display:'flex', alignItems:'center', gap:5 }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><polyline points="20 6 9 17 4 12"/></svg>{mode==='create'?'Activated!':'Saved!'}</span>}

              {/* View mode: show Edit button */}
              {mode==='view' && !isEditing && (
                <button onClick={handleEnterEdit} style={{ padding:'7px 15px', border:'none', borderRadius:7, background:T.primary, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 1px 4px rgba(27,36,52,.2)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Edit
                </button>
              )}
              {/* Close */}
              <button onClick={handleClose} aria-label="Close Farecode drawer" style={{ width:32, height:32, borderRadius:7, border:`1.5px solid ${T.line}`, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.inkSoft }}
                onMouseEnter={e => { e.currentTarget.style.background=T.fill; e.currentTarget.style.color=T.ink; }}
                onMouseLeave={e => { e.currentTarget.style.background='#fff'; e.currentTarget.style.color=T.inkSoft; }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>

          {/* Tab bar (view mode only) */}
          {mode==='view' && (
            <div style={{ display:'flex', gap:0, marginBottom:-1 }}>
              {[
                { k:'overview',l:'Overview' },
                ...(!isEditing ? [{ k:'auditlog',l:'History',badge:MOCK_AUDIT.length }] : []),
              ].map(tab => (
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
            <PanelNav active={active} onNav={navTo} form={form} pricing={pricing} errors={errors} visited={visited} sections={sections}/>
          )}
          {mode==='create' && !isEditing && null}

          {/* Scrollable content */}
          <div className="pscroll" style={{ flex:1, overflowY:'auto', padding:'26px 30px 100px', background: (!isEditing && mode==='view') ? '#EFF3F8' : T.panel }}>
            {/* OVERVIEW tab */}
            {(mode==='create' || activeTab==='overview') && (
              <>
                {/* Read-only overview */}
                {mode==='view' && !isEditing && (
                  <OverviewReadOnly form={form} overrides={overrides} pricing={pricing} pricingColumns={pricingColumns}/>
                )}
                {/* Edit sections (create or view-edit) */}
                {isEditing && (
                  <div style={{ width:'100%', minWidth:0 }}>
                    {active===1 && <S1 {...sectProps} onFaretypeSelect={onFTSelect} mode={mode}/>}
                    {active===2 && <ChannelAccessStep {...sectProps}/>}
                    {active===3 && <PartnerAccessStep {...sectProps}/>}
                    {active===4 && <S6 {...sectProps}/>}
                    {active===5 && <S7 {...sectProps}/>}
                    {active===6 && <S8Supp form={form} setForm={setForm}/>}
                    {active===7 && <S8 pricing={pricing} setPricing={setPricing} pricingColumns={pricingColumns} setPricingColumns={setPricingColumns} errors={errors} setErrors={setErrors}/>}
                    {active===8 && <FarecodeReviewStep changes={reviewChanges} onNav={navTo}/>}
                  </div>
                )}
              </>
            )}

            {/* AUDIT LOG tab */}
            {mode==='view' && activeTab==='auditlog' && <AuditLogTab/>}
          </div>
        </div>

        {/* ─── Footer actions (edit/create mode) ─── */}
        {isEditing && activeTab==='overview' && (
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 22px', background:T.panel, borderTop:`1px solid ${T.line}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, zIndex:10 }}>
            {Object.keys(errors).length>0 ? (
              <span style={{ fontSize:11.5, color:T.amber, display:'flex', alignItems:'center', gap:5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>Complete the required fields to continue
              </span>
            ) : <span/>}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginLeft:'auto' }}>
              <button onClick={handleBack} disabled={active===1}
                style={{ padding:'7px 14px', border:`1.5px solid ${T.line}`, borderRadius:7, background:'#fff', color:active===1?'#CBD5E1':T.inkSoft, fontSize:13, cursor:active===1?'default':'pointer', fontWeight:500 }}>
                Back
              </button>
              {!isLast ? (
                <button onClick={handleNext} style={{ padding:'7px 15px', border:'none', borderRadius:7, background:T.primary, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 1px 4px rgba(27,36,52,.2)' }}>
                  Next Step
                </button>
              ) : mode==='create' ? (
                <button onClick={handleActivate} style={{ padding:'7px 15px', border:'none', borderRadius:7, background:T.primary, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 1px 4px rgba(27,36,52,.2)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Activate
                </button>
              ) : (
                <>
                  <button onClick={handleCancel} style={{ padding:'7px 14px', border:`1.5px solid ${T.line}`, borderRadius:7, background:'#fff', fontSize:13, fontWeight:500, color:T.inkSoft, cursor:'pointer' }}>Cancel</button>
                  <button onClick={handleSaveChanges} style={{ padding:'7px 15px', border:'none', borderRadius:7, background:T.primary, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6, boxShadow:'0 1px 4px rgba(27,36,52,.2)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>Save Changes
                  </button>
                </>
              )}
            </div>
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
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:1180, maxWidth:'100%', background:T.panel, zIndex:901, display:'flex', flexDirection:'column', boxShadow:'-8px 0 40px rgba(0,0,0,.14)', transform:mounted?'translateX(0)':'translateX(100%)', transition:'transform .3s cubic-bezier(.32,0,.67,0)' }}>
        {content}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════
   FARECODE POLICY ELIGIBILITY
   A focused, one-screen process linked to one Farecode. The underlying policy,
   eligibility and override data stays unchanged; only its workflow is separated.
═══════════════════════════════════════ */
function FarecodePolicyGroupHeading({ title, helper, aside }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
      <div>
        <div style={{ fontSize:10, fontWeight:750, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px', lineHeight:1.2 }}>{title}</div>
        {helper && <div style={{ fontSize:11.5, color:T.inkFaint, lineHeight:1.4, marginTop:3 }}>{helper}</div>}
      </div>
      {aside && <div style={{ flexShrink:0 }}>{aside}</div>}
    </div>
  );
}

function FarecodePolicyEligibilityReadOnlyValue({ label, value, mono=false, status }) {
  const shown = value === '' || value === null || value === undefined ? '—' : value;
  return (
    <div style={{ minWidth:0 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
        <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{label}</div>
        {status && <span style={{ padding:'2px 6px', borderRadius:999, border:`1px solid ${status==='Overridden' ? T.primaryLine : T.line}`, background:status==='Overridden' ? T.primaryBg : '#fff', color:status==='Overridden' ? T.primary : T.inkFaint, fontSize:9.5, fontWeight:750 }}>{status}</span>}
      </div>
      <div style={{ marginTop:5, minHeight:38, display:'flex', alignItems:'center', padding:'9px 11px', border:`1px solid ${T.line}`, borderRadius:8, background:T.fill, color:T.ink, fontSize:12.5, fontWeight:600, fontFamily:mono ? "'SF Mono',Menlo,monospace" : 'inherit', overflowWrap:'anywhere' }}>{shown}</div>
    </div>
  );
}

function FarecodePolicyEligibilityOverview({ form, overrides, record }) {
  const permission = (label, enabled, helper) => (
    <div style={{ minWidth:0, padding:'11px 12px', border:`1px solid ${enabled ? T.primaryLine : T.line}`, borderRadius:8, background:enabled ? T.primaryBg : T.fill }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
        <span style={{ fontSize:12, fontWeight:700, color:T.ink }}>{label}</span>
        <span style={{ fontSize:10.5, fontWeight:750, color:enabled ? T.primary : T.inkFaint }}>{enabled ? 'Enabled' : 'Disabled'}</span>
      </div>
      <div style={{ marginTop:3, fontSize:10.5, lineHeight:1.35, color:T.inkFaint }}>{helper}</div>
    </div>
  );
  const assignmentState = key => overrides?.[key] === 'overridden' ? 'Overridden' : 'Inherited';
  const sailings = form.sailings?.length ? form.sailings.join(', ') : (form.sailing || record?.sailing || '—');
  return (
    <section aria-label="Farecode Policy Eligibility details" style={{ width:'100%', border:`1px solid ${T.line}`, borderRadius:10, overflow:'hidden', background:'#fff', boxShadow:'0 1px 2px rgba(15,23,42,.05)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35 }}>01</span>
        <div>
          <h2 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Policy Eligibility</h2>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Review the Farecode context, assigned policies, and guest booking requirements.</p>
        </div>
      </div>

      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <FarecodePolicyGroupHeading title="Farecode context" helper="The sailing-specific record this configuration belongs to." />
          <div style={{ marginTop:10, padding:'11px 12px', borderRadius:8, border:`1px solid ${T.primaryLine}`, background:T.primaryBg, display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:12 }}>
            <div><div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Farecode</div><div style={{ marginTop:4, fontFamily:"'SF Mono',Menlo,monospace", fontSize:12.5, fontWeight:750, color:T.primary }}>{form.farecode || record?.farecode || '—'}</div></div>
            <div><div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Ship</div><div style={{ marginTop:4, fontSize:12.5, fontWeight:650, color:T.ink }}>{form.ship || record?.ship || '—'}</div></div>
            <div><div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Sailing</div><div style={{ marginTop:4, fontFamily:"'SF Mono',Menlo,monospace", fontSize:11.5, color:T.ink }}>{sailings}</div></div>
            <div><div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Parent Faretype</div><div style={{ marginTop:4, fontFamily:"'SF Mono',Menlo,monospace", fontSize:12, fontWeight:700, color:T.ink }}>{form.faretype || record?.faretype || '—'}</div></div>
          </div>
        </div>

        <div style={{ paddingTop:15, borderTop:`1px solid ${T.lineSoft}` }}>
          <FarecodePolicyGroupHeading title="Policy assignment" helper="Payment and refund rules currently applied to this Farecode." />
          <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <FarecodePolicyEligibilityReadOnlyValue label="Cancellation Policy" value={form.cancellationPolicy} status={assignmentState('cancellationPolicy')} />
            <FarecodePolicyEligibilityReadOnlyValue label="Deposit Policy" value={form.depositPolicy} status={assignmentState('depositPolicy')} />
          </div>
        </div>

        <div style={{ paddingTop:15, borderTop:`1px solid ${T.lineSoft}` }}>
          <FarecodePolicyGroupHeading title="Guest eligibility" helper="Qualification and booking-window rules applied by this configuration." />
          <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:10 }}>
            <FarecodePolicyEligibilityReadOnlyValue label="Residency" value={form.residency || 'Any'} status={assignmentState('residency')} />
            <FarecodePolicyEligibilityReadOnlyValue label="Minimum Age" value={form.minAge !== '' && form.minAge !== undefined ? `${form.minAge}+` : '—'} status={assignmentState('minAge')} />
            <FarecodePolicyEligibilityReadOnlyValue label="Advanced Purchase" value={form.advancedPurchase ? `${form.advancedPurchase} days` : 'No restriction'} status={assignmentState('advancedPurchase')} />
            <FarecodePolicyEligibilityReadOnlyValue label="Minimum Occupancy" value={form.minOccupancy || '—'} status={assignmentState('minOccupancy')} />
            <FarecodePolicyEligibilityReadOnlyValue label="Maximum Occupancy" value={form.maxOccupancy || '—'} status={assignmentState('maxOccupancy')} />
          </div>
        </div>

        <div style={{ paddingTop:15, borderTop:`1px solid ${T.lineSoft}` }}>
          <FarecodePolicyGroupHeading title="Booking permissions" helper="Optional booking paths enabled for this Farecode." />
          <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:8 }}>
            {permission('Standby', form.standbyEligible, 'Waitlist booking')}
            {permission('Upgrades', form.upgradeEligible, 'Cabin changes')}
            {permission('Coupons', form.couponEligible, 'Promo codes')}
          </div>
        </div>
      </div>
    </section>
  );
}

function FarecodePolicyEligibilityEditor({ mode, form, set, overrides, toggleOverride, errors, policies, farecodes, selectedFarecode, selectedFaretype, selectFarecode }) {
  const hasFaretype = !!form.faretype;
  const policyOptions = (type, current) => {
    const options = (policies || [])
      .filter(group => group.type === type)
      .flatMap(group => group.parents
        .filter(policy => policy.status === 'Active')
        .map(policy => [policy.name, `${policy.code} · ${policy.name}`]));
    if (current && !options.some(option => option[0] === current)) options.unshift([current, current]);
    return [['', 'Select…'], ...options];
  };
  const statusFor = (key, locked=false) => locked
    ? (hasFaretype ? 'locked' : 'free')
    : (hasFaretype ? (overrides[key] || 'inherited') : 'free');
  const disabledFor = (key, locked=false) => {
    const status = statusFor(key, locked);
    return status === 'locked' || status === 'inherited';
  };
  const permission = (key, label, helper) => {
    const status = statusFor(key);
    const enabled = !!form[key];
    return (
      <div style={{ minWidth:0, padding:'10px 12px', border:`1px solid ${enabled ? T.primaryLine : T.line}`, borderRadius:8, background:enabled ? T.primaryBg : T.fill }}>
        <OTRow label={label} helper={helper} on={enabled} onChange={value => set(key, value)} status={status}
          onOverride={() => toggleOverride(key)} onRevert={() => toggleOverride(key)}/>
      </div>
    );
  };
  const sailingLabel = form.sailings?.length ? form.sailings.join(', ') : (form.sailing || selectedFarecode?.sailing || '—');

  return (
    <section aria-label="Edit Farecode Policy Eligibility" style={{ width:'100%', border:`1px solid ${T.line}`, borderRadius:10, overflow:'hidden', background:'#fff', boxShadow:'0 1px 2px rgba(15,23,42,.05)' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <span style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35 }}>01</span>
        <div>
          <h2 style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Policy Eligibility</h2>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Review the Farecode context, assigned policies, and guest booking requirements.</p>
        </div>
      </div>

      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:16 }}>
        <div>
          <FarecodePolicyGroupHeading title="Farecode context" helper="The sailing-specific record this configuration belongs to." />
          {mode === 'create' ? (
            <div style={{ marginTop:10, padding:'11px 12px', borderRadius:8, border:`1px solid ${errors.farecode ? '#FECACA' : T.primaryLine}`, background:T.primaryBg, display:'grid', gridTemplateColumns:'minmax(340px, 1.35fr) minmax(420px, 1fr)', alignItems:'end', gap:14 }}>
              <Field label="Linked Farecode" required error={errors.farecode}>
                <Sel ariaLabel="Linked Farecode" value={form.farecode || ''} onChange={selectFarecode} err={errors.farecode}
                  opts={[['','Select a Farecode…'], ...farecodes.map(row => [row.code, `${row.code} · ${row.ship} · ${row.sailing}`])]}/>
              </Field>
              <div style={{ minHeight:37, display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:10, alignItems:'center', padding:'7px 10px', borderRadius:7, background:'#fff', border:`1px solid ${T.primaryLine}` }}>
                {[
                  ['Ship', selectedFarecode?.ship || '—', false],
                  ['Sailing', sailingLabel, true],
                  ['Parent Faretype', selectedFarecode?.faretype || '—', true]
                ].map(([label, value, mono]) => (
                  <div key={label} style={{ minWidth:0 }}>
                    <div style={{ fontSize:8.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px' }}>{label}</div>
                    <div style={{ marginTop:2, fontSize:11.5, fontWeight:700, color:value === '—' ? T.inkFaint : T.ink, fontFamily:mono ? "'SF Mono',Menlo,monospace" : 'inherit', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ marginTop:10, padding:'11px 12px', borderRadius:8, border:`1px solid ${T.primaryLine}`, background:T.primaryBg, display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:12 }}>
              {[
                ['Farecode', form.farecode || selectedFarecode?.code || '—', true, true],
                ['Ship', form.ship || selectedFarecode?.ship || '—', false, false],
                ['Sailing', sailingLabel, true, false],
                ['Parent Faretype', form.faretype || selectedFarecode?.faretype || '—', true, false]
              ].map(([label, value, mono, accent]) => (
                <div key={label} style={{ minWidth:0 }}>
                  <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{label}</div>
                  <div style={{ marginTop:4, fontSize:12.5, fontWeight:accent ? 750 : 650, color:accent ? T.primary : T.ink, fontFamily:mono ? "'SF Mono',Menlo,monospace" : 'inherit', overflowWrap:'anywhere' }}>{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ paddingTop:15, borderTop:`1px solid ${T.lineSoft}` }}>
          <FarecodePolicyGroupHeading title="Policy assignment" helper="Payment and refund rules currently applied to this Farecode." />
          <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <OField label="Cancellation Policy" required status={statusFor('cancellationPolicy')} error={errors.cancellationPolicy}
              onOverride={() => toggleOverride('cancellationPolicy')} onRevert={() => toggleOverride('cancellationPolicy')}>
              <Sel ariaLabel="Cancellation Policy" value={form.cancellationPolicy} onChange={value => set('cancellationPolicy', value)}
                dis={disabledFor('cancellationPolicy')} err={errors.cancellationPolicy} opts={policyOptions('cancel', form.cancellationPolicy)}/>
            </OField>
            <OField label="Deposit Policy" required status={statusFor('depositPolicy')} error={errors.depositPolicy}
              onOverride={() => toggleOverride('depositPolicy')} onRevert={() => toggleOverride('depositPolicy')}>
              <Sel ariaLabel="Deposit Policy" value={form.depositPolicy} onChange={value => set('depositPolicy', value)}
                dis={disabledFor('depositPolicy')} err={errors.depositPolicy} opts={policyOptions('deposit', form.depositPolicy)}/>
            </OField>
          </div>
        </div>

        <div style={{ paddingTop:15, borderTop:`1px solid ${T.lineSoft}` }}>
          <FarecodePolicyGroupHeading title="Guest eligibility" helper="Qualification and booking-window rules applied by this configuration." />
          <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:10 }}>
            <OField label="Residency" status={statusFor('residency', true)} noOvr>
              <Sel ariaLabel="Residency" value={form.residency} onChange={value => set('residency', value)} dis={disabledFor('residency', true)}
                opts={[['Any','Any'],['US Only','US Only'],['Non-US','Non-US'],['Canada','Canada'],['UK','UK']]}/>
            </OField>
            <OField label="Minimum Age" status={statusFor('minAge', true)} noOvr>
              <input className="fi" type="number" style={iS(false, disabledFor('minAge', true))} value={form.minAge} disabled={disabledFor('minAge', true)} min={0} max={99} onChange={event => set('minAge', event.target.value)}/>
            </OField>
            <OField label="Advanced Purchase" status={statusFor('advancedPurchase')} onOverride={() => toggleOverride('advancedPurchase')} onRevert={() => toggleOverride('advancedPurchase')}>
              <input className="fi" type="number" style={iS(false, disabledFor('advancedPurchase'))} value={form.advancedPurchase} disabled={disabledFor('advancedPurchase')} min={0} placeholder="No restriction" onChange={event => set('advancedPurchase', event.target.value)}/>
            </OField>
            <OField label="Minimum Occupancy" status={statusFor('minOccupancy')} onOverride={() => toggleOverride('minOccupancy')} onRevert={() => toggleOverride('minOccupancy')}>
              <input className="fi" type="number" style={iS(false, disabledFor('minOccupancy'))} value={form.minOccupancy} disabled={disabledFor('minOccupancy')} min={1} placeholder="—" onChange={event => set('minOccupancy', event.target.value)}/>
            </OField>
            <OField label="Maximum Occupancy" status={statusFor('maxOccupancy')} onOverride={() => toggleOverride('maxOccupancy')} onRevert={() => toggleOverride('maxOccupancy')}>
              <input className="fi" type="number" style={iS(false, disabledFor('maxOccupancy'))} value={form.maxOccupancy} disabled={disabledFor('maxOccupancy')} min={1} placeholder="—" onChange={event => set('maxOccupancy', event.target.value)}/>
            </OField>
          </div>
        </div>

        <div style={{ paddingTop:15, borderTop:`1px solid ${T.lineSoft}` }}>
          <FarecodePolicyGroupHeading title="Booking permissions" helper="Optional booking paths enabled for this Farecode." />
          <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'repeat(3, minmax(0,1fr))', gap:8 }}>
            {permission('standbyEligible', 'Standby', 'Waitlist booking')}
            {permission('upgradeEligible', 'Upgrades', 'Cabin changes')}
            {permission('couponEligible', 'Coupons', 'Promo codes')}
          </div>
        </div>
      </div>
    </section>
  );
}

function FarecodePolicyEligibilityPanel({ mode='create', editData, farecodes, policies, onClose, onSave }) {
  const buildInitialForm = () => editData ? {
    ...DEFAULT_FORM(),
    farecode:editData.farecode,
    ship:editData.ship,
    sailing:editData.sailing,
    sailings:editData.sailings || (editData.sailing ? [editData.sailing] : []),
    faretype:editData.faretype,
    ...policyEligibilityValues(editData),
  } : { ...DEFAULT_FORM(), farecode:'' };
  const buildInitialOverrides = () => ({ ...DEFAULT_OVRD(), ...(editData?.overrides || {}) });
  const [form, setForm] = useState(buildInitialForm);
  const [overrides, setOverrides] = useState(buildInitialOverrides);
  const [errors, setErrors] = useState({});
  const [showDiscard, setShowDiscard] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(mode !== 'view');
  const initialRef = useRef(JSON.stringify({ form:buildInitialForm(), overrides:buildInitialOverrides() }));

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);
  const set = (key, value) => setForm(previous => ({ ...previous, [key]:value }));
  const toggleOverride = key => setOverrides(previous => ({ ...previous, [key]:previous[key]==='overridden'?'inherited':'overridden' }));
  const selectedFarecode = farecodes.find(row => row.code === form.farecode);
  const selectedFaretype = FT_DATA.find(item => item.code === form.faretype);
  const isDirty = () => initialRef.current !== JSON.stringify({ form, overrides });
  const handleClose = () => isEditing && isDirty() ? setShowDiscard(true) : onClose();
  const cancelEdit = () => {
    const initial = JSON.parse(initialRef.current);
    setForm(initial.form);
    setOverrides(initial.overrides);
    setErrors({});
    setIsEditing(false);
  };

  const selectFarecode = code => {
    const row = farecodes.find(item => item.code === code);
    if (!row) {
      setForm({ ...DEFAULT_FORM(), farecode:'' });
      setOverrides(DEFAULT_OVRD());
      return;
    }
    const faretype = FT_DATA.find(item => item.code === row.faretype);
    setForm({
      ...DEFAULT_FORM(),
      ...(faretype?.vals || {}),
      farecode:row.code,
      ship:row.ship,
      sailing:row.sailing,
      sailings:[row.sailing],
      faretype:row.faretype,
      supp:cloneSupplements(faretype?.vals?.supp || defaultSupplements()),
    });
    setOverrides(DEFAULT_OVRD());
    setErrors({});
  };

  const submit = () => {
    const nextErrors = {};
    if (!form.farecode) nextErrors.farecode = 'Select a Farecode';
    if (!form.cancellationPolicy) nextErrors.cancellationPolicy = 'Required';
    if (!form.depositPolicy) nextErrors.depositPolicy = 'Required';
    setErrors(nextErrors);
    if (!Object.keys(nextErrors).length) onSave({ form, overrides });
  };

  return (
    <>
      <div onClick={handleClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.32)', backdropFilter:'blur(2px)', zIndex:900, opacity:mounted?1:0, transition:'opacity .25s' }}/>
      <div role="dialog" aria-modal="true" aria-label={mode==='create' ? 'Configure Farecode Policy Eligibility' : isEditing ? 'Edit Farecode Policy Eligibility' : 'Farecode Policy Eligibility details'}
        style={{ position:'fixed', top:0, right:0, bottom:0, width:1180, maxWidth:'100%', background:T.panel, zIndex:901, display:'flex', flexDirection:'column', boxShadow:'-8px 0 40px rgba(0,0,0,.14)', transform:mounted?'translateX(0)':'translateX(100%)', transition:'transform .3s cubic-bezier(.32,0,.67,0)' }}>
        <div style={{ padding:'16px 24px', borderBottom:`1px solid ${T.line}`, flexShrink:0, background:T.panel }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, minWidth:0 }}>
              <div style={{ width:36, height:36, borderRadius:9, background:T.primary, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:11, fontWeight:800 }}>PE</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:5 }}>{mode==='create' ? 'Configure Farecode Policy Eligibility' : isEditing ? `Edit Policy Eligibility · ${form.farecode}` : `Policy Eligibility · ${form.farecode}`}</div>
                <div style={{ fontSize:12, color:T.inkFaint }}>{isEditing ? 'Assign policies and guest requirements without changing the Farecode core configuration.' : 'Review the assigned policies and guest booking requirements.'}</div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {mode==='view' && !isEditing && <button type="button" onClick={() => setIsEditing(true)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 13px', border:'none', borderRadius:7, background:T.primary, color:'#fff', fontSize:12.5, fontWeight:700, cursor:'pointer', boxShadow:'0 1px 3px rgba(15,23,42,.18)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                Edit
              </button>}
              <button onClick={handleClose} aria-label="Close Policy Eligibility drawer" style={{ width:32, height:32, borderRadius:7, border:`1.5px solid ${T.line}`, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.inkSoft }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="pscroll" style={{ flex:1, overflowY:'auto', padding:`26px 30px ${isEditing ? 100 : 26}px`, background:T.panel }}>
          {isEditing
            ? <FarecodePolicyEligibilityEditor mode={mode} form={form} set={set} overrides={overrides} toggleOverride={toggleOverride} errors={errors} policies={policies}
                farecodes={farecodes} selectedFarecode={selectedFarecode} selectedFaretype={selectedFaretype} selectFarecode={selectFarecode}/>
            : <FarecodePolicyEligibilityOverview form={form} overrides={overrides} record={editData}/>}
        </div>

        {isEditing && <div style={{ position:'absolute', bottom:0, left:0, right:0, minHeight:62, padding:'12px 22px', borderTop:`1px solid ${T.line}`, background:T.panel, display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, zIndex:10 }}>
          <span style={{ fontSize:11.5, color:T.inkFaint }}>{form.farecode ? `Linked to ${form.farecode}` : 'Select a Farecode to continue'}</span>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            {mode==='view' && <button type="button" onClick={cancelEdit} style={{ padding:'8px 15px', background:'#fff', color:T.inkSoft, border:`1px solid ${T.line}`, borderRadius:7, fontSize:13, fontWeight:650, cursor:'pointer' }}>Cancel</button>}
            <button onClick={submit} style={{ padding:'8px 16px', background:T.primary, color:'#fff', border:'none', borderRadius:7, fontSize:13, fontWeight:650, cursor:'pointer', boxShadow:'0 1px 4px rgba(27,36,52,.2)' }}>
              {mode==='create' ? 'Activate Policy Eligibility' : 'Save Changes'}
            </button>
          </div>
        </div>}

        {showDiscard && (
          <div style={{ position:'absolute', inset:0, background:'rgba(15,23,42,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:20 }}>
            <div style={{ background:'#fff', borderRadius:14, padding:'28px 32px', maxWidth:370, width:'90%', boxShadow:'0 24px 64px rgba(0,0,0,.22)' }}>
              <div style={{ fontSize:16, fontWeight:700, color:T.ink, marginBottom:8 }}>Unsaved changes</div>
              <div style={{ fontSize:14, color:T.inkSoft, marginBottom:24, lineHeight:1.6 }}>Discard this Farecode Policy Eligibility configuration?</div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button onClick={() => setShowDiscard(false)} style={{ padding:'9px 15px', border:`1px solid ${T.line}`, borderRadius:8, background:'#fff', color:T.ink, cursor:'pointer' }}>Keep editing</button>
                <button onClick={onClose} style={{ padding:'9px 15px', border:'none', borderRadius:8, background:T.red, color:'#fff', cursor:'pointer', fontWeight:650 }}>Discard</button>
              </div>
            </div>
          </div>
        )}
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

const FARECODE_POLICY_ELIGIBILITY_COLS = [
  { key:'farecode', label:'Farecode ID', sort:true, width:'140px' },
  { key:'faretype', label:'Parent Faretype', sort:true, width:'150px' },
  { key:'cancellationPolicy', label:'Cancellation Policy', sort:true, width:'220px' },
  { key:'depositPolicy', label:'Deposit Policy', sort:true, width:'210px' },
  { key:'eligibility', label:'Guest Eligibility', sort:false, width:'170px' },
  { key:'status', label:'Status', sort:true, width:'110px' },
  { key:'mod', label:'Last Modified', sort:true, width:'140px' },
];

function FarecodePolicyEligibilityTable({ rows, sortCol, sortDir, onSort, onOpen }) {
  const mono = "'SF Mono',Menlo,monospace";
  const cell = (row, key) => {
    if (key==='farecode') return <span style={{ fontFamily:mono, fontSize:12.5, fontWeight:750, color:T.primary }}>{row.farecode}</span>;
    if (key==='faretype') return <span style={{ fontFamily:mono, fontSize:12, fontWeight:650, color:T.inkSoft }}>{row.faretype}</span>;
    if (key==='cancellationPolicy' || key==='depositPolicy') return <span style={{ color:T.inkSoft }}>{row[key] || '—'}</span>;
    if (key==='eligibility') return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:T.inkSoft, whiteSpace:'nowrap' }}>
        <span>{row.residency || 'Any'}</span><span style={{ color:T.inkFaint }}>·</span><span>Age {row.minAge || 18}+</span>
      </span>
    );
    if (key==='status') return <StatusBadge status={row.status}/>;
    if (key==='mod') return <span style={{ color:T.inkSoft, fontSize:12.5 }}>{row.mod}</span>;
    return null;
  };
  return <DataTable cols={FARECODE_POLICY_ELIGIBILITY_COLS} rows={rows} cell={cell} minWidth={1160}
    sortCol={sortCol} sortDir={sortDir} onSort={onSort} onRowClick={onOpen}
    emptyTitle="No Farecode Policy Eligibility records match your filters"/>;
}

/* ═══════════════════════════════════════
   APP
═══════════════════════════════════════ */
function FarecodeListScreen({ policies }) {
  const [data, setData] = useState(INIT_DATA);
  const [policyEligibility, setPolicyEligibility] = useState(INIT_POLICY_ELIGIBILITY);
  const [view, setView] = useState('farecode');
  const [search, setSearch] = useState('');
  const [shipF, setShipF] = useState([]);
  const [ftF, setFtF] = useState('');
  const [sortCol, setSortCol] = useState('mod');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState(null);
  const [chooser, setChooser] = useState(false);
  const nextPolicyEligibilityId = useRef(7);

  const sourceRows = view==='farecode' ? data : policyEligibility;
  let filtered = sourceRows.filter(row => {
    const q = search.trim().toLowerCase();
    const searchable = view==='farecode'
      ? `${row.code} ${row.ship} ${row.sailing} ${row.faretype}`
      : `${row.farecode} ${row.faretype} ${row.cancellationPolicy} ${row.depositPolicy} ${row.residency}`;
    if (q && !searchable.toLowerCase().includes(q)) return false;
    if (view==='farecode' && shipF.length>0 && !shipF.includes(row.ship)) return false;
    if (view==='farecode' && ftF && row.faretype!==ftF) return false;
    return true;
  });
  const MONTHS = {Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
  const parseDate = d => { const [day,mon,yr]=String(d||'').split(' '); return new Date(yr,MONTHS[mon]-1,parseInt(day)); };
  const DATE_COLS = ['mod','start','end'];
  if (sortCol) filtered=[...filtered].sort((a,b) => { let cmp=DATE_COLS.includes(sortCol)?parseDate(a[sortCol])-parseDate(b[sortCol]):String(a[sortCol]).localeCompare(String(b[sortCol])); return sortDir==='asc'?cmp:-cmp; });

  const totalPages=Math.max(1,Math.ceil(filtered.length/PAGE_SIZE)), pageRows=filtered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const hasFilter=!!search||(view==='farecode'&&(shipF.length>0||!!ftF));
  const clearFilters=()=>{ setSearch('');setShipF([]);setFtF('');setPage(1); };
  const handleSort=col=>{ if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortCol(col);setSortDir('asc');} };
  useEffect(()=>setPage(1),[search,shipF,ftF]);
  useEffect(() => {
    setPage(1);
    setSearch('');
    setShipF([]);
    setFtF('');
    setSortCol('mod');
    setSortDir('desc');
    setChooser(false);
  }, [view]);

  const openCreate = kind => {
    setChooser(false);
    setPanel({ kind, mode:'create' });
  };
  const openFarecode = row => setPanel({ kind:'farecode', mode:'view', row });
  const openPolicyEligibility = row => setPanel({ kind:'policyEligibility', mode:'view', row });
  const TODAY = '18 Jun 2026';
  const savePolicyEligibility = ({ form, overrides }) => {
    const base = data.find(row => row.code===form.farecode);
    if (!base) return;
    const existing = panel?.row || policyEligibility.find(row => row.farecode===form.farecode);
    const next = {
      id:existing?.id || nextPolicyEligibilityId.current++,
      farecode:base.code,
      ship:base.ship,
      sailing:base.sailing,
      sailings:[base.sailing],
      faretype:base.faretype,
      ...policyEligibilityValues(form),
      overrides:{ ...DEFAULT_OVRD(), ...overrides },
      status:existing?.status || 'Active',
      mod:TODAY,
    };
    setPolicyEligibility(previous => existing
      ? previous.map(row => row.id===existing.id ? next : row)
      : [...previous, next]);
    setView('policyEligibility');
    setPanel(null);
  };

  /* Start/End sit next to Sailing — they describe that sailing's window, not the farecode. */
  const COLS=[{ key:'code',label:'Farecode ID',sort:true },{ key:'ship',label:'Ship',sort:false },{ key:'sailing',label:'Sailing',sort:true },{ key:'start',label:'Start Date',sort:true,width:'125px' },{ key:'end',label:'End Date',sort:true,width:'125px' },{ key:'cabins',label:'Cabin Categories',sort:false },{ key:'faretype',label:'Linked Faretype',sort:true },{ key:'status',label:'Status',sort:false },{ key:'mod',label:'Last Modified',sort:true }];
  const mono = "'SF Mono',Menlo,monospace";
  const cell = (row, key) => {
    if (key==='code') return <span style={{ fontFamily:mono, fontSize:12.5, fontWeight:700, color:T.primary }}>{row.code}</span>;
    if (key==='ship') return <span style={{ color:T.ink, fontWeight:450 }}>{row.ship}</span>;
    if (key==='sailing') return <span style={{ fontFamily:mono, fontSize:12, color:T.inkSoft }}>{row.sailing}</span>;
    if (key==='start'||key==='end') return <span style={{ color:T.inkSoft, fontSize:12.5, whiteSpace:'nowrap' }}>{row[key]}</span>;
    if (key==='cabins') return <CabinsCell cabins={row.cabins}/>;
    if (key==='faretype') return <span style={{ fontFamily:mono, fontSize:12.5, fontWeight:600, color:T.primary }}>{row.faretype}</span>;
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
              <div style={{ fontSize:13, color:T.inkSoft }}>Manage sailing-specific Farecodes and their Policy Eligibility configurations.</div>
            </div>
            <div style={{ position:'relative', flexShrink:0 }}>
              <button type="button" aria-haspopup="menu" aria-expanded={chooser} onClick={() => setChooser(previous => !previous)}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', background:T.primary, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', boxShadow:'0 2px 6px rgba(27,36,52,.2)' }}>
                + New Template
              </button>
              {chooser && <>
                <div aria-hidden="true" onClick={() => setChooser(false)} style={{ position:'fixed', inset:0, zIndex:300 }}/>
                <div role="menu" aria-label="Choose Farecode configuration type" style={{ position:'absolute', right:0, top:'calc(100% + 6px)', width:320, background:'#fff', border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 12px 32px rgba(15,23,42,.14)', zIndex:400, overflow:'hidden' }}>
                  <div style={{ padding:'9px 14px', fontSize:10.5, fontWeight:750, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px', background:T.fill, borderBottom:`1px solid ${T.lineSoft}` }}>Choose a configuration</div>
                  <button role="menuitem" onClick={() => openCreate('farecode')} style={{ width:'100%', display:'flex', gap:11, alignItems:'flex-start', padding:'13px 14px', background:'#fff', border:'none', borderBottom:`1px solid ${T.lineSoft}`, textAlign:'left', cursor:'pointer' }}>
                    <span style={{ width:28, height:28, borderRadius:7, background:T.primary, color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, flexShrink:0 }}>F</span>
                    <span><span style={{ display:'block', fontSize:13, fontWeight:700, color:T.ink }}>Farecode</span><span style={{ display:'block', marginTop:3, fontSize:11.5, lineHeight:1.4, color:T.inkFaint }}>Configure sailing context, access, marketing, supplements, and pricing.</span></span>
                  </button>
                  <button role="menuitem" onClick={() => openCreate('policyEligibility')} style={{ width:'100%', display:'flex', gap:11, alignItems:'flex-start', padding:'13px 14px', background:'#fff', border:'none', textAlign:'left', cursor:'pointer' }}>
                    <span style={{ width:28, height:28, borderRadius:7, background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.primary, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>PE</span>
                    <span><span style={{ display:'block', fontSize:13, fontWeight:700, color:T.ink }}>Policy Eligibility</span><span style={{ display:'block', marginTop:3, fontSize:11.5, lineHeight:1.4, color:T.inkFaint }}>Assign policy rules and guest requirements to a Farecode.</span></span>
                  </button>
                </div>
              </>}
            </div>
          </div>
        </div>

        {/* Table card */}
        <div style={{ flex:1, padding:'0 28px 28px' }}>
          <ListCard>

            <div style={{ padding:'14px 16px 0', background:T.fill }}>
              <div role="tablist" aria-label="Farecode configuration views" style={{ display:'inline-flex', padding:3, borderRadius:9, border:`1px solid ${T.line}`, background:'#EEF2F7', gap:3 }}>
                {[
                  ['farecode','Farecode',data.length],
                  ['policyEligibility','Policy Eligibility',policyEligibility.length],
                ].map(([key,label,count]) => {
                  const activeView = view===key;
                  return <button key={key} role="tab" aria-selected={activeView} onClick={() => setView(key)}
                    style={{ display:'inline-flex', alignItems:'center', gap:7, minHeight:32, padding:'6px 12px', borderRadius:7, border:activeView?`1px solid ${T.primary}`:'1px solid transparent', background:activeView?T.primary:'transparent', color:activeView?'#fff':T.inkSoft, fontSize:12.5, fontWeight:activeView?700:600, cursor:'pointer' }}>
                    {label}<span style={{ minWidth:20, padding:'1px 6px', borderRadius:999, background:activeView?'rgba(255,255,255,.16)':'#fff', color:activeView?'#fff':T.inkFaint, fontSize:10.5, fontWeight:750 }}>{count}</span>
                  </button>;
                })}
              </div>
            </div>

            {/* Filters */}
            <ListToolbar>
              <FilterRow>
                <ListSearch value={search} onChange={setSearch} placeholder={view==='farecode'?'Filter by Farecode ID, ship, sailing…':'Filter by Farecode, Faretype, or policy…'}/>
                {view==='farecode' && <ShipFilter selected={shipF} onChange={setShipF}/>}
                {view==='farecode' && <FaretypeFilter value={ftF} onChange={setFtF}/>}
                {hasFilter && <ClearFilters onClick={clearFilters}/>}
                <ResultCount>{filtered.length} of {sourceRows.length} {view==='farecode'?'farecodes':'Policy Eligibility records'}</ResultCount>
              </FilterRow>
            </ListToolbar>

            {view==='farecode' ? (
              <DataTable
                cols={COLS} rows={pageRows} cell={cell} minWidth={1180}
                sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
                onRowClick={openFarecode}
                emptyTitle={hasFilter ? 'No farecodes match your filters' : 'No farecodes yet'}/>
            ) : (
              <FarecodePolicyEligibilityTable rows={pageRows} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} onOpen={openPolicyEligibility}/>
            )}

            <ListPager page={page} setPage={setPage} total={filtered.length} pageSize={PAGE_SIZE} noun={view==='farecode'?'farecodes':'Policy Eligibility records'}/>
          </ListCard>
        </div>
      </div>

      {/* Panel overlay */}
      {panel?.kind==='farecode' && (
        <FarecodePanel mode={panel.mode} viewRow={panel.row} initialEdit={!!panel.initialEdit} policies={policies}
          policyEligibilityRecord={policyEligibility.find(record => record.farecode===panel.row?.code)} onClose={() => setPanel(null)}/>
      )}
      {panel?.kind==='policyEligibility' && (
        <FarecodePolicyEligibilityPanel mode={panel.mode} editData={panel.row} farecodes={data} policies={policies}
          onSave={savePolicyEligibility} onClose={() => setPanel(null)}/>
      )}
    </>
  );
}

Object.assign(window, { FarecodeListScreen });
})();
