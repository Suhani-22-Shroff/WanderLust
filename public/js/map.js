function initializeMap(listingData) {
	if (
		listingData &&
		listingData.geometry &&
		listingData.geometry.coordinates.length === 2
	) {
		// Extract coordinates from listingData
		const [lng, lat] = listingData.geometry.coordinates;

		// Initialize the map and set view to the listing location
		const map = L.map("map").setView([lat, lng], 13);

		// Add OpenStreetMap tiles
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
		}).addTo(map);

		// Add a marker at the listing location
		L.marker([lat, lng])
			.addTo(map)
			.bindPopup(`<b>${listingData.location}</b>`)
			.openPopup();
	} else {
		// If coordinates are not defined or incorrect, set a default location (Mumbai)
		const map = L.map("map").setView([lat, lng], 13);

		// Add OpenStreetMap tiles
		L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
			maxZoom: 19,
		}).addTo(map);

		// Add a default marker at the center of the map
		L.marker([lat, lng]).addTo(map).bindPopup("Default Marker in Mumbai");

		console.error(
			"Listing data or location coordinates are not defined or incorrect."
		);
	}
}
