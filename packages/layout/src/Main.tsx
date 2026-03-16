import { createPolymorphic } from "@bezny/styles";

export type MainOwnProps = Record<string, never>;

export const Main = createPolymorphic<"main", MainOwnProps>(
	"main",
	(Tag, _ownProps, rest) => <Tag {...rest} />,
);
