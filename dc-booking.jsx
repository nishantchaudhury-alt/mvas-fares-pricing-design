// dc-booking.jsx — Part 4: agent-facing booking & modification touchpoints (4.1–4.6).
const { useState: useSB } = React;

const SAILING_DATE = new Date(2026, 6, 12); // 12 Jul 2026
const dateMinus = days => {
  const d = new Date(SAILING_DATE.getTime() - days * 864e5);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
};

function findParent(groups, id, childKey) {
  for (const g of groups) for (const p of g.parents) if (p.id === id) return { ...p, group:g };
  return null;
}

function resolveGuest(guest, dts, depGroups, canGroups, pax) {
  const dep = findParent(depGroups, guest.depParentId);
  const can = findParent(canGroups, guest.canParentId);
  const depLine = dep ? rowForCat(dep.lines, dts, guest.cat) : null;
  const band = can ? rowForCat(can.bands, dts, guest.cat) : null;
  const depositPaid = depositAmountFor(depLine, { fare: guest.fare + guest.port, pax: pax || 1 });
  const charge = cancelCharge({ band, depLine, cabinFare:guest.fare, portFees:guest.port, depositPaid: depLine?.cancelApplies ? depositPaid : 0 });
  return { dep, can, depLine, band, depositPaid, charge, refundable: can ? can.isRefundable !== false : true };
}

const KV = ({ k, v, strong, muted }) => (
  <div style={{ display:'flex', justifyContent:'space-between', gap:14, padding:'7px 0', borderBottom:`1px solid ${T.lineSoft}`, fontSize:12.5 }}>
    <span style={{ color: muted ? T.inkFaint : T.inkSoft }}>{k}</span>
    <span style={{ fontWeight: strong ? 700 : 500, color: muted ? T.inkFaint : T.ink, whiteSpace:'nowrap' }}>{v}</span>
  </div>
);

/* ─────── 4.1 Preview, Coupon & Policies ─────── */
function FlowPreview({ ctx }) {
  const { guests, dts, depGroups, canGroups } = ctx;
  const [optIn, setOptIn] = useSB(true);
  const res = guests.map(g => resolveGuest(g, dts, depGroups, canGroups, guests.length));
  const fareTotal = guests.reduce((s,g) => s + g.fare, 0);
  const portTotal = guests.reduce((s,g) => s + g.port, 0);
  const supp = 120, taxes = 96;
  const total = fareTotal + portTotal + supp + taxes;
  const depositDue = res.reduce((s,r) => s + r.depositPaid, 0);
  const line = res[0].depLine;
  const nextWindow = line && windowGroups(res[0].dep.lines).find(w => w.endDts < Number(line.endDts) || (w.beginDts !== Infinity && w.beginDts < Number(line.beginDts || Infinity)));
  const autoCancelDts = line && !isBlank(line.beginDts) ? null : (nextWindow ? nextWindow.beginDts : null);

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1.15fr 1fr', gap:16, alignItems:'start' }}>
      <SCard title="Deposit & policies">
        <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'12px 14px', border:`1px solid ${T.line}`, borderRadius:9, background:'#FCFDFE' }}>
          <Toggle on={optIn} onChange={setOptIn}/>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:T.ink }}>Pay deposit now — {money(depositDue)}</div>
            <div style={{ fontSize:12, color:T.inkSoft, marginTop:3, lineHeight:1.5 }}>
              {optIn ? `Resolved from ${line?.marketingName} (${winLabel(line)}, ${depAmountLabel(line)}) for ${catLabel(guests[0].cat === 'Interior' ? ['Interior'] : [guests[0].cat])} at ${dts} days to sail.` : 'Guest pays the full amount due today; no deposit milestone applies.'}
            </div>
          </div>
        </div>
        <DRow label="Deposit policy">{res[0].dep.code} · {res[0].dep.name}</DRow>
        <DRow label="Cancellation policy">{res[0].can.code} · {res[0].can.name} {res[0].refundable ? '' : '(non-refundable)'}</DRow>
        <DRow label="Auto-cancellation time">
          {optIn && autoCancelDts !== null
            ? <span>{dateMinus(autoCancelDts)} — when days-to-sail reaches {autoCancelDts} and the next milestone takes over. Unpaid balance cancels the booking automatically.</span>
            : optIn ? <span>{dateMinus(Math.max(0, Number(line?.endDts || 0)))} — final milestone; unpaid balance cancels at {line?.endDts} days to sail.</span>
            : <span style={{ color:T.inkFaint }}>Not applicable — booking is paid in full.</span>}
        </DRow>
        <Banner level="info">Coupon codes and promo eligibility are unchanged by this module and continue to apply to the cruise fare line only.</Banner>
      </SCard>
      <SCard title="Fare breakdown">
        <div>
          <KV k={`Cruise fare (${guests.length} guests)`} v={money(fareTotal)}/>
          <KV k="Port fees & expenses" v={money(portTotal)}/>
          <KV k="Supplements" v={money(supp)}/>
          <KV k="Taxes" v={money(taxes)}/>
          <KV k="Total due" v={money(total)} strong/>
          <KV k={optIn ? 'Deposit due today' : 'Payment due today'} v={money(optIn ? depositDue : total)} strong/>
          <KV k="Balance" v={money(optIn ? total - depositDue : 0)} muted={!optIn}/>
        </div>
        <div style={{ fontSize:11.5, color:T.inkFaint, fontStyle:'italic' }}>Read-only. Deposit line item is resolved per guest by stateroom category and current days-to-sail.</div>
      </SCard>
    </div>
  );
}

