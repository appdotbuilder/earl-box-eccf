import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { getFileStats } from '../handlers/get_file_stats';

describe('getFileStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats when no files exist', async () => {
    const stats = await getFileStats();

    expect(stats.total_files).toEqual(0);
    expect(stats.total_size).toEqual(0);
  });

  it('should return correct stats for single file', async () => {
    // Insert a test file
    await db.insert(filesTable)
      .values({
        filename: 'test-file-1.txt',
        original_name: 'original-file.txt',
        mime_type: 'text/plain',
        file_size: 1024,
        file_path: '/uploads/test-file-1.txt'
      })
      .execute();

    const stats = await getFileStats();

    expect(stats.total_files).toEqual(1);
    expect(stats.total_size).toEqual(1024);
  });

  it('should return correct stats for multiple files', async () => {
    // Insert multiple test files with different sizes
    await db.insert(filesTable)
      .values([
        {
          filename: 'test-file-1.txt',
          original_name: 'file1.txt',
          mime_type: 'text/plain',
          file_size: 1024,
          file_path: '/uploads/test-file-1.txt'
        },
        {
          filename: 'test-file-2.jpg',
          original_name: 'image.jpg',
          mime_type: 'image/jpeg',
          file_size: 2048,
          file_path: '/uploads/test-file-2.jpg'
        },
        {
          filename: 'test-file-3.pdf',
          original_name: 'document.pdf',
          mime_type: 'application/pdf',
          file_size: 4096,
          file_path: '/uploads/test-file-3.pdf'
        }
      ])
      .execute();

    const stats = await getFileStats();

    expect(stats.total_files).toEqual(3);
    expect(stats.total_size).toEqual(7168); // 1024 + 2048 + 4096
  });

  it('should handle large file sizes correctly', async () => {
    // Insert a file with a large size (100MB)
    const largeFileSize = 100 * 1024 * 1024; // 100MB in bytes

    await db.insert(filesTable)
      .values({
        filename: 'large-file.bin',
        original_name: 'large-file.bin',
        mime_type: 'application/octet-stream',
        file_size: largeFileSize,
        file_path: '/uploads/large-file.bin'
      })
      .execute();

    const stats = await getFileStats();

    expect(stats.total_files).toEqual(1);
    expect(stats.total_size).toEqual(largeFileSize);
    expect(typeof stats.total_size).toBe('number');
  });

  it('should return correct data types', async () => {
    // Insert a test file
    await db.insert(filesTable)
      .values({
        filename: 'test-file.txt',
        original_name: 'test.txt',
        mime_type: 'text/plain',
        file_size: 512,
        file_path: '/uploads/test-file.txt'
      })
      .execute();

    const stats = await getFileStats();

    expect(typeof stats.total_files).toBe('number');
    expect(typeof stats.total_size).toBe('number');
    expect(Number.isInteger(stats.total_files)).toBe(true);
    expect(Number.isInteger(stats.total_size)).toBe(true);
  });
});