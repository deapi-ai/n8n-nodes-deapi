import { AllEntities } from "n8n-workflow";

type NodeMap = {
  image: 'generate';
  prompt: 'boostTextToImage';
};

export type DeApiType = AllEntities<NodeMap>;