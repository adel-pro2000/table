(function (root) {
  "use strict";

  function quantity(value) {
    const text = String(value ?? "").trim().replace(",", ".");
    // Retain integer spellings accepted by older JSON imports (e.g. 3,0).
    const number = text === "" ? 0 : /^[-+]?\d+(\.\d+)?$/.test(text) ? Number(text) : NaN;
    return Number.isSafeInteger(number) && number >= 0 ? number : null;
  }

  function products(workbook) {
    return workbook.sheets.flatMap((sheet) => Object.entries(sheet.snapshot?.data || {}).flatMap(([key, row]) => {
      if (!Array.isArray(row) || !row.some(value => String(value ?? "").trim())) return [];
      const rowIndex = Number(key);
      if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= sheet.snapshot.rows) return [];
      const itemId = sheet.snapshot.rowMeta?.[key]?.itemId;
      if (!itemId) return [];
      return [{ itemId, sheetId: sheet.id, sheetName: sheet.name, rowIndex,
        brand: String(row[0] || "Без бренда"), article: String(row[1] || "без артикула"),
        quantity: quantity(row[2]), barcode: String(row[3] ?? "") }];
    }));
  }

  // Resolve by permanent identity, never by a stale position from the search UI.
  function resolve(workbook, sheetId, itemId) {
    const sheet = workbook.sheets.find(item => item.id === sheetId);
    const matches = Object.entries(sheet?.snapshot?.rowMeta || {}).filter(([, meta]) => meta?.itemId === itemId);
    if (!sheet || matches.length !== 1) throw new Error("Товар удалён или его идентификатор неоднозначен. Повторите поиск.");
    const rowIndex = Number(matches[0][0]);
    const row = sheet.snapshot.data?.[rowIndex];
    if (!Array.isArray(row) || !Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= sheet.snapshot.rows) throw new Error("Товарная строка не найдена. Повторите поиск.");
    const mergedQuantity = (sheet.snapshot.merges || []).some(merge => rowIndex >= merge.row && rowIndex < merge.row + merge.rowSpan && 2 >= merge.col && 2 < merge.col + merge.colSpan);
    if (mergedQuantity) throw new Error("Количество товара находится в объединённой ячейке. Сначала разъедините её.");
    return { sheet, row, rowIndex };
  }

  function commit({ workbook, stock, operation, isLocked, normalizeBarcode, createId, persist, syncRow }) {
    const { sheetId, itemId, delta, type, reason, barcode = null, source = "manual", createdBy = "operator" } = operation;
    if (isLocked(sheetId)) throw new Error("Продажа и оприходование заблокированы: инвентаризация не завершена.");
    if (!Number.isSafeInteger(delta) || !delta || !["sale", "writeoff", "receipt"].includes(type)
      || (type === "receipt" ? delta < 0 : delta > 0)) throw new Error("Укажите целое количество больше нуля.");
    const target = resolve(workbook, sheetId, itemId);
    if (barcode !== null && normalizeBarcode(target.row[3]) !== normalizeBarcode(barcode)) throw new Error("Штрих-код товара изменился. Повторите поиск.");
    const before = quantity(target.row[2]);
    if (before === null) throw new Error("Некорректный остаток товара: укажите целое неотрицательное число.");
    const after = before + delta;
    if (after < 0) throw new Error(`Недостаточно товара: доступно ${before}, требуется ${-delta}.`);
    if (!Number.isSafeInteger(after)) throw new Error("Количество слишком велико.");
    const movement = { id: createId(), itemId, sheetId, sheetName: target.sheet.name,
      brand: String(target.row[0] || ""), article: String(target.row[1] || ""), type, delta,
      quantityBefore: before, quantityAfter: after, reason, inventoryId: null, barcode,
      source, createdBy, createdAt: new Date().toISOString() };
    const rawBefore = target.row[2];
    const revisionBefore = stock.revision;
    const lengthBefore = stock.movements.length;
    try {
      target.row[2] = String(after);
      stock.movements.push(movement);
      stock.revision += 1;
      syncRow(target, String(after));
      if (!persist()) throw new Error("Не удалось сохранить операцию. Остаток не изменён — повторите попытку.");
    } catch (error) {
      // persist may replace the active sheet snapshot: restore both references.
      target.row[2] = rawBefore;
      if (target.sheet.snapshot.data?.[target.rowIndex]) target.sheet.snapshot.data[target.rowIndex][2] = rawBefore;
      stock.movements.length = lengthBefore;
      stock.revision = revisionBefore;
      syncRow(target, rawBefore);
      throw error;
    }
    return movement;
  }

  const api = { quantity, products, resolve, commit };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.StockService = api;
})(globalThis);
