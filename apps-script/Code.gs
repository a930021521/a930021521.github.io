/**
 * SNOWMODE booking backend (Google Apps Script, bound to the "SNOWMODE 預約" spreadsheet).
 * REDEPLOY after pasting this file: Apps Script → Deploy → Manage deployments → pencil
 * → Version: New version → Deploy. Execute as: Me. Who has access: Anyone.
 * The web app URL stays the same. Do not create a second deployment.
 *
 * v-ref (2026-11-14): the website sends one booking number (payload.ref, SM-MMDD-XXXX).
 * This script uses that number in the sheet and in both emails. A second POST with the
 * same number does not add another row or send another email. One rejected cell no
 * longer drops the rest of the row (the columns after 實收).
 *
 * - Receives booking JSON from https://jpsnowmode.com, appends a row (狀態 = 待確認), emails the owner.
 * - Calendar sync: when a row's 狀態 becomes 已確認, one deep-red ALL-DAY event per booking (one per run of
 *   consecutive dates) is created on the 「SNOWMODE 課程」 calendar, titled 雪場｜板類｜半天/全天; edits update it in place;
 *   已取消 / 待確認 deletes it. Works for web-form rows and hand-typed rows. (v-cal3, 2026-10-10)
 *   One-time setup: run setupCalendarSync() from the editor (creates calendar, dropdown, trigger).
 * - v-phone (2026-10-18): the site now sends a required phone ("+886 912345678") and a WhatsApp flag.
 *   They go into two new columns 電話 / WhatsApp appended at the END of the 預約 sheet (existing column
 *   order untouched), and into the notification email + calendar event description.
 *   Run setupPhoneColumns() once from the editor (doPost also adds the columns itself if they are missing).
 */
var NOTIFY_EMAIL = 'a930021521@gmail.com';
var SHEET_NAME = '預約';
var HEADERS = ['預約編號','送出時間','狀態','日期與時段','總價','已收訂金','尚欠金額','客人來源','介紹人','抽成比例','抽成金額','實收','姓名','聯絡方式','聯絡 ID','Email','雪具','程度','語言',
  '大人','小孩','小孩年齡','總人數','雪場','方案','總額 (NT$)','訂金 30% (NT$)','尾款 (NT$)','備註','原始資料','日曆事件 ID','電話','WhatsApp'];
var PHONE_HEADERS = ['電話', 'WhatsApp']; // appended after the last existing column (v-phone)

var STATUS_PENDING = '待確認', STATUS_PROCESSING = '處理中', STATUS_CONFIRMED = '已確認', STATUS_CANCELLED = '已取消';
var STATUSES = [STATUS_PENDING, STATUS_PROCESSING, STATUS_CONFIRMED, STATUS_CANCELLED];
var CAL_NAME = 'SNOWMODE 課程';
var CAL_TZ = 'Asia/Tokyo';
var EVENT_ID_HEADER = '日曆事件 ID';
var SOURCE_WEB = '網路', SOURCE_FRIEND = '朋友介紹', SOURCE_OLD = '舊客';
// Website「怎麼知道我們的」plus the older bookkeeping values. A value outside this list is still stored.
var SOURCE_OPTIONS = [SOURCE_WEB, SOURCE_FRIEND, SOURCE_OLD, 'Instagram', 'Threads', 'Facebook 廣告', 'Google 搜尋', '其他'];
var BOOK_HEADERS = ['總價', '已收訂金', '尚欠金額', '客人來源', '介紹人', '抽成比例', '抽成金額', '實收'];
var FORMULA_HEADERS = ['尚欠金額', '抽成金額', '實收']; // ARRAYFORMULA in the header cell; never written by script
var MONEY_FORMAT = '"NT$"#,##0';
// Group totals in NTD per lesson [half, full] by number of people; 5+ = quote (blank).
var PRICE_TABLE = { 1: [7000, 12000], 2: [8000, 13000], 3: [9000, 14000], 4: [10000, 14000] };
// Time blocks (Asia/Tokyo). A time range typed in the date cell (e.g. "2027-01-15 13:00-16:00") overrides these.
var SLOT_TIMES = { am: ['09:00', '12:00'], pm: ['13:00', '16:00'], full: ['09:00', '15:00'] };

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold').setBackground('#0a1020').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  setBookFormulas_(sh);
  var d = ss.getSheetByName('工作表1') || ss.getSheetByName('Sheet1');
  if (d && d.getName() !== SHEET_NAME && ss.getSheets().length > 1) ss.deleteSheet(d);
  MailApp.getRemainingDailyQuota();
  return 'ok';
}

function doGet() {
  return json_({ ok: true, service: 'snowmode-booking' });
}

/** Website booking number, or a new SM-MMDD-XXXX in Asia/Taipei. */
function bookingRef_(p, tz) {
  var sent = String(p && p.ref || '').trim().toUpperCase();
  if (/^SM-\d{4}-[A-Z0-9]{4}$/.test(sent)) return sent;
  var n = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '');
  while (n.length < 4) n += Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '');
  return 'SM-' + Utilities.formatDate(new Date(), tz, 'MMdd') + '-' + n.slice(0, 4);
}

