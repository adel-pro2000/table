
const sheet = document.getElementById("sheet");
const statusEl = document.getElementById("status");
const emptySearchStateEl = document.getElementById("emptySearchState");
const fillHandleEl = document.getElementById("fillHandle");
const tableWrapEl = document.querySelector(".table-wrap");
const rowControlsEl = document.getElementById("rowControls");
const insertRowAboveMouseBtn = document.getElementById("insertRowAboveMouse");
const insertRowBelowMouseBtn = document.getElementById("insertRowBelowMouse");
const removeRowMouseBtn = document.getElementById("removeRowMouse");
const addRowBtn = document.getElementById("addRow");
const removeRowBtn = document.getElementById("removeRow");
const openProjectBtn = document.getElementById("openProject");
const saveProjectBtn = document.getElementById("saveProject");
const saveProjectAsBtn = document.getElementById("saveProjectAs");
const openProjectFileInputEl = document.getElementById("openProjectFile");
const crossImportBtn = document.getElementById("crossImport");
const undoActionBtn = document.getElementById("undoAction");
const redoActionBtn = document.getElementById("redoAction");
const partNumberSearchInputEl = document.getElementById("partNumberSearchInput");
const partNumberSearchInputSecondaryEl = document.getElementById("partNumberSearchInputSecondary");
const partNumberSearchApplyBtn = document.getElementById("partNumberSearchApply");
const partNumberSearchResetBtn = document.getElementById("partNumberSearchReset");
const partNumberSearchModeStrictBtn = document.getElementById("partNumberSearchModeStrict");
const partNumberSearchModeContainsBtn = document.getElementById("partNumberSearchModeContains");
const articleSearchInputEl = document.getElementById("articleSearchInput");
const articleSearchInputSecondaryEl = document.getElementById("articleSearchInputSecondary");
const articleSearchInputTertiaryEl = document.getElementById("articleSearchInputTertiary");
const articleSearchInputQuaternaryEl = document.getElementById("articleSearchInputQuaternary");
const articleSearchApplyBtn = document.getElementById("articleSearchApply");
const articleSearchResetBtn = document.getElementById("articleSearchReset");
const articleSearchModeStrictBtn = document.getElementById("articleSearchModeStrict");
const articleSearchModeContainsBtn = document.getElementById("articleSearchModeContains");
const vehicleSearchInputEl = document.getElementById("vehicleSearchInput");
const vehicleSearchApplyBtn = document.getElementById("vehicleSearchApply");
const vehicleSearchResetBtn = document.getElementById("vehicleSearchReset");
const vehicleSearchModeStrictBtn = document.getElementById("vehicleSearchModeStrict");
const vehicleSearchModeContainsBtn = document.getElementById("vehicleSearchModeContains");
const crossEditModalEl = document.getElementById("crossEditModal");
const crossEditTargetEl = document.getElementById("crossEditTarget");
const crossEditTextareaEl = document.getElementById("crossEditTextarea");
const crossEditNormalizeBtn = document.getElementById("crossEditNormalize");
const crossEditSaveBtn = document.getElementById("crossEditSave");
const crossEditCancelBtn = document.getElementById("crossEditCancel");
const crossEditCloseBtn = document.getElementById("crossEditClose");
const crossImportModalEl = document.getElementById("crossImportModal");
const crossImportTargetEl = document.getElementById("crossImportTarget");
const crossImportUrlEl = document.getElementById("crossImportUrl");
const crossImportSourceEl = document.getElementById("crossImportSource");
const crossImportResultEl = document.getElementById("crossImportResult");
const crossImportStatusEl = document.getElementById("crossImportStatus");
const crossImportFetchBtn = document.getElementById("crossImportFetch");
const crossImportExtractBtn = document.getElementById("crossImportExtract");
const crossImportApplyBtn = document.getElementById("crossImportApply");
const crossImportCloseBtn = document.getElementById("crossImportClose");
const buildBadgeEl = document.getElementById("buildBadge");
const APP_BUILD_ID = "table 2026-03-24 00:35";
const COLUMN_HEADERS = [
  "Бренд",
  "Артикул",
  "Кол-во",
  "Штрих-код",
  "Кросы",
  "Автомобиль",
  "Диаметр резьбы"
];
const ARTICLE_COL_INDEX = COLUMN_HEADERS.indexOf("Артикул");
const QUANTITY_COL_INDEX = COLUMN_HEADERS.indexOf("Кол-во");
const CROSS_COL_INDEX = COLUMN_HEADERS.indexOf("Кросы");
const VEHICLE_COL_INDEX = COLUMN_HEADERS.indexOf("Автомобиль");
const THREAD_DIAMETER_COL_INDEX = COLUMN_HEADERS.indexOf("Диаметр резьбы");
const CENTER_ALIGNED_COLUMNS = new Set([
  ARTICLE_COL_INDEX,
  QUANTITY_COL_INDEX,
  VEHICLE_COL_INDEX,
  THREAD_DIAMETER_COL_INDEX
]);
const FIXED_ROW_COUNT = 1500;
const TABLE_STORAGE_KEY = "oil-filters-table-v1";
const TABLE_EXPORT_VERSION = 3;
const TABLE_EXPORT_FILE_NAME = "oil-filters-table.json";
const FILE_SYSTEM_DB_NAME = "oil-filters-table-fs";
const FILE_SYSTEM_STORE_NAME = "handles";
const PROJECT_FILE_HANDLE_KEY = "project-file-handle";
const PROJECT_FILE_NAME_KEY = "project-file-name";
const PROJECT_FILE_PICKER_TYPES = [
  {
    description: "JSON project",
    accept: { "application/json": [".json"] }
  }
];
const DEFAULT_DOCUMENT_TITLE = document.title;
const DEFAULT_TABLE_SEARCH_MODE = "contains";
// Конфигурация полей поиска позволяет позже добавить другие колонки без переписывания ядра.
const TABLE_SEARCH_FIELDS = [
  {
    key: "partNumber",
    colIndex: ARTICLE_COL_INDEX,
    splitValues: splitSearchCellValue
  },
  {
    key: "articles",
    colIndex: CROSS_COL_INDEX,
    splitValues: splitSearchCellValue
  },
  {
    key: "vehicle",
    colIndex: VEHICLE_COL_INDEX,
    splitValues: splitSearchCellValue
  }
];
const TABLE_SEARCH_CONTROLS = {
  partNumber: {
    inputs: [partNumberSearchInputEl, partNumberSearchInputSecondaryEl],
    apply: partNumberSearchApplyBtn,
    reset: partNumberSearchResetBtn,
    modeButtons: {
      strict: partNumberSearchModeStrictBtn,
      contains: partNumberSearchModeContainsBtn
    }
  },
  articles: {
    inputs: [
      articleSearchInputEl,
      articleSearchInputSecondaryEl,
      articleSearchInputTertiaryEl,
      articleSearchInputQuaternaryEl
    ],
    apply: articleSearchApplyBtn,
    reset: articleSearchResetBtn,
    modeButtons: {
      strict: articleSearchModeStrictBtn,
      contains: articleSearchModeContainsBtn
    }
  },
  vehicle: {
    input: vehicleSearchInputEl,
    apply: vehicleSearchApplyBtn,
    reset: vehicleSearchResetBtn,
    modeButtons: {
      strict: vehicleSearchModeStrictBtn,
      contains: vehicleSearchModeContainsBtn
    }
  }
};

function getTableSearchControlInputs(fieldKey) {
  const controls = TABLE_SEARCH_CONTROLS[fieldKey];
  if (!controls) return [];
  if (Array.isArray(controls.inputs) && controls.inputs.length) {
    return controls.inputs.filter(Boolean);
  }
  return controls.input ? [controls.input] : [];
}

function createEmptyTableSearchValues(fieldKey) {
  return getTableSearchControlInputs(fieldKey).map(() => "");
}

const state = {
  rows: FIXED_ROW_COUNT,
  cols: COLUMN_HEADERS.length,
  isSelecting: false,
  didDrag: false,
  selectionMouseButton: null,
  selected: new Set(),
  mergedMasterIds: new Set(),
  nextMasterId: 1,
  clipboard: null,
  history: [],
  future: [],
  isRestoringHistory: false,
  editingCell: null,
  fillDragState: {
    isDragging: false,
    sourceRange: null,
    previewRange: null,
    direction: null
  },
  crossImport: {
    isOpen: false,
    target: null,
    lastUrl: "",
    lastSourceText: "",
    lastResultText: ""
  },
  crossEdit: {
    isOpen: false,
    target: null
  },
  rowHover: {
    row: null,
    col: null
  },
  tableSearch: {
    fields: Object.fromEntries(
      TABLE_SEARCH_FIELDS.map((fieldConfig) => [
        fieldConfig.key,
        {
          queryValues: createEmptyTableSearchValues(fieldConfig.key),
          draftQueryValues: createEmptyTableSearchValues(fieldConfig.key),
          normalizedQueries: [],
          mode: DEFAULT_TABLE_SEARCH_MODE,
          draftMode: DEFAULT_TABLE_SEARCH_MODE
        }
      ])
    ),
    rowCache: new Map()
  },
  fileSystem: {
    projectFileHandle: null,
    projectFileName: ""
  }
};

