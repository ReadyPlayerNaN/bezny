import { createPolymorphic } from "@bezny/core";

export type MainOwnProps = Record<string, never>;

export const Main = createPolymorphic<"main", MainOwnProps>("main", (Tag, _ownProps, rest) => <Tag {...rest} />);
