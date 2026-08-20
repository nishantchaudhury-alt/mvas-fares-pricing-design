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
const depLabel = r => r.depositType === 'PCT' ? `${r.amount || '—'}% of fare` : `${money(r.amount)} ${r.depositType === 'FP' ? 'per pax' : 'per cabin'}`;
const childCode = (parentCode, i) => `${String(parentCode).replace(/^[A-Z]+-/, '')}.${i + 1}`;
const lineSummary = r => [r.marketingName || 'Untitled line', `DTS ${dtsLabel(r)}`, depLabel(r), catSentence(r.cats || [])].join(' · ') + (r.cancelApplies ? ' · cancellation applies' : '');
const bandSummary = r => [`DTS ${dtsLabel(r)}`, penAmountLabel(r), catSentence(r.cats || [])].join(' · ');
const childSummary = (type, r) => type === 'deposit' ? lineSummary(r) : bandSummary(r);
const kidsOf = p => p.lines || p.bands || [];
const usedInGroup = g => g.parents.reduce((s, p) => s + (p.usedIn || 0), 0);
const blankLine = () => ({ marketingName:'', beginDts:'', endDts:'', depositType:'FC', amount:'', cats:['All'], cancelApplies:true });
const blankBand = () => ({ beginDts:'', endDts:'', penaltyType:'PCT_CABIN_FARE', penaltyValue:'', cats:['All'] });
const blankChild = type => type === 'deposit' ? blankLine() : blankBand();

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
        ], usedInFaretypes:[], usedInFarecodes:[] },
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
        lines:[], usedInFaretypes:[], usedInFarecodes:[] },
    ]},
  { id:'g5', type:'deposit', code:'DEP-GRP-03', name:'Legacy Group Bookings', status:'Inactive', isDefault:false, mod:'02 Jun 2026', created:'15 May 2026', editor:'admin@mvas.com',
    parents:[
      { id:'p6', code:'DEP-880', name:'Group Hold Deposit', status:'Inactive', isDefault:true, usedIn:0, mod:'02 Jun 2026', created:'15 May 2026', editor:'admin@mvas.com',
        lines:[{ marketingName:'Group Hold', beginDts:'', endDts:0, depositType:'FC', amount:500, cats:['All'], cancelApplies:true }],
        usedInFaretypes:[], usedInFarecodes:[] },
    ]},
];

/* Adapters — the Farecode-assignment and booking-flow screens consume the older group shape. */
const toLegacy = (policies, type) => policies.filter(g => g.type === type).map(g => ({
  ...g, isActive:g.status === 'Active',
  parents:g.parents.map(p => ({ ...p, isActive:p.status === 'Active', lines:p.lines, bands:p.bands })),
}));

/* Full-chain validation for Activate (1.2 Step 3). */
function chainIssues({ type, policies, groupId, groupName, parentName, rows, isRefundable }) {
  const out = [];
  const nm = (groupName || '').trim().toLowerCase();
  if (!nm) out.push({ level:'error', text:'Group name is required.' });
  else if (policies.some(g => g.type === type && g.id !== groupId && g.status === 'Active' && g.name.trim().toLowerCase() === nm))
    out.push({ level:'error', text:`Another active ${POL_META[type].label.toLowerCase()} group is already named "${groupName}". Names must be unique.` });
  if (!(parentName || '').trim()) out.push({ level:'error', text:'Policy name is required.' });
  if (!rows.length) out.push({ level:'error', text:`A policy needs at least one ${POL_META[type].childWord.toLowerCase()} before it can be activated.` });
  else {
    const v = validateRows(rows);
    if (Object.keys(v.cell).length) out.push({ level:'error', text:'Some rows have incomplete or out-of-range fields — highlighted above.' });
    else out.push(...v.issues);
  }
  if (type === 'cancel' && rows.length) out.push(...refundabilityIssues(rows, isRefundable !== false));
  return out;
}

Object.assign(window, {
  POL_META, POL_STATUS, POLICIES_INIT, dtsLabel, catSentence, depLabel, childCode,
  lineSummary, bandSummary, childSummary, kidsOf, usedInGroup, blankLine, blankBand, blankChild,
  toLegacy, chainIssues,
});
