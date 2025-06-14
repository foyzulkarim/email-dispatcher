require('dotenv').config();
const axios = require('axios');

// Multi-provider test suite
async function testMultiProviders() {
  console.log('🧪 Testing Multi-Provider Email System...\n');
  
  const testProviders = [
    {
      name: 'Brevo Test',
      type: 'brevo',
      apiKey: process.env.BREVO_API_KEY,
      dailyQuota: 100,
      envVar: 'BREVO_API_KEY'
    },
    {
      name: 'SendGrid Test',
      type: 'sendgrid',
      apiKey: process.env.SENDGRID_API_KEY,
      dailyQuota: 50,
      envVar: 'SENDGRID_API_KEY'
    },
    {
      name: 'Mailjet Test',
      type: 'mailjet',
      apiKey: process.env.MAILJET_API_KEY,
      dailyQuota: 75,
      envVar: 'MAILJET_API_KEY'
    }
  ];

  const createdProviders = [];

  // Test 1: Create all providers
  console.log('1. Creating providers...');
  for (const provider of testProviders) {
    try {
      const createResponse = await axios.post('http://localhost:3000/providers/create', {
        name: provider.name,
        type: provider.type,
        apiKey: provider.apiKey || 'demo_key',
        dailyQuota: provider.dailyQuota
      });
      
      const providerId = createResponse.data.data.id;
      createdProviders.push({
        ...provider,
        providerId,
        hasApiKey: !!provider.apiKey
      });
      
      console.log(`  ✅ ${provider.name} created: ${providerId}`);
    } catch (error) {
      console.log(`  ❌ ${provider.name} failed:`, error.response?.data?.error || error.message);
    }
  }

  // Test 2: List all providers
  console.log('\n2. Listing all providers...');
  try {
    const listResponse = await axios.get('http://localhost:3000/providers/list');
    console.log(`  ✅ Total providers: ${listResponse.data.data.length}`);
    
    listResponse.data.data.forEach(provider => {
      const status = provider.isActive ? '🟢 Active' : '🔴 Inactive';
      console.log(`    - ${provider.name} (${provider.type}): ${status} - ${provider.usedToday}/${provider.dailyQuota}`);
    });
  } catch (error) {
    console.log(`  ❌ Failed to list providers:`, error.message);
  }

  // Test 3: Test email sending for providers with API keys
  console.log('\n3. Testing email sending...');
  const activeProviders = createdProviders.filter(p => p.hasApiKey);
  
  if (activeProviders.length === 0) {
    console.log('  ⚠️  No providers with API keys found. Skipping email tests.');
    console.log('  💡 Set these environment variables to test email sending:');
    testProviders.forEach(p => {
      console.log(`     - ${p.envVar}=your_${p.type}_api_key`);
    });
  } else if (!process.env.TEST_EMAIL) {
    console.log('  ⚠️  TEST_EMAIL not set. Skipping email tests.');
    console.log('  💡 Set TEST_EMAIL=your-email@example.com to test email sending.');
  } else {
    for (const provider of activeProviders) {
      try {
        console.log(`  🔄 Testing ${provider.name}...`);
        const testResponse = await axios.post('http://localhost:3000/providers/test', {
          providerId: provider.providerId,
          testEmail: process.env.TEST_EMAIL
        });
        console.log(`    ✅ Email sent via ${provider.name}: ${testResponse.data.data.messageId}`);
      } catch (error) {
        console.log(`    ❌ ${provider.name} failed:`, error.response?.data?.error || error.message);
      }
    }
  }

  // Test 4: Send email via main API (will use all active providers in rotation)
  if (process.env.TEST_EMAIL && activeProviders.length > 0) {
    console.log('\n4. Testing main email API...');
    try {
      const emailResponse = await axios.post('http://localhost:3000/emails/send', {
        subject: 'Multi-Provider Test Email',
        body: `
          <h2>Multi-Provider Email Test</h2>
          <p>This email was sent through your multi-provider email system!</p>
          <p><strong>Available Providers:</strong></p>
          <ul>
            ${activeProviders.map(p => `<li>${p.name} (${p.type})</li>`).join('')}
          </ul>
          <p>Sent at: <strong>${new Date().toISOString()}</strong></p>
          <hr>
          <p><small>The system automatically selects the best available provider.</small></p>
        `,
        recipients: [process.env.TEST_EMAIL]
      });
      
      console.log('  ✅ Email job created:', emailResponse.data.data.jobId);
      
      // Check status after a moment
      setTimeout(async () => {
        try {
          const statusResponse = await axios.get(`http://localhost:3000/emails/status/${emailResponse.data.data.jobId}`);
          console.log('  📊 Job status:', statusResponse.data.data.status);
          
          if (statusResponse.data.data.results?.length > 0) {
            statusResponse.data.data.results.forEach(result => {
              const status = result.status === 'sent' ? '✅' : '❌';
              console.log(`    ${status} ${result.email}: ${result.status}`);
            });
          }
        } catch (error) {
          console.log('  ❌ Error checking job status:', error.message);
        }
      }, 3000);
      
    } catch (error) {
      console.log('  ❌ Main API test failed:', error.response?.data?.error || error.message);
    }
  }

  // Test 5: Provider statistics
  console.log('\n5. Provider statistics...');
  try {
    const statsResponse = await axios.get('http://localhost:3000/providers/stats');
    const stats = statsResponse.data.data;
    
    console.log(`  📊 Total Providers: ${stats.totalProviders}`);
    console.log(`  🟢 Active Providers: ${stats.activeProviders}`);
    console.log(`  📧 Total Daily Quota: ${stats.totalDailyQuota}`);
    console.log(`  📬 Used Today: ${stats.totalUsedToday}`);
    console.log(`  📈 Remaining: ${stats.totalDailyQuota - stats.totalUsedToday}`);
    
  } catch (error) {
    console.log('  ❌ Failed to get stats:', error.message);
  }
}

