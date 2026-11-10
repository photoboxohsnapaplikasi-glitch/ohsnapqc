/**
 * ============================================================================
 * BACKEND CLOUD SYNC LINTAS HP/LAPTOP & MULTI-SHEET OTOMATIS (Code.gs)
 * ============================================================================
 * Fitur Utama:
 * 1. Sinkronisasi Lintas Perangkat (HP, Tablet, Laptop) Tanpa Batas Ukuran (Unlimited):
 *    Menyimpan state aplikasi di dalam sheet tersembunyi `_CLOUD_SYNC_DB_` (per blok 30.000 karakter)
 *    sehingga tidak pernah terkena batas 9 KB PropertiesService Google Apps Script.
 * 2. Penarik Otomatis Spreadsheet Cabang Kediri & 5 Cabang (`action=fetch_branch_sheet`):
 *    Membaca langsung tab `Laporan_Harian` dari Google Drive (bahkan jika file belum di-share publik
 *    atau ID file berubah) dan otomatis mengaktifkan akses "Anyone with the link".
 * 3. Database Spreadsheet QC 9 Kolom (`Database_QC` & `Hasil_QC_Softfile` / `Hasil_QC_Hardfile`):
 *    Format Kolom:
 *    Tanggal | Booth | Cabang | Angle (High/Normal) | Background (Booth/Tirai) | Foto Benchmark | Foto QC | Nilai Benchmark (Sistem, AI, Manual) | Catatan
 * 4. Pemisahan Multi-Sheet 5 Cabang (`Rekap_Cilacap`, `Rekap_Majenang`, `Rekap_Pemalang`,
 *    `Rekap_Pekalongan`, `Rekap_Kediri`) + Otomatis Buat Sheet Baru Saat Tambah Cabang Baru.
 */

const PROP_KEY = 'GABOOTH_CLOUD_ADMIN_STATE_V1';
const CLOUD_DB_SHEET_NAME = '_CLOUD_SYNC_DB_';
const CHUNK_SIZE = 30000;

function respondJsonOrJsonp(e, obj) {
  const jsonStr = JSON.stringify(obj);
  const cb = e && e.parameter && e.parameter.callback ? String(e.parameter.callback).replace(/[^a-zA-Z0-9_$.]/g, '') : '';
  if (cb) {
    return ContentService
      .createTextOutput(cb + '(' + jsonStr + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(jsonStr)
    .setMimeType(ContentService.MimeType.JSON);
}

function saveUnlimitedCloudState(stateObj) {
  const jsonStr = JSON.stringify(stateObj || {});
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      let dbSheet = ss.getSheetByName(CLOUD_DB_SHEET_NAME);
      if (!dbSheet) {
        dbSheet = ss.insertSheet(CLOUD_DB_SHEET_NAME);
        try { dbSheet.hideSheet(); } catch (eHide) {}
      } else {
        dbSheet.clearContents();
      }
      const chunks = [];
      for (let i = 0; i < jsonStr.length; i += CHUNK_SIZE) {
        chunks.push([jsonStr.slice(i, i + CHUNK_SIZE)]);
      }
      if (chunks.length > 0) {
        dbSheet.getRange(1, 1, chunks.length, 1).setValues(chunks);
      }
    }
  } catch (eSheet) {}

  // Simpan juga versi ringkas di ScriptProperties sebagai cadangan cepat
  try {
    if (jsonStr.length < 8500) {
      PropertiesService.getScriptProperties().setProperty(PROP_KEY, jsonStr);
    } else {
      const slim = Object.assign({}, stateObj);
      if (Array.isArray(slim.qcLogs)) {
        slim.qcLogs = slim.qcLogs.map(function (l) {
          const copy = Object.assign({}, l);
          delete copy.benchThumb;
          delete copy.qcThumb;
          return copy;
        });
      }
      const slimStr = JSON.stringify(slim);
      if (slimStr.length < 8500) {
        PropertiesService.getScriptProperties().setProperty(PROP_KEY, slimStr);
      }
    }
  } catch (eProp) {}
}

function loadUnlimitedCloudState() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) {
      const dbSheet = ss.getSheetByName(CLOUD_DB_SHEET_NAME);
      if (dbSheet) {
        const lastRow = dbSheet.getLastRow();
        if (lastRow >= 1) {
          const vals = dbSheet.getRange(1, 1, lastRow, 1).getValues();
          const joined = vals.map(function (r) { return String(r[0] || ''); }).join('');
          if (joined.trim().startsWith('{')) {
            return JSON.parse(joined);
          }
        }
      }
    }
  } catch (eSheet) {}

  try {
    const raw = PropertiesService.getScriptProperties().getProperty(PROP_KEY);
    if (raw) return JSON.parse(raw);
  } catch (eProp) {}
  return null;
}

