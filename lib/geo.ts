const R = 6371000; // radius bumi meter
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

// Proyeksikan titik p ke segmen a-b (semua [lng, lat]).
// Kembalikan fraksi t (0..1) posisi proyeksi sepanjang segmen + jarak (meter)
// dari p ke titik proyeksi. Pakai aproksimasi planar lokal (cukup untuk skala km).
export function projectPointToSegment(
  p: [number, number],
  a: [number, number],
  b: [number, number]
): { t: number; distance: number } {
  // Konversi ke meter lokal relatif a (equirectangular).
  const lat0 = toRad(a[1]);
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos(lat0);
  const ax = 0;
  const ay = 0;
  const bx = (b[0] - a[0]) * mPerDegLng;
  const by = (b[1] - a[1]) * mPerDegLat;
  const px = (p[0] - a[0]) * mPerDegLng;
  const py = (p[1] - a[1]) * mPerDegLat;

  const dx = bx - ax;
  const dy = by - ay;
  const segLen2 = dx * dx + dy * dy;
  let t = segLen2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / segLen2;
  t = Math.max(0, Math.min(1, t));
  const projx = ax + t * dx;
  const projy = ay + t * dy;
  const distance = Math.hypot(px - projx, py - projy);
  return { t, distance };
}

// Jarak haversine (meter) antara dua titik [lng, lat].
export function haversine(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Bearing (derajat 0-360) dari a ke b, titik [lng, lat].
export function bearing(a: [number, number], b: [number, number]): number {
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLng = toRad(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Interpolasi titik sepanjang polyline berdasarkan fraksi jarak (0..1).
// Kembalikan posisi + bearing arah gerak.
export function pointAlong(
  coords: [number, number][],
  fraction: number
): { lng: number; lat: number; bearing: number } {
  if (coords.length === 1) {
    return { lng: coords[0][0], lat: coords[0][1], bearing: 0 };
  }
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = haversine(coords[i], coords[i + 1]);
    segLens.push(d);
    total += d;
  }
  const target = Math.max(0, Math.min(1, fraction)) * total;
  let acc = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (acc + segLens[i] >= target) {
      const f = segLens[i] === 0 ? 0 : (target - acc) / segLens[i];
      const lng = coords[i][0] + (coords[i + 1][0] - coords[i][0]) * f;
      const lat = coords[i][1] + (coords[i + 1][1] - coords[i][1]) * f;
      return { lng, lat, bearing: bearing(coords[i], coords[i + 1]) };
    }
    acc += segLens[i];
  }
  const last = coords[coords.length - 1];
  const prev = coords[coords.length - 2];
  return { lng: last[0], lat: last[1], bearing: bearing(prev, last) };
}
