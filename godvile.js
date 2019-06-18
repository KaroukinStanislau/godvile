const puppeteer = require('puppeteer');
var cloudinary = require('cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const username_val = process.env.GODVILE_USERNAME;
const password_val = process.env.GODVILE_PASSWORD;

(async () => {

    const d = new Date();
    const current_time = `${d.getFullYear()}_${d.getMonth()+1}_${d.getDate()}_${d.getHours()}_${d.getMinutes()}`;

    console.log('runned at ' + current_time);

    const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
        ],
        headless: false,
        ignoreHTTPSErrors: true
    });
    const page = await browser.newPage();

    process.on('unhandledRejection', (reason, p) => {
        console.error('Unhandled Rejection at: Promise', p, 'reason:', reason);
        handleClose(`I was rejected`);
    });

    function handleClose(msg) {

        console.log(msg);
        page.screenshot({
            path: 'error ' + current_time + '.png'
        });
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

    const makeGood = await page.$x("//a[contains(text(), 'Сделать хорошо')]");
    if (makeGood.length > 0) {
        if (await makeGood[0].isIntersectingViewport()) {
            await makeGood[0].click();
            await page.waitFor(10 * 1000);
            await page.screenshot({
                path: 'make good ' + current_time + '.png'
            });
            makeAction = true;
            console.log('make good at ' + current_time);
        } else {
            // The element IS NOT visible within the current viewport.
            const resurrect = await page.$x("//a[contains(text(), 'Воскресить')]");
            if (resurrect.length > 0) {
                if (await resurrect[0].isIntersectingViewport()) {
                    await resurrect[0].click();
                    await page.waitFor(10 * 1000);
                    await page.screenshot({
                        path: 'resurrect ' + current_time + '.png'
                    });
                    makeAction = true;
                    console.log('resurrect at ' + current_time);
                }
            }
        }

    }
    if (!makeAction) {
        console.log("can't find any link at " + current_time);
        await page.screenshot({
            path: 'Link not found ' + current_time + '.png'
        });
    }

    // await new Promise(done => setTimeout(done, 1000 * 60 * 60));
    await browser.close();

})();