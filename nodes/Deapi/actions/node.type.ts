import { AllEntities } from "n8n-workflow";

type NodeMap = {
  image: 'generate';
  video: 'generateFromText' | 'generateFromImage';
  prompt: 'boostImage' | 'boostVideo';
};

export type DeApiType = AllEntities<NodeMap>;