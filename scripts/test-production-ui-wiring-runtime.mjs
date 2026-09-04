import fs from 'node:fs';
const ui=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const newColorStart=ui.indexOf('function newColorTemplate(){');
const newColorEnd=ui.indexOf('\n  }',newColorStart);
const stateIndex=ui.indexOf('const formaProductionState=');
const wireIndex=ui.indexOf('formaProductionCreate.onclick=createFormaProductionJob');
const checks=[
 ['newColorTemplate exists',newColorStart>=0],
 ['newColorTemplate closes before Production state',newColorEnd>=0&&stateIndex>newColorEnd],
 ['Production state is not nested inside newColorTemplate',stateIndex>newColorEnd],
 ['Produce button wiring exists',wireIndex>stateIndex],
 ['Runtime status is visible',ui.includes('id="formaProductionRuntimeStatus"')],
 ['Runtime health check exists',ui.includes('function checkFormaProductionRuntime()')],
 ['Stateless fallback route is wired',ui.includes("'/api/forma/production/run'")],
 ['Production wiring initializes on normal load',ui.includes('checkFormaProductionRuntime().finally(()=>loadFormaProductionJobs({silent:true}))')]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);console.log('PRODUCTION_UI_WIRING_RUNTIME_TEST: PASS');
