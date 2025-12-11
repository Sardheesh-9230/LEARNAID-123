// Test script to verify MCQ generation endpoint
// Run this with: node backend/test-mcq-generation.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data - replace with actual IDs from your database
const testData = {
  studentId: 'STUDENT_ID_HERE', // Replace with actual student ID
  subjectId: 'SUBJECT_ID_HERE', // Replace with actual subject ID
  subjectName: 'Data Structures',
  courseOutcome: 'CO1',
  coNumber: 1,
  currentPerformance: 45,
  taskType: 'CO_IMPROVEMENT',
  priority: 'HIGH',
  description: 'Improve performance in CO1 - Current: 45%, Target: 70%',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  generatedMCQs: true,
  weakAreas: ['arrays', 'sorting', 'searching'],
  studyTimeMinutes: 120,
  teacherSettings: {
    difficultyLevel: 'medium',
    numberOfQuestions: 10,
    allowRetake: true,
    maxAttempts: 3,
    focusAreas: ['arrays', 'sorting']
  },
  coWeakAreas: [{
    co: 'CO1',
    topics: ['arrays', 'sorting', 'searching'],
    performanceGap: 25
  }]
};

async function testMCQGeneration() {
  try {
    console.log('🚀 Testing MCQ Generation Endpoint\n');
    console.log('📝 Request Data:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n⏳ Sending request...\n');

    const token = 'YOUR_AUTH_TOKEN_HERE'; // Get from localStorage or login first

    const response = await axios.post(
      `${BASE_URL}/improvement-tasks/assign-co-specific`,
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('✅ Success! Response:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.data?.task?.mcqData) {
      const mcqData = response.data.data.task.mcqData;
      console.log('\n🧠 MCQ Data:');
      console.log(`  - Total Questions: ${mcqData.totalQuestions}`);
      console.log(`  - Session ID: ${mcqData.sessionId}`);
      console.log(`  - Material Used: ${mcqData.materialUsed || 'N/A'}`);
      console.log(`  - Difficulty: ${mcqData.difficultyLevel}`);
      console.log(`  - Focus Areas: ${mcqData.areas?.join(', ')}`);
      
      if (mcqData.needsGeneration) {
        console.log(`  ⚠️ Needs Generation: ${mcqData.message}`);
      } else {
        console.log(`  ✅ Questions Generated: ${mcqData.questions?.length || 0}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    }
  }
}

// Instructions
console.log('📋 INSTRUCTIONS:');
console.log('1. Update testData with actual student and subject IDs');
console.log('2. Get auth token from browser localStorage');
console.log('3. Replace YOUR_AUTH_TOKEN_HERE with the token');
console.log('4. Run: node backend/test-mcq-generation.js\n');

// Uncomment to run
// testMCQGeneration();
