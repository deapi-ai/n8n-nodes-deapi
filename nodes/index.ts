import { Deapi } from './Deapi/Deapi.node';
import { DeapiTrigger } from './Deapi/DeapiTrigger.node';

export const nodeTypes = [
  new Deapi(),
  new DeapiTrigger(),
];
