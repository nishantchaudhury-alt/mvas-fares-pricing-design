// dc-parent-panel.jsx — Parent policy panel (1.3 / 2.3) with the ordered Milestone Line / Band grids.
const { useState: useSP, useRef: useRP, useEffect: useEP } = React;

const cellIn = (v, onChange, err, placeholder, w) => (
  <input value={v} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ ...iS(err), padding:'6px 8px', fontSize:12.5, width: w || '100%' }}/>
);

function GridHead({ cols, template }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:template, gap:6, padding:'8px 10px', background:T.fill, borderBottom:`1px solid ${T.line}`, fontSize:10, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px', position:'sticky', top:0 }}>
      {cols.map((c,i) => <span key={i}>{c}</span>)}
    </div>
  );
}

function useDragRows(rows, setRows) {
  const dragI = useRP(null);
  return {
    rowProps: i => ({
      draggable: true,
      onDragStart: () => { dragI.current = i; },
      onDragOver: e => e.preventDefault(),
      onDrop: () => {
        const from = dragI.current;
        if (from === null || from === i) return;
        const next = rows.slice();
        const [m] = next.splice(from, 1);
        next.splice(i, 0, m);
        dragI.current = null;
        setRows(next);
      },
      onDragEnd: () => { dragI.current = null; },
    }),
  };
}

/* ─────── Milestone Lines grid (1.3) ─────── */
function LineGrid({ codeNum, rows, setRows, cellErr, editing }) {
  const TPL = '30px 54px minmax(150px,1.3fr) 64px 64px 74px 96px 128px 78px 30px';
  const { rowProps } = useDragRows(rows, setRows);
  const upd = (i, k, v) => setRows(rows.map((r, ri) => ri === i ? { ...r, [k]: v } : r));
  return (
    <div style={{ border:`1px solid ${T.line}`, borderRadius:9, overflow:'hidden' }}>
      <div className="hscroll" style={{ overflowX:'auto' }}>
        <div style={{ minWidth:900 }}>
          <GridHead template={TPL} cols={['','Line ID','Marketing Name','Begin DTS','End DTS','Type','Amount','Stateroom Types','Cancel applies','']}/>
          {rows.map((r, i) => (
            <div key={i} {...(editing ? rowProps(i) : {})} style={{ display:'grid', gridTemplateColumns:TPL, gap:6, padding:'8px 10px', borderBottom: i<rows.length-1?`1px solid ${T.lineSoft}`:'none', alignItems:'center', fontSize:12.5, background:'#fff' }}>
              <span style={{ color:T.inkFaint, cursor:editing?'grab':'default', display:'flex', alignItems:'center', gap:2 }}>{editing && <IcGrip/>}</span>
              <span style={{ fontFamily:MONO, fontSize:11.5, fontWeight:700, color:T.inkSoft }}>{codeNum}.{i+1}</span>
              {editing ? cellIn(r.marketingName, v => upd(i,'marketingName',v), cellErr[`${i}:marketingName`], 'e.g. Full Deposit') : <span style={{ fontWeight:600 }}>{r.marketingName}</span>}
              {editing ? cellIn(r.beginDts, v => upd(i,'beginDts', v.replace(/[^0-9]/g,'')), cellErr[`${i}:beginDts`], '∞') : <span>{isBlank(r.beginDts) ? '∞' : r.beginDts}</span>}
              {editing ? cellIn(r.endDts, v => upd(i,'endDts', v.replace(/[^0-9]/g,'')), cellErr[`${i}:endDts`], '0') : <span>{r.endDts}</span>}
              {editing ? <Sel compact value={r.depositType} onChange={v => upd(i,'depositType',v)} opts={DEP_TYPES}/> : <Pill bg={T.fill} color={T.inkSoft} mono>{r.depositType}</Pill>}
              {editing ? (
                <div style={{ position:'relative' }}>
                  <input value={r.amount} onChange={e => upd(i,'amount', e.target.value.replace(/[^0-9.]/g,''))}
                    style={{ ...iS(cellErr[`${i}:amount`]), padding:'6px 22px 6px 8px', fontSize:12.5 }}/>
                  <span style={{ position:'absolute', right:7, top:'50%', transform:'translateY(-50%)', fontSize:11, color:T.inkFaint, pointerEvents:'none' }}>{r.depositType === 'PCT' ? '%' : '$'}</span>
                </div>
              ) : <span>{depAmountLabel(r)}</span>}
              {editing ? <CatSelect value={r.cats} onChange={v => upd(i,'cats',v)} err={cellErr[`${i}:cats`]}/> : <span style={{ color:T.inkSoft }}>{catLabel(r.cats)}</span>}
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Toggle on={r.cancelApplies} dis={!editing} onChange={v => upd(i,'cancelApplies',v)} label={`Cancellation policy applies to line ${i + 1}`}/>
              </div>
              <span>
                {editing && <button onClick={() => setRows(rows.filter((_,ri) => ri !== i))} disabled={rows.length<=1} title="Remove line"
                  style={{ width:24, height:24, borderRadius:6, border:'none', background:'none', cursor:rows.length<=1?'not-allowed':'pointer', color:rows.length<=1?T.inkFaint:T.red, display:'flex', alignItems:'center', justifyContent:'center' }}><IcX size={11}/></button>}
              </span>
            </div>
          ))}
        </div>
      </div>
      {editing && (
        <div style={{ padding:'9px 12px', borderTop:`1px solid ${T.lineSoft}`, background:'#FCFDFE' }}>
          <button onClick={() => setRows([...rows, { id:'new', marketingName:'', beginDts:'', endDts:'', depositType:'FC', amount:'', cats:['All'], cancelApplies:true }])}
            style={{ background:'none', border:'none', color:T.primary, fontSize:12.5, fontWeight:700, cursor:'pointer', padding:0 }}>+ Add Line</button>
        </div>
      )}
    </div>
  );
}

