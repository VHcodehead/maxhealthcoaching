import fs from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './data/uploads';

function resolvePath(filePath: string): string {
  // Prevent path traversal
  const normalized = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  return path.join(UPLOAD_DIR, normalized);
}

export async function saveFile(filePath: string, data: Buffer): Promise<string> {
  const fullPath = resolvePath(filePath);
  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, data);
  return filePath;
}

export async function getFile(filePath: string): Promise<Buffer> {
  const fullPath = resolvePath(filePath);
  return fs.readFile(fullPath);
}

export async function deleteFile(filePath: string): Promise<void> {
  const fullPath = resolvePath(filePath);
  try {
    await fs.unlink(fullPath);
  } catch {
    // File may not exist, ignore
  }
}
