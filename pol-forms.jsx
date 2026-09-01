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
function Caret({ open, onClick, hidden, label = 'row' }) {
  if (hidden) return <span style={{ width:16, display:'inline-block' }}/>;
  return (
    <button type="button" aria-label={`${open ? 'Collapse' : 'Expand'} ${label}`} aria-expanded={open} onClick={e => { e.stopPropagation(); onClick(); }} style={{ width:16, height:16, padding:0, border:'none', background:'none', cursor:'pointer', color:T.inkSoft, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" style={{ transform:open ? 'rotate(0deg)' : 'rotate(-90deg)', transition:'transform .15s' }}><path d="M1 2.5h8L5 8z"/></svg>
    </button>
  );
}
const Stem = () => <span style={{ width:13, height:1, background:'#CBD5E1', flexShrink:0 }}/>;

function StepPill({ n }) {
  return <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 9px', borderRadius:5, background:T.primary, color:'#fff', fontSize:10, fontWeight:700, letterSpacing:'.7px', textTransform:'uppercase' }}>Step {n} of 2</span>;
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
      <div style={{ paddingTop:1, flexShrink:0 }}><Toggle on={on} onChange={onChange} dis={dis} label={label}/></div>
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
function GroupSettingRow({ label, help, on, onChange, dis, stateLabel, disabledLabel = 'Requires policy', first }) {
  const state = dis ? disabledLabel : stateLabel || (on ? 'On' : 'Off');
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:18, padding:'13px 14px', borderTop:first ? 'none' : `1px solid ${T.lineSoft}`, background:dis ? T.fill : '#fff' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
          <span style={{ fontSize:12.5, fontWeight:700, color:dis ? T.inkSoft : T.ink }}>{label}</span>
          {dis && (
            <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 7px', borderRadius:999, background:'#fff', border:`1px solid ${T.line}`, color:T.inkSoft, fontSize:9.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'.45px' }}>
              <svg aria-hidden="true" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              Locked
            </span>
          )}
        </div>
        {help && <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.45, marginTop:3, maxWidth:360 }}>{help}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
        <span style={{ minWidth:76, textAlign:'right', fontSize:10.5, fontWeight:700, color:on && !dis ? T.primary : T.inkSoft }}>{state}</span>
        <Toggle on={on} onChange={onChange} dis={dis} label={label}/>
      </div>
    </div>
  );
}

function GroupFields({ type, form, set, err, canActivate, step }) {
  const isCan = type === 'cancel';
  const uid = React.useId().replace(/:/g, '');
  const titleId = `group-details-${uid}`;
  const typeLabel = isCan ? 'Cancellation policies' : 'Deposit policies';
  return (
    <section aria-labelledby={titleId} style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.06)', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        {step && <span aria-hidden="true" style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>{step}</span>}
        <div style={{ minWidth:0 }}>
          <h3 id={titleId} style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Group details</h3>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Define the reusable container that keeps related {isCan ? 'cancellation' : 'deposit'} policies together.</p>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:16, padding:'16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:8, background:T.primaryBg, border:`1px solid ${T.primaryLine}` }}>
          <span aria-hidden="true" style={{ width:28, height:28, borderRadius:7, background:'#fff', border:`1px solid ${T.primaryLine}`, color:T.primary, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
          </span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Policy type</div>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.ink, marginTop:1 }}>{typeLabel}</div>
          </div>
          <span style={{ padding:'3px 8px', borderRadius:999, background:'#fff', border:`1px solid ${T.primaryLine}`, color:T.inkSoft, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>Fixed after creation</span>
        </div>

        <div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Group identity</div>
            <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.45, marginTop:3 }}>Use a clear name that teams can recognize in policy assignment and reporting.</div>
          </div>
          <div style={{ padding:'12px', border:`1px solid ${err?.name ? '#FCA5A5' : T.line}`, borderRadius:8, background:'#fff' }}>
            <TextField label={isCan ? 'Cancellation group name' : 'Deposit group name'} value={form.name} onChange={v => set({ name:v })} error={err?.name}
              placeholder={isCan ? 'e.g. Standard' : 'e.g. IS 5-Night Retail Std'} helper={`Must be unique among active ${isCan ? 'cancellation' : 'deposit'} groups.`}/>
          </div>
        </div>

        {step ? (
          isCan && <div style={{ paddingTop:14, borderTop:`1px solid ${T.lineSoft}` }}>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Policy terms</div>
              <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.45, marginTop:3 }}>Set the commercial terms this group applies to every policy beneath it.</div>
            </div>
            <div style={{ border:`1px solid ${T.line}`, borderRadius:8, overflow:'hidden', background:'#fff' }}>
              <GroupSettingRow first label="Refundable" on={form.refundable} onChange={v => set({ refundable:v })}
                stateLabel={form.refundable ? 'Refundable' : 'Non-refundable'} help="Turning this off requires every band, from booking through sailing, to charge a percentage of cabin fare or the full deposit."/>
            </div>
          </div>
        ) : (
          <div style={{ paddingTop:14, borderTop:`1px solid ${T.lineSoft}` }}>
            <div style={{ marginBottom:10 }}>
              <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Assignment behavior</div>
              <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.45, marginTop:3 }}>Control when this group is available and whether it is selected by default.</div>
            </div>
            <div style={{ border:`1px solid ${T.line}`, borderRadius:8, overflow:'hidden', background:'#fff' }}>
              <GroupSettingRow first label="Active" on={form.active} dis={!canActivate} onChange={v => set({ active:v })}
                stateLabel={form.active ? 'Active' : 'Inactive'} help={canActivate ? 'Available for assignment on Faretypes and Farecodes.' : 'Available after the group contains at least one active policy.'}/>
              <GroupSettingRow label="Default group" on={form.isDefault} onChange={v => set({ isDefault:v })}
                stateLabel={form.isDefault ? 'Default' : 'Not default'} help="Used when a Farecode leaves this policy type unset."/>
              {isCan && <GroupSettingRow label="Refundable" on={form.refundable} onChange={v => set({ refundable:v })}
                stateLabel={form.refundable ? 'Refundable' : 'Non-refundable'} help="Turning this off requires every band to charge a percentage of cabin fare or the full deposit."/>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* 1.4 Parent fields */
function ParentFields({ type, form, set, err, step, context, children }) {
  const isCan = type === 'cancel';
  const uid = React.useId().replace(/:/g, '');
  const titleId = `policy-details-${uid}`;
  const policyType = isCan ? 'cancellation' : 'deposit';
  return (
    <section aria-labelledby={titleId} style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.06)', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        {step && <span aria-hidden="true" style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>{step}</span>}
        <div style={{ minWidth:0 }}>
          <h3 id={titleId} style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Policy details</h3>
          <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Define the assignable {policyType} policy that Farecodes reference. Its ordered {isCan ? 'bands are' : 'milestone lines are'} configured {step ? 'below' : 'with the policy'}.</p>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', padding:'0 16px 16px' }}>
        {context && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', marginTop:14, borderRadius:7, background:T.primaryBg, border:`1px solid ${T.primaryLine}` }}>
            <span aria-hidden="true" style={{ width:26, height:26, borderRadius:6, background:'#fff', border:`1px solid ${T.primaryLine}`, color:T.primary, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h10a2 2 0 0 1 2 2v3"/><path d="M8 18h10a2 2 0 0 0 2-2v-3"/><rect x="3" y="3" width="5" height="6" rx="1"/><rect x="3" y="15" width="5" height="6" rx="1"/></svg>
            </span>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Parent group</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:7, marginTop:2, minWidth:0, flexWrap:'wrap' }}>
                <span style={{ fontSize:12.5, fontWeight:700, color:T.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{context.name || 'Unnamed group'}</span>
                {context.code && <span style={{ fontFamily:MONO, fontSize:10.5, fontWeight:700, color:T.inkSoft }}>{context.code}</span>}
              </div>
            </div>
            {context.onEdit ? (
              <button type="button" onClick={context.onEdit} style={{ padding:'5px 8px', borderRadius:6, border:`1px solid ${T.primaryLine}`, background:'#fff', color:T.primary, fontSize:10.5, fontWeight:700, cursor:'pointer', flexShrink:0 }}>Edit group</button>
            ) : (
              <span style={{ padding:'3px 7px', borderRadius:999, background:'#fff', border:`1px solid ${T.primaryLine}`, color:T.inkSoft, fontSize:9.5, fontWeight:700, whiteSpace:'nowrap' }}>Fixed group</span>
            )}
          </div>
        )}

        <div style={{ padding:'15px 0 16px' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, marginBottom:8 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Policy identity</div>
            <div style={{ fontSize:10.5, color:T.inkFaint, lineHeight:1.35, textAlign:'right' }}>Used in assignment, reporting, and history</div>
          </div>
          <TextField label={isCan ? 'Cancellation policy name' : 'Deposit policy name'} value={form.name} onChange={v => set({ name:v })} error={err?.name}
            placeholder={isCan ? 'e.g. Standard Cancellation' : 'e.g. 5 Night Standard Deposit'}/>
        </div>
        {children}
      </div>
    </section>
  );
}

function ParentAssignmentFields({ type, form, set, canActivate, activateHelp, activationLabel, creation = false, embedded = false }) {
  const isCan = type === 'cancel';
  const policyType = isCan ? 'cancellation' : 'deposit';
  const childName = isCan ? 'band' : 'milestone line';
  const uid = React.useId().replace(/:/g, '');
  const titleId = `policy-assignment-${uid}`;
  const settings = creation ? (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'10px 12px', border:`1px solid ${T.lineSoft}`, borderRadius:8, background:T.fill }}>
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ fontSize:12, fontWeight:700, color:T.ink }}>Use as default {policyType} policy</div>
        <div style={{ marginTop:2, maxWidth:520, color:T.inkSoft, fontSize:10.75, lineHeight:1.4 }}>Applied when a Farecode has no explicit {policyType} policy. Enabling this replaces the current default.</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:9, flexShrink:0 }}>
        <span style={{ minWidth:62, textAlign:'right', fontSize:10.5, fontWeight:700, color:form.isDefault ? T.primary : T.inkSoft }}>{form.isDefault ? 'Default' : 'Optional'}</span>
        <Toggle on={form.isDefault} onChange={v => set({ isDefault:v })} label={`Use as default ${policyType} policy`}/>
      </div>
    </div>
  ) : (
    <div style={{ border:`1px solid ${T.line}`, borderRadius:8, overflow:'hidden', background:'#fff' }}>
            <GroupSettingRow first label="Active" on={form.active} dis={!canActivate} onChange={v => set({ active:v })}
              disabledLabel={activationLabel || `Requires valid ${childName}`} stateLabel={form.active ? 'Active' : 'Inactive'}
              help={canActivate ? 'Available for assignment on Farecodes.' : activateHelp}/>
            <GroupSettingRow label="Default in group" on={form.isDefault} onChange={v => set({ isDefault:v })}
              stateLabel={form.isDefault ? 'Default' : 'Not default'} help="Used when a Farecode leaves this policy unset within the parent group."/>
            {isCan && <GroupSettingRow label="Refundable" on={form.refundable} onChange={v => set({ refundable:v })}
              stateLabel={form.refundable ? 'Refundable' : 'Non-refundable'} help="Applies only to this policy and must remain consistent with its cancellation bands."/>}
    </div>
  );
  const sectionTitle = creation ? 'Default selection' : 'Assignment behavior';
  const heading = (
    <div style={{ marginBottom:8 }}>
      <h4 id={titleId} style={{ fontSize:12.5, fontWeight:700, color:T.ink, margin:'0 0 2px' }}>{sectionTitle}</h4>
      <p style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.45, margin:0 }}>
        {creation ? 'Optional fallback behavior for unassigned Farecodes.' : 'Control availability, default selection, and policy-specific behavior.'}
      </p>
    </div>
  );
  if (embedded) {
    return (
      <div aria-labelledby={titleId} style={{ paddingTop:15, borderTop:`1px solid ${T.lineSoft}` }}>
        {heading}
        {settings}
      </div>
    );
  }
  return (
    <section aria-labelledby={titleId} style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.06)', overflow:'hidden' }}>
      <div style={{ padding:'12px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <h3 id={titleId} style={{ fontSize:14.5, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Assignment behavior</h3>
        <p style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.45, margin:0 }}>
          {creation ? `Choose whether this becomes the fallback ${policyType} policy when a Farecode does not select one.` : 'Control availability, default selection, and policy-specific behavior.'}
        </p>
      </div>
      <div style={{ padding:'14px 16px' }}>
        {settings}
      </div>
    </section>
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
    : level === 'policy' ? { background:'#fff', color:T.primary, fontSize:11, padding:'2px 7px', border:`1px solid ${T.line}` }
    : { background:'transparent', color:T.inkFaint, fontSize:11, padding:'2px 0', border:'1px solid transparent' };
  return <span style={{ ...s, fontFamily:MONO, fontWeight:700, borderRadius:5, whiteSpace:'nowrap', letterSpacing:'-.2px' }}>{children}</span>;
}

Object.assign(window, { PolStatusBadge, TypeBadge, Caret, Stem, Rails, TREE, CodeChip, StepPill, FormBar, ToggleRow, TextField, GroupSettingRow, GroupFields, ParentFields, ParentAssignmentFields, IssueList, polBtn, polGhost, polDark, ActionRow });
