const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testDebugEmail() {
  console.log('🧪 Testing Debug Email Functionality');
  console.log('=====================================');
  
  try {
    // Test email submission when no providers are configured
    const emailPayload = {
      subject: 'Debug Test Email - Welcome to Our Platform!',
      body: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
              .header { background: #4CAF50; color: white; padding: 20px; border-radius: 8px; }
              .content { margin: 20px 0; }
              .button { background: #008CBA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
              .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🎉 Welcome to Our Platform!</h1>
            </div>
            <div class="content">
              <p>Hello there!</p>
              <p>This is a <strong>test email</strong> to demonstrate the debug functionality. When no email providers are configured, this email will be saved as an HTML file locally instead of being sent.</p>
              
              <h3>Features of this debug mode:</h3>
              <ul>
                <li>✅ Beautiful HTML preview with iframe</li>
                <li>✅ Email metadata display</li>
                <li>✅ Text content extraction</li>
                <li>✅ Custom metadata support</li>
                <li>✅ Automatic file organization</li>
              </ul>
              
              <p>
                <a href="https://example.com" class="button">Get Started</a>
              </p>
            </div>
            <div class="footer">
              <p>This is a debug email generated at ${new Date().toLocaleString()}</p>
              <p>If this were a real email, you would receive it in your inbox!</p>
            </div>
          </body>
        </html>
      `,
      recipients: [
        'test@example.com',
        'developer@localhost.dev',
        'debug@test.com'
      ],
      metadata: {
        campaign: 'debug_test',
        source: 'debug_script',
        environment: 'development',
        testType: 'email_functionality'
      }
    };

    console.log('📧 Submitting test email job...');
    console.log(`📬 Subject: ${emailPayload.subject}`);
    console.log(`👥 Recipients: ${emailPayload.recipients.length} emails`);
    console.log(`🏷️  Metadata keys: ${Object.keys(emailPayload.metadata).join(', ')}`);
    
    const response = await axios.post(`${API_BASE_URL}/email/submit`, emailPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      console.log('\n✅ Email job submitted successfully!');
      console.log(`📋 Job ID: ${response.data.data.jobId}`);
      console.log(`📊 Total recipients: ${response.data.data.totalRecipients}`);
      console.log(`✅ Valid recipients: ${response.data.data.validRecipients}`);
      console.log(`🚫 Suppressed recipients: ${response.data.data.suppressedRecipients}`);
      
      // Wait a moment for processing
      console.log('\n⏳ Waiting for email processing...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Check job status
      console.log('📊 Checking job status...');
      const statusResponse = await axios.get(`${API_BASE_URL}/email/job/${response.data.data.jobId}`);
      
      if (statusResponse.data.success) {
        const job = statusResponse.data.data;
        console.log(`📈 Job Status: ${job.status}`);
        console.log(`📧 Processed: ${job.processedCount}/${job.recipientCount}`);
        console.log(`✅ Success: ${job.successCount}`);
        console.log(`❌ Failed: ${job.failedCount}`);
        
        console.log('\n🎯 Debug Mode Results:');
        console.log('- Check the "mail-debug" folder in your server directory');
        console.log('- Each recipient will have an individual HTML file');
        console.log('- Files are named with timestamp_recipient_messageId.html');
        console.log('- A summary file (email-summary.json) tracks all debug emails');
        
      } else {
        console.log('❌ Failed to get job status:', statusResponse.data.error);
      }
    } else {
      console.log('❌ Email job submission failed:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.errors[0].toString());
    if (error.response) {
      console.error('Response data:', error.response);
    }
  }
}

// Additional test for template-based email
async function testTemplateDebugEmail() {
  console.log('\n🧪 Testing Template-Based Debug Email');
  console.log('====================================');
  
  try {
    // First, let's try to get available templates
    const templatesResponse = await axios.get(`${API_BASE_URL}/template/list`);
    
    if (templatesResponse.data.success && templatesResponse.data.data.length > 0) {
      const template = templatesResponse.data.data[0];
      console.log(`📄 Using template: ${template.name}`);
      
      const templateEmailPayload = {
        templateId: template.id,
        templateVariables: {
          firstName: 'Debug',
          lastName: 'User',
          companyName: 'Test Company',
          loginUrl: 'https://app.example.com/login'
        },
        recipients: ['template-test@example.com'],
        metadata: {
          campaign: 'template_debug_test',
          templateName: template.name
        }
      };

      const response = await axios.post(`${API_BASE_URL}/email/submit`, templateEmailPayload);
      
      if (response.data.success) {
        console.log('✅ Template-based debug email submitted successfully!');
        console.log(`📋 Job ID: ${response.data.data.jobId}`);
      } else {
        console.log('❌ Template email failed:', response.data.error);
      }
    } else {
      console.log('ℹ️  No templates available for testing');
    }
  } catch (error) {
    console.log('ℹ️  Template test skipped (templates might not be available)');
  }
}

async function runTests() {
  console.log('🚀 Starting Debug Email Tests\n');
  
  await testDebugEmail();
  await testTemplateDebugEmail();
  
  console.log('\n🏁 Tests completed!');
  console.log('\n💡 Next steps:');
  console.log('1. Check the "mail-debug" folder in your server directory');
  console.log('2. Open the HTML files in your browser to see the debug emails');
  console.log('3. Configure real email providers to disable debug mode');
  console.log('4. The system automatically switches between debug and live modes');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
}); 
