const { GoogleAuth } = require('google-auth-library');
const { google } = require('googleapis');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const { gid } = req.query;
  if (!gid) return res.status(400).json({ error: 'gid required' });

  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const SHEET_ID = '1pAWQc6th_5QZd3-kqenEUz1AbC19CoQRsCorxGEWy9I';
    
    // Buscar nome da aba pelo gid
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    const sheet = meta.data.sheets.find(s => String(s.properties.sheetId) === String(gid));
    if (!sheet) return res.status(404).json({ error: 'sheet not found' });
    
    const sheetName = sheet.properties.title;
    const data = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: sheetName,
    });

    // Converter para CSV
    const rows = data.data.values || [];
    const csv = rows.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
