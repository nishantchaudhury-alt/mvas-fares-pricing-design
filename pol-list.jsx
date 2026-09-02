// pol-list.jsx — unified Policies list (Group → Parent → Child tree) + guided creation flow (1.1–1.6).
const { useState: useSPL, useRef: useRPL, useMemo: useMPL } = React;

const TODAY = '18 Jun 2026';
const ME = 'jane.doe@mvas.com';
const codeNumOf = code => String(code).replace(/^[A-Z]+-/, '');
const nextGroupCode = (list, type) => `${POL_META[type].groupPrefix}-${String(list.filter(g => g.type === type).length + 1).padStart(2, '0')}`;
function nextParentCode(list, type) {
  const nums = list.filter(g => g.type === type).flatMap(g => g.parents.map(p => Number(codeNumOf(p.code)) || 0));
  const next = (nums.length ? Math.max(...nums) : type === 'deposit' ? 500 : 10) + 1;
  return type === 'deposit' ? `DEP-${next}` : `CANC-${String(next).padStart(3, '0')}`;
}
const blankForm = () => ({ name:'', active:true, isDefault:false, refundable:true });
const gFormOf = g => ({ name:g.name, active:g.status === 'Active', isDefault:!!g.isDefault, refundable:g.isRefundable !== false });
const pFormOf = p => ({ name:p.name, active:p.status === 'Active', isDefault:!!p.isDefault, refundable:p.isRefundable !== false });
const makePolicyDraft = ({ parentCode, parentId=null, pForm=null, rows=[] }) => ({
  key:parentId || `draft-${parentCode}`,
  parentId,
  parentCode,
  pForm:pForm || blankForm(),
  rows:rows.slice(),
  issues:[],
  validationAttempt:0,
  err:null,
});
const flowPolicyDrafts = f => f.policyDrafts || [makePolicyDraft({
  parentCode:f.parentCode,
  parentId:f.parentId || null,
  pForm:f.pForm,
  rows:f.rows || [],
})];
const activeFlowPolicy = f => flowPolicyDrafts(f)[Math.min(f.activePolicyIndex || 0, flowPolicyDrafts(f).length - 1)];

