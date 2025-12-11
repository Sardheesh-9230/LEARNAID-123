const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const http = require('http');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'vishnu@learnaid.edu',
  password: '1234567890'
};

// Simple HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 5000,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    };

    const req = client.request(requestOptions, (res) => {
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
    req.on('timeout', () => {
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

// Create a dummy PDF file
function createDummyPDF() {
  const pdfPath = path.join(__dirname, 'test-simple-material.pdf');
  
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
/Length 49
>>
stream
BT
/F1 12 Tf
100 700 Td
(Simple Material Upload Test) Tj
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
400
%%EOF`;

  fs.writeFileSync(pdfPath, dummyPDFContent);
  console.log('📄 Created dummy PDF:', pdfPath);
  return pdfPath;
}

// Test simple material creation
async function testSimpleMaterialCreation() {
  try {
    console.log('🚀 Testing Simple Material Creation');
    console.log('===================================');
    
    // Create dummy PDF
    const pdfPath = createDummyPDF();
    
    // Login
    console.log('🔐 Logging in...');
    const loginResponse = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.data?.token || loginData.token;
    console.log('✅ Login successful!');
    
    // Get subject and chapter
    const subjectsResponse = await makeRequest(`${BASE_URL}/subjects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const subjectsData = await subjectsResponse.json();
    const firstSubject = subjectsData.data[0];
    
    const chaptersResponse = await makeRequest(`${BASE_URL}/subjects/${firstSubject._id}/chapters`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const chaptersData = await chaptersResponse.json();
    const firstChapter = chaptersData.data[0];
    
    console.log('📖 Subject:', firstSubject.name);
    console.log('📄 Chapter:', firstChapter.title);
    
    // Create material directly
    console.log('📤 Creating material with PDF...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));
    formData.append('title', 'Simple PDF Material Test');
    formData.append('type', 'PDF');
    formData.append('description', 'Testing simple material creation');
    formData.append('order', '1');
    
    const uploadResponse = await new Promise((resolve, reject) => {
      const urlObj = new URL(`${BASE_URL}/subjects/chapters/${firstChapter._id}/materials`);
      
      const req = http.request({
        hostname: urlObj.hostname,
        port: urlObj.port || 5000,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: () => Promise.resolve(data),
            json: () => Promise.resolve(data ? JSON.parse(data) : {})
          });
        });
      });
      
      req.on('error', reject);
      formData.pipe(req);
    });
    
    const result = await uploadResponse.json();
    console.log('📝 Upload Status:', uploadResponse.status);
    console.log('📝 Result:', JSON.stringify(result, null, 2));
    
    if (uploadResponse.ok) {
      console.log('✅ Material created successfully!');
      
      // Verify it appears in materials list
      const materialsResponse = await makeRequest(`${BASE_URL}/subjects/chapters/${firstChapter._id}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const materialsData = await materialsResponse.json();
      console.log(`📚 Chapter now has ${materialsData.materials?.length || 0} materials`);
      
      const newMaterial = materialsData.materials?.find(m => m.title.includes('Simple PDF'));
      if (newMaterial) {
        console.log('🎉 SUCCESS: Material appears in chapter!');
        console.log('📄 Material:', {
          id: newMaterial._id,
          title: newMaterial.title,
          type: newMaterial.type,
          hasFileMetadata: !!newMaterial.fileMetadata
        });
      } else {
        console.log('❌ Material not found in chapter');
      }
    } else {
      console.log('❌ Material creation failed');
    }
    
    // Cleanup
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log('🧹 Cleaned up test file');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    const pdfPath = path.join(__dirname, 'test-simple-material.pdf');
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
    }
  }
}

if (require.main === module) {
  testSimpleMaterialCreation();
}

module.exports = { testSimpleMaterialCreation };