/* ─────── Cancellation Bands grid (2.3) ─────── */
function BandGrid({ codeNum, rows, setRows, cellErr, editing }) {
  const TPL = '30px 60px 64px 64px 152px 104px 132px 30px';
  const { rowProps } = useDragRows(rows, setRows);
  const upd = (i, k, v) => setRows(rows.map((r, ri) => {
    if (ri !== i) return r;
    const next = { ...r, [k]: v };
    if (k === 'penaltyType' && (v === 'NONE' || v === 'FULL_DEPOSIT')) next.penaltyValue = '';
    return next;
  }));
  return (
    <div style={{ border:`1px solid ${T.line}`, borderRadius:9, overflow:'hidden' }}>
      <div className="hscroll" style={{ overflowX:'auto' }}>
        <div style={{ minWidth:700 }}>
          <GridHead template={TPL} cols={['','Policy ID','Begin DTS','End DTS','Penalty Type','Penalty Value','Stateroom Types','']}/>
          {rows.map((r, i) => {
            const valDis = r.penaltyType === 'NONE' || r.penaltyType === 'FULL_DEPOSIT';
            return (
              <div key={i} {...(editing ? rowProps(i) : {})} style={{ display:'grid', gridTemplateColumns:TPL, gap:6, padding:'8px 10px', borderBottom: i<rows.length-1?`1px solid ${T.lineSoft}`:'none', alignItems:'center', fontSize:12.5, background:'#fff' }}>
                <span style={{ color:T.inkFaint, cursor:editing?'grab':'default', display:'flex' }}>{editing && <IcGrip/>}</span>
                <span style={{ fontFamily:MONO, fontSize:11.5, fontWeight:700, color:T.inkSoft }}>{codeNum}.{i+1}</span>
                {editing ? cellIn(r.beginDts, v => upd(i,'beginDts', v.replace(/[^0-9]/g,'')), cellErr[`${i}:beginDts`], '∞') : <span>{isBlank(r.beginDts) ? '∞' : r.beginDts}</span>}
                {editing ? cellIn(r.endDts, v => upd(i,'endDts', v.replace(/[^0-9]/g,'')), cellErr[`${i}:endDts`], '0') : <span>{r.endDts}</span>}
                {editing ? <Sel compact value={r.penaltyType} onChange={v => upd(i,'penaltyType',v)} opts={PEN_TYPES}/> : <span style={{ fontFamily:MONO, fontSize:11, fontWeight:700, color:T.inkSoft }}>{r.penaltyType}</span>}
                {editing ? (
                  <div style={{ position:'relative' }}>
                    <input value={valDis ? '' : r.penaltyValue} disabled={valDis} onChange={e => upd(i,'penaltyValue', e.target.value.replace(/[^0-9.]/g,''))}
                      style={{ ...iS(cellErr[`${i}:penaltyValue`], valDis), padding:'6px 22px 6px 8px', fontSize:12.5 }}/>
                    <span style={{ position:'absolute', right:7, top:'50%', transform:'translateY(-50%)', fontSize:11, color:T.inkFaint, pointerEvents:'none' }}>{r.penaltyType === 'PCT_CABIN_FARE' ? '%' : r.penaltyType === 'FIXED' ? '$' : '—'}</span>
                  </div>
                ) : <span>{penAmountLabel(r)}</span>}
                {editing ? <CatSelect value={r.cats} onChange={v => upd(i,'cats',v)} err={cellErr[`${i}:cats`]}/> : <span style={{ color:T.inkSoft }}>{catLabel(r.cats)}</span>}
                <span>
                  {editing && <button onClick={() => setRows(rows.filter((_,ri) => ri !== i))} disabled={rows.length<=1}
                    style={{ width:24, height:24, borderRadius:6, border:'none', background:'none', cursor:rows.length<=1?'not-allowed':'pointer', color:rows.length<=1?T.inkFaint:T.red, display:'flex', alignItems:'center', justifyContent:'center' }}><IcX size={11}/></button>}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {editing && (
        <div style={{ padding:'9px 12px', borderTop:`1px solid ${T.lineSoft}`, background:'#FCFDFE' }}>
          <button onClick={() => setRows([...rows, { id:'new', beginDts:'', endDts:'', penaltyType:'PCT_CABIN_FARE', penaltyValue:'', cats:['All'] }])}
            style={{ background:'none', border:'none', color:T.primary, fontSize:12.5, fontWeight:700, cursor:'pointer', padding:0 }}>+ Add Band</button>
        </div>
      )}
    </div>
  );
}

/* ─────── Charge preview (coupling formula) ─────── */
function ChargePreview({ bands, depParents }) {
  const [depId, setDepId] = useSP(depParents[0]?.id || '');
  const [fare, setFare] = useSP(2400);
  const [port, setPort] = useSP(180);
  const [cat, setCat] = useSP('Interior');
  const dep = depParents.find(p => p.id === depId);
  const preview = windowGroups(bands).map(g => {
    const band = g.rows.find(r => r.cats.includes('All') || r.cats.includes(cat)) || g.rows[0];
    const dts = g.endDts;
    const depLine = dep ? rowForCat(dep.lines, dts, cat) : null;
    const depositPaid = depositAmountFor(depLine, { fare: Number(fare) + Number(port), pax:2 });
    const c = cancelCharge({ band, depLine, cabinFare:Number(fare), portFees:Number(port), depositPaid: depLine && depLine.cancelApplies ? depositPaid : 0 });
    return { g, band, depLine, depositPaid, c };
  });
  const inp = { ...iS(), padding:'6px 8px', fontSize:12.5 };
  return (
    <SCard title="Computed cancellation charge — preview" pad="0">
      <div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:10, padding:'12px 14px', borderBottom:`1px solid ${T.lineSoft}`, background:'#FCFDFE' }}>
          <Field label="Deposit policy"><Sel compact value={depId} onChange={setDepId} opts={depParents.map(p => [p.id, `${p.code} · ${p.name}`])}/></Field>
          <Field label="Cabin fare"><input value={fare} onChange={e => setFare(e.target.value.replace(/[^0-9]/g,''))} style={inp}/></Field>
          <Field label="Port fees"><input value={port} onChange={e => setPort(e.target.value.replace(/[^0-9]/g,''))} style={inp}/></Field>
          <Field label="Stateroom"><Sel compact value={cat} onChange={setCat} opts={CATS.map(c => [c,c])}/></Field>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 130px', gap:8, padding:'8px 14px', background:T.fill, fontSize:10, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px' }}>
          <span>DTS window</span><span>Band penalty</span><span>Deposit floor</span><span>Charge (governing)</span>
        </div>
        {preview.map((p, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 110px 110px 130px', gap:8, padding:'10px 14px', borderTop:`1px solid ${T.lineSoft}`, fontSize:12.5, alignItems:'center' }}>
            <div>
              <div style={{ fontWeight:600 }}>{p.g.beginDts === Infinity ? `${p.g.endDts}+ days` : `${p.g.endDts}–${p.g.beginDts} days`}</div>
              <div style={{ fontSize:11, color:T.inkFaint, fontFamily:MONO }}>{p.band?.penaltyType}{p.depLine ? ` · dep ${p.depLine.marketingName}` : ''}</div>
            </div>
            <span style={{ color:T.inkSoft }}>{p.band?.penaltyType === 'NONE' ? '—' : money(p.c.bandAmt)}</span>
            <span style={{ color: p.c.depFloor ? T.inkSoft : T.inkFaint }}>{p.c.depFloor ? money(p.c.depFloor) : 'n/a'}</span>
            <span style={{ fontWeight:700, color: p.c.total ? T.ink : T.inkFaint }}>
              {money(p.c.total)} <span style={{ fontSize:10.5, fontWeight:600, color:T.inkFaint }}>{p.c.total ? (p.c.governing === 'deposit' ? 'deposit' : 'band') : ''}</span>
            </span>
          </div>
        ))}
        <div style={{ padding:'11px 14px', borderTop:`1px solid ${T.lineSoft}`, fontSize:11.5, color:T.inkSoft, lineHeight:1.55, background:'#FCFDFE' }}>
          Display only. Charge = max(% of cabin fare + port fees for the active band, full deposit paid — when the active deposit line has <span style={{ fontFamily:MONO }}>cancellation_policy_applies</span> = TRUE).
        </div>
      </div>
    </SCard>
  );
}

