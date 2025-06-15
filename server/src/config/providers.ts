import { ProviderConfig } from '../types';

/**
 * Provider configurations for popular email services
 * These can be stored in database or loaded from configuration files
 */

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  
  // Brevo (formerly Sendinblue)
  brevo: {
    baseUrl: 'https://api.brevo.com/v3',
    endpoints: {
      send: '/smtp/email',
      webhook: '/webhooks'
    },
    authentication: {
      type: 'api_key',
      headerName: 'api-key'
    },
    requestFormat: {
      method: 'POST',
      contentType: 'application/json',
      bodyTemplate: JSON.stringify({
        sender: {
          email: '{{fromEmail}}',
          name: '{{fromName}}'
        },
        to: [{
          email: '{{to}}',
          name: '{{toName}}'
        }],
        subject: '{{subject}}',
        htmlContent: '{{htmlContent}}',
        textContent: '{{textContent}}'
      })
    },
    responseFormat: {
      messageIdField: 'messageId'
    }
  },

  // SendGrid
  sendgrid: {
    baseUrl: 'https://api.sendgrid.com/v3',
    endpoints: {
      send: '/mail/send'
    },
    authentication: {
      type: 'bearer',
      headerName: 'Authorization'
    },
    requestFormat: {
      method: 'POST',
      contentType: 'application/json',
      bodyTemplate: JSON.stringify({
        personalizations: [{
          to: [{
            email: '{{to}}',
            name: '{{toName}}'
          }]
        }],
        from: {
          email: '{{fromEmail}}',
          name: '{{fromName}}'
        },
        subject: '{{subject}}',
        content: [{
          type: 'text/html',
          value: '{{htmlContent}}'
        }, {
          type: 'text/plain', 
          value: '{{textContent}}'
        }]
      })
    },
    responseFormat: {
      // SendGrid returns 202 with X-Message-Id in headers
      messageIdField: 'x-message-id' // From headers
    }
  },

  // Mailjet
  mailjet: {
    baseUrl: 'https://api.mailjet.com/v3.1',
    endpoints: {
      send: '/send'
    },
    authentication: {
      type: 'basic',
      headerName: 'Authorization'
    },
    requestFormat: {
      method: 'POST',
      contentType: 'application/json',
      bodyTemplate: JSON.stringify({
        Messages: [{
          From: {
            Email: '{{fromEmail}}',
            Name: '{{fromName}}'
          },
          To: [{
            Email: '{{to}}',
            Name: '{{toName}}'
          }],
          Subject: '{{subject}}',
          TextPart: '{{textContent}}',
          HTMLPart: '{{htmlContent}}'
        }]
      })
    },
    responseFormat: {
      messageIdField: 'Messages[0].MessageID'
    }
  },

  // Mailgun
  mailgun: {
    baseUrl: 'https://api.mailgun.net/v3',
    endpoints: {
      send: '/messages' // Will be prefixed with domain
    },
    authentication: {
      type: 'basic' // username: 'api', password: API_KEY
    },
    requestFormat: {
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      bodyTemplate: 'from={{fromName}} <{{fromEmail}}>&to={{to}}&subject={{subject}}&html={{htmlContent}}&text={{textContent}}'
    },
    responseFormat: {
      messageIdField: 'id',
      successField: 'message'
    }
  },

  // Postmark
  postmark: {
    baseUrl: 'https://api.postmarkapp.com',
    endpoints: {
      send: '/email'
    },
    authentication: {
      type: 'api_key',
      headerName: 'X-Postmark-Server-Token'
    },
    requestFormat: {
      method: 'POST',
      contentType: 'application/json',
      bodyTemplate: JSON.stringify({
        From: '{{fromEmail}}',
        To: '{{to}}',
        Subject: '{{subject}}',
        HtmlBody: '{{htmlContent}}',
        TextBody: '{{textContent}}',
        MessageStream: 'outbound'
      })
    },
    responseFormat: {
      messageIdField: 'MessageID',
      errorField: 'Message'
    }
  },

  // MailerLite
  mailerlite: {
    baseUrl: 'https://api.mailerlite.com/api/v2',
    endpoints: {
      send: '/campaigns/send'
    },
    authentication: {
      type: 'api_key',
      headerName: 'X-MailerLite-ApiKey'
    },
    requestFormat: {
      method: 'POST',
      contentType: 'application/json',
      bodyTemplate: JSON.stringify({
        subject: '{{subject}}',
        from: '{{fromEmail}}',
        from_name: '{{fromName}}',
        content: '{{htmlContent}}',
        plain_text: '{{textContent}}',
        emails: ['{{to}}']
      })
    },
    responseFormat: {
      messageIdField: 'id'
    }
  },

  // AWS SES
  ses: {
    baseUrl: 'https://email.us-east-1.amazonaws.com',
    endpoints: {
      send: '/'
    },
    authentication: {
      type: 'custom' // AWS SIG4 - would need special handling
    },
    requestFormat: {
      method: 'POST',
      contentType: 'application/x-www-form-urlencoded',
      bodyTemplate: 'Action=SendEmail&Source={{fromEmail}}&Destination.ToAddresses.member.1={{to}}&Message.Subject.Data={{subject}}&Message.Body.Html.Data={{htmlContent}}&Message.Body.Text.Data={{textContent}}'
    },
    responseFormat: {
      messageIdField: 'SendEmailResponse.SendEmailResult.MessageId'
    }
  },

  // Custom SMTP-like provider template
  custom: {
    baseUrl: 'https://api.yourprovider.com/v1',
    endpoints: {
      send: '/send'
    },
    authentication: {
      type: 'api_key',
      headerName: 'Authorization',
      headerPrefix: 'Bearer '
    },
    requestFormat: {
      method: 'POST',
      contentType: 'application/json',
      bodyTemplate: JSON.stringify({
        from: {
          email: '{{fromEmail}}',
          name: '{{fromName}}'
        },
        to: '{{to}}',
        subject: '{{subject}}',
        html: '{{htmlContent}}',
        text: '{{textContent}}'
      })
    },
    responseFormat: {
      messageIdField: 'message_id',
      successField: 'success',
      errorField: 'error'
    }
  }
};

/**
 * Get provider configuration by type
 */
export function getProviderConfig(providerType: string): ProviderConfig | null {
  return PROVIDER_CONFIGS[providerType] || null;
}

/**
 * Get all available provider types
 */
export function getAvailableProviderTypes(): string[] {
  return Object.keys(PROVIDER_CONFIGS);
}

/**
 * Validate provider configuration
 */
export function validateProviderConfig(config: ProviderConfig): string[] {
  const errors: string[] = [];
  
  if (!config.baseUrl) {
    errors.push('baseUrl is required');
  }
  
  if (!config.endpoints?.send) {
    errors.push('endpoints.send is required');
  }
  
  if (!config.authentication?.type) {
    errors.push('authentication.type is required');
  }
  
  if (!config.requestFormat?.method) {
    errors.push('requestFormat.method is required');
  }
  
  if (!config.requestFormat?.bodyTemplate) {
    errors.push('requestFormat.bodyTemplate is required');
  }
  
  return errors;
} 
