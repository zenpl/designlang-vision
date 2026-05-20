// Schema validation for vision observations.
// Wraps Ajv with the project's specific shape — single compiled validator, friendly error format.
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SCHEMA_PATH = join(__dirname, 'image-observation.schema.json');
export const imageObservationSchema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));

// strict:false because we deliberately use nullable enums via `["string","null"]`
// which Ajv-strict otherwise flags. The schema is still strict about additionalProperties.
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

export const validateImageObservation = ajv.compile(imageObservationSchema);

export function formatValidationErrors(errors) {
  if (!errors || !errors.length) return '';
  return errors
    .map((e) => `  ${e.instancePath || '(root)'}: ${e.message}${e.params ? ` ${JSON.stringify(e.params)}` : ''}`)
    .join('\n');
}

/** Throws on invalid, returns the candidate on valid. */
export function assertImageObservation(candidate) {
  if (!validateImageObservation(candidate)) {
    const detail = formatValidationErrors(validateImageObservation.errors);
    const err = new Error(`ImageObservation failed schema validation:\n${detail}`);
    err.validationErrors = validateImageObservation.errors;
    throw err;
  }
  return candidate;
}
