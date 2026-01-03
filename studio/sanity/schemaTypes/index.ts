import type { SchemaTypeDefinition } from 'sanity';
import { schemaTypes } from '../../../sanity-config/schemas';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: schemaTypes as SchemaTypeDefinition[]
};
