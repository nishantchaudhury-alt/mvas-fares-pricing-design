// pol-chrome.jsx — sidebar for the unified Policies IA + confirmation dialogs.

/* ── Margaritaville at Sea sidebar skin ──
   The only surface in the app styled to the MVAS brand rather than the light T tokens —
   everything else (tables, panels, modals) stays on the neutral palette. */
const SB = {
  bg: T.primary,        // '#1B2434' — same navy already used for buttons/badges elsewhere
  active: '#C1502F',    // retain the existing red/terracotta active navigation treatment
  accent: '#E2724F',    // retain the existing lighter red/terracotta sub-item treatment
  text: '#98A6BC',       // inactive item label/icon
  textDim: '#66738C',    // placeholder sub-items not yet wired to a screen
  hover: 'rgba(255,255,255,.06)',
};

/* Path to the real MVAS logo asset — drop the file here and it renders automatically.
   Until then, MvasLogo() falls back to a plain text lockup (see onError below). */
const MVAS_LOGO_SRC = 'assets/mvas-logo.png';

function MvasLogo() {
  return (
    <>
      <img src={MVAS_LOGO_SRC} alt="Margaritaville at Sea"
        style={{ width:148, height:'auto', objectFit:'contain', display:'block' }}
        onError={e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }}/>
      <div style={{ display:'none', flexDirection:'column', alignItems:'center', color:'#fff' }}>
        <div style={{ fontWeight:800, fontSize:14.5, letterSpacing:'1.5px' }}>MARGARITAVILLE</div>
        <div style={{ fontSize:13, fontStyle:'italic', opacity:.85, marginTop:1 }}>at Sea</div>
      </div>
    </>
  );
}

/* Line icons for the sidebar nav — same stroke language as IcSearch/IcCheck/etc. in
   dc-shell.jsx (fill:none, currentColor, rounded caps), sized for a 16px box. */
const SbIc = {
  dashboard: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>),
  bookmark: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>),
  anchor: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg>),
  inventory: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/></svg>),
  card: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>),
  box: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>),
  layers: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>),
  bar: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>),
  shield: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
};

