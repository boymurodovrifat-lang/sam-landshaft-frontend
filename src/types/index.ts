// Sam-Landshaft — Common Types

export interface Category {
  id: number;
  parentId?: number | null;
  name: string;
  slug: string;
  description?: string;
  unit?: string;
  colorScheme?: string;
  minValue?: number;
  maxValue?: number;
  sortOrder?: number;
  children?: Category[];
  parent?: Category | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeotiffFile {
  id: number;
  categoryId: number;
  category?: Category;
  year: number;
  filename: string;
  cogUrl: string;         // Public URL
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
  parentId?: number | null;
  name: string;
  slug: string;
  description?: string;
  unit?: string;
  colorScheme?: string;
  minValue?: number;
  maxValue?: number;
  sortOrder?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
