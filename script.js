const API_KEY = "21bc5a076a6b21867e0fc4ee67fa0eb4";

let villes = [];

// Charger les villes avec coordonnées plutot que noms (pour éviter les erreurs où la ville n'est pas trouvée)
async function chargerVilles() {
  try {
    const res = await fetch("https://geo.api.gouv.fr/communes?fields=nom,centre&format=json&geometry=centre");
    const data = await res.json();
    villes = data.map(v => ({
      nom: v.nom,
      lat: v.centre.coordinates[1],
      lon: v.centre.coordinates[0]
    }));
  } catch (err) {
    console.error("Erreur de chargement des villes :", err);
  }
}

// Auto-complétion
function genererSuggestions(texte) {
  const suggestions = document.getElementById("suggestions");
  suggestions.innerHTML = "";

  if (texte.length < 2) return;

  const correspondances = villes
    .filter(v => v.nom.toLowerCase().startsWith(texte))
    .slice(0, 5);

  correspondances.forEach(ville => {
    const li = document.createElement("li");
    li.textContent = ville.nom;
    li.addEventListener("click", () => {
      document.getElementById("villeInput").value = ville.nom;
      suggestions.innerHTML = "";
      chercherVille(); // On déclenche directement la recherche en appeldant la fonction
    });
    suggestions.appendChild(li);
  });
}

// Traitement de la recherche de l'utilisateur
async function chercherVille() {
  const input = document.getElementById("villeInput");
  const saisie = input.value.trim().toLowerCase();
  const meteoDiv = document.getElementById("meteo");
  const suggestions = document.getElementById("suggestions");

  suggestions.innerHTML = "";

  const ville = villes.find(v => v.nom.toLowerCase() === saisie);

  if (!ville) {
    meteoDiv.innerHTML = `<p>Ville non trouvée.</p>`;
    return;
  }

  const { lat, lon, nom } = ville;

  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=fr`);
    const data = await res.json();

    if (data.cod !== 200) {
      meteoDiv.innerHTML = `<p>Ville introuvable / erreur API.</p>`;
      return;
    }

    afficherMeteo(data, nom);
    afficherCarte(lat, lon, nom);

  } catch (err) {
    console.error("Erreur météo :", err);
    meteoDiv.innerHTML = `<p>Erreur de récupération météo.</p>`;
  }
}

function getWeatherClass(main) {
  const m = main.toLowerCase();
  if (["rain", "drizzle"].includes(m)) return "rain";
  if (["mist", "fog", "haze", "smoke", "dust", "sand"].includes(m)) return "foggy";
  if (["thunderstorm"].includes(m)) return "storm";
  if (["tornado", "squall", "ash"].includes(m)) return "extreme";
  if (["snow"].includes(m)) return "snow";
  if (["clouds"].includes(m)) return "clouds";
  if (["clear"].includes(m)) return "clear";
  return "";
}
function activerEffetMeteo(classe) {
  if (classe === "clouds") classe = "foggy";

  const effets = {
    rain: document.getElementById("rain-effect"),
    foggy: document.getElementById("fog-effect"),
    snow: document.getElementById("snow-effect"),
  };

  Object.values(effets).forEach(el => {
    if (el) el.style.opacity = "0";
  });

  if (effets[classe]) {
    effets[classe].style.opacity = "1";
  }
}


// Afficher la météo pour la ville sélectionnée/recherchée
function afficherMeteo(data, nom) {
  const meteoDiv = document.getElementById("meteo");
  const temp = data.main.temp;
  const desc = data.weather[0].description;
  const icon = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

  const mainWeather = data.weather[0].main;
  const weatherClass = getWeatherClass(mainWeather);
  document.body.className = "";
  if (weatherClass) document.body.classList.add(weatherClass);
    activerEffetMeteo(weatherClass);
    meteoDiv.innerHTML = `
      <div class="meteo-wrapper">
        <img src="${iconUrl}" alt="${desc}" class="meteo-icone">
        <div class="meteo-infos">
          <h2 class="meteo-nom">${nom}</h2>
          <p class="meteo-desc">${desc}</p>
          <p class="meteo-temp"><strong>${temp}°C</strong></p>
        </div>
      </div>
      `;
  document.querySelector('.meteo-section').classList.remove('hidden');
  document.querySelector('.carte-section').classList.remove('hidden');
}

// Afficher la carte pour la ville sélectionnée/recherchée
function afficherCarte(lat, lon, nom) {
  if (window.map) {
    window.map.remove();
  }

  const carteSection = document.querySelector(".carte-section");

  const oldMapDiv = document.getElementById("map");
  if (oldMapDiv) oldMapDiv.remove();

  const mapDiv = document.createElement("div");
  mapDiv.id = "map";
  mapDiv.style.width = "100%";
  mapDiv.style.height = "300px";
  carteSection.appendChild(mapDiv);

  window.map = L.map('map').setView([lat, lon], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
    attribution: 'Données cartographiques © OpenStreetMap',
    maxZoom: 18
  }).addTo(window.map);

  L.marker([lat, lon]).addTo(window.map)
    .bindPopup(`📍 ${nom}`)
    .openPopup();
}

// DOM
document.addEventListener("DOMContentLoaded", async () => {
  await chargerVilles();

  const input = document.getElementById("villeInput");
  input.addEventListener("input", () => {
    const texte = input.value.toLowerCase();
    genererSuggestions(texte);
  });

  document.getElementById("searchBtn").addEventListener("click", chercherVille);
});
