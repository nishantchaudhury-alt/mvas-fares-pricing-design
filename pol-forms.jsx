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

function PolicyIdentityFields({ type, form, set, err }) {
  const isCan = type === 'cancel';
  return (
    <div style={{ display:'grid', gridTemplateColumns:'minmax(0, 1fr) minmax(0, 1fr)', gap:10, alignItems:'start' }}>
      <TextField label={isCan ? 'Cancellation policy name' : 'Deposit policy name'} value={form.name} onChange={v => set({ name:v })} error={err?.name}
        placeholder={isCan ? 'e.g. Standard Cancellation' : 'e.g. 5 Night Standard Deposit'}/>
      <Field label="Stateroom coverage" required error={err?.cats} helper={`Applies to every ${isCan ? 'cancellation band' : 'milestone line'} in this policy.`}>
        <CatSelect value={form.cats || []} onChange={value => set({ cats:value })}/>
      </Field>
    </div>
  );
}

function CompactSectionBar({ step, title, summary, titleId, action }) {
  return (
    <div style={{ minHeight:38, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'8px 12px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
        {step && <span aria-hidden="true" style={{ padding:'2px 6px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9, fontWeight:800, lineHeight:1.4, flexShrink:0 }}>{step}</span>}
        <h3 id={titleId} style={{ margin:0, color:T.ink, fontSize:12.5, fontWeight:700, lineHeight:1.35, whiteSpace:'nowrap' }}>{title}</h3>
        {summary && <>
          <span aria-hidden="true" style={{ width:1, height:14, background:T.line, flexShrink:0 }}/>
          <span style={{ minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:T.inkSoft, fontSize:11, lineHeight:1.35 }}>{summary}</span>
        </>}
      </div>
      {action && <div style={{ flexShrink:0 }}>{action}</div>}
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

function GroupBehaviorRow({ eyebrow, label, help, on, onChange, stateLabel, toggleLabel, last, readOnly = false }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, padding:'9px 12px', borderBottom:last ? 'none' : `1px solid ${T.lineSoft}`, background:'#fff' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', alignItems:'baseline', gap:8, minWidth:0, flexWrap:'wrap' }}>
          <span style={{ fontSize:12.5, fontWeight:700, color:T.ink, lineHeight:1.35 }}>{label}</span>
          <span style={{ fontSize:9, fontWeight:800, color:T.inkFaint, textTransform:'uppercase', letterSpacing:'.65px' }}>{eyebrow}</span>
        </div>
        <div style={{ maxWidth:700, marginTop:2, fontSize:10.5, color:T.inkSoft, lineHeight:1.4 }}>{help}</div>
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
        <span style={{ display:'inline-flex', alignItems:'center', gap:5, minHeight:22, padding:'2px 7px', borderRadius:999, border:`1px solid ${on && !readOnly ? T.primaryLine : T.line}`, background:on && !readOnly ? T.primaryBg : T.fill, color:on && !readOnly ? T.primary : T.inkSoft, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>
          {readOnly && <svg aria-hidden="true" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>}
          {stateLabel}
        </span>
        {!readOnly && <Toggle on={on} onChange={onChange} label={toggleLabel || label}/>}
      </div>
    </div>
  );
}

function GroupFields({ type, form, set, err, canActivate, step }) {
  const isCan = type === 'cancel';
  const uid = React.useId().replace(/:/g, '');
  const titleId = `group-details-${uid}`;
  const identityId = `group-identity-${uid}`;
  const behaviorId = `group-behavior-${uid}`;
  const typeLabel = isCan ? 'Cancellation policies' : 'Deposit policies';
  return (
    <section aria-labelledby={titleId} style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.06)', overflow:'hidden' }}>
      <CompactSectionBar step={step} titleId={titleId} title="Group setup" summary="Name the group and define its assignment behavior."/>

      <div style={{ display:'flex', flexDirection:'column', gap:20, padding:'17px 16px 18px' }}>
        <section aria-labelledby={identityId}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:11 }}>
            <div style={{ minWidth:0 }}>
              <h4 id={identityId} style={{ margin:0, color:T.ink, fontSize:12.5, fontWeight:700 }}>Identity</h4>
              <p style={{ margin:'2px 0 0', color:T.inkSoft, fontSize:11.5, lineHeight:1.45 }}>How teams will find this group in assignment, reporting, and history.</p>
            </div>
            <div aria-label={`${typeLabel}, fixed after creation`} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 8px', border:`1px solid ${T.line}`, borderRadius:6, background:T.fill, color:T.inkSoft, flexShrink:0 }}>
              <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
              <span style={{ fontSize:10.5, fontWeight:700, whiteSpace:'nowrap' }}>{typeLabel}</span>
              <span aria-hidden="true" style={{ color:T.inkFaint }}>·</span>
              <span style={{ fontSize:10, whiteSpace:'nowrap' }}>Fixed type</span>
            </div>
          </div>
          <TextField label={isCan ? 'Cancellation group name' : 'Deposit group name'} value={form.name} onChange={v => set({ name:v })} error={err?.name}
            placeholder={isCan ? 'e.g. Standard' : 'e.g. IS 5-Night Retail Std'} helper={`Must be unique among active ${isCan ? 'cancellation' : 'deposit'} groups.`}/>
        </section>

        {step ? (
          <section aria-labelledby={behaviorId} style={{ paddingTop:17, borderTop:`1px solid ${T.line}` }}>
            <div style={{ marginBottom:10 }}>
              <h4 id={behaviorId} style={{ margin:0, color:T.ink, fontSize:12.5, fontWeight:700 }}>Behavior</h4>
              <p style={{ margin:'2px 0 0', color:T.inkSoft, fontSize:11.5, lineHeight:1.45 }}>
                {isCan ? 'Review the assignment fallback and the commercial term inherited by every policy.' : 'Choose how this group participates in Farecode assignment.'}
              </p>
            </div>
            <div style={{ border:`1px solid ${T.line}`, borderRadius:8, overflow:'hidden', background:'#fff' }}>
              <GroupBehaviorRow eyebrow="Assignment fallback" label="Use as default group" on={form.isDefault} onChange={v => set({ isDefault:v })}
                stateLabel={form.isDefault ? 'Default group' : 'Not default'} toggleLabel="Use as default group"
                help={form.isDefault ? 'Becomes the fallback after activation and replaces the current default group.' : `The current default remains the fallback unless a Farecode explicitly selects this ${isCan ? 'cancellation' : 'deposit'} group.`}
                last={!isCan}/>
              {isCan && <GroupBehaviorRow eyebrow="Inherited policy term" label="Refundability" on={form.refundable} onChange={v => set({ refundable:v })}
                stateLabel={form.refundable ? 'Refundable' : 'Non-refundable'} toggleLabel="Refundability" last
                help={form.refundable ? 'Policies may include a no-charge cancellation window; this term is inherited by every policy in the group.' : 'Every cancellation band must charge a percentage of cabin fare or the full deposit.'}/>}
            </div>
          </section>
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
              {isCan && <GroupSettingRow label="Refundability" on={form.refundable} onChange={v => set({ refundable:v })}
                stateLabel={form.refundable ? 'Refundable' : 'Non-refundable'} help="Inherited by every policy in this group. Non-refundable groups require every band to charge a percentage of cabin fare or the full deposit."/>}
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
      <CompactSectionBar step={step} titleId={titleId} title="Policy setup" summary={`Name the ${policyType} policy, set its stateroom coverage, and configure its ${isCan ? 'bands' : 'milestone lines'}.`}/>

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
          <PolicyIdentityFields type={type} form={form} set={set} err={err}/>
        </div>
        {children}
      </div>
    </section>
  );
}

function ParentAssignmentFields({ type, form, set, canActivate, activateHelp, activationLabel, groupRefundable = true, creation = false, embedded = false }) {
  const isCan = type === 'cancel';
  const [open, setOpen] = React.useState(false);
  const policyType = isCan ? 'cancellation' : 'deposit';
  const childName = isCan ? 'band' : 'milestone line';
  const inheritedRefundable = groupRefundable !== false;
  const uid = React.useId().replace(/:/g, '');
  const titleId = `policy-assignment-${uid}`;
  const settings = creation ? (
    <div style={{ border:`1px solid ${T.line}`, borderRadius:8, overflow:'hidden', background:'#fff' }}>
      <GroupBehaviorRow eyebrow="Assignment fallback" label={`Use as default ${policyType} policy`} on={form.isDefault} onChange={v => set({ isDefault:v })}
        stateLabel={form.isDefault ? 'Default policy' : 'Not default'} toggleLabel={`Use as default ${policyType} policy`} last={!isCan}
        help={form.isDefault ? 'Becomes the fallback after activation and replaces the current default policy.' : `The current default remains the fallback unless a Farecode explicitly selects this ${policyType} policy.`}/>
      {isCan && <GroupBehaviorRow eyebrow="Inherited from group" label="Refundability" on={inheritedRefundable} onChange={() => {}} readOnly last
        stateLabel={inheritedRefundable ? 'Refundable' : 'Non-refundable'}
        help="Controlled at group level and applied consistently to every cancellation policy in this group."/>}
    </div>
  ) : (
    <div style={{ border:`1px solid ${T.line}`, borderRadius:8, overflow:'hidden', background:'#fff' }}>
            <GroupSettingRow first label="Active" on={form.active} dis={!canActivate} onChange={v => set({ active:v })}
              disabledLabel={activationLabel || `Requires valid ${childName}`} stateLabel={form.active ? 'Active' : 'Inactive'}
              help={canActivate ? 'Available for assignment on Farecodes.' : activateHelp}/>
            <GroupSettingRow label="Default in group" on={form.isDefault} onChange={v => set({ isDefault:v })}
              stateLabel={form.isDefault ? 'Default' : 'Not default'} help="Used when a Farecode leaves this policy unset within the parent group."/>
            {isCan && <GroupSettingRow label="Refundability" on={inheritedRefundable} dis onChange={() => {}}
              disabledLabel={`Inherited · ${inheritedRefundable ? 'Refundable' : 'Non-refundable'}`} help="Inherited from the parent group and locked at policy level."/>}
    </div>
  );
  const sectionTitle = creation ? 'Default selection' : 'Assignment behavior';
  const summary = [
    ...(creation ? [] : [form.active ? 'Active' : 'Inactive']),
    form.isDefault ? 'Default' : 'Not default',
    ...(isCan ? [inheritedRefundable ? 'Refundable' : 'Non-refundable'] : []),
  ].join(' · ');
  const panelId = `${titleId}-panel`;
  const accordion = (
    <>
      <h4 style={{ margin:0 }}>
        <button id={titleId} type="button" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}
          style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'11px 12px', border:'none', background:open ? '#fff' : T.fill, color:T.ink, textAlign:'left', cursor:'pointer' }}>
          <span style={{ minWidth:0, flex:1 }}>
            <span style={{ display:'block', fontSize:12.5, fontWeight:700 }}>{sectionTitle}</span>
            <span style={{ display:'block', marginTop:2, fontSize:11.5, fontWeight:400, color:T.inkSoft, lineHeight:1.45 }}>
              {creation ? 'Choose fallback behavior and confirm the group-owned terms inherited by this policy.' : 'Control availability and default selection; group-owned terms are shown as inherited.'}
            </span>
          </span>
          <span style={{ flexShrink:0, padding:'2px 7px', borderRadius:999, border:`1px solid ${T.line}`, background:'#fff', color:T.inkSoft, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>{summary}</span>
          <span aria-hidden="true" style={{ flexShrink:0, color:T.inkSoft, display:'inline-flex' }}><IcChevron up={open}/></span>
        </button>
      </h4>
      {open && <div id={panelId} role="region" aria-labelledby={titleId} style={{ padding:'10px 12px 12px', borderTop:`1px solid ${T.lineSoft}`, background:'#fff' }}>{settings}</div>}
    </>
  );
  return (
    <section style={{ marginTop:embedded ? 15 : 0, background:T.panel, border:`1px solid ${T.line}`, borderRadius:embedded ? 8 : 10, boxShadow:embedded ? 'none' : '0 1px 2px rgba(15,23,42,.06)', overflow:'hidden' }}>
      {accordion}
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

Object.assign(window, { PolStatusBadge, TypeBadge, Caret, Stem, Rails, TREE, CodeChip, StepPill, FormBar, ToggleRow, TextField, PolicyIdentityFields, CompactSectionBar, GroupSettingRow, GroupFields, ParentFields, ParentAssignmentFields, IssueList, polBtn, polGhost, polDark, ActionRow });
