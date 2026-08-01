/**
 * Calculates distance between two coordinates in meters using the Haversine formula.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Gets user's current GPS position using browser Geolocation API.
 */
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Browser Anda tidak mendukung Geolocation GPS.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Akses lokasi (GPS) ditolak oleh pengguna atau browser. Harap izinkan akses lokasi di pengaturan browser.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Sinyal GPS tidak tersedia atau tidak dapat dideteksi.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Waktu pencarian lokasi (GPS) habis. Silakan coba lagi.'));
            break;
          default:
            reject(new Error('Gagal mendapatkan lokasi GPS.'));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
}
