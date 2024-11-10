const Listing = require("../models/listing.js");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
let mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken:mapToken });
module.exports.renderAllListings = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

module.exports.renderListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({
        path: "review", populate: {
            path: "author"
        }
    }).populate("owner");
    if (!listing) {
        req.flash("error", "Listing you requested does not exits!!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.renderNewForm = async (req, res, next) => {
        let response=await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    }).send();
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    newListing.geometry = response.body.features[0].geometry;
    await newListing.save();
    req.flash("success", "Listing Added Successfully!");
    res.redirect("/listings");
};


module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing you requested does not exits!!");
        res.redirect("/listings");
    }
    let orginalImageUrl = listing.image.url;
    orginalImageUrl = orginalImageUrl.replace("/upload", "/upload/w_20");
    res.render("listings/edit.ejs", { listing , orginalImageUrl });
};

module.exports.renderUpdateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
     if (req.body.listing.location) {
        // Geocode the updated location
        let response = await geocodingClient.forwardGeocode({
            query: req.body.listing.location,
            limit: 1
        }).send();
        
        // Update the listing's geometry with the new geocode result
        listing.geometry = response.body.features[0].geometry;
    }
    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();   
    }
    req.flash("success", "Listing Updated Successfully!");
    res.redirect(`/listings/${id}`);
};

module.exports.renderDeleteListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted Successfully!");
    // console.log(deletedListing);
    res.redirect("/listings");
};