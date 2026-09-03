// ft-faretype.jsx — Faretype module (ported from "Faretype Detail Panel v4").
// v4 supersedes v3: same list + 7-step create / 8-step edit panel, plus the read-only FaretypeDetailPanel
// (Overview / Farecodes / Audit tabs) shown when a table row is clicked, and a "Review Changes"
// diff section in the edit panel.
// Wrapped in an IIFE: it defines its own T / iS / Field / Sel / Toggle / STATUS_S / SCard /
// StatusBadge / IcSearch / Sidebar / TopBar, all of which collide with dc-shell.jsx globals.
// Policy fields resolve against the live Policies module — see the bridge helpers below.
(function () {

const { useState, useRef, useEffect } = React;

/* ── Tokens ─────────────────────────────────── */
const T = {
  ink: '#0F172A', inkSoft: '#475569', inkFaint: '#5B6B82', inkLabel: '#5B6B82',
  bg: '#F1F5F9', panel: '#FFFFFF', fill: '#F8FAFC', navFill: '#F9FAFB',
  line: '#E2E8F0', lineSoft: '#EEF2F6', primary: '#1B2434', primaryBg: '#EFF6FF', primaryLine: '#DBEAFE',
  teal: '#047857', tealDark: '#047857', tealLight: '#ECFDF5',
  amber: '#92400E', amberDark: '#92400E', amberLight: '#FFFBEB', amberBorder: '#FCD34D',
  red: '#DC2626', redLight: '#FEF2F2', green: '#047857', greenLight: '#F0FDF4'
};

/* ── Seed Data ──────────────────────────────── */
const INIT_ROWS = [
{ id: 1, code: 'FT-00101', basis: 'CORE-RETAIL', group: 'Core', source: 'WC', cancellationPolicy: 'Standard Cancellation', depositPolicy: '5 Night Standard Deposit', standbyEligible: false, upgradeEligible: true, couponEligible: true, fc: 12, status: 'Active', mod: '14 Jun 2026' },
{ id: 2, code: 'FT-00102', basis: 'NR-PROMO', group: 'Non-Refundable', source: 'Partner', cancellationPolicy: 'Non-Refundable', depositPolicy: '5 Night Promo Deposit', standbyEligible: false, upgradeEligible: false, couponEligible: false, fc: 5, status: 'Active', mod: '11 Jun 2026' },
{ id: 3, code: 'FT-00103', basis: 'INT-AGENCY', group: 'Interline', source: 'Partner', cancellationPolicy: 'Standard — Suites Enhanced', depositPolicy: '7 Night Trade Deposit', standbyEligible: true, upgradeEligible: true, couponEligible: true, fc: 3, status: 'Draft', mod: '10 Jun 2026' },
{ id: 4, code: 'FT-00104', basis: 'BROC-2025', group: 'Brochure', source: 'WC', cancellationPolicy: 'Standard Cancellation', depositPolicy: '5 Night Standard Deposit', standbyEligible: false, upgradeEligible: true, couponEligible: true, fc: 8, status: 'Active', mod: '08 Jun 2026' },
{ id: 5, code: 'FT-00105', basis: 'CASINO-STD', group: 'Core', source: 'Casino', cancellationPolicy: 'Standard Cancellation', depositPolicy: '3 Night Sampler Deposit', standbyEligible: false, upgradeEligible: true, couponEligible: true, fc: 0, status: 'Draft', mod: '07 Jun 2026' },
{ id: 6, code: 'FT-00106', basis: 'YM-FLEX', group: 'Core', source: 'YM', cancellationPolicy: 'Standard Cancellation', depositPolicy: '5 Night Standard Deposit', standbyEligible: false, upgradeEligible: true, couponEligible: true, fc: 2, status: 'Inactive', mod: '28 May 2026' },
{ id: 7, code: 'FT-00107', basis: 'NR-GROUP', group: 'Non-Refundable', source: 'WC', cancellationPolicy: 'Non-Refundable', depositPolicy: '5 Night Standard Deposit', standbyEligible: false, upgradeEligible: true, couponEligible: true, fc: 6, status: 'Active', mod: '13 Jun 2026' },
{ id: 8, code: 'FT-00108', basis: 'INT-PROMO', group: 'Interline', source: 'Partner', cancellationPolicy: 'Standard Cancellation', depositPolicy: '5 Night Promo Deposit', standbyEligible: false, upgradeEligible: true, couponEligible: true, fc: 1, status: 'Active', mod: '02 Jun 2026' }];

/* Legacy Policy Eligibility records could carry a Faretype association. Normalize into a
   standalone guest-eligibility template and retain only template identity and guest rules. */
function normalizeEligibilityTemplate(row = {}, index = 0) {
  const id = row.id ?? index + 1;
  return {
    id,
    code: row.code || `PE-${String(id).padStart(5, '0')}`,
    name: row.name || row.faretypeCode || `Guest Eligibility ${String(id).padStart(2, '0')}`,
    residency: row.residency || 'Any',
    minAge: row.minAge ?? 18,
    minOccupancy: row.minOccupancy ?? row.minOcc ?? '',
    maxOccupancy: row.maxOccupancy ?? row.maxOcc ?? '',
    advancedPurchase: row.advancedPurchase ?? row.advPurchase ?? '',
    boardingPass: row.boardingPass ?? '',
    status: row.status || 'Draft',
    mod: row.mod || '—'
  };
}

const INIT_POLICY_ELIGIBILITY = [
{ id: 1, code: 'PE-00001', name: 'Retail Standard', residency: 'Any', minAge: 18, status: 'Active', mod: '14 Jun 2026' },
{ id: 2, code: 'PE-00002', name: 'Non-Refundable Retail', residency: 'Any', minAge: 18, status: 'Active', mod: '12 Jun 2026' },
{ id: 3, code: 'PE-00003', name: 'International Agency', residency: 'Non-US', minAge: 18, status: 'Active', mod: '11 Jun 2026' },
{ id: 4, code: 'PE-00004', name: 'Casino Guest', residency: 'Any', minAge: 21, status: 'Draft', mod: '09 Jun 2026' },
{ id: 5, code: 'PE-00005', name: 'Flexible Retail', residency: 'Any', minAge: 18, status: 'Active', mod: '08 Jun 2026' },
{ id: 6, code: 'PE-00006', name: 'Group Contract', residency: 'Any', minAge: 18, status: 'Inactive', mod: '04 Jun 2026' }
].map(normalizeEligibilityTemplate);

const GROUP_S = {
  'Core': { bg: '#EEF2FF', color: '#4338CA' },
  'Non-Refundable': { bg: '#FFF1F2', color: '#BE123C' },
  'Interline': { bg: '#FFF7ED', color: '#C2410C' },
  'Brochure': { bg: '#F0FDF4', color: '#15803D' }
};
const STATUS_S = {
  'Active': { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  'Draft': { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  'Inactive': { bg: '#F8FAFC', color: '#475569', dot: '#94A3B8' }
};

/* ── Default form ───────────────────────────── */
const mkSupp = (id, title, type) => ({ id, title, type, custom: false, enabled: false, name: '', cabin: '', cabins: [], rule: 'Booking', maxCount: '', farePos: [], applicableSailings: [] });
const DEFAULT_FORM = () => ({
  faretypeCode: '', fareBasisCode: '', faretypeGroup: '', source: '',
  cancellationPolicy: '', depositPolicy: '',
  standbyEligible: false, upgradeEligible: true, couponEligible: true,
  cruiseControlAccess: true,
  chMVASB2C: true, chMVASB2B: true, chCC: true, chTradeAPI: false, chCRM: true, chGroup: false,
  channelPartners: [],
  mktExpanded: false, includeDiscount: false, discountMessage: '',
  offerPrimary: '', offerSecondary: '', offerTertiary: [],
  waiveGovTaxes: false, waiveCruiseExp: false, noFareDisplay: false,
  supp: [
  mkSupp('complimentary', 'Complementary Supplement', 'comp'),
  mkSupp('paid', 'Paid Supplement', 'paid')]

});

const DEFAULT_ELIGIBILITY_FORM = () => ({
  residency: 'Any', minAge: 18, minOccupancy: '', maxOccupancy: '', advancedPurchase: '', boardingPass: ''
});
const ELIGIBILITY_KEYS = ['residency', 'minAge', 'minOccupancy', 'maxOccupancy', 'advancedPurchase', 'boardingPass'];
const eligibilityValues = (record) => Object.fromEntries(ELIGIBILITY_KEYS.filter((key) => record && Object.prototype.hasOwnProperty.call(record, key)).map((key) => [key, record[key]]));


/* ── Live Policies bridge ─────────────────────
   Active parent policies come from the shell's Policies module (pol-data.jsx), so a
   Faretype always inherits from records that actually exist. */
const polParents = (policies, type) => (policies || []).filter((g) => g.type === type && g.status === 'Active').
  flatMap((g) => g.parents.filter((p) => p.status === 'Active').map((p) => ({ ...p, group: g })));
const isActivePolicy = (policies, type, name) => !!name && polParents(policies, type).some((p) => p.name === name);
const polOptsFor = (policies, type, cur) => {
  const list = polParents(policies, type).map((p) => [p.name, `${p.code} · ${p.name}`]);
  if (cur && !list.some((o) => o[0] === cur)) list.unshift([cur, cur]);
  return [['', 'Select policy…'], ...list];
};
const polLabel = (policies, type, name) => {
  const p = polParents(policies, type).find((x) => x.name === name);
  return p ? `${p.code} · ${p.name}` : name || '—';
};

/* ── Panel Primitives ───────────────────────── */
function iS(err, dis) {
  return { width: '100%', padding: '10px 13px', border: `1.5px solid ${err ? T.red : dis ? '#E8EDF3' : '#D8DFE8'}`, borderRadius: 8, fontSize: 13, color: dis ? T.inkFaint : T.ink, background: dis ? '#F3F4F6' : '#fff', outline: 'none', cursor: dis ? 'not-allowed' : undefined, transition: 'border-color .15s, box-shadow .15s' };
}

function Field({ label, required, helper, error, children }) {
  const uid = React.useId().replace(/:/g, '');
  const controlId = `ft-field-${uid}`;
  const labelId = `${controlId}-label`, helpId = `${controlId}-help`, errorId = `${controlId}-error`;
  const describedBy = error ? errorId : helper ? helpId : undefined;
  const bound = bindFieldControl(children, { id:controlId, label, describedBy, invalid:!!error, required:!!required });
  return (
    <div role={label ? 'group' : undefined} aria-labelledby={label ? labelId : undefined} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label &&
      <label id={labelId} htmlFor={bound.bound ? bound.controlId : undefined} style={{ fontSize: 10.5, fontWeight: 700, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.65px', lineHeight: 1 }}>
          {label}{required && <span aria-hidden="true" style={{ color: T.red, marginLeft: 3 }}>*</span>}
        </label>
      }
      {bound.node}
      {error && <span id={errorId} role="alert" style={{ fontSize: 11, color: T.red, marginTop: 0 }}>{error}</span>}
      {helper && !error && <span id={helpId} style={{ fontSize: 11, color: T.inkFaint, lineHeight: 1.4, marginTop: 0 }}>{helper}</span>}
    </div>);

}

function Sel({ value, onChange, opts, err, dis, ariaLabel = 'Select option', inputId, ariaDescribedBy, ariaInvalid, ariaRequired }) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPos, setMenuPos] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useRef(`ft-select-${Math.random().toString(36).slice(2)}`).current;
  const selectedIndex = Math.max(0, opts.findIndex(([v]) => v === value));
  const selected = opts[selectedIndex] || ['', 'Select…'];
  const selectedLabel = selected[1] !== undefined ? selected[1] : selected[0];
  const isPlaceholder = value === '' || value === null || value === undefined;

  useEffect(() => {
    if (dis && open) setOpen(false);
  }, [dis, open]);

  useEffect(() => {
    if (!open) {setMenuPos(null);return;}
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
        width: menuWidth,
        top: opensUp ? undefined : rect.bottom + 5,
        bottom: opensUp ? viewportH - rect.top + 5 : undefined,
        maxHeight: Math.min(240, available)
      });
    };
    const onPointerDown = (e) => {
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

  const choose = (index) => {
    const option = opts[index];
    if (!option) return;
    onChange(option[0]);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const move = (delta) => {
    if (!open) {setOpen(true);return;}
    setActiveIndex((i) => (i + delta + opts.length) % opts.length);
  };
  const onKeyDown = (e) => {
    if (dis) return;
    if (e.key === 'ArrowDown') {e.preventDefault();move(1);} else
    if (e.key === 'ArrowUp') {e.preventDefault();move(-1);} else
    if (e.key === 'Home' && open) {e.preventDefault();setActiveIndex(0);} else
    if (e.key === 'End' && open) {e.preventDefault();setActiveIndex(opts.length - 1);} else
    if ((e.key === 'Enter' || e.key === ' ') && open) {e.preventDefault();choose(activeIndex);} else
    if ((e.key === 'Enter' || e.key === ' ') && !open) {e.preventDefault();setOpen(true);} else
    if (e.key === 'Escape' && open) {e.preventDefault();setOpen(false);} else
    if (e.key === 'Tab' && open) setOpen(false);
  };
  const triggerStyle = iS(err, dis);

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button id={inputId} ref={triggerRef} type="button" role="combobox" className="fi" disabled={dis} aria-label={ariaLabel} aria-describedby={ariaDescribedBy} aria-haspopup="listbox" aria-controls={menuId} aria-expanded={open} aria-invalid={ariaInvalid || !!err} aria-required={ariaRequired} aria-activedescendant={open ? `${menuId}-option-${activeIndex}` : undefined}
      onClick={() => !dis && setOpen((v) => !v)} onKeyDown={onKeyDown}
      style={{ ...triggerStyle, minHeight: 37, padding: '8px 10px 8px 12px', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, textAlign: 'left', fontFamily: 'inherit', cursor: dis ? 'not-allowed' : 'pointer', border: open ? `1.5px solid ${T.primary}` : triggerStyle.border, boxShadow: open ? '0 0 0 3px rgba(27,36,52,.1)' : undefined }}>
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: dis ? T.inkFaint : isPlaceholder ? T.inkFaint : T.ink }}>{selectedLabel}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={open ? T.primary : T.inkFaint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .15s ease' }}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && menuPos && ReactDOM.createPortal(
        <div ref={menuRef} id={menuId} role="listbox" aria-label={`${ariaLabel} options`} className="pscroll" style={{ position: 'fixed', left: menuPos.left, top: menuPos.top, bottom: menuPos.bottom, width: menuPos.width, maxHeight: menuPos.maxHeight, overflowY: 'auto', zIndex: 2200, padding: 4, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(15,23,42,.14)' }}>
          {opts.map(([v, l], index) => {
            const label = l !== undefined ? l : v;
            const isSelected = v === value;
            const isActive = index === activeIndex;
            return (
              <button key={`${v}-${index}`} id={`${menuId}-option-${index}`} type="button" role="option" aria-selected={isSelected} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(index)}
              style={{ width: '100%', padding: '8px 9px', border: 'none', borderRadius: 6, background: isSelected ? T.primaryBg : isActive ? T.fill : 'transparent', color: v === '' ? T.inkFaint : isSelected ? T.primary : T.ink, fontSize: 12.5, fontWeight: isSelected ? 700 : 500, lineHeight: 1.35, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                {isSelected && <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.primary} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>}
              </button>);

          })}
        </div>, document.body)
      }
    </div>);

}

function Toggle({ on, onChange, label }) {
  return (
    <div role="switch" aria-checked={on} aria-label={label} tabIndex={0}
    onClick={() => onChange(!on)}
    onKeyDown={(e) => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault();onChange(!on);}}}
    style={{ width: 38, height: 22, borderRadius: 11, flexShrink: 0, background: on ? T.primary : '#CBD5E1', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
    </div>);

}

function TRow({ label, helper, on, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: T.ink, lineHeight: 1.3 }}>{label}</div>
        {helper && <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2, lineHeight: 1.3 }}>{helper}</div>}
      </div>
      <Toggle on={on} onChange={onChange} label={label} />
    </div>);

}

