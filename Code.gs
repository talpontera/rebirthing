function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  
  // Format the date
  const date = new Date(data.submissionDate);
  const formattedDate = Utilities.formatDate(date, "Asia/Jerusalem", "dd/MM/yyyy HH:mm:ss");
  
  // Add row to sheet
  sheet.appendRow([
    formattedDate,
    data.name,
    data.phone,
    data.email,
    data.session,
    data.experience,
    data.health,
    data.healthInfo
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
} 