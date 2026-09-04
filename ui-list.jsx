// ui-list.jsx — the shared list-view kit.
//
// Single source of truth for every flat list screen in the product (Farecodes, Faretypes, and
// any module added later). Extracted from the Farecode list, which was the reference design.
//
// Owns: the toolbar (tabs + search + filter pills), the table (header, density, selection,
// sorting, row actions, empty state) and the pager. Modules supply data and cell renderers only,
// so row height and chrome can no longer drift between screens.
//
// Loaded after dc-shell.jsx (needs T, IcSearch, IcChevron, RowMenu) and before the modules.
// Module files are IIFE-wrapped and shadow `T` locally, but every chrome token used here is
// identical across those scopes, so rendering is stable wherever it's used.

const { useState: useSL, useRef: useRL, useEffect: useEL } = React;

/* ── Table metrics — the numbers that define "our table" ── */
const LIST_TH = {
  padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: T.inkLabel,
  textTransform: 'uppercase', letterSpacing: '.6px', whiteSpace: 'nowrap',
  background: '#F7F9FC', borderBottom: `1px solid ${T.line}`, userSelect: 'none',
};
const LIST_TD = { padding: '11px 14px', verticalAlign: 'middle' };
const LIST_SEL_BG = '#EFF6FF';
/* Row actions are capped at 20px so a kebab can never out-measure a status badge and
   inflate row height — the bug that made Faretype rows 8px taller than Farecode's. */
const LIST_ACTION_SIZE = 20;

/* ── Dropdown open/close-on-outside-click ── */
function useListDropdown() {
  const [open, setOpen] = useSL(false);
  const ref = useRL();
  useEL(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return [open, setOpen, ref];
}

/* ── Toolbar atoms ── */
function ListTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', gap:0, marginBottom:14, borderBottom:`1px solid ${T.line}` }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          style={{ background:'none', border:'none', padding:'0 20px 10px 0', fontSize:13.5, fontWeight:active===t.key?600:500, color:active===t.key?T.ink:T.inkFaint, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7, borderBottom:active===t.key?`2px solid ${T.primary}`:'2px solid transparent', marginBottom:-1, transition:'color .12s' }}>
          {t.label}
          <span style={{ fontSize:12, fontWeight:600, padding:'1px 7px', borderRadius:999, background:active===t.key?T.primaryBg:'transparent', color:active===t.key?T.primary:T.inkFaint }}>{t.count}</span>
        </button>
      ))}
    </div>
  );
}

function ListSearch({ value, onChange, placeholder }) {
  return (
    <div style={{ flex:'1 1 220px', display:'flex', alignItems:'center', gap:8, padding:'7px 12px', border:`1px solid ${T.line}`, borderRadius:8, background:T.panel }}>
      <span style={{ color:T.inkFaint, flexShrink:0, display:'flex' }}><IcSearch/></span>
      <input type="text" aria-label={placeholder || 'Search'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ border:'none', outline:'none', background:'transparent', fontSize:13, color:T.ink, width:'100%' }}/>
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange('')} style={{ background:'none', border:'none', cursor:'pointer', color:T.inkFaint, display:'flex', padding:0, flexShrink:0 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      )}
    </div>
  );
}

function FilterPill({ label, active, open, onClick }) {
  return (
    <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={onClick} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 11px', border:`1px solid ${active?T.primary:T.line}`, borderRadius:8, background:active?T.primaryBg:T.panel, fontSize:12.5, color:active?T.primary:T.ink, cursor:'pointer', whiteSpace:'nowrap', fontWeight:active?600:400, transition:'all .15s' }}>
      <span>{label}</span><IcChevron up={open}/>
    </button>
  );
}

const listPopover = { position:'absolute', top:'calc(100% + 4px)', right:0, background:T.panel, border:`1px solid ${T.line}`, borderRadius:9, boxShadow:'0 8px 28px rgba(15,23,42,.1)', zIndex:500, minWidth:190, overflow:'hidden' };

function listOptRow(selected) {
  return { padding:'9px 14px', fontSize:12.5, color:selected?T.primary:T.ink, fontWeight:selected?600:400, background:selected?T.primaryBg:'transparent', cursor:'pointer' };
}

