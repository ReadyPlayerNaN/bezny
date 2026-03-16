import type {
	ComponentPropsWithoutRef,
	ComponentType,
	ElementType,
	JSX,
	ReactNode,
} from "react";

type AsChild = keyof JSX.IntrinsicElements | ComponentType<any>;

type ResolveTagProps<T extends AsChild> =
	T extends keyof JSX.IntrinsicElements
		? ComponentPropsWithoutRef<T>
		: T extends ComponentType<infer P>
			? P
			: never;

export type PolymorphicProps<
	DefaultTag extends ElementType,
	OwnProps,
	T extends AsChild = DefaultTag & AsChild,
> = OwnProps &
	{ asChild?: T } & Omit<ResolveTagProps<T>, keyof OwnProps | "asChild">;

type RenderFn<OwnProps> = (
	Tag: AsChild,
	ownProps: OwnProps,
	rest: Record<string, unknown>,
) => ReactNode;

export function createPolymorphic<
	DefaultTag extends keyof JSX.IntrinsicElements,
	OwnProps extends Record<string, unknown> = Record<string, never>,
>(defaultTag: DefaultTag, render: RenderFn<OwnProps>) {
	function PolymorphicComponent<T extends AsChild = DefaultTag & AsChild>({
		asChild,
		...allProps
	}: PolymorphicProps<DefaultTag, OwnProps, T>) {
		const Tag = (asChild ?? defaultTag) as AsChild;
		return render(
			Tag,
			allProps as unknown as OwnProps,
			allProps as unknown as Record<string, unknown>,
		);
	}

	PolymorphicComponent.displayName = `Polymorphic(${String(defaultTag)})`;
	return PolymorphicComponent;
}
