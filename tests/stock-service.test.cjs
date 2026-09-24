const { test } = require('node:test');
const assert = require('node:assert/strict');
const service = require('../stock-service.js');

function fixture() {
  return {
    kind: 'oil-filters-project', version: 8, columns: ['Бренд', 'Артикул', 'Кол-во', 'Штрих-код', 'Кросы', 'Автомобиль', 'Диаметр резьбы'],
    workbook: { activeSheetId: 'one', nextSheetId: 3, sheets: [
      { id: 'one', name: 'Фильтры', snapshot: { rows: 1500, data: { 0: ['MANN', 'A', '10', '00123', 'Кросс\nЕщё', 'Toyota', '3/4'] }, rowMeta: { 0: { itemId: 'a' } }, merges: [], nextMasterId: 5 } },
      { id: 'two', name: 'Свечи', snapshot: { rows: 1500, data: { 7: ['NGK', 'B', '3', '00999', '', '', ''], 8: ['DUP', 'C', '0', '00123', '', '', ''] }, rowMeta: { 7: { itemId: 'b' }, 8: { itemId: 'c' } }, merges: [], nextMasterId: 1 } }
    ] }, inventory: { sessions: [{ id: 'finished', status: 'applied', lines: [] }], activeSessionId: null },
    stock: { revision: 15, movements: [{ id: 'old', type: 'receipt', delta: 3 }] }, changeHistory: [{ id: 'history' }]
  };
}
function options(project, extra = {}) {
  return { workbook: project.workbook, stock: project.stock,
    operation: { sheetId: 'two', itemId: 'b', delta: -2, type: 'writeoff', reason: 'Продажа', barcode: '00999', source: 'barcode' },
    isLocked: () => false, normalizeBarcode: String, createId: () => 'new-movement', persist: () => true, syncRow: () => {}, ...extra };
}
test('sale on another sheet preserves JSON structure, IDs, all other cells, history and inventory', () => {
  const project = fixture(); const expected = structuredClone(project);
  const movement = service.commit(options(project));
  expected.workbook.sheets[1].snapshot.data[7][2] = '1';
  expected.stock.revision++; expected.stock.movements.push(movement);
  assert.deepEqual(JSON.parse(JSON.stringify(project)), expected);
  assert.equal(project.workbook.activeSheetId, 'one');
  assert.equal(movement.sheetId, 'two'); assert.equal(movement.quantityBefore, 3); assert.equal(movement.quantityAfter, 1);
});
test('manual receipt without a barcode adds quantity to the selected identity', () => {
  const p = fixture(); const o = options(p);
  o.operation = { sheetId: 'two', itemId: 'c', delta: 4, type: 'receipt', reason: 'Оприходование', source: 'manual' };
  service.commit(o);
  assert.equal(p.workbook.sheets[1].snapshot.data[8][2], '4');
});
test('search includes inactive sheets, duplicate codes and leading zeros', () => {
  const rows = service.products(fixture().workbook);
  assert.equal(rows.filter(row => row.barcode === '00123').length, 2);
  assert.equal(rows.find(row => row.barcode === '00999').sheetId, 'two');
});
test('identity survives moving the row after search', () => {
  const p = fixture(); const snap = p.workbook.sheets[1].snapshot;
  snap.data[20] = snap.data[7]; snap.rowMeta[20] = snap.rowMeta[7]; delete snap.data[7]; delete snap.rowMeta[7];
  service.commit(options(p)); assert.equal(snap.data[20][2], '1');
});
for (const scenario of ['overdraft', 'fraction', 'unsafe', 'invalid-current', 'changed-code', 'missing-id', 'duplicate-id', 'merged-quantity', 'overflow', 'inventory', 'save-failed']) {
  test(`${scenario}: rejected without losing or changing any JSON data`, () => {
    const p = fixture(); const o = options(p);
    if (scenario === 'overdraft') o.operation.delta = -4;
    if (scenario === 'fraction') o.operation.delta = -1.5;
    if (scenario === 'unsafe') o.operation.delta = -Number.MAX_SAFE_INTEGER - 1;
    if (scenario === 'invalid-current') p.workbook.sheets[1].snapshot.data[7][2] = '=2+1';
    if (scenario === 'changed-code') o.operation.barcode = 'different';
    if (scenario === 'missing-id') o.operation.itemId = 'gone';
    if (scenario === 'duplicate-id') p.workbook.sheets[1].snapshot.rowMeta[8].itemId = 'b';
    if (scenario === 'merged-quantity') p.workbook.sheets[1].snapshot.merges = [{row:7,col:1,rowSpan:2,colSpan:2}];
    if (scenario === 'overflow') { p.workbook.sheets[1].snapshot.data[7][2]=String(Number.MAX_SAFE_INTEGER);o.operation.delta=1;o.operation.type='receipt'; }
    if (scenario === 'inventory') o.isLocked = () => true;
    if (scenario === 'save-failed') o.persist = () => false;
    const before = JSON.stringify(p);
    assert.throws(() => service.commit(o)); assert.equal(JSON.stringify(p), before);
  });
}
test('rollback restores a snapshot replaced by serialization, including blank quantity', () => {
  const p = fixture(); p.workbook.sheets[1].snapshot.data[7][2] = '';
  const o = options(p); o.operation.type = 'receipt'; o.operation.delta = 2;
  o.persist = () => { p.workbook.sheets[1].snapshot = structuredClone(p.workbook.sheets[1].snapshot); return false; };
  const before = JSON.stringify(p); assert.throws(() => service.commit(o)); assert.equal(JSON.stringify(p), before);
});
test('integer balances written by older versions remain usable', () => {
  for (const spelling of ['3', '+3', '3.0', '3,0', '003', ' 3 ']) {
    const p=fixture();p.workbook.sheets[1].snapshot.data[7][2]=spelling;
    service.commit(options(p));assert.equal(p.workbook.sheets[1].snapshot.data[7][2],'1');
  }
});
