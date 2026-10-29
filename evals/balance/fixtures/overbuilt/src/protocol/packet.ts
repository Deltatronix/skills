export interface Packet {
  kind: string;
  payload: string;
}

export function parsePacket(text: string): Packet {
  const separator = text.indexOf(':');
  if (separator < 1) throw new Error('Invalid packet');
  return { kind: text.slice(0, separator), payload: text.slice(separator + 1) };
}
