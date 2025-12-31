export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  error: { digest: string } & Error,
  request: {
    path: string;
    method: string;
    headers: { [key: string]: string };
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    renderSource: "react-server-components" | "react-server-components-payload" | "server-rendering";
    revalidateReason: "on-demand" | "stale" | undefined;
    renderType: "dynamic" | "dynamic-resume";
  }
) => {
  try {
    const Sentry = await import("@sentry/nextjs");
    Sentry.captureException(error, {
      extra: {
        request: {
          path: request.path,
          method: request.method,
        },
        context,
      },
    });
  } catch (sentryError) {
    // Fallback to console.error if Sentry is unavailable
    console.error('Failed to report error to Sentry:', sentryError);
    console.error('Original error:', error);
  }
};
