// dc-group-panel.jsx — 720px slide-over shell + Group panel (1.2 / 2.2).
const { useState: useSG, useRef: useRG, useEffect: useEG } = React;

function PanelShell({ z = 901, width = 720, titleLine, metaLine, actions, tabs, activeTab, onTab, onClose, children, readOnlyBg }) {
  const [mounted, setMounted] = useSG(false);
  useEG(() => { requestAnimationFrame(() => setMounted(true)); }, []);
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.32)', zIndex:z, opacity:mounted?1:0, transition:'opacity .22s' }}/>
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width, maxWidth:'100%', background:'#fff', zIndex:z+1, display:'flex', flexDirection:'column', boxShadow:'-8px 0 48px rgba(15,23,42,.2)', transform:mounted?'translateX(0)':'translateX(100%)', transition:'transform .25s ease-out' }}>
        <div style={{ padding:'16px 24px 0', borderBottom:`1px solid ${T.line}`, flexShrink:0, background:'#fff' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:14 }}>
            <div style={{ minWidth:0 }}>
              {titleLine}
              {metaLine}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
              {actions}
              <button onClick={onClose} style={{ width:32, height:32, borderRadius:7, border:`1.5px solid ${T.line}`, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:T.inkSoft }}><IcX size={13}/></button>
            </div>
          </div>
          {tabs && <div style={{ marginBottom:-1 }}><Tabs tabs={tabs} active={activeTab} onChange={onTab}/></div>}
        </div>
        <div className="pscroll" style={{ flex:1, overflowY:'auto', padding:'22px 26px 40px', background: readOnlyBg ? '#EFF3F8' : '#fff' }}>{children}</div>
      </div>
    </>
  );
}

const btnPrimary = { padding:'7px 15px', border:'none', borderRadius:7, background:T.primary, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:6 };
const btnGhost = { padding:'7px 14px', border:`1.5px solid ${T.line}`, borderRadius:7, background:'#fff', fontSize:13, fontWeight:500, color:T.inkSoft, cursor:'pointer' };
const btnDanger = { padding:'7px 14px', border:'1.5px solid #FCA5A5', borderRadius:7, background:'#fff', fontSize:13, fontWeight:600, color:T.red, cursor:'pointer' };
const btnGreen = { padding:'7px 14px', border:'1.5px solid #A7F3D0', borderRadius:7, background:'#fff', fontSize:13, fontWeight:600, color:T.green, cursor:'pointer' };

