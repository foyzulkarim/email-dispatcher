import { EmailTemplateModel } from '../models/EmailTemplate';
import { ProcessedTemplate } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class TemplateService {
  
  /**
   * Process a template with variables (can access system templates or user templates)
   */
  async processTemplate(
    templateId: string, 
    variables: Record<string, any> = {},
    recipientEmail?: string,
    userId?: string
  ): Promise<ProcessedTemplate> {
    try {
      // Get the template - allow system templates (no userId) or user templates
      const filter: any = { 
        id: templateId, 
        isActive: true 
      };
      
      // If userId is provided, allow both user templates and system templates
      if (userId) {
        filter.$or = [
          { userId: userId },
          { createdBy: 'system' }
        ];
      }

      const template = await EmailTemplateModel.findOne(filter);

      if (!template) {
        throw new Error(`Template with ID ${templateId} not found or inactive`);
      }

      // Validate required variables
      const missingVariables = template.variables.filter(
        varName => variables[varName] === undefined || variables[varName] === null
      );

      if (missingVariables.length > 0) {
        throw new Error(`Missing required variables: ${missingVariables.join(', ')}`);
      }

      // Add recipient email as a built-in variable
      const allVariables = {
        ...variables,
        recipient_email: recipientEmail || '',
        current_date: new Date().toLocaleDateString(),
        current_year: new Date().getFullYear().toString()
      };

      // Process the template
      const processedSubject = this.replaceVariables(template.subject, allVariables);
      const processedHtmlContent = this.replaceVariables(template.htmlContent, allVariables);
      const processedTextContent = template.textContent 
        ? this.replaceVariables(template.textContent, allVariables)
        : undefined;

      return {
        subject: processedSubject,
        htmlContent: processedHtmlContent,
        textContent: processedTextContent
      };

    } catch (error) {
      console.error('Error processing template:', error);
      throw error;
    }
  }

  /**
   * Replace variables in template content
   * Supports both {{variable}} and {variable} syntax
   */
  private replaceVariables(content: string, variables: Record<string, any>): string {
    let processedContent = content;

    // Replace {{variable}} syntax
    processedContent = processedContent.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });

    // Replace {variable} syntax
    processedContent = processedContent.replace(/\{(\w+)\}/g, (match, varName) => {
      return variables[varName] !== undefined ? String(variables[varName]) : match;
    });

    return processedContent;
  }

  /**
   * Extract variables from template content
   */
  extractVariables(content: string): string[] {
    const variables = new Set<string>();
    
    // Extract {{variable}} syntax
    const doubleMatches = content.match(/\{\{(\w+)\}\}/g);
    if (doubleMatches) {
      doubleMatches.forEach(match => {
        const varName = match.replace(/\{\{|\}\}/g, '');
        variables.add(varName);
      });
    }

    // Extract {variable} syntax
    const singleMatches = content.match(/\{(\w+)\}/g);
    if (singleMatches) {
      singleMatches.forEach(match => {
        const varName = match.replace(/\{|\}/g, '');
        variables.add(varName);
      });
    }

    return Array.from(variables);
  }

  /**
   * Validate template content and extract variables
   */
  validateAndExtractVariables(subject: string, htmlContent: string, textContent?: string): string[] {
    const allVariables = new Set<string>();
    
    // Extract from subject
    this.extractVariables(subject).forEach(v => allVariables.add(v));
    
    // Extract from HTML content
    this.extractVariables(htmlContent).forEach(v => allVariables.add(v));
    
    // Extract from text content if provided
    if (textContent) {
      this.extractVariables(textContent).forEach(v => allVariables.add(v));
    }

    return Array.from(allVariables);
  }

  /**
   * Get all templates for a user (includes system templates)
   */
  async getUserTemplates(userId: string, category?: string): Promise<any[]> {
    const filter: any = { 
      isActive: true,
      $or: [
        { userId: userId },
        { createdBy: 'system' }
      ]
    };
    
    if (category) {
      filter.category = category;
    }

    return await EmailTemplateModel.find(filter)
      .sort({ createdBy: 1, name: 1 }) // System templates first, then user templates
      .select('id name description subject variables category createdAt updatedAt createdBy userId');
  }

  /**
   * Get template by ID (user-scoped)
   */
  async getUserTemplate(userId: string, templateId: string): Promise<any> {
    const filter = {
      id: templateId,
      $or: [
        { userId: userId },
        { createdBy: 'system' }
      ]
    };
    
    return await EmailTemplateModel.findOne(filter);
  }

  /**
   * Create a new template for a user
   */
  async createUserTemplate(userId: string, templateData: any): Promise<any> {
    // Extract variables from content
    const extractedVariables = this.validateAndExtractVariables(
      templateData.subject,
      templateData.htmlContent,
      templateData.textContent
    );

    const template = new EmailTemplateModel({
      ...templateData,
      id: uuidv4(),
      userId,
      variables: extractedVariables,
      createdBy: 'user'
    });

    return await template.save();
  }

  /**
   * Update a user template
   */
  async updateUserTemplate(userId: string, templateId: string, updateData: any): Promise<any> {
    // Only allow users to update their own templates (not system templates)
    const template = await EmailTemplateModel.findOne({ 
      id: templateId, 
      userId: userId,
      createdBy: 'user'
    });
    
    if (!template) {
      throw new Error('Template not found or cannot be modified');
    }

    // Extract variables from content if content is being updated
    if (updateData.subject || updateData.htmlContent || updateData.textContent) {
      const extractedVariables = this.validateAndExtractVariables(
        updateData.subject || template.subject,
        updateData.htmlContent || template.htmlContent,
        updateData.textContent || template.textContent
      );
      updateData.variables = extractedVariables;
    }

    return await EmailTemplateModel.findOneAndUpdate(
      { id: templateId, userId: userId, createdBy: 'user' },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
  }

  /**
   * Delete a user template (soft delete by setting isActive to false)
   */
  async deleteUserTemplate(userId: string, templateId: string): Promise<boolean> {
    // Only allow users to delete their own templates (not system templates)
    const result = await EmailTemplateModel.findOneAndUpdate(
      { id: templateId, userId: userId, createdBy: 'user' },
      { isActive: false, updatedAt: new Date() }
    );
    
    return !!result;
  }

  /**
   * Create a preview of the template with sample data
   */
  async previewUserTemplate(userId: string, templateId: string, sampleVariables: Record<string, any> = {}): Promise<ProcessedTemplate> {
    const template = await this.getUserTemplate(userId, templateId);

    if (!template) {
      throw new Error(`Template with ID ${templateId} not found or inactive`);
    }

    // Generate sample data for missing variables
    const previewVariables = { ...sampleVariables };
    template.variables.forEach((varName: string) => {
      if (previewVariables[varName] === undefined) {
        previewVariables[varName] = this.generateSampleValue(varName);
      }
    });

    return this.processTemplate(templateId, previewVariables, 'preview@example.com', userId);
  }

  /**
   * Generate sample values for template variables
   */
  private generateSampleValue(variableName: string): string {
    const sampleValues: Record<string, string> = {
      name: 'John Doe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      company: 'Acme Corp',
      company_name: 'Acme Corp',
      link: 'https://example.com',
      url: 'https://example.com',
      dashboard_link: 'https://example.com/dashboard',
      reset_link: 'https://example.com/reset-password',
      token: 'abc123def456',
      code: '123456',
      amount: '$99.99',
      total_amount: '$99.99',
      date: new Date().toLocaleDateString(),
      order_date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      order_id: 'ORD-12345',
      tracking_link: 'https://example.com/track/12345'
    };

    return sampleValues[variableName.toLowerCase()] || `[${variableName}]`;
  }

  /**
   * Get template categories for a user
   */
  async getUserTemplateCategories(userId: string): Promise<string[]> {
    const templates = await this.getUserTemplates(userId);
    const categories = [...new Set(templates
      .map(t => t.category)
      .filter(Boolean)
    )].sort();

    return categories;
  }

  // Legacy methods for backward compatibility (will be deprecated)
  async getAllTemplates(category?: string): Promise<any[]> {
    console.warn('getAllTemplates is deprecated. Use getUserTemplates instead.');
    const filter: any = { isActive: true };
    if (category) {
      filter.category = category;
    }

    return await EmailTemplateModel.find(filter)
      .sort({ name: 1 })
      .select('id name description subject variables category createdAt updatedAt');
  }

  async getTemplate(templateId: string): Promise<any> {
    console.warn('getTemplate is deprecated. Use getUserTemplate instead.');
    return await EmailTemplateModel.findOne({ id: templateId });
  }

  async createTemplate(templateData: any): Promise<any> {
    console.warn('createTemplate is deprecated. Use createUserTemplate instead.');
    const extractedVariables = this.validateAndExtractVariables(
      templateData.subject,
      templateData.htmlContent,
      templateData.textContent
    );

    const template = new EmailTemplateModel({
      ...templateData,
      variables: extractedVariables
    });

    return await template.save();
  }

  async updateTemplate(templateId: string, updateData: any): Promise<any> {
    console.warn('updateTemplate is deprecated. Use updateUserTemplate instead.');
    if (updateData.subject || updateData.htmlContent || updateData.textContent) {
      const template = await EmailTemplateModel.findOne({ id: templateId });
      if (template) {
        const extractedVariables = this.validateAndExtractVariables(
          updateData.subject || template.subject,
          updateData.htmlContent || template.htmlContent,
          updateData.textContent || template.textContent
        );
        updateData.variables = extractedVariables;
      }
    }

    return await EmailTemplateModel.findOneAndUpdate(
      { id: templateId },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
  }

  async deleteTemplate(templateId: string): Promise<boolean> {
    console.warn('deleteTemplate is deprecated. Use deleteUserTemplate instead.');
    const result = await EmailTemplateModel.findOneAndUpdate(
      { id: templateId },
      { isActive: false, updatedAt: new Date() }
    );
    
    return !!result;
  }

  async previewTemplate(templateId: string, sampleVariables: Record<string, any> = {}): Promise<ProcessedTemplate> {
    console.warn('previewTemplate is deprecated. Use previewUserTemplate instead.');
    const template = await EmailTemplateModel.findOne({ 
      id: templateId, 
      isActive: true 
    });

    if (!template) {
      throw new Error(`Template with ID ${templateId} not found or inactive`);
    }

    const previewVariables = { ...sampleVariables };
    template.variables.forEach((varName: string) => {
      if (previewVariables[varName] === undefined) {
        previewVariables[varName] = this.generateSampleValue(varName);
      }
    });

    return this.processTemplate(templateId, previewVariables, 'preview@example.com');
  }
}

export const templateService = new TemplateService(); 
