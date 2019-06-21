const puppeteer = require('puppeteer');
var express = require('express');
var moment = require('moment');
var fs = require("fs");
var app = express();

var config = require('./config');
var cloudinary = require('./cloudinary');


app.get('/', function (req, res) {
    currentExecution = moment();
    takeScreenshoot(res);
});
app.listen(config.app.port, function () {
    console.log(`Example app listening on port ${config.app.port}!`);
});

var previousExecution;
var currentExecution;

async function takeScreenshoot(res) {
    if (! await isExecutedRecently()) {
        // if (false) {
        godvile()
            .then(data => {
                previousExecution = moment();
                writeToFile();
                res.send(`<a href="${data.secure_url}">image</a>`)
            })
            .catch(err => {
                console.log(err);
                res.status(500).send(err.toString());
            });
    } else {
        console.log(`time of execution has not come, last was ${getDiffAsHours()} hours ago. current delay: ${config.app.hoursBetweenExec}`);
        res.send('time of execution has not come');
    }
}

async function isExecutedRecently() {
    if (!previousExecution) {
        try {
            var a = await readFromFile();
        } catch (err) {
            return false;
        }
        if (moment(a, "YYYY-MM-DD-HH-mm-ss").isValid()) {
            previousExecution = moment(a, "YYYY-MM-DD-HH-mm-ss");
        }
        if (!previousExecution) {
            return false;
        }
    }
    if (getDiffAsHours() >= config.app.hoursBetweenExec) {
        return false;
    }
    return true;
}

function writeToFile() {
    return new Promise((resolve, reject) => {
        fs.writeFile(config.app.fileName, moment(previousExecution, "YYYY-MM-DD-HH-mm-ss").format(), (err) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                console.log("Successfully Written to File.");
                resolve();
            }
        });
    });
}

function readFromFile() {
    return new Promise((resolve, reject) => {
        fs.readFile(config.app.fileName, function (err, buf) {
            if (err) {
                console.log(err)
                reject(err);
            } else {
                console.log(`readed from file ${buf.toString()}`);
                resolve(buf.toString());
            }
        });
    });
}

function getDiffAsHours() {
    return moment.duration(currentExecution.diff(previousExecution)).asHours();
}

const godvile = async () => {
    const d = new Date();
    const current_time = `${d.getFullYear()}_${d.getMonth()+1}_${d.getDate()}_${d.getHours()}_${d.getMinutes()}`;
    let shot;

    console.log('runned at ' + current_time);

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
                // path: 'make good ' + current_time + '.png'
            });
            makeAction = true;
            action = 'make good at ' + current_time;
            console.log(action);
        } else {
            const resurrect = await page.$x("//a[contains(text(), 'Воскресить')]");
            if (resurrect.length > 0) {
                if (await resurrect[0].isIntersectingViewport()) {
                    await resurrect[0].click();
                    await page.waitFor(10 * 1000);
                    shot = await page.screenshot({
                        // path: 'resurrect ' + current_time + '.png'
                    });
                    makeAction = true;
                    action = 'resurrect at ' + current_time;
                    console.log(action);
                }
            }
        }

    }
    if (!makeAction) {
        action = "can't find any link at " + current_time;
        console.log(action);
        shot = await page.screenshot({
            // path: 'Link not found ' + current_time + '.png'
        });
    }

    await browser.close();

    if (shot) {
        return cloudinary.sendScreenshootToCloudinary(shot, action);
    }
    throw Error("no screenshoot");
    // await new Promise(done => setTimeout(done, 1000 * 60 * 60));
};