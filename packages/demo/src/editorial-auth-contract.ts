export interface EditorialUser {
  name: string;
  email: string;
  provider: "email" | "google" | "github";
}
export const demoEditorialUser: EditorialUser = {
  email: "editor@example.com",
  name: "Demo Editor",
  provider: "email",
};
export const demoPassword = "bezny-demo";
export const editorialSessionEndpoint = "/api/session";

export const parseEditorialUser = (value: unknown): EditorialUser | null => {
  if (
    typeof value !== "object" ||
    value === null ||
    !("name" in value) ||
    typeof value.name !== "string" ||
    !value.name.trim() ||
    !("email" in value) ||
    typeof value.email !== "string" ||
    !value.email.trim() ||
    !("provider" in value) ||
    (value.provider !== "email" &&
      value.provider !== "google" &&
      value.provider !== "github")
  ) {
    return null;
  }
  return { email: value.email, name: value.name, provider: value.provider };
};
