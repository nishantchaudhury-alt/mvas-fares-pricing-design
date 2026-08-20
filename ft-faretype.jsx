// ft-faretype.jsx — Faretype module (ported from "Faretype Detail Panel v4").
// v4 supersedes v3: same list + 6-section create/edit panel, plus the read-only FaretypeDetailPanel
// (Overview / Farecodes / Audit tabs) shown when a table row is clicked, and a "Review Changes"
// diff section in the edit panel.
// Wrapped in an IIFE: it defines its own T / iS / Field / Sel / Toggle / STATUS_S / SCard /
// StatusBadge / IcSearch / Sidebar / TopBar, all of which collide with dc-shell.jsx globals.
// Policy fields resolve against the live Policies module — see the bridge helpers below.
(function () {

const { useState, useRef, useEffect } = React;

/* ── Tokens ─────────────────────────────────── */
const T = {
  ink: '#0F172A', inkSoft: '#475569', inkFaint: '#94A3B8', inkLabel: '#64748B',
  bg: '#F1F5F9', panel: '#FFFFFF', fill: '#F8FAFC', navFill: '#F9FAFB',
  line: '#E2E8F0', lineSoft: '#EEF2F6', primary: '#1B2434', primaryBg: '#EEF2F6',
  teal: '#10B981', tealDark: '#059669', tealLight: '#ECFDF5',
  amber: '#F59E0B', amberDark: '#D97706', amberLight: '#FFFBEB', amberBorder: '#FCD34D',
  red: '#DC2626', redLight: '#FEF2F2'
};

/* ── Seed Data ──────────────────────────────── */
const INIT_ROWS = [
{ id: 1, code: 'FT-00101', basis: 'CORE-RETAIL', group: 'Core', source: 'WC', fc: 12, status: 'Active', mod: '14 Jun 2026' },
{ id: 2, code: 'FT-00102', basis: 'NR-PROMO', group: 'Non-Refundable', source: 'Partner', fc: 5, status: 'Active', mod: '11 Jun 2026' },
{ id: 3, code: 'FT-00103', basis: 'INT-AGENCY', group: 'Interline', source: 'Partner', fc: 3, status: 'Draft', mod: '10 Jun 2026' },
{ id: 4, code: 'FT-00104', basis: 'BROC-2025', group: 'Brochure', source: 'WC', fc: 8, status: 'Active', mod: '08 Jun 2026' },
{ id: 5, code: 'FT-00105', basis: 'CASINO-STD', group: 'Core', source: 'Casino', fc: 0, status: 'Draft', mod: '07 Jun 2026' },
{ id: 6, code: 'FT-00106', basis: 'YM-FLEX', group: 'Core', source: 'YM', fc: 2, status: 'Inactive', mod: '28 May 2026' },
{ id: 7, code: 'FT-00107', basis: 'NR-GROUP', group: 'Non-Refundable', source: 'WC', fc: 6, status: 'Active', mod: '13 Jun 2026' },
{ id: 8, code: 'FT-00108', basis: 'INT-PROMO', group: 'Interline', source: 'Partner', fc: 1, status: 'Active', mod: '02 Jun 2026' }];

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
const mkSupp = (id, title, type) => ({ id, title, type, custom: false, enabled: false, name: '', cabin: '', rule: 'Booking', maxCount: '', farePos: '', applicableSailings: [] });
const DEFAULT_FORM = () => ({
  faretypeCode: '', fareBasisCode: '', faretypeGroup: '', source: '',
  cancellationPolicy: '', depositPolicy: '',
  residency: 'Any', minAge: 18, minOccupancy: '', maxOccupancy: '', advancedPurchase: '', boardingPass: '',
  standbyEligible: false, upgradeEligible: true, couponEligible: true,
  cruiseControlAccess: true,
  chMVASB2C: true, chMVASB2B: true, chCC: true, chTradeAPI: false, chCRM: true, chGroup: false, chInternal: false,
  channelPartners: [],
  mktExpanded: false, includeDiscount: false, discountMessage: '',
  offerPrimary: '', offerSecondary: '', offerTertiary: '',
  waiveGovTaxes: false, waiveCruiseExp: false, noFareDisplay: false,
  supp: [
  mkSupp('ob-comp', 'Complementary Onboard Supplement', 'comp'),
  mkSupp('os-comp', 'Complementary Onshore Supplement', 'comp'),
  mkSupp('ob-paid', 'Paid Onboard Supplement', 'paid'),
  mkSupp('os-paid', 'Paid Onshore Supplement', 'paid')]

});


/* ── Live Policies bridge ─────────────────────
   Active parent policies come from the shell's Policies module (pol-data.jsx), so a
   Faretype always inherits from records that actually exist. */
const polParents = (policies, type) => (policies || []).filter((g) => g.type === type).
  flatMap((g) => g.parents.filter((p) => p.status === 'Active').map((p) => ({ ...p, group: g })));
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
function iS(err) {
  return { width: '100%', padding: '10px 13px', border: `1.5px solid ${err ? T.red : '#D8DFE8'}`, borderRadius: 8, fontSize: 13, color: T.ink, background: '#fff', outline: 'none', transition: 'border-color .15s' };
}

function Field({ label, required, helper, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label &&
      <label style={{ fontSize: 10.5, fontWeight: 700, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.65px', lineHeight: 1 }}>
          {label}{required && <span style={{ color: T.red, marginLeft: 3 }}>*</span>}
        </label>
      }
      {children}
      {error && <span style={{ fontSize: 11, color: T.red, marginTop: 0 }}>{error}</span>}
      {helper && !error && <span style={{ fontSize: 11, color: T.inkFaint, lineHeight: 1.4, marginTop: 0 }}>{helper}</span>}
    </div>);

}

function Sel({ value, onChange, opts, err }) {
  return (
    <div style={{ position: 'relative' }}>
      <select className="fi" value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...iS(err), appearance: 'none', cursor: 'pointer', paddingRight: 36, color: value ? T.ink : T.inkFaint }}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l !== undefined ? l : v}</option>)}
      </select>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.2" strokeLinecap="round" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>);

}

function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)}
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
      <Toggle on={on} onChange={onChange} />
    </div>);

}

function MultiChip({ values, onChange, opts, placeholder }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    const h = (e) => {if (ref.current && !ref.current.contains(e.target)) setOpen(false);};
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  const filtered = opts.filter((o) => !values.includes(o) && o.toLowerCase().includes(q.toLowerCase()));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div onClick={() => setOpen(true)}
      style={{ minHeight: 46, padding: '6px 12px', border: `1.5px solid #D8DFE8`, borderRadius: 9, display: 'flex', flexWrap: 'wrap', gap: 5, cursor: 'text', alignItems: 'center', background: '#fff' }}>
        {values.map((v) =>
        <span key={v} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: T.primaryBg, color: T.primary, fontSize: 12.5, fontWeight: 500 }}>
            {v}
            <span onClick={(e) => {e.stopPropagation();onChange(values.filter((x) => x !== v));}}
          style={{ cursor: 'pointer', color: T.inkFaint, fontSize: 15, lineHeight: 1 }}>×</span>
          </span>
        )}
        <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)}
        placeholder={values.length === 0 ? placeholder : ''}
        style={{ border: 'none', outline: 'none', fontSize: 14, color: T.ink, flex: 1, minWidth: 100, background: 'transparent', padding: '4px 4px' }} />
      </div>
      {open && filtered.length > 0 &&
      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: '#fff', border: `1px solid ${T.line}`, borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,.1)', zIndex: 600, maxHeight: 180, overflowY: 'auto' }}>
          {filtered.map((o) =>
        <div key={o} onClick={() => {onChange([...values, o]);setQ('');}}
        style={{ padding: '10px 16px', fontSize: 13.5, cursor: 'pointer', color: T.ink }}
        onMouseEnter={(e) => e.currentTarget.style.background = T.fill}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              {o}
            </div>
        )}
        </div>
      }
    </div>);

}

function SubBlock({ title, children }) {
  return (
    <div style={{ border: `1px solid #E8EDF3`, borderRadius: 9, background: '#FAFBFC', padding: '15px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {title && <div style={{ fontSize: 10, fontWeight: 700, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.65px' }}>{title}</div>}
      {children}
    </div>);

}

function HDivider() {return <div style={{ height: 1, background: T.line, margin: '4px 0' }} />;}

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

