# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an n8n community node package for integrating deAPI (AI model generation service) into n8n workflows. It provides both a regular node (Deapi) for making API calls and a trigger node (DeapiTrigger) for webhook-based notifications.

## Development Commands

### Build
- `npm run build` - Build the node using n8n-node CLI
- `npm run build:watch` - Watch mode with TypeScript compiler

### Development
- `npm run dev` - Start n8n-node development mode

### Linting
- `npx eslint nodes/ credentials/` - Run ESLint checks

### Testing
- `npm test` - Run Jest tests
- `jest <test-file-path>` - Run a specific test file

### Release
- `npm run release` - Publish a new release

## Architecture

### Node Types

This package implements two node types:

1. **Deapi Node** (`nodes/Deapi/Deapi.node.ts`) - Regular execution node
   - Supports multiple resources: image, video, audio, prompt
   - Uses a router pattern to delegate to resource-specific operations

2. **DeapiTrigger Node** (`nodes/Deapi/DeapiTrigger.node.ts`) - Webhook trigger node
   - Listens for deAPI job status webhooks (processing, completed, failed)
   - Requires HTTPS webhook URLs

### Resource/Operation Pattern

The Deapi node uses a hierarchical resource/operation structure:
- Resources are defined in `nodes/Deapi/actions/`
- Each resource folder (e.g., `image/`, `prompt/`) exports operations via `index.ts`
- Each operation file (e.g., `generate.operation.ts`) exports:
  - `description` - INodeProperties array for the UI
  - `execute()` - Function implementing the operation logic

### Router System

The `nodes/Deapi/actions/router.ts` file:
- Reads the `resource` and `operation` parameters
- Dynamically imports and executes the appropriate operation
- Handles errors with `continueOnFail` support
- Processes items in batch

### API Transport Layer

All API communication goes through `nodes/Deapi/transport/index.ts`:
- `apiRequest()` function handles authentication and request formatting
- Base URL: `https://api.deapi.ai/api/v1/client`
- Uses n8n's `httpRequestWithAuthentication` helper
- Credentials referenced by name: `deApi`

### Credentials

One credential type in `credentials/`:
1. **DeApi.credentials.ts** - API key and webhook secret authentication (used by both the regular node and trigger node)

### Type Definitions

`nodes/Deapi/helpers/interfaces.ts` contains TypeScript interfaces for:
- API request payloads (e.g., `TextToImageRequest`)
- API responses (e.g., `BoosterResponse`)

## Adding New Operations

To add a new operation to an existing resource:

1. Create `<operation-name>.operation.ts` in the resource folder
2. Export `description` (INodeProperties array) and `execute()` function
3. Add the operation to the resource's `index.ts` export
4. Update the router switch statement if needed

To add a new resource:

1. Create a new folder in `nodes/Deapi/actions/`
2. Create operation files following the pattern above
3. Create an `index.ts` that exports all operations
4. Import and spread the resource description in `Deapi.node.ts`
5. Add the resource to the router switch statement

## Testing

Tests use Jest with ts-jest preset. Test files should:
- Be placed alongside source files with `.test.ts` extension
- Use `jest-mock-extended` for mocking n8n types
- Example: `nodes/Deapi/actions/router.test.ts`

## Webhook-Based Waiting Pattern

The Deapi node implements a "Wait for Completion" pattern similar to n8n's core Wait node. The node **always** waits for deAPI to complete generation via webhook callback.

### How It Works

1. **Execute Phase**: For every image generation request:
   - The node gets its webhook URL via `this.evaluateExpression('{{ $execution.resumeUrl }}', i)`
     - Note: `getNodeWebhookUrl()` only exists on `IWebhookFunctions`, not `IExecuteFunctions`
     - Use `evaluateExpression()` to access the special `$execution.resumeUrl` variable
   - Submits the generation request to deAPI with the `webhook_url` field included
   - Calls `this.putExecutionToWait(waitTill)` to pause execution
   - The workflow pauses and frees memory

2. **Webhook Phase**: When deAPI sends webhook notifications:
   - deAPI POSTs webhook events to the webhook URL as the job progresses
   - n8n routes the webhook to the paused execution
   - The `webhook()` method in `webhook.ts` processes the incoming data:
     - **job.processing**: Returns `noWebhookResponse: true` to acknowledge but keep waiting
     - **job.completed**: Resumes execution with the completion data (includes `result_url`)
     - **job.failed**: Resumes execution with the error data (includes `error_code`, `error_message`)
   - Execution only resumes when the job is completed or failed, not during processing

3. **Resume Phase**:
   - The workflow continues with the generation results
   - Next nodes receive the completed image/video data

### Key Configuration

The webhook is configured in `Deapi.node.ts`:
```typescript
webhooks: [
  {
    name: 'default',
    httpMethod: 'POST',
    responseMode: 'onReceived',
    path: 'webhook',
    restartWebhook: true,  // Critical: enables execution resume
  },
]
```

The `restartWebhook: true` flag tells n8n to link incoming webhooks to paused executions.

### deAPI Webhook Payload Structure

When deAPI calls the webhook, it sends:

```json
{
  "event": "job.processing|job.completed|job.failed",
  "delivery_id": "unique-delivery-id",
  "timestamp": 1234567890,
  "data": {
    "job_request_id": "req_123",
    "status": "done|processing|error",
    "previous_status": "pending|processing",
    "job_type": "txt2img",
    "result_url": "https://...",        // only for job.completed
    "completed_at": "2024-01-01T...",   // only for job.completed
    "processing_time_ms": 1234,         // only for job.completed
    "error_code": "ERR_001",            // only for job.failed
    "error_message": "Error details"    // only for job.failed
  }
}
```

**HTTP Headers sent by deAPI:**
- `Content-Type: application/json`
- `X-DeAPI-Signature` - HMAC-SHA256 signature for verification
- `X-DeAPI-Timestamp` - Unix timestamp
- `X-DeAPI-Event` - Event type (job.processing, job.completed, job.failed)
- `X-DeAPI-Delivery-Id` - Unique delivery identifier
- `User-Agent: DeAPI-Webhook/1.0`

**Response Requirements:**
- Must return 2xx status code (200-299) within 10 seconds
- Should respond immediately before processing
- Failed deliveries retry with exponential backoff (10 attempts over ~24 hours)

**Event Filtering:**
The webhook handler filters events as follows:
- `job.processing`: Returns `noWebhookResponse: true` - acknowledges the event but keeps the execution waiting
- `job.completed`: Returns `workflowData` - resumes execution with the completion data
- `job.failed`: Returns `workflowData` - resumes execution with the error data

This ensures the workflow only proceeds when the generation is actually complete or failed, not when it's just starting to process.

### Timeout Handling

- Configurable via `waitTimeout` option
- If timeout is reached before webhook is called, execution auto-resumes with initial state

## Important Notes

- After every build, run the linter to catch any issues
- Do not use external dependencies in any operation's implementation to satisfy the requirements of the linter
- Resolution options vary by model and are conditionally displayed using `displayOptions`
- Every generation operation always waits for completion via webhook - there is no option to skip waiting and get just the request_id
