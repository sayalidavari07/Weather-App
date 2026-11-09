const form = document.getElementById("search-form");
const cityInput = document.getElementById("city-input");
const locationBtn = document.getElementById("location-btn");
const message = document.getElementById("message");
const weatherSection = document.getElementById("weather");

const weatherCodes = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Moderate drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  61: ["Slight rain", "🌧️"],
  63: ["Moderate rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  71: ["Slight snow", "🌨️"],
  73: ["Moderate snow", "❄️"],
  75: ["Heavy snow", "❄️"],
  80: ["Rain showers", "🌦️"],
  81: ["Moderate rain showers", "🌧️"],
  82: ["Violent rain showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Thunderstorm with heavy hail", "⛈️"]
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (!city) return;
  setMessage("Searching for " + city + "...");
  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );
    if (!geoResponse.ok) throw new Error("Could not search for that city.");
    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found. Check the spelling and try again.");
    }
    const place = geoData.results[0];
    await loadWeather(place.latitude, place.longitude, place.name, place.country);
  } catch (error) {
    showError(error.message);
  }
});

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("Your browser does not support location access. Search by city instead.");
    return;
  }
  setMessage("Getting your location...");
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        await loadWeather(
          position.coords.latitude,
          position.coords.longitude,
          "Your current location",
          ""
        );
      } catch (error) {
        showError(error.message);
      }
    },
    () => showError("Location permission was not granted. You can search by city instead.")
  );
});

async function loadWeather(latitude, longitude, city, country) {
  setMessage("Loading weather...");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&timezone=auto`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather data could not be loaded. Please try again.");
  const data = await response.json();
  const current = data.current;
  const [condition, icon] = weatherCodes[current.weather_code] || ["Unknown conditions", "🌡️"];

  document.getElementById("city-name").textContent = country ? `${city}, ${country}` : city;
  document.getElementById("weather-icon").textContent =
    current.is_day === 0 && current.weather_code === 0 ? "🌙" : icon;
  document.getElementById("temperature").textContent = `${Math.round(current.temperature_2m)}°C`;
  document.getElementById("condition").textContent = condition;
  document.getElementById("feels-like").textContent = `${Math.round(current.apparent_temperature)}°C`;
  document.getElementById("humidity").textContent = `${current.relative_humidity_2m}%`;
  document.getElementById("wind").textContent = `${current.wind_speed_10m} km/h`;
  document.getElementById("updated").textContent = `Updated: ${current.time.replace("T", " ")} (local time)`;

  weatherSection.classList.remove("hidden");
  setMessage("");
}

function setMessage(text) {
  message.textContent = text;
}

function showError(text) {
  weatherSection.classList.add("hidden");
  setMessage(text);
}
