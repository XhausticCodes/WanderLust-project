// Initialize map only if map element exists
let map;
let marker;

// Check if map element exists before initializing
const mapElement = document.getElementById("map");
if (mapElement) {
  // Check if we have listing coordinates (show page)
  const lat = mapElement.dataset.lat;
  const lon = mapElement.dataset.lon;
  const location = mapElement.dataset.location;
  
  if (lat && lon && location) {
    // Use listing coordinates for show page
    map = L.map("map").setView([parseFloat(lat), parseFloat(lon)], 13);
    
    // Add marker for the listing location
    marker = L.marker([parseFloat(lat), parseFloat(lon)])
      .addTo(map)
      .bindPopup(`${location}<br>Lat: ${lat}<br>Lon: ${lon}`)
      .openPopup();
  } else {
    // Default view for other pages
    map = L.map("map").setView([20.5937, 78.9629], 5); // Default India view
  }

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
}

// Add event listener for location form if it exists
const locationForm = document.getElementById("locationForm");
if (locationForm) {
  locationForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const query = document.getElementById("locationInput").value;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data && data.length > 0) {
      const lat = data[0].lat;
      const lon = data[0].lon;

      // Move map and add marker
      map.setView([lat, lon], 13);

      if (marker) map.removeLayer(marker);

      marker = L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`${query}<br>Lat: ${lat}<br>Lon: ${lon}`)
        .openPopup();
    } else {
      alert("Location not found!");
    }
  });
}
