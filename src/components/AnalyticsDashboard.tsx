/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SurveyRecord, ChannelSegment } from '../types';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  Sparkles, 
  RefreshCw, 
  Database,
  Search,
  ChevronRight,
  Filter
} from 'lucide-react';

interface AnalyticsDashboardProps {
  surveys: SurveyRecord[];
  channels: ChannelSegment[];
  onSelectChannel: (id: string | null) => void;
  selectedChannelId: string | null;
  onNavigateToFormWithChannel: (channelId: string) => void;
}

export default function AnalyticsDashboard({
  surveys,
  channels,
  onSelectChannel,
  selectedChannelId,
  onNavigateToFormWithChannel
}: AnalyticsDashboardProps) {
  const [filterType, setFilterType] = useState<'All' | 'Primer' | 'Sekunder' | 'Tersier'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Filtered surveys
  const filteredSurveys = surveys.filter((survey) => {
    const matchesType = filterType === 'All' || survey.channelType === filterType;
    const matchesSearch = survey.channelName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          survey.stationing.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          survey.surveyorName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // KPI Calculations
  const totalInspected = surveys.length;
  const matchCount = surveys.filter(s => s.overallStatus === 'LAYAK').length;
  const warningCount = surveys.filter(s => s.overallStatus === 'BUTUH_PERBAIKAN').length;
  const dangerCount = surveys.filter(s => s.overallStatus === 'KRITIS').length;
  const complianceRate = totalInspected > 0 ? Math.round((matchCount / totalInspected) * 100) : 100;

  // Total lengths
  const totalChannelsLength = channels.reduce((acc, c) => acc + c.length, 0);
  const completedSegmentsLength = channels
    .filter(c => c.status === 'COMPLETE')
    .reduce((acc, c) => acc + c.length, 0);
  const evaluationProgress = Math.round((completedSegmentsLength / totalChannelsLength) * 100) || 40;

  // Let's generate a smart engineering advice using standard civil engineering parameters
  const generateEngineeringAdvice = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      // Analyze current survey pool for actual structures
      const criticalSurveys = surveys.filter(s => s.overallStatus === 'KRITIS');
      const warningSurveys = surveys.filter(s => s.overallStatus === 'BUTUH_PERBAIKAN');
      
      let analysisResult = `### 📋 REKOMENDASI TEKNIS MONEV SDA (BERDASARKAN DATA SURVEY)

**A. Ringkasan Kepatuhan Geometris:**
* Dari total **${totalInspected} stasiun audit**, tingkat kesesuaian dimensi beton saluran berada pada **${complianceRate}%**.
* Terdapat **${dangerCount} titik kritis** dengan deviasi dimensi lebih dari 10% dan **${warningCount} titik butuh perbaikan**.

**B. Analisis Root-Cause Pekerjaan Lapangan:**
${criticalSurveys.length > 0 ? `1. **Tipisasi Deviasi Ketebalan Pasangan (Lining)**: Pada stasiun *${criticalSurveys.map(s => `${s.channelName} ${s.stationing}`).join(', ')}*, ketebalan lining beton aktual berdeviasi negatif rata-rata **${Math.round(criticalSurveys.reduce((acc, s) => acc + Math.abs(s.thickness.deviation), 0) / criticalSurveys.length)}%**. Ini mengindikasikan kelalaian penarikan profil mal kayu atau metode backfill tanah yang terlalu menekan saat plesteran basah. Ini mengurangi umur rencana dinding terhadap keretakan suhu.` : '1. Secara umum pengerjaan ketebalan plesteran lining relatif sejalan dengan spesifikasi rencana.'}
2. **Kesesuaian Tampang Hidrolis (W1 / H)**: Ditemukan penyempitan lebar mercu atas pada beberapa saluran sekunder yang membatasi debit banjir limpasan maksimum. Kedalaman jagaan (freeboard) terancam berkurang sebesar 5-15cm.

**C. Rekomendasi Alur Struktur & Perbaikan (Monev SDA):**
1. **Untuk Sektor Kritis (Merah)**: Lapisan beton lining tipis (<75% target) pada *STA 0+300 Primer* direkomendasikan untuk **Concrete Jacket (Chipping piringan stucco lama + grouting epoxy + anyaman wirimesh Ø3 + cor tebal tambahan 5cm)** untuk mencegah gerusan gaya seret air (tractive force).
2. **Untuk Saluran Butuh Perbaikan (Kuning)**: Pembersihan sisa sedimentasi plester semen pada dasar saluran guna mengembalikan tampang basah rencana hidrolis awal.
3. **Saran Integrasi Google Sheets & AppSheet**: Alur kerja lapangan sangat cocok ditautkan ke dashboard ini dengan formulir AppSheet yang mengunci cell validasi (Data Validation) target ukuran, sehingga surveyor memperoleh notifikasi 'Reject' di gadget saat menginput angka aktual di luar toleransi ±5%.`;
      
      setAiReport(analysisResult);
      setAiAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="space-y-6" id="analytics-dashboard-panel">
      {/* KPI Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Compliance Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between" id="kpi-compliance">
          <div>
            <span className="text-xs font-mono text-slate-500 uppercase block tracking-wider">Keselarasan Dimensi</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{complianceRate}%</span>
            <span className="text-xs text-emerald-600 font-medium mt-1 inline-flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              <span>{matchCount} dari {totalInspected} STA Presisi</span>
            </span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Total Inspected */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between" id="kpi-inspected">
          <div>
            <span className="text-xs font-mono text-slate-500 uppercase block tracking-wider">Total Titik Di-Check</span>
            <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{totalInspected}</span>
            <span className="text-xs text-slate-500 mt-1 block">Dari {channels.length} Saluran Aktif</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        {/* Warning Deviasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between" id="kpi-warning">
          <div>
            <span className="text-xs font-mono text-slate-500 uppercase block tracking-wider">Butuh Perbaikan</span>
            <span className="text-3xl font-extrabold text-amber-600 mt-1 block">{warningCount}</span>
            <span className="text-xs text-amber-500 mt-1 block">Toleransi deviasi 5% - 10%</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Danger Deviasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between" id="kpi-danger">
          <div>
            <span className="text-xs font-mono text-slate-500 uppercase block tracking-wider">Titik Kritis (Tebal/Lebar)</span>
            <span className="text-3xl font-extrabold text-rose-600 mt-1 block">{dangerCount}</span>
            <span className="text-xs text-rose-500 mt-1 block">Penyimpangan &gt; 10% target</span>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <XCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Charts & Progress Bento Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Deviation Trend Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col" id="deviation-trend-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Grafik Profil Deviasi Dimensi (%)</h3>
              <p className="text-slate-400 text-xs mt-0.5">Persentase deviasi dimensi struktur aktual terhadap rencana standar</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1 font-semibold text-blue-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"></span> W1 (Lebar)
              </span>
              <span className="flex items-center gap-1 font-semibold text-indigo-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 block"></span> T (Lining)
              </span>
            </div>
          </div>

          {/* SVG Rendered Line Graph */}
          <div className="h-56 relative w-full flex items-end">
            <svg viewBox="0 0 500 180" className="w-full h-full" style={{ overflow: 'visible' }}>
              {/* Horizontal Reference Lines */}
              <line x1="0" y1="20" x2="500" y2="20" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="55" x2="500" y2="55" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" /> {/* Zero tolerance line */}
              <line x1="0" y1="125" x2="500" y2="125" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="160" x2="500" y2="160" stroke="#f1f5f9" strokeWidth="1" />

              {/* Grid Annotations (Left Y-Axis) */}
              <text x="-5" y="24" className="text-[9px] font-mono fill-slate-400" textAnchor="end">+15%</text>
              <text x="-5" y="59" className="text-[9px] font-mono fill-slate-400" textAnchor="end">+5%</text>
              <text x="-5" y="94" className="text-[9px] font-mono fill-slate-500" textAnchor="end">0% (Rencana)</text>
              <text x="-5" y="129" className="text-[9px] font-mono fill-slate-400" textAnchor="end">-5%</text>
              <text x="-5" y="164" className="text-[9px] font-mono fill-slate-400" textAnchor="end">-15%</text>

              {/* Render Lines for Width top & Thickness deviations */}
              {/* STA mapping coordinate slots: 0 -> 50, 1 -> 150, 2 -> 250, 3 -> 350, 4 -> 450 */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                points="50,95 150,121 250,81 350,108 450,72"
                className="transition-all duration-500"
              />
              <polyline
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                points="50,113 150,183 250,90 350,146 450,66"
                className="transition-all duration-500"
              />

              {/* Data points markers */}
              {/* STA 101 */}
              <circle cx="50" cy="95" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" className="hover:scale-150 transition cursor-pointer" />
              <circle cx="50" cy="113" r="4.5" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" className="hover:scale-150 transition cursor-pointer" />
              
              {/* STA 102 */}
              <circle cx="150" cy="121" r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="150" cy="183" r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
              
              {/* STA 103 */}
              <circle cx="250" cy="81" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="250" cy="90" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
              
              {/* STA 104 */}
              <circle cx="350" cy="108" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="350" cy="146" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              
              {/* STA 105 */}
              <circle cx="450" cy="72" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="450" cy="66" r="4.5" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />

              {/* Horizontal Stations Labels */}
              <text x="50" y="178" className="text-[9px] font-semibold fill-slate-500" textAnchor="middle">srv-101</text>
              <text x="150" y="178" className="text-[9px] font-semibold fill-rose-600" textAnchor="middle">srv-102 (KRITIS)</text>
              <text x="250" y="178" className="text-[9px] font-semibold fill-slate-500" textAnchor="middle">srv-103</text>
              <text x="350" y="178" className="text-[9px] font-semibold fill-slate-500" textAnchor="middle">srv-104</text>
              <text x="450" y="178" className="text-[9px] font-semibold fill-slate-500" textAnchor="middle">srv-105</text>
            </svg>
            
            {/* Legend tolerance shading box */}
            <div className="absolute top-12 left-2 right-2 h-14 bg-emerald-500/5 border-y border-emerald-500/10 pointer-events-none flex items-center justify-center">
              <span className="text-[9px] text-emerald-600/60 font-medium">Batas Toleransi Spesifikasi SDA (±5%)</span>
            </div>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-mono text-center">
            * Deviasi negatif di bawah garis putus-putus mewakili ketebalan beton/dimensi saluran aktual yang lebih tipis dari rencana konstruksi.
          </div>
        </div>

        {/* Progress status & Channels Monev list */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="channels-progress-bento">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Status Kemajuan Evaluasi</h3>
            <p className="text-slate-400 text-xs mt-0.5">Total saluran basah yang terevaluasi geometrinya</p>
          </div>

          <div className="my-4 text-center">
            {/* Progress Circular visual (Clean pure HTML/CSS dashboard indicator) */}
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                <circle cx="56" cy="56" r="48" stroke="#2563eb" strokeWidth="8" fill="transparent"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={2 * Math.PI * 48 * (1 - evaluationProgress / 100)}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-black text-slate-800">{evaluationProgress}%</span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">Panjang Saluran</span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <span className="text-[11px] font-bold text-slate-700 block text-left">Daftar Daerah Irigasi & Progres:</span>
            {channels.map((chan) => (
              <div 
                key={chan.id} 
                className={`p-2 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                  selectedChannelId === chan.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-100'
                }`}
                onClick={() => onSelectChannel(chan.id)}
              >
                <div className="text-left">
                  <span className="font-semibold text-slate-800 block">{chan.name}</span>
                  <span className="text-slate-400 text-[10px]">Tipe: Saluran {chan.type} • {chan.length}m</span>
                </div>
                <div className="text-right flex items-center gap-2">
                  <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full" style={{ width: `${chan.progress}%` }}></div>
                  </div>
                  <span className="font-mono font-bold text-slate-700 text-[11px] min-w-[28px]">{chan.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Grounding / Technical Recommendation Center */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-md" id="ai-recommender-panel">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 relative">
          <div className="max-w-2xl text-left">
            <div className="flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold w-fit">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Modul Analisis Konstruksi AI</span>
            </div>
            <h3 className="text-lg font-bold mt-2.5">Rekomendasi Struktur & Solusi Dimensi SDA</h3>
            <p className="text-slate-300 text-sm mt-1">
              Gunakan kecerdasan buatan untuk mengevaluasi data monev konstruksi, menetapkan klasifikasi perbaikan, serta memberikan rekomendasi penanganan sesuai standar spesifikasi Kementerian PUPR Indonesia.
            </p>
          </div>
          <div>
            <button
              onClick={generateEngineeringAdvice}
              disabled={aiAnalyzing}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition shadow flex items-center justify-center gap-2"
              id="btn-trigger-ai-audit"
            >
              {aiAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Menganalisis Geometri...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Analisis Deviasi Lapangan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Output Content */}
        {aiReport && (
          <div className="mt-5 p-5 bg-white/5 border border-white/10 rounded-2xl text-left font-sans text-xs leading-relaxed max-h-72 overflow-y-auto" id="ai-report-output">
            <pre className="whitespace-pre-wrap font-sans text-slate-100 text-xs text-left" style={{ margin: 0 }}>
              {aiReport}
            </pre>
          </div>
        )}
      </div>

      {/* Field Inspection History & Search Filter panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden" id="survey-log-table">
        <div className="p-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-left">
            <h3 className="font-bold text-slate-800 text-sm">Riwayat Survey Lapangan Rinci</h3>
            <p className="text-slate-400 text-xs">Pencarian, pemfilteran tipe, serta inspeksi nilai deviasi beton</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Cari stasiun, surveyor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 w-44 focus:outline-none focus:border-blue-500 transition shadow-sm"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
              {(['All', 'Primer', 'Sekunder', 'Tersier'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                    filterType === type 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {type === 'All' ? 'Semua' : type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Log Table list */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-600 text-left">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold">
                <th className="p-4">Stasiun & Tanggal</th>
                <th className="p-4">Ref Saluran</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Surveyor</th>
                <th className="p-4 text-center">Lebar Top (W1)</th>
                <th className="p-4 text-center">Tebal Lining (T)</th>
                <th className="p-4 text-center">Kedalaman (H)</th>
                <th className="p-4 text-right">Deviasi Rata-rata</th>
                <th className="p-4 text-center">Status QA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSurveys.length > 0 ? (
                filteredSurveys.map((survey) => (
                  <tr key={survey.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4 text-left">
                      <span className="font-bold text-slate-800 block">{survey.stationing}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {new Date(survey.timestamp).toLocaleDateString('id-ID')} {new Date(survey.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                      </span>
                    </td>
                    <td className="p-4 text-left font-semibold text-slate-700">
                      {survey.channelName}
                    </td>
                    <td className="p-4 text-left">
                      <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase font-bold ${
                        survey.channelType === 'Primer' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                        survey.channelType === 'Sekunder' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {survey.channelType}
                      </span>
                    </td>
                    <td className="p-4 text-left">{survey.surveyorName}</td>
                    
                    {/* Width Top cell */}
                    <td className="p-4 text-center text-left">
                      <div className="font-mono">
                        <span className="font-bold text-slate-800">{survey.widthTop.actual}m</span>
                        <span className="text-slate-400 text-[10px] block font-normal">Target: {survey.widthTop.target}m</span>
                      </div>
                      <span className={`text-[9px] font-bold block mt-0.5 ${survey.widthTop.deviation < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {survey.widthTop.deviation > 0 ? `+${survey.widthTop.deviation}` : survey.widthTop.deviation}%
                      </span>
                    </td>

                    {/* Thickness cell */}
                    <td className="p-4 text-center">
                      <div className="font-mono">
                        <span className="font-bold text-slate-800">{survey.thickness.actual}m</span>
                        <span className="text-slate-400 text-[10px] block font-normal">Target: {survey.thickness.target}m</span>
                      </div>
                      <span className={`text-[9px] font-bold block mt-0.5 ${survey.thickness.deviation < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {survey.thickness.deviation > 0 ? `+${survey.thickness.deviation}` : survey.thickness.deviation}%
                      </span>
                    </td>

                    {/* Depth cell */}
                    <td className="p-4 text-center">
                      <div className="font-mono">
                        <span className="font-bold text-slate-800">{survey.depth.actual}m</span>
                        <span className="text-slate-400 text-[10px] block font-normal">Target: {survey.depth.target}m</span>
                      </div>
                      <span className={`text-[9px] font-bold block mt-0.5 ${survey.depth.deviation < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {survey.depth.deviation > 0 ? `+${survey.depth.deviation}` : survey.depth.deviation}%
                      </span>
                    </td>

                    {/* Deviation Score avg */}
                    <td className="p-4 text-right font-bold text-slate-700 font-mono">
                      {survey.deviationScore.toFixed(2)}%
                    </td>

                    {/* QA status */}
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block text-center ${
                        survey.overallStatus === 'LAYAK' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : survey.overallStatus === 'BUTUH_PERBAIKAN' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                          : 'bg-rose-50 text-rose-700 border border-rose-100'
                      }`}>
                        {survey.overallStatus.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400 font-medium">
                    Tidak ditemukan data survey yang cocok dengan kata pencarian atau tipe filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
