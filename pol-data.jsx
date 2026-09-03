// pol-data.jsx — unified Policies data (Deposit + Cancellation, Group → Parent → Child) + labels.
const POL_META = {
  deposit: { label:'Deposit', badgeBg:'#ECFDF5', badgeColor:'#0F766E', groupPrefix:'DEP-GRP', childWord:'Line', childWords:'Milestone Lines', addChild:'+ Add Line', childKey:'lines', groupLabel:'Deposit Policy Group' },
  cancel:  { label:'Cancellation', badgeBg:'#FFFBEB', badgeColor:'#B45309', groupPrefix:'CANC-GRP', childWord:'Band', childWords:'Cancellation Bands', addChild:'+ Add Band', childKey:'bands', groupLabel:'Cancellation Policy Group' },
};
const POL_STATUS = {
  Active:   { bg:'#ECFDF5', color:'#065F46', dot:'#10B981' },
  Inactive: { bg:'#F1F5F9', color:'#475569', dot:'#94A3B8' },
  Draft:    { bg:'#FFFBEB', color:'#92400E', dot:'#F59E0B' },
};

const dtsLabel = r => isBlank(r.beginDts) ? `${r.endDts === '' ? '—' : r.endDts}+` : `${r.endDts}–${r.beginDts}`;
const catSentence = cats => catLabel(cats) === 'All types' ? 'All stateroom types' : catLabel(cats);
const depLabel = r => r.depositType === 'PCT' ? `${r.amount || '—'}% of fare` : `${money(r.amount)} ${r.depositType === 'FP' ? 'per person' : 'per cabin'}`;
const childCode = (parentCode, i) => `${String(parentCode).replace(/^[A-Z]+-/, '')}.${i + 1}`;
const lineSummary = r => [r.marketingName || 'Untitled line', `DTS ${dtsLabel(r)}`, depLabel(r)].join(' · ') + (r.cancelApplies ? ' · cancellation applies' : '');
const bandSummary = r => [`DTS ${dtsLabel(r)}`, penAmountLabel(r)].join(' · ');
const childSummary = (type, r) => type === 'deposit' ? lineSummary(r) : bandSummary(r);
const kidsOf = p => p.lines || p.bands || [];
const normalizePolicyCats = cats => {
  const selected = CATS.filter(cat => (cats || []).includes(cat));
  return (cats || []).includes('All') || CATS.every(cat => selected.includes(cat)) ? ['All'] : selected;
};
const policyCatsOf = p => {
  if (Array.isArray(p?.cats)) return normalizePolicyCats(p.cats);
  const derived = [...new Set(kidsOf(p || {}).flatMap(row => catsCover(row.cats || [])))];
  return derived.length ? normalizePolicyCats(derived) : ['All'];
};
const usedInGroup = g => g.parents.reduce((s, p) => s + (p.usedIn || 0), 0);
const blankLine = () => ({ marketingName:'', beginDts:'', endDts:'', depositType:'FC', amount:'', cats:['All'], cancelApplies:true });
const blankBand = () => ({ beginDts:'', endDts:'', penaltyType:'PCT_CABIN_FARE', penaltyValue:'', cats:['All'] });
const blankChild = type => type === 'deposit' ? blankLine() : blankBand();

/* Used In details mirror the Faretype and Farecode records elsewhere in the prototype. The
   larger seeded policy set reuses these deterministic pools so a non-zero reference count
   always has inspectable records instead of a contradictory empty state. */
