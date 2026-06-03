/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChannelSegment, SurveyRecord } from './types';

// Let's create paths around a real irrigation system in Indonesia (e.g., Daerah Irigasi Kali Progo area, Sleman, DIY - approx -7.73, 110.35)
export const SLEMAN_DI_CENTER = { lat: -7.735, lng: 110.355 };

export const DEFAULT_CHANNELS: ChannelSegment[] = [
  {
    id: 'ch-01',
    name: 'Saluran Primer Van Der Wijck',
    type: 'Primer',
    length: 1200,
    status: 'PARTIAL',
    progress: 60,
    coordinates: [
      { lat: -7.728, lng: 110.345 },
      { lat: -7.730, lng: 110.350 },
      { lat: -7.732, lng: 110.355 },
      { lat: -7.733, lng: 110.360 },
      { lat: -7.735, lng: 110.365 }
    ]
  },
  {
    id: 'ch-02',
    name: 'Saluran Sekunder Moyudan',
    type: 'Sekunder',
    length: 850,
    status: 'COMPLETE',
    progress: 100,
    coordinates: [
      { lat: -7.732, lng: 110.355 },
      { lat: -7.738, lng: 110.356 },
      { lat: -7.742, lng: 110.357 },
      { lat: -7.746, lng: 110.358 }
    ]
  },
  {
    id: 'ch-03',
    name: 'Saluran Sekunder Tempel',
    type: 'Sekunder',
    length: 950,
    status: 'PARTIAL',
    progress: 40,
    coordinates: [
      { lat: -7.730, lng: 110.350 },
      { lat: -7.725, lng: 110.352 },
      { lat: -7.720, lng: 110.353 },
      { lat: -7.715, lng: 110.354 }
    ]
  },
  {
    id: 'ch-04',
    name: 'Saluran Tersier Melati-1',
    type: 'Tersier',
    length: 450,
    status: 'PENDING',
    progress: 0,
    coordinates: [
      { lat: -7.738, lng: 110.356 },
      { lat: -7.739, lng: 110.350 },
      { lat: -7.740, lng: 110.345 }
    ]
  },
  {
    id: 'ch-05',
    name: 'Saluran Tersier Kenanga-3',
    type: 'Tersier',
    length: 520,
    status: 'COMPLETE',
    progress: 100,
    coordinates: [
      { lat: -7.742, lng: 110.357 },
      { lat: -7.743, lng: 110.365 },
      { lat: -7.744, lng: 110.370 }
    ]
  }
];

