import {
  Button,
  Heading,
  HeadingLevelProvider,
  Icon,
  Main,
  Section,
  Submit,
  useHeadingLevel,
  wrapIcon,
} from "@bezny/base";
import { Plane } from "lucide-react";
import { useState } from "react";

import { FieldExamples } from "./field-examples.js";
import { InputExamples } from "./input-examples.js";

const TravelIcon = wrapIcon(Plane);
const HeadingContextExample = () => {
  const level = useHeadingLevel();
  return (
    <>
      <Heading>Explicit heading level</Heading>
      <p>useHeadingLevel reports level {level}.</p>
    </>
  );
};

export const Showcase = () => {
  const [clickCount, setClickCount] = useState(0);

  return (
    <Main>
      <Heading>Bezny component showcase</Heading>
      <p>Examples rendered with @bezny/base and its published stylesheet.</p>
      <Section>
        <Heading>Headings</Heading>
        <p>Sections automatically increase the heading level.</p>
        <Section>
          <Heading>Nested heading</Heading>
          <Section>
            <Heading>Deeper heading</Heading>
          </Section>
        </Section>
        <HeadingLevelProvider level={5}>
          <HeadingContextExample />
          <Section>
            <Heading>Level six heading</Heading>
          </Section>
        </HeadingLevelProvider>
      </Section>
      <Section>
        <Heading>Icons</Heading>
        <Section>
          <Heading>
            <Icon icon={Plane} aria-hidden="true" /> Travel
          </Heading>
        </Section>
        <Icon icon={Plane} aria-label="Airplane" />{" "}
        <TravelIcon aria-label="Wrapped airplane" />
      </Section>
      <Section>
        <Heading>Buttons</Heading>
        <p>
          <Button onClick={() => setClickCount((count) => count + 1)}>
            Primary
          </Button>{" "}
          <Button variant="secondary">Secondary</Button>{" "}
          <Button variant="critical">Critical</Button>
        </p>
        <p>
          <output aria-label="Primary click count">
            Primary button clicks: {clickCount}
          </output>
        </p>
        <p>
          <Button size="small">Small</Button> <Button disabled>Disabled</Button>{" "}
          <Button loading>Loading</Button>
        </p>
        <p>
          <Button variant="secondary">
            <Icon icon={Plane} aria-hidden="true" /> Book travel
          </Button>{" "}
          <Submit>Submit</Submit>
        </p>
        <Button fullWidth>Full width</Button>
      </Section>
      <InputExamples />
      <FieldExamples />
    </Main>
  );
};