function MultiChip({ values, onChange, opts, placeholder, inputId, ariaLabel, ariaDescribedBy, ariaInvalid, ariaRequired }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [menuPos, setMenuPos] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useRef(`ft-multi-${Math.random().toString(36).slice(2)}`).current;
  const filtered = opts.filter((o) => !values.includes(o) && o.toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    if (!open) {setMenuPos(null);return;}
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
      setMenuPos({ left, width: menuWidth, top: opensUp ? undefined : rect.bottom + 5, bottom: opensUp ? viewportH - rect.top + 5 : undefined, maxHeight: Math.min(240, available) });
    };
    const onPointerDown = (e) => {
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

  useEffect(() => {setActiveIndex(0);}, [q, values.length]);

  const choose = (option) => {
    if (!option) return;
    onChange([...values, option]);
    setQ('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {e.preventDefault();setOpen(true);setActiveIndex((i) => filtered.length ? (i + 1) % filtered.length : 0);} else
    if (e.key === 'ArrowUp') {e.preventDefault();setOpen(true);setActiveIndex((i) => filtered.length ? (i - 1 + filtered.length) % filtered.length : 0);} else
    if (e.key === 'Enter' && open && filtered[activeIndex]) {e.preventDefault();choose(filtered[activeIndex]);} else
    if (e.key === 'Escape' && open) {e.preventDefault();setOpen(false);} else
    if (e.key === 'Tab' && open) setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <div ref={triggerRef} onClick={() => {setOpen(true);inputRef.current?.focus();}}
      style={{ minHeight: 42, padding: '5px 8px', border: `1.5px solid ${open ? T.primary : '#D8DFE8'}`, borderRadius: 7, display: 'flex', flexWrap: 'wrap', gap: 5, cursor: 'text', alignItems: 'center', background: '#fff', boxShadow: open ? '0 0 0 3px rgba(27,36,52,.1)' : 'none', transition: 'border-color .15s, box-shadow .15s' }}>
        {values.map((v) =>
        <span key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 7px', borderRadius: 6, background: T.primaryBg, border: `1px solid ${T.primaryLine}`, color: T.primary, fontSize: 11.5, fontWeight: 600 }}>
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={(e) => {e.stopPropagation();onChange(values.filter((x) => x !== v));}}
            style={{ width: 14, height: 14, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: T.inkFaint, fontSize: 14, lineHeight: 1 }}>×</button>
          </span>
        )}
        <input id={inputId} ref={inputRef} role="combobox" aria-label={ariaLabel || placeholder || 'Search options'} aria-describedby={ariaDescribedBy} aria-invalid={ariaInvalid} aria-required={ariaRequired} aria-haspopup="listbox" aria-controls={menuId} aria-expanded={open} aria-activedescendant={open && filtered[activeIndex] ? `${menuId}-option-${activeIndex}` : undefined}
        value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
        placeholder={values.length === 0 ? placeholder : ''}
        style={{ border: 'none', outline: 'none', fontSize: 13, color: T.ink, flex: 1, minWidth: 100, background: 'transparent', padding: '4px' }} />
      </div>
      {open && menuPos && ReactDOM.createPortal(
        <div ref={menuRef} id={menuId} role="listbox" aria-label={`${placeholder || 'Search'} options`} className="pscroll" style={{ position: 'fixed', left: menuPos.left, top: menuPos.top, bottom: menuPos.bottom, width: menuPos.width, maxHeight: menuPos.maxHeight, overflowY: 'auto', zIndex: 2200, padding: 4, background: T.panel, border: `1px solid ${T.line}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(15,23,42,.14)' }}>
          {filtered.length ? filtered.map((o, index) =>
          <button key={o} id={`${menuId}-option-${index}`} type="button" role="option" aria-selected="false" onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(o)}
          style={{ width: '100%', padding: '8px 9px', border: 'none', borderRadius: 6, background: index === activeIndex ? T.fill : 'transparent', color: T.ink, fontSize: 12.5, fontWeight: 500, lineHeight: 1.35, fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer' }}>
              {o}
            </button>
          ) :
          <div style={{ padding: '10px 9px', color: T.inkFaint, fontSize: 12, lineHeight: 1.4 }}>No matching options</div>}
        </div>, document.body)
      }
    </div>);

}

function WarnBanner({ children }) {
  return (
    <div style={{ background: T.amberLight, border: `1px solid ${T.amberBorder}`, borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={T.amber} strokeWidth="2.2" style={{ flexShrink: 0, marginTop: 1 }}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <div>{children}</div>
    </div>);

}

function StepCard({ number, title, description, aside, children }) {
  return (
    <section style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 12, boxShadow: '0 1px 3px rgba(15,23,42,.06)', overflow: 'visible' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, padding: '15px 16px', background: '#FBFCFE', borderBottom: `1px solid ${T.line}`, borderRadius: '12px 12px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
          <span style={{ width: 27, height: 21, borderRadius: 6, background: T.primary, color: '#fff', fontSize: 10, fontWeight: 800, letterSpacing: '.2px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            {String(number).padStart(2, '0')}
          </span>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 16.5, fontWeight: 700, color: T.ink, lineHeight: 1.25, margin: 0 }}>{title}</h2>
            <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.45, margin: '3px 0 0' }}>{description}</p>
          </div>
        </div>
        {aside && <div style={{ flexShrink: 0 }}>{aside}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
        {children}
      </div>
    </section>);

}

function GroupHeading({ title, helper, aside }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 750, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.7px', lineHeight: 1.2 }}>{title}</div>
        {helper && <div style={{ fontSize: 11.5, color: T.inkFaint, lineHeight: 1.4, marginTop: 3 }}>{helper}</div>}
      </div>
      {aside && <div style={{ flexShrink: 0 }}>{aside}</div>}
    </div>);

}

/* ── Section 1 ──────────────────────────────── */
function S1({ form, set, errors, mode, editData }) {
  return (
    <StepCard number={1} title="Basics & Grouping" description="Define the system identity and operational classification for this Faretype.">
      <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: 10, background: T.fill, padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <GroupHeading title="System identity" helper="Stable identifiers used in pricing, reporting, and downstream systems." />
        <Field label="Faretype Code" required helper="System-wide unique key for database and reporting." error={errors.faretypeCode}>
          <input className="fi" style={iS(errors.faretypeCode)} value={form.faretypeCode}
          onChange={(e) => set('faretypeCode', e.target.value)} placeholder="e.g. CORE-RETAIL-2026" />
        </Field>
        <Field label="Farebasis Code Modifier" helper="Optional modifier appended when a Farebasis is generated.">
          <input className="fi" style={iS()} value={form.fareBasisCode}
          onChange={(e) => set('fareBasisCode', e.target.value)} placeholder="e.g. YFLX" />
        </Field>
      </div>

      <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: 10, background: '#fff', padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <GroupHeading title="Operational classification" helper="Controls ownership, routing, and how this Faretype is found." />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="Faretype Group" required error={errors.faretypeGroup}>
            <Sel ariaLabel="Faretype group" value={form.faretypeGroup} onChange={(v) => set('faretypeGroup', v)} err={errors.faretypeGroup}
            opts={[['', 'Select group…'], ['Core', 'Core'], ['Interline', 'Interline'], ['Brochure', 'Brochure'], ['Non-Refundable', 'Non-Refundable']]} />
          </Field>
          <Field label="Source Channel" required error={errors.source}>
            <Sel ariaLabel="Source channel" value={form.source} onChange={(v) => set('source', v)} err={errors.source}
            opts={[['', 'Select source…'], ['WC', 'WC'], ['Casino', 'Casino'], ['Partner', 'Partner'], ['YM', 'YM']]} />
          </Field>
        </div>
      </div>

      {mode === 'edit' &&
      <div style={{ borderTop: `1px solid ${T.lineSoft}`, paddingTop: 15 }}>
          <Field label="System Faretype ID" helper="Read-only record identifier.">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', border: `1px solid ${T.line}`, borderRadius: 8, background: T.fill, color: T.inkSoft, fontSize: 13, fontFamily: "'SF Mono', Menlo, monospace" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              FT-ID-{10000 + (editData?.id || 1)}
            </div>
          </Field>
        </div>
      }
    </StepCard>);

}

/* ── Section 2 ──────────────────────────────── */
function S2({ form, set, errors, policies }) {
  const assignedPolicies = Number(!!form.cancellationPolicy) + Number(!!form.depositPolicy);
  const permissions = [
    { key: 'standbyEligible', label: 'Standby', helper: 'Waitlist booking' },
    { key: 'upgradeEligible', label: 'Upgrades', helper: 'Cabin changes' },
    { key: 'couponEligible', label: 'Coupons', helper: 'Promo codes' }
  ];
  return (
    <StepCard number={2} title="Policy Assignment" description="Assign payment and refund rules, then choose the optional booking paths available for this Faretype.">
      <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: 10, background: T.fill, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GroupHeading title="Assigned policies" helper="Select one cancellation policy and one deposit policy."
        aside={<span style={{ fontSize: 10.5, fontWeight: 700, color: assignedPolicies === 2 ? T.tealDark : T.inkSoft, background: assignedPolicies === 2 ? T.tealLight : '#fff', border: `1px solid ${assignedPolicies === 2 ? '#A7F3D0' : T.line}`, borderRadius: 999, padding: '3px 8px', whiteSpace: 'nowrap' }}>{assignedPolicies} of 2 assigned</span>} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ border: `1px solid ${errors.cancellationPolicy ? '#FECACA' : T.line}`, borderRadius: 9, background: '#fff', padding: 12 }}>
            <Field label="Cancellation Policy" required helper="Controls refundability and cancellation penalties." error={errors.cancellationPolicy}>
              <Sel ariaLabel="Cancellation policy" value={form.cancellationPolicy} onChange={(v) => set('cancellationPolicy', v)} err={errors.cancellationPolicy}
              opts={polOptsFor(policies, 'cancel', form.cancellationPolicy)} />
            </Field>
          </div>
          <div style={{ border: `1px solid ${errors.depositPolicy ? '#FECACA' : T.line}`, borderRadius: 9, background: '#fff', padding: 12 }}>
            <Field label="Deposit Policy" required helper="Controls deposit timing and payment requirements." error={errors.depositPolicy}>
              <Sel ariaLabel="Deposit policy" value={form.depositPolicy} onChange={(v) => set('depositPolicy', v)} err={errors.depositPolicy}
              opts={polOptsFor(policies, 'deposit', form.depositPolicy)} />
            </Field>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: 2 }}>
        <GroupHeading title="Booking permissions" helper="Optional booking paths enabled for this Faretype." />
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
          {permissions.map(({ key, label, helper }) => {
            const enabled = !!form[key];
            return (
              <div key={key} style={{ minWidth: 0, padding: '11px 12px', border: `1px solid ${enabled ? T.primaryLine : T.line}`, borderRadius: 8, background: enabled ? T.primaryBg : T.fill, transition: 'background .15s, border-color .15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.ink }}>{label}</span>
                  <Toggle on={enabled} onChange={(value) => set(key, value)} label={`${label} booking permission`} />
                </div>
                <div style={{ marginTop: 3, fontSize: 10.5, lineHeight: 1.35, color: T.inkFaint }}>{helper}</div>
              </div>
            );
          })}
        </div>
      </div>
    </StepCard>);

}

/* ── Section 3 ──────────────────────────────── */
function S3({ form, set }) {
  const CHS = [
  { k: 'chMVASB2C', l: 'MVAS B2C' }, { k: 'chMVASB2B', l: 'MVAS B2B' },
  { k: 'chCC', l: 'Cruise Control' }, { k: 'chTradeAPI', l: 'Trade API' },
  { k: 'chCRM', l: 'CRM' }, { k: 'chGroup', l: 'Group' }];

  const vis = CHS.filter((c) => form[c.k]).map((c) => c.l);
  const hid = CHS.filter((c) => !form[c.k]).map((c) => c.l);
  return (
    <StepCard number={3} title="Channel Access" description="Choose where this Faretype is visible and available to book.">
      <div style={{ border: `1px solid ${form.cruiseControlAccess ? T.primaryLine : T.line}`, borderRadius: 10, padding: '13px 14px', background: form.cruiseControlAccess ? T.primaryBg : '#fff' }}>
        <TRow label="Cruise Control access" helper="Show this Faretype in the internal CRM booking workspace." on={form.cruiseControlAccess} onChange={(v) => set('cruiseControlAccess', v)} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <GroupHeading title="Distribution channels" helper="Enable each channel that can display and sell this Faretype."
        aside={<span style={{ fontSize: 10.5, fontWeight: 700, color: T.inkSoft, background: T.fill, border: `1px solid ${T.line}`, borderRadius: 999, padding: '3px 8px' }}>{vis.length} visible</span>} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {CHS.map((c, i) =>
          <div key={c.k} style={{ gridColumn: CHS.length % 2 === 1 && i === CHS.length - 1 ? '1 / -1' : 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '11px 12px', border: `1px solid ${form[c.k] ? T.primaryLine : T.lineSoft}`, borderRadius: 9, background: form[c.k] ? T.primaryBg : '#fff', transition: 'background .15s, border-color .15s' }}>
              <span style={{ fontSize: 12.5, color: T.ink, fontWeight: 600 }}>{c.l}</span>
              <Toggle on={form[c.k]} onChange={(v) => set(c.k, v)} label={c.l} />
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 2 }}>
        <div style={{ padding: '11px 12px', border: `1px solid ${T.primaryLine}`, borderRadius: 9, background: T.primaryBg }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 750, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.6px' }}>Visible</span>
            <strong style={{ fontSize: 13, color: T.primary }}>{vis.length}</strong>
          </div>
          <div style={{ fontSize: 11, color: T.inkSoft, lineHeight: 1.4, marginTop: 5 }}>{vis.length ? vis.join(', ') : 'No channels selected'}</div>
        </div>
        <div style={{ padding: '11px 12px', border: `1px solid ${T.line}`, borderRadius: 9, background: T.fill }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 10, fontWeight: 750, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.6px' }}>Hidden</span>
            <strong style={{ fontSize: 13, color: T.inkSoft }}>{hid.length}</strong>
          </div>
          <div style={{ fontSize: 11, color: T.inkFaint, lineHeight: 1.4, marginTop: 5 }}>{hid.length ? hid.join(', ') : 'Visible everywhere'}</div>
        </div>
      </div>
    </StepCard>);

}

/* ── Section 4 ──────────────────────────────── */
function S4({ form, set }) {
  const partners = ['Virtuoso', 'AMEX Travel', 'Ensemble', 'Signature Travel', 'Travel Leaders', 'Nexion', 'Avoya Travel'];
  const selected = form.channelPartners.length;
  return (
    <StepCard number={4} title="Partner Access" description="Choose which agency partners can access this Faretype through the MVAS B2B channel.">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 12px', borderRadius: 9, background: form.chMVASB2B ? T.primaryBg : T.amberLight, border: `1px solid ${form.chMVASB2B ? T.primaryLine : T.amberBorder}` }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={form.chMVASB2B ? T.inkSoft : T.amberDark} strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="7.5" x2="12" y2="7.6" />
        </svg>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: form.chMVASB2B ? T.ink : T.amberDark }}>{form.chMVASB2B ? 'MVAS B2B is enabled' : 'MVAS B2B is disabled in Step 3'}</div>
          <div style={{ fontSize: 11.5, color: form.chMVASB2B ? T.inkSoft : T.amberDark, lineHeight: 1.45, marginTop: 2 }}>Partner selections are retained and apply whenever the B2B channel is enabled.</div>
        </div>
      </div>

      <div style={{ border: `1px solid ${T.lineSoft}`, borderRadius: 10, background: T.fill, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <GroupHeading title="Partner restrictions" helper="Optional — leave empty to make the B2B channel available to every agency." />
        <Field label="Applicable Channel Partners">
          <MultiChip values={form.channelPartners} onChange={(v) => set('channelPartners', v)} opts={partners} placeholder="Search agencies…" ariaLabel="Search channel partners" />
        </Field>
      </div>

      <div style={{ padding: '11px 12px', border: `1px solid ${T.line}`, borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 750, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.6px' }}>Partner availability</div>
          <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 4 }}>{selected ? `${selected} selected partner${selected === 1 ? '' : 's'}` : 'Available to every agency'}</div>
        </div>
        <span style={{ minWidth: 28, height: 24, padding: '0 7px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: selected ? T.primaryBg : T.fill, border: `1px solid ${selected ? T.primaryLine : T.line}`, color: selected ? T.primary : T.inkSoft, fontSize: 11, fontWeight: 750 }}>{selected || 'All'}</span>
      </div>
    </StepCard>);
}

/* ── Section 5 ──────────────────────────────── */
function S5({ form, set }) {
  const OFFERS = [['', 'None'], ['OFFER-2026-SPRING', 'OFFER-2026-SPRING'], ['OFFER-2026-SUMMER', 'OFFER-2026-SUMMER'], ['OFFER-CASINO-Q2', 'OFFER-CASINO-Q2']];
  const MULTI_OFFERS = OFFERS.filter(([value]) => value).map(([value]) => value);
  const offerRows = [
  ['offerPrimary', '01', 'Primary offer', 'First promotion evaluated for this Faretype.'],
  ['offerSecondary', '02', 'Secondary offer', 'Fallback when the primary offer is unavailable.'],
  ['offerTertiary', '03', 'Tertiary offers', 'Final fallbacks in the offer sequence. Select one or more offers.']];
  return (
    <StepCard number={5} title="Marketing" description="Manage optional guest-facing copy and the prioritized offer sequence.">
      {!form.mktExpanded ?
      <div style={{ border: `1px dashed #CBD5E1`, borderRadius: 10, background: T.fill, padding: '22px 18px', textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, margin: '0 auto 10px', borderRadius: 9, border: `1px solid ${T.line}`, background: '#fff', color: T.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11v2" /><path d="M6 9v6" /><path d="M10 6v12" /><path d="M14 9v6" /><path d="M18 11v2" /></svg>
          </div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>No marketing content configured</div>
          <div style={{ fontSize: 12, color: T.inkFaint, lineHeight: 1.45, maxWidth: 330, margin: '4px auto 13px' }}>Add promotional copy or offers only when this Faretype needs its own marketing treatment.</div>
          <button onClick={() => set('mktExpanded', true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: T.primary, border: `1px solid ${T.primary}`, color: '#fff', fontSize: 12.5, cursor: 'pointer', fontWeight: 650, padding: '8px 12px', borderRadius: 8 }}>
            <span style={{ fontSize: 15, lineHeight: 1 }}>+</span> Add marketing configuration
          </button>
        </div> :

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ border: `1px solid ${form.includeDiscount ? T.primaryLine : T.lineSoft}`, borderRadius: 10, background: form.includeDiscount ? T.primaryBg : T.fill, padding: 14, display: 'flex', flexDirection: 'column', gap: 13 }}>
            <GroupHeading title="Guest-facing message" helper="Add concise promotional copy where the booking channel supports it." />
            <TRow label="Show discount message" helper="Displays promotional copy alongside this Faretype." on={form.includeDiscount} onChange={(v) => set('includeDiscount', v)} />
          {form.includeDiscount &&
            <Field label="Discount Message Copy" helper={`${form.discountMessage.length}/200 characters`}>
                <textarea className="fi" maxLength={200} style={{ ...iS(), minHeight: 86, resize: 'vertical', lineHeight: 1.55 }}
            value={form.discountMessage} onChange={(e) => set('discountMessage', e.target.value)}
            placeholder="e.g. Save 20% on this sailing — limited time offer." />
              </Field>
          }
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <GroupHeading title="Offer priority" helper="Offers are evaluated in sequence. Primary and Secondary accept one offer; Tertiary can include multiple fallbacks." />
            {offerRows.map(([k, num, title, helper]) =>
            <div key={k} style={{ border: `1px solid ${T.line}`, borderRadius: 10, background: '#fff', padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, marginBottom: 11 }}>
                  <span style={{ width: 24, height: 20, borderRadius: 5, background: T.primary, color: '#fff', fontSize: 9.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{num}</span>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, lineHeight: 1.25 }}>{title}</div>
                    <div style={{ fontSize: 11, color: T.inkFaint, lineHeight: 1.35, marginTop: 2 }}>{helper}</div>
                  </div>
                </div>
                <Field label={k === 'offerTertiary' ? 'Offers' : 'Offer'} helper={k === 'offerTertiary' ? 'Leave empty when no tertiary fallback is needed.' : undefined}>
                  {k === 'offerTertiary' ?
                    <MultiChip values={Array.isArray(form[k]) ? form[k] : form[k] ? [form[k]] : []} onChange={(v) => set(k, v)} opts={MULTI_OFFERS} placeholder="Select one or more offers…" ariaLabel="Tertiary offers" /> :
                    <Sel ariaLabel={title} value={form[k]} onChange={(v) => set(k, v)} opts={OFFERS} />}
                </Field>
              </div>
            )}
          </div>

          <button onClick={() => set('mktExpanded', false)}
        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: T.red, fontSize: 12, cursor: 'pointer', fontWeight: 600, padding: '2px 0' }}>
            Remove marketing configuration
          </button>
        </div>
      }
    </StepCard>);

}

/* ── Section 6 ──────────────────────────────── */
function S6({ form, set }) {
  const WAIVERS = [
  { k: 'waiveGovTaxes', l: 'Waive All Government Taxes', w: 'Zeros out all government taxes. Comp/crew only.' },
  { k: 'waiveCruiseExp', l: 'Waive All Cruise Expenses', w: 'Zeros out port fees and cruise expenses. Comp/crew only.' }];

  return (
    <StepCard number={6} title="Taxes & Privacy" description="Configure exceptional financial behavior and fare-display controls.">
      <WarnBanner>
        <div>
          <div style={{ fontSize: 12.5, color: T.amberDark, fontWeight: 700, lineHeight: 1.35 }}>Restricted financial controls</div>
          <div style={{ fontSize: 11.5, color: T.amberDark, lineHeight: 1.45, marginTop: 2 }}>Tax and expense waivers override core calculations. Use them only for approved comp, crew, or promotional fares.</div>
        </div>
      </WarnBanner>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <GroupHeading title="Financial waivers" helper="Both settings default to standard pricing calculations." />
        {WAIVERS.map(({ k, l, w }) =>
        <div key={k} style={{ border: `1px solid ${form[k] ? T.amberBorder : T.line}`, borderRadius: 10, padding: '13px 14px', background: form[k] ? T.amberLight : '#fff', transition: 'border-color .2s, background .2s' }}>
            <TRow label={l} helper={form[k] ? 'Override active' : 'Standard calculation applies'} on={form[k]} onChange={(v) => set(k, v)} />
            {form[k] &&
          <div style={{ marginTop: 10, paddingTop: 9, borderTop: `1px solid ${T.amberBorder}`, fontSize: 11.5, color: T.amberDark, lineHeight: 1.45 }}>{w}</div>
          }
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <GroupHeading title="Fare privacy" helper="Control whether monetary values appear in guest and internal outputs." />
        <div style={{ border: `1px solid ${form.noFareDisplay ? T.primaryLine : T.line}`, borderRadius: 10, padding: '13px 14px', background: form.noFareDisplay ? T.primaryBg : '#fff', transition: 'border-color .2s, background .2s' }}>
          <TRow label="Hide Fare Amounts" helper="Removes fare values from PDFs and Cruise Control views." on={form.noFareDisplay} onChange={(v) => set('noFareDisplay', v)} />
        </div>
      </div>

    </StepCard>);

}

/* ── Section 7 ──────────────────────────────── */
const SUPP_CABIN = ['Interior', 'Ocean View', 'Balcony', 'Suite'];
/* Labels say how the supplement is counted, not just what it is counted against. */
const SUPP_RULE = [['Booking', 'Per booking'], ['Cabin', 'Per cabin'], ['Guest', 'Per guest']];
const SUPP_FPOS = ['Fare Position 1', 'Fare Position 2', 'Fare Position 3', 'Fare Position 4'];
const SUPP_TYPES = [['comp', 'Complementary'], ['paid', 'Paid']];
const SUPP_SAILINGS = ['IS-2026-09-01', 'IS-2026-10-15', 'IS-2026-11-20', 'IS-2026-12-05'];
const typeLabel = (t) => t === 'comp' ? 'Complementary' : 'Paid';
const ruleLabel = (r) => ({ Booking: 'Per booking', Cabin: 'Per cabin', Guest: 'Per guest' })[r] || r;
const suppCabinValues = (supp) => {
  if (Array.isArray(supp?.cabins)) return supp.cabins;
  if (supp?.cabin && !['Any', 'All', 'Any cabin', 'All cabin categories'].includes(supp.cabin)) return [supp.cabin];
  return [];
};
const suppCabinLabel = (supp) => {
  const cabins = suppCabinValues(supp);
  return cabins.length ? cabins.join(', ') : 'All cabin categories';
};

/* Custom rows get a session-unique id so the review diff can track them across renders. */
let suppSeq = 0;
const mkCustomSupp = (type) => ({ ...mkSupp(`sup-custom-${++suppSeq}`, `${typeLabel(type)} Supplement`, type), enabled: true, custom: true });

function SuppBadge({ type, muted }) {
  const comp = type === 'comp';
  return (
    <span style={{ padding: '1.5px 7px', borderRadius: 999, fontSize: 9.5, fontWeight: 700, letterSpacing: '.2px', whiteSpace: 'nowrap', opacity: muted ? .6 : 1, background: comp ? T.tealLight : T.primaryBg, color: comp ? T.tealDark : T.inkSoft }}>
      {comp ? 'Comp' : 'Paid'}
    </span>);

}

/* Recap of what has actually been decided, shown on the collapsed row. Defaults are
   omitted — an unset value is not information, and repeating it for every row is the
   noise the old `—` columns were made of. "All sailings" is the default, so it stays out. */
function suppRecap(s) {
  const n = s.applicableSailings?.length || 0;
  const farePositions = Array.isArray(s.farePos) ? s.farePos.join(', ') : s.farePos;
  return [suppCabinLabel(s), ruleLabel(s.rule), s.maxCount && `Max ${s.maxCount}`, farePositions,
  n ? `${n} sailing${n > 1 ? 's' : ''}` : null].
  filter(Boolean).join(' · ');
}

function SuppDetail({ supp, onUpdate, onAdd }) {
  const s = (k, v) => onUpdate({ ...supp, [k]: v });
  return (
    <div style={{ padding: '14px 13px 15px', background: '#FBFCFE', borderRadius: '0 0 9px 9px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Field label="Supplement Name" required>
        <input className="fi" style={iS()} value={supp.name} onChange={(e) => s('name', e.target.value)} placeholder="e.g. Drinks Package" />
      </Field>
      <Field label="Cabin Categories" helper="Select one or more. Leave empty to include all cabin categories.">
        <MultiChip values={suppCabinValues(supp)} onChange={(v) => s('cabins', v)} opts={SUPP_CABIN}
        placeholder="All cabin categories" ariaLabel="Cabin categories" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(110px, .55fr) minmax(0, 1.25fr)', gap: 12 }}>
        <Field label="Rule" helper="Counting & application method.">
          <Sel ariaLabel="Supplement rule" value={supp.rule} onChange={(v) => s('rule', v)} opts={SUPP_RULE} />
        </Field>
        <Field label="Max Count">
          <input className="fi" type="number" style={iS()} value={supp.maxCount} onChange={(e) => s('maxCount', e.target.value)} placeholder="1" />
        </Field>
        <Field label="Allocation to Fare Positions" helper="Select one or more fare positions.">
          <MultiChip values={Array.isArray(supp.farePos) ? supp.farePos : supp.farePos ? [supp.farePos] : []}
          onChange={(v) => s('farePos', v)} opts={SUPP_FPOS} placeholder="Select fare positions…" ariaLabel="Fare position allocation" />
        </Field>
      </div>
      <Field label="Applicable Sailings" helper="Leave empty to apply to all sailings.">
        <MultiChip values={supp.applicableSailings} onChange={(v) => s('applicableSailings', v)}
        opts={SUPP_SAILINGS} placeholder="Search sailings…" />
      </Field>
      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 2 }}>
        <button type="button" onClick={onAdd}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 34, padding: '7px 12px', borderRadius: 8, border: `1px solid ${T.primary}`, background: T.primary, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background .15s, border-color .15s, color .15s' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add supplement
        </button>
      </div>
    </div>);

}

/* One supplement = one self-contained card. A table would need columns, and the only two
   candidates (cabin, rule) are empty until a row is switched on — and then repeat what the
   form directly beneath already says. So the state lives in the summary line instead. */
function SuppCard({ supp, position, open, onToggleOpen, onUpdate, onSetEnabled, onRemove, onAdd }) {
  const on = supp.enabled;
  const [hover, setHover] = useState(false);
  const incomplete = on && !supp.name;
  const displayName = supp.name || `Configuration ${position}`;
  return (
    <div style={{
      border: `1px solid ${open ? '#CBD5E1' : on ? T.line : '#EAEFF4'}`,
      borderRadius: 10,
      background: on ? '#fff' : '#FBFCFD',
      boxShadow: on ? '0 1px 2px rgba(15,23,42,.04)' : 'none',
      transition: 'border-color .15s, background .15s, box-shadow .15s' }}>

      <div role={on ? 'button' : undefined} tabIndex={on ? 0 : undefined} aria-expanded={on ? open : undefined}
      onClick={() => on && onToggleOpen()}
      onKeyDown={(e) => {if (on && (e.key === 'Enter' || e.key === ' ')) {e.preventDefault();onToggleOpen();}}}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: open ? 'flex-start' : 'center', gap: 7, padding: open ? '10px 11px 9px 9px' : '8px 10px 8px 8px', minHeight: open ? 52 : 42, cursor: on ? 'pointer' : 'default', borderRadius: open ? '9px 9px 0 0' : 9, background: on && hover && !open ? '#FAFCFE' : 'transparent', transition: 'background .15s, padding .15s, min-height .15s' }}>

        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.6" strokeLinecap="round"
        style={{ flexShrink: 0, marginTop: open ? 4 : 0, opacity: on ? 1 : 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .18s, margin-top .15s' }}>
          <polyline points="9 6 15 12 9 18" />
        </svg>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', minWidth: 0 }}>
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12.5, fontWeight: 650, lineHeight: 1.3, color: on ? T.ink : T.inkSoft }}>
              {displayName}
            </span>
          </div>
          {on &&
          <div style={{ marginTop: open ? 3 : 1, fontSize: 11, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {incomplete ?
            <span style={{ color: T.amberDark, fontWeight: 500 }}>Needs configuration</span> :
            <span style={{ color: T.inkSoft, fontWeight: 500 }}>{suppRecap(supp)}</span>}
            </div>
          }
        </div>

        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, marginTop: open ? 1 : 0 }}>
          {supp.custom &&
          <button onClick={onRemove} title="Remove supplement" aria-label={`Remove ${supp.title || 'supplement'}`}
          style={{ width: 22, height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', borderRadius: 5, cursor: 'pointer', color: T.inkFaint, padding: 0, transition: 'background .15s, color .15s' }}
          onMouseEnter={(e) => {e.currentTarget.style.background = T.redLight;e.currentTarget.style.color = T.red;}}
          onMouseLeave={(e) => {e.currentTarget.style.background = 'none';e.currentTarget.style.color = T.inkFaint;}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          }
          <Toggle on={on} onChange={onSetEnabled} label={`${displayName} included`} />
        </div>
      </div>

      {open && on &&
      <div style={{ borderTop: `1px solid ${T.lineSoft}` }}>
          <SuppDetail supp={supp} onUpdate={onUpdate} onAdd={onAdd} />
        </div>
      }
    </div>);

}

function SuppGroup({ type, entries, open, onMark, onUpdate, onSetEnabled, onRemove, onAdd }) {
  const label = typeLabel(type);
  const included = entries.filter(({ supp }) => supp.enabled).length;
  const helper = type === 'comp' ? 'Benefits included at no additional charge.' : 'Chargeable extras added to the booking.';
  return (
    <section aria-label={`${label} supplement configurations`} style={{ border:`1px solid ${T.line}`, borderRadius:10, background:'#fff', boxShadow:'0 1px 2px rgba(15,23,42,.04)', overflow:'visible' }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, padding:'10px 12px', borderRadius:'10px 10px 0 0', borderBottom:`1px solid ${T.line}`, background:T.fill }}>
        <SuppBadge type={type} />
        <div style={{ minWidth:0, flex:1 }}>
          <div style={{ fontSize:12.5, fontWeight:700, color:T.ink }}>{label} Supplement</div>
          <div style={{ marginTop:1, fontSize:10.5, color:T.inkFaint, lineHeight:1.35 }}>{helper}</div>
        </div>
        <span style={{ padding:'2px 7px', borderRadius:999, background:included ? T.tealLight : '#fff', border:`1px solid ${included ? '#D1FAE5' : T.line}`, color:included ? T.tealDark : T.inkFaint, fontSize:9.5, fontWeight:750, whiteSpace:'nowrap' }}>{included} of {entries.length} included</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:6, padding:8, background:'#FBFCFE', borderRadius:'0 0 10px 10px' }}>
        {entries.map(({ supp, index }, position) =>
        <SuppCard key={supp.id} supp={supp} position={position + 1} open={open.has(supp.id)}
        onToggleOpen={() => onMark(supp.id, !open.has(supp.id))}
        onUpdate={(v) => onUpdate(index, v)}
        onSetEnabled={(v) => onSetEnabled(index, v)}
        onAdd={() => onAdd(supp.id, type)}
        onRemove={() => onRemove(supp.id)} />
        )}
      </div>
    </section>);
}

function S7({ form, setForm }) {
  const [open, setOpen] = useState(() => {
    const firstEnabled = form.supp.find((s) => s.enabled);
    return new Set(firstEnabled ? [firstEnabled.id] : []);
  });
  const mark = (id, isOpen) => setOpen(new Set(isOpen ? [id] : []));

  const updSupp = (i, v) => setForm((p) => {const supp = [...p.supp];supp[i] = v;return { ...p, supp };});
  const setEnabled = (i, v) => {
    const id = form.supp[i].id;
    setOpen((p) => v ? new Set([id]) : p.has(id) ? new Set() : new Set(p));
    updSupp(i, { ...form.supp[i], enabled: v });
  };
  const addSuppAfter = (currentId, type) => {
    const nextSupp = mkCustomSupp(type);
    setForm((p) => {
      const supp = [...p.supp];
      const currentIndex = supp.findIndex((item) => item.id === currentId);
      const lastTypeIndex = supp.reduce((last, item, index) => item.type === type ? index : last, -1);
      const insertAt = currentIndex >= 0 ? currentIndex + 1 : lastTypeIndex >= 0 ? lastTypeIndex + 1 : supp.length;
      supp.splice(insertAt, 0, nextSupp);
      return { ...p, supp };
    });
    setOpen(new Set([nextSupp.id]));
  };
  const removeSupp = (id) => {
    setForm((p) => ({ ...p, supp: p.supp.filter((item) => item.id !== id) }));
    setOpen((p) => p.has(id) ? new Set() : new Set(p));
  };
  const activeCount = form.supp.filter((s) => s.enabled).length;
  return (
    <StepCard number={7} title="Supplements" description="Define which extras are included or charged, and how each one is applied."
    aside={<span style={{ fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap', padding: '3px 9px', borderRadius: 999, color: activeCount ? T.tealDark : T.inkFaint, background: activeCount ? T.tealLight : T.fill, border: `1px solid ${activeCount ? '#D1FAE5' : T.line}` }}>{activeCount} of {form.supp.length} included</span>}>

      {/* Guidance shows only while it is actionable, and sits with the control it explains. */}
      {!activeCount && form.supp.length > 0 &&
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '11px 12px', background: T.primaryBg, border: `1px solid ${T.primaryLine}`, borderRadius: 9 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.inkSoft} strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="7.5" x2="12" y2="7.6" />
          </svg>
          <span style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.5 }}>
            No supplements are included. Turn one on to configure its product, cabin scope, application rule, and sailings.
          </span>
        </div>
      }

      {/* Cards, not a table — and no overflow clipping, so the Applicable Sailings dropdown can escape. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <GroupHeading title="Available supplements" helper="Enabled supplements become part of this Faretype configuration." />
        {SUPP_TYPES.map(([type]) =>
        <SuppGroup key={type} type={type}
        entries={form.supp.map((supp, index) => ({ supp, index })).filter(({ supp }) => supp.type === type)}
        open={open} onMark={mark} onUpdate={updSupp} onSetEnabled={setEnabled}
        onAdd={addSuppAfter} onRemove={removeSupp} />
        )}

        {!form.supp.length &&
        <div style={{ padding: '26px 14px', textAlign: 'center', fontSize: 12.5, color: T.inkFaint, background: T.fill, border: `1px solid ${T.line}`, borderRadius: 10, lineHeight: 1.5 }}>
            No supplements defined yet.
          </div>
        }

      </div>
    </StepCard>);

}

/* ── Section 8 · Review Changes ──────────────── */
const FIELD_META = {
  faretypeCode: [1, 'Faretype Code'], fareBasisCode: [1, 'Farebasis Code'], faretypeGroup: [1, 'Faretype Group'], source: [1, 'Source'],
  cancellationPolicy: [2, 'Cancellation Policy'], depositPolicy: [2, 'Deposit Policy'],
  standbyEligible: [2, 'Standby'], upgradeEligible: [2, 'Upgrades'], couponEligible: [2, 'Coupons'],
  cruiseControlAccess: [3, 'Cruise Control Access'], chMVASB2C: [3, 'MVAS B2C'], chMVASB2B: [3, 'MVAS B2B'], chCC: [3, 'Cruise Control'],
  chTradeAPI: [3, 'Trade API'], chCRM: [3, 'CRM'], chGroup: [3, 'Group Desk'],
  channelPartners: [4, 'Partner Access'],
  includeDiscount: [5, 'Include Discount Message'], discountMessage: [5, 'Discount Message'],
  offerPrimary: [5, 'Primary Offer'], offerSecondary: [5, 'Secondary Offer'], offerTertiary: [5, 'Tertiary Offers'],
  waiveGovTaxes: [6, 'Waive Government Taxes'], waiveCruiseExp: [6, 'Waive Cruise Expenses'], noFareDisplay: [6, 'No Fare Display']
};
const SUPP_FIELDS = { enabled: 'Status', title: 'Title', type: 'Type', name: 'Supplement Name', cabin: 'Cabin Category', cabins: 'Cabin Categories', rule: 'Rule', maxCount: 'Max Count', farePos: 'Fare Positions', applicableSailings: 'Applicable Sailings' };

function fmtVal(v) {
  if (v === true) return 'Enabled';
  if (v === false) return 'Disabled';
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'None';
  if (v === '' || v === null || v === undefined) return '—';
  return String(v);
}
const fmtSuppVal = (k, v) => k === 'type' ? typeLabel(v) : k === 'rule' ? ruleLabel(v) : fmtVal(v);
const suppName = (s) => s.name || s.title || 'Untitled supplement';

function diffForm(a, b) {
  const out = [];
  Object.keys(FIELD_META).forEach((k) => {
    const [sec, label] = FIELD_META[k];
    const av = a[k],bv = b[k];
    if (JSON.stringify(av) !== JSON.stringify(bv)) out.push({ sec, label, from: fmtVal(av), to: fmtVal(bv) });
  });
  /* Supplements are matched by id — the list can gain and lose rows. */
  const was = new Map((a.supp || []).map((s) => [s.id, s]));
  (b.supp || []).forEach((s) => {
    const o = was.get(s.id);
    if (!o) {
      out.push({ sec: 7, label: `${suppName(s)} · ${typeLabel(s.type)}`, from: 'Not present', to: 'Added' });
      return;
    }
    Object.keys(SUPP_FIELDS).forEach((k) => {
      if (JSON.stringify(o[k]) !== JSON.stringify(s[k]))
      out.push({ sec: 7, label: `${suppName(s)} · ${SUPP_FIELDS[k]}`, from: fmtSuppVal(k, o[k]), to: fmtSuppVal(k, s[k]) });
    });
  });
  const now = new Set((b.supp || []).map((s) => s.id));
  (a.supp || []).forEach((o) => {
    if (!now.has(o.id)) out.push({ sec: 7, label: `${suppName(o)} · ${typeLabel(o.type)}`, from: 'Present', to: 'Removed' });
  });
  return out;
}

const DEMO_DIFF = [
{ sec: 1, label: 'Faretype Group', from: 'Core', to: 'Non-Refundable' },
{ sec: 2, label: 'Cancellation Policy', from: 'Standard Cancellation', to: 'Non-Refundable' },
{ sec: 3, label: 'Trade API', from: 'Disabled', to: 'Enabled' },
{ sec: 5, label: 'Primary Offer', from: 'None', to: 'OFFER-2026-SPRING' },
{ sec: 7, label: 'Paid Supplement · Status', from: 'Disabled', to: 'Enabled' }];


function ChangeValue({ label, value, after }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 9.5, fontWeight: 750, color: after ? T.primary : T.inkFaint, letterSpacing: '.65px', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      <div style={{ minHeight: 34, display: 'flex', alignItems: 'center', padding: '7px 9px', borderRadius: 7, border: `1px solid ${after ? T.primaryLine : T.line}`, background: after ? T.primaryBg : T.fill, color: after ? T.primary : T.inkSoft, fontSize: 11.5, fontWeight: after ? 650 : 500, lineHeight: 1.35, fontFamily: "'SF Mono', Menlo, monospace", wordBreak: 'break-word' }}>
        {value}
      </div>
    </div>);

}

function DiffRow({ d, first }) {
  return (
    <div style={{ padding: '12px 14px 14px', borderTop: first ? 'none' : `1px solid ${T.lineSoft}` }}>
      <div style={{ fontSize: 12.5, fontWeight: 650, color: T.ink, lineHeight: 1.35 }}>{d.label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 24px minmax(0,1fr)', gap: 7, alignItems: 'end', marginTop: 9 }}>
        <ChangeValue label="Current" value={d.from} />
        <div style={{ width: 24, height: 24, marginBottom: 5, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.primaryBg, border: `1px solid ${T.primaryLine}`, color: T.primary }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="18" y2="12" /><polyline points="13 7 18 12 13 17" /></svg>
        </div>
        <ChangeValue label="After save" value={d.to} after />
      </div>
    </div>);

}

function S8({ diff, demo, farecodes, onNav }) {
  const isPreview = !diff.length;
  const rows = diff.length ? diff : demo;
  const groups = SECTIONS.filter((s) => s.n <= 7).map((s) => ({ ...s, items: rows.filter((r) => r.sec === s.n) })).filter((g) => g.items.length);
  return (
    <StepCard number={8} title="Review Changes" description="Confirm the exact field updates and linked Farecode impact before saving."
    aside={<span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 999, border: `1px solid ${isPreview ? T.amberBorder : T.primaryLine}`, background: isPreview ? T.amberLight : T.primaryBg, color: isPreview ? T.amberDark : T.primary, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{isPreview ? 'Preview data' : `${rows.length} ${rows.length === 1 ? 'update' : 'updates'}`}</span>}>

      {isPreview &&
      <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '10px 12px', background: T.amberLight, border: `1px solid ${T.amberBorder}`, borderRadius: 9 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.amberDark} strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="7.5" x2="12" y2="7.6" /></svg>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.amberDark, marginBottom: 2 }}>Previewing the review layout</div>
            <div style={{ fontSize: 11.5, color: T.amberDark, lineHeight: 1.45 }}>No edits were made in this session, so representative changes are shown below.</div>
          </div>
        </div>
      }

      {/* One review surface keeps section context without fragmenting each change into a separate card. */}
      <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
        <div style={{ padding: '12px 14px', background: T.fill, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>Proposed updates</div>
            <div style={{ fontSize: 11, color: T.inkFaint, lineHeight: 1.4, marginTop: 2 }}>Current and after-save values are shown together for quick verification.</div>
          </div>
          <span style={{ padding: '2px 7px', borderRadius: 999, background: '#fff', border: `1px solid ${T.line}`, color: T.inkSoft, fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>{rows.length} total</span>
        </div>
        {groups.map((g) =>
        <div key={g.n} style={{ borderTop: `1px solid ${T.line}` }}>
            <div style={{ padding: '9px 12px', background: '#FBFCFE', borderBottom: `1px solid ${T.lineSoft}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 23, height: 19, borderRadius: 5, background: T.primary, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>{String(g.n).padStart(2, '0')}</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: T.ink, minWidth: 0 }}>{g.l}</span>
              <span style={{ padding: '1px 6px', borderRadius: 999, background: T.primaryBg, border: `1px solid ${T.primaryLine}`, fontSize: 10, fontWeight: 700, color: T.primary }}>{g.items.length}</span>
              <button onClick={() => onNav?.(g.n)}
              style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: '3px 0', cursor: 'pointer', fontSize: 11, fontWeight: 650, color: T.inkSoft }}
              onMouseEnter={(e) => e.currentTarget.style.color = T.ink}
              onMouseLeave={(e) => e.currentTarget.style.color = T.inkSoft}>
                Edit section
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="18" y2="12" /><polyline points="13 7 18 12 13 17" /></svg>
              </button>
            </div>
            {g.items.map((d, i) => <DiffRow key={i} d={d} first={i === 0} />)}
          </div>
        )}
      </div>

      {!!farecodes?.length &&
      <div style={{ border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
          <div style={{ padding: '11px 13px', background: T.fill, borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{ width: 28, height: 28, borderRadius: 7, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: T.primaryBg, border: `1px solid ${T.primaryLine}`, color: T.primary, flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>Inheritance impact</div>
              <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 1 }}>{farecodes.length} linked {farecodes.length === 1 ? 'Farecode receives' : 'Farecodes receive'} inherited updates.</div>
            </div>
          </div>
          <div style={{ padding: '12px 13px' }}>
            <div style={{ fontSize: 11.5, color: T.inkSoft, lineHeight: 1.5, marginBottom: 10 }}>Inherited values update when you save. Farecode-level overrides remain protected and unchanged.</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {farecodes.map((f) =>
            <span key={f} style={{ padding: '4px 8px', borderRadius: 6, background: T.fill, border: `1px solid ${T.line}`, fontSize: 11, fontFamily: "'SF Mono', Menlo, monospace", color: T.inkSoft }}>{f}</span>
            )}
            </div>
          </div>
        </div>
      }
    </StepCard>);

}

/* ── Section logic ──────────────────────────── */
const SECTIONS = [
{ n: 1, l: 'Basics & Grouping' }, { n: 2, l: 'Policy Assignment' },
{ n: 3, l: 'Channel Access' }, { n: 4, l: 'Partner Access' },
{ n: 5, l: 'Marketing' }, { n: 6, l: 'Taxes & Privacy' },
{ n: 7, l: 'Supplements' }, { n: 8, l: 'Review Changes' }];


function sComplete(n, f, policies) {
  if (n === 1) return !!(f.faretypeCode && f.faretypeGroup && f.source);
  if (n === 2) return isActivePolicy(policies, 'cancel', f.cancellationPolicy) && isActivePolicy(policies, 'deposit', f.depositPolicy);
  return true;
}
function sErr(n, errors) {
  if (n === 1) return !!(errors.faretypeCode || errors.faretypeGroup || errors.source);
  if (n === 2) return !!(errors.cancellationPolicy || errors.depositPolicy);
  return false;
}
function calcCompletion(form, visited, mode, policies) {
  let done = 0;
  if (form.faretypeCode && form.faretypeGroup && form.source) done++;
  if (isActivePolicy(policies, 'cancel', form.cancellationPolicy) && isActivePolicy(policies, 'deposit', form.depositPolicy)) done++;
  if (visited.has(3)) done++;
  if (visited.has(4)) done++;
  if (visited.has(5)) done++;
  if (visited.has(6)) done++;
  if (visited.has(7)) done++;
  if (mode === 'edit' && visited.has(8)) done++;
  const total = mode === 'edit' ? 8 : 7;
  return Math.round(done / total * 100);
}

/* ── Panel Left Nav (new) ───────────────────── */
function PanelNav({ active, onNav, form, errors, visited, pct, sections, policies }) {
  return (
    <div style={{ width: 196, flexShrink: 0, background: T.navFill, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column' }}>
      {/* Nav items */}
      <div style={{ flex: 1, padding: '16px 0 0', overflowY: 'auto' }}>
        {sections.map(({ n, l }) => {
          const isActive = active === n;
          const isDone = !isActive && sComplete(n, form, policies) && (visited.has(n) || n === 1);
          const hasErr = sErr(n, errors);
          const circBg = isActive ? T.primary : isDone ? T.primary : 'transparent';
          const circBd = isActive || isDone ? 'none' : `2px solid ${hasErr ? T.red : '#C8D5E0'}`;
          const numCol = isActive || isDone ? '#fff' : hasErr ? T.red : T.inkFaint;
          const lblCol = isActive ? T.ink : isDone ? T.inkSoft : hasErr ? T.red : T.inkSoft;
          const lblWt = isActive ? 700 : 500;
          return (
            <div key={n} onClick={() => onNav(n)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', position: 'relative', transition: 'background .12s' }}
            onMouseEnter={(e) => {if (!isActive) e.currentTarget.style.background = 'rgba(27,36,52,0.04)';}}
            onMouseLeave={(e) => {if (!isActive) e.currentTarget.style.background = 'transparent';}}>
              {/* Active left bar */}
              {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: T.primary, borderRadius: '0 2px 2px 0' }} />}
              {/* Circle */}
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: circBg, border: circBd, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}>
                {isDone && !hasErr ?
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg> :

                <span style={{ fontSize: 9, fontWeight: 800, color: numCol }}>{String(n).padStart(2, '0')}</span>
                }
              </div>
              {/* Label */}
              <span style={{ fontSize: 12, fontWeight: lblWt, color: lblCol, lineHeight: 1.3 }}>{l}</span>
            </div>);

        })}
      </div>

    </div>);

}

/* ── FaretypePanel v2 ───────────────────────── */
function FaretypePanel({ mode, editData, onClose, onSaveDraft, onActivate, policies }) {
  const buildInit = () => {
    if (mode !== 'edit' || !editData) return DEFAULT_FORM();
    const detail = getDtl(editData.code);
    return {
      ...DEFAULT_FORM(),
      faretypeCode: editData.code,
      fareBasisCode: editData.basis,
      faretypeGroup: editData.group,
      source: editData.source,
      cancellationPolicy: editData.cancellationPolicy || detail.cancellation || '',
      depositPolicy: editData.depositPolicy || detail.deposit || '',
      standbyEligible: editData.standbyEligible ?? detail.standby ?? false,
      upgradeEligible: editData.upgradeEligible ?? detail.upgrade ?? true,
      couponEligible: editData.couponEligible ?? detail.coupon ?? true
    };
  };

  const [form, setForm] = useState(buildInit);
  const initRef = useRef(JSON.stringify(buildInit()));
  const [errors, setErrors] = useState({});
  const [active, setActive] = useState(1);
  const [visited, setVisited] = useState(new Set([1]));
  const [showDiscard, setShowDiscard] = useState(false);
  const [checkedFc] = useState(new Set(['FC-00201', 'FC-00202', 'FC-00203', 'FC-00204', 'FC-00205']));
  const [mounted, setMounted] = useState(false);
  const sections = mode === 'edit' ? SECTIONS : SECTIONS.filter((s) => s.n !== 8);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const onKey = (e) => {if (e.key === 'Escape' && !e.defaultPrevented) handleClose();};
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const navTo = (n) => {
    setActive(n);
    setVisited((prev) => new Set([...prev, n]));
    setErrors({});
  };

  const handleClose = () => {
    const hasChanges = JSON.stringify(form) !== initRef.current;
    if (hasChanges) setShowDiscard(true);else onClose();
  };

  const validateS1 = () => {
    const e = {};
    if (!form.faretypeCode) e.faretypeCode = 'Required';
    if (!form.faretypeGroup) e.faretypeGroup = 'Required';
    if (!form.source) e.source = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const validateS2 = () => {
    const e = {};
    if (!form.cancellationPolicy) e.cancellationPolicy = 'Required';else
    if (!isActivePolicy(policies, 'cancel', form.cancellationPolicy)) e.cancellationPolicy = 'Select an active policy';
    if (!form.depositPolicy) e.depositPolicy = 'Required';else
    if (!isActivePolicy(policies, 'deposit', form.depositPolicy)) e.depositPolicy = 'Select an active policy';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const validateAll = () => {
    const e = {};
    if (!form.faretypeCode) e.faretypeCode = 'Required';
    if (!form.faretypeGroup) e.faretypeGroup = 'Required';
    if (!form.source) e.source = 'Required';
    if (!form.cancellationPolicy) e.cancellationPolicy = 'Required';else
    if (!isActivePolicy(policies, 'cancel', form.cancellationPolicy)) e.cancellationPolicy = 'Select an active policy';
    if (!form.depositPolicy) e.depositPolicy = 'Required';else
    if (!isActivePolicy(policies, 'deposit', form.depositPolicy)) e.depositPolicy = 'Select an active policy';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleNext = () => {
    if (active === 1 && !validateS1()) return;
    if (active === 2 && !validateS2()) return;
    const lastStep = mode === 'edit' ? 8 : 7;
    if (active < lastStep) navTo(active + 1);else
    {
      const valid = validateAll();
      if (valid) onActivate(form);else
      if (!form.faretypeCode || !form.faretypeGroup || !form.source) setActive(1);else
      if (!form.cancellationPolicy || !form.depositPolicy) setActive(2);
    }
  };

  const handleBack = () => {if (active > 1) navTo(active - 1);};

  const pct = calcCompletion(form, visited, mode, policies);
  const isLast = active === (mode === 'edit' ? 8 : 7);
  const allReq = !!(form.faretypeCode && form.faretypeGroup && form.source && isActivePolicy(policies, 'cancel', form.cancellationPolicy) && isActivePolicy(policies, 'deposit', form.depositPolicy));

  const renderSection = () => {
    if (active === 1) return <S1 form={form} set={set} errors={errors} mode={mode} editData={editData} />;
    if (active === 2) return <S2 form={form} set={set} errors={errors} policies={policies} />;
    if (active === 3) return <S3 form={form} set={set} />;
    if (active === 4) return <S4 form={form} set={set} />;
    if (active === 5) return <S5 form={form} set={set} />;
    if (active === 6) return <S6 form={form} set={set} />;
    if (active === 7) return <S7 form={form} setForm={setForm} />;
    if (active === 8) return <S8 diff={diffForm(JSON.parse(initRef.current), form)} demo={DEMO_DIFF} farecodes={mode === 'edit' ? [...checkedFc] : []} onNav={navTo} />;
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.32)', backdropFilter: 'blur(2px)', zIndex: 900, opacity: mounted ? 1 : 0, transition: 'opacity .25s' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 1180, maxWidth: '100%', background: T.panel, zIndex: 901, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,.14)', transform: mounted ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .3s cubic-bezier(.32,0,.67,0)' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px 0', borderBottom: `1px solid ${T.line}`, flexShrink: 0, background: T.panel }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2">
                  {mode === 'create' ? <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></> : <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></>}
                </svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 5 }}>
                  {mode === 'create' ? 'Configure New Faretype Template' : `Edit Faretype · ${editData?.code}`}
                </div>
                <div style={{ fontSize: 12, color: T.inkFaint }}>
                  {mode === 'create' ? 'Define reusable rules inherited by Farecodes.' : 'Update this Faretype template and its inherited rules.'}
                </div>
              </div>
            </div>
            <button onClick={handleClose} aria-label="Close Faretype drawer"
            style={{ width: 32, height: 32, borderRadius: 7, border: `1.5px solid ${T.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkSoft }}
            onMouseEnter={(e) => {e.currentTarget.style.background = T.fill;e.currentTarget.style.color = T.ink;}}
            onMouseLeave={(e) => {e.currentTarget.style.background = '#fff';e.currentTarget.style.color = T.inkSoft;}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <PanelNav active={active} onNav={navTo} form={form} errors={errors} visited={visited} pct={pct} sections={sections} policies={policies} />

          {/* Content */}
          <div className="pscroll" style={{ flex: 1, overflowY: 'auto', padding: '26px 30px 94px', background: T.panel }}>
            {renderSection()}
            <div style={{ height: 6 }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 22px', borderTop: `1px solid ${T.line}`, background: T.panel, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!(mode === 'create' && isLast) &&
            <button onClick={handleBack} disabled={active === 1}
            style={{ padding: '7px 14px', border: `1.5px solid ${T.line}`, borderRadius: 7, background: '#fff', color: active === 1 ? '#CBD5E1' : T.inkSoft, fontSize: 13, cursor: active === 1 ? 'default' : 'pointer', fontWeight: 500 }}>
              Back
            </button>
            }
            <button onClick={handleNext}
            disabled={isLast && mode === 'create' && !allReq}
            title={isLast && !allReq && mode === 'create' ? 'Complete all required fields to activate' : ''}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 15px', background: isLast && mode === 'create' && !allReq ? '#CBD5E1' : T.primary, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: isLast && mode === 'create' && !allReq ? 'not-allowed' : 'pointer', boxShadow: isLast && mode === 'create' && !allReq ? 'none' : '0 1px 4px rgba(27,36,52,.2)', transition: 'opacity .12s' }}
            onMouseEnter={(e) => {if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '.88';}}
            onMouseLeave={(e) => {e.currentTarget.style.opacity = '1';}}>
              {isLast ?
              mode === 'create' ? 'Activate Faretype' : 'Save Changes' :
              'Next Step'}
            </button>
          </div>
        </div>

        {/* Discard modal */}
        {showDiscard &&
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', maxWidth: 360, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Unsaved changes</div>
              <div style={{ fontSize: 14, color: T.inkSoft, marginBottom: 24, lineHeight: 1.6 }}>You have unsaved changes. Discard and close?</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDiscard(false)}
              style={{ padding: '10px 18px', border: `1px solid ${T.line}`, borderRadius: 9, background: '#fff', color: T.ink, fontSize: 13.5, cursor: 'pointer', fontWeight: 500 }}>
                  Keep editing
                </button>
                <button onClick={() => {setShowDiscard(false);onClose();}}
              style={{ padding: '10px 18px', border: 'none', borderRadius: 9, background: T.red, color: '#fff', fontSize: 13.5, cursor: 'pointer', fontWeight: 600 }}>
                  Discard
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </>);

}

/* ── Independent Policy Eligibility template ── */
function PolicyEligibilityReadOnlyValue({ label, value, mono = false }) {
  const shown = value === '' || value === null || value === undefined ? '—' : value;
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 9.5, fontWeight: 800, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.65px' }}>{label}</div>
      <div style={{ marginTop: 5, minHeight: 38, display: 'flex', alignItems: 'center', padding: '9px 11px', border: `1px solid ${T.line}`, borderRadius: 8, background: T.fill, color: T.ink, fontSize: 12.5, fontWeight: 600, fontFamily: mono ? "'SF Mono',Menlo,monospace" : 'inherit', overflowWrap: 'anywhere' }}>{shown}</div>
    </div>
  );
}

function FaretypePolicyEligibilityOverview({ form }) {
  return (
    <section aria-label="Policy Eligibility details" style={{ width: '100%', border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(15,23,42,.05)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 16px', background: T.fill, borderBottom: `1px solid ${T.line}` }}>
        <span style={{ padding: '3px 7px', borderRadius: 5, background: T.primary, color: '#fff', fontSize: 9.5, fontWeight: 800, lineHeight: 1.35 }}>01</span>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.ink, margin: '0 0 3px' }}>Policy Eligibility</h2>
          <p style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.45, margin: 0 }}>Review the guest qualification and booking-window requirements.</p>
        </div>
      </div>
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <GroupHeading title="Guest eligibility" helper="Qualification and booking-window rules applied by this configuration." />
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
            <PolicyEligibilityReadOnlyValue label="Residency" value={form.residency || 'Any'} />
            <PolicyEligibilityReadOnlyValue label="Minimum Age" value={form.minAge !== '' && form.minAge !== undefined ? `${form.minAge}+` : '—'} />
            <PolicyEligibilityReadOnlyValue label="Advanced Purchase" value={form.advancedPurchase ? `${form.advancedPurchase} days` : 'No restriction'} />
            <PolicyEligibilityReadOnlyValue label="Minimum Occupancy" value={form.minOccupancy || '—'} />
            <PolicyEligibilityReadOnlyValue label="Maximum Occupancy" value={form.maxOccupancy || '—'} />
            <PolicyEligibilityReadOnlyValue label="Boarding Pass Endorsement" value={form.boardingPass || '—'} mono />
          </div>
        </div>

      </div>
    </section>
  );
}

function FaretypePolicyEligibilityEditor({ form, set }) {
  return (
    <section aria-label="Edit Policy Eligibility" style={{ width: '100%', border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(15,23,42,.05)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '13px 16px', background: T.fill, borderBottom: `1px solid ${T.line}` }}>
        <span style={{ padding: '3px 7px', borderRadius: 5, background: T.primary, color: '#fff', fontSize: 9.5, fontWeight: 800, lineHeight: 1.35 }}>01</span>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: T.ink, margin: '0 0 3px' }}>Policy Eligibility</h2>
          <p style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.45, margin: 0 }}>Define guest qualification and booking-window requirements.</p>
        </div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <GroupHeading title="Guest eligibility" helper="Qualification and booking-window rules applied by this configuration." />
          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 10 }}>
            <Field label="Residency">
              <Sel ariaLabel="Residency" value={form.residency} onChange={(value) => set('residency', value)}
              opts={[["Any", "Any"], ["US Only", "US Only"], ["Non-US", "Non-US"], ["Canada", "Canada"], ["UK", "UK"]]} />
            </Field>
            <Field label="Minimum Age">
              <input className="fi" type="number" style={iS()} value={form.minAge} min={0} max={99} onChange={(event) => set('minAge', event.target.value)} />
            </Field>
            <Field label="Advanced Purchase">
              <input className="fi" type="number" style={iS()} value={form.advancedPurchase} min={0} onChange={(event) => set('advancedPurchase', event.target.value)} placeholder="No restriction" />
            </Field>
            <Field label="Minimum Occupancy">
              <input className="fi" type="number" style={iS()} value={form.minOccupancy} min={1} onChange={(event) => set('minOccupancy', event.target.value)} placeholder="—" />
            </Field>
            <Field label="Maximum Occupancy">
              <input className="fi" type="number" style={iS()} value={form.maxOccupancy} min={1} onChange={(event) => set('maxOccupancy', event.target.value)} placeholder="—" />
            </Field>
            <Field label="Boarding Pass Endorsement">
              <input className="fi" style={iS()} value={form.boardingPass} onChange={(event) => set('boardingPass', event.target.value)} placeholder="—" />
            </Field>
          </div>
        </div>

      </div>
    </section>
  );
}

function PolicyEligibilityPanel({ mode = 'create', editData, onClose, onActivate, onDelete }) {
  const buildInit = () => editData ? {
    ...DEFAULT_ELIGIBILITY_FORM(),
    ...eligibilityValues(normalizeEligibilityTemplate(editData))
  } : DEFAULT_ELIGIBILITY_FORM();
  const [form, setForm] = useState(buildInit);
  const initRef = useRef(JSON.stringify(buildInit()));
  const [showDiscard, setShowDiscard] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(mode !== 'view');
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleClose = () => {
    if (isEditing && JSON.stringify(form) !== initRef.current) setShowDiscard(true);
    else onClose();
  };
  const cancelEdit = () => {
    setForm(JSON.parse(initRef.current));
    setIsEditing(false);
  };
  const submit = () => onActivate(form);
  const identity = editData ? normalizeEligibilityTemplate(editData) : null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.32)', backdropFilter: 'blur(2px)', zIndex: 900, opacity: mounted ? 1 : 0, transition: 'opacity .25s' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 1180, maxWidth: '100%', background: T.panel, zIndex: 901, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 40px rgba(0,0,0,.14)', transform: mounted ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .3s cubic-bezier(.32,0,.67,0)' }}>
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${T.line}`, flexShrink: 0, background: T.panel }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', minWidth: 0 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M7 3h10a2 2 0 0 1 2 2v14l-7-4-7 4V5a2 2 0 0 1 2-2z" /></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 5 }}>{mode === 'create' ? 'Configure New Policy Eligibility Template' : isEditing ? `Edit Policy Eligibility · ${identity?.code}` : `Policy Eligibility · ${identity?.code}`}</div>
                <div style={{ fontSize: 12, color: T.inkFaint }}>{isEditing ? 'Define a reusable guest-eligibility template.' : `${identity?.name} · Guest qualification and booking-window requirements.`}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {mode === 'view' && !isEditing && <button type="button" onClick={() => setIsEditing(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 13px', border: 'none', borderRadius: 7, background: T.primary, color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', boxShadow: '0 1px 3px rgba(15,23,42,.18)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>
                Edit
              </button>}
              {mode === 'view' && !isEditing && <DeleteIconButton onClick={() => onDelete(editData)} label={`Delete ${editData?.code || 'Policy Eligibility'}`} title="Delete Policy Eligibility" />}
              <button onClick={handleClose} aria-label="Close Policy Eligibility drawer" style={{ width: 32, height: 32, borderRadius: 7, border: `1.5px solid ${T.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkSoft }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="pscroll" style={{ flex: 1, overflowY: 'auto', padding: `26px 30px ${isEditing ? 92 : 26}px`, background: T.panel }}>
          {isEditing
            ? <FaretypePolicyEligibilityEditor form={form} set={set} />
            : <FaretypePolicyEligibilityOverview form={form} />}
        </div>

        {isEditing && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 22px', borderTop: `1px solid ${T.line}`, background: T.panel, display: 'flex', justifyContent: 'flex-end', gap: 9, zIndex: 10 }}>
          {mode === 'view' && <button type="button" onClick={cancelEdit} style={{ padding: '8px 15px', background: '#fff', color: T.inkSoft, border: `1px solid ${T.line}`, borderRadius: 7, fontSize: 13, fontWeight: 650, cursor: 'pointer' }}>Cancel</button>}
          <button onClick={submit} style={{ padding: '8px 16px', background: T.primary, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 650, cursor: 'pointer', boxShadow: '0 1px 4px rgba(27,36,52,.2)' }}>
            {mode === 'create' ? 'Activate Policy Eligibility' : 'Save Changes'}
          </button>
        </div>}

        {showDiscard &&
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
            <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', maxWidth: 360, width: '90%', boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Unsaved changes</div>
              <div style={{ fontSize: 14, color: T.inkSoft, marginBottom: 24, lineHeight: 1.6 }}>Discard this Policy Eligibility configuration?</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDiscard(false)} style={{ padding: '9px 15px', border: `1px solid ${T.line}`, borderRadius: 8, background: '#fff', color: T.ink, cursor: 'pointer' }}>Keep editing</button>
                <button onClick={onClose} style={{ padding: '9px 15px', border: 'none', borderRadius: 8, background: T.red, color: '#fff', cursor: 'pointer', fontWeight: 650 }}>Discard</button>
              </div>
            </div>
          </div>}
      </div>
    </>
  );
}

