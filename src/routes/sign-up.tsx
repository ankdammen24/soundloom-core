import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "./sign-in";

export const Route = createFileRoute("/sign-up")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "",
  }),
  component: SignUpPage,
});

function SignUpPage() {
  return <AuthForm initialMode="sign-up" />;
}