function PolSidebar({ screen, onNav }) {
  const nav = [
    { id:'dashboard', label:'Dashboard', icon:SbIc.dashboard },
    { id:'bookings', label:'Bookings', icon:SbIc.bookmark, subs:[
      { id:'flows', label:'All bookings' },
      { id:'create-booking', label:'Create booking', plain:true },
      { id:'holds-waitlist', label:'Holds & waitlist', plain:true },
      { id:'guest-profiles', label:'Guest profiles', plain:true },
    ]},
    { id:'sailings', label:'Sailings', icon:SbIc.anchor },
    { id:'inventory', label:'Inventory', icon:SbIc.inventory },
    { id:'fares', label:'Fares & Pricing', icon:SbIc.card, subs:[
      { id:'faretypes', label:'Faretypes' },
      { id:'farecodes', label:'Farecodes' },
      { id:'policies', label:'Policies' },
      { id:'supplements', label:'Supplements' },
      { id:'channels', label:'Channels', plain:true, dim:false },
    ]},
    { id:'reports', label:'Reports', icon:SbIc.bar },
    { id:'audit', label:'History', icon:SbIc.shield },
  ];
  const inGroup = g => g.subs && g.subs.some(s => s.id === screen);
  // Clicking a parent with subs enters the group at its first real (non-placeholder) screen —
  // subnav is hidden until the group is active, so this is the only way in from outside it.
  const enterGroup = item => {
    if (!item.subs) return;
    const first = item.subs.find(s => !s.plain) || item.subs[0];
    onNav(first.id);
  };
  return (
    <div className="pscroll" style={{ gridColumn:1, gridRow:'1 / span 2', background:SB.bg, display:'flex', flexDirection:'column', overflowY:'auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'22px 16px 18px' }}>
        <MvasLogo/>
      </div>
      <div style={{ padding:'4px 0 12px' }}>
        {nav.map(item => {
          const open = inGroup(item);
          const Icon = item.icon;
          return (
            <div key={item.id}>
              <div onClick={() => enterGroup(item)}
                style={{ display:'flex', alignItems:'center', gap:11, padding:'9px 14px', margin:'2px 10px', borderRadius:8, fontSize:13.5, color:open ? '#fff' : SB.text, background:open ? SB.active : 'transparent', fontWeight:open ? 700 : 500, cursor:item.subs ? 'pointer' : 'default', transition:'background .12s' }}
                onMouseEnter={e => { if (!open && item.subs) e.currentTarget.style.background = SB.hover; }}
                onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}>
                <span style={{ width:16, display:'flex', alignItems:'center', justifyContent:'center', color:open ? '#fff' : SB.text, flexShrink:0 }}><Icon/></span>
                <span>{item.label}</span>
              </div>
              {item.subs && open && (
                <div style={{ paddingLeft:41, marginTop:2, marginBottom:8, display:'flex', flexDirection:'column', gap:1 }}>
                  {item.subs.map(sub => {
                    const active = sub.id === screen;
                    return (
                      <div key={sub.id} onClick={() => !sub.plain && onNav(sub.id)}
                        style={{ padding:'6px 10px 6px 12px', fontSize:12.5, color:active ? SB.accent : sub.plain && sub.dim !== false ? SB.textDim : SB.text, fontWeight:active ? 600 : 400, borderLeft:active ? `2px solid ${SB.accent}` : '2px solid transparent', cursor:sub.plain ? 'default' : 'pointer' }}>
                        {sub.label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PolDialogs({ dlg, setDlg, onDiscardFlow, onDiscardEdit, onDeactivateGroup, onDeactivateParent, onDeleteGroup, onDeleteParent }) {
  if (!dlg) return null;
  const close = () => setDlg(null);
  const dark = { ...polBtn, background:T.primary, color:'#fff' };
  const red = { ...polBtn, background:T.red, color:'#fff' };
  const g = dlg.group, p = dlg.parent;
  switch (dlg.type) {
    case 'toast':
      return (
        <div style={{ position:'fixed', bottom:22, left:'50%', transform:'translateX(-50%)', zIndex:1300, display:'flex', alignItems:'center', gap:12, padding:'11px 14px', background:T.primary, color:'#fff', borderRadius:9, boxShadow:'0 10px 30px rgba(15,23,42,.3)', fontSize:12.5 }}>
          <span style={{ display:'flex', color:'#6EE7B7' }}><IcCheck size={13}/></span>{dlg.text}
          <button onClick={close} style={{ background:'none', border:'none', color:'#94A3B8', cursor:'pointer', display:'flex', padding:0, marginLeft:4 }}><IcX size={11}/></button>
        </div>
      );
    case 'discardFlow':
      return (
        <Modal title="Discard this policy?" icon={<IcWarn color={T.amber}/>} onClose={close}
          actions={<><button style={polGhost} onClick={close}>Keep editing</button><button style={red} onClick={onDiscardFlow}>Discard</button></>}>
          Nothing has been saved yet. Leaving now discards the group, the policy, and any lines you have entered.
        </Modal>
      );
    case 'discardEdit':
      return (
        <Modal title="Discard unsaved changes?" icon={<IcWarn color={T.amber}/>} onClose={close}
          actions={<><button style={polGhost} onClick={close}>Keep editing</button><button style={red} onClick={onDiscardEdit}>Discard</button></>}>
          Your edits to this row have not been saved.
        </Modal>
      );
    case 'needParent':
      return (
        <Modal title="Add an active policy first" icon={<IcWarn color={T.amber}/>} onClose={close} actions={<button style={dark} onClick={close}>Got it</button>}>
          <strong>{g.name}</strong> has no active policy inside it. A group can only be activated once it contains at least one active policy.
        </Modal>
      );
    case 'cannotActivate':
      return (
        <Modal width={520} title={`${p.code} can't be activated yet`} icon={<IcWarn color={T.amber}/>} onClose={close} actions={<button style={dark} onClick={close}>Got it</button>}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <span>Open <strong>Edit policy</strong> to fix the following, then activate.</span>
            <IssueList issues={dlg.issues} title="Blocking validation"/>
          </div>
        </Modal>
      );
    case 'deactivateGroup':
      return (
        <Modal title="Deactivate group in use?" icon={<IcWarn color={T.amber}/>} onClose={close}
          actions={<><button style={polGhost} onClick={close}>Cancel</button><button style={red} onClick={() => onDeactivateGroup(g)}>Deactivate</button></>}>
          Policies inside <strong>{g.name}</strong> are referenced by {usedInGroup(g)} active Faretype and Farecode records. Existing bookings keep their current terms, but this group will no longer appear in assignment pickers.
        </Modal>
      );
    case 'deactivateParent':
      return (
        <Modal title="Deactivate policy in use?" icon={<IcWarn color={T.amber}/>} onClose={close}
          actions={<><button style={polGhost} onClick={close}>Cancel</button><button style={red} onClick={() => onDeactivateParent(g, p)}>Deactivate</button></>}>
          <strong style={{ fontFamily:MONO }}>{p.code}</strong> is used in {p.usedIn} records. Existing bookings continue under current terms; the policy will not be available for new Farecodes.
        </Modal>
      );
    case 'confirmDeleteGroup':
      return (
        <Modal title={`Delete ${g.name}?`} onClose={close}
          actions={<><button style={polGhost} onClick={close}>Cancel</button><button style={red} onClick={() => onDeleteGroup(g)}>Delete</button></>}>
          This permanently removes the group and its {g.parents.length} {g.parents.length === 1 ? 'policy' : 'policies'}. This cannot be undone.
        </Modal>
      );
    case 'confirmDeleteParent':
      return (
        <Modal title={`Delete ${p.code}?`} onClose={close}
          actions={<><button style={polGhost} onClick={close}>Cancel</button><button style={red} onClick={() => onDeleteParent(g, p)}>Delete</button></>}>
          This permanently removes <strong>{p.name}</strong> and its configured windows. This cannot be undone.
        </Modal>
      );
    case 'usedIn':
      return (
        <Modal width={640} title={`Used in — ${p.code}`} onClose={close} actions={<button style={dark} onClick={close}>Close</button>}>
          <UsedInTables row={p}/>
        </Modal>
      );
    default: return null;
  }
}

Object.assign(window, { PolSidebar, PolDialogs });
