import axios from "axios";

/**
 * Fetch current weather for a city using OpenWeatherMap.
 * Falls back to a sensible default if the API key is missing
 * or the request fails — so the app never breaks without weather.
 *
 * @param {string} city  - e.g. "Mumbai" (default: "Mumbai")
 * @returns {Promise<{ temp: number, condition: string, city: string, layer: string }>}
 */
export async function getWeather(city = "Mumbai") {
  const apiKey = process.env.WEATHER_API_KEY;

  // ── No key configured → return a neutral fallback ────────────
  if (!apiKey || apiKey === "your-openweathermap-api-key") {
    return buildFallback(city);
  }

  try {
    const { data } = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          q: city,
          appid: apiKey,
          units: "metric",
        },
        timeout: 5000,
      }
    );

    const temp = Math.round(data.main.temp);
    const condition = data.weather[0].main; // e.g. "Clear", "Rain", "Clouds"

    return {
      temp,
      condition,
      city: data.name,
      layer: getLayerAdvice(temp, condition),
    };
  } catch (err) {
    console.warn("[WEATHER] API call failed, using fallback:", err.message);
    return buildFallback(city);
  }
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Translate temperature + condition into plain-English dressing advice
 * that gets injected into the Gemini prompt.
 */
function getLayerAdvice(temp, condition) {
  if (condition === "Rain" || condition === "Drizzle" || condition === "Thunderstorm") {
    return "rainy — avoid white/light fabrics, prefer waterproof or dark colours";
  }
  if (temp >= 35) return "very hot — prefer light, breathable fabrics; avoid dark heavy colours";
  if (temp >= 28) return "warm — light fabrics recommended";
  if (temp >= 20) return "comfortable — most fabrics work well";
  if (temp >= 12) return "cool — consider a light jacket or layer";
  return "cold — heavy layers recommended, prefer warm fabrics like wool or fleece";
}

function buildFallback(city) {
  return {
    temp: 28,
    condition: "Clear",
    city,
    layer: "comfortable — most fabrics work well",
    isFallback: true,
  };
}
