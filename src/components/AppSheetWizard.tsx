/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SurveyRecord } from '../types';
import { 
  Database, 
  FileSpreadsheet, 
  ArrowRight, 
  Settings, 
  Copy, 
  Check, 
  Wrench, 
  Layers, 
  Download,
  AlertCircle
} from 'lucide-react';

interface AppSheetWizardProps {
  surveys: SurveyRecord[];
  onTriggerRealSheetsSync: () => Promise<void>;
  isSyncingSheets: boolean;
  onDownloadCSV: () => void;
  googleSheetUrl: string;
  onSaveSheetUrl: (url: string) => void;
  googleAppsScriptUrl: string;
  onSaveAppsScriptUrl: (url: string) => void;
}

export default function AppSheetWizard({
  surveys,
  onTriggerRealSheetsSync,
  isSyncingSheets,
  onDownloadCSV,
  googleSheetUrl,
  onSaveSheetUrl,
  googleAppsScriptUrl,
  onSaveAppsScriptUrl
}: AppSheetWizardProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'SHEETS' | 'APPSHEET' | 'APPSSCRIPT'>('SHEETS');
  const [inputUrl, setInputUrl] = useState(googleSheetUrl);
  const [inputScriptUrl, setInputScriptUrl] = useState(googleAppsScriptUrl);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveScriptSuccess, setSaveScriptSuccess] = useState(false);

  // Extract Google Sheets ID if possible
  const getSpreadsheetId = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const currentSheetId = getSpreadsheetId(googleSheetUrl);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSheetUrl(inputUrl);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveScriptUrl = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAppsScriptUrl(inputScriptUrl);
    setSaveScriptSuccess(true);
    setTimeout(() => setSaveScriptSuccess(false), 3000);
  };

  const appScriptCode = `/**
 * Google Apps Script: Sinkronisasi Sel Otomatis & Media untuk Monev SDA Pro
 * Pasang script ini di: Ekstensi > Apps Script dalam Spreadsheet Google Anda.
 * Kemudian pilih "Terapkan (Deploy)" > "Penerapan Baru (New Deployment)" > jenis "Web App"
 * Jalankan Sebagai: Saya (Me) | Siapa yang memiliki akses: Siapa saja (Anyone)
 */

// 1. ENDPOINT PEMBANTU (Mencegah CORS & Mempermudah Tes Konektivitas dari Browser)
function doGet(e) {
  var response = {
    "status": "online",
    "message": "Google Apps Script Web App untuk Monev SDA Pro terhubung aktif!",
    "timestamp": new Date().toISOString(),
    "instructions": "Salin URL Web App ini dan tempel di form konfigurasi aplikasi Monev SDA Anda di kolom Web App Webhook."
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// 2. ENDPOINT PENERIMA DATA (Update / Tulis Sel Google Sheet secara Real-time)
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    
    // Pilih lembar kerja 'Monev_SDA_Kuantitas' atau buat otomatis jika belum ada
    var spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadSheet.getSheetByName("Monev_SDA_Kuantitas");
    if (!sheet) {
      sheet = spreadSheet.insertSheet("Monev_SDA_Kuantitas");
      // Menulis baris Header awal
      sheet.appendRow([
        'ID_Survey', 'Nama_Saluran', 'Tipe_Saluran', 'STA_Point', 'Tanggal_Survey', 
        'Latitude', 'Longitude', 'W1_LebarAtas_Target', 'W1_LebarAtas_Aktual', 'W1_Deviasi',
        'W2_DindingDasar_Target', 'W2_DindingDasar_Aktual', 'W2_Deviasi', 'H_Kedalaman_Target',
        'H_Kedalaman_Aktual', 'H_Deviasi', 'T_TebalLining_Target', 'T_TebalLining_Aktual', 'T_Deviasi',
        'Status_Kelayakan', 'Surveyor_PUPR', 'Catatan_Notes'
      ]);
      // Berikan style tebal pada header
      sheet.getRange(1, 1, 1, 22).setFontWeight("bold").setBackground("#e2e8f0");
    }
    
    if (payload.action === 'sync' && payload.records) {
      // Dapatkan semua ID survei yang sudah ada untuk menghindari duplikasi
      var lastRow = sheet.getLastRow();
      var existingIds = {};
      if (lastRow > 1) {
        var idValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < idValues.length; i++) {
          existingIds[idValues[i][0]] = i + 2; 
        }
      }
      
      // Proses penulisan baris per baris
      payload.records.forEach(function(s) {
        var w1Dev = Math.round(((s.widthTop.actual - s.widthTop.target) / s.widthTop.target) * 100);
        var w2Dev = Math.round(((s.widthBottom.actual - s.widthBottom.target) / s.widthBottom.target) * 100);
        var hDev = Math.round(((s.depth.actual - s.depth.target) / s.depth.target) * 100);
        var tDev = Math.round(((s.thickness.actual - s.thickness.target) / s.thickness.target) * 100);
        
        var rowData = [
          s.id,
          s.channelName,
          s.channelType,
          s.stationing,
          s.timestamp,
          s.coordinates.lat,
          s.coordinates.lng,
          s.widthTop.target,
          s.widthTop.actual,
          w1Dev + "%",
          s.widthBottom.target,
          s.widthBottom.actual,
          w2Dev + "%",
          s.depth.target,
          s.depth.actual,
          hDev + "%",
          s.thickness.target,
          s.thickness.actual,
          tDev + "%",
          s.overallStatus,
          s.surveyorName,
          s.notes || ""
        ];
        
        if (existingIds[s.id]) {
          // Update baris yang sudah ada
          var rowNum = existingIds[s.id];
          sheet.getRange(rowNum, 1, 1, 22).setValues([rowData]);
        } else {
          // Sisipkan baris baru di bawah
          sheet.appendRow(rowData);
        }
      });
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", count: payload.records.length }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: "ignored_action" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. MODUL ASISTEN WATERMARK AUTO-CAPTURE MEDIA DRIVE (Pemicu AppSheet)
function onEditSurveyMedia(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Monev_SDA_Kuantitas");
  if (!sheet) return;
  
  var activeCell = sheet.getActiveCell();
  var row = activeCell.getRow();
  var col = activeCell.getColumn();
  
  // Jika kolom foto diperbarui oleh AppSheet
  if (col === 10 && row > 1) {
    var photoFileName = activeCell.getValue();
    if (photoFileName && !photoFileName.toString().startsWith("http")) {
      var files = DriveApp.getFilesByName(photoFileName);
      if (files.hasNext()) {
        var file = files.next();
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        var urlValue = "https://drive.google.com/uc?export=view&id=" + file.getId();
        sheet.getRange(row, 11).setValue(urlValue);
      }
    }
  }
}`;

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden text-left" id="integration-hub-panel">
      {/* Visual Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="max-w-xl text-left">
          <div className="flex items-center gap-1 text-[11px] font-mono tracking-wider text-blue-200 uppercase">
            <Settings className="h-3 w-3 animate-spin" />
            <span>Pemberdayaan Integrasi Eksternal</span>
          </div>
          <h2 className="text-xl font-bold mt-1">Integrasi Google Sheets & AppSheet</h2>
          <p className="text-blue-100/90 text-xs mt-1">
            Metode sinkronisasi Monev SDA untuk pengisian data real-time berbasis mobile. Buat aplikasi lapangan AppSheet Anda sendiri dalam 5 menit, atau ekspor langsung data audit saat ini.
          </p>
        </div>

        {/* Real sheets export controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onDownloadCSV}
            className="px-4 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            id="btn-download-csv"
            type="button"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh CSV (Sheets)</span>
          </button>
          
          <button
            onClick={onTriggerRealSheetsSync}
            disabled={isSyncingSheets}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-900 font-extrabold text-xs shadow-md rounded-xl transition flex items-center gap-1.5"
            id="btn-sync-google-sheets"
            type="button"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-900" />
            <span>{isSyncingSheets ? 'Menskronkan...' : 'Sinkronkan Sekarang'}</span>
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Google Sheets Live Link Settings */}
        <div className="mb-6 p-5 bg-indigo-50/50 border border-indigo-100 rounded-3xl" id="custom-sheet-config-block">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Left: Google Sheets Link */}
            <div className="space-y-3.5 border-b lg:border-b-0 lg:border-r border-slate-200 pb-5 lg:pb-0 lg:pr-6">
              <div className="flex items-center justify-between gap-2 text-left">
                <div>
                  <h3 className="text-xs font-extrabold text-[#1f2937] flex items-center gap-1.5">
                    <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                    <span>01. Tautan Lembar Kerja (Sheets Link)</span>
                  </h3>
                  <p className="text-slate-500 text-[10px] mt-0.5">
                    Tautkan Spreadsheet Google Anda agar mudah dibuka dari aplikasi.
                  </p>
                </div>
                
                {googleSheetUrl ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full text-[10px] font-bold shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Tersimpan</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-800 rounded-full text-[10px] font-semibold shrink-0">
                    <span>Kosong</span>
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveUrl} className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="https://docs.google.com/spreadsheets/d/your-id/edit"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                />
                <button
                  type="submit"
                  className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition whitespace-nowrap"
                >
                  Simpan
                </button>
                {googleSheetUrl && (
                  <a
                    href={googleSheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 flex items-center justify-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-sm transition"
                    title="Buka Google Sheet di Tab Baru"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </form>

              {saveSuccess && (
                <p className="text-[10px] text-emerald-600 font-bold animate-fade-in text-left">
                  ✓ Link Google Sheets tersimpan!
                </p>
              )}

              {googleSheetUrl && currentSheetId && (
                <div className="p-2 bg-white border border-slate-100 rounded-xl text-left">
                  <span className="text-[9px] text-slate-400 font-semibold block leading-none uppercase">ID Spreadsheet:</span>
                  <span className="font-mono text-[10px] text-slate-600 mt-1 block select-all break-all">{currentSheetId}</span>
                </div>
              )}
            </div>

            {/* Right: Direct Cell Sync Web App URL */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-1.5 text-left">
                <div>
                  <h3 className="text-xs font-extrabold text-[#1f2937] flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-emerald-600" />
                    <span>02. Web App Webhook (Untuk Update Sel Langsung)</span>
                  </h3>
                  <p className="text-slate-500 text-[10px] mt-0.5">
                    Masukkan URL Apps Script Web App Anda untuk menulis baris data langsung ke kolom Spreadsheet.
                  </p>
                </div>
                
                {googleAppsScriptUrl ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-full text-[10px] font-bold shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Aktif</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 rounded-full text-[10px] font-semibold shrink-0">
                    <span>Belum Aktif</span>
                  </span>
                )}
              </div>

              <form onSubmit={handleSaveScriptUrl} className="flex gap-2">
                <input
                  type="url"
                  required
                  placeholder="https://script.google.com/macros/s/your-id/exec"
                  value={inputScriptUrl}
                  onChange={(e) => setInputScriptUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
                />
                <button
                  type="submit"
                  className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition whitespace-nowrap"
                >
                  Simpan Webhook
                </button>
              </form>

              {saveScriptSuccess && (
                <p className="text-[10px] text-emerald-600 font-bold animate-fade-in text-left">
                  ✓ Webhook Apps Script berhasil tersimpan di sistem lokal!
                </p>
              )}

              {!googleAppsScriptUrl ? (
                <p className="text-[10px] text-slate-500 bg-slate-100/50 p-2 rounded-xl text-left leading-relaxed">
                  💡 <b>PENTING:</b> Secara default, aplikasi web client-side ini mensimulasikan sinkronisasi untuk demo. Agar baris data di Google Sheet <b>benar-benar terupdate/tertulis nyata secara instan saat tombol diklik</b>, ikuti panduan di bagian tab <u><b>Skrip Sync Media (Apps Script)</b></u> di bawah untuk mendapatkan tautan Web App Webhook Anda dalam 1 menit!
                </p>
              ) : (
                <p className="text-[10px] text-emerald-700 bg-emerald-50/50 border border-emerald-100 p-2 rounded-xl text-left">
                  ✓ Hub Aktif! Klik tombol <b>"Sinkronkan Sekarang"</b> di kanan atas banner untuk mengirimkan seluruh baris data survei Anda langsung ke sel Spreadsheet terhubung.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Step Info cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6" id="integration-step-cards">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 block mt-0.5">
              <span className="font-bold text-xs">01</span>
            </div>
            <div className="text-left select-text">
              <h4 className="text-xs font-bold text-slate-800">Buat Spreadsheet</h4>
              <p className="text-slate-500 text-[11px] mt-0.5">Buat Google Sheet baru dengan schema baris kolom yang sesuai dengan format tabel ekspor.</p>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 block mt-0.5">
              <span className="font-bold text-xs">02</span>
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-slate-800">Hubungkan Ke AppSheet</h4>
              <p className="text-slate-500 text-[11px] mt-0.5">Masuk ke appsheet.com, pilih "Create new app" dari spreadsheet di atas. Autogenerate layout lapangan.</p>
            </div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 block mt-0.5">
              <span className="font-bold text-xs">03</span>
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-slate-800">Sinkronisasi Peta</h4>
              <p className="text-slate-500 text-[11px] mt-0.5">Tautkan kolom koordinat AppSheet (LatLong) ke Peta GIS ini atau gunakan langsung GIS bawan AppSheet.</p>
            </div>
          </div>
        </div>

        {/* Interactive Tabbed documentation */}
        <div className="flex border-b border-slate-100 mb-4 bg-slate-50 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('SHEETS')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'SHEETS' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Struktur Header Google Sheet</span>
          </button>
          
          <button
            onClick={() => setActiveTab('APPSHEET')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'APPSHEET' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Skema Kolom AppSheet</span>
          </button>

          <button
            onClick={() => setActiveTab('APPSSCRIPT')}
            className={`flex-1 py-1 px-2 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'APPSSCRIPT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>Skrip Sync Media (Apps Script)</span>
          </button>
        </div>

        {/* Tab 1: Sheets Structure */}
        {activeTab === 'SHEETS' && (
          <div className="space-y-4" id="tab-sheets-content">
            <div className="bg-blue-50/50 p-4 border border-blue-100/50 rounded-2xl flex items-start gap-2.5 text-xs text-blue-700 text-left">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <b className="font-bold">Rekomendasi Struktur Kolom Google Sheets:</b>
                <p className="mt-0.5 text-blue-600/90 leading-relaxed">
                  Agar data survei lapangan konstruksi sinkron dengan formula penilai jaminan mutu (QA), buatlah header kolom Google Sheet Anda persis seperti urutan di bawah ini:
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-xs text-slate-600 text-left">
                <thead className="bg-slate-50 font-bold block-level">
                  <tr>
                    <th className="p-3">Nama Kolom (Header)</th>
                    <th className="p-3">Format Sheet</th>
                    <th className="p-3">Keterangan Teknis Bidang SDA</th>
                    <th className="p-3">Contoh Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">ID_Survey</td>
                    <td className="p-3 text-slate-500 font-mono">Teks / UUID</td>
                    <td className="p-3">Kunci Unik Baris Laporan</td>
                    <td className="p-3 font-mono">srv-101</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">Nama_Saluran</td>
                    <td className="p-3 text-slate-500 font-mono">Pilihan Tekstual</td>
                    <td className="p-3">Nama primer/sekunder saluran air</td>
                    <td className="p-3">Saluran Sekunder Moyudan</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">STA_Point</td>
                    <td className="p-3 text-slate-500 font-mono">Teks Pendek</td>
                    <td className="p-3">Stationing peninjauan di lapangan</td>
                    <td className="p-3 font-mono">STA 0+150</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">Koordinat_GPS</td>
                    <td className="p-3 text-slate-500 font-mono">LatLong</td>
                    <td className="p-3">Garis Lintang, Garis Bujur (Satelit)</td>
                    <td className="p-3 font-mono">-7.7352, 110.3552</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">W1_Target_m</td>
                    <td className="p-3 text-slate-500 font-mono">Angka Desimal</td>
                    <td className="p-3">Rencana lebar atas basah (m)</td>
                    <td className="p-3 font-mono">2.00</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">W1_Aktual_m</td>
                    <td className="p-3 text-slate-500 font-mono">Angka Desimal</td>
                    <td className="p-3">Pengukuran lebar atas nyata (m)</td>
                    <td className="p-3 font-mono">1.95</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">Tebal_Target_m</td>
                    <td className="p-3 text-slate-500 font-mono">Angka Desimal</td>
                    <td className="p-3">Rencana tebal lining beton (m)</td>
                    <td className="p-3 font-mono">0.25</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">Tebal_Aktual_m</td>
                    <td className="p-3 text-slate-500 font-mono">Angka Desimal</td>
                    <td className="p-3">Deteksi tebal cor lining aktual (m)</td>
                    <td className="p-3 font-mono">0.22</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">H_Target_Hanyut_m</td>
                    <td className="p-3 text-slate-500 font-mono">Angka Desimal</td>
                    <td className="p-3">Rencana tinggi jagaan basah (m)</td>
                    <td className="p-3 font-mono">1.20</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">H_Aktual_Hanyut_m</td>
                    <td className="p-3 text-slate-500 font-mono">Angka Desimal</td>
                    <td className="p-3">Fisik tinggi basah aktual lapangan (m)</td>
                    <td className="p-3 font-mono">1.10</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-mono font-bold text-slate-800">Catatan_Kerusakan</td>
                    <td className="p-3 text-slate-500 font-mono">Paragraph</td>
                    <td className="p-3">Kelayakan visual, catatan tambahan</td>
                    <td className="p-3">Beton keropos di bagian pinggir kaki waduk.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: AppSheet Config Columns */}
        {activeTab === 'APPSHEET' && (
          <div className="space-y-4 font-sans text-left" id="tab-appsheet-content">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Konfigurasi Kolom Pada AppSheet App Editor:</h3>
            <p className="text-slate-500 text-xs mt-1">
              Setelah memuat spreadsheet di AppSheet Workspace Editor, sesuaikan setelan kolom data (Data &gt; Columns) dengan aturan validasi otomatis berikut:
            </p>

            <div className="space-y-3 mt-4">
              {/* Point 1 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex gap-2">
                <ArrowRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-800 block">Koordinat_GPS: Type = LatLong</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Aktifkan rumus auto-capture di AppSheet: masukkan <code className="font-mono bg-white border border-slate-200 px-1 py-0.5 text-indigo-600 rounded">HERE()</code> di kolom <b>Initial Value</b> agar gadget menangkap sinyal GPS ponsel pengawas secara instan saat form pertama dibuka.
                  </p>
                </div>
              </div>

              {/* Point 2 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex gap-2">
                <ArrowRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-800 block">Evaluasi Status Real-time (Virtual Column)</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Tambahkan Virtual Column bernama <b>[Status_Kesesuaian]</b> di AppSheet dengan formula evaluasi deviasi:
                    <br />
                    <code className="font-mono bg-white border border-slate-200 px-1 py-1 block mt-1.5 overflow-x-auto text-[10px] text-blue-600">
                      IFS((([W1_Aktual_m] - [W1_Target_m]) / [W1_Target_m]) &lt; -0.05, "CRITICAL_DEVIATION", TRUE, "SESUAI_SPESIFIKASI")
                    </code>
                  </p>
                </div>
              </div>

              {/* Point 3 */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex gap-2">
                <ArrowRight className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700">
                  <span className="font-bold text-slate-800 block">Validasi Batas Layak Angka Masukan (Valid If)</span>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Untuk mencegah kecurangan surveyor, tambahkan validasi pada kolom tebal beton di section <b>Valid If</b>:
                    <br />
                    <code className="font-mono bg-white border border-slate-200 px-1 py-0.5 text-indigo-600 rounded">[Tebal_Aktual_m] &gt; 0</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Apps Script for automated photo syncing */}
        {activeTab === 'APPSSCRIPT' && (
          <div className="space-y-4" id="tab-appsscript-content">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 block">Kode Google Apps Script Pengolah Media</span>
              <button
                type="button"
                onClick={handleCopyScript}
                className="px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 font-bold text-[11px] rounded-lg hover:bg-slate-100 active:scale-95 transition flex items-center gap-1"
                id="btn-copy-script"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-600">Terpilih & Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Salin Kode</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-900 border border-slate-800 text-slate-100 p-4 rounded-xl text-[10px] leading-relaxed overflow-x-auto font-mono text-left max-h-[220px]">
              <code>{appScriptCode}</code>
            </pre>
            <span className="text-[10px] text-slate-400 block tracking-wide italic leading-relaxed text-center">
              * Skrip ini memodifikasi output penampung gambar AppSheet yang disimpan di Drive agar memiliki akses "Anyone with link" secara otomatis untuk dibaca oleh aplikasi Web GIS Anda tanpa login Google Workspace tambahan.
            </span>
          </div>
        )}
      </div>

      {/* Sync State Indicator Log modal overlay (if isSyncingSheets is true) */}
      {isSyncingSheets && (
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center gap-4 text-xs font-mono" id="sheets-sync-status-indicator">
          <div className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-emerald-600 animate-spin shrink-0"></div>
          <div className="text-left flex-1">
            <span className="font-bold text-slate-800 block">Proses Sinkronisasi Spreadsheet SInar-SDA...</span>
            <div className="flex gap-4 text-[10px] text-slate-500 mt-0.5">
              <span>Baris diolah: {surveys.length}</span>
              <span>• Status API: G-Sheets Webhook Handshake...</span>
            </div>
          </div>
          <span className="text-emerald-600 font-bold text-[11px] uppercase tracking-wider animate-pulse">Running</span>
        </div>
      )}
    </div>
  );
}
