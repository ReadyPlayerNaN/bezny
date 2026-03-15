import clsx, { type ClassValue } from "clsx";
import type { ReactNode } from "react";
import type { AvatarSize } from "./Avatar";
import { Avatar } from "./Avatar";
import styles from "./AvatarStack.module.scss";

export type AvatarStackUser = {
	name: string;
	email: string;
	avatarUrl?: string | null;
};

export type AvatarStackProps = {
	users: AvatarStackUser[];
	max?: number;
	size?: AvatarSize;
	onClick?: () => void;
	className?: ClassValue;
};

const DEFAULT_MAX = 4;

const SIZE_CLASS_MAP: Record<AvatarSize, string> = {
	sm: styles.overflowSm,
	md: styles.overflowMd,
	lg: styles.overflowLg,
};

function StackWrapper({
	onClick,
	className,
	children,
}: {
	onClick?: () => void;
	className: string;
	children: ReactNode;
}) {
	if (onClick) {
		return (
			<button type="button" className={className} onClick={onClick}>
				{children}
			</button>
		);
	}
	return <div className={className}>{children}</div>;
}

export function AvatarStack({ users, max = DEFAULT_MAX, size = "sm", onClick, className }: AvatarStackProps) {
	if (users.length === 0) {
		return null;
	}

	const visible = users.slice(0, max);
	const overflowCount = users.length - max;

	return (
		<StackWrapper onClick={onClick} className={clsx(styles.stack, className)}>
			{visible.map((user) => (
				<Avatar
					key={user.email}
					name={user.name}
					email={user.email}
					avatarUrl={user.avatarUrl}
					size={size}
					className={styles.item}
				/>
			))}
			{overflowCount > 0 && <span className={clsx(styles.overflow, SIZE_CLASS_MAP[size])}>+{overflowCount}</span>}
		</StackWrapper>
	);
}
