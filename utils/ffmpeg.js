const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const path = require('path');

// Set ffmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Converts audio buffer to MP3 format
 * @param {Buffer} inputBuffer - Input audio buffer (M4A, WAV, etc.)
 * @param {string} inputFormat - Input format (optional, e.g., 'aac', 'wav', 'm4a')
 * @returns {Promise<Buffer>} - MP3 buffer
 */
function convertToMp3(inputBuffer, inputFormat = 'aac') {
  return new Promise((resolve, reject) => {
    const chunks = [];

    ffmpeg(inputBuffer)
      .inputFormat(inputFormat)
      .toFormat('mp3')
      .audioBitrate('192k')
      .audioChannels(2)
      .audioFrequency(44100)
      .on('error', (err) => {
        console.error('[FFmpeg] Conversion error:', err.message);
        reject(new Error(`FFmpeg conversion failed: ${err.message}`));
      })
      .on('end', () => {
        console.log('[FFmpeg] ✅ Conversion complete');
        resolve(Buffer.concat(chunks));
      })
      .pipe()
      .on('data', (chunk) => {
        chunks.push(chunk);
      })
      .on('error', (err) => {
        console.error('[FFmpeg Stream] Error:', err.message);
        reject(err);
      });
  });
}

module.exports = { convertToMp3 };
