/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChannelSegment, SurveyRecord, Coordinates } from '../types';
import { MapPin, Layers, Crosshair, Navigation } from 'lucide-react';

interface GisMapProps {
  channels: ChannelSegment[];
  surveys: SurveyRecord[];
  selectedChannelId: string | null;
  onSelectChannel: (id: string | null) => void;
  onMapClickCoordinates: (coords: Coordinates) => void;
  activeCoordinates: Coordinates | null;
}

declare global {
  interface Window {
    L: any; // Leaflet global
  }
}

export default function GisMap({
  channels,
  surveys,
  selectedChannelId,
  onSelectChannel,
  onMapClickCoordinates,
  activeCoordinates
}: GisMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const polylinesRef = useRef<{ [key: string]: any }>({});
  const markersRef = useRef<any[]>([]);
  const activeMarkerRef = useRef<any>(null);
  
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isSatellite, setIsSatellite] = useState(false);

  // Load Leaflet dynamically via CDN to ensure full React 19 compatibility
  useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }

    // Load CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load Script
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => {
      setLeafletLoaded(true);
    };
    script.onerror = () => {
      setMapError('Gagal memuat peta GIS. Periksa koneksi internet Anda.');
    };
    document.head.appendChild(script);

    return () => {
      // Keep map scripts in head to avoid reloading issues, but clean up if needed.
    };
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      const L = window.L;
      
      // Default coordinates centered around Sleman Sleman D.I.
      const map = L.map(mapContainerRef.current, {
        zoomControl: false // we will style our own zoom buttons or use default at customized corner
      }).setView([-7.735, 110.355], 14);

      mapInstanceRef.current = map;

      // Add Zoom Control at bottom right
      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      // Tile layers
      const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      });

      const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      });

      map.osmLayer = osmLayer;
      map.satelliteLayer = satelliteLayer;

      // Add default layer
      osmLayer.addTo(map);

      // Click event for coordinates tracking
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        onMapClickCoordinates({ lat, lng });
      });

    } catch (err: any) {
      console.error('Error initializing Leaflet:', err);
      setMapError('Terjadi kesalahan saat memulai modul peta GIS.');
    }
  }, [leafletLoaded]);

  // Handle layer toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !leafletLoaded) return;

    if (isSatellite) {
      map.removeLayer(map.osmLayer);
      map.satelliteLayer.addTo(map);
    } else {
      map.removeLayer(map.satelliteLayer);
      map.osmLayer.addTo(map);
    }
  }, [isSatellite, leafletLoaded]);

  // Render Polylines for Channels
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !leafletLoaded) return;

    const L = window.L;

    // Remove existing polylines
    Object.keys(polylinesRef.current).forEach((key) => {
      map.removeLayer(polylinesRef.current[key]);
    });
    polylinesRef.current = {};

    channels.forEach((channel) => {
      const latlngs = channel.coordinates.map((c) => [c.lat, c.lng]);
      
      // Determine colors based on channel type and matching status
      let color = '#3b82f6'; // Blue for Primer (default)
      if (channel.type === 'Sekunder') color = '#10b981'; // Green
      if (channel.type === 'Tersier') color = '#f59e0b'; // Orange

      // Highlight if selected
      const isSelected = selectedChannelId === channel.id;
      const weight = isSelected ? 8 : 4;
      const opacity = isSelected ? 0.9 : 0.6;

      const polyline = L.polyline(latlngs, {
        color: color,
        weight: weight,
        opacity: opacity,
        dashArray: channel.status === 'PENDING' ? '5, 8' : undefined
      }).addTo(map);

      // Create a popup
      const popupContent = `
        <div style="font-family: sans-serif; min-width: 180px;">
          <h4 style="margin: 0 0 5px; font-weight: 600; font-size: 13px; color: #1e293b;">${channel.name}</h4>
          <p style="margin: 0 0 4px; font-size: 11px; color: #64748b;">Tipe: <b>Saluran ${channel.type}</b></p>
          <p style="margin: 0 0 4px; font-size: 11px; color: #64748b;">Panjang: <b>${channel.length} m</b></p>
          <p style="margin: 0 0 8px; font-size: 11px; color: #64748b;">Progres Monev: <b>${channel.progress}%</b></p>
          <button 
            id="pop-btn-${channel.id}"
            style="display: block; width: 100%; border: none; background: #2563eb; color: white; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: 500; cursor: pointer;"
          >
            Pilih untuk Evaluasi
          </button>
        </div>
      `;

      polyline.bindPopup(popupContent);

      polyline.on('popupopen', () => {
        const btn = document.getElementById(`pop-btn-${channel.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            onSelectChannel(channel.id);
            polyline.closePopup();
          };
        }
      });

      polylinesRef.current[channel.id] = polyline;
    });
  }, [channels, selectedChannelId, leafletLoaded]);

  // Render Markers for past Surveys
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !leafletLoaded) return;

    const L = window.L;

    // Clean old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    surveys.forEach((survey) => {
      // Determine marker color depending on quality evaluation OverallStatus
      let colorClass = 'bg-emerald-500';
      if (survey.overallStatus === 'BUTUH_PERBAIKAN') colorClass = 'bg-amber-500';
      if (survey.overallStatus === 'KRITIS') colorClass = 'bg-rose-500';

      // Custom HTML DivIcon for vector look
      const customIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-3 w-3 rounded-full ${colorClass} opacity-60 animate-ping"></span>
            <div class="relative h-4 w-4 rounded-full border-2 border-white ${colorClass} shadow"></div>
          </div>
        `,
        className: 'custom-div-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      // Survey coordinate
      const marker = L.marker([survey.coordinates.lat, survey.coordinates.lng], {
        icon: customIcon
      }).addTo(map);

      // Popup Content for details
      const popupContent = `
        <div style="font-family: sans-serif; width: 220px; font-size: 12px; color: #334155; line-height: 1.4;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            <b style="color: #1e293b;">${survey.stationing}</b>
            <span style="font-size: 9px; padding: 2px 6px; border-radius: 9999px; font-weight: 600; 
              color: white; background: ${
                survey.overallStatus === 'LAYAK' ? '#10b981' : 
                survey.overallStatus === 'BUTUH_PERBAIKAN' ? '#f59e0b' : '#f43f5e'
              };">
              ${survey.overallStatus.replace('_', ' ')}
            </span>
          </div>
          <p style="margin: 2px 0;">Saluran: <b>${survey.channelName}</b></p>
          <p style="margin: 2px 0;">Tanggal: <b>${new Date(survey.timestamp).toLocaleDateString('id-ID')}</b></p>
          <p style="margin: 2px 0;">Surveyor: <b>${survey.surveyorName}</b></p>
          <div style="margin-top: 6px; padding: 4px; background: #f8fafc; border-radius: 4px; font-size: 11px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2px;">
              <span>Lebar Atas (W1):</span> <span style="text-align: right; font-weight: 600; color: ${survey.widthTop.status === 'DEVIASI' ? '#dc2626' : 'inherit'}">${survey.widthTop.actual}m / T:${survey.widthTop.target}m</span>
              <span>Kedalaman (H):</span> <span style="text-align: right; font-weight: 600; color: ${survey.depth.status === 'DEVIASI' ? '#dc2626' : 'inherit'}">${survey.depth.actual}m / T:${survey.depth.target}m</span>
              <span>Lining (T):</span> <span style="text-align: right; font-weight: 600; color: ${survey.thickness.status === 'DEVIASI' ? '#dc2626' : 'inherit'}">${survey.thickness.actual}cm / T:${survey.thickness.target}cm</span>
            </div>
          </div>
          <p style="margin: 6px 0 0; font-size: 10px; color: #64748b; font-style: italic;">
            "W: ${survey.coordinates.lat.toFixed(5)}, ${survey.coordinates.lng.toFixed(5)}"
          </p>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });
  }, [surveys, leafletLoaded]);

  // Handle Active Coordinate / Survey Placement Pin (interactive adding)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !leafletLoaded) return;

    const L = window.L;

    if (activeMarkerRef.current) {
      map.removeLayer(activeMarkerRef.current);
      activeMarkerRef.current = null;
    }

    if (activeCoordinates) {
      // Build an interactive "adding new pinpoint" standard marker
      const pinIcon = L.divIcon({
        html: `
          <div class="relative flex items-center justify-center">
            <span class="absolute inline-flex h-6 w-6 rounded-full bg-blue-500 opacity-40 animate-ping"></span>
            <div class="h-6 w-6 text-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6 drop-shadow-md">
                <path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        `,
        className: 'new-survey-icon',
        iconSize: [30, 30],
        iconAnchor: [15, 30]
      });

      activeMarkerRef.current = L.marker([activeCoordinates.lat, activeCoordinates.lng], {
        icon: pinIcon
      }).addTo(map);

      // Auto-pan mapping view slightly
      map.panTo([activeCoordinates.lat, activeCoordinates.lng]);
    }
  }, [activeCoordinates, leafletLoaded]);


  // Handle flying/panning to channel segment
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedChannelId) {
      const channel = channels.find((c) => c.id === selectedChannelId);
      if (channel && channel.coordinates.length > 0) {
        // find bounds
        const L = window.L;
        const latlngs = channel.coordinates.map((c) => [c.lat, c.lng]);
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      map.setView([-7.735, 110.355], 14);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[380px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm" id="gis-map-container">
      {/* Map Error Banner */}
      {mapError && (
        <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-slate-50 p-6 text-center text-slate-600">
          <MapPin className="h-12 w-12 text-slate-400 mb-3 animate-bounce" id="map-error-pin" />
          <p className="font-semibold text-slate-800 text-lg">Peta Tidak Tersedia</p>
          <p className="text-sm mt-1 max-w-sm text-slate-500">{mapError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Muat Ulang Aplikasi
          </button>
        </div>
      )}

      {/* Loading overlay */}
      {!leafletLoaded && !mapError && (
        <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin mb-3"></div>
          <p className="text-xs text-slate-500 font-mono tracking-wider uppercase">Memuat Map Engine GIS...</p>
        </div>
      )}

      {/* Map Div */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Floating map controls */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
        {/* Layer toggle selector */}
        <button
          onClick={() => setIsSatellite(!isSatellite)}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur shadow-md rounded-xl text-slate-700 text-xs font-semibold border border-slate-200 hover:bg-slate-50 active:scale-95 transition"
          id="btn-toggle-satellite"
          title="Ganti Tampilan Peta"
        >
          <Layers className="h-3.5 w-3.5 text-blue-600" />
          <span>{isSatellite ? 'Satelit ESRI' : 'OSM Jalan'}</span>
        </button>

        {/* Recenter / Zoom out selection */}
        <button
          onClick={handleRecenter}
          className="flex items-center gap-1.5 px-3 py-2 bg-white/95 backdrop-blur shadow-md rounded-xl text-slate-700 text-xs font-semibold border border-slate-200 hover:bg-slate-50 active:scale-95 transition"
          id="btn-recenter-map"
          title="Fokus ke Objek Terpilih"
        >
          <Crosshair className="h-3.5 w-3.5 text-blue-600" />
          <span>Fokus Objek</span>
        </button>
      </div>

      {/* GIS Legend panel */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200 text-xs max-w-[200px]" id="map-legend">
        <h5 className="font-bold text-slate-800 mb-1.5 flex items-center gap-1">
          <Navigation className="h-3.5 w-3.5 text-blue-600 fill-blue-600" />
          <span>Legenda GIS Saluran</span>
        </h5>
        
        {/* Channel lines */}
        <div className="space-y-1.5 border-b border-slate-100 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-blue-500 rounded-full block"></span>
            <span className="text-slate-600 text-[11px]">Saluran Primer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-emerald-500 rounded-full block"></span>
            <span className="text-slate-600 text-[11px]">Saluran Sekunder</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-1 bg-amber-500 rounded-full block"></span>
            <span className="text-slate-600 text-[11px]">Saluran Tersier</span>
          </div>
        </div>

        {/* Checkpoint pins */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white block"></span>
            <span className="text-slate-600 text-[11px]">Status Layak (Presisi)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white block"></span>
            <span className="text-slate-600 text-[11px]">Deviasi Sedang</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white block"></span>
            <span className="text-slate-600 text-[11px]">Deviasi Kritis (&gt; 10%)</span>
          </div>
        </div>

        <div className="text-[9px] text-slate-400 mt-2 pt-1 border-t border-slate-100 text-center font-mono">
          * Klik peta untuk ambil GPS
        </div>
      </div>
    </div>
  );
}
