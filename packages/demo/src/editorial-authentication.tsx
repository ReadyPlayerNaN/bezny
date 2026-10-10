import { LoginScreen } from "@bezny/base";
import { atom, useSetAtom } from "jotai";
import { useTranslation } from "react-i18next";

export interface EditorialUser {
  name: string;
  email: string;
  provider: "email" | "google" | "github";
}
export const editorialUserAtom = atom<EditorialUser | null>(null);
export const demoEditorialUser: EditorialUser = {
  email: "editor@example.com",
  name: "Demo Editor",
  provider: "email",
};
export const demoPassword = "bezny-demo";

/** Deliberately simulated authentication: never use this as an access-control boundary. */
export const EditorialLogin = () => {
  const { t } = useTranslation("authentication");
  const setUser = useSetAtom(editorialUserAtom);
  return (
    <LoginScreen
      description={t("demoNotice", {
        email: demoEditorialUser.email,
        password: demoPassword,
      })}
      labels={{
        email: t("email"),
        emailInvalid: t("emailInvalid"),
        emailRequired: t("emailRequired"),
        loginError: t("loginError"),
        password: t("password"),
        passwordRequired: t("passwordRequired"),
        separator: t("separator"),
        submit: t("submit"),
        title: t("title"),
      }}
      onLogin={({ email, password }) => {
        if (
          email.trim().toLowerCase() !== demoEditorialUser.email ||
          password !== demoPassword
        ) {
          throw new Error("Invalid demo credentials");
        }
        setUser({ ...demoEditorialUser });
      }}
      socialProviders={[
        {
          id: "google",
          label: t("social", { provider: "Google" }),
          onLogin: () => {
            setUser({
              email: "google@example.com",
              name: "Google Editor",
              provider: "google",
            });
          },
        },
        {
          id: "github",
          label: t("social", { provider: "GitHub" }),
          onLogin: () => {
            setUser({
              email: "github@example.com",
              name: "GitHub Editor",
              provider: "github",
            });
          },
        },
      ]}
    />
  );
};
