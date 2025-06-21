// MongoDB initialization script for email-dispatcher
// This script creates the application database and user

// Switch to the email_service database
db = db.getSiblingDB('email_service');

// Create a user for the email service application
db.createUser({
  user: 'emailservice',
  pwd: 'emailservice123',
  roles: [
    {
      role: 'readWrite',
      db: 'email_service'
    }
  ]
});

// Create collections and indexes
db.createCollection('emailjobs');
db.createCollection('emailproviders');
db.createCollection('emailtargets');
db.createCollection('emailtemplates');
db.createCollection('suppressions');
db.createCollection('webhookevents');

// Create indexes for better performance
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

print('Email service database initialized successfully'); 
