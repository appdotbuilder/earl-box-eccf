import { db } from '../db';
import { filesTable } from '../db/schema';
import { type FileStats } from '../schema';
import { count, sum } from 'drizzle-orm';

export const getFileStats = async (): Promise<FileStats> => {
  try {
    // Query to get total count of files and sum of all file sizes
    const result = await db
      .select({
        total_files: count(filesTable.id),
        total_size: sum(filesTable.file_size)
      })
      .from(filesTable)
      .execute();

    // Extract the first (and only) result
    const stats = result[0];

    return {
      total_files: stats.total_files || 0,
      total_size: stats.total_size ? parseInt(stats.total_size.toString()) : 0
    };
  } catch (error) {
    console.error('Failed to retrieve file statistics:', error);
    throw error;
  }
};