/* ── Section 1 ──────────────────────────────── */
function S1({ form, set, errors, mode, editData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: T.ink, lineHeight: 1.2, marginBottom: 4 }}>Basics &amp; Grouping</h2>
        <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>Provide global systemic identifiers and operational taxonomies for this template profile.</p>
      </div>
      <Field label="Faretype Code" required helper="System-wide unique key for database and reporting." error={errors.faretypeCode}>
        <input className="fi" style={iS(errors.faretypeCode)} value={form.faretypeCode}
        onChange={(e) => set('faretypeCode', e.target.value)} placeholder="e.g. CORE-RETAIL-2026" />
      </Field>
      <Field label="Farebasis Code Modifier">
        <input className="fi" style={iS()} value={form.fareBasisCode}
        onChange={(e) => set('fareBasisCode', e.target.value)} placeholder="e.g. YFLX" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Faretype Group" required error={errors.faretypeGroup}>
          <Sel value={form.faretypeGroup} onChange={(v) => set('faretypeGroup', v)} err={errors.faretypeGroup}
          opts={[['', 'Select group…'], ['Core', 'Core'], ['Interline', 'Interline'], ['Brochure', 'Brochure'], ['Non-Refundable', 'Non-Refundable']]} />
        </Field>
        <Field label="Source Channel" required error={errors.source}>
          <Sel value={form.source} onChange={(v) => set('source', v)} err={errors.source}
          opts={[['', 'Select source…'], ['WC', 'WC'], ['Casino', 'Casino'], ['Partner', 'Partner'], ['YM', 'YM']]} />
        </Field>
      </div>
      {mode === 'edit' &&
      <Field label="System Faretype ID">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', border: `1.5px solid #D8DFE8`, borderRadius: 9, background: T.fill, color: T.inkFaint, fontSize: 13.5, fontFamily: "'SF Mono', Menlo, monospace" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            FT-ID-{10000 + (editData?.id || 1)}
          </div>
        </Field>
      }
    </div>);

}

/* ── Section 2 ──────────────────────────────── */
function S2({ form, set, errors, policies }) {
  const canPol = polParents(policies, 'cancel').find((p) => p.name === form.cancellationPolicy);
  const chips = [];
  if (canPol) chips.push(canPol.isRefundable === false ?
  { l: 'Non-refundable', c: T.red, bg: T.redLight } :
  { l: 'Refundable', c: T.tealDark, bg: T.tealLight });
  chips.push(form.upgradeEligible ?
  { l: 'Upgrades allowed', c: T.tealDark, bg: T.tealLight } :
  { l: 'Upgrades blocked', c: T.inkSoft, bg: T.fill });
  chips.push(form.couponEligible ?
  { l: 'Coupon allowed', c: T.tealDark, bg: T.tealLight } :
  { l: 'Coupon blocked', c: T.inkSoft, bg: T.fill });
  if (form.standbyEligible) chips.push({ l: 'Standby eligible', c: '#7C3AED', bg: '#EDE9FE' });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: T.ink, lineHeight: 1.2, marginBottom: 4 }}>Policies &amp; Eligibility</h2>
        <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>Define the commercial behaviour of this fare and who qualifies to book it.</p>
      </div>
      <SubBlock title="Commercial Policies">
        <Field label="Cancellation Policy" required helper="Refundability and penalty structure." error={errors.cancellationPolicy}>
          <Sel value={form.cancellationPolicy} onChange={(v) => set('cancellationPolicy', v)} err={errors.cancellationPolicy}
          opts={polOptsFor(policies, 'cancel', form.cancellationPolicy)} />
        </Field>
        <Field label="Deposit Policy" required error={errors.depositPolicy}>
          <Sel value={form.depositPolicy} onChange={(v) => set('depositPolicy', v)} err={errors.depositPolicy}
          opts={polOptsFor(policies, 'deposit', form.depositPolicy)} />
        </Field>
      </SubBlock>
      <SubBlock title="Eligibility Criteria">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Residency">
            <Sel value={form.residency} onChange={(v) => set('residency', v)}
            opts={[['Any', 'Any'], ['US Only', 'US Only'], ['Non-US', 'Non-US'], ['Canada', 'Canada'], ['UK', 'UK']]} />
          </Field>
          <Field label="Min Age">
            <input className="fi" type="number" style={iS()} value={form.minAge} min={0} max={99} onChange={(e) => set('minAge', e.target.value)} />
          </Field>
          <Field label="Min Occupancy">
            <input className="fi" type="number" style={iS()} value={form.minOccupancy} onChange={(e) => set('minOccupancy', e.target.value)} placeholder="1" />
          </Field>
          <Field label="Max Occupancy">
            <input className="fi" type="number" style={iS()} value={form.maxOccupancy} onChange={(e) => set('maxOccupancy', e.target.value)} placeholder="4" />
          </Field>
        </div>
        <Field label="Advanced Purchase (Days)" helper="Minimum days before sailing.">
          <input className="fi" type="number" style={iS()} value={form.advancedPurchase} onChange={(e) => set('advancedPurchase', e.target.value)} />
        </Field>
        <Field label="Boarding Pass Endorsement">
          <input className="fi" style={iS()} value={form.boardingPass} onChange={(e) => set('boardingPass', e.target.value)} placeholder="e.g. NONEND" />
        </Field>
      </SubBlock>
      <SubBlock title="Eligibility Flags">
        <TRow label="Standby Eligible" helper="Standby booking allowed." on={form.standbyEligible} onChange={(v) => set('standbyEligible', v)} />
        <TRow label="Upgrade Eligible" helper="Cabin upgrades allowed." on={form.upgradeEligible} onChange={(v) => set('upgradeEligible', v)} />
        <TRow label="Coupon Eligible" helper="Coupons allowed." on={form.couponEligible} onChange={(v) => set('couponEligible', v)} />
      </SubBlock>
      {form.cancellationPolicy &&
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {chips.map((c, i) =>
        <span key={i} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, background: c.bg, color: c.c }}>{c.l}</span>
        )}
        </div>
      }
    </div>);

}

/* ── Section 3 ──────────────────────────────── */
function S3({ form, set }) {
  const CHS = [
  { k: 'chMVASB2C', l: 'MVAS B2C' }, { k: 'chMVASB2B', l: 'MVAS B2B' },
  { k: 'chCC', l: 'Cruise Control' }, { k: 'chTradeAPI', l: 'Trade API' },
  { k: 'chCRM', l: 'CRM' }, { k: 'chGroup', l: 'Group' }, { k: 'chInternal', l: 'Internal' }];

  const vis = CHS.filter((c) => form[c.k]).map((c) => c.l);
  const hid = CHS.filter((c) => !form[c.k]).map((c) => c.l);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: T.ink, lineHeight: 1.2, marginBottom: 4 }}>Channels &amp; Access</h2>
        <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>Control where this faretype is visible and bookable across distribution channels.</p>
      </div>
      <TRow label="Cruise Control Access" helper="Internal CRM visibility." on={form.cruiseControlAccess} onChange={(v) => set('cruiseControlAccess', v)} />
      <HDivider />
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: T.inkLabel, textTransform: 'uppercase', letterSpacing: '.65px', marginBottom: 10 }}>Distribution Channels</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {CHS.map((c) =>
          <div key={c.k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: `1.5px solid #E8EDF3`, borderRadius: 8, background: '#fff' }}>
              <span style={{ fontSize: 13, color: T.ink, fontWeight: 450 }}>{c.l}</span>
              <Toggle on={form[c.k]} onChange={(v) => set(c.k, v)} />
            </div>
          )}
        </div>
      </div>
      {form.chMVASB2B &&
      <Field label="Channel Partner Applicable" helper="Restrict to specific partners.">
          <MultiChip values={form.channelPartners} onChange={(v) => set('channelPartners', v)}
        opts={['Virtuoso', 'AMEX Travel', 'Ensemble', 'Signature Travel', 'Travel Leaders', 'Nexion', 'Avoya Travel']}
        placeholder="Search agencies…" />
        </Field>
      }
      <div style={{ fontSize: 12, color: T.inkFaint, padding: '10px 12px', background: T.fill, borderRadius: 8, border: `1px solid ${T.lineSoft}`, lineHeight: 1.5 }}>
        <strong style={{ color: T.inkSoft }}>Visible:</strong> {vis.length ? vis.join(', ') : 'None'} &nbsp;·&nbsp; <strong style={{ color: T.inkSoft }}>Hidden:</strong> {hid.length ? hid.join(', ') : 'None'}
      </div>
    </div>);

}

