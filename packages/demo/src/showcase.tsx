import { Button, Heading, Icon, Main, Section, Submit } from "@bezny/base";
import { Plane } from "lucide-react";
import { useState } from "react";

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
      </Section>
      <Section>
        <Heading>Icons</Heading>
        <Section>
          <Heading>
            <Icon icon={Plane} aria-hidden="true" /> Travel
          </Heading>
        </Section>
        <Icon icon={Plane} aria-label="Airplane" />
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
          <output>Primary button clicks: {clickCount}</output>
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
    </Main>
  );
};
