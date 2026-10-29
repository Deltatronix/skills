import { createSerializerFactory } from '../lib/serialize/factory.ts';

export function snapshot(value: unknown): unknown {
  const factory = createSerializerFactory();
  const serializer = factory.get('json');
  return serializer.deserialize(serializer.serialize(value));
}
