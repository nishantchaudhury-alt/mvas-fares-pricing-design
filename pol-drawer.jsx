// pol-drawer.jsx — guided Group → Parent → Child creation flow, as a right-side drawer (1.2).
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

function PolFlowDrawer({ flow, setFlow, activatable, onCancel, onActivate }) {
  const f = flow, meta = POL_META[f.type];
  const setG = patch => setFlow(x => ({ ...x, gForm:{ ...x.gForm, ...patch } }));
  const setP = patch => setFlow(x => ({ ...x, pForm:{ ...x.pForm, ...patch } }));
  const goto = step => setFlow(x => ({ ...x, step, issues:[] }));
  const Grid = RowCards;
  const rowValidation = validateRows(f.rows);
  const cellErr = rowValidation.cell;
  const groupLocked = f.entry === 'addPolicy';
  const labels = [groupLocked ? 'Group' : 'Group', 'Policy', f.type === 'deposit' ? 'Lines' : 'Bands'];
  const title = f.entry === 'resume' ? `Finish setup — ${f.gForm.name || meta.groupLabel}`
    : groupLocked ? `New policy in ${f.gForm.name}` : `New ${meta.groupLabel}`;

  const body = () => {
    if (f.step === 1) return (
      <GroupFields step="01" type={f.type} form={f.gForm} err={f.err} canActivate={false} set={setG}/>
    );
    if (f.step === 2) return (
      <ParentFields step="02" type={f.type} form={f.pForm} err={f.err} canActivate={false}
        activationLabel="Set on final step" activateHelp={`Activation is available on the final step after at least one valid ${meta.childWord.toLowerCase()}.`} set={setP}
        context={{ name:f.gForm.name || '—', code:f.groupCode, onEdit:groupLocked ? null : () => goto(1) }}/>
    );
    const fieldIssueCount = Object.keys(cellErr).length;
    const structuralIssues = rowValidation.issues.filter(it => it.text !== 'Some fields are incomplete or out of range.');
    const issueCount = fieldIssueCount + structuralIssues.length;
    const ready = f.rows.length > 0 && issueCount === 0;
    const readinessHelp = ready
      ? `${f.rows.length} ${f.rows.length === 1 ? meta.childWord.toLowerCase() : meta.childWords.toLowerCase()} configured with continuous DTS and stateroom coverage.`
      : fieldIssueCount
        ? `Complete required values, then confirm continuous DTS and stateroom coverage before activation.`
        : `Resolve DTS ordering or coverage so every day through End DTS 0 and every stateroom category is covered.`;
    return (
      <section aria-labelledby="policy-lines-title" style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.06)', overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'13px 16px', background:T.fill, borderBottom:`1px solid ${T.line}` }}>
          <span aria-hidden="true" style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>03</span>
          <div style={{ minWidth:0 }}>
            <h3 id="policy-lines-title" style={{ fontSize:16, fontWeight:700, color:T.ink, margin:'0 0 3px' }}>{meta.childWords}</h3>
            <p style={{ fontSize:12, color:T.inkSoft, lineHeight:1.45, margin:0 }}>Configure ordered DTS windows, {f.type === 'deposit' ? 'deposit amounts' : 'penalties'}, and stateroom coverage.</p>
          </div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:14, padding:'16px' }}>
          <FlowContext items={[
            { label:'Group', value:f.gForm.name || '—', code:f.groupCode, onEdit:groupLocked ? null : () => goto(1) },
            { label:'Policy', value:f.pForm.name || '—', code:f.parentCode, onEdit:() => goto(2) },
          ]}/>
          <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 12px', borderRadius:8, background:ready ? '#ECFDF5' : '#FFFBEB', border:`1px solid ${ready ? '#A7F3D0' : '#FCD34D'}` }}>
            <span aria-hidden="true" style={{ width:24, height:24, borderRadius:'50%', background:'#fff', border:`1px solid ${ready ? '#A7F3D0' : '#FCD34D'}`, color:ready ? '#047857' : '#92400E', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:12, fontWeight:800 }}>{ready ? '✓' : '!'}</span>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:T.ink }}>{ready ? 'Ready for activation' : 'Complete the required fields'}</div>
              <div style={{ fontSize:11, color:T.inkSoft, lineHeight:1.45, marginTop:2 }}>{readinessHelp}</div>
            </div>
            <span style={{ padding:'3px 7px', borderRadius:999, background:'#fff', border:`1px solid ${ready ? '#A7F3D0' : '#FCD34D'}`, color:ready ? '#047857' : '#92400E', fontSize:9.5, fontWeight:800, whiteSpace:'nowrap' }}>{ready ? 'Ready' : `${issueCount} ${issueCount === 1 ? 'issue' : 'issues'}`}</span>
          </div>
          <Grid type={f.type} codeNum={codeNumOf(f.parentCode)} rows={f.rows} setRows={r => setFlow(x => ({ ...x, rows:r }))} cellErr={cellErr} editing={true}/>
          {f.type === 'cancel' && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'9px 11px', borderRadius:8, background:T.fill, border:`1px solid ${T.lineSoft}`, color:T.inkSoft, fontSize:11, lineHeight:1.45 }}>
              <span aria-hidden="true" style={{ color:T.primary, fontWeight:800 }}>i</span>
              <span>Cancellation charge is the greater of the active band amount plus port fees or the applicable deposit cancellation floor.</span>
            </div>
          )}
          <IssueList issues={f.issues}/>
        </div>
      </section>
    );
  };

  const footer = () => {
    if (f.step === 1) return (<>
      <button style={{ ...polDark, opacity:f.gForm.name.trim() ? 1 : .4, cursor:f.gForm.name.trim() ? 'pointer' : 'not-allowed' }}
        onClick={() => f.gForm.name.trim() && goto(2)}>Continue</button>
    </>);
    if (f.step === 2) return (<>
      {!groupLocked && <button style={polGhost} onClick={() => goto(1)}>Back</button>}
      <button style={{ ...polDark, opacity:f.pForm.name.trim() ? 1 : .4, cursor:f.pForm.name.trim() ? 'pointer' : 'not-allowed' }}
        onClick={() => f.pForm.name.trim() && setFlow(x => ({ ...x, step:3, issues:[], rows:x.rows.length ? x.rows : [blankChild(x.type)] }))}>Continue</button>
    </>);
    return (<>
      <button style={polGhost} onClick={() => goto(2)}>Back</button>
      <button style={polDark} onClick={onActivate}>Activate</button>
    </>);
  };

  return (
    <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.42)', zIndex:1000, display:'flex', justifyContent:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'clamp(400px, 40%, 760px)', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow:'-14px 0 44px rgba(15,23,42,.18)' }}>
        <div style={{ padding:'16px 20px 12px', borderBottom:`1px solid ${T.lineSoft}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
            <div style={{ minWidth:0, flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, minWidth:0 }}>
                <TypeBadge type={f.type}/>
                <span style={{ fontFamily:MONO, fontSize:10.5, fontWeight:700, color:T.inkFaint, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.groupCode} · {f.parentCode}</span>
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
          <span style={{ fontSize:11, color:T.inkFaint, whiteSpace:'nowrap' }}>Step {f.step} of 3</span>
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
  const Grid = RowCards;
  const cellErr = isGroup ? {} : validateRows(edit.rows).cell;
  const setForm = patch => setEdit(e => ({ ...e, form:{ ...e.form, ...patch }, err:null }));
  return (
    <div onClick={onCancel} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.42)', zIndex:1000, display:'flex', justifyContent:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'clamp(400px, 40%, 760px)', height:'100%', background:'#fff', display:'flex', flexDirection:'column', boxShadow:'-14px 0 44px rgba(15,23,42,.18)' }}>
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
                <ParentFields type={g.type} form={edit.form} err={edit.err} canActivate={activatable}
                  activateHelp={`Needs at least one valid ${meta.childWord.toLowerCase()}.`} set={setForm}
                  context={{ name:g.name, code:g.code }}/>
                <section aria-labelledby="edit-policy-rows-title" style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 2px rgba(15,23,42,.06)' }}>
                  <div style={{ padding:'12px 14px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, background:T.fill, borderBottom:`1px solid ${T.line}` }}>
                    <div style={{ minWidth:0 }}>
                      <h3 id="edit-policy-rows-title" style={{ margin:0, color:T.ink, fontSize:15, fontWeight:700 }}>{meta.childWords}</h3>
                      <p style={{ margin:'3px 0 0', color:T.inkSoft, fontSize:11.5, lineHeight:1.45 }}>Ordered DTS windows define {g.type === 'deposit' ? 'deposit amounts' : 'cancellation penalties'}. Drag to reorder; every window must cover all stateroom categories.</p>
                    </div>
                    <span style={{ flexShrink:0, padding:'3px 8px', borderRadius:999, border:`1px solid ${T.line}`, background:'#fff', color:T.inkSoft, fontSize:10.5, fontWeight:700 }}>{edit.rows.length} {edit.rows.length === 1 ? meta.childWord.toLowerCase() : meta.childWords.toLowerCase()}</span>
                  </div>
                  <div style={{ padding:'14px' }}>
                    <Grid type={g.type} codeNum={codeNumOf(p.code)} rows={edit.rows} setRows={r => setEdit(e => ({ ...e, rows:r }))} cellErr={cellErr} editing={true}/>
                  </div>
                </section>
                <IssueList issues={edit.issues || []} title="Resolve before saving as Active"/>
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

Object.assign(window, { PolFlowDrawer, PolEditDrawer, StepDots, Recap, FlowContext });
