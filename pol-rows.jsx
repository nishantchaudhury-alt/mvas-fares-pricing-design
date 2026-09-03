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

const ROW_DEP_TYPES = DEP_TYPES;
const ROW_PEN_TYPES = [['NONE','No charge'],['FIXED','Fixed amount'],['PCT_CABIN_FARE','Percentage of cabin fare'],['FULL_DEPOSIT','Full deposit']];
const PENALTY_TYPE_REFERENCE = [
  { code:'NONE', title:'No penalty', detail:'Apply no cancellation penalty for this band.' },
  { code:'FIXED', title:'Fixed amount', detail:'Apply the configured fixed cancellation amount.' },
  { code:'PCT_CABIN_FARE', title:'Cabin-fare percentage', detail:'Apply the configured percentage to the booking’s applicable cabin fare.' },
  { code:'FULL_DEPOSIT', title:'Deposit amount', detail:'Use the booking’s applicable deposit amount as the cancellation penalty.' },
];
const DEPOSIT_TYPE_TITLES = {
  'Fixed per Cabin':'One amount for the cabin',
  'Fixed per Person':'One amount for each person',
  Percentage:'A share of the amount due',
};
const DEPOSIT_TYPE_REFERENCE = DEP_HELP.map(([code, detail]) => ({ code, title:DEPOSIT_TYPE_TITLES[code], detail }));

