import { z } from 'zod';

// File upload schema
export const fileSchema = z.object({
  id: z.string(), // UUID for unique file identification
  filename: z.string(),
  original_name: z.string(),
  mime_type: z.string(),
  file_size: z.number().int(), // File size in bytes
  file_path: z.string(), // Path to file in uploads folder
  upload_date: z.coerce.date(),
  download_count: z.number().int().default(0)
});

export type File = z.infer<typeof fileSchema>;

// Input schema for file upload
export const uploadFileInputSchema = z.object({
  filename: z.string(),
  original_name: z.string(),
  mime_type: z.string(),
  file_size: z.number().int().max(200 * 1024 * 1024), // 200MB max size
  file_path: z.string()
});

export type UploadFileInput = z.infer<typeof uploadFileInputSchema>;

// Schema for file retrieval by ID
export const getFileInputSchema = z.object({
  id: z.string().uuid()
});

export type GetFileInput = z.infer<typeof getFileInputSchema>;

// Schema for file statistics
export const fileStatsSchema = z.object({
  total_files: z.number().int(),
  total_size: z.number().int()
});

export type FileStats = z.infer<typeof fileStatsSchema>;

// Schema for file download tracking
export const incrementDownloadInputSchema = z.object({
  id: z.string().uuid()
});

export type IncrementDownloadInput = z.infer<typeof incrementDownloadInputSchema>;