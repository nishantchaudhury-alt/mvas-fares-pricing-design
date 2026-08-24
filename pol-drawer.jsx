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

function PolFlowDrawer({ flow, setFlow, activatable, onCancel, onActivate }) {
  const f = flow, meta = POL_META[f.type];
  const setG = patch => setFlow(x => ({ ...x, gForm:{ ...x.gForm, ...patch } }));
  const setP = patch => setFlow(x => ({ ...x, pForm:{ ...x.pForm, ...patch } }));
  const goto = step => setFlow(x => ({ ...x, step, issues:[] }));
  const Grid = RowCards;
  const cellErr = validateRows(f.rows).cell;
  const groupLocked = f.entry === 'addPolicy';
  const labels = [groupLocked ? 'Group' : 'Group', 'Policy', f.type === 'deposit' ? 'Lines' : 'Bands'];
  const title = f.entry === 'resume' ? `Finish setup — ${f.gForm.name || meta.groupLabel}`
    : groupLocked ? `New policy in ${f.gForm.name}` : `New ${meta.groupLabel}`;

  const body = () => {
    if (f.step === 1) return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <SectionHead title="Group details" helper="Groups organize reusable policies of one type. The type is locked once the chain is created."/>
        <GroupFields type={f.type} form={f.gForm} err={f.err} canActivate={false} set={setG}/>
      </div>
    );
    if (f.step === 2) return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Recap items={[{ label:'Group', value:f.gForm.name || '—', code:f.groupCode, onEdit:groupLocked ? null : () => goto(1) }]}/>
        <SectionHead title="Policy details" helper={`The policy holds the ordered ${meta.childWords.toLowerCase()} and is what Farecodes actually reference.`}/>
        <ParentFields type={f.type} form={f.pForm} err={f.err} canActivate={false} activateHelp={`Set on the last step, once there is at least one valid ${meta.childWord.toLowerCase()}.`} set={setP}/>
      </div>
    );
    return (
      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        <Recap items={[
          { label:'Group', value:f.gForm.name || '—', code:f.groupCode, onEdit:groupLocked ? null : () => goto(1) },
          { label:'Policy', value:f.pForm.name || '—', code:f.parentCode, onEdit:() => goto(2) },
        ]}/>
        <SectionHead title={meta.childWords} helper={`Add at least one ${meta.childWord.toLowerCase()} covering every stateroom category on this Farecode before activating.`}/>
        <Grid type={f.type} codeNum={codeNumOf(f.parentCode)} rows={f.rows} setRows={r => setFlow(x => ({ ...x, rows:r }))} cellErr={cellErr} editing={true}/>
        {f.type === 'cancel' && (
          <div style={{ fontSize:11.5, color:T.inkFaint, fontStyle:'italic', lineHeight:1.5 }}>
            Cancellation charge = max(% of cabin fare + port fees for the active band, full deposit paid when the deposit line has cancellation-applies ON).
          </div>
        )}
        <IssueList issues={f.issues}/>
      </div>
    );
  };

  const footer = () => {
    if (f.step === 1) return (<>
      <button style={polGhost} onClick={onCancel}>Cancel</button>
      <button style={{ ...polDark, opacity:f.gForm.name.trim() ? 1 : .4, cursor:f.gForm.name.trim() ? 'pointer' : 'not-allowed' }}
        onClick={() => f.gForm.name.trim() && goto(2)}>Continue →</button>
    </>);
    if (f.step === 2) return (<>
      {!groupLocked && <button style={polGhost} onClick={() => goto(1)}>← Back</button>}
      <button style={polGhost} onClick={onCancel}>Cancel</button>
      <button style={{ ...polDark, opacity:f.pForm.name.trim() ? 1 : .4, cursor:f.pForm.name.trim() ? 'pointer' : 'not-allowed' }}
        onClick={() => f.pForm.name.trim() && setFlow(x => ({ ...x, step:3, issues:[], rows:x.rows.length ? x.rows : [blankChild(x.type)] }))}>Continue →</button>
    </>);
    return (<>
      <button style={polGhost} onClick={() => goto(2)}>← Back</button>
      <button style={polGhost} onClick={onCancel}>Cancel</button>
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
            <button onClick={onCancel} style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.line}`, background:'#fff', cursor:'pointer', color:T.inkSoft, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IcX size={13}/></button>
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
            <button onClick={onCancel} style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.line}`, background:'#fff', cursor:'pointer', color:T.inkSoft, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><IcX size={13}/></button>
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
                <Recap items={[{ label:'Group', value:g.name, code:g.code }]}/>
                <ParentFields type={g.type} form={edit.form} err={edit.err} canActivate={activatable}
                  activateHelp={`Needs at least one valid ${meta.childWord.toLowerCase()}.`} set={setForm}/>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <SectionHead title={meta.childWords} helper={`Ordered by index — drag to reorder. Every stateroom category must be covered in each DTS window.`}/>
                  <Grid type={g.type} codeNum={codeNumOf(p.code)} rows={edit.rows} setRows={r => setEdit(e => ({ ...e, rows:r }))} cellErr={cellErr} editing={true}/>
                </div>
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

Object.assign(window, { PolFlowDrawer, PolEditDrawer, StepDots, Recap });