function PoliciesList({ policies, setPolicies, onNav }) {
  const [q, setQ] = useSPL('');
  const [typeF, setTypeF] = useSPL('cancel');
  const [page, setPage] = useSPL(1);
  const [exp, setExp] = useSPL(() => new Set(['g1', 'p1']));
  const [sel, setSel] = useSPL(() => new Set());
  const [edit, setEdit] = useSPL(null);
  const [flow, setFlow] = useSPL(null);
  const [dlg, setDlg] = useSPL(null);
  const [detail, setDetail] = useSPL(null);
  const [chooser, setChooser] = useSPL(false);
  const uid = useRPL(900);
  const PAGE = 10;

  const isOpen = id => exp.has(id);
  const toggle = id => setExp(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const openIds = (...ids) => setExp(p => new Set([...p, ...ids]));
  const patchPolicies = fn => setPolicies(fn(policies));

  /* ── filtering / search ── */
  const term = q.trim().toLowerCase();
  const tablePolicies = policies.filter(g => g.status === 'Active');
  const tableParents = g => g.parents.filter(p => p.status === 'Active');
  const hits = g => {
    if (!term) return true;
    if (`${g.code} ${g.name}`.toLowerCase().includes(term)) return true;
    return tableParents(g).some(p => `${p.code} ${p.name}`.toLowerCase().includes(term)
      || kidsOf(p).some((r, i) => `${childCode(p.code, i)} ${childSummary(g.type, r)}`.toLowerCase().includes(term)));
  };
  const rows = tablePolicies.filter(g => {
    if (typeF !== 'all' && g.type !== typeF) return false;
    return hits(g);
  });
  const searchOpen = useMPL(() => {
    if (!term) return null;
    const s = new Set();
    rows.forEach(g => { s.add(g.id); tableParents(g).forEach(p => s.add(p.id)); });
    return s;
  }, [term, rows.length, policies]);
  const shown = id => searchOpen ? searchOpen.has(id) : isOpen(id);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE));
  const pageRows = rows.slice((page - 1) * PAGE, page * PAGE);
  const expandedCount = tablePolicies.filter(g => shown(g.id)).length;

  /* ── coverage ── */
  const coverOk = (type, kids) => kids.length > 0 && validateRows(kids).issues.length === 0;
  const activeDepParents = policies.filter(g => g.type === 'deposit' && g.status === 'Active').flatMap(g => g.parents.filter(p => p.status === 'Active'));
  const parentActivatable = (type, form, kids) => kids.length > 0 && validateRows(kids).issues.length === 0
    && (type !== 'cancel' || refundabilityIssues(kids, form ? form.refundable : true).length === 0);

  /* ── guided flow ── */
  const beginFlow = type => {
    setEdit(null); setChooser(false);
    const parentCode = nextParentCode(policies, type);
    setFlow({ type, entry:'new', step:1, groupId:null, groupCode:nextGroupCode(policies, type),
      gForm:blankForm(), policyDrafts:[makePolicyDraft({ parentCode })], activePolicyIndex:0 });
  };
  const addPolicyTo = g => {
    setEdit(null); openIds(g.id);
    const parentCode = nextParentCode(policies, g.type);
    setFlow({ type:g.type, entry:'addPolicy', step:2, groupId:g.id, groupCode:g.code,
      gForm:gFormOf(g), policyDrafts:[makePolicyDraft({ parentCode, pForm:{ ...blankForm(), refundable:g.isRefundable !== false } })], activePolicyIndex:0 });
  };
  const finishSetup = (g, p) => {
    setEdit(null); openIds(g.id, p?.id);
    const resumable = p
      ? [p, ...g.parents.filter(parent => parent.id !== p.id && parent.status === 'Draft')]
      : g.status === 'Draft' ? g.parents : g.parents.filter(parent => parent.status === 'Draft');
    const drafts = resumable.length
      ? resumable.map(parent => makePolicyDraft({ parentCode:parent.code, parentId:parent.id, pForm:pFormOf(parent), rows:kidsOf(parent) }))
      : [makePolicyDraft({ parentCode:nextParentCode(policies, g.type), pForm:{ ...blankForm(), refundable:g.isRefundable !== false } })];
    setFlow({ type:g.type, entry:'resume', step:2, groupId:g.id, groupCode:g.code,
      gForm:gFormOf(g), policyDrafts:drafts, activePolicyIndex:0 });
  };
  const flowDirty = f => f.entry === 'resume' || f.gForm.name || flowPolicyDrafts(f).some(d => d.pForm.name || d.rows.length > 0);
  const askCancelFlow = () => flow && flowDirty(flow) ? setDlg({ type:'discardFlow' }) : setFlow(null);

  const commitFlow = status => {
    const f = flow, meta = POL_META[f.type], key = meta.childKey;
    const existingG = policies.find(g => g.id === f.groupId) || null;
    const gid = f.groupId || `g${++uid.current}`;
    const drafts = flowPolicyDrafts(f);
    const builtParents = drafts.map(d => {
      const existingP = existingG ? existingG.parents.find(p => p.id === d.parentId) : null;
      const pid = d.parentId || `p${++uid.current}`;
      return {
        id:pid, code:d.parentCode, name:d.pForm.name.trim() || 'Untitled policy',
        status, isDefault:d.pForm.isDefault, usedIn:existingP?.usedIn || 0, mod:TODAY, created:existingP?.created || TODAY, editor:ME,
        [key]:d.rows, usedInFaretypes:existingP?.usedInFaretypes || [], usedInFarecodes:existingP?.usedInFarecodes || [],
        ...(f.type === 'cancel' ? { isRefundable:f.gForm.refundable !== false } : {}),
      };
    });
    const defaultParent = builtParents.find(p => p.isDefault);
    let parents = existingG ? existingG.parents.slice() : [];
    builtParents.forEach(parent => {
      const at = parents.findIndex(p => p.id === parent.id);
      at >= 0 ? parents.splice(at, 1, parent) : parents.push(parent);
    });
    if (defaultParent) parents = parents.map(p => ({ ...p, isDefault:p.id === defaultParent.id }));
    const groupStatus = f.entry === 'addPolicy' ? (existingG.status === 'Draft' ? status : existingG.status) : status;
    const group = {
      id:gid, type:f.type, code:f.groupCode, name:f.gForm.name.trim() || 'Untitled group',
      status:groupStatus, isDefault:f.gForm.isDefault, mod:TODAY, created:existingG?.created || TODAY, editor:ME,
      parents,
      ...(f.type === 'cancel' ? { isRefundable:f.gForm.refundable } : {}),
    };
    let next = existingG ? policies.map(g => g.id === gid ? group : g) : [group, ...policies];
    if (f.gForm.isDefault) next = next.map(g => g.type === f.type && g.id !== gid ? { ...g, isDefault:false } : g);
    setPolicies(next);
    openIds(gid, ...builtParents.map(p => p.id));
    setFlow(null);
    const rowCount = drafts.reduce((sum, d) => sum + d.rows.length, 0);
    setDlg({ type:'toast', text:`${group.name} saved as ${status} with ${builtParents.length} ${builtParents.length === 1 ? 'policy' : 'policies'} and ${rowCount} ${rowCount === 1 ? meta.childWord.toLowerCase() : meta.childWords.toLowerCase()}.` });
  };
  const tryActivateFlow = () => {
    const drafts = flowPolicyDrafts(flow);
    const issueSets = drafts.map(d => chainIssues({ type:flow.type, policies, groupId:flow.groupId, groupName:flow.gForm.name,
      parentName:d.pForm.name, rows:d.rows, isRefundable:flow.gForm.refundable !== false }));
    const firstInvalid = issueSets.findIndex(items => items.length > 0);
    if (firstInvalid >= 0) {
      const allIssues = issueSets.flat();
      const groupInvalid = !flow.gForm.name.trim() || allIssues.some(it => it.text.startsWith('Another active'));
      setFlow(f => ({
        ...f,
        step:groupInvalid ? 1 : 2,
        activePolicyIndex:groupInvalid ? f.activePolicyIndex : firstInvalid,
        err:groupInvalid ? { name:'Group name is required and must be unique' } : null,
        policyDrafts:flowPolicyDrafts(f).map((d, i) => ({
          ...d,
          err:{ name:issueSets[i].some(it => it.text === 'Policy name is required.') ? 'Policy name is required' : null },
          issues:issueSets[i],
          validationAttempt:issueSets[i].length ? (d.validationAttempt || 0) + 1 : d.validationAttempt || 0,
        })),
      }));
      return;
    }
    commitFlow('Active');
  };

  /* ── inline edit (outside the flow) ── */
  const editGroup = g => { setFlow(null); openIds(g.id); setEdit({ level:'group', groupId:g.id, form:gFormOf(g), init:gFormOf(g) }); };
  const editParent = (g, p, addRow) => {
    setFlow(null); openIds(g.id, p.id);
    const kids = kidsOf(p).slice();
    const form = { ...pFormOf(p), ...(g.type === 'cancel' ? { refundable:g.isRefundable !== false } : {}) };
    setEdit({ level:'parent', groupId:g.id, parentId:p.id, form, init:form, rows:addRow ? [...kids, blankChild(g.type)] : kids, initRows:kidsOf(p), issues:[], validationAttempt:0 });
  };
  const editDirty = e => JSON.stringify(e.form) !== JSON.stringify(e.init) || (e.rows && JSON.stringify(e.rows) !== JSON.stringify(e.initRows));
  const askCancelEdit = () => edit && editDirty(edit) ? setDlg({ type:'discardEdit' }) : setEdit(null);

  const saveGroupEdit = () => {
    const e = edit, g = policies.find(x => x.id === e.groupId);
    if (!e.form.name.trim()) { setEdit({ ...e, err:{ name:'Group name is required' } }); return; }
    if (policies.some(x => x.type === g.type && x.id !== g.id && x.status === 'Active' && x.name.trim().toLowerCase() === e.form.name.trim().toLowerCase())) {
      setEdit({ ...e, err:{ name:`An active ${POL_META[g.type].label.toLowerCase()} group with this name already exists.` } });
      return;
    }
    const inheritedTermIssues = g.type === 'cancel'
      ? g.parents.flatMap(p => refundabilityIssues(kidsOf(p), e.form.refundable !== false).map(issue => ({ ...issue, text:`${p.code}: ${issue.text}` })))
      : [];
    if (inheritedTermIssues.length) { setEdit({ ...e, issues:inheritedTermIssues }); return; }
    let next = policies.map(x => x.id === g.id ? {
      ...x, name:e.form.name.trim(), status:e.form.active ? 'Active' : g.status === 'Draft' ? 'Draft' : 'Inactive', isDefault:e.form.isDefault, mod:TODAY,
      ...(g.type === 'cancel' ? { isRefundable:e.form.refundable, parents:x.parents.map(p => ({ ...p, isRefundable:e.form.refundable })) } : {}),
    } : x);
    if (e.form.isDefault) next = next.map(x => x.type === g.type && x.id !== g.id ? { ...x, isDefault:false } : x);
    setPolicies(next); setEdit(null);
  };
  const saveParentEdit = () => {
    const e = edit, g = policies.find(x => x.id === e.groupId), p = g.parents.find(x => x.id === e.parentId);
    if (!e.form.name.trim()) { setEdit({ ...e, err:{ name:'Policy name is required' } }); return; }
    if (e.form.active) {
      const issues = chainIssues({ type:g.type, policies, groupId:g.id, groupName:g.name, parentName:e.form.name, rows:e.rows, isRefundable:g.isRefundable !== false });
      if (issues.length) { setEdit({ ...e, issues, validationAttempt:(e.validationAttempt || 0) + 1 }); return; }
    }
    const key = POL_META[g.type].childKey;
    setPolicies(policies.map(x => x.id !== g.id ? x : {
      ...x, mod:TODAY,
      parents:x.parents.map(y => y.id !== p.id
        ? (e.form.isDefault ? { ...y, isDefault:false } : y)
        : { ...y, name:e.form.name.trim(), status:e.form.active ? 'Active' : p.status === 'Draft' ? 'Draft' : 'Inactive', isDefault:e.form.isDefault, mod:TODAY, [key]:e.rows, ...(g.type === 'cancel' ? { isRefundable:g.isRefundable !== false } : {}) }),
    }));
    setEdit(null);
  };

  /* ── delete ops ── */
  const doDeleteGroup = g => { setPolicies(policies.filter(x => x.id !== g.id)); setDlg(null); setEdit(null); setDetail(null); };
  const doDeleteParent = (g, p) => { setPolicies(policies.map(x => x.id !== g.id ? x : { ...x, parents:x.parents.filter(y => y.id !== p.id) })); setDlg(null); setEdit(null); setDetail(d => d && d.parentId === p.id ? { groupId:g.id } : d); };

  /* ── cells ──
     Row heights are tiered by level (Group > Policy > Line) but each tier is as tight as its
     content allows — this replaced a flat 14px/11px/9px scheme that ran 66/58/37px per row. */
  const TH = { padding:'9px 14px', textAlign:'left', fontSize:10.5, fontWeight:600, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap', background:'#F7F9FC', borderBottom:`1px solid ${T.line}` };
  const TD = { padding:'8px 14px', verticalAlign:'middle', fontSize:13 };
  const codeStyle = { fontFamily:MONO, fontSize:11.5, fontWeight:700, color:T.primary, whiteSpace:'nowrap' };
  const metaLine = { fontSize:11.5, lineHeight:1.3, color:T.inkFaint, marginTop:1, display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' };
  const editorCell = editor => <span style={{ fontSize:12.5, color:T.inkSoft, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block', maxWidth:'100%' }}>{editor}</span>;
  const cbx = (id, on) => <input type="checkbox" checked={on} onChange={e => { e.stopPropagation(); setSel(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }} style={{ accentColor:T.primary, width:13, height:13, cursor:'pointer' }}/>;

  const formRow = (key, content) => <tr key={key}><td colSpan={7} style={{ padding:0, background:'#fff', borderBottom:`1px solid ${T.line}` }}>{content}</td></tr>;

  /* ── tree rows ── */
  const dtsChip = txt => <span style={{ fontFamily:MONO, fontSize:10.5, fontWeight:700, color:T.inkSoft, background:'#fff', border:`1px solid ${T.line}`, padding:'2px 6px', borderRadius:4, whiteSpace:'nowrap' }}>{txt}</span>;
  const kidSummary = (type, r) => {
    const parts = childSummary(type, r).split(' · ');
    return (
      <span style={{ display:'flex', alignItems:'center', gap:9, flexWrap:'wrap' }}>
        {parts.map((s, i) => s.startsWith('DTS ')
          ? <React.Fragment key={i}>{dtsChip(s)}</React.Fragment>
          : <span key={i} style={{ fontSize:12.5, color:i === 0 ? T.ink : T.inkSoft, fontWeight:i === 0 ? 600 : 400 }}>{s}</span>)}
      </span>
    );
  };

  const treeRows = () => {
    const out = [];
    pageRows.forEach(g => {
      const meta = POL_META[g.type], open = shown(g.id);
      const parents = tableParents(g);
      const accent = g.type === 'deposit' ? T.teal : T.amber;
      const accentTd = open ? { boxShadow:`inset 3px 0 0 ${accent}` } : null;
      out.push(
        <tr key={g.id} onClick={() => setDetail({ groupId:g.id })} style={{ background:'#fff', borderBottom:open ? 'none' : `1px solid ${T.line}`, cursor:'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#F9FBFD'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
          <td style={{ ...TD, ...accentTd, padding:`9px 14px 9px ${TREE.pad[0]}px` }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <Caret open={open} onClick={() => toggle(g.id)} label={g.code}/><CodeChip level="group">{g.code}</CodeChip>
            </div>
          </td>
          <td style={{ ...TD, padding:'9px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontWeight:650, fontSize:14, lineHeight:1.2, letterSpacing:'-.1px' }}>{g.name}</span>
            </div>
            <div style={metaLine}>
              <span>{parents.length} {parents.length === 1 ? 'policy' : 'policies'} · {parents.filter(p => p.status === 'Active').length} active</span>
              {g.type === 'cancel' && <span style={{ color:g.isRefundable === false ? '#B45309' : T.inkFaint }}>· {g.isRefundable === false ? 'Non-refundable' : 'Refundable'}</span>}
            </div>
          </td>
          <td style={{ ...TD, padding:'9px 14px' }}><PolStatusBadge status={g.status}/></td>
          <td style={{ ...TD, padding:'9px 14px' }}>{editorCell(g.editor)}</td>
          <td style={{ ...TD, padding:'9px 14px', color:T.inkSoft, fontSize:12.5, whiteSpace:'nowrap' }}>{g.mod}</td>
          <td style={{ ...TD, padding:'9px 14px', color:T.inkSoft, fontSize:12.5, whiteSpace:'nowrap' }}>{g.created}</td>
          <td style={{ ...TD, width:44, padding:'6px 8px', textAlign:'right' }} onClick={e => e.stopPropagation()}>
            <RowMenu size={20} items={[{
              label:'Delete group', icon:<IcTrash size={13}/>, danger:true,
              disabled:usedInGroup(g) > 0,
              title:usedInGroup(g) > 0 ? 'In use by Faretypes/Farecodes.' : undefined,
              onClick:() => setDlg({ type:'confirmDeleteGroup', group:g }),
            }]}/>
          </td>
        </tr>
      );
      if (!open) return;
      parents.forEach((p, pi) => {
        const kids = kidsOf(p), pOpen = shown(p.id);
        const ok = coverOk(g.type, kids), lastP = pi === parents.length - 1;
        const closesBlock = lastP && (!pOpen || kids.length === 0);
        out.push(
          <tr key={p.id} onClick={() => setDetail({ groupId:g.id, parentId:p.id })} style={{ background:'#F7F9FC', borderBottom:`1px solid ${closesBlock ? T.line : T.lineSoft}`, cursor:'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = '#F1F5F9'} onMouseLeave={e => e.currentTarget.style.background = '#F7F9FC'}>
            <td style={{ ...TD, position:'relative', padding:`7px 14px 7px ${TREE.pad[1]}px` }}>
              <Rails marks={[{ x:TREE.caret[0], kind:lastP ? 'end' : 'tee', w:TREE.pad[1] - TREE.caret[0] - 5 }]}/>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Caret open={pOpen} onClick={() => toggle(p.id)} hidden={kids.length === 0} label={p.code}/><CodeChip level="policy">{p.code}</CodeChip>
              </div>
            </td>
            <td style={{ ...TD, padding:'7px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontWeight:600, fontSize:12.5, lineHeight:1.2 }}>{p.name}</span>
              </div>
              <div style={metaLine}>
                <span>{kids.length} {kids.length === 1 ? meta.childWord.toLowerCase() : meta.childWords.toLowerCase()}</span>
                <CoverPill ok={ok} label={kids.length === 0 ? 'None configured' : ok ? 'Coverage complete' : 'Window/coverage gaps'}/>
              </div>
            </td>
            <td style={{ ...TD, padding:'7px 14px' }}><PolStatusBadge status={p.status}/></td>
            <td style={{ ...TD, padding:'7px 14px' }}>{editorCell(p.editor)}</td>
            <td style={{ ...TD, padding:'7px 14px', color:T.inkSoft, fontSize:12.5, whiteSpace:'nowrap' }}>{p.mod}</td>
            <td style={{ ...TD, padding:'7px 14px', color:T.inkSoft, fontSize:12.5, whiteSpace:'nowrap' }}>{p.created}</td>
            <td style={{ ...TD, width:44, padding:'5px 8px', textAlign:'right' }} onClick={e => e.stopPropagation()}>
              <RowMenu size={20} items={[{
                label:'Delete policy', icon:<IcTrash size={13}/>, danger:true,
                disabled:p.usedIn > 0,
                title:p.usedIn > 0 ? 'In use by Faretypes/Farecodes.' : undefined,
                onClick:() => setDlg({ type:'confirmDeleteParent', group:g, parent:p }),
              }]}/>
            </td>
          </tr>
        );
        if (!pOpen) return;
        kids.forEach((r, i) => {
          const lastK = i === kids.length - 1;
          return out.push(
            <tr key={`${p.id}-${i}`} onClick={() => setDetail({ groupId:g.id, parentId:p.id, tab:'children' })}
              style={{ background:'#fff', borderBottom:`1px solid ${lastP && lastK ? T.line : '#F4F7FA'}`, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#FAFCFE'} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              <td style={{ ...TD, position:'relative', padding:`6px 14px 6px ${TREE.pad[2]}px` }}>
                <Rails marks={[
                  { x:TREE.caret[0], kind:lastP ? 'empty' : 'line' },
                  { x:TREE.caret[1], kind:lastK ? 'end' : 'tee', w:TREE.pad[2] - TREE.caret[1] - 4 },
                ]}/>
                <CodeChip level="line">{childCode(p.code, i)}</CodeChip>
              </td>
              <td style={{ ...TD, padding:'6px 14px' }}>{kidSummary(g.type, r)}</td>
              <td colSpan={5} style={{ ...TD, padding:'6px 14px' }}></td>
            </tr>
          );
        });
      });
    });
    return out;
  };

  return (
    <div className="pscroll" style={{ gridColumn:2, gridRow:2, overflow:'auto', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'16px 28px 20px', flexShrink:0 }}>
        <div style={{ fontSize:11.5, color:T.inkFaint, marginBottom:8, fontWeight:500, letterSpacing:'.3px' }}>FARES &amp; PRICING <span style={{ margin:'0 5px' }}>›</span> <span style={{ color:T.inkSoft }}>POLICIES</span></div>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700, lineHeight:1, margin:'0 0 5px' }}>Policies</h1>
            <div style={{ fontSize:13, color:T.inkSoft, maxWidth:760 }}>Define cancellation and deposit policies that govern booking terms and refund amounts.</div>
          </div>
          <div style={{ position:'relative', flexShrink:0 }}>
            <button type="button" aria-haspopup="menu" aria-expanded={chooser} onClick={() => setChooser(c => !c)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 16px', background:T.primary, color:'#fff', border:'none', borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 2px 6px rgba(27,36,52,.2)' }}>+ New Policy</button>
            {chooser && (
              <>
                <div aria-hidden="true" onClick={() => setChooser(false)} style={{ position:'fixed', inset:0, zIndex:300 }}/>
                <div role="menu" aria-label="Choose policy type" style={{ position:'absolute', right:0, top:'calc(100% + 6px)', width:280, background:'#fff', border:`1px solid ${T.line}`, borderRadius:10, boxShadow:'0 12px 32px rgba(15,23,42,.14)', zIndex:400, overflow:'hidden' }}>
                  <div style={{ padding:'9px 14px', fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px', background:T.fill, borderBottom:`1px solid ${T.lineSoft}` }}>Choose a type</div>
                  {['cancel', 'deposit'].map(t => (
                    <button key={t} type="button" role="menuitem" onClick={() => beginFlow(t)} style={{ width:'100%', padding:'12px 14px', border:'none', background:'#fff', fontFamily:'inherit', textAlign:'left', cursor:'pointer', borderBottom:t === 'cancel' ? `1px solid ${T.lineSoft}` : 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.fill} onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                      <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>{t === 'deposit' ? 'Deposit Policy' : 'Cancellation Policy'}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ flex:1, padding:'0 28px 28px' }}>
        <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius:10, overflow:'visible', boxShadow:'0 1px 3px rgba(15,23,42,.04)' }}>
          <div style={{ padding:'16px 20px 12px', borderBottom:`1px solid ${T.line}`, background:T.fill, borderRadius:'10px 10px 0 0' }}>
            <div style={{ display:'flex', gap:6, marginBottom:14, padding:4, background:'#fff', border:`1px solid ${T.line}`, borderRadius:9, width:'fit-content' }}>
              {['cancel', 'deposit'].map(t => (
                <button key={t} onClick={() => { setTypeF(t); setPage(1); }}
                  style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'7px 16px', borderRadius:6, border:'none', fontSize:12.5, fontWeight:600, cursor:'pointer', background:typeF === t ? T.primary : 'transparent', color:typeF === t ? '#fff' : T.inkSoft }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:typeF === t ? '#fff' : POL_META[t].badgeColor, opacity:typeF === t ? .9 : 1 }}/>
                  {POL_META[t].label} Policies
                  <span style={{ fontSize:11, fontWeight:700, padding:'1px 6px', borderRadius:999, background:typeF === t ? 'rgba(255,255,255,.2)' : T.fill, color:typeF === t ? '#fff' : T.inkFaint }}>{tablePolicies.filter(g => g.type === t).length}</span>
                </button>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <div style={{ flex:'1 1 260px', maxWidth:420, display:'flex', alignItems:'center', gap:8, padding:'7px 12px', border:`1px solid ${T.line}`, borderRadius:8, background:'#fff' }}>
                <span style={{ color:T.inkFaint, display:'flex' }}><IcSearch/></span>
                <input aria-label="Filter policies" value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Filter by policy code, name…" style={{ border:'none', outline:'none', background:'transparent', fontSize:13, color:T.ink, width:'100%' }}/>
                {q && <button type="button" aria-label="Clear policy search" onClick={() => setQ('')} style={{ background:'none', border:'none', cursor:'pointer', color:T.inkFaint, display:'flex', padding:0 }}><IcX size={11}/></button>}
              </div>
              <span style={{ fontSize:11, color:T.inkFaint, marginLeft:'auto' }}>{sel.size > 0 ? `${sel.size} selected · ` : ''}{rows.length} of {tablePolicies.filter(g => g.type === typeF).length} {POL_META[typeF].label.toLowerCase()} policies</span>
            </div>
          </div>

          <table style={{ width:'100%', minWidth:960, borderCollapse:'collapse' }}>
            <colgroup><col style={{ width:148 }}/><col style={{ width:'auto' }}/><col style={{ width:100 }}/><col style={{ width:160 }}/><col style={{ width:112 }}/><col style={{ width:112 }}/><col style={{ width:44 }}/></colgroup>
            <thead><tr>
              <th style={TH}>Code</th><th style={TH}>Name</th><th style={TH}>Status</th><th style={TH}>Created by</th><th style={TH}>Last Modified</th><th style={TH}>Created On</th><th aria-label="Actions" style={{ ...TH, width:44, padding:'9px 8px' }}></th>
            </tr></thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:'72px 20px', textAlign:'center' }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                    <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={T.inkFaint} strokeWidth="1.4"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <div style={{ fontSize:15, fontWeight:600, color:T.inkSoft }}>{term || typeF !== 'all' ? 'No policies match your filters.' : 'No policies yet.'}</div>
                    <div style={{ fontSize:13, color:T.inkFaint }}>{term || typeF !== 'all' ? 'Try adjusting your search or filters.' : 'Create your first by clicking "+ New Policy" above.'}</div>
                  </div>
                </td></tr>
              ) : treeRows()}
            </tbody>
          </table>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'11px 16px', borderTop:`1px solid ${T.line}`, background:T.fill, borderRadius:'0 0 10px 10px' }}>
            <span style={{ fontSize:12.5, color:T.inkSoft }}>{rows.length === 0 ? 'No results' : `Showing ${(page-1)*PAGE+1}–${Math.min(page*PAGE, rows.length)} of ${rows.length} policies · ${expandedCount} expanded`}</span>
            {totalPages > 1 && (
              <div style={{ display:'flex', gap:4 }}>
                <button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ width:30, height:30, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:6, border:`1px solid ${T.line}`, background:'#fff', color:page === 1 ? T.inkFaint : T.ink, cursor:page === 1 ? 'default' : 'pointer', opacity:page === 1 ? .55 : 1 }}>
                  <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                {Array.from({ length:totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} type="button" aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined} onClick={() => setPage(p)} style={{ width:30, height:30, borderRadius:6, border:`1px solid ${p === page ? T.primary : T.line}`, background:p === page ? T.primary : '#fff', color:p === page ? '#fff' : T.ink, fontSize:12.5, cursor:'pointer', fontWeight:p === page ? 700 : 400 }}>{p}</button>
                ))}
                <button type="button" aria-label="Next page" disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ width:30, height:30, display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:6, border:`1px solid ${T.line}`, background:'#fff', color:page === totalPages ? T.inkFaint : T.ink, cursor:page === totalPages ? 'default' : 'pointer', opacity:page === totalPages ? .55 : 1 }}>
                  <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {detail && !flow && (
        <PolDetailDrawer target={detail} policies={policies} depParents={activeDepParents}
          onClose={() => setDetail(null)}
          onOpenParent={p => setDetail({ groupId:detail.groupId, parentId:p.id })}
          onBackToGroup={() => setDetail({ groupId:detail.groupId })}
          onEdit={(g, p) => { setDetail(null); p ? editParent(g, p) : editGroup(g); }}
          onFinish={(g, p) => { setDetail(null); finishSetup(g, p && p.status === 'Draft' && g.status !== 'Draft' ? p : null); }}
          onAddPolicy={g => { setDetail(null); addPolicyTo(g); }}
          onDelete={(g, p) => setDlg(p ? { type:'confirmDeleteParent', group:g, parent:p } : { type:'confirmDeleteGroup', group:g })}/>
      )}

      {edit && !flow && (() => {
        const g = policies.find(x => x.id === edit.groupId);
        const p = edit.parentId ? g?.parents.find(x => x.id === edit.parentId) : null;
        if (!g || (edit.level === 'parent' && !p)) return null;
        return <PolEditDrawer edit={edit} group={g} parent={p} setEdit={setEdit}
          activatable={edit.level === 'parent' ? parentActivatable(g.type, edit.form, edit.rows) : true}
          onCancel={askCancelEdit} onSave={edit.level === 'group' ? saveGroupEdit : saveParentEdit}/>;
      })()}

      {flow && (
        <PolFlowDrawer flow={flow} setFlow={setFlow} policies={policies} activatable={(() => { const d = activeFlowPolicy(flow); return parentActivatable(flow.type, { ...d.pForm, refundable:flow.gForm.refundable }, d.rows); })()}
          onCancel={askCancelFlow} onActivate={tryActivateFlow}/>
      )}

      <PolDialogs dlg={dlg} setDlg={setDlg} onDiscardFlow={() => { setFlow(null); setDlg(null); }} onDiscardEdit={() => { setEdit(null); setDlg(null); }}
        onDeleteGroup={doDeleteGroup} onDeleteParent={doDeleteParent}/>
    </div>
  );
}

Object.assign(window, { PoliciesList, TODAY, codeNumOf, nextParentCode, nextGroupCode });
