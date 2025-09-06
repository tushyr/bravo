// Shop-related helpers

// Determine if a shop is currently open based on its open and close times (HH:MM 24h)
// Optionally provide a Date instance for testing/consistency.
export function isShopOpen(shop, now = new Date()) {
  if (!shop || !shop.openTime || !shop.closeTime) return false;
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [openHour, openMin] = String(shop.openTime).split(':').map(Number);
  const [closeHour, closeMin] = String(shop.closeTime).split(':').map(Number);
  const openTime = (openHour || 0) * 60 + (openMin || 0);
  const closeTime = (closeHour || 0) * 60 + (closeMin || 0);

  return currentTime >= openTime && currentTime <= closeTime;
}

export function buildGoogleMapsUrl(shop) {
  if (!shop?.coordinates) return null;
  const { lat, lng } = shop.coordinates;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function openShopInMaps(shop) {
  const url = buildGoogleMapsUrl(shop);
  if (url) window.open(url, '_blank');
}

export function getStatusText(shop, now = new Date()) {
  if (!shop) return 'Closed';
  if (shop.userReported === 'closed') return 'Reported Closed';
  if (shop.userReported === 'open') return 'Reported Open';
  return isShopOpen(shop, now) ? 'Open Now' : 'Closed';
}
