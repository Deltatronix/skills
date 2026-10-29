import type { Serializer } from './types.ts';

export const jsonSerializer: Serializer = {
  serialize(value: unknown): string {
    return JSON.stringify(value);
  },
  deserialize(text: string): unknown {
    return JSON.parse(text);
  },
};
