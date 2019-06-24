var moment = require('moment');

const admin = require('../util/firebaseInit');
var constants = require('../util/constants');

var previousExecution = moment();
var ref = admin.app().database().ref();

ref.on("value", function (snapshot) {
  var val = snapshot.val();
  console.log(`readed from firebase ${val.prevTime}`);
  if (moment(val.prevTime, constants.TIME_FORMAT).isValid()) {
    previousExecution = moment(val.prevTime, constants.TIME_FORMAT);
    console.log('saved to var', previousExecution);
  }
}, function (errorObject) {
  console.log("The read failed: " + errorObject.code);
});

function saveTime(currentExecution) {
  ref.set({
    prevTime: currentExecution.format(constants.TIME_FORMAT)
  })
}

function getTime() {
  return previousExecution;
}

module.exports = {
  saveTime,
  getTime
}