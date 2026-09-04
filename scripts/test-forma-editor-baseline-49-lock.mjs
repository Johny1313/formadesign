import fs from 'node:fs';
const ui=fs.readFileSync(new URL('../public/design/index.html',import.meta.url),'utf8');
const chart=fs.readFileSync(new URL('../public/design/chart-studio.html',import.meta.url),'utf8');
const checks=[
 ['Canvas remains present', ui.includes('id="artboard"') || ui.includes('class="artboard"')],
 ['Projects remain present', ui.includes('data-panel="projects"') && ui.includes('id="saveProjectBtn"')],
 ['Templates remain present', ui.includes('data-panel="templates"') && ui.includes('id="saveTemplateBtn"')],
 ['Rich text remains present', ui.includes('function sanitizeRichTextHtml') && ui.includes('function applyRichTextSelectionStyle')],
 ['Clipboard remains present', ui.includes("key==='c'") && ui.includes("key==='v'") && ui.includes('copySelectedToClipboard') && ui.includes('pasteClipboardToBoard')],
 ['Grouping remains present', ui.includes("key==='g'") && ui.includes('function groupSelected()') && ui.includes('function ungroupSelected()')],
 ['Ctrl J duplicate remains present', ui.includes("key==='j'") && ui.includes('duplicateSelected()')],
 ['Alt drag duplicate remains present', ui.includes('isAltDragDuplicable') && ui.includes('materializeAltDragDuplicate')],
 ['Layer masks remain present', ui.includes('layerMaskEnabled') && ui.includes("destination-in") && ui.includes("destination-out")],
 ['Pathfinder remains present', ui.includes('data-pathfinder="unite"') && ui.includes('function applyPathfinder(operation)')],
 ['Pen tool remains present', ui.includes('id="penToolBtn"') && ui.includes('function finishPenDrawing()')],
 ['GIF support remains present', ui.includes('decodeAnimatedGifAsset')],
 ['Free image bank remains present', ui.includes('data-panel="freebank"') && ui.includes('freeBankSearch')],
 ['Chart Studio remains present', ui.includes('data-panel="charts"') && chart.includes('CHART STUDIO')],
 ['Video export remains present', ui.includes('async function boardVideoBlob')],
 ['Export formats remain present', ui.includes('webm-transparent') && ui.includes('h264') && ui.includes('png-transparent')],
 ['Alignment remains present', ui.includes('alignSelection') && ui.includes('distributeSelection')],
 ['Undo remains present', ui.includes('undo()') && ui.includes('redo()')]
];
let failed=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} | ${name}`);if(!ok)failed++;}
if(failed)process.exit(1);console.log('FORMA_EDITOR_BASELINE_49_LOCK_TEST: PASS');
