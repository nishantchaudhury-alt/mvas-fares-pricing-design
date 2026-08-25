// pol-rows.jsx — responsive stacked editor/reader for Milestone Lines & Cancellation Bands.
// Replaces the wide horizontal grids so the drawer works at ~30% viewport width.
const { useRef: useRRC } = React;

function RCField({ label, span, err, required, children }) {
  const uid = React.useId().replace(/:/g, '');
  const controlId = `policy-row-field-${uid}`;
  const labelId = `${controlId}-label`, errorId = `${controlId}-error`;
  const bound = bindFieldControl(children, { id:controlId, label, describedBy:err ? errorId : undefined, invalid:!!err, required:!!required });
  return (
    <div role="group" aria-labelledby={labelId} style={{ gridColumn:span ? '1 / -1' : 'auto', display:'flex', flexDirection:'column', gap:4, minWidth:0 }}>
      <label id={labelId} htmlFor={bound.bound ? bound.controlId : undefined} style={{ fontSize:9.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px' }}>{label}{required && <span aria-hidden="true" style={{ color:T.red }}> *</span>}</label>
      {bound.node}
      {err && <span id={errorId} role="alert" style={{ fontSize:10.5, color:T.red }}>{err}</span>}
    </div>
  );
}

function RCGroup({ label, helper, columns = 2, divided, children }) {
  return (
    <div role="group" aria-label={label} style={{ padding:divided ? '14px 0 2px' : '2px 0', borderTop:divided ? `1px solid ${T.lineSoft}` : 'none' }}>
      <div style={{ marginBottom:10 }}>
        <div style={{ fontSize:9.5, fontWeight:800, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.7px' }}>{label}</div>
        {helper && <div style={{ fontSize:10.5, color:T.inkSoft, lineHeight:1.4, marginTop:2 }}>{helper}</div>}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${columns}, minmax(0, 1fr))`, gap:10 }}>{children}</div>
    </div>
  );
}
const rcIn = (v, onChange, err, ph, suffix) => (
  <div style={{ position:'relative' }}>
    <input className="fi" value={v} onChange={e => onChange(e.target.value)} placeholder={ph}
      style={{ ...iS(err), padding:suffix ? '7px 20px 7px 9px' : '7px 9px', fontSize:12.5 }}/>
    {suffix && <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:11, color:T.inkFaint, pointerEvents:'none' }}>{suffix}</span>}
  </div>
);
const rcVal = txt => <span style={{ fontSize:12.5, color:T.ink }}>{txt}</span>;

function RowCards({ type, codeNum, rows, setRows, cellErr = {}, editing }) {
  const isDep = type === 'deposit', meta = POL_META[type];
  const dragI = useRRC(null);
  const upd = (i, k, v) => setRows(rows.map((r, ri) => {
    if (ri !== i) return r;
    const n = { ...r, [k]:v };
    if (k === 'penaltyType' && (v === 'NONE' || v === 'FULL_DEPOSIT')) n.penaltyValue = '';
    return n;
  }));
  const dragProps = i => editing ? {
    draggable:true,
    onDragStart:() => { dragI.current = i; },
    onDragOver:e => e.preventDefault(),
    onDrop:() => { const f = dragI.current; if (f === null || f === i) return; const n = rows.slice(); const [m] = n.splice(f, 1); n.splice(i, 0, m); dragI.current = null; setRows(n); },
    onDragEnd:() => { dragI.current = null; },
  } : {};

  if (!rows.length) return (
    <div style={{ border:`1px dashed ${T.line}`, borderRadius:9, padding:'26px 16px', textAlign:'center', color:T.inkSoft, background:T.fill }}>
      <span aria-hidden="true" style={{ width:30, height:30, margin:'0 auto 8px', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', border:`1px solid ${T.line}`, color:T.primary, fontSize:18 }}>+</span>
      <div style={{ fontSize:13, fontWeight:700, color:T.ink }}>No {meta.childWords.toLowerCase()} configured</div>
      <div style={{ fontSize:11, marginTop:3 }}>Add the first {meta.childWord.toLowerCase()} to define pricing and stateroom coverage.</div>
      {editing && <div style={{ marginTop:12 }}><button type="button" onClick={() => setRows([blankChild(type)])} style={{ ...polDark, padding:'7px 12px' }}>{meta.addChild}</button></div>}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {rows.map((r, i) => {
        const valDis = !isDep && (r.penaltyType === 'NONE' || r.penaltyType === 'FULL_DEPOSIT');
        const rowErrors = Object.keys(cellErr).filter(k => k.startsWith(`${i}:`));
        const fieldsReady = rowErrors.length === 0;
        const code = `${codeNum}.${i + 1}`;
        const range = isBlank(r.endDts) && isBlank(r.beginDts) ? `New ${meta.childWord.toLowerCase()}`
          : `DTS ${isBlank(r.beginDts) ? `${r.endDts === '' ? '—' : r.endDts}+` : `${r.endDts}–${r.beginDts}`}`;
        const chargeSummary = isDep
          ? (isBlank(r.amount) ? 'Amount required' : depAmountLabel(r))
          : (!valDis && isBlank(r.penaltyValue) ? 'Value required' : penAmountLabel(r));
        const summaries = isDep
          ? [range, r.marketingName || 'Name required', chargeSummary, catSentence(r.cats || [])]
          : [range, chargeSummary, catSentence(r.cats || [])];
        return (
          <div key={i} {...dragProps(i)} style={{ border:`1px solid ${fieldsReady ? T.line : '#FCD34D'}`, borderRadius:10, background:'#fff', overflow:'hidden', boxShadow:'0 1px 2px rgba(15,23,42,.06)' }}>
            <div style={{ display:'grid', gridTemplateColumns:`${editing ? '28px ' : ''}minmax(0,1fr) auto`, alignItems:'start', gap:10, padding:'11px 12px', background:fieldsReady ? '#fff' : '#FFFBEB', borderBottom:`1px solid ${fieldsReady ? T.line : '#FDE68A'}` }}>
              {editing && <span aria-hidden="true" style={{ width:28, height:28, borderRadius:6, border:`1px solid ${T.line}`, background:T.fill, color:T.inkFaint, cursor:'grab', display:'flex', alignItems:'center', justifyContent:'center' }} title="Drag to reorder"><IcGrip/></span>}
              <div style={{ minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:13, fontWeight:700, color:T.ink }}>{meta.childWord} {i + 1}</span>
                  <span style={{ padding:'3px 7px', borderRadius:5, border:`1px solid ${T.line}`, background:T.fill, color:T.inkSoft, fontFamily:MONO, fontSize:10, fontWeight:800, lineHeight:1.35 }}>{code}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap', marginTop:7 }}>
                  {summaries.map((summary, summaryIndex) => (
                    <span key={`${summary}-${summaryIndex}`} style={{ maxWidth:'100%', padding:'3px 7px', borderRadius:999, background:summaryIndex === 0 ? T.primaryBg : T.fill, border:`1px solid ${summaryIndex === 0 ? T.primaryLine : T.lineSoft}`, color:T.inkSoft, fontSize:10.5, lineHeight:1.35, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{summary}</span>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, color:fieldsReady ? '#047857' : '#92400E', fontSize:10, fontWeight:800, whiteSpace:'nowrap' }}><span aria-hidden="true">{fieldsReady ? '✓' : '!'}</span>{fieldsReady ? 'Complete' : `${rowErrors.length} to resolve`}</span>
                {editing && (
                  <button type="button" aria-label={`Remove ${meta.childWord.toLowerCase()} ${i + 1}`} onClick={() => setRows(rows.filter((_, ri) => ri !== i))} disabled={rows.length <= 1} title="Remove"
                    style={{ width:26, height:26, borderRadius:6, border:`1px solid ${T.lineSoft}`, background:'#fff', cursor:rows.length <= 1 ? 'not-allowed' : 'pointer', color:rows.length <= 1 ? T.inkFaint : T.red, display:'flex', alignItems:'center', justifyContent:'center', opacity:rows.length <= 1 ? .55 : 1 }}><IcX size={11}/></button>
                )}
              </div>
            </div>
            <div style={{ padding:'13px 14px 14px', display:'flex', flexDirection:'column', gap:12 }}>
              {isDep ? (<>
                <RCGroup label="Line identity" helper="Customer-facing label used in deposit schedules." columns={1}>
                  <RCField required label="Marketing name" err={cellErr[`${i}:marketingName`]}>
                    {editing ? rcIn(r.marketingName, v => upd(i, 'marketingName', v), cellErr[`${i}:marketingName`], 'e.g. Full Deposit') : rcVal(r.marketingName || '—')}
                  </RCField>
                </RCGroup>
                <RCGroup divided label="DTS window" helper="Define when this deposit amount applies before sailing.">
                  <RCField label="Begin DTS" err={cellErr[`${i}:beginDts`]}>
                    {editing ? rcIn(r.beginDts, v => upd(i, 'beginDts', v.replace(/[^0-9]/g, '')), cellErr[`${i}:beginDts`], '∞') : rcVal(isBlank(r.beginDts) ? '∞ (open-ended)' : r.beginDts)}
                  </RCField>
                  <RCField required label="End DTS" err={cellErr[`${i}:endDts`]}>
                    {editing ? rcIn(r.endDts, v => upd(i, 'endDts', v.replace(/[^0-9]/g, '')), cellErr[`${i}:endDts`], '0') : rcVal(r.endDts === '' ? '—' : r.endDts)}
                  </RCField>
                </RCGroup>
                <RCGroup divided label="Deposit charge" helper="Set how the deposit amount is calculated.">
                  <RCField label="Type">
                    {editing ? <Sel compact value={r.depositType} onChange={v => upd(i, 'depositType', v)} opts={DEP_TYPES}/> : rcVal(r.depositType)}
                  </RCField>
                  <RCField required label="Amount" err={cellErr[`${i}:amount`]}>
                    {editing ? rcIn(r.amount, v => upd(i, 'amount', v.replace(/[^0-9.]/g, '')), cellErr[`${i}:amount`], '', r.depositType === 'PCT' ? '%' : '$') : rcVal(depAmountLabel(r))}
                  </RCField>
                </RCGroup>
                <RCGroup divided label="Applicability" helper="Choose who the line covers and whether it affects cancellation charges." columns={1}>
                  <RCField required label="Stateroom types" err={cellErr[`${i}:cats`]}>
                    {editing ? <CatSelect value={r.cats} onChange={v => upd(i, 'cats', v)} err={cellErr[`${i}:cats`]}/> : rcVal(catSentence(r.cats || []))}
                  </RCField>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, paddingTop:10, borderTop:`1px solid ${T.line}` }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:T.ink }}>Cancellation policy applies</div>
                      <div style={{ fontSize:10.5, color:T.inkSoft, lineHeight:1.4, marginTop:2 }}>Deposit paid can act as the cancellation-charge floor.</div>
                    </div>
                    <Toggle on={r.cancelApplies} dis={!editing} onChange={v => upd(i, 'cancelApplies', v)} label={`Cancellation policy applies to line ${i + 1}`}/>
                  </div>
                </RCGroup>
              </>) : (<>
                <RCGroup label="Cancellation window" helper="Set the DTS range and penalty method for this band." columns={3}>
                  <RCField label="Begin DTS" err={cellErr[`${i}:beginDts`]}>
                    {editing ? rcIn(r.beginDts, v => upd(i, 'beginDts', v.replace(/[^0-9]/g, '')), cellErr[`${i}:beginDts`], '∞') : rcVal(isBlank(r.beginDts) ? '∞ (open-ended)' : r.beginDts)}
                  </RCField>
                  <RCField required label="End DTS" err={cellErr[`${i}:endDts`]}>
                    {editing ? rcIn(r.endDts, v => upd(i, 'endDts', v.replace(/[^0-9]/g, '')), cellErr[`${i}:endDts`], '0') : rcVal(r.endDts === '' ? '—' : r.endDts)}
                  </RCField>
                  <RCField label="Penalty type">
                    {editing ? <Sel compact value={r.penaltyType} onChange={v => upd(i, 'penaltyType', v)} opts={PEN_TYPES}/> : rcVal(r.penaltyType)}
                  </RCField>
                </RCGroup>
                <RCGroup divided label="Penalty & scope" helper="Set the charge value and stateroom coverage.">
                  <RCField label="Penalty value" err={cellErr[`${i}:penaltyValue`]}>
                    {editing
                      ? <div style={{ position:'relative' }}>
                          <input value={valDis ? '' : r.penaltyValue} disabled={valDis} onChange={e => upd(i, 'penaltyValue', e.target.value.replace(/[^0-9.]/g, ''))}
                            style={{ ...iS(cellErr[`${i}:penaltyValue`], valDis), padding:'7px 20px 7px 9px', fontSize:12.5 }}/>
                          <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:11, color:T.inkFaint, pointerEvents:'none' }}>{r.penaltyType === 'PCT_CABIN_FARE' ? '%' : r.penaltyType === 'FIXED' ? '$' : '—'}</span>
                        </div>
                      : rcVal(penAmountLabel(r))}
                  </RCField>
                  <RCField required label="Stateroom types" err={cellErr[`${i}:cats`]}>
                    {editing ? <CatSelect value={r.cats} onChange={v => upd(i, 'cats', v)} err={cellErr[`${i}:cats`]}/> : rcVal(catSentence(r.cats || []))}
                  </RCField>
                </RCGroup>
              </>)}
            </div>
          </div>
        );
      })}
      {editing && (
        <button type="button" onClick={() => setRows([...rows, blankChild(type)])}
          style={{ width:'100%', background:T.fill, border:`1px dashed ${T.line}`, borderRadius:8, padding:'9px 12px', color:T.primary, fontSize:12.5, fontWeight:700, cursor:'pointer' }}>+ {meta.addChild.replace(/^\+\s*/, '')}</button>
      )}
    </div>
  );
}

Object.assign(window, { RowCards, RCField, RCGroup });
