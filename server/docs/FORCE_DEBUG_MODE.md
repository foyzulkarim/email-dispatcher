# FORCE_DEBUG_MODE - Save API Credits During Development 💰

## Quick Setup

1. **Create or update your `.env` file:**
   ```bash
   FORCE_DEBUG_MODE=true
   ```

2. **Start your server:**
   ```bash
   npm run build
   npm start
   ```

3. **Send emails as usual** - they will be saved as HTML files instead of being sent via providers!

## What It Does

When `FORCE_DEBUG_MODE=true`:
- ✅ **All emails are saved as HTML files** in the `mail-debug/` directory
- ✅ **No API credits are consumed** from email providers  
- ✅ **No real emails are sent** to recipients
- ✅ **Perfect for development and testing**

## File Locations

- **Debug emails:** `server/mail-debug/`
- **Email tracking:** `server/mail-debug/email-summary.json`
- **File naming:** `timestamp_recipient_messageId.html`

## Example

```bash
# In your .env file
FORCE_DEBUG_MODE=true

# Run your app
npm start

# Send an email via your API
curl -X POST http://localhost:3001/api/email/submit \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Test Email",
    "body": "<h1>Hello World!</h1>",
    "recipients": ["test@example.com"]
  }'

# Check the debug file
ls server/mail-debug/
# Output: 2025-06-15T10-25-40-657Z_test@example.com_abc123.html
```

## Production Warning ⚠️

**Always set `FORCE_DEBUG_MODE=false` in production!**

```bash
# Production .env
FORCE_DEBUG_MODE=false
```

## Benefits

- 🚫 **No accidental email sends** during development
- 💰 **Save money** on email provider credits
- 🔍 **Visual email preview** to see exactly how emails look
- 📊 **Email tracking** with summary file
- 🏃‍♂️ **Faster development** - no network delays

This feature is perfect for developers who want to test email functionality without worrying about costs or accidentally sending emails! 
