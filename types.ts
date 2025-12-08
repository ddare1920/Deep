export enum Sender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isStreaming?: boolean;
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string; // Base64 string without prefix
  mimeType: string;
}

export interface MaintenanceItem {
  component: string;
  interval: string;
  task: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface ChartDataPoint {
  name: string;
  value: number;
  category: string;
}
