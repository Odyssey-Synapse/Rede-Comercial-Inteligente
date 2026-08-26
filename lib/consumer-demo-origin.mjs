import { callAssistantOrigin, cleanText } from './assistant-origin.mjs';

export const CONSUMER_DEMO_ACTIONS = Object.freeze([
  'ONBOARDING_STATUS', 'ACCEPT_ONBOARDING', 'MESSAGE', 'PREVIEW_UNDERSTANDING',
  'LIST_PROJECTS', 'CREATE_PROJECT', 'READ_PROJECT', 'UPDATE_PROJECT',
  'ADD_PROJECT_ITEM', 'REMOVE_PROJECT_ITEM', 'ADD_ROUTINE', 'REMOVE_ROUTINE',
  'REPEAT_PROJECT', 'START_RESOLUTION',
  'CLOSED_LOOP_STATUS', 'START_CLOSED_LOOP', 'READ_CLOSED_LOOP',
  'READ_CLOSED_LOOP_OPTIONS', 'SELECT_CLOSED_LOOP_OPTION', 'EXECUTE_CLOSED_LOOP_SYNTHETIC',
  'MATCH_INTENT', 'READ_STATUS', 'ANSWER_QUESTION',
  'READ_SOLUTIONS', 'SELECT_SOLUTION', 'READ_RESOLUTION', 'CONFIRM_RESULT',
  'REPORT_NOT_RESOLVED', 'MARK_PROJECT_RESOLVED', 'READ_NOTIFICATIONS', 'SEND_FEEDBACK',
  'RESET_CONVERSATION'
]);

const allowed = new Set(CONSUMER_DEMO_ACTIONS);
const hidden = new Set([
  'token', 'authorization', 'tenant_id', 'network_id', 'city_id', 'consumer_id',
  'correlation_id', 'epi_id', 'candidate', 'candidates', 'semantic_context',
  'semantic_frame', 'interpretation_seed', 'script_id', 'scores', 'score', 'trace',
  'traces', 'proof', 'proofs', 'kernel'
]);
const internalTerms = /\b(?:MCIR|Survival Kernel|Semantic Runtime|KCL|Ollama|proofs?|candidates?|scores?|traces?|stack trace|authorization|x-mcir|cf-access)\b/i;

export function validConsumerDemoAction(value) {
  return typeof value === 'string' && allowed.has(value);
}

export function sanitizeConsumerDemoPayload(value, depth = 0) {
  if (depth > 8) return null;
  if (typeof value === 'string') return cleanText(value, 4_000);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 100).map(item => sanitizeConsumerDemoPayload(item, depth + 1));
  if (!value || typeof value !== 'object') return null;
  const out = {};
  for (const [key, nested] of Object.entries(value)) {
    if (hidden.has(key.toLowerCase())) continue;
    out[key] = sanitizeConsumerDemoPayload(nested, depth + 1);
  }
  return out;
}

export function safeConsumerDemoResponse(value) {
  const safe = sanitizeConsumerDemoPayload(value);
  return internalTerms.test(JSON.stringify(safe)) ? null : safe;
}

export function callConsumerDemoOrigin(path, options = {}) {
  return callAssistantOrigin(path, options);
}
