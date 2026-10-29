import { createSerializerFactory } from '../lib/serialize/factory.ts';

export function exportProject(project: unknown): string {
  const factory = createSerializerFactory();
  const serializer = factory.get('json');
  return serializer.serialize({ version: 1, project });
}
