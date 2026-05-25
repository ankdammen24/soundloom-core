import { createFileRoute } from "@tanstack/react-router";
import { validateApiKey } from "@/lib/api-keys.server";

export const Route = createFileRoute("/api/public/v1/whoami")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const result = await validateApiKey(request, "catalog:read");
        if (!result.ok) {
          return Response.json(
            { error: result.reason },
            { status: result.status },
          );
        }
        return Response.json({
          key_id: result.key_id,
          scopes: result.scopes,
        });
      },
    },
  },
});
