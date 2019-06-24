var express = require('express');
var moment = require('moment');
var app = express();

var config = require('./util/config');
var database = require('./service/database');
var godvile = require('./service/godvile');


app.get('/', function (req, res) {
    var currentExecution = moment();
    takeScreenshoot(res, currentExecution);
});
app.listen(config.app.port, function () {
    console.log(`Example app listening on port ${config.app.port}!`);
});

function takeScreenshoot(res, currentExecution) {
    if (!isExecutedRecently(currentExecution, database.getTime())) {
        godvile.process(currentExecution)
            .then(data => {
                database.saveTime(currentExecution);
                res.send(`<a href="${data.secure_url}">image</a>`)
            })
            .catch(err => {
                console.log(err);
                res.status(500).send(err.toString());
            });
    } else {
        console.log(`time of execution has not come, last was ${getDiffAsHours(currentExecution, database.getTime())} hours ago. current delay: ${config.app.hoursBetweenExec}`);
        res.send('time of execution has not come');
    }
}

function isExecutedRecently(currentExecution, previousExecution) {
    if (getDiffAsHours(currentExecution, previousExecution) >= config.app.hoursBetweenExec) {
        return false;
    }
    return true;
}

function getDiffAsHours(currentExecution, previousExecution) {
    return moment.duration(currentExecution.diff(previousExecution)).asHours();
}

process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
    handleClose(`I was rejected`);
});

function handleClose(msg) {
    console.log(msg);
    process.exit(1);
}