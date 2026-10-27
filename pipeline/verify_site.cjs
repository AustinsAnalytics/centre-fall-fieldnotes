const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),site=path.join(root,'site'),D=JSON.parse(fs.readFileSync(path.join(site,'data/fall.json')));
let n=0;const check=(v,m)=>{assert.ok(v,m);n++};
const html=fs.readFileSync(path.join(site,'index.html'),'utf8');
for(const [,asset]of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
 check(!asset.startsWith('/'),'Asset uses project-relative path: '+asset);
 check(fs.existsSync(path.join(site,asset)),'Asset exists: '+asset);
}
for(const file of ['app.js','season.js','replay.js','workbench.js','data/fall.js'])new vm.Script(fs.readFileSync(path.join(site,file),'utf8'),{filename:file});
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(site,'data/fall.js'),'utf8'),ctx);
check(JSON.stringify(ctx.window.FALL_DATA)===JSON.stringify(D),'JSON download and JS runtime dataset match exactly');
check(D.pitches.length===1521&&D.audit.length===1524,'Expected release snapshot scope');
check(fs.readFileSync(path.join(site,'poster.pdf')).subarray(0,5).toString()==='%PDF-','Poster is a PDF');
check(fs.existsSync(path.join(site,'.nojekyll')),'GitHub static marker exists');
for(const file of ['count_discontinuities.csv','pitch_classification.csv','plate_appearances.csv','record_repairs.csv'])check(fs.statSync(path.join(site,'data',file)).size>100,'Download exists: '+file);
check(!html.includes('http://')&&!html.includes('https://'),'Entry page uses no remote scripts, fonts or styles');
console.log(`${n} SITE PUBLICATION CHECKS PASSED`);