const REFERENCE_FARETYPES = [
  { code:'FT-00101', name:'Core Retail', status:'Active', mod:'14 Jun 2026' },
  { code:'FT-00102', name:'Non-Refundable Promo', status:'Active', mod:'11 Jun 2026' },
  { code:'FT-00103', name:'International Agency', status:'Draft', mod:'10 Jun 2026' },
  { code:'FT-00104', name:'Brochure Retail', status:'Active', mod:'08 Jun 2026' },
  { code:'FT-00105', name:'Casino Standard', status:'Draft', mod:'07 Jun 2026' },
  { code:'FT-00106', name:'Flexible Retail', status:'Inactive', mod:'28 May 2026' },
  { code:'FT-00107', name:'Group Contract', status:'Active', mod:'13 Jun 2026' },
  { code:'FT-00108', name:'Interline Promo', status:'Active', mod:'02 Jun 2026' },
];
const REFERENCE_FARECODES = [
  { code:'FC-20101', ship:'Island Escape · 01 Sep 2026', status:'Active', mod:'12 Jun 2026' },
  { code:'FC-20102', ship:'Island Escape · 15 Oct 2026', status:'Active', mod:'10 Jun 2026' },
  { code:'FC-20103', ship:'Island Escape · 20 Nov 2026', status:'Active', mod:'08 Jun 2026' },
  { code:'FC-20104', ship:'Paradise Bay · 05 Aug 2026', status:'Draft', mod:'14 Jun 2026' },
  { code:'FC-20105', ship:'Paradise Bay · 10 Sep 2026', status:'Inactive', mod:'06 Jun 2026' },
  { code:'FC-20106', ship:'Island Escape · 05 Dec 2026', status:'Active', mod:'11 Jun 2026' },
  { code:'FC-20107', ship:'Paradise Bay · 20 Oct 2026', status:'Active', mod:'09 Jun 2026' },
  { code:'FC-20108', ship:'Northern Star · 15 Sep 2026', status:'Active', mod:'07 Jun 2026' },
  { code:'FC-20109', ship:'Northern Star · 01 Oct 2026', status:'Draft', mod:'05 Jun 2026' },
  { code:'FC-20110', ship:'Island Escape · 20 Aug 2026', status:'Active', mod:'04 Jun 2026' },
];
const rotateReferencePool = (pool, start, count) => Array.from({ length:count }, (_, i) => pool[(start + i) % pool.length]);
const seededReferenceDetails = (total=0, seed=0) => {
  const count = Math.max(0, Number(total) || 0);
  if (!count) return { usedInFaretypes:[], usedInFarecodes:[] };
  const faretypeCount = count > 1 ? Math.min(3, Math.ceil(count / 4)) : 0;
  return {
    usedInFaretypes:rotateReferencePool(REFERENCE_FARETYPES, seed % REFERENCE_FARETYPES.length, faretypeCount),
    usedInFarecodes:rotateReferencePool(REFERENCE_FARECODES, (seed * 2) % REFERENCE_FARECODES.length, count - faretypeCount),
  };
};