/** Row whose 預約編號 is exactly ref, or 0. */
function findRefRow_(sh, ref) {
  var col = cols_(sh)['預約編號'];
  var last = sh.getLastRow();
  if (!col || last < 2) return 0;
  var vals = sh.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) if (String(vals[i][0] || '').trim() === ref) return i + 2;
  return 0;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  var ref = '';
  var notified = false;
  try {
    lock.waitLock(20000);
    var p = JSON.parse(e.postData.contents);
    if (p.website) return json_({ ok: true, ref: 'SM-OK' }); // honeypot
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(SHEET_NAME);
    if (!sh) { setup(); sh = ss.getSheetByName(SHEET_NAME); }
    ensurePhoneColumns_(sh);
    var tz = 'Asia/Taipei';
    ref = bookingRef_(p, tz);
    var existing = findRefRow_(sh, ref);
    if (existing) {
      var prevName = String(sh.getRange(existing, cols_(sh)['姓名']).getValue() || '').trim();
      var thisName = String(p.name || '').trim();
      // Same number and same person: the browser retried. Do not email or append again.
      if (!thisName || prevName === thisName) return json_({ ok: true, ref: ref, duplicate: true });
      ref = bookingRef_({}, tz);
    }
    var c = p.contact || {};
    var pr = p.price || {};
    var dates = formatDates_(p.dates || []);
    var people = Number(p.totalPeople) || ((Number(p.adults) || 0) + (Number(p.children) || 0));
    // 北海道: use the site's estimate when it computed one; quote only when it couldn't
    var hkResort = pr.hokkaido === true || /^北海道・/.test(String(p.resort || ''));
    var hkPriced = hkResort && !pr.quoteRequired && Number(pr.amount) > 0;
    var hk = hkResort && !hkPriced;
    pr.hokkaido = hk;
    // no resort chosen (「由教練建議」): price depends on the resort, so say so instead of leaving blanks
    var noResort = !hkResort && (!String(p.resort || '').trim() || /由教練建議/.test(String(p.resort)));
    pr.noResort = noResort;
    var quote = !!pr.quoteRequired || hk || noResort;
    var HK_QUOTE = '北海道課程，將由學校另行報價';
    var siteAmount = (!pr.quoteRequired && isFinite(Number(pr.amount)) && Number(pr.amount) > 0) ? Number(pr.amount) : '';
    var groupTotal = (hk || noResort) ? '' : (siteAmount !== '' ? siteAmount : priceFor_(people, p.dates || [], p.resort));
    var resortFull = s_(p.resort);
    var heard = s_(p.source);
    var rec = {
      '預約編號': ref, '送出時間': Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm'), '狀態': STATUS_PENDING,
      '總價': groupTotal === '' ? '' : groupTotal, '已收訂金': '', '客人來源': heard || SOURCE_WEB, '介紹人': '', '抽成比例': '',
      '姓名': s_(p.name), '聯絡方式': s_(c.method), '聯絡 ID': s_(c.id), 'Email': s_(c.email),
      '電話': s_(String(p.phone || '').slice(0, 30)), 'WhatsApp': p.phoneWhatsApp === true ? '是' : '',
      '日期與時段': dates, '雪具': s_(p.discipline), '程度': s_(p.level), '語言': s_(p.language),
      '大人': p.adults || 0, '小孩': p.children || 0, '小孩年齡': (p.childAges || []).join('、'), '人數': people, '總人數': people,
      '雪場': s_(String(p.resort || '').replace(/^北海道・/, '')), '方案': s_(p.durationLabel || pr.durationLabel),
      '總額 (NT$)': hk ? HK_QUOTE : noResort ? '待確認雪場後報價' : quote ? '私訊報價' : (pr.amount || ''), '訂金 30% (NT$)': quote ? '' : (pr.deposit || ''),
      '尾款 (NT$)': quote ? '' : (pr.balance || ''), '備註': s_(p.notes), '原始資料': JSON.stringify(p).slice(0, 45000)
    };
    writeRecord_(sh, rec);
    try { SpreadsheetApp.flush(); } catch (flushErr) { console.error(flushErr); }
    var body = [
      '新的預約需求 ' + ref, '',
      '姓名：' + rec['姓名'], '聯絡：' + rec['聯絡方式'] + ' ' + rec['聯絡 ID'] + (rec['Email'] ? '／' + rec['Email'] : ''),
      '電話：' + phoneLine_(p.phone, p.phoneWhatsApp === true),
      '日期：', dates, '',
      '雪具：' + rec['雪具'] + '　程度：' + rec['程度'],
      '人數：大人 ' + rec['大人'] + '、小孩 ' + rec['小孩'] + (rec['小孩年齡'] ? '（年齡 ' + rec['小孩年齡'] + '）' : ''),
      '雪場：' + resortFull, '方案：' + rec['方案'],
      '總額：' + (hk ? HK_QUOTE : noResort ? '尚未選雪場，確認雪場後再報價' : quote ? '5 人以上，需私訊報價' : 'NT$' + rec['總額 (NT$)'] + '（訂金 NT$' + rec['訂金 30% (NT$)'] + '／尾款 NT$' + rec['尾款 (NT$)'] + '）'),
      '備註：' + (rec['備註'] || '—'), '',
      '確認後請在試算表把「狀態」改成「已確認」，課程會自動加入「' + CAL_NAME + '」日曆。',
      '試算表：' + ss.getUrl()
    ].join('\n');
    MailApp.sendEmail({ to: NOTIFY_EMAIL, subject: '【SNOWMODE 新預約】' + rec['姓名'] + '｜' + (p.dates && p.dates[0] ? p.dates[0].date : ''), body: body, replyTo: c.email || NOTIFY_EMAIL });
    notified = true;
    if (c.email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) {
      try { sendCustomerConfirm_(c.email, ref, rec, dates, pr); } catch (mailErr) { console.error(mailErr); }
    }
    return json_({ ok: true, ref: ref });
  } catch (err) {
    // Include ref so the website can show the same number it already emailed, instead of minting another.
    return json_({ ok: notified, error: String(err), ref: ref });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

/** "+852 61234567" -> "+852 61234567（可用 WhatsApp：https://wa.me/85261234567）"; blank -> "—". */
function phoneLine_(phone, wa) {
  phone = String(phone || '').replace(/^'/, '').trim();
  if (!phone) return '—';
  var digits = phone.replace(/[^\d]/g, '');
  return phone + (wa && digits ? '（可用 WhatsApp：https://wa.me/' + digits + '）' : '');
}

/** Adds any missing 電話 / WhatsApp header after the last used column (never moves existing columns). */
function ensurePhoneColumns_(sh) {
  var cols = cols_(sh);
  PHONE_HEADERS.forEach(function (h) {
    if (cols[h]) return;
    var last = sh.getLastColumn();
    if (last >= sh.getMaxColumns()) sh.insertColumnsAfter(sh.getMaxColumns(), 1);
    sh.getRange(1, last + 1).setValue(h).setFontWeight('bold').setBackground('#0a1020').setFontColor('#ffffff');
    cols = cols_(sh);
  });
  return cols;
}

/** Run once from the editor (v-phone): appends 電話 / WhatsApp at the end of the 預約 sheet. Safe to re-run. */
function setupPhoneColumns() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  var cols = ensurePhoneColumns_(sh);
  var n = Math.max(sh.getMaxRows() - 1, 1);
  sh.getRange(2, cols['電話'], n, 1).clearDataValidations(); // values are written as "'+886 …" so they stay text
  sh.getRange(2, cols['WhatsApp'], n, 1).clearDataValidations();
  return 'ok: 電話=' + colLetter_(cols['電話']) + ', WhatsApp=' + colLetter_(cols['WhatsApp']);
}

function s_(v) { v = v == null ? '' : String(v); return /^[=+\-@]/.test(v) ? "'" + v : v; }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function sendCustomerConfirm_(to, ref, rec, dates, pr) {
  var total = pr.hokkaido ? '北海道課程，將由學校另行報價' : pr.noResort ? '待確認雪場後報價' : pr.quoteRequired ? '5 人以上，將另行報價' : 'NT$' + Number(rec['總額 (NT$)']).toLocaleString() + '（訂金 30%：NT$' + Number(rec['訂金 30% (NT$)']).toLocaleString() + '）';
  var LINE_URL = 'https://line.me/R/ti/p/@dqi1670m', WA_URL = 'https://wa.me/817091690683';
  var method = String(rec['聯絡方式'] || '').trim();
  var contact;
  if (method === 'LINE') {
    contact = ['📱 請先加入 SNOWMODE 官方 LINE：', LINE_URL, '（或在 LINE 搜尋 ID：@dqi1670m）', '',
      '您的預約申請已送出！最後一步：請加入 LINE 並傳送您的預約編號「' + ref + '」，以便確認日期與上課細節，確認後預約才算成立。'];
  } else if (method === 'WhatsApp') {
    contact = ['📱 請點此傳訊息給我們：', WA_URL, '（WhatsApp：+81 70-9169-0683）', '',
      '您的預約申請已送出！最後一步：請透過 WhatsApp 傳送您的預約編號「' + ref + '」，以便確認日期與上課細節，確認後預約才算成立。'];
  } else if (method === 'WeChat') {
    contact = ['📱 請在微信搜尋 ID：Snowmode 加我們好友', '',
      '您的預約申請已送出！最後一步：請在微信搜尋 ID：Snowmode 加我們好友並傳送您的預約編號「' + ref + '」，以便確認日期與上課細節，確認後預約才算成立。'];
  } else {
    contact = ['📱 請透過以下任一方式加入 SNOWMODE：',
      '・LINE：' + LINE_URL + '（或在 LINE 搜尋 ID：@dqi1670m）',
      '・WhatsApp：' + WA_URL + '（+81 70-9169-0683）',
      '・WeChat：請在微信搜尋 ID：Snowmode 加我們好友', '',
      '您的預約申請已送出！最後一步：請透過以下任一方式傳送您的預約編號「' + ref + '」，以便確認日期與上課細節，確認後預約才算成立。'];
  }
  var body = [
    rec['姓名'] + ' 您好，',
    '',
    '感謝預約 SNOWMODE，我們已收到您的預約需求。',
    ''
  ].concat(contact, [
    '',
    '預約編號：' + ref,
    '日期與時段：', dates,
    '雪具：' + rec['雪具'],
    '人數：大人 ' + rec['大人'] + '、小孩 ' + rec['小孩'],
    '預估費用：' + total,
    '',
    '※ 此信僅確認收到需求，確認時段並收到訂金後，預約才算完成。',
    '※ 課程費用不含雪具租借與纜車券。',
    '',
    '如有任何問題，歡迎直接回覆此信，或透過上方聯絡方式與我們聯繫。',
    '',
    'SNOWMODE｜越後湯澤 滑雪・單板課程',
    'https://jpsnowmode.com'
  ]).join('\n');
  MailApp.sendEmail({ to: to, subject: '【SNOWMODE】已收到您的預約需求（' + ref + '）', body: body, name: 'SNOWMODE', replyTo: NOTIFY_EMAIL });
}

/* ======================= Calendar sync ======================= */

/** Run once from the editor: dropdown, helper column, colours, calendar, installable onEdit trigger. Safe to re-run. */
function setupCalendarSync() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  var cols = cols_(sh);
  var idCol = cols[EVENT_ID_HEADER];
  if (!idCol) {
    idCol = sh.getLastColumn() + 1;
    sh.getRange(1, idCol).setValue(EVENT_ID_HEADER).setFontWeight('bold').setBackground('#0a1020').setFontColor('#ffffff');
  }
  var stCol = cols['狀態'];
  var n = Math.max(sh.getMaxRows() - 1, 1);
  var stRange = sh.getRange(2, stCol, n, 1);
  stRange.setDataValidation(statusRule_());
  // Normalise existing values: old default 新預約 / blanks on filled rows -> 待確認
  var last = sh.getLastRow();
  if (last >= 2) {
    var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
    var st = vals.map(function (r) {
      var v = String(r[stCol - 1] || '').trim();
      var filled = r.some(function (x, i) { return i !== stCol - 1 && x !== '' && x !== null; });
      if (STATUSES.indexOf(v) >= 0) return [v];
      return [filled ? STATUS_PENDING : ''];
    });
    sh.getRange(2, stCol, st.length, 1).setValues(st);
  }
  // Colours
  var rules = sh.getConditionalFormatRules().filter(function (r) {
    var b = r.getBooleanCondition();
    var cv = b && b.getCriteriaValues ? String(b.getCriteriaValues()[0]) : '';
    return !(b && (STATUSES.indexOf(cv) >= 0 || cv.indexOf(STATUS_PROCESSING) >= 0));
  });
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(STATUS_CONFIRMED).setBackground('#c8e6c9').setFontColor('#1b5e20').setRanges([stRange]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(STATUS_PENDING).setBackground('#fff3cd').setFontColor('#7a5a00').setRanges([stRange]).build());
  var rowRange = sh.getRange(2, 1, n, sh.getLastColumn());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$' + colLetter_(stCol) + '2="' + STATUS_PROCESSING + '"').setBackground('#f8d7e4').setFontColor('#7a1f45').setRanges([rowRange]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(STATUS_CANCELLED).setBackground('#eeeeee').setFontColor('#757575').setRanges([stRange]).build());
  sh.setConditionalFormatRules(rules);
  sh.hideColumns(idCol);
  if (ss.getSpreadsheetTimeZone() !== CAL_TZ) ss.setSpreadsheetTimeZone(CAL_TZ);
  getCalendar_();
  var exists = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'handleEdit'; });
  if (!exists) ScriptApp.newTrigger('handleEdit').forSpreadsheet(ss).onEdit().create();
  return 'ok: calendar=' + getCalendar_().getId() + ', statusCol=' + stCol + ', idCol=' + idCol;
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('SNOWMODE')
    .addItem('同步此列到日曆', 'syncSelectedRows')
    .addItem('重新同步全部列', 'syncAllRows')
    .addToUi();
}

