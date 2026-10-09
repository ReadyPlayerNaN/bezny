/* oxlint-disable react/button-has-type, jsx-a11y/prefer-tag-over-role -- Native types are validated; polymorphic controls implement button semantics. */
import type {
  ButtonHTMLAttributes,
  ComponentPropsWithRef,
  ElementType,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from "react";

import styles from "./button.module.scss";

export type ButtonVariant = "primary" | "secondary" | "critical";
export type ButtonSize = "normal" | "small";
type LegacyButtonType = "secondary" | "critical";

export interface ButtonOwnProps<C extends ElementType> {
  asComponent?: C;
  children?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  loading?: boolean;
  size?: ButtonSize;
  submit?: boolean;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"] | LegacyButtonType;
  variant?: ButtonVariant;
}

export type ButtonProps<C extends ElementType = "button"> = ButtonOwnProps<C> &
  Omit<ComponentPropsWithRef<C>, keyof ButtonOwnProps<C> | "disabled">;

const buttonClassName = (parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

interface ButtonAppearance {
  className: string | undefined;
  disabled: boolean;
  fullWidth: boolean;
  loading: boolean;
  size: ButtonSize;
  variant: ButtonVariant;
}

const resolveButtonClasses = ({
  className,
  disabled,
  fullWidth,
  loading,
  size,
  variant,
}: ButtonAppearance) =>
  buttonClassName([
    styles.button,
    size === "small" && styles.small,
    variant === "secondary" && styles.secondary,
    variant === "critical" && styles.critical,
    fullWidth ? styles.fullWidth : styles.autoWidth,
    disabled && styles.disabled,
    loading && styles.loading,
    className,
  ]);

const resolveNativeButtonType = (
  type: ButtonOwnProps<"button">["type"],
  submit: boolean
): "button" | "submit" | "reset" => {
  if (submit) {
    return "submit";
  }
  if (type === "secondary" || type === "critical" || !type) {
    return "button";
  }
  return type;
};

export const Button = <C extends ElementType = "button">({
  asComponent,
  children,
  className,
  disabled = false,
  fullWidth = false,
  loading = false,
  onClick,
  onKeyDown,
  size = "normal",
  submit = false,
  type,
  variant = "primary",
  ...props
}: ButtonProps<C>) => {
  const Component = (asComponent ?? "button") as ElementType;
  const isNativeButton = Component === "button";
  const isDisabled = disabled || loading;
  const resolvedVariant =
    type === "secondary" || type === "critical" ? type : variant;
  const classes = resolveButtonClasses({
    className,
    disabled: isDisabled,
    fullWidth,
    loading,
    size,
    variant: resolvedVariant,
  });

  const handleClick = (event: MouseEvent<Element>) => {
    if (isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const clickHandler = onClick as
      | ((event: MouseEvent<Element>) => void)
      | undefined;
    clickHandler?.(event);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const keyboardHandler = onKeyDown as
      | ((event: KeyboardEvent<HTMLElement>) => void)
      | undefined;
    keyboardHandler?.(event);
    if (
      !isNativeButton &&
      !event.defaultPrevented &&
      (event.key === "Enter" || event.key === " ")
    ) {
      event.preventDefault();
      event.currentTarget.click();
    }
  };

  const label = (
    <>
      <span className={styles.label}>{children}</span>
      {loading ? <span aria-hidden="true" className={styles.spinner} /> : null}
    </>
  );

  if (isNativeButton) {
    const nativeProps = props as ComponentPropsWithRef<"button">;
    const nativeType = resolveNativeButtonType(type, submit);
    return (
      <button
        {...nativeProps}
        type={nativeType}
        aria-busy={loading || undefined}
        className={classes}
        disabled={isDisabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        {label}
      </button>
    );
  }

  return (
    <Component
      {...props}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      className={classes}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={
        isDisabled ? -1 : ((props as { tabIndex?: number }).tabIndex ?? 0)
      }
    >
      {label}
    </Component>
  );
};

export const Submit = <C extends ElementType = "button">(
  props: ButtonProps<C>
) => <Button {...props} type="submit" />;
