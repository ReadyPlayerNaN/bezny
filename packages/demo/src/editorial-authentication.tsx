import { LoginScreen } from "@bezny/base";
import { useAtomValue } from "jotai";
import { useTranslation } from "react-i18next";

import { demoEditorialUser, demoPassword } from "./editorial-auth-contract.js";
import { editorialAuthenticationAtom } from "./editorial-auth-state.js";

/** Deliberately simulated authentication: never use this as an access-control boundary. */
export const EditorialLogin = () => {
  const { t } = useTranslation("authentication");
  const authentication = useAtomValue(editorialAuthenticationAtom);
  if (!authentication) {
    throw new Error("Authentication service is required");
  }
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
      onLogin={async (credentials) => {
        await authentication.signIn(credentials);
      }}
      socialProviders={[
        {
          id: "google",
          label: t("social", { provider: "Google" }),
          onLogin: async () => {
            await authentication.signInSocial("google");
          },
        },
        {
          id: "github",
          label: t("social", { provider: "GitHub" }),
          onLogin: async () => {
            await authentication.signInSocial("github");
          },
        },
      ]}
    />
  );
};