/* ─────── 4.2 Full cancellation ─────── */
function FlowFullCancel({ ctx }) {
  const { guests, dts, depGroups, canGroups } = ctx;
  const [stage, setStage] = useSB('idle');
  const res = guests.map(g => resolveGuest(g, dts, depGroups, canGroups, guests.length));
  const totalCharge = res.reduce((s,r) => s + r.charge.total, 0);
  const totalPaid = res.reduce((s,r) => s + r.depositPaid, 0);
  const refundable = res.some(r => r.refundable);
  const refund = Math.max(0, totalPaid - totalCharge);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <SCard title={`Booking BK-88213 · ${stage === 'done' ? 'Cancelled' : 'Confirmed'}`}
        right={<StatusBadge status={stage === 'done' ? 'Cancelled' : 'Confirmed'}/>}>
        <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ fontSize:12.5, color:T.inkSoft }}>Island Escape · 12 Jul 2026 · {dts} days to sail · {guests.length} guests · {guests[0].cat}</span>
        </div>
        {stage === 'idle' && (
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setStage('computing'); setTimeout(() => setStage('ready'), 550); }} style={{ ...btnDanger, padding:'9px 16px' }}>Cancel Booking</button>
          </div>
        )}
        {stage === 'computing' && <Banner level="info" title="Resolving active DTS band">Identifying the active cancellation band and deposit line for each guest…</Banner>}
      </SCard>

      {(stage === 'ready' || stage === 'done') && (
        <SCard title="Charge breakdown" pad="0">
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 110px 110px 120px', gap:8, padding:'9px 16px', background:T.fill, fontSize:10, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px' }}>
              <span>Guest</span><span>DTS band applied</span><span>% penalty</span><span>Full deposit</span><span>Charge</span>
            </div>
            {res.map((r, i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 110px 110px 120px', gap:8, padding:'11px 16px', borderTop:`1px solid ${T.lineSoft}`, fontSize:12.5, alignItems:'center' }}>
                <div>
                  <div style={{ fontWeight:600 }}>{guests[i].name}</div>
                  <div style={{ fontSize:11, color:T.inkFaint }}>{guests[i].cat} · {r.can.code}{r.refundable ? '' : ' (non-refundable)'}</div>
                </div>
                <div>
                  <div>{winLabel(r.band)}</div>
                  <div style={{ fontSize:11, color:T.inkFaint, fontFamily:MONO }}>{r.band.penaltyType}</div>
                </div>
                <span style={{ color:T.inkSoft }}>{r.band.penaltyType === 'PCT_CABIN_FARE' ? money(r.charge.pctAmt) : r.band.penaltyType === 'FIXED' ? money(r.charge.fixedAmt) : '—'}</span>
                <span style={{ color: r.charge.depFloor ? T.inkSoft : T.inkFaint }}>{r.charge.depFloor ? money(r.charge.depFloor) : 'n/a'}</span>
                <span style={{ fontWeight:700 }}>{money(r.charge.total)} <span style={{ fontSize:10.5, fontWeight:600, color:T.inkFaint }}>{r.charge.governing === 'deposit' ? 'deposit governs' : 'band governs'}</span></span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', borderTop:`1px solid ${T.line}`, background:'#FCFDFE' }}>
              <span style={{ fontSize:12.5, fontWeight:600, color:T.inkSoft }}>Booking-level total</span>
              <span style={{ fontSize:14, fontWeight:800 }}>{money(totalCharge)}</span>
            </div>
            {stage === 'done' && refundable && refund > 0 && (
              <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', borderTop:`1px solid ${T.lineSoft}`, background:T.greenLight }}>
                <span style={{ fontSize:12.5, fontWeight:600, color:'#065F46' }}>Refund amount (paid {money(totalPaid)} − charge {money(totalCharge)})</span>
                <span style={{ fontSize:14, fontWeight:800, color:'#065F46' }}>{money(refund)}</span>
              </div>
            )}
          </div>
        </SCard>
      )}

      {stage === 'ready' && (
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={() => setStage('idle')} style={btnGhost}>Back</button>
          <button onClick={() => setStage('done')} style={{ padding:'9px 18px', border:'none', borderRadius:7, background:T.red, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer' }}>Confirm Cancellation</button>
        </div>
      )}
      {stage !== 'ready' && stage !== 'done' && (
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button disabled style={{ padding:'9px 18px', border:'none', borderRadius:7, background:'#E2E8F0', fontSize:13, fontWeight:600, color:T.inkFaint, cursor:'not-allowed' }}>Confirm Cancellation</button>
        </div>
      )}
      {stage === 'done' && (
        <Banner level="success" title="Booking cancelled">Charge of {money(totalCharge)} stored at guest level. {refundable && refund > 0 ? `${money(refund)} refundable per payment policy.` : 'No refund due.'}</Banner>
      )}
    </div>
  );
}

/* ─────── 4.3 Partial cancellation ─────── */
function FlowPartialCancel({ ctx }) {
  const { guests, dts, depGroups, canGroups } = ctx;
  const [sel, setSel] = useSB(new Set([guests[1].id]));
  const [stage, setStage] = useSB('select');
  const removed = guests.filter(g => sel.has(g.id));
  const remaining = guests.filter(g => !sel.has(g.id));
  const res = removed.map(g => resolveGuest(g, dts, depGroups, canGroups, guests.length));
  const totalCharge = res.reduce((s,r) => s + r.charge.total, 0);
  const occupancyDrop = remaining.length < 2;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <SCard title="Select guests to remove">
        {guests.map(g => (
          <label key={g.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', border:`1px solid ${sel.has(g.id) ? T.primary : T.line}`, borderRadius:8, cursor:'pointer', background: sel.has(g.id) ? T.primaryBg : '#fff' }}>
            <input type="checkbox" checked={sel.has(g.id)} onChange={() => setSel(p => { const n = new Set(p); n.has(g.id) ? n.delete(g.id) : n.add(g.id); return n; })} style={{ width:14, height:14, accentColor:T.primary }}/>
            <span style={{ fontSize:13, fontWeight:600 }}>{g.name}</span>
            <span style={{ fontSize:12, color:T.inkSoft }}>{g.cat} · fare {money(g.fare)}</span>
          </label>
        ))}
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button onClick={() => setStage('preview')} disabled={removed.length === 0 || removed.length === guests.length}
            style={{ ...btnPrimary, padding:'9px 16px', background: removed.length === 0 || removed.length === guests.length ? '#E2E8F0' : T.primary, color: removed.length === 0 || removed.length === guests.length ? T.inkFaint : '#fff', cursor: removed.length === 0 || removed.length === guests.length ? 'not-allowed' : 'pointer' }}>
            Preview removal
          </button>
        </div>
      </SCard>

      {stage === 'preview' && (
        <>
          <Banner level="warn" title="Faretype eligibility re-validated">
            Core Retail criteria are no longer met for the remaining party — the booking has been defaulted to the <strong>STANDARD</strong> Farecode automatically. No confirmation required.
          </Banner>
          {occupancyDrop && (
            <Banner level="warn" title="Occupancy below Faretype minimum">
              Remaining occupancy is {remaining.length}. Auto-selected <span style={{ fontFamily:MONO }}>FC-20990</span> — lowest qualifying standard single-occupancy Farecode.
            </Banner>
          )}
          <SCard title="Cancellation charge — removed guests" pad="0">
            <div>
              {res.map((r, i) => (
                <div key={i} style={{ padding:'12px 16px', borderBottom: i<res.length-1?`1px solid ${T.lineSoft}`:'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:12, marginBottom:6 }}>
                    <span style={{ fontSize:13, fontWeight:700 }}>{removed[i].name}</span>
                    <span style={{ fontSize:13.5, fontWeight:800 }}>{money(r.charge.total)}</span>
                  </div>
                  <div style={{ fontSize:11.5, color:T.inkSoft, lineHeight:1.6 }}>
                    {r.can.code} · {r.can.name}{r.refundable ? '' : ' (non-refundable)'} · band {winLabel(r.band)} <span style={{ fontFamily:MONO }}>{r.band.penaltyType}</span><br/>
                    Deposit line {r.depLine?.marketingName || '—'} · floor {r.charge.depFloor ? money(r.charge.depFloor) : 'n/a'} · {r.charge.governing === 'deposit' ? 'deposit governs' : 'band governs'}
                  </div>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 16px', borderTop:`1px solid ${T.line}`, background:'#FCFDFE' }}>
                <span style={{ fontSize:12.5, fontWeight:600, color:T.inkSoft }}>Total charge for removal</span>
                <span style={{ fontSize:14, fontWeight:800 }}>{money(totalCharge)}</span>
              </div>
            </div>
          </SCard>
          <div style={{ fontSize:11.5, color:T.inkFaint, fontStyle:'italic' }}>Each removed guest is charged under their own cancellation and deposit policy — not necessarily the same as other guests on the booking.</div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button onClick={() => setStage('select')} style={btnGhost}>Back</button>
            <button onClick={() => setStage('done')} style={{ padding:'9px 18px', border:'none', borderRadius:7, background:T.red, fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer' }}>Confirm Removal</button>
          </div>
        </>
      )}
      {stage === 'done' && <Banner level="success" title="Guests removed">{removed.map(g => g.name).join(', ')} removed · {money(totalCharge)} charged at guest level · booking re-priced on STANDARD Farecode.</Banner>}
    </div>
  );
}

/* ─────── 4.4 Booking restore ─────── */
function FlowRestore() {
  const [rows, setRows] = useSB([
    { ref:'BK-88213', sailing:'Island Escape · 12 Jul 2026', status:'Cancelled', charge:645, note:'Charge applied 18 Jun 2026' },
    { ref:'BK-88401', sailing:'Coral Voyager · 03 Aug 2026', status:'Cancelled', charge:0, note:'Cancelled inside no-penalty band' },
    { ref:'BK-88455', sailing:'Reef Dancer · 15 Nov 2026', status:'Aborted', charge:150, note:'Payment session abandoned' },
  ]);
  const restore = i => setRows(p => p.map((r, ri) => ri === i ? { ...r, status:'Confirmed', restored:true } : r));
  return (
    <SCard title="Restore booking" pad="0">
      <div>
        <div style={{ display:'grid', gridTemplateColumns:'110px 1fr 110px 130px 1fr 110px', gap:8, padding:'9px 16px', background:T.fill, fontSize:10, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.5px' }}>
          <span>Booking</span><span>Sailing</span><span>Status</span><span>Stored charge</span><span>Note</span><span></span>
        </div>
        {rows.map((r, i) => {
          const blocked = r.status === 'Cancelled' && r.charge > 0;
          return (
            <div key={r.ref} style={{ display:'grid', gridTemplateColumns:'110px 1fr 110px 130px 1fr 110px', gap:8, padding:'12px 16px', borderTop:`1px solid ${T.lineSoft}`, fontSize:12.5, alignItems:'center' }}>
              <span style={{ fontFamily:MONO, fontWeight:700, color:T.primary }}>{r.ref}</span>
              <span style={{ color:T.inkSoft }}>{r.sailing}</span>
              <StatusBadge status={r.status}/>
              <span style={{ fontWeight: r.charge ? 700 : 400, color: r.charge ? T.ink : T.inkFaint }}>{r.charge ? money(r.charge) : 'None'}</span>
              <span style={{ fontSize:11.5, color:T.inkFaint }}>{r.restored ? `Restored — stored charge of ${money(r.charge)} reinstated exactly as recorded` : r.note}</span>
              <span style={{ display:'flex', justifyContent:'flex-end' }}>
                {r.status === 'Confirmed'
                  ? <span style={{ fontSize:12, color:T.green, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}><IcCheck size={11}/>Restored</span>
                  : <button onClick={() => !blocked && restore(i)} disabled={blocked}
                      title={blocked ? 'Cannot restore — this booking was cancelled and a cancellation charge has already been applied.' : undefined}
                      style={{ padding:'7px 13px', borderRadius:7, border:`1.5px solid ${blocked ? T.line : T.primary}`, background: blocked ? '#F3F4F6' : '#fff', color: blocked ? T.inkFaint : T.primary, fontSize:12.5, fontWeight:600, cursor: blocked ? 'not-allowed' : 'pointer' }}>Restore</button>}
              </span>
            </div>
          );
        })}
        <div style={{ padding:'11px 16px', borderTop:`1px solid ${T.lineSoft}`, background:'#FCFDFE', fontSize:11.5, color:T.inkSoft, lineHeight:1.55 }}>
          Restore is blocked only for <strong>Cancelled</strong> bookings carrying an applied charge. <strong>Aborted</strong> bookings restore normally. A reinstated charge is the stored amount — never recalculated.
        </div>
      </div>
    </SCard>
  );
}

/* ─────── 4.5 Sailing modification ─────── */
function FlowSailingMod({ ctx }) {
  const { guests, dts, depGroups, canGroups } = ctx;
  const paid = resolveGuest(guests[0], dts, depGroups, canGroups, guests.length).depositPaid * guests.length;
  const OPTS = [
    { id:'a', sailing:'Coral Voyager · 03 Aug 2026', farecode:'FC-20114', dts:64, depId:'dp3', canId:'cp1' },
    { id:'b', sailing:'Reef Dancer · 15 Nov 2026', farecode:'FC-20990', dts:125, depId:'dp5', canId:'cp2' },
    { id:'c', sailing:'Island Escape · 18 Aug 2026', farecode:'FC-20101', dts:5, depId:'dp1', canId:'cp1', outside:true },
  ];
  const [pick, setPick] = useSB(null);
  const [done, setDone] = useSB(false);
  const opt = OPTS.find(o => o.id === pick);
  let outcome = null;
  if (opt) {
    const g2 = guests.map(g => ({ ...g, depParentId:opt.depId, canParentId:opt.canId }));
    const req = g2.reduce((s,g) => s + resolveGuest(g, opt.dts, depGroups, canGroups, guests.length).depositPaid, 0);
    const r0 = resolveGuest(g2[0], opt.dts, depGroups, canGroups, guests.length);
    if (opt.outside) outcome = { kind:'full', level:'warn', title:'Outside any valid deposit window — full payment required',
      text:`${opt.sailing} is inside the final payment window at ${opt.dts} days to sail. The full amount due must be collected to complete the change.`, req:null, r0 };
    else if (req > paid) outcome = { kind:'higher', level:'warn', title:`Higher deposit required — collect ${money(req - paid)}`,
      text:`New deposit requirement ${money(req)} vs ${money(paid)} already paid. The guest is charged the incremental amount at confirmation.`, req, r0 };
    else if (req < paid) outcome = { kind:'lower', level:'info', title:`Lower deposit required — ${money(paid - req)} credited to cruise fare`,
      text:`New deposit requirement ${money(req)} vs ${money(paid)} already paid. Amounts paid are never reduced; the difference is credited against the cruise fare.`, req, r0 };
    else outcome = { kind:'same', level:'info', title:'Deposit requirement unchanged', text:`New deposit requirement matches the ${money(paid)} already paid.`, req, r0 };
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <SCard title="Change sailing">
        <div style={{ fontSize:12.5, color:T.inkSoft }}>Current: Island Escape · 12 Jul 2026 · {dts} days to sail · deposit paid {money(paid)}. A sailing change is treated as a new booking — both policies are re-evaluated against the new Farecode.</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {OPTS.map(o => (
            <label key={o.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:`1px solid ${pick===o.id ? T.primary : T.line}`, borderRadius:8, cursor:'pointer', background: pick===o.id ? T.primaryBg : '#fff' }}>
              <input type="radio" checked={pick===o.id} onChange={() => { setPick(o.id); setDone(false); }} style={{ accentColor:T.primary }}/>
              <span style={{ fontSize:13, fontWeight:600 }}>{o.sailing}</span>
              <span style={{ fontSize:12, color:T.inkSoft }}>· <span style={{ fontFamily:MONO }}>{o.farecode}</span> · {o.dts} days to sail</span>
            </label>
          ))}
        </div>
      </SCard>
      {outcome && (
        <>
          <Banner level={outcome.level} title={outcome.title}>{outcome.text}</Banner>
          <SCard title="Re-evaluated terms">
            <DRow label="Deposit policy">{outcome.r0.dep.code} · {outcome.r0.dep.name}</DRow>
            <DRow label="Active deposit line">{outcome.r0.depLine ? `${outcome.r0.depLine.marketingName} · ${winLabel(outcome.r0.depLine)} · ${depAmountLabel(outcome.r0.depLine)}` : '—'}</DRow>
            <DRow label="Cancellation policy">{outcome.r0.can.code} · {outcome.r0.can.name}</DRow>
            <DRow label="Active band">{outcome.r0.band ? `${winLabel(outcome.r0.band)} · ${penAmountLabel(outcome.r0.band)}` : '—'}</DRow>
            <DRow label={outcome.kind === 'full' ? 'Amount to collect' : 'New deposit requirement'}>{outcome.req === null ? 'Full amount due' : money(outcome.req)}</DRow>
          </SCard>
          {!done ? (
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setPick(null)} style={btnGhost}>Cancel</button>
              <button onClick={() => setDone(true)} style={{ ...btnPrimary, padding:'9px 18px' }}><IcCheck/>Confirm Sailing Change</button>
            </div>
          ) : <Banner level="success" title="Sailing changed">{outcome.title} — applied and recorded against the booking.</Banner>}
        </>
      )}
    </div>
  );
}

/* ─────── 4.6 Cabin modification ─────── */
function FlowCabinMod({ ctx }) {
  const { guests, dts, depGroups, canGroups } = ctx;
  const cur = resolveGuest(guests[0], dts, depGroups, canGroups, guests.length);
  const OPTS = [
    { id:'bal', label:'Balcony — upgrade', cat:'Balcony', farecode:'FC-20101', depId:'dp1', canId:'cp1' },
    { id:'suite', label:'Suites — upgrade', cat:'Suites', farecode:'FC-20108', depId:'dp1', canId:'cp2' },
    { id:'saver', label:'Interior Saver — downgrade', cat:'Interior', farecode:'FC-20990', depId:'dp2', canId:'cp3', ineligible:true },
  ];
  const [pick, setPick] = useSB(null);
  const [done, setDone] = useSB(false);
  const opt = OPTS.find(o => o.id === pick);
  const next = opt ? resolveGuest({ ...guests[0], cat:opt.cat, depParentId:opt.depId, canParentId:opt.canId }, dts, depGroups, canGroups, guests.length) : null;
  const delta = next ? next.depositPaid * guests.length - cur.depositPaid * guests.length : 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <SCard title="Change cabin">
        <div style={{ fontSize:12.5, color:T.inkSoft }}>Current: {guests[0].cat} · <span style={{ fontFamily:MONO }}>FC-20101</span> · deposit paid {money(cur.depositPaid * guests.length)}. Any change that alters the applicable Farecode re-resolves both policies.</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {OPTS.map(o => (
            <label key={o.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:`1px solid ${pick===o.id ? T.primary : T.line}`, borderRadius:8, cursor:'pointer', background: pick===o.id ? T.primaryBg : '#fff' }}>
              <input type="radio" checked={pick===o.id} onChange={() => { setPick(o.id); setDone(false); }} style={{ accentColor:T.primary }}/>
              <span style={{ fontSize:13, fontWeight:600 }}>{o.label}</span>
              <span style={{ fontSize:12, color:T.inkSoft }}>· <span style={{ fontFamily:MONO }}>{o.farecode}</span></span>
            </label>
          ))}
        </div>
      </SCard>
      {opt && (
        <>
          {opt.ineligible && (
            <Banner level="error" title="Faretype eligibility no longer met">
              The guest does not qualify for Core Retail on <span style={{ fontFamily:MONO }}>{opt.farecode}</span>. Defaulted to the <strong>STANDARD</strong> Farecode; the prior policy is not retained.
            </Banner>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <SCard title="Current terms">
              <DRow label="Stateroom">{guests[0].cat}</DRow>
              <DRow label="Deposit">{cur.depLine?.marketingName} · {depAmountLabel(cur.depLine)} → {money(cur.depositPaid * guests.length)}</DRow>
              <DRow label="Cancellation">{cur.can.code} · {winLabel(cur.band)} · {penAmountLabel(cur.band)}</DRow>
            </SCard>
            <SCard title="New terms">
              <DRow label="Stateroom">{opt.cat}</DRow>
              <DRow label="Deposit">{next.depLine?.marketingName} · {depAmountLabel(next.depLine)} → {money(next.depositPaid * guests.length)}</DRow>
              <DRow label="Cancellation">{next.can.code} · {winLabel(next.band)} · {penAmountLabel(next.band)}{next.refundable ? '' : ' · non-refundable'}</DRow>
            </SCard>
          </div>
          <Banner level={delta > 0 ? 'warn' : delta < 0 ? 'info' : 'info'} title={delta > 0 ? `Collect ${money(delta)} additional deposit` : delta < 0 ? `${money(-delta)} credited against the cruise fare` : 'Deposit requirement unchanged'}>
            Updated deposit and cancellation terms must be confirmed by the agent before the modification is finalised.
          </Banner>
          {!done ? (
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setPick(null)} style={btnGhost}>Cancel</button>
              <button onClick={() => setDone(true)} style={{ ...btnPrimary, padding:'9px 18px' }}><IcCheck/>Confirm Cabin Change</button>
            </div>
          ) : <Banner level="success" title="Cabin changed">Booking moved to {opt.cat} on {opt.farecode}; both policies re-resolved and stored.</Banner>}
        </>
      )}
    </div>
  );
}

/* ═════════ Flow host ═════════ */
function DCBookingFlows({ depGroups, canGroups }) {
  const [tab, setTab] = useSB('preview');
  const [dts, setDts] = useSB(42);
  const guests = [
    { id:1, name:'A. Whitfield', cat:'Interior', fare:2400, port:180, depParentId:'dp1', canParentId:'cp1' },
    { id:2, name:'R. Whitfield', cat:'Interior', fare:2400, port:180, depParentId:'dp1', canParentId:'cp3' },
  ];
  const ctx = { guests, dts:Number(dts), depGroups, canGroups };
  const TABS = [
    { k:'preview', l:'Preview & Policies' },
    { k:'full', l:'Full Cancellation' },
    { k:'partial', l:'Partial Cancellation' },
    { k:'restore', l:'Booking Restore' },
    { k:'sailing', l:'Sailing Modification' },
    { k:'cabin', l:'Cabin Modification' },
  ];
  return (
    <div className="pscroll" style={{ gridColumn:2, gridRow:2, overflow:'auto' }}>
      <PageHead crumb={<>BOOKINGS <span style={{ margin:'0 5px' }}>›</span> <span style={{ color:T.inkSoft, fontFamily:MONO }}>BK-88213</span></>}
        title="Booking & Modification Flows"
        sub="Agent-facing touchpoints that consume the deposit and cancellation policies. Policy structure is never edited here."/>
      <div style={{ padding:'0 28px 28px', display:'flex', flexDirection:'column', gap:16, maxWidth:1080 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap', padding:'12px 16px', background:'#fff', border:`1px solid ${T.line}`, borderRadius:10 }}>
          <span style={{ fontSize:12.5, color:T.inkSoft }}>Island Escape · 12 Jul 2026 · 2 guests · Interior · Core Retail <span style={{ fontFamily:MONO }}>FC-20101</span></span>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
            <span style={{ fontSize:11.5, color:T.inkLabel, fontWeight:700, textTransform:'uppercase', letterSpacing:'.5px' }}>Days to sail</span>
            <input value={dts} onChange={e => setDts(e.target.value.replace(/[^0-9]/g,'') || 0)} style={{ ...iS(), width:70, padding:'6px 9px', fontSize:12.5 }}/>
            <span style={{ fontSize:11.5, color:T.inkFaint, fontStyle:'italic' }}>drives every resolution below</span>
          </div>
        </div>
        <div style={{ background:'#fff', border:`1px solid ${T.line}`, borderRadius:10, padding:'14px 18px 0' }}>
          <div className="hscroll" style={{ overflowX:'auto' }}><Tabs tabs={TABS} active={tab} onChange={setTab}/></div>
          <div style={{ padding:'18px 0 18px' }}>
            {tab === 'preview' && <FlowPreview ctx={ctx}/>}
            {tab === 'full' && <FlowFullCancel key={dts} ctx={ctx}/>}
            {tab === 'partial' && <FlowPartialCancel key={dts} ctx={ctx}/>}
            {tab === 'restore' && <FlowRestore/>}
            {tab === 'sailing' && <FlowSailingMod ctx={ctx}/>}
            {tab === 'cabin' && <FlowCabinMod ctx={ctx}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DCBookingFlows, resolveGuest });
