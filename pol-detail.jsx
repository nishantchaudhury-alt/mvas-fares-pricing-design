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

function PolValueField({ label, value, mono }) {
  return (
    <div style={{ minWidth:0 }}>
      <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px', marginBottom:5 }}>{label}</div>
      <div style={{ minHeight:38, padding:'9px 11px', border:`1px solid ${T.lineSoft}`, borderRadius:7, background:T.fill, color:T.ink, fontSize:13, fontWeight:600, display:'flex', alignItems:'center', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:mono ? MONO : undefined }}>{value}</div>
    </div>
  );
}

function PolStateTile({ label, helper, full, children }) {
  return (
    <div style={{ gridColumn:full ? '1 / -1' : undefined, minWidth:0, padding:'11px 12px', border:`1px solid ${T.line}`, borderRadius:8, background:'#fff' }}>
      <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{label}</div>
      <div style={{ minHeight:25, display:'flex', alignItems:'center', marginTop:7 }}>{children}</div>
      {helper && <div style={{ fontSize:10.5, color:T.inkSoft, lineHeight:1.4, marginTop:4 }}>{helper}</div>}
    </div>
  );
}

function PolMetricTile({ label, value, helper, full, mono }) {
  return (
    <div style={{ gridColumn:full ? '1 / -1' : undefined, minWidth:0, padding:'10px 12px', borderRadius:8, background:T.fill, border:`1px solid ${T.lineSoft}` }}>
      <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{label}</div>
      <div style={{ fontSize:15, fontWeight:700, color:T.ink, marginTop:5, overflowWrap:'anywhere', fontFamily:mono ? MONO : undefined }}>{value}</div>
      {helper && <div style={{ fontSize:10.5, color:T.inkSoft, lineHeight:1.4, marginTop:2 }}>{helper}</div>}
    </div>
  );
}

function PolOverviewSection({ title, description, children }) {
  return (
    <section>
      <div style={{ marginBottom:9 }}>
        <div style={{ fontSize:10, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>{title}</div>
        {description && <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.45, marginTop:3 }}>{description}</div>}
      </div>
      {children}
    </section>
  );
}

function PolIdentityValue({ label, value, mono }) {
  return (
    <div style={{ minWidth:0, padding:'11px 12px', background:'#fff' }}>
      <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{label}</div>
      <div style={{ marginTop:5, color:T.ink, fontSize:13, fontWeight:700, lineHeight:1.35, overflowWrap:'anywhere', fontFamily:mono ? MONO : undefined }}>{value}</div>
    </div>
  );
}

function PolOverviewRows({ children }) {
  return <div style={{ border:`1px solid ${T.line}`, borderRadius:8, overflow:'hidden', background:'#fff' }}>{children}</div>;
}

function PolOverviewRow({ label, helper, children, last }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) auto', gap:16, alignItems:'center', padding:'11px 12px', borderBottom:last ? 'none' : `1px solid ${T.lineSoft}` }}>
      <div style={{ minWidth:0 }}>
        <div style={{ color:T.ink, fontSize:12.5, fontWeight:700, lineHeight:1.35 }}>{label}</div>
        {helper && <div style={{ marginTop:2, color:T.inkSoft, fontSize:10.5, lineHeight:1.45 }}>{helper}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', minWidth:96 }}>{children}</div>
    </div>
  );
}

