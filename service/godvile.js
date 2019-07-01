const puppeteer = require('puppeteer');

var constants = require('../util/constants');
var config = require('../util/config');
var cloudinary = require('./cloudinary');

const process = async (currentExecution) => {
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

    await page.goto('https://godville.net/superhero');
    const login = await page.$('#username');
    await login.type(config.app.username_val);
    const password = await page.$('#password');
    await password.type(config.app.password_val);
    const input = await page.$('input[type=submit][value="Войти!"');

    await Promise.all([
        input.click(),
        page.waitForNavigation()]
    );

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

module.exports = {
    process
}