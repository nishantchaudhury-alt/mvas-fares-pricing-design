// pol-rows.jsx — responsive stacked editor/reader for Milestone Lines & Cancellation Bands.
// Replaces the wide horizontal grids so the drawer works at ~30% viewport width.
const { useRef: useRRC } = React;

function RCField({ label, span, err, children }) {
  return (
    <div style={{ gridColumn:span ? '1 / -1' : 'auto', display:'flex', flexDirection:'column', gap:4, minWidth:0 }}>
      <label style={{ fontSize:9.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px' }}>{label}</label>
      {children}
      {err && <span style={{ fontSize:10.5, color:T.red }}>{err}</span>}
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
    <div style={{ border:`1px dashed ${T.line}`, borderRadius:9, padding:'22px 14px', textAlign:'center', fontSize:12.5, color:T.inkSoft, background:T.fill }}>
      No {meta.childWords.toLowerCase()} yet.
      {editing && <div style={{ marginTop:10 }}><button onClick={() => setRows([blankChild(type)])} style={{ ...polGhost, padding:'6px 12px' }}>{meta.addChild}</button></div>}
    </div>
  );

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {rows.map((r, i) => {
        const valDis = !isDep && (r.penaltyType === 'NONE' || r.penaltyType === 'FULL_DEPOSIT');
        return (
          <div key={i} {...dragProps(i)} style={{ border:`1px solid ${T.line}`, borderRadius:9, background:'#fff', overflow:'hidden', boxShadow:'0 1px 2px rgba(15,23,42,.03)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px', background:T.fill, borderBottom:`1px solid ${T.lineSoft}` }}>
              {editing && <span style={{ color:T.inkFaint, cursor:'grab', display:'flex' }} title="Drag to reorder"><IcGrip/></span>}
              <span style={{ fontFamily:MONO, fontSize:11, fontWeight:700, color:T.inkSoft }}>{codeNum}.{i + 1}</span>
              <span style={{ fontSize:11, color:T.inkFaint, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {isBlank(r.endDts) && isBlank(r.beginDts) ? `New ${meta.childWord.toLowerCase()}`
                  : `DTS ${isBlank(r.beginDts) ? `${r.endDts === '' ? '—' : r.endDts}+` : `${r.endDts}–${r.beginDts}`}`}
              </span>
              {editing && (
                <button onClick={() => setRows(rows.filter((_, ri) => ri !== i))} disabled={rows.length <= 1} title="Remove"
                  style={{ marginLeft:'auto', width:24, height:24, borderRadius:6, border:'none', background:'none', cursor:rows.length <= 1 ? 'not-allowed' : 'pointer', color:rows.length <= 1 ? T.inkFaint : T.red, display:'flex', alignItems:'center', justifyContent:'center' }}><IcX size={11}/></button>
              )}
            </div>
            <div style={{ padding:'11px 12px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(116px, 1fr))', gap:11 }}>
              {isDep && (
                <RCField span label="Marketing name" err={cellErr[`${i}:marketingName`]}>
                  {editing ? rcIn(r.marketingName, v => upd(i, 'marketingName', v), cellErr[`${i}:marketingName`], 'e.g. Full Deposit') : rcVal(r.marketingName || '—')}
                </RCField>
              )}
              <RCField label="Begin DTS" err={cellErr[`${i}:beginDts`]}>
                {editing ? rcIn(r.beginDts, v => upd(i, 'beginDts', v.replace(/[^0-9]/g, '')), cellErr[`${i}:beginDts`], '∞') : rcVal(isBlank(r.beginDts) ? '∞ (open-ended)' : r.beginDts)}
              </RCField>
              <RCField label="End DTS" err={cellErr[`${i}:endDts`]}>
                {editing ? rcIn(r.endDts, v => upd(i, 'endDts', v.replace(/[^0-9]/g, '')), cellErr[`${i}:endDts`], '0') : rcVal(r.endDts === '' ? '—' : r.endDts)}
              </RCField>
              {isDep ? (<>
                <RCField label="Type">
                  {editing ? <Sel compact value={r.depositType} onChange={v => upd(i, 'depositType', v)} opts={DEP_TYPES}/> : rcVal(r.depositType)}
                </RCField>
                <RCField label="Amount" err={cellErr[`${i}:amount`]}>
                  {editing ? rcIn(r.amount, v => upd(i, 'amount', v.replace(/[^0-9.]/g, '')), cellErr[`${i}:amount`], '', r.depositType === 'PCT' ? '%' : '$') : rcVal(depAmountLabel(r))}
                </RCField>
              </>) : (<>
                <RCField span label="Penalty type">
                  {editing ? <Sel compact value={r.penaltyType} onChange={v => upd(i, 'penaltyType', v)} opts={PEN_TYPES}/> : rcVal(r.penaltyType)}
                </RCField>
                <RCField label="Penalty value" err={cellErr[`${i}:penaltyValue`]}>
                  {editing
                    ? <div style={{ position:'relative' }}>
                        <input value={valDis ? '' : r.penaltyValue} disabled={valDis} onChange={e => upd(i, 'penaltyValue', e.target.value.replace(/[^0-9.]/g, ''))}
                          style={{ ...iS(cellErr[`${i}:penaltyValue`], valDis), padding:'7px 20px 7px 9px', fontSize:12.5 }}/>
                        <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:11, color:T.inkFaint, pointerEvents:'none' }}>{r.penaltyType === 'PCT_CABIN_FARE' ? '%' : r.penaltyType === 'FIXED' ? '$' : '—'}</span>
                      </div>
                    : rcVal(penAmountLabel(r))}
                </RCField>
              </>)}
              <RCField span label="Stateroom types" err={cellErr[`${i}:cats`]}>
                {editing ? <CatSelect value={r.cats} onChange={v => upd(i, 'cats', v)} err={cellErr[`${i}:cats`]}/> : rcVal(catSentence(r.cats || []))}
              </RCField>
              {isDep && (
                <div style={{ gridColumn:'1 / -1', display:'flex', alignItems:'center', gap:10, paddingTop:2 }}>
                  <Toggle on={r.cancelApplies} dis={!editing} onChange={v => upd(i, 'cancelApplies', v)}/>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600 }}>Cancellation policy applies</div>
                    <div style={{ fontSize:10.5, color:T.inkFaint }}>Deposit paid can act as the cancellation-charge floor.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {editing && (
        <button onClick={() => setRows([...rows, blankChild(type)])}
          style={{ alignSelf:'flex-start', background:'none', border:`1px dashed ${T.line}`, borderRadius:8, padding:'7px 12px', color:T.primary, fontSize:12.5, fontWeight:700, cursor:'pointer' }}>{meta.addChild}</button>
      )}
    </div>
  );
}

Object.assign(window, { RowCards, RCField });
