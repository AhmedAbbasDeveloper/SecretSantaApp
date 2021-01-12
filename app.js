require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const ejs = require("ejs");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

mongoose.connect(process.env.DB_URL, {useNewUrlParser: true, useUnifiedTopology: true});

const groupSchema = new mongoose.Schema({
  name: String,
  budget: Number
});

const Group = mongoose.model("Group", groupSchema);

const participantSchema = new mongoose.Schema({
  name: String,
  giftee: String,
  gifter: String,
  choices: [String],
  secretSantagroup: mongoose.Schema.Types.ObjectID
});

const Participant = mongoose.model("Participant", participantSchema);

function createUrl(groupID, route) {
  return "/" + groupID + "/" + route;
}

function getRandomNumber(size) {
  return Math.floor(Math.random() * size.length);
}

let currentYear = new Date().getFullYear();

app.get("/", function(req, res) {
  res.render("index", {currentYear: currentYear});
});

app.get("/new", function(req, res) {
  res.render("new", {currentYear: currentYear});
});

app.post("/new", function(req, res) {

  const newGroup = new Group({
    name: req.body.groupName,
    budget: req.body.groupBudget
  });
  newGroup.save();

  let listOfParticipants = [];
  let remainingGifters = [];
  let remainingGiftees = [];

  for (let key of Object.keys(req.body)) {
    let info = req.body[key];
    if (info != req.body.groupName && info != req.body.groupBudget) {
      listOfParticipants.push(info);
      remainingGifters.push(info);
      remainingGiftees.push(info);
    }
  }

  let gifters = [];
  let giftees = [];

  for (let i = 0; i < listOfParticipants.length; i++) {
    let gifter = listOfParticipants[i];
    if (giftees.includes(gifter) === false) {
      let randomNumber = getRandomNumber(remainingGiftees);
      let giftee = remainingGiftees[randomNumber];
      while (giftee === gifter) {
        randomNumber = getRandomNumber(remainingGiftees);
        giftee = remainingGiftees[randomNumber];
      }
      remainingGifters.splice(remainingGifters.indexOf(gifter), 1);
      remainingGiftees.splice(remainingGiftees.indexOf(giftee), 1);
      gifters.push(gifter);
      giftees.push(giftee);
    }
  }

  for (let i = 0; i < remainingGifters.length; i++) {
    let giftGiver = remainingGifters[i];
    let randomNumber = getRandomNumber(remainingGiftees);
    let giftGetter = remainingGiftees[randomNumber];
    remainingGiftees.splice(randomNumber, 1);
    gifters.push(giftGiver);
    giftees.push(giftGetter);
  }

  for (let i = 0; i < gifters.length; i++) {
    const newParticipant = new Participant({
      name: gifters[i],
      gifter: gifters[giftees.indexOf(gifters[i])],
      giftee: giftees[i],
      secretSantagroup: newGroup._id
    });
    newParticipant.save();
  }

  res.redirect(createUrl(newGroup._id, "confirmation"));
});

app.get("/:groupID/confirmation", function(req, res) {
  res.render("confirmation", {currentYear: currentYear, groupID: req.params.groupID, link: createUrl(req.params.groupID, "entername")});
});

app.get("/existing", function(req, res) {
  res.render("existing", {currentYear: currentYear});
});

app.post("/existing", function(req, res) {
  res.redirect(createUrl(req.body.groupID, "entername"));
});

app.get("/:groupID/entername", function(req, res, next) {
  Participant.find({secretSantagroup: req.params.groupID}, function(err, participants) {
    if (err) {
      let err = new Error("Group Code Not Found");
      next(err);
    } else {
      res.render("enterName", {currentYear: currentYear, participants: participants});
    }
  });
});

app.post("/:groupID/entername", function(req, res) {
  res.redirect(createUrl(req.params.groupID, req.body.participantName));
});

app.get("/:groupID/:particpantName", function(req, res, next) {
  Group.find({_id: req.params.groupID}, function(err, groups) {
    Participant.find({secretSantagroup: req.params.groupID, gifter: req.params.particpantName}, function(err, giftees) {
      Participant.find({secretSantagroup: req.params.groupID, name: req.params.particpantName}, function(err, gifters) {
        if (gifters[0].choices.length === 0) {
          res.render("sendChoices", {currentYear: currentYear, budget: groups[0].budget});
        } else {
          res.render("final", {currentYear: currentYear, name: req.params.particpantName, budget: groups[0].budget, giftee: giftees[0].name, choices: giftees[0].choices});
        }
      });
    });
  });
});

app.post("/:groupID/:particpantName", function(req, res) {
  Participant.updateOne({secretSantagroup: req.params.groupID, name: req.params.particpantName}, {$push: {choices: [req.body.choice1, req.body.choice2, req.body.choice3]}}, function(err) {
    if (err) {
      console.log(err);
    }
  });

  res.redirect(createUrl(req.params.groupID, req.params.particpantName));
});

app.get("*", function(req, res, next) {
  let err = new Error("Can't find the page you're looking for");
  next(err);
});

app.use(function(err, req, res) {
  res.status(404).send(err.message);
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started successfully");
});
