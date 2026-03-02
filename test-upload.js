const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testUpload() {
  const form = new FormData();
  fs.writeFileSync('test.pdf', 'dummy pdf content');
  form.append('evidence', fs.createReadStream('test.pdf'), {
    filename: 'test.pdf',
    contentType: 'application/pdf'
  });

  try {
    const res = await axios.post('http://localhost:3000/api/audits/non-existent-id/findings/non-existent-finding/evidence', form, {
      headers: form.getHeaders ? form.getHeaders() : {}
    });
    console.log("Success:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("Error status:", err.response.status);
      console.log("Error data:", err.response.data);
    } else {
      console.log("Network Error:", err.message);
    }
  }
}

testUpload();
