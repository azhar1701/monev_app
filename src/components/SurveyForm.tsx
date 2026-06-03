/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChannelSegment, SurveyRecord, Coordinates, DimensionData } from '../types';
import { MOCK_SURVEYOR_LIST } from '../data';
import { 
  Camera, 
  MapPin, 
  CloudOff, 
  Wifi, 
  CornerDownRight, 
  Save, 
  Trash2, 
  Check, 
  AlertTriangle,
  PenTool,
  RotateCcw
} from 'lucide-react';

interface SurveyFormProps {
  channels: ChannelSegment[];
  selectedChannelId: string | null;
  onSelectChannel: (id: string | null) => void;
  onSubmitSurvey: (record: SurveyRecord) => void;
  clickedCoordinates: Coordinates | null;
  clearClickedCoordinates: () => void;
}

export default function SurveyForm({
  channels,
  selectedChannelId,
  onSelectChannel,
  onSubmitSurvey,
  clickedCoordinates,
  clearClickedCoordinates
}: SurveyFormProps) {
  // Offline state simulator
  const [offlineMode, setOfflineMode] = useState(false);
  
  // Basic attributes
  const [stationing, setStationing] = useState('STA 0+');
  const [surveyorName, setSurveyorName] = useState(MOCK_SURVEYOR_LIST[0]);
  const [notes, setNotes] = useState('');
  
  // Custom channel inputs
  const [customName, setCustomName] = useState('');
  const [customType, setCustomType] = useState<'Primer' | 'Sekunder' | 'Tersier'>('Primer');
  
  // Geolocation
  const [latitude, setLatitude] = useState('-7.73500');
  const [longitude, setLongitude] = useState('110.35500');
  const [capturingGps, setCapturingGps] = useState(false);

  // Targets and Actuals for 4 dimensions
  // W1 (Lebar Atas)
  const [targetW1, setTargetW1] = useState('2.0');
  const [actualW1, setActualW1] = useState('2.0');
  // W2 (Lebar Bawah)
  const [targetW2, setTargetW2] = useState('1.2');
  const [actualW2, setActualW2] = useState('1.2');
  // H (Kedalaman/Tinggi)
  const [targetH, setTargetH] = useState('1.2');
  const [actualH, setActualH] = useState('1.2');
  // T (Tebal Lining)
  const [targetT, setTargetT] = useState('0.25');
  const [actualT, setActualT] = useState('0.25');

  // Photo uploads
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Signature drawing pad
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Auto-fill active coordinates when clicked on the GIS Map
  useEffect(() => {
    if (clickedCoordinates) {
      setLatitude(clickedCoordinates.lat.toFixed(6));
      setLongitude(clickedCoordinates.lng.toFixed(6));
      clearClickedCoordinates();
    }
  }, [clickedCoordinates]);

  // Handle selected channel presets to load targets automatically
  useEffect(() => {
    if (selectedChannelId) {
      if (selectedChannelId === 'custom_new') {
        // Load default spec based on selected custom type
        if (customType === 'Primer') {
          setTargetW1('3.5'); setActualW1('3.5');
          setTargetW2('2.0'); setActualW2('2.0');
          setTargetH('1.8'); setActualH('1.8');
          setTargetT('0.30'); setActualT('0.30');
        } else if (customType === 'Sekunder') {
          setTargetW1('2.0'); setActualW1('2.0');
          setTargetW2('1.2'); setActualW2('1.2');
          setTargetH('1.2'); setActualH('1.2');
          setTargetT('0.25'); setActualT('0.25');
        } else {
          setTargetW1('1.0'); setActualW1('1.0');
          setTargetW2('0.6'); setActualW2('0.6');
          setTargetH('0.6'); setActualH('0.6');
          setTargetT('0.15'); setActualT('0.15');
        }
      } else {
        const channel = channels.find(c => c.id === selectedChannelId);
        if (channel) {
          // Load some realistic defaults
          if (channel.type === 'Primer') {
            setTargetW1('3.5'); setActualW1('3.5');
            setTargetW2('2.0'); setActualW2('2.0');
            setTargetH('1.8'); setActualH('1.8');
            setTargetT('0.30'); setActualT('0.30');
          } else if (channel.type === 'Sekunder') {
            setTargetW1('2.0'); setActualW1('2.0');
            setTargetW2('1.2'); setActualW2('1.2');
            setTargetH('1.2'); setActualH('1.2');
            setTargetT('0.25'); setActualT('0.25');
          } else {
            setTargetW1('1.0'); setActualW1('1.0');
            setTargetW2('0.6'); setActualW2('0.6');
            setTargetH('0.6'); setActualH('0.6');
            setTargetT('0.15'); setActualT('0.15');
          }
        }
      }
    }
  }, [selectedChannelId, channels, customType]);

  // Capture actual HTML5 GPS coords
  const handleGPSCapture = () => {
    setCapturingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toFixed(6));
          setLongitude(position.coords.longitude.toFixed(6));
          setCapturingGps(false);
        },
        (error) => {
          console.warn('Geolocation failed, falling back to SLEMAN area random coords.', error);
          // Set Sleman-aligned coordinates with tiny variation to simulate field survey walking
          const randomLat = -7.735 + (Math.random() - 0.5) * 0.01;
          const randomLng = 110.355 + (Math.random() - 0.5) * 0.01;
          setLatitude(randomLat.toFixed(6));
          setLongitude(randomLng.toFixed(6));
          setCapturingGps(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setCapturingGps(false);
    }
  };

  // Calculations for deviances
  const computeDeviation = (targetStr: string, actualStr: string) => {
    const t = parseFloat(targetStr) || 0;
    const a = parseFloat(actualStr) || 0;
    if (t === 0) return 0;
    return parseFloat((((a - t) / t) * 100).toFixed(2));
  };

  const devW1 = computeDeviation(targetW1, actualW1);
  const devW2 = computeDeviation(targetW2, actualW2);
  const devH = computeDeviation(targetH, actualH);
  const devT = computeDeviation(targetT, actualT);

  // Standard tolerance filter for civil channel works
  // Overly thin lining or severe narrow capacity acts as deviation
  const getDimensionStatus = (dev: number): 'SESUAI' | 'DEVIASI' => {
    // Toleransi PUPR standar is target -5% max deviation
    return (dev < -5 || dev > 10) ? 'DEVIASI' : 'SESUAI';
  };

  // File picker simulation for Photo attachments
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoData(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drawing Pad Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineCap = 'round';
    setIsDrawing(true);
    setHasSignature(true);
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Submit Handler
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannelId) return alert('Silakan pilih segment saluran terlebih dahulu!');

    let finalChannelId = selectedChannelId;
    let finalChannelName = '';
    let finalChannelType: 'Primer' | 'Sekunder' | 'Tersier' = 'Primer';

    if (selectedChannelId === 'custom_new') {
      if (!customName.trim()) {
        return alert('Silakan masukkan nama saluran kustom terlebih dahulu!');
      }
      finalChannelId = `ch-custom-${Date.now()}`;
      finalChannelName = customName.trim();
      finalChannelType = customType;
    } else {
      const selectedChan = channels.find(c => c.id === selectedChannelId);
      if (!selectedChan) return alert('Silakan pilih segment saluran terlebih dahulu!');
      finalChannelId = selectedChan.id;
      finalChannelName = selectedChan.name;
      finalChannelType = selectedChan.type;
    }

    const timestampISO = new Date().toISOString();
    const watermarkText = watermarkEnabled ? {
      coordinates: `${latitude}, ${longitude}`,
      timestamp: `${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID')} WIB`,
      stationing: `${finalChannelName.replace(/\s+/g, '_').toUpperCase()} [${stationing}]`
    } : null;

    // Build the dimension data items
    const dimW1: DimensionData = {
      target: parseFloat(targetW1),
      actual: parseFloat(actualW1),
      deviation: devW1,
      status: getDimensionStatus(devW1)
    };
    
    const dimW2: DimensionData = {
      target: parseFloat(targetW2),
      actual: parseFloat(actualW2),
      deviation: devW2,
      status: getDimensionStatus(devW2)
    };

    const dimH: DimensionData = {
      target: parseFloat(targetH),
      actual: parseFloat(actualH),
      deviation: devH,
      status: getDimensionStatus(devH)
    };

    const dimT: DimensionData = {
      target: parseFloat(targetT),
      actual: parseFloat(actualT),
      deviation: devT,
      status: getDimensionStatus(devT)
    };

    // Calculate score & overall
    const avgDev = (Math.abs(devW1) + Math.abs(devW2) + Math.abs(devH) + Math.abs(devT)) / 4;
    
    let overall: 'LAYAK' | 'BUTUH_PERBAIKAN' | 'KRITIS' = 'LAYAK';
    if (avgDev > 10 || dimT.status === 'DEVIASI' && devT < -15) {
      overall = 'KRITIS';
    } else if (avgDev > 5 || dimW1.status === 'DEVIASI' || dimT.status === 'DEVIASI') {
      overall = 'BUTUH_PERBAIKAN';
    }

    const newRecord: SurveyRecord = {
      id: `srv-${Date.now()}`,
      channelId: finalChannelId,
      channelName: finalChannelName,
      channelType: finalChannelType,
      stationing: stationing,
      surveyorName: surveyorName,
      timestamp: timestampISO,
      coordinates: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
      widthTop: dimW1,
      widthBottom: dimW2,
      depth: dimH,
      thickness: dimT,
      overallStatus: overall,
      deviationScore: parseFloat(avgDev.toFixed(2)),
      photoUrl: photoData || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', // robust fallback
      photoWatermark: watermarkText,
      notes: notes,
      isSynced: !offlineMode // if offline we mock synced=false
    };

    onSubmitSurvey(newRecord);

    // Reset Form state for next capture
    setStationing('STA 0+');
    setNotes('');
    setPhotoData(null);
    setCustomName('');
    clearSignature();
    onSelectChannel(null); // release channel selection to reset
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 shadow-lg rounded-3xl overflow-hidden text-left" id="survey-form-container">
      {/* Handheld Terminal Header banner */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-blue-600 flex items-center justify-center text-sm font-bold shadow-md shadow-blue-500/30">
            SDA
          </div>
          <div>
            <span className="text-[10px] font-mono text-blue-400 block tracking-widest uppercase">Formulir Lapangan Mobile</span>
            <h2 className="font-bold text-sm tracking-tight text-white">Inspektur Dimensi Monev</h2>
          </div>
        </div>

        {/* Offline sync toggle */}
        <button
          onClick={() => setOfflineMode(!offlineMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition shadow ${
            offlineMode 
              ? 'bg-rose-500 text-white' 
              : 'bg-emerald-500 text-white'
          }`}
          type="button"
          id="btn-toggle-offline"
        >
          {offlineMode ? (
            <>
              <CloudOff className="h-3.5 w-3.5" />
              <span>Offline Mode (Antrean)</span>
            </>
          ) : (
            <>
              <Wifi className="h-3.5 w-3.5" />
              <span>Online (Sync Instan)</span>
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
        
        {/* 1. SECTION: Channel and Station Selection */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase block">
            1. Objek & Lokasi Penilaian
          </label>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Saluran Irigasi:</span>
              <select
                value={selectedChannelId || ''}
                onChange={(e) => onSelectChannel(e.target.value || null)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                id="select-channel"
                required
              >
                <option value="">-- Pilih Saluran Irigasi --</option>
                <option value="custom_new">📝 Tulis Nama Kustom / Baru</option>
                {channels.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-600 mb-1.5 block">Stasiun Konstruksi (STA):</span>
              <input
                type="text"
                placeholder="misal: STA 0+250"
                value={stationing}
                onChange={(e) => setStationing(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                id="input-stationing"
                required
              />
            </div>

            {selectedChannelId === 'custom_new' && (
              <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-fade-in">
                <div>
                  <span className="text-xs font-bold text-indigo-950 mb-1.5 block">Nama Saluran Irigasi Kustom:</span>
                  <input
                    type="text"
                    placeholder="misal: Saluran Tersier Kebonagung"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    id="input-custom-channel-name"
                    required
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-indigo-950 mb-1.5 block">Tipe Saluran Irigasi:</span>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as 'Primer' | 'Sekunder' | 'Tersier')}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    id="select-custom-channel-type"
                    required
                  >
                    <option value="Primer">Saluran Primer (Lebar Rencana &gt; 3m)</option>
                    <option value="Sekunder">Saluran Sekunder (Lebar Rencana 1m - 3m)</option>
                    <option value="Tersier">Saluran Tersier (Lebar Rencana &lt; 1m)</option>
                  </select>
                </div>
                <div className="col-span-full">
                  <span className="text-[10px] text-slate-500 italic">
                    * Memasukkan jenis saluran di atas akan memperbarui preset dimensi standar secara dinamis agar memudahkan pengisian form.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. SECTION: Geolocation GPS Auto capture */}
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <MapPin className="h-4 w-4 text-blue-600 animate-pulse" />
              <span>Koordinat Lapangan (GPS)</span>
            </span>
            <button
              type="button"
              onClick={handleGPSCapture}
              disabled={capturingGps}
              className="px-3 py-1 bg-white border border-slate-200 text-blue-600 font-semibold shadow-sm text-[11px] rounded-lg hover:bg-slate-100 active:scale-95 transition flex items-center gap-1"
              id="btn-capture-gps"
            >
              <RotateCcw className={`h-3 w-3 ${capturingGps ? 'animate-spin' : ''}`} />
              <span>{capturingGps ? 'Membaca Satelit...' : 'Kunci GPS Baru'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] block font-mono">LATITUDE:</span>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 py-1 font-mono font-bold text-slate-700 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-slate-400 text-[10px] block font-mono">LONGITUDE:</span>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 py-1 font-mono font-bold text-slate-700 focus:outline-none"
              />
            </div>
          </div>
          <span className="text-[10px] text-slate-400 block mt-2 text-center">
            * Anda juga dapat mengklik langsung di mana saja pada Peta GIS untuk auto-capture koordinat.
          </span>
        </div>

        {/* 3. SECTION: Dimensional verification parameters */}
        <div className="space-y-3">
          <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase block">
            2. Parameter Kesesuaian Tampang Saluran
          </label>

          <div className="space-y-4">
            
            {/* Row 1: Lebar Atas (W1) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center border-b border-slate-50 pb-3" id="row-dim-w1">
              <div className="col-span-1 text-left">
                <span className="text-xs font-bold text-slate-700 block">W1: Lebar Atas</span>
                <span className="text-[10px] text-slate-400">Canal width at top</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Target Rencana (m):</span>
                <input
                  type="number"
                  step="0.05"
                  value={targetW1}
                  onChange={(e) => setTargetW1(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Aktual Lapangan (m):</span>
                <input
                  type="number"
                  step="0.05"
                  value={actualW1}
                  onChange={(e) => setActualW1(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  id="actual-w1"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right flex-1">
                  <span className="text-[10px] text-slate-400 block">Deviasi:</span>
                  <span className={`font-mono font-bold text-xs ${getDimensionStatus(devW1) === 'DEVIASI' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {devW1 > 0 ? `+${devW1}` : devW1}%
                  </span>
                </div>
                {getDimensionStatus(devW1) === 'DEVIASI' ? (
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Row 2: Lebar Bawah (W2) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center border-b border-slate-50 pb-3" id="row-dim-w2">
              <div className="col-span-1 text-left">
                <span className="text-xs font-bold text-slate-700 block">W2: Lebar Bawah</span>
                <span className="text-[10px] text-slate-400">Canal bottom floor</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Target Rencana (m):</span>
                <input
                  type="number"
                  step="0.05"
                  value={targetW2}
                  onChange={(e) => setTargetW2(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Aktual Lapangan (m):</span>
                <input
                  type="number"
                  step="0.05"
                  value={actualW2}
                  onChange={(e) => setActualW2(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  id="actual-w2"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right flex-1">
                  <span className="text-[10px] text-slate-400 block">Deviasi:</span>
                  <span className={`font-mono font-bold text-xs ${getDimensionStatus(devW2) === 'DEVIASI' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {devW2 > 0 ? `+${devW2}` : devW2}%
                  </span>
                </div>
                {getDimensionStatus(devW2) === 'DEVIASI' ? (
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Row 3: Kedalaman/Tinggi (H) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center border-b border-slate-50 pb-3" id="row-dim-h">
              <div className="col-span-1 text-left">
                <span className="text-xs font-bold text-slate-700 block">H: Kedalaman Saluran</span>
                <span className="text-[10px] text-slate-400">Total wet depth</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Target Rencana (m):</span>
                <input
                  type="number"
                  step="0.05"
                  value={targetH}
                  onChange={(e) => setTargetH(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Aktual Lapangan (m):</span>
                <input
                  type="number"
                  step="0.05"
                  value={actualH}
                  onChange={(e) => setActualH(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  id="actual-h"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right flex-1">
                  <span className="text-[10px] text-slate-400 block">Deviasi:</span>
                  <span className={`font-mono font-bold text-xs ${getDimensionStatus(devH) === 'DEVIASI' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {devH > 0 ? `+${devH}` : devH}%
                  </span>
                </div>
                {getDimensionStatus(devH) === 'DEVIASI' ? (
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            </div>

            {/* Row 4: Lining thickness (T) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center border-b border-slate-50 pb-3" id="row-dim-t">
              <div className="col-span-1 text-left">
                <span className="text-xs font-bold text-slate-700 block">T: Tebal Beton Lining</span>
                <span className="text-[10px] text-slate-400">Hard lining thickness</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Target Rencana (m):</span>
                <input
                  type="number"
                  step="0.01"
                  value={targetT}
                  onChange={(e) => setTargetT(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-semibold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Aktual Lapangan (m):</span>
                <input
                  type="number"
                  step="0.01"
                  value={actualT}
                  onChange={(e) => setActualT(e.target.value)}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  id="actual-t"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right flex-1">
                  <span className="text-[10px] text-slate-400 block">Deviasi:</span>
                  <span className={`font-mono font-bold text-xs ${getDimensionStatus(devT) === 'DEVIASI' ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {devT > 0 ? `+${devT}` : devT}%
                  </span>
                </div>
                {getDimensionStatus(devT) === 'DEVIASI' ? (
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                ) : (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 4. SECTION: Digital Watermarked camerawork simulator */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-500 tracking-wider uppercase block">
              3. Bukti Foto Lapangan & Sinkronisasi
            </label>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                id="check-watermark"
                checked={watermarkEnabled}
                onChange={(e) => setWatermarkEnabled(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="check-watermark">Overlay Watermark GIS</label>
            </div>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-48 bg-slate-100 hover:bg-slate-200/80 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-4 cursor-pointer relative overflow-hidden transition"
            id="camera-uploader-simulation"
          >
            {photoData ? (
              <>
                <img 
                  src={photoData} 
                  alt="Inspection site" 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Watermark Overlay */}
                {watermarkEnabled && (
                  <div className="absolute bottom-0 inset-x-0 bg-slate-900/85 backdrop-blur-xs text-[10px] text-cyan-300 font-mono p-2.5 text-left leading-relaxed flex items-center justify-between border-t border-cyan-500/20">
                    <div>
                      <span className="font-bold text-white block">STA STATION: {stationing || 'STA INDETERMINATE'}</span>
                      <span>COORD: {latitude}, {longitude}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-white">INS_MONEV_SDA</span>
                      <span>TIME: {new Date().toLocaleDateString('id-ID')} WIB</span>
                    </div>
                  </div>
                )}
                
                <div className="absolute top-2 right-2 bg-slate-900/60 p-1 rounded-full text-white pointer-events-auto hover:bg-rose-600 transition" onClick={(e) => { e.stopPropagation(); setPhotoData(null); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </div>
              </>
            ) : (
              <div className="text-center text-slate-500 flex flex-col items-center">
                <div className="h-10 w-10 text-slate-400 bg-white shadow rounded-full flex items-center justify-center mb-2">
                  <Camera className="h-5 w-5" />
                </div>
                <span className="text-xs font-semibold block">Ambil Foto atau Unggah Dokumen</span>
                <span className="text-[10px] text-slate-400 mt-1">Mendukung Kamera Smartphone langsung di lapangan</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoSelect} 
            className="hidden" 
            accept="image/*"
          />
        </div>

        {/* 5. SECTION: Signature capture and Surveyor Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div>
            <span className="text-xs font-bold text-slate-700 mb-1.5 block">Identitas Surveyor:</span>
            <select
              value={surveyorName}
              onChange={(e) => setSurveyorName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              required
            >
              {MOCK_SURVEYOR_LIST.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>

            <span className="text-xs font-bold text-slate-700 mt-3 mb-1.5 block">Catatan Rekomendasi Tambahan:</span>
            <textarea
              placeholder="Sebutkan temuan penting lain, retakan dinding, dsb..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Electronic sign-off canvas panel */}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700 mb-1.5 block">Tanda Tangan Elektronik Surveyor:</span>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden relative flex flex-col min-h-[120px]">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={drawSignature}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-full min-h-[110px] bg-slate-50 cursor-crosshair"
                width={300}
                height={120}
              />
              
              <div className="absolute top-1 right-1 flex gap-1">
                <button
                  type="button"
                  onClick={clearSignature}
                  title="Hapus"
                  className="p-1 bg-white text-slate-400 hover:text-slate-600 rounded-md border border-slate-100 shadow-sm transition"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
              </div>

              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400/80 text-[11px] font-medium font-serif italic gap-1">
                  <PenTool className="h-3 w-3" />
                  <span>Coret untuk tanda tangan</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 6. SUBMIT BUTTON Controls */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-left text-[11px] text-slate-400 font-medium">
            * Mengklik Simpan akan memperbarui data internal {offlineMode ? 'antrean offline' : 'dan disinkronkan ke pusat cloud'}.
          </div>
          
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow"
            id="btn-save-survey-entry"
          >
            <Save className="h-4 w-4" />
            <span>{offlineMode ? 'Simpan Antrean' : 'Kirim Laporan real-time'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
