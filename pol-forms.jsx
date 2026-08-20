// pol-forms.jsx — row atoms + inline Group/Parent forms shared by edit mode and the guided creation flow.
const { useState: useSFm } = React;

function PolStatusBadge({ status }) {
  const s = POL_STATUS[status] || POL_STATUS.Inactive;
  return (<span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 9px', borderRadius:999, fontSize:11.5, fontWeight:600, background:s.bg, color:s.color, whiteSpace:'nowrap' }}><span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }}/>{status}</span>);
}
function TypeBadge({ type }) {
  const m = POL_META[type];
  return <span style={{ display:'inline-flex', padding:'3px 9px', borderRadius:999, fontSize:11.5, fontWeight:600, background:m.badgeBg, color:m.badgeColor, whiteSpace:'nowrap' }}>{m.label}</span>;
}
function Caret({ open, onClick, hidden }) {
  if (hidden) return <span style={{ width:16, display:'inline-block' }}/>;
  return (
    <button onClick={e => { e.stopPropagation(); onClick(); }} style={{ width:16, height:16, padding:0, border:'none', background:'none', cursor:'pointer', color:T.inkSoft, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" style={{ transform:open ? 'rotate(0deg)' : 'rotate(-90deg)', transition:'transform .15s' }}><path d="M1 2.5h8L5 8z"/></svg>
    </button>
  );
}
const Stem = () => <span style={{ width:13, height:1, background:'#CBD5E1', flexShrink:0 }}/>;

function StepPill({ n }) {
  return <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 9px', borderRadius:5, background:T.primary, color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'.7px', textTransform:'uppercase' }}>Step {n} of 3</span>;
}
function FormBar({ label, right, children, depth = 0, tone = 'edit' }) {
  return (
    <div style={{ marginLeft:depth * 22, borderLeft:`2px solid ${tone === 'flow' ? T.primary : '#CBD5E1'}`, background:tone === 'flow' ? '#F7F9FC' : '#FAFBFC', padding:'14px 18px 16px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>{label}</div>
        {right}
      </div>
      {children}
    </div>
  );
}
function ToggleRow({ label, help, on, onChange, dis }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, minWidth:200 }}>
      <div>
        <div style={{ fontSize:12.5, fontWeight:600, color:dis ? T.inkFaint : T.ink }}>{label}</div>
        {help && <div style={{ fontSize:11, color:T.inkFaint, lineHeight:1.45, marginTop:1, maxWidth:230 }}>{help}</div>}
      </div>
      <div style={{ paddingTop:1, flexShrink:0 }}><Toggle on={on} onChange={onChange} dis={dis}/></div>
    </div>
  );
}
function TextField({ label, value, onChange, placeholder, error, helper, width }) {
  return (
    <div style={{ width:width || '100%', maxWidth:'100%' }}>
      <Field label={label} required error={error} helper={helper}>
        <input className="fi" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={iS(error)}/>
      </Field>
    </div>
  );
}

/* 1.3 Group fields */
function GroupFields({ type, form, set, err, canActivate }) {
  const isCan = type === 'cancel';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <TextField label={isCan ? 'Cancellation group name' : 'Deposit group name'} value={form.name} onChange={v => set({ name:v })} error={err?.name}
        placeholder={isCan ? 'e.g. Standard' : 'e.g. IS 5-Night Retail Std'} helper="Unique among active groups of this type."/>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <ToggleRow label="Active" on={form.active} dis={!canActivate} onChange={v => set({ active:v })}
          help={canActivate ? 'Available for assignment on Faretypes and Farecodes.' : 'Needs at least one active policy inside the group.'}/>
        <ToggleRow label="Default group" on={form.isDefault} onChange={v => set({ isDefault:v })} help="Only one group per type can be the default."/>
        {isCan && <ToggleRow label="Refundable" on={form.refundable} onChange={v => set({ refundable:v })} help="Turning this off requires every band to charge a percentage of cabin fare or the full deposit."/>}
      </div>
    </div>
  );
}

/* 1.4 Parent fields */
function ParentFields({ type, form, set, err, canActivate, activateHelp }) {
  const isCan = type === 'cancel';
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <TextField label={isCan ? 'Cancellation policy name' : 'Deposit policy name'} value={form.name} onChange={v => set({ name:v })} error={err?.name}
        placeholder={isCan ? 'e.g. Standard Cancellation' : 'e.g. 5 Night Standard Deposit'}/>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <ToggleRow label="Active" on={form.active} dis={!canActivate} onChange={v => set({ active:v })} help={canActivate ? 'Assignable on Farecodes.' : activateHelp}/>
        <ToggleRow label="Default in group" on={form.isDefault} onChange={v => set({ isDefault:v })} help="Used when a Farecode leaves the policy unset."/>
        {isCan && <ToggleRow label="Refundable" on={form.refundable} onChange={v => set({ refundable:v })} help="Scoped to this policy; same consistency check as the group."/>}
      </div>
    </div>
  );
}

