import { useId, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Heading } from "../content/heading.js";
import { Button, Submit } from "../controls/button.js";
import { EmailField, TextField } from "../fields/text-field.js";

import styles from "./login-screen.module.scss";

export interface LoginCredentials {
  email: string;
  password: string;
}
export interface SocialLoginProvider {
  id: string;
  label: string;
  onLogin: () => void | Promise<void>;
}
export interface LoginScreenLabels {
  title: string;
  email: string;
  password: string;
  submit: string;
  separator: string;
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  loginError: string;
}
export interface LoginScreenProps {
  onLogin: (credentials: LoginCredentials) => void | Promise<void>;
  socialProviders?: readonly SocialLoginProvider[];
  labels?: Partial<LoginScreenLabels>;
  description?: ReactNode;
  className?: string;
}
const defaultLabels: LoginScreenLabels = {
  email: "Email",
  emailInvalid: "Enter a valid email.",
  emailRequired: "Enter your email.",
  loginError: "Unable to sign in. Please try again.",
  password: "Password",
  passwordRequired: "Enter your password.",
  separator: "Or continue with",
  submit: "Sign in",
  title: "Sign in",
};
const noSocialProviders: readonly SocialLoginProvider[] = [];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

/** Presentation and form validation only; the host owns authentication. */
export const LoginScreen = ({
  onLogin,
  socialProviders = noSocialProviders,
  labels: labelOverrides,
  description,
  className,
}: LoginScreenProps) => {
  const labels = { ...defaultLabels, ...labelOverrides };
  const titleId = useId();
  const descriptionId = useId();
  const form = useForm<LoginCredentials>({
    defaultValues: { email: "", password: "" },
  });
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const authenticate = async (login: () => void | Promise<void>) => {
    setFailed(false);
    setPending(true);
    try {
      await login();
    } catch {
      setFailed(true);
    }
    setPending(false);
  };
  return (
    <main className={[styles.screen, className].filter(Boolean).join(" ")}>
      <section className={styles.panel} aria-labelledby={titleId}>
        <Heading level={1} id={titleId}>
          {labels.title}
        </Heading>
        {description ? <div id={descriptionId}>{description}</div> : null}
        <form
          className={styles.form}
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          aria-busy={pending}
          noValidate
          onSubmit={form.handleSubmit(async (credentials) => {
            if (!pending) {
              await authenticate(() => onLogin(credentials));
            }
          })}
        >
          <EmailField<LoginCredentials>
            control={form.control}
            name="email"
            label={labels.email}
            autoComplete="username"
            readOnly={pending}
            rules={{
              pattern: { message: labels.emailInvalid, value: emailPattern },
              required: labels.emailRequired,
            }}
          />
          <TextField<LoginCredentials>
            control={form.control}
            name="password"
            label={labels.password}
            type="password"
            autoComplete="current-password"
            readOnly={pending}
            rules={{ required: labels.passwordRequired }}
          />
          {failed ? <p role="alert">{labels.loginError}</p> : null}
          <Submit fullWidth loading={pending}>
            {labels.submit}
          </Submit>
          {socialProviders.length > 0 ? (
            <>
              <p className={styles.separator}>{labels.separator}</p>
              {socialProviders.map((provider) => (
                <Button
                  key={provider.id}
                  variant="secondary"
                  fullWidth
                  disabled={pending}
                  onClick={async () => {
                    await authenticate(provider.onLogin);
                  }}
                >
                  {provider.label}
                </Button>
              ))}
            </>
          ) : null}
        </form>
      </section>
    </main>
  );
};
