import type {
  Icon,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

export class DeApiWebhook implements ICredentialType {
  name = 'deapiWebhook';

  displayName = 'deAPI Webhook';

  documentationUrl = 'https://docs.deapi.ai/execution-modes-and-integrations/webhooks#configuration';

  icon: Icon = 'file:deapi.svg';

  properties: INodeProperties[] = [
    {
      displayName: 'Webhook Secret',
      name: 'webhookSecret',
      type: 'string',
      typeOptions: { password: true },
      default: '',
      required: true,
      description: 'Secret to verify HMAC signature from deAPI webhooks',
    },
  ];
}