# Changelog

## [0.2.0] - 2026-03-18

### Added
- Text-to-speech generation (Kokoro, Chatterbox, Qwen3 TTS Custom Voice, Qwen3 TTS Voice Design)
- Voice cloning from reference audio (Qwen3 TTS VoiceClone)
- Video generation from audio (LTX-2.3 22B Distilled INT8)
- New video generation model: LTX-2.3 22B Distilled INT8

### Changed
- Default aspect ratio for video generation changed to landscape

## [0.1.0] - 2026-02-17

### Added
- Image generation (FLUX.1 Schnell, FLUX.2 Klein 4B, Z-Image Turbo)
- Image background removal (Ben2)
- Image upscaling (RealESRGAN x4)
- Video generation from text and image(s) (LTX-Video 0.9.8, LTX-2 19B)
- Video transcription from URL and file (Whisper Large V3)
- Audio transcription (Whisper Large V3)
- Image prompt booster
- Video prompt booster
- deAPI Trigger node for webhook-based event handling
- Webhook signature verification (HMAC-SHA256)
- Binary data download for generated content
