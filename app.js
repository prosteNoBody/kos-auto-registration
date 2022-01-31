const puppeteer = require("puppeteer");

const LOGIN_PAGE = 'https://new.kos.cvut.cz/login';
const SCHEDULE_PAGE = 'https://new.kos.cvut.cz/schedule/create';
const USER = require('./user.json');
const LESSONS = require('./lessons.json');

const DEBUG = false;
let isOpenBetter = false;
let isOpenWorse = false;


const startSniping = async(first) => {
    const browser = await puppeteer.launch({ headless: !DEBUG });

    const page = await browser.newPage();
    if (!first)
        await page.waitForTimeout(1000 * 60 * 20);
    await page.goto(LOGIN_PAGE, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(1000);
    await page.waitForSelector('.form-body > .base-button-wrapper > button');
    await page.type('#username', USER.username);
    await page.type('#password', USER.password);
    await page.click('.form-body > .base-button-wrapper > button');
    await page.waitForSelector('.header-wrapper > .header-text');
    while (666) {
        await page.goto(SCHEDULE_PAGE, { waitUntil: 'networkidle2' });
        await page.waitForSelector(LESSONS.class);
        await page.waitForTimeout(2000);
        await page.click(LESSONS.class);
        await page.waitForTimeout(200);
        await page.click(LESSONS.primary);
        await page.waitForTimeout(200);
        isOpenBetter = await page.evaluate(() => {
            const el = document.querySelector(LESSONS.laboratory);
            return !!el;
        });
        if (isOpenBetter) {
            await page.waitForTimeout(200);
            await page.click(LESSONS.laboratory);
            await page.waitForTimeout(3000);
            console.log('worked - better');
            return;
        }
        if (!isOpenWorse) {
            await page.keyboard.press('Escape');
            await page.click(LESSONS.secondary, { delay: 300 });
            await page.waitForTimeout(200);
            isOpenWorse = await page.evaluate(() => {
                const el = document.querySelector(LESSONS.laboratory);
                return !!el;
            });
            if (isOpenWorse) {
                await page.waitForTimeout(200);
                await page.click(LESSONS.laboratory);
                await page.waitForTimeout(3000);
                console.log('worked - worse');
            }
        }
        console.log('not found, next try at: ' + new Date(Date.now() + 1000 * 60 * 3).toLocaleTimeString());
        await page.waitForTimeout(1000 * 60 * 3);
    }
};

const bootProgram = (first) => {
    startSniping(first).then(() => console.log('done')).catch(e => {
        console.log(e);
        console.log('programFailed - reseting... (20min)');
        bootProgram(false);
    });
}

console.clear();
console.log('starting');
bootProgram(true);