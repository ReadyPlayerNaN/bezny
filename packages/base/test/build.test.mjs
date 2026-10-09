import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Heading, HeadingLevelProvider, Main, Section, useHeadingLevel } from '@bezny/base';

const css = readFileSync(new URL(import.meta.resolve('@bezny/base/style.css')), 'utf8');

function classNames(level) {
  const html = renderToStaticMarkup(createElement(Heading, { level }, 'Title'));
  return html.match(/class="([^"]+)"/)[1].split(' ');
}

function ruleFor(className) {
  return css.match(new RegExp(`\\.${className}\\s*\\{([^}]+)\\}`))[1];
}

test('package exports the complete heading API', () => {
  for (const component of [Heading, HeadingLevelProvider, Main, Section, useHeadingLevel]) {
    assert.equal(typeof component, 'function');
  }
});

test('built SCSS module styles match the rendered classes at every level', () => {
  const sizes = [32, 24, 20, 18, 16, 14];
  const lines = [40, 32, 28, 24, 24, 20];
  for (let level = 1; level <= 6; level++) {
    const [base, variant] = classNames(level);
    assert.notEqual(base, 'heading', 'base class must be scoped');
    assert.notEqual(variant, `heading--level-${level}`, 'level class must be scoped');
    assert.match(ruleFor(base), /margin:\s*0/);
    const rule = ruleFor(variant);
    assert.match(rule, new RegExp(`font-size:[^;]*${sizes[level - 1]}px`));
    assert.match(rule, new RegExp(`line-height:[^;]*${lines[level - 1]}px`));
    assert.match(rule, new RegExp(`--heading-icon-size:[^}]*${level === 1 ? 28 : sizes[level - 1]}px`));
  }
});

test('icon sizing is scoped to graphics symbols inside headings', () => {
  const [base] = classNames(1);
  assert.match(css, new RegExp(`\\.${base}\\s+\\[role=["']?graphics-symbol["']?\\]`));
  assert.match(css, /width:\s*var\(--heading-icon-size\)/);
  assert.match(css, /height:\s*var\(--heading-icon-size\)/);
  assert.match(css, /min-width:\s*var\(--heading-icon-size\)/);
  assert.match(css, /flex-shrink:\s*0/);
  assert.doesNotMatch(css, /role=["']?img/);
});
