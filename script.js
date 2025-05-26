// ✅ Remplace par ta vraie clé API OpenWeatherMap ici :
const API_KEY = "21bc5a076a6b21867e0fc4ee67fa0eb4"; // <-- À modifier

// Sélecteurs DOM
const select = document.getElementById("villeSelect");
const meteoDiv = document.getElementById("meteoResultat");

// Charger la liste des villes (on limite à celles avec plus de 5000 habitants pour alléger)
fetch("https://geo.api.gouv.fr/communes?fields=nom,centre,population&format=json&geometry=centre")
  .then(res => res.json())
  .then(data => {
    // Trier par population descendante et limiter à 100 villes
    const communes = data
      .filter(commune => commune.population > 5000)
      .sort((a, b) => b.population - a.population)
      .slice(0, 500);

    // Nettoyer le select
    select.innerHTML = '<option value="">-- Choisis une ville --</option>';

    // Remplir le select
    communes.forEach(commune => {
      const option = document.createElement("option");
      option.value = commune.nom;
      option.textContent = commune.nom;
      select.appendChild(option);
    });
  })
  .catch(err => {
    console.error("Erreur API communes :", err);
    select.innerHTML = '<option>Erreur de chargement</option>';
  });

// Événement : quand on choisit une ville
select.addEventListener("change", () => {
  const ville = select.value;
  if (!ville) return;

  const urlMeteo = `https://api.openweathermap.org/data/2.5/weather?q=${ville}&appid=${API_KEY}&units=metric&lang=fr`;

  fetch(urlMeteo)
    .then(res => res.json())
    .then(data => {
      if (data.cod !== 200) {
        meteoDiv.innerHTML = `<p>Erreur : ${data.message}</p>`;
        return;
      }

      const temp = data.main.temp;
      const desc = data.weather[0].description;
      const icon = data.weather[0].icon;
      const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

      meteoDiv.innerHTML = `
        <h2>Météo à ${ville}</h2>
        <p><img src="${iconUrl}" alt="Icône météo"> ${desc}</p>
        <p>Température : ${temp}°C</p>
      `;
    })
    .catch(err => {
      console.error("Erreur météo :", err);
      meteoDiv.innerHTML = `<p>Erreur lors de la récupération météo.</p>`;
    });
});
