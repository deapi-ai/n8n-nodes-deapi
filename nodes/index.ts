import { Deapi } from './Deapi/Deapi.node';
import { DeapiTrigger } from './DeapiTrigger/DeapiTrigger.node';

export const nodeTypes = [
  new Deapi(),
  new DeapiTrigger(),
];
