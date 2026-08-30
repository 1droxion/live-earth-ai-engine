const SUPABASE_URL = process.env.NEXT_PUBLIC_LIVE_EARTH_SUPABASE_URL || 'https://natqbwulzzwirbksrvje.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_LIVE_EARTH_SUPABASE_KEY || 'sb_publishable_rqWj3rTG0JIy8kNfpkZPqQ_zbI6K4gt';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') || 'world-001';

  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_world_snapshot`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ p_slug: slug }),
    cache: 'no-store'
  });

  if (!response.ok) {
    const detail = await response.text();
    return Response.json({ error: 'world_snapshot_unavailable', detail }, { status: 502 });
  }

  const snapshot = await response.json();
  return Response.json(snapshot, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
