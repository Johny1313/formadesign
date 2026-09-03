import fs from 'node:fs';
const html=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const checks=[
 ['Multi-selection group button exists', html.includes('id="groupSelectionBtn"')],
 ['Multi-selection ungroup button exists', html.includes('id="ungroupSelectionBtn"')],
 ['Group button uses existing group engine', html.includes("$('#groupSelectionBtn')?.addEventListener('click',groupSelected)")],
 ['Multi-selection panel is exposed only for multi select', html.includes("$('#multiSelectionPanel')?.classList.remove('hidden')") && html.includes("$('#multiSelectionPanel')?.classList.add('hidden')")],
 ['Unite pathfinder exists', html.includes('data-pathfinder="unite"')],
 ['Minus front pathfinder exists', html.includes('data-pathfinder="minusFront"')],
 ['Intersect pathfinder exists', html.includes('data-pathfinder="intersect"')],
 ['Exclude pathfinder exists', html.includes('data-pathfinder="exclude"')],
 ['Divide pathfinder exists', html.includes('data-pathfinder="divide"')],
 ['Trim pathfinder exists', html.includes('data-pathfinder="trim"')],
 ['Merge pathfinder exists', html.includes('data-pathfinder="merge"')],
 ['Crop pathfinder exists', html.includes('data-pathfinder="crop"')],
 ['Outline pathfinder exists', html.includes('data-pathfinder="outline"')],
 ['Minus back pathfinder exists', html.includes('data-pathfinder="minusBack"')],
 ['Closed vector compatibility gate exists', html.includes('function isPathfinderOperand(e)')],
 ['Pathfinder compound element exists', html.includes("if(type==='pathfinder')return")],
 ['Pathfinder supports nested results', html.includes("if(op.type==='pathfinder')")],
 ['Boolean mask renderer exists', html.includes('function pathfinderMaskCanvas(e,width=')],
 ['Pathfinder render canvas exists', html.includes('function drawPathfinderCanvas(canvas,e)')],
 ['Artboard renders pathfinder compounds', html.includes("if(e.type==='pathfinder'){content.style.background='transparent'")],
 ['Video and export render pathfinder compounds', html.includes("if(e.type==='pathfinder'){const pf=document.createElement('canvas')")],
 ['Pathfinder persists in migration', html.includes("if(e.type==='pathfinder'){e.pathfinderOperation=")],
 ['Divide requires exactly two forms', html.includes("if(items.length!==2){showToast('Dividir usa exatamente 2 formas por vez')")],
 ['Trim results are grouped', html.includes("}else if(operation==='trim'){const gid=groupUid()")],
 ['Merge results are grouped', html.includes("}else if(operation==='merge'){const groups=new Map()")],
 ['Outline results are grouped', html.includes("}else if(operation==='outline'){const gid=groupUid()")],
 ['Pathfinder layer icon exists', html.includes("e.type==='pathfinder'?'⊕'")],
 ['Pathfinder can be used as layer mask source', html.includes("if(source.type==='pathfinder'){const raster=pathfinderMaskCanvas")]
];
let failed=0;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);
console.log('GROUP_PATHFINDER_TEST: PASS');
