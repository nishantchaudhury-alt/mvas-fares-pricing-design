// pol-rows.jsx — inline table editor and read-only cards for policy rows.
const { useEffect: useERC, useRef: useRRC, useState: useSRC } = React;

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

const ROW_DEP_TYPES = [['FC','Fixed per Cabin'],['FP','Fixed per Guest'],['PCT','Percentage']];
const ROW_PEN_TYPES = [['NONE','No charge'],['FIXED','Fixed amount'],['PCT_CABIN_FARE','Percentage of cabin fare'],['FULL_DEPOSIT','Full deposit']];

function InlineRowField({ error, errorId, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4, minWidth:0 }}>
      {children}
      {error && <span id={errorId} role="alert" style={{ fontSize:9.5, color:T.red, lineHeight:1.25 }}>{error}</span>}
    </div>
  );
}

function InlineRowInput({ value, onChange, error, errorId, label, placeholder, suffix, disabled = false, inputMode }) {
  return (
    <div style={{ position:'relative', minWidth:0 }}>
      <input className="fi" value={value} disabled={disabled} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        inputMode={inputMode} aria-label={label} aria-invalid={!!error || undefined} aria-describedby={error ? errorId : undefined}
        style={{ ...iS(error, disabled), height:34, padding:suffix ? '6px 22px 6px 8px' : '6px 8px', borderRadius:6, fontSize:12, minWidth:0 }}/>
      {suffix && <span aria-hidden="true" style={{ position:'absolute', right:8, top:17, transform:'translateY(-50%)', color:T.inkFaint, fontSize:10.5, pointerEvents:'none' }}>{suffix}</span>}
    </div>
  );
}

function PolicyTableCatSelect({ value = [], onChange, error, errorId, label }) {
  const [open, setOpen] = useSRC(false);
  const [pos, setPos] = useSRC(null);
  const buttonRef = useRRC(null), menuRef = useRRC(null);
  const selectedAll = value.includes('All');
  const syncPosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.max(210, rect.width);
    const menuHeight = 228;
    const top = rect.bottom + 4 + menuHeight > window.innerHeight ? Math.max(8, rect.top - menuHeight - 4) : rect.bottom + 4;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    setPos({ top, left, width });
  };
  useERC(() => {
    if (!open) return;
    syncPosition();
    const closeOutside = e => {
      if (!buttonRef.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false);
    };
    const reposition = () => syncPosition();
    document.addEventListener('mousedown', closeOutside);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('mousedown', closeOutside);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);
  const toggle = cat => {
    if (cat === 'All') return onChange(selectedAll ? [] : ['All']);
    const next = (selectedAll ? CATS.slice() : value.slice()).filter(x => x !== 'All');
    const at = next.indexOf(cat);
    at === -1 ? next.push(cat) : next.splice(at, 1);
    onChange(CATS.every(x => next.includes(x)) ? ['All'] : next);
  };
  return (<>
    <button ref={buttonRef} type="button" aria-label={label} aria-haspopup="dialog" aria-expanded={open} aria-invalid={!!error || undefined} aria-describedby={error ? errorId : undefined}
      onClick={() => setOpen(v => !v)} style={{ ...iS(error), height:34, padding:'6px 24px 6px 8px', borderRadius:6, fontSize:12, textAlign:'left', cursor:'pointer', position:'relative', overflow:'hidden' }}>
      <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{value.length ? catLabel(value) : 'Select coverage…'}</span>
      <span aria-hidden="true" style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', color:T.inkFaint, display:'flex' }}><IcChevron up={open}/></span>
    </button>
    {open && pos && ReactDOM.createPortal(
      <div ref={menuRef} role="dialog" aria-label={`${label} options`} style={{ position:'fixed', top:pos.top, left:pos.left, width:pos.width, maxHeight:220, overflowY:'auto', zIndex:1800, background:'#fff', border:`1px solid ${T.line}`, borderRadius:8, boxShadow:'0 8px 24px rgba(15,23,42,.14)' }}>
        {['All', ...CATS].map(cat => {
          const checked = cat === 'All' ? selectedAll : selectedAll || value.includes(cat);
          return (
            <label key={cat} style={{ display:'flex', alignItems:'center', gap:9, padding:'8px 11px', borderBottom:cat === 'All' ? `1px solid ${T.lineSoft}` : 'none', color:T.ink, fontSize:12, cursor:'pointer' }}>
              <input type="checkbox" checked={checked} onChange={() => toggle(cat)} style={{ width:13, height:13, accentColor:T.primary }}/>{cat === 'All' ? 'All stateroom types' : cat}
            </label>
          );
        })}
      </div>, document.body
    )}
  </>);
}