/* ---- Calendar sync v-cal3 (2026-10-10; v-cal2 + 人數 in title) ----
 * One ALL-DAY event per booking (one per run of consecutive dates), colour 11 = Tomato (deep red).
 * Title: 雪場｜板類｜N人｜半天/全天 (mixed run: e.g. 半天+全天); empty fields are left out.
 * Sync is idempotent: existing events are found (stored IDs + calendar scan by 預約編號) and updated in place;
 * only missing runs are created and anything else this script made for the same 預約編號 is deleted.
 * The ID cell is flushed before the lock is released, so a second rapid edit always sees the first run's IDs.
 */
var EVENT_COLOR_ID = '11'; // CalendarApp.EventColor.RED = Tomato
var TAG_REF = 'snowmodeRow', TAG_RUN = 'snowmodeRun';

/** Installable onEdit trigger handler (created by setupCalendarSync). */
function handleEdit(e) {
  if (!e || !e.range) return;
  var sh = e.range.getSheet();
  if (sh.getName() !== SHEET_NAME) return;
  var cols = cols_(sh);
  var c1 = e.range.getColumn(), c2 = e.range.getLastColumn();
  var idCol = cols[EVENT_ID_HEADER], rawCol = cols['原始資料'];
  if (c1 === c2 && (c1 === idCol || c1 === rawCol)) return;
  if (idCol && c1 > idCol) return; // AF 之後是手動記帳欄（尾款已收?／介紹人抽成已付?），不需同步日曆
  var money = BOOK_HEADERS.map(function (h) { return cols[h]; });
  if (c1 >= Math.min.apply(null, money) && c2 <= Math.max.apply(null, money)) return; // bookkeeping edit only
  var statusTouched = c1 <= cols['狀態'] && cols['狀態'] <= c2;
  var r1 = Math.max(e.range.getRow(), 2), r2 = e.range.getLastRow();
  for (var r = r1; r <= r2; r++) {
    try { syncRow_(sh, r, cols, !statusTouched); }
    catch (err) { console.error('row ' + r + ': ' + (err && err.stack || err)); try { sh.getParent().toast('第 ' + r + ' 列同步日曆失敗：' + err, 'SNOWMODE 日曆', 8); } catch (x) {} }
  }
}

function syncSelectedRows() {
  var sh = SpreadsheetApp.getActiveSheet();
  if (sh.getName() !== SHEET_NAME) return;
  var rg = sh.getActiveRange(), cols = cols_(sh);
  for (var r = Math.max(rg.getRow(), 2); r <= rg.getLastRow(); r++) syncRow_(sh, r, cols, false);
}

