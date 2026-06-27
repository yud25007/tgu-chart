const form = document.querySelector("#auto-form");
const submitButton = document.querySelector("#submit-btn");
const resetButton = document.querySelector("#reset-btn");
const parseButton = document.querySelector("#parse-btn");
const importButton = document.querySelector("#import-btn");
const addRowButton = document.querySelector("#add-row-btn");
const logoutButton = document.querySelector("#logout-btn");
const message = document.querySelector("#message");
const entriesContainer = document.querySelector("#entries");
const previewRows = document.querySelector("#preview-rows");
const rowCount = document.querySelector("#row-count");
const refreshHistoryButton = document.querySelector("#refresh-history-btn");
const historyList = document.querySelector("#history-list");
const pageTitle = document.querySelector("#page-title");
const titleTypeInputs = Array.from(document.querySelectorAll("input[name='titleType']"));

const TITLE_TYPES = {
  ideology: {
    label: "思政",
    creditType: "思政学分",
  },
  practice: {
    label: "实践",
    creditType: "实践学分",
  },
};

const fields = {
  activityName: document.querySelector("#activityName"),
  date: document.querySelector("#date"),
  creditType: document.querySelector("#creditType"),
  defaultPoints: document.querySelector("#defaultPoints"),
  rosterFile: document.querySelector("#rosterFile"),
  batchText: document.querySelector("#batchText"),
};

const preview = {
  title: document.querySelector("#preview-title"),
  activity: document.querySelector("#preview-activity"),
  date: document.querySelector("#preview-date"),
};