function PolicyTypeHeader({ type }) {
  const isDeposit = type === 'deposit';
  const label = isDeposit ? 'Type' : 'Penalty Type';
  const title = isDeposit ? 'Deposit type reference' : 'Penalty type reference';
  const description = isDeposit
    ? 'How each selection calculates the deposit amount.'
    : 'How each selection calculates the cancellation charge.';
  const entries = isDeposit ? DEPOSIT_TYPE_REFERENCE : PENALTY_TYPE_REFERENCE;
  const [open, setOpen] = useSRC(false);
  const [pos, setPos] = useSRC(null);
  const triggerRef = useRRC(null);
  const uid = React.useId().replace(/:/g, '');
  const tooltipId = `policy-type-reference-${uid}`;
  const syncPosition = () => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const edge = 12;
    const gap = 10;
    const width = Math.min(468, window.innerWidth - edge * 2);
    const estimatedHeight = 78 + entries.length * 58;
    const below = rect.bottom + gap + estimatedHeight <= window.innerHeight;
    const top = below ? rect.bottom + gap : Math.max(edge, rect.top - estimatedHeight - gap);
    const left = Math.max(edge, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - edge));
    const arrowLeft = Math.max(22, Math.min(width - 22, rect.left + rect.width / 2 - left));
    setPos({ top, left, width, below, arrowLeft });
  };
  const show = () => { syncPosition(); setOpen(true); };
  const hide = () => setOpen(false);
  useERC(() => {
    if (!open) return;
    const reposition = () => syncPosition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  return (<>
    <span onMouseEnter={show} onMouseLeave={hide} style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
      <span>{label}</span>
      <button ref={triggerRef} type="button" aria-label={`${title}. Hover or focus for definitions.`}
        aria-describedby={open ? tooltipId : undefined} onFocus={show} onBlur={hide}
        onKeyDown={event => { if (event.key === 'Escape') { hide(); event.currentTarget.blur(); } }}
        style={{ width:16, height:16, padding:0, border:'none', borderRadius:'50%', background:open ? T.primaryBg : 'transparent', color:open ? T.primary : T.inkFaint, cursor:'help', display:'inline-flex', alignItems:'center', justifyContent:'center', outlineOffset:2 }}>
        <IcInfo color="currentColor" size={11}/>
      </button>
    </span>
    {open && pos && ReactDOM.createPortal(
      <div id={tooltipId} role="tooltip" style={{ position:'fixed', top:pos.top, left:pos.left, width:pos.width, zIndex:2100, color:T.ink, textAlign:'left', textTransform:'none', letterSpacing:'normal', whiteSpace:'normal', pointerEvents:'none' }}>
        <span aria-hidden="true" style={{ position:'absolute', left:pos.arrowLeft - 6, [pos.below ? 'top' : 'bottom']:-6, width:12, height:12, transform:'rotate(45deg)', background:'#fff', borderLeft:pos.below ? `1px solid ${T.line}` : 'none', borderTop:pos.below ? `1px solid ${T.line}` : 'none', borderRight:pos.below ? 'none' : `1px solid ${T.line}`, borderBottom:pos.below ? 'none' : `1px solid ${T.line}`, zIndex:1 }}/>
        <div style={{ position:'relative', overflow:'hidden', border:`1px solid ${T.line}`, borderRadius:12, background:T.panel, boxShadow:'0 18px 45px rgba(15,23,42,.16), 0 4px 12px rgba(15,23,42,.08)' }}>
          <div style={{ height:3, background:T.primary }}/>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'11px 13px', background:'#fff', borderBottom:`1px solid ${T.line}` }}>
            <span style={{ display:'flex', alignItems:'center', gap:9, minWidth:0 }}>
              <span aria-hidden="true" style={{ width:26, height:26, flexShrink:0, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:7, background:T.primaryBg, border:`1px solid ${T.primaryLine}`, color:T.primary }}><IcInfo color="currentColor" size={13}/></span>
              <span style={{ minWidth:0 }}>
                <span style={{ display:'block', fontSize:12.5, fontWeight:750, lineHeight:1.25 }}>{title}</span>
                <span style={{ display:'block', marginTop:2, color:T.inkSoft, fontSize:10.5, fontWeight:500, lineHeight:1.3 }}>{description}</span>
              </span>
            </span>
            <span style={{ flexShrink:0, padding:'3px 7px', borderRadius:999, border:`1px solid ${T.line}`, background:T.fill, color:T.inkSoft, fontSize:9.5, fontWeight:750 }}>{entries.length} options</span>
          </div>
          <div role="list" aria-label={`${title} definitions`}>
            {entries.map((entry, index) => (
              <div role="listitem" key={entry.code} style={{ display:'grid', gridTemplateColumns:'126px minmax(0,1fr)', gap:12, alignItems:'start', padding:'10px 13px', background:index % 2 ? '#FBFCFE' : '#fff', borderBottom:index < entries.length - 1 ? `1px solid ${T.lineSoft}` : 'none' }}>
                <span style={{ width:'fit-content', maxWidth:'100%', minHeight:23, display:'inline-flex', alignItems:'center', padding:'3px 7px', borderRadius:6, border:`1px solid ${T.line}`, background:T.fill, color:T.primary, fontFamily:MONO, fontSize:9.5, fontWeight:800, lineHeight:1.35, overflowWrap:'anywhere' }}>{entry.code}</span>
                <span style={{ minWidth:0 }}>
                  <span style={{ display:'block', fontSize:11.75, fontWeight:750, lineHeight:1.3 }}>{entry.title}</span>
                  <span style={{ display:'block', marginTop:2, color:T.inkSoft, fontSize:10.75, lineHeight:1.4 }}>{entry.detail}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>, document.body
    )}
  </>);
}

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

function PolicyRowsTable({ type, codeNum, rows, setRows, cellErr = {}, editing = true, validationAttempt = 0 }) {
  const isDep = type === 'deposit', meta = POL_META[type];
  const dragI = useRRC(null);
  const cellRefs = useRRC({});
  const upd = (i, k, v) => setRows(rows.map((r, ri) => {
    if (ri !== i) return r;
    const n = { ...r, [k]:v };
    if (k === 'penaltyType' && (v === 'NONE' || v === 'FULL_DEPOSIT')) n.penaltyValue = '';
    return n;
  }));
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
    const order = isDep ? ['marketingName','beginDts','endDts','depositType','amount'] : ['beginDts','endDts','penaltyType','penaltyValue'];
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
  if (!rows.length) return (
    <div role="group" aria-label={`Empty ${meta.childWords.toLowerCase()} configuration`} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', border:`1px solid ${T.line}`, borderRadius:7, background:T.fill }}>
      <span aria-hidden="true" style={{ width:24, height:24, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0, borderRadius:6, border:`1px solid ${T.primaryLine}`, background:'#fff', color:T.primary, fontSize:14, fontWeight:600 }}>+</span>
      <div style={{ minWidth:0, flex:1 }}>
        <div style={{ color:T.ink, fontSize:11.5, fontWeight:700 }}>No {meta.childWords.toLowerCase()} configured</div>
        <div style={{ marginTop:1, color:T.inkSoft, fontSize:10.25, lineHeight:1.35 }}>Add the first row to define DTS and its {isDep ? 'deposit amount' : 'penalty'}.</div>
      </div>
    </div>
  );

  const dataHeader = isDep
    ? ['Line ID','Marketing Name','Begin DTS','End DTS','Type','Amount','Cancel Applies']
    : ['Band ID','Begin DTS','End DTS','Penalty Type','Penalty Value'];
  const dataWidths = isDep ? [76,210,94,94,170,130,120] : [76,108,108,230,150];
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
            <tr>{header.map((label, i) => (
                <th key={`${label}-${i}`} scope="col" aria-label={!label ? (i === 0 ? 'Reorder' : 'Remove') : undefined} style={thStyle}>
                  {label === 'Penalty Type' || (isDep && label === 'Type') ? <PolicyTypeHeader type={type}/> : (
                    <span>{label}</span>
                  )}
                </th>
            ))}</tr>
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
                      ? <td style={tdStyle}>{editing ? <Sel compact value={r.depositType} onChange={v => upd(i, 'depositType', v)} opts={ROW_DEP_TYPES} ariaLabel={`Deposit type for line ${i + 1}`}/> : depositTypeLabel(r.depositType)}</td>
                      : <td style={{ ...tdStyle, fontFamily:MONO }}>{editing ? <Sel compact value={r.penaltyType} onChange={v => upd(i, 'penaltyType', v)} opts={ROW_PEN_TYPES} ariaLabel={`Penalty type for band ${i + 1}`}/> : r.penaltyType}</td>}
                    {editing
                      ? fieldCell(i, isDep ? 'amount' : 'penaltyValue', (error, id) => <InlineRowInput
                          value={valDis ? '' : isDep ? r.amount : r.penaltyValue} disabled={valDis}
                          onChange={v => upd(i, isDep ? 'amount' : 'penaltyValue', v.replace(/[^0-9.]/g, ''))}
                          error={error} errorId={id} label={`${isDep ? 'Amount' : 'Penalty value'} for ${meta.childWord.toLowerCase()} ${i + 1}`}
                          suffix={isDep ? (r.depositType === 'PCT' ? '%' : '$') : r.penaltyType === 'PCT_CABIN_FARE' ? '%' : r.penaltyType === 'FIXED' ? '$' : '—'} inputMode="decimal"/>)
                      : <td style={{ ...tdStyle, fontWeight:650 }}>{isDep ? depAmountLabel(r) : penAmountLabel(r)}</td>}
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
      <div style={{ fontSize:11, marginTop:3 }}>Add the first {meta.childWord.toLowerCase()} to define its schedule and pricing.</div>
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
          ? [range, r.marketingName || 'Name required', chargeSummary]
          : [range, chargeSummary];
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
                    {editing ? <Sel compact value={r.depositType} onChange={v => upd(i, 'depositType', v)} opts={DEP_TYPES}/> : rcVal(depositTypeLabel(r.depositType))}
                  </RCField>
                  <RCField required label="Amount" err={cellErr[`${i}:amount`]}>
                    {editing ? rcIn(r.amount, v => upd(i, 'amount', v.replace(/[^0-9.]/g, '')), cellErr[`${i}:amount`], '', r.depositType === 'PCT' ? '%' : '$') : rcVal(depAmountLabel(r))}
                  </RCField>
                </RCGroup>
                <RCGroup divided label="Cancellation behavior" helper="Choose whether the deposit affects cancellation charges." columns={1}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
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
                <RCGroup divided label="Penalty amount" helper="Set the charge applied by this band." columns={1}>
                  <RCField label="Penalty value" err={cellErr[`${i}:penaltyValue`]}>
                    {editing
                      ? <div style={{ position:'relative' }}>
                          <input value={valDis ? '' : r.penaltyValue} disabled={valDis} onChange={e => upd(i, 'penaltyValue', e.target.value.replace(/[^0-9.]/g, ''))}
                            style={{ ...iS(cellErr[`${i}:penaltyValue`], valDis), padding:'7px 20px 7px 9px', fontSize:12.5 }}/>
                          <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', fontSize:11, color:T.inkFaint, pointerEvents:'none' }}>{r.penaltyType === 'PCT_CABIN_FARE' ? '%' : r.penaltyType === 'FIXED' ? '$' : '—'}</span>
                        </div>
                      : rcVal(penAmountLabel(r))}
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
