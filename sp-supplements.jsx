// sp-supplements.jsx — Supplements module (ported from the "Supplements Detail Panel" design).
// List + slide-over panel with Overview / History tabs and a view↔edit toggle.
// Wrapped in an IIFE: it defines its own T / iS / Field / Sel / SectionHead / SCard / DRow /
// StatusBadge / TypeBadge, all of which collide with dc-shell.jsx and ft-faretype.jsx globals.
// List chrome (card, toolbar, table, pager) comes from the shared kit in ui-list.jsx.
(function () {

const { useState, useRef, useEffect } = React;

/* ── Tokens ─────────────────────────────────── */
const T = {
  ink: '#0F172A', inkSoft: '#475569', inkFaint: '#94A3B8', inkLabel: '#64748B',
  bg: '#F1F5F9', panel: '#FFFFFF', fill: '#F8FAFC',
  line: '#E2E8F0', lineSoft: '#EEF2F6', primary: '#1B2434', primaryBg: '#EEF2F6',
  teal: '#10B981', tealDark: '#059669', tealLight: '#ECFDF5',
  amber: '#F59E0B', amberDark: '#D97706', amberLight: '#FFFBEB',
  red: '#DC2626', redLight: '#FEF2F2'
};

const MONO = "'SF Mono', Menlo, monospace";
const PAGE = 10;

/* ── Reference data ─────────────────────────── */
const TYPES = ['Drinks Package', 'Spa Package', 'Casino Credit', 'Onboard Credit', 'Photo Package', 'Beverage Package', 'Wi-Fi Package', 'Excursion Package'];
const TYPE_S = {
  'Drinks Package': { bg: '#EEF2FF', color: '#3730A3' },
  'Spa Package': { bg: '#ECFEFF', color: '#0E7490' },
  'Casino Credit': { bg: '#FFFBEB', color: '#92400E' },
  'Onboard Credit': { bg: '#F0FDF4', color: '#166534' },
  'Photo Package': { bg: '#FDF4FF', color: '#7E22CE' },
  'Beverage Package': { bg: '#EEF2FF', color: '#3730A3' },
  'Wi-Fi Package': { bg: '#F0F9FF', color: '#0369A1' },
  'Excursion Package': { bg: '#FFF7ED', color: '#C2410C' }
};
const CABIN_OPTS = ['Interior', 'Balcony', 'Ocean View', 'Suite', 'Penthouse'];
const CABIN_S = {
  'Interior': { bg: '#EEF2FF', color: '#3730A3' },
  'Ocean View': { bg: '#ECFEFF', color: '#0E7490' },
  'Balcony': { bg: '#F0FDF4', color: '#166534' },
  'Suite': { bg: '#FDF4FF', color: '#7E22CE' },
  'Penthouse': { bg: '#FFF1F2', color: '#9F1239' }
};
const SP_STATUS_S = {
  'Active': { bg: '#ECFDF5', color: '#065F46', dot: '#10B981' },
  'Draft': { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B' },
  'Inactive': { bg: '#F8FAFC', color: '#475569', dot: '#94A3B8' }
};

const TODAY = '18 Jun 2026';

const INIT_DATA = [
{ id: 1, code: 'SUP-00001', name: 'Premium Beverage Package', type: 'Drinks Package', price: 249.00, cabins: ['All'], status: 'Active', mod: '14 Jun 2026',
  description: 'Unlimited beverages at all bars and lounges. Includes premium spirits, cocktails, wine by the glass, and soft drinks.',
  effFrom: '', effTo: '', editor: 'jane.doe@mvas.com', usedIn: 3 },
{ id: 2, code: 'SUP-00002', name: 'Spa Wellness Package', type: 'Spa Package', price: 499.00, cabins: ['Balcony', 'Suite'], status: 'Active', mod: '12 Jun 2026',
  description: 'Two spa treatments per guest plus unlimited access to the thermal suite for the length of the sailing.',
  effFrom: '01 Jul 2026', effTo: '30 Sep 2026', editor: 'jane.doe@mvas.com', usedIn: 1 },
{ id: 3, code: 'SUP-00003', name: 'Casino Credit Package', type: 'Casino Credit', price: 100.00, cabins: ['All'], status: 'Active', mod: '10 Jun 2026',
  description: 'On-board casino credit added directly to the guest folio at embarkation.',
  effFrom: '', effTo: '', editor: 'admin@mvas.com', usedIn: 0 },
{ id: 4, code: 'SUP-00004', name: 'Onboard Photo Package', type: 'Photo Package', price: 79.99, cabins: ['All'], status: 'Inactive', mod: '08 Jun 2026',
  description: 'Digital download of all professional photos taken during the cruise, plus one printed 8x10.',
  effFrom: '', effTo: '', editor: 'jane.doe@mvas.com', usedIn: 0 },
{ id: 5, code: 'SUP-00005', name: 'Wi-Fi Connectivity Package', type: 'Wi-Fi Package', price: 15.00, cabins: ['All'], status: 'Draft', mod: '06 Jun 2026',
  description: 'One device, unlimited data, valid for the full length of the sailing.',
  effFrom: '', effTo: '', editor: 'jane.doe@mvas.com', usedIn: 0 }];


const HISTORY_BY_STATUS = {
  Active: [
  { color: '#10B981', event: 'Supplement activated', detail: 'Status: Draft → Active', ts: '14 Jun 2026, 11:42 AM', editor: 'jane.doe@mvas.com' },
  { color: '#F59E0B', event: 'Cabin applicability updated', detail: 'Added Suite to applicable cabins', ts: '12 Jun 2026, 03:15 PM', editor: 'jane.doe@mvas.com' },
  { color: '#F59E0B', event: 'Price updated', detail: 'Base Price: $199.00 → $249.00', ts: '10 Jun 2026, 09:08 AM', editor: 'admin@mvas.com' },
  { color: '#10B981', event: 'Supplement created', detail: 'Draft record created', ts: '08 Jun 2026, 02:30 PM', editor: 'jane.doe@mvas.com' }],

  Inactive: [
  { color: '#DC2626', event: 'Supplement deactivated', detail: 'Status: Active → Inactive', ts: '08 Jun 2026, 04:00 PM', editor: 'admin@mvas.com' },
  { color: '#10B981', event: 'Supplement activated', detail: 'Status: Draft → Active', ts: '01 Jun 2026, 10:12 AM', editor: 'jane.doe@mvas.com' },
  { color: '#10B981', event: 'Supplement created', detail: 'Draft record created', ts: '30 May 2026, 01:45 PM', editor: 'jane.doe@mvas.com' }],

  Draft: [
  { color: '#10B981', event: 'Supplement created', detail: 'Draft record created', ts: '06 Jun 2026, 08:20 AM', editor: 'jane.doe@mvas.com' }]

};

/* ── Money helpers ──────────────────────────── */
const fmtMoney = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
const parseCur = (v) => parseFloat(String(v || '').replace(/[^0-9.]/g, '')) || 0;

/* ── Badges ─────────────────────────────────── */
function SpStatusBadge({ status }) {
  const s = SP_STATUS_S[status] || SP_STATUS_S.Inactive;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
      {status}
    </span>);

}
function TypeBadge({ type }) {
  const s = TYPE_S[type] || { bg: T.fill, color: T.inkSoft };
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{type}</span>;
}
function CabinChip({ cat }) {
  if (cat === 'All') return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, fontSize: 11.5, fontWeight: 500, background: T.fill, color: T.inkSoft, whiteSpace: 'nowrap' }}>All Cabins</span>;
  const s = CABIN_S[cat] || { bg: T.fill, color: T.inkSoft };
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, fontSize: 11.5, fontWeight: 500, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{cat}</span>;
}
function CabinsCell({ cabins }) {
  if (cabins.includes('All')) return <CabinChip cat="All" />;
  const shown = cabins.slice(0, 2),rest = cabins.length - 2;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
      {shown.map((c) => <CabinChip key={c} cat={c} />)}
      {rest > 0 && <span style={{ fontSize: 11.5, color: T.inkFaint, padding: '2px 7px', borderRadius: 999, background: T.fill, whiteSpace: 'nowrap' }}>+{rest}</span>}
    </div>);

}