/* ── Section 4 ──────────────────────────────── */
function S4({ form, set }) {
  const OFFERS = [['', 'None'], ['OFFER-2026-SPRING', 'OFFER-2026-SPRING'], ['OFFER-2026-SUMMER', 'OFFER-2026-SUMMER'], ['OFFER-CASINO-Q2', 'OFFER-CASINO-Q2']];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: T.ink, lineHeight: 1.2, marginBottom: 4 }}>Marketing &amp; Messaging</h2>
        <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>Attach offer copy and discount messages. This section is optional.</p>
      </div>
      {!form.mktExpanded ?
      <button onClick={() => set('mktExpanded', true)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: `1.5px dashed #D8DFE8`, color: T.inkSoft, fontSize: 13.5, cursor: 'pointer', fontWeight: 500, padding: '14px 20px', borderRadius: 9, textAlign: 'left', transition: 'all .15s' }}
      onMouseEnter={(e) => {e.currentTarget.style.borderColor = T.primary;e.currentTarget.style.color = T.primary;}}
      onMouseLeave={(e) => {e.currentTarget.style.borderColor = '#D8DFE8';e.currentTarget.style.color = T.inkSoft;}}>
          <span style={{ fontSize: 16 }}>+</span> Add marketing message
        </button> :

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TRow label="Include Discount Message" on={form.includeDiscount} onChange={(v) => set('includeDiscount', v)} />
          {form.includeDiscount &&
        <Field label="Discount Message Copy">
              <textarea className="fi" style={{ ...iS(), minHeight: 90, resize: 'vertical', lineHeight: 1.6 }}
          value={form.discountMessage} onChange={(e) => set('discountMessage', e.target.value)}
          placeholder="e.g. Save 20% on this sailing — limited time offer." />
            </Field>
        }
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[['offerPrimary', 'Primary'], ['offerSecondary', 'Secondary'], ['offerTertiary', 'Tertiary']].map(([k, lbl]) =>
          <Field key={k} label={lbl + ' Offer ID'}>
                <Sel value={form[k]} onChange={(v) => set(k, v)} opts={OFFERS} />
              </Field>
          )}
          </div>
          <button onClick={() => set('mktExpanded', false)}
        style={{ background: 'none', border: 'none', color: T.inkFaint, fontSize: 12.5, cursor: 'pointer', fontWeight: 500, padding: 0, textAlign: 'left' }}>
            − Remove marketing messaging
          </button>
        </div>
      }
    </div>);

}

/* ── Section 5 ──────────────────────────────── */
function S5({ form, set }) {
  const ITEMS = [
  { k: 'waiveGovTaxes', l: 'Waive All Government Taxes', w: 'Zeros out all government taxes. Comp/crew only.' },
  { k: 'waiveCruiseExp', l: 'Waive All Cruise Expenses', w: 'Zeros out all cruise expenses. Comp/crew only.' },
  { k: 'noFareDisplay', l: 'No Fare Display', w: 'Hides fare amounts on PDFs and in Cruise Control.' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: T.ink, lineHeight: 1.2, marginBottom: 4 }}>Taxes &amp; Privacy</h2>
        <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>Configure exceptional financial behaviour for this fare.</p>
      </div>
      <WarnBanner>
        <span style={{ fontSize: 13, color: T.amberDark, fontWeight: 500, lineHeight: 1.5 }}>Advanced settings — apply with care. These override core financial calculations.</span>
      </WarnBanner>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {ITEMS.map(({ k, l, w }) =>
        <div key={k} style={{ border: `1.5px solid ${form[k] ? T.amberBorder : '#E8EDF3'}`, borderRadius: 9, padding: '14px 16px', transition: 'border-color .2s' }}>
            <TRow label={l} on={form[k]} onChange={(v) => set(k, v)} />
            {form[k] &&
          <div style={{ marginTop: 10, padding: '9px 12px', background: T.amberLight, border: `1px solid ${T.amberBorder}`, borderRadius: 7, fontSize: 12, color: T.amberDark, lineHeight: 1.5 }}>{w}</div>
          }
          </div>
        )}
      </div>
    </div>);

}

/* ── Section 6 ──────────────────────────────── */
const SUPP_CABIN = [['', 'Any'], ['Interior', 'Interior'], ['Ocean View', 'Ocean View'], ['Balcony', 'Balcony'], ['Suite', 'Suite']];
/* Labels say how the supplement is counted, not just what it is counted against. */
const SUPP_RULE = [['Booking', 'Per booking'], ['Cabin', 'Per cabin'], ['Guest', 'Per guest']];
const SUPP_FPOS = [['', 'Select…'], ['Fare Position 1', 'Fare Position 1'], ['Fare Position 2', 'Fare Position 2'], ['Fare Position 3', 'Fare Position 3']];
const SUPP_TYPES = [['comp', 'Complementary'], ['paid', 'Paid']];
const SUPP_SAILINGS = ['IS-2026-09-01', 'IS-2026-10-15', 'IS-2026-11-20', 'IS-2026-12-05'];
const typeLabel = (t) => t === 'comp' ? 'Complementary' : 'Paid';
const ruleLabel = (r) => ({ Booking: 'Per booking', Cabin: 'Per cabin', Guest: 'Per guest' })[r] || r;

/* Custom rows get a session-unique id so the review diff can track them across renders. */
let suppSeq = 0;
const mkCustomSupp = () => ({ ...mkSupp(`sup-custom-${++suppSeq}`, '', 'paid'), enabled: true, custom: true });

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
  return [s.cabin || 'Any cabin', ruleLabel(s.rule), s.maxCount && `Max ${s.maxCount}`, s.farePos,
  n ? `${n} sailing${n > 1 ? 's' : ''}` : null].
  filter(Boolean).join(' · ');
}

function SuppDetail({ supp, onUpdate }) {
  const s = (k, v) => onUpdate({ ...supp, [k]: v });
  return (
    <div style={{ padding: '14px 13px 15px', background: '#FBFCFE', borderRadius: '0 0 9px 9px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {supp.custom &&
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12 }}>
          <Field label="Supplement Title" helper="Shown in the table and on the review screen.">
            <input className="fi" style={iS()} value={supp.title} onChange={(e) => s('title', e.target.value)} placeholder="e.g. Spa Credit Supplement" />
          </Field>
          <Field label="Type">
            <Sel value={supp.type} onChange={(v) => s('type', v)} opts={SUPP_TYPES} />
          </Field>
        </div>
      }
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Supplement Name">
          <input className="fi" style={iS()} value={supp.name} onChange={(e) => s('name', e.target.value)} placeholder="e.g. Drinks Package" />
        </Field>
        <Field label="Cabin Category">
          <Sel value={supp.cabin} onChange={(v) => s('cabin', v)} opts={SUPP_CABIN} />
        </Field>
        <Field label="Rule" helper="Counting & application method.">
          <Sel value={supp.rule} onChange={(v) => s('rule', v)} opts={SUPP_RULE} />
        </Field>
        <Field label="Max Count">
          <input className="fi" type="number" style={iS()} value={supp.maxCount} onChange={(e) => s('maxCount', e.target.value)} placeholder="1" />
        </Field>
      </div>
      <Field label="Allocation to Fare Position">
        <Sel value={supp.farePos} onChange={(v) => s('farePos', v)} opts={SUPP_FPOS} />
      </Field>
      <Field label="Applicable Sailings" helper="Leave empty to apply to all sailings.">
        <MultiChip values={supp.applicableSailings} onChange={(v) => s('applicableSailings', v)}
        opts={SUPP_SAILINGS} placeholder="Search sailings…" />
      </Field>
    </div>);

}

/* One supplement = one self-contained card. A table would need columns, and the only two
   candidates (cabin, rule) are empty until a row is switched on — and then repeat what the
   form directly beneath already says. So the state lives in the summary line instead. */
function SuppCard({ supp, open, onToggleOpen, onUpdate, onSetEnabled, onRemove }) {
  const on = supp.enabled;
  const [hover, setHover] = useState(false);
  const incomplete = on && !supp.name;
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
      style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '12px 12px 12px 9px', cursor: on ? 'pointer' : 'default', borderRadius: open ? '9px 9px 0 0' : 9, background: on && hover && !open ? '#FAFCFE' : 'transparent', transition: 'background .15s' }}>

        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.6" strokeLinecap="round"
        style={{ flexShrink: 0, marginTop: 4, opacity: on ? 1 : 0, transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .18s' }}>
          <polyline points="9 6 15 12 9 18" />
        </svg>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.35, color: on ? T.ink : T.inkSoft }}>
              {supp.title || 'Untitled supplement'}
            </span>
            <SuppBadge type={supp.type} muted={!on} />
          </div>
          {on &&
          <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.45 }}>
              {incomplete ?
            <span style={{ color: T.amberDark, fontWeight: 500 }}>Needs configuration</span> :
            <span style={{ color: T.inkSoft, fontWeight: 500 }}>{supp.name}</span>}
              <span style={{ color: T.inkFaint }}> · {suppRecap(supp)}</span>
            </div>
          }
        </div>

        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 1 }}>
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
          <Toggle on={on} onChange={onSetEnabled} />
        </div>
      </div>

      {open && on &&
      <div style={{ borderTop: `1px solid ${T.lineSoft}` }}>
          <SuppDetail supp={supp} onUpdate={onUpdate} />
        </div>
      }
    </div>);

}

