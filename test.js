var moment = require('moment');

var startTime = moment("2019/06/20", "YYYY/MM/DD"); 
var end = moment();

var duration = moment.duration(end.diff(startTime));

console.log(duration.asHours() > 11);
