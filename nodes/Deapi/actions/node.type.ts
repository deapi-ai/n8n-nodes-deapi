import { AllEntities } from 'n8n-workflow';

type NodeMap = {
	image: 'generate' | 'removeBackground' | 'upscale';
	video: 'generate' | 'generateFromAudio' | 'transcribe';
	audio: 'cloneVoice' | 'generateSpeech' | 'transcribe';
	prompt: 'boostImage' | 'boostVideo';
};

export type DeApiType = AllEntities<NodeMap>;
