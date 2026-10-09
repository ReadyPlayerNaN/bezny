import assert from 'node:assert/strict';
import test from 'node:test';

import { greet } from '../dist/index.js';

test('greet returns a personalized greeting', () => {
  assert.equal(greet('Bezny'), 'Hello, Bezny!');
});
