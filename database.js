var moment = require('moment');

const admin = require('./firebaseInit');

var previousExecution = moment();

var ref = admin.app().database().ref();

ref.on("value", function (snapshot) {
  var val = snapshot.val();
  console.log(`readed from firebase ${val.prevTime}`);
  if (moment(val.prevTime, "YYYY-MM-DD-HH-mm-ss").isValid()) {
    previousExecution = moment(val.prevTime, "YYYY-MM-DD-HH-mm-ss");
    console.log('saved to var', previousExecution);
  }
}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});

function saveTime() {
  ref.set({
    prevTime: moment().format("YYYY-MM-DD-HH-mm-ss")
  })
}

function getTime() {
  return previousExecution;
}

module.exports = {
  saveTime,
  getTime
}