const crossImportService = {
  async loadFromUrl(url) {
    const normalizedUrl = String(url ?? "").trim();
    if (!normalizedUrl) {
      return {
        ok: false,
        sourceText: "",
        values: [],
        message: "Укажите ссылку или вставьте текст вручную в блок ниже."
      };
    }

    try {
      const response = await fetch(normalizedUrl, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        headers: { Accept: "text/html,text/plain,*/*" }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.text();
      const sourceText = this.toSourceText(payload, response.headers.get("content-type") || "");
      const values = this.parseCrossValues(sourceText);
      return {
        ok: true,
        sourceText,
        values,
        message: values.length
          ? `Автоматически подготовлено значений: ${values.length}.`
          : "Источник загружен, но значения не распознаны. Проверьте текст вручную."
      };
    } catch {
      return {
        ok: false,
        sourceText: "",
        values: [],
        message: "Автозагрузка не удалась. Сайт мог заблокировать запрос или вернуть нестандартную страницу. Вставьте текст вручную и подтвердите запись."
      };
    }
  },

  toSourceText(payload, contentType = "") {
    const raw = String(payload ?? "").replace(/\r/g, "");
    const looksLikeHtml = /html/i.test(contentType) || /<(html|body|div|table|span|p|section|article)\b/i.test(raw);
    if (!looksLikeHtml) {
      return raw.replace(/\u00a0/g, " ").trim();
    }

    const doc = new DOMParser().parseFromString(raw, "text/html");
    doc.querySelectorAll("script, style, noscript, iframe, svg").forEach((node) => node.remove());
    const text = doc.body?.innerText || doc.body?.textContent || "";
    return text
      .replace(/\u00a0/g, " ")
      .replace(/\r/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  },

  parseCrossValues(sourceText) {
    const normalizedText = this.toSourceText(sourceText, "text/plain");
    if (!normalizedText) return [];

    const lineCandidates = normalizedText
      .split("\n")
      .flatMap((line) => line.split(/[;,|]+/))
      .map((line) => line.replace(/\s+/g, " ").trim())
      .filter(Boolean);

    const articleCandidates = normalizedText.match(/[A-Za-zА-Яа-я]*\d+[A-Za-zА-Яа-я0-9./-]*/g) || [];
    const candidatePool = lineCandidates.length ? lineCandidates : articleCandidates;
    const unique = new Map();

    candidatePool.forEach((item) => {
      const value = String(item ?? "").trim();
      if (!value) return;
      if (!/[A-Za-zА-Яа-я0-9]/.test(value)) return;

      const key = value.toLowerCase();
      if (!unique.has(key)) unique.set(key, value);
    });

    return Array.from(unique.values());
  },

  formatCrossValues(values) {
    return values.join("\n");
  }
};

function setStatus(text) {
  statusEl.textContent = text;
}

function cellKey(r, c) {
  return `${r}:${c}`;
}

function createCell(r, c) {
  const td = document.createElement("td");
  td.dataset.row = String(r);
  td.dataset.col = String(c);
  td.dataset.raw = "";
  td.spellcheck = false;
  if (CENTER_ALIGNED_COLUMNS.has(c)) td.classList.add("center-col");
  if (c === CROSS_COL_INDEX) td.classList.add("cross-col");
  return td;
}

function createRowNumberCell(r) {
  const th = document.createElement("th");
  th.scope = "row";
  th.className = "row-number";
  th.textContent = String(r + 1);
  return th;
}

function createHeaderCell(title, c) {
  const th = document.createElement("th");
  th.scope = "col";
  th.textContent = title;
  if (c === CROSS_COL_INDEX) th.classList.add("cross-col");
  return th;
}

function createRowNumberHeaderCell() {
  const th = document.createElement("th");
  th.scope = "col";
  th.className = "row-number-head";
  th.textContent = "№";
  return th;
}

function getBodyRows() {
  return Array.from(sheet.tBodies[0]?.rows || []);
}

function getRowDataCells(tr) {
  return Array.from(tr?.querySelectorAll('td[data-col]') || []);
}

function getRowDataCell(tr, colIndex) {
  return tr?.querySelector(`td[data-col="${colIndex}"]`) || null;
}

function buildTable() {
  sheet.innerHTML = "";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  headRow.appendChild(createRowNumberHeaderCell());
  COLUMN_HEADERS.forEach((title, c) => {
    headRow.appendChild(createHeaderCell(title, c));
  });
  thead.appendChild(headRow);

  const tbody = document.createElement("tbody");
  for (let r = 0; r < state.rows; r++) {
    const tr = document.createElement("tr");
    tr.appendChild(createRowNumberCell(r));
    for (let c = 0; c < state.cols; c++) {
      tr.appendChild(createCell(r, c));
    }
    tbody.appendChild(tr);
  }
  sheet.appendChild(thead);
  sheet.appendChild(tbody);
  clearSelection();
  renderAllCells();
}

function getCell(r, c) {
  return sheet.querySelector(`td[data-row="${r}"][data-col="${c}"]`);
}

function isCrossCell(td) {
  return Boolean(td) && Number(td.dataset.col) === CROSS_COL_INDEX;
}

function isCrossImportOpen() {
  return state.crossImport.isOpen && !crossImportModalEl.hidden;
}

function isCrossEditOpen() {
  return state.crossEdit.isOpen && !crossEditModalEl.hidden;
}

function getSingleSelectedCrossCell() {
  if (state.selected.size !== 1) return null;
  const anchor = getAnchorCell();
  return isCrossCell(anchor) ? anchor : null;
}

function setCrossImportStatus(text) {
  crossImportStatusEl.textContent = text;
}

function setCrossImportModalVisibility(isOpen) {
  crossImportModalEl.hidden = !isOpen;
  crossImportModalEl.setAttribute("aria-hidden", isOpen ? "false" : "true");
  crossImportModalEl.style.display = isOpen ? "flex" : "none";
}

function setCrossEditModalVisibility(isOpen) {
  crossEditModalEl.hidden = !isOpen;
  crossEditModalEl.setAttribute("aria-hidden", isOpen ? "false" : "true");
  crossEditModalEl.style.display = isOpen ? "flex" : "none";
}

function setCrossImportTarget(td) {
  if (!td) {
    crossImportTargetEl.textContent = 'Выберите одну ячейку в столбце "Кросы".';
    return;
  }

  const row = Number(td.dataset.row) + 1;
  crossImportTargetEl.textContent = `Запись будет выполнена в строку ${row}, столбец "Кросы".`;
}

function setCrossEditTarget(td) {
  if (!td) {
    crossEditTargetEl.textContent = 'Выберите ячейку в столбце "Кросы".';
    return;
  }

  const row = Number(td.dataset.row) + 1;
  crossEditTargetEl.textContent = `Редактируется строка ${row}, столбец "Кросы".`;
}

function openCrossEditModal(td, valueOverride = getRawValue(td)) {
  if (!td || !isCrossCell(td) || td.classList.contains("hidden")) return;

  clearHoveredRow();
  state.crossEdit.isOpen = true;
  state.crossEdit.target = {
    row: Number(td.dataset.row),
    col: Number(td.dataset.col)
  };

  setCrossEditTarget(td);
  setCrossEditModalVisibility(true);
  crossEditTextareaEl.value = String(valueOverride ?? "").replace(/\r/g, "");

  requestAnimationFrame(() => {
    crossEditTextareaEl.focus();
    const cursorPosition = crossEditTextareaEl.value.length;
    crossEditTextareaEl.setSelectionRange(cursorPosition, cursorPosition);
  });
}

function closeCrossEditModal() {
  state.crossEdit.isOpen = false;
  state.crossEdit.target = null;
  setCrossEditModalVisibility(false);
}

function applyCrossEditModal() {
  const target = state.crossEdit.target;
  if (!target) return false;

  const td = getCell(target.row, target.col);
  if (!td || !isCrossCell(td) || td.classList.contains("hidden")) {
    closeCrossEditModal();
    return false;
  }

  updateCellValue(target.row, target.col, crossEditTextareaEl.value.replace(/\r/g, ""));
  closeCrossEditModal();
  selectCell(td);
  setStatus('Содержимое ячейки "Кросы" сохранено.');
  return true;
}

function cancelCrossEditModal() {
  const target = state.crossEdit.target;
  closeCrossEditModal();

  if (target) {
    const td = getCell(target.row, target.col);
    if (td) selectCell(td);
  }

  setStatus('Редактирование ячейки "Кросы" отменено.');
  return true;
}

function normalizeCrossEditTextarea() {
  const normalizedText = normalizeArticleMultilineText(crossEditTextareaEl.value);
  crossEditTextareaEl.value = normalizedText;
  crossEditTextareaEl.focus();
  setStatus('В редакторе "Кросы" убраны пробелы, точки, тире и дефисы у артикулов.');
  return normalizedText;
}

function openCrossImportModal() {
  const targetCell = getSingleSelectedCrossCell();

  clearHoveredRow();
  state.crossImport.isOpen = true;
  state.crossImport.target = targetCell
    ? {
        row: Number(targetCell.dataset.row),
        col: Number(targetCell.dataset.col)
      }
    : null;

  setCrossImportModalVisibility(true);
  setCrossImportTarget(targetCell);
  crossImportUrlEl.value = state.crossImport.lastUrl;
  crossImportSourceEl.value = state.crossImport.lastSourceText;
  crossImportResultEl.value = state.crossImport.lastResultText || (targetCell ? getRawValue(targetCell) : "");
  setCrossImportStatus(targetCell
    ? "Автозагрузка использует безопасный service/parser слой. Если сайт не отдаёт данные, вставьте текст вручную."
    : 'Окно открыто. Для записи выберите одну ячейку в столбце "Кросы" и затем нажмите "Записать в Кросы".');
  crossImportUrlEl.focus();
}

function closeCrossImportModal() {
  state.crossImport.isOpen = false;
  state.crossImport.lastUrl = crossImportUrlEl.value.trim();
  state.crossImport.lastSourceText = crossImportSourceEl.value;
  state.crossImport.lastResultText = crossImportResultEl.value;
  setCrossImportModalVisibility(false);
}

function applyCrossImportResult() {
  const selectedTarget = getSingleSelectedCrossCell();
  const target = selectedTarget
    ? {
        row: Number(selectedTarget.dataset.row),
        col: Number(selectedTarget.dataset.col)
      }
    : state.crossImport.target;

  if (!target) {
    setCrossImportStatus('Выберите одну ячейку в столбце "Кросы" перед записью.');
    return false;
  }

  state.crossImport.target = target;

  const td = getCell(target.row, target.col);
  if (!isCrossCell(td) || td.classList.contains("hidden")) {
    setCrossImportStatus('Целевая ячейка "Кросы" недоступна.');
    return false;
  }

  const value = crossImportResultEl.value.replace(/\r/g, "").trim();
  if (!value) {
    setCrossImportStatus("Добавьте результат вручную или извлеките его из текста.");
    return false;
  }

  updateCellValue(target.row, target.col, value);
  selectCell(td);
  setStatus('Данные записаны в ячейку "Кросы".');
  closeCrossImportModal();
  return true;
}

function isArticleCell(td) {
  return Boolean(td) && Number(td.dataset.col) === ARTICLE_COL_INDEX;
}

function normalizeArticleToken(value) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";

  // Для кодов с цифрами убираем пробелы, точки, дефисы и тире: "E9GZ-6731-B" -> "E9GZ6731B".
  return /\d/.test(text) ? text.replace(/[\s.\-–—]+/g, "") : text;
}

function normalizeArticleMultilineText(value) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => normalizeArticleToken(line))
    .join("\n");
}

function normalizeCellText(td, value) {
  const text = String(value ?? "").replace(/\r/g, "");

  if (isCrossCell(td)) {
    return normalizeArticleMultilineText(text);
  }

  if (isArticleCell(td)) {
    return normalizeArticleToken(text.replace(/\n/g, " "));
  }

  return text.replace(/\n/g, "");
}

function replaceSelectionWithText(text) {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return false;

  const range = selection.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  return true;
}

function insertTextIntoCell(td, value) {
  if (!td || td.classList.contains("hidden")) return;

  const normalizedText = normalizeCellText(td, value);
  if (isCrossCell(td)) {
    clearSelection();
    addToSelection(td);
    updateCellValue(Number(td.dataset.row), Number(td.dataset.col), normalizedText);
    selectCell(td);
    return;
  }

  const isEditingSameCell = document.activeElement === td;

  clearSelection();
  addToSelection(td);

  if (!isEditingSameCell) {
    focusCellForEdit(td);
    td.textContent = normalizedText;
    focusCellForEdit(td);
  } else if (!replaceSelectionWithText(normalizedText)) {
    td.textContent += normalizedText;
    focusCellForEdit(td);
  }

  setRawValue(td, normalizeCellText(td, td.textContent));
  saveTableData(false);
  pushHistorySnapshot();
}

function isProtectedPasteColumn(colIndex) {
  return colIndex === CROSS_COL_INDEX || colIndex === VEHICLE_COL_INDEX;
}

function ensureRowCapacity(requiredRows) {
  const tbody = sheet.tBodies[0] || sheet.appendChild(document.createElement("tbody"));
  let currentRows = getBodyRows().length;
  const targetRows = Math.min(requiredRows, FIXED_ROW_COUNT);

  while (currentRows < targetRows) {
    const tr = document.createElement("tr");
    for (let c = 0; c < state.cols; c++) {
      tr.appendChild(createCell(currentRows, c));
    }
    tbody.appendChild(tr);
    currentRows += 1;
  }

  if (state.rows !== currentRows) refreshIndices();
}

function pasteLinesIntoColumn(td, pastedText) {
  if (!td || td.classList.contains("hidden")) return false;

  const lines = String(pastedText ?? "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) return false;

  const startRow = Number(td.dataset.row);
  const colIndex = Number(td.dataset.col);
  ensureRowCapacity(startRow + lines.length);
  const availableLines = lines.slice(0, Math.max(0, FIXED_ROW_COUNT - startRow));
  if (!availableLines.length) return false;

  availableLines.forEach((line, index) => {
    const targetCell = getCell(startRow + index, colIndex);
    if (!targetCell || targetCell.classList.contains("hidden")) return;
    setRawValue(targetCell, normalizeCellText(targetCell, line));
  });

  const insertedRange = {
    minR: startRow,
    maxR: startRow + availableLines.length - 1,
    minC: colIndex,
    maxC: colIndex
  };

  renderAllCells();
  setSelectionToRange(insertedRange);
  saveTableData(false);
  pushHistorySnapshot();
  setStatus(availableLines.length > 1
    ? "Список значений вставлен в столбец."
    : "Значение вставлено в ячейку.");
  return true;
}

async function pasteSystemClipboardIntoCell(td, successText) {
  if (!td || td.classList.contains("hidden")) return false;

  try {
    const clipboardText = await navigator.clipboard.readText();
    if (!clipboardText) {
      setStatus("Буфер обмена пуст.");
      return true;
    }

    insertTextIntoCell(td, clipboardText);
    setStatus(successText);
    return true;
  } catch {
    return false;
  }
}

async function loadCrossImportFromUrl() {
  const url = crossImportUrlEl.value.trim();
  setCrossImportStatus("Пробую загрузить источник...");

  const result = await crossImportService.loadFromUrl(url);
  state.crossImport.lastUrl = url;

  if (result.sourceText) {
    crossImportSourceEl.value = result.sourceText;
    state.crossImport.lastSourceText = result.sourceText;
  }

  if (result.values.length) {
    const formatted = crossImportService.formatCrossValues(result.values);
    crossImportResultEl.value = formatted;
    state.crossImport.lastResultText = formatted;
  }

  setCrossImportStatus(result.message);
}

function extractCrossImportFromSource() {
  const sourceText = crossImportSourceEl.value;
  state.crossImport.lastSourceText = sourceText;

  const values = crossImportService.parseCrossValues(sourceText);
  if (!values.length) {
    setCrossImportStatus("Автопарсер не нашёл значений. Вы можете вставить итоговый текст в нижнее поле вручную.");
    return;
  }

  const formatted = crossImportService.formatCrossValues(values);
  crossImportResultEl.value = formatted;
  state.crossImport.lastResultText = formatted;
  setCrossImportStatus(`Подготовлено значений: ${values.length}. При необходимости поправьте результат вручную перед записью.`);
}

function getRawValue(td) {
  return td ? (td.dataset.raw || "") : "";
}

function setRawValue(td, value) {
  if (!td) return;
  td.dataset.raw = value;
}

function normalizeSearchValue(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[\s,.\-–—]+/g, "");
}

