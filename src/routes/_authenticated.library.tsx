import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/_authenticated/library")({ component: ()=> <p>Ditt bibliotek kommer snart.</p> });