/** Re-syncs every 已確認 row (and every row that still has event IDs). Safe to run any number of times. */
function syncAllRows() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME), cols = cols_(sh);
  var last = sh.getLastRow(); if (last < 2) return 'no rows';
  var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
  var lines = [], tot = { created: 0, updated: 0, deleted: 0 };
  for (var i = 0; i < vals.length; i++) {
    var st = String(vals[i][cols['狀態'] - 1] || '').trim(), id = String(vals[i][cols[EVENT_ID_HEADER] - 1] || '').trim();
    if (st !== STATUS_CONFIRMED && !id) continue;
    try {
      var res = syncRow_(sh, i + 2, cols, false);
      tot.created += res.created; tot.updated += res.updated; tot.deleted += res.deleted;
      lines.push('第 ' + (i + 2) + ' 列 ' + (res.ref || '') + '：' + (res.titles.length ? res.titles.join('、') : '（無事件）') +
        '｜新建 ' + res.created + '、更新 ' + res.updated + '、刪除舊/重複 ' + res.deleted);
    } catch (err) {
      lines.push('第 ' + (i + 2) + ' 列 錯誤：' + err);
    }
  }
  var out = 'SNOWMODE 日曆同步完成：新建 ' + tot.created + '、更新 ' + tot.updated + '、刪除 ' + tot.deleted + '\n' + lines.join('\n');
  console.log(out);
  return out;
}

/**
 * Bring one row's calendar events in line with its 狀態.
 * onlyIfConfirmed: detail edit (not the status cell) -> only refresh rows already 已確認.
 * Returns {row, ref, created, updated, deleted, titles}.
 */
function syncRow_(sh, r, cols, onlyIfConfirmed) {
  var res = { row: r, ref: '', created: 0, updated: 0, deleted: 0, titles: [] };
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var vals = sh.getRange(r, 1, 1, sh.getLastColumn()).getValues()[0];
    var get = function (h) { return cols[h] ? vals[cols[h] - 1] : ''; };
    var status = String(get('狀態') || '').trim();
    if (onlyIfConfirmed && status !== STATUS_CONFIRMED) return res;
    var confirmed = status === STATUS_CONFIRMED;
    var ids = splitIds_(get(EVENT_ID_HEADER));
    var ref = String(get('預約編號') || '').trim();
    if (!confirmed && !ids.length && !ref) return res;
    var ss = sh.getParent();
    var idCell = sh.getRange(r, cols[EVENT_ID_HEADER]);
    var dateCell = sh.getRange(r, cols['日期與時段']);
    if (confirmed && !ref) { // hand-typed row: give it a reference number (committed right away)
      ref = 'SM-' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'MMdd') + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
      sh.getRange(r, cols['預約編號']).setValue(ref); vals[cols['預約編號'] - 1] = ref;
      SpreadsheetApp.flush();
    }
    res.ref = ref;
    var cal = getCalendar_();
    var lessons = parseLessons_(get('日期與時段'), get('方案'));
    var found = findBookingEvents_(cal, ref, ids, lessons);
    var removeAll = function () {
      found.live.concat(found.stray).forEach(function (f) { if (deleteEvent_(f.ev, f.id)) res.deleted++; });
      if (String(get(EVENT_ID_HEADER) || '') !== '') idCell.setValue('');
    };
    if (!confirmed) { removeAll(); dateCell.setNote(''); return res; }
    if (!lessons.length) {
      removeAll();
      dateCell.setNote('⚠ 無法讀取日期，未建立日曆事件。格式範例：\n2027-01-15 全日\n2027-01-16 半日（上午）\n2027-01-17 13:00-16:00');
      ss.toast('第 ' + r + ' 列：讀不到日期，請檢查「日期與時段」', 'SNOWMODE 日曆', 8);
      return res;
    }
    var people = Number(get('總人數')) || ((Number(get('大人')) || 0) + (Number(get('小孩')) || 0));
    var name = String(get('姓名') || '').trim() || '（未填姓名）';
    var resort = String(get('雪場') || '').trim();
    var link = ss.getUrl().replace(/\/edit.*$/, '') + '/edit#gid=' + sh.getSheetId() + '&range=A' + r;
    var desc = [
      '預約編號：' + ref,
      '姓名：' + name,
      '聯絡：' + [get('聯絡方式'), get('聯絡 ID')].filter(String).join(' ') + (get('Email') ? '／' + get('Email') : ''),
      '電話：' + phoneLine_(get('電話'), String(get('WhatsApp') || '').trim() !== ''),
      '雪具：' + (get('雪具') || '—') + '　程度：' + (get('程度') || '—') + '　語言：' + (get('語言') || '—'),
      '人數：' + (people || '—') + '（大人 ' + (get('大人') || 0) + '、小孩 ' + (get('小孩') || 0) + (get('小孩年齡') ? '，年齡 ' + get('小孩年齡') : '') + '）',
      '雪場：' + (resort || '—'),
      '方案：' + (get('方案') || '—') + (get('總額 (NT$)') ? '　總額 ' + (isNaN(Number(get('總額 (NT$)'))) ? '' : 'NT$') + get('總額 (NT$)') : '') + (get('訂金 30% (NT$)') ? '（訂金 NT$' + get('訂金 30% (NT$)') + '）' : ''),
      '備註：' + (get('備註') || '—'),
      '全部日期：' + lessons.map(function (l) { return l.date + ' ' + l.start + '–' + l.end; }).join('、'),
      '',
      '試算表（第 ' + r + ' 列）：' + link
    ].join('\n');

    var used = {}, keep = [];
    var saveIds = function () { // commit the ID list immediately so a concurrent/rapid second run sees it
      var v = keep.join(',');
      if (String(idCell.getValue() || '') !== v) idCell.setValue(v);
      SpreadsheetApp.flush();
    };
    lessonRuns_(lessons).forEach(function (run) {
      var title = eventTitle_(resort, get('雪具'), run.days, people);
      res.titles.push(run.start.slice(5).replace('-', '/') + (run.start === run.last ? '' : '–' + run.last.slice(5).replace('-', '/')) + ' ' + title);
      var match = null;
      for (var i = 0; i < found.live.length && !match; i++) {
        var f = found.live[i];
        if (!used[f.id] && sameRun_(f.ev, run)) match = f;
      }
      if (match) {
        used[match.id] = 1; keep.push(match.id);
        if (refreshEvent_(match.ev, title, desc, resort, ref, run.key)) res.updated++;
      } else {
        var ev = cal.createAllDayEvent(title, dayDate_(run.start), dayDate_(run.endExcl), { description: desc, location: resort });
        ev.setColor(CalendarApp.EventColor.RED);
        ev.setTag(TAG_REF, ref); ev.setTag(TAG_RUN, run.key);
        keep.push(ev.getId()); res.created++;
        saveIds();
      }
    });
    saveIds();
    // Everything else this script made for this 預約編號 (old per-day timed events, duplicates, moved dates) goes away.
    found.live.forEach(function (f) { if (!used[f.id] && deleteEvent_(f.ev, f.id)) res.deleted++; });
    found.stray.forEach(function (f) { if (keep.indexOf(f.id) < 0 && deleteEvent_(f.ev, f.id)) res.deleted++; });
    dateCell.setNote('');
    if (res.created || res.deleted || res.updated)
      ss.toast('第 ' + r + ' 列：日曆已更新（' + res.titles.join('、') + '）', 'SNOWMODE 日曆', 5);
    return res;
  } finally {
    try { SpreadsheetApp.flush(); } catch (x) {} // commit pending writes while we still hold the lock
    lock.releaseLock();
  }
}

/** "a@google.com, b" -> ['a@google.com','b'] */
function splitIds_(v) { return String(v || '').split(',').map(function (x) { return x.trim(); }).filter(String); }
function baseId_(id) { return String(id || '').replace(/@google\.com$/, ''); }

