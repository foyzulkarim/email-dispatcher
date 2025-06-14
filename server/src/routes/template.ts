import { FastifyInstance } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { TemplateRequest, ApiResponse } from '../types';
import { templateService } from '../services/TemplateService';

export default async function templateRoutes(fastify: FastifyInstance) {
  
  // Get all templates
  fastify.get<{ 
    Querystring: { 
      category?: string;
      page?: string;
      limit?: string;
    } 
  }>('/list', async (request, reply) => {
    try {
      const { category, page = '1', limit = '20' } = request.query;
      
      const templates = await templateService.getAllTemplates(category);
      
      // Implement pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;
      const paginatedTemplates = templates.slice(skip, skip + limitNum);
      
      return reply.send({
        success: true,
        data: {
          templates: paginatedTemplates,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: templates.length,
            pages: Math.ceil(templates.length / limitNum)
          }
        }
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting templates:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get template by ID
  fastify.get<{ Params: { templateId: string } }>('/:templateId', async (request, reply) => {
    try {
      const { templateId } = request.params;
      
      const template = await templateService.getTemplate(templateId);
      
      if (!template) {
        return reply.code(404).send({
          success: false,
          error: 'Template not found'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        data: template
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting template:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Create new template
  fastify.post<{ Body: TemplateRequest }>('/create', async (request, reply) => {
    try {
      const templateData = request.body;

      // Validate required fields
      if (!templateData.name || !templateData.subject || !templateData.htmlContent) {
        return reply.code(400).send({
          success: false,
          error: 'Missing required fields: name, subject, and htmlContent'
        } as ApiResponse);
      }

      // Create template with generated ID
      const templateWithId = {
        ...templateData,
        id: uuidv4(),
        isActive: templateData.isActive ?? true
      };

      const template = await templateService.createTemplate(templateWithId);

      return reply.code(201).send({
        success: true,
        data: template,
        message: 'Template created successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error creating template:', error);
      
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return reply.code(409).send({
          success: false,
          error: 'Template with this name already exists'
        } as ApiResponse);
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Update template
  fastify.put<{ 
    Params: { templateId: string };
    Body: Partial<TemplateRequest>;
  }>('/:templateId', async (request, reply) => {
    try {
      const { templateId } = request.params;
      const updateData = request.body;

      const updatedTemplate = await templateService.updateTemplate(templateId, updateData);

      if (!updatedTemplate) {
        return reply.code(404).send({
          success: false,
          error: 'Template not found'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        data: updatedTemplate,
        message: 'Template updated successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error updating template:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Delete template (soft delete)
  fastify.delete<{ Params: { templateId: string } }>('/:templateId', async (request, reply) => {
    try {
      const { templateId } = request.params;

      const deleted = await templateService.deleteTemplate(templateId);

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          error: 'Template not found'
        } as ApiResponse);
      }

      return reply.send({
        success: true,
        message: 'Template deleted successfully'
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error deleting template:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Preview template with sample data
  fastify.post<{ 
    Params: { templateId: string };
    Body: { variables?: Record<string, any> };
  }>('/:templateId/preview', async (request, reply) => {
    try {
      const { templateId } = request.params;
      const { variables = {} } = request.body;

      const preview = await templateService.previewTemplate(templateId, variables);

      return reply.send({
        success: true,
        data: preview
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error previewing template:', error);
      
      if (error instanceof Error && error.message.includes('not found')) {
        return reply.code(404).send({
          success: false,
          error: error.message
        } as ApiResponse);
      }

      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });

  // Get template categories
  fastify.get('/categories', async (request, reply) => {
    try {
      const templates = await templateService.getAllTemplates();
      const categories = [...new Set(templates
        .map(t => t.category)
        .filter(Boolean)
      )].sort();

      return reply.send({
        success: true,
        data: { categories }
      } as ApiResponse);

    } catch (error) {
      fastify.log.error('Error getting categories:', error);
      return reply.code(500).send({
        success: false,
        error: 'Internal server error'
      } as ApiResponse);
    }
  });
} 
