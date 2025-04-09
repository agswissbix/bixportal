// lib/parseFormData.ts
import { IncomingForm } from 'formidable';
import { Readable } from 'stream';

export async function parseFormData(req: Request): Promise<{ fields: any; files: any }> {
  const form = new IncomingForm({ multiples: true, keepExtensions: true });

  // Otteniamo lo stream del body
  const stream = Readable.fromWeb(req.body as any) as any;

  // Aggiungiamo gli headers HTTP in modo che formidable funzioni
  stream.headers = Object.fromEntries(req.headers.entries());

  return new Promise((resolve, reject) => {
    form.parse(stream, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}