function IssueList({ issues, title }) {
  if (!issues.length) return null;
  return (
    <Banner level="error" title={title || 'Resolve before activating'}>
      <ul style={{ margin:0, paddingLeft:16, display:'flex', flexDirection:'column', gap:3 }}>
        {issues.map((it, i) => <li key={i}>{it.text}</li>)}
      </ul>
    </Banner>
  );
}

const polBtn = { padding:'8px 15px', borderRadius:7, fontSize:12.5, fontWeight:600, cursor:'pointer', border:'none' };
const polGhost = { ...polBtn, background:'#fff', border:`1px solid ${T.line}`, color:T.ink };
const polDark = { ...polBtn, background:T.primary, color:'#fff' };
function ActionRow({ left, children }) {
  return <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:14, paddingTop:13, borderTop:`1px solid ${T.line}` }}>{left}<div style={{ marginLeft:'auto', display:'flex', gap:8 }}>{children}</div></div>;
}

/* Tree connectors — one 22px slot per depth level, drawn as an absolute layer inside a relative cell. */
const RAIL = '#CBD5E1';
/* marks: [{ x, kind:'line'|'tee'|'end'|'empty', w }] — x is the parent caret's centre, so every
   spine drops straight out of the toggle it belongs to. */
function Rails({ marks }) {
  return (
    <span style={{ position:'absolute', inset:0, pointerEvents:'none' }}>
      {marks.map((m, i) => (
        <React.Fragment key={i}>
          {(m.kind === 'line' || m.kind === 'tee') && <span style={{ position:'absolute', left:m.x, top:0, bottom:0, width:1, background:RAIL }}/>}
          {m.kind === 'tee' && <span style={{ position:'absolute', left:m.x, top:'50%', width:m.w || 14, height:1, background:RAIL }}/>}
          {m.kind === 'end' && <span style={{ position:'absolute', left:m.x, top:0, height:'50%', width:m.w || 14, borderLeft:`1px solid ${RAIL}`, borderBottom:`1px solid ${RAIL}`, borderBottomLeftRadius:7 }}/>}
        </React.Fragment>
      ))}
    </span>
  );
}
/* Shared tree geometry: caret centres per depth, and the content indent that follows them. */
const TREE = { caret:[12, 48], pad:[4, 40, 62] };
/* LevelChip (Group/Policy/Line pill) was removed from the tree table — indentation, row
   shading, and CodeChip's own per-level style already say which tier a row is at. */
function CodeChip({ level, children }) {
  const s = level === 'group' ? { background:'#EDF1F6', color:T.ink, fontSize:11.5, padding:'3px 8px', border:'1px solid transparent' }
    : level === 'policy' ? { background:'#fff', color:T.tealDark, fontSize:11, padding:'2px 7px', border:`1px solid ${T.line}` }
    : { background:'transparent', color:T.inkFaint, fontSize:11, padding:'2px 0', border:'1px solid transparent' };
  return <span style={{ ...s, fontFamily:MONO, fontWeight:700, borderRadius:5, whiteSpace:'nowrap', letterSpacing:'-.2px' }}>{children}</span>;
}

Object.assign(window, { PolStatusBadge, TypeBadge, Caret, Stem, Rails, TREE, CodeChip, StepPill, FormBar, ToggleRow, TextField, GroupFields, ParentFields, IssueList, polBtn, polGhost, polDark, ActionRow });