/**
 * This booking's events on the SNOWMODE calendar.
 * live  = events seen in a time-range scan (never returns deleted events) that carry our tag, our 預約編號 line, or a stored ID.
 * stray = stored IDs not seen in the scan (e.g. dates moved far away) -> only ever deleted.
 */
function findBookingEvents_(cal, ref, ids, lessons) {
  var stored = {}; ids.forEach(function (id) { stored[baseId_(id)] = 1; });
  var live = [], seen = {};
  var day = 864e5, now = new Date();
  var first = lessons.length ? dayDate_(lessons[0].date) : now, last = lessons.length ? dayDate_(lessons[lessons.length - 1].date) : now;
  var from = new Date(Math.min(first.getTime(), now.getTime()) - 60 * day), to = new Date(Math.max(last.getTime(), now.getTime()) + 450 * day);
  var re = ref ? new RegExp('(^|\\n)預約編號：' + ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(\\s|$)') : null;
  cal.getEvents(from, to).forEach(function (ev) {
    var id = ev.getId(), b = baseId_(id);
    if (seen[b]) return;
    var tag = ''; try { tag = String(ev.getTag(TAG_REF) || ''); } catch (x) {}
    var mine = stored[b] || (ref && tag === ref) || (re && re.test(String(ev.getDescription() || '')));
    if (!mine) return;
    seen[b] = 1; live.push({ id: id, ev: ev });
  });
  var stray = [];
  ids.forEach(function (id) {
    if (seen[baseId_(id)]) return;
    seen[baseId_(id)] = 1;
    var ev = null; try { ev = cal.getEventById(id); } catch (x) { console.warn('get ' + id + ': ' + x); }
    if (ev) stray.push({ id: id, ev: ev });
  });
  return { live: live, stray: stray };
}

function deleteEvent_(ev, id) {
  try { ev.deleteEvent(); return true; } catch (x) { console.warn('delete ' + id + ': ' + x); return false; }
}

/** Update title/description/location/colour/tags only when they differ. Returns true if anything changed. */
function refreshEvent_(ev, title, desc, location, ref, runKey) {
  var changed = false;
  if (ev.getTitle() !== title) { ev.setTitle(title); changed = true; }
  if (String(ev.getDescription() || '') !== desc) { ev.setDescription(desc); changed = true; }
  if (String(ev.getLocation() || '') !== location) { ev.setLocation(location); changed = true; }
  if (String(ev.getColor() || '') !== EVENT_COLOR_ID) { ev.setColor(CalendarApp.EventColor.RED); changed = true; }
  if (ev.getTag(TAG_REF) !== ref) { ev.setTag(TAG_REF, ref); changed = true; }
  if (ev.getTag(TAG_RUN) !== runKey) { ev.setTag(TAG_RUN, runKey); changed = true; }
  return changed;
}

/** True if ev is an all-day event covering exactly run.start .. run.endExcl (exclusive). */
function sameRun_(ev, run) {
  try {
    if (!ev.isAllDayEvent()) return false;
    var tz = Session.getScriptTimeZone();
    return Utilities.formatDate(ev.getAllDayStartDate(), tz, 'yyyy-MM-dd') === run.start &&
      Utilities.formatDate(ev.getAllDayEndDate(), tz, 'yyyy-MM-dd') === run.endExcl;
  } catch (x) { return false; }
}

/** 'YYYY-MM-DD' -> Date at noon (script time zone); only the date part is used for all-day events. */
function dayDate_(ymd) { var p = String(ymd).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0); }
function nextYmd_(ymd) { var x = new Date(ymd + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); }

/** Lessons -> runs of consecutive dates: [{start, last, endExcl, key, days:[{date,label}]}]. */
function lessonRuns_(lessons) {
  var byDate = {}, dates = [];
  lessons.forEach(function (l) {
    if (!byDate[l.date]) { byDate[l.date] = []; dates.push(l.date); }
    byDate[l.date].push(l.label);
  });
  dates.sort();
  var runs = [];
  dates.forEach(function (d) {
    var labs = byDate[d];
    var label = (labs.indexOf('全天') >= 0 || labs.length > 1) ? '全天' : '半天';
    var run = runs[runs.length - 1];
    if (run && nextYmd_(run.last) === d) { run.last = d; run.days.push({ date: d, label: label }); }
    else runs.push(run = { start: d, last: d, days: [{ date: d, label: label }] });
  });
  runs.forEach(function (run) { run.endExcl = nextYmd_(run.last); run.key = run.start + '~' + run.last; });
  return runs;
}

/** 雪場｜板類｜N人｜半天/全天 ; mixed days -> 半天+全天 (by date, repeats collapsed); empty parts left out.
 *  板類: text containing 單板 -> 單板, 雙板 -> 雙板, both -> 單板+雙板; other text kept as typed. N = 總人數 (fallback 大人+小孩). */
function eventTitle_(resort, gear, days, people) {
  var r = String(resort || '').trim();
  if (r.indexOf('・') >= 0) r = r.split('・').pop().trim(); // 北海道・二世古 -> 二世古
  var g = String(gear || '').trim(), single = /單|snowboard|board/i.test(g), ski = /雙|(^|[^a-z])ski/i.test(g);
  g = single && ski ? '單板+雙板' : single ? '單板' : ski ? '雙板' : g;
  var n = Number(people) > 0 ? Math.round(Number(people)) + '人' : '';
  var seg = [];
  days.forEach(function (d) { if (seg[seg.length - 1] !== d.label) seg.push(d.label); });
  return [r, g, n, seg.join('+')].filter(String).join('｜') || 'SNOWMODE 課程';
}