/* ═════════ Parent panel ═════════ */
function DCParentPanel({ kind, group, parent, depParents, initialTab, initialEdit, onClose, onSave, onToggleActive, onDelete }) {
  const isDep = kind === 'deposit';
  const isCreate = !parent;
  const label = isDep ? 'Deposit Policy' : 'Cancellation Policy';
  const nextCode = isDep ? `DEP-${500 + (group.parents.length + 10)}` : `CAN-${100 + (group.parents.length + 10)}`;
  const build = () => ({
    code: parent?.code || nextCode,
    name: parent?.name || '',
    isActive: parent ? parent.isActive : true,
    isDefault: parent ? !!parent.isDefault : false,
    isRefundable: parent ? parent.isRefundable !== false : group.isRefundable !== false,
    rows: JSON.parse(JSON.stringify(parent ? (isDep ? parent.lines : parent.bands) : (isDep
      ? [{ id:'new', marketingName:'', beginDts:'', endDts:'', depositType:'FC', amount:'', cats:['All'], cancelApplies:true }]
      : [{ id:'new', beginDts:'', endDts:'', penaltyType:'NONE', penaltyValue:'', cats:['All'] }]))),
  });
  const [isEditing, setIsEditing] = useSP(isCreate || !!initialEdit);
  const [tab, setTab] = useSP(initialTab || (isCreate ? 'grid' : 'overview'));
  const [form, setForm] = useSP(build);
  const [errors, setErrors] = useSP({});
  const [showIssues, setShowIssues] = useSP(false);
  const [saved, setSaved] = useSP(false);
  const [confirmDefault, setConfirmDefault] = useSP(null);
  const [discardCb, setDiscardCb] = useSP(null);
  const snap = useRP(JSON.stringify(build()));

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const dirty = () => snap.current !== JSON.stringify(form);
  const guard = cb => dirty() ? setDiscardCb(() => cb) : cb();
  const codeNum = (form.code.match(/(\d+)/) || ['506'])[0];

  const val = validateRows(form.rows);
  const refIssues = isDep ? [] : refundabilityIssues(form.rows, form.isRefundable);
  const allIssues = [...val.issues, ...refIssues];
  const currentDefault = group.parents.find(p => p.isDefault && p.id !== parent?.id);

  const validateHead = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    return e;
  };
  const save = () => {
    const e = validateHead();
    setErrors(e);
    if (Object.keys(e).length) { setTab('overview'); return; }
    if (allIssues.length) { setShowIssues(true); setTab('grid'); return; }
    setShowIssues(false);
    onSave({ ...form, rows: form.rows.map((r, i) => ({ ...r, id:`${codeNum}.${i+1}` })) });
    setSaved(true);
    snap.current = JSON.stringify(form);
    setTimeout(() => { setSaved(false); if (!isCreate) setIsEditing(false); }, 700);
  };

  const gridTab = isDep ? 'Milestone Lines' : 'Bands';
  const tabs = [
    { k:'overview', l:'Overview' },
    { k:'grid', l:gridTab, count:form.rows.length },
    ...(isCreate ? [] : [{ k:'usedin', l:'Used In' }, { k:'audit', l:'History' }]),
  ];
  const inUse = (parent?.usedIn || 0) > 0;

  return (
    <>
      <PanelShell z={960} width={860} onClose={() => guard(onClose)} tabs={tabs} activeTab={tab} onTab={setTab}
        readOnlyBg={!isCreate && !isEditing}
        titleLine={<div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:5 }}>{isCreate ? `New ${label}` : `Edit ${label}`}</div>}
        metaLine={
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontFamily:MONO, fontSize:13.5, fontWeight:800, color:T.ink }}>{form.code}</span>
            <StatusBadge status={form.isActive ? 'Active' : 'Inactive'}/>
            {form.isDefault && <Pill>Default in group</Pill>}
            {!isDep && <Pill bg={form.isRefundable?'#ECFDF5':'#FEF2F2'} color={form.isRefundable?'#065F46':'#991B1B'}>{form.isRefundable ? 'Refundable' : 'Non-Refundable'}</Pill>}
            <span style={{ fontSize:12, color:T.inkFaint }}>· in {group.name}</span>
          </div>
        }
        actions={<>
          {saved && <span style={{ fontSize:12, color:T.tealDark, display:'flex', alignItems:'center', gap:5 }}><IcCheck/>Saved!</span>}
          {isCreate && <button onClick={save} style={btnPrimary}><IcCheck/>Create Policy</button>}
          {!isCreate && !isEditing && (<>
            <button onClick={() => { snap.current = JSON.stringify(form); setIsEditing(true); }} style={btnPrimary}><IcEdit/>Edit</button>
            <button onClick={() => onToggleActive(parent)} style={form.isActive ? btnDanger : btnGreen}>{form.isActive ? 'Deactivate' : 'Activate'}</button>
            <button onClick={() => onDelete(parent)} disabled={inUse} title={inUse ? `Used in ${parent.usedIn} records` : undefined}
              style={{ ...btnGhost, color: inUse ? T.inkFaint : T.inkSoft, cursor: inUse ? 'not-allowed' : 'pointer' }}>Delete</button>
          </>)}
          {!isCreate && isEditing && (<>
            <button onClick={() => guard(() => { setForm(build()); setErrors({}); setShowIssues(false); setIsEditing(false); })} style={btnGhost}>Cancel</button>
            <button onClick={save} style={btnPrimary}><IcCheck/>Save Changes</button>
          </>)}
        </>}>

        {tab === 'overview' && (isEditing ? (
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            <SectionHead title="Policy Details" helper={`Assigned to Farecodes directly. ${isDep ? 'Milestone Lines' : 'Bands'} below define how the amount varies by days-to-sail and stateroom category.`}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <Field label="Policy Code" helper="Auto-assigned, locked.">
                <div style={{ ...iS(false,true), fontFamily:MONO, fontWeight:700 }}>{form.code}</div>
              </Field>
              <Field label="Policy Name" required error={errors.name}>
                <input className="fi" style={iS(errors.name)} value={form.name} onChange={e => set('name', e.target.value)} placeholder={isDep ? 'e.g. IS 5 Night Retail Std' : 'e.g. Standard Cancellation'}/>
              </Field>
            </div>
            {!isDep && (
              <Field label="Refundable" helper="Non-refundable requires every band to be PCT_CABIN_FARE or FULL_DEPOSIT.">
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <Toggle on={form.isRefundable} onChange={v => set('isRefundable', v)} label="Refundable policy"/>
                  <span style={{ fontSize:13, color:T.inkSoft }}>{form.isRefundable ? 'Refundable' : 'Non-Refundable'}</span>
                </div>
              </Field>
            )}
            <Field label="Active">
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Toggle on={form.isActive} onChange={v => set('isActive', v)} label="Active policy"/>
                <span style={{ fontSize:13, color:T.inkSoft }}>{form.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </Field>
            <Field label="Default in Group" helper={`Only one policy inside ${group.name} can be the default.`}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Toggle on={form.isDefault} onChange={on => { if (on && currentDefault) setConfirmDefault(currentDefault); else set('isDefault', on); }} label="Default policy in group"/>
                <span style={{ fontSize:13, color:T.inkSoft }}>{form.isDefault ? 'Default for this group' : 'Not the default'}</span>
              </div>
            </Field>
            {!isDep && refIssues.length > 0 && <Banner level="error" title="Refundability conflict">{refIssues[0].text}</Banner>}
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <SCard title="Policy Details">
              <DRow label="Code"><span style={{ fontFamily:MONO, fontWeight:700 }}>{form.code}</span></DRow>
              <DRow label="Name">{form.name}</DRow>
              {!isDep && <DRow label="Refundable">{form.isRefundable ? 'Refundable' : 'Non-Refundable'}</DRow>}
              <DRow label="Status"><StatusBadge status={form.isActive ? 'Active' : 'Inactive'}/></DRow>
              <DRow label="Default in Group">{form.isDefault ? 'Yes' : 'No'}</DRow>
              <DRow label={isDep ? 'Milestone Lines' : 'Bands'}>{form.rows.length} · <CoverPill ok={allIssues.length === 0}/></DRow>
              <DRow label="Used In">{parent?.usedIn || 0} record{(parent?.usedIn || 0) === 1 ? '' : 's'}</DRow>
            </SCard>
            <SCard title={isDep ? 'Milestone Lines' : 'Bands'} pad="0">
              <div style={{ padding:12 }}>
                {isDep
                  ? <LineGrid codeNum={codeNum} rows={form.rows} setRows={() => {}} cellErr={{}} editing={false}/>
                  : <BandGrid codeNum={codeNum} rows={form.rows} setRows={() => {}} cellErr={{}} editing={false}/>}
              </div>
            </SCard>
          </div>
        ))}

        {tab === 'grid' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <SectionHead title={isDep ? 'Milestone Lines' : 'Cancellation Bands'}
              helper={isDep
                ? 'One row per days-to-sail window. Multiple rows can share a window when different stateroom categories take different amounts.'
                : 'One row per days-to-sail window. Penalty applies to the guest cancelling within that window.'}/>
            {isEditing && (allIssues.length > 0
              ? <Banner level="error" title={`${allIssues.length} issue${allIssues.length===1?'':'s'} to resolve before saving`}>
                  <ul style={{ margin:'4px 0 0 16px', padding:0 }}>{allIssues.map((x,i) => <li key={i} style={{ marginBottom:2 }}>{x.text}</li>)}</ul>
                </Banner>
              : <Banner level="success" title="Windows contiguous, all stateroom categories covered">Ready to save.</Banner>)}
            {isDep
              ? <LineGrid codeNum={codeNum} rows={form.rows} setRows={rows => set('rows', rows)} cellErr={isEditing ? val.cell : {}} editing={isEditing}/>
              : <BandGrid codeNum={codeNum} rows={form.rows} setRows={rows => set('rows', rows)} cellErr={isEditing ? val.cell : {}} editing={isEditing}/>}
            <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.6, padding:'10px 12px', background:T.primaryBg, borderRadius:8 }}>
              <strong>Resolution rule</strong> — the active {isDep ? 'line' : 'band'} for a booking is the window where <span style={{ fontFamily:MONO }}>end_dts ≤ days remaining to sailing ≤ begin_dts</span> (blank begin_dts = open-ended). Never user-selected. Stateroom coverage is validated against the requesting Farecode's own ship; cross-ship reconciliation is a fast-follow.
            </div>
            <HelpList items={isDep ? DEP_HELP : PEN_HELP}/>
            {isDep && <Banner level="info" title="cancellation_policy_applies"><span>When ON, this line's paid deposit becomes the floor in the cancellation charge formula. Promotional and rate-hold lines are typically OFF.</span></Banner>}
            {!isDep && depParents.length > 0 && <ChargePreview bands={form.rows} depParents={depParents}/>}
          </div>
        )}

        {tab === 'usedin' && <UsedInTables row={parent}/>}
        {tab === 'audit' && <AuditList status={form.isActive ? 'Active' : 'Inactive'} label={label}/>}
      </PanelShell>

      {confirmDefault && (
        <Modal title="Change the default policy?" icon={<IcWarn color={T.amber}/>} onClose={() => setConfirmDefault(null)} width={400}
          actions={<><button onClick={() => setConfirmDefault(null)} style={btnGhost}>Cancel</button><button onClick={() => { set('isDefault', true); setConfirmDefault(null); }} style={{ padding:'9px 18px', border:'none', borderRadius:7, background:T.primary, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer' }}>Continue</button></>}>
          This will unset <strong>{confirmDefault.name}</strong> as the default inside {group.name}. Continue?
        </Modal>
      )}
      {discardCb && <DiscardModal onKeep={() => setDiscardCb(null)} onDiscard={() => { const cb = discardCb; setDiscardCb(null); cb(); }}/>}
    </>
  );
}

Object.assign(window, { DCParentPanel, LineGrid, BandGrid, ChargePreview });
