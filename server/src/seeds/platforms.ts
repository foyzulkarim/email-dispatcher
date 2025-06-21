import type { Platform } from '../types';
import { PlatformType, AuthType, HttpMethod } from '../types/enums';

export const platformSeeds: Omit<Platform, 'id'>[] = [
  {
    name: 'sendgrid',
    type: PlatformType.SENDGRID,
    displayName: 'SendGrid',
    description: 'SendGrid email delivery platform',
    documentationUrl: 'https://docs.sendgrid.com/api-reference/mail-send/mail-send',
    isActive: true,
    authType: AuthType.BEARER,
    defaultConfig: {
      endpoint: 'https://api.sendgrid.com/v3/mail/send',
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json'
      },
      payloadTemplate: {
        personalizations: [
          {
            to: '{{recipients}}',
            subject: '{{subject}}'
          }
        ],
        from: {
          email: '{{sender.email}}',
          name: '{{sender.name}}'
        },
        content: [
          {
            type: 'text/html',
            value: '{{htmlContent}}'
          }
        ]
      },
      authentication: {
        type: 'bearer',
        headerName: 'Authorization',
        prefix: 'Bearer '
      },
      fieldMappings: {
        sender: 'from',
        recipients: 'personalizations[0].to',
        subject: 'personalizations[0].subject',
        htmlContent: 'content[0].value',
        textContent: 'content[1].value'
      },
      responseMapping: {
        successField: 'message_id',
        messageIdField: 'message_id'
      }
    }
  },
  {
    name: 'mailgun',
    type: PlatformType.MAILGUN,
    displayName: 'Mailgun',
    description: 'Mailgun email delivery service',
    documentationUrl: 'https://documentation.mailgun.com/en/latest/api-sending.html',
    isActive: true,
    authType: AuthType.BASIC,
    defaultConfig: {
      endpoint: 'https://api.mailgun.net/v3/{{domain}}/messages',
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payloadTemplate: {
        from: '{{sender.name}} <{{sender.email}}>',
        to: '{{recipients}}',
        subject: '{{subject}}',
        html: '{{htmlContent}}'
      },
      authentication: {
        type: 'basic',
        headerName: 'Authorization'
      },
      fieldMappings: {
        sender: 'from',
        recipients: 'to',
        subject: 'subject',
        htmlContent: 'html',
        textContent: 'text'
      },
      responseMapping: {
        successField: 'message',
        messageIdField: 'id'
      }
    }
  },
  {
    name: 'postmark',
    type: PlatformType.POSTMARK,
    displayName: 'Postmark',
    description: 'Postmark transactional email service',
    documentationUrl: 'https://postmarkapp.com/developer/api/email-api',
    isActive: true,
    authType: AuthType.API_KEY,
    defaultConfig: {
      endpoint: 'https://api.postmarkapp.com/email',
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      payloadTemplate: {
        From: '{{sender.email}}',
        To: '{{recipients}}',
        Subject: '{{subject}}',
        HtmlBody: '{{htmlContent}}'
      },
      authentication: {
        type: 'api-key',
        headerName: 'X-Postmark-Server-Token'
      },
      fieldMappings: {
        sender: 'From',
        recipients: 'To',
        subject: 'Subject',
        htmlContent: 'HtmlBody',
        textContent: 'TextBody'
      },
      responseMapping: {
        successField: 'Message',
        messageIdField: 'MessageID'
      }
    }
  },
  {
    name: 'mailjet',
    type: PlatformType.MAILJET,
    displayName: 'Mailjet',
    description: 'Mailjet email delivery platform',
    documentationUrl: 'https://dev.mailjet.com/email/guides/send-api-v31/',
    isActive: true,
    authType: AuthType.API_KEY_SECRET,
    defaultConfig: {
      endpoint: 'https://api.mailjet.com/v3.1/send',
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json'
      },
      payloadTemplate: {
        Messages: [
          {
            From: {
              Email: '{{sender.email}}',
              Name: '{{sender.name}}'
            },
            To: '{{recipients}}',
            Subject: '{{subject}}',
            HTMLPart: '{{htmlContent}}'
          }
        ]
      },
      authentication: {
        type: 'basic',
        headerName: 'Authorization'
      },
      fieldMappings: {
        sender: 'Messages[0].From',
        recipients: 'Messages[0].To',
        subject: 'Messages[0].Subject',
        htmlContent: 'Messages[0].HTMLPart',
        textContent: 'Messages[0].TextPart'
      },
      responseMapping: {
        successField: 'Messages[0].Status',
        messageIdField: 'Messages[0].MessageID'
      }
    }
  },
  {
    name: 'brevo',
    type: PlatformType.BREVO,
    displayName: 'Brevo (Sendinblue)',
    description: 'Brevo email marketing and transactional email platform',
    documentationUrl: 'https://developers.brevo.com/reference/sendtransacemail',
    isActive: true,
    authType: AuthType.API_KEY,
    defaultConfig: {
      endpoint: 'https://api.brevo.com/v3/smtp/email',
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      payloadTemplate: {
        sender: {
          name: '{{sender.name}}',
          email: '{{sender.email}}'
        },
        to: '{{recipients}}',
        subject: '{{subject}}',
        htmlContent: '{{htmlContent}}'
      },
      authentication: {
        type: 'api-key',
        headerName: 'api-key'
      },
      fieldMappings: {
        sender: 'sender',
        recipients: 'to',
        subject: 'subject',
        htmlContent: 'htmlContent',
        textContent: 'textContent'
      },
      responseMapping: {
        successField: 'messageId',
        messageIdField: 'messageId'
      }
    }
  },
  {
    name: 'ses',
    type: PlatformType.SES,
    displayName: 'Amazon SES',
    description: 'Amazon Simple Email Service',
    documentationUrl: 'https://docs.aws.amazon.com/ses/latest/APIReference/API_SendEmail.html',
    isActive: true,
    authType: AuthType.API_KEY_SECRET,
    defaultConfig: {
      endpoint: 'https://email.{{region}}.amazonaws.com/',
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      payloadTemplate: {
        Action: 'SendEmail',
        Version: '2010-12-01',
        'Source': '{{sender.email}}',
        'Destination.ToAddresses.member.1': '{{recipients}}',
        'Message.Subject.Data': '{{subject}}',
        'Message.Body.Html.Data': '{{htmlContent}}'
      },
      authentication: {
        type: 'custom',
        customHeaders: {
          'Authorization': 'AWS4-HMAC-SHA256'
        }
      },
      fieldMappings: {
        sender: 'Source',
        recipients: 'Destination.ToAddresses.member.1',
        subject: 'Message.Subject.Data',
        htmlContent: 'Message.Body.Html.Data',
        textContent: 'Message.Body.Text.Data'
      },
      responseMapping: {
        successField: 'MessageId',
        messageIdField: 'MessageId'
      }
    }
  }
];
