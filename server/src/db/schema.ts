import { pgTable, text, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

export const filesTable = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(), // UUID for unique file identification
  filename: text('filename').notNull(), // Generated filename on server
  original_name: text('original_name').notNull(), // Original filename from user
  mime_type: text('mime_type').notNull(), // MIME type for proper content serving
  file_size: integer('file_size').notNull(), // File size in bytes
  file_path: text('file_path').notNull(), // Path to file in uploads folder
  upload_date: timestamp('upload_date').defaultNow().notNull(),
  download_count: integer('download_count').default(0).notNull() // Track how many times file was accessed
});

// TypeScript types for the table schema
export type File = typeof filesTable.$inferSelect; // For SELECT operations
export type NewFile = typeof filesTable.$inferInsert; // For INSERT operations

// Important: Export all tables for proper query building
export const tables = { files: filesTable };