import { createWriteStream } from 'fs';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { Readable } from 'stream';
import { NextResponse } from 'next/server';

const uploadDir = join(process.cwd(), 'public', 'uploads');

class ChunkedUploadStream extends Readable {
  private currentChunk: number;
  private buffer: Buffer;
  private chunkSize: number;
  private fileSize: number;

  constructor(buffer: Buffer, chunkSize: number) {
    super();
    this.buffer = buffer;
    this.chunkSize = chunkSize;
    this.currentChunk = 0;
    this.fileSize = buffer.length;
  }

  _read() {
    if (this.currentChunk >= this.buffer.length) {
      this.push(null);
    } else {
      const chunk = this.buffer.slice(
        this.currentChunk,
        this.currentChunk + this.chunkSize
      );
      this.push(chunk);
      this.currentChunk += this.chunkSize;

      // Simulate progress
      const progress = Math.min(
        100,
        Math.round((this.currentChunk / this.fileSize) * 100)
      );
      console.log(`Upload progress: ${progress}%`);
    }
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  const filename = file.name.replace(/\s+/g, '-').toLowerCase();
  const filepath = join(uploadDir, filename);

  try {
    // Simulate a slow upload process
    const chunkSize = 1024 * 10; // 10KB chunks
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const readable = new ChunkedUploadStream(buffer, chunkSize);

    // Write the file in chunks
    await new Promise<void>((resolve, reject) => {
      const writable = createWriteStream(filepath);
      readable.pipe(writable);
      writable.on('finish', resolve);
      writable.on('error', reject);
    });

    console.log(`File saved to ${filepath}`);

    // Simulate additional processing time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json({
      message: 'File uploaded successfully',
      filename,
      filepath,
      url: `/uploads/${filename}`,
    });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}

// const uploadDir = join(process.cwd(), 'public', 'uploads');

// export async function POST(request: Request): Promise<NextResponse> {
//   const formData = await request.formData();
//   const file = formData.get('file') as File | null;

//   if (!file) {
//     return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
//   }

//   const buffer = Buffer.from(await file.arrayBuffer());
//   const filename = file.name.replace(/\s+/g, '-').toLowerCase();
//   const filepath = join(uploadDir, filename);

//   try {
//     await writeFile(filepath, buffer);
//     console.log(`File saved to ${filepath}`);

//     return NextResponse.json({
//       message: 'File uploaded successfully',
//       filename,
//       filepath,
//       url: `/uploads/${filename}`,
//     });
//   } catch (error) {
//     console.error('Error saving file:', error);
//     return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
//   }
// }