const POLICIES_INIT = [
  { id:'g1', type:'deposit', code:'DEP-GRP-01', name:'IS 5-Night Retail Std', status:'Active', isDefault:true, mod:'14 Jun 2026', created:'01 Jun 2026', editor:'jane.doe@mvas.com',
    parents:[
      { id:'dp1', code:'DEP-506', name:'5 Night Standard Deposit', status:'Active', isDefault:true, usedIn:9, mod:'14 Jun 2026', created:'02 Jun 2026', editor:'jane.doe@mvas.com',
        lines:[
          { marketingName:'Rate Hold Deposit', beginDts:'', endDts:90, depositType:'PCT', amount:10, cats:['All'], cancelApplies:false },
          { marketingName:'Full Deposit', beginDts:89, endDts:0, depositType:'FC', amount:150, cats:['Interior','Ocean View','Balcony'], cancelApplies:true },
          { marketingName:'Full Deposit — Suites', beginDts:89, endDts:0, depositType:'FC', amount:300, cats:['Suites'], cancelApplies:true },
        ],
        usedInFaretypes:[{ code:'FT-00101', name:'Core Retail', status:'Active', mod:'15 Jun 2026' }],
        usedInFarecodes:[{ code:'FC-20101', ship:'Island Escape · 12 Jul 2026', status:'Active', mod:'16 Jun 2026' },{ code:'FC-20114', ship:'Coral Voyager · 03 Aug 2026', status:'Active', mod:'11 Jun 2026' }] },
      { id:'dp2', code:'DEP-507', name:'5 Night Promo Deposit', status:'Active', isDefault:false, usedIn:0, mod:'11 Jun 2026', created:'05 Jun 2026', editor:'jane.doe@mvas.com',
        lines:[
          { marketingName:'Promo Hold', beginDts:'', endDts:60, depositType:'FP', amount:75, cats:['All'], cancelApplies:false },
          { marketingName:'Full Deposit', beginDts:59, endDts:0, depositType:'PCT', amount:25, cats:['All'], cancelApplies:true },
        ], usedInFaretypes:[], usedInFarecodes:[] },
    ]},
  { id:'g1b', type:'deposit', code:'DEP-GRP-04', name:'Caribbean 7-Night Trade', status:'Active', isDefault:false, mod:'09 Jun 2026', created:'28 May 2026', editor:'admin@mvas.com',
    parents:[
      { id:'dp3', code:'DEP-712', name:'7 Night Trade Deposit', status:'Active', isDefault:true, usedIn:4, mod:'09 Jun 2026', created:'28 May 2026', editor:'admin@mvas.com',
        lines:[
          { marketingName:'Rate Hold Deposit', beginDts:'', endDts:120, depositType:'PCT', amount:10, cats:['All'], cancelApplies:false },
          { marketingName:'Full Deposit', beginDts:119, endDts:0, depositType:'FC', amount:250, cats:['All'], cancelApplies:true },
        ], usedInFaretypes:[{ code:'FT-00204', name:'Trade Partner', status:'Active', mod:'09 Jun 2026' }], usedInFarecodes:[] },
      { id:'dp5', code:'DEP-713', name:'3 Night Sampler Deposit', status:'Active', isDefault:false, usedIn:1, mod:'07 Jun 2026', created:'30 May 2026', editor:'admin@mvas.com',
        lines:[{ marketingName:'Full Deposit', beginDts:'', endDts:0, depositType:'FC', amount:100, cats:['All'], cancelApplies:true }],
        usedInFaretypes:[], usedInFarecodes:[{ code:'FC-20990', ship:'Reef Dancer · 15 Nov 2026', status:'Active', mod:'07 Jun 2026' }] },
    ]},
  { id:'g2', type:'cancel', code:'CANC-GRP-01', name:'Standard', status:'Active', isDefault:true, isRefundable:true, mod:'14 Jun 2026', created:'01 Jun 2026', editor:'jane.doe@mvas.com',
    parents:[
      { id:'cp1', code:'CANC-014', name:'Standard Cancellation', status:'Active', isDefault:true, isRefundable:true, usedIn:12, mod:'14 Jun 2026', created:'01 Jun 2026', editor:'jane.doe@mvas.com',
        bands:[
          { beginDts:'', endDts:30, penaltyType:'NONE', penaltyValue:'', cats:['All'] },
          { beginDts:29, endDts:15, penaltyType:'PCT_CABIN_FARE', penaltyValue:25, cats:['All'] },
          { beginDts:14, endDts:0, penaltyType:'FULL_DEPOSIT', penaltyValue:'', cats:['All'] },
        ],
        usedInFaretypes:[{ code:'FT-00101', name:'Core Retail', status:'Active', mod:'15 Jun 2026' }],
        usedInFarecodes:[{ code:'FC-20101', ship:'Island Escape · 12 Jul 2026', status:'Active', mod:'16 Jun 2026' }] },
      { id:'cp2', code:'CANC-015', name:'Standard — Suites Enhanced', status:'Active', isDefault:false, isRefundable:true, usedIn:2, mod:'12 Jun 2026', created:'06 Jun 2026', editor:'jane.doe@mvas.com',
        bands:[
          { beginDts:'', endDts:45, penaltyType:'NONE', penaltyValue:'', cats:['All'] },
          { beginDts:44, endDts:0, penaltyType:'PCT_CABIN_FARE', penaltyValue:40, cats:['All'] },
        ],
        usedInFaretypes:[{ code:'FT-00103', name:'International Agency', status:'Draft', mod:'10 Jun 2026' }],
        usedInFarecodes:[{ code:'FC-20106', ship:'Island Escape · 05 Dec 2026', status:'Active', mod:'11 Jun 2026' }] },
    ]},
  { id:'g3', type:'cancel', code:'CANC-GRP-02', name:'Non-Refundable', status:'Active', isDefault:false, isRefundable:false, mod:'10 Jun 2026', created:'03 Jun 2026', editor:'admin@mvas.com',
    parents:[
      { id:'cp3', code:'CANC-020', name:'Non-Refundable', status:'Active', isDefault:true, isRefundable:false, usedIn:5, mod:'10 Jun 2026', created:'03 Jun 2026', editor:'admin@mvas.com',
        bands:[{ beginDts:'', endDts:0, penaltyType:'FULL_DEPOSIT', penaltyValue:'', cats:['All'] }],
        usedInFaretypes:[], usedInFarecodes:[{ code:'FC-20140', ship:'Coral Voyager · 21 Sep 2026', status:'Active', mod:'10 Jun 2026' }] },
    ]},
  { id:'g4', type:'deposit', code:'DEP-GRP-02', name:'Premium Suites Only', status:'Draft', isDefault:false, mod:'04 Jun 2026', created:'04 Jun 2026', editor:'jane.doe@mvas.com',
    parents:[
      { id:'p5', code:'DEP-511', name:'Premium Deposit', status:'Draft', isDefault:false, usedIn:0, mod:'04 Jun 2026', created:'04 Jun 2026', editor:'jane.doe@mvas.com',
        cats:['Suites'], lines:[], usedInFaretypes:[], usedInFarecodes:[] },
    ]},
  { id:'g5', type:'deposit', code:'DEP-GRP-03', name:'Legacy Group Bookings', status:'Inactive', isDefault:false, mod:'02 Jun 2026', created:'15 May 2026', editor:'admin@mvas.com',
    parents:[
      { id:'p6', code:'DEP-880', name:'Group Hold Deposit', status:'Inactive', isDefault:true, usedIn:0, mod:'02 Jun 2026', created:'15 May 2026', editor:'admin@mvas.com',
        lines:[{ marketingName:'Group Hold', beginDts:'', endDts:0, depositType:'FC', amount:500, cats:['All'], cancelApplies:true }],
        usedInFaretypes:[], usedInFarecodes:[] },
    ]},
];

