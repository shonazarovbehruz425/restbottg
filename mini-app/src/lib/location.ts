import { getTelegramLocation, haptic } from './telegram';
import api from './api';

export interface LocationResult {
  latitude: number;
  longitude: number;
  address: string;
  source: 'telegram' | 'gps' | 'network' | 'ip';
}

/**
 * Brauzer yoki qurilma geolokatsiyasini timeout va fallback bilan olish
 */
function getBrowserCoordinates(): Promise<{ latitude: number; longitude: number; source: 'gps' | 'network' }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return reject(new Error('Qurilmangizda geolokatsiya qo\'llab-quvvatlanmaydi.'));
    }

    // 1-bosqich: Yuqori aniqlikdagi GPS (6 sekund limit)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          source: 'gps'
        });
      },
      (firstErr) => {
        // Agar foydalanuvchi qat'iyan rad etgan bo'lsa (PERMISSION_DENIED = 1)
        if (firstErr.code === 1) {
          return reject(new Error('Geolokatsiyaga ruxsat berilmadi. Iltimos, telefoningiz sozlamalaridan yoki brauzerdan lokatsiyaga ruxsat bering.'));
        }

        // 2-bosqich: Tarmoq/Wi-Fi/Kesh orqali tezkor aniqlash (fallback)
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              source: 'network'
            });
          },
          (secondErr) => {
            if (secondErr.code === 1) {
              reject(new Error('Geolokatsiyaga ruxsat berilmadi. Sozlamalardan ruxsat bering.'));
            } else if (secondErr.code === 2) {
              reject(new Error('Lokatsiyani aniqlab bo\'lmadi. GPS (Geolokatsiya) yoqilganligini tekshiring.'));
            } else {
              reject(new Error('Lokatsiyani aniqlash vaqti tugadi. Qayta urinib ko\'ring yoki manzilni yozing.'));
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 7000,
            maximumAge: 60000
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 0
      }
    );
  });
}

/**
 * Koordinatalarni ko'cha va tuman nomiga aylantirish (Reverse Geocoding)
 */
export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  // 1. Backend proxy orqali (eng aniq, Photon + Nominatim + POI ko'chasi va mo'ljal bilan)
  try {
    const res = await api.get(`/geocode/reverse?lat=${lat}&lng=${lng}`);
    if (res.data?.success && res.data.data?.address) {
      return res.data.data.address;
    }
  } catch (backendErr) {
    console.warn('Backend geocode xatosi:', backendErr);
  }

  // 2. Client-side Photon fallback
  try {
    const photonRes = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`, {
      signal: AbortSignal.timeout(3500)
    });
    if (photonRes.ok) {
      const pData = await photonRes.json();
      const p = pData.features?.[0]?.properties;
      if (p) {
        let city = p.city || p.county || p.state || '';
        const district = p.district || p.suburb || p.locality || '';
        const street = p.street || '';
        const house = p.housenumber ? `${p.housenumber}-uy` : '';
        const poi = (p.name && p.name !== street && p.name !== city) ? p.name : '';

        if (city.toLowerCase() === 'samarqand shahri') city = 'Samarqand';
        const parts = [city, district !== city ? district : '', street, house].filter(Boolean);
        let addr = parts.join(', ');
        if (poi) addr = addr ? `${addr} (Mo'ljal: ${poi})` : poi;
        if (addr) return addr;
      }
    }
  } catch (clientErr) {}

  // 3. Client-side BigDataCloud fallback (tez va ochiq)
  try {
    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=uz`;
    const res = await fetch(bdcUrl, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.principalSubdivision || '';
      const locality = data.locality || '';
      const parts = [city, locality !== city ? locality : ''].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }
  } catch (clientErr) {
    console.warn('Client geocode xatosi:', clientErr);
  }

  // 4. Fallback: Aniq GPS koordinata
  return `GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * Asosiy funksiya: Har qanday platformada (Telegram iOS/Android/Desktop, Web) lokatsiyani olish
 */
export async function detectCurrentLocation(): Promise<LocationResult> {
  let coords: { latitude: number; longitude: number } | null = null;
  let source: 'telegram' | 'gps' | 'network' = 'gps';

  // 1. Telegram native LocationManager ni tekshirish
  try {
    const tgCoords = await getTelegramLocation();
    if (tgCoords) {
      coords = tgCoords;
      source = 'telegram';
    }
  } catch (tgErr) {
    console.warn('Telegram LocationManager xatosi:', tgErr);
  }

  // 2. Agar Telegram'dan olinmagan bo'lsa, brauzer Geolocation'ni chaqiramiz
  if (!coords) {
    const browserCoords = await getBrowserCoordinates();
    coords = { latitude: browserCoords.latitude, longitude: browserCoords.longitude };
    source = browserCoords.source;
  }

  haptic('medium');

  // 3. Koordinatani tushunarli manzilga aylantiramiz
  const readableAddress = await reverseGeocodeCoords(coords.latitude, coords.longitude);

  haptic('success');

  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    address: readableAddress,
    source
  };
}