export const DEFAULT_SURVEYS: SurveyRecord[] = [
  {
    id: 'srv-101',
    channelId: 'ch-01',
    channelName: 'Saluran Primer Van Der Wijck',
    channelType: 'Primer',
    stationing: 'STA 0+050',
    surveyorName: 'Ari Wibowo',
    timestamp: '2026-06-01T09:15:00Z',
    coordinates: { lat: -7.7285, lng: 110.3462 },
    widthTop: { target: 3.5, actual: 3.45, deviation: -1.43, status: 'SESUAI' },
    widthBottom: { target: 2.0, actual: 1.95, deviation: -2.5, status: 'SESUAI' },
    depth: { target: 1.8, actual: 1.78, deviation: -1.11, status: 'SESUAI' },
    thickness: { target: 0.3, actual: 0.28, deviation: -6.67, status: 'DEVIASI' }, // lining slightly thinner
    overallStatus: 'LAYAK',
    deviationScore: 2.93,
    photoUrl: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    photoWatermark: {
      coordinates: '-7.7285, 110.3462',
      timestamp: '2026-06-01 09:15:00 WIB',
      stationing: 'VAN_DER_WIJCK [STA 0+050]'
    },
    notes: 'Pekerjaan lining beton agak tipis di bagian atas dinding saluran, namun elevasi mercu sesuai rencana.',
    isSynced: true
  },
  {
    id: 'srv-102',
    channelId: 'ch-01',
    channelName: 'Saluran Primer Van Der Wijck',
    channelType: 'Primer',
    stationing: 'STA 0+300',
    surveyorName: 'Ari Wibowo',
    timestamp: '2026-06-01T11:30:00Z',
    coordinates: { lat: -7.7305, lng: 110.3512 },
    widthTop: { target: 3.5, actual: 3.20, deviation: -8.57, status: 'DEVIASI' }, // top width narrow
    widthBottom: { target: 2.0, actual: 1.85, deviation: -7.5, status: 'DEVIASI' },
    depth: { target: 1.8, actual: 1.70, deviation: -5.56, status: 'DEVIASI' },
    thickness: { target: 0.3, actual: 0.22, deviation: -26.67, status: 'DEVIASI' }, // lining critically thin
    overallStatus: 'KRITIS',
    deviationScore: 12.08,
    photoUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    photoWatermark: {
      coordinates: '-7.7305, 110.3512',
      timestamp: '2026-06-01 11:30:00 WIB',
      stationing: 'VAN_DER_WIJCK [STA 0+300]'
    },
    notes: 'Kritis! Terjadi penyempitan dimensi lebar atas dan ketebalan beton kurang dari 25% dari rencana, rawan jebol saat debit puncak.',
    isSynced: true
  },
  {
    id: 'srv-103',
    channelId: 'ch-02',
    channelName: 'Saluran Sekunder Moyudan',
    channelType: 'Sekunder',
    stationing: 'STA 0+150',
    surveyorName: 'Rian Hidayat',
    timestamp: '2026-06-02T10:00:00Z',
    coordinates: { lat: -7.7352, lng: 110.3552 },
    widthTop: { target: 2.0, actual: 2.05, deviation: 2.5, status: 'SESUAI' },
    widthBottom: { target: 1.2, actual: 1.22, deviation: 1.67, status: 'SESUAI' },
    depth: { target: 1.2, actual: 1.25, deviation: 4.17, status: 'SESUAI' },
    thickness: { target: 0.25, actual: 0.25, deviation: 0.0, status: 'SESUAI' },
    overallStatus: 'LAYAK',
    deviationScore: 2.09,
    photoUrl: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    photoWatermark: {
      coordinates: '-7.7352, 110.3552',
      timestamp: '2026-06-02 10:00:00 WIB',
      stationing: 'MOYUDAN [STA 0+150]'
    },
    notes: 'Dimensi saluran sekunder sangat presisi. Pasangan batu rapi dan mortar siar penuh filled properly.',
    isSynced: true
  },
  {
    id: 'srv-104',
    channelId: 'ch-02',
    channelName: 'Saluran Sekunder Moyudan',
    channelType: 'Sekunder',
    stationing: 'STA 0+500',
    surveyorName: 'Rian Hidayat',
    timestamp: '2026-06-02T14:20:00Z',
    coordinates: { lat: -7.7422, lng: 110.3572 },
    widthTop: { target: 2.0, actual: 1.90, deviation: -5.0, status: 'DEVIASI' },
    widthBottom: { target: 1.2, actual: 1.15, deviation: -4.17, status: 'SESUAI' },
    depth: { target: 1.2, actual: 1.10, deviation: -8.33, status: 'DEVIASI' },
    thickness: { target: 0.25, actual: 0.21, deviation: -16.0, status: 'DEVIASI' },
    overallStatus: 'BUTUH_PERBAIKAN',
    deviationScore: 8.38,
    photoUrl: 'https://images.unsplash.com/photo-1578345218746-50a229b3d0f8?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    photoWatermark: {
      coordinates: '-7.7422, 110.3572',
      timestamp: '2026-06-02 14:20:00 WIB',
      stationing: 'MOYUDAN [STA 0+500]'
    },
    notes: 'Kedalaman berdeviasi negatif karena penimbunan sedimen sisa plesteran. Tebal dinding juga tipis di beberapa section.',
    isSynced: false
  },
  {
    id: 'srv-105',
    channelId: 'ch-05',
    channelName: 'Saluran Tersier Kenanga-3',
    channelType: 'Tersier',
    stationing: 'STA 0+220',
    surveyorName: 'Dewi Lestari',
    timestamp: '2026-06-03T08:40:00Z',
    coordinates: { lat: -7.7431, lng: 110.3651 },
    widthTop: { target: 1.0, actual: 1.05, deviation: 5.0, status: 'SESUAI' },
    widthBottom: { target: 0.6, actual: 0.61, deviation: 1.67, status: 'SESUAI' },
    depth: { target: 0.6, actual: 0.58, deviation: -3.33, status: 'SESUAI' },
    thickness: { target: 0.15, actual: 0.16, deviation: 6.67, status: 'SESUAI' },
    overallStatus: 'LAYAK',
    deviationScore: 4.17,
    photoUrl: 'https://images.unsplash.com/photo-1542060748-10c28b629f6f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    photoWatermark: {
      coordinates: '-7.7431, 110.3651',
      timestamp: '2026-06-03 08:40:00 WIB',
      stationing: 'KENANGA_3 [STA 0+220]'
    },
    notes: 'Tersier Kenanga stabil, pengerjaan lining precast rapi dan presisi.',
    isSynced: false
  }
];

export const MOCK_SURVEYOR_LIST = [
  'Ari Wibowo',
  'Rian Hidayat',
  'Dewi Lestari',
  'Fajar Pratama'
];
