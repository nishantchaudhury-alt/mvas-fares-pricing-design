// dc-farecode.jsx — Part 3: Farecode Configuration → Policy Assignment.
const { useState: useSF } = React;

function DCFarecodeScreen({ depGroups, canGroups }) {
  const depParents = depGroups.filter(g => g.isActive).flatMap(g => g.parents.filter(p => p.isActive).map(p => ({ ...p, group:g })));
  const canParents = canGroups.filter(g => g.isActive).flatMap(g => g.parents.filter(p => p.isActive).map(p => ({ ...p, group:g })));
  const defaultDep = depParents.find(p => p.isDefault && p.group.isDefault) || depParents.find(p => p.isDefault);

  const [dep, setDep] = useSF('');
  const [can, setCan] = useSF(canParents[0]?.id || '');
  const [override, setOverride] = useSF(false);
  const [errors, setErrors] = useSF({});
  const [saved, setSaved] = useSF('');
  const [dts, setDts] = useSF(42);
  const [cat, setCat] = useSF('Interior');

  const effDep = depParents.find(p => p.id === dep) || (dep === '' ? defaultDep : null);
  const effCan = canParents.find(p => p.id === can);
  const depLine = effDep ? rowForCat(effDep.lines, Number(dts), cat) : null;
  const band = effCan ? rowForCat(effCan.bands, Number(dts), cat) : null;
  const fare = 2400, port = 180;
  const depositPaid = depositAmountFor(depLine, { fare: fare + port, pax:2 });
  const charge = cancelCharge({ band, depLine, cabinFare:fare, portFees:port, depositPaid: depLine?.cancelApplies ? depositPaid : 0 });

  const activate = () => {
    const e = {};
    if (!effCan) e.can = 'A cancellation policy is required.';
    if (!effDep) e.dep = 'A deposit policy is required — no default policy exists to fall back on.';
    setErrors(e);
    setSaved(Object.keys(e).length ? '' : 'Farecode activated. New bookings use these policies.');
  };

  return (
    <div className="pscroll" style={{ gridColumn:2, gridRow:2, overflow:'auto' }}>
      <PageHead
        crumb={<>FARES &amp; PRICING <span style={{ margin:'0 5px' }}>›</span> FARECODES <span style={{ margin:'0 5px' }}>›</span> <span style={{ color:T.inkSoft, fontFamily:MONO }}>FC-20101</span></>}
        title="Farecode FC-20101 · Island Escape 12 Jul 2026"
        sub="Deposit and cancellation policies are Farecode attributes. Both are required before activation; changing them affects new bookings only."/>
      <div style={{ padding:'0 28px 28px', display:'flex', flexDirection:'column', gap:16, maxWidth:1080 }}>

        <SCard title="Policy Assignment">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
            <Field label="Cancellation Policy" required error={errors.can} helper="Inherited from the Faretype. Lists active cancellation policy parents only — never groups.">
              <Sel value={can} onChange={setCan} dis={!override} err={errors.can} opts={[['','Select policy…'], ...canParents.map(p => [p.id, `${p.code} · ${p.name}${p.group.isRefundable ? '' : ' (non-refundable)'}`])]}/>
              <div title="Farecode-level override is gated behind an enablement flag that Product has not yet defined."
                style={{ display:'flex', alignItems:'center', gap:9, marginTop:8, opacity:.6, cursor:'not-allowed' }}>
                <input type="checkbox" checked={override} disabled onChange={() => setOverride(o => !o)} style={{ width:13, height:13, accentColor:T.primary }}/>
                <span style={{ fontSize:12, color:T.inkSoft }}>Override inherited policy at Farecode level</span>
                <IcInfo color={T.inkFaint}/>
              </div>
            </Field>
            <Field label="Deposit Policy" required error={errors.dep}
              helper={dep === '' && defaultDep ? `Unset — falls back to the default: ${defaultDep.code} · ${defaultDep.name}.` : 'Lists active deposit policy parents.'}>
              <Sel value={dep} onChange={setDep} err={errors.dep} opts={[['','Use default policy'], ...depParents.map(p => [p.id, `${p.code} · ${p.name}${p.isDefault ? ' (default)' : ''}`])]}/>
            </Field>
          </div>
          <Banner level="info" title="Booking window dates removed">
            <span style={{ fontFamily:MONO }}>booking_start_date</span> and <span style={{ fontFamily:MONO }}>booking_end_date</span> no longer appear on this screen — policy eligibility is resolved from days-to-sail windows instead.
          </Banner>
          {Object.keys(errors).length > 0 && <Banner level="error" title="Cannot activate">{errors.can || errors.dep}</Banner>}
          {saved && <Banner level="success">{saved}</Banner>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:2 }}>
            <button style={btnGhost}>Save Draft</button>
            <button onClick={activate} style={{ ...btnPrimary, padding:'9px 18px' }}><IcCheck/>Activate Farecode</button>
          </div>
        </SCard>

        <SCard title="Resolved terms — what a booking gets today">
          <div style={{ display:'grid', gridTemplateColumns:'160px 200px 1fr', gap:16, alignItems:'end' }}>
            <Field label="Days to sail"><input value={dts} onChange={e => setDts(e.target.value.replace(/[^0-9]/g,''))} style={{ ...iS(), padding:'7px 10px', fontSize:13 }}/></Field>
            <Field label="Stateroom category"><Sel value={cat} onChange={setCat} opts={CATS.map(c => [c,c])}/></Field>
            <span style={{ fontSize:11.5, color:T.inkFaint, fontStyle:'italic', paddingBottom:8 }}>Cabin fare {money(fare)} + port fees {money(port)}, 2 guests.</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div style={{ border:`1px solid ${T.line}`, borderRadius:9, padding:'12px 14px' }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px', marginBottom:8 }}>Deposit</div>
              {depLine ? (
                <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:12.5 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{money(depositPaid)} <span style={{ fontSize:11.5, fontWeight:500, color:T.inkFaint }}>due now</span></div>
                  <div style={{ color:T.inkSoft }}>{depLine.marketingName} · {winLabel(depLine)} · {depAmountLabel(depLine)}</div>
                  <div style={{ color:T.inkFaint, fontFamily:MONO, fontSize:11 }}>cancellation_policy_applies = {String(depLine.cancelApplies).toUpperCase()}</div>
                </div>
              ) : <div style={{ fontSize:12.5, color:T.amberDark }}>No deposit line covers {dts} days / {cat}. Full payment required.</div>}
            </div>
            <div style={{ border:`1px solid ${T.line}`, borderRadius:9, padding:'12px 14px' }}>
              <div style={{ fontSize:10.5, fontWeight:700, color:T.inkLabel, textTransform:'uppercase', letterSpacing:'.6px', marginBottom:8 }}>If cancelled today</div>
              {band ? (
                <div style={{ display:'flex', flexDirection:'column', gap:6, fontSize:12.5 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{money(charge.total)} <span style={{ fontSize:11.5, fontWeight:500, color:T.inkFaint }}>charge ({charge.governing === 'deposit' ? 'deposit floor governs' : 'band penalty governs'})</span></div>
                  <div style={{ color:T.inkSoft }}>{winLabel(band)} · {penAmountLabel(band)}</div>
                  <div style={{ color:T.inkFaint }}>Band penalty {money(charge.bandAmt)} vs deposit floor {charge.depFloor ? money(charge.depFloor) : 'n/a'}</div>
                </div>
              ) : <div style={{ fontSize:12.5, color:T.amberDark }}>No band covers {dts} days / {cat}.</div>}
            </div>
          </div>
        </SCard>

        <Banner level="warn" title="Existing bookings are unaffected">
          Changing either policy on this Farecode does not retroactively change bookings already made against it — stored policy references are kept as recorded.
        </Banner>
      </div>
    </div>
  );
}

Object.assign(window, { DCFarecodeScreen });
