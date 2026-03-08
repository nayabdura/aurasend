const fs = require('fs');

async function testUpload() {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    let body = '';

    body += '--' + boundary + '\r\n';
    body += 'Content-Disposition: form-data; name="campaign_id"\r\n\r\n';
    body += '3\r\n';

    body += '--' + boundary + '\r\n';
    body += 'Content-Disposition: form-data; name="type"\r\n\r\n';
    body += 'client\r\n';

    body += '--' + boundary + '\r\n';
    body += 'Content-Disposition: form-data; name="file"; filename="test.csv"\r\n';
    body += 'Content-Type: text/csv\r\n\r\n';
    body += fs.readFileSync('test.csv', 'utf8') + '\r\n';
    body += '--' + boundary + '--\r\n';

    try {
        const res = await fetch('http://localhost:3000/api/leads/upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data; boundary=' + boundary,
                'Cookie': 'auth_token=eyJ1c2VySWQiOjEsImVtYWlsIjoibWFzdGVyQG91dHJlYWNob3MuY29tIiwicm9sZSI6Im1hc3RlciIsIndvcmtzcGFjZUlkIjoxLCJpcCI6Ijo6MSJ9'
            },
            body: body
        });
        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Body:', text);
    } catch (e) {
        console.error(e);
    }
}
testUpload();