function splitSearchCellValue(value) {
  return String(value ?? "")
    .split(/[,\n;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildFieldSearchIndex(rawValue, fieldConfig) {
  return fieldConfig
    .splitValues(rawValue)
    .map((value) => ({
      strict: normalizeSearchValue(value)
    }))
    .filter((item) => item.strict);
}

function getRowSearchCacheKey(tr) {
  return Number(getRowDataCell(tr, 0)?.dataset.row ?? -1);
}

function getRowSearchIndex(tr) {
  const rowKey = getRowSearchCacheKey(tr);
  const cachedEntry = state.tableSearch.rowCache.get(rowKey);
  const rawValues = {};
  let canReuseCache = Boolean(cachedEntry);

  TABLE_SEARCH_FIELDS.forEach((fieldConfig) => {
    const rawValue = getRawValue(getRowDataCell(tr, fieldConfig.colIndex));
    rawValues[fieldConfig.key] = rawValue;

    if (!cachedEntry || cachedEntry.sources[fieldConfig.key] !== rawValue) {
      canReuseCache = false;
    }
  });

  if (canReuseCache) {
    return cachedEntry.values;
  }

  const values = {};
  // Нормализованные значения кешируются по строке, чтобы не пересчитывать их на каждый ввод.
  TABLE_SEARCH_FIELDS.forEach((fieldConfig) => {
    values[fieldConfig.key] = buildFieldSearchIndex(rawValues[fieldConfig.key], fieldConfig);
  });

  state.tableSearch.rowCache.set(rowKey, { sources: rawValues, values });
  return values;
}

function clearTableSearchCache() {
  state.tableSearch.rowCache.clear();
}

function invalidateTableSearchCacheForRow(rowIndex) {
  state.tableSearch.rowCache.delete(rowIndex);
}

function isTableSearchColumn(columnIndex) {
  return TABLE_SEARCH_FIELDS.some((fieldConfig) => fieldConfig.colIndex === columnIndex);
}

function matchesFieldSearch(indexEntries, normalizedQueries, mode) {
  if (!normalizedQueries.length) return true;
  return normalizedQueries.some((normalizedQuery) => {
    if (mode === "contains") {
      return indexEntries.some((entry) => entry.strict.includes(normalizedQuery));
    }
    return indexEntries.some((entry) => entry.strict === normalizedQuery);
  });
}

function rowMatchesTableSearch(tr, normalizedQuery) {
  const activeFieldConfigs = TABLE_SEARCH_FIELDS.filter(
    (fieldConfig) => normalizedQuery[fieldConfig.key]?.length
  );
  if (!activeFieldConfigs.length) return true;

  const rowSearchIndex = getRowSearchIndex(tr);
  return activeFieldConfigs.every((fieldConfig) =>
    matchesFieldSearch(
      rowSearchIndex[fieldConfig.key],
      normalizedQuery[fieldConfig.key],
      state.tableSearch.fields[fieldConfig.key].mode
    )
  );
}

function applyTableSearch(options = {}) {
  const { showStatus = false } = options;
  const normalizedQuery = Object.fromEntries(
    TABLE_SEARCH_FIELDS.map((fieldConfig) => [
      fieldConfig.key,
      state.tableSearch.fields[fieldConfig.key].normalizedQueries
    ])
  );
  const activeFiltersCount = Object.values(normalizedQuery).filter((queries) => queries.length).length;
  let visibleRowsCount = 0;

  getBodyRows().forEach((tr) => {
    const visible = rowMatchesTableSearch(tr, normalizedQuery);
    tr.style.display = visible ? "" : "none";
    if (visible) visibleRowsCount += 1;
  });

  emptySearchStateEl.hidden = visibleRowsCount !== 0;

  const anchor = state.selected.size === 1 ? getAnchorCell() : null;
  if (anchor && anchor.parentElement && anchor.parentElement.style.display === "none") {
    clearSelection();
    blurEditingCell();
  }

  if (showStatus) {
    setStatus(activeFiltersCount ? `Найдено строк: ${visibleRowsCount}.` : "Поиск сброшен.");
  }
}

function syncTableSearchInputs() {
  TABLE_SEARCH_FIELDS.forEach((fieldConfig) => {
    const controls = TABLE_SEARCH_CONTROLS[fieldConfig.key];
    const fieldState = state.tableSearch.fields[fieldConfig.key];
    if (!controls || !fieldState) return;
    getTableSearchControlInputs(fieldConfig.key).forEach((input, index) => {
      input.value = fieldState.draftQueryValues[index] || "";
    });
    Object.entries(controls.modeButtons).forEach(([modeKey, button]) => {
      if (!button) return;
      button.classList.toggle("is-active", fieldState.draftMode === modeKey);
      button.setAttribute("aria-pressed", fieldState.draftMode === modeKey ? "true" : "false");
    });
  });
}

function normalizeTableSearchQueries(queryValues) {
  return queryValues
    .map((query) => String(query ?? ""))
    .map((query) => normalizeSearchValue(query))
    .filter(Boolean);
}

function updateTableSearchQuery(fieldKey, queryValues) {
  const fieldState = state.tableSearch.fields[fieldKey];
  if (!fieldState) return;
  const values = Array.isArray(queryValues) ? queryValues : [queryValues];
  fieldState.queryValues = createEmptyTableSearchValues(fieldKey).map((_, index) => String(values[index] ?? ""));
  fieldState.normalizedQueries = normalizeTableSearchQueries(fieldState.queryValues);
}

function updateTableSearchDraft(fieldKey, queryValues) {
  const fieldState = state.tableSearch.fields[fieldKey];
  if (!fieldState) return;
  const values = Array.isArray(queryValues) ? queryValues : [queryValues];
  fieldState.draftQueryValues = createEmptyTableSearchValues(fieldKey).map((_, index) => String(values[index] ?? ""));
}

function updateTableSearchMode(fieldKey, mode) {
  const fieldState = state.tableSearch.fields[fieldKey];
  if (!fieldState) return;
  fieldState.mode = mode;
}

function updateTableSearchDraftMode(fieldKey, mode) {
  const fieldState = state.tableSearch.fields[fieldKey];
  if (!fieldState) return;
  fieldState.draftMode = mode;
}

function refreshTableSearch() {
  syncTableSearchInputs();
  applyTableSearch();
}

function hasActiveTableSearch() {
  return TABLE_SEARCH_FIELDS.some((fieldConfig) =>
    Boolean(state.tableSearch.fields[fieldConfig.key]?.normalizedQueries.length)
  );
}

function resetTableSearch(fieldKey = null, showStatus = false) {
  const targetKeys = fieldKey ? [fieldKey] : TABLE_SEARCH_FIELDS.map((fieldConfig) => fieldConfig.key);
  targetKeys.forEach((key) => {
    updateTableSearchQuery(key, createEmptyTableSearchValues(key));
    updateTableSearchDraft(key, createEmptyTableSearchValues(key));
    updateTableSearchMode(key, DEFAULT_TABLE_SEARCH_MODE);
    updateTableSearchDraftMode(key, DEFAULT_TABLE_SEARCH_MODE);
  });
  syncTableSearchInputs();
  applyTableSearch({ showStatus });
}

function initTableSearch() {
  TABLE_SEARCH_FIELDS.forEach((fieldConfig) => {
    const controls = TABLE_SEARCH_CONTROLS[fieldConfig.key];
    const fieldState = state.tableSearch.fields[fieldConfig.key];
    if (!controls || !fieldState) return;

    getTableSearchControlInputs(fieldConfig.key).forEach((input, inputIndex) => {
      input.addEventListener("focus", handleSearchInputFocus);
      input.addEventListener("input", (event) => {
        const nextDraftValues = [...fieldState.draftQueryValues];
        nextDraftValues[inputIndex] = event.target.value;
        updateTableSearchDraft(fieldConfig.key, nextDraftValues);
      });
    });

    Object.entries(controls.modeButtons).forEach(([modeKey, button]) => {
      if (!button) return;
      button.addEventListener("click", () => {
        updateTableSearchDraftMode(fieldConfig.key, modeKey);
        syncTableSearchInputs();
      });
    });

    controls.apply.addEventListener("click", () => {
      updateTableSearchQuery(fieldConfig.key, fieldState.draftQueryValues);
      updateTableSearchMode(fieldConfig.key, fieldState.draftMode);
      applyTableSearch({ showStatus: true });
    });

    controls.reset.addEventListener("click", () => {
      resetTableSearch(fieldConfig.key, true);
    });
  });

  TABLE_SEARCH_FIELDS.forEach((fieldConfig) => {
    const fieldState = state.tableSearch.fields[fieldConfig.key];
    updateTableSearchDraft(fieldConfig.key, fieldState.queryValues);
  });
  syncTableSearchInputs();
}

function createHistorySnapshot() {
  return {
    rows: state.rows,
    tbodyHtml: sheet.tBodies[0]?.innerHTML || "",
    nextMasterId: state.nextMasterId,
    mergedMasterIds: Array.from(state.mergedMasterIds)
  };
}

function getHistorySignature(snapshot) {
  return JSON.stringify(snapshot);
}

function updateHistoryButtons() {
  undoActionBtn.disabled = state.history.length <= 1;
  redoActionBtn.disabled = state.future.length === 0;
}

function pushHistorySnapshot() {
  if (state.isRestoringHistory) return;

  const snapshot = createHistorySnapshot();
  const signature = getHistorySignature(snapshot);
  const lastEntry = state.history[state.history.length - 1];
  if (lastEntry && lastEntry.signature === signature) {
    updateHistoryButtons();
    return;
  }

  state.history.push({ snapshot, signature });
  if (state.history.length > 100) state.history.shift();
  state.future = [];
  updateHistoryButtons();
}

function applyHistorySnapshot(snapshot, options = {}) {
  if (!snapshot) return false;

  const { persist = true } = options;

  state.isRestoringHistory = true;
  try {
    state.rows = Math.max(1, Number(snapshot.rows) || 1);
    buildTable();

    const tbody = sheet.tBodies[0];
    if (tbody) tbody.innerHTML = snapshot.tbodyHtml || "";

    state.nextMasterId = Math.max(1, Number(snapshot.nextMasterId) || 1);
    state.mergedMasterIds = new Set(Array.isArray(snapshot.mergedMasterIds) ? snapshot.mergedMasterIds : []);

    refreshIndices();
    clearSelection();
    renderAllCells();
    if (persist) saveTableData(false);
    updateHistoryButtons();
    return true;
  } finally {
    state.isRestoringHistory = false;
  }
}

function undoLastAction() {
  blurEditingCell();

  if (state.history.length <= 1) {
    setStatus("Нет действий для отмены.");
    updateHistoryButtons();
    return;
  }

  const currentEntry = state.history.pop();
  state.future.push(currentEntry);
  applyHistorySnapshot(state.history[state.history.length - 1]?.snapshot);
  setStatus("Последнее действие отменено.");
}

function redoLastAction() {
  blurEditingCell();

  if (!state.future.length) {
    setStatus("Нет действий для возврата.");
    updateHistoryButtons();
    return;
  }

  const nextEntry = state.future.pop();
  if (!applyHistorySnapshot(nextEntry.snapshot)) return;
  state.history.push(nextEntry);
  updateHistoryButtons();
  setStatus("Отмененное действие возвращено.");
}

function getTableDataSnapshot() {
  const rows = getBodyRows();
  return {
    rows: rows.length || state.rows,
    data: rows.map((tr) => getRowDataCells(tr).map((td) => getRawValue(td)))
  };
}

// Сериализуем текущее состояние таблицы в переносимый JSON-проект.
function serializeCurrentProject() {
  return {
    kind: "oil-filters-project",
    version: TABLE_EXPORT_VERSION,
    savedAt: new Date().toISOString(),
    columns: COLUMN_HEADERS,
    snapshot: createHistorySnapshot()
  };
}

function createPortableTablePayload() {
  return serializeCurrentProject();
}

function normalizeProjectFileName(value, options = {}) {
  const { fallback = TABLE_EXPORT_FILE_NAME, allowEmpty = false } = options;
  let normalized = String(value ?? "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ");

  if (!normalized) return allowEmpty ? "" : fallback;
  if (!/\.json$/i.test(normalized)) normalized += ".json";
  return normalized;
}

function readPersistedProjectName() {
  try {
    return normalizeProjectFileName(localStorage.getItem(PROJECT_FILE_NAME_KEY), { allowEmpty: true });
  } catch {
    return "";
  }
}

function persistProjectName(fileName) {
  try {
    if (!fileName) {
      localStorage.removeItem(PROJECT_FILE_NAME_KEY);
    } else {
      localStorage.setItem(PROJECT_FILE_NAME_KEY, fileName);
    }
    return true;
  } catch {
    return false;
  }
}

function getCurrentProjectFileName(options = {}) {
  const { allowDefault = true } = options;
  const normalized = normalizeProjectFileName(state.fileSystem.projectFileName, { allowEmpty: true });
  if (normalized) return normalized;
  return allowDefault ? TABLE_EXPORT_FILE_NAME : "";
}

function updateDocumentTitle() {
  const projectName = getCurrentProjectFileName({ allowDefault: false });
  document.title = projectName ? `${projectName} - ${DEFAULT_DOCUMENT_TITLE}` : DEFAULT_DOCUMENT_TITLE;
}

function setCurrentProjectName(fileName, options = {}) {
  const { persist = true } = options;
  const normalized = normalizeProjectFileName(fileName, { allowEmpty: true });
  state.fileSystem.projectFileName = normalized;
  if (persist) persistProjectName(normalized);
  updateDocumentTitle();
  return normalized;
}

function supportsProjectFileAccess() {
  return typeof window.showOpenFilePicker === "function"
    && typeof window.showSaveFilePicker === "function"
    && typeof indexedDB !== "undefined";
}

function isUserAbortError(error) {
  return error?.name === "AbortError";
}

function openFileSystemDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(FILE_SYSTEM_DB_NAME, 1);

    request.addEventListener("upgradeneeded", () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_SYSTEM_STORE_NAME)) {
        db.createObjectStore(FILE_SYSTEM_STORE_NAME);
      }
    });

    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

