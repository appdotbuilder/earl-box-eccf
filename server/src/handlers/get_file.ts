import { db } from '../db';
import { filesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type GetFileInput, type File } from '../schema';

export async function getFile(input: GetFileInput): Promise<File | null> {
  try {
    // Query the database for a file with the given UUID
    const result = await db.select()
      .from(filesTable)
      .where(eq(filesTable.id, input.id))
      .execute();

    // Return the file if found, null if not found
    if (result.length === 0) {
      return null;
    }

    const file = result[0];
    return {
      ...file,
      // Note: All fields are already correct types from the database
      // No numeric conversions needed since file_size and download_count are integers
      upload_date: file.upload_date // Already a Date object from timestamp column
    };
  } catch (error) {
    console.error('File retrieval failed:', error);
    throw error;
  }
}