function DiscardModal({ onKeep, onDiscard }) {
  return (
    <Modal title="Discard changes?" onClose={onKeep} width={380}
      actions={<><button onClick={onKeep} style={btnGhost}>Keep Editing</button><button onClick={onDiscard} style={{ padding:'9px 18px', border:'none', borderRadius:7, background:T.red, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer' }}>Discard</button></>}>
      You have unsaved changes. They'll be lost if you continue.
    </Modal>
  );
}

/* ═════════ Group panel (1.2 / 2.2) ═════════ */
function DCGroupPanel({ kind, group, allGroups, onClose, onSave, onOpenParent, onAddParent, onToggleActive, onDelete }) {
  const isDep = kind === 'deposit';
  const label = isDep ? 'Deposit Policy Group' : 'Cancellation Policy Group';
  const isCreate = !group;
  const build = () => ({
    name: group?.name || '',
    isActive: group ? group.isActive : true,
    isDefault: group ? !!group.isDefault : false,
    isRefundable: group ? group.isRefundable !== false : true,
  });
  const [isEditing, setIsEditing] = useSG(isCreate);
  const [tab, setTab] = useSG('overview');
  const [form, setForm] = useSG(build);
  const [errors, setErrors] = useSG({});
  const [saved, setSaved] = useSG(false);
  const [confirmDefault, setConfirmDefault] = useSG(null);
  const [discardCb, setDiscardCb] = useSG(null);
  const snap = useRG(JSON.stringify(build()));

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const dirty = () => snap.current !== JSON.stringify(form);
  const guard = cb => dirty() ? setDiscardCb(() => cb) : cb();
  const parents = group?.parents || [];
  const activeParents = parents.filter(p => p.isActive);
  const currentDefault = (allGroups || []).find(g => g.isDefault && g.id !== group?.id);

  const requestDefault = on => {
    if (on && currentDefault) { setConfirmDefault(currentDefault); return; }
    set('isDefault', on);
  };
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    else if ((allGroups || []).some(g => g.id !== group?.id && g.isActive && g.name.trim().toLowerCase() === form.name.trim().toLowerCase())) e.name = 'Name must be unique among active groups';
    if (form.isActive && !isCreate && activeParents.length === 0) e.isActive = `A group must contain at least one active parent policy before it can be Active.`;
    return e;
  };
  const save = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    onSave({ ...form });
    setSaved(true);
    snap.current = JSON.stringify(form);
    setTimeout(() => { setSaved(false); if (!isCreate) setIsEditing(false); }, 700);
  };

  const coverageOf = p => validateRows(isDep ? p.lines : p.bands);
  const childCount = p => (isDep ? p.lines : p.bands).length;

  const tabs = isCreate ? null : [{ k:'overview', l:'Overview' }, { k:'policies', l:'Policies', count:parents.length }, { k:'audit', l:'History' }];

  return (
    <>
      <PanelShell z={901} onClose={() => guard(onClose)} tabs={tabs} activeTab={tab} onTab={setTab}
        readOnlyBg={!isCreate && !isEditing}
        titleLine={<div style={{ fontSize:15, fontWeight:700, color:T.ink, marginBottom:5 }}>{isCreate ? `New ${label}` : `Edit ${label}`}</div>}
        metaLine={!isCreate && (
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
            <span style={{ fontSize:13.5, fontWeight:600, color:T.ink }}>{group.name}</span>
            <StatusBadge status={group.isActive ? 'Active' : 'Inactive'}/>
            {group.isDefault && <Pill>Default</Pill>}
            {!isDep && <Pill bg={group.isRefundable?'#ECFDF5':'#FEF2F2'} color={group.isRefundable?'#065F46':'#991B1B'}>{group.isRefundable ? 'Refundable' : 'Non-Refundable'}</Pill>}
            <span style={{ fontSize:12, color:T.inkFaint }}>· Modified {group.mod} · {group.editor}</span>
          </div>
        )}
        actions={<>
          {saved && <span style={{ fontSize:12, color:T.tealDark, display:'flex', alignItems:'center', gap:5 }}><IcCheck/>Saved!</span>}
          {isCreate && <button onClick={save} style={btnPrimary}><IcCheck/>Create Group</button>}
          {!isCreate && !isEditing && (<>
            <button onClick={() => { snap.current = JSON.stringify(form); setIsEditing(true); setTab('overview'); }} style={btnPrimary}><IcEdit/>Edit</button>
            <button onClick={() => onToggleActive(group)} style={group.isActive ? btnDanger : btnGreen}>{group.isActive ? 'Deactivate' : 'Activate'}</button>
            <button onClick={() => onDelete(group)} disabled={parents.some(p => p.usedIn > 0)} title={parents.some(p => p.usedIn > 0) ? 'Parent policies in this group are in use.' : undefined}
              style={{ ...btnGhost, color: parents.some(p => p.usedIn > 0) ? T.inkFaint : T.inkSoft, cursor: parents.some(p => p.usedIn > 0) ? 'not-allowed' : 'pointer' }}>Delete</button>
          </>)}
          {!isCreate && isEditing && (<>
            <button onClick={() => guard(() => { setForm(build()); setErrors({}); setIsEditing(false); })} style={btnGhost}>Cancel</button>
            <button onClick={save} style={btnPrimary}><IcCheck/>Save Changes</button>
          </>)}
        </>}>

        {(isCreate || tab === 'overview') && (
          isEditing ? (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <SectionHead title="Group Details" helper={`Groups bundle related ${isDep ? 'deposit' : 'cancellation'} policies. Farecodes are assigned a parent policy inside a group, never the group itself.`}/>
              <Field label="Group Name" required error={errors.name} helper="Must be unique among active groups.">
                <input className="fi" style={iS(errors.name)} value={form.name} onChange={e => set('name', e.target.value)} placeholder={isDep ? 'e.g. IS 5-Night Retail Std' : 'e.g. Standard'}/>
              </Field>
              {!isDep && (
                <Field label="Refundable" error={errors.isRefundable} helper="Turning this OFF requires every band to be PCT_CABIN_FARE or FULL_DEPOSIT before parent policies can be saved.">
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <Toggle on={form.isRefundable} onChange={v => set('isRefundable', v)}/>
                    <span style={{ fontSize:13, color:T.inkSoft }}>{form.isRefundable ? 'Refundable' : 'Non-Refundable'}</span>
                  </div>
                </Field>
              )}
              <Field label="Active" error={errors.isActive} helper="Turning OFF removes this group from assignment pickers. Farecodes already pointing at a parent inside it are unaffected.">
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <Toggle on={form.isActive} onChange={v => set('isActive', v)}/>
                  <span style={{ fontSize:13, color:T.inkSoft }}>{form.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </Field>
              <Field label="Default Group" helper="Only one group can be the default. Turning this ON unsets the current default.">
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <Toggle on={form.isDefault} onChange={requestDefault}/>
                  <span style={{ fontSize:13, color:T.inkSoft }}>{form.isDefault ? 'Default for new Farecodes' : 'Not the default'}</span>
                </div>
              </Field>
              {!isCreate && activeParents.length === 0 && <Banner level="warn" title="No active parent policies">Add and activate at least one parent policy in the Policies tab before marking this group Active.</Banner>}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <SCard title="Group Details">
                <DRow label="Group Name">{group.name}</DRow>
                {!isDep && <DRow label="Refundable">{group.isRefundable ? 'Refundable' : 'Non-Refundable'}</DRow>}
                <DRow label="Status"><StatusBadge status={group.isActive ? 'Active' : 'Inactive'}/></DRow>
                <DRow label="Default Group">{group.isDefault ? 'Yes — used when a Farecode leaves the policy unset' : 'No'}</DRow>
                <DRow label="Parent Policies">{parents.length} total · {activeParents.length} active</DRow>
              </SCard>
            </div>
          )
        )}

        {!isCreate && tab === 'policies' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <SCard title={isDep ? 'Deposit Policies in this Group' : 'Cancellation Policies in this Group'} pad="0"
              right={<button onClick={onAddParent} style={{ background:'none', border:'none', color:T.primary, fontSize:12, fontWeight:700, cursor:'pointer', padding:0 }}>+ Add {isDep ? 'Deposit' : 'Cancellation'} Policy</button>}>
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 90px 150px 80px 90px 40px', gap:8, padding:'9px 16px', background:T.fill, borderBottom:`1px solid ${T.lineSoft}`, fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px' }}>
                  <span>Policy Name</span><span>{isDep ? 'Lines' : 'Bands'}</span><span>Coverage</span><span>Default</span><span>Status</span><span></span>
                </div>
                {parents.length === 0 ? (
                  <div style={{ padding:'40px 16px', textAlign:'center', fontSize:13, color:T.inkFaint }}>No parent policies yet. Use "+ Add {isDep ? 'Deposit' : 'Cancellation'} Policy" above.</div>
                ) : parents.map(p => {
                  const cov = coverageOf(p);
                  return (
                    <div key={p.id} onClick={() => onOpenParent(p)} style={{ display:'grid', gridTemplateColumns:'1fr 90px 150px 80px 90px 40px', gap:8, padding:'11px 16px', borderBottom:`1px solid ${T.lineSoft}`, alignItems:'center', fontSize:12.5, cursor:'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.background = T.fill} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontWeight:600, color:T.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                        <div style={{ fontFamily:MONO, fontSize:11.5, color:T.tealDark, fontWeight:700, marginTop:2 }}>{p.code}</div>
                      </div>
                      <span style={{ color:T.inkSoft }}>{childCount(p)}</span>
                      <CoverPill ok={cov.issues.length === 0} label={cov.issues.length === 0 ? 'All windows covered' : `${cov.issues.length} issue${cov.issues.length===1?'':'s'}`}/>
                      <span>{p.isDefault ? <Pill>Default</Pill> : <span style={{ color:T.inkFaint }}>—</span>}</span>
                      <StatusBadge status={p.isActive ? 'Active' : 'Inactive'}/>
                      <span onClick={e => e.stopPropagation()}>
                        <RowMenu items={[
                          { icon:'↗', label:'Open policy', onClick:() => onOpenParent(p) },
                          { icon:'✎', label:'Edit', onClick:() => onOpenParent(p, true) },
                          { sep:true },
                          { icon:'⌘', label:`Used in ${p.usedIn} record${p.usedIn===1?'':'s'}`, disabled:p.usedIn===0, onClick:() => onOpenParent(p, false, 'usedin') },
                        ]}/>
                      </span>
                    </div>
                  );
                })}
              </div>
            </SCard>
            <Banner level="info">A group must contain at least one active parent policy before the group itself can be marked Active.</Banner>
          </div>
        )}

        {!isCreate && tab === 'audit' && <AuditList status={group.isActive ? 'Active' : 'Inactive'} label={label}/>}
      </PanelShell>

      {confirmDefault && (
        <Modal title="Change the default group?" icon={<IcWarn color={T.amber}/>} onClose={() => setConfirmDefault(null)} width={400}
          actions={<><button onClick={() => setConfirmDefault(null)} style={btnGhost}>Cancel</button><button onClick={() => { set('isDefault', true); setConfirmDefault(null); }} style={{ padding:'9px 18px', border:'none', borderRadius:7, background:T.primary, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer' }}>Continue</button></>}>
          This will unset <strong>{confirmDefault.name}</strong> as the default group. Continue?
        </Modal>
      )}
      {discardCb && <DiscardModal onKeep={() => setDiscardCb(null)} onDiscard={() => { const cb = discardCb; setDiscardCb(null); cb(); }}/>}
    </>
  );
}

Object.assign(window, { PanelShell, DCGroupPanel, DiscardModal, btnPrimary, btnGhost, btnDanger, btnGreen });
