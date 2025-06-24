import { NextRequest } from 'next/server';
import busboy from 'busboy';
import { writeFile } from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';

interface FormField {
  name: string;
  value: string;
}

interface FormFile {
  name: string;
  file: NodeJS.ReadableStream;
  info: busboy.FileInfo;
}

export async function parseFormData(request: NextRequest): Promise<{ fields: Record<string, string>, files: Record<string, { path: string, name: string }> }> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: Object.fromEntries(request.headers.entries()) });
    const fields: Record<string, string> = {};
    const files: Record<string, { path: string, name: string }> = {};
    const fileWrites: Promise<void>[] = [];

    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      if (!filename) return;

      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedMimeTypes.includes(mimeType.toLowerCase())) {
        // Stop processing this file and signal an error.
        file.resume(); // Consume the stream to discard it.
        return bb.emit('error', new Error(`File type not allowed: ${mimeType}. Only PNG, JPG, and JPEG are allowed.`));
      }

      const saveTo = path.join(process.cwd(), 'public', 'uploads', filename);
      
      const chunks: Buffer[] = [];
      file.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      const writePromise = new Promise<void>((resolve, reject) => {
        file.on('end', async () => {
          try {
            const buffer = Buffer.concat(chunks);
            await writeFile(saveTo, buffer);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
        file.on('error', reject);
      });
      
      fileWrites.push(writePromise);
      files[name] = { path: `/uploads/${filename}`, name: filename };
    });

    bb.on('close', async () => {
      try {
        await Promise.all(fileWrites);
        resolve({ fields, files });
      } catch (err) {
        reject(err);
      }
    });

    bb.on('error', (err) => {
      reject(err);
    });

    if (request.body) {
        const reader = request.body.getReader();
        const stream = new Readable({
            async read() {
                const { done, value } = await reader.read();
                if (done) {
                    this.push(null);
                } else {
                    this.push(value);
                }
            }
        });
        stream.pipe(bb);
    } else {
        reject(new Error("Request body is null"));
    }
  });
}
