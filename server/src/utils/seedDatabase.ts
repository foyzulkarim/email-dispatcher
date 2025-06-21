import { PlatformModel } from '../models/Platform';
import { UserModel } from '../models/User';
import { UserProviderModel } from '../models/UserProvider';
import { EmailTemplateModel } from '../models/EmailTemplate';
import { platformSeeds } from '../seeds/platforms';
import { developmentUser, developmentUserProviders, developmentEmailTemplates } from '../seeds/development';
import { v4 as uuidv4 } from 'uuid';

export async function seedPlatforms() {
  try {
    console.log('Seeding platforms...');
    
    // Check if platforms already exist
    const existingCount = await PlatformModel.countDocuments();
    if (existingCount > 0) {
      console.log(`${existingCount} platforms already exist. Skipping seed.`);
      return;
    }

    // Insert platform seeds with generated IDs
    const platformsWithIds = platformSeeds.map(platform => ({
      ...platform,
      id: uuidv4()
    }));

    await PlatformModel.insertMany(platformsWithIds);
    console.log(`Successfully seeded ${platformsWithIds.length} platforms`);
    
    // Log the seeded platforms
    platformsWithIds.forEach(platform => {
      console.log(`- ${platform.displayName} (${platform.name})`);
    });
    
  } catch (error) {
    console.error('Error seeding platforms:', error);
    throw error;
  }
}

export async function seedDevelopmentUser() {
  try {
    console.log('Seeding development user...');
    
    // Check if development user already exists
    const existingUser = await UserModel.findOne({ email: developmentUser.email });
    if (existingUser) {
      console.log(`Development user already exists with ID: ${existingUser.id}`);
      return existingUser.id;
    }

    // Create development user
    const devUserId = uuidv4();
    const devUser = new UserModel({
      ...developmentUser,
      id: devUserId
    });

    await devUser.save();
    console.log(`Successfully created development user with ID: ${devUserId}`);
    console.log(`- Email: ${developmentUser.email}`);
    console.log(`- Name: ${developmentUser.name}`);
    console.log(`- Role: ${developmentUser.role}`);
    
    return devUserId;
    
  } catch (error) {
    console.error('Error seeding development user:', error);
    throw error;
  }
}

export async function seedDevelopmentTemplates(userId: string) {
  try {
    console.log('Seeding development email templates...');
    
    // Check if templates already exist for this user
    const existingCount = await EmailTemplateModel.countDocuments({ userId, createdBy: 'system' });
    if (existingCount > 0) {
      console.log(`${existingCount} development templates already exist. Skipping seed.`);
      return;
    }

    // Create templates with generated IDs
    const templatesWithIds = developmentEmailTemplates.map(template => ({
      ...template,
      id: uuidv4(),
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await EmailTemplateModel.insertMany(templatesWithIds);
    console.log(`Successfully seeded ${templatesWithIds.length} email templates`);
    
    // Log the seeded templates
    templatesWithIds.forEach(template => {
      console.log(`- ${template.name} (${template.category})`);
    });
    
  } catch (error) {
    console.error('Error seeding development templates:', error);
    throw error;
  }
}

export async function seedDevelopmentProviders(userId: string) {
  try {
    console.log('Seeding development user providers...');
    
    // Check if providers already exist for this user
    const existingCount = await UserProviderModel.countDocuments({ userId });
    if (existingCount > 0) {
      console.log(`${existingCount} user providers already exist. Skipping seed.`);
      return;
    }

    // Get platform IDs for mapping
    const sendgridPlatform = await PlatformModel.findOne({ name: 'sendgrid' });
    const mailgunPlatform = await PlatformModel.findOne({ name: 'mailgun' });

    if (!sendgridPlatform || !mailgunPlatform) {
      console.log('Required platforms not found. Skipping provider seeding.');
      return;
    }

    // Create providers with actual platform IDs
    const providersWithIds = [
      {
        ...developmentUserProviders[0],
        id: uuidv4(),
        userId,
        platformId: sendgridPlatform.id
      },
      {
        ...developmentUserProviders[1],
        id: uuidv4(),
        userId,
        platformId: mailgunPlatform.id
      }
    ];

    await UserProviderModel.insertMany(providersWithIds);
    console.log(`Successfully seeded ${providersWithIds.length} user providers`);
    console.log('⚠️  Remember to update API keys in the database for actual testing!');
    
    // Log the seeded providers
    providersWithIds.forEach(provider => {
      console.log(`- ${provider.name}`);
    });
    
  } catch (error) {
    console.error('Error seeding development providers:', error);
    throw error;
  }
}

export async function seedDatabase(options: { includeTemplates?: boolean; includeProviders?: boolean } = {}) {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    await seedPlatforms();
    console.log(''); // Empty line for better readability
    
    const devUserId = await seedDevelopmentUser();
    console.log(''); // Empty line for better readability
    
    // Optionally seed templates and providers
    if (devUserId) {
      if (options.includeTemplates !== false) {
        await seedDevelopmentTemplates(devUserId);
        console.log(''); // Empty line for better readability
      }
      
      if (options.includeProviders) {
        await seedDevelopmentProviders(devUserId);
        console.log(''); // Empty line for better readability
      }
    }
    
    console.log('✅ Database seeding completed successfully');
    console.log(`\n📝 Development Notes:`);
    console.log(`   - Development User ID: ${devUserId || 'Check existing user'}`);
    console.log(`   - Login email: ${developmentUser.email}`);
    console.log(`   - Use this user ID for API testing and development`);
    
    if (options.includeProviders) {
      console.log(`   - Update API keys in user_providers collection for actual email sending`);
    }
    
    console.log(`\n🚀 Usage Examples:`);
    console.log(`   - Create EmailJob with userId: "${devUserId}"`);
    console.log(`   - Test templates with variables like: {"name": "John", "email": "john@example.com"}`);
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

// Convenience functions for different seeding scenarios
export async function seedMinimal() {
  return seedDatabase({ includeTemplates: false, includeProviders: false });
}

export async function seedFull() {
  return seedDatabase({ includeTemplates: true, includeProviders: true });
}
