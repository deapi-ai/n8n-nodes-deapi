import { AllEntities } from "n8n-workflow";

type NodeMap = {
  image: 'generate';
  video: 'generate';
  prompt: 'imagePromptBooster' | 'videoPromptBooster';
};

export type DeApiType = AllEntities<NodeMap>;