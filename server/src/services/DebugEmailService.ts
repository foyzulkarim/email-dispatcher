import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface DebugEmailData {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  from: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class DebugEmailService {
  private debugDir: string;

  constructor() {
    // Create debug directory in the project root
    this.debugDir = path.join(process.cwd(), 'mail-debug');
    this.ensureDebugDirectory();
  }

  /**
   * Ensure the debug directory exists
   */
  private ensureDebugDirectory(): void {
    if (!fs.existsSync(this.debugDir)) {
      fs.mkdirSync(this.debugDir, { recursive: true });
      console.log(`📁 Created mail-debug directory: ${this.debugDir}`);
    }
  }

  /**
   * Generate and save debug email as HTML file
   */
  async saveDebugEmail(emailData: DebugEmailData): Promise<{ success: boolean; messageId: string; filePath: string }> {
    try {
      const messageId = uuidv4();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const sanitizedTo = emailData.to.replace(/[^a-zA-Z0-9@.-]/g, '_');
      const filename = `${timestamp}_${sanitizedTo}_${messageId.split('-')[0]}.html`;
      const filePath = path.join(this.debugDir, filename);

      // Generate HTML content
      const htmlContent = this.generateEmailHTML(emailData, messageId);

      // Write to file
      fs.writeFileSync(filePath, htmlContent, 'utf8');

      // Also create a summary file for easy browsing
      await this.updateSummaryFile(emailData, messageId, filename);

      console.log(`📧 Debug email saved: ${filePath}`);

      return {
        success: true,
        messageId,
        filePath
      };
    } catch (error) {
      console.error('❌ Failed to save debug email:', error);
      return {
        success: false,
        messageId: 'error',
        filePath: ''
      };
    }
  }

  /**
   * Generate HTML email with proper styling
   */
  private generateEmailHTML(emailData: DebugEmailData, messageId: string): string {
    const escapedTextContent = emailData.textContent 
      ? emailData.textContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')
      : 'No text content provided';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Email - ${emailData.subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .email-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .debug-header {
            background: #1a1a1a;
            color: white;
            padding: 20px;
            border-bottom: 3px solid #ff6b35;
        }
        .debug-header h1 {
            margin: 0;
            font-size: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .debug-badge {
            background: #ff6b35;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .email-headers {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .header-row {
            display: flex;
            margin-bottom: 8px;
            align-items: flex-start;
        }
        .header-label {
            font-weight: 600;
            color: #495057;
            min-width: 80px;
            margin-right: 10px;
        }
        .header-value {
            color: #212529;
            word-break: break-all;
        }
        .email-content {
            padding: 20px;
        }
        .content-section {
            margin-bottom: 30px;
        }
        .content-section h3 {
            margin: 0 0 15px 0;
            color: #495057;
            font-size: 16px;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 5px;
        }
        .html-preview {
            border: 1px solid #dee2e6;
            border-radius: 4px;
            overflow: hidden;
        }
        .html-preview iframe {
            width: 100%;
            min-height: 400px;
            border: none;
        }
        .text-content {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
            white-space: pre-wrap;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.4;
        }
        .metadata {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #2196f3;
        }
        .metadata pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            white-space: pre-wrap;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            font-size: 14px;
            border-top: 1px solid #e9ecef;
        }
        .warning-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 20px;
            color: #856404;
        }
        .warning-note strong {
            color: #533f03;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="debug-header">
            <h1>
                📧 Debug Email 
                <span class="debug-badge">Development Mode</span>
            </h1>
        </div>

        <div class="warning-note">
            <strong>⚠️ Development Mode:</strong> This email was not sent to any real recipients. 
            It's saved locally for testing purposes${process.env.FORCE_DEBUG_MODE === 'true' ? ' because debug mode is forced via FORCE_DEBUG_MODE=true' : ' because no email providers are configured or available'}.
        </div>

        <div class="email-headers">
            <div class="header-row">
                <div class="header-label">Message ID:</div>
                <div class="header-value"><code>${messageId}</code></div>
            </div>
            <div class="header-row">
                <div class="header-label">To:</div>
                <div class="header-value">${emailData.to}</div>
            </div>
            <div class="header-row">
                <div class="header-label">From:</div>
                <div class="header-value">${emailData.from}</div>
            </div>
            <div class="header-row">
                <div class="header-label">Subject:</div>
                <div class="header-value"><strong>${emailData.subject}</strong></div>
            </div>
            <div class="header-row">
                <div class="header-label">Date:</div>
                <div class="header-value">${emailData.timestamp.toLocaleString()}</div>
            </div>
        </div>

        <div class="email-content">
            <div class="content-section">
                <h3>📱 HTML Content Preview</h3>
                <div class="html-preview">
                    <iframe srcdoc="${emailData.htmlContent.replace(/"/g, '&quot;')}" title="Email HTML Preview"></iframe>
                </div>
            </div>

            <div class="content-section">
                <h3>📝 Text Content</h3>
                <div class="text-content">${escapedTextContent}</div>
            </div>

            ${emailData.metadata && Object.keys(emailData.metadata).length > 0 ? `
            <div class="content-section">
                <h3>🏷️ Metadata</h3>
                <div class="metadata">
                    <pre>${JSON.stringify(emailData.metadata, null, 2)}</pre>
                </div>
            </div>
            ` : ''}
        </div>

        <div class="footer">
            <p>Generated by Email Dispatch Service - Debug Mode</p>
            <p>File saved at: <code>${path.basename(this.debugDir)}</code></p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Update summary file with email information
   */
  private async updateSummaryFile(emailData: DebugEmailData, messageId: string, filename: string): Promise<void> {
    try {
      const summaryPath = path.join(this.debugDir, 'email-summary.json');
      
      // Read existing summary or create new one
      let summary: any[] = [];
      if (fs.existsSync(summaryPath)) {
        const summaryContent = fs.readFileSync(summaryPath, 'utf8');
        summary = JSON.parse(summaryContent);
      }

      // Add new email entry
      summary.unshift({
        messageId,
        filename,
        to: emailData.to,
        subject: emailData.subject,
        timestamp: emailData.timestamp.toISOString(),
        from: emailData.from,
        hasMetadata: emailData.metadata && Object.keys(emailData.metadata).length > 0
      });

      // Keep only last 100 emails in summary
      if (summary.length > 100) {
        summary = summary.slice(0, 100);
      }

      // Write updated summary
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    } catch (error) {
      console.error('Failed to update summary file:', error);
    }
  }

  /**
   * Check if debug mode should be enabled (no active providers OR forced via env var)
   */
  async shouldUseDebugMode(): Promise<boolean> {
    try {
      // Check if debug mode is forced via environment variable
      if (process.env.FORCE_DEBUG_MODE === 'true') {
        console.log('🔧 Debug mode forced via FORCE_DEBUG_MODE environment variable');
        return true;
      }

      // Import here to avoid circular dependency
      const { UserProviderModel } = await import('../models/UserProvider');
      
      const activeProviders = await UserProviderModel.countDocuments({
        isActive: true,
        $expr: { $lt: ['$usedToday', '$dailyQuota'] }
      });

      return activeProviders === 0;
    } catch (error) {
      console.error('Error checking providers for debug mode:', error);
      return true; // Default to debug mode if there's an error
    }
  }

  /**
   * Clean up old debug files (older than 7 days)
   */
  async cleanupOldFiles(): Promise<void> {
    try {
      const files = fs.readdirSync(this.debugDir);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      let cleanedCount = 0;
      for (const file of files) {
        if (file.endsWith('.html')) {
          const filePath = path.join(this.debugDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime < sevenDaysAgo) {
            fs.unlinkSync(filePath);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} old debug email files`);
      }
    } catch (error) {
      console.error('Error cleaning up debug files:', error);
    }
  }
}

export const debugEmailService = new DebugEmailService(); 