/* ── Multi-select filter ─────────────────────
   The shared kit only ships a single-select SelectFilter, so this adds the multi-select
   variant the design needs — reusing the kit's pill, popover and dropdown hook so it
   sits flush with the Faretype/Farecode toolbars. */
function MultiFilter({ label, opts, selected, onChange, hint, chips }) {
  const [open, setOpen, ref] = useListDropdown();
  const toggle = (o) => onChange(selected.includes(o) ? selected.filter((x) => x !== o) : [...selected, o]);
  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <FilterPill label={label} active={selected.length > 0} open={open} onClick={() => setOpen((p) => !p)} />
      {open &&
      <div className="pscroll" style={{ ...listPopover, left: 0, right: 'auto', minWidth: 230, maxHeight: 320, overflowY: 'auto' }}>
          <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.lineSoft}`, position: 'sticky', top: 0, background: T.panel }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.6px' }}>{hint ? label : label}</div>
            {hint && <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 3 }}>{hint}</div>}
          </div>
          {opts.map((o) => {
          const on = selected.includes(o);
          const s = chips ? CABIN_S[o] || { bg: T.fill, color: T.inkSoft } : null;
          return (
            <label key={o} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', fontSize: 13, color: T.ink }}
            onMouseEnter={(e) => e.currentTarget.style.background = T.fill}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                <input type="checkbox" checked={on} onChange={() => toggle(o)} style={{ accentColor: T.primary, width: 14, height: 14, cursor: 'pointer', flexShrink: 0 }} />
                {chips ?
              <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: s.bg, color: s.color }}>{o}</span> :
              o}
              </label>);

        })}
          {selected.length > 0 &&
        <div style={{ borderTop: `1px solid ${T.lineSoft}`, padding: '7px 14px', position: 'sticky', bottom: 0, background: T.panel }}>
              <button onClick={() => {onChange([]);setOpen(false);}} style={{ background: 'none', border: 'none', fontSize: 12, color: T.primary, cursor: 'pointer', fontWeight: 600, padding: 0 }}>Clear selection</button>
            </div>
        }
        </div>
      }
    </div>);

}

/* ── Form primitives ────────────────────────── */
function iS(err, dis) {
  return { width: '100%', padding: '9px 12px', border: `1.5px solid ${err ? T.red : dis ? '#E8EDF3' : '#D8DFE8'}`, borderRadius: 7, fontSize: 13, color: dis ? T.inkFaint : T.ink, background: dis ? '#F3F4F6' : '#fff', outline: 'none', cursor: dis ? 'not-allowed' : undefined };
}
function Field({ label, required, helper, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 10.5, fontWeight: 700, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.65px' }}>{label}{required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}</label>}
      {children}
      {error && <span style={{ fontSize: 11, color: T.red }}>{error}</span>}
      {!error && helper && <span style={{ fontSize: 11, color: T.inkFaint, lineHeight: 1.4 }}>{helper}</span>}
    </div>);

}
function Sel({ value, onChange, opts, err }) {
  return (
    <div style={{ position: 'relative' }}>
      <select className="fi" value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...iS(err), appearance: 'none', cursor: 'pointer', paddingRight: 30, color: value ? T.ink : T.inkFaint }}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l !== undefined ? l : v}</option>)}
      </select>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.5" style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
    </div>);

}
function SectionHead({ title, helper }) {
  return (
    <div>
      <h2 style={{ fontSize: 16.5, fontWeight: 700, color: T.ink, marginBottom: 4 }}>{title}</h2>
      {helper && <p style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.5 }}>{helper}</p>}
    </div>);

}
function SCard({ title, children }) {
  return (
    <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,.04)' }}>
      <div style={{ padding: '11px 16px', borderBottom: `1px solid ${T.line}`, background: '#FAFBFC' }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.65px' }}>{title}</span>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>);

}
function DRow({ label, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
      <span style={{ width: 150, flexShrink: 0, fontSize: 12, fontWeight: 500, color: T.inkSoft, paddingTop: 2 }}>{label}</span>
      <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.55 }}>{children}</div>
    </div>);

}

const IcCheckSm = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IcEditSm = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
const IcXSm = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;

/* ── Panel sections ─────────────────────────── */
const DEFAULT_FORM = () => ({ code: '', name: '', type: '', description: '', price: '', cabins: ['All'], status: 'Active', effFrom: '', effTo: '' });

function S1({ form, set, errors, mode }) {
  const locked = mode === 'view';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHead title="Basics" helper="Core identity of the supplement — how it's identified internally and shown to guests." />
      <Field label="Supplement Code" error={errors.code}
      helper={locked ? 'Locked once created.' : 'Unique identifier. Leave blank to auto-generate.'}>
        {locked ?
        <div style={{ ...iS(false, true), display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontWeight: 700 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            {form.code}
          </div> :

        <input className="fi" style={{ ...iS(errors.code), fontFamily: MONO }} value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="e.g. SUP-00006 (auto-generated if blank)" />
        }
      </Field>
      <Field label="Name" required error={errors.name} helper="Display name shown to guests.">
        <input className="fi" style={iS(errors.name)} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Premium Beverage Package" />
      </Field>
      <Field label="Type" required error={errors.type}>
        <Sel value={form.type} onChange={(v) => set('type', v)} err={errors.type} opts={[['', 'Select type…'], ...TYPES.map((t) => [t, t])]} />
      </Field>
      <Field label="Description" helper={`${(form.description || '').length} / 300`}>
        <textarea className="fi" style={{ ...iS(), minHeight: 78, resize: 'vertical', lineHeight: 1.6 }} maxLength={300}
        value={form.description} onChange={(e) => set('description', e.target.value)}
        placeholder="What's included in this package? Keep it concise for guest-facing copy." />
      </Field>
    </div>);

}

function S2({ form, set, errors }) {
  const allCabins = form.cabins.includes('All');
  const toggleAll = () => set('cabins', allCabins ? [] : ['All']);
  const toggleCabin = (cat) => {
    if (allCabins) return;
    set('cabins', form.cabins.includes(cat) ? form.cabins.filter((c) => c !== cat) : [...form.cabins, cat]);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHead title="Pricing & Applicability" helper="Flat price per person per cruise, and which cabin categories may purchase it." />
      <Field label="Base Price" required error={errors.price} helper="Price per person per cruise. Agents can override per booking.">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: T.inkFaint, pointerEvents: 'none' }}>$</span>
          <input className="fi" style={{ ...iS(errors.price), paddingLeft: 24 }} value={form.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" />
        </div>
      </Field>
      <Field label="Applicable Cabin Categories" required error={errors.cabins} helper="Choose “All Cabins” for universal availability.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: `1.5px solid ${allCabins ? T.primary : '#E8EDF3'}`, borderRadius: 8, cursor: 'pointer', background: allCabins ? T.primaryBg : '#fff' }}>
            <input type="checkbox" checked={allCabins} onChange={toggleAll} style={{ accentColor: T.primary, width: 14, height: 14, cursor: 'pointer' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>All Cabins</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {CABIN_OPTS.map((cat) => {
              const on = form.cabins.includes(cat);
              return (
                <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: `1.5px solid ${on ? '#A7F3D0' : '#E8EDF3'}`, borderRadius: 8, cursor: allCabins ? 'not-allowed' : 'pointer', background: allCabins ? '#F8FAFC' : '#fff', opacity: allCabins ? .55 : 1 }}>
                  <input type="checkbox" checked={on} disabled={allCabins} onChange={() => toggleCabin(cat)} style={{ accentColor: T.primary, width: 14, height: 14, cursor: allCabins ? 'not-allowed' : 'pointer' }} />
                  <span style={{ fontSize: 13, color: T.ink }}>{cat}</span>
                </label>);

            })}
          </div>
        </div>
      </Field>
      <Field label="Status">
        <Sel value={form.status} onChange={(v) => set('status', v)} opts={[['Active', 'Active'], ['Inactive', 'Inactive']]} />
      </Field>
    </div>);

}

function S3({ form, set, errors }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionHead title="Availability" helper="Optional sailing date window during which this supplement can be purchased." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Effective From" helper="Start date (optional).">
          <input className="fi" style={iS()} value={form.effFrom} onChange={(e) => set('effFrom', e.target.value)} placeholder="e.g. 14 Jun 2026" />
        </Field>
        <Field label="Effective To" error={errors.dates} helper="End date (optional).">
          <input className="fi" style={iS(errors.dates)} value={form.effTo} onChange={(e) => set('effTo', e.target.value)} placeholder="e.g. 30 Sep 2026" />
        </Field>
      </div>
    </div>);

}

function OverviewReadOnly({ form }) {
  const none = (t) => <span style={{ color: T.inkFaint, fontStyle: 'italic' }}>{t}</span>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SCard title="Basics">
        <DRow label="Code"><span style={{ fontFamily: MONO, fontWeight: 700 }}>{form.code}</span></DRow>
        <DRow label="Name">{form.name}</DRow>
        <DRow label="Type"><TypeBadge type={form.type} /></DRow>
        <DRow label="Description">{form.description || none('No description')}</DRow>
      </SCard>
      <SCard title="Pricing & Applicability">
        <DRow label="Base Price"><span style={{ fontFamily: MONO, fontWeight: 700 }}>{fmtMoney(parseCur(form.price))}</span></DRow>
        <DRow label="Applicable Cabins">
          {form.cabins.includes('All') ? <CabinChip cat="All" /> :
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>{form.cabins.map((c) => <CabinChip key={c} cat={c} />)}</div>}
        </DRow>
        <DRow label="Status"><SpStatusBadge status={form.status} /></DRow>
      </SCard>
      <SCard title="Availability">
        <DRow label="Effective From">{form.effFrom || none('No start date')}</DRow>
        <DRow label="Effective To">{form.effTo || none('No end date')}</DRow>
      </SCard>
    </div>);

}

function HistoryTab({ status }) {
  const log = HISTORY_BY_STATUS[status] || HISTORY_BY_STATUS.Draft;
  return (
    <div style={{ background: '#fff', border: `1px solid ${T.line}`, borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,.04)' }}>
      {log.map((e, i) =>
      <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 18px', borderBottom: i < log.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
          <div style={{ paddingTop: 5, flexShrink: 0 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color }} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 2 }}>{e.event}</div>
            <div style={{ fontSize: 12, color: T.inkSoft }}>{e.detail}</div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 11.5, color: T.inkSoft, whiteSpace: 'nowrap' }}>{e.ts}</div>
            <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>{e.editor}</div>
          </div>
        </div>
      )}
    </div>);

}

/* ── Slide-over panel ───────────────────────── */
function SupplementPanel({ mode, viewRow, initialEdit, onClose, onSaveDraft, onActivate, onSaveChanges, onToggleStatus, onDelete }) {
  const buildForm = () => mode === 'view' && viewRow ?
  { code: viewRow.code, name: viewRow.name, type: viewRow.type, description: viewRow.description || '', price: String(viewRow.price), cabins: viewRow.cabins, status: viewRow.status === 'Draft' ? 'Active' : viewRow.status, effFrom: viewRow.effFrom || '', effTo: viewRow.effTo || '' } :
  DEFAULT_FORM();

  const [isEditing, setIsEditing] = useState(mode === 'create' || !!initialEdit);
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState(buildForm);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);
  const [discardCb, setDiscardCb] = useState(null);
  const [mounted, setMounted] = useState(false);
  const snapRef = useRef(null);
  const formRef = useRef(form);
  formRef.current = form;

  /* Escape reads the live form through a ref — binding it once would otherwise close on a
     stale snapshot and skip the unsaved-changes guard. */
  useEffect(() => {
    snapRef.current = JSON.stringify(form);
    requestAnimationFrame(() => setMounted(true));
    const onKey = (e) => {if (e.key === 'Escape') guard(onClose);};
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const guard = (cb) => {
    if (snapRef.current !== JSON.stringify(formRef.current)) {setDiscardCb(() => cb);setShowDiscard(true);} else
    cb();
  };
  const handleClose = () => guard(onClose);
  const handleCancel = () => guard(() => {setIsEditing(false);setErrors({});setForm(buildForm());snapRef.current = JSON.stringify(buildForm());});
  const enterEdit = () => {snapRef.current = JSON.stringify(form);setIsEditing(true);setTab('overview');};

  const validate = () => {
    const e = {};
    if (!form.name) e.name = 'Required';
    if (!form.type) e.type = 'Required';
    if (!form.price || parseCur(form.price) <= 0) e.price = 'Enter a valid amount greater than zero';
    if (!form.cabins || form.cabins.length === 0) e.cabins = 'Select at least one cabin category';
    return e;
  };

  const saveDraft = () => onSaveDraft({ ...form, price: parseCur(form.price) });
  const activate = () => {
    const e = validate();
    if (Object.keys(e).length) {setErrors(e);return;}
    setSaved(true);
    setTimeout(() => onActivate({ ...form, price: parseCur(form.price) }), 450);
  };
  const saveChanges = () => {
    const e = validate();
    if (Object.keys(e).length) {setErrors(e);return;}
    onSaveChanges({ ...form, price: parseCur(form.price) });
    setSaved(true);
    setTimeout(() => {setSaved(false);snapRef.current = JSON.stringify(form);setIsEditing(false);setErrors({});}, 800);
  };

  const isActive = viewRow?.status === 'Active';
  const canDelete = mode === 'view' ? (viewRow?.usedIn || 0) === 0 : true;
  const readOnly = mode === 'view' && !isEditing;

  return (
    <>
      <div onClick={handleClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.32)', zIndex: 900, opacity: mounted ? 1 : 0, transition: 'opacity .22s' }} />

      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 720, maxWidth: '100%', background: readOnly ? T.bg : '#fff', zIndex: 901, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 48px rgba(15,23,42,.2)', transform: mounted ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .25s ease-out' }}>

        {/* Header */}
        <div style={{ padding: '16px 24px 0', borderBottom: `1px solid ${T.line}`, flexShrink: 0, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 5 }}>
                {mode === 'create' ? 'New Supplement' : 'Supplement Details'}
              </div>
              {mode === 'view' ?
              <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 800, color: T.ink }}>{viewRow?.code}</span>
                    <SpStatusBadge status={viewRow?.status || 'Draft'} />
                    <TypeBadge type={viewRow?.type} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', fontSize: 12, color: T.inkFaint }}>
                    <span>{viewRow?.name}</span><span>·</span>
                    <span>{fmtMoney(viewRow?.price)}</span><span>·</span>
                    <span>Modified {viewRow?.mod}</span><span>·</span>
                    <span>{viewRow?.editor}</span>
                  </div>
                </> :
              <div style={{ fontSize: 12, color: T.inkFaint }}>Blank supplement definition</div>
              }
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              {saved && <span style={{ fontSize: 12, color: T.tealDark, display: 'flex', alignItems: 'center', gap: 5 }}><IcCheckSm />{mode === 'create' ? 'Activated' : 'Saved'}</span>}

              {readOnly &&
              <>
                  <button onClick={enterEdit} style={{ padding: '7px 15px', border: 'none', borderRadius: 7, background: T.primary, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IcEditSm />Edit
                  </button>
                  <button onClick={onToggleStatus} style={{ padding: '7px 14px', border: `1.5px solid ${isActive ? '#FCA5A5' : '#A7F3D0'}`, borderRadius: 7, background: '#fff', fontSize: 13, fontWeight: 600, color: isActive ? T.red : T.tealDark, cursor: 'pointer' }}>
                    {isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={onDelete} disabled={!canDelete} title={!canDelete ? `Used in ${viewRow.usedIn} active farecode${viewRow.usedIn === 1 ? '' : 's'}` : undefined}
                style={{ padding: '7px 14px', border: `1.5px solid ${T.line}`, borderRadius: 7, background: '#fff', fontSize: 13, fontWeight: 500, color: canDelete ? T.inkSoft : T.inkFaint, cursor: canDelete ? 'pointer' : 'not-allowed' }}>
                    Delete
                  </button>
                </>
              }
              {mode === 'view' && isEditing &&
              <>
                  <button onClick={handleCancel} style={{ padding: '7px 14px', border: `1.5px solid ${T.line}`, borderRadius: 7, background: '#fff', fontSize: 13, fontWeight: 500, color: T.inkSoft, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveChanges} style={{ padding: '7px 15px', border: 'none', borderRadius: 7, background: T.primary, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IcCheckSm />Save Changes
                  </button>
                </>
              }
              {mode === 'create' &&
              <>
                  <button onClick={saveDraft} style={{ padding: '7px 14px', border: `1.5px solid ${T.line}`, borderRadius: 7, background: '#fff', fontSize: 13, fontWeight: 600, color: T.inkSoft, cursor: 'pointer' }}>Save as Draft</button>
                  <button onClick={activate} style={{ padding: '7px 15px', border: 'none', borderRadius: 7, background: T.primary, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IcCheckSm />Activate
                  </button>
                </>
              }
              <button onClick={handleClose} aria-label="Close panel" style={{ width: 32, height: 32, borderRadius: 7, border: `1.5px solid ${T.line}`, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkSoft }}
              onMouseEnter={(e) => {e.currentTarget.style.background = T.fill;e.currentTarget.style.color = T.ink;}}
              onMouseLeave={(e) => {e.currentTarget.style.background = '#fff';e.currentTarget.style.color = T.inkSoft;}}>
                <IcXSm />
              </button>
            </div>
          </div>

          {mode === 'view' &&
          <div style={{ display: 'flex', gap: 0, marginBottom: -1 }}>
              {[{ k: 'overview', l: 'Overview' }, { k: 'history', l: 'History' }].map((t) =>
            <button key={t.k} onClick={() => setTab(t.k)}
            style={{ background: 'none', border: 'none', padding: '0 18px 12px 0', fontSize: 13.5, fontWeight: tab === t.k ? 600 : 500, color: tab === t.k ? T.ink : T.inkFaint, cursor: 'pointer', borderBottom: tab === t.k ? `2px solid ${T.primary}` : '2px solid transparent', transition: 'color .12s' }}>
                  {t.l}
                </button>
            )}
            </div>
          }
        </div>

        {/* Body */}
        <div className="pscroll" style={{ flex: 1, overflowY: 'auto', padding: '22px 26px 90px', background: readOnly ? '#EFF3F8' : '#fff' }}>
          {(mode === 'create' || tab === 'overview') &&
          <>
              {readOnly && <OverviewReadOnly form={form} />}
              {isEditing &&
            <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
                  <S1 form={form} set={set} errors={errors} mode={mode} />
                  <div style={{ height: 1, background: T.lineSoft }} />
                  <S2 form={form} set={set} errors={errors} />
                  <div style={{ height: 1, background: T.lineSoft }} />
                  <S3 form={form} set={set} errors={errors} />
                </div>
            }
            </>
          }
          {mode === 'view' && tab === 'history' && <HistoryTab status={viewRow?.status} />}
        </div>

        {/* Validation strip */}
        {isEditing && Object.keys(errors).length > 0 &&
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 24px', background: '#fff', borderTop: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <IcWarn color={T.amber} />
            <span style={{ fontSize: 12.5, color: T.amberDark }}>Fix the highlighted fields before continuing.</span>
          </div>
        }

        {/* Discard guard */}
        {showDiscard &&
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,.42)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 360, boxShadow: '0 20px 50px rgba(0,0,0,.2)' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Discard changes?</div>
              <div style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.6, marginBottom: 22 }}>You have unsaved changes. They'll be lost if you continue.</div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowDiscard(false)} style={{ padding: '9px 18px', border: `1.5px solid ${T.line}`, borderRadius: 7, background: '#fff', fontSize: 13, fontWeight: 500, color: T.inkSoft, cursor: 'pointer' }}>Keep editing</button>
                <button onClick={() => {setShowDiscard(false);discardCb && discardCb();}} style={{ padding: '9px 18px', border: 'none', borderRadius: 7, background: T.red, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>Discard</button>
              </div>
            </div>
          </div>
        }
      </div>
    </>);

}

/* ── List screen ────────────────────────────── */
const COLS = [
{ key: 'code', label: 'Code', sort: true, width: '130px' },
{ key: 'name', label: 'Name', sort: true },
{ key: 'type', label: 'Type', sort: true, width: '165px' },
{ key: 'price', label: 'Base Price', sort: true, width: '115px' },
{ key: 'cabins', label: 'Applicable Cabins', sort: false, width: '180px' },
{ key: 'status', label: 'Status', sort: false, width: '110px' },
{ key: 'mod', label: 'Last Modified', sort: true, width: '140px' }];


const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const parseDate = (d) => {const [day, mon, yr] = String(d).split(' ');return new Date(yr, (MONTHS[mon] || 1) - 1, parseInt(day) || 1);};

function SupplementListScreen() {
  const [data, setData] = useState(INIT_DATA);
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState([]);
  const [cabinF, setCabinF] = useState([]);
  const [sortCol, setSortCol] = useState('mod');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);
  const nextId = useRef(6);

  let rows = data.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q && !r.code.toLowerCase().includes(q) && !r.name.toLowerCase().includes(q) && !r.type.toLowerCase().includes(q)) return false;
    if (typeF.length > 0 && !typeF.includes(r.type)) return false;
    if (cabinF.length > 0 && !r.cabins.includes('All') && !cabinF.some((c) => r.cabins.includes(c))) return false;
    return true;
  });
  if (sortCol) rows = [...rows].sort((a, b) => {
    const cmp = sortCol === 'mod' ? parseDate(a.mod) - parseDate(b.mod) :
    sortCol === 'price' ? a.price - b.price :
    String(a[sortCol]).localeCompare(String(b[sortCol]));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const pageRows = rows.slice((page - 1) * PAGE, page * PAGE);
  const hasFilter = search || typeF.length > 0 || cabinF.length > 0;
  useEffect(() => setPage(1), [search, typeF, cabinF]);

  const clearFilters = () => {setSearch('');setTypeF([]);setCabinF([]);};
  const handleSort = (col) => {if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');else {setSortCol(col);setSortDir('asc');}};
  const setStatus = (id, status) => setData((p) => p.map((r) => r.id === id ? { ...r, status, mod: TODAY } : r));

  /* Activating is low-risk and applies immediately. Deactivating pulls the supplement out of
     new bookings, so it routes through a confirmation first — same rule as Faretypes. */
  const requestToggle = (row) => {
    if (row.status === 'Active') {setPendingDeactivate(row);return;}
    setStatus(row.id, 'Active');
    setPanel(null);
  };
  const confirmDeactivate = () => {
    if (pendingDeactivate) setStatus(pendingDeactivate.id, 'Inactive');
    setPendingDeactivate(null);
    setPanel(null);
  };
  const confirmDelete = () => {setData((p) => p.filter((r) => r.id !== deleteRow.id));setDeleteRow(null);setPanel(null);};

  const nextCode = (id) => `SUP-${String(10000 + id).slice(1)}`;
  const commit = (form, status) => {
    if (panel?.mode === 'view') {
      setData((p) => p.map((r) => r.id === panel.row.id ? { ...r, ...form, status, mod: TODAY } : r));
    } else {
      const id = nextId.current++;
      setData((p) => [...p, { id, ...form, code: form.code || nextCode(id), status, mod: TODAY, editor: 'jane.doe@mvas.com', usedIn: 0 }]);
    }
    setPanel(null);
  };
  const saveChanges = (form) => setData((p) => p.map((r) => r.id === panel.row.id ? { ...r, ...form, mod: TODAY } : r));

  const cell = (row, key) => {
    if (key === 'code') return <span style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: T.primary }}>{row.code}</span>;
    if (key === 'name') return <span style={{ color: T.ink, fontWeight: 500 }}>{row.name}</span>;
    if (key === 'type') return <TypeBadge type={row.type} />;
    if (key === 'price') return <span style={{ fontFamily: MONO, fontSize: 12.5, color: T.ink, fontWeight: 600 }}>{fmtMoney(row.price)}</span>;
    if (key === 'cabins') return <CabinsCell cabins={row.cabins} />;
    if (key === 'status') return <SpStatusBadge status={row.status} />;
    if (key === 'mod') return <span style={{ color: T.inkSoft, fontSize: 12.5 }}>{row.mod}</span>;
    return null;
  };

  return (
    <>
      <div className="pscroll" style={{ gridColumn: 2, gridRow: 2, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 28px 20px', flexShrink: 0 }}>
          <div style={{ fontSize: 11.5, color: T.inkFaint, marginBottom: 8, fontWeight: 500, letterSpacing: '.3px' }}>
            FARES &amp; PRICING <span style={{ margin: '0 5px' }}>›</span> <span style={{ color: T.inkSoft }}>SUPPLEMENTS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, margin: '0 0 5px 0' }}>Supplements</h1>
              <div style={{ fontSize: 13, color: T.inkSoft }}>Define optional add-ons (drinks, spa, casino, etc.) that guests can purchase with their booking.</div>
            </div>
            <button onClick={() => setPanel({ mode: 'create' })}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: T.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 2px 6px rgba(27,36,52,.2)' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '.88'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
              + New Supplement
            </button>
          </div>
        </div>

        <div style={{ flex: 1, padding: '0 28px 28px' }}>
          <ListCard>
            <ListToolbar>
              <FilterRow>
                <ListSearch value={search} onChange={setSearch} placeholder="Filter by supplement name, code, type…" />
                <MultiFilter label={typeF.length === 0 ? 'All Types' : typeF.length === 1 ? typeF[0] : `${typeF.length} types`}
                opts={TYPES} selected={typeF} onChange={setTypeF} />
                <MultiFilter label={cabinF.length === 0 ? 'Cabin Categories' : `${cabinF.length} categor${cabinF.length === 1 ? 'y' : 'ies'}`}
                opts={CABIN_OPTS} selected={cabinF} onChange={setCabinF} chips
                hint="Matches any selected category, or “All Cabins”" />
                {hasFilter && <ClearFilters onClick={clearFilters} />}
                <ResultCount>{rows.length} of {data.length} supplements</ResultCount>
              </FilterRow>
            </ListToolbar>

            <DataTable
              cols={COLS} rows={pageRows} cell={cell}
              sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
              onRowClick={(row) => setPanel({ mode: 'view', row })}
              emptyTitle={hasFilter ? 'No supplements match your filters' : 'No supplements yet'}
              emptySub={hasFilter ? 'Try adjusting your search or filters.' : 'Create your first with “+ New Supplement” above.'} />

            <ListPager page={page} setPage={setPage} total={rows.length} pageSize={PAGE} noun="supplements" />
          </ListCard>
        </div>
      </div>

      {panel &&
      <SupplementPanel
        mode={panel.mode}
        viewRow={panel.row && data.find((r) => r.id === panel.row.id) || panel.row}
        initialEdit={!!panel.initialEdit}
        onClose={() => setPanel(null)}
        onSaveDraft={(f) => commit(f, 'Draft')}
        onActivate={(f) => commit(f, 'Active')}
        onSaveChanges={saveChanges}
        onToggleStatus={() => requestToggle(data.find((r) => r.id === panel.row.id) || panel.row)}
        onDelete={() => setDeleteRow(panel.row)} />
      }

      {pendingDeactivate &&
      <Modal title="Deactivate this supplement?" icon={<IcWarn color={T.amber} />} onClose={() => setPendingDeactivate(null)}
      actions={<>
            <button style={polGhost} onClick={() => setPendingDeactivate(null)}>Cancel</button>
            <button style={{ ...polBtn, background: T.red, color: '#fff' }} onClick={confirmDeactivate}>Deactivate</button>
          </>}>
          Deactivating <strong style={{ fontFamily: MONO }}>{pendingDeactivate.code}</strong> removes it from
          supplement pickers, so it can no longer be added to new bookings.
          {pendingDeactivate.usedIn > 0 ?
        <> It's currently attached to <strong>{pendingDeactivate.usedIn}</strong> active farecode{pendingDeactivate.usedIn === 1 ? '' : 's'}, which keep their existing terms.</> :
        <> It isn't attached to any farecodes yet.</>}
          {' '}You can reactivate it at any time.
        </Modal>
      }

      {deleteRow && (deleteRow.usedIn > 0 ?
      <Modal title="Can't delete this supplement" icon={<IcWarn color={T.amber} />} onClose={() => setDeleteRow(null)}
      actions={<button style={{ ...polBtn, background: T.primary, color: '#fff' }} onClick={() => setDeleteRow(null)}>Got it</button>}>
          <strong style={{ fontFamily: MONO }}>{deleteRow.code}</strong> is used in {deleteRow.usedIn} active
          farecode{deleteRow.usedIn === 1 ? '' : 's'}. Remove it from those farecodes before deleting.
        </Modal> :

      <Modal title={`Delete ${deleteRow.code}?`} icon={<IcWarn color={T.red} />} onClose={() => setDeleteRow(null)}
      actions={<>
            <button style={polGhost} onClick={() => setDeleteRow(null)}>Cancel</button>
            <button style={{ ...polBtn, background: T.red, color: '#fff' }} onClick={confirmDelete}>Delete</button>
          </>}>
          This permanently removes <strong>{deleteRow.name}</strong>. This cannot be undone.
        </Modal>)
      }
    </>);

}

Object.assign(window, { SupplementListScreen });
})();
