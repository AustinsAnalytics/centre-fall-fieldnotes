const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),D=JSON.parse(fs.readFileSync(path.join(root,'site/data/fall.json')));
const noop=()=>{}, element={innerHTML:'',textContent:'',value:'',addEventListener:noop,style:{},close:noop,showModal:noop};
const ctx={window:{FALL_DATA:D,addEventListener:noop,scrollTo:noop},document:{getElementById:()=>({...element}),querySelector:()=>({...element}),addEventListener:noop},location:{hash:''},console,URL,Blob,setTimeout};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'site/replay.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'site/workbench.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'site/season.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(root,'site/app.js'),'utf8'),ctx);
const E=ctx.window.FALL_ENGINE;let count=0;function check(b,msg){assert.ok(b,msg);count++;console.log('PASS',msg)}
const l=E.line(D.pitches);check(l.P===1521&&l.PA===385&&l.H===93&&l.AB===300,'JS totals match independent export totals');check(l.OBP===177/385,'JS OBP denominator includes SF');check(l.BIP===214&&l.EVn===162,'JS contact gates match Python');
let parts=D.summary.sessions.map(s=>E.line(D.pitches.filter(r=>r.session===s)));
for(let k of ['P','PA','H','AB','BB','K','HBP','SF','EVn','BIP','sw','wh'])check(parts.reduce((s,r)=>s+r[k],0)===l[k],`Session partition reconciles ${k}`);
for(let key of ['pitcher','batter']){let groups=[...new Set(D.pitches.map(r=>r[key]))].map(n=>E.line(D.pitches.filter(r=>r[key]===n)));for(let k of ['P','PA','H','BB','K'])check(groups.reduce((s,r)=>s+r[k],0)===l[k],`${key} partition reconciles ${k}`)}
vm.runInContext("S.competition='intrasquad';S.repeat='omit'",ctx);check(E.line(E.rows()).PA===202&&E.line(E.rows()).H===53&&E.line(E.rows()).BB===36,'Repeated-event toggle removes one double and one walk');
vm.runInContext("S.repeat='keep';S.start='zero'",ctx);check(E.line(E.rows()).PA===201,'Zero-start filter gives 201 completed PAs');
let z=E.line([]);check(z.OBP===null&&z.Whiff===null&&z.EV===null,'Empty denominators remain missing, not zero');
vm.runInContext("S.competition='all';S.start='all';S.query='';S.session='all'",ctx);
for(let page of ['overview','games','pitching','hitting','fielding','replay','findings','players','lab','audit','method']){ctx.location.hash='#'+page;check(vm.runInContext(`pages['${page}']()`,ctx).length>100,`Route ${page} renders`)}
for(let p of D.players){ctx.location.hash='#player/'+encodeURIComponent(p.name);check(vm.runInContext('player()',ctx).includes(p.display),`Player route: ${p.display}`)}
// Scope, pagination and final-decision regressions.
vm.runInContext("S.squad='CEN_COL';S.competition='intrasquad';S.pitcher='Cowdrey, Harrison';S.query='Cowdrey'",ctx);
check(vm.runInContext("selected(rows(),'pitcher').length",ctx)===48,'Selected pitcher applies to charts and table source');
check(!vm.runInContext('pitchers()',ctx).includes('>Carson Waddle ↗'),'Selected pitcher table does not leak the entire staff');
vm.runInContext("S.pitcher='all';S.query='';S.page=17",ctx);
let finalPage=vm.runInContext('lab()',ctx);check(finalPage.includes('851–854 of 854 records'),'Last four pitch records accessible through pagination');
vm.runInContext("S.session='2026-10-08'",ctx);check(vm.runInContext('lab()',ctx).includes('151–183 of 183 records'),'Pagination clamps when a sample shrinks');
vm.runInContext("S.session='all';S.page=0;S.audit='Limited'",ctx);let limited=vm.runInContext('audit()',ctx);check(limited.includes('1–2 of 2 records')&&limited.includes('Harrison Cowdrey')&&limited.includes('Tommy Severson'),'Limited evidence filter shows the two adjudicated records');
vm.runInContext("S.audit='all';S.query='Cowdrey, Harrison'",ctx);check(vm.runInContext('players()',ctx).includes('Harrison Cowdrey'),'Search accepts surname, first-name format');
vm.runInContext("S.query=''",ctx);
check(D.pitches.every(r=>['Retained','Corrected'].includes(r.status)&&r.decisionReason&&r.evidence),'Every app pitch has a completed decision and rationale');
check(D.audit.length===1524&&D.pitches.filter(r=>r.status==='Corrected').length===82,'App contains all 1524 decisions and 82 eligible corrections');
check(!vm.runInContext('legend()',ctx).includes('Unresolved'),'Player-facing legend has only assigned pitch families');
const locSVG=vm.runInContext("scatter([{uid:'test',pitcher:'Test, Pitcher',batter:'Test, Hitter',session:'2026-10-08',no:1,px:1,pz:2.5,loc:true,type:'Fastball',status:'Retained',evidence:'Strong'}],'px','pz')",ctx);
let cx=Number(locSVG.match(/data-pitch="test" cx="([^"]+)/)[1]);check(cx<283,'Positive raw plate side appears left of center in catcher view');check(!/width="-/.test(locSVG),'Mirrored zone has a positive rectangle width');
ctx.location.hash='#player/%';check(vm.runInContext('player()',ctx).includes('invalid'),'Malformed player links give a readable recovery state');
ctx.location.hash='#player/'+encodeURIComponent('Johnson, Graham');let catcherPage=vm.runInContext('player()',ctx);check(catcherPage.includes('Behind the plate.')&&catcherPage.includes('436'),'Catcher profile includes defensive exposure and throw coverage');
vm.runInContext("S.session='2026-10-08'",ctx);check(!vm.runInContext('sessionTable()',ctx).includes('Oct 9'),'Session ledger displays only the selected date');vm.runInContext("S.session='all'",ctx);
// Poster and insight evidence: recompute rather than accepting display copy.
const ins=D.insights.find(x=>x.id==='separation'),pair=D.pairs.find(p=>p.release<6);let a=D.pitches.filter(r=>r.pitcher===pair.pitcher&&r.type===pair.a&&r.hb!==null&&r.ivb!==null),b=D.pitches.filter(r=>r.pitcher===pair.pitcher&&r.type===pair.b&&r.hb!==null&&r.ivb!==null);let mean=(r,k)=>r.reduce((s,p)=>s+p[k],0)/r.length;let gap=Math.hypot(mean(a,'hb')-mean(b,'hb'),mean(a,'ivb')-mean(b,'ivb'));check(gap.toFixed(1)===ins.metric.replace('\"','')&&a.length===pair.na&&b.length===pair.nb,'Poster shape gap reconciles to measured rows');
fs.writeFileSync(path.join(root,'audit/app_verification.json'),JSON.stringify({passed:count,failed:0,team:l},null,2));console.log('ALL',count,'APP CHECKS PASSED');
let csvBlob=null;ctx.URL={createObjectURL:b=>{csvBlob=b;return'blob:test'},revokeObjectURL:noop};ctx.document.createElement=()=>({click:noop,remove:noop});ctx.document.body={appendChild:noop};ctx.setTimeout=noop;
vm.runInContext("S.competition='all';S.labRole='all';S.session='all';S.query='';S.start='all';S.repeat='keep';S.pitcher='all';S.type='all';S.hand='all';exportCSV('lab')",ctx);
csvBlob.text().then(async csv=>{check(csv.split('\r\n').length===1522,'CSV exporter serializes 1521 data rows plus header');check(csv.includes('"Waddle, Carson"')&&csv.includes('"uid"'),'CSV quotes comma-containing names and includes source IDs');vm.runInContext("S.pitcher='Cowdrey, Harrison';exportCSV('pitching')",ctx);let one=await csvBlob.text();check(one.split('\r\n').length===2&&one.includes('Cowdrey, Harrison')&&!one.includes('Waddle, Carson'),'Pitching CSV contains only the selected pitcher');
vm.runInContext("S.batter='Rygalski, Evan';exportCSV('hitting')",ctx);let hit=await csvBlob.text();check(hit.split('\r\n').length===2&&hit.includes('Rygalski, Evan'),'Hitting CSV contains only the selected hitter');
vm.runInContext("S.pitcher='all';S.type='Cutter';S.hand='Left';exportCSV('lab')",ctx);let sub=await csvBlob.text();check(sub.split('\r\n').length===D.pitches.filter(r=>r.type==='Cutter'&&r.bats==='Left').length+1,'Pitch-lab CSV obeys type and batter-side filters');
fs.writeFileSync(path.join(root,'audit/app_verification.json'),JSON.stringify({passed:count,failed:0,team:l},null,2));console.log('ALL',count,'APP CHECKS PASSED INCLUDING CSV');});