function S6({ form, setForm }) {
  const [open, setOpen] = useState(() => new Set(form.supp.filter((s) => s.enabled).map((s) => s.id)));
  const mark = (id, isOpen) => setOpen((p) => {const n = new Set(p);isOpen ? n.add(id) : n.delete(id);return n;});

  const updSupp = (i, v) => setForm((p) => {const supp = [...p.supp];supp[i] = v;return { ...p, supp };});
  const setEnabled = (i, v) => {mark(form.supp[i].id, v);updSupp(i, { ...form.supp[i], enabled: v });};
  const addSupp = () => {
    const s = mkCustomSupp();
    mark(s.id, true);
    setForm((p) => ({ ...p, supp: [...p.supp, s] }));
  };
  const removeSupp = (i) => {
    mark(form.supp[i].id, false);
    setForm((p) => ({ ...p, supp: p.supp.filter((_, j) => j !== i) }));
  };

  const activeCount = form.supp.filter((s) => s.enabled).length;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* The count sits with the heading it describes, not buried under the list. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: 19, fontWeight: 700, color: T.ink, lineHeight: 1.2, marginBottom: 4 }}>Supplements</h2>
          <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>Define what extras are bundled or charged with this fare, and how they are applied.</p>
        </div>
        <span style={{ flexShrink: 0, marginTop: 3, fontSize: 11, fontWeight: 700, letterSpacing: '.2px', whiteSpace: 'nowrap', padding: '3px 9px', borderRadius: 999,
          color: activeCount ? T.tealDark : T.inkFaint,
          background: activeCount ? T.tealLight : T.fill,
          border: `1px solid ${activeCount ? '#D1FAE5' : T.line}` }}>
          {activeCount} of {form.supp.length} on
        </span>
      </div>

      {/* Guidance shows only while it is actionable, and sits with the control it explains. */}
      {!activeCount && form.supp.length > 0 &&
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: T.fill, border: `1px solid ${T.line}`, borderRadius: 9 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="9" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="12" y1="7.5" x2="12" y2="7.6" />
          </svg>
          <span style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.5 }}>
            No supplements are included in this fare. Turn one on to set its cabin, rule and sailings.
          </span>
        </div>
      }

      {/* Cards, not a table — and no overflow clipping, so the Applicable Sailings dropdown can escape. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {form.supp.map((s, i) =>
        <SuppCard key={s.id} supp={s} open={open.has(s.id)}
        onToggleOpen={() => mark(s.id, !open.has(s.id))}
        onUpdate={(v) => updSupp(i, v)}
        onSetEnabled={(v) => setEnabled(i, v)}
        onRemove={() => removeSupp(i)} />
        )}

        {!form.supp.length &&
        <div style={{ padding: '26px 14px', textAlign: 'center', fontSize: 12.5, color: T.inkFaint, background: T.fill, border: `1px solid ${T.line}`, borderRadius: 10, lineHeight: 1.5 }}>
            No supplements defined yet.
          </div>
        }

        <button onClick={addSupp}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '11px 12px', border: '1.5px dashed #CBD5E1', borderRadius: 10, background: 'transparent', cursor: 'pointer', fontSize: 12.5, fontWeight: 600, color: T.inkSoft, transition: 'color .15s, border-color .15s, background .15s' }}
        onMouseEnter={(e) => {e.currentTarget.style.color = T.ink;e.currentTarget.style.borderColor = '#94A3B8';e.currentTarget.style.background = T.fill;}}
        onMouseLeave={(e) => {e.currentTarget.style.color = T.inkSoft;e.currentTarget.style.borderColor = '#CBD5E1';e.currentTarget.style.background = 'transparent';}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add supplement
        </button>
      </div>
    </div>);

}

/* ── Section 7 · Review Changes ──────────────── */
const FIELD_META = {
  faretypeCode: [1, 'Faretype Code'], fareBasisCode: [1, 'Farebasis Code'], faretypeGroup: [1, 'Faretype Group'], source: [1, 'Source'],
  cancellationPolicy: [2, 'Cancellation Policy'], depositPolicy: [2, 'Deposit Policy'], residency: [2, 'Residency'], minAge: [2, 'Minimum Age'],
  minOccupancy: [2, 'Min Occupancy'], maxOccupancy: [2, 'Max Occupancy'], advancedPurchase: [2, 'Advanced Purchase'], boardingPass: [2, 'Boarding Pass'],
  standbyEligible: [2, 'Standby Eligible'], upgradeEligible: [2, 'Upgrade Eligible'], couponEligible: [2, 'Coupon Eligible'],
  cruiseControlAccess: [3, 'Cruise Control Access'], chMVASB2C: [3, 'MVAS B2C'], chMVASB2B: [3, 'MVAS B2B'], chCC: [3, 'Cruise Control'],
  chTradeAPI: [3, 'Trade API'], chCRM: [3, 'CRM'], chGroup: [3, 'Group Desk'], chInternal: [3, 'Internal Only'], channelPartners: [3, 'Channel Partners'],
  includeDiscount: [4, 'Include Discount Message'], discountMessage: [4, 'Discount Message'],
  offerPrimary: [4, 'Primary Offer'], offerSecondary: [4, 'Secondary Offer'], offerTertiary: [4, 'Tertiary Offer'],
  waiveGovTaxes: [5, 'Waive Government Taxes'], waiveCruiseExp: [5, 'Waive Cruise Expenses'], noFareDisplay: [5, 'No Fare Display']
};
const SUPP_FIELDS = { enabled: 'Status', title: 'Title', type: 'Type', name: 'Supplement Name', cabin: 'Cabin Category', rule: 'Rule', maxCount: 'Max Count', farePos: 'Fare Position', applicableSailings: 'Applicable Sailings' };

function fmtVal(v) {
  if (v === true) return 'Enabled';
  if (v === false) return 'Disabled';
  if (Array.isArray(v)) return v.length ? v.join(', ') : 'None';
  if (v === '' || v === null || v === undefined) return '—';
  return String(v);
}
const fmtSuppVal = (k, v) => k === 'type' ? typeLabel(v) : k === 'rule' ? ruleLabel(v) : fmtVal(v);
const suppName = (s) => s.title || 'Untitled supplement';

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
      out.push({ sec: 6, label: `${suppName(s)} · ${typeLabel(s.type)}`, from: 'Not present', to: 'Added' });
      return;
    }
    Object.keys(SUPP_FIELDS).forEach((k) => {
      if (JSON.stringify(o[k]) !== JSON.stringify(s[k]))
      out.push({ sec: 6, label: `${suppName(s)} · ${SUPP_FIELDS[k]}`, from: fmtSuppVal(k, o[k]), to: fmtSuppVal(k, s[k]) });
    });
  });
  const now = new Set((b.supp || []).map((s) => s.id));
  (a.supp || []).forEach((o) => {
    if (!now.has(o.id)) out.push({ sec: 6, label: `${suppName(o)} · ${typeLabel(o.type)}`, from: 'Present', to: 'Removed' });
  });
  return out;
}

const DEMO_DIFF = [
{ sec: 1, label: 'Faretype Group', from: 'Core', to: 'Non-Refundable' },
{ sec: 2, label: 'Cancellation Policy', from: 'Standard', to: 'Non-Refundable 100%' },
{ sec: 3, label: 'Trade API', from: 'Disabled', to: 'Enabled' },
{ sec: 6, label: 'Paid Onboard Supplement · Status', from: 'Disabled', to: 'Enabled' }];


const valS = { fontSize: 12.5, lineHeight: 1.35, padding: '3px 8px', borderRadius: 6, fontFamily: "'SF Mono', Menlo, monospace", wordBreak: 'break-word' };

function DiffRow({ d, first }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(150px,34%) 1fr', gap: 16, alignItems: 'start', padding: '12px 16px', borderTop: first ? 'none' : `1px solid ${T.lineSoft}` }}>
      <div style={{ fontSize: 12.5, color: T.inkLabel, lineHeight: 1.4, paddingTop: 3 }}>{d.label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ ...valS, color: T.inkFaint, background: T.fill, textDecoration: 'line-through', textDecorationColor: '#CBD5E1' }}>{d.from}</span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.4" strokeLinecap="round" style={{ flexShrink: 0 }}><line x1="5" y1="12" x2="18" y2="12" /><polyline points="13 7 18 12 13 17" /></svg>
        <span style={{ ...valS, color: T.tealDark, background: T.tealLight, fontWeight: 600 }}>{d.to}</span>
      </div>
    </div>);

}

function Stat({ value, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 20, fontWeight: 700, color: T.ink, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: T.inkFaint, whiteSpace: 'nowrap' }}>{label}</span>
    </div>);

}

