import { AllEntities } from "n8n-workflow";

type NodeMap = {
  image: 'generate';
  video: 'generateFromText';
  prompt: 'boostImage' | 'boostVideo';
};

export type DeApiType = AllEntities<NodeMap>;