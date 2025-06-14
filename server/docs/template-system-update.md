# Email Template System - Implementation Details

## Overview

The template system allows for creating and managing reusable email templates with dynamic variable substitution. This document provides technical details about the implementation.

## Core Components

### 1. Models
- **EmailTemplate**: MongoDB schema for storing templates with fields for subject, HTML content, text content, variables, and metadata.

### 2. Services
- **TemplateService**: Core service that handles template processing, variable extraction, and substitution.
  - `processTemplate()`: Processes a template with variables for a specific recipient
  - `replaceVariables()`: Handles variable substitution in template content
  - `extractVariables()`: Extracts variable names from template content
  - `validateAndExtractVariables()`: Validates template content and extracts variables

### 3. Routes
- **template.ts**: REST API endpoints for template management (CRUD operations)

## Variable Substitution Implementation

The template system supports two variable syntaxes:
- `{variable}` - Single brace syntax
- `{{variable}}` - Double brace syntax

### Implementation Details

```typescript
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
```

### Variable Extraction

The system automatically extracts variables from template content:

```typescript
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
```

## Template Processing Flow

1. **Template Request**: Client requests to process a template with variables
2. **Template Retrieval**: System fetches template from database
3. **Variable Validation**: System checks if all required variables are provided
4. **Built-in Variables**: System adds built-in variables (`recipient_email`, `current_date`, `current_year`)
5. **Variable Substitution**: System replaces all variables in subject, HTML content, and text content
6. **Return Processed Template**: System returns the processed template

```typescript
async processTemplate(
  templateId: string, 
  variables: Record<string, any> = {},
  recipientEmail?: string
): Promise<ProcessedTemplate> {
  // Get the template
  const template = await EmailTemplateModel.findOne({ 
    id: templateId, 
    isActive: true 
  });
  
  // Validate required variables
  const missingVariables = template.variables.filter(
    varName => variables[varName] === undefined || variables[varName] === null
  );
  
  // Add built-in variables
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
}
```

## Integration with Email Processing

The template system is integrated with the email processing flow:

1. **Email Job Submission**: Client can specify `templateId` and `templateVariables` instead of direct `subject` and `body`
2. **Per-recipient Processing**: Templates are processed individually for each recipient
3. **Variable Customization**: Each recipient can receive personalized content

```typescript
// In EmailProcessorService
if (job.templateId) {
  try {
    const processedTemplate = await templateService.processTemplate(
      job.templateId,
      job.templateVariables || {},
      email
    );
    emailSubject = processedTemplate.subject;
    emailBody = processedTemplate.htmlContent;
  } catch (templateError) {
    // Fallback to job's processed content
    emailSubject = job.subject;
    emailBody = job.body;
  }
}
```

## Database Schema

```typescript
interface EmailTemplate {
  id: string;
  name: string;
  description?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  variables: string[];
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}
```

## API Endpoints

### List Templates
```
GET /api/template/list
```

### Get Template by ID
```
GET /api/template/:templateId
```

### Create Template
```
POST /api/template/create
```

### Update Template
```
PUT /api/template/:templateId
```

### Delete Template
```
DELETE /api/template/:templateId
```

### Preview Template
```
POST /api/template/:templateId/preview
```

### Get Categories
```
GET /api/template/categories
```

## Current Limitations

1. **No HTML Validation**: The system doesn't validate HTML structure
2. **Limited Variable Types**: All variables are treated as strings
3. **No Conditional Logic**: Templates don't support conditional rendering
4. **No Loops or Iterations**: No support for iterating over arrays
5. **No Template Inheritance**: No support for template inheritance or partials

## Future Enhancements

1. **Rich Template Editor**: Web-based WYSIWYG editor
2. **Template Versioning**: Track changes to templates
3. **A/B Testing**: Test multiple template variants
4. **Advanced Logic**: Add support for conditionals and loops
5. **Template Analytics**: Track open rates, click rates per template