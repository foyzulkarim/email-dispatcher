require('dotenv').config();
const axios = require('axios');

// Test Brevo integration
async function testBrevoIntegration() {
  console.log('🧪 Testing Brevo Integration...\n');
  
  // Test 1: Create a Brevo provider
  console.log('1. Creating Brevo provider...');
  try {
    const createResponse = await axios.post('http://localhost:3000/providers/create', {
      name: 'Brevo Test Provider',
      type: 'brevo',
      apiKey: process.env.BREVO_API_KEY || 'demo_key',
      dailyQuota: 100
    });
    
    console.log('✅ Provider created:', createResponse.data.data.id);
    const providerId = createResponse.data.data.id;
    
    // Test 2: List providers
    console.log('\n2. Listing providers...');
    const listResponse = await axios.get('http://localhost:3000/providers/list');
    console.log('✅ Found providers:', listResponse.data.data.length);
    
    // Test 3: Test email sending (only if API key is provided)
    if (process.env.BREVO_API_KEY && process.env.TEST_EMAIL) {
      console.log('\n3. Testing email sending...');
      const testResponse = await axios.post('http://localhost:3000/providers/test', {
        providerId: providerId,
        testEmail: process.env.TEST_EMAIL
      });
      console.log('✅ Test email sent:', testResponse.data.data.messageId);
    } else {
      console.log('\n3. ⚠️  Skipping email test - Missing BREVO_API_KEY or TEST_EMAIL environment variable');
    }
    
    // Test 4: Send email via main API
    if (process.env.TEST_EMAIL) {
      console.log('\n4. Testing main email API...');
      const emailResponse = await axios.post('http://localhost:3000/emails/send', {
        subject: 'Test from Brevo Integration',
        body: `
          <h2>Hello from Brevo!</h2>
          <p>This email was sent using the integrated Brevo provider.</p>
          <p>Time: ${new Date().toISOString()}</p>
        `,
        recipients: [process.env.TEST_EMAIL]
      });
      console.log('✅ Email job created:', emailResponse.data.data.jobId);
      
      // Wait a moment and check job status
      setTimeout(async () => {
        try {
          const statusResponse = await axios.get(`http://localhost:3000/emails/status/${emailResponse.data.data.jobId}`);
          console.log('📊 Job status:', statusResponse.data.data.status);
        } catch (error) {
          console.log('❌ Error checking job status:', error.message);
        }
      }, 3000);
    } else {
      console.log('\n4. ⚠️  Skipping main API test - Missing TEST_EMAIL environment variable');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:3000/health');
    console.log('✅ Server is running\n');
    return true;
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first with: npm start\n');
    return false;
  }
}

// Main test function
async function main() {
  console.log('🚀 Brevo Integration Test Suite\n');
  console.log('Environment variables:');
  console.log('- BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('- TEST_EMAIL:', process.env.TEST_EMAIL ? '✅ Set' : '❌ Not set');
  console.log('- DEFAULT_FROM_EMAIL:', process.env.DEFAULT_FROM_EMAIL || 'Using default');
  console.log('- DEFAULT_FROM_NAME:', process.env.DEFAULT_FROM_NAME || 'Using default');
  console.log('\n');
  
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testBrevoIntegration();
  }
  
  console.log('\n🏁 Test completed');
}

main().catch(console.error); 
