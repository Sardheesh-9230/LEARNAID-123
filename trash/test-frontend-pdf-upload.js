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

// Simple HTTP request helper with timeout
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 5000,
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
  const pdfPath = path.join(__dirname, 'test-material-frontend.pdf');
  
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
(Test Frontend PDF Material) Tj
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

// Simulate the frontend material creation process
async function testFrontendMaterialCreation() {
  try {
    console.log('🚀 Starting Frontend PDF Upload Simulation');
    console.log('==========================================');
    
    // Step 1: Create dummy PDF
    const pdfPath = createDummyPDF();
    
    // Step 2: Login
    console.log('🔐 Logging in...');
    const loginResponse = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });
    
    if (!loginResponse.ok) {
      const errorText = await loginResponse.text();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorText}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful!');
    const token = loginData.data?.token || loginData.token;
    
    // Step 3: Get subjects and chapters
    console.log('📚 Fetching subjects...');
    const subjectsResponse = await makeRequest(`${BASE_URL}/subjects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const subjectsData = await subjectsResponse.json();
    const firstSubject = subjectsData.data[0];
    console.log('📖 Using subject:', firstSubject.name);
    
    const chaptersResponse = await makeRequest(`${BASE_URL}/subjects/${firstSubject._id}/chapters`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const chaptersData = await chaptersResponse.json();
    const firstChapter = chaptersData.data[0];
    console.log('📄 Using chapter:', firstChapter.title);
    
    // Step 4: Simulate frontend material creation (two-step process)
    console.log('📤 Step 1: Uploading PDF to PDF endpoint...');
    
    // First, upload PDF to PDF endpoint
    const pdfFormData = new FormData();
    pdfFormData.append('file', fs.createReadStream(pdfPath));
    pdfFormData.append('subject', firstSubject._id);
    pdfFormData.append('description', 'Frontend test PDF upload');
    
    const pdfUploadResponse = await new Promise((resolve, reject) => {
      const urlObj = new URL(`${BASE_URL}/pdf/upload`);
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 5000,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...pdfFormData.getHeaders()
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
      pdfFormData.pipe(req);
    });
    
    const pdfResult = await pdfUploadResponse.json();
    console.log('✅ PDF uploaded:', pdfResult.data.filename);
    
    // Step 5: Create Material record that references the PDF
    console.log('📝 Step 2: Creating Material record...');
    
    const materialFormData = new FormData();
    materialFormData.append('title', 'Frontend Test PDF Material');
    materialFormData.append('type', 'PDF');
    materialFormData.append('description', 'Test material created via frontend simulation');
    materialFormData.append('order', '1');
    
    // Store PDF information in file metadata
    const pdfMetadata = {
      filename: pdfResult.data.filename,
      originalname: pdfResult.data.originalName,
      size: pdfResult.data.fileSize || 0,
      mimetype: 'application/pdf',
      path: `${BASE_URL}/pdf/download/${pdfResult.data.id}`
    };
    materialFormData.append('fileMetadata', JSON.stringify(pdfMetadata));
    
    console.log('📁 PDF Metadata:', pdfMetadata);
    
    const materialResponse = await new Promise((resolve, reject) => {
      const urlObj = new URL(`${BASE_URL}/subjects/chapters/${firstChapter._id}/materials`);
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 5000,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          ...materialFormData.getHeaders()
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
      materialFormData.pipe(req);
    });
    
    const materialResult = await materialResponse.json();
    console.log('📝 Material creation response:', materialResponse.status);
    console.log('📝 Material data:', JSON.stringify(materialResult, null, 2));
    
    if (materialResponse.ok) {
      console.log('✅ Material created successfully!');
      
      // Step 6: Verify material appears in chapter materials
      console.log('🔍 Verifying material appears in chapter...');
      const materialsResponse = await makeRequest(`${BASE_URL}/subjects/chapters/${firstChapter._id}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const materialsData = await materialsResponse.json();
      console.log(`📚 Chapter now has ${materialsData.materials?.length || 0} materials`);
      
      const newMaterial = materialsData.materials?.find(m => m.title.includes('Frontend Test'));
      if (newMaterial) {
        console.log('🎉 SUCCESS: Material is visible in chapter materials!');
        console.log('📄 Material details:', {
          id: newMaterial._id,
          title: newMaterial.title,
          type: newMaterial.type,
          url: newMaterial.url
        });
      } else {
        console.log('❌ Material not found in chapter materials list');
      }
    } else {
      console.log('❌ Material creation failed');
      console.log('Error details:', materialResult);
    }
    
    // Cleanup
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log('🧹 Cleaned up test PDF file');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Cleanup on error
    const pdfPath = path.join(__dirname, 'test-material-frontend.pdf');
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log('🧹 Cleaned up test PDF file');
    }
  }
}

// Run the test
if (require.main === module) {
  testFrontendMaterialCreation();
}

module.exports = { testFrontendMaterialCreation };