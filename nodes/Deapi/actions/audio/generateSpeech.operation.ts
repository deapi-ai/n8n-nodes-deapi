import type { IExecuteFunctions, INodeExecutionData, INodeProperties } from 'n8n-workflow';
import { updateDisplayOptions } from 'n8n-workflow';

import type { TextToSpeechRequest } from '../../helpers/interfaces';
import { apiRequest } from '../../transport';

const properties: INodeProperties[] = [
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		description: 'The model to use for speech generation',
		default: 'Kokoro',
		required: true,
		options: [
			{
				name: 'Chatterbox',
				value: 'Chatterbox',
			},
			{
				name: 'Kokoro',
				value: 'Kokoro',
			},
			{
				name: 'Qwen3 TTS Custom Voice',
				value: 'Qwen3_TTS_12Hz_1_7B_CustomVoice',
			},
			{
				name: 'Qwen3 TTS Voice Design',
				value: 'Qwen3_TTS_12Hz_1_7B_VoiceDesign',
			},
		],
	},
	{
		displayName: 'Text Input',
		name: 'text',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. Hello, welcome to our service.',
		description: 'The text to generate speech for',
		typeOptions: {
			rows: 2,
		},
	},

	// ── Language properties (model-conditional) ──

	{
		displayName: 'Language',
		name: 'kokoroLang',
		type: 'options',
		required: true,
		default: 'en-us',
		description: 'Language for speech synthesis',
		displayOptions: {
			show: {
				model: ['Kokoro'],
			},
		},
		options: [
			{ name: 'English (GB)', value: 'en-gb' },
			{ name: 'English (US)', value: 'en-us' },
			{ name: 'France', value: 'fr-fr' },
			{ name: 'Hindi', value: 'hi' },
			{ name: 'Italian', value: 'it' },
			{ name: 'Portugal (BR)', value: 'pt-br' },
			{ name: 'Spain', value: 'es' },
		],
	},
	{
		displayName: 'Language',
		name: 'chatterboxLang',
		type: 'options',
		required: true,
		default: 'en',
		description: 'Language for speech synthesis',
		displayOptions: {
			show: {
				model: ['Chatterbox'],
			},
		},
		options: [
			{ name: 'Arabic', value: 'ar' },
			{ name: 'Chinese', value: 'zh' },
			{ name: 'Danish', value: 'da' },
			{ name: 'Dutch', value: 'nl' },
			{ name: 'English', value: 'en' },
			{ name: 'Finnish', value: 'fi' },
			{ name: 'French', value: 'fr' },
			{ name: 'German', value: 'de' },
			{ name: 'Greek', value: 'el' },
			{ name: 'Hebrew', value: 'he' },
			{ name: 'Hindi', value: 'hi' },
			{ name: 'Italian', value: 'it' },
			{ name: 'Japanese', value: 'ja' },
			{ name: 'Korean', value: 'ko' },
			{ name: 'Malay', value: 'ms' },
			{ name: 'Norwegian', value: 'no' },
			{ name: 'Polish', value: 'pl' },
			{ name: 'Portuguese', value: 'pt' },
			{ name: 'Russian', value: 'ru' },
			{ name: 'Spanish', value: 'es' },
			{ name: 'Swahili', value: 'sw' },
			{ name: 'Swedish', value: 'sv' },
			{ name: 'Turkish', value: 'tr' },
		],
	},
	{
		displayName: 'Language',
		name: 'qwen3Lang',
		type: 'options',
		required: true,
		default: 'English',
		description: 'Language for speech synthesis',
		displayOptions: {
			show: {
				model: ['Qwen3_TTS_12Hz_1_7B_CustomVoice', 'Qwen3_TTS_12Hz_1_7B_VoiceDesign'],
			},
		},
		options: [
			{ name: 'Chinese', value: 'Chinese' },
			{ name: 'English', value: 'English' },
			{ name: 'French', value: 'French' },
			{ name: 'German', value: 'German' },
			{ name: 'Italian', value: 'Italian' },
			{ name: 'Japanese', value: 'Japanese' },
			{ name: 'Korean', value: 'Korean' },
			{ name: 'Portuguese', value: 'Portuguese' },
			{ name: 'Russian', value: 'Russian' },
			{ name: 'Spanish', value: 'Spanish' },
		],
	},

	// ── Voice properties (model+language-conditional) ──

	// Kokoro voices per language
	{
		displayName: 'Voice',
		name: 'kokoroVoiceEnUs',
		type: 'options',
		required: true,
		default: 'af_alloy',
		description: 'Voice to use for speech synthesis',
		displayOptions: {
			show: {
				model: ['Kokoro'],
				kokoroLang: ['en-us'],
			},
		},
		options: [
			{ name: 'Adam (Male)', value: 'am_adam' },
			{ name: 'Alloy (Male)', value: 'af_alloy' },
			{ name: 'Aoede (Female)', value: 'af_aoede' },
			{ name: 'Bella (Female)', value: 'af_bella' },
			{ name: 'Echo (Male)', value: 'am_echo' },
			{ name: 'Eric (Male)', value: 'am_eric' },
			{ name: 'Fenrir (Male)', value: 'am_fenrir' },
			{ name: 'Heart (Female)', value: 'af_heart' },
			{ name: 'Jessica (Female)', value: 'af_jessica' },
			{ name: 'Kore (Female)', value: 'af_kore' },
			{ name: 'Liam (Male)', value: 'am_liam' },
			{ name: 'Michael (Male)', value: 'am_michael' },
			{ name: 'Nicole (Female)', value: 'af_nicole' },
			{ name: 'Nova (Female)', value: 'af_nova' },
			{ name: 'Onyx (Male)', value: 'am_onyx' },
			{ name: 'Puck (Male)', value: 'am_puck' },
			{ name: 'River (Female)', value: 'af_river' },
			{ name: 'Santa (Male)', value: 'am_santa' },
			{ name: 'Sarah (Female)', value: 'af_sarah' },
			{ name: 'Sky (Female)', value: 'af_sky' },
		],
	},
	{
		displayName: 'Voice',
		name: 'kokoroVoiceEnGb',
		type: 'options',
		required: true,
		default: 'bf_alice',
		description: 'Voice to use for speech synthesis',
		displayOptions: {
			show: {
				model: ['Kokoro'],
				kokoroLang: ['en-gb'],
			},
		},
		options: [
			{ name: 'Alice (Female)', value: 'bf_alice' },
			{ name: 'Daniel (Male)', value: 'bm_daniel' },
			{ name: 'Emma (Female)', value: 'bf_emma' },
			{ name: 'Fable (Male)', value: 'bm_fable' },
			{ name: 'George (Male)', value: 'bm_george' },
			{ name: 'Isabella (Female)', value: 'bf_isabella' },
			{ name: 'Lewis (Male)', value: 'bm_lewis' },
			{ name: 'Lily (Female)', value: 'bf_lily' },
		],
	},
	{
		displayName: 'Voice',
		name: 'kokoroVoiceEs',
		type: 'options',
		required: true,
		default: 'em_alex',
		description: 'Voice to use for speech synthesis',
		displayOptions: {
			show: {
				model: ['Kokoro'],
				kokoroLang: ['es'],
			},
		},
		options: [
			{ name: 'Alex (Male)', value: 'em_alex' },
			{ name: 'Dora (Female)', value: 'ef_dora' },
			{ name: 'Santa (Male)', value: 'em_santa' },
		],
	},
	{
		displayName: 'Voice',
		name: 'kokoroVoiceFrFr',
		type: 'options',
		required: true,
		default: 'ff_siwis',
		description: 'Voice to use for speech synthesis',
		displayOptions: {
			show: {
				model: ['Kokoro'],
				kokoroLang: ['fr-fr'],
			},
		},
		options: [{ name: 'Siwis (Female)', value: 'ff_siwis' }],
	},
	{
		displayName: 'Voice',
		name: 'kokoroVoiceHi',
		type: 'options',
		required: true,
		default: 'hf_alpha',
		description: 'Voice to use for speech synthesis',
		displayOptions: {
			show: {
				model: ['Kokoro'],
				kokoroLang: ['hi'],
			},
		},
		options: [
			{ name: 'Alpha (Female)', value: 'hf_alpha' },
			{ name: 'Beta (Female)', value: 'hf_beta' },
			{ name: 'Omega (Male)', value: 'hm_omega' },
			{ name: 'Psi (Male)', value: 'hm_psi' },
		],
	},
	{
		displayName: 'Voice',
		name: 'kokoroVoiceIt',
		type: 'options',
		required: true,
		default: 'im_nicola',
		description: 'Voice to use for speech synthesis',
		displayOptions: {
			show: {
				model: ['Kokoro'],
				kokoroLang: ['it'],
			},
		},
		options: [
			{ name: 'Nicola (Male)', value: 'im_nicola' },
			{ name: 'Sara (Female)', value: 'if_sara' },
		],
	},
	{
		displayName: 'Voice',
		name: 'kokoroVoicePtBr',
		type: 'options',
		required: true,
		default: 'pm_alex',
		description: 'Voice to use for speech synthesis',
		displayOptions: {
			show: {
				model: ['Kokoro'],
				kokoroLang: ['pt-br'],
			},
		},
		options: [
			{ name: 'Alex (Male)', value: 'pm_alex' },
			{ name: 'Dora (Female)', value: 'pf_dora' },
			{ name: 'Santa (Male)', value: 'pm_santa' },
		],
	},

	// Qwen3 CustomVoice — Chinese (no Ryan)
	{
		displayName: 'Voice',
		name: 'qwen3VoiceChinese',
		type: 'options',
		required: true,
		default: 'Vivian',
		description: 'Voice to use for speech synthesis',
		displayOptions: {
			show: {
				model: ['Qwen3_TTS_12Hz_1_7B_CustomVoice'],
				qwen3Lang: ['Chinese'],
			},
		},
		options: [
			{ name: 'Aiden (Male)', value: 'Aiden' },
			{ name: 'Dylan (Male)', value: 'Dylan' },
			{ name: 'Eric (Male)', value: 'Eric' },
			{ name: 'Ono Anna (Female)', value: 'Ono_Anna' },
			{ name: 'Serena (Female)', value: 'Serena' },
			{ name: 'Sohee (Female)', value: 'Sohee' },
			{ name: 'Uncle Fu (Male)', value: 'Uncle_Fu' },
			{ name: 'Vivian (Male)', value: 'Vivian' },
		],
	},

	// Qwen3 CustomVoice — all other languages (includes Ryan)
	{
		displayName: 'Voice',
		name: 'qwen3Voice',
		type: 'options',
		required: true,
		default: 'Vivian',
		description: 'Voice to use for speech synthesis',
		displayOptions: {
			show: {
				model: ['Qwen3_TTS_12Hz_1_7B_CustomVoice'],
				qwen3Lang: [
					'English',
					'Japanese',
					'Korean',
					'German',
					'French',
					'Russian',
					'Portuguese',
					'Spanish',
					'Italian',
				],
			},
		},
		options: [
			{ name: 'Aiden (Male)', value: 'Aiden' },
			{ name: 'Dylan (Male)', value: 'Dylan' },
			{ name: 'Eric (Male)', value: 'Eric' },
			{ name: 'Ono Anna (Female)', value: 'Ono_Anna' },
			{ name: 'Ryan (Male)', value: 'Ryan' },
			{ name: 'Serena (Female)', value: 'Serena' },
			{ name: 'Sohee (Female)', value: 'Sohee' },
			{ name: 'Uncle Fu (Male)', value: 'Uncle_Fu' },
			{ name: 'Vivian (Male)', value: 'Vivian' },
		],
	},

	// Voice Description (Qwen3 VoiceDesign only)
	{
		displayName: 'Voice Description',
		name: 'instruct',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. A warm, friendly female voice with a calm tone',
		description: 'Natural language description of the desired voice characteristics',
		typeOptions: {
			rows: 2,
		},
		displayOptions: {
			show: {
				model: ['Qwen3_TTS_12Hz_1_7B_VoiceDesign'],
			},
		},
	},

	// ── Options ──

	{
		displayName: 'Options',
		name: 'options',
		placeholder: 'Add Option',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: 'Speed',
				name: 'speed',
				type: 'number',
				description: 'Speech rate multiplier',
				default: 1,
				typeOptions: {
					minValue: 0.5,
					maxValue: 2.0,
					numberPrecision: 2,
				},
				displayOptions: {
					show: {
						'/model': ['Kokoro'],
					},
				},
			},
			{
				displayName: 'Response Format',
				name: 'format',
				type: 'options',
				description: 'Audio output format',
				default: 'mp3',
				options: [
					{ name: 'FLAC', value: 'flac' },
					{ name: 'MP3', value: 'mp3' },
					{ name: 'WAV', value: 'wav' },
				],
			},
			{
				displayName: 'Wait Timeout',
				name: 'waitTimeout',
				type: 'number',
				description: 'Maximum time to wait for completion in seconds',
				default: 120,
				typeOptions: {
					minValue: 30,
					maxValue: 600,
					numberPrecision: 0,
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['generateSpeech'],
		resource: ['audio'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	const model = this.getNodeParameter('model', i) as string;
	const text = this.getNodeParameter('text', i) as string;
	const options = this.getNodeParameter('options', i);

	// Resolve language, mode, and voice/instruct per model
	let lang: string;
	let mode: string;
	let voice: string | undefined;
	let instruct: string | undefined;

	switch (model) {
		case 'Qwen3_TTS_12Hz_1_7B_VoiceDesign':
			lang = this.getNodeParameter('qwen3Lang', i) as string;
			mode = 'voice_design';
			instruct = this.getNodeParameter('instruct', i) as string;
			break;
		case 'Chatterbox':
			lang = this.getNodeParameter('chatterboxLang', i) as string;
			mode = 'custom_voice';
			voice = 'default';
			break;
		case 'Kokoro': {
			lang = this.getNodeParameter('kokoroLang', i) as string;
			mode = 'custom_voice';
			const kokoroVoiceMap: Record<string, string> = {
				'en-us': 'kokoroVoiceEnUs',
				'en-gb': 'kokoroVoiceEnGb',
				es: 'kokoroVoiceEs',
				'fr-fr': 'kokoroVoiceFrFr',
				hi: 'kokoroVoiceHi',
				it: 'kokoroVoiceIt',
				'pt-br': 'kokoroVoicePtBr',
			};
			voice = this.getNodeParameter(kokoroVoiceMap[lang], i) as string;
			break;
		}
		default: {
			// Qwen3_TTS_12Hz_1_7B_CustomVoice
			lang = this.getNodeParameter('qwen3Lang', i) as string;
			mode = 'custom_voice';
			const voiceParam = lang === 'Chinese' ? 'qwen3VoiceChinese' : 'qwen3Voice';
			voice = this.getNodeParameter(voiceParam, i) as string;
			break;
		}
	}

	// Speed: only configurable for Kokoro, default 1 for others
	const speed = model === 'Kokoro' ? ((options.speed as number | undefined) ?? 1) : 1;

	const format = (options.format as string | undefined) ?? 'mp3';
	const waitTimeout = (options.waitTimeout as number | undefined) ?? 120;

	// Calculate wait time (convert seconds to milliseconds)
	const waitTill = new Date(Date.now() + waitTimeout * 1000);

	// Put execution to wait FIRST - this registers the waiting webhook
	await this.putExecutionToWait(waitTill);

	// Construct the webhook URL for deAPI to call back
	const resumeUrl = this.evaluateExpression('{{ $execution.resumeUrl }}', i) as string;
	const webhookUrl = `${resumeUrl}/webhook`;

	// Build the request body
	const body: TextToSpeechRequest = {
		text,
		model,
		mode,
		lang,
		speed,
		format,
		sample_rate: 24000,
		webhook_url: webhookUrl,
	};

	if (voice) {
		body.voice = voice;
	} else {
		body.instruct = instruct;
	}

	// Submit the request to deAPI
	await apiRequest.call(this, 'POST', '/txt2audio', { body });

	// Return the current input data
	// When the webhook is called, the webhook() method will provide the actual output
	return [
		{
			...this.getInputData()[i],
			pairedItem: { item: i },
		},
	];
}
