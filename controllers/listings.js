const Listing = require("../models/listing.js");

module.exports.index = async (req, res) => {
  // console.log("User in /listings:", req.user);
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
};

module.exports.renderNewForm = (req, res) => {
  res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you requested does not exist!");
    return res.redirect("/listings");
  }
  console.log(listing);

  res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
  const { location } = req.body.listing;

  // Geocode using Nominatim API (OpenStreetMap)
  const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    location
  )}`;
  const geoResponse = await fetch(geoUrl, {
    headers: {
      "User-Agent": "wanderlust-app/1.0 (your_email@example.com)", // OSM requires this
    },
  });

  const geoData = await geoResponse.json();

  if (!geoData || geoData.length === 0) {
    req.flash("error", "Location not found!");
    return res.redirect("/listings/new");
  }

  const coords = [parseFloat(geoData[0].lon), parseFloat(geoData[0].lat)];

  // Create new listing
  const newListing = new Listing(req.body.listing);
  newListing.owner = req.user._id;

  // Add image if uploaded
  if (req.file) {
    newListing.image = {
      url: req.file.path,
      filename: req.file.filename,
    };
  }

  // Set geometry
  newListing.geometry = {
    type: "Point",
    coordinates: coords, // [longitude, latitude]
  };

  let savedListing = await newListing.save();
  console.log(savedListing);
  req.flash("success", "New Listing Created");
  res.redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing you requested for does not exists");
    return res.redirect("/listings");
  }

  let originalImageUrl = listing.image.url;
  originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");

  res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.updateListing = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });

  if (typeof req.file !== "undefined") {
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
  }

  req.flash("success", "Listing Updated");
  res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
  let { id } = req.params;
  let deleteListing = await Listing.findByIdAndDelete(id);
  console.log(deleteListing);
  req.flash("success", "Listing Deleted");
  res.redirect("/listings");
};
