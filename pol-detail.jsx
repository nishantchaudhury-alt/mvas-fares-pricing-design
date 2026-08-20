// pol-detail.jsx — read-only detail drawer for a Group or a Parent policy (view-through from the list).
const { useState: useSDt } = React;

/* Definition-list row: fixed-width label, flexible value — reads cleanly at any drawer width
   without the auto-fit-grid wrapping problem. */
function ConfigRow({ label, first, children }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:16, padding:'11px 0', borderTop:first ? 'none' : `1px solid ${T.lineSoft}` }}>
      <span style={{ width:112, flexShrink:0, fontSize:10, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px', paddingTop:2 }}>{label}</span>
      <div style={{ flex:1, fontSize:13, color:T.ink, lineHeight:1.5, minWidth:0, overflowWrap:'anywhere' }}>{children}</div>
    </div>
  );
}
function ConfigName({ children }) {
  return <span style={{ fontSize:14.5, fontWeight:650, letterSpacing:'-.1px' }}>{children}</span>;
}
const flagRow = { display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' };

function DetailShell({ badge, code, title, sub, tabs, tab, setTab, actions, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.42)', zIndex:900, display:'flex', justifyContent:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'clamp(400px, 40%, 760px)', height:'100%', background:T.bg, display:'flex', flexDirection:'column', boxShadow:'-14px 0 44px rgba(15,23,42,.18)' }}>
        <div style={{ padding:'16px 18px 0', background:'#fff', borderBottom:`1px solid ${T.line}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div style={{ minWidth:180, flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, minWidth:0 }}>
                {badge}<span style={{ fontFamily:MONO, fontSize:11, fontWeight:700, color:T.tealDark, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{code}</span>
              </div>
              <h2 style={{ fontSize:17.5, fontWeight:700, color:T.ink }}>{title}</h2>
              <div style={{ fontSize:12.5, color:T.inkSoft, marginTop:3 }}>{sub}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
              {actions}
              <button onClick={onClose} style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.line}`, background:'#fff', cursor:'pointer', color:T.inkSoft, display:'flex', alignItems:'center', justifyContent:'center' }}><IcX size={13}/></button>
            </div>
          </div>
          <div className="hscroll" style={{ marginTop:14, overflowX:'auto' }}><div style={{ minWidth:'max-content' }}><Tabs active={tab} onChange={setTab} tabs={tabs}/></div></div>
        </div>
        <div className="pscroll" style={{ flex:1, overflowY:'auto', padding:'18px 18px 26px' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function PolDetailDrawer({ target, policies, depParents, onClose, onOpenParent, onEdit, onToggleActive, onDelete, onAddPolicy, onFinish }) {
  const [tab, setTab] = useSDt(target.tab || 'overview');
  const g = policies.find(x => x.id === target.groupId);
  if (!g) return null;
  const p = target.parentId ? g.parents.find(x => x.id === target.parentId) : null;
  const meta = POL_META[g.type];
  const isGroup = !p;
  const kids = p ? kidsOf(p) : [];
  const v = p ? validateRows(kids) : null;
  const refundIssues = p && g.type === 'cancel' ? refundabilityIssues(kids, p.isRefundable !== false) : [];
  const editBtn = { ...polBtn, background:T.primary, color:'#fff', display:'inline-flex', alignItems:'center', gap:6 };

  const tabs = isGroup
    ? [{ k:'overview', l:'Overview' }, { k:'children', l:'Policies', count:g.parents.length }, { k:'audit', l:'History' }]
    : [{ k:'overview', l:'Overview' }, { k:'children', l:g.type === 'deposit' ? 'Lines' : 'Bands', count:kids.length }, { k:'used', l:'Used In', count:(p.usedInFaretypes?.length || 0) + (p.usedInFarecodes?.length || 0) }, { k:'audit', l:'History' }];

  const groupOverview = (
    <>
      <SCard title="Group Configuration" pad="0 16px"><div style={{ display:'flex', flexDirection:'column' }}>
        <ConfigRow label="Name" first><ConfigName>{g.name}</ConfigName></ConfigRow>
        <ConfigRow label="Code"><span style={{ fontFamily:MONO, fontWeight:700, fontSize:12.5 }}>{g.code}</span></ConfigRow>
        <ConfigRow label="Flags">
          <div style={flagRow}>
            <TypeBadge type={g.type}/><PolStatusBadge status={g.status}/>
            {g.isDefault && <Pill>Default</Pill>}
            {g.type === 'cancel' && <Pill bg={g.isRefundable === false ? '#FEF2F2' : '#ECFDF5'} color={g.isRefundable === false ? '#991B1B' : '#065F46'}>{g.isRefundable === false ? 'Non-Refundable' : 'Refundable'}</Pill>}
          </div>
        </ConfigRow>
        <ConfigRow label="Policies">{g.parents.length} inside · {g.parents.filter(x => x.status === 'Active').length} active</ConfigRow>
        <ConfigRow label="Referenced by">{usedInGroup(g)} Faretype / Farecode records</ConfigRow>
        <ConfigRow label="Modified"><span style={{ color:T.inkSoft }}>{g.mod} · {g.editor}</span></ConfigRow>
        </div>
      </SCard>
      {g.status === 'Draft' && <Banner level="warn" title="Draft chain">This group was saved before its policy was finished. Use Finish setup to complete the remaining steps.</Banner>}
      {g.status !== 'Active' && g.status !== 'Draft' && !g.parents.some(x => x.status === 'Active') && (
        <Banner level="info" title="Cannot be activated yet">A group needs at least one active policy inside it.</Banner>
      )}
    </>
  );

  const groupChildren = (
    <SCard title={`Policies in ${g.name}`} pad="0">
      {g.parents.length === 0 ? <div style={{ padding:'40px 20px', textAlign:'center', fontSize:13, color:T.inkSoft }}>No policies in this group yet.</div> : g.parents.map((x, i) => {
        const k = kidsOf(x), ok = k.length > 0 && validateRows(k).issues.length === 0;
        return (
          <div key={x.id} onClick={() => { onOpenParent(x); setTab('overview'); }} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderTop:i ? `1px solid ${T.lineSoft}` : 'none', cursor:'pointer', flexWrap:'wrap' }}
            onMouseEnter={e => e.currentTarget.style.background = T.fill} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontFamily:MONO, fontSize:11.5, fontWeight:700, color:T.tealDark }}>{x.code}</span>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600 }}>{x.name}{x.isDefault && <Pill>Default</Pill>}</div>
              <div style={{ fontSize:11.5, color:T.inkFaint, marginTop:3, display:'flex', gap:10 }}>
                <span>{k.length} {k.length === 1 ? meta.childWord.toLowerCase() : meta.childWords.toLowerCase()}</span>
                <CoverPill ok={ok} label={k.length === 0 ? 'No lines yet' : ok ? 'Coverage complete' : 'Window/coverage gaps'}/>
              </div>
            </div>
            <span style={{ fontSize:12, color:T.inkSoft }}>{x.usedIn > 0 ? `Used in ${x.usedIn} records` : '0 references'}</span>
            <PolStatusBadge status={x.status}/>
            <span style={{ color:T.inkFaint, fontSize:14 }}>›</span>
          </div>
        );
      })}
    </SCard>
  );

  const parentOverview = !p ? null : (
    <>
      <SCard title="Policy Configuration" pad="0 16px"><div style={{ display:'flex', flexDirection:'column' }}>
        <ConfigRow label="Name" first><ConfigName>{p.name}</ConfigName></ConfigRow>
        <ConfigRow label="Code"><span style={{ fontFamily:MONO, fontWeight:700, fontSize:12.5 }}>{p.code}</span></ConfigRow>
        <ConfigRow label="Group">
          <div style={flagRow}><TypeBadge type={g.type}/><span>{g.name}</span><span style={{ fontFamily:MONO, fontSize:11, color:T.inkFaint }}>{g.code}</span></div>
        </ConfigRow>
        <ConfigRow label="Flags">
          <div style={flagRow}>
            <PolStatusBadge status={p.status}/>
            {p.isDefault && <Pill>Default</Pill>}
            {g.type === 'cancel' && <Pill bg={p.isRefundable === false ? '#FEF2F2' : '#ECFDF5'} color={p.isRefundable === false ? '#991B1B' : '#065F46'}>{p.isRefundable === false ? 'Non-Refundable' : 'Refundable'}</Pill>}
          </div>
        </ConfigRow>
        <ConfigRow label={g.type === 'deposit' ? 'Lines' : 'Bands'}>
          <div style={flagRow}>{kids.length} configured <CoverPill ok={v.issues.length === 0 && kids.length > 0} label={kids.length === 0 ? 'None configured' : v.issues.length === 0 ? 'Coverage complete' : 'Window/coverage gaps'}/></div>
        </ConfigRow>
        <ConfigRow label="Referenced by">{p.usedIn > 0 ? `${p.usedIn} Faretype / Farecode records` : 'Not referenced'}</ConfigRow>
        <ConfigRow label="Modified"><span style={{ color:T.inkSoft }}>{p.mod} · {p.editor}</span></ConfigRow>
        </div>
      </SCard>
      <SCard title={g.type === 'deposit' ? 'Resolved Deposit by Window' : 'Resolved Penalty by Window'} pad="0">
        {kids.length === 0 ? <div style={{ padding:'32px 20px', textAlign:'center', fontSize:13, color:T.inkSoft }}>No {meta.childWords.toLowerCase()} configured yet.</div> : kids.map((r, i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderTop:i ? `1px solid ${T.lineSoft}` : 'none', fontSize:12.5, flexWrap:'wrap' }}>
            <span style={{ fontFamily:MONO, fontSize:11.5, fontWeight:700, color:T.inkSoft, width:56 }}>{childCode(p.code, i)}</span>
            <span style={{ color:T.inkSoft }}>{childSummary(g.type, r)}</span>
          </div>
        ))}
      </SCard>
      {v.issues.length > 0 && <IssueList issues={v.issues} title="Configuration gaps"/>}
      {refundIssues.length > 0 && <IssueList issues={refundIssues} title="Refundability conflict"/>}
      {g.type === 'deposit' && <HelpList items={DEP_HELP}/>}
      {g.type === 'cancel' && <HelpList items={PEN_HELP}/>}
    </>
  );

  const parentChildren = !p ? null : (
    <>
      <SCard title={meta.childWords} right={<span style={{ fontSize:11.5, color:T.inkFaint }}>Read-only — use Edit to change</span>} pad="14px 16px">
        {kids.length === 0
          ? <div style={{ padding:'28px 12px', textAlign:'center', fontSize:13, color:T.inkSoft }}>No {meta.childWords.toLowerCase()} yet.</div>
          : <RowCards type={g.type} codeNum={codeNumOf(p.code)} rows={kids} setRows={() => {}} editing={false}/>}
      </SCard>
      {g.type === 'cancel' && kids.length > 0 && (
        <Banner level="info" title="Charge formula">Cancellation charge = max(% of cabin fare + port fees for the active band, full deposit paid when the deposit line has cancellation-applies ON).</Banner>
      )}
    </>
  );

  const actions = (
    <>
      {(g.status === 'Draft' || (p && p.status === 'Draft')) && (
        <button style={{ ...polGhost, color:'#15803D', borderColor:'#A7F3D0' }} onClick={() => onFinish(g, p)}>Finish setup</button>
      )}
      {isGroup && <button style={polGhost} onClick={() => onAddPolicy(g)}>+ Add policy</button>}
      <button style={editBtn} onClick={() => onEdit(g, p)}><IcEdit/>{isGroup ? 'Edit group' : 'Edit policy'}</button>
      <RowMenu items={[
        (isGroup ? g.status : p.status) === 'Active'
          ? { icon:'⊘', label:'Deactivate', danger:true, onClick:() => onToggleActive(g, p) }
          : { icon:'✓', label:'Activate', success:true, onClick:() => onToggleActive(g, p) },
        { sep:true },
        { icon:'⌫', label:'Delete', danger:true, disabled:(isGroup ? usedInGroup(g) : p.usedIn) > 0, title:'In use by Faretypes/Farecodes.', onClick:() => onDelete(g, p) },
      ]}/>
    </>
  );

  return (
    <DetailShell badge={<TypeBadge type={g.type}/>} code={isGroup ? g.code : `${g.code} › ${p.code}`}
      title={isGroup ? g.name : p.name}
      sub={isGroup ? `${meta.groupLabel} · ${g.parents.length} ${g.parents.length === 1 ? 'policy' : 'policies'} · last modified ${g.mod}`
                   : `${meta.label} policy in ${g.name} · last modified ${p.mod}`}
      tabs={tabs} tab={tab} setTab={setTab} actions={actions} onClose={onClose}>
      {tab === 'overview' && (isGroup ? groupOverview : parentOverview)}
      {tab === 'children' && (isGroup ? groupChildren : parentChildren)}
      {tab === 'used' && !isGroup && <UsedInTables row={p}/>}
      {tab === 'audit' && <AuditList status={isGroup ? g.status : p.status} label={isGroup ? 'Group' : 'Policy'}/>}
    </DetailShell>
  );
}

Object.assign(window, { PolDetailDrawer, DetailShell });