function PolicyRowsTable({ type, codeNum, rows, setRows, cellErr = {}, editing = true, validationAttempt = 0 }) {
  const isDep = type === 'deposit', meta = POL_META[type];
  const dragI = useRRC(null);
  const cellRefs = useRRC({});
  const pendingFocus = useRRC(null);
  const upd = (i, k, v) => setRows(rows.map((r, ri) => {
    if (ri !== i) return r;
    const n = { ...r, [k]:v };
    if (k === 'penaltyType' && (v === 'NONE' || v === 'FULL_DEPOSIT')) n.penaltyValue = '';
    return n;
  }));
  const addRow = () => {
    const index = rows.length;
    pendingFocus.current = `${index}:${isDep ? 'marketingName' : 'beginDts'}`;
    setRows([...rows, blankChild(type)]);
  };
  const removeRow = i => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, ri) => ri !== i));
  };
  const moveRow = (from, to) => {
    if (from === null || from === to || to < 0 || to >= rows.length) return;
    const next = rows.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setRows(next);
  };
  const dropAt = i => {
    const from = dragI.current;
    dragI.current = null;
    moveRow(from, i);
  };
  const focusCell = key => {
    const cell = cellRefs.current[key];
    const control = cell?.querySelector('input:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!control) return;
    control.focus({ preventScroll:true });
    control.scrollIntoView({ block:'center', inline:'center', behavior:'smooth' });
  };
  const firstErrorKey = () => {
    const order = isDep ? ['marketingName','beginDts','endDts','depositType','amount','cats'] : ['beginDts','endDts','penaltyType','penaltyValue','cats'];
    return Object.keys(cellErr).sort((a, b) => {
      const [ar, af] = a.split(':'), [br, bf] = b.split(':');
      return Number(ar) - Number(br) || order.indexOf(af) - order.indexOf(bf);
    })[0];
  };
  useERC(() => {
    if (!validationAttempt) return;
    const key = firstErrorKey();
    if (key) window.requestAnimationFrame(() => focusCell(key));
  }, [validationAttempt]);
  useERC(() => {
    if (!pendingFocus.current) return;
    const key = pendingFocus.current;
    pendingFocus.current = null;
    const id = window.requestAnimationFrame(() => focusCell(key));
    return () => window.cancelAnimationFrame(id);
  }, [rows.length]);

  if (!rows.length) return (
    <div role="group" aria-label={`Empty ${meta.childWords.toLowerCase()} configuration`} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:`1px solid ${T.line}`, borderRadius:7, background:T.fill }}>
      <span aria-hidden="true" style={{ width:24, height:24, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0, borderRadius:6, border:`1px solid ${T.primaryLine}`, background:'#fff', color:T.primary, fontSize:14, fontWeight:600 }}>+</span>
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ color:T.ink, fontSize:11.5, fontWeight:700 }}>No {meta.childWords.toLowerCase()} configured</div>
        <div style={{ marginTop:1, color:T.inkSoft, fontSize:10.25, lineHeight:1.35 }}>Add the first row to define DTS, {isDep ? 'deposit amount' : 'penalty'}, and coverage.</div>
      </div>
      {editing && <button type="button" onClick={addRow} style={{ flexShrink:0, padding:'5px 9px', border:'none', borderRadius:6, background:T.primary, color:'#fff', fontSize:10.5, fontWeight:700, cursor:'pointer' }}>+ Add {meta.childWord}</button>}
    </div>
  );

  const dataHeader = isDep
    ? ['Line ID','Marketing Name','Begin DTS','End DTS','Type','Amount','Stateroom Coverage','Cancel Applies']
    : ['Band ID','Begin DTS','End DTS','Penalty Type','Penalty Value','Stateroom Coverage'];
  const dataWidths = isDep ? [76,170,86,86,150,110,180,112] : [76,86,86,190,116,180];
  const header = editing ? ['', ...dataHeader, ''] : dataHeader;
  const colSpan = header.length;
  const widths = editing ? [38, ...dataWidths, 58] : dataWidths;
  const minWidth = widths.reduce((sum, width) => sum + width, 0);
  const thStyle = { position:'sticky', top:0, zIndex:2, padding:'8px', textAlign:'left', color:T.inkLabel, background:'#F8FAFC', fontSize:9.25, fontWeight:800, textTransform:'uppercase', letterSpacing:'.62px', whiteSpace:'nowrap', borderBottom:`1px solid ${T.line}` };
  const tdStyle = { padding:'9px 8px', color:T.ink, fontSize:12, lineHeight:1.3, borderBottom:`1px solid ${T.lineSoft}`, verticalAlign:'top' };
  const errorId = (i, field) => `policy-row-${type}-${i}-${field}-error`;
  const fieldCell = (i, field, control, extra = {}) => {
    const error = cellErr[`${i}:${field}`];
    return (
      <td key={field} ref={node => { if (node) cellRefs.current[`${i}:${field}`] = node; }} style={{ ...tdStyle, ...extra }}>
        <InlineRowField error={error} errorId={errorId(i, field)}>{control(error, errorId(i, field))}</InlineRowField>
      </td>
    );
  };

  return (
    <div style={{ border:`1px solid ${T.line}`, borderRadius:7, background:'#fff', overflow:'hidden', boxShadow:'0 1px 2px rgba(15,23,42,.04)' }}>
      <div className="hscroll" style={{ overflow:'auto', maxHeight:rows.length > 6 ? 'min(46vh, 520px)' : 'none', scrollbarGutter:'stable' }}>
        <table aria-label={`${meta.childWords} configuration`} style={{ width:'100%', minWidth, borderCollapse:'collapse', tableLayout:'fixed' }}>
          <colgroup>{widths.map((width, i) => <col key={i} style={{ width }}/>)}</colgroup>
          <thead style={{ background:T.fill }}>
            <tr>{header.map((label, i) => <th key={`${label}-${i}`} scope="col" aria-label={!label ? (i === 0 ? 'Reorder' : 'Remove') : undefined} style={thStyle}>{label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rowErrorCount = Object.keys(cellErr).filter(k => k.startsWith(`${i}:`)).length;
              const code = `${codeNum}.${i + 1}`;
              const valDis = !isDep && (r.penaltyType === 'NONE' || r.penaltyType === 'FULL_DEPOSIT');
              return (
                  <tr key={`policy-row-${i}`} onDragOver={editing ? e => e.preventDefault() : undefined} onDrop={editing ? () => dropAt(i) : undefined}
                    style={{ background:'#fff' }}>
                    {editing && <td style={{ ...tdStyle, textAlign:'center', boxShadow:rowErrorCount ? 'inset 3px 0 0 #D97706' : 'none' }}>
                      <span role="button" tabIndex="0" aria-label={`Reorder ${meta.childWord.toLowerCase()} ${i + 1}. Use up and down arrow keys to move it.`} draggable
                        onDragStart={() => { dragI.current = i; }} onDragEnd={() => { dragI.current = null; }}
                        onKeyDown={e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); moveRow(i, i + (e.key === 'ArrowUp' ? -1 : 1)); } }}
                        style={{ width:24, height:24, display:'inline-flex', alignItems:'center', justifyContent:'center', color:T.inkFaint, cursor:'grab' }}><IcGrip/></span>
                    </td>}
                    <td style={{ ...tdStyle, fontFamily:MONO, fontWeight:800, color:T.inkSoft, boxShadow:!editing && rowErrorCount ? 'inset 3px 0 0 #D97706' : 'none' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                        <span style={{ display:'inline-flex', alignItems:'center', minHeight:22, padding:'2px 6px', border:`1px solid ${T.line}`, borderRadius:5, background:T.fill, color:T.inkSoft }}>{code}</span>
                        {rowErrorCount > 0 && <span aria-label={`${rowErrorCount} ${rowErrorCount === 1 ? 'field needs' : 'fields need'} attention`} title={`${rowErrorCount} ${rowErrorCount === 1 ? 'issue' : 'issues'} in this row`} style={{ display:'inline-flex', alignItems:'center', minHeight:20, padding:'2px 6px', borderRadius:999, background:'#FFF7E6', color:'#92400E', fontFamily:'inherit', fontSize:9.5, fontWeight:800, whiteSpace:'nowrap' }}>! {rowErrorCount}</span>}
                      </span>
                    </td>
                    {isDep && (editing
                      ? fieldCell(i, 'marketingName', (error, id) => <InlineRowInput value={r.marketingName} onChange={v => upd(i, 'marketingName', v)} error={error} errorId={id} label={`Marketing name for line ${i + 1}`} placeholder="e.g. Full Deposit"/>)
                      : <td style={tdStyle}>{r.marketingName || '—'}</td>)}
                    {editing
                      ? fieldCell(i, 'beginDts', (error, id) => <InlineRowInput value={r.beginDts} onChange={v => upd(i, 'beginDts', v.replace(/[^0-9]/g, ''))} error={error} errorId={id} label={`Begin DTS for ${meta.childWord.toLowerCase()} ${i + 1}`} placeholder="∞" inputMode="numeric"/>)
                      : <td style={tdStyle}>{isBlank(r.beginDts) ? '∞' : r.beginDts}</td>}
                    {editing
                      ? fieldCell(i, 'endDts', (error, id) => <InlineRowInput value={r.endDts} onChange={v => upd(i, 'endDts', v.replace(/[^0-9]/g, ''))} error={error} errorId={id} label={`End DTS for ${meta.childWord.toLowerCase()} ${i + 1}`} placeholder="0" inputMode="numeric"/>)
                      : <td style={tdStyle}>{isBlank(r.endDts) ? '—' : r.endDts}</td>}
                    {isDep
                      ? <td style={{ ...tdStyle, fontFamily:MONO }}>{editing ? <Sel compact value={r.depositType} onChange={v => upd(i, 'depositType', v)} opts={ROW_DEP_TYPES} ariaLabel={`Deposit type for line ${i + 1}`}/> : r.depositType}</td>
                      : <td style={{ ...tdStyle, fontFamily:MONO }}>{editing ? <Sel compact value={r.penaltyType} onChange={v => upd(i, 'penaltyType', v)} opts={ROW_PEN_TYPES} ariaLabel={`Penalty type for band ${i + 1}`}/> : r.penaltyType}</td>}
                    {editing
                      ? fieldCell(i, isDep ? 'amount' : 'penaltyValue', (error, id) => <InlineRowInput
                          value={valDis ? '' : isDep ? r.amount : r.penaltyValue} disabled={valDis}
                          onChange={v => upd(i, isDep ? 'amount' : 'penaltyValue', v.replace(/[^0-9.]/g, ''))}
                          error={error} errorId={id} label={`${isDep ? 'Amount' : 'Penalty value'} for ${meta.childWord.toLowerCase()} ${i + 1}`}
                          suffix={isDep ? (r.depositType === 'PCT' ? '%' : '$') : r.penaltyType === 'PCT_CABIN_FARE' ? '%' : r.penaltyType === 'FIXED' ? '$' : '—'} inputMode="decimal"/>)
                      : <td style={{ ...tdStyle, fontWeight:650 }}>{isDep ? depAmountLabel(r) : penAmountLabel(r)}</td>}
                    {editing
                      ? fieldCell(i, 'cats', (error, id) => <PolicyTableCatSelect value={r.cats || []} onChange={v => upd(i, 'cats', v)} error={error} errorId={id} label={`Stateroom coverage for ${meta.childWord.toLowerCase()} ${i + 1}`}/>)
                      : <td style={tdStyle}>{catSentence(r.cats || [])}</td>}
                    {isDep && <td style={{ ...tdStyle, textAlign:'center', paddingTop:editing ? 14 : 8 }}>{editing
                      ? <Toggle on={r.cancelApplies} dis={false} onChange={v => upd(i, 'cancelApplies', v)} label={`Cancellation policy applies to line ${i + 1}`}/>
                      : <span style={{ display:'inline-flex', padding:'2px 7px', borderRadius:999, background:r.cancelApplies ? T.primaryBg : T.fill, color:r.cancelApplies ? T.primary : T.inkFaint, fontSize:10.5, fontWeight:700 }}>{r.cancelApplies ? 'Yes' : 'No'}</span>}
                    </td>}
                    {editing && <td style={{ ...tdStyle, textAlign:'center' }}>
                      <button type="button" aria-label={`Remove ${meta.childWord.toLowerCase()} ${i + 1}`} onClick={() => removeRow(i)} disabled={rows.length <= 1}
                        title={rows.length <= 1 ? `At least one ${meta.childWord.toLowerCase()} is required` : `Remove ${meta.childWord.toLowerCase()}`}
                        style={{ width:28, height:28, borderRadius:6, border:'none', background:'transparent', color:rows.length <= 1 ? T.inkFaint : T.red, cursor:rows.length <= 1 ? 'not-allowed' : 'pointer', opacity:rows.length <= 1 ? .45 : 1, display:'inline-flex', alignItems:'center', justifyContent:'center' }}><IcX size={13}/></button>
                    </td>}
                  </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editing && <div style={{ display:'flex', alignItems:'center', minHeight:42, padding:'6px 9px', borderTop:`1px solid ${T.lineSoft}`, background:'#F8FAFC' }}>
        <button type="button" onClick={addRow} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 9px', border:`1px solid ${T.line}`, borderRadius:6, background:'#fff', color:T.primary, fontSize:10.5, fontWeight:800, cursor:'pointer', boxShadow:'0 1px 1px rgba(15,23,42,.03)' }}>
          <span aria-hidden="true" style={{ fontSize:14, lineHeight:1 }}>+</span> Add {meta.childWord}
        </button>
        <span style={{ marginLeft:8, color:T.inkFaint, fontSize:9.75 }}>Adds a new row to this schedule.</span>
      </div>}
    </div>
  );
}

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

Object.assign(window, { PolicyRowsTable, RowCards, RCField, RCGroup });
