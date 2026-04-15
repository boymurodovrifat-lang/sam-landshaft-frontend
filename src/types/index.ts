// Sam-Landshaft — Common Types

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  unit?: string;           // e.g. "dS/m", "%"
  colorScheme?: string;    // JSON with color stops
  minValue?: number;
  maxValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface GeotiffFile {
  id: number;
  categoryId: number;
  category?: Category;
  year: number;
  filename: string;
  cogPath: string;        // Path on server
  cogUrl: string;         // Public URL
  originalPath: string;   // Original GeoTIFF for download
  downloadUrl: string;
  fileSize: number;
  bounds?: [number, number, number, number]; // [minX, minY, maxX, maxY]
  width?: number;
  height?: number;
  uploadedAt: string;
  updatedAt: string;
}

export interface Admin {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  admin: Admin;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface CategoryPayload {
  name: string;
  slug: string;
  description?: string;
  unit?: string;
  colorScheme?: string;
  minValue?: number;
  maxValue?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
