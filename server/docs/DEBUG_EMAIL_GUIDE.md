# Debug Email Mode 📧🔧

This feature allows you to test email sending functionality **without using real email providers** or spending API credits. When no active email providers are configured, the system automatically switches to debug mode and saves emails as HTML files locally.

## 🎯 Purpose

- **Development Testing**: Test email functionality without real providers
- **Cost Savings**: No API credits consumed during development
- **Visual Preview**: See exactly how emails will look
- **Debugging**: Inspect email content, metadata, and formatting
- **Offline Development**: Work without internet or provider access

## 🚀 How It Works

### Automatic Activation
Debug mode is automatically enabled when:
```
No active email providers are found
OR
All providers have reached their daily quota
```

### Email Processing Flow
```
1. Email job submitted via API
2. System checks for available providers
3. If no providers → Debug mode activated
4. Email saved as HTML file in mail-debug/
5. Success response returned (as if sent)
```

## 📁 File Organization

### Directory Structure
```
server/
├── mail-debug/                    # Debug emails directory
│   ├── 2024-01-15T10-30-00_user@example.com_abc123.html
│   ├── 2024-01-15T10-30-00_test@domain.com_def456.html
│   └── email-summary.json         # Summary of all debug emails
```

### File Naming Convention
```
{timestamp}_{sanitized-email}_{message-id-prefix}.html
```

**Example:**
```
2024-01-15T14-30-45_john-doe-example-com_f47ac10b.html
```

## 🎨 HTML Email Preview

Each debug email file contains:

### 📋 Email Headers
- **Message ID**: Unique identifier
- **To/From**: Recipient and sender information  
- **Subject**: Email subject line
- **Date**: Timestamp when email was processed

### 🖼️ Content Sections
- **HTML Preview**: Live iframe showing email as it would appear
- **Text Content**: Plain text version (auto-generated from HTML)
- **Metadata**: Custom metadata passed with the email job

### 🎨 Styling
- Professional email client appearance
- Responsive design for mobile/desktop viewing
- Clear visual hierarchy and typography
- Debug-specific indicators and warnings

## 📊 Summary Tracking

The `email-summary.json` file tracks:
```json
[
  {
    "messageId": "550e8400-e29b-41d4-a716-446655440000",
    "filename": "2024-01-15T14-30-45_user@example.com_550e8400.html",
    "to": "user@example.com",
    "subject": "Welcome to Our Platform",
    "timestamp": "2024-01-15T14:30:45.123Z",
    "from": "noreply@example.com",
    "hasMetadata": true
  }
]
```

## 🧪 Testing Debug Mode

### 1. Using the Test Script
```bash
cd server
node test-debug-email.js
```

### 2. Using Your Client Application
Submit emails normally through your React client - the system will automatically use debug mode if no providers are configured.

### 3. Using API Directly
```javascript
const response = await fetch('http://localhost:3001/api/email/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'Test Email',
    body: '<h1>Hello World!</h1><p>This is a test email.</p>',
    recipients: ['test@example.com'],
    metadata: { source: 'debug_test' }
  })
});
```

## 🔄 Switching Between Modes

### Enable Debug Mode
- Remove all email providers, OR
- Deactivate all providers, OR
- Exhaust all provider quotas

### Enable Live Mode
- Add at least one active email provider
- Ensure provider has remaining quota
- System automatically switches to live sending

### Checking Current Mode
The system logs will indicate which mode is active:
```
🔧 Debug mode enabled - no active providers found
✅ Debug email saved successfully: /path/to/mail-debug/file.html
```

## 🧹 Automatic Cleanup

### Old File Removal
- Files older than **7 days** are automatically deleted
- Cleanup runs on server startup
- Summary file is maintained (keeps last 100 entries)

### Manual Cleanup
```bash
# Remove all debug files
rm -rf server/mail-debug/

# Remove only HTML files (keep summary)
rm server/mail-debug/*.html
```

## 🛠️ Configuration

### Environment Variables
```env
# Default sender information (used in debug mode)
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_FROM_NAME=Your App Name
```

### Debug Directory Location
By default, debug files are saved in:
```
{project-root}/server/mail-debug/
```

To change the location, modify `DebugEmailService.ts`:
```typescript
this.debugDir = path.join(process.cwd(), 'custom-debug-folder');
```

## 🎯 Best Practices

### Development Workflow
1. **Start with Debug Mode**: Develop email features without providers
2. **Test Email Rendering**: Use debug files to verify HTML/styling
3. **Add Providers Gradually**: Test with real providers when ready
4. **Monitor Logs**: Watch for mode switches in console output

### Debug File Management
- **Regular Cleanup**: Delete old debug files periodically
- **Git Ignore**: Debug files are already in `.gitignore`
- **File Limits**: Keep debug directory size reasonable

### Production Considerations
- **Always Have Providers**: Ensure production has active providers
- **Monitor Provider Status**: Set up alerts for provider failures
- **Graceful Degradation**: Debug mode prevents complete email failure

## 🚨 Important Notes

### ⚠️ Debug Mode Indicators
- Debug emails show clear "Development Mode" warnings
- Files include prominent debug badges and styling
- Console logs clearly indicate debug mode activation

### 🔒 Security
- Debug files contain actual email content
- Keep debug directory secure (already in `.gitignore`)
- Don't commit debug files to version control

### 📈 Performance
- Debug mode is faster than real provider calls
- No network requests or API rate limits
- Immediate "sending" completion

## 🆘 Troubleshooting

### Debug Mode Not Activating
```bash
# Check if providers exist
curl http://localhost:3001/api/provider/list

# Check provider status
curl http://localhost:3001/api/dashboard/stats
```

### Files Not Generated
1. Check file permissions in project directory
2. Verify disk space availability
3. Check console logs for error messages

### HTML Not Rendering Properly
1. Validate HTML content in debug files
2. Check for JavaScript errors in browser console
3. Test with different browsers

## 📚 API Integration

### Checking Debug Mode Status
```javascript
// The system automatically handles mode switching
// Your client doesn't need to know which mode is active
// Both modes return the same success response format

const response = await apiService.submitEmailJob(emailData);
// Response format is identical in both modes
```

### Debug Mode Response
```json
{
  "success": true,
  "data": {
    "jobId": "550e8400-e29b-41d4-a716-446655440000",
    "totalRecipients": 1,
    "validRecipients": 1,
    "suppressedRecipients": 0
  },
  "message": "Email job submitted successfully"
}
```

---

## 🎉 Benefits Summary

✅ **Zero Cost Development** - No API credits used  
✅ **Instant Testing** - No network delays  
✅ **Visual Debugging** - See exact email appearance  
✅ **Automatic Switching** - Seamless mode transitions  
✅ **Complete Integration** - Works with existing code  
✅ **Offline Development** - No internet required  
✅ **Metadata Support** - Full debugging capabilities  
✅ **Clean Organization** - Automatic file management  

This debug mode makes email development faster, cheaper, and more reliable! 🚀 


graph TD
    A[Email Job Submitted] --> B{Any Active Providers?}
    B -->|Yes| C[Send via Real Provider]
    B -->|No| D[🔧 Debug Mode Activated]
    D --> E[Generate HTML File]
    E --> F[Save to mail-debug/]
    F --> G[Return Success Response]
    C --> H[Update Provider Usage]
    G --> I[Job Marked as Sent]
    H --> I