async function readPersistedProjectFileHandle() {
  if (!supportsProjectFileAccess()) return null;

  try {
    const db = await openFileSystemDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_SYSTEM_STORE_NAME, "readonly");
      const store = tx.objectStore(FILE_SYSTEM_STORE_NAME);
      const request = store.get(PROJECT_FILE_HANDLE_KEY);

      request.addEventListener("success", () => resolve(request.result || null));
      request.addEventListener("error", () => reject(request.error));
      tx.addEventListener("complete", () => db.close());
      tx.addEventListener("error", () => reject(tx.error));
      tx.addEventListener("abort", () => reject(tx.error));
    });
  } catch {
    return null;
  }
}

async function persistProjectFileHandle(handle) {
  if (!supportsProjectFileAccess()) return false;

  try {
    const db = await openFileSystemDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(FILE_SYSTEM_STORE_NAME, "readwrite");
      const store = tx.objectStore(FILE_SYSTEM_STORE_NAME);
      if (handle) {
        store.put(handle, PROJECT_FILE_HANDLE_KEY);
      } else {
        store.delete(PROJECT_FILE_HANDLE_KEY);
      }
      tx.addEventListener("complete", resolve);
      tx.addEventListener("error", () => reject(tx.error));
      tx.addEventListener("abort", () => reject(tx.error));
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

async function queryFilePermission(handle, write = false) {
  if (!handle || typeof handle.queryPermission !== "function") return false;

  try {
    const permission = await handle.queryPermission(write ? { mode: "readwrite" } : { mode: "read" });
    return permission === "granted";
  } catch {
    return false;
  }
}

async function requestFilePermission(handle, write = false) {
  if (!handle || typeof handle.requestPermission !== "function") return false;

  try {
    const permission = await handle.requestPermission(write ? { mode: "readwrite" } : { mode: "read" });
    return permission === "granted";
  } catch {
    return false;
  }
}

async function ensureProjectFileHandlePermission(handle, write = false) {
  if (!handle) return false;
  if (await queryFilePermission(handle, write)) return true;
  return requestFilePermission(handle, write);
}

function buildProjectSavePickerOptions() {
  // Ограничиваем диалог сохранения только JSON-проектами, чтобы браузер сам
  // подставлял нужное расширение и не просил пользователя выбирать формат.
  return {
    suggestedName: getCurrentProjectFileName({ allowDefault: true }),
    excludeAcceptAllOption: true,
    types: PROJECT_FILE_PICKER_TYPES
  };
}

function buildProjectOpenPickerOptions() {
  return {
    excludeAcceptAllOption: true,
    multiple: false,
    types: PROJECT_FILE_PICKER_TYPES
  };
}

async function restoreProjectFromPayload(payload) {
  // Восстанавливаем именно снимок таблицы, чтобы после открытия проекта
  // пользователь получил то же состояние, что было в момент сохранения.
  const restored = applyStoredTablePayload(payload);
  if (!restored) return false;

  saveTableData(false);
  resetHistoryState();
  return true;
}

async function readProjectPayloadFromFile(file) {
  let rawText = "";
  try {
    rawText = await file.text();
  } catch {
    setStatus("Не удалось прочитать файл проекта.");
    return null;
  }

  try {
    return JSON.parse(rawText);
  } catch {
    setStatus(`Файл "${file.name}" содержит невалидный JSON.`);
    return null;
  }
}

async function applyProjectPayload(payload, fileName) {
  const restored = await restoreProjectFromPayload(payload);
  if (!restored) {
    setStatus(`Файл "${fileName}" не похож на проект этой таблицы.`);
    return false;
  }

  setCurrentProjectName(fileName);
  setStatus(`Проект "${fileName}" открыт.`);
  return true;
}

async function saveProjectToFileHandle(fileHandle) {
  if (!fileHandle) return false;

  const hasPermission = await ensureProjectFileHandlePermission(fileHandle, true);
  if (!hasPermission) {
    setStatus("Нет доступа к файлу проекта для записи.");
    return false;
  }

  try {
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(serializeCurrentProject(), null, 2));
    await writable.close();

    state.fileSystem.projectFileHandle = fileHandle;
    setCurrentProjectName(fileHandle.name);
    await persistProjectFileHandle(fileHandle);
    setStatus(`Проект "${fileHandle.name}" сохранен.`);
    return true;
  } catch {
    setStatus("Не удалось записать файл проекта.");
    return false;
  }
}

async function saveProjectAs(options = {}) {
  const { skipLocalAutosave = false } = options;
  if (!skipLocalAutosave && !saveTableData(false)) return false;

  if (!supportsProjectFileAccess()) {
    const fileName = promptProjectFileName();
    if (fileName === null) {
      setStatus("Сохранение проекта отменено.");
      return false;
    }

    const normalizedName = normalizeProjectFileName(fileName, { allowEmpty: true });
    if (!normalizedName) {
      setStatus("Имя файла проекта не указано.");
      return false;
    }

    setCurrentProjectName(normalizedName);
    return downloadProjectFile(normalizedName);
  }

  try {
    const fileHandle = await window.showSaveFilePicker(buildProjectSavePickerOptions());
    return saveProjectToFileHandle(fileHandle);
  } catch (error) {
    if (isUserAbortError(error)) {
      setStatus("Сохранение проекта отменено.");
      return false;
    }

    setStatus("Не удалось открыть диалог сохранения проекта.");
    return false;
  }
}

async function saveProject() {
  if (!saveTableData(false)) return false;

  if (!supportsProjectFileAccess()) {
    const currentName = getCurrentProjectFileName({ allowDefault: false });
    if (!currentName) return saveProjectAs({ skipLocalAutosave: true });
    return downloadProjectFile(currentName);
  }

  let fileHandle = state.fileSystem.projectFileHandle;
  if (!fileHandle) {
    fileHandle = await readPersistedProjectFileHandle();
    if (fileHandle) state.fileSystem.projectFileHandle = fileHandle;
  }

  if (!fileHandle) {
    return saveProjectAs({ skipLocalAutosave: true });
  }

  const hasPermission = await ensureProjectFileHandlePermission(fileHandle, true);
  if (!hasPermission) {
    return saveProjectAs({ skipLocalAutosave: true });
  }

  return saveProjectToFileHandle(fileHandle);
}

async function openProjectFromFileHandle(fileHandle) {
  if (!fileHandle) {
    setStatus("Файл проекта не выбран.");
    return false;
  }

  const hasPermission = await ensureProjectFileHandlePermission(fileHandle, false);
  if (!hasPermission) {
    setStatus("Нет доступа к файлу проекта для чтения.");
    return false;
  }

  try {
    const file = await fileHandle.getFile();
    const payload = await readProjectPayloadFromFile(file);
    if (!payload) return false;

    const applied = await applyProjectPayload(payload, file.name);
    if (!applied) return false;

    state.fileSystem.projectFileHandle = fileHandle;
    await persistProjectFileHandle(fileHandle);
    return true;
  } catch {
    setStatus("Не удалось открыть файл проекта.");
    return false;
  }
}

async function openProject() {
  if (!supportsProjectFileAccess()) {
    openProjectFileInputEl.click();
    return false;
  }

  try {
    const [fileHandle] = await window.showOpenFilePicker(buildProjectOpenPickerOptions());
    return openProjectFromFileHandle(fileHandle || null);
  } catch (error) {
    if (isUserAbortError(error)) {
      setStatus("Открытие проекта отменено.");
      return false;
    }

    setStatus("Не удалось открыть диалог выбора проекта.");
    return false;
  }
}

function extractHistorySnapshot(payload) {
  if (!payload || typeof payload !== "object") return null;

  const candidate =
    payload.snapshot && typeof payload.snapshot === "object"
      ? payload.snapshot
      : payload;

  if (typeof candidate.tbodyHtml !== "string") return null;

  return {
    rows: Math.max(1, Number(candidate.rows) || FIXED_ROW_COUNT),
    tbodyHtml: candidate.tbodyHtml,
    nextMasterId: Math.max(1, Number(candidate.nextMasterId) || 1),
    mergedMasterIds: Array.isArray(candidate.mergedMasterIds) ? candidate.mergedMasterIds : []
  };
}

function extractLegacyTableSnapshot(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (!Array.isArray(payload.data)) return null;

  return {
    rows: Math.max(1, Number(payload.rows) || FIXED_ROW_COUNT),
    data: payload.data
  };
}

function applyStoredTablePayload(payload) {
  const historySnapshot = extractHistorySnapshot(payload);
  if (historySnapshot) {
    return applyHistorySnapshot(historySnapshot, { persist: false });
  }

  const legacySnapshot = extractLegacyTableSnapshot(payload);
  if (legacySnapshot) {
    return applyTableDataSnapshot(legacySnapshot);
  }

  return false;
}

function saveTableData(showStatus = false) {
  try {
    localStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(createPortableTablePayload()));
    if (showStatus) setStatus("Таблица сохранена.");
    return true;
  } catch {
    setStatus("Не удалось сохранить таблицу.");
    return false;
  }
}

function applyTableDataSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return false;

  const data = Array.isArray(snapshot.data) ? snapshot.data : [];
  state.mergedMasterIds.clear();
  state.rows = FIXED_ROW_COUNT;
  buildTable();

  data.slice(0, state.rows).forEach((row, r) => {
    if (!Array.isArray(row)) return;
    row.slice(0, state.cols).forEach((value, c) => {
      const td = getCell(r, c);
      if (td) setRawValue(td, normalizeCellText(td, value));
    });
  });

  renderAllCells();
  clearSelection();
  return true;
}

function loadTableData() {
  try {
    const raw = localStorage.getItem(TABLE_STORAGE_KEY);
    if (!raw) return false;
    const loaded = applyStoredTablePayload(JSON.parse(raw));
    if (loaded) saveTableData(false);
    return loaded;
  } catch {
    return false;
  }
}

function resetHistoryState() {
  state.history = [];
  state.future = [];
  pushHistorySnapshot();
  updateHistoryButtons();
}

function promptProjectFileName(initialValue = TABLE_EXPORT_FILE_NAME) {
  const response = window.prompt("Введите имя файла проекта", getCurrentProjectFileName({ allowDefault: true }) || initialValue);
  if (response === null) return null;
  return response;
}

function downloadProjectFile(fileName = TABLE_EXPORT_FILE_NAME) {
  try {
    // Fallback для браузеров без File System Access API: проект скачивается как файл.
    const payload = serializeCurrentProject();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = normalizeProjectFileName(fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setCurrentProjectName(link.download);
    setStatus(`Проект "${link.download}" выгружен как JSON-файл.`);
    return true;
  } catch {
    setStatus("Не удалось сохранить проект в JSON-файл.");
    return false;
  }
}

async function importProjectFile(file) {
  if (!file) {
    setStatus("Выберите JSON-файл проекта.");
    return false;
  }

  const payload = await readProjectPayloadFromFile(file);
  if (!payload) {
    openProjectFileInputEl.value = "";
    return false;
  }

  const applied = await applyProjectPayload(payload, file.name);
  openProjectFileInputEl.value = "";
  return applied;
}

function refreshIndices() {
  const rows = getBodyRows();
  state.rows = FIXED_ROW_COUNT;
  state.cols = COLUMN_HEADERS.length;

  rows.forEach((tr, r) => {
    const rowNumberCell = tr.querySelector(".row-number");
    if (rowNumberCell) rowNumberCell.textContent = String(r + 1);

    getRowDataCells(tr).forEach((td, c) => {
      td.dataset.row = String(r);
      td.dataset.col = String(c);
    });
  });
}

function clearSelection() {
  state.selected.forEach((key) => {
    const [r, c] = key.split(":").map(Number);
    const cell = getCell(r, c);
    if (cell) cell.classList.remove("selected");
  });
  state.selected.clear();
  updateFillHandle();
}

function clearTableSelection() {
  clearSelection();
  sheet.querySelectorAll("td.selected, td.active, td.focused, th.selected, th.active, th.focused").forEach((cell) => {
    cell.classList.remove("selected", "active", "focused");
    cell.removeAttribute("aria-selected");
  });
}

function addToSelection(td) {
  if (!td || td.classList.contains("hidden")) return;
  const key = cellKey(Number(td.dataset.row), Number(td.dataset.col));
  state.selected.add(key);
  td.classList.add("selected");
  updateFillHandle();
}

function isCellSelected(td) {
  if (!td) return false;
  const key = cellKey(Number(td.dataset.row), Number(td.dataset.col));
  return state.selected.has(key);
}

function getSelectedBounds() {
  if (!state.selected.size) return null;
  const coords = Array.from(state.selected).map((k) => k.split(":").map(Number));
  const rows = coords.map(([r]) => r);
  const cols = coords.map(([, c]) => c);
  return {
    minR: Math.min(...rows),
    maxR: Math.max(...rows),
    minC: Math.min(...cols),
    maxC: Math.max(...cols)
  };
}

function isSelectionRectangular(bounds = getSelectedBounds()) {
  if (!bounds) return false;
  const expectedCount = (bounds.maxR - bounds.minR + 1) * (bounds.maxC - bounds.minC + 1);
  if (expectedCount !== state.selected.size) return false;

  for (let r = bounds.minR; r <= bounds.maxR; r++) {
    for (let c = bounds.minC; c <= bounds.maxC; c++) {
      const td = getCell(r, c);
      if (!td || td.classList.contains("hidden") || !state.selected.has(cellKey(r, c))) {
        return false;
      }
    }
  }

  return true;
}

function getSelectionRange() {
  const bounds = getSelectedBounds();
  return isSelectionRectangular(bounds) ? bounds : null;
}

function forEachRangeCell(range, callback) {
  if (!range) return;
  for (let r = range.minR; r <= range.maxR; r++) {
    for (let c = range.minC; c <= range.maxC; c++) {
      const td = getCell(r, c);
      if (td && !td.classList.contains("hidden")) callback(td, r, c);
    }
  }
}

function setSelectionToRange(range) {
  clearSelection();
  forEachRangeCell(range, (td) => addToSelection(td));
}

function getAnchorCell() {
  if (!state.selected.size) return getCell(0, 0);
  const bounds = getSelectedBounds();
  return getCell(bounds.minR, bounds.minC);
}

function getTableRow(rowIndex) {
  return getBodyRows()[rowIndex] || null;
}

function createEmptyRowValues() {
  return Array(state.cols).fill("");
}

function getMutableTableRows() {
  const snapshot = getTableDataSnapshot();
  const rows = Array.isArray(snapshot.data) ? snapshot.data.slice(0, FIXED_ROW_COUNT) : [];

  while (rows.length < FIXED_ROW_COUNT) {
    rows.push(createEmptyRowValues());
  }

  return rows.map((row) => Array.from({ length: state.cols }, (_, c) => String(row?.[c] ?? "")));
}

function applyMutableTableRows(rows) {
  return applyTableDataSnapshot({
    rows: FIXED_ROW_COUNT,
    data: rows.slice(0, FIXED_ROW_COUNT)
  });
}

function rowHasContent(values = []) {
  return values.some((value) => String(value ?? "").trim() !== "");
}

function hideRowControls() {
  rowControlsEl.hidden = true;
  rowControlsEl.setAttribute("aria-hidden", "true");
}

function clearHoveredRow() {
  if (state.rowHover.row !== null) {
    const previousRow = getTableRow(state.rowHover.row);
    if (previousRow) previousRow.classList.remove("row-hover");
  }

  state.rowHover.row = null;
  state.rowHover.col = null;
  hideRowControls();
}

function showRowControlsForCell(td) {
  if (!td || td.classList.contains("hidden") || isCellEditingNow() || state.fillDragState.isDragging) {
    clearHoveredRow();
    return;
  }

  const rowIndex = Number(td.dataset.row);
  const colIndex = Number(td.dataset.col);
  const currentRow = getTableRow(rowIndex);
  if (!currentRow || currentRow.style.display === "none") {
    clearHoveredRow();
    return;
  }

  if (state.rowHover.row !== rowIndex) {
    const previousRow = getTableRow(state.rowHover.row);
    if (previousRow) previousRow.classList.remove("row-hover");
    currentRow.classList.add("row-hover");
  }

  state.rowHover.row = rowIndex;
  state.rowHover.col = colIndex;
  rowControlsEl.dataset.row = String(rowIndex);
  rowControlsEl.dataset.col = String(colIndex);

  const wrapRect = tableWrapEl.getBoundingClientRect();
  const rowRect = currentRow.getBoundingClientRect();
  rowControlsEl.style.top = `${rowRect.top - wrapRect.top + rowRect.height / 2}px`;
  rowControlsEl.hidden = false;
  rowControlsEl.setAttribute("aria-hidden", "false");
}

function getPinnedRowControlsTarget() {
  const row = Number(rowControlsEl.dataset.row);
  const col = Number(rowControlsEl.dataset.col);
  if (Number.isInteger(row) && Number.isInteger(col)) {
    return { row, col };
  }
  return null;
}

function resolveRowActionTarget() {
  if (Number.isInteger(state.rowHover.row) && Number.isInteger(state.rowHover.col)) {
    return {
      row: state.rowHover.row,
      col: state.rowHover.col
    };
  }

  const anchor = state.selected.size === 1 ? getAnchorCell() : null;
  if (anchor) {
    return {
      row: Number(anchor.dataset.row),
      col: Number(anchor.dataset.col)
    };
  }

  return { row: 0, col: 0 };
}

function insertRowAboveTarget() {
  const target = getPinnedRowControlsTarget() || resolveRowActionTarget();
  return insertRowAt(target.row, target.col);
}

function insertRowBelowTarget() {
  const target = getPinnedRowControlsTarget() || resolveRowActionTarget();
  return insertRowAt(Math.min(FIXED_ROW_COUNT - 1, target.row + 1), target.col);
}

function deleteCurrentTargetRow() {
  const target = getPinnedRowControlsTarget() || resolveRowActionTarget();
  return deleteRowAt(target.row, target.col);
}

function insertRowBelowSelectionTarget() {
  const target = resolveRowActionTarget();
  return insertRowAt(Math.min(FIXED_ROW_COUNT - 1, target.row + 1), target.col);
}

function deleteSelectionTargetRow() {
  const target = resolveRowActionTarget();
  return deleteRowAt(target.row, target.col);
}

function bindButtonActivation(button, handler, options = {}) {
  if (!button || typeof handler !== "function") return;

  const { pointerDown = false } = options;

  if (pointerDown) {
    button.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      button.dataset.pointerActivated = "true";
      handler();
    });
  }

  button.addEventListener("click", (e) => {
    if (button.dataset.pointerActivated === "true") {
      delete button.dataset.pointerActivated;
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    handler();
  });
}

function canMutateRows() {
  if (isCrossImportOpen() || isCrossEditOpen()) {
    setStatus("Сначала закройте открытое окно, потом меняйте строки.");
    return false;
  }

  if (state.fillDragState.isDragging) {
    cancelFillDrag(false);
  }

  blurEditingCell();
  return true;
}

function focusRowActionResult(rowIndex, colIndex) {
  const targetCell = getCell(rowIndex, Math.max(0, Math.min(state.cols - 1, colIndex)));
  if (!targetCell) return;
  selectCell(targetCell);
  showRowControlsForCell(targetCell);
}

function insertRowAt(rowIndex, colIndex = 0) {
  const hadMergedCells = hasMergedCells();
  if (!canMutateRows()) return false;
  if (hadMergedCells) unmergeAll(true);

  const targetRow = Math.max(0, Math.min(FIXED_ROW_COUNT - 1, Number(rowIndex) || 0));
  const rows = getMutableTableRows();
  const droppedLastRow = rows[FIXED_ROW_COUNT - 1] || createEmptyRowValues();
  const hadActiveSearch = hasActiveTableSearch();
  let searchResetForVisibility = false;

  rows.splice(targetRow, 0, createEmptyRowValues());
  rows.length = FIXED_ROW_COUNT;

  if (!applyMutableTableRows(rows)) return false;
  if (hadActiveSearch && getTableRow(targetRow)?.style.display === "none") {
    resetTableSearch();
    searchResetForVisibility = true;
  }
  focusRowActionResult(targetRow, colIndex);
  saveTableData(false);
  pushHistorySnapshot();

  const statusParts = [`Строка ${targetRow + 1} вставлена.`];
  if (rowHasContent(droppedLastRow)) {
    statusParts.push("Последняя строка вышла за предел 1500 строк.");
  }
  if (searchResetForVisibility) {
    statusParts.push("Поиск сброшен, чтобы показать новую пустую строку.");
  }
  if (hadMergedCells) {
    statusParts.push("Объединения сняты автоматически.");
  }
  setStatus(statusParts.join(" "));
  return true;
}

function deleteRowAt(rowIndex, colIndex = 0) {
  const hadMergedCells = hasMergedCells();
  if (!canMutateRows()) return false;
  if (hadMergedCells) unmergeAll(true);

  const targetRow = Math.max(0, Math.min(FIXED_ROW_COUNT - 1, Number(rowIndex) || 0));
  const rows = getMutableTableRows();
  const hadActiveSearch = hasActiveTableSearch();
  let searchResetForVisibility = false;

  rows.splice(targetRow, 1);
  rows.push(createEmptyRowValues());

  if (!applyMutableTableRows(rows)) return false;
  if (hadActiveSearch && getTableRow(targetRow)?.style.display === "none") {
    resetTableSearch();
    searchResetForVisibility = true;
  }
  focusRowActionResult(targetRow, colIndex);
  saveTableData(false);
  pushHistorySnapshot();
  const statusParts = [`Строка ${targetRow + 1} удалена.`];
  if (searchResetForVisibility) {
    statusParts.push("Поиск сброшен, чтобы показать результат сдвига строк.");
  }
  if (hadMergedCells) {
    statusParts.push("Объединения сняты автоматически.");
  }
  setStatus(statusParts.join(" "));
  return true;
}

