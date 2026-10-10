import { Card, CardBody } from "./card.js";
import { EntityRowTitle } from "./entity-row-title.js";

export interface EntityCardProps {
  title: string;
  titleHref: string;
  description?: string | null;
  versionNumber?: number | null;
  versionHref?: string;
}
export const EntityCard = ({
  title,
  titleHref,
  description,
  versionNumber,
  versionHref,
}: EntityCardProps) => (
  <Card>
    <CardBody>
      <EntityRowTitle href={titleHref}>{title}</EntityRowTitle>
      {description ? <p>{description}</p> : null}
      {typeof versionNumber === "number" ? (
        <a href={versionHref ?? titleHref}>v{versionNumber}</a>
      ) : null}
    </CardBody>
  </Card>
);