/* Additional seeded records keep the list views representative of production-scale data. */
const seededDepositLines = ({ holdDts=90, holdPct=10, fullAmount=200 } = {}) => [
  { marketingName:'Rate Hold Deposit', beginDts:'', endDts:holdDts, depositType:'PCT', amount:holdPct, cats:['All'], cancelApplies:false },
  { marketingName:'Full Deposit', beginDts:holdDts - 1, endDts:0, depositType:'FC', amount:fullAmount, cats:['All'], cancelApplies:true },
];
const seededCancellationBands = ({ freeDts=60, partialDts=30, pct=50 } = {}) => [
  { beginDts:'', endDts:freeDts, penaltyType:'NONE', penaltyValue:'', cats:['All'] },
  { beginDts:freeDts - 1, endDts:partialDts, penaltyType:'PCT_CABIN_FARE', penaltyValue:pct, cats:['All'] },
  { beginDts:partialDts - 1, endDts:0, penaltyType:'FULL_DEPOSIT', penaltyValue:'', cats:['All'] },
];
const seededNonRefundableBands = () => [
  { beginDts:'', endDts:0, penaltyType:'FULL_DEPOSIT', penaltyValue:'', cats:['All'] },
];
const seededDepositGroup = ({ number, name, parentCode, parentName, status='Active', mod, created, editor='jane.doe@mvas.com', usedIn=0, lines }) => ({
  id:`seed-deposit-group-${number}`, type:'deposit', code:`DEP-GRP-${String(number).padStart(2, '0')}`, name, status, isDefault:false, mod, created, editor,
  parents:[{
    id:`seed-deposit-policy-${number}`, code:parentCode, name:parentName, status, isDefault:true, usedIn, mod, created, editor,
    lines, ...seededReferenceDetails(usedIn, number),
  }],
});
const seededCancellationGroup = ({ number, name, parentCode, parentName, status='Active', refundable=true, mod, created, editor='jane.doe@mvas.com', usedIn=0, bands }) => ({
  id:`seed-cancel-group-${number}`, type:'cancel', code:`CANC-GRP-${String(number).padStart(2, '0')}`, name, status, isDefault:false, isRefundable:refundable, mod, created, editor,
  parents:[{
    id:`seed-cancel-policy-${number}`, code:parentCode, name:parentName, status, isDefault:true, isRefundable:refundable, usedIn, mod, created, editor,
    bands, ...seededReferenceDetails(usedIn, number),
  }],
});

