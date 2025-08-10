import { db } from '../db';
import { filesTable } from '../db/schema';
import { type UploadFileInput, type File } from '../schema';

export async function uploadFile(input: UploadFileInput): Promise<File> {
  try {
    // Insert file record into the database
    const result = await db.insert(filesTable)
      .values({
        filename: input.filename,
        original_name: input.original_name,
        mime_type: input.mime_type,
        file_size: input.file_size,
        file_path: input.file_path
        // id, upload_date, and download_count have defaults set in schema
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('File upload failed:', error);
    throw error;
  }
}