/** [{date:'YYYY-MM-DD', slot:'全日'|'半日（上午）'|'半日（下午）'}] -> "2027/03/06-03/08 全天" (consecutive same-slot days merged, one range per line). */
function formatDates_(list) {
  var lab = function (sl) { sl = String(sl || ''); return /全/.test(sl) ? '全天' : (/下午/.test(sl) ? '半天（下午）' : (/上午/.test(sl) ? '半天（上午）' : sl)); };
  var ds = list.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  var next = function (d) { var x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
  var groups = [];
  ds.forEach(function (d) {
    var g = groups[groups.length - 1], l = lab(d.slot);
    if (g && g.label === l && next(g.end) === d.date) g.end = d.date;
    else groups.push({ start: d.date, end: d.date, label: l });
  });
  return groups.map(function (g) {
    var a = g.start.replace(/-/g, '/'), b = g.end.replace(/-/g, '/');
    var range = g.start === g.end ? a : a + '-' + (a.slice(0, 4) === b.slice(0, 4) ? b.slice(5) : b);
    return range + ' ' + g.label;
  }).join('\n');
}

/** Parse the 日期與時段 cell (text with one lesson per line, or a Date) into [{date,start,end,label}]. */
function parseLessons_(v, plan) {
  var defaultFull = !(/半/.test(String(plan || '')) && !/全/.test(String(plan || '')));
  var out = [], seen = {};
  var push = function (date, line) {
    line = String(line || '');
    var t = line.match(/(\d{1,2})[:：](\d{2})\s*[-~～–—至到]\s*(\d{1,2})[:：](\d{2})/);
    var slot, label;
    if (/全/.test(line)) slot = 'full';
    else if (/下午|午後|PM/i.test(line)) slot = 'pm';
    else if (/上午|午前|AM|半/i.test(line)) slot = 'am';
    else slot = defaultFull ? 'full' : 'am';
    var se = SLOT_TIMES[slot].slice();
    if (t) {
      se = [pad_(t[1]) + ':' + t[2], pad_(t[3]) + ':' + t[4]];
      var hrs = (Number(t[3]) * 60 + Number(t[4]) - Number(t[1]) * 60 - Number(t[2])) / 60;
      label = hrs > 4 ? '全天' : '半天';
    } else label = slot === 'full' ? '全天' : '半天';
    var key = date + se[0];
    if (seen[key]) return; seen[key] = 1;
    out.push({ date: date, start: se[0], end: se[1], label: label });
  };
  if (v instanceof Date) { push(Utilities.formatDate(v, CAL_TZ, 'yyyy-MM-dd'), ''); return out; }
  var lastY = 0, lastMo = 0; // "2027/01/17 半天 + 01/18 全天": 01/18 inherits 2027
  String(v || '').split(/[\n;；,，、+＋]+/).forEach(function (line) {
    line = line.trim(); if (!line) return;
    // Date range, e.g. "2027-03-06~2027-03-08 全日", "2027-03-06 至 03-08", "2027/3/6~8" -> one lesson per day
    var rg = line.match(/(\d{4})\s*[-\/.年]\s*(\d{1,2})\s*[-\/.月]\s*(\d{1,2})日?\s*[~～至到–—-]\s*(?:(?:(\d{4})\s*[-\/.年]\s*)?(\d{1,2})\s*[-\/.月]\s*)?(\d{1,2})日?/);
    if (rg) {
      var from = new Date(+rg[1], +rg[2] - 1, +rg[3]);
      var to = new Date(+(rg[4] || rg[1]), +(rg[5] || rg[2]) - 1, +rg[6]);
      var rest = line.replace(rg[0], '');
      lastY = to.getFullYear(); lastMo = to.getMonth() + 1;
      for (var dd = from, guard = 0; dd <= to && guard < 31; dd = new Date(dd.getFullYear(), dd.getMonth(), dd.getDate() + 1), guard++)
        push(dd.getFullYear() + '-' + pad_(dd.getMonth() + 1) + '-' + pad_(dd.getDate()), rest);
      return;
    }
    var m = line.match(/(\d{4})\s*[-\/.年]\s*(\d{1,2})\s*[-\/.月]\s*(\d{1,2})/), y, mo, d;
    if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
    else {
      m = line.match(/(?:^|[^\d:])(\d{1,2})\s*[\/月]\s*(\d{1,2})(?!\d|\s*[:：])/);
      if (!m) return;
      mo = +m[1]; d = +m[2];
      if (lastY) y = mo < lastMo ? lastY + 1 : lastY;
      else {
        var now = new Date(), cy = now.getFullYear(), seasonStart = now.getMonth() >= 6 ? cy : cy - 1;
        y = mo >= 7 ? seasonStart : seasonStart + 1;
      }
    }
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return;
    lastY = y; lastMo = mo;
    push(y + '-' + pad_(mo) + '-' + pad_(d), line.replace(m[0], ''));
  });
  out.sort(function (a, b) { return (a.date + a.start) < (b.date + b.start) ? -1 : 1; });
  return out;
}

function getCalendar_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('CAL_ID');
  var cal = id ? CalendarApp.getCalendarById(id) : null;
  if (!cal) {
    var found = CalendarApp.getCalendarsByName(CAL_NAME);
    cal = found.length ? found[0] : CalendarApp.createCalendar(CAL_NAME, { timeZone: CAL_TZ, color: CalendarApp.Color.BLUE, summary: 'SNOWMODE 已確認課程（由預約試算表自動同步）' });
    props.setProperty('CAL_ID', cal.getId());
  }
  if (cal.getTimeZone() !== CAL_TZ) cal.setTimeZone(CAL_TZ);
  return cal;
}

function statusRule_() {
  return SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build();
}

function cols_(sh) {
  var h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], o = {};
  h.forEach(function (x, i) { if (x !== '') o[String(x).trim()] = i + 1; });
  return o;
}

function pad_(n) { n = String(n); return n.length < 2 ? '0' + n : n; }

/* ======================= Bookkeeping columns ======================= */

/** Group total for a web booking: sum of per-lesson prices. '' when 5+ people or unknown. */
// 越後湯澤 resorts with an extra fee: + NT$ per lesson day per group (half or full day)
var RESORT_SURCHARGE = { '神立': 2000, '石打丸山': 2000 };
function priceFor_(people, dates, resort) {
  var row = PRICE_TABLE[people];
  if (!row || !dates.length) return '';
  var extra = RESORT_SURCHARGE[String(resort || '').trim()] || 0;
  return dates.reduce(function (sum, d) { return sum + (/全/.test(String(d.slot || '')) ? row[1] : row[0]) + extra; }, 0);
}

/**
 * Formula columns, each as one ARRAYFORMULA in its header cell so every row (web or hand-typed) is covered:
 *   尚欠金額 = 總價 − 已收訂金
 *   抽成金額 = 總價 × 抽成比例 (blank unless 客人來源 = 朋友介紹 and 比例 filled; "10" is read as 10%)
 *   實收     = 總價 − 抽成金額
 */
function setBookFormulas_(sh) {
  var cols = cols_(sh);
  var L = function (h) { var c = colLetter_(cols[h]); return c + '2:' + c; };
  var num = function (h) { return 'IF(ISNUMBER(' + L(h) + '),' + L(h) + ',0)'; };
  if (cols['尚欠金額'] && cols['總價'] && cols['已收訂金'])
    sh.getRange(1, cols['尚欠金額']).setFormula('={"尚欠金額";ARRAYFORMULA(IF(ISNUMBER(' + L('總價') + '),' + L('總價') + '-' + num('已收訂金') + ',""))}');
  if (cols['抽成金額'] && cols['抽成比例'] && cols['客人來源']) {
    var r = 'IFERROR(VALUE(' + L('抽成比例') + '),0)';
    sh.getRange(1, cols['抽成金額']).setFormula('={"抽成金額";ARRAYFORMULA(IF((' + L('客人來源') + '="朋友介紹")*ISNUMBER(' + L('總價') + ')*(' + L('抽成比例') + '<>""),' +
      'ROUND(' + L('總價') + '*IF(' + r + '>1,' + r + '/100,' + r + ')),""))}');
  }
  if (cols['實收'] && cols['抽成金額'])
    sh.getRange(1, cols['實收']).setFormula('={"實收";ARRAYFORMULA(IF(ISNUMBER(' + L('總價') + '),' + L('總價') + '-' + num('抽成金額') + ',""))}');
}

/** One cell. A dropdown that rejects the value is cleared for that cell and the value is written anyway. */
function writeCell_(sh, row, col, value) {
  if (value && typeof value === 'object') {
    try { value = Array.isArray(value) ? value.join('、') : JSON.stringify(value).slice(0, 45000); }
    catch (e) { value = ''; }
  }
  var range = sh.getRange(row, col);
  try { range.setValue(value); return; } catch (e1) { console.error(e1); }
  try { range.clearDataValidations(); range.setValue(value); } catch (e2) { console.error(e2); }
}

/** Writes a record (header -> value) into the next empty row, by header name; never touches the formula column.
 *  Each cell is its own write: one rejected value must not leave the columns after 實收 blank. */