POLICIES_INIT.push(
  seededDepositGroup({ number:5, name:'Alaska 7-Night Standard', parentCode:'DEP-601', parentName:'Alaska Standard Deposit', mod:'13 Jun 2026', created:'21 May 2026', usedIn:6, lines:seededDepositLines({ holdDts:120, fullAmount:250 }) }),
  seededDepositGroup({ number:6, name:'Caribbean 4-Night Retail', parentCode:'DEP-602', parentName:'Short Cruise Retail Deposit', mod:'11 Jun 2026', created:'22 May 2026', editor:'admin@mvas.com', usedIn:8, lines:seededDepositLines({ holdDts:60, fullAmount:150 }) }),
  seededDepositGroup({ number:7, name:'Holiday Sailings', parentCode:'DEP-603', parentName:'Holiday Sailing Deposit', mod:'10 Jun 2026', created:'23 May 2026', usedIn:4, lines:seededDepositLines({ holdDts:120, holdPct:15, fullAmount:300 }) }),
  seededDepositGroup({ number:8, name:'Europe 10-Night Standard', parentCode:'DEP-604', parentName:'Europe Extended Voyage Deposit', mod:'09 Jun 2026', created:'24 May 2026', editor:'maria.santos@mvas.com', usedIn:3, lines:seededDepositLines({ holdDts:150, holdPct:15, fullAmount:400 }) }),
  seededDepositGroup({ number:9, name:'Loyalty Member Flex', parentCode:'DEP-605', parentName:'Margaritaville Rewards Deposit', mod:'08 Jun 2026', created:'25 May 2026', usedIn:7, lines:seededDepositLines({ holdDts:45, holdPct:5, fullAmount:125 }) }),
  seededDepositGroup({ number:10, name:'Group & Charter', parentCode:'DEP-606', parentName:'Group Contract Deposit', mod:'07 Jun 2026', created:'26 May 2026', editor:'operations@mvas.com', usedIn:2, lines:seededDepositLines({ holdDts:180, holdPct:20, fullAmount:500 }) }),
  seededDepositGroup({ number:11, name:'Last-Minute Retail', parentCode:'DEP-607', parentName:'Last-Minute Full Deposit', status:'Draft', mod:'06 Jun 2026', created:'27 May 2026', usedIn:0, lines:seededDepositLines({ holdDts:30, fullAmount:200 }) }),
  seededDepositGroup({ number:12, name:'World Cruise Extended', parentCode:'DEP-608', parentName:'Extended Voyage Deposit', status:'Inactive', mod:'05 Jun 2026', created:'28 May 2026', editor:'admin@mvas.com', usedIn:0, lines:seededDepositLines({ holdDts:240, holdPct:20, fullAmount:750 }) }),

  seededCancellationGroup({ number:3, name:'Flexible Retail', parentCode:'CANC-021', parentName:'Flexible Retail Cancellation', mod:'13 Jun 2026', created:'19 May 2026', usedIn:9, bands:seededCancellationBands({ freeDts:60, partialDts:30, pct:50 }) }),
  seededCancellationGroup({ number:4, name:'Early Saver', parentCode:'CANC-022', parentName:'Early Saver Non-Refundable', refundable:false, mod:'12 Jun 2026', created:'20 May 2026', editor:'admin@mvas.com', usedIn:6, bands:seededNonRefundableBands() }),
  seededCancellationGroup({ number:5, name:'Suites & Premium', parentCode:'CANC-023', parentName:'Premium Suite Cancellation', mod:'11 Jun 2026', created:'21 May 2026', usedIn:4, bands:seededCancellationBands({ freeDts:90, partialDts:45, pct:40 }) }),
  seededCancellationGroup({ number:6, name:'Holiday Flexible', parentCode:'CANC-024', parentName:'Holiday Sailing Cancellation', mod:'10 Jun 2026', created:'22 May 2026', usedIn:5, bands:seededCancellationBands({ freeDts:75, partialDts:30, pct:35 }) }),
  seededCancellationGroup({ number:7, name:'Group Contract', parentCode:'CANC-025', parentName:'Group Contract Cancellation', mod:'09 Jun 2026', created:'23 May 2026', editor:'operations@mvas.com', usedIn:3, bands:seededCancellationBands({ freeDts:120, partialDts:60, pct:25 }) }),
  seededCancellationGroup({ number:8, name:'Casino Offer', parentCode:'CANC-026', parentName:'Casino Guest Cancellation', mod:'08 Jun 2026', created:'24 May 2026', usedIn:7, bands:seededCancellationBands({ freeDts:30, partialDts:15, pct:50 }) }),
  seededCancellationGroup({ number:9, name:'Last-Minute', parentCode:'CANC-027', parentName:'Last-Minute Non-Refundable', refundable:false, mod:'07 Jun 2026', created:'25 May 2026', usedIn:4, bands:seededNonRefundableBands() }),
  seededCancellationGroup({ number:10, name:'Trade Partner', parentCode:'CANC-028', parentName:'Trade Partner Cancellation', mod:'06 Jun 2026', created:'26 May 2026', editor:'admin@mvas.com', usedIn:8, bands:seededCancellationBands({ freeDts:60, partialDts:21, pct:30 }) }),
  seededCancellationGroup({ number:11, name:'Resident Promotion', parentCode:'CANC-029', parentName:'Resident Offer Cancellation', status:'Draft', mod:'05 Jun 2026', created:'27 May 2026', usedIn:0, bands:seededCancellationBands({ freeDts:45, partialDts:14, pct:50 }) }),
  seededCancellationGroup({ number:12, name:'World Cruise', parentCode:'CANC-030', parentName:'Extended Voyage Cancellation', status:'Inactive', mod:'04 Jun 2026', created:'28 May 2026', editor:'admin@mvas.com', usedIn:0, bands:seededCancellationBands({ freeDts:180, partialDts:90, pct:25 }) }),
);

