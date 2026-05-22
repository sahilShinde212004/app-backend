const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

const TOKENS_PATH = path.join(__dirname, '..', 'google-tokens.json');

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
  );
}

function getAuthUrl() {
  const oAuth2Client = getOAuthClient();
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/drive'],
  });
}

async function getAuthorizedClient() {
  if (!fs.existsSync(TOKENS_PATH)) {
    throw new Error('NOT_AUTHORIZED');
  }
  const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
  const oAuth2Client = getOAuthClient();
  oAuth2Client.setCredentials(tokens);

  oAuth2Client.on('tokens', (newTokens) => {
    const updated = { ...tokens, ...newTokens };
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(updated, null, 2));
    console.log('[Drive] Token refreshed.');
  });

  return oAuth2Client;
}

async function exchangeCodeForTokens(code) {
  const oAuth2Client = getOAuthClient();
  const { tokens } = await oAuth2Client.getToken(code);
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
  console.log('[Drive] Tokens saved to google-tokens.json');
  return tokens;
}

async function findOrCreateFolder(drive, folderName, parentId) {
  let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  if (parentId) query += ` and '${parentId}' in parents`;

  const res = await drive.files.list({ q: query, fields: 'files(id, name)', spaces: 'drive' });
  if (res.data.files.length > 0) {
    console.log(`[Drive] Found folder: "${folderName}" (${res.data.files[0].id})`);
    return res.data.files[0].id;
  }

  const folder = await drive.files.create({
    resource: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : [],
    },
    fields: 'id',
  });
  console.log(`[Drive] Created folder: "${folderName}" (${folder.data.id})`);
  return folder.data.id;
}

async function uploadToDrive(fileBuffer, fileName, mimeType, className, subjectName) {
  const auth = await getAuthorizedClient();
  const drive = google.drive({ version: 'v3', auth });

  const dateStr = new Date().toISOString().split('T')[0];
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null;

  console.log(`[Drive] Uploading: ${dateStr}/${className}/${subjectName}/${fileName}`);

  const dateFolderId    = await findOrCreateFolder(drive, dateStr, rootId);
  const classFolderId   = await findOrCreateFolder(drive, className, dateFolderId);
  const subjectFolderId = await findOrCreateFolder(drive, subjectName, classFolderId);

  const file = await drive.files.create({
    resource: { name: fileName, parents: [subjectFolderId] },
    media: { mimeType: mimeType || 'audio/webm', body: Readable.from(fileBuffer) },
    fields: 'id, name, webViewLink',
  });

  console.log(`[Drive] ✅ Upload complete: ${file.data.name} → ${file.data.webViewLink}`);
  return file.data;
}

module.exports = { getAuthUrl, exchangeCodeForTokens, uploadToDrive };