/* ── List View Components (unchanged) ──────── */
const IcSearch = () =>
<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>;


function TopBar() {
  return (
    <div style={{ gridColumn: '2', gridRow: '1', display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', background: T.panel, borderBottom: `1px solid ${T.line}`, height: '100%', justifyContent: 'space-between' }}>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', border: `1px solid ${T.line}`, borderRadius: 7, background: T.fill, fontSize: 12.5, color: T.inkFaint, minWidth: 260 }}>
        <IcSearch /><span>Search bookings, farecodes…</span>
      </div>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.inkSoft }}>JD</div>
    </div>);

}

function Sidebar() {
  const nav = [
  { id: 'dashboard', label: 'Dashboard', icon: '◉' },
  { id: 'bookings', label: 'Bookings', icon: '☰' },
  { id: 'sailings', label: 'Sailings', icon: '⛴' },
  { id: 'inventory', label: 'Inventory', icon: '▦' },
  { id: 'fares', label: 'Fares & Pricing', icon: '$', open: true, subs: [
    { id: 'faretypes', label: 'Faretypes', active: true },
    { id: 'farecodes', label: 'Farecodes' },
    { id: 'policies', label: 'Policies' }]
  },
  { id: 'supplements', label: 'Supplements', icon: '+' },
  { id: 'channels', label: 'Channels', icon: '⤳' },
  { id: 'reports', label: 'Reports', icon: '▤' },
  { id: 'audit', label: 'History', icon: '◷' }];

  return (
    <div style={{ gridColumn: '1', gridRow: '1 / span 2', background: T.panel, borderRight: `1px solid ${T.line}`, padding: '20px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', marginBottom: 24 }}>
        <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '1.5px', color: T.ink }}>FARECODE</span>
      </div>
      {nav.map((item) =>
      <div key={item.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', margin: '0 8px', borderRadius: 6, fontSize: 12.5, color: item.open ? T.ink : T.inkSoft, background: item.open ? T.fill : 'transparent', fontWeight: item.open ? 600 : 500, cursor: 'pointer' }}>
            <span style={{ width: 14, textAlign: 'center', color: item.open ? T.primary : T.inkFaint, fontSize: 13, flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
          </div>
          {item.subs && item.open &&
        <div style={{ paddingLeft: 38, marginTop: 2, marginBottom: 4 }}>
              {item.subs.map((sub) =>
          <div key={sub.id} style={{ padding: '5px 8px', marginLeft: -10, paddingLeft: 10, fontSize: 12, color: sub.active ? T.ink : T.inkSoft, fontWeight: sub.active ? 600 : 400, borderLeft: sub.active ? `2px solid ${T.primary}` : '2px solid transparent', cursor: 'pointer', borderRadius: '0 4px 4px 0' }}>
                  {sub.label}
                </div>
          )}
            </div>
        }
        </div>
      )}
    </div>);

}

function GroupBadge({ group }) {
  const s = GROUP_S[group] || { bg: T.fill, color: T.inkSoft };
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{group}</span>;
}
function StatusBadge({ status }) {
  const s = STATUS_S[status] || STATUS_S['Inactive'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />{status}
    </span>);

}

/* useDropdown / FilterBtn / SWrap removed — superseded by useListDropdown / FilterPill /
   SelectFilter in ui-list.jsx so every list screen shares one filter control. */

/* MItem / ActionMenu removed — row actions now render through the shared RowMenu
   inside <DataTable/>, at the capped trigger size that keeps rows at 43px. */

const COLS = [
{ key: 'code', label: 'Faretype Code', sort: true, width: '155px' },
{ key: 'basis', label: 'Farebasis Code', sort: true, width: '160px' },
{ key: 'group', label: 'Group', sort: true, width: '155px' },
{ key: 'source', label: 'Source', sort: false, width: '90px' },
{ key: 'fc', label: 'Farecodes', sort: true, width: '115px' },
{ key: 'status', label: 'Status', sort: true, width: '115px' },
{ key: 'mod', label: 'Last Modified', sort: true, width: '145px' }];


/* Thin adapter over the shared <DataTable/> in ui-list.jsx — this module now owns only its
   columns and cell content; all table chrome, density and selection is the shared kit's. */
function FaretypeTable({ rows, selected, onToggleRow, onToggleAll, sortCol, sortDir, onSort, onViewDetail, onDelete }) {
  const cell = (row, key) => {
    if (key === 'code') return <span style={{ fontFamily: "'SF Mono',Menlo,monospace", fontSize: 12.5, fontWeight: 700, color: T.primary }}>{row.code}</span>;
    if (key === 'basis') return <span style={{ fontFamily: "'SF Mono',Menlo,monospace", fontSize: 12, color: T.inkSoft }}>{row.basis}</span>;
    if (key === 'group') return <GroupBadge group={row.group} />;
    if (key === 'source') return <span style={{ color: T.inkSoft }}>{row.source}</span>;
    if (key === 'fc') return row.fc === 0 ?
    <span style={{ color: T.inkFaint }}>—</span> :
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontWeight: 500 }}>{row.fc}</span>
        <a href="#" onClick={(e) => {e.preventDefault();e.stopPropagation();}} style={{ color: T.primary, fontWeight: 500, fontSize: 12.5 }}>View</a>
      </span>;
    if (key === 'status') return <StatusBadge status={row.status} />;
    if (key === 'mod') return <span style={{ color: T.inkSoft, fontSize: 12.5 }}>{row.mod}</span>;
    return null;
  };
  return (
    <DataTable
    cols={COLS} rows={rows} cell={cell}
    sortCol={sortCol} sortDir={sortDir} onSort={onSort}
    onRowClick={onViewDetail}
    rowActions={(row) => [{ label: 'Delete Faretype', icon: <IcTrash size={13}/>, danger: true, onClick: () => onDelete(row) }]}
    emptyTitle="No faretypes match your filters" />);

}

