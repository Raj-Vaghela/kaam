// Next.js 16 instrumentation hook — loaded once per server process start.
// Sentry SDK docs recommend this pattern for App Router projects.
// See: https://docs.sentry.io/platforms/javascript/guides/nextjs/

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        await import("./sentry.server.config");
    }

    // sentry.edge.config.ts is not present in this project; skip edge import.
    // TODO: add sentry.edge.config.ts and uncomment when Edge Runtime routes
    // are introduced:
    // if (process.env.NEXT_RUNTIME === "edge") {
    //     await import("./sentry.edge.config");
    // }
}
