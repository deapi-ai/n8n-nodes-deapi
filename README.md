# n8n-nodes-deapi

[![npm version](https://img.shields.io/npm/v/n8n-nodes-deapi.svg)](https://www.npmjs.com/package/n8n-nodes-deapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

This is an n8n community node that lets you use [deAPI](https://deapi.ai/) in your n8n workflows.

deAPI is a unified API platform providing instant access to open-source AI models (FLUX, LTX Video, Whisper and more) through a decentralized GPU network. One API key to access thousands of GPUs with up to 20x lower costs.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Credentials

To use this node, you need to configure the following credentials:

| Field | Description |
|-------|-------------|
| **API Key** | Your deAPI API key. Get it from the [deAPI Quickstart Guide](https://docs.deapi.ai/quickstart#2-obtain-your-api-key). |
| **Webhook Secret** | Secret used to verify webhook signatures. Configure it at [deAPI Webhook Settings](https://deapi.ai/settings/webhooks). |

## Operations

### Image

| Operation | Description | Models |
|-----------|-------------|--------|
| **Generate** | Generate an image from a text prompt | FLUX.1 Schnell, FLUX.2 Klein 4B, Z-Image Turbo |
| **Remove Background** | Remove the background from an image | Ben2 |
| **Upscale** | Increase image resolution by 4x | RealESRGAN x4 |

### Video

| Operation | Description | Models |
|-----------|-------------|--------|
| **Generate** | Generate a video from text or image(s) | LTX-Video 0.9.8, LTX-2 19B |
| **Transcribe** | Transcribe video to text (YouTube, Twitch, X, Kick URLs or file upload) | Whisper Large V3 |

### Audio

| Operation | Description | Models |
|-----------|-------------|--------|
| **Transcribe** | Transcribe audio file to text | Whisper Large V3 |

### Prompt

| Operation | Description |
|-----------|-------------|
| **Image Prompt Booster** | Optimize a prompt for text-to-image generation |
| **Video Prompt Booster** | Optimize a prompt for text/image-to-video generation |

## How It Works

Generation operations (image, video, transcription) use a webhook-based waiting pattern:

1. The node submits a generation request to deAPI with a webhook URL
2. The workflow pauses while deAPI processes the request
3. When deAPI completes the job, it sends a webhook notification
4. The workflow resumes with the generated content (binary file or text)

This approach ensures efficient resource usage - the workflow doesn't actively poll for results.

## Compatibility

- Tested with n8n version 2.3.4
- Webhook-based operations require n8n to be accessible via HTTPS

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [deAPI Documentation](https://docs.deapi.ai/)
- [deAPI Website](https://deapi.ai/)
- [GitHub Repository](https://github.com/deapi-ai/n8n-nodes-deapi)

## License

[MIT](LICENSE)
