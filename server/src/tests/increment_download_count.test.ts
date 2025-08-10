import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { filesTable } from '../db/schema';
import { type IncrementDownloadInput, type UploadFileInput } from '../schema';
import { incrementDownloadCount } from '../handlers/increment_download_count';
import { eq } from 'drizzle-orm';

const testFileInput: UploadFileInput = {
  filename: 'test-file-123.pdf',
  original_name: 'test-document.pdf',
  mime_type: 'application/pdf',
  file_size: 1024000, // 1MB
  file_path: '/uploads/test-file-123.pdf'
};

describe('incrementDownloadCount', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should increment download count by 1', async () => {
    // Create a test file with initial download count of 0
    const insertResult = await db.insert(filesTable)
      .values({
        ...testFileInput,
        download_count: 0
      })
      .returning()
      .execute();

    const fileId = insertResult[0].id;

    // Increment download count
    const input: IncrementDownloadInput = { id: fileId };
    await incrementDownloadCount(input);

    // Verify download count was incremented
    const files = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, fileId))
      .execute();

    expect(files).toHaveLength(1);
    expect(files[0].download_count).toEqual(1);
  });

  it('should increment download count from existing non-zero value', async () => {
    // Create a test file with initial download count of 5
    const insertResult = await db.insert(filesTable)
      .values({
        ...testFileInput,
        download_count: 5
      })
      .returning()
      .execute();

    const fileId = insertResult[0].id;

    // Increment download count
    const input: IncrementDownloadInput = { id: fileId };
    await incrementDownloadCount(input);

    // Verify download count was incremented to 6
    const files = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, fileId))
      .execute();

    expect(files).toHaveLength(1);
    expect(files[0].download_count).toEqual(6);
  });

  it('should handle multiple increments correctly', async () => {
    // Create a test file
    const insertResult = await db.insert(filesTable)
      .values({
        ...testFileInput,
        download_count: 0
      })
      .returning()
      .execute();

    const fileId = insertResult[0].id;
    const input: IncrementDownloadInput = { id: fileId };

    // Increment multiple times
    await incrementDownloadCount(input);
    await incrementDownloadCount(input);
    await incrementDownloadCount(input);

    // Verify download count is now 3
    const files = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, fileId))
      .execute();

    expect(files).toHaveLength(1);
    expect(files[0].download_count).toEqual(3);
  });

  it('should not affect other files when incrementing', async () => {
    // Create two test files
    const insertResult1 = await db.insert(filesTable)
      .values({
        ...testFileInput,
        filename: 'file1.pdf',
        file_path: '/uploads/file1.pdf',
        download_count: 2
      })
      .returning()
      .execute();

    const insertResult2 = await db.insert(filesTable)
      .values({
        ...testFileInput,
        filename: 'file2.pdf',
        file_path: '/uploads/file2.pdf',
        download_count: 10
      })
      .returning()
      .execute();

    const file1Id = insertResult1[0].id;
    const file2Id = insertResult2[0].id;

    // Increment download count for file1 only
    const input: IncrementDownloadInput = { id: file1Id };
    await incrementDownloadCount(input);

    // Verify file1 was incremented and file2 was not affected
    const file1 = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, file1Id))
      .execute();

    const file2 = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, file2Id))
      .execute();

    expect(file1[0].download_count).toEqual(3); // Incremented from 2 to 3
    expect(file2[0].download_count).toEqual(10); // Unchanged
  });

  it('should handle non-existent file ID gracefully', async () => {
    // Use a valid UUID format that doesn't exist in database
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';
    const input: IncrementDownloadInput = { id: nonExistentId };

    // Should not throw an error, but also should not affect any records
    await expect(incrementDownloadCount(input)).resolves.toBeUndefined();

    // Verify no files were affected (database should be empty)
    const allFiles = await db.select().from(filesTable).execute();
    expect(allFiles).toHaveLength(0);
  });
});