const POLICY_ELIGIBILITY_COLS = [
{ key: 'code', label: 'Template Code', sort: true, width: '130px' },
{ key: 'name', label: 'Template Name', sort: true, width: '240px' },
{ key: 'eligibility', label: 'Guest Eligibility', sort: false, width: '220px' },
{ key: 'status', label: 'Status', sort: true, width: '105px' },
{ key: 'mod', label: 'Last Modified', sort: true, width: '135px' }
];

function PolicyEligibilityTable({ rows, sortCol, sortDir, onSort, onOpen, onDelete }) {
  const cell = (row, key) => {
    if (key === 'code') return <span style={{ fontFamily: "'SF Mono',Menlo,monospace", fontSize: 12.5, fontWeight: 700, color: T.primary }}>{row.code}</span>;
    if (key === 'name') return <span style={{ fontWeight: 650, color: T.ink }}>{row.name}</span>;
    if (key === 'eligibility') return <span style={{ color: T.inkSoft }}>{row.residency} · Age {row.minAge}+</span>;
    if (key === 'status') return <StatusBadge status={row.status} />;
    if (key === 'mod') return <span style={{ color: T.inkSoft, fontSize: 12.5 }}>{row.mod}</span>;
    return null;
  };
  return <DataTable cols={POLICY_ELIGIBILITY_COLS} rows={rows} cell={cell} sortCol={sortCol} sortDir={sortDir} onSort={onSort} onRowClick={onOpen}
    rowActions={(row) => [{ label: 'Delete Policy Eligibility', icon: <IcTrash size={13}/>, danger: true, onClick: () => onDelete(row) }]}
    emptyTitle="No Policy Eligibility templates match your filters" minWidth={820} />;
}

