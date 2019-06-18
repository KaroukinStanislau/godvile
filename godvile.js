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

    const browser = await puppeteer.launch({
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

    const linkHandlers = await page.$x("//a[contains(text(), 'Сделать хорошо')]");
    if (linkHandlers.length > 0) {
        // await linkHandlers[0].click();
        await page.waitFor(5000);
        await page.screenshot({
            path: 'make good ' + current_time + '.png'
        });

    } else {
        console.log("Link not found " + current_time);
        await page.screenshot({
            path: 'Link not found ' + current_time + '.png'
        });
    }

    // await new Promise(done => setTimeout(done, 1000 * 60 * 60));
    await browser.close();

})();