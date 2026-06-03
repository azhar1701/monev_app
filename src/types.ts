/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DimensionData {
  target: number; // in meters
  actual: number; // in meters
  deviation: number; // percentage deviation
  status: 'SESUAI' | 'DEVIASI';
}

export interface SurveyRecord {
  id: string;
  channelId: string;
  channelName: string;
  channelType: 'Primer' | 'Sekunder' | 'Tersier';
  stationing: string; // e.g., "STA 0+150"
  surveyorName: string;
  timestamp: string;
  coordinates: Coordinates;
  
  // Dimensions
  widthTop: DimensionData;      // W1 (Lebar Atas)
  widthBottom: DimensionData;   // W2 (Lebar Bawah)
  depth: DimensionData;         // H (Kedalaman/Tinggi)
  thickness: DimensionData;     // T (Tebal Lining)
  
  // Evaluation Result
  overallStatus: 'LAYAK' | 'BUTUH_PERBAIKAN' | 'KRITIS';
  deviationScore: number; // average absolute deviation %
  
  // Attachments & Extras
  photoUrl: string | null;
  photoWatermark: {
    coordinates: string;
    timestamp: string;
    stationing: string;
  } | null;
  notes: string;
  isSynced: boolean;
}

export interface ChannelSegment {
  id: string;
  name: string;
  type: 'Primer' | 'Sekunder' | 'Tersier';
  length: number; // in meters
  coordinates: Coordinates[]; // for polyline
  status: 'COMPLETE' | 'PARTIAL' | 'PENDING';
  progress: number; // percentage evaluated
}
