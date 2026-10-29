import { createSerializerFactory } from '../lib/serialize/factory.ts';

export function saveDocument(document: unknown): string {
  const factory = createSerializerFactory();
  const serializer = factory.get('json');
  return serializer.serialize(document);
}
