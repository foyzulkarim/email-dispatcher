// MongoDB initialization script for email-dispatcher database
// This script creates the email_service database and user with proper permissions

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

// Create collections and indexes for email dispatcher
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

// Add example data (optional)
if (db.emailproviders.countDocuments() === 0) {
    print('Adding default email providers...');
    
    db.emailproviders.insertMany([
        {
            name: 'Debug Provider',
            type: 'debug',
            isActive: true,
            dailyQuota: 1000,
            dailySent: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]);
    
    print('Default providers added');
} 
