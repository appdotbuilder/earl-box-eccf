import { db } from '../db';
import { filesTable } from '../db/schema';
import { type IncrementDownloadInput } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const incrementDownloadCount = async (input: IncrementDownloadInput): Promise<void> => {
  try {
    // Increment the download count for the file with the given ID
    await db.update(filesTable)
      .set({
        download_count: sql`${filesTable.download_count} + 1`
      })
      .where(eq(filesTable.id, input.id))
      .execute();
  } catch (error) {
    console.error('Failed to increment download count:', error);
    throw error;
  }
};