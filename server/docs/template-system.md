# Email Template System Documentation

## Overview

The Email Template System allows you to create reusable email templates with variable substitution. Instead of sending plain text emails, you can now create professional HTML templates with dynamic content.

## Features

- **Template Management**: Create, update, delete, and list templates
- **Variable Substitution**: Support for `{variable}` and `{{variable}}` syntax
- **HTML & Text Content**: Support for both HTML and plain text versions
- **Categories**: Organize templates by category (onboarding, authentication, etc.)
- **Template Preview**: Preview templates with sample data
- **Built-in Variables**: Automatic variables like `recipient_email`, `current_date`, `current_year`

## Template API Endpoints

### Template Management

#### List All Templates
```bash
GET /api/template/list?category=onboarding&page=1&limit=20
```

#### Get Template by ID
```bash
GET /api/template/{templateId}
```

#### Create New Template
```bash
POST /api/template/create
Content-Type: application/json

{
  "name": "Welcome Email",
  "description": "Welcome new users",
  "subject": "Welcome to {company_name}, {first_name}!",
  "htmlContent": "<html><body><h1>Welcome {first_name}!</h1></body></html>",
  "textContent": "Welcome {first_name}!",
  "category": "onboarding",
  "isActive": true
}
```

#### Update Template
```bash
PUT /api/template/{templateId}
Content-Type: application/json

{
  "subject": "Updated welcome to {company_name}!",
  "isActive": false
}
```

#### Delete Template (Soft Delete)
```bash
DELETE /api/template/{templateId}
```

#### Preview Template
```bash
POST /api/template/{templateId}/preview
Content-Type: application/json

{
  "variables": {
    "first_name": "John",
    "company_name": "Acme Corp"
  }
}
```

#### Get Categories
```bash
GET /api/template/categories
```

## Email Sending with Templates

### Template-Based Email Submission

Instead of providing `subject` and `body`, you can now use `templateId` and `templateVariables`:

```bash
POST /api/email/submit
Content-Type: application/json

{
  "templateId": "welcome-template-id",
  "templateVariables": {
    "first_name": "John",
    "company_name": "Acme Corp",
    "dashboard_link": "https://app.example.com/dashboard"
  },
  "recipients": ["john@example.com", "jane@example.com"],
  "metadata": {
    "campaign": "user-onboarding",
    "source": "signup-flow"
  }
}
```

### Direct Email (Original Method Still Works)

```bash
POST /api/email/submit
Content-Type: application/json

{
  "subject": "Welcome to our platform!",
  "body": "<h1>Welcome!</h1><p>Thank you for joining us.</p>",
  "recipients": ["user@example.com"],
  "metadata": {}
}
```

## Variable Syntax

### Supported Syntaxes
- `{variable_name}` - Single brace syntax
- `{{variable_name}}` - Double brace syntax

### Built-in Variables
These variables are automatically available in all templates:
- `{recipient_email}` - The recipient's email address
- `{current_date}` - Current date (locale formatted)
- `{current_year}` - Current year (e.g., "2024")

### Custom Variables
Define your own variables in templates and provide values when sending:

```html
<h1>Hello {first_name}!</h1>
<p>Welcome to {company_name}.</p>
<p>Your account: {recipient_email}</p>
<p>Visit: <a href="{dashboard_link}">Dashboard</a></p>
```

## Sample Templates

The system comes with 4 pre-built templates:

### 1. Welcome Email
- **ID**: Auto-generated UUID
- **Category**: `onboarding`
- **Variables**: `company_name`, `first_name`, `dashboard_link`
- **Use Case**: New user registration

### 2. Password Reset
- **Category**: `authentication`
- **Variables**: `company_name`, `first_name`, `reset_link`
- **Use Case**: Password recovery emails

### 3. Order Confirmation
- **Category**: `ecommerce`
- **Variables**: `company_name`, `first_name`, `order_id`, `order_date`, `total_amount`, `shipping_address`, `order_items`, `estimated_delivery`, `tracking_link`
- **Use Case**: E-commerce order confirmations

