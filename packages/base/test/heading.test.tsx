import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Heading,
  HeadingLevelProvider,
  Main,
  Section,
  useHeadingLevel,
} from "../src/index.js";
import type { HeadingLevel } from "../src/index.js";

const levels: HeadingLevel[] = [1, 2, 3, 4, 5, 6];

const LevelProbe = () => <span>{useHeadingLevel()}</span>;

const headingTags = (markup: string) => markup.match(/<h[1-6]\b/gu);

describe("heading semantics", () => {
  it("defaults to h1 and forwards children, attributes, and custom classes", () => {
    const html = renderToStaticMarkup(
      <Heading id="title" className="custom" aria-label="Page">
        Hello
      </Heading>
    );
    expect(html).toContain("<h1");
    expect(html).toContain('id="title"');
    expect(html).toContain('aria-label="Page"');
    expect(html).toMatch(/class="[^"]*custom"/u);
    expect(html).toContain(">Hello</h1>");
  });

  it.each(levels)("supports explicit h%i levels", (level) => {
    expect(
      renderToStaticMarkup(<Heading level={level}>Title</Heading>)
    ).toContain(`<h${level}`);
  });

  it("prioritizes explicit level over inherited context", () => {
    const html = renderToStaticMarkup(
      <HeadingLevelProvider level={5}>
        <Heading level={2}>Title</Heading>
      </HeadingLevelProvider>
    );
    expect(headingTags(html)).toStrictEqual(["<h2"]);
  });

  it("uses the inherited level when no explicit level is provided", () => {
    const html = renderToStaticMarkup(
      <HeadingLevelProvider level={5}>
        <Heading>Title</Heading>
      </HeadingLevelProvider>
    );
    expect(headingTags(html)).toStrictEqual(["<h5"]);
  });

  it("increments nested sections and restores the parent level for siblings", () => {
    const html = renderToStaticMarkup(
      <Main id="main">
        <Heading>Page</Heading>
        <Section id="section" aria-label="Details">
          <Heading>Section</Heading>
          <Section>
            <Heading>Subsection</Heading>
          </Section>
          <Heading>Sibling</Heading>
        </Section>
        <Heading>Page sibling</Heading>
      </Main>
    );
    expect(headingTags(html)).toStrictEqual([
      "<h1",
      "<h2",
      "<h3",
      "<h2",
      "<h1",
    ]);
    expect(html).toContain('<main id="main">');
    expect(html).toContain('<section id="section" aria-label="Details">');
  });

  it("caps automatic nesting at h6", () => {
    const html = renderToStaticMarkup(
      <HeadingLevelProvider level={6}>
        <Section>
          <Section>
            <Heading>Deep</Heading>
            <LevelProbe />
          </Section>
        </Section>
      </HeadingLevelProvider>
    );
    expect(headingTags(html)).toStrictEqual(["<h6"]);
    expect(html).toContain("<span>6</span>");
  });

  it("exposes default, incremented, and explicit levels through the hook", () => {
    expect(renderToStaticMarkup(<LevelProbe />)).toBe("<span>1</span>");
    expect(
      renderToStaticMarkup(
        <HeadingLevelProvider>
          <LevelProbe />
        </HeadingLevelProvider>
      )
    ).toBe("<span>2</span>");
    expect(
      renderToStaticMarkup(
        <HeadingLevelProvider level={4}>
          <LevelProbe />
        </HeadingLevelProvider>
      )
    ).toBe("<span>4</span>");
  });
});
