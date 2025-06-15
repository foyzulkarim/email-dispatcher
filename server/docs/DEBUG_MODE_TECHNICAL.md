# Debug Email Mode - Technical Implementation

## Overview

The Debug Email Mode is a development feature that allows testing email functionality without using real email providers or consuming API credits. This document provides technical details about how the debug mode is implemented in the codebase.

## Core Components

### 1. DebugEmailService

The `DebugEmailService` class is the central component that handles debug email functionality:

```typescript
export class DebugEmailService {
  private debugDir: string;
  private summaryFile: string;
  private maxDebugFiles: number = 100;
  private maxDebugAgeDays: number = 7;
  
  constructor() {
    this.debugDir = path.join(process.cwd(), 'mail-debug');
    this.summaryFile = path.join(this.debugDir, 'email-summary.json');
    this.ensureDebugDir();
  }
  
  // Methods for debug email handling
  // ...
}
```

### 2. Integration with EmailProcessorService

The `EmailProcessorService` integrates with the debug mode by checking for available providers:

```typescript
// In EmailProcessorService.processEmailTarget
// Check if we're in debug mode (no active providers)
const isDebugMode = process.env.NODE_ENV === 'development' && !(await this.hasActiveProviders());
if (isDebugMode) {
  // Use debug email service instead of real provider
  const debugResult = await debugEmailService.saveDebugEmail({
    to: email,
    subject,
    htmlContent: body,
    textContent: body.replace(/<[^>]*>/g, ''),
    fromEmail: process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
    fromName: process.env.DEFAULT_FROM_NAME || 'Email Service',
    metadata: metadata || {},
    timestamp: new Date()
  });
  
  if (debugResult.success) {
    console.log(`✅ Debug email saved successfully: ${debugResult.filePath}`);
    console.log(`📧 Message ID: ${debugResult.messageId}`);
  } else {
    throw new Error('Failed to save debug email');
  }
  return;
}
```

## Debug Email File Generation

### 1. File Structure

Debug emails are saved as HTML files with a specific naming convention:

```
{timestamp}_{sanitized-email}_{message-id-prefix}.html
```

Example:
```
2024-01-15T14-30-45_john-doe-example-com_f47ac10b.html
```

### 2. HTML Template

Each debug email file contains:

- Email headers (Message ID, To/From, Subject, Date)
- HTML preview in an iframe
- Text content version
- Metadata display
- Debug mode warnings

The HTML template includes CSS styling for a professional email client appearance.

### 3. Implementation Details

```typescript
async saveDebugEmail(emailData: EmailSendRequest): Promise<DebugEmailResult> {
  try {
    // Generate unique message ID
    const messageId = `debug-${uuidv4()}`;
    
    // Sanitize email for filename
    const sanitizedEmail = emailData.to.replace(/[@.]/g, '-');
    
    // Format timestamp for filename
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    
    // Create filename
    const filename = `${timestamp}_${sanitizedEmail}_${messageId.substring(0, 8)}.html`;
    const filePath = path.join(this.debugDir, filename);
    
    // Generate HTML content
    const htmlContent = this.generateDebugEmailHtml(emailData, messageId);
    
    // Write to file
    await fs.promises.writeFile(filePath, htmlContent, 'utf8');
    
    // Update summary file
    await this.updateSummaryFile({
      messageId,
      filename,
      to: emailData.to,
      subject: emailData.subject,
      timestamp: new Date().toISOString(),
      from: emailData.fromEmail || process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
      hasMetadata: !!emailData.metadata && Object.keys(emailData.metadata).length > 0
    });
    
    return {
      success: true,
      messageId,
      filePath
    };
  } catch (error) {
    console.error('Error saving debug email:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
```

## Summary File Management

The system maintains a `email-summary.json` file that tracks all debug emails:

```typescript
private async updateSummaryFile(entry: DebugEmailSummaryEntry): Promise<void> {
  try {
    let summary: DebugEmailSummaryEntry[] = [];
    
    // Read existing summary if it exists
    if (await this.fileExists(this.summaryFile)) {
      const summaryContent = await fs.promises.readFile(this.summaryFile, 'utf8');
      summary = JSON.parse(summaryContent);
    }
    
    // Add new entry
    summary.unshift(entry);
    
    // Limit to max entries
    if (summary.length > this.maxDebugFiles) {
      summary = summary.slice(0, this.maxDebugFiles);
    }
    
    // Write updated summary
    await fs.promises.writeFile(this.summaryFile, JSON.stringify(summary, null, 2), 'utf8');
  } catch (error) {
    console.error('Error updating debug email summary:', error);
  }
}
```

## Automatic Cleanup

The system automatically cleans up old debug files:

```typescript
async cleanupOldFiles(): Promise<void> {
  try {
    console.log('🧹 Cleaning up old debug email files...');
    
    // Ensure debug directory exists
    await this.ensureDebugDir();
    
    // Get all HTML files in debug directory
    const files = await fs.promises.readdir(this.debugDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.maxDebugAgeDays);
    
    let deletedCount = 0;
    
    // Check each file
    for (const file of htmlFiles) {
      const filePath = path.join(this.debugDir, file);
      const stats = await fs.promises.stat(filePath);
      
      // Delete if older than cutoff
      if (stats.mtime < cutoffDate) {
        await fs.promises.unlink(filePath);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`🗑️ Deleted ${deletedCount} old debug email files`);
    } else {
      console.log('✅ No old debug email files to clean up');
    }
  } catch (error) {
    console.error('Error cleaning up debug email files:', error);
  }
}
```

## Debug Mode Detection

The system automatically detects when to use debug mode:

```typescript
private async hasActiveProviders(): Promise<boolean> {
  const activeProviders = await EmailProviderModel.countDocuments({
    isActive: true,
    $expr: { $lt: ['$usedToday', '$dailyQuota'] }
  });
  
  return activeProviders > 0;
}
```

## Integration with Server Startup

The debug email service is initialized during server startup:

```typescript
// In index.ts
// Initialize debug email service and cleanup old files
await debugEmailService.cleanupOldFiles();
```

## Testing Debug Mode

A dedicated test script (`test-debug-email.js`) is provided to test the debug email functionality:

```javascript
async function testDebugEmail() {
  console.log('🧪 Testing Debug Email');
  console.log('====================');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/email/submit`, {
      subject: 'Debug Test Email',
      body: '<h1>Hello Debug!</h1><p>This is a test email for debug mode.</p>',
      recipients: ['test@example.com'],
      metadata: {
        source: 'debug_test',
        timestamp: new Date().toISOString()
      }
    });
    
    if (response.data.success) {
      console.log('✅ Debug email submitted successfully!');
      console.log(`📋 Job ID: ${response.data.data.jobId}`);
      
      // Check job status
      const statusResponse = await axios.get(`${API_BASE_URL}/email/job/${response.data.data.jobId}`);
      
      if (statusResponse.data.success) {
        console.log('📊 Job Status:', statusResponse.data.data.status);
        console.log('📧 Processed:', statusResponse.data.data.processedTargets);
        console.log('✅ Successful:', statusResponse.data.data.successfulTargets);
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
```

## Technical Benefits

1. **Zero API Usage**: No external API calls during development
2. **Visual Debugging**: HTML files provide visual representation of emails
3. **Metadata Inspection**: All email metadata is preserved for debugging
4. **Automatic Cleanup**: Old files are automatically removed
5. **Seamless Integration**: Works with existing email submission code
6. **Consistent Response Format**: Debug mode returns the same response format as live mode

## Security Considerations

1. **Debug files contain actual email content**: Files are added to `.gitignore` to prevent accidental commits
2. **No authentication on debug files**: Files are stored locally and not served via HTTP
3. **Clear debug indicators**: All debug emails contain prominent warnings about being in development mode

## Environment Variables

```env
# Default sender information (used in debug mode)
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_FROM_NAME=Your App Name
```

## Directory Structure

```
server/
├── mail-debug/                    # Debug emails directory
│   ├── 2024-01-15T10-30-00_user@example.com_abc123.html
│   ├── 2024-01-15T10-30-00_test@domain.com_def456.html
│   └── email-summary.json         # Summary of all debug emails
```