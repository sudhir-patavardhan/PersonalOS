export async function GET() {
  return Response.json({
    status: 'ok',
    surface: 'demo-launcher',
    port: 3003,
  });
}
