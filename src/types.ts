export interface DocumentInfo {
  path: string;
  content: string;
  embedding?: number[];
  created: Date;
  updated: Date;
}

export interface SearchResult {
  path: string;
  score: number;
  snippet: string;
  content: string;
}

export interface SitemapNode {
  type: 'file' | 'folder';
  name: string;
  path?: string;
  children?: SitemapNode[];
}

export interface Sitemap {
  root: string;
  structure: SitemapNode[];
}

export interface HealthStatus {
  status: 'ok' | 'error';
  service: string;
  timestamp: string;
}

export interface ServiceMetrics {
  uptime: number;
  total_requests: number;
  active_sessions: number;
  documents_count: number;
} 