function handleFetchBranchSheet(e) {
  const branch = (e && e.parameter && e.parameter.branch) ? String(e.parameter.branch).trim() : '';
  let sheetId = (e && e.parameter && e.parameter.sheetId) ? String(e.parameter.sheetId).trim() : '';
  let targetSs = null;

  if (sheetId) {
    try {
      targetSs = SpreadsheetApp.openById(sheetId);
    } catch (errOpen) {
      targetSs = null;
    }
  }

  // Jika ID gagal dibuka atau kosong (misal Cabang Kediri berganti file), cari otomatis di Google Drive!
  if (!targetSs && branch) {
    try {
      const q = "mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false and title contains '" + branch.replace(/'/g, "") + "'";
      const files = DriveApp.searchFiles(q);
      let bestFile = null;
      let bestRows = -1;
      while (files.hasNext()) {
        const f = files.next();
        try {
          const candSs = SpreadsheetApp.openById(f.getId());
          const lapSh = candSs.getSheetByName('Laporan_Harian') || candSs.getSheetByName('Laporan Harian') || candSs.getSheets()[0];
          const rCnt = lapSh ? lapSh.getLastRow() : 0;
          if (rCnt > bestRows) {
            bestRows = rCnt;
            bestFile = f;
            targetSs = candSs;
          }
        } catch (eCand) {}
      }
      if (bestFile) {
        sheetId = bestFile.getId();
      }
    } catch (eSearch) {}
  }

  if (!targetSs) {
    return { status: 'error', message: 'Spreadsheet cabang ' + branch + ' tidak ditemukan.' };
  }

  // Pastikan akses sharing diatur ke ANYONE_WITH_LINK agar browser HP/Laptop juga bisa tarik langsung
  try {
    DriveApp.getFileById(targetSs.getId()).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (eShare) {}

  const candidateNames = ['Laporan_Harian', 'Laporan Harian', branch, 'Laporan_Keuangan', 'Laporan', 'Kasir'];
  let chosenSheet = null;
  for (let i = 0; i < candidateNames.length; i++) {
    if (!candidateNames[i]) continue;
    const sh = targetSs.getSheetByName(candidateNames[i]);
    if (sh && sh.getLastRow() >= 2) {
      chosenSheet = sh;
      break;
    }
  }
  if (!chosenSheet) {
    const allSheets = targetSs.getSheets();
    for (let s = 0; s < allSheets.length; s++) {
      const nm = allSheets[s].getName().toLowerCase();
      if (!nm.includes('absen') && !nm.includes('store') && allSheets[s].getLastRow() >= 2) {
        chosenSheet = allSheets[s];
        break;
      }
    }
    if (!chosenSheet && allSheets.length > 0) chosenSheet = allSheets[0];
  }

  const data = chosenSheet ? chosenSheet.getDataRange().getDisplayValues() : [];
  const csvLines = data.map(function (row) {
    return row.map(function (cell) {
      return '"' + String(cell == null ? '' : cell).replace(/"/g, '""') + '"';
    }).join(',');
  });

  return {
    status: 'ok',
    branch: branch,
    sheetId: targetSs.getId(),
    resolvedUrl: 'https://docs.google.com/spreadsheets/d/' + targetSs.getId() + '/edit',
    csv: csvLines.join('\n')
  };
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? String(e.parameter.action) : 'get_admin_state';
  if (action === 'fetch_branch_sheet') {
    return respondJsonOrJsonp(e, handleFetchBranchSheet(e));
  }
  const st = loadUnlimitedCloudState();
  return respondJsonOrJsonp(e, {
    status: 'ok',
    adminState: st
  });
}

function doPost(e) {
  try {
    const body = (e && e.postData && e.postData.contents) ? JSON.parse(e.postData.contents) : {};
    if (body && body.action === 'save_admin_state') {
      const stateCopy = Object.assign({}, body);
      delete stateCopy.multiSheetTables;
      saveUnlimitedCloudState(stateCopy);

      let writtenSheets = [];
      if (Array.isArray(body.multiSheetTables) && body.multiSheetTables.length > 0) {
        writtenSheets = writeMultiSheetOutputsToSpreadsheet(body.multiSheetTables);
      }

      return respondJsonOrJsonp(e, {
        status: 'ok',
        writtenSheets: writtenSheets
      });
    }
    return respondJsonOrJsonp(e, { status: 'ignored' });
  } catch (err) {
    return respondJsonOrJsonp(e, { status: 'error', message: String(err) });
  }
}

function writeMultiSheetOutputsToSpreadsheet(tables) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) return [];
  const updatedNames = [];

  tables.forEach(function (tbl) {
    const rawName = String(tbl.sheetName || 'Output').replace(/[\\/?*\[\]:]/g, '_').trim().slice(0, 31);
    let sheet = ss.getSheetByName(rawName);
    if (!sheet) {
      sheet = ss.insertSheet(rawName);
    } else {
      sheet.clearContents();
    }

    const headers = Array.isArray(tbl.headers) ? tbl.headers : [];
    const rows = Array.isArray(tbl.rows) ? tbl.rows : [];
    const colCount = Math.max(1, headers.length);

    const titleText = tbl.title || rawName;
    sheet.getRange(1, 1).setValue(titleText);
    if (colCount > 1) {
      sheet.getRange(1, 1, 1, colCount).merge();
    }
    sheet.getRange(1, 1, 1, colCount)
      .setBackground('#ede9fe')
      .setFontColor('#4c1d95')
      .setFontWeight('bold')
      .setFontSize(11);

    if (headers.length > 0) {
      sheet.getRange(2, 1, 1, headers.length)
        .setValues([headers])
        .setBackground('#5b21b6')
        .setFontColor('#ffffff')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
      sheet.setFrozenRows(2);
    }

    if (rows.length > 0 && headers.length > 0) {
      const normalizedRows = rows.map(function (r) {
        const arr = [];
        for (let i = 0; i < headers.length; i++) {
          arr.push(r[i] !== undefined && r[i] !== null ? r[i] : '');
        }
        return arr;
      });
      sheet.getRange(3, 1, normalizedRows.length, headers.length).setValues(normalizedRows);

      if (Array.isArray(tbl.numericCols)) {
        tbl.numericCols.forEach(function (colIdx) {
          const colNum = Number(colIdx) + 1;
          if (colNum >= 1 && colNum <= headers.length) {
            sheet.getRange(3, colNum, normalizedRows.length, 1).setNumberFormat('#,##0');
          }
        });
      }
    }

    updatedNames.push(rawName);
  });

  return updatedNames;
}