function writeRecord_(sh, rec) {
  var cols = cols_(sh);
  // last row that has any value outside the ARRAYFORMULA columns
  var skipF = FORMULA_HEADERS.map(function (h) { return cols[h]; });
  var last = 1, n = sh.getLastRow();
  if (n >= 2) {
    var all = sh.getRange(2, 1, n - 1, sh.getLastColumn()).getValues();
    for (var i = all.length - 1; i >= 0 && last === 1; i--) {
      if (all[i].some(function (v, j) { return skipF.indexOf(j + 1) < 0 && v !== '' && v !== null; })) last = i + 2;
    }
  }
  var r = last + 1;
  if (r > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 20);
  var skip = FORMULA_HEADERS.map(function (h) { return cols[h]; }).filter(Boolean);
  Object.keys(rec).forEach(function (h) {
    if (cols[h] && skip.indexOf(cols[h]) < 0) writeCell_(sh, r, cols[h], rec[h]);
  });
  try {
    // multi-line 日期與時段: wrap the cell and let the row grow so every lesson day is visible (also on the phone app)
    var dc = sh.getRange(r, cols['日期與時段']);
    dc.setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);
    var nLines = String(rec['日期與時段'] || '').split('\n').length;
    if (nLines > 1) sh.autoResizeRows(r, 1); else sh.setRowHeightsForced(r, 1, 21); // fit the wrapped lines exactly
    if (nLines > 1) sh.getRange(r, 1, 1, sh.getLastColumn()).setVerticalAlignment('top'); // tall row: keep every cell aligned to the top
    sh.getRange(r, cols['狀態']).setDataValidation(statusRule_());
    if (cols['客人來源']) sh.getRange(r, cols['客人來源']).setDataValidation(sourceRule_());
  } catch (vErr) { console.error(vErr); }
  return r;
}

function sourceRule_() {
  return SpreadsheetApp.newDataValidation().requireValueInList(SOURCE_OPTIONS, true).setAllowInvalid(true).build();
}

/** Run once from the editor: inserts the bookkeeping columns after 狀態 (if missing), formula, dropdown, formats. Safe to re-run. */
function setupBookkeeping() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  var cols = cols_(sh);
  // Insert any missing bookkeeping column right after its predecessor (狀態 for the first one)
  var prev = '狀態';
  BOOK_HEADERS.forEach(function (h) {
    if (!cols[h]) {
      sh.insertColumnAfter(cols[prev]);
      sh.getRange(1, cols[prev] + 1).setValue(h).setFontWeight('bold').setBackground('#0a1020').setFontColor('#ffffff');
      cols = cols_(sh);
    }
    prev = h;
  });
  setBookFormulas_(sh);
  cols = cols_(sh);
  var n = Math.max(sh.getMaxRows() - 1, 1);
  // inserted columns inherit the 狀態 dropdown from the left: clear validation on the whole block first
  sh.getRange(2, cols[BOOK_HEADERS[0]], n, BOOK_HEADERS.length).clearDataValidations();
  sh.getRange(2, cols['抽成比例'], n, 1).setNumberFormat('0%').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['10%', '15%', '20%'], true).setAllowInvalid(true).build());
  ['總價', '已收訂金', '尚欠金額', '抽成金額', '實收', '總額 (NT$)', '訂金 30% (NT$)', '尾款 (NT$)'].forEach(function (h) {
    if (cols[h]) sh.getRange(2, cols[h], n, 1).setNumberFormat(MONEY_FORMAT);
  });
  sh.getRange(2, cols['客人來源'], n, 1).setDataValidation(sourceRule_());
  FORMULA_HEADERS.forEach(function (h) { sh.getRange(2, cols[h], n, 1).setBackground('#f1f8ff'); });
  // Grey out 介紹人 / 抽成比例 / 抽成金額 unless 客人來源 = 朋友介紹
  var src = colLetter_(cols['客人來源']);
  var refRange = sh.getRange(2, cols['介紹人'], n, cols['抽成金額'] - cols['介紹人'] + 1);
  var rules = sh.getConditionalFormatRules().filter(function (r) {
    var b = r.getBooleanCondition();
    return !(b && String(b.getCriteriaValues()[0] || '').indexOf('朋友介紹') >= 0);
  });
  rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$' + src + '2<>"朋友介紹"')
    .setBackground('#eeeeee').setFontColor('#9e9e9e').setRanges([refRange]).build());
  sh.setConditionalFormatRules(rules);
  // Backfill existing web-form rows: 客人來源 = 網路, 總價 from the price table
  var last = sh.getLastRow();
  if (last >= 2) {
    var vals = sh.getRange(2, 1, last - 1, sh.getLastColumn()).getValues();
    vals.forEach(function (v, i) {
      var raw = String(v[cols['原始資料'] - 1] || '');
      if (!raw || raw.charAt(0) !== '{') return;
      var p; try { p = JSON.parse(raw); } catch (x) { return; }
      if (!v[cols['客人來源'] - 1]) sh.getRange(i + 2, cols['客人來源']).setValue(SOURCE_WEB);
      var rs = String(p.resort || '').trim();
      var noResortBf = !rs || /由教練建議/.test(rs);
      if (v[cols['總價'] - 1] === '' && !noResortBf) {
        var people = Number(p.totalPeople) || ((Number(p.adults) || 0) + (Number(p.children) || 0));
        var t = priceFor_(people, p.dates || [], p.resort);
        if (t !== '') sh.getRange(i + 2, cols['總價']).setValue(t);
      }
    });
  }
  return 'ok: ' + JSON.stringify(cols);
}

function colLetter_(n) { var s = ''; while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); } return s; }

/* ======================= 轉介案 + 總覽 tabs ======================= */
var REF_SHEET = '轉介案', SUMMARY_SHEET = '總覽';
var REF_HEADERS = ['上課日期', '結束日期', '客人姓名', '聯絡方式', '接案教練', '半天/全天', '人數', '板類', '程度', '雪場', '總價 (NT$)', '訂金 (NT$)', '訂金已付?', '訂金收取人', '抽成比例', '我的分潤', '分潤已收?', '已與教練結算?', '備註'];