/* ── Faretype Detail Panel ─────────────────── */

const FTYPE_DETAIL = {
  'FT-00101': {
    ftId: '00101', cancellation: 'Standard Cancellation', deposit: '5 Night Standard Deposit',
    residency: 'Any', minAge: 18, minOcc: '—', maxOcc: '—', advPurchase: '—', boardingPass: '—',
    standby: false, upgrade: true, coupon: true,
    channels: [
    { k: 'MVAS B2C', on: true }, { k: 'MVAS B2B', on: true }, { k: 'Cruise Control', on: true },
    { k: 'Trade API', on: false }, { k: 'CRM', on: true }, { k: 'Group', on: false }],

    ccAccess: true, channelPartners: null, mktEmpty: true,
    waiveGov: false, waiveCruise: false, noFareDisplay: false,
    supps: [
    { title: 'Complementary Supplement', type: 'comp', enabled: true, sName: 'Drinks Package', cabin: 'All', rule: 'Booking', max: 1, farePos: ['Fare Position 1'] },
    { title: 'Paid Supplement', type: 'paid', enabled: false }]

  },
  'FT-00102': {
    ftId: '00102', cancellation: 'Non-Refundable', deposit: '5 Night Standard Deposit',
    residency: 'Any', minAge: 18, minOcc: '2', maxOcc: '4', advPurchase: '30', boardingPass: 'NONEND',
    standby: false, upgrade: false, coupon: false,
    channels: [
    { k: 'MVAS B2C', on: true }, { k: 'MVAS B2B', on: false }, { k: 'Cruise Control', on: true },
    { k: 'Trade API', on: true }, { k: 'CRM', on: true }, { k: 'Group', on: false }],

    ccAccess: true, channelPartners: null, mktEmpty: false, discountMsg: 'Save 20% — Non-refundable promo rate. Limited sailings.', offerPrimary: 'OFFER-2026-SPRING',
    waiveGov: false, waiveCruise: false, noFareDisplay: false,
    supps: [
    { title: 'Complementary Supplement', type: 'comp', enabled: false },
    { title: 'Paid Supplement', type: 'paid', enabled: false }]

  }
};

