import { createSerializerFactory } from '../lib/serialize/factory.ts';

export function loadDocument(text: string): unknown {
  const factory = createSerializerFactory();
  const serializer = factory.get('json');
  return serializer.deserialize(text);
}
