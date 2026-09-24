/* File-only persistence. No table data is stored in browser storage. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.ProjectFileService = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function object(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function snapshotError(snapshot, maxRows, maxColumns) {
    if (!object(snapshot)) return "Отсутствуют данные листа.";
    const candidate = object(snapshot.snapshot) ? snapshot.snapshot : snapshot;
    if (Number(candidate.rows) > maxRows) return `В листе больше ${maxRows} строк. Открытие обрезало бы данные.`;
    if (typeof candidate.tbodyHtml === "string") return ""; // Historical projects.
    if (!object(candidate.data) && !Array.isArray(candidate.data)) return "Неизвестный формат данных листа.";
    for (const [index, row] of Object.entries(candidate.data)) {
      if (!Number.isInteger(Number(index)) || Number(index) < 0 || Number(index) >= maxRows) {
        return "В листе есть строки за пределами таблицы.";
      }
      if (!Array.isArray(row) || row.length > maxColumns || row.some(value => value !== null && typeof value === "object")) {
        return "В листе есть строки неподдерживаемого формата.";
      }
    }
    return "";
  }

  function validate(payload, { version, maxRows = 1500, maxColumns = 7 }) {
    if (!object(payload)) return "JSON не содержит объект проекта.";
    if (Number(payload.version) > version) return "Файл создан в более новой версии таблицы. Обновите приложение перед открытием.";
    if ("workbook" in payload) {
      const sheets = payload.workbook?.sheets;
      if (!Array.isArray(sheets) || !sheets.length) return "JSON содержит повреждённый или пустой список листов.";
      if ("sheetCount" in payload && (!Number.isInteger(payload.sheetCount) || payload.sheetCount !== sheets.length)) {
        return "Количество листов в JSON не совпадает со списком листов. Файл не открыт.";
      }
      const ids = new Set();
      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        if (!object(sheet)) return `Лист ${i + 1} повреждён. Файл не открыт.`;
        const id = String(sheet.id || `sheet-${i + 1}`);
        if (ids.has(id)) return "В JSON повторяются идентификаторы листов. Файл не открыт.";
        ids.add(id);
        const error = snapshotError(sheet.snapshot, maxRows, maxColumns);
        if (error) return `Лист «${sheet.name || i + 1}»: ${error}`;
      }
      return "";
    }
    if ("sheetCount" in payload && payload.sheetCount !== 1) return "В JSON отсутствует список заявленных листов.";
    return snapshotError(payload, maxRows, maxColumns);
  }

  async function read(file, limits) {
    // Keep the exact text as the baseline for detecting an externally replaced file.
    const text = await file.text();
    const payload = JSON.parse(text.replace(/^\uFEFF/, ""));
    const error = validate(payload, limits);
    if (error) throw new Error(error);
    return { payload, text };
  }

  function conflict() {
    return new Error("JSON изменён вне этой вкладки. Откройте свежий файл через «Открыть проект» или сохраните свои изменения под другим именем.");
  }

  async function write(handle, text, source = {}) {
    const sameFile = source.handle && (source.handle === handle || await handle.isSameEntry(source.handle));
    const before = await (await handle.getFile()).text();
    if (sameFile && (source.text === null || source.text === undefined || before !== source.text)) throw conflict();
    let writable;
    try {
      writable = await handle.createWritable();
      await writable.write(text);
      // File System Access writes to a temporary file until close(). Check again
      // before committing, including Save As to a different existing file.
      if (await (await handle.getFile()).text() !== before) throw conflict();
      await writable.close();
    } catch (error) {
      if (writable) {
        try { await writable.abort(); } catch { /* Already closed or aborted. */ }
      }
      throw error;
    }
  }

  return { validate, read, write };
});
