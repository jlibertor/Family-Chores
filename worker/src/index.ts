interface ApiMessage {
  ok: boolean;
  service: string;
  phase: string;
}

const json = (body: ApiMessage, init: ResponseInit = {}) =>
  Response.json(body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      ...init.headers,
    },
    ...init,
  });

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health" || url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "family-chores-api",
        phase: "phase-1-foundation",
      });
    }

    if (url.pathname.startsWith("/api/")) {
      return json(
        {
          ok: false,
          service: "family-chores-api",
          phase: "api-placeholder",
        },
        { status: 404 },
      );
    }

    return new Response("Family Chores API", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
};
