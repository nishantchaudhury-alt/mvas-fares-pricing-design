// pol-drawer.jsx — guided Group → Policy creation flow, as a right-side drawer (1.2).
function StepDots({ step, labels }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, padding:'0 20px 14px' }}>
      {labels.map((l, i) => {
        const n = i + 1, done = n < step, cur = n === step;
        return (
          <React.Fragment key={l}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10.5, fontWeight:700, background:done ? T.green : cur ? T.primary : '#EEF2F6', color:done || cur ? '#fff' : T.inkFaint }}>
                {done ? <IcCheck size={11}/> : n}
              </span>
              <span style={{ fontSize:12, fontWeight:cur ? 700 : 500, color:cur ? T.ink : done ? T.inkSoft : T.inkFaint, whiteSpace:'nowrap' }}>{l}</span>
            </div>
            {n < labels.length && <span style={{ flex:1, height:1, background:done ? T.green : T.line, margin:'0 8px' }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Recap({ items }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, border:`1px solid ${T.line}`, borderRadius:9, overflow:'hidden', background:T.fill }}>
      {items.map((it, i) => (
        <div key={it.label} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', flexWrap:'wrap', borderTop:i ? `1px solid ${T.lineSoft}` : 'none' }}>
          <span style={{ width:78, flexShrink:0, fontSize:9.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px' }}>{it.label}</span>
          <span style={{ flex:1, fontSize:12.5, color:T.ink, fontWeight:600 }}>{it.value}</span>
          {it.code && <span style={{ fontFamily:MONO, fontSize:11, fontWeight:700, color:T.inkFaint }}>{it.code}</span>}
          {it.onEdit && <button onClick={it.onEdit} style={{ background:'none', border:'none', padding:0, fontSize:12, fontWeight:600, color:T.primary, cursor:'pointer' }}>Edit</button>}
        </div>
      ))}
    </div>
  );
}

function FlowContext({ items }) {
  return (
    <div style={{ padding:'11px 12px', borderRadius:8, background:T.primaryBg, border:`1px solid ${T.primaryLine}` }}>
      <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px', marginBottom:8 }}>Configuration context</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2, minmax(0, 1fr))', gap:8 }}>
        {items.map(it => (
          <div key={it.label} style={{ padding:'9px 10px', borderRadius:7, background:'#fff', border:`1px solid ${T.primaryLine}`, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
              <span style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px' }}>{it.label}</span>
              {it.onEdit && <button type="button" aria-label={`Edit ${it.label.toLowerCase()}`} onClick={it.onEdit} style={{ padding:0, background:'none', border:'none', color:T.primary, fontSize:10.5, fontWeight:700, cursor:'pointer' }}>Edit</button>}
            </div>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.ink, marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{it.value}</div>
            {it.code && <div style={{ fontFamily:MONO, fontSize:10, fontWeight:700, color:T.inkSoft, marginTop:2 }}>{it.code}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function PolicyRowsSubsection({ id, type, codeNum, rows, setRows, cellErr, validationAttempt = 0, children }) {
  const meta = POL_META[type];
  return (
    <div aria-labelledby={id} style={{ padding:'15px 0 16px', borderTop:`1px solid ${T.lineSoft}` }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:10 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ marginBottom:3, color:T.inkLabel, fontSize:9.5, fontWeight:800, letterSpacing:'.7px', textTransform:'uppercase' }}>Policy schedule</div>
          <h4 id={id} style={{ fontSize:14.5, fontWeight:700, color:T.ink, margin:'0 0 2px' }}>{meta.childWords}</h4>
          <p style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Add and order DTS windows, {type === 'deposit' ? 'deposit amounts' : 'penalties'}, and stateroom coverage for this policy.</p>
        </div>
        <span style={{ flexShrink:0, padding:'3px 8px', borderRadius:999, border:`1px solid ${T.line}`, background:'#fff', color:T.inkSoft, fontSize:10, fontWeight:700 }}>{rows.length} {rows.length === 1 ? meta.childWord.toLowerCase() : meta.childWords.toLowerCase()}</span>
      </div>
      <PolicyRowsTable type={type} codeNum={codeNum} rows={rows} setRows={setRows} cellErr={cellErr} editing={true} validationAttempt={validationAttempt}/>
      {children}
    </div>
  );
}

function policyDraftIsReady(type, draft) {
  if (!draft.pForm.name.trim() || !draft.rows.length) return false;
  const validation = validateRows(draft.rows);
  if (Object.keys(validation.cell).length || validation.issues.length) return false;
  return type !== 'cancel' || refundabilityIssues(draft.rows, draft.pForm.refundable).length === 0;
}

function PolicyDraftAccordion({ type, drafts, activeIndex, onSelect, onAdd, onRemove, context, body }) {
  const meta = POL_META[type];
  return (
    <section aria-labelledby="policy-details-title" style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.06)', overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, minWidth:0 }}>
          <span aria-hidden="true" style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>02</span>
          <div style={{ minWidth:0 }}>
            <h3 id="policy-details-title" style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>Policy details</h3>
            <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Create one or more assignable {type === 'cancel' ? 'cancellation' : 'deposit'} policies. Expand a policy to manage its complete schedule.</p>
          </div>
        </div>
        <button type="button" onClick={onAdd} style={{ ...polDark, flexShrink:0, padding:'7px 11px', fontSize:11 }}>+ Add policy</button>
      </div>
      <div style={{ padding:'14px 14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', marginBottom:12, borderRadius:7, background:T.primaryBg, border:`1px solid ${T.primaryLine}` }}>
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
            <span style={{ color:T.inkSoft, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>Existing group</span>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, margin:'0 2px 8px' }}>
          <div>
            <div style={{ color:T.ink, fontSize:12.5, fontWeight:700 }}>Policies in this group</div>
            <div style={{ marginTop:2, color:T.inkSoft, fontSize:10.5 }}>Only one policy is open at a time; each keeps its own {meta.childWords.toLowerCase()}.</div>
          </div>
          <span style={{ flexShrink:0, color:T.inkSoft, fontSize:10.5, fontWeight:700 }}>{drafts.length} {drafts.length === 1 ? 'policy' : 'policies'}</span>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {drafts.map((draft, i) => {
            const expanded = i === activeIndex;
            const complete = policyDraftIsReady(type, draft);
            const panelId = `policy-draft-${String(draft.key).replace(/[^A-Za-z0-9_-]/g, '-')}`;
            const rowLabel = `${draft.rows.length} ${draft.rows.length === 1 ? meta.childWord.toLowerCase() : meta.childWords.toLowerCase()}`;
            return (
              <div key={draft.key} style={{ border:`1px solid ${expanded ? T.primaryLine : T.line}`, borderRadius:8, background:'#fff', overflow:'hidden', boxShadow:expanded ? '0 1px 2px rgba(15,23,42,.08)' : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, padding:'0 10px', minHeight:54, background:expanded ? T.primaryBg : '#fff', borderBottom:expanded ? `1px solid ${T.primaryLine}` : 'none' }}>
                  <button type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => onSelect(i)}
                    style={{ flex:1, minWidth:0, alignSelf:'stretch', display:'flex', alignItems:'center', gap:10, padding:'8px 0', border:'none', background:'transparent', textAlign:'left', cursor:'pointer', color:T.ink }}>
                    <span aria-hidden="true" style={{ width:20, height:20, borderRadius:5, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:expanded ? '#fff' : T.inkSoft, background:expanded ? T.primary : T.fill, border:`1px solid ${expanded ? T.primary : T.line}`, transform:expanded ? 'rotate(90deg)' : 'none', transition:'transform .15s' }}>›</span>
                    <span style={{ minWidth:0, flex:1 }}>
                      <span style={{ display:'flex', alignItems:'center', gap:7, minWidth:0, flexWrap:'wrap' }}>
                        <span style={{ color:T.inkLabel, fontSize:9.5, fontWeight:800, letterSpacing:'.65px', textTransform:'uppercase' }}>Policy {i + 1}</span>
                        <span style={{ fontFamily:MONO, color:T.inkSoft, fontSize:9.5, fontWeight:700 }}>{draft.parentCode}</span>
                      </span>
                      <span style={{ display:'block', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:T.ink, fontSize:12.5, fontWeight:700 }}>{draft.pForm.name.trim() || `Untitled ${type === 'cancel' ? 'cancellation' : 'deposit'} policy`}</span>
                    </span>
                    <span style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                      <span style={{ color:T.inkSoft, fontSize:10.5, whiteSpace:'nowrap' }}>{rowLabel}</span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, color:complete ? '#047857' : '#92400E', fontSize:10, fontWeight:800, whiteSpace:'nowrap' }}><span aria-hidden="true">{complete ? '✓' : '!'}</span>{complete ? 'Ready' : 'Needs setup'}</span>
                    </span>
                  </button>
                  {!draft.parentId && drafts.length > 1 && (
                    <button type="button" aria-label={`Remove ${draft.pForm.name.trim() || `policy ${i + 1}`}`} onClick={() => onRemove(i)} title="Remove policy"
                      style={{ width:28, height:28, borderRadius:6, border:`1px solid ${T.lineSoft}`, background:'#fff', color:T.red, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IcX size={11}/></button>
                  )}
                </div>
                {expanded && <div id={panelId} role="region" aria-label={`${draft.pForm.name.trim() || `Policy ${i + 1}`} details`} style={{ padding:'0 14px 14px' }}>{body}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PolFlowDrawer({ flow, setFlow, activatable, onCancel, onActivate }) {
  const f = flow, meta = POL_META[f.type];
  const setG = patch => setFlow(x => ({ ...x, gForm:{ ...x.gForm, ...patch }, err:null, issues:[] }));
  const drafts = flowPolicyDrafts(f);
  const activeIndex = Math.min(f.activePolicyIndex || 0, drafts.length - 1);
  const activePolicy = drafts[activeIndex];
  const setP = patch => setFlow(x => {
    const nextDrafts = flowPolicyDrafts(x).map((draft, i) => ({
      ...draft,
      pForm:{ ...draft.pForm, ...(i === (x.activePolicyIndex || 0) ? patch : patch.isDefault ? { isDefault:false } : {}) },
      ...(i === (x.activePolicyIndex || 0) ? { err:null, issues:[] } : {}),
    }));
    return { ...x, policyDrafts:nextDrafts };
  });
  const setPolicyRows = rows => setFlow(x => ({ ...x, policyDrafts:flowPolicyDrafts(x).map((draft, i) => i === (x.activePolicyIndex || 0) ? { ...draft, rows, issues:[] } : draft) }));
  const selectPolicy = index => setFlow(x => ({ ...x, activePolicyIndex:index }));
  const addPolicy = () => setFlow(x => {
    const current = flowPolicyDrafts(x);
    const maxCode = Math.max(...current.map(d => Number(codeNumOf(d.parentCode)) || 0));
    const parentCode = x.type === 'deposit' ? `DEP-${maxCode + 1}` : `CANC-${String(maxCode + 1).padStart(3, '0')}`;
    const draft = {
      key:`draft-${parentCode}`,
      parentId:null,
      parentCode,
      pForm:{ name:'', active:true, isDefault:false, refundable:x.gForm.refundable !== false },
      rows:[], issues:[], validationAttempt:0, err:null,
    };
    return { ...x, policyDrafts:[...current, draft], activePolicyIndex:current.length };
  });
  const removePolicy = index => setFlow(x => {
    const current = flowPolicyDrafts(x);
    if (current.length <= 1 || current[index].parentId) return x;
    const next = current.filter((_, i) => i !== index);
    const active = x.activePolicyIndex || 0;
    return { ...x, policyDrafts:next, activePolicyIndex:active === index ? Math.max(0, index - 1) : active > index ? active - 1 : active };
  });
  const goto = step => setFlow(x => ({ ...x, step, issues:[] }));
  const rowValidation = validateRows(activePolicy.rows);
  const cellErr = rowValidation.cell;
  const groupLocked = f.entry === 'addPolicy';
  const labels = ['Group', 'Policy'];
  const title = f.entry === 'resume' ? `Finish setup — ${f.gForm.name || meta.groupLabel}`
    : groupLocked ? `New policy in ${f.gForm.name}` : `New ${meta.groupLabel}`;
  const fieldIssueCount = Object.keys(cellErr).length;
  const structuralIssues = [
    ...rowValidation.issues.filter(it => it.text !== 'Some fields are incomplete or out of range.'),
    ...(f.type === 'cancel' ? refundabilityIssues(activePolicy.rows, activePolicy.pForm.refundable) : []),
  ];
  const nameIssueCount = activePolicy.pForm.name.trim() ? 0 : 1;
  const issueCount = fieldIssueCount + structuralIssues.length + nameIssueCount;
  const ready = activePolicy.rows.length > 0 && issueCount === 0 && activatable;
  const showReadiness = activePolicy.rows.length > 0 || (activePolicy.validationAttempt || 0) > 0 || (activePolicy.issues || []).length > 0;
  const readinessHelp = ready
    ? `${activePolicy.rows.length} ${activePolicy.rows.length === 1 ? meta.childWord.toLowerCase() : meta.childWords.toLowerCase()} configured with continuous DTS and stateroom coverage.`
    : !activePolicy.rows.length
      ? `Add at least one ${meta.childWord.toLowerCase()} and define continuous DTS and stateroom coverage.`
      : nameIssueCount
        ? 'Name the policy, then resolve any row or coverage issues before activation.'
        : fieldIssueCount
          ? 'Complete the highlighted row fields, then confirm continuous DTS and stateroom coverage.'
          : 'Resolve DTS ordering, coverage, or refundability so the full policy can be activated.';

  const body = () => {
    if (f.step === 1) return (
      <GroupFields step="01" type={f.type} form={f.gForm} err={f.err} canActivate={false} set={setG}/>
    );
    const activeBody = (<>
        <div style={{ padding:'14px 0 16px' }}>
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, marginBottom:8 }}>
            <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>Policy identity</div>
            <div style={{ fontSize:10.5, color:T.inkFaint, lineHeight:1.35, textAlign:'right' }}>Used in assignment, reporting, and history</div>
          </div>
          <TextField label={f.type === 'cancel' ? 'Cancellation policy name' : 'Deposit policy name'} value={activePolicy.pForm.name} onChange={v => setP({ name:v })} error={activePolicy.err?.name}
            placeholder={f.type === 'cancel' ? 'e.g. Standard Cancellation' : 'e.g. 5 Night Standard Deposit'}/>
        </div>
        <PolicyRowsSubsection id="policy-lines-title" type={f.type} codeNum={codeNumOf(activePolicy.parentCode)} rows={activePolicy.rows}
          setRows={setPolicyRows} cellErr={cellErr} validationAttempt={activePolicy.validationAttempt || 0}>
          {showReadiness && <div aria-live="polite" style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 9px', marginTop:9, borderRadius:6, background:ready ? '#F0FDF4' : '#FFF7ED', borderLeft:`3px solid ${ready ? '#059669' : '#D97706'}` }}>
            <span aria-hidden="true" style={{ color:ready ? '#047857' : '#92400E', flexShrink:0, fontSize:12, fontWeight:800 }}>{ready ? '✓' : '!'}</span>
            <span style={{ minWidth:0, flex:1, fontSize:11, color:T.inkSoft, lineHeight:1.4 }}><strong style={{ color:T.ink }}>{ready ? 'Ready for activation.' : 'Setup incomplete.'}</strong> {readinessHelp}</span>
            <span style={{ color:ready ? '#047857' : '#92400E', fontSize:9.5, fontWeight:800, whiteSpace:'nowrap' }}>{ready ? 'Ready' : `${issueCount} ${issueCount === 1 ? 'issue' : 'issues'}`}</span>
          </div>}
          {f.type === 'cancel' && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:7, padding:'7px 3px 0', color:T.inkFaint, fontSize:10.25, lineHeight:1.4 }}>
              <span aria-hidden="true" style={{ color:T.primary, fontWeight:800 }}>i</span>
              <span>Cancellation charge is the greater of the active band amount plus port fees or the applicable deposit cancellation floor.</span>
            </div>
          )}
          <IssueList issues={activePolicy.issues || []}/>
        </PolicyRowsSubsection>
        <ParentAssignmentFields embedded type={f.type} form={activePolicy.pForm} set={setP} creation={true}
          canActivate={activatable} activationLabel="Set on activation"
          activateHelp={`Activation requires at least one valid ${meta.childWord.toLowerCase()}.`}/>
      </>);
    return (
      <PolicyDraftAccordion type={f.type} drafts={drafts} activeIndex={activeIndex} onSelect={selectPolicy} onAdd={addPolicy} onRemove={removePolicy}
        context={{ name:f.gForm.name || '—', code:f.groupCode, onEdit:groupLocked ? null : () => goto(1) }} body={activeBody}/>
    );
  };

  const footer = () => {
    if (f.step === 1) return (<>
      <button type="button" style={polGhost} onClick={onCancel}>Back</button>
      <button style={{ ...polDark, opacity:f.gForm.name.trim() ? 1 : .4, cursor:f.gForm.name.trim() ? 'pointer' : 'not-allowed' }}
        onClick={() => f.gForm.name.trim() && setFlow(x => ({ ...x, step:2, policyDrafts:flowPolicyDrafts(x).map(d => ({ ...d, pForm:{ ...d.pForm, refundable:x.gForm.refundable } })) }))}>Continue</button>
    </>);
    return (<>
      {!groupLocked && <button style={polGhost} onClick={() => goto(1)}>Back</button>}
      <button style={polDark} onClick={onActivate}>{drafts.length > 1 ? `Activate ${drafts.length} policies` : 'Activate'}</button>
    </>);
  };

  return (
    <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.42)', zIndex:1000, display:'flex', justifyContent:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'clamp(655px, 65.5%, 1240px)', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow:'-14px 0 44px rgba(15,23,42,.18)' }}>
        <div style={{ padding:'16px 20px 12px', borderBottom:`1px solid ${T.lineSoft}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, minWidth:0 }}>
                <TypeBadge type={f.type}/>
                <span style={{ fontFamily:MONO, fontSize:10.5, fontWeight:700, color:T.inkFaint, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.groupCode} · {activePolicy.parentCode}</span>
              </div>
              <h2 style={{ fontSize:17, fontWeight:700, color:T.ink }}>{title}</h2>
              <div style={{ fontSize:12, color:T.inkSoft, marginTop:3 }}>Nothing is saved until you choose Activate on the last step.</div>
            </div>
            <button type="button" aria-label="Close policy drawer" onClick={onCancel} style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.line}`, background:'#fff', cursor:'pointer', color:T.inkSoft, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IcX size={13}/></button>
          </div>
        </div>
        <div style={{ paddingTop:16, borderBottom:`1px solid ${T.line}`, background:T.fill }}><StepDots step={f.step} labels={labels}/></div>
        <div className="pscroll" style={{ flex:1, overflowY:'auto', padding:'20px 20px 26px' }}>{body()}</div>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', borderTop:`1px solid ${T.line}`, background:'#FCFDFE' }}>
          <span style={{ fontSize:11, color:T.inkFaint, whiteSpace:'nowrap' }}>Step {f.step} of 2</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>{footer()}</div>
        </div>
      </div>
    </div>
  );
}

/* Inline-edit of an existing Group or Parent — same drawer shell as the creation flow. */
function PolEditDrawer({ edit, group, parent, setEdit, activatable, onCancel, onSave }) {
  const isGroup = edit.level === 'group';
  const g = group, p = parent, meta = POL_META[g.type];
  const cellErr = isGroup ? {} : validateRows(edit.rows).cell;
  const setForm = patch => setEdit(e => ({ ...e, form:{ ...e.form, ...patch }, err:null }));
  return (
    <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.42)', zIndex:1000, display:'flex', justifyContent:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'clamp(655px, 65.5%, 1240px)', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow:'-14px 0 44px rgba(15,23,42,.18)' }}>
        <div style={{ padding:'16px 20px 14px', borderBottom:`1px solid ${T.line}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, minWidth:0 }}>
                <TypeBadge type={g.type}/>
                <span style={{ fontFamily:MONO, fontSize:10.5, fontWeight:700, color:T.primary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{isGroup ? g.code : `${g.code} › ${p.code}`}</span>
                <PolStatusBadge status={isGroup ? g.status : p.status}/>
              </div>
              <h2 style={{ fontSize:17, fontWeight:700, color:T.ink }}>{isGroup ? 'Edit group' : 'Edit policy'}</h2>
              <div style={{ fontSize:12, color:T.inkSoft, marginTop:3 }}>
                {isGroup ? `${meta.groupLabel} · changes apply to every policy assignment referencing this group.`
                         : `Policy fields and its ${meta.childWords.toLowerCase()} save together.`}
              </div>
            </div>
            <button type="button" aria-label="Close policy drawer" onClick={onCancel} style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.line}`, background:'#fff', cursor:'pointer', color:T.inkSoft, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IcX size={13}/></button>
          </div>
        </div>
        <div className="pscroll" style={{ flex:1, overflowY:'auto', padding:'20px 20px 26px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {isGroup ? (
              <>
                <Recap items={[{ label:'Policies inside', value:`${g.parents.length} · ${g.parents.filter(x => x.status === 'Active').length} active`, code:g.code }]}/>
                <GroupFields type={g.type} form={edit.form} err={edit.err} canActivate={g.parents.some(x => x.status === 'Active')} set={setForm}/>
              </>
            ) : (
              <>
                <ParentFields type={g.type} form={edit.form} err={edit.err} set={setForm}
                  context={{ name:g.name, code:g.code }}>
                  <PolicyRowsSubsection id="edit-policy-rows-title" type={g.type} codeNum={codeNumOf(p.code)} rows={edit.rows}
                    setRows={r => setEdit(e => ({ ...e, rows:r, issues:[] }))} cellErr={cellErr} validationAttempt={edit.validationAttempt || 0}/>
                  <ParentAssignmentFields embedded type={g.type} form={edit.form} set={setForm} canActivate={activatable}
                    activateHelp={`Needs at least one valid ${meta.childWord.toLowerCase()}.`}/>
                  <IssueList issues={edit.issues || []} title="Resolve before saving as Active"/>
                </ParentFields>
              </>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 20px', borderTop:`1px solid ${T.line}`, background:'#FCFDFE' }}>
          <span style={{ fontSize:11, color:T.inkFaint, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'38%' }}>Last modified {isGroup ? g.mod : p.mod} · {isGroup ? g.editor : p.editor}</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
            <button style={polGhost} onClick={onCancel}>Cancel</button>
            <button style={polDark} onClick={onSave}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PolFlowDrawer, PolEditDrawer, StepDots, Recap, FlowContext, PolicyRowsSubsection });
