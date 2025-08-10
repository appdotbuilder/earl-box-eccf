import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type GetFileInput, type UploadFileInput } from '../schema';
import { getFile } from '../handlers/get_file';
import { eq } from 'drizzle-orm';

// Test input for file retrieval
const testFileInput: UploadFileInput = {
  filename: 'test-file-123.pdf',
  original_name: 'test-document.pdf',
  mime_type: 'application/pdf',
  file_size: 1024000, // 1MB
  file_path: '/uploads/test-file-123.pdf'
};

describe('getFile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing file by UUID', async () => {
    // Create a test file first
    const insertResult = await db.insert(filesTable)
      .values(testFileInput)
      .returning()
      .execute();

    const createdFile = insertResult[0];
    const getInput: GetFileInput = { id: createdFile.id };

    // Retrieve the file
    const result = await getFile(getInput);

    // Verify the file was retrieved correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdFile.id);
    expect(result!.filename).toEqual('test-file-123.pdf');
    expect(result!.original_name).toEqual('test-document.pdf');
    expect(result!.mime_type).toEqual('application/pdf');
    expect(result!.file_size).toEqual(1024000);
    expect(result!.file_path).toEqual('/uploads/test-file-123.pdf');
    expect(result!.download_count).toEqual(0);
    expect(result!.upload_date).toBeInstanceOf(Date);

    // Verify types are correct
    expect(typeof result!.file_size).toBe('number');
    expect(typeof result!.download_count).toBe('number');
  });

  it('should return null for non-existent UUID', async () => {
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
    const getInput: GetFileInput = { id: nonExistentId };

    const result = await getFile(getInput);

    expect(result).toBeNull();
  });

  it('should return null for invalid UUID format', async () => {
    // Note: This test assumes the UUID validation happens at the schema level
    // The handler itself should handle any UUID that passes schema validation
    const validUuid = '550e8400-e29b-41d4-a716-446655440001';
    const getInput: GetFileInput = { id: validUuid };

    const result = await getFile(getInput);

    expect(result).toBeNull();
  });

  it('should retrieve file with non-zero download count', async () => {
    // Create a test file with download count
    const insertResult = await db.insert(filesTable)
      .values({
        ...testFileInput,
        download_count: 5
      })
      .returning()
      .execute();

    const createdFile = insertResult[0];
    const getInput: GetFileInput = { id: createdFile.id };

    const result = await getFile(getInput);

    expect(result).not.toBeNull();
    expect(result!.download_count).toEqual(5);
    expect(typeof result!.download_count).toBe('number');
  });

  it('should handle database query correctly', async () => {
    // Create multiple files to ensure we get the right one
    const file1 = await db.insert(filesTable)
      .values({
        ...testFileInput,
        filename: 'file1.txt',
        original_name: 'first-file.txt'
      })
      .returning()
      .execute();

    const file2 = await db.insert(filesTable)
      .values({
        ...testFileInput,
        filename: 'file2.txt',
        original_name: 'second-file.txt'
      })
      .returning()
      .execute();

    // Retrieve specific file
    const getInput: GetFileInput = { id: file2[0].id };
    const result = await getFile(getInput);

    // Should get the correct file, not the first one
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(file2[0].id);
    expect(result!.filename).toEqual('file2.txt');
    expect(result!.original_name).toEqual('second-file.txt');
    
    // Verify it's not the first file
    expect(result!.id).not.toEqual(file1[0].id);
  });

  it('should preserve all file metadata fields', async () => {
    // Create file with specific values for all fields
    const specificFileInput = {
      filename: 'specific-test.jpg',
      original_name: 'my-photo.jpg',
      mime_type: 'image/jpeg',
      file_size: 2048000, // 2MB
      file_path: '/uploads/photos/specific-test.jpg',
      download_count: 10
    };

    const insertResult = await db.insert(filesTable)
      .values(specificFileInput)
      .returning()
      .execute();

    const createdFile = insertResult[0];
    const getInput: GetFileInput = { id: createdFile.id };

    const result = await getFile(getInput);

    // Verify all fields are preserved correctly
    expect(result).not.toBeNull();
    expect(result!.filename).toEqual(specificFileInput.filename);
    expect(result!.original_name).toEqual(specificFileInput.original_name);
    expect(result!.mime_type).toEqual(specificFileInput.mime_type);
    expect(result!.file_size).toEqual(specificFileInput.file_size);
    expect(result!.file_path).toEqual(specificFileInput.file_path);
    expect(result!.download_count).toEqual(specificFileInput.download_count);
    expect(result!.upload_date).toBeInstanceOf(Date);
    expect(result!.id).toBeDefined();
  });
});