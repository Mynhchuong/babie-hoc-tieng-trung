/**
 * Báo cáo tiến độ "Halken nhắc Babie học tiếng Trung"
 * - App của bồ gửi số liệu lên đây (doPost) -> ghi vào Google Sheet
 * - Mỗi tối tự gửi email tổng kết cho Halken (guiBaoCao)
 *
 * CÀI ĐẶT: xem HUONG_DAN.md cùng thư mục.
 */

// ====== TÙY CHỈNH ======
const GIO_GUI_EMAIL = 21;          // 21 = khoảng 21:00–22:00 mỗi tối
const EMAIL_NHAN = '';             // để trống = gửi về chính tài khoản Google đang chạy script
const TEN = 'Babie';
// =======================

const TZ = 'Asia/Ho_Chi_Minh';
const HEAD = ['Ngày', 'Phút học', 'Số câu', 'Bắt đầu', 'Kết thúc', 'Bài đã học', 'Cập nhật lúc'];

function caiDat() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('SHEET_ID');
  if (!id) {
    const ss = SpreadsheetApp.create(TEN + ' học tiếng Trung - Nhật ký');
    const sh = ss.getActiveSheet();
    sh.setName('Nhật ký');
    sh.appendRow(HEAD);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold').setBackground('#ffd6ea');
    sh.setFrozenRows(1);
    const t = ss.insertSheet('Tổng quan');
    t.appendRow(['Mục', 'Giá trị']);
    t.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#ffd6ea');
    id = ss.getId();
    props.setProperty('SHEET_ID', id);
  }
  ScriptApp.getProjectTriggers().forEach(tr => {
    if (tr.getHandlerFunction() === 'guiBaoCao') ScriptApp.deleteTrigger(tr);
  });
  ScriptApp.newTrigger('guiBaoCao').timeBased().everyDays(1).atHour(GIO_GUI_EMAIL).inTimezone(TZ).create();
  Logger.log('Xong! Sheet: https://docs.google.com/spreadsheets/d/' + id);
  Logger.log('Bước tiếp: Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone)');
}

function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Chưa chạy caiDat()');
  return SpreadsheetApp.openById(id);
}

// ---- App gửi số liệu lên ----
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const ss = ss_();
    const sh = ss.getSheetByName('Nhật ký');
    const data = sh.getDataRange().getValues();
    const rowOf = {};
    for (let i = 1; i < data.length; i++) rowOf[fmtDate_(data[i][0])] = i + 1;
    const now = Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm');
    Object.keys(d.days || {}).sort().forEach(k => {
      const v = d.days[k];
      const row = ["'" + k, Math.round(v.s / 6) / 10, v.a, "'" + (v.f || ''), "'" + (v.t || ''), v.l, "'" + now];
      if (rowOf[k]) sh.getRange(rowOf[k], 1, 1, row.length).setValues([row]);
      else { sh.appendRow(row); rowOf[k] = sh.getLastRow(); }
    });
    if (sh.getLastRow() > 2) sh.getRange(2, 1, sh.getLastRow() - 1, HEAD.length).sort({ column: 1, ascending: false });
    const t = ss.getSheetByName('Tổng quan');
    t.getRange(2, 1, 7, 2).setValues([
      ['Chuỗi ngày học liên tiếp', d.streak],
      ['Tổng số ngày đã học', d.studied],
      ['Từ đã thuộc', d.known + ' / ' + d.total],
      ['Tổng thời gian (phút)', d.totalMin],
      ['Mục tiêu mỗi ngày (phút)', d.goal],
      ['Lần cập nhật cuối', "'" + now],
      ['', '']
    ]);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

function doGet() { return ContentService.createTextOutput('Babie hoc tieng Trung - OK'); }

function fmtDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return String(v);
}

