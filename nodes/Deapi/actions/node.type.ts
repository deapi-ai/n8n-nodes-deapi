import { AllEntities } from "n8n-workflow";

type NodeMap = {
  image: 'generate';
  video: 'generateFromText' | 'generateFromImage' | 'transcribe';
  audio: 'transcribe';
  prompt: 'boostImage' | 'boostVideo';
};

export type DeApiType = AllEntities<NodeMap>;