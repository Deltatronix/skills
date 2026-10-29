export interface Serializer {
  serialize(value: unknown): string;
  deserialize(text: string): unknown;
}