function hideFillHandle() {
  fillHandleEl.hidden = true;
}

function clearFillPreview() {
  forEachRangeCell(state.fillDragState.previewRange, (td) => td.classList.remove("fill-preview"));
  state.fillDragState.previewRange = null;
  state.fillDragState.direction = null;
}

function updateFillHandle() {
  if (state.fillDragState.isDragging || isCellEditingNow()) {
    hideFillHandle();
    return;
  }

  const range = getSelectionRange();
  if (!range) {
    hideFillHandle();
    return;
  }

  const edgeCell = getCell(range.maxR, range.maxC);
  const tableWrap = fillHandleEl.parentElement;
  if (!edgeCell || !tableWrap) {
    hideFillHandle();
    return;
  }

  const wrapRect = tableWrap.getBoundingClientRect();
  const cellRect = edgeCell.getBoundingClientRect();
  fillHandleEl.style.left = `${cellRect.right - wrapRect.left - 5}px`;
  fillHandleEl.style.top = `${cellRect.bottom - wrapRect.top - 5}px`;
  fillHandleEl.hidden = false;
}

function getFillDragDirection(sourceRange, targetRow, targetCol) {
  const candidates = [];
  if (targetRow < sourceRange.minR) candidates.push({ direction: "up", distance: sourceRange.minR - targetRow });
  if (targetRow > sourceRange.maxR) candidates.push({ direction: "down", distance: targetRow - sourceRange.maxR });
  if (targetCol < sourceRange.minC) candidates.push({ direction: "left", distance: sourceRange.minC - targetCol });
  if (targetCol > sourceRange.maxC) candidates.push({ direction: "right", distance: targetCol - sourceRange.maxC });

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.distance - a.distance);
  return candidates[0].direction;
}

function expandRangeByDirection(sourceRange, targetCell) {
  if (!sourceRange || !targetCell) return { previewRange: null, direction: null };

  const targetRow = Number(targetCell.dataset.row);
  const targetCol = Number(targetCell.dataset.col);
  const direction = getFillDragDirection(sourceRange, targetRow, targetCol);
  if (!direction) return { previewRange: null, direction: null };

  let previewRange = null;
  if (direction === "down") {
    previewRange = {
      minR: sourceRange.maxR + 1,
      maxR: targetRow,
      minC: sourceRange.minC,
      maxC: sourceRange.maxC
    };
  }

  if (direction === "up") {
    previewRange = {
      minR: targetRow,
      maxR: sourceRange.minR - 1,
      minC: sourceRange.minC,
      maxC: sourceRange.maxC
    };
  }

  if (direction === "right") {
    previewRange = {
      minR: sourceRange.minR,
      maxR: sourceRange.maxR,
      minC: sourceRange.maxC + 1,
      maxC: targetCol
    };
  }

  if (direction === "left") {
    previewRange = {
      minR: sourceRange.minR,
      maxR: sourceRange.maxR,
      minC: targetCol,
      maxC: sourceRange.minC - 1
    };
  }

  if (!previewRange || previewRange.minR > previewRange.maxR || previewRange.minC > previewRange.maxC) {
    return { previewRange: null, direction: null };
  }

  return { previewRange, direction };
}

function updateFillPreview(targetCell) {
  clearFillPreview();
  if (!state.fillDragState.isDragging) return;

  const { previewRange, direction } = expandRangeByDirection(state.fillDragState.sourceRange, targetCell);
  if (!previewRange) return;

  state.fillDragState.previewRange = previewRange;
  state.fillDragState.direction = direction;
  forEachRangeCell(previewRange, (td) => td.classList.add("fill-preview"));
}

function copyValuesToRange(sourceRange, targetRange) {
  if (!sourceRange || !targetRange) return false;

  const sourceRows = sourceRange.maxR - sourceRange.minR + 1;
  const sourceCols = sourceRange.maxC - sourceRange.minC + 1;
  const sourceValues = [];

  for (let r = 0; r < sourceRows; r++) {
    const rowValues = [];
    for (let c = 0; c < sourceCols; c++) {
      rowValues.push(getRawValue(getCell(sourceRange.minR + r, sourceRange.minC + c)));
    }
    sourceValues.push(rowValues);
  }

  forEachRangeCell(targetRange, (td, r, c) => {
    const rowOffset = r - targetRange.minR;
    const colOffset = c - targetRange.minC;
    setRawValue(td, sourceValues[rowOffset % sourceRows][colOffset % sourceCols]);
  });

  return true;
}

function startFillDrag() {
  const sourceRange = getSelectionRange();
  if (!sourceRange || isCellEditingNow()) return;

  clearHoveredRow();
  state.fillDragState.isDragging = true;
  state.fillDragState.sourceRange = { ...sourceRange };
  state.fillDragState.previewRange = null;
  state.fillDragState.direction = null;
  hideFillHandle();
}

function cancelFillDrag(showStatus = false) {
  clearFillPreview();
  state.fillDragState.isDragging = false;
  state.fillDragState.sourceRange = null;
  state.fillDragState.previewRange = null;
  state.fillDragState.direction = null;
  updateFillHandle();
  if (showStatus) setStatus("Автозаполнение отменено.");
}

function applyFillDrag() {
  const { sourceRange, previewRange } = state.fillDragState;
  if (!sourceRange || !previewRange) {
    cancelFillDrag(false);
    return false;
  }

  copyValuesToRange(sourceRange, previewRange);
  clearFillPreview();

  const combinedRange = {
    minR: Math.min(sourceRange.minR, previewRange.minR),
    maxR: Math.max(sourceRange.maxR, previewRange.maxR),
    minC: Math.min(sourceRange.minC, previewRange.minC),
    maxC: Math.max(sourceRange.maxC, previewRange.maxC)
  };

  state.fillDragState.isDragging = false;
  state.fillDragState.sourceRange = null;
  state.fillDragState.previewRange = null;
  state.fillDragState.direction = null;

  setSelectionToRange(combinedRange);
  renderAllCells();
  saveTableData(false);
  pushHistorySnapshot();
  updateFillHandle();
  setStatus("Автозаполнение выполнено.");
  return true;
}

function colLettersToIndex(letters) {
  let result = 0;
  for (let i = 0; i < letters.length; i++) {
    result = result * 26 + (letters.charCodeAt(i) - 64);
  }
  return result - 1;
}

function parseRef(ref) {
  const match = /^([A-Z]+)(\d+)$/.exec(ref.toUpperCase());
  if (!match) return null;
  return {
    r: Number(match[2]) - 1,
    c: colLettersToIndex(match[1])
  };
}

function tryParseNumber(value) {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return null;
  if (!/^[-+]?\d+(\.\d+)?$/.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function splitTopLevel(str, delimiter = ",") {
  const parts = [];
  let depth = 0;
  let current = "";

  for (const ch of str) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === delimiter && depth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += ch;
  }

  parts.push(current);
  return parts;
}

function formatNumber(value) {
  if (Number.isInteger(value)) return String(value);
  return String(Number(value.toFixed(10)));
}

function evaluateCell(td, visiting = new Set()) {
  if (!td) return { error: false, value: 0, isNumber: true };

  const key = cellKey(Number(td.dataset.row), Number(td.dataset.col));
  if (visiting.has(key)) return { error: true, value: "#CYCLE", isNumber: false };

  visiting.add(key);
  const raw = getRawValue(td);

  if (!raw.startsWith("=")) {
    visiting.delete(key);
    const number = tryParseNumber(raw);
    if (number !== null) return { error: false, value: number, isNumber: true };
    return { error: false, value: raw, isNumber: false };
  }

  try {
    const numeric = evaluateFormula(raw.slice(1), visiting);
    visiting.delete(key);
    return { error: false, value: numeric, isNumber: true };
  } catch {
    visiting.delete(key);
    return { error: true, value: "#ERR", isNumber: false };
  }
}

function getNumericFromRef(ref, visiting) {
  const point = parseRef(ref);
  if (!point) return 0;
  const cell = getCell(point.r, point.c);
  if (!cell) return 0;
  const result = evaluateCell(cell, visiting);
  if (result.error) throw new Error("ref_error");
  if (typeof result.value === "number") return result.value;
  const parsed = tryParseNumber(String(result.value));
  return parsed === null ? 0 : parsed;
}
function evaluateSumArgs(content, visiting) {
  const args = splitTopLevel(content.replace(/;/g, ","), ",")
    .map((x) => x.trim())
    .filter(Boolean);
  let total = 0;

  for (const arg of args) {
    const rangeMatch = /^([A-Z]+\d+):([A-Z]+\d+)$/i.exec(arg);
    if (rangeMatch) {
      const start = parseRef(rangeMatch[1]);
      const end = parseRef(rangeMatch[2]);
      if (!start || !end) continue;
      const minR = Math.min(start.r, end.r);
      const maxR = Math.max(start.r, end.r);
      const minC = Math.min(start.c, end.c);
      const maxC = Math.max(start.c, end.c);

      for (let r = minR; r <= maxR; r++) {
        for (let c = minC; c <= maxC; c++) {
          const cell = getCell(r, c);
          if (!cell) continue;
          const result = evaluateCell(cell, visiting);
          if (result.error) throw new Error("sum_error");
          const numeric = typeof result.value === "number"
            ? result.value
            : tryParseNumber(String(result.value));
          if (numeric !== null) total += numeric;
        }
      }
      continue;
    }

    if (/^[A-Z]+\d+$/i.test(arg)) {
      total += getNumericFromRef(arg, visiting);
      continue;
    }

    total += evaluateFormula(arg, visiting);
  }

  return total;
}

function evaluateFormula(expression, visiting) {
  let prepared = expression.trim();

  while (/SUM\(/i.test(prepared)) {
    prepared = prepared.replace(/SUM\(([^()]*)\)/gi, (_, inside) => {
      const value = evaluateSumArgs(inside, visiting);
      return String(value);
    });
  }

  prepared = prepared.replace(/\b([A-Z]+\d+)\b/gi, (ref) => {
    const value = getNumericFromRef(ref.toUpperCase(), visiting);
    return String(value);
  });

  prepared = prepared.replace(/,/g, ".");
  if (!/^[\d+\-*/().\s]+$/.test(prepared)) {
    throw new Error("unsafe_expression");
  }

  const result = Function(`"use strict"; return (${prepared});`)();
  if (!Number.isFinite(result)) throw new Error("nan_result");
  return result;
}

function renderCell(td) {
  if (!td || td.classList.contains("hidden")) return;
  if (state.editingCell
    && Number(td.dataset.row) === state.editingCell.row
    && Number(td.dataset.col) === state.editingCell.column) {
    return;
  }
  const raw = getRawValue(td);

  if (!raw) {
    td.textContent = "";
    td.classList.remove("numeric");
    return;
  }

  if (raw.startsWith("=")) {
    const result = evaluateCell(td, new Set());
    if (result.error) {
      td.textContent = "#ERR";
      td.classList.remove("numeric");
      return;
    }

    td.textContent = typeof result.value === "number"
      ? formatNumber(result.value)
      : String(result.value);
    td.classList.add("numeric");
    return;
  }

  td.textContent = raw;
  td.classList.toggle("numeric", tryParseNumber(raw) !== null);
}

function renderAllCells() {
  const cells = sheet.querySelectorAll('tbody td[data-col]');
  cells.forEach((td) => renderCell(td));
  clearTableSearchCache();
  refreshTableSearch();
  updateFillHandle();
}

function getEditingTd() {
  if (!state.editingCell) return null;
  return getCell(state.editingCell.row, state.editingCell.column);
}

function blurEditingCell() {
  if (!state.editingCell) return;
  saveCellEdit();
}

function isCellEditingNow() {
  return Boolean(state.editingCell) || isCrossEditOpen();
}

function updateCellValue(row, column, value) {
  const td = getCell(row, column);
  if (!td || td.classList.contains("hidden")) return false;
  const normalized = normalizeCellText(td, value);
  const previousValue = getRawValue(td);
  setRawValue(td, normalized);
  renderCell(td);

  if (isTableSearchColumn(column)) {
    invalidateTableSearchCacheForRow(row);
  }

  if (previousValue !== normalized) {
    saveTableData(false);
    pushHistorySnapshot();
    refreshTableSearch();
    return true;
  }
  refreshTableSearch();
  return false;
}

function destroyCellEditor(td) {
  if (!td) return;
  td.classList.remove("editing");
  const editor = td.querySelector(".cell-editor");
  if (editor) editor.remove();
}

function isEditingSameCell(td) {
  return Boolean(
    td
    && state.editingCell
    && Number(td.dataset.row) === state.editingCell.row
    && Number(td.dataset.col) === state.editingCell.column
  );
}

function updateCellEditorLayout(editor, td) {
  if (!editor || !td) return;

  const tdRect = td.getBoundingClientRect();
  const viewportWidth = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  const maxEditorWidth = Math.max(tdRect.width, viewportWidth - tdRect.left - 24);
  const preferredWidth = Math.max(tdRect.width + 2, Math.min(640, maxEditorWidth));

  editor.style.width = `${preferredWidth}px`;
  editor.style.height = "auto";
  editor.style.height = `${Math.max(tdRect.height + 2, editor.scrollHeight)}px`;
}

function focusCellForEdit(td, value = getRawValue(td)) {
  if (!td || td.classList.contains("hidden")) return;
  clearHoveredRow();
  if (isCrossCell(td)) {
    openCrossEditModal(td, value);
    return;
  }
  if (isEditingSameCell(td)) {
    state.editingCell.editor.focus();
    updateCellEditorLayout(state.editingCell.editor, td);
    return;
  }

  destroyCellEditor(td);
  td.classList.add("editing");

  const editor = document.createElement("textarea");
  editor.className = "cell-editor";
  if (td.classList.contains("center-col")) editor.classList.add("center-editor");
  editor.setAttribute("wrap", "soft");
  editor.value = value;
  editor.rows = 1;
  editor.addEventListener("input", () => {
    updateCellEditorLayout(editor, td);
  });
  editor.addEventListener("blur", () => {
    if (state.editingCell?.editor !== editor) return;
    saveCellEdit();
  });
  editor.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveCellEdit();
      moveActiveCell(e.shiftKey ? -1 : 1, 0, { allowRowExpand: !e.shiftKey });
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      cancelCellEdit();
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      saveCellEdit();
      moveActiveCell(0, e.shiftKey ? -1 : 1, { allowRowExpand: false });
    }
  });

  td.textContent = "";
  td.appendChild(editor);
  state.editingCell = {
    row: Number(td.dataset.row),
    column: Number(td.dataset.col),
    value: getRawValue(td),
    editor
  };

  updateCellEditorLayout(editor, td);
  editor.focus();
  const cursorPosition = editor.value.length;
  editor.setSelectionRange(cursorPosition, cursorPosition);
}

