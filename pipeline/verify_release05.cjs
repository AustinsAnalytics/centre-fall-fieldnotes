// New competition, terminal-pitch accounting and publication regressions.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'..'),D=JSON.parse(fs.readFileSync(path.join(root,'site/data/fall.json'))),noop=()=>{};
const el={innerHTML:'',textContent:'',value:'',addEventListener:noop,style:{},close:noop,showModal:noop};
const ctx={window:{FALL_DATA:D,addEventListener:noop,scrollTo:noop},document:{getElementById:()=>({...el}),querySelector:()=>({...el}),addEventListener:noop},location:{hash:''},console,URL,Blob,setTimeout:noop};vm.createContext(ctx);
for(const file of ['replay.js','workbench.js','season.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,'site',file),'utf8'),ctx);
const run=s=>vm.runInContext(s,ctx),checks=[];function check(c,m){assert.ok(c,m);checks.push(m)}
for(const squad of ['CEN_COL','LIN_WIL1'])for(const competition of ['all','intrasquad','scrimmage'])for(const session of ['all',...D.summary.sessions]){
 run(`Object.assign(S,DEFAULTS,{squad:${JSON.stringify(squad)},competition:${JSON.stringify(competition)},session:${JSON.stringify(session)}})`);
 const expected=D.pitches.filter(r=>(session==='all'||r.session===session)&&(competition==='all'||D.sessions.find(s=>s.id===r.session).competition===competition));
 for(const [fn,key]of [['pitchingRows','pitcherTeam'],['hittingRows','batterTeam']]){
  const wanted=expected.filter(r=>r[key]===squad),ids=new Set(wanted.map(r=>r.uid));
  const scored=D.pas.filter(p=>ids.has(p.rows.at(-1))&&!['Incomplete','Unscored'].includes(p.event));
  check(JSON.stringify(run(fn+'().map(r=>r.uid)'))===JSON.stringify(wanted.map(r=>r.uid)),`${squad}/${competition}/${session}/${fn}: exact pitch population`);
  check(run(`line(${fn}()).PA`)===scored.length,`${squad}/${competition}/${session}/${fn}: PA outcomes follow terminal pitches`);
 }
 for(const page of ['overview','games','pitching','hitting','fielding','replay','players','lab','audit','method']){
  ctx.location.hash='#'+page;const html=run(`pages.${page}()`);check(html.length>100&&!/\bNaN\b|\bundefined\b/.test(html),`${squad}/${competition}/${session}/${page}: renders empty or populated scope safely`);
 }
}
run('Object.assign(S,DEFAULTS)');
check(run('pitchingRows().length')===1192&&run('hittingRows().length')===1183,'Default Centre populations: 1192 thrown, 1183 seen');
check(run('line(hittingRows()).PA')===302&&run('line(hittingRows()).AB')===236&&run('line(hittingRows()).H')===78,'Centre batting: 302 scored PA, 78/236');
check(run("teamPlayers().length")===36,'Centre directory contains 36 players');
run("S.squad='LIN_WIL1'");check(run('teamPlayers().length')===18,'Opponent directory contains 18 players');
const shared=D.pas.find(p=>p.session==='2026-10-24-g1'&&p.end===104);check(new Set(shared.rows.map(u=>D.pitches.find(p=>p.uid===u).pitcher)).size===2,'Pitcher-change source sequence spans Slechter and Carr');
ctx.shared=shared;check(run("pas(D.pitches.filter(r=>r.pitcher==='Slechter, Logan')).some(p=>p.id===shared.id)")===false,'Slechter pitches do not duplicate the later completed BF');check(run("pas(D.pitches.filter(r=>r.pitcher==='Carr, Aidan')).some(p=>p.id===shared.id)")===true,'Carr terminal pitch owns the completed recorded BF');
const u=D.pitches.find(r=>r.sessionName==='LW 2'&&r.no===317);ctx.unscored=u;check(run('line([unscored]).PA')===1&&run('line([unscored]).AB')===1&&run('line([unscored]).BIP')===1&&run('line([unscored]).EVn')===1,'User-confirmed single contributes one PA/AB plus measured contact');
run("Object.assign(S,DEFAULTS,{competition:'scrimmage'})");check(run('rows().length')===667,'LW games add 667 eligible pitches');
check(run("date('2026-10-24-g1')!==date('2026-10-24-g2')"),'Doubleheader labels distinct');
for(const id of ['game-shape','opponent-decisions'])check(D.insights.find(i=>i.id===id).uids.every(u=>D.pitches.some(p=>p.uid===u)),id+': source evidence exists');
fs.writeFileSync(path.join(root,'audit/release05_app_verification.json'),JSON.stringify({passed:checks.length,failed:0,checks},null,2));console.log(checks.length+' RELEASE 05 APP CHECKS PASSED');
