// MongoDB initialization script for email-dispatcher
// This script creates the application database and user

// Switch to the email_service database
db = db.getSiblingDB('email_service');

// Create a user for the email service application
// Note: In production, use environment variables for credentials
try {
  db.createUser({
    user: 'emailservice',
    pwd: process.env.EMAIL_SERVICE_PASSWORD || 'emailservice123', // Use env var in production
    roles: [
      {
        role: 'readWrite',
        db: 'email_service'
      }
    ]
  });
  print('User created successfully');
} catch (error) {
  print('Error creating user:', error);
}

// Create collections and indexes
try {
  db.createCollection('emailjobs');
  db.createCollection('emailproviders');
  db.createCollection('emailtargets');
  db.createCollection('emailtemplates');
  db.createCollection('suppressions');
  db.createCollection('webhookevents');
  print('Collections created successfully');
} catch (error) {
  print('Error creating collections:', error);
}

// Create indexes for better performance
try {
  db.emailjobs.createIndex({ "status": 1 });
  db.emailjobs.createIndex({ "createdAt": 1 });
  db.emailjobs.createIndex({ "scheduledAt": 1 });

  db.emailproviders.createIndex({ "name": 1 }, { unique: true });
  db.emailproviders.createIndex({ "isActive": 1 });

  db.emailtargets.createIndex({ "email": 1 }, { unique: true });

  db.emailtemplates.createIndex({ "name": 1 }, { unique: true });

  db.suppressions.createIndex({ "email": 1 }, { unique: true });
  db.suppressions.createIndex({ "createdAt": 1 });

  db.webhookevents.createIndex({ "createdAt": 1 });
  db.webhookevents.createIndex({ "eventType": 1 });
  
  print('Indexes created successfully');
} catch (error) {
  print('Error creating indexes:', error);
}

print('Email service database initialized successfully');
