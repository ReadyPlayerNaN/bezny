import clsx, { type ClassValue } from "clsx";
import md5 from "md5";
import { useEffect, useState } from "react";
import styles from "./Avatar.module.scss";

export type AvatarSize = "sm" | "md" | "lg";

export type AvatarProps = {
	name: string;
	email: string;
	avatarUrl?: string | null;
	size?: AvatarSize;
	className?: ClassValue;
};

const GRAVATAR_SIZE = 80;

const SIZE_PX: Record<AvatarSize, number> = {
	sm: 24,
	md: 40,
	lg: 64,
};

function getInitials(name: string): string {
	return name
		.split(" ")
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? "")
		.join("");
}

function getGravatarUrl(email: string): string {
	const hash = md5(email.trim().toLowerCase());
	return `https://www.gravatar.com/avatar/${hash}?d=mp&s=${GRAVATAR_SIZE}`;
}

export function Avatar({ name, email, avatarUrl, size = "md", className }: AvatarProps) {
	const [imgFailed, setImgFailed] = useState(false);
	const src = avatarUrl ?? getGravatarUrl(email);
	const initials = getInitials(name);
	const px = SIZE_PX[size];

	useEffect(() => {
		setImgFailed(false);
		const img = new Image();
		img.onerror = () => setImgFailed(true);
		img.src = src;
	}, [src]);

	if (imgFailed) {
		return (
			<span className={clsx(styles.avatar, styles[size], styles.initials, className)} aria-label={name} role="img">
				{initials}
			</span>
		);
	}

	return <img src={src} alt={name} width={px} height={px} className={clsx(styles.avatar, styles[size], className)} />;
}
