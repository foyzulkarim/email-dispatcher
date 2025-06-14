const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/dynamic-provider';

// Test dynamic provider functionality
async function testDynamicProviders() {
  console.log('🧪 Testing Dynamic Email Provider Configuration\n');

  try {
    // 1. Get available presets
    console.log('1. Getting available provider presets...');
    const presetsResponse = await axios.get(`${BASE_URL}/presets`);
    console.log('✅ Available presets:', presetsResponse.data.data);
    console.log('');

    // 2. Create a simple Brevo provider
    console.log('2. Creating a simple Brevo provider...');
    const brevoConfig = {
      name: 'Brevo Test Provider',
      type: 'brevo',
      apiKey: 'xkeysib-test-api-key-here',
      dailyQuota: 1000,
      isActive: true
    };

    const brevoResponse = await axios.post(`${BASE_URL}/simple`, brevoConfig);
    console.log('✅ Brevo provider created:', brevoResponse.data.data.id);
    const brevoProviderId = brevoResponse.data.data.id;
    console.log('');

    // 3. Create a SendGrid provider
    console.log('3. Creating a simple SendGrid provider...');
    const sendgridConfig = {
      name: 'SendGrid Test Provider',
      type: 'sendgrid',
      apiKey: 'SG.test-api-key-here',
      dailyQuota: 2000,
      isActive: true
    };

    const sendgridResponse = await axios.post(`${BASE_URL}/simple`, sendgridConfig);
    console.log('✅ SendGrid provider created:', sendgridResponse.data.data.id);
    const sendgridProviderId = sendgridResponse.data.data.id;
    console.log('');

    // 4. Create an advanced custom provider
    console.log('4. Creating an advanced custom provider...');
    const customConfig = {
      name: 'Custom API Provider',
      type: 'custom',
      apiKey: 'custom-api-key',
      dailyQuota: 500,
      isActive: true,
      endpoint: 'https://api.custom-email-service.com/v1/send',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      authentication: {
        type: 'api-key',
        headerName: 'X-API-Key'
      },
      payloadTemplate: {
        from: '{{sender.email}}',
        to: '{{recipients.0.email}}',
        subject: '{{subject}}',
        html: '{{htmlContent}}',
        text: '{{textContent}}'
      },
      fieldMappings: {
        sender: 'from',
        recipients: 'to',
        subject: 'subject',
        htmlContent: 'html',
        textContent: 'text'
      }
    };

    const customResponse = await axios.post(`${BASE_URL}/advanced`, customConfig);
    console.log('✅ Custom provider created:', customResponse.data.data.id);
    const customProviderId = customResponse.data.data.id;
    console.log('');

    // 5. Test configuration validation
    console.log('5. Testing provider configuration...');
    const testConfig = {
      name: 'Test Configuration',
      type: 'brevo',
      apiKey: 'xkeysib-test-validation-key',
      dailyQuota: 100,
      isActive: true
    };

    const testResponse = await axios.post(`${BASE_URL}/test`, testConfig);
    console.log('✅ Configuration test result:', testResponse.data.data);
    console.log('');

    // 6. List all providers
    console.log('6. Listing all providers...');
    const listResponse = await axios.get(`${BASE_URL}/`);
    console.log('✅ Total providers found:', listResponse.data.data.length);
    listResponse.data.data.forEach(provider => {
      console.log(`   - ${provider.name} (${provider.type}): ${provider.remainingToday}/${provider.dailyQuota} remaining`);
    });
    console.log('');

    // 7. Get specific provider
    console.log('7. Getting specific provider details...');
    const providerResponse = await axios.get(`${BASE_URL}/${brevoProviderId}`);
    console.log('✅ Provider details:', {
      name: providerResponse.data.data.name,
      type: providerResponse.data.data.type,
      endpoint: providerResponse.data.data.config.endpoint
    });
    console.log('');

    // 8. Update provider
    console.log('8. Updating provider configuration...');
    const updateResponse = await axios.put(`${BASE_URL}/${sendgridProviderId}`, {
      dailyQuota: 3000,
      isActive: false
    });
    console.log('✅ Provider updated:', updateResponse.data.message);
    console.log('');

    // 9. Bulk operations
    console.log('9. Testing bulk operations...');
    const bulkResponse = await axios.post(`${BASE_URL}/bulk`, {
      action: 'activate',
      providerIds: [brevoProviderId, sendgridProviderId, customProviderId]
    });
    console.log('✅ Bulk operation completed:', bulkResponse.data.message);
    console.log('');

    // 10. Filter providers
    console.log('10. Filtering active providers...');
    const activeResponse = await axios.get(`${BASE_URL}/?isActive=true`);
    console.log('✅ Active providers:', activeResponse.data.data.length);
    console.log('');

    // 11. Cleanup - delete test providers
    console.log('11. Cleaning up test providers...');
    await axios.delete(`${BASE_URL}/${brevoProviderId}`);
    await axios.delete(`${BASE_URL}/${sendgridProviderId}`);
    await axios.delete(`${BASE_URL}/${customProviderId}`);
    console.log('✅ Test providers deleted');
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Advanced usage example
async function demonstrateAdvancedUsage() {
  console.log('\n🚀 Advanced Usage Demonstration\n');

  try {
    // Create a complex Mailgun configuration
    const mailgunConfig = {
      name: 'Mailgun Advanced Setup',
      type: 'custom',
      apiKey: 'key-mailgun-api-key-here',
      apiSecret: 'mailgun-domain-here',
      dailyQuota: 1500,
      isActive: true,
      endpoint: 'https://api.mailgun.net/v3/{{apiSecret}}/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      authentication: {
        type: 'basic' // Will use apiKey as username and apiSecret for auth
      },
      payloadTemplate: {
        from: '{{sender.name}} <{{sender.email}}>',
        to: '{{#recipients}}{{email}},{{/recipients}}',
        subject: '{{subject}}',
        html: '{{htmlContent}}',
        text: '{{textContent}}',
        'o:tag': 'dynamic-provider-test'
      },
      fieldMappings: {
        sender: 'from',
        recipients: 'to',
        subject: 'subject',
        htmlContent: 'html',
        textContent: 'text'
      }
    };

    console.log('Creating advanced Mailgun configuration...');
    const response = await axios.post(`${BASE_URL}/advanced`, mailgunConfig);
    console.log('✅ Advanced provider created:', response.data.data.id);

    // Test the configuration
    const testResult = await axios.post(`${BASE_URL}/test`, mailgunConfig);
    console.log('✅ Configuration validation passed');
    console.log('Generated payload:', JSON.stringify(testResult.data.data.generatedPayload, null, 2));

    // Cleanup
    await axios.delete(`${BASE_URL}/${response.data.data.id}`);
    console.log('✅ Cleanup completed');

  } catch (error) {
    console.error('❌ Advanced demo failed:', error.response?.data || error.message);
  }
}

// Run tests
if (require.main === module) {
  console.log('Starting Dynamic Email Provider Tests...\n');
  
  testDynamicProviders()
    .then(() => demonstrateAdvancedUsage())
    .then(() => {
      console.log('\n✨ All demonstrations completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testDynamicProviders,
  demonstrateAdvancedUsage
}; 
