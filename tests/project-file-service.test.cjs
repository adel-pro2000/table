const { test } = require('node:test');
const assert = require('node:assert/strict');
const files = require('../project-file-service.js');
const limits = { version: 8 };

function project() {
  return { kind: 'oil-filters-project', version: 7, workbook: {
    activeSheetId: 'sheet-3', nextSheetId: 4,
    sheets: ['МАСЛЯНЫЕ ФИЛЬТРЫ', 'СВЕЧИ', 'Воздушные фильтры'].map((name, i) => ({
      id: `sheet-${i + 1}`, name, snapshot: { rows: 1500,
        data: { [i]: ['Бренд', `00${i}`, `${i + 1}`, `00123${i}`, 'Кросс\nЕщё', 'Авто', '3/4'] },
        rowMeta: { [i]: { itemId: `item-${i}` } }, merges: [], nextMasterId: 1 }
    })) }, stock: { revision: 2, movements: [{ id: 'movement' }] },
    inventory: { activeSessionId: null, sessions: [{ id: 'inventory', status: 'applied' }] },
    changeHistory: [{ sheetId: 'sheet-3', sheetName: 'Воздушные фильтры', changes: [] }] };
}

function handle(text, options = {}) {
  const disk = { text, opens: 0, commits: 0, aborts: 0 };
  return { name: 'test.json', disk,
    isSameEntry: async other => other.disk === disk,
    getFile: async () => ({ text: async () => disk.text }),
    createWritable: async () => {
      disk.opens++;
      let pending;
      return {
        write: async text => { pending = text; if (options.onWrite) await options.onWrite(disk); },
        close: async () => { if (options.failClose) throw Error('disk full'); disk.text = pending; disk.commits++; },
        abort: async () => { disk.aborts++; }
      };
    }
  };
}

test('old JSON without sheetCount transfers all three names, cells, IDs and journals unchanged', async () => {
  const p = project(), text = JSON.stringify(p);
  const source = await files.read({ text: async () => text }, limits);
  assert.deepEqual(source.payload, p);
  const destination = handle('');
  await files.write(destination, source.text);
  assert.deepEqual((await files.read(await destination.getFile(), limits)).payload, p);
  assert.equal(destination.disk.commits, 1);
});

test('opening JSON does not open a writer or change the source bytes', async () => {
  const original = '\uFEFF' + JSON.stringify(project(), null, 2);
  const file = handle(original);
  const read = await files.read(await file.getFile(), limits);
  assert.equal(read.text, original);
  assert.equal(read.payload.workbook.sheets.length, 3);
  assert.equal(file.disk.text, original);
  assert.equal(file.disk.opens, 0);
});

for (const scenario of ['count', 'count-one', 'count-no-book', 'broken-sheet', 'unknown-snapshot', 'empty-book', 'duplicate-id', 'future', 'truncated-rows', 'truncated-columns', 'bad-json']) {
  test(`${scenario}: reject the complete import instead of dropping sheets or data`, async () => {
    const p = project();
    if (scenario === 'count') p.sheetCount = 4;
    if (scenario === 'count-one') p.sheetCount = 1;
    if (scenario === 'count-no-book') { delete p.workbook; p.sheetCount = 3; p.data = []; }
    if (scenario === 'broken-sheet') p.workbook.sheets[1] = null;
    if (scenario === 'unknown-snapshot') p.workbook.sheets[1].snapshot = { cells: ['lost'] };
    if (scenario === 'empty-book') { p.workbook.sheets = []; p.data = []; }
    if (scenario === 'duplicate-id') p.workbook.sheets[1].id = p.workbook.sheets[0].id;
    if (scenario === 'future') p.version = 999;
    if (scenario === 'truncated-rows') p.workbook.sheets[2].snapshot.data[1500] = ['lost'];
    if (scenario === 'truncated-columns') p.workbook.sheets[2].snapshot.data[0] = Array(8).fill('lost');
    const text = scenario === 'bad-json' ? '{' : JSON.stringify(p);
    const file = handle(text);
    await assert.rejects(files.read(await file.getFile(), limits));
    assert.equal(file.disk.opens, 0);
    assert.equal(file.disk.text, text);
  });
}

test('historical single-sheet array, structured and HTML snapshots remain readable', async () => {
  for (const payload of [{ data: [['A', '001', '2']] }, { snapshot: { data: { 0: ['B'] } } },
    { snapshot: { rows: 5, tbodyHtml: '<tr><td>old</td></tr>' } }]) {
    assert.deepEqual((await files.read({ text: async () => JSON.stringify(payload) }, limits)).payload, payload);
  }
});

test('refuse to overwrite a file replaced by another computer', async () => {
  const file = handle('latest from other computer');
  await assert.rejects(files.write(file, 'old table', { handle: file, text: 'old file' }), /изменён/);
  assert.equal(file.disk.text, 'latest from other computer');
  assert.equal(file.disk.opens, 0);
});

test('Save As cannot bypass conflict detection by choosing the same file again', async () => {
  const file = handle('external change');
  const oldHandle = { disk: file.disk };
  await assert.rejects(files.write(file, 'old table', { handle: oldHandle, text: 'old file' }), /изменён/);
  assert.equal(file.disk.opens, 0);
});

test('a change during writing aborts the temporary write and preserves external changes', async () => {
  const file = handle('before', { onWrite: disk => { disk.text = 'external change'; } });
  await assert.rejects(files.write(file, 'my edits', { handle: file, text: 'before' }), /изменён/);
  assert.equal(file.disk.text, 'external change');
  assert.equal(file.disk.aborts, 1);
  assert.equal(file.disk.commits, 0);
});

test('disk failure aborts and leaves the original file intact', async () => {
  const file = handle('before', { failClose: true });
  await assert.rejects(files.write(file, 'after', { handle: file, text: 'before' }), /disk full/);
  assert.equal(file.disk.text, 'before');
  assert.equal(file.disk.aborts, 1);
});

test('Save As to a separate file leaves the source untouched', async () => {
  const source = handle('original'), target = handle('');
  await files.write(target, 'edited copy', { handle: source, text: 'original' });
  assert.equal(source.disk.text, 'original');
  assert.equal(target.disk.text, 'edited copy');
});