// Test the common pattern - same email content through different providers
async function testCommonPattern() {
  console.log('\n6. Testing Common Pattern...');
  console.log('   📝 Same email content → Different provider formats');
  
  const sampleEmail = {
    to: 'recipient@example.com',
    toName: 'Test Recipient',
    subject: 'Common Pattern Test',
    htmlContent: '<h1>Hello!</h1><p>This is a test email.</p>',
    textContent: 'Hello! This is a test email.',
    fromEmail: 'sender@example.com',
    fromName: 'Test Sender'
  };

  console.log('\n   Expected outputs:');
  console.log('   🔹 Brevo format:');
  console.log('     {');
  console.log('       "sender": {"email": "sender@example.com", "name": "Test Sender"},');
  console.log('       "to": [{"email": "recipient@example.com", "name": "Test Recipient"}],');
  console.log('       "subject": "Common Pattern Test",');
  console.log('       "htmlContent": "<h1>Hello!</h1><p>This is a test email.</p>"');
  console.log('     }');
  
  console.log('\n   🔹 SendGrid format:');
  console.log('     {');
  console.log('       "personalizations": [{"to": [{"email": "recipient@example.com", "name": "Test Recipient"}]}],');
  console.log('       "from": {"email": "sender@example.com", "name": "Test Sender"},');
  console.log('       "subject": "Common Pattern Test",');
  console.log('       "content": [{"type": "text/html", "value": "<h1>Hello!</h1><p>This is a test email.</p>"}]');
  console.log('     }');
  
  console.log('\n   🔹 Mailjet format:');
  console.log('     {');
  console.log('       "Messages": [{');
  console.log('         "From": {"Email": "sender@example.com", "Name": "Test Sender"},');
  console.log('         "To": [{"Email": "recipient@example.com", "Name": "Test Recipient"}],');
  console.log('         "Subject": "Common Pattern Test",');
  console.log('         "HTMLPart": "<h1>Hello!</h1><p>This is a test email.</p>"');
  console.log('       }]');
  console.log('     }');
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
  console.log('🚀 Multi-Provider Email System Test Suite\n');
  console.log('Environment variables:');
  console.log('- BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('- SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('- MAILJET_API_KEY:', process.env.MAILJET_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('- TEST_EMAIL:', process.env.TEST_EMAIL ? '✅ Set' : '❌ Not set');
  console.log('- DEFAULT_FROM_EMAIL:', process.env.DEFAULT_FROM_EMAIL || 'Using default');
  console.log('\n');
  
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testMultiProviders();
    await testCommonPattern();
  }
  
  console.log('\n🏁 Test suite completed');
  console.log('\n💡 Next steps:');
  console.log('   1. Add your API keys to .env file');
  console.log('   2. Run this test again to see real email sending');
  console.log('   3. Monitor provider usage and rotation');
  console.log('   4. Test template system with dynamic content');
}

main().catch(console.error); 