// ---- Email tổng kết mỗi tối ----
function guiBaoCao() {
  const ss = ss_();
  const rows = ss.getSheetByName('Nhật ký').getDataRange().getValues().slice(1)
    .map(r => ({ k: fmtDate_(r[0]), m: Number(r[1]) || 0, a: r[2], f: r[3], t: r[4], l: r[5] }));
  const tq = {};
  ss.getSheetByName('Tổng quan').getDataRange().getValues().slice(1).forEach(r => tq[r[0]] = r[1]);
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const hn = rows.find(r => r.k === today);
  const goal = Number(tq['Mục tiêu mỗi ngày (phút)']) || 15;

  // 7 ngày gần nhất
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
    const r = rows.find(x => x.k === k);
    week.push({ lbl: Utilities.formatDate(d, TZ, 'dd/MM'), m: r ? r.m : 0 });
  }
  const weekMin = week.reduce((s, w) => s + w.m, 0);
  const bars = week.map(w => {
    const h = Math.min(60, Math.round(w.m / goal * 40));
    const c = w.m >= goal ? '#e0218a' : w.m > 0 ? '#ff9fcd' : '#f3d6e4';
    return `<td style="vertical-align:bottom;text-align:center;padding:0 6px;font:12px Arial;color:#9a4b78">
      <div style="font-weight:bold">${Math.round(w.m)}</div>
      <div style="width:26px;height:${Math.max(4, h)}px;background:${c};border-radius:6px 6px 2px 2px;margin:2px auto"></div>${w.lbl}</td>`;
  }).join('');

  let subject, head;
  if (hn && hn.m >= 1) {
    const ok = hn.m >= goal;
    subject = `${ok ? '🎀' : '📚'} ${TEN} hôm nay học ${Math.round(hn.m)} phút${ok ? ' — đủ mục tiêu!' : ''}`;
    head = `<p style="font-size:18px;margin:0 0 6px"><b>Hôm nay ${TEN} học <span style="color:#e0218a">${Math.round(hn.m)} phút</span></b> (mục tiêu ${goal} phút) ${ok ? '🎉' : ''}</p>
      <p style="margin:0;color:#7a3a62">⏰ Từ ${hn.f || '?'} đến ${hn.t || '?'} · ✏️ ${hn.a} câu đã làm<br>📖 ${hn.l || '—'}</p>`;
  } else {
    subject = `😢 ${TEN} hôm nay chưa học tiếng Trung`;
    head = `<p style="font-size:18px;margin:0"><b>Hôm nay ${TEN} chưa học</b> — nhắc nhẹ một câu nha anh Halken ♥</p>`;
  }
  const html = `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;background:#fff0f7;border-radius:18px;padding:22px;border:3px solid #f6c94c;color:#5a1340">
    <h2 style="margin:0 0 12px;color:#e0218a">♥ Báo cáo học tiếng Trung của ${TEN}</h2>
    <div style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:12px">${head}</div>
    <div style="background:#fff;border-radius:14px;padding:14px 16px;margin-bottom:12px">
      <b>7 ngày qua: ${Math.round(weekMin)} phút</b>
      <table style="margin-top:8px;border-collapse:collapse"><tr>${bars}</tr></table></div>
    <div style="background:#fff;border-radius:14px;padding:14px 16px">
      🔥 Chuỗi ngày liên tiếp: <b>${tq['Chuỗi ngày học liên tiếp'] || 0}</b><br>
      📅 Tổng số ngày đã học: <b>${tq['Tổng số ngày đã học'] || 0}</b><br>
      ✅ Từ đã thuộc: <b>${tq['Từ đã thuộc'] || 0}</b><br>
      ⏱ Tổng thời gian: <b>${tq['Tổng thời gian (phút)'] || 0} phút</b></div>
    <p style="font-size:12px;color:#b24c86;margin:12px 0 0">Xem chi tiết: <a href="${ss.getUrl()}">Google Sheet nhật ký</a> · Lần cập nhật cuối từ máy ${TEN}: ${tq['Lần cập nhật cuối'] || 'chưa có'}</p></div>`;
  const to = EMAIL_NHAN || Session.getEffectiveUser().getEmail();
  MailApp.sendEmail({ to, subject, htmlBody: html, name: 'Halken nhắc Babie học ♥' });
}

// Chạy tay để thử email ngay
function thuGuiEmail() { guiBaoCao(); }
