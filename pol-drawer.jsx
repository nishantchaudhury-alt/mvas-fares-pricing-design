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

function PolDrawerFrame({ detailLabel, code, badge, status, title, sub, onClose, afterHeader, footer, children, canvas = '#fff' }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.32)', backdropFilter:'blur(2px)', zIndex:1000, opacity:mounted ? 1 : 0, transition:'opacity 220ms ease-out' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:1180, maxWidth:'100%', background:canvas, zIndex:1001, display:'flex', flexDirection:'column', boxShadow:'-8px 0 48px rgba(15,23,42,.2)', transform:mounted ? 'translateX(0)' : 'translateX(100%)', transition:'transform 220ms ease-out' }}>
        <div style={{ height:52, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', borderBottom:`1px solid ${T.line}`, flexShrink:0, background:'#fff' }}>
          <span style={{ fontSize:14, fontWeight:700, color:T.ink }}>{detailLabel}</span>
          <button type="button" aria-label="Close policy drawer" onClick={onClose}
            style={{ width:30, height:30, borderRadius:7, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.inkFaint }}
            onMouseEnter={event => { event.currentTarget.style.background = T.fill; event.currentTarget.style.color = T.ink; }}
            onMouseLeave={event => { event.currentTarget.style.background = 'none'; event.currentTarget.style.color = T.inkFaint; }}>
            <IcX size={14}/>
          </button>
        </div>

        <div style={{ background:'#fff', padding:'14px 22px', borderBottom:`1px solid ${T.line}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0, flexWrap:'wrap' }}>
            <span style={{ fontFamily:MONO, fontSize:16, fontWeight:700, color:T.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{code}</span>
            {status && <PolStatusBadge status={status}/>} {badge}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6, minWidth:0, fontSize:11.5, color:T.inkFaint, flexWrap:'wrap' }}>
            <span style={{ color:T.ink, fontWeight:700 }}>{title}</span>
            <span>•</span>
            <span>{sub}</span>
          </div>
        </div>

        {afterHeader}
        <div className="pscroll" style={{ flex:1, overflowY:'auto', padding:'20px 22px 28px', background:canvas }}>{children}</div>
        {footer && <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 22px', borderTop:`1px solid ${T.line}`, background:'#FCFDFE', flexShrink:0 }}>{footer}</div>}
      </div>
    </>
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
    <div aria-labelledby={id} style={{ padding:'12px 0 13px', borderTop:`1px solid ${T.lineSoft}` }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, marginBottom:8 }}>
        <div style={{ minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:8, minWidth:0, flexWrap:'wrap' }}>
            <h4 id={id} style={{ fontSize:12.5, fontWeight:700, color:T.ink, margin:0 }}>{meta.childWords}</h4>
            <span style={{ color:T.inkFaint, fontSize:9, fontWeight:800, letterSpacing:'.65px', textTransform:'uppercase' }}>Policy schedule</span>
          </div>
          <p style={{ fontSize:10.5, color:T.inkSoft, lineHeight:1.4, margin:'2px 0 0' }}>Define DTS windows, {type === 'deposit' ? 'deposit amounts' : 'penalties'}, and stateroom coverage.</p>
        </div>
        <span style={{ flexShrink:0, padding:'2px 7px', borderRadius:999, border:`1px solid ${T.line}`, background:T.fill, color:T.inkSoft, fontSize:10, fontWeight:700 }}>{rows.length} {rows.length === 1 ? meta.childWord.toLowerCase() : meta.childWords.toLowerCase()}</span>
      </div>
      <PolicyRowsTable type={type} codeNum={codeNum} rows={rows} setRows={setRows} cellErr={cellErr} editing={true} validationAttempt={validationAttempt}/>
      {children}
    </div>
  );
}

function policyDraftIsReady(type, draft, groupRefundable) {
  if (!draft.pForm.name.trim() || !draft.rows.length) return false;
  const validation = validateRows(draft.rows);
  if (Object.keys(validation.cell).length || validation.issues.length) return false;
  return type !== 'cancel' || refundabilityIssues(draft.rows, groupRefundable !== false).length === 0;
}

function PolicyDraftAccordion({ type, drafts, activeIndex, onSelect, onAdd, onRemove, context, groupRefundable, body }) {
  const meta = POL_META[type];
  const activeDraft = drafts[activeIndex] || drafts[0];
  const activeRowRef = React.useRef(null);
  const editorRef = React.useRef(null);
  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      activeRowRef.current?.scrollIntoView({ block:'nearest' });
      if (editorRef.current) editorRef.current.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, drafts.length]);
  return (
    <section aria-labelledby="policy-details-title" style={{ height:'calc(100vh - 266px)', minHeight:520, maxHeight:760, display:'flex', flexDirection:'column', background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.06)', overflow:'hidden' }}>
      <CompactSectionBar step="02" titleId="policy-details-title" title="Policy setup"
        summary={`Build and review the ${type === 'cancel' ? 'cancellation' : 'deposit'} policies in this group.`}
        action={<button type="button" onClick={onAdd} style={{ ...polDark, padding:'5px 9px', fontSize:10.5 }}>+ Add policy</button>}/>
      <div style={{ display:'flex', alignItems:'center', gap:9, minHeight:44, padding:'8px 12px', borderBottom:`1px solid ${T.lineSoft}`, background:'#fff' }}>
        <span style={{ flexShrink:0, color:T.inkLabel, fontSize:9.5, fontWeight:800, textTransform:'uppercase', letterSpacing:'.65px' }}>Group</span>
        <span aria-hidden="true" style={{ width:1, height:14, background:T.line }}/>
        <span style={{ minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:T.ink, fontSize:12, fontWeight:700 }}>{context.name || 'Unnamed group'}</span>
        {context.code && <span style={{ flexShrink:0, fontFamily:MONO, fontSize:10, fontWeight:700, color:T.inkSoft }}>{context.code}</span>}
        <span style={{ marginLeft:'auto' }}/>
        {context.onEdit ? (
          <button type="button" onClick={context.onEdit} style={{ padding:'4px 7px', borderRadius:6, border:`1px solid ${T.line}`, background:'#fff', color:T.primary, fontSize:10, fontWeight:700, cursor:'pointer', flexShrink:0 }}>Edit group</button>
        ) : (
          <span style={{ color:T.inkFaint, fontSize:10, fontWeight:700, whiteSpace:'nowrap' }}>Existing group</span>
        )}
      </div>

      <div style={{ minHeight:0, flex:1, display:'grid', gridTemplateColumns:'minmax(190px, 20%) minmax(0, 1fr)' }}>
        <aside aria-label="Policies in this group" style={{ minWidth:0, minHeight:0, display:'flex', flexDirection:'column', background:T.fill, borderRight:`1px solid ${T.line}` }}>
          <div style={{ padding:'10px 12px', borderBottom:`1px solid ${T.line}` }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
              <span style={{ color:T.ink, fontSize:11.5, fontWeight:700 }}>Policies</span>
              <span style={{ padding:'2px 7px', borderRadius:999, background:'#fff', border:`1px solid ${T.line}`, color:T.inkSoft, fontSize:10, fontWeight:700 }}>{drafts.length}</span>
            </div>
            <div style={{ marginTop:2, color:T.inkSoft, fontSize:10.25, lineHeight:1.4 }}>Choose a policy to configure.</div>
          </div>

          <nav aria-label="Select a policy" className="pscroll" style={{ minHeight:0, flex:1, overflowY:'auto' }}>
            {drafts.map((draft, i) => {
              const selected = i === activeIndex;
              const complete = policyDraftIsReady(type, draft, groupRefundable);
              const rowLabel = `${draft.rows.length} ${draft.rows.length === 1 ? meta.childWord.toLowerCase() : meta.childWords.toLowerCase()}`;
              const name = draft.pForm.name.trim() || `Untitled ${type === 'cancel' ? 'cancellation' : 'deposit'} policy`;
              return (
                <div key={draft.key} ref={selected ? activeRowRef : undefined} style={{ display:'flex', alignItems:'stretch', borderBottom:`1px solid ${T.line}`, background:selected ? T.primaryBg : '#fff', boxShadow:selected ? `inset 3px 0 0 ${T.primary}` : 'none' }}>
                  <button type="button" aria-current={selected ? 'true' : undefined} onClick={() => onSelect(i)}
                    style={{ minWidth:0, flex:1, padding:'10px 8px 10px 12px', border:'none', background:'transparent', textAlign:'left', cursor:'pointer', color:T.ink }}>
                    <span style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
                      <span style={{ fontFamily:MONO, color:selected ? T.primary : T.inkSoft, fontSize:10, fontWeight:800 }}>{draft.parentCode}</span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:complete ? '#047857' : '#92400E', fontSize:9.5, fontWeight:800, whiteSpace:'nowrap' }}><span aria-hidden="true">{complete ? '✓' : '!'}</span>{complete ? 'Ready' : 'Needs setup'}</span>
                    </span>
                    <span style={{ display:'block', marginTop:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:T.ink, fontSize:11.5, fontWeight:700 }} title={name}>{name}</span>
                    <span style={{ display:'block', marginTop:3, color:T.inkFaint, fontSize:10 }}>{rowLabel}</span>
                  </button>
                  {!draft.parentId && drafts.length > 1 && selected && (
                    <button type="button" aria-label={`Remove ${draft.pForm.name.trim() || `policy ${i + 1}`}`} onClick={() => onRemove(i)} title="Remove policy"
                      style={{ width:30, border:'none', borderLeft:`1px solid ${T.lineSoft}`, background:'transparent', color:T.red, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IcX size={11}/></button>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        <div ref={editorRef} role="region" aria-label={`${activeDraft?.pForm.name.trim() || 'Selected policy'} editor`} className="pscroll" style={{ minWidth:0, minHeight:0, overflowY:'auto', padding:'0 16px 18px', background:'#fff' }}>
          {body}
        </div>
      </div>
    </section>
  );
}

function PolFlowDrawer({ flow, setFlow, policies = [], activatable, onCancel, onActivate }) {
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
  const groupName = f.gForm.name.trim();
  const groupNameError = !groupName
    ? 'Group name is required'
    : policies.some(g => g.type === f.type && g.id !== f.groupId && g.status === 'Active' && g.name.trim().toLowerCase() === groupName.toLowerCase())
      ? `An active ${meta.label.toLowerCase()} group named “${f.gForm.name}” already exists.`
      : null;
  const continueToPolicies = () => {
    if (groupNameError) {
      setFlow(x => ({ ...x, err:{ name:groupNameError } }));
      return;
    }
    setFlow(x => ({ ...x, step:2, err:null, policyDrafts:flowPolicyDrafts(x).map(d => ({ ...d, pForm:{ ...d.pForm, refundable:x.gForm.refundable } })) }));
  };
  const labels = ['Group', 'Policy'];
  const title = f.entry === 'resume' ? `Finish setup — ${f.gForm.name || meta.groupLabel}`
    : groupLocked ? `New policy in ${f.gForm.name}` : `New ${meta.groupLabel}`;
  const fieldIssueCount = Object.keys(cellErr).length;
  const structuralIssues = [
    ...rowValidation.issues.filter(it => it.text !== 'Some fields are incomplete or out of range.'),
    ...(f.type === 'cancel' ? refundabilityIssues(activePolicy.rows, f.gForm.refundable !== false) : []),
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
            <div role="note" aria-label="Cancellation pricing rule" style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 9px', marginTop:8, border:`1px solid ${T.lineSoft}`, borderRadius:6, background:T.fill, color:T.inkSoft, fontSize:10.25, lineHeight:1.4 }}>
              <span aria-hidden="true" style={{ display:'flex', color:T.inkSoft, flexShrink:0 }}><IcInfo color={T.inkSoft} size={11}/></span>
              <span><strong style={{ color:T.ink }}>Pricing rule:</strong> charge whichever is greater—the active band penalty plus port fees, or the applicable deposit cancellation floor.</span>
            </div>
          )}
          <IssueList issues={activePolicy.issues || []}/>
        </PolicyRowsSubsection>
        <ParentAssignmentFields embedded type={f.type} form={activePolicy.pForm} set={setP} creation={true} groupRefundable={f.gForm.refundable}
          canActivate={activatable} activationLabel="Set on activation"
          activateHelp={`Activation requires at least one valid ${meta.childWord.toLowerCase()}.`}/>
      </>);
    return (
      <PolicyDraftAccordion type={f.type} drafts={drafts} activeIndex={activeIndex} onSelect={selectPolicy} onAdd={addPolicy} onRemove={removePolicy}
        context={{ name:f.gForm.name || '—', code:f.groupCode, onEdit:groupLocked ? null : () => goto(1) }} groupRefundable={f.gForm.refundable} body={activeBody}/>
    );
  };

  const footer = () => {
    if (f.step === 1) return (<>
      <button type="button" style={polGhost} onClick={onCancel}>Cancel</button>
      <button type="button" disabled={!groupName} style={{ ...polDark, opacity:groupName ? 1 : .4, cursor:groupName ? 'pointer' : 'not-allowed' }} onClick={continueToPolicies}>Continue</button>
    </>);
    return (<>
      {!groupLocked && <button style={polGhost} onClick={() => goto(1)}>Back</button>}
      <button style={polDark} onClick={onActivate}>{drafts.length > 1 ? `Activate ${drafts.length} policies` : 'Activate'}</button>
    </>);
  };

  return (
    <PolDrawerFrame detailLabel={f.entry === 'resume' ? 'Finish Policy Setup' : groupLocked ? 'New Policy' : 'New Policy Group'}
      code={f.step === 1 && !groupLocked ? f.groupCode : `${f.groupCode} · ${activePolicy.parentCode}`} badge={<TypeBadge type={f.type}/>} status={f.entry === 'resume' ? 'Draft' : null} title={title}
      sub={f.entry === 'resume' ? 'Complete the remaining setup, then activate the policy chain.' : 'Nothing is saved until you choose Activate on the last step.'} onClose={onCancel}
      afterHeader={<div style={{ paddingTop:16, borderBottom:`1px solid ${T.line}`, background:T.fill, flexShrink:0 }}><StepDots step={f.step} labels={labels}/></div>}
      footer={<><span style={{ fontSize:11, color:T.inkFaint, whiteSpace:'nowrap' }}>Step {f.step} of 2</span><div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>{footer()}</div></>}>
      {body()}
    </PolDrawerFrame>
  );
}

/* Inline-edit of an existing Group or Parent — same drawer shell as the creation flow. */
function PolEditDrawer({ edit, group, parent, setEdit, activatable, onCancel, onSave }) {
  const isGroup = edit.level === 'group';
  const g = group, p = parent, meta = POL_META[g.type];
  const cellErr = isGroup ? {} : validateRows(edit.rows).cell;
  const setForm = patch => setEdit(e => ({ ...e, form:{ ...e.form, ...patch }, err:null, issues:[] }));
  return (
    <PolDrawerFrame detailLabel={isGroup ? 'Edit Policy Group' : 'Edit Policy'} code={isGroup ? g.code : p.code}
      badge={<TypeBadge type={g.type}/>} status={isGroup ? g.status : p.status} title={isGroup ? g.name : p.name}
      sub={isGroup ? `${meta.groupLabel} · Changes apply to every policy assignment referencing this group.` : `In ${g.name} (${g.code}) · Policy fields and its ${meta.childWords.toLowerCase()} save together.`}
      onClose={onCancel}
      footer={<><span style={{ fontSize:11, color:T.inkFaint, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'38%' }}>Last modified {isGroup ? g.mod : p.mod} · {isGroup ? g.editor : p.editor}</span><div style={{ marginLeft:'auto', display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}><button style={polGhost} onClick={onCancel}>Cancel</button><button style={polDark} onClick={onSave}>Save changes</button></div></>}>
      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {isGroup ? (
              <>
                <Recap items={[{ label:'Policies inside', value:`${g.parents.length} · ${g.parents.filter(x => x.status === 'Active').length} active`, code:g.code }]}/>
                <GroupFields type={g.type} form={edit.form} err={edit.err} canActivate={g.parents.some(x => x.status === 'Active')} set={setForm}/>
                <IssueList issues={edit.issues || []} title="Cannot apply group terms"/>
              </>
            ) : (
              <>
                <ParentFields type={g.type} form={edit.form} err={edit.err} set={setForm}
                  context={{ name:g.name, code:g.code }}>
                  <PolicyRowsSubsection id="edit-policy-rows-title" type={g.type} codeNum={codeNumOf(p.code)} rows={edit.rows}
                    setRows={r => setEdit(e => ({ ...e, rows:r, issues:[] }))} cellErr={cellErr} validationAttempt={edit.validationAttempt || 0}/>
                  <ParentAssignmentFields embedded type={g.type} form={edit.form} set={setForm} canActivate={activatable} groupRefundable={g.isRefundable}
                    activateHelp={`Needs at least one valid ${meta.childWord.toLowerCase()}.`}/>
                  <IssueList issues={edit.issues || []} title="Resolve before saving as Active"/>
                </ParentFields>
              </>
            )}
      </div>
    </PolDrawerFrame>
  );
}

Object.assign(window, { PolFlowDrawer, PolEditDrawer, PolDrawerFrame, StepDots, Recap, FlowContext, PolicyRowsSubsection });
