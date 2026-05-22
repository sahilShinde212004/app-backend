const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads an audio buffer to Cloudinary.
 * Folder structure: Date/ClassName/SubjectName/Lecture-timestamp
 */
async function uploadToCloudinary(fileBuffer, className, subjectName) {
  const dateStr = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();
  const folder = `${dateStr}/${className}/${subjectName}`;
  const publicId = `${folder}/Lecture-${timestamp}`;

  console.log(`[Cloudinary] Uploading to: ${publicId}`);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video', // audio files use 'video' type in Cloudinary
        public_id: publicId,
        overwrite: false,
        format: 'webm',
      },
      (error, result) => {
        if (error) {
          console.error('[Cloudinary] Upload error:', error.message);
          return reject(new Error(error.message));
        }
        console.log(`[Cloudinary] ✅ Upload complete: ${result.secure_url}`);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

module.exports = { uploadToCloudinary };
