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
    const timestamp = Date.now();
    const inputFile = path.join(tempDir, `input_${timestamp}.${inputFormat}`);
    const outputFile = path.join(tempDir, `output_${timestamp}.mp3`);

    try {
      // Validate input buffer
      if (!inputBuffer || inputBuffer.length === 0) {
        throw new Error('Input buffer is empty');
      }

      console.log(`[FFmpeg] Input: ${inputFormat}, Size: ${inputBuffer.length} bytes`);
      
      // Write buffer to temp input file
      fs.writeFileSync(inputFile, inputBuffer);
      
      if (!fs.existsSync(inputFile)) {
        throw new Error('Failed to create temp input file');
      }

      const stats = fs.statSync(inputFile);
      console.log(`[FFmpeg] Input file created: ${inputFile} (${stats.size} bytes)`);

      // Convert using ffmpeg with additional options
      ffmpeg(inputFile)
        .toFormat('mp3')
        .audioBitrate('192k')
        .audioChannels(2)
        .audioFrequency(44100)
        .outputOptions('-loglevel', 'error')
        .on('start', (cmd) => {
          console.log('[FFmpeg] FFmpeg process started');
        })
        .on('error', (err) => {
          console.error('[FFmpeg] Conversion error:', err.message);
          // Clean up temp files
          try {
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
          } catch (e) {}
          reject(new Error(`FFmpeg conversion failed: ${err.message}`));
        })
        .on('end', () => {
          console.log('[FFmpeg] ✅ Conversion complete');
          try {
            if (!fs.existsSync(outputFile)) {
              throw new Error('Output file was not created');
            }
            // Read output file and convert to buffer
            const mp3Buffer = fs.readFileSync(outputFile);
            console.log(`[FFmpeg] Output file size: ${mp3Buffer.length} bytes`);
            
            // Clean up temp files
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            resolve(mp3Buffer);
          } catch (err) {
            reject(new Error(`Failed to read output file: ${err.message}`));
          }
        })
        .save(outputFile);
    } catch (err) {
      console.error('[FFmpeg] Error:', err.message);
      // Clean up on error
      try {
        if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
      } catch (e) {}
      reject(err);
    }
  });
}

module.exports = { convertToMp3 };

module.exports = { convertToMp3 };
