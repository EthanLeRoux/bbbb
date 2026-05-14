const http = require('http');

// Test data
const testData = {
  domain: 'books',
  sections: 'Network Security Fundamentals by Gert De Laet',
  difficulty: 'medium',
  questionCount: 5
};

// Create HTTP request
const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/tests/generate',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing API directly...');
console.log('Request data:', testData);

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response body:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('Parsed response:', parsed);
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