function S7({ diff, demo, farecodes, code, onNav }) {
  const rows = diff.length ? diff : demo;
  const groups = SECTIONS.filter((s) => s.n <= 6).map((s) => ({ ...s, items: rows.filter((r) => r.sec === s.n) })).filter((g) => g.items.length);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: T.ink, lineHeight: 1.2, marginBottom: 4 }}>Review Changes</h2>
        <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5, maxWidth: '52ch' }}>Only fields you changed are listed. Everything else stays exactly as it is.</p>
      </div>

      {/* Summary */}
      <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, background: T.fill, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 20 }}>
        <Stat value={rows.length} label={rows.length === 1 ? 'Field changed' : 'Fields changed'} />
        <div style={{ width: 1, alignSelf: 'stretch', background: T.line }} />
        {!!farecodes?.length &&
        <>
            <Stat value={farecodes.length} label="Farecodes affected" />
            <div style={{ width: 1, alignSelf: 'stretch', background: T.line }} />
          </>
        }
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: T.inkFaint, marginBottom: 3, whiteSpace: 'nowrap' }}>Faretype</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: "'SF Mono', Menlo, monospace", whiteSpace: 'nowrap' }}>{code || '—'}</div>
        </div>
      </div>

      {!diff.length &&
      <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '10px 13px', background: T.amberLight, border: `1px solid ${T.amberBorder}`, borderRadius: 9 }}>
          <span style={{ fontSize: 12.5, color: T.amberDark, lineHeight: 1.45 }}>No edits made in this session. Sample changes are shown so the review layout can be assessed.</span>
        </div>
      }

      {/* Grouped diff */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {groups.map((g) =>
        <div key={g.n} style={{ border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '11px 16px', background: T.navFill, borderBottom: `1px solid ${T.line}`, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'SF Mono', Menlo, monospace", fontSize: 10.5, fontWeight: 700, color: T.inkFaint }}>{String(g.n).padStart(2, '0')}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{g.l}</span>
              <span style={{ padding: '1px 7px', borderRadius: 999, background: '#fff', border: `1px solid ${T.line}`, fontSize: 11, fontWeight: 600, color: T.inkSoft }}>{g.items.length}</span>
              <button onClick={() => onNav?.(g.n)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11.5, fontWeight: 600, color: T.inkSoft, textDecoration: 'underline', textUnderlineOffset: 3 }}
            onMouseEnter={(e) => e.currentTarget.style.color = T.ink}
            onMouseLeave={(e) => e.currentTarget.style.color = T.inkSoft}>Edit</button>
            </div>
            {g.items.map((d, i) => <DiffRow key={i} d={d} first={i === 0} />)}
          </div>
        )}
      </div>

      {!!farecodes?.length &&
      <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.6px', textTransform: 'uppercase', color: T.inkFaint, marginBottom: 4 }}>Farecodes receiving these changes</div>
          <div style={{ fontSize: 12.5, color: T.inkSoft, lineHeight: 1.5, marginBottom: 10 }}>Inherited values update on save. Overridden fields on a farecode are left untouched.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {farecodes.map((f) =>
          <span key={f} style={{ padding: '3px 9px', borderRadius: 6, background: T.fill, border: `1px solid ${T.line}`, fontSize: 11.5, fontFamily: "'SF Mono', Menlo, monospace", color: T.inkSoft }}>{f}</span>
          )}
          </div>
        </div>
      }
    </div>);

}

/* ── Section logic ──────────────────────────── */
const SECTIONS = [
{ n: 1, l: 'Basics & Grouping' }, { n: 2, l: 'Policies & Eligibility' },
{ n: 3, l: 'Channels & Access' }, { n: 4, l: 'Marketing & Messaging' },
{ n: 5, l: 'Taxes & Privacy' }, { n: 6, l: 'Supplements' }, { n: 7, l: 'Review Changes' }];


function sComplete(n, f) {
  if (n === 1) return !!(f.faretypeCode && f.faretypeGroup && f.source);
  if (n === 2) return !!(f.cancellationPolicy && f.depositPolicy);
  return true;
}
function sErr(n, errors) {
  if (n === 1) return !!(errors.faretypeCode || errors.faretypeGroup || errors.source);
  if (n === 2) return !!(errors.cancellationPolicy || errors.depositPolicy);
  return false;
}
function calcCompletion(form, visited) {
  let done = 0;
  if (form.faretypeCode && form.faretypeGroup && form.source) done++;
  if (form.cancellationPolicy && form.depositPolicy) done++;
  if (visited.has(3)) done++;
  if (visited.has(4)) done++;
  if (visited.has(5)) done++;
  if (visited.has(6)) done++;
  if (visited.has(7)) done++;
  return Math.round(done / 7 * 100);
}

/* ── Panel Left Nav (new) ───────────────────── */
function PanelNav({ active, onNav, form, errors, visited, pct }) {
  return (
    <div style={{ width: 248, flexShrink: 0, background: T.navFill, borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column' }}>
      {/* Nav items */}
      <div style={{ flex: 1, padding: '20px 0 0', overflowY: 'auto' }}>
        {SECTIONS.map(({ n, l }) => {
          const isActive = active === n;
          const isDone = !isActive && sComplete(n, form) && (visited.has(n) || n <= 2);
          const hasErr = sErr(n, errors);
          const circBg = isActive ? T.primary : isDone ? T.primary : 'transparent';
          const circBd = isActive || isDone ? 'none' : `2px solid ${hasErr ? T.red : '#C8D5E0'}`;
          const numCol = isActive || isDone ? '#fff' : hasErr ? T.red : T.inkFaint;
          const lblCol = isActive ? T.ink : isDone ? T.inkSoft : hasErr ? T.red : T.inkSoft;
          const lblWt = isActive ? 700 : 500;
          return (
            <div key={n} onClick={() => onNav(n)}
            style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '11px 20px', cursor: 'pointer', position: 'relative', transition: 'background .15s' }}
            onMouseEnter={(e) => {if (!isActive) e.currentTarget.style.background = 'rgba(27,36,52,0.04)';}}
            onMouseLeave={(e) => {if (!isActive) e.currentTarget.style.background = 'transparent';}}>
              {/* Active left bar */}
              {isActive && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: T.primary, borderRadius: '0 2px 2px 0' }} />}
              {/* Circle */}
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: circBg, border: circBd, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}>
                {isDone && !hasErr ?
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg> :

                <span style={{ fontSize: 10.5, fontWeight: 800, color: numCol, letterSpacing: '-.3px' }}>{String(n).padStart(2, '0')}</span>
                }
              </div>
              {/* Label */}
              <span style={{ fontSize: 13, fontWeight: lblWt, color: lblCol, lineHeight: 1.3 }}>{l}</span>
            </div>);

        })}
      </div>

    </div>);

}

