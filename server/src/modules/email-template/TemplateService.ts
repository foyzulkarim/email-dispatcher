import { EmailTemplateModel } from './EmailTemplate';
import { ProcessedTemplate } from '../../types';

export class TemplateService {
  
  /**
   * Process a template with variables
   */
  async processTemplate(
    templateId: string, 
    variables: Record<string, any> = {},
    recipientEmail?: string
  ): Promise<ProcessedTemplate> {
    try {
      // Get the template
      const template = await EmailTemplateModel.findOne({ 
        id: templateId, 
        isActive: true 
      });

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
   * Create a preview of the template with sample data
   */
  async previewTemplate(templateId: string, sampleVariables: Record<string, any> = {}): Promise<ProcessedTemplate> {
    const template = await EmailTemplateModel.findOne({ 
      id: templateId, 
      isActive: true 
    });

    if (!template) {
      throw new Error(`Template with ID ${templateId} not found or inactive`);
    }

    // Generate sample data for missing variables
    const previewVariables = { ...sampleVariables };
    template.variables.forEach(varName => {
      if (previewVariables[varName] === undefined) {
        previewVariables[varName] = this.generateSampleValue(varName);
      }
    });

    return this.processTemplate(templateId, previewVariables, 'preview@example.com');
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
      link: 'https://example.com',
      url: 'https://example.com',
      token: 'abc123def456',
      code: '123456',
      amount: '$99.99',
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString()
    };

    return sampleValues[variableName.toLowerCase()] || `[${variableName}]`;
  }

  /**
   * Get all active templates
   */
  async getAllTemplates(category?: string): Promise<any[]> {
    const filter: any = { isActive: true };
    if (category) {
      filter.category = category;
    }

    return await EmailTemplateModel.find(filter)
      .sort({ name: 1 })
      .select('id name description subject variables category createdAt updatedAt');
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<any> {
    return await EmailTemplateModel.findOne({ id: templateId });
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData: any): Promise<any> {
    // Extract variables from content
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

  /**
   * Update a template
   */
  async updateTemplate(templateId: string, updateData: any): Promise<any> {
    // Extract variables from content if content is being updated
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

  /**
   * Delete a template (soft delete by setting isActive to false)
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    const result = await EmailTemplateModel.findOneAndUpdate(
      { id: templateId },
      { isActive: false, updatedAt: new Date() }
    );
    
    return !!result;
  }
}

export const templateService = new TemplateService(); 
