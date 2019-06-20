const puppeteer = require('puppeteer');
var cloudinary = require('cloudinary');
var express = require('express');
var moment = require('moment');

var port = process.env.PORT || 3000;

var app = express();

app.get('/', function (req, res) {
    currentExecution = moment();
    takeScreenshoot(res);
});
app.listen(port, function () {
    console.log(`Example app listening on port ${port}!`);
});

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const username_val = process.env.GODVILE_USERNAME;
const password_val = process.env.GODVILE_PASSWORD;
const hoursBetweenExec = process.env.HOURS_BETWEEN_SCREENSHOOTS || 12;

var previousExecution;
var currentExecution;

function takeScreenshoot(res) {
    if (!isExecutedRecently()) {
        godvile()
            .then(data => {
                res.send(`<a href="${data.secure_url}">image</a>`)
            })
            .catch(err => {
                console.log(err);
                res.status(500).send(err.toString());
            });
        previousExecution = moment();
    } else {
        console.log(`time of execution has not come, last was ${getDiffAsHours()} hours ago. current delay: ${hoursBetweenExec}`);
        res.send('time of execution has not come');
    }
}

function isExecutedRecently() {
    if (!previousExecution) {
        return false;
    } else if (getDiffAsHours() >= hoursBetweenExec) {
        return false;
    }
    return true;
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
        // page.screenshot({
        //     path: 'error ' + current_time + '.png'
        // });
        page.close();
        browser.close();
        process.exit(1);
    }

    await page.goto('https://godville.net/superhero');
    const login = await page.$('#username');
    await login.type(username_val);
    const password = await page.$('#password');
    await password.type(password_val);
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
        return new Promise(function (resolve, reject) {
            cloudinary.v2.uploader.upload_stream({
                    public_id: `godvile/${action}`
                },
                function (error, cloudinary_result) {
                    if (error) {
                        console.error('Upload to cloudinary failed: ', error);
                        reject(error);
                    } else {
                        console.log({
                            time: cloudinary_result.created_at,
                            url: cloudinary_result.secure_url
                        });
                        resolve(cloudinary_result);
                    }
                }
            ).end(shot);
        });
    }

    // await new Promise(done => setTimeout(done, 1000 * 60 * 60));
};