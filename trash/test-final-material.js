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
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 5000,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 15000 // 15 second timeout
    };

    const req = http.request(requestOptions, (res) => {
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
  const pdfPath = path.join(__dirname, 'test-final-material.pdf');
  
  // Create a simple PDF-like file
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
(Final Test PDF Material) Tj
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

// Test the complete material creation flow
async function testMaterialCreationFlow() {
  try {
    console.log('🚀 Testing Complete Material Creation Flow');
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
    
    // Step 4: Create material with file upload (direct to materials endpoint)
    console.log('📤 Creating material with PDF file...');
    
    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));
    formData.append('title', 'Final Test PDF Material');
    formData.append('type', 'PDF');
    formData.append('description', 'Testing complete material creation flow');
    formData.append('order', '1');
    
    const uploadResponse = await new Promise((resolve, reject) => {
      const urlObj = new URL(`${BASE_URL}/subjects/chapters/${firstChapter._id}/materials`);
      
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
    
    const uploadResult = await uploadResponse.json();
    console.log('📝 Upload Status:', uploadResponse.status);
    
    if (uploadResponse.ok) {
      console.log('✅ Material created successfully!');
      console.log('📄 Material details:', {
        id: uploadResult.data?._id,
        title: uploadResult.data?.title,
        type: uploadResult.data?.type
      });
      
      // Step 5: Verify material appears in chapter materials
      console.log('🔍 Verifying material appears in chapter...');
      const materialsResponse = await makeRequest(`${BASE_URL}/subjects/chapters/${firstChapter._id}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const materialsData = await materialsResponse.json();
      console.log(`📚 Chapter now has ${materialsData.materials?.length || materialsData.count || 0} materials`);
      
      const newMaterial = (materialsData.materials || materialsData.data || []).find(m => 
        m.title.includes('Final Test') || m.title.includes('PDF Material')
      );
      
      if (newMaterial) {
        console.log('🎉 SUCCESS: Material is visible in chapter materials!');
        console.log('📄 Material details:', {
          id: newMaterial._id,
          title: newMaterial.title,
          type: newMaterial.type,
          hasFile: !!newMaterial.file,
          hasFileMetadata: !!newMaterial.fileMetadata,
          hasURL: !!newMaterial.url
        });
      } else {
        console.log('❌ Material not found in chapter materials list');
        console.log('Available materials:', (materialsData.materials || materialsData.data || []).map(m => m.title));
      }
    } else {
      console.log('❌ Material creation failed');
      console.log('Error details:', JSON.stringify(uploadResult, null, 2));
    }
    
    // Cleanup
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log('🧹 Cleaned up test PDF file');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Cleanup on error  
    const pdfPath = path.join(__dirname, 'test-final-material.pdf');
    if (fs.existsSync(pdfPath)) {
      fs.unlinkSync(pdfPath);
      console.log('🧹 Cleaned up test PDF file');
    }
  }
}

// Run the test
if (require.main === module) {
  testMaterialCreationFlow();
}

module.exports = { testMaterialCreationFlow };