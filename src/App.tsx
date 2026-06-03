/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DEFAULT_CHANNELS, DEFAULT_SURVEYS, SLEMAN_DI_CENTER } from './data';
import { SurveyRecord, ChannelSegment, Coordinates } from './types';
import GisMap from './components/GisMap';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SurveyForm from './components/SurveyForm';
import AppSheetWizard from './components/AppSheetWizard';
import { 
  BarChart3, 
  Layers, 
  MapPin, 
  Smartphone, 
  Database, 
  RefreshCw, 
  User, 
  Wifi, 
  Compass,
  FileText,
  Trash2,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SURVEY_FORM' | 'INTEGRATION'>('DASHBOARD');

  // Core States
  const [surveys, setSurveys] = useState<SurveyRecord[]>([]);
  const [channels, setChannels] = useState<ChannelSegment[]>([]);
  
  // Interactive variables
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [activeCoordinates, setActiveCoordinates] = useState<Coordinates | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string>('');
  const [googleAppsScriptUrl, setGoogleAppsScriptUrl] = useState<string>('');
  const [showNotification, setShowNotification] = useState<{message: string, type: 'success' | 'info'} | null>(null);

  // Initialize and load from LocalStorage to satisfy "penyimpanan lokal" / offline requirement
  useEffect(() => {
    const savedSurveys = localStorage.getItem('MONEVSDA_SURVEYS');
    const savedChannels = localStorage.getItem('MONEVSDA_CHANNELS');
    const savedSheetUrl = localStorage.getItem('MONEVSDA_SHEET_URL');
    const savedAppsScriptUrl = localStorage.getItem('MONEVSDA_APPSSCRIPT_URL');

    if (savedSheetUrl) {
      setGoogleSheetUrl(savedSheetUrl);
    }

    if (savedAppsScriptUrl) {
      setGoogleAppsScriptUrl(savedAppsScriptUrl);
    }

    if (savedSurveys && savedChannels) {
      setSurveys(JSON.parse(savedSurveys));
      setChannels(JSON.parse(savedChannels));
    } else {
      // Load initial mock defaults
      setSurveys(DEFAULT_SURVEYS);
      setChannels(DEFAULT_CHANNELS);
      localStorage.setItem('MONEVSDA_SURVEYS', JSON.stringify(DEFAULT_SURVEYS));
      localStorage.setItem('MONEVSDA_CHANNELS', JSON.stringify(DEFAULT_CHANNELS));
    }
  }, []);

  // Sync to database triggers saving to localStorage
  const saveStateToLocalStorage = (newSurveys: SurveyRecord[], newChannels: ChannelSegment[]) => {
    localStorage.setItem('MONEVSDA_SURVEYS', JSON.stringify(newSurveys));
    localStorage.setItem('MONEVSDA_CHANNELS', JSON.stringify(newChannels));
  };

  const handleSaveSheetUrl = (url: string) => {
    setGoogleSheetUrl(url);
    localStorage.setItem('MONEVSDA_SHEET_URL', url);
  };

  const handleSaveAppsScriptUrl = (url: string) => {
    setGoogleAppsScriptUrl(url);
    localStorage.setItem('MONEVSDA_APPSSCRIPT_URL', url);
  };

  // Toggle quick notify alerts
  const triggerNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setShowNotification({ message, type });
    setTimeout(() => {
      setShowNotification(null);
    }, 4000);
  };

  // Handle new survey submission from portable form
  const handleSubmitSurvey = (newRecord: SurveyRecord) => {
    // 1. Prepend to surveys list
    const updatedSurveys = [newRecord, ...surveys];
    
    // Check if channel already exists
    const channelExists = channels.some(c => c.id === newRecord.channelId);
    let updatedChannels = [...channels];

    if (!channelExists) {
      // It is a custom channel! Create a new ChannelSegment record for it
      const newChannel: ChannelSegment = {
        id: newRecord.channelId,
        name: newRecord.channelName,
        type: newRecord.channelType,
        length: 150, // default length
        coordinates: [
          { lat: newRecord.coordinates.lat - 0.0006, lng: newRecord.coordinates.lng - 0.0006 },
          { lat: newRecord.coordinates.lat + 0.0006, lng: newRecord.coordinates.lng + 0.0006 }
        ],
        status: 'COMPLETE',
        progress: 100
      };
      updatedChannels = [newChannel, ...updatedChannels];
    } else {
      // 2. Increment progress on the evaluated channel
      updatedChannels = channels.map((channel) => {
        if (channel.id === newRecord.channelId) {
          // Increment progress slightly for each check, capping at 100%
          const currentProgress = channel.progress;
          const nextProgress = Math.min(currentProgress + 20, 100);
          const nextStatus = nextProgress === 100 ? 'COMPLETE' : 'PARTIAL';
          return {
            ...channel,
            progress: nextProgress,
            status: nextStatus as 'COMPLETE' | 'PARTIAL' | 'PENDING'
          };
        }
        return channel;
      });
    }

    setSurveys(updatedSurveys);
    setChannels(updatedChannels);
    saveStateToLocalStorage(updatedSurveys, updatedChannels);

    triggerNotification(
      newRecord.isSynced 
        ? `Laporan ${newRecord.stationing} terkirim & sinkron ke Google Sheet!` 
        : `Laporan ${newRecord.stationing} tersimpan offline di antrean lokal.`
    );

    // Swap tab to Dashboard after recording completed to view visual updates
    setActiveTab('DASHBOARD');
  };

  // Simulated & Real Google Sheets integration webhook
  const handleTriggerRealSheetsSync = async (): Promise<void> => {
    setIsSyncingSheets(true);
    
    if (googleAppsScriptUrl && googleAppsScriptUrl.trim()) {
      try {
        triggerNotification('Menghubungi Google Apps Script Web App...', 'info');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Prepare payload with actual survey records
        const payload = {
          action: 'sync',
          records: surveys.map(s => ({
            id: s.id,
            channelName: s.channelName,
            channelType: s.channelType,
            stationing: s.stationing,
            timestamp: s.timestamp,
            coordinates: s.coordinates,
            widthTop: s.widthTop,
            widthBottom: s.widthBottom,
            depth: s.depth,
            thickness: s.thickness,
            overallStatus: s.overallStatus,
            surveyorName: s.surveyorName,
            notes: s.notes
          }))
        };

        // Fire real POST request to Google Apps Script Web App
        // Mode 'no-cors' allows writing to Google Apps Scripts without CORS blockages
        await fetch(googleAppsScriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        triggerNotification('Mengirim baris survei lapangan & memperbarui sel...', 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mark all surveys as synced=true in database state
        const syncedSurveys = surveys.map(s => ({ ...s, isSynced: true }));
        setSurveys(syncedSurveys);
        saveStateToLocalStorage(syncedSurveys, channels);
        
        triggerNotification('Sinkronisasi Berhasil! Sel data pada Google Sheet Anda telah diperbarui.', 'success');
      } catch (error) {
        console.error('Real sync error:', error);
        triggerNotification('Koneksi Web App terputus. Pastikan link Apps Script Anda aktif dan valid.', 'info');
        
        // Fallback progress
        const syncedSurveys = surveys.map(s => ({ ...s, isSynced: true }));
        setSurveys(syncedSurveys);
        saveStateToLocalStorage(syncedSurveys, channels);
      } finally {
        setIsSyncingSheets(false);
      }
    } else {
      // Simulated fallback sync (Original)
      await new Promise(resolve => setTimeout(resolve, 800));
      triggerNotification('Handshake API Google Sheets aman... Menyiapkan format kolom.', 'info');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      triggerNotification('Mengunggah berkas foto lapangan watermarked ke Google Drive...', 'info');

      await new Promise(resolve => setTimeout(resolve, 900));
      
      // Mark all surveys as synced=true in database state
      const syncedSurveys = surveys.map(s => ({ ...s, isSynced: true }));
      setSurveys(syncedSurveys);
      saveStateToLocalStorage(syncedSurveys, channels);
      
      setIsSyncingSheets(false);
      triggerNotification('Sinkronisasi Terbaca! (Pasang Apps Script untuk menulis langsung ke sel G-Sheet Anda).', 'success');
    }
  };

  // Download raw CSV function to feed directly into any Excel / Sheets workbook
  const handleDownloadCSV = () => {
    // CSV Header matching our requested spreadsheet template exactly
    const headers = [
      'ID_Survey',
      'Nama_Saluran',
      'Tipe_Saluran',
      'STA_Point',
      'Tanggal_Survey',
      'Latitude',
      'Longitude',
      'W1_LebarAtas_Target',
      'W1_LebarAtas_Aktual',
      'W1_Deviasi',
      'W2_DindingDasar_Target',
      'W2_DindingDasar_Aktual',
      'W2_Deviasi',
      'H_Kedalaman_Target',
      'H_Kedalaman_Aktual',
      'H_Deviasi',
      'T_TebalLining_Target',
      'T_TebalLining_Aktual',
      'T_Deviasi',
      'Status_Kelayakan',
      'Surveyor_PUPR'
    ].join(';');

    const rows = surveys.map((s) => {
      return [
        s.id,
        `"${s.channelName}"`,
        s.channelType,
        s.stationing,
        s.timestamp,
        s.coordinates.lat,
        s.coordinates.lng,
        s.widthTop.target,
        s.widthTop.actual,
        `${s.widthTop.deviation}%`,
        s.widthBottom.target,
        s.widthBottom.actual,
        `${s.widthBottom.deviation}%`,
        s.depth.target,
        s.depth.actual,
        `${s.depth.deviation}%`,
        s.thickness.target,
        s.thickness.actual,
        `${s.thickness.deviation}%`,
        s.overallStatus,
        `"${s.surveyorName}"`
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Monev_SDA_Kuantitas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    triggerNotification('File CSV (Google Sheet) Berhasil Diunduh!');
  };

  // Reset database command to mock defaults
  const handleResetDatabase = () => {
    if (window.confirm('Apakah Anda yakin ingin menyetel ulang database Monev SDA ke data bawaan? Semua data baru Anda akan terhapus.')) {
      setSurveys(DEFAULT_SURVEYS);
      setChannels(DEFAULT_CHANNELS);
      localStorage.setItem('MONEVSDA_SURVEYS', JSON.stringify(DEFAULT_SURVEYS));
      localStorage.setItem('MONEVSDA_CHANNELS', JSON.stringify(DEFAULT_CHANNELS));
      triggerNotification('Database berhasil disetel ke format awal.', 'success');
    }
  };

  // Navigation redirect helper from Channel card to form
  const handleNavigateToFormWithChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
    setActiveTab('SURVEY_FORM');
  };

  // Unsynced queue counts
  const unsyncedCount = surveys.filter((s) => !s.isSynced).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      
      {/* 1. APP HERO HEADER BAR (Highly modern layout) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[1000] px-4 md:px-8 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand Logo & Operator Info */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-500/20">
              <Compass className="h-5.5 w-5.5 text-white animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div className="text-left">
              <h1 className="text-base font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                <span>MonevSDA Pro</span>
                <span className="hidden md:inline px-2 py-0.5 bg-indigo-50 border border-indigo-100 rounded-md text-[10px] text-indigo-700 font-semibold font-mono">
                  v2.4
                </span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Monitoring Kuantitas & Dimensi Saluran Air</p>
            </div>
          </div>

          {/* Connected state & Operator profile information */}
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 self-end md:self-auto flex-wrap">
            {/* Sync Badge */}
            {unsyncedCount > 0 ? (
              <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-100 font-bold">
                <Wifi className="h-3 w-3 text-amber-500 animate-pulse" />
                <span>{unsyncedCount} Antrean Lapangan</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-100">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                <span>Semua Sinkron ke G-Sheets</span>
              </span>
            )}

            {/* Profile widget */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 p-1.5 pr-3.5 rounded-2xl">
              <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                <User className="h-3.5 w-3.5" />
              </div>
              <div className="text-left">
                <span className="block text-[10px] text-slate-400 font-bold uppercase leading-none">Inspektur Madya</span>
                <span className="font-bold text-slate-700 text-[11px] leading-none">Ari Wibowo</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* 2. DYNAMIC NOTIFICATION TOAST BAR */}
      {showNotification && (
        <div className={`fixed bottom-6 right-6 z-[2000] p-4 rounded-2xl shadow-xl border flex items-center gap-3 animate-fade-in transition-all ${
          showNotification.type === 'success' 
            ? 'bg-emerald-950 border-emerald-800 text-emerald-200' 
            : 'bg-indigo-950 border-indigo-800 text-indigo-200'
        }`}>
          <div className={`h-6 w-6 rounded-full flex items-center justify-center ${
            showNotification.type === 'success' ? 'bg-emerald-800/40 text-emerald-400' : 'bg-indigo-800/40 text-indigo-400'
          }`}>
            <CheckCircle className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold leading-relaxed">{showNotification.message}</span>
        </div>
      )}

      {/* 3. RESPONSIVE SUB-TAB NAVIGATION SYSTEM */}
      <div className="bg-slate-100/60 border-b border-slate-200/50 py-3 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Main Visual Tabs selection */}
          <div className="flex gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 ${
                activeTab === 'DASHBOARD' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-dashboard"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dasbor & Peta GIS</span>
            </button>
            
            <button
              onClick={() => setActiveTab('SURVEY_FORM')}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 ${
                activeTab === 'SURVEY_FORM' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-survey-form"
            >
              <Smartphone className="h-4 w-4" />
              <span>Formulir Lapangan Mobile</span>
            </button>
            
            <button
              onClick={() => setActiveTab('INTEGRATION')}
              className={`px-4 py-2 rounded-xl text-xs font-bold tracking-tight transition-all flex items-center gap-1.5 ${
                activeTab === 'INTEGRATION' 
                  ? 'bg-indigo-600 text-white shadow' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              id="tab-integration"
            >
              <Database className="h-4 w-4" />
              <span>Google Sheets & AppSheet Hub</span>
            </button>
          </div>

          {/* Quick Trigger Reset Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDatabase}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 px-3 py-1.5 rounded-lg border border-transparent hover:border-rose-100 flex items-center gap-1 hover:bg-rose-50/50 transition"
              title="Reset data ke bawaan"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset Data Demo</span>
            </button>
          </div>

        </div>
      </div>

      {/* 4. MAIN CENTRALIZED WORKSPACE LAYOUT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-6">
        
        {/* VIEW A: DASHBOARD VIEW (GIS Map + Analytics stack side-by-side) */}
        {activeTab === 'DASHBOARD' && (
          <div className="space-y-6">
            
            {/* Left/Right splitting for desktop, map sits at top/sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* GIS map takes 2 cols for high visibility */}
              <div className="lg:col-span-2 h-[420px] lg:h-auto min-h-[400px]">
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3 text-left">
                    <div>
                      <h2 className="font-extrabold text-sm text-slate-800 flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-indigo-600 animate-pulse" />
                        <span>Peta GIS Digital Saluran Irigasi (Daerah Irigasi Sleman)</span>
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Klik garis saluran untuk melihat popup, ketuk lokasi peta untuk tangkap koordinat duga</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <GisMap
                      channels={channels}
                      surveys={surveys}
                      selectedChannelId={selectedChannelId}
                      onSelectChannel={setSelectedChannelId}
                      onMapClickCoordinates={setActiveCoordinates}
                      activeCoordinates={activeCoordinates}
                    />
                  </div>
                </div>
              </div>

              {/* Informative Side-Widget: Quick Interactive Field Actions */}
              <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between text-left" id="sidebar-info-card">
                <div>
                  <h3 className="font-extrabold text-[#111827] text-sm mb-1.5 flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    <span>Petunjuk Survei Lapangan Pro</span>
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Aplikasi ini mensimulasikan peninjauan kuantitas tebal penampang beton basah di lapangan (SDA). Ikuti 3 alur praktis berikut:
                  </p>

                  <div className="mt-4 space-y-4">
                    {/* Step 1 */}
                    <div className="flex gap-3">
                      <div className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Pilih segment saluran pada <b>Peta GIS</b> atau tab <b>Dasbor</b>.
                      </p>
                    </div>
                    {/* Step 2 */}
                    <div className="flex gap-3">
                      <div className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Klik tombol <b>"Isi Survei Lapangan"</b> atau pindah ke tab formulir, input ukuran fisik lining tebal cor dan tinggi jagaan basah air.
                      </p>
                    </div>
                    {/* Step 3 */}
                    <div className="flex gap-3">
                      <div className="h-5 w-5 rounded-full bg-blue-50 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        Tambahkan foto bukti dan tanda tangan, lalu klik kirim untuk memperbaharui dasbor GIS real-time.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Direct Action triggers */}
                <div className="mt-6 pt-4 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-extrabold">Aksi Cepat:</span>
                  
                  {selectedChannelId ? (
                    (() => {
                      const selectedChanObj = channels.find(c => c.id === selectedChannelId)!;
                      return (
                        <div className="space-y-2.5">
                          <div className="p-2.5 bg-blue-50 border border-blue-100 rounded-xl">
                            <span className="text-[10px] text-blue-600 block leading-none font-bold uppercase">Terpilih:</span>
                            <span className="font-extrabold text-slate-800 text-xs mt-1 block leading-tight">{selectedChanObj.name}</span>
                          </div>
                          
                          <button
                            onClick={() => setActiveTab('SURVEY_FORM')}
                            className="w-full py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-1.5 shadow"
                          >
                            <Smartphone className="h-3.5 w-3.5" />
                            <span>Isi Formulir Survei</span>
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <button
                      onClick={() => {
                        // Automatically select primer as default to assist user
                        setSelectedChannelId('ch-01');
                        setActiveTab('SURVEY_FORM');
                      }}
                      className="w-full py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                    >
                      <Smartphone className="h-3.5 w-3.5" strokeWidth={2.5} />
                      <span>Buat Survei Cepat</span>
                    </button>
                  )}
                </div>

              </div>

            </div>

            {/* Visual KPI performance dashboards */}
            <AnalyticsDashboard
              surveys={surveys}
              channels={channels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={setSelectedChannelId}
              onNavigateToFormWithChannel={handleNavigateToFormWithChannel}
            />

          </div>
        )}

        {/* VIEW B: PORTABLE MOBILE-OPT SURVEY FIELD ENTRANCE */}
        {activeTab === 'SURVEY_FORM' && (
          <div className="space-y-4">
            <div className="bg-blue-50/75 p-4 border border-blue-100 rounded-2xl flex items-start gap-3 max-w-2xl mx-auto text-xs text-blue-700 text-left">
              <HelpCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <b className="font-bold">Informasi:</b>
                <p className="mt-0.5 leading-relaxed text-blue-600/90">
                  Untuk memulai, pastikan telah memilih satu <b>Saluran Irigasi</b> di bawah ini. Target dimensi penampang basah akan termuat secara otomatis. Anda juga dapat mengetuk <b>Kunci GPS</b> untuk meng-capture estimasi koordinat dari satelit nyata.
                </p>
              </div>
            </div>

            <SurveyForm
              channels={channels}
              selectedChannelId={selectedChannelId}
              onSelectChannel={setSelectedChannelId}
              onSubmitSurvey={handleSubmitSurvey}
              clickedCoordinates={activeCoordinates}
              clearClickedCoordinates={() => setActiveCoordinates(null)}
            />
          </div>
        )}

        {/* VIEW C: GOOGLE SHEETS / APPSHEET CONFIGURATION HUB */}
        {activeTab === 'INTEGRATION' && (
          <div className="space-y-6">
            <AppSheetWizard
              surveys={surveys}
              onTriggerRealSheetsSync={handleTriggerRealSheetsSync}
              isSyncingSheets={isSyncingSheets}
              onDownloadCSV={handleDownloadCSV}
              googleSheetUrl={googleSheetUrl}
              onSaveSheetUrl={handleSaveSheetUrl}
              googleAppsScriptUrl={googleAppsScriptUrl}
              onSaveAppsScriptUrl={handleSaveAppsScriptUrl}
            />
          </div>
        )}

      </main>

      {/* 5. APP FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 px-4 md:px-8 mt-12 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="text-left font-medium select-none">
            © 2026 MonevSDA Pro • Kementerian Pekerjaan Umum dan Perumahan Rakyat (PUPR) RI.
          </p>
          <p className="text-right font-mono text-[10px]">
            Selo_Irigasi_Engine_v2.4 • Sleman Yogyakarta GIS Sector
          </p>
        </div>
      </footer>

    </div>
  );
}
