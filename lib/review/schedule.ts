export function nextReviewAt(quality: number, currentStreak: number) {
  const minutes = quality < 3 ? 10 : quality === 3 ? 24 * 60 : quality === 4 ? 3 * 24 * 60 : Math.min(14, Math.max(7, currentStreak + 1)) * 24 * 60;
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function nextStreak(quality: number, currentStreak: number) { return quality < 3 ? 0 : currentStreak + 1; }