/* ── Farecode checklist ─────────────────────── */
function FcChecklist({ checked, onChange, onClose }) {
  const IDS = ['FC-00201', 'FC-00202', 'FC-00203', 'FC-00204', 'FC-00205'];
  const tog = (id) => {const n = new Set(checked);n.has(id) ? n.delete(id) : n.add(id);onChange(n);};
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 4, background: '#fff', border: `1px solid ${T.line}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.12)', zIndex: 700, minWidth: 240, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${T.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: T.ink }}>Select farecodes to update</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.inkFaint, fontSize: 18, lineHeight: 1 }}>×</button>
      </div>
      {IDS.map((id) =>
      <label key={id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', cursor: 'pointer', borderBottom: `1px solid ${T.lineSoft}` }}
      onMouseEnter={(e) => e.currentTarget.style.background = T.fill}
      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <input type="checkbox" checked={checked.has(id)} onChange={() => tog(id)} style={{ accentColor: T.primary, width: 14, height: 14 }} />
          <span style={{ fontSize: 13, color: T.ink, fontFamily: "'SF Mono', Menlo, monospace" }}>{id}</span>
        </label>
      )}
    </div>);

}

/* ── FaretypePanel v2 ───────────────────────── */
function FaretypePanel({ mode, editData, onClose, onSaveDraft, onActivate, policies }) {
  const buildInit = () => mode === 'edit' && editData ?
  { ...DEFAULT_FORM(), faretypeCode: editData.code, fareBasisCode: editData.basis, faretypeGroup: editData.group, source: editData.source, cancellationPolicy: 'Standard Cancellation', depositPolicy: '5 Night Standard Deposit' } :
  DEFAULT_FORM();

  const [form, setForm] = useState(buildInit);
  const initRef = useRef(JSON.stringify(buildInit()));
  const [errors, setErrors] = useState({});
  const [active, setActive] = useState(1);
  const [visited, setVisited] = useState(new Set([1]));
  const [showDiscard, setShowDiscard] = useState(false);
  const [fcOpen, setFcOpen] = useState(false);
  const [checkedFc, setCheckedFc] = useState(new Set(['FC-00201', 'FC-00202', 'FC-00203', 'FC-00204', 'FC-00205']));
  const [mounted, setMounted] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const onKey = (e) => {if (e.key === 'Escape') handleClose();};
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
    if (!form.cancellationPolicy) e.cancellationPolicy = 'Required';
    if (!form.depositPolicy) e.depositPolicy = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };
  const validateAll = () => {
    const e = {};
    if (!form.faretypeCode) e.faretypeCode = 'Required';
    if (!form.faretypeGroup) e.faretypeGroup = 'Required';
    if (!form.source) e.source = 'Required';
    if (!form.cancellationPolicy) e.cancellationPolicy = 'Required';
    if (!form.depositPolicy) e.depositPolicy = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleNext = () => {
    if (active === 1 && !validateS1()) return;
    if (active === 2 && !validateS2()) return;
    if (active < 7) navTo(active + 1);else
    {if (validateAll()) onActivate(form);}
  };

  const handleBack = () => {if (active > 1) navTo(active - 1);};

  const pct = calcCompletion(form, visited);
  const isLast = active === 7;
  const allReq = !!(form.faretypeCode && form.faretypeGroup && form.source && form.cancellationPolicy && form.depositPolicy);

  const renderSection = () => {
    if (active === 1) return <S1 form={form} set={set} errors={errors} mode={mode} editData={editData} />;
    if (active === 2) return <S2 form={form} set={set} errors={errors} policies={policies} />;
    if (active === 3) return <S3 form={form} set={set} />;
    if (active === 4) return <S4 form={form} set={set} />;
    if (active === 5) return <S5 form={form} set={set} />;
    if (active === 6) return <S6 form={form} setForm={setForm} />;
    if (active === 7) return <S7 diff={diffForm(JSON.parse(initRef.current), form)} demo={DEMO_DIFF} farecodes={mode === 'edit' ? [...checkedFc] : []} code={form.faretypeCode} onNav={navTo} />;
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 400, opacity: mounted ? 1 : 0, transition: 'opacity 220ms ease-out' }} />
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 780, maxWidth: '100%', background: '#fff', zIndex: 401, display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 48px rgba(15,23,42,0.2)', transform: mounted ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 220ms ease-out' }}>

        {/* Header */}
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: `1px solid ${T.line}`, flexShrink: 0, background: '#fff' }}>
          <span style={{ fontSize: 15.5, fontWeight: 700, color: T.ink }}>
            {mode === 'create' ? 'Configure New Faretype Template' : `Edit Faretype · ${editData?.code}`}
          </span>
          <button onClick={handleClose}
          style={{ width: 32, height: 32, borderRadius: 7, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkFaint }}
          onMouseEnter={(e) => {e.currentTarget.style.background = T.fill;e.currentTarget.style.color = T.ink;}}
          onMouseLeave={(e) => {e.currentTarget.style.background = 'none';e.currentTarget.style.color = T.inkFaint;}}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <PanelNav active={active} onNav={navTo} form={form} errors={errors} visited={visited} pct={pct} />

          {/* Content */}
          <div className="pscroll" style={{ flex: 1, overflowY: 'auto', padding: '32px 36px', background: '#fff' }}>
            {mode === 'edit' && active === 1 &&
            <div style={{ marginBottom: 22 }}>
                <WarnBanner>
                  <div style={{ fontSize: 12.5, color: T.amberDark, lineHeight: 1.45 }}>
                    Editing this faretype will update inherited values on linked farecodes. Select which farecodes should receive these changes before saving.
                  </div>
                  <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
                    <button onClick={() => setFcOpen((p) => !p)}
                  style={{ padding: '5px 12px', border: `1px solid ${T.amberBorder}`, borderRadius: 6, background: '#fff', color: T.amberDark, fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                      Select farecodes ▾
                    </button>
                    {fcOpen && <FcChecklist checked={checkedFc} onChange={setCheckedFc} onClose={() => setFcOpen(false)} />}
                  </div>
                </WarnBanner>
              </div>
            }
            {renderSection()}
            <div style={{ height: 6 }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 24px', borderTop: `1px solid ${T.line}`, flexShrink: 0, background: '#fff' }}>
          {/* Back + Next/Finish */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={handleBack} disabled={active === 1}
            style={{ background: 'none', border: 'none', color: active === 1 ? '#C8D5E0' : T.inkSoft, fontSize: 11.5, cursor: active === 1 ? 'default' : 'pointer', fontWeight: 700, letterSpacing: '.7px', textTransform: 'uppercase', padding: '8px 16px' }}>
              Back
            </button>
            <button onClick={handleNext}
            disabled={isLast && mode === 'create' && !allReq}
            title={isLast && !allReq && mode === 'create' ? 'Complete all required fields to activate' : ''}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: isLast && mode === 'create' && !allReq ? '#C8D5E0' : T.primary, color: '#fff', border: 'none', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: isLast && mode === 'create' && !allReq ? 'not-allowed' : 'pointer', letterSpacing: '.7px', textTransform: 'uppercase', transition: 'background .2s' }}
            onMouseEnter={(e) => {if (!e.currentTarget.disabled) e.currentTarget.style.opacity = '.88';}}
            onMouseLeave={(e) => {e.currentTarget.style.opacity = '1';}}>
              {isLast ?
              mode === 'create' ? 'Activate Faretype' : 'Save Changes' :
              'Next Step'}
              {!isLast &&
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
              }
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
function FaretypeTable({ rows, selected, onToggleRow, onToggleAll, sortCol, sortDir, onSort, onViewDetail }) {
  const cell = (row, key) => {
    if (key === 'code') return <span style={{ fontFamily: "'SF Mono',Menlo,monospace", fontSize: 12.5, fontWeight: 700, color: T.tealDark }}>{row.code}</span>;
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
    emptyTitle="No faretypes match your filters" />);

}

/* ── Faretype Detail Panel ─────────────────── */

const FTYPE_DETAIL = {
  'FT-00101': {
    ftId: '00101', cancellation: 'Standard Cancellation', deposit: '5 Night Standard Deposit',
    residency: 'Any', minAge: 18, minOcc: '—', maxOcc: '—', advPurchase: '—', boardingPass: '—',
    standby: false, upgrade: true, coupon: true,
    channels: [
    { k: 'MVAS B2C', on: true }, { k: 'MVAS B2B', on: true }, { k: 'Cruise Control', on: true },
    { k: 'Trade API', on: false }, { k: 'CRM', on: true }, { k: 'Group', on: false }, { k: 'Internal', on: false }],

    ccAccess: true, channelPartners: null, mktEmpty: true,
    waiveGov: false, waiveCruise: false, noFareDisplay: false,
    supps: [
    { title: 'Complementary Onboard Supplement', type: 'comp', enabled: true, sName: 'Drinks Package', cabin: 'All', rule: 'Booking', max: 1, farePos: 1 },
    { title: 'Complementary Onshore Supplement', type: 'comp', enabled: false },
    { title: 'Paid Onboard Supplement', type: 'paid', enabled: false },
    { title: 'Paid Onshore Supplement', type: 'paid', enabled: false }]

  },
  'FT-00102': {
    ftId: '00102', cancellation: 'Non-Refundable', deposit: '5 Night Standard Deposit',
    residency: 'Any', minAge: 18, minOcc: '2', maxOcc: '4', advPurchase: '30', boardingPass: 'NONEND',
    standby: false, upgrade: false, coupon: false,
    channels: [
    { k: 'MVAS B2C', on: true }, { k: 'MVAS B2B', on: false }, { k: 'Cruise Control', on: true },
    { k: 'Trade API', on: true }, { k: 'CRM', on: true }, { k: 'Group', on: false }, { k: 'Internal', on: false }],

    ccAccess: true, channelPartners: null, mktEmpty: false, discountMsg: 'Save 20% — Non-refundable promo rate. Limited sailings.', offerPrimary: 'OFFER-2026-SPRING',
    waiveGov: false, waiveCruise: false, noFareDisplay: false,
    supps: [
    { title: 'Complementary Onboard Supplement', type: 'comp', enabled: false },
    { title: 'Complementary Onshore Supplement', type: 'comp', enabled: false },
    { title: 'Paid Onboard Supplement', type: 'paid', enabled: false },
    { title: 'Paid Onshore Supplement', type: 'paid', enabled: false }]

  }
};

function getDtl(code) {
  return FTYPE_DETAIL[code] || {
    ftId: code.replace('FT-', ''), cancellation: 'Standard Cancellation', deposit: '5 Night Standard Deposit',
    residency: 'Any', minAge: 18, minOcc: '—', maxOcc: '—', advPurchase: '—', boardingPass: '—',
    standby: false, upgrade: true, coupon: true,
    channels: [
    { k: 'MVAS B2C', on: true }, { k: 'MVAS B2B', on: true }, { k: 'Cruise Control', on: true },
    { k: 'Trade API', on: false }, { k: 'CRM', on: true }, { k: 'Group', on: false }, { k: 'Internal', on: false }],

    ccAccess: true, channelPartners: null, mktEmpty: true,
    waiveGov: false, waiveCruise: false, noFareDisplay: false,
    supps: [
    { title: 'Complementary Onboard Supplement', type: 'comp', enabled: false },
    { title: 'Complementary Onshore Supplement', type: 'comp', enabled: false },
    { title: 'Paid Onboard Supplement', type: 'paid', enabled: false },
    { title: 'Paid Onshore Supplement', type: 'paid', enabled: false }]

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
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.inkSoft, background: '#F1F5F9', padding: '3px 7px', borderRadius: 5, letterSpacing: '.3px' }}>{String(num).padStart(2, '0')}</span>
        <span style={{ fontSize: 14.5, fontWeight: 700, color: T.ink }}>{title}</span>
      </div>
      <div style={{ borderTop: '1px solid #F1F5F9', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </div>);
}
function RField({ label, value, locked, mono }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
        <span style={{ fontSize: 9.5, fontWeight: 700, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '.7px' }}>{label}</span>
        {locked && <LockIc />}
      </div>
      <div style={{ padding: '9px 12px', background: '#F8FAFC', border: '1px solid #E8EDF3', borderRadius: 7, fontSize: 13, color: T.ink, fontFamily: mono ? "'SF Mono', Menlo, monospace" : 'inherit' }}>
        {value || <span style={{ color: T.inkFaint, fontStyle: 'italic' }}>—</span>}
      </div>
    </div>);
}
function FRow({ label, subtitle, on, locked }) {
  return (
    <div style={{ border: '1px solid #E8EDF3', borderRadius: 8, padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.ink }}>{label}</div>
        {subtitle && <div style={{ fontSize: 11.5, color: T.teal, marginTop: 2 }}>{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {locked && <LockIc />}
        <span style={{ fontSize: 13, fontWeight: 700, color: on ? T.teal : T.inkSoft }}>{on ? 'Enabled' : 'Disabled'}</span>
      </div>
    </div>);
}



function DetailOverviewTab({ row, detail, policies }) {
  const vis = detail.channels.filter((c) => c.on).map((c) => c.k);
  const hid = detail.channels.filter((c) => !c.on).map((c) => c.k);
  const activeSupps = detail.supps.filter((s) => s.enabled);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* 01 Basics & Grouping */}
      <SCard num={1} title="Basics & Grouping">
        <div style={{ display: 'flex', gap: 14 }}>
          <RField label="Faretype Code" value={row.code} mono />
          <RField label="Farebasis Code" value={row.basis} mono />
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <RField label="Group" value={row.group} />
          <RField label="Source Channel" value={row.source} />
        </div>
      </SCard>

      {/* 02 Policies */}
      <SCard num={2} title="Policies">
        <div style={{ display: 'flex', gap: 14 }}>
          <RField label="Cancellation Policy" value={polLabel(policies, 'cancel', detail.cancellation)} mono />
          <RField label="Deposit Policy" value={polLabel(policies, 'deposit', detail.deposit)} mono />
        </div>
      </SCard>

      {/* 03 Eligibility */}
      <SCard num={3} title="Eligibility">
        <div style={{ display: 'flex', gap: 14 }}>
          <RField label="Residency" value={detail.residency} locked />
          <RField label="Min Age" value={detail.minAge ? String(detail.minAge) : null} locked />
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <RField label="Min Occupancy" value={detail.minOcc !== '—' ? detail.minOcc : null} locked />
          <RField label="Max Occupancy" value={detail.maxOcc !== '—' ? detail.maxOcc : null} locked />
        </div>
        <RField label="Advanced Purchase" value={detail.advPurchase !== '—' ? `${detail.advPurchase} days` : null} locked />
        <FRow label="Standby Eligible" subtitle="Allow standby booking." on={detail.standby} locked />
        <FRow label="Upgrade Eligible" subtitle="Allow cabin upgrades." on={detail.upgrade} locked />
        <FRow label="Coupon Eligible" subtitle="Allow coupon codes." on={detail.coupon} locked />
      </SCard>

      {/* 04 Channels & Access */}
      <SCard num={4} title="Channels & Access">
        <FRow label="Show in Cruise Control" subtitle="Internal CRM booking visibility." on={detail.ccAccess} locked />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: T.inkFaint, textTransform: 'uppercase', letterSpacing: '.7px' }}>Distribution Channels</span>
            <LockIc />
          </div>
          <div style={{ padding: '9px 12px', background: '#F8FAFC', border: '1px solid #E8EDF3', borderRadius: 7, fontSize: 13, color: T.ink }}>
            {vis.length ? vis.join(', ') : <span style={{ color: T.inkFaint, fontStyle: 'italic' }}>None</span>}
          </div>
          <div style={{ marginTop: 7, fontSize: 12, color: T.inkSoft, lineHeight: 1.5 }}>
            <span style={{ fontWeight: 600 }}>Visible:</span> <span style={{ color: T.teal }}>{vis.length ? vis.join(', ') : 'None'}</span>
            <span style={{ margin: '0 6px', color: T.inkFaint }}>·</span>
            <span style={{ fontWeight: 600 }}>Hidden:</span> {hid.length ? hid.join(', ') : 'None'}
          </div>
        </div>
      </SCard>

      {/* 05 Supplements (if active) */}
      {activeSupps.length > 0 &&
        <SCard num={5} title="Supplements">
          {activeSupps.map((s, i) =>
            <div key={i} style={{ border: '1px solid #E8EDF3', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#FAFBFC', borderBottom: '1px solid #E8EDF3' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{s.title}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, background: s.type === 'comp' ? T.tealLight : T.fill, color: s.type === 'comp' ? T.tealDark : T.inkSoft }}>{s.type === 'comp' ? 'Comp' : 'Paid'}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: T.teal }}>Enabled</span>
              </div>
              <div style={{ padding: '12px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
                {[['Name', s.sName], ['Cabin', s.cabin], ['Rule', s.rule], ['Max Count', s.max], ['Fare Position', s.farePos]].map(([l, v]) =>
                  <div key={l}><DLbl>{l}</DLbl><div style={{ fontSize: 13, color: T.ink, marginTop: 3 }}>{v}</div></div>
                )}
              </div>
            </div>
          )}
        </SCard>
      }
    </div>);

}

const FC_SAMPLE = [
{ id: 'FC-20101', ship: 'Island Escape', sailing: 'IS-2026-09-01', cabins: ['Interior', 'Balcony'], status: 'Active', mod: '12 Jun 2026' },
{ id: 'FC-20102', ship: 'Island Escape', sailing: 'IS-2026-10-15', cabins: ['Ocean View'], status: 'Active', mod: '10 Jun 2026' },
{ id: 'FC-20103', ship: 'Island Escape', sailing: 'IS-2026-11-20', cabins: ['Interior', 'Suite'], status: 'Active', mod: '08 Jun 2026' }];

function DetailFarecodesTab({ fcCount }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, color: T.inkSoft }}>Showing 3 of {fcCount} farecodes</span>
        <button onClick={() => alert('Open add farecode panel')}
        style={{ padding: '7px 14px', border: `1px solid ${T.line}`, borderRadius: 7, background: '#fff',
          color: T.ink, fontSize: 12.5, cursor: 'pointer', fontWeight: 500 }}>+ Add Farecode</button>
      </div>
      {FC_SAMPLE.map((fc) =>
      <div key={fc.id} style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
        padding: '14px 18px', boxShadow: '0 1px 3px rgba(15,23,42,.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: "'SF Mono',Menlo,monospace", fontSize: 13, fontWeight: 700, color: T.teal, cursor: 'pointer' }}
          onClick={() => alert(`Navigate to farecode: ${fc.id}`)}>
            {fc.id}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge status={fc.status} />
              <span style={{ color: T.teal, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            onClick={() => alert(`Navigate to farecode: ${fc.id}`)}>View →</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            <div><DLbl>Ship</DLbl><div style={{ fontSize: 13, color: T.ink }}>{fc.ship}</div></div>
            <div><DLbl>Sailing</DLbl><div style={{ fontSize: 13, color: T.ink, fontFamily: "'SF Mono',Menlo,monospace" }}>{fc.sailing}</div></div>
            <div>
              <DLbl>Cabin Categories</DLbl>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 3 }}>
                {fc.cabins.map((c) =>
              <span key={c} style={{ padding: '2px 9px', borderRadius: 5, fontSize: 11.5, fontWeight: 500,
                background: '#EEF2FF', color: '#4338CA' }}>{c}</span>
              )}
              </div>
            </div>
            <div><DLbl>Last Modified</DLbl><div style={{ fontSize: 13, color: T.inkSoft }}>{fc.mod}</div></div>
          </div>
        </div>
      )}
      <div style={{ textAlign: 'center', paddingTop: 6 }}>
        <span style={{ color: T.teal, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
        onClick={() => alert('View all farecodes for FT-00101')}>
          View all {fcCount} farecodes →
        </span>
      </div>
    </div>);

}

const AUDIT_LOG = [
{ type: 'teal', summary: 'Faretype activated', detail: 'Status: Draft → Active', time: '14 Jun 2026, 11:42 AM', user: 'jane.doe@' },
{ type: 'amber', summary: 'Cancellation Policy updated', detail: 'Standard → Flexible', time: '12 Jun 2026, 3:15 PM', user: 'jane.doe@' },
{ type: 'amber', summary: 'Channels updated', detail: 'Trade API: Disabled → Enabled', time: '10 Jun 2026, 9:08 AM', user: 'admin@' },
{ type: 'amber', summary: 'Supplement configured', detail: 'Complementary Onboard enabled', time: '08 Jun 2026, 2:30 PM', user: 'jane.doe@' },
{ type: 'teal', summary: 'Faretype created', detail: 'Draft record created', time: '07 Jun 2026, 10:00 AM', user: 'jane.doe@' }];

function DetailAuditTab() {
  const dotC = { teal: T.teal, amber: T.amber, red: T.red };
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
      boxShadow: '0 1px 3px rgba(15,23,42,.04)', overflow: 'hidden' }}>
      {AUDIT_LOG.map((e, i) =>
      <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 18px',
        borderBottom: i < AUDIT_LOG.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
          <div style={{ paddingTop: 5, flexShrink: 0 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotC[e.type] }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 3 }}>{e.summary}</div>
            <div style={{ fontSize: 12, color: T.inkSoft }}>{e.detail}</div>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 11.5, color: T.inkSoft, whiteSpace: 'nowrap' }}>{e.time}</div>
            <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 2 }}>{e.user}</div>
          </div>
        </div>
      )}
    </div>);

}

function FaretypeDetailPanel({ row, onClose, onEdit, onToggleStatus, policies }) {
  const [tab, setTab] = useState('overview');
  const [mounted, setMounted] = useState(false);
  const detail = getDtl(row.code);
  const isActive = row.status === 'Active';

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
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 720, maxWidth: '100%',
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
              <button onClick={() => onToggleStatus(row)}
              style={{ padding: '7px 14px', border: `1.5px solid ${isActive ? '#FCA5A5' : '#A7F3D0'}`, borderRadius: 7, background: '#fff', fontSize: 13, fontWeight: 600, color: isActive ? T.red : T.tealDark, cursor: 'pointer', whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => e.currentTarget.style.background = isActive ? T.redLight : T.tealLight}
              onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}>
                {isActive ? 'Deactivate' : 'Activate'}
              </button>
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
          {tab === 'overview' && <DetailOverviewTab row={row} detail={detail} policies={policies} />}
          {tab === 'farecodes' && <DetailFarecodesTab fcCount={row.fc} />}
          {tab === 'audit' && <DetailAuditTab />}
        </div>
      </div>
    </>);

}

/* ── App ────────────────────────────────────── */
function FaretypeListScreen({ policies }) {
  const [data, setData] = useState(INIT_ROWS);
  const [search, setSearch] = useState('');
  const [groupF, setGroupF] = useState('All Groups');
  const [sourceF, setSourceF] = useState('All Sources');
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState('create');
  const [editData, setEditData] = useState(null);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);
  const nextId = useRef(9);

  let rows = data.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q && !r.code.toLowerCase().includes(q) && !r.basis.toLowerCase().includes(q)) return false;
    if (groupF !== 'All Groups' && r.group !== groupF) return false;
    if (sourceF !== 'All Sources' && r.source !== sourceF) return false;
    return true;
  });
  if (sortCol) rows = [...rows].sort((a, b) => {
    const av = a[sortCol],bv = b[sortCol];
    const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [search, groupF, sourceF]);

  const hasFilter = search || groupF !== 'All Groups' || sourceF !== 'All Sources';
  const handleSort = (col) => {if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');else {setSortCol(col);setSortDir('asc');}};
  const toggleRow = (id) => setSelected((p) => {const n = new Set(p);n.has(id) ? n.delete(id) : n.add(id);return n;});
  const toggleAll = (vr) => {
    const all = vr.every((r) => selected.has(r.id));
    setSelected((p) => {const n = new Set(p);vr.forEach((r) => all ? n.delete(r.id) : n.add(r.id));return n;});
  };
  const toggleStatus = (id) => setData((p) => p.map((r) => r.id === id ? { ...r, status: r.status === 'Active' ? 'Inactive' : 'Active' } : r));
  /* Activating is low-risk and stays instant. Deactivating removes the faretype from
     assignment pickers, so it routes through a confirmation instead of firing immediately. */
  const handleToggleStatus = (row) => {
    if (row.status === 'Active') {setPendingDeactivate(row);return;}
    toggleStatus(row.id);
    if (panelMode === 'detail' && editData && editData.id === row.id) closePanel();
  };
  const confirmDeactivate = () => {
    if (pendingDeactivate) {
      toggleStatus(pendingDeactivate.id);
      if (panelMode === 'detail' && editData && editData.id === pendingDeactivate.id) closePanel();
    }
    setPendingDeactivate(null);
  };
  const cancelDeactivate = () => setPendingDeactivate(null);
  const openCreate = () => {setPanelMode('create');setEditData(null);setPanelOpen(true);};
  const openDetail = (row) => {setPanelMode('detail');setEditData(row);setPanelOpen(true);};
  const closePanel = () => setPanelOpen(false);
  const TODAY = '18 Jun 2026';

  const handleSaveDraft = (form) => {
    if (panelMode === 'edit' && editData) {
      setData((p) => p.map((r) => r.id === editData.id ? { ...r, code: form.faretypeCode, basis: form.fareBasisCode || r.basis, group: form.faretypeGroup || r.group, source: form.source || r.source, status: 'Draft', mod: TODAY } : r));
    } else {
      const id = nextId.current++;
      setData((p) => [...p, { id, code: `FT-${String(id).padStart(5, '0')}`, basis: form.fareBasisCode || '—', group: form.faretypeGroup || 'Core', source: form.source || 'WC', fc: 0, status: 'Draft', mod: TODAY }]);
    }
    closePanel();
  };

  const handleActivate = (form) => {
    if (!form.faretypeCode || !form.faretypeGroup || !form.source || !form.cancellationPolicy || !form.depositPolicy) return;
    if (panelMode === 'edit' && editData) {
      setData((p) => p.map((r) => r.id === editData.id ? { ...r, code: form.faretypeCode, basis: form.fareBasisCode || r.basis, group: form.faretypeGroup, source: form.source, status: 'Active', mod: TODAY } : r));
    } else {
      const id = nextId.current++;
      setData((p) => [...p, { id, code: `FT-${String(id).padStart(5, '0')}`, basis: form.fareBasisCode || '—', group: form.faretypeGroup, source: form.source, fc: 0, status: 'Active', mod: TODAY }]);
    }
    closePanel();
  };

  const bulkActivate = () => {setData((p) => p.map((r) => selected.has(r.id) ? { ...r, status: 'Active' } : r));setSelected(new Set());};
  const bulkDeactivate = () => {setData((p) => p.map((r) => selected.has(r.id) ? { ...r, status: 'Inactive' } : r));setSelected(new Set());};

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
              <div style={{ fontSize: 13, color: T.inkSoft }}>Configure systemic fare rules, parent templates, and dynamic inheritance policies.</div>
            </div>
            <button onClick={openCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: T.primary, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 2px 6px rgba(27,36,52,.2)' }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '.88'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
              + New Template
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '0 28px 28px', display: 'flex', flexDirection: 'column' }}>
          <ListCard>
            <ListToolbar>
              <FilterRow>
                <ListSearch value={search} onChange={setSearch} placeholder="Filter by code, basis, group name…" />
                <SelectFilter value={groupF} onChange={setGroupF} options={['All Groups', 'Core', 'Interline', 'Brochure', 'Non-Refundable']} />
                <SelectFilter value={sourceF} onChange={setSourceF} options={['All Sources', 'WC', 'Casino', 'Partner', 'YM']} />
                {hasFilter && <ClearFilters onClick={() => {setSearch('');setGroupF('All Groups');setSourceF('All Sources');}} />}
                <ResultCount>{rows.length} of {data.length} faretypes</ResultCount>
              </FilterRow>
            </ListToolbar>

            <FaretypeTable rows={pageRows}
            sortCol={sortCol} sortDir={sortDir} onSort={handleSort} onViewDetail={openDetail} />

            <ListPager page={page} setPage={setPage} total={rows.length} pageSize={PAGE_SIZE} noun="faretypes" />
          </ListCard>
        </div>
      </div>

      {panelOpen && panelMode === 'detail' &&
      <FaretypeDetailPanel
        row={editData}
        onClose={closePanel}
        onEdit={() => setPanelMode('edit')}
        onToggleStatus={handleToggleStatus}
        policies={policies} />

      }
      {panelOpen && panelMode !== 'detail' &&
      <FaretypePanel mode={panelMode} editData={editData} policies={policies} onClose={closePanel} onSaveDraft={handleSaveDraft} onActivate={handleActivate} />
      }

      {pendingDeactivate &&
      <Modal title="Deactivate this faretype?" icon={<IcWarn color={T.amber} />} onClose={cancelDeactivate}
      actions={<>
            <button style={polGhost} onClick={cancelDeactivate}>Cancel</button>
            <button style={{ ...polBtn, background: T.red, color: '#fff' }} onClick={confirmDeactivate}>Deactivate</button>
          </>}>

          Deactivating <strong style={{ fontFamily: "'SF Mono',Menlo,monospace" }}>{pendingDeactivate.code}</strong> removes
          it from Faretype pickers, so it can no longer be assigned to new bookings.
          {pendingDeactivate.fc > 0 ?
        <> It's currently linked to <strong>{pendingDeactivate.fc}</strong> Farecode{pendingDeactivate.fc === 1 ? '' : 's'}, which will keep working under their existing terms.</> :

        <> It isn't linked to any Farecodes yet.</>
        }
          {' '}You can reactivate it at any time.
        </Modal>
      }
    </>);

}


Object.assign(window, { FaretypeListScreen });
})();