/* Single-select filter. options[0] is treated as the "all" / cleared value. */
function SelectFilter({ value, onChange, options }) {
  const [open, setOpen, ref] = useListDropdown();
  return (
    <div ref={ref} style={{ position:'relative', flexShrink:0 }}>
      <FilterPill label={value} active={value !== options[0]} open={open} onClick={() => setOpen(p => !p)}/>
      {open && (
        <div role="listbox" aria-label={`${options[0]} options`} style={{ ...listPopover, padding:4 }}>
          {options.map(o => (
            <button key={o} type="button" role="option" aria-selected={value === o} onClick={() => { onChange(o); setOpen(false); }} style={{ ...listOptRow(value === o), width:'100%', border:'none', borderRadius:6, fontFamily:'inherit', textAlign:'left' }}
              onMouseEnter={e => { if (value !== o) e.currentTarget.style.background = T.fill; }}
              onMouseLeave={e => { if (value !== o) e.currentTarget.style.background = 'transparent'; }}>{o}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function ClearFilters({ onClick }) {
  return <button onClick={onClick} style={{ background:'none', border:'none', color:T.primary, fontSize:12.5, cursor:'pointer', padding:'7px 4px', fontWeight:500, whiteSpace:'nowrap', flexShrink:0 }}>Clear all</button>;
}

function ResultCount({ children }) {
  return <span style={{ fontSize:11, color:T.inkFaint, marginLeft:'auto', whiteSpace:'nowrap', flexShrink:0 }}>{children}</span>;
}

/* The grey toolbar band above the table. */
function ListToolbar({ children }) {
  return <div style={{ padding:'16px 20px 12px', borderBottom:`1px solid ${T.line}`, background:T.fill }}>{children}</div>;
}
function FilterRow({ children }) {
  return <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>{children}</div>;
}

/* The white rounded card that wraps toolbar + table + pager. */
function ListCard({ children }) {
  return <div style={{ background:T.panel, border:`1px solid ${T.line}`, borderRadius:10, overflow:'hidden', boxShadow:'0 1px 3px rgba(15,23,42,.04)' }}>{children}</div>;
}

/* Compact destructive action used in read-only panel headers. */
function DeleteIconButton({ onClick, label = 'Delete', title, disabled = false }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={title || label} disabled={disabled}
      style={{ width:32, height:32, padding:0, borderRadius:7, border:`1.5px solid ${disabled ? T.line : '#FCA5A5'}`, background:T.panel, color:disabled ? T.inkFaint : T.red, cursor:disabled ? 'not-allowed' : 'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'background .12s, border-color .12s, color .12s' }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = T.redLight; e.currentTarget.style.borderColor = '#F87171'; } }}
      onMouseLeave={e => { e.currentTarget.style.background = T.panel; e.currentTarget.style.borderColor = disabled ? T.line : '#FCA5A5'; }}>
      <IcTrash/>
    </button>
  );
}

/* Record-level modification metadata. The inline treatment belongs beneath a record's
   contextual summary; table columns use the compact date-only treatment because the
   column heading already supplies the label. Editors are optional because not every
   module persists one yet. */
function LastModifiedMeta({ date, editor, variant = 'inline', align = 'left', style }) {
  const cell = variant === 'cell';
  const shownDate = date || '—';
  const fullText = `Last modified ${shownDate}${editor ? ` · ${editor}` : ''}`;
  return (
    <span data-record-meta="last-modified" title={fullText}
      style={{
        display:'inline-flex', alignItems:'baseline', justifyContent:align === 'right' ? 'flex-end' : 'flex-start',
        gap:4, maxWidth:'100%', minWidth:0, flexWrap:cell ? 'nowrap' : 'wrap',
        color:T.inkFaint, fontSize:cell ? 12.5 : 10.5, lineHeight:cell ? 1.35 : 1.4,
        ...(style || {}),
      }}>
      {!cell && <span style={{ color:T.inkSoft, fontWeight:700, whiteSpace:'nowrap' }}>Last modified</span>}
      <span style={{ whiteSpace:'nowrap' }}>{shownDate}</span>
      {editor && (
        <>
          <span aria-hidden="true">·</span>
          <span style={{ minWidth:0, overflowWrap:'anywhere' }}>{editor}</span>
        </>
      )}
    </span>
  );
}

/* Shared identity header for read-only operational records. Feature modules retain their
   own drawer lifecycle and business actions; this component standardizes only hierarchy,
   facts, modification metadata, and tabs. */
function RecordDetailHeader({
  label, title, code, titleMono = false, statusNode, badges, facts = [], lastModified,
  actions, tabs = [], activeTab, onTabChange, onClose, closeLabel,
}) {
  const generatedId = React.useId().replace(/:/g, '');
  const titleId = `record-detail-title-${generatedId}`;
  const mono = "'SF Mono',Menlo,ui-monospace,monospace";
  return (
    <>
      <div style={{ height:52, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'0 22px', borderBottom:`1px solid ${T.line}`, flexShrink:0, background:T.panel }}>
        <span style={{ minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:14, fontWeight:700, color:T.ink }}>{label}</span>
        <button type="button" onClick={onClose} aria-label={closeLabel || `Close ${label}`}
          style={{ width:30, height:30, padding:0, borderRadius:7, border:'none', background:'transparent', color:T.inkFaint, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}
          onMouseEnter={event => { event.currentTarget.style.background = T.fill; event.currentTarget.style.color = T.ink; }}
          onMouseLeave={event => { event.currentTarget.style.background = 'transparent'; event.currentTarget.style.color = T.inkFaint; }}>
          <IcX size={14}/>
        </button>
      </div>

      <section aria-labelledby={titleId} style={{ padding:'14px 22px', background:T.panel, borderBottom:`1px solid ${T.line}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 480px', minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:9, minWidth:0, flexWrap:'wrap' }}>
              <h2 id={titleId} style={{ margin:0, color:T.ink, fontSize:18, fontWeight:750, lineHeight:1.25, letterSpacing:'-.15px', fontFamily:titleMono ? mono : 'inherit', overflowWrap:'anywhere' }}>{title}</h2>
              {code && code !== title && <span style={{ color:T.inkSoft, fontFamily:mono, fontSize:11.5, fontWeight:750, whiteSpace:'nowrap' }}>{code}</span>}
              {statusNode}
              {badges}
            </div>
          </div>
          {actions && <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', justifyContent:'flex-end', gap:8, flexShrink:0, flexWrap:'wrap' }}>{actions}</div>}
        </div>

        {facts.length > 0 && (
          <dl style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(128px, 1fr))', gap:1, margin:'12px 0 0', padding:1, borderRadius:8, overflow:'hidden', background:T.line }}>
            {facts.map((fact, index) => (
              <div key={fact.key || fact.label || index} style={{ minWidth:0, padding:'8px 10px', background:T.fill }}>
                <dt style={{ color:T.inkLabel, fontSize:9, fontWeight:800, letterSpacing:'.65px', lineHeight:1.2, textTransform:'uppercase' }}>{fact.label}</dt>
                <dd title={typeof fact.value === 'string' ? fact.value : undefined} style={{ margin:'4px 0 0', color:fact.color || T.ink, fontSize:11.5, fontWeight:650, lineHeight:1.3, fontFamily:fact.mono ? mono : 'inherit', overflowWrap:'anywhere' }}>{fact.value ?? '—'}</dd>
                {fact.hint && <div title={typeof fact.hint === 'string' ? fact.hint : undefined} style={{ marginTop:2, color:T.inkSoft, fontSize:10, fontWeight:500, lineHeight:1.3, fontFamily:fact.hintMono ? mono : 'inherit', overflowWrap:'anywhere' }}>{fact.hint}</div>}
              </div>
            ))}
          </dl>
        )}

        {lastModified?.date && (
          <LastModifiedMeta date={lastModified.date} editor={lastModified.editor} style={{ marginTop:7 }}/>
        )}
      </section>

      {tabs.length > 0 && (
        <div role="tablist" aria-label={`${label} sections`} className="hscroll" style={{ display:'flex', padding:'0 22px', overflowX:'auto', background:T.panel, borderBottom:`1px solid ${T.line}`, flexShrink:0 }}>
          {tabs.filter(tab => !tab.hidden).map(tab => (
            <button key={tab.key} type="button" role="tab" aria-selected={activeTab === tab.key} onClick={() => onTabChange(tab.key)}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'11px 16px 9px', border:'none', borderBottom:activeTab === tab.key ? `2px solid ${T.primary}` : '2px solid transparent', background:'transparent', color:activeTab === tab.key ? T.ink : T.inkSoft, fontSize:13, fontWeight:activeTab === tab.key ? 650 : 500, cursor:'pointer', whiteSpace:'nowrap' }}>
              {tab.label}
              {tab.count !== undefined && <span style={{ padding:'1px 7px', borderRadius:999, background:activeTab === tab.key ? T.primaryBg : T.fill, color:activeTab === tab.key ? T.primary : T.inkFaint, fontSize:11, fontWeight:650 }}>{tab.count}</span>}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* ── The table ──
   cols:  [{ key, label, sort, width }]
   cell:  (row, key) => node — module-owned cell content
   rowActions: (row) => RowMenu items[] | null  */
function DataTable({
  cols, rows, rowKey = r => r.id, cell,
  selected, onToggleRow, onToggleAll,
  sortCol, sortDir, onSort, onRowClick, rowActions,
  emptyTitle = 'No results', emptySub = 'Try adjusting your search or filters.',
  minWidth = 900,
}) {
  const selectable = !!selected;
  const hasActions = !!rowActions;
  const allChk = selectable && rows.length > 0 && rows.every(r => selected.has(rowKey(r)));
  const someChk = selectable && rows.some(r => selected.has(rowKey(r)));
  const span = cols.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0);

  return (
    <div className="hscroll" style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth }}>
        <thead>
          <tr>
            {selectable && (
              <th style={{ ...LIST_TH, width:44, textAlign:'center', padding:'10px 0' }}>
                <input type="checkbox" aria-label="Select all rows" checked={allChk}
                  ref={el => { if (el) el.indeterminate = someChk && !allChk; }}
                  onChange={() => onToggleAll(rows)}
                  style={{ width:14, height:14, accentColor:T.primary, cursor:'pointer' }}/>
              </th>
            )}
            {cols.map(col => (
              <th key={col.key} aria-sort={col.sort && sortCol===col.key ? (sortDir==='asc'?'ascending':'descending') : undefined} tabIndex={col.sort ? 0 : undefined} style={{ ...LIST_TH, width:col.width, cursor:col.sort?'pointer':'default' }}
                onClick={col.sort ? () => onSort(col.key) : undefined}
                onKeyDown={col.sort ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSort(col.key); } } : undefined}>
                {col.label}
                {col.sort && <span style={{ marginLeft:3, opacity:sortCol===col.key?1:.28, fontSize:10 }}>{sortCol===col.key?(sortDir==='asc'?'↑':'↓'):'↕'}</span>}
              </th>
            ))}
            {hasActions && <th style={{ ...LIST_TH, width:44 }}></th>}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={span} style={{ padding:'72px 20px', textAlign:'center' }}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="1.4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <div style={{ fontSize:15, fontWeight:600, color:T.inkSoft }}>{emptyTitle}</div>
                <div style={{ fontSize:13, color:T.inkFaint }}>{emptySub}</div>
              </div>
            </td></tr>
          ) : rows.map(row => {
            const k = rowKey(row);
            const sel = selectable && selected.has(k);
            return (
              <tr key={k} tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRowClick(row); } } : undefined}
                style={{ background:sel?LIST_SEL_BG:T.panel, borderBottom:`1px solid ${T.lineSoft}`, cursor:onRowClick?'pointer':'default', transition:'background .08s' }}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = T.fill; }}
                onMouseLeave={e => { e.currentTarget.style.background = sel?LIST_SEL_BG:T.panel; }}>
                {selectable && (
                  <td style={{ ...LIST_TD, width:44, textAlign:'center' }} onClick={e => e.stopPropagation()}>
                    <input type="checkbox" aria-label={`Select row ${k}`} checked={sel} onChange={() => onToggleRow(k)} style={{ width:14, height:14, accentColor:T.primary, cursor:'pointer' }}/>
                  </td>
                )}
                {cols.map(col => <td key={col.key} style={LIST_TD}>{cell(row, col.key)}</td>)}
                {hasActions && (
                  <td style={{ ...LIST_TD, width:44 }} onClick={e => e.stopPropagation()}>
                    <RowMenu size={LIST_ACTION_SIZE} items={rowActions(row)}/>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ── Pager ── */
function ListPager({ page, setPage, total, pageSize, noun = 'results' }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const btn = extra => ({ width:32, height:32, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${T.line}`, background:T.panel, fontSize:13, ...extra });
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderTop:`1px solid ${T.line}`, background:T.fill }}>
      <span style={{ fontSize:12.5, color:T.inkSoft }}>
        {total === 0 ? 'No results' : `Showing ${(page-1)*pageSize+1}–${Math.min(page*pageSize, total)} of ${total} ${noun}`}
      </span>
      {totalPages > 1 && (
        <div style={{ display:'flex', gap:4, alignItems:'center' }}>
          <button type="button" aria-label="Previous page" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}
            style={btn({ color:page===1?T.inkFaint:T.ink, cursor:page===1?'default':'pointer' })}>‹</button>
          {Array.from({ length:totalPages }, (_,i) => i+1).map(p => (
            <button key={p} type="button" aria-label={`Page ${p}`} aria-current={p===page ? 'page' : undefined} onClick={() => setPage(p)}
              style={btn({ border:`1px solid ${p===page?T.primary:T.line}`, background:p===page?T.primary:T.panel, color:p===page?'#fff':T.ink, cursor:'pointer', fontWeight:p===page?700:400, transition:'all .12s' })}>{p}</button>
          ))}
          <button type="button" aria-label="Next page" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages}
            style={btn({ color:page===totalPages?T.inkFaint:T.ink, cursor:page===totalPages?'default':'pointer' })}>›</button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  LIST_TH, LIST_TD, LIST_SEL_BG, LIST_ACTION_SIZE,
  useListDropdown, ListTabs, ListSearch, FilterPill, listPopover, listOptRow,
  SelectFilter, ClearFilters, ResultCount, ListToolbar, FilterRow, ListCard,
  DeleteIconButton, LastModifiedMeta, RecordDetailHeader, DataTable, ListPager,
});
