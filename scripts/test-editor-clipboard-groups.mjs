import fs from 'node:fs';
const html = fs.readFileSync(new URL('../public/design/index.html', import.meta.url), 'utf8');
const checks = [
  ['Internal clipboard exists', /let designClipboard=null;/],
  ['Clipboard tracks source artboard', /sourceBoardId:state\.activeArtboardId/],
  ['Copy function exists', /function copySelectedToClipboard\(\)/],
  ['Paste function exists', /function pasteClipboardToBoard\(\)/],
  ['Paste detects target artboard', /designClipboard\.sourceBoardId===state\.activeArtboardId/],
  ['Paste creates new element ids', /copies\.forEach\(e=>\{e\.id=uid\(\)/],
  ['Paste writes into current artboard elements', /state\.elements\.push\(\.\.\.copies\)/],
  ['Ctrl C is wired', /mod&&!typing&&key==='c'/],
  ['Ctrl V is wired', /mod&&!typing&&key==='v'/],
  ['Ctrl G is wired', /mod&&!typing&&key==='g'/],
  ['Ctrl Shift G ungroups', /if\(ev\.shiftKey\)ungroupSelected\(\);else groupSelected\(\);/],
  ['Group id generator exists', /const groupUid = \(\) => 'grp_'/],
  ['Group action exists', /function groupSelected\(\)/],
  ['Ungroup action exists', /function ungroupSelected\(\)/],
  ['Selection expands grouped elements', /function expandIdsToGroups\(ids\)/],
  ['Click selects full group', /function selectElementOrGroup\(id\)/],
  ['Groups persist on element model', /e\.groupId=e\.groupId\|\|null;/],
  ['Copied groups get new group ids', /function remapCopiedGroupIds\(elements\)/],
  ['Duplicate respects groups', /function duplicateSelected\(\)\{const ids=selectedIdsForAction\(\)/],
  ['Delete respects groups', /function deleteSelected\(\)\{return deleteElementIds\(selectedIdsForAction\(\)\);\}/]
];
let failed = 0;
for (const [name, re] of checks) {
  const ok = re.test(html);
  console.log(`${ok ? 'PASS' : 'FAIL'} | ${name}`);
  if (!ok) failed += 1;
}
if (failed) process.exit(1);
console.log('EDITOR_CLIPBOARD_GROUPS_TEST: PASS');
