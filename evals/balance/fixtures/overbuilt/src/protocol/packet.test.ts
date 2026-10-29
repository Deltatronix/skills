import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePacket } from '../index.ts';

test('public SDK parses packets and rejects missing kinds or delimiters', () => {
  assert.deepEqual(parsePacket('PING:a:b'), { kind: 'PING', payload: 'a:b' });
  assert.deepEqual(parsePacket('PING:'), { kind: 'PING', payload: '' });
  assert.throws(() => parsePacket(':payload'), /Invalid packet/);
  assert.throws(() => parsePacket('PING'), /Invalid packet/);
});