let entries = [{ className: "", name: "", studentId: "", points: "" }];
let historyRecords = [];
let titleTypeTouched = false;

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function displayDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${year}年${Number(month)}月${Number(day)}日`;
}

function setMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

function inferTitleType(creditType) {
  return String(creditType || "").includes("实践") ? "practice" : "ideology";
}

function selectedTitleType() {
  return titleTypeInputs.find((input) => input.checked)?.value || inferTitleType(fields.creditType.value);
}

function setTitleType(type) {
  const nextType = TITLE_TYPES[type] ? type : "ideology";
  titleTypeInputs.forEach((input) => {
    input.checked = input.value === nextType;
  });
}

function titleText(type = selectedTitleType()) {
  return `电气工程学院${TITLE_TYPES[type]?.label || TITLE_TYPES.ideology.label}学分记录表`;
}

function shortTitleText(type = selectedTitleType()) {
  return `${TITLE_TYPES[type]?.label || TITLE_TYPES.ideology.label}学分记录表`;
}

function syncTitleTypeFromCreditType(force = false) {
  if (force || !titleTypeTouched) {
    setTitleType(inferTitleType(fields.creditType.value));
  }
}

function syncCreditTypeFromTitle(type) {
  const current = fields.creditType.value.trim();
  const standardTypes = Object.values(TITLE_TYPES).map((item) => item.creditType);
  if (!current || standardTypes.includes(current)) {
    fields.creditType.value = TITLE_TYPES[type]?.creditType || TITLE_TYPES.ideology.creditType;
  }
}

function emptyEntry() {
  return { className: "", name: "", studentId: "", points: "" };
}

function normalizeEntry(entry) {
  return {
    className: String(entry.className || "").trim(),
    name: String(entry.name || "").trim(),
    studentId: String(entry.studentId || "").trim(),
    points: String(entry.points || "").trim(),
  };
}

function isBlankEntry(entry) {
  return !entry.className && !entry.name && !entry.studentId && !entry.points;
}

function nonEmptyEntries() {
  return entries.map(normalizeEntry).filter((entry) => !isBlankEntry(entry));
}

function entryPoints(entry) {
  return entry.points || fields.defaultPoints.value.trim();
}

function entryIsReady(entry) {
  return Boolean(entry.className && entry.studentId && entryPoints(entry));
}

function countReadyEntries() {
  return nonEmptyEntries().filter(entryIsReady).length;
}

function rowCell(text, className = "value") {
  const cell = document.createElement("div");
  cell.className = `cell ${className}`.trim();
  cell.textContent = text;
  return cell;
}

function addPreviewRow(entry) {
  const points = entryPoints(entry);
  const creditValue = points ? `${points}${fields.creditType.value.trim() || TITLE_TYPES[selectedTitleType()].creditType}` : "";
  previewRows.append(
    rowCell("姓名", "label"),
    rowCell(entry.name, entry.name ? "value" : "value preview-empty"),
    rowCell("班级", "label"),
    rowCell(entry.className, entry.className ? "value" : "value preview-empty"),
    rowCell("学号", "label"),
    rowCell(entry.studentId, entry.studentId ? "value" : "value preview-empty"),
    rowCell("所获学分", "label"),
    rowCell(creditValue, creditValue ? "value" : "value preview-empty"),
  );
}

function updatePreview() {
  const titleType = selectedTitleType();
  pageTitle.textContent = shortTitleText(titleType);
  preview.title.textContent = titleText(titleType);
  preview.activity.textContent = fields.activityName.value;
  preview.date.textContent = displayDate(fields.date.value);
  previewRows.replaceChildren();

  const visibleRows = nonEmptyEntries();
  const rows = visibleRows.length ? visibleRows : entries;
  const minimumRows = Math.max(3, rows.length);

  for (let index = 0; index < minimumRows; index += 1) {
    addPreviewRow(normalizeEntry(rows[index] || emptyEntry()));
  }

  rowCount.textContent = `${countReadyEntries()} / ${visibleRows.length || entries.length} 人`;
}

function inputFor(entry, field, placeholder, inputMode = "text") {
  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = inputMode;
  input.placeholder = placeholder;
  input.value = entry[field];
  input.dataset.field = field;
  return input;
}

function renderEntries() {
  entriesContainer.replaceChildren();

  entries.forEach((rawEntry, index) => {
    const entry = normalizeEntry(rawEntry);
    const row = document.createElement("div");
    row.className = "entry-row";
    row.dataset.index = String(index);
    const rowStarted = !isBlankEntry(entry);

    const classInput = inputFor(entry, "className", "电气2402");
    classInput.dataset.invalid = String(rowStarted && !entry.className);

    const nameInput = inputFor(entry, "name", "张三");

    const studentInput = inputFor(entry, "studentId", "2024000001", "numeric");
    studentInput.dataset.invalid = String(rowStarted && !entry.studentId);

    const pointsInput = inputFor(entry, "points", fields.defaultPoints.value || "默认", "decimal");
    pointsInput.dataset.invalid = String(rowStarted && !entryPoints(entry));

    const removeButton = document.createElement("button");
    removeButton.className = "remove-row";
    removeButton.type = "button";
    removeButton.dataset.action = "remove";
    removeButton.textContent = "×";
    removeButton.ariaLabel = `删除第 ${index + 1} 行`;

    row.append(classInput, nameInput, studentInput, pointsInput, removeButton);
    entriesContainer.append(row);
  });

  updatePreview();
}

function collectPayload() {
  return {
    activityName: fields.activityName.value.trim(),
    date: fields.date.value.trim(),
    titleType: selectedTitleType(),
    creditType: fields.creditType.value.trim(),
    defaultPoints: fields.defaultPoints.value.trim(),
    entries: nonEmptyEntries(),
  };
}

function applyRecord(record) {
  fields.activityName.value = record.activityName || "";
  fields.date.value = record.date || todayISO();
  fields.creditType.value = record.creditType || "思政学分";
  setTitleType(record.titleType || inferTitleType(fields.creditType.value));
  titleTypeTouched = false;
  fields.defaultPoints.value = record.defaultPoints || "";
  fields.batchText.value = "";
  fields.rosterFile.value = "";
  entries = (record.entries || []).map(normalizeEntry);
  if (!entries.length) entries = [emptyEntry()];
  renderEntries();
  setMessage(`已载入历史记录：${record.activityName}`, "success");
}

function validateEntries(payload) {
  if (!payload.entries.length) {
    throw new Error("请至少导入或填写 1 条名单明细。");
  }

  const badIndex = payload.entries.findIndex((entry) => !entry.className || !entry.studentId || !entryPoints(entry));
  if (badIndex !== -1) {
    throw new Error(`第 ${badIndex + 1} 行缺少班级、学号或加分数量，请补齐后再生成。`);
  }
}

function historyMeta(record) {
  const parts = [
    record.date,
    record.recordTitle,
    record.creditType,
    `${record.entryCount} 人`,
    record.createdAt,
  ].filter(Boolean);
  return parts.join(" · ");
}

function renderHistory() {
  historyList.replaceChildren();
  if (!historyRecords.length) {
    const empty = document.createElement("div");
    empty.className = "history-empty";
    empty.textContent = "还没有生成记录。";
    historyList.append(empty);
    return;
  }

  historyRecords.forEach((record) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.dataset.id = String(record.id);

    const main = document.createElement("div");
    main.className = "history-main";

    const text = document.createElement("div");
    const name = document.createElement("div");
    name.className = "history-name";
    name.textContent = record.activityName;
    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent = historyMeta(record);
    text.append(name, meta);

    const count = document.createElement("div");
    count.className = "status-pill";
    count.textContent = `${record.entryCount} 人`;

    main.append(text, count);

    const actions = document.createElement("div");
    actions.className = "history-actions";
    actions.innerHTML = `
      <button class="secondary compact" type="button" data-action="load">载入</button>
      <button class="secondary compact" type="button" data-action="download">下载</button>
      <button class="danger compact" type="button" data-action="delete">删除</button>
    `;

    item.append(main, actions);
    historyList.append(item);
  });
}

async function refreshHistory() {
  try {
    const response = await fetch("/history");
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "读取历史记录失败");
    }
    historyRecords = result.records || [];
    renderHistory();
  } catch (error) {
    historyList.innerHTML = `<div class="history-empty">${error.message}</div>`;
  }
}

async function loadHistoryRecord(recordId) {
  const response = await fetch(`/record/${recordId}`);
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "读取记录失败");
  }
  applyRecord(result.record);
}

function downloadHistoryRecord(recordId) {
  const anchor = document.createElement("a");
  anchor.href = `/download/${recordId}`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

async function deleteHistoryRecord(recordId) {
  const record = historyRecords.find((item) => String(item.id) === String(recordId));
  if (!record) return;
  if (!confirm(`删除“${record.activityName}”这条历史记录？`)) return;

  const response = await fetch(`/record/${recordId}`, { method: "DELETE" });
  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.message || "删除失败");
  }
  await refreshHistory();
  setMessage("历史记录已删除。", "success");
}

async function logout() {
  try {
    await fetch("/logout", { method: "POST" });
  } finally {
    window.location.href = "/login";
  }
}

function filenameFromDisposition(disposition) {
  if (!disposition) return "思政学分记录表.docx";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/);
  if (encoded) return decodeURIComponent(encoded[1]);
  const plain = disposition.match(/filename="?([^";]+)"?/);
  return plain ? plain[1] : "思政学分记录表.docx";
}

function normalizeTokens(line) {
  return line
    .replace(/[，,；;、|]/g, "\t")
    .replace(/\s+/g, "\t")
    .split("\t")
    .map((token) => token.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

function cleanStudentId(token) {
  const compact = token.replace(/\s/g, "");
  if (/^[A-Za-z]?\d{6,}[A-Za-z]?$/.test(compact)) return compact;
  const digits = compact.replace(/\D/g, "");
  return digits.length >= 6 ? digits : "";
}

function cleanPoint(token) {
  const match = token.match(/(\d+(?:\.\d+)?)/);
  if (!match) return "";
  const number = match[1];
  if (/分|学分/.test(token)) return number;
  if (number.includes(".")) return number;
  return number.length <= 3 ? number : "";
}

function parseRosterLine(line) {
  const tokens = normalizeTokens(line);
  if (tokens.length < 2) return null;
  if (tokens.some((token) => /班级|学号|姓名/.test(token))) return null;

  const studentIndex = tokens.findIndex((token) => cleanStudentId(token));
  if (studentIndex === -1) return null;

  let pointIndex = tokens.findIndex((token, index) => index !== studentIndex && /分|学分/.test(token) && cleanPoint(token));
  if (pointIndex === -1) {
    for (let index = tokens.length - 1; index >= 0; index -= 1) {
      if (index !== studentIndex && cleanPoint(tokens[index])) {
        pointIndex = index;
        break;
      }
    }
  }

  let classIndex = tokens.findIndex((token, index) => index !== studentIndex && index !== pointIndex && /班|级|电气/.test(token));
  if (classIndex === -1) {
    classIndex = tokens.findIndex((token, index) => (
      index !== studentIndex
      && index !== pointIndex
      && /[\u4e00-\u9fa5A-Za-z]/.test(token)
      && /\d/.test(token)
    ));
  }
  if (classIndex === -1 && studentIndex > 0) {
    classIndex = studentIndex - 1;
  }

  const nameIndex = tokens.findIndex((token, index) => (
    index !== classIndex
    && index !== studentIndex
    && index !== pointIndex
    && /[\u4e00-\u9fa5]/.test(token)
    && !/\d/.test(token)
  ));

  const className = classIndex >= 0 ? tokens[classIndex] : "";
  const name = nameIndex >= 0 ? tokens[nameIndex] : "";
  const studentId = cleanStudentId(tokens[studentIndex]);
  const points = pointIndex >= 0 ? cleanPoint(tokens[pointIndex]) : fields.defaultPoints.value.trim();

  if (!className || !studentId) return null;
  return { className, name, studentId, points };
}

function parseRosterText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseRosterLine)
    .filter(Boolean);
}

function parseBatchText() {
  const parsed = parseRosterText(fields.batchText.value);
  if (!parsed.length) {
    setMessage("没有识别到有效名单。", "error");
    return;
  }
  entries = parsed;
  renderEntries();
  setMessage(`已识别 ${parsed.length} 条明细。`, "success");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("读取 Excel 文件失败"));
    reader.readAsDataURL(file);
  });
}

async function importRosterFile() {
  const file = fields.rosterFile.files[0];
  if (!file) {
    setMessage("请先选择 Excel 文件。", "error");
    return;
  }

  importButton.disabled = true;
  setMessage("正在识别 Excel 名单...");

  try {
    const fileData = await fileToDataUrl(file);
    const response = await fetch("/import-roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, fileData }),
    });

    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.message || "导入失败");
    }

    const inferred = result.inferred || {};
    if (inferred.activityName && !fields.activityName.value.trim()) {
      fields.activityName.value = inferred.activityName;
    }
    if (inferred.date && (!fields.date.value || fields.date.value === todayISO())) {
      fields.date.value = inferred.date;
    }

    entries = result.entries.map(normalizeEntry);
    renderEntries();

    const warnings = [...(result.warnings || [])];
    if (!fields.defaultPoints.value.trim() && entries.every((entry) => !entry.points)) {
      warnings.push("Excel 没有加分列，请填写默认加分数量");
    }
    const warningText = warnings.length ? `，${warnings.join("；")}` : "";
    setMessage(`已从 ${result.sheetName} 导入 ${entries.length} 条明细${warningText}`, warnings.length ? "error" : "success");
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    importButton.disabled = false;
  }
}

async function generateWord(event) {
  event.preventDefault();
  setMessage("正在生成 Word...");
  submitButton.disabled = true;

  try {
    const payload = collectPayload();
    validateEntries(payload);

    const response = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "生成失败" }));
      throw new Error(error.message || "生成失败");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filenameFromDisposition(response.headers.get("Content-Disposition"));
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setMessage("Word 已生成并开始下载。", "success");
    refreshHistory();
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
}

function resetForm() {
  form.reset();
  fields.date.value = todayISO();
  fields.creditType.value = "思政学分";
  setTitleType("ideology");
  titleTypeTouched = false;
  entries = [emptyEntry()];
  renderEntries();
  setMessage("");
}

entriesContainer.addEventListener("input", (event) => {
  const input = event.target.closest("input[data-field]");
  if (!input) return;
  const row = input.closest(".entry-row");
  const index = Number(row.dataset.index);
  entries[index][input.dataset.field] = input.value;
  updatePreview();
});

entriesContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='remove']");
  if (!button) return;
  const row = button.closest(".entry-row");
  const index = Number(row.dataset.index);
  entries.splice(index, 1);
  if (!entries.length) entries.push(emptyEntry());
  renderEntries();
});

Object.entries(fields).forEach(([name, field]) => {
  field.addEventListener("input", () => {
    if (name === "creditType") {
      syncTitleTypeFromCreditType();
    }
    updatePreview();
  });
});

titleTypeInputs.forEach((input) => {
  input.addEventListener("change", () => {
    titleTypeTouched = true;
    syncCreditTypeFromTitle(input.value);
    updatePreview();
  });
});

parseButton.addEventListener("click", parseBatchText);
importButton.addEventListener("click", importRosterFile);
fields.rosterFile.addEventListener("change", importRosterFile);
addRowButton.addEventListener("click", () => {
  entries.push(emptyEntry());
  renderEntries();
});
form.addEventListener("submit", generateWord);
resetButton.addEventListener("click", resetForm);
logoutButton.addEventListener("click", logout);
refreshHistoryButton.addEventListener("click", refreshHistory);
historyList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const item = button.closest(".history-item");
  const recordId = item?.dataset.id;
  if (!recordId) return;

  try {
    if (button.dataset.action === "load") {
      await loadHistoryRecord(recordId);
    } else if (button.dataset.action === "download") {
      downloadHistoryRecord(recordId);
    } else if (button.dataset.action === "delete") {
      await deleteHistoryRecord(recordId);
    }
  } catch (error) {
    setMessage(error.message, "error");
  }
});

fields.date.value = todayISO();
renderEntries();
refreshHistory();
