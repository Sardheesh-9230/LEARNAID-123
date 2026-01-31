/*
  Deletes a single Material record ONLY if its referenced file is missing on disk.

  Usage:
    node delete-missing-material.js <materialId>

  Notes:
  - Uses backend/.env (MONGODB_URI)
  - Also deletes the linked File document (if present)
*/

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '.env') });

const Material = require('./src/models/Material');
const File = require('./src/models/File');

const normalizeStoredPath = (p) => (typeof p === 'string' ? p.replace(/\\/g, '/') : p);

const fileExists = (p) => {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
};

async function resolvePhysicalPath(material) {
  const meta = material?.fileMetadata || {};
  const stored = normalizeStoredPath(meta.filePath || meta.path);
  const basename = stored ? path.basename(stored) : undefined;

  const candidates = [];
  if (stored) candidates.push(path.join(process.cwd(), stored));
  if (basename) {
    candidates.push(path.join(process.cwd(), 'uploads', 'materials', basename));
    candidates.push(path.join(process.cwd(), 'backend', 'uploads', 'materials', basename));
  }

  for (const c of candidates) {
    if (fileExists(c)) return c;
  }

  // Try File record path too
  if (material?.file) {
    const fileDoc = await File.findById(material.file).select('path filename').lean();
    const filePath = normalizeStoredPath(fileDoc?.path);
    if (filePath) {
      const c1 = path.join(process.cwd(), filePath);
      if (fileExists(c1)) return c1;
      const bn = path.basename(filePath || fileDoc?.filename || '');
      if (bn) {
        const c2 = path.join(process.cwd(), 'uploads', 'materials', bn);
        if (fileExists(c2)) return c2;
      }
    }
  }

  return null;
}

async function main() {
  const materialId = process.argv[2];
  if (!materialId) {
    console.error('Usage: node delete-missing-material.js <materialId>');
    process.exit(1);
  }

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const material = await Material.findById(materialId);
  if (!material) {
    console.error('Material not found:', materialId);
    await mongoose.disconnect();
    process.exit(1);
  }

  const physicalPath = await resolvePhysicalPath(material);

  if (physicalPath) {
    console.log('✅ File exists on disk. Not deleting.');
    console.log('Material:', material._id.toString(), '-', material.title);
    console.log('File path:', physicalPath);
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('⚠️ File missing on disk. Deleting material record.');
  console.log('Material:', material._id.toString(), '-', material.title);
  console.log('Stored fileMetadata.filePath:', material.fileMetadata?.filePath);

  const fileId = material.file;

  await material.deleteOne();
  console.log('✅ Deleted Material:', materialId);

  if (fileId) {
    const deleted = await File.findByIdAndDelete(fileId);
    if (deleted) {
      console.log('✅ Deleted linked File:', fileId.toString());
    } else {
      console.log('ℹ️ Linked File not found (already deleted):', fileId.toString());
    }
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
