// pol-detail.jsx — read-only detail drawer for a Group or a Parent policy (view-through from the list).
const { useState: useSDt } = React;

function PolDetailCard({ number, title, description, aside, children, pad = '14px 16px 16px' }) {
  const uid = React.useId().replace(/:/g, '');
  const titleId = `policy-detail-card-${uid}`;
  return (
    <section aria-labelledby={titleId} style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 2px rgba(15,23,42,.05)' }}>
      <div style={{ padding:'11px 14px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:9, minWidth:0 }}>
          {number && <span aria-hidden="true" style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>{String(number).padStart(2, '0')}</span>}
          <div style={{ minWidth:0 }}>
            <h3 id={titleId} style={{ fontSize:14.5, fontWeight:700, color:T.ink, margin:0 }}>{title}</h3>
            {description && <p style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.45, margin:'3px 0 0' }}>{description}</p>}
          </div>
        </div>
        {aside && <div style={{ flexShrink:0 }}>{aside}</div>}
      </div>
      <div style={{ padding:pad, display:'flex', flexDirection:'column', gap:14 }}>{children}</div>
    </section>
  );
}

function PolActivityHistory({ status, label }) {
  const log = AUDIT(label, status);
  const uid = React.useId().replace(/:/g, '');
  const titleId = `policy-history-${uid}`;
  return (
    <section aria-labelledby={titleId} style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 1px 2px rgba(15,23,42,.05)', overflow:'hidden' }}>
      <div style={{ padding:'10px 13px', background:T.fill, borderBottom:`1px solid ${T.line}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <h3 id={titleId} style={{ fontSize:13, fontWeight:700, color:T.ink, margin:0 }}>Activity History</h3>
          <span style={{ padding:'2px 7px', borderRadius:999, background:'#fff', border:`1px solid ${T.line}`, color:T.inkSoft, fontSize:10.5, fontWeight:700 }}>{log.length}</span>
        </div>
        <span style={{ fontSize:10.5, color:T.inkFaint }}>Newest first</span>
      </div>
      <div style={{ padding:'2px 0' }}>
        {log.map((e, i) => {
          const positive = /activated|created/i.test(e.event);
          return (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'34px minmax(0,1fr) auto', gap:10, padding:'12px 14px', position:'relative', borderBottom:i < log.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
              <div aria-hidden="true" style={{ position:'relative', display:'flex', justifyContent:'center' }}>
                {i < log.length - 1 && <span style={{ position:'absolute', top:24, bottom:-18, width:1, background:T.line }}/>}
                <span style={{ width:24, height:24, borderRadius:'50%', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', background:positive ? T.greenLight : T.primaryBg, border:`1px solid ${positive ? '#A7F3D0' : T.primaryLine}`, color:positive ? T.green : T.primary, fontSize:11, fontWeight:800 }}>{positive ? '✓' : '•'}</span>
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:T.ink, lineHeight:1.3 }}>{e.event}</div>
                <span style={{ display:'inline-flex', marginTop:6, padding:'4px 7px', borderRadius:5, background:T.fill, border:`1px solid ${T.lineSoft}`, color:T.inkSoft, fontSize:11.5, lineHeight:1.2 }}>{e.detail}</span>
              </div>
              <div style={{ textAlign:'right', paddingTop:1, minWidth:138 }}>
                <div style={{ fontSize:11, color:T.inkSoft, whiteSpace:'nowrap' }}>{e.ts}</div>
                <span style={{ display:'inline-flex', marginTop:6, padding:'2px 6px', borderRadius:5, background:T.fill, color:T.inkFaint, fontSize:10.5 }}>{e.editor}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DetailShell({ detailLabel, badge, status, code, title, sub, tabs, tab, setTab, actions, onBack, backLabel, onClose, children }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.32)', backdropFilter:'blur(2px)', zIndex:900, opacity:mounted ? 1 : 0, transition:'opacity 220ms ease-out' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:1180, maxWidth:'100%', background:T.bg, zIndex:901, display:'flex', flexDirection:'column', boxShadow:'-8px 0 48px rgba(15,23,42,.2)', transform:mounted ? 'translateX(0)' : 'translateX(100%)', transition:'transform 220ms ease-out' }}>
        <div style={{ height:52, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 22px', borderBottom:`1px solid ${T.line}`, flexShrink:0, background:'#fff' }}>
          <div style={{ minWidth:0, display:'flex', alignItems:'center', gap:8 }}>
            {onBack && (
              <>
                <button type="button" aria-label={`Back to ${backLabel}`} title={`Back to ${backLabel}`} onClick={onBack}
                  style={{ minWidth:0, maxWidth:300, padding:'6px 8px', marginLeft:-8, border:'none', borderRadius:7, background:'transparent', color:T.primary, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7, fontSize:12.5, fontWeight:650 }}
                  onMouseEnter={event => { event.currentTarget.style.background = T.primaryBg; }}
                  onMouseLeave={event => { event.currentTarget.style.background = 'transparent'; }}>
                  <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 18 5 12 11 6"/></svg>
                  <span style={{ minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{backLabel}</span>
                </button>
                <span aria-hidden="true" style={{ color:T.line, fontSize:16 }}>/</span>
              </>
            )}
            <span style={{ flexShrink:0, fontSize:14, fontWeight:700, color:T.ink }}>{detailLabel}</span>
          </div>
          <button type="button" aria-label="Close policy details" onClick={onClose}
            style={{ width:30, height:30, borderRadius:7, background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.inkFaint }}
            onMouseEnter={event => { event.currentTarget.style.background = T.fill; event.currentTarget.style.color = T.ink; }}
            onMouseLeave={event => { event.currentTarget.style.background = 'none'; event.currentTarget.style.color = T.inkFaint; }}>
            <IcX size={14}/>
          </button>
        </div>

        <div style={{ background:'#fff', padding:'14px 22px', borderBottom:`1px solid ${T.line}`, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0, flexWrap:'wrap' }}>
              <span style={{ fontFamily:MONO, fontSize:16, fontWeight:700, color:T.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{code}</span>
              <PolStatusBadge status={status}/>
              {badge}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>{actions}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6, minWidth:0, fontSize:11.5, color:T.inkFaint, flexWrap:'wrap' }}>
            <span style={{ color:T.ink, fontWeight:700 }}>{title}</span>
            <span>•</span>
            <span>{sub}</span>
          </div>
        </div>

        <div role="tablist" aria-label={`${detailLabel} sections`} className="hscroll" style={{ display:'flex', padding:'0 22px', background:'#fff', borderBottom:`1px solid ${T.line}`, flexShrink:0, overflowX:'auto' }}>
          {tabs.map(item => (
            <button key={item.k} type="button" role="tab" aria-selected={tab === item.k} onClick={() => setTab(item.k)}
              style={{ background:'none', border:'none', padding:'11px 16px 9px', fontSize:13, fontWeight:tab === item.k ? 600 : 500, color:tab === item.k ? T.ink : T.inkSoft, borderBottom:tab === item.k ? `2px solid ${T.primary}` : '2px solid transparent', cursor:'pointer', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap', transition:'color .15s' }}>
              {item.l}
              {item.count !== undefined && <span style={{ padding:'1px 7px', borderRadius:999, fontSize:11, fontWeight:600, background:tab === item.k ? T.primaryBg : T.fill, color:tab === item.k ? T.primary : T.inkFaint }}>{item.count}</span>}
            </button>
          ))}
        </div>

        <div className="pscroll" style={{ flex:1, overflowY:'auto', padding:'16px 22px 28px', background:T.bg }}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>{children}</div>
        </div>
      </div>
    </>
  );
}

function PolDetailDrawer({ target, policies, depParents, onClose, onOpenParent, onBackToGroup, onEdit, onDelete, onAddPolicy, onFinish }) {
  const [tab, setTab] = useSDt(target.tab && target.tab !== 'overview' ? target.tab : 'children');
  const g = policies.find(x => x.id === target.groupId);
  if (!g) return null;
  const p = target.parentId ? g.parents.find(x => x.id === target.parentId) : null;
  const meta = POL_META[g.type];
  const isGroup = !p;
  const kids = p ? kidsOf(p) : [];
  const parentCats = p ? policyCatsOf(p) : [];
  const v = p ? validateRows(kids, { policyCoverage:parentCats }) : null;
  const refundIssues = p && g.type === 'cancel' ? refundabilityIssues(kids, g.isRefundable !== false) : [];
  const editBtn = { ...polBtn, background:T.primary, color:'#fff', display:'inline-flex', alignItems:'center', gap:6 };
  const isDraftTarget = g.status === 'Draft' || (p && p.status === 'Draft');
  const finishAction = isDraftTarget
    ? <button style={{ ...polGhost, whiteSpace:'nowrap' }} onClick={() => onFinish(g, p)}>Finish setup</button>
    : null;
  const listedReferences = p ? (p.usedInFaretypes?.length || 0) + (p.usedInFarecodes?.length || 0) : 0;
  const totalReferences = p ? Math.max(p.usedIn || 0, listedReferences) : 0;

  const tabs = isGroup
    ? [{ k:'children', l:'Policies', count:g.parents.length }, { k:'audit', l:'History' }]
    : [{ k:'children', l:g.type === 'deposit' ? 'Lines' : 'Bands', count:kids.length }, { k:'used', l:'Used In', count:totalReferences }, { k:'audit', l:'History' }];

  const groupChildren = (
    <>
      {g.status === 'Draft' && <Banner level="warn" title="Draft chain" action={finishAction}>This group was saved before its policy was finished. Complete the remaining steps before activation.</Banner>}
      {g.status !== 'Active' && g.status !== 'Draft' && !g.parents.some(x => x.status === 'Active') && (
        <Banner level="info" title="Cannot be activated yet">A group needs at least one active policy inside it.</Banner>
      )}
      <PolDetailCard number="01" title={`Policies in ${g.name}`} description={`Parent policies available for assignment inside this ${meta.label.toLowerCase()} group.`}
        aside={(
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ padding:'2px 7px', borderRadius:999, background:'#fff', border:`1px solid ${T.line}`, color:T.inkSoft, fontSize:10.5, fontWeight:700 }}>{g.parents.length}</span>
            <button type="button" style={{ ...polGhost, whiteSpace:'nowrap' }} onClick={() => onAddPolicy(g)}>+ Add policy</button>
          </div>
        )} pad="0">
        {g.parents.length === 0 ? <div style={{ padding:'34px 20px', textAlign:'center', fontSize:13, color:T.inkSoft }}>No policies in this group yet.</div> : (
          <div className="hscroll" style={{ width:'100%', minWidth:0, overflowX:'auto' }}>
            <table aria-label={`Policies in ${g.name}`} style={{ width:'100%', minWidth:896, tableLayout:'fixed', borderCollapse:'collapse', background:'#fff' }}>
            <colgroup>
              <col style={{ width:260 }}/><col style={{ width:90 }}/><col style={{ width:105 }}/><col style={{ width:150 }}/><col style={{ width:145 }}/><col style={{ width:110 }}/><col style={{ width:36 }}/>
            </colgroup>
            <thead>
              <tr>
                {['Policy', 'Default', 'Status', 'Configuration', 'Stateroom Coverage', 'Referenced by'].map(label => (
                  <th key={label} scope="col" style={{ padding:'9px 12px', textAlign:'left', background:T.fill, borderBottom:`1px solid ${T.line}`, color:T.inkLabel, fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap' }}>{label}</th>
                ))}
                <th scope="col" aria-label="Actions" style={{ width:36, padding:'9px 6px', background:T.fill, borderBottom:`1px solid ${T.line}` }}/>
              </tr>
            </thead>
            <tbody>
              {g.parents.map((x, index) => {
                const k = kidsOf(x);
                const configLabel = g.type === 'cancel'
                  ? `${k.length} cancellation ${k.length === 1 ? 'band' : 'bands'}`
                  : `${k.length} milestone ${k.length === 1 ? 'line' : 'lines'}`;
                const openPolicy = () => { onOpenParent(x); setTab('children'); };
                const cellStyle = { padding:'10px 12px', borderBottom:index < g.parents.length - 1 ? `1px solid ${T.lineSoft}` : 'none', color:T.inkSoft, fontSize:11.5, verticalAlign:'middle' };
                return (
                  <tr key={x.id} onClick={openPolicy} style={{ cursor:'pointer', background:'#fff', transition:'background .1s' }}
                    onMouseEnter={e => e.currentTarget.style.background = T.fill}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <th scope="row" style={{ ...cellStyle, textAlign:'left', fontWeight:400 }}>
                      <span style={{ display:'block', fontFamily:MONO, fontSize:10.5, fontWeight:800, color:T.primary, whiteSpace:'nowrap' }}>{x.code}</span>
                      <span style={{ display:'block', marginTop:3, color:T.ink, fontSize:12.5, fontWeight:700, lineHeight:1.3 }}>{x.name}</span>
                    </th>
                    <td style={cellStyle}>{x.isDefault ? <Pill>Default</Pill> : <span style={{ color:T.inkFaint }}>—</span>}</td>
                    <td style={cellStyle}><PolStatusBadge status={x.status}/></td>
                    <td style={{ ...cellStyle, whiteSpace:'nowrap' }}>{configLabel}</td>
                    <td style={cellStyle}>{catSentence(policyCatsOf(x))}</td>
                    <td style={{ ...cellStyle, whiteSpace:'nowrap' }}>{x.usedIn > 0 ? `${x.usedIn} records` : 'No records'}</td>
                    <td style={{ ...cellStyle, padding:'6px 4px', textAlign:'center' }} onClick={e => e.stopPropagation()}>
                      <button type="button" aria-label={`Open ${x.code}, ${x.name}`} onClick={openPolicy}
                        style={{ width:28, height:28, padding:0, border:'none', borderRadius:6, background:'transparent', color:T.primary, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = T.primaryBg}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        )}
      </PolDetailCard>
    </>
  );

  const parentChildren = !p ? null : (
    <>
      {isDraftTarget && <Banner level="warn" title="Draft policy" action={finishAction}>This policy setup is incomplete. Complete its remaining {meta.childWords.toLowerCase()} before activation.</Banner>}
      {v.issues.length > 0 && <IssueList issues={v.issues} title="Configuration gaps"/>}
      {refundIssues.length > 0 && <IssueList issues={refundIssues} title="Refundability conflict"/>}
      <SCard title={meta.childWords} right={<span style={{ fontSize:11.5, color:T.inkFaint }}>Read-only — use Edit to change</span>} pad="14px 16px">
        {kids.length === 0
          ? <div style={{ padding:'28px 12px', textAlign:'center', fontSize:13, color:T.inkSoft }}>No {meta.childWords.toLowerCase()} yet.</div>
          : <PolicyRowsTable type={g.type} codeNum={codeNumOf(p.code)} rows={kids} setRows={() => {}} cellErr={v.cell} editing={false}/>}
      </SCard>
    </>
  );

  const deleteBlocked = (isGroup ? usedInGroup(g) : p.usedIn) > 0;
  const deleteLabel = isGroup ? `Delete ${g.code}` : `Delete ${p.code}`;
  const actions = (
    <>
      <button style={editBtn} onClick={() => onEdit(g, p)}><IcEdit/>{isGroup ? 'Edit group' : 'Edit policy'}</button>
      {isDraftTarget && <RowMenu items={[{ icon:'↻', label:'Finish setup', onClick:() => onFinish(g, p) }]}/>}
      <DeleteIconButton onClick={() => onDelete(g, p)} disabled={deleteBlocked} label={deleteLabel}
        title={deleteBlocked ? 'In use by Faretypes/Farecodes.' : isGroup ? 'Delete Policy Group' : 'Delete Policy'} />
    </>
  );
  const isDefault = isGroup ? g.isDefault : p.isDefault;
  const assignmentBadge = <Pill bg={isDefault ? T.primaryBg : T.fill} color={isDefault ? T.primary : T.inkSoft}>{isDefault ? (isGroup ? 'Default group' : 'Default policy') : (isGroup ? 'Optional group' : 'Optional policy')}</Pill>;
  const refundabilityBadge = g.type === 'cancel'
    ? <Pill bg={g.isRefundable === false ? '#FEF2F2' : '#ECFDF5'} color={g.isRefundable === false ? '#991B1B' : '#065F46'}>{g.isRefundable === false ? 'Non-refundable' : 'Refundable'}</Pill>
    : null;

  return (
    <DetailShell detailLabel={isGroup ? 'Policy Group Details' : 'Policy Details'} badge={<><TypeBadge type={g.type}/>{assignmentBadge}{refundabilityBadge}</>} status={isGroup ? g.status : p.status} code={isGroup ? g.code : p.code}
      title={isGroup ? g.name : p.name}
      sub={isGroup ? `Modified ${g.mod} · ${g.editor}`
                   : `Stateroom coverage: ${catSentence(parentCats)} · In ${g.name} (${g.code}) · Modified ${p.mod} · ${p.editor}`}
      tabs={tabs} tab={tab} setTab={setTab} actions={actions}
      onBack={!isGroup && onBackToGroup ? () => { setTab('children'); onBackToGroup(); } : null}
      backLabel={!isGroup ? `${g.name} group` : null} onClose={onClose}>
      {tab === 'children' && (isGroup ? groupChildren : parentChildren)}
      {tab === 'used' && !isGroup && <UsedInTables row={p}/>}
      {tab === 'audit' && <PolActivityHistory status={isGroup ? g.status : p.status} label={isGroup ? 'Group' : 'Policy'}/>}
    </DetailShell>
  );
}

Object.assign(window, { PolDetailDrawer, DetailShell, PolDetailCard, PolActivityHistory });
