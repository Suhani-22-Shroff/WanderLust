const Listing = require("../models/listing");
const axios = require("axios");

const forwardGeocode = async (query, limit = 1) => {
	const apiKey = process.env.GEOCODING_API_KEY;
	try {
		const response = await axios.get(
			"https://api.opencagedata.com/geocode/v1/json",
			{
				params: {
					q: query,
					limit: limit,
					key: apiKey,
				},
			}
		);
		return response.data.results;
	} catch (error) {
		console.error("Error performing geocoding:", error);
		return null;
	}
};

module.exports.index = async (req, res) => {
	const allListings = await Listing.find({});
	res.render("./listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
	res.render("./listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
	const { id } = req.params;
	const listing = await Listing.findById(id)
		.populate({
			path: "reviews",
			populate: {
				path: "author",
			},
		})
		.populate("owner");
	if (!listing) {
		req.flash("error", "Listing you requested for does not exist!");
		return res.redirect("/listings");
	}
	res.render("./listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
	const { path, filename } = req.file;
	const newListing = new Listing(req.body.listing);
	newListing.owner = req.user._id;
	newListing.image = { url: path, filename };

	// Perform geocoding to get coordinates and formatted location
	const query = req.body.listing.location;
	const results = await forwardGeocode(query, 1);

	if (results && results.length > 0) {
		const { lat, lng } = results[0].geometry;
		newListing.geometry = {
			type: "Point",
			coordinates: [lng, lat], // GeoJSON format: [lng, lat]
		};
		newListing.location = results[0].formatted;
	} else {
		req.flash("error", "Geocoding failed. Please check the address.");
		return res.redirect("/listings/new");
	}

	try {
		let savedListing = await newListing.save();
		console.log(savedListing);
		req.flash("success", "New Listing Created!");
		res.redirect("/listings");
	} catch (err) {
		console.error("Error saving listing:", err);
		req.flash("error", "Failed to create new listing.");
		res.redirect("/listings/new");
	}
};

module.exports.renderEditForm = async (req, res) => {
	const { id } = req.params;
	const listing = await Listing.findById(id);
	if (!listing) {
		req.flash("error", "Listing you requested for does not exist!");
		return res.redirect("/listings");
	}

	const originalImageUrl = listing.image.url.replace(
		"/upload",
		"/upload/w_250"
	);
	res.render("./listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
	const { id } = req.params;
	let listing = await Listing.findById(id);

	if (!listing) {
		req.flash("error", "Listing you requested for does not exist!");
		return res.redirect("/listings");
	}

	try {
		// Update the listing object with new data
		listing.set(req.body.listing);

		// Perform geocoding to get coordinates and formatted location
		const query = req.body.listing.location;
		const results = await forwardGeocode(query, 1);

		if (results && results.length > 0) {
			const { lat, lng } = results[0].geometry;
			listing.geometry = {
				type: "Point",
				coordinates: [lng, lat], // GeoJSON format: [lng, lat]
			};
			listing.location = results[0].formatted;
		} else {
			req.flash("error", "Geocoding failed. Please check the address.");
			return res.redirect(`/listings/${id}/edit`);
		}

		await listing.save();
		req.flash("success", "Listing Updated!");
		res.redirect(`/listings/${id}`);
	} catch (err) {
		console.error("Error updating listing:", err);
		req.flash("error", "Failed to update listing.");
		res.redirect(`/listings/${id}/edit`);
	}
};

module.exports.destroyListing = async (req, res) => {
	const { id } = req.params;
	const deletedListing = await Listing.findByIdAndDelete(id);
	req.flash("success", "Listing Deleted!");
	res.redirect("/listings");
};
