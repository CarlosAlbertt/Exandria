// Diagnóstico de despliegue: qué commit está en producción.
export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
    builtAt: new Date().toISOString(),
  });
}
