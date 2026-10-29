import { jsonSerializer } from './json.ts';
import type { Serializer } from './types.ts';

export interface SerializerFactory {
  get(format: string): Serializer;
}

export function createSerializerFactory(): SerializerFactory {
  const serializers = new Map<string, Serializer>();
  serializers.set('json', jsonSerializer);
  return {
    get(format: string): Serializer {
      const serializer = serializers.get(format);
      if (!serializer) throw new Error(`Unknown format: ${format}`);
      return serializer;
    },
  };
}