function startCellEdit(row, column, valueOverride = null) {
  const td = getCell(row, column);
  if (!td || td.classList.contains("hidden")) return;
  if (isCrossCell(td)) {
    if (state.editingCell) saveCellEdit();
    clearSelection();
    addToSelection(td);
    openCrossEditModal(td, valueOverride ?? getRawValue(td));
    return;
  }

  if (isEditingSameCell(td)) {
    focusCellForEdit(td);
    return;
  }

  if (state.editingCell && (state.editingCell.row !== row || state.editingCell.column !== column)) {
    saveCellEdit();
  }

  clearSelection();
  addToSelection(td);
  focusCellForEdit(td, valueOverride ?? getRawValue(td));
}

function saveCellEdit() {
  if (!state.editingCell) return false;

  const { row, column, editor } = state.editingCell;
  const td = getCell(row, column);
  const nextValue = editor.value;
  state.editingCell = null;
  destroyCellEditor(td);
  const changed = updateCellValue(row, column, nextValue);
  selectCell(td);
  return changed;
}

function cancelCellEdit() {
  if (!state.editingCell) return false;
  const { row, column, value } = state.editingCell;
  const td = getCell(row, column);
  state.editingCell = null;
  destroyCellEditor(td);
  renderCell(td);
  selectCell(td);
  setStatus("Изменения отменены.");
  return value;
}

function closeCellEditor() {
  if (state.editingCell) {
    // При явном выходе из таблицы безопаснее сохранить набранное, чем потерять ввод.
    saveCellEdit();
    return true;
  }

  if (isCrossEditOpen()) {
    applyCrossEditModal();
    return true;
  }

  sheet.querySelectorAll("td.editing").forEach((td) => {
    destroyCellEditor(td);
    renderCell(td);
  });

  return false;
}

function clearActiveCell() {
  const activeElement = document.activeElement;
  const isTableOwnedFocus = Boolean(activeElement && sheet.contains(activeElement));

  if (isTableOwnedFocus && typeof activeElement.blur === "function") {
    activeElement.blur();
  }

  sheet.querySelectorAll("td.active, td.focused, th.active, th.focused").forEach((cell) => {
    cell.classList.remove("active", "focused");
  });
}

function focusSearchInput(input) {
  if (!input) return;

  const selectionStart = typeof input.selectionStart === "number" ? input.selectionStart : input.value.length;
  const selectionEnd = typeof input.selectionEnd === "number" ? input.selectionEnd : input.value.length;
  const selectionDirection = input.selectionDirection || "none";

  requestAnimationFrame(() => {
    // Оставляем фокус в поиске: после жеста пользователь чаще всего продолжает печатать запрос.
    input.focus({ preventScroll: true });
    if (typeof input.setSelectionRange === "function") {
      input.setSelectionRange(selectionStart, selectionEnd, selectionDirection);
    }
  });
}

function resetTableInteractionState() {
  if (state.fillDragState.isDragging) {
    cancelFillDrag(false);
  }

  state.isSelecting = false;
  state.didDrag = false;
  state.selectionMouseButton = null;

  closeCellEditor();
  clearTableSelection();
  clearActiveCell();
  clearHoveredRow();
}

function handleSearchInputFocus() {
  resetTableInteractionState();
}

function startEditWithText(td, text) {
  if (!td || td.classList.contains("hidden")) return;
  startCellEdit(
    Number(td.dataset.row),
    Number(td.dataset.col),
    typeof text === "string" ? text : getRawValue(td)
  );
}

function selectCell(td) {
  if (!td || td.classList.contains("hidden")) return;
  clearSelection();
  addToSelection(td);
  td.scrollIntoView({ block: "nearest", inline: "nearest" });
}

function moveSelection(td, dr, dc, shouldEdit = false) {
  if (!td) return;
  const currentR = Number(td.dataset.row);
  const currentC = Number(td.dataset.col);
  const nextR = Math.max(0, Math.min(state.rows - 1, currentR + dr));
  const nextC = Math.max(0, Math.min(state.cols - 1, currentC + dc));
  const next = getCell(nextR, nextC);
  if (!next) return;
  selectCell(next);
  if (shouldEdit) startCellEdit(nextR, nextC);
}

function moveActiveCell(rowOffset, colOffset, options = {}) {
  const { startEdit = false, allowRowExpand = false } = options;
  const anchor = state.selected.size === 1 ? getAnchorCell() : getCell(0, 0);
  if (!anchor) return;

  const currentRow = Number(anchor.dataset.row);
  const currentCol = Number(anchor.dataset.col);
  let nextRow = currentRow + rowOffset;
  const nextCol = Math.max(0, Math.min(state.cols - 1, currentCol + colOffset));

  if (allowRowExpand && nextRow >= state.rows && state.rows < FIXED_ROW_COUNT) {
    ensureRowCapacity(nextRow + 1);
  }

  nextRow = Math.max(0, Math.min(state.rows - 1, nextRow));
  const nextCell = getCell(nextRow, nextCol);
  if (!nextCell || nextCell.classList.contains("hidden")) return;

  selectCell(nextCell);
  if (startEdit) startCellEdit(nextRow, nextCol);
}

function unmergeAll(silent = false) {
  if (!state.mergedMasterIds.size) return;

  state.mergedMasterIds.forEach((id) => {
    const master = sheet.querySelector(`td[data-master-id="${id}"]`);
    if (!master) return;

    master.colSpan = 1;
    master.rowSpan = 1;
    master.removeAttribute("data-master-id");

    const hidden = sheet.querySelectorAll(`td[data-hidden-by="${id}"]`);
    hidden.forEach((cell) => {
      cell.classList.remove("hidden");
      cell.removeAttribute("data-hidden-by");
    });
  });

  state.mergedMasterIds.clear();
  renderAllCells();
  if (!silent) setStatus("Все объединения сняты.");
}

function hasMergedCells() {
  return state.mergedMasterIds.size > 0;
}

function copySelectionToClipboard() {
  const bounds = getSelectedBounds();
  if (!bounds) return false;

  const rows = bounds.maxR - bounds.minR + 1;
  const cols = bounds.maxC - bounds.minC + 1;
  const data = [];

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      const td = getCell(bounds.minR + r, bounds.minC + c);
      row.push(getRawValue(td));
    }
    data.push(row);
  }

  state.clipboard = { rows, cols, data };
  return true;
}

function pasteFromClipboard() {
  if (!state.clipboard) return false;
  const anchor = getAnchorCell();
  if (!anchor) return false;

  const startR = Number(anchor.dataset.row);
  const startC = Number(anchor.dataset.col);

  for (let r = 0; r < state.clipboard.rows; r++) {
    for (let c = 0; c < state.clipboard.cols; c++) {
      const td = getCell(startR + r, startC + c);
      if (!td || td.classList.contains("hidden")) continue;
      setRawValue(td, state.clipboard.data[r][c]);
    }
  }

  renderAllCells();
  saveTableData(false);
  pushHistorySnapshot();
  return true;
}

fillHandleEl.addEventListener("mousedown", (e) => {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  startFillDrag();
});

sheet.addEventListener("mousedown", (e) => {
  if (state.fillDragState.isDragging) return;
  if (isCellEditingNow()) {
    const editingTd = getEditingTd();
    const clickedTd = e.target.closest("td");

    if (clickedTd && editingTd && clickedTd === editingTd) return;

    if (clickedTd) {
      saveCellEdit();
      if (e.button === 0) {
        selectCell(clickedTd);
        e.preventDefault();
      }
      return;
    }

    saveCellEdit();
    return;
  }

  if (e.button !== 0) return;
  const td = e.target.closest("td");
  if (!td || td.classList.contains("hidden")) return;

  state.isSelecting = true;
  state.didDrag = false;
  state.selectionMouseButton = e.button;
  clearSelection();
  addToSelection(td);
  e.preventDefault();
});

sheet.addEventListener("mousemove", (e) => {
  if (state.fillDragState.isDragging) return;
  if (isCellEditingNow()) return;
  if (!state.isSelecting) return;
  const td = e.target.closest("td");
  if (!td || td.classList.contains("hidden")) return;
  state.didDrag = true;
  addToSelection(td);
});

sheet.addEventListener("mousemove", (e) => {
  const td = e.target.closest("td");
  if (!td || td.classList.contains("hidden")) return;
  showRowControlsForCell(td);
});

tableWrapEl.addEventListener("mouseleave", () => {
  clearHoveredRow();
});

rowControlsEl.addEventListener("mousemove", () => {
  const target = resolveRowActionTarget();
  const td = getCell(target.row, target.col);
  if (td) showRowControlsForCell(td);
});

document.addEventListener("mousemove", (e) => {
  if (!state.fillDragState.isDragging) return;
  const target = document.elementFromPoint(e.clientX, e.clientY)?.closest("td");
  if (!target || target.classList.contains("hidden")) return;
  updateFillPreview(target);
});

document.addEventListener("mouseup", () => {
  if (state.fillDragState.isDragging) {
    if (state.fillDragState.previewRange) {
      applyFillDrag();
    } else {
      cancelFillDrag(false);
    }
    return;
  }

  if (state.isSelecting && state.selectionMouseButton === 0 && !state.didDrag && state.selected.size === 1) {
    const anchor = getAnchorCell();
    blurEditingCell();
    selectCell(anchor);
  }
  state.isSelecting = false;
  state.selectionMouseButton = null;
});