/* Stateroom applicability belongs to the parent policy. Existing seed data is migrated by
   taking the union of its legacy line/band coverage so the visible policy-level value is stable. */
POLICIES_INIT.forEach(group => group.parents.forEach(parent => { parent.cats = policyCatsOf(parent); }));

/* Adapters — the Farecode-assignment and booking-flow screens consume the older group shape. */
const scopeLegacyRows = (rows, policyCats) => {
  const allowed = catsCover(policyCats || []);
  return (rows || []).map(row => {
    const rowCoverage = catsCover(row.cats || ['All']);
    const scoped = CATS.filter(cat => allowed.includes(cat) && rowCoverage.includes(cat));
    return { ...row, cats:scoped.length === CATS.length ? ['All'] : scoped };
  });
};
const toLegacy = (policies, type) => policies.filter(g => g.type === type).map(g => ({
  ...g, isActive:g.status === 'Active',
  parents:g.parents.map(p => {
    const cats = policyCatsOf(p);
    return {
      ...p,
      cats,
      isActive:p.status === 'Active',
      ...(Array.isArray(p.lines) ? { lines:scopeLegacyRows(p.lines, cats) } : {}),
      ...(Array.isArray(p.bands) ? { bands:scopeLegacyRows(p.bands, cats) } : {}),
    };
  }),
}));

/* Full-chain validation for Activate on the merged Policy step. */
function chainIssues({ type, policies, groupId, groupName, parentName, policyCats, rows, isRefundable }) {
  const out = [];
  const nm = (groupName || '').trim().toLowerCase();
  if (!nm) out.push({ level:'error', text:'Group name is required.' });
  else if (policies.some(g => g.type === type && g.id !== groupId && g.status === 'Active' && g.name.trim().toLowerCase() === nm))
    out.push({ level:'error', text:`Another active ${POL_META[type].label.toLowerCase()} group is already named "${groupName}". Names must be unique.` });
  if (!(parentName || '').trim()) out.push({ level:'error', text:'Policy name is required.' });
  if (!policyCats?.length) out.push({ level:'error', text:'Stateroom coverage is required.' });
  if (!rows.length) out.push({ level:'error', text:`A policy needs at least one ${POL_META[type].childWord.toLowerCase()} before it can be activated.` });
  else {
    const v = validateRows(rows, { policyCoverage:policyCats || [] });
    if (Object.keys(v.cell).length) out.push({ level:'error', text:'Some rows have incomplete or out-of-range fields — highlighted above.' });
    else out.push(...v.issues);
  }
  if (type === 'cancel' && rows.length) out.push(...refundabilityIssues(rows, isRefundable !== false));
  return out;
}

Object.assign(window, {
  POL_META, POL_STATUS, POLICIES_INIT, dtsLabel, catSentence, depLabel, childCode,
  lineSummary, bandSummary, childSummary, kidsOf, normalizePolicyCats, policyCatsOf, usedInGroup, blankLine, blankBand, blankChild,
  toLegacy, chainIssues,
});
