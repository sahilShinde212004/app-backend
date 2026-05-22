const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
    // Create temporary input and output files
    const tempDir = os.tmpdir();
    const inputFile = path.join(tempDir, `input_${Date.now()}.${inputFormat}`);
    const outputFile = path.join(tempDir, `output_${Date.now()}.mp3`);

    try {
      // Write buffer to temp input file
      fs.writeFileSync(inputFile, inputBuffer);
      console.log(`[FFmpeg] Input file created: ${inputFile}`);

      // Convert using ffmpeg
      ffmpeg(inputFile)
        .toFormat('mp3')
        .audioBitrate('192k')
        .audioChannels(2)
        .audioFrequency(44100)
        .on('error', (err) => {
          console.error('[FFmpeg] Conversion error:', err.message);
          // Clean up temp files
          if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
          if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
          reject(new Error(`FFmpeg conversion failed: ${err.message}`));
        })
        .on('end', () => {
          console.log('[FFmpeg] ✅ Conversion complete');
          try {
            // Read output file and convert to buffer
            const mp3Buffer = fs.readFileSync(outputFile);
            // Clean up temp files
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            resolve(mp3Buffer);
          } catch (err) {
            reject(err);
          }
        })
        .save(outputFile);
    } catch (err) {
      console.error('[FFmpeg] Error:', err.message);
      // Clean up on error
      if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
      if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      reject(err);
    }
  });
}

module.exports = { convertToMp3 };

module.exports = { convertToMp3 };
