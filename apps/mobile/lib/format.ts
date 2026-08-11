export function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatPace(meters: number, seconds: number): string {
  const km = meters / 1000;

  // Not enough distance yet — avoid divide-by-near-zero noise
  if (km < 0.02) return '--:--';

  const secPerKm = seconds / km;
  let mins = Math.floor(secPerKm / 60);
  let secs = Math.round(secPerKm % 60);

  // handle rounding overflow (e.g. 5:59.6 -> should be 6:00, not 5:60)
  if (secs === 60) {
    secs = 0;
    mins += 1;
  }

  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}