sheet.addEventListener("dblclick", (e) => {
  if (e.button !== 0) return;
  const td = e.target.closest("td");
  if (!td || td.classList.contains("hidden")) return;
  e.preventDefault();
  startCellEdit(Number(td.dataset.row), Number(td.dataset.col));
});

sheet.addEventListener("contextmenu", (e) => {
  const td = e.target.closest("td");
  if (!isCrossCell(td) || td.classList.contains("hidden")) return;

  if (!isCellSelected(td)) {
    clearSelection();
    addToSelection(td);
  }
  startCellEdit(Number(td.dataset.row), Number(td.dataset.col));
  setStatus("Ячейка 'Кросы' готова к вставке через правую кнопку мыши.");
});

document.addEventListener("click", (e) => {
  if (isCrossImportOpen() || isCrossEditOpen()) return;
  if (!state.selected.size) return;
  if (e.target.closest("#sheet")) return;
  if (e.target.closest("#fillHandle")) return;
  if (e.target.closest("button, input, label, select, textarea, a")) return;

  blurEditingCell();
  clearSelection();
});

document.addEventListener("paste", (e) => {
  if (isCrossImportOpen() || isCrossEditOpen()) return;
  if (isCellEditingNow()) return;
  const activeTd = e.target.closest?.("td");
  const anchor = state.selected.size === 1 ? getAnchorCell() : null;
  const td = activeTd || anchor;
  if (!td || td.classList.contains("hidden")) return;

  const pastedText = e.clipboardData?.getData("text/plain");
  if (typeof pastedText !== "string" || pastedText.length === 0) return;
  const colIndex = Number(td.dataset.col);

  if (!isProtectedPasteColumn(colIndex)) {
    e.preventDefault();
    pasteLinesIntoColumn(td, pastedText);
    return;
  }

  if (!isCrossCell(td) && document.activeElement !== td) return;

  e.preventDefault();
  insertTextIntoCell(td, pastedText);
  setStatus(isCrossCell(td)
    ? "Данные из буфера вставлены в ячейку 'Кросы'."
    : "Данные из буфера вставлены в активную ячейку.");
});

sheet.addEventListener("keydown", (e) => {
  if (isCellEditingNow()) return;
  const td = e.target.closest("td");
  if (!td || td.classList.contains("hidden")) return;

  if (e.key === "ArrowUp") {
    e.preventDefault();
    td.blur();
    moveSelection(td, -1, 0, false);
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    td.blur();
    moveSelection(td, 1, 0, false);
  }

  if (e.key === "ArrowLeft") {
    e.preventDefault();
    td.blur();
    moveSelection(td, 0, -1, false);
  }

  if (e.key === "ArrowRight") {
    e.preventDefault();
    td.blur();
    moveSelection(td, 0, 1, false);
  }

  if (e.key === "Enter") {
    e.preventDefault();
    td.blur();
    moveSelection(td, 1, 0, false);
  }

  if (e.key === "Tab") {
    e.preventDefault();
    td.blur();
    moveSelection(td, 0, e.shiftKey ? -1 : 1, false);
  }

  if (e.key === "Escape") {
    e.preventDefault();
    renderCell(td);
    td.blur();
    clearSelection();
  }
});

document.addEventListener("keydown", async (e) => {
  const ctrlOrCmd = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();
  const isEditing = isCellEditingNow();
  const anchor = state.selected.size === 1 ? getAnchorCell() : getCell(0, 0);

  if (isCrossImportOpen() || isCrossEditOpen()) {
    return;
  }

  if (e.key === "Escape" && state.fillDragState.isDragging) {
    e.preventDefault();
    cancelFillDrag(true);
    return;
  }

  if (e.key === "Escape" && !isEditing) {
    if (!state.selected.size) return;
    e.preventDefault();
    clearSelection();
    blurEditingCell();
    setStatus("Выделение снято.");
    return;
  }

  if (isEditing) return;

  if (ctrlOrCmd && !e.altKey && key === "z" && !e.shiftKey && !isEditing) {
    e.preventDefault();
    undoLastAction();
    return;
  }

  if (ctrlOrCmd && !e.altKey && ((key === "y" && !e.shiftKey) || (key === "z" && e.shiftKey)) && !isEditing) {
    e.preventDefault();
    redoLastAction();
    return;
  }

  if (!isEditing && !ctrlOrCmd && !e.altKey && state.selected.size <= 1) {
    if (state.selected.size === 0 && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
      e.preventDefault();
      selectCell(getCell(0, 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveSelection(anchor, -1, 0, false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveSelection(anchor, 1, 0, false);
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      moveSelection(anchor, 0, -1, false);
      return;
    }

    if (e.key === "ArrowRight") {
      e.preventDefault();
      moveSelection(anchor, 0, 1, false);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      moveSelection(anchor, 0, e.shiftKey ? -1 : 1, false);
      return;
    }
  }

  if (ctrlOrCmd && key === "c") {
    if (copySelectionToClipboard()) {
      e.preventDefault();
      setStatus("Скопировано в буфер таблицы.");
    }
  }

  if (ctrlOrCmd && key === "v") {
    if (!isEditing && isCrossCell(anchor)) {
      e.preventDefault();

      const inserted = await pasteSystemClipboardIntoCell(
        anchor,
        "Данные из буфера вставлены в ячейку 'Кросы'."
      );

      if (!inserted) {
        openCrossEditModal(anchor);
        setStatus('Открыт большой редактор для ячейки "Кросы". Вставьте данные в окно.');
      }
      return;
    }

    if (isEditing) return;
    if (pasteFromClipboard()) {
      e.preventDefault();
      setStatus("Вставка выполнена.");
    }
  }

  if (!isEditing && (e.key === "Delete" || e.key === "Backspace") && state.selected.size > 0) {
    e.preventDefault();
    state.selected.forEach((keyItem) => {
      const [r, c] = keyItem.split(":").map(Number);
      const td = getCell(r, c);
      if (!td || td.classList.contains("hidden")) return;
      setRawValue(td, "");
    });
    renderAllCells();
    saveTableData(false);
    pushHistorySnapshot();
    setStatus("Выделенные ячейки очищены.");
  }

  if (!isEditing && !ctrlOrCmd && !e.altKey && e.key.length === 1 && state.selected.size === 1) {
    e.preventDefault();
    startEditWithText(anchor, e.key);
  }

  if (!isEditing && e.key === "Enter" && state.selected.size === 1) {
    e.preventDefault();
    startEditWithText(anchor);
  }
});

bindButtonActivation(addRowBtn, insertRowBelowSelectionTarget);
bindButtonActivation(removeRowBtn, deleteSelectionTargetRow);
bindButtonActivation(insertRowAboveMouseBtn, insertRowAboveTarget, { pointerDown: true });
bindButtonActivation(insertRowBelowMouseBtn, insertRowBelowTarget, { pointerDown: true });
bindButtonActivation(removeRowMouseBtn, deleteCurrentTargetRow, { pointerDown: true });

document.getElementById("clearCells").addEventListener("click", () => {
  if (!state.selected.size) {
    setStatus("Сначала выделите ячейки для очистки.");
    return;
  }

  state.selected.forEach((keyItem) => {
    const [r, c] = keyItem.split(":").map(Number);
    const cell = getCell(r, c);
    if (cell && !cell.classList.contains("hidden")) {
      cell.dataset.raw = "";
    }
  });

  renderAllCells();
  saveTableData(false);
  pushHistorySnapshot();
  setStatus("Выделенные ячейки очищены.");
});

openProjectBtn.addEventListener("click", async () => {
  await openProject();
});

saveProjectBtn.addEventListener("click", async () => {
  await saveProject();
});

saveProjectAsBtn.addEventListener("click", async () => {
  await saveProjectAs();
});

openProjectFileInputEl.addEventListener("change", async (event) => {
  await importProjectFile(event.target.files?.[0] || null);
});

openProjectFileInputEl.addEventListener("cancel", () => {
  setStatus("Открытие проекта отменено.");
});

crossImportBtn.addEventListener("click", () => {
  openCrossImportModal();
});

crossImportFetchBtn.addEventListener("click", async () => {
  await loadCrossImportFromUrl();
});

crossImportExtractBtn.addEventListener("click", () => {
  extractCrossImportFromSource();
});

crossImportApplyBtn.addEventListener("click", () => {
  applyCrossImportResult();
});

crossImportCloseBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeCrossImportModal();
});

crossImportCloseBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeCrossImportModal();
});

crossEditTextareaEl.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    cancelCrossEditModal();
    return;
  }

  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    applyCrossEditModal();
  }
});

crossEditNormalizeBtn.addEventListener("click", () => {
  normalizeCrossEditTextarea();
});

crossEditSaveBtn.addEventListener("click", () => {
  applyCrossEditModal();
});

crossEditCancelBtn.addEventListener("click", () => {
  cancelCrossEditModal();
});

crossEditCloseBtn.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  cancelCrossEditModal();
});

crossEditCloseBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  cancelCrossEditModal();
});

undoActionBtn.addEventListener("click", () => {
  undoLastAction();
});

redoActionBtn.addEventListener("click", () => {
  redoLastAction();
});

document.getElementById("merge").addEventListener("click", () => {
  if (state.selected.size < 2) {
    setStatus("Для объединения выделите минимум 2 ячейки.");
    return;
  }

  const bounds = getSelectedBounds();
  const needCount = (bounds.maxR - bounds.minR + 1) * (bounds.maxC - bounds.minC + 1);
  if (needCount !== state.selected.size) {
    setStatus("Можно объединять только прямоугольный диапазон без пропусков.");
    return;
  }

  for (let r = bounds.minR; r <= bounds.maxR; r++) {
    for (let c = bounds.minC; c <= bounds.maxC; c++) {
      const cell = getCell(r, c);
      if (!cell || cell.classList.contains("hidden") || cell.colSpan > 1 || cell.rowSpan > 1) {
        setStatus("Диапазон пересекается с уже объединенными ячейками.");
        return;
      }
    }
  }

  const master = getCell(bounds.minR, bounds.minC);
  const masterId = String(state.nextMasterId++);
  master.dataset.masterId = masterId;
  master.colSpan = bounds.maxC - bounds.minC + 1;
  master.rowSpan = bounds.maxR - bounds.minR + 1;
  state.mergedMasterIds.add(masterId);

  for (let r = bounds.minR; r <= bounds.maxR; r++) {
    for (let c = bounds.minC; c <= bounds.maxC; c++) {
      if (r === bounds.minR && c === bounds.minC) continue;
      const cell = getCell(r, c);
      cell.classList.add("hidden");
      cell.dataset.hiddenBy = masterId;
      cell.classList.remove("selected");
    }
  }

  clearSelection();
  addToSelection(master);
  renderAllCells();
  saveTableData(false);
  pushHistorySnapshot();
  setStatus("Ячейки объединены.");
});

document.getElementById("unmerge").addEventListener("click", () => {
  if (!hasMergedCells()) {
    setStatus("Объединенных ячеек нет.");
    return;
  }
  unmergeAll();
  clearSelection();
  saveTableData(false);
  pushHistorySnapshot();
});

initTableSearch();

async function initApp() {
  if (buildBadgeEl) {
    buildBadgeEl.textContent = `Сборка: ${APP_BUILD_ID}`;
    buildBadgeEl.title = "Если этот бейдж не виден, у вас открыта не текущая папка table.";
  }
  state.fileSystem.projectFileName = readPersistedProjectName();
  updateDocumentTitle();

  if (supportsProjectFileAccess() && !state.fileSystem.projectFileHandle) {
    state.fileSystem.projectFileHandle = await readPersistedProjectFileHandle();
    if (state.fileSystem.projectFileHandle?.name) {
      setCurrentProjectName(state.fileSystem.projectFileHandle.name);
    }
  }

  if (loadTableData()) {
    setStatus("Сохраненные данные таблицы загружены.");
  } else {
    buildTable();
  }

  pushHistorySnapshot();
  updateHistoryButtons();
  setCrossImportModalVisibility(false);
}

window.addEventListener("resize", () => {
  updateFillHandle();
  const target = resolveRowActionTarget();
  const td = getCell(target.row, target.col);
  if (td && !rowControlsEl.hidden) showRowControlsForCell(td);
});

initApp();
