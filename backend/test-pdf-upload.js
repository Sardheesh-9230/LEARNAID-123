const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const https = require('https');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'vishnu@learnaid.edu',
  password: '1234567890'
};

// Simple HTTP request helper with timeout
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000 // 10 second timeout
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            text: () => Promise.resolve(data),
            json: () => Promise.resolve(data ? JSON.parse(data) : {})
          };
          resolve(result);
        } catch (error) {
          resolve({
            ok: false,
            status: res.statusCode,
            statusText: res.statusMessage,
            text: () => Promise.resolve(data),
            json: () => Promise.reject(new Error('Invalid JSON: ' + data.substring(0, 100)))
          });
        }
      });
    });

    req.on('error', (error) => {
      console.log('Request error:', error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.log('Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      if (options.body instanceof FormData) {
        options.body.pipe(req);
      } else {
        req.write(options.body);
        req.end();
      }
    } else {
      req.end();
    }
  });
}

// Create a dummy PDF file for testing
function createDummyPDF() {
  const pdfPath = path.join(__dirname, 'test-material.pdf');
  
  // Create a simple PDF-like file (not a real PDF, just for testing upload)
  const dummyPDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Material PDF) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000079 00000 n 
0000000173 00000 n 
0000000301 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
395
%%EOF`;

  fs.writeFileSync(pdfPath, dummyPDFContent);
  console.log('📄 Created dummy PDF:', pdfPath);
  return pdfPath;
}

// Test the material upload functionality
async function testMaterialUpload() {
  try {
    console.log('🚀 Starting Material Upload Test');
    console.log('================================');
    
    // Step 1: Create dummy PDF
    const pdfPath = createDummyPDF();
    
    // Step 2: Login
    console.log('🔐 Testing authentication...');
    console.log('Login URL:', `${BASE_URL}/auth/login`);
    console.log('Login data:', JSON.stringify(TEST_USER));
    
    const loginResponse = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      console.log('Login error response:', errorText);
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    console.log('Login response data:', JSON.stringify(loginData, null, 2));
    console.log('User:', loginData.data?.user?.name || 'Unknown');
    
    const token = loginData.data?.token || loginData.token;
    console.log('Extracted token:', token ? 'Token found' : 'No token found');
    
    // Step 3: Get subjects to find a chapter
    console.log('📚 Fetching subjects...');
    console.log('Using token:', token ? `${token.substring(0, 20)}...` : 'No token');
    const subjectsResponse = await makeRequest(`${BASE_URL}/subjects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Subjects response status:', subjectsResponse.status);
    
    if (!subjectsResponse.ok) {
      const errorText = await subjectsResponse.text();
      console.log('Subjects error response:', errorText);
      throw new Error(`Failed to fetch subjects: ${subjectsResponse.status} - ${errorText}`);
    }
    
    const subjectsData = await subjectsResponse.json();
    console.log(`✅ Found ${subjectsData.data?.length || 0} subjects`);
    
    if (!subjectsData.data || subjectsData.data.length === 0) {
      console.log('⚠️  No subjects found. Need to create a subject first.');
      return;
    }
    
    const firstSubject = subjectsData.data[0];
    console.log('📖 Using subject:', firstSubject.name);
    
    // Step 4: Get chapters for this subject
    console.log('📑 Fetching chapters...');
    const chaptersResponse = await makeRequest(`${BASE_URL}/subjects/${firstSubject._id}/chapters`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!chaptersResponse.ok) {
      throw new Error(`Failed to fetch chapters: ${chaptersResponse.status}`);
    }
    
    const chaptersData = await chaptersResponse.json();
    console.log(`✅ Found ${chaptersData.data?.length || 0} chapters`);
    
    if (!chaptersData.data || chaptersData.data.length === 0) {
      console.log('⚠️  No chapters found. Need to create a chapter first.');
      return;
    }
    
    const firstChapter = chaptersData.data[0];
    console.log('📄 Using chapter:', firstChapter.title);
    
    // Step 5: Test PDF upload using the dedicated PDF endpoint
    console.log('📤 Testing PDF upload using PDF endpoint...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));
    formData.append('subject', firstSubject._id);
    formData.append('description', 'Test PDF upload from automated test');
    
    // Use the dedicated PDF upload endpoint
    const uploadResponse = await new Promise((resolve, reject) => {
      const urlObj = new URL(`${BASE_URL}/pdf/upload`);
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 5000,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        }
      };
      
      const req = http.request(requestOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            text: () => Promise.resolve(data),
            json: () => Promise.resolve(data ? JSON.parse(data) : {})
          });
        });
      });
      
      req.on('error', reject);
      formData.pipe(req);
    });
    
    const uploadResult = await uploadResponse.text();
    console.log('📤 Upload Response Status:', uploadResponse.status);
    console.log('📤 Upload Response:', uploadResult);
    
    if (uploadResponse.ok) {
      console.log('✅ PDF upload successful!');
    } else {
      console.log('❌ PDF upload failed');
      console.log('Error details:', uploadResult);
    }
    
    // Cleanup
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log('🧹 Cleaned up test PDF file');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Cleanup on error
    const pdfPath = path.join(__dirname, 'test-material.pdf');
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log('🧹 Cleaned up test PDF file');
    }
  }
}

// Install required dependencies if not present
async function checkDependencies() {
  try {
    require('form-data');
    console.log('✅ form-data is available');
  } catch (error) {
    console.log('📦 Installing form-data...');
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
      exec('npm install form-data', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Failed to install form-data:', error);
          reject(error);
        } else {
          console.log('✅ form-data installed');
          resolve();
        }
      });
    });
  }
}

// Run the test
async function runTest() {
  try {
    await checkDependencies();
    await testMaterialUpload();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Export for use
if (require.main === module) {
  runTest();
}

module.exports = { testMaterialUpload, createDummyPDF };