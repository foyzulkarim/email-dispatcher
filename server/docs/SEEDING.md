# Database Seeding Guide

This guide explains how to seed your development database with initial data for testing and development.

## What Gets Seeded

### 🏗️ **Always Seeded**
- **Platforms**: All supported email platforms (SendGrid, Mailgun, Postmark, etc.)
- **Development User**: A test user for development and API testing

### 📧 **Optional Seeding**
- **Email Templates**: Sample templates with variables for testing
- **User Providers**: Sample provider configurations (requires manual API key setup)

## Development User Details

```
Email: dev@example.com
Name: Development User
Role: user
Google ID: dev-google-id-12345
```

**Use this user ID for all your development testing!**

## Seeding Options

### 1. **Default Seeding** (Recommended for most development)
```bash
npm run seed
# or
ts-node src/scripts/seed.ts
```
**Seeds**: Platforms + User + Email Templates

### 2. **Minimal Seeding** (Just the basics)
```bash
npm run seed:minimal
# or
ts-node src/scripts/seed.ts minimal
```
**Seeds**: Platforms + User only

### 3. **Full Seeding** (Everything including providers)
```bash
npm run seed:full
# or
ts-node src/scripts/seed.ts full
```
**Seeds**: Platforms + User + Email Templates + User Providers

⚠️ **Note**: Full seeding creates provider records with placeholder API keys. You'll need to update them with real keys for actual email sending.

## Sample Email Templates

The seeding includes these ready-to-use templates:

### 1. **Welcome Email**
- **Variables**: `name`, `email`
- **Category**: onboarding
- **Use case**: New user registration

### 2. **Password Reset**
- **Variables**: `name`, `resetLink`, `expiryTime`
- **Category**: authentication
- **Use case**: Password reset flow

### 3. **Newsletter**
- **Variables**: `name`, `month`, `year`, `companyName`, `newsContent`, `featuredArticle`
- **Category**: marketing
- **Use case**: Monthly newsletters

## Usage Examples

### Testing Email Jobs
```typescript
// Create an email job using the development user
const emailJob = {
  userId: "your-dev-user-id-from-seeding",
  templateId: "welcome-template-id",
  recipients: ["test@example.com"],
  templateVariables: {
    name: "John Doe",
    email: "test@example.com"
  }
};
```

### Testing Templates
```typescript
// Test template rendering with variables
const variables = {
  name: "Alice Smith",
  email: "alice@example.com",
  resetLink: "https://yourapp.com/reset/token123",
  expiryTime: "30"
};
```

## Adding Your Own Seed Data

### 1. **Update Development Seeds**
Edit `/src/seeds/development.ts` to add more:
- User providers
- Email templates
- Sample data

### 2. **Extend Seeding Functions**
Modify `/src/utils/seedDatabase.ts` to add new seeding functions:

```typescript
export async function seedYourCustomData(userId: string) {
  // Your custom seeding logic
}
```

## Environment Setup

Make sure your environment variables are set:

```bash
# .env
MONGODB_URI=mongodb://localhost:27017/email-dispatcher
```

## Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "seed": "ts-node src/scripts/seed.ts",
    "seed:minimal": "ts-node src/scripts/seed.ts minimal",
    "seed:full": "ts-node src/scripts/seed.ts full"
  }
}
```

## Troubleshooting

### **"User already exists"**
The seeding is idempotent - it won't create duplicates. If you see this message, your development user is already set up.

### **"Required platforms not found"**
Run the seeding again. Platforms must be seeded before user providers can be created.

### **MongoDB Connection Issues**
Check your `MONGODB_URI` environment variable and ensure MongoDB is running.

## Production Notes

⚠️ **Never run seeding scripts in production!**

The seeding scripts are designed for development only. They create test data that should not exist in production environments.

## Next Steps

After seeding:

1. **Note the development user ID** from the console output
2. **Update API keys** in user_providers collection if you ran full seeding
3. **Start building your features** using the seeded data for testing
4. **Create API endpoints** that work with the seeded user and templates

Happy coding! 🚀