### 4. Newsletter
- **Category**: `marketing`
- **Variables**: `company_name`, `first_name`, `month`, `featured_content`, `news_content`, `offers_content`, `website_link`, `unsubscribe_link`, `preferences_link`
- **Use Case**: Monthly newsletters

## Usage Examples

### 1. Send Welcome Email

```bash
# First, get the welcome template ID
curl http://localhost:3001/api/template/list?category=onboarding

# Then send email using template
curl -X POST http://localhost:3001/api/email/submit \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "your-welcome-template-id",
    "templateVariables": {
      "first_name": "Alice",
      "company_name": "TechCorp",
      "dashboard_link": "https://app.techcorp.com/dashboard"
    },
    "recipients": ["alice@example.com"],
    "metadata": {
      "campaign": "welcome-series",
      "user_id": "12345"
    }
  }'
```

### 2. Send Password Reset

```bash
curl -X POST http://localhost:3001/api/email/submit \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "password-reset-template-id",
    "templateVariables": {
      "first_name": "Bob",
      "company_name": "TechCorp",
      "reset_link": "https://app.techcorp.com/reset?token=abc123"
    },
    "recipients": ["bob@example.com"],
    "metadata": {
      "action": "password-reset",
      "requested_at": "2024-01-15T10:30:00Z"
    }
  }'
```

### 3. Create Custom Template

```bash
curl -X POST http://localhost:3001/api/template/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Event Invitation",
    "description": "Invite users to events",
    "subject": "You'\''re invited to {event_name}!",
    "htmlContent": "<html><body><h1>{event_name}</h1><p>Hi {first_name},</p><p>Join us on {event_date} at {event_location}.</p><a href=\"{rsvp_link}\">RSVP Now</a></body></html>",
    "textContent": "{event_name}\n\nHi {first_name},\n\nJoin us on {event_date} at {event_location}.\n\nRSVP: {rsvp_link}",
    "category": "events",
    "isActive": true
  }'
```

### 4. Preview Template

```bash
curl -X POST http://localhost:3001/api/template/your-template-id/preview \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {
      "event_name": "TechCorp Annual Conference",
      "first_name": "Charlie",
      "event_date": "March 15, 2024",
      "event_location": "San Francisco Convention Center",
      "rsvp_link": "https://events.techcorp.com/rsvp/12345"
    }
  }'
```

## Template Best Practices

### 1. Variable Naming
- Use descriptive names: `first_name` instead of `name`
- Use underscores: `company_name` not `companyName`
- Be consistent across templates

### 2. HTML Design
- Use inline CSS for email compatibility
- Test across different email clients
- Provide fallback text content
- Use responsive design principles

### 3. Content Guidelines
- Keep subject lines under 50 characters
- Include unsubscribe links in marketing emails
- Use clear call-to-action buttons
- Personalize with recipient's name

### 4. Variable Validation
- Always provide required variables when sending
- Use meaningful fallback values
- Test templates with edge cases (empty variables, long text)

## Error Handling

### Common Errors

#### Missing Template
```json
{
  "success": false,
  "error": "Template with ID template-123 not found or inactive"
}
```

#### Missing Variables
```json
{
  "success": false,
  "error": "Template processing error: Missing required variables: first_name, company_name"
}
```

#### Invalid Request
```json
{
  "success": false,
  "error": "Cannot use both direct email (subject+body) and template-based email in the same request"
}
```

## Monitoring & Analytics

All template usage is tracked in the email jobs:
- Template ID is stored with each email job
- Template variables are saved for debugging
- You can query email jobs by template ID
- Monitor template performance through job success rates

```bash
# Get jobs using specific template
curl http://localhost:3001/api/email/jobs?templateId=your-template-id
```

## Migration from Direct Emails

If you're currently using direct emails, you can gradually migrate:

1. **Create templates** for your most common email types
2. **Update your application** to use `templateId` instead of `subject`/`body`
3. **Test thoroughly** with the preview endpoint
4. **Monitor** template performance vs direct emails
5. **Migrate** remaining emails to templates

Both methods work simultaneously - no need for a big-bang migration! 
