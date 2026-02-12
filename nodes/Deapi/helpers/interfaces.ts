import { IDataObject } from "n8n-workflow";
import type { FormdataFileValue } from "./formdata";

export interface TextToImageRequest extends IDataObject {
  prompt: string,
  negative_prompt?: string,
  model: string,
  width: number,
  height: number,
  steps: number,
  seed: number,
  webhook_url: string,
}

// `steps`, `guidance`, and `fps` as unit types, because right now we support
// only Ltx model that accepts only these values.
export interface TextToVideoRequest extends IDataObject {
  prompt: string,
  model: string,
  frames: number,
  width: number,
  height: number,
  negative_prompt?: string,
  seed: number,
  steps: 1,
  guidance: 0.0,
  fps: 30,
  webhook_url: string,
}

export interface VideoToTextRequest extends IDataObject {
  video_url: string;
  include_ts: boolean;
  model: string;
  // return_result_in_response?: boolean;
  webhook_url: string;
}

export interface ImagePromptBoosterRequest extends IDataObject {
  prompt: string,
  negative_prompt: string | null,
}

export interface BoosterResponse extends IDataObject {
  prompt: string,
  negative_prompt: string | null,
}

/* Here stars types for form-data content type */
export type VideoPromptBoosterRequest = {
  prompt: string;
  negative_prompt: string | null;
  image: FormdataFileValue | null;
};

// `steps`, `guidance`, and `fps` as unit types, because right now we support
// only Ltx model that accepts only these values.
// TO ANSWER how `width` and `height` behave with `first_frame_image` provided ?
export type ImageToVideoRequest = {
  prompt: string;
  model: string;
  first_frame_image: FormdataFileValue;
  frames: number;
  width: number;
  height: number;
  last_frame_image: FormdataFileValue | null;
  negative_prompt: string | null;
  seed: number;
  steps: 1;
  guidance: 0.0;
  fps: 30;
  webhook_url: string;
};

export type VideoFileToTextRequest = {
  video: FormdataFileValue;
  include_ts: boolean;
  model: string;
  // return_result_in_response: boolean | null;
  return_result_in_response?: boolean,
  webhook_url: string;
};
