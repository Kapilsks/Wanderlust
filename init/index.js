const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const MongoUrl = "mongodb://127.0.0.1:27017/wanderlust";
main().then((res) => {
    console.log("connection successful");
}).catch(err => console.log(err));

async function main() {
  await mongoose.connect(MongoUrl);
}

const initdb = async () => {
  await Listing.deleteMany({});
  initData.data=initData.data.map((obj) => ({ ...obj, owner: "66c4af778c5d663240c2628f" }));
    await Listing.insertMany(initData.data);
    console.log("Succesfully added");
}
initdb();