/** Run once from the editor: creates the 轉介案 (referrals to other coaches, no calendar sync) and 總覽 tabs. Safe to re-run. */
function setupReferralAndSummary() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var rs = ss.getSheetByName(REF_SHEET) || ss.insertSheet(REF_SHEET);
  if (String(rs.getRange(1, 1).getValue()) !== REF_HEADERS[0]) rs.getRange(1, 1, 1, REF_HEADERS.length).setValues([REF_HEADERS]);
  // add any missing column right after its predecessor (keeps existing data in place)
  var rc = cols_(rs);
  REF_HEADERS.forEach(function (h, i) {
    if (!rc[h]) { rs.insertColumnAfter(rc[REF_HEADERS[i - 1]]); rs.getRange(1, rc[REF_HEADERS[i - 1]] + 1).setValue(h); rc = cols_(rs); }
  });
  rs.getRange(1, 1, 1, rs.getLastColumn()).setFontWeight('bold').setBackground('#0a1020').setFontColor('#ffffff');
  rs.setFrozenRows(1);
  var n = Math.max(rs.getMaxRows() - 1, 1);
  var c = function (h) { return rc[h]; };
  rs.getRange(2, 1, n, rs.getLastColumn()).clearDataValidations();
  var L = function (h) { var x = colLetter_(c(h)); return x + '2:' + x; };
  rs.getRange(2, c('上課日期'), n, 1).setNumberFormat('yyyy-mm-dd')
    .setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(true).build());
  rs.getRange(2, c('結束日期'), n, 1).setNumberFormat('yyyy-mm-dd')
    .setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(true).build());
  rs.getRange(2, c('程度'), n, 1).setNumberFormat('General');
  rs.getRange(2, c('半天/全天'), n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['半天', '全天'], true).setAllowInvalid(true).build());
  rs.getRange(2, c('板類'), n, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['單板', '雙板'], true).setAllowInvalid(true).build());
  rs.getRange(2, c('總價 (NT$)'), n, 1).setNumberFormat(MONEY_FORMAT);
  rs.getRange(2, c('訂金 (NT$)'), n, 1).setNumberFormat(MONEY_FORMAT);
  rs.getRange(2, c('訂金已付?'), n, 1).setNumberFormat('General').insertCheckboxes();
  rs.getRange(2, c('我的分潤'), n, 1).setNumberFormat(MONEY_FORMAT).setBackground('#f1f8ff');
  rs.getRange(2, c('抽成比例'), n, 1).setNumberFormat('0%').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['10%', '15%', '20%'], true).setAllowInvalid(true).build());
  rs.getRange(2, c('分潤已收?'), n, 1).setNumberFormat('General').insertCheckboxes();
  rs.getRange(2, c('已與教練結算?'), n, 1).setNumberFormat('General').insertCheckboxes();
  rs.getRange(2, c('訂金收取人'), n, 1).setNumberFormat('General').setDataValidation(
    SpreadsheetApp.newDataValidation().requireValueInList(['Jay', '接案教練'], true).setAllowInvalid(false).build());
  var r = 'IFERROR(VALUE(' + L('抽成比例') + '),0)';
  rs.getRange(1, c('我的分潤')).setFormula('={"我的分潤";ARRAYFORMULA(IF(ISNUMBER(' + L('總價 (NT$)') + ')*(' + L('抽成比例') + '<>""),ROUND(' +
    L('總價 (NT$)') + '*IF(' + r + '>1,' + r + '/100,' + r + ')),""))}');
  rs.setColumnWidth(c('備註'), 220);
  tidyLayout();

  // 總覽
  var sm = ss.getSheetByName(SUMMARY_SHEET) || ss.insertSheet(SUMMARY_SHEET, 0);
  var bk = ss.getSheetByName(SHEET_NAME), cols = cols_(bk);
  var B = function (h) { var x = colLetter_(cols[h]); return "'" + SHEET_NAME + "'!" + x + '2:' + x; };
  var R = function (h) { var x = colLetter_(c(h)); return "'" + REF_SHEET + "'!" + x + '2:' + x; };
  var ok = B('狀態') + ',"' + STATUS_CONFIRMED + '"';
  var rows = [
    ['SNOWMODE 總覽', ''],
    ['我自己的課（預約表，狀態＝已確認）', ''],
    ['已確認預約數', '=COUNTIF(' + ok + ')'],
    ['總價合計', '=SUMIFS(' + B('總價') + ',' + ok + ')'],
    ['已收訂金合計', '=SUMIFS(' + B('已收訂金') + ',' + ok + ')'],
    ['尚欠合計', '=SUMIFS(' + B('尚欠金額') + ',' + ok + ')'],
    ['付給介紹人抽成合計', '=SUMIFS(' + B('抽成金額') + ',' + ok + ')'],
    ['我自己的課實收合計（總價 − 抽成）', '=SUMIFS(' + B('實收') + ',' + ok + ')'],
    ['', ''],
    ['轉介給其他教練（轉介案）', ''],
    ['轉介案件數', '=COUNTA(' + R('上課日期') + ')'],
    ['轉介分潤合計', '=SUM(' + R('我的分潤') + ')'],
    ['轉介分潤已收（含 Jay 代收訂金中的分潤）', '=SUMPRODUCT(IFERROR(' + R('我的分潤') + '*1,0)*(((' + R('分潤已收?') + '=TRUE)+(' + R('訂金收取人') + '="Jay")*(' + R('訂金已付?') + '=TRUE))>0))'],
    ['轉介分潤未收', '=B12-B13'],
    ['Jay 代收訂金、尚未結算給教練（訂金 − 分潤）', '=SUMPRODUCT((' + R('訂金收取人') + '="Jay")*(' + R('訂金已付?') + '=TRUE)*(' + R('已與教練結算?') + '<>TRUE)*(IFERROR(' + R('訂金 (NT$)') + '*1,0)-IFERROR(' + R('我的分潤') + '*1,0)))'],
    ['', ''],
    ['※ 自動計算，請勿手動修改。數字來自「預約」與「轉介案」分頁。', '']
  ];
  sm.clear();
  sm.getRange(1, 1, rows.length, 2).setValues(rows);
  sm.getRange('A1').setFontSize(14).setFontWeight('bold');
  sm.getRange('A2:B2').setFontWeight('bold').setBackground('#0a1020').setFontColor('#ffffff');
  sm.getRange('A10:B10').setFontWeight('bold').setBackground('#0a1020').setFontColor('#ffffff');
  sm.getRange('B4:B8').setNumberFormat(MONEY_FORMAT);
  sm.getRange('B12:B15').setNumberFormat(MONEY_FORMAT);
  sm.getRange('A8:B8').setFontWeight('bold').setBackground('#c8e6c9');
  sm.getRange('A14:B14').setFontWeight('bold').setBackground('#fff3cd');
  sm.getRange('A17').setFontColor('#757575');
  sm.getRange('A15:B15').setBackground('#fde2e1');
  sm.setColumnWidth(1, 300); sm.setColumnWidth(2, 140);
  return 'ok';
}

/** Diagnostics: lists the next lesson events with their times in Japan and Taiwan time. */
function checkEventTimes() {
  var cal = getCalendar_(), now = new Date();
  var evs = cal.getEvents(now, new Date(now.getTime() + 400 * 864e5));
  var out = ['calendar id=' + cal.getId() + ', tz=' + cal.getTimeZone() + ', script tz=' + Session.getScriptTimeZone() + ', sheet tz=' + SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone()];
  evs.forEach(function (e) {
    var f = function (d, tz) { return Utilities.formatDate(d, tz, 'yyyy-MM-dd HH:mm'); };
    out.push(e.getTitle() + ' | JST ' + f(e.getStartTime(), 'Asia/Tokyo') + '–' + f(e.getEndTime(), 'Asia/Tokyo').slice(11) +
      ' | TW ' + f(e.getStartTime(), 'Asia/Taipei') + '–' + f(e.getEndTime(), 'Asia/Taipei').slice(11));
  });
  console.log(out.join('\n'));
  return out.join('\n');
}

/** Long text is clipped (full text still shows when the cell is selected) and rows stay at the default 21px height. */
function tidyLayout() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  [[SHEET_NAME, ['程度', '備註', '日期與時段', '原始資料']], [REF_SHEET, ['程度', '備註']]].forEach(function (x) {
    var sh = ss.getSheetByName(x[0]); if (!sh) return;
    var cols = cols_(sh), n = Math.max(sh.getMaxRows() - 1, 1);
    x[1].forEach(function (h) { if (cols[h]) sh.getRange(2, cols[h], n, 1).setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP); });
    sh.setRowHeightsForced(2, n, 21);
  });
}
