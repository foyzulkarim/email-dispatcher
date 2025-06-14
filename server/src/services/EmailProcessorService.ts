import { EmailJobModel } from '../models/EmailJob';
import { EmailTargetModel } from '../models/EmailTarget';
import { templateService } from './TemplateService';
import { emailProviderService } from './EmailProviderService';
import { EmailProviderModel } from '../models/EmailProvider';
import { debugEmailService } from './DebugEmailService';

class EmailProcessorService {
  
  async processJob(jobId: string): Promise<void> {
    try {
      console.log(`🔄 Starting to process job: ${jobId}`);
      
      // Get the job
      const job = await EmailJobModel.findOne({ id: jobId });
      if (!job) {
        throw new Error(`Job ${jobId} not found`);
      }

      // Update job status to processing
      await EmailJobModel.updateOne(
        { id: jobId },
        { 
          status: 'processing',
          updatedAt: new Date()
        }
      );

      console.log(`📧 Job ${jobId} marked as processing`);

      // Get all targets for this job
      const targets = await EmailTargetModel.find({ jobId });
      console.log(`📋 Found ${targets.length} recipients for job ${jobId}`);

      // Process each target
      for (const target of targets) {
        await this.processEmailTarget(target.id, target.email, job);
      }

      // Check if all targets are processed successfully
      const updatedTargets = await EmailTargetModel.find({ jobId });
      const successCount = updatedTargets.filter(t => t.status === 'sent').length;
      const failedCount = updatedTargets.filter(t => t.status === 'failed' || t.status === 'blocked').length;
      const totalCount = updatedTargets.length;

      // Update job status based on results
      let finalStatus: 'completed' | 'failed' = 'completed';
      if (failedCount === totalCount) {
        finalStatus = 'failed';
      } else if (successCount + failedCount === totalCount) {
        finalStatus = 'completed';
      }

      await EmailJobModel.updateOne(
        { id: jobId },
        { 
          status: finalStatus,
          updatedAt: new Date()
        }
      );

      console.log(`✅ Job ${jobId} completed with status: ${finalStatus}`);
      console.log(`📊 Results: ${successCount} sent, ${failedCount} failed out of ${totalCount} total`);

    } catch (error) {
      console.error(`❌ Error processing job ${jobId}:`, error);
      
      // Mark job as failed
      await EmailJobModel.updateOne(
        { id: jobId },
        { 
          status: 'failed',
          updatedAt: new Date()
        }
      );
      
      throw error;
    }
  }

  private async processEmailTarget(targetId: string, email: string, job: any): Promise<void> {
    try {
      console.log(`📧 Processing email to: ${email}`);
      
      // Get email content - either from processed template or direct content
      let emailSubject = job.subject;
      let emailBody = job.body;

      // If this is a template-based email, process it for this specific recipient
      if (job.templateId) {
        try {
          const processedTemplate = await templateService.processTemplate(
            job.templateId,
            job.templateVariables || {},
            email
          );
          emailSubject = processedTemplate.subject;
          emailBody = processedTemplate.htmlContent;
          
          console.log(`📧 Using template ${job.templateId} for ${email}`);
        } catch (templateError) {
          console.error(`❌ Template processing failed for ${email}:`, templateError);
          // Fallback to job's processed content
          emailSubject = job.subject;
          emailBody = job.body;
        }
      }
      
      // Update target status to processing (optional, for tracking)
      await EmailTargetModel.updateOne(
        { id: targetId },
        { 
          status: 'sent', // We'll set it directly to sent since we're mocking
          updatedAt: new Date()
        }
      );

      // Send email via real provider (pass job metadata)
      await this.sendEmailViaProvider(email, emailSubject, emailBody, job.metadata);

      // Update target with success status
      await EmailTargetModel.updateOne(
        { id: targetId },
        { 
          status: 'sent',
          sentAt: new Date(),
          providerId: 'mock-smtp-provider', // Mock provider ID for testing
          updatedAt: new Date()
        }
      );

      console.log(`✅ Email sent successfully to: ${email}`);

    } catch (error) {
      console.error(`❌ Failed to send email to ${email}:`, error);
      
      // Update target with failure status
      await EmailTargetModel.updateOne(
        { id: targetId },
        { 
          status: 'failed',
          failureReason: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date()
        }
      );
    }
  }

  private async sendEmailViaProvider(email: string, subject: string, body: string, metadata?: Record<string, any>): Promise<void> {
    try {
      console.log(`📧 Sending email to ${email}...`);
      console.log(`📬 Subject: ${subject}`);
      console.log(`📄 Body: ${body.substring(0, 100)}${body.length > 100 ? '...' : ''}`);
      
      // Check if debug mode should be used
      const useDebugMode = await debugEmailService.shouldUseDebugMode();
      
      if (useDebugMode) {
        console.log(`🔧 Debug mode enabled - no active providers found`);
        
        // Save email as HTML file instead of sending
        const debugResult = await debugEmailService.saveDebugEmail({
          to: email,
          subject,
          htmlContent: body,
          textContent: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
          from: process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
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
      
      // Find an available provider (original logic)
      const provider = await EmailProviderModel.findOne({
        isActive: true,
        $expr: { $lt: ['$usedToday', '$dailyQuota'] }
      }).sort({ usedToday: 1 });

      if (!provider) {
        throw new Error('No available email providers');
      }

      // Prepare email request
      const emailRequest = {
        to: email,
        toName: email.split('@')[0], // Use part before @ as default name
        subject,
        htmlContent: body,
        textContent: body.replace(/<[^>]*>/g, ''), // Strip HTML for text version
        fromEmail: process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
        fromName: process.env.DEFAULT_FROM_NAME || 'Email Service',
        metadata: metadata || {}
      };

      // Send email using the real provider service
      const response = await emailProviderService.sendEmail(provider, emailRequest);
      
      if (response.success) {
        // Update provider usage
        await emailProviderService.incrementProviderUsage(provider.id);
        console.log(`✅ Email sent successfully to ${email} via ${provider.name}: ${response.messageId}`);
      } else {
        throw new Error(response.error || 'Email sending failed');
      }
      
    } catch (error) {
      console.error(`❌ Error sending email to ${email}:`, error);
      throw error;
    }
  }
}

export const emailProcessorService = new EmailProcessorService();