function getDtl(code) {
  return FTYPE_DETAIL[code] || {
    ftId: code.replace('FT-', ''), cancellation: 'Standard Cancellation', deposit: '5 Night Standard Deposit',
    residency: 'Any', minAge: 18, minOcc: '—', maxOcc: '—', advPurchase: '—', boardingPass: '—',
    standby: false, upgrade: true, coupon: true,
    channels: [
    { k: 'MVAS B2C', on: true }, { k: 'MVAS B2B', on: true }, { k: 'Cruise Control', on: true },
    { k: 'Trade API', on: false }, { k: 'CRM', on: true }, { k: 'Group', on: false }],

    ccAccess: true, channelPartners: null, mktEmpty: true,
    waiveGov: false, waiveCruise: false, noFareDisplay: false,
    supps: [
    { title: 'Complementary Supplement', type: 'comp', enabled: false },
    { title: 'Paid Supplement', type: 'paid', enabled: false }]

  };
}

/* ── Detail View Atoms ──────────────────── */
function DLbl({ children }) {
  return <div style={{ fontSize: 9.5, fontWeight: 700, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '.75px', marginBottom: 3, lineHeight: 1 }}>{children}</div>;
}
function LockIc() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0 }}>
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>);
}
function SCard({ num, title, children }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,23,42,.04)' }}>
      <div style={{ padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 9, background: T.fill, borderBottom: `1px solid ${T.lineSoft}` }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#fff', background: T.primary, padding: '3px 7px', borderRadius: 5, letterSpacing: '.3px' }}>{String(num).padStart(2, '0')}</span>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{title}</span>
      </div>
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>);
}
function RField({ label, value, locked, mono }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '.7px' }}>{label}</span>
        {locked && <LockIc />}
      </div>
      <div style={{ padding: '9px 11px', background: '#fff', border: `1px solid ${T.line}`, borderRadius: 7, fontSize: 13, color: T.ink, fontFamily: mono ? "'SF Mono', Menlo, monospace" : 'inherit', minHeight: 36, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value || <span style={{ color: T.inkFaint, fontStyle: 'italic' }}>—</span>}
      </div>
    </div>);
}
function FFlag({ label, on, locked }) {
  return (
    <div style={{ border: `1px solid ${T.line}`, borderRadius: 8, padding: '10px 11px', background: on ? '#F0FDF4' : T.fill, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
        <span style={{ fontSize: 11.5, fontWeight: 600, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
        {locked && <LockIc />}
      </div>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 700, color: on ? T.green : T.inkSoft }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: on ? T.green : T.inkFaint }} />{on ? 'Enabled' : 'Disabled'}
      </span>
    </div>);
}
function DetailOverviewTab({ row, detail }) {
  const vis = detail.channels.filter((c) => c.on).map((c) => c.k);
  const activeSupps = detail.supps.filter((s) => s.enabled);
  const partners = Array.isArray(detail.channelPartners) ? detail.channelPartners : [];
  const b2bEnabled = detail.channels.some((c) => c.k === 'MVAS B2B' && c.on);
  const configuredOffers = [detail.offerPrimary, detail.offerSecondary, ...(Array.isArray(detail.offerTertiary) ? detail.offerTertiary : detail.offerTertiary ? [detail.offerTertiary] : [])].filter(Boolean);
  const bookingPermissions = [
    { label: 'Standby', on: row.standbyEligible ?? detail.standby ?? false },
    { label: 'Upgrades', on: row.upgradeEligible ?? detail.upgrade ?? true },
    { label: 'Coupons', on: row.couponEligible ?? detail.coupon ?? true }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* 01 Basics & Grouping */}
      <SCard num={1} title="Basics & Grouping">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          <RField label="Faretype Code" value={row.code} mono />
          <RField label="Farebasis Code" value={row.basis} mono />
          <RField label="Group" value={row.group} />
          <RField label="Source Channel" value={row.source} />
        </div>
      </SCard>

      {/* 02 Policy Assignment */}
      <SCard num={2} title="Policy Assignment">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <RField label="Cancellation Policy" value={row.cancellationPolicy || detail.cancellation} />
          <RField label="Deposit Policy" value={row.depositPolicy || detail.deposit} />
        </div>
        <div style={{ paddingTop: 2 }}>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: 8 }}>Booking Permissions</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
            {bookingPermissions.map((permission) => <FFlag key={permission.label} label={permission.label} on={permission.on} />)}
          </div>
        </div>
      </SCard>

      {/* 03 Channel Access */}
      <SCard num={3} title="Channel Access">
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 8, background: T.panel, padding: '11px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Cruise Control Access</span>
              <LockIc />
            </div>
            <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 3 }}>Controls visibility in the internal CRM booking workspace.</div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 999, flexShrink: 0, background: detail.ccAccess ? T.greenLight : T.fill, color: detail.ccAccess ? T.green : T.inkSoft, fontSize: 11.5, fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: detail.ccAccess ? T.green : T.inkFaint }} />{detail.ccAccess ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 8, overflow: 'hidden', background: T.panel }}>
          <div style={{ padding: '9px 12px', background: T.fill, borderBottom: `1px solid ${T.lineSoft}`, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.7px' }}>Distribution Channels</span>
            <LockIc />
          </div>
          <div style={{ padding: '11px 12px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.inkSoft, marginBottom: 7 }}>Visible · {vis.length}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {vis.length ? vis.map((c) => <span key={c} style={{ padding: '3px 7px', borderRadius: 5, background: T.primaryBg, border: `1px solid ${T.primaryLine}`, color: T.primary, fontSize: 10.5, fontWeight: 600 }}>{c}</span>) : <span style={{ fontSize: 11.5, color: T.inkFaint }}>None</span>}
            </div>
          </div>
        </div>
      </SCard>

      {/* 04 Partner Access */}
      <SCard num={4} title="Partner Access">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 10 }}>
          <div style={{ border: `1px solid ${T.line}`, borderRadius: 8, padding: '11px 12px', background: T.fill }}>
            <DLbl>MVAS B2B Channel</DLbl>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 12, fontWeight: 700, color: b2bEnabled ? T.green : T.inkSoft }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: b2bEnabled ? T.green : T.inkFaint }} />{b2bEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div style={{ border: `1px solid ${T.line}`, borderRadius: 8, padding: '11px 12px', background: '#fff' }}>
            <DLbl>Partner Availability</DLbl>
            <div style={{ marginTop: 5, fontSize: 12.5, fontWeight: 650, color: T.ink }}>{partners.length ? `${partners.length} selected partner${partners.length === 1 ? '' : 's'}` : 'All agency partners'}</div>
            <div style={{ marginTop: 4, fontSize: 11, color: T.inkSoft, lineHeight: 1.4 }}>{partners.length ? partners.join(', ') : 'No partner-level restrictions are applied.'}</div>
          </div>
        </div>
      </SCard>

      {/* 05 Marketing */}
      <SCard num={5} title="Marketing">
        {detail.mktEmpty ?
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 14px', border: `1px dashed ${T.line}`, borderRadius: 8, background: T.fill }}>
            <div style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${T.line}`, background: '#fff', color: T.inkSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>✦</div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>No Faretype-level marketing configured</div>
              <div style={{ marginTop: 3, fontSize: 11.5, color: T.inkSoft }}>No discount message or prioritized offers are attached to this Faretype.</div>
            </div>
          </div> :
          <>
            <RField label="Guest-facing Message" value={detail.discountMsg || 'No discount message'} />
            <div style={{ paddingTop: 11, borderTop: `1px solid ${T.lineSoft}` }}>
              <DLbl>Offer Priority</DLbl>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
                {configuredOffers.length ? configuredOffers.map((offer, index) =>
                  <span key={`${offer}-${index}`} style={{ padding: '5px 8px', borderRadius: 6, background: T.primaryBg, border: `1px solid ${T.primaryLine}`, color: T.primary, fontFamily: "'SF Mono', Menlo, monospace", fontSize: 10.5, fontWeight: 650 }}>{String(index + 1).padStart(2, '0')} · {offer}</span>
                ) : <span style={{ fontSize: 11.5, color: T.inkFaint }}>No offers configured</span>}
              </div>
            </div>
          </>
        }
      </SCard>

      {/* 06 Taxes & Privacy */}
      <SCard num={6} title="Taxes & Privacy">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
          <FFlag label="Government Tax Waiver" on={detail.waiveGov} locked />
          <FFlag label="Cruise Expense Waiver" on={detail.waiveCruise} locked />
          <FFlag label="Hide Fare Amounts" on={detail.noFareDisplay} locked />
        </div>
      </SCard>

      {/* 07 Supplements */}
      <SCard num={7} title="Supplements">
        {activeSupps.length === 0 ?
          <div style={{ padding: '13px 14px', border: `1px dashed ${T.line}`, borderRadius: 8, background: T.fill }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>No supplements included</div>
            <div style={{ marginTop: 3, fontSize: 11.5, color: T.inkSoft }}>This Faretype has no active complimentary or paid supplement configuration.</div>
          </div> :
          activeSupps.map((s, i) =>
            <div key={i} style={{ border: `1px solid ${T.line}`, borderRadius: 9, overflow: 'hidden', background: T.panel }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 13px', background: T.fill, borderBottom: `1px solid ${T.lineSoft}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: T.ink }}>{s.title}</span>
                  <span style={{ padding: '2px 7px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: s.type === 'comp' ? T.primaryBg : '#fff', border: `1px solid ${s.type === 'comp' ? T.primaryLine : T.line}`, color: s.type === 'comp' ? T.primary : T.inkSoft }}>{s.type === 'comp' ? 'Complimentary' : 'Paid'}</span>
                </div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: T.greenLight, fontSize: 11.5, fontWeight: 700, color: T.green }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />Enabled</span>
              </div>
              <div style={{ padding: '13px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 14 }}>
                  <div><DLbl>Supplement</DLbl><div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginTop: 4 }}>{s.sName || '—'}</div></div>
                  <div><DLbl>Cabin Scope</DLbl><div style={{ fontSize: 13, color: T.inkSoft, marginTop: 4 }}>{suppCabinLabel(s)}</div></div>
                  <div><DLbl>Applied</DLbl><div style={{ fontSize: 13, color: T.inkSoft, marginTop: 4 }}>{s.rule || '—'}</div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.lineSoft}` }}>
                  <div style={{ padding: '8px 10px', borderRadius: 7, background: T.fill, border: `1px solid ${T.lineSoft}` }}><DLbl>Maximum Count</DLbl><div style={{ marginTop: 4, fontSize: 15, fontWeight: 700, color: T.ink }}>{s.max ?? '—'}</div></div>
                  <div style={{ padding: '8px 10px', borderRadius: 7, background: T.fill, border: `1px solid ${T.lineSoft}` }}><DLbl>Fare Positions</DLbl><div style={{ marginTop: 4, fontSize: 15, fontWeight: 700, color: T.ink }}>{Array.isArray(s.farePos) ? s.farePos.join(', ') || '—' : s.farePos ?? '—'}</div></div>
                </div>
              </div>
            </div>
          )}
      </SCard>
    </div>);

}

const FC_SAMPLE = [
{ id: 'FC-20101', ship: 'Island Escape', sailing: 'IS-2026-09-01', cabins: ['Interior', 'Balcony'], status: 'Active', mod: '12 Jun 2026' },
{ id: 'FC-20102', ship: 'Island Escape', sailing: 'IS-2026-10-15', cabins: ['Ocean View'], status: 'Active', mod: '10 Jun 2026' },
{ id: 'FC-20103', ship: 'Island Escape', sailing: 'IS-2026-11-20', cabins: ['Interior', 'Suite'], status: 'Active', mod: '08 Jun 2026' }];

function DetailFarecodesTab({ fcCount }) {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 2px rgba(15,23,42,.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: T.fill, borderBottom: `1px solid ${T.line}` }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: T.ink }}>Linked farecodes</div>
          <div style={{ marginTop: 2, fontSize: 11.5, color: T.inkSoft }}>Showing {FC_SAMPLE.length} of {fcCount}</div>
        </div>
        <button onClick={() => alert('Open add farecode panel')}
        style={{ padding: '7px 12px', border: 'none', borderRadius: 7, background: T.primary,
          color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}>+ Add Farecode</button>
      </div>
      <div className="hscroll" style={{ overflowX: 'auto' }}>
        <table aria-label="Farecodes linked to this Faretype" style={{ width: '100%', minWidth: 820, borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: '#F8FAFC' }}>
              {[
              ['Farecode', '15%'],
              ['Ship', '18%'],
              ['Sailing', '18%'],
              ['Cabin Categories', '22%'],
              ['Status', '11%'],
              ['Last Modified', '12%'],
              ['', '4%']].map(([label, width]) =>
              <th key={label || 'actions'} scope="col" style={{ width, padding: '9px 12px', borderBottom: `1px solid ${T.line}`, color: T.inkSoft, fontSize: 10, fontWeight: 800, letterSpacing: '.055em', textAlign: 'left', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {label}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {FC_SAMPLE.map((fc) =>
            <tr key={fc.id} style={{ borderBottom: `1px solid ${T.lineSoft}` }}>
                <td style={{ padding: '12px', verticalAlign: 'middle' }}>
                  <button onClick={() => alert(`Navigate to farecode: ${fc.id}`)}
                style={{ padding: 0, border: 0, background: 'transparent', color: T.primary, cursor: 'pointer', fontFamily: "'SF Mono',Menlo,monospace", fontSize: 12.5, fontWeight: 800 }}>
                    {fc.id}
                  </button>
                </td>
                <td style={{ padding: '12px', color: T.ink, fontSize: 12.5, verticalAlign: 'middle' }}>{fc.ship}</td>
                <td style={{ padding: '12px', color: T.ink, fontFamily: "'SF Mono',Menlo,monospace", fontSize: 11.5, verticalAlign: 'middle' }}>{fc.sailing}</td>
                <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {fc.cabins.map((c) =>
                  <span key={c} style={{ padding: '3px 7px', border: `1px solid ${T.lineSoft}`, borderRadius: 5, background: T.primaryBg, color: T.primary, fontSize: 10.5, fontWeight: 600, lineHeight: 1.2 }}>{c}</span>
                  )}
                  </div>
                </td>
                <td style={{ padding: '12px', verticalAlign: 'middle' }}><StatusBadge status={fc.status} /></td>
                <td style={{ padding: '12px', color: T.inkSoft, fontSize: 11.5, whiteSpace: 'nowrap', verticalAlign: 'middle' }}>{fc.mod}</td>
                <td style={{ padding: '8px 12px 8px 4px', textAlign: 'right', verticalAlign: 'middle' }}>
                  <button aria-label={`View ${fc.id}`} onClick={() => alert(`Navigate to farecode: ${fc.id}`)}
                style={{ width: 28, height: 28, border: `1px solid ${T.line}`, borderRadius: 6, background: '#fff', color: T.primary, cursor: 'pointer', fontSize: 16, fontWeight: 700, lineHeight: 1 }}>›</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ textAlign: 'center', padding: '10px 0', borderTop: `1px solid ${T.line}`, background: T.fill }}>
        <span style={{ color: T.primary, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}
        onClick={() => alert('View all farecodes for FT-00101')}>
          View all {fcCount} farecodes →
        </span>
      </div>
    </div>);

}

const AUDIT_LOG = [
{ type: 'success', summary: 'Faretype activated', detail: 'Status: Draft → Active', time: '14 Jun 2026, 11:42 AM', user: 'jane.doe@' },
{ type: 'change', summary: 'Cancellation Policy updated', detail: 'Standard → Flexible', time: '12 Jun 2026, 3:15 PM', user: 'jane.doe@' },
{ type: 'change', summary: 'Channels updated', detail: 'Trade API: Disabled → Enabled', time: '10 Jun 2026, 9:08 AM', user: 'admin@' },
{ type: 'change', summary: 'Supplement configured', detail: 'Complementary Supplement enabled', time: '08 Jun 2026, 2:30 PM', user: 'jane.doe@' },
{ type: 'success', summary: 'Faretype created', detail: 'Draft record created', time: '07 Jun 2026, 10:00 AM', user: 'jane.doe@' }];

function DetailAuditTab() {
  return (
    <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 10, boxShadow: '0 1px 2px rgba(15,23,42,.04)', overflow: 'hidden' }}>
      <div style={{ padding: '10px 13px', background: T.fill, borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Activity History</span>
          <span style={{ padding: '2px 7px', borderRadius: 999, background: '#fff', border: `1px solid ${T.line}`, color: T.inkSoft, fontSize: 10.5, fontWeight: 700 }}>{AUDIT_LOG.length}</span>
        </div>
        <span style={{ fontSize: 10.5, color: T.inkFaint }}>Newest first</span>
      </div>
      <div style={{ padding: '2px 0' }}>
        {AUDIT_LOG.map((e, i) => {
          const positive = e.type === 'success';
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0,1fr) auto', gap: 10, padding: '12px 14px', position: 'relative', borderBottom: i < AUDIT_LOG.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                {i < AUDIT_LOG.length - 1 && <span style={{ position: 'absolute', top: 24, bottom: -18, width: 1, background: T.line }} />}
                <span style={{ width: 24, height: 24, borderRadius: '50%', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: positive ? T.greenLight : T.primaryBg, border: `1px solid ${positive ? '#A7F3D0' : T.primaryLine}`, color: positive ? T.green : T.primary, fontSize: 11, fontWeight: 800 }}>{positive ? '✓' : '•'}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, lineHeight: 1.3 }}>{e.summary}</div>
                <span style={{ display: 'inline-flex', marginTop: 6, padding: '4px 7px', borderRadius: 5, background: T.fill, border: `1px solid ${T.lineSoft}`, color: T.inkSoft, fontSize: 11.5, lineHeight: 1.2 }}>{e.detail}</span>
              </div>
              <div style={{ textAlign: 'right', paddingTop: 1, minWidth: 138 }}>
                <div style={{ fontSize: 11, color: T.inkSoft, whiteSpace: 'nowrap' }}>{e.time}</div>
                <span style={{ display: 'inline-flex', marginTop: 6, padding: '2px 6px', borderRadius: 5, background: T.fill, color: T.inkFaint, fontSize: 10.5 }}>{e.user}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>);

}

function FaretypeDetailPanel({ row, onClose, onEdit, onDelete, policies }) {
  const [tab, setTab] = useState('overview');
  const [mounted, setMounted] = useState(false);
  const detail = getDtl(row.code);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const onKey = (e) => {if (e.key === 'Escape') onClose();};
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'farecodes', label: 'Farecodes', badge: row.fc },
  { key: 'audit', label: 'History' }];


  return (
    <>
      {/* Overlay */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 400,
        opacity: mounted ? 1 : 0, transition: 'opacity 220ms ease-out' }} />

      {/* Panel */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 1180, maxWidth: '100%',
        background: '#F1F5F9', zIndex: 401, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 48px rgba(15,23,42,0.2)',
        transform: mounted ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 220ms ease-out' }}>

        {/* ① Sticky header */}
        <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 22px', borderBottom: `1px solid ${T.line}`, flexShrink: 0, background: '#fff' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Faretype Details</span>
          <button onClick={onClose}
          style={{ width: 30, height: 30, borderRadius: 7, background: 'none', border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkFaint }}
          onMouseEnter={(e) => {e.currentTarget.style.background = T.fill;e.currentTarget.style.color = T.ink;}}
          onMouseLeave={(e) => {e.currentTarget.style.background = 'none';e.currentTarget.style.color = T.inkFaint;}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ② Page header strip */}
        <div style={{ background: '#fff', padding: '14px 22px', borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'SF Mono',Menlo,monospace", fontSize: 16, fontWeight: 700, color: T.ink }}>{row.code}</span>
              <StatusBadge status={row.status} />
              <GroupBadge group={row.group} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <button onClick={onEdit}
              style={{ padding: '7px 15px', border: 'none', borderRadius: 7, background: T.primary, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '.88'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Edit
              </button>
              <DeleteIconButton onClick={() => onDelete(row)} label={`Delete ${row.code}`} title="Delete Faretype" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 1, marginTop: 6, fontSize: 11.5, color: T.inkFaint }}>
            <span style={{ fontFamily: "'SF Mono',Menlo,monospace", color: T.inkFaint }}>{row.basis}</span>
            <span style={{ margin: '0 4px' }}>•</span>
            <span>{row.source}</span>
            <span style={{ margin: '0 4px' }}>•</span>
            <span>Modified {row.mod}</span>
            <span style={{ margin: '0 4px' }}>•</span>
            <span>jane.doe@mvas.com</span>
          </div>
        </div>

        {/* ③ Tab bar */}
        <div style={{ display: 'flex', padding: '0 22px', background: '#fff',
          borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          {TABS.map((t) =>
          <button key={t.key} onClick={() => setTab(t.key)}
          style={{ background: 'none', border: 'none', padding: '11px 16px 9px', fontSize: 13,
            fontWeight: tab === t.key ? 600 : 500, color: tab === t.key ? T.ink : T.inkSoft,
            borderBottom: tab === t.key ? `2px solid ${T.primary}` : '2px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'color .15s' }}>
              {t.label}
              {t.badge !== undefined &&
            <span style={{ padding: '1px 7px', borderRadius: 999, fontSize: 11, fontWeight: 600,
              background: tab === t.key ? T.primaryBg : T.fill,
              color: tab === t.key ? T.primary : T.inkFaint }}>{t.badge}</span>
            }
            </button>
          )}
        </div>

        {/* ⑤ Scrollable tab content */}
        <div className="pscroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 28px' }}>
          {tab === 'overview' && <DetailOverviewTab row={row} detail={detail} />}
          {tab === 'farecodes' && <DetailFarecodesTab fcCount={row.fc} />}
          {tab === 'audit' && <DetailAuditTab />}
        </div>
      </div>
    </>);

}

/* ── App ────────────────────────────────────── */
function FaretypeListScreen({ policies, data: controlledData, setData: setControlledData }) {
  const [localData, setLocalData] = useState(INIT_ROWS);
  const data = controlledData || localData;
  const setData = setControlledData || setLocalData;
  const [policyEligibility, setPolicyEligibility] = useState(INIT_POLICY_ELIGIBILITY);
  const [view, setView] = useState('faretype');
  const [search, setSearch] = useState('');
  const [groupF, setGroupF] = useState('All Groups');
  const [sourceF, setSourceF] = useState('All Sources');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState('create');
  const [panelKind, setPanelKind] = useState('faretype');
  const [chooser, setChooser] = useState(false);
  const [editData, setEditData] = useState(null);
  const nextId = useRef(9);
  const nextPolicyEligibilityId = useRef(7);

  const activeData = data.filter((row) => row.status === 'Active');
  const activePolicyEligibility = policyEligibility.filter((row) => row.status === 'Active');
  const sourceRows = view === 'faretype' ? activeData : activePolicyEligibility;
  let rows = sourceRows.filter((r) => {
    const q = search.trim().toLowerCase();
    const searchable = view === 'faretype' ? `${r.code} ${r.basis} ${r.group}` : `${r.code} ${r.name} ${r.residency} ${r.minAge} ${r.advancedPurchase || ''} ${r.boardingPass || ''}`;
    if (q && !searchable.toLowerCase().includes(q)) return false;
    if (view === 'faretype' && groupF !== 'All Groups' && r.group !== groupF) return false;
    if (view === 'faretype' && sourceF !== 'All Sources' && r.source !== sourceF) return false;
    return true;
  });
  if (sortCol) rows = [...rows].sort((a, b) => {
    const av = a[sortCol],bv = b[sortCol];
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const PAGE_SIZE = 10;
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => {
    setPage(1);
    setSearch('');
    setGroupF('All Groups');
    setSourceF('All Sources');
    setSortCol(null);
  }, [view]);
  useEffect(() => setPage(1), [search, groupF, sourceF]);

  const hasFilter = search || view === 'faretype' && (groupF !== 'All Groups' || sourceF !== 'All Sources');
  const handleSort = (col) => {if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');else {setSortCol(col);setSortDir('asc');}};
  const toggleRow = (id) => setSelected((p) => {const n = new Set(p);n.has(id) ? n.delete(id) : n.add(id);return n;});
  const toggleAll = (vr) => {
    const all = vr.every((r) => selected.has(r.id));
    setSelected((p) => {const n = new Set(p);vr.forEach((r) => all ? n.delete(r.id) : n.add(r.id));return n;});
  };
  const openCreate = (kind) => {setPanelKind(kind);setPanelMode('create');setEditData(null);setChooser(false);setPanelOpen(true);};
  const openDetail = (row) => {setPanelKind('faretype');setPanelMode('detail');setEditData(row);setPanelOpen(true);};
  const openPolicyEligibility = (row) => {setPanelKind('policyEligibility');setPanelMode('view');setEditData(row);setPanelOpen(true);};
  const closePanel = () => {setPanelOpen(false);setEditData(null);};
  const deleteFaretype = (row) => {
    if (!window.confirm(`Delete ${row.code}? This action cannot be undone.`)) return;
    setData((previous) => previous.filter((item) => item.id !== row.id));
    setSelected((previous) => { const next = new Set(previous); next.delete(row.id); return next; });
    if (editData?.id === row.id) closePanel();
  };
  const deletePolicyEligibility = (row) => {
    if (!window.confirm(`Delete ${row.code}? This action cannot be undone.`)) return;
    setPolicyEligibility((previous) => previous.filter((item) => item.id !== row.id));
    if (editData?.id === row.id) closePanel();
  };
  const TODAY = '18 Jun 2026';

  const handleSaveDraft = (form) => {
    if (editData) {
      setData((p) => p.map((r) => r.id === editData.id ? { ...r, code: form.faretypeCode, basis: form.fareBasisCode || r.basis, group: form.faretypeGroup || r.group, source: form.source || r.source, cancellationPolicy: form.cancellationPolicy, depositPolicy: form.depositPolicy, standbyEligible: !!form.standbyEligible, upgradeEligible: !!form.upgradeEligible, couponEligible: !!form.couponEligible, status: 'Draft', mod: TODAY } : r));
    } else {
      const id = nextId.current++;
      setData((p) => [...p, { id, code: `FT-${String(id).padStart(5, '0')}`, basis: form.fareBasisCode || '—', group: form.faretypeGroup || 'Core', source: form.source || 'WC', cancellationPolicy: form.cancellationPolicy, depositPolicy: form.depositPolicy, standbyEligible: !!form.standbyEligible, upgradeEligible: !!form.upgradeEligible, couponEligible: !!form.couponEligible, fc: 0, status: 'Draft', mod: TODAY }]);
    }
    closePanel();
  };

  const handleActivate = (form) => {
    if (!form.faretypeCode || !form.faretypeGroup || !form.source || !form.cancellationPolicy || !form.depositPolicy) return;
    if (editData) {
      setData((p) => p.map((r) => r.id === editData.id ? { ...r, code: form.faretypeCode, basis: form.fareBasisCode || r.basis, group: form.faretypeGroup, source: form.source, cancellationPolicy: form.cancellationPolicy, depositPolicy: form.depositPolicy, standbyEligible: !!form.standbyEligible, upgradeEligible: !!form.upgradeEligible, couponEligible: !!form.couponEligible, status: 'Active', mod: TODAY } : r));
    } else {
      const id = nextId.current++;
      setData((p) => [...p, { id, code: `FT-${String(id).padStart(5, '0')}`, basis: form.fareBasisCode || '—', group: form.faretypeGroup, source: form.source, cancellationPolicy: form.cancellationPolicy, depositPolicy: form.depositPolicy, standbyEligible: !!form.standbyEligible, upgradeEligible: !!form.upgradeEligible, couponEligible: !!form.couponEligible, fc: 0, status: 'Active', mod: TODAY }]);
    }
    closePanel();
  };

  const handlePolicyEligibilityActivate = (form) => {
    if (editData) {
      setPolicyEligibility((p) => p.map((r) => r.id === editData.id ? {
        ...eligibilityValues(form),
        id: r.id,
        code: r.code,
        name: r.name,
        status: 'Active',
        mod: TODAY
      } : r));
    } else {
      const id = nextPolicyEligibilityId.current++;
      setPolicyEligibility((p) => [...p, {
        ...eligibilityValues(form),
        id,
        code: `PE-${String(id).padStart(5, '0')}`,
        name: `Guest Eligibility ${String(id).padStart(2, '0')}`,
        status: 'Active',
        mod: TODAY
      }]);
    }
    setView('policyEligibility');
    closePanel();
  };

  return (
    <>
      <div className="pscroll" style={{ gridColumn: 2, gridRow: 2, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 28px 20px', flexShrink: 0 }}>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginBottom: 8, fontWeight: 500 }}>
            <span>FARES &amp; PRICING</span><span style={{ margin: '0 6px' }}>›</span><span style={{ color: T.inkSoft }}>FARETYPES</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, margin: '0 0 5px 0' }}>Faretypes</h1>
              <div style={{ fontSize: 13, color: T.inkSoft }}>Manage Faretype definitions and reusable Policy Eligibility templates.</div>
            </div>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button type="button" aria-haspopup="menu" aria-expanded={chooser} onClick={() => setChooser((p) => !p)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: T.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(27,36,52,.2)' }}>
                + New Template
              </button>
              {chooser && <>
                <div aria-hidden="true" onClick={() => setChooser(false)} style={{ position: 'fixed', inset: 0, zIndex: 300 }} />
                <div role="menu" aria-label="Choose template type" style={{ position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 310, background: '#fff', border: `1px solid ${T.line}`, borderRadius: 10, boxShadow: '0 12px 32px rgba(15,23,42,.14)', zIndex: 400, overflow: 'hidden' }}>
                  <div style={{ padding: '9px 14px', fontSize: 10.5, fontWeight: 750, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.6px', background: T.fill, borderBottom: `1px solid ${T.lineSoft}` }}>Choose a template type</div>
                  <button role="menuitem" onClick={() => openCreate('faretype')} style={{ width: '100%', display: 'flex', gap: 11, alignItems: 'flex-start', padding: '13px 14px', background: '#fff', border: 'none', borderBottom: `1px solid ${T.lineSoft}`, textAlign: 'left', cursor: 'pointer' }}>
                    <span><span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.ink }}>Faretype</span><span style={{ display: 'block', marginTop: 3, fontSize: 11.5, lineHeight: 1.4, color: T.inkFaint }}>Define identity, policies, access, marketing, taxes, and supplements.</span></span>
                  </button>
                  <button role="menuitem" onClick={() => openCreate('policyEligibility')} style={{ width: '100%', display: 'flex', gap: 11, alignItems: 'flex-start', padding: '13px 14px', background: '#fff', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                    <span><span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: T.ink }}>Policy Eligibility</span><span style={{ display: 'block', marginTop: 3, fontSize: 11.5, lineHeight: 1.4, color: T.inkFaint }}>Create reusable guest booking requirements.</span></span>
                  </button>
                </div>
              </>}
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 28px 28px', display: 'flex', flexDirection: 'column' }}>
          <ListCard>
            <div style={{ padding: '14px 16px 0', background: T.fill }}>
              <div role="tablist" aria-label="Faretype template views" style={{ display: 'inline-flex', padding: 3, borderRadius: 9, border: `1px solid ${T.line}`, background: '#EEF2F7', gap: 3 }}>
                {[
                  ['faretype', 'Faretype', activeData.length],
                  ['policyEligibility', 'Policy Eligibility', activePolicyEligibility.length]
                ].map(([key, label, count]) => {
                  const activeView = view === key;
                  return <button key={key} role="tab" aria-selected={activeView} onClick={() => setView(key)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, minHeight: 32, padding: '6px 12px', borderRadius: 7, border: activeView ? `1px solid ${T.primary}` : '1px solid transparent', background: activeView ? T.primary : 'transparent', color: activeView ? '#fff' : T.inkSoft, fontSize: 12.5, fontWeight: activeView ? 700 : 600, cursor: 'pointer' }}>
                    {label}<span style={{ minWidth: 20, padding: '1px 6px', borderRadius: 999, background: activeView ? 'rgba(255,255,255,.16)' : '#fff', color: activeView ? '#fff' : T.inkFaint, fontSize: 10.5, fontWeight: 750 }}>{count}</span>
                  </button>;
                })}
              </div>
            </div>
            <ListToolbar>
              <FilterRow>
                <ListSearch value={search} onChange={setSearch} placeholder={view === 'faretype' ? 'Filter by code, basis, group name…' : 'Filter by template code, name, or guest rule…'} />
                {view === 'faretype' && <SelectFilter value={groupF} onChange={setGroupF} options={['All Groups', 'Core', 'Interline', 'Brochure', 'Non-Refundable']} />}
                {view === 'faretype' && <SelectFilter value={sourceF} onChange={setSourceF} options={['All Sources', 'WC', 'Casino', 'Partner', 'YM']} />}
                {hasFilter && <ClearFilters onClick={() => {setSearch('');setGroupF('All Groups');setSourceF('All Sources');}} />}
                <ResultCount>{rows.length} of {sourceRows.length} {view === 'faretype' ? 'faretypes' : 'Policy Eligibility templates'}</ResultCount>
              </FilterRow>
            </ListToolbar>

            {view === 'faretype' ?
              <FaretypeTable rows={pageRows} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} onViewDetail={openDetail} onDelete={deleteFaretype} /> :
              <PolicyEligibilityTable rows={pageRows} sortCol={sortCol} sortDir={sortDir} onSort={handleSort} onOpen={openPolicyEligibility} onDelete={deletePolicyEligibility} />}

            <ListPager page={page} setPage={setPage} total={rows.length} pageSize={PAGE_SIZE} noun={view === 'faretype' ? 'faretypes' : 'Policy Eligibility templates'} />
          </ListCard>
        </div>
      </div>

      {panelOpen && panelKind === 'faretype' && panelMode === 'detail' &&
      <FaretypeDetailPanel
        row={editData}
        onClose={closePanel}
        onEdit={() => setPanelMode('edit')}
        onDelete={deleteFaretype}
        policies={policies} />

      }
      {panelOpen && panelKind === 'faretype' && panelMode !== 'detail' &&
      <FaretypePanel mode={panelMode} editData={editData} policies={policies} onClose={closePanel} onSaveDraft={handleSaveDraft} onActivate={handleActivate} />
      }

      {panelOpen && panelKind === 'policyEligibility' &&
      <PolicyEligibilityPanel mode={panelMode} editData={editData} onClose={closePanel} onActivate={handlePolicyEligibilityActivate} onDelete={deletePolicyEligibility} />
      }
    </>);

}


Object.assign(window, { FaretypeListScreen, FARETYPE_INITIAL_ROWS: INIT_ROWS });
})();