function PolOverviewMetrics({ items }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${items.length}, minmax(0,1fr))`, border:`1px solid ${T.line}`, borderRadius:8, overflow:'hidden', background:T.fill }}>
      {items.map((item, index) => (
        <div key={item.label} style={{ minWidth:0, padding:'11px 12px', borderLeft:index ? `1px solid ${T.line}` : 'none' }}>
          <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>{item.label}</div>
          <div style={{ marginTop:5, minHeight:21, display:'flex', alignItems:'center', color:T.ink, fontSize:15, fontWeight:700, lineHeight:1.3, fontFamily:item.mono ? MONO : undefined }}>{item.value}</div>
          {item.helper && <div style={{ marginTop:2, color:T.inkSoft, fontSize:10.5, lineHeight:1.4 }}>{item.helper}</div>}
        </div>
      ))}
    </div>
  );
}

const POL_RULE_REFERENCE = {
  deposit: [
    { code:'FP', title:'Fixed amount per guest', detail:'Charge the same flat amount for each guest.' },
    { code:'FC', title:'Fixed amount per cabin', detail:'Charge one flat amount per cabin, regardless of occupancy.' },
    { code:'PCT', title:'Percentage of amount due', detail:'Charge a percentage of the total booking amount due at this milestone.' },
  ],
  cancel: [
    { code:'NONE', title:'No charge', detail:'Apply no cancellation charge and refund all amounts paid.' },
    { code:'FIXED', title:'Fixed amount', detail:'Charge a fixed currency amount, independent of the cabin fare.' },
    { code:'PCT_CABIN_FARE', title:'Cabin-fare percentage', detail:'Charge a percentage of the gross or net cabin fare.' },
    { code:'FULL_DEPOSIT', title:'Deposit forfeiture', detail:'Forfeit the full deposit, including after subsequent modifications, with no additional charge.' },
  ],
};

function PolRuleReference({ type }) {
  const entries = POL_RULE_REFERENCE[type];
  const isCancel = type === 'cancel';
  const uid = React.useId().replace(/:/g, '');
  const titleId = `policy-rule-reference-${uid}`;
  return (
    <section aria-labelledby={titleId} style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 2px rgba(15,23,42,.05)' }}>
      <div style={{ padding:'11px 14px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, background:T.fill, borderBottom:`1px solid ${T.line}` }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:9, minWidth:0 }}>
          <span aria-hidden="true" style={{ padding:'3px 7px', borderRadius:5, background:T.primary, color:'#fff', fontSize:9.5, fontWeight:800, lineHeight:1.35, flexShrink:0 }}>03</span>
          <div>
            <h3 id={titleId} style={{ margin:0, color:T.ink, fontSize:13.5, fontWeight:700 }}>{isCancel ? 'Penalty type reference' : 'Deposit type reference'}</h3>
            <p style={{ margin:'3px 0 0', color:T.inkSoft, fontSize:11.5, lineHeight:1.45 }}>How each configured value determines the amount charged.</p>
          </div>
        </div>
        <span style={{ flexShrink:0, padding:'2px 7px', borderRadius:999, border:`1px solid ${T.line}`, background:'#fff', color:T.inkSoft, fontSize:10.5, fontWeight:700 }}>{entries.length} options</span>
      </div>
      <div>
        {entries.map((entry, index) => (
          <div key={entry.code} style={{ display:'grid', gridTemplateColumns:'128px minmax(0,1fr)', gap:14, alignItems:'start', padding:'11px 14px', borderBottom:index < entries.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
            <span style={{ width:'fit-content', maxWidth:'100%', padding:'4px 7px', borderRadius:6, border:`1px solid ${T.line}`, background:T.fill, color:T.ink, fontFamily:MONO, fontSize:10.5, fontWeight:700, lineHeight:1.35, overflowWrap:'anywhere' }}>{entry.code}</span>
            <div style={{ minWidth:0 }}>
              <div style={{ color:T.ink, fontSize:12.5, fontWeight:650, lineHeight:1.35 }}>{entry.title}</div>
              <div style={{ marginTop:2, color:T.inkSoft, fontSize:11.5, lineHeight:1.5 }}>{entry.detail}</div>
            </div>
          </div>
        ))}
      </div>
      {isCancel && (
        <div style={{ display:'flex', gap:9, alignItems:'flex-start', padding:'10px 14px', background:T.primaryBg, borderTop:`1px solid ${T.primaryLine}` }}>
          <span aria-hidden="true" style={{ width:18, height:18, flexShrink:0, borderRadius:'50%', display:'inline-flex', alignItems:'center', justifyContent:'center', background:'#fff', border:`1px solid ${T.primaryLine}`, color:T.primary, fontSize:11, fontWeight:800 }}>i</span>
          <div style={{ color:T.inkSoft, fontSize:11.5, lineHeight:1.5 }}><strong style={{ color:T.ink }}>Calculation precedence:</strong> when PCT_CABIN_FARE and FULL_DEPOSIT overlap in the same DTS window, charge whichever amount is greater.</div>
        </div>
      )}
    </section>
  );
}

function PolResolvedSchedule({ type, parentCode, rows, complete }) {
  const isDep = type === 'deposit';
  const title = isDep ? 'Resolved deposit schedule' : 'Resolved penalty schedule';
  const description = isDep
    ? 'Effective deposit amount and cabin coverage across each days-to-sailing window.'
    : 'Effective cancellation charge and cabin coverage across each days-to-sailing window.';
  const itemWord = isDep ? 'line' : 'band';
  const aside = (
    <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', justifyContent:'flex-end' }}>
      <span style={{ padding:'2px 7px', borderRadius:999, background:'#fff', border:`1px solid ${T.line}`, color:T.inkSoft, fontSize:10.5, fontWeight:700 }}>{rows.length} {rows.length === 1 ? itemWord : `${itemWord}s`}</span>
      <CoverPill ok={complete} label={rows.length === 0 ? 'Not configured' : complete ? 'Coverage complete' : 'Coverage gaps'}/>
    </div>
  );
  return (
    <PolDetailCard number="02" title={title} description={description} aside={aside} pad="0">
      {rows.length === 0 ? (
        <div style={{ padding:'32px 20px', textAlign:'center' }}>
          <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>No {isDep ? 'milestone lines' : 'cancellation bands'} configured</div>
          <div style={{ fontSize:11.5, color:T.inkSoft, marginTop:4 }}>Use Edit policy to define the first DTS window.</div>
        </div>
      ) : rows.map((r, i) => {
        const primary = isDep ? (r.marketingName || 'Untitled deposit line') : penAmountLabel(r);
        const secondary = isDep ? depLabel(r) : null;
        const method = isDep ? r.depositType : r.penaltyType;
        return (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'32px minmax(0,1fr)', gap:10, padding:'12px 14px', borderBottom:i < rows.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
            <div aria-hidden="true" style={{ position:'relative', display:'flex', justifyContent:'center' }}>
              {i < rows.length - 1 && <span style={{ position:'absolute', top:24, bottom:-20, width:1, background:T.line }}/>}
              <span style={{ width:24, height:24, borderRadius:'50%', zIndex:1, display:'flex', alignItems:'center', justifyContent:'center', background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.primary, fontSize:10.5, fontWeight:800 }}>{i + 1}</span>
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                <span style={{ fontFamily:MONO, fontSize:10.5, fontWeight:800, color:T.inkSoft }}>{childCode(parentCode, i)}</span>
                <span style={{ padding:'3px 7px', borderRadius:999, background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.inkSoft, fontSize:10.5, fontWeight:700 }}>DTS {dtsLabel(r)}</span>
                <span style={{ padding:'3px 7px', borderRadius:5, background:T.fill, border:`1px solid ${T.lineSoft}`, color:T.inkSoft, fontFamily:MONO, fontSize:9.5, fontWeight:700 }}>{method}</span>
              </div>
              <div style={{ display:'flex', alignItems:'flex-start', gap:16, flexWrap:'wrap', marginTop:8 }}>
                <div style={{ flex:'1 1 190px', minWidth:0 }}>
                  <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px' }}>{isDep ? 'Deposit' : 'Resolved charge'}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:T.ink, lineHeight:1.35, marginTop:3 }}>{primary}</div>
                  {secondary && <div style={{ fontSize:11, color:T.inkSoft, marginTop:2 }}>{secondary}</div>}
                </div>
                <div style={{ flex:'1 1 150px', minWidth:0 }}>
                  <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px' }}>Stateroom coverage</div>
                  <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.45, marginTop:3 }}>{catSentence(r.cats || [])}</div>
                  {isDep && r.cancelApplies && <span style={{ display:'inline-flex', marginTop:5, padding:'2px 6px', borderRadius:5, background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.inkSoft, fontSize:9.5, fontWeight:700 }}>Cancellation floor applies</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </PolDetailCard>
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

function DetailShell({ badge, code, title, sub, tabs, tab, setTab, actions, onClose, children }) {
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.42)', zIndex:900, display:'flex', justifyContent:'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width:'clamp(655px, 65.5%, 1240px)', height:'100%', background:T.bg, display:'flex', flexDirection:'column', boxShadow:'-14px 0 44px rgba(15,23,42,.18)' }}>
        <div style={{ padding:'16px 18px 0', background:'#fff', borderBottom:`1px solid ${T.line}` }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
            <div style={{ minWidth:180, flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5, minWidth:0 }}>
                {badge}<span style={{ fontFamily:MONO, fontSize:11, fontWeight:700, color:T.primary, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{code}</span>
              </div>
              <h2 style={{ fontSize:17.5, fontWeight:700, color:T.ink }}>{title}</h2>
              <div style={{ fontSize:12.5, color:T.inkSoft, marginTop:3 }}>{sub}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, flexWrap:'wrap', justifyContent:'flex-end' }}>
              {actions}
              <button type="button" aria-label="Close policy details" onClick={onClose} style={{ width:30, height:30, borderRadius:7, border:`1px solid ${T.line}`, background:'#fff', cursor:'pointer', color:T.inkSoft, display:'flex', alignItems:'center', justifyContent:'center' }}><IcX size={13}/></button>
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
  const isDraftTarget = g.status === 'Draft' || (p && p.status === 'Draft');
  const finishAction = isDraftTarget
    ? <button style={{ ...polGhost, whiteSpace:'nowrap' }} onClick={() => onFinish(g, p)}>Finish setup</button>
    : null;

  const tabs = isGroup
    ? [{ k:'overview', l:'Overview' }, { k:'children', l:'Policies', count:g.parents.length }, { k:'audit', l:'History' }]
    : [{ k:'overview', l:'Overview' }, { k:'children', l:g.type === 'deposit' ? 'Lines' : 'Bands', count:kids.length }, { k:'used', l:'Used In', count:(p.usedInFaretypes?.length || 0) + (p.usedInFarecodes?.length || 0) }, { k:'audit', l:'History' }];

  const groupOverview = (
    <>
      <PolDetailCard number="01" title="Group overview" description={`Shared settings and current usage for this ${meta.label.toLowerCase()} policy group.`}>
        <PolOverviewSection title="Identity" description="Stable identifiers for assignment, reporting, and audit history.">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${T.line}`, borderRadius:8, overflow:'hidden' }}>
            <PolIdentityValue label="Group name" value={g.name}/>
            <div style={{ borderLeft:`1px solid ${T.line}` }}><PolIdentityValue label="Group code" value={g.code} mono/></div>
          </div>
        </PolOverviewSection>

        <PolOverviewSection title="Assignment rules" description="How this group behaves when policies are assigned to Farecodes.">
          <PolOverviewRows>
            <PolOverviewRow label="Policy family" helper="Fixed for every policy held by this group."><TypeBadge type={g.type}/></PolOverviewRow>
            <PolOverviewRow label="Availability" helper={g.status === 'Active' ? 'Policies in this group can be selected for assignment.' : 'Policies in this group are unavailable for new assignments.'}><PolStatusBadge status={g.status}/></PolOverviewRow>
            <PolOverviewRow last={g.type !== 'cancel'} label="Default group" helper="Used when a Farecode leaves this policy type unset."><Pill bg={g.isDefault ? T.primaryBg : T.fill} color={g.isDefault ? T.primary : T.inkSoft}>{g.isDefault ? 'Default group' : 'Not default'}</Pill></PolOverviewRow>
            {g.type === 'cancel' && <PolOverviewRow last label="Refundability" helper="Commercial term shared by every cancellation policy in this group."><Pill bg={g.isRefundable === false ? '#FEF2F2' : '#ECFDF5'} color={g.isRefundable === false ? '#991B1B' : '#065F46'}>{g.isRefundable === false ? 'Non-Refundable' : 'Refundable'}</Pill></PolOverviewRow>}
          </PolOverviewRows>
        </PolOverviewSection>

        <PolOverviewSection title="Current usage" description="Live policy inventory and downstream assignment scope.">
          <PolOverviewMetrics items={[
            { label:'Policies', value:String(g.parents.length), helper:'Total in this group' },
            { label:'Available', value:String(g.parents.filter(x => x.status === 'Active').length), helper:'Active policies' },
            { label:'Referenced by', value:String(usedInGroup(g)), helper:'Faretype / Farecode records' },
          ]}/>
        </PolOverviewSection>
      </PolDetailCard>
      {g.status === 'Draft' && <Banner level="warn" title="Draft chain" action={finishAction}>This group was saved before its policy was finished. Complete the remaining steps before activation.</Banner>}
      {g.status !== 'Active' && g.status !== 'Draft' && !g.parents.some(x => x.status === 'Active') && (
        <Banner level="info" title="Cannot be activated yet">A group needs at least one active policy inside it.</Banner>
      )}
    </>
  );

  const groupChildren = (
    <PolDetailCard number="02" title={`Policies in ${g.name}`} description={`Parent policies available for assignment inside this ${meta.label.toLowerCase()} group.`}
      aside={(
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ padding:'2px 7px', borderRadius:999, background:'#fff', border:`1px solid ${T.line}`, color:T.inkSoft, fontSize:10.5, fontWeight:700 }}>{g.parents.length}</span>
          <button type="button" style={{ ...polGhost, whiteSpace:'nowrap' }} onClick={() => onAddPolicy(g)}>+ Add policy</button>
        </div>
      )} pad="10px">
      {g.parents.length === 0 ? <div style={{ padding:'34px 20px', textAlign:'center', fontSize:13, color:T.inkSoft }}>No policies in this group yet.</div> : g.parents.map((x) => {
        const k = kidsOf(x), ok = k.length > 0 && validateRows(k).issues.length === 0;
        const configLabel = g.type === 'cancel'
          ? `${k.length} cancellation ${k.length === 1 ? 'band' : 'bands'}`
          : `${k.length} milestone ${k.length === 1 ? 'line' : 'lines'}`;
        return (
          <button key={x.id} type="button" aria-label={`Open ${x.code}, ${x.name}`} onClick={() => { onOpenParent(x); setTab('overview'); }}
            style={{ width:'100%', padding:0, border:`1px solid ${T.line}`, borderRadius:9, background:'#fff', overflow:'hidden', cursor:'pointer', textAlign:'left', fontFamily:'inherit', boxShadow:'0 1px 2px rgba(15,23,42,.04)', transition:'border-color .15s, box-shadow .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.primaryLine; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.line; e.currentTarget.style.boxShadow = '0 1px 2px rgba(15,23,42,.04)'; }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, padding:'9px 12px', background:T.fill, borderBottom:`1px solid ${T.lineSoft}` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, minWidth:0 }}>
                <span style={{ fontFamily:MONO, fontSize:11.5, fontWeight:800, color:T.primary }}>{x.code}</span>
                {x.isDefault && <Pill>Default</Pill>}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}><PolStatusBadge status={x.status}/><span aria-hidden="true" style={{ color:T.primary, fontSize:14, fontWeight:700 }}>→</span></div>
            </div>
            <div style={{ padding:'12px' }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:T.ink, lineHeight:1.35 }}>{x.name}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:11, paddingTop:10, borderTop:`1px solid ${T.lineSoft}` }}>
                <div><div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px' }}>Configuration</div><div style={{ fontSize:11.5, color:T.inkSoft, marginTop:4 }}>{configLabel}</div></div>
                <div><div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px' }}>Coverage</div><div style={{ marginTop:4 }}><CoverPill ok={ok} label={k.length === 0 ? 'Not configured' : ok ? 'Complete' : 'Needs attention'}/></div></div>
                <div><div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px' }}>Referenced by</div><div style={{ fontSize:11.5, color:T.inkSoft, marginTop:4 }}>{x.usedIn > 0 ? `${x.usedIn} records` : 'No records'}</div></div>
              </div>
            </div>
          </button>
        );
      })}
    </PolDetailCard>
  );

  const parentOverview = !p ? null : (
    <>
      {isDraftTarget && <Banner level="warn" title="Draft policy" action={finishAction}>This policy setup is incomplete. Complete its remaining {meta.childWords.toLowerCase()} before activation.</Banner>}
      <PolDetailCard number="01" title="Policy overview" description={`Current identity, assignment behavior, and configuration health for this ${meta.label.toLowerCase()} policy.`}>
        <PolOverviewSection title="Identity" description="Stable identifiers and the group that owns this policy.">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', border:`1px solid ${T.line}`, borderRadius:8, overflow:'hidden' }}>
            <PolIdentityValue label="Policy name" value={p.name}/>
            <div style={{ borderLeft:`1px solid ${T.line}` }}><PolIdentityValue label="Policy code" value={p.code} mono/></div>
            <div style={{ gridColumn:'1 / -1', borderTop:`1px solid ${T.line}`, padding:'10px 12px', background:T.fill }}>
              <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.65px' }}>Parent group</div>
              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginTop:6 }}>
                <TypeBadge type={g.type}/>
                <span style={{ fontSize:12.5, fontWeight:700, color:T.ink }}>{g.name}</span>
                <span style={{ fontFamily:MONO, fontSize:10.5, fontWeight:700, color:T.inkSoft }}>{g.code}</span>
              </div>
            </div>
          </div>
        </PolOverviewSection>

        <PolOverviewSection title="Assignment rules" description="How this policy is made available and selected for Farecodes.">
          <PolOverviewRows>
            <PolOverviewRow label="Availability" helper={p.status === 'Active' ? 'Available for Farecode assignment.' : 'Unavailable for new Farecode assignments.'}><PolStatusBadge status={p.status}/></PolOverviewRow>
            <PolOverviewRow last={g.type !== 'cancel'} label={`Default ${meta.label.toLowerCase()} policy`} helper={p.isDefault ? 'Automatically selected when this group does not specify another policy.' : 'Used only when it is explicitly assigned.'}><Pill bg={p.isDefault ? T.primaryBg : T.fill} color={p.isDefault ? T.primary : T.inkSoft}>{p.isDefault ? 'Default policy' : 'Not default'}</Pill></PolOverviewRow>
            {g.type === 'cancel' && <PolOverviewRow last label="Refundability" helper="Commercial term inherited by every cancellation band in this policy."><Pill bg={p.isRefundable === false ? '#FEF2F2' : '#ECFDF5'} color={p.isRefundable === false ? '#991B1B' : '#065F46'}>{p.isRefundable === false ? 'Non-Refundable' : 'Refundable'}</Pill></PolOverviewRow>}
          </PolOverviewRows>
        </PolOverviewSection>

        <PolOverviewSection title="Current configuration" description="Configured rule coverage and downstream usage.">
          <PolOverviewMetrics items={[
            { label:g.type === 'deposit' ? 'Milestone lines' : 'Cancellation bands', value:String(kids.length), helper:kids.length === 1 ? 'Configured row' : 'Configured rows' },
            { label:'Coverage', value:<CoverPill ok={v.issues.length === 0 && kids.length > 0} label={kids.length === 0 ? 'Not configured' : v.issues.length === 0 ? 'Complete' : 'Needs attention'}/>, helper:'DTS and stateroom scope' },
            { label:'Referenced by', value:String(p.usedIn || 0), helper:'Faretype / Farecode records' },
          ]}/>
        </PolOverviewSection>
      </PolDetailCard>
      <PolResolvedSchedule type={g.type} parentCode={p.code} rows={kids} complete={v.issues.length === 0 && kids.length > 0}/>
      {v.issues.length > 0 && <IssueList issues={v.issues} title="Configuration gaps"/>}
      {refundIssues.length > 0 && <IssueList issues={refundIssues} title="Refundability conflict"/>}
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
      <PolRuleReference type={g.type}/>
    </>
  );

  const actions = (
    <>
      <button style={editBtn} onClick={() => onEdit(g, p)}><IcEdit/>{isGroup ? 'Edit group' : 'Edit policy'}</button>
      <RowMenu items={[
        ...(isDraftTarget ? [
          { icon:'↻', label:'Finish setup', onClick:() => onFinish(g, p) },
          { sep:true },
        ] : []),
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
      {tab === 'audit' && <PolActivityHistory status={isGroup ? g.status : p.status} label={isGroup ? 'Group' : 'Policy'}/>}
    </DetailShell>
  );
}

Object.assign(window, { PolDetailDrawer, DetailShell, PolDetailCard, PolValueField, PolStateTile, PolMetricTile, PolActivityHistory });
