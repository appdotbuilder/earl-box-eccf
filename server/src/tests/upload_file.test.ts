import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type UploadFileInput } from '../schema';
import { uploadFile } from '../handlers/upload_file';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: UploadFileInput = {
  filename: 'test-file-123.pdf',
  original_name: 'document.pdf',
  mime_type: 'application/pdf',
  file_size: 1024000, // 1MB
  file_path: '/uploads/test-file-123.pdf'
};

describe('uploadFile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should upload a file successfully', async () => {
    const result = await uploadFile(testInput);

    // Verify all fields are returned correctly
    expect(result.filename).toEqual('test-file-123.pdf');
    expect(result.original_name).toEqual('document.pdf');
    expect(result.mime_type).toEqual('application/pdf');
    expect(result.file_size).toEqual(1024000);
    expect(result.file_path).toEqual('/uploads/test-file-123.pdf');
    
    // Verify generated fields
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
    expect(result.upload_date).toBeInstanceOf(Date);
    expect(result.download_count).toEqual(0);
  });

  it('should save file metadata to database', async () => {
    const result = await uploadFile(testInput);

    // Query database to verify the file was saved
    const savedFiles = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, result.id))
      .execute();

    expect(savedFiles).toHaveLength(1);
    const savedFile = savedFiles[0];
    
    expect(savedFile.filename).toEqual('test-file-123.pdf');
    expect(savedFile.original_name).toEqual('document.pdf');
    expect(savedFile.mime_type).toEqual('application/pdf');
    expect(savedFile.file_size).toEqual(1024000);
    expect(savedFile.file_path).toEqual('/uploads/test-file-123.pdf');
    expect(savedFile.upload_date).toBeInstanceOf(Date);
    expect(savedFile.download_count).toEqual(0);
  });

  it('should handle large files within size limit', async () => {
    const largeFileInput: UploadFileInput = {
      filename: 'large-video-456.mp4',
      original_name: 'presentation.mp4',
      mime_type: 'video/mp4',
      file_size: 150 * 1024 * 1024, // 150MB - within 200MB limit
      file_path: '/uploads/large-video-456.mp4'
    };

    const result = await uploadFile(largeFileInput);

    expect(result.filename).toEqual('large-video-456.mp4');
    expect(result.original_name).toEqual('presentation.mp4');
    expect(result.mime_type).toEqual('video/mp4');
    expect(result.file_size).toEqual(150 * 1024 * 1024);
    expect(result.id).toBeDefined();
  });

  it('should handle different file types correctly', async () => {
    const imageInput: UploadFileInput = {
      filename: 'photo-789.jpg',
      original_name: 'vacation.jpg',
      mime_type: 'image/jpeg',
      file_size: 2048576, // 2MB
      file_path: '/uploads/photo-789.jpg'
    };

    const result = await uploadFile(imageInput);

    expect(result.mime_type).toEqual('image/jpeg');
    expect(result.filename).toEqual('photo-789.jpg');
    expect(result.original_name).toEqual('vacation.jpg');
    
    // Verify in database
    const savedFiles = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, result.id))
      .execute();

    expect(savedFiles[0].mime_type).toEqual('image/jpeg');
  });

  it('should generate unique IDs for multiple uploads', async () => {
    const input1: UploadFileInput = {
      filename: 'file1.txt',
      original_name: 'document1.txt',
      mime_type: 'text/plain',
      file_size: 1024,
      file_path: '/uploads/file1.txt'
    };

    const input2: UploadFileInput = {
      filename: 'file2.txt',
      original_name: 'document2.txt',
      mime_type: 'text/plain',
      file_size: 2048,
      file_path: '/uploads/file2.txt'
    };

    const result1 = await uploadFile(input1);
    const result2 = await uploadFile(input2);

    // IDs should be different
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();

    // Both should be saved to database
    const allFiles = await db.select().from(filesTable).execute();
    expect(allFiles).toHaveLength(2);
  });

  it('should preserve upload timestamps', async () => {
    const beforeUpload = new Date();
    
    const result = await uploadFile(testInput);
    
    const afterUpload = new Date();

    expect(result.upload_date).toBeInstanceOf(Date);
    expect(result.upload_date.getTime()).toBeGreaterThanOrEqual(beforeUpload.getTime());
    expect(result.upload_date.getTime()).toBeLessThanOrEqual(afterUpload.getTime());
  });
});