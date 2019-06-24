const puppeteer = require('puppeteer');
var express = require('express');
var moment = require('moment');
var fs = require("fs");
var app = express();

var config = require('./util/config');
var cloudinary = require('./service/cloudinary');
const database = require('./service/database');
var constants = require('./util/constants');

app.get('/', function (req, res) {
    var currentExecution = moment();
    takeScreenshoot(res, currentExecution);
});
app.listen(config.app.port, function () {
    console.log(`Example app listening on port ${config.app.port}!`);
});

function takeScreenshoot(res, currentExecution) {
    if (!isExecutedRecently(currentExecution, database.getTime())) {
        godvile(currentExecution)
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

const godvile = async (currentExecution) => {
    let shot;

    var timeString = currentExecution.format(constants.TIME_FORMAT);

    console.log('runned at ' + timeString);

    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            // '--single-process'
        ],
        // headless: false,
        ignoreHTTPSErrors: true
    });
    const page = await browser.newPage();

    process.on('unhandledRejection', (reason, p) => {
        console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
        handleClose(`I was rejected`);
    });

    function handleClose(msg) {
        console.log(msg);
        page.close();
        browser.close();
        process.exit(1);
    }

    await page.goto('https://godville.net/superhero');
    const login = await page.$('#username');
    await login.type(config.app.username_val);
    const password = await page.$('#password');
    await password.type(config.app.password_val);
    const input = await page.$('input[type=submit][value="Войти!"');
    await input.click();

    await page.waitForNavigation();

    var makeAction = false;
    var action = '';

    const makeGood = await page.$x("//a[contains(text(), 'Сделать хорошо')]");
    if (makeGood.length > 0) {
        if (await makeGood[0].isIntersectingViewport()) {
            await makeGood[0].click();
            await page.waitFor(10 * 1000);
            shot = await page.screenshot({
                // path: 'make good ' + timeString + '.png'
            });
            makeAction = true;
            action = 'make good at ' + timeString;
            console.log(action);
        } else {
            const resurrect = await page.$x("//a[contains(text(), 'Воскресить')]");
            if (resurrect.length > 0) {
                if (await resurrect[0].isIntersectingViewport()) {
                    await resurrect[0].click();
                    await page.waitFor(10 * 1000);
                    shot = await page.screenshot({
                        // path: 'resurrect ' + timeString + '.png'
                    });
                    makeAction = true;
                    action = 'resurrect at ' + timeString;
                    console.log(action);
                }
            }
        }

    }
    if (!makeAction) {
        action = "can't find any link at " + timeString;
        console.log(action);
        shot = await page.screenshot({
            // path: 'Link not found ' + timeString + '.png'
        });
    }

    await browser.close();

    if (shot) {
        return cloudinary.sendScreenshootToCloudinary(shot, action);
    }
    throw Error("no screenshoot");
    // await new Promise(done => setTimeout(done, 1000 * 60 * 60));
};