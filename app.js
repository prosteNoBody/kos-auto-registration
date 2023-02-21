const puppeteer = require("puppeteer");

const LOGIN_PAGE = 'https://new.kos.cvut.cz/login';
const SCHEDULE_PAGE = 'https://new.kos.cvut.cz/schedule/create';
const USER = require('./config/user.json');
const LESSONS = require('./config/lessons.json');

const LESSONS_CONVERTED = {};
const TYPES = {
    LECTURE: 'lecture',
    SEMINAR: 'seminar',
    LABORATORY: 'laboratory',
}
const TYPES_CHAR = {
    [TYPES.LECTURE]: 'P',
    [TYPES.SEMINAR]: 'C',
    [TYPES.LABORATORY]: 'L',
}
for (const lessonKey in LESSONS) {
    LESSONS_CONVERTED[lessonKey] = {};
    for (const type of Object.values(TYPES)) {
        console.log(TYPES_CHAR[type]);
        LESSONS_CONVERTED[lessonKey][type] = LESSONS[lessonKey].filter(item => item.toLowerCase().includes(TYPES_CHAR[type].toLowerCase()));
    }
}

const DEBUG = false;
const waitTimeBetweenTries = 1000 * 60 * 3;

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
        let notFoundFlag = false;
        await page.goto(SCHEDULE_PAGE, { waitUntil: 'networkidle2' });
        await page.waitForTimeout(10000);
        try {
            await page.evaluate(() => {
                const checkboxLabelElement = document.querySelector('label[for="select-all-filter-courses"]');
                if (!checkboxLabelElement.className.split(' ').includes('active')) {
                    document.getElementById('select-all-filter-courses').click();
                }
            });
        } catch {
            console.log('scheduler is not ready yet, next try at: ' + new Date(Date.now() + waitTimeBetweenTries).toLocaleTimeString());
            await page.waitForTimeout(waitTimeBetweenTries);
            break;
        }
        const [logStash, betterAvailable] = await page.evaluate(async (LESSONS_CONVERTED, TYPES) => {
            const logStash = [];
            let betterAvailable = false;

            const daysElement = Array.from(document.querySelectorAll('.day-cell')).slice(1);
            const ticketsElement = Array.from(document.querySelectorAll('.event-base-wrapper'));

            const getDay = elementTopOffset => {
                const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                let i = 0;
                for (; i < 4; i++) {
                    if (elementTopOffset < daysElement[i].offsetTop) {
                        return DAYS[i];
                    }
                }
                return DAYS[i];
            };
            const convertTicketType = classArray => {
                for (const type of Object.values(TYPES)) {
                    if (classArray.includes(type))
                        return type;
                }
            };

            const tickets = ticketsElement.map(ticketElement => {
                const element = ticketElement.querySelector('.ticket-wrapper');
                const parallel = element.querySelector('.box-parallel').innerText.toLowerCase();
                const course = element.querySelector('.ticket-body').innerText.toLowerCase();
                const type = convertTicketType(element.className.split(' '));
                // const day = getDay(element.offsetTop).toLowerCase();
                // const time = element.querySelector('.ticket-header').innerText.slice(0, 5);
                // const isOddWeek = ['lichý', 'odd'].includes(element.querySelector('.ticket-week')?.innerText.toLowerCase() ?? 'even');
                const isSelected = !element.className.split(' ').includes('ticket-unselected')
                const freeSlots = element.querySelector('.box-count') ? element.querySelector('.box-count').innerText.toLowerCase() : 0;

                return {
                    element,
                    parallel,
                    course,
                    type,
                    // day,
                    // time,
                    // isOddWeek,
                    isSelected,
                    freeSlots: parseInt(freeSlots),
                }
            });

            const getTicket = (courseId, parallelId) => {
                return tickets.find(item => item.course === courseId.toLowerCase() && item.parallel === parallelId.toLowerCase());
            }

            const delay = timeout =>
                new Promise(resolve => setTimeout(resolve, timeout))

            const selectTicket = async element => {
                let result = false;

                element.click();
                await delay(300);
                const modalElement = document.querySelector('.modal-content');
                const [closeButtonElement, signButtonElement] = Array.from(modalElement.querySelectorAll('.button-container'))
                if (signButtonElement) {
                    signButtonElement.click();
                    await delay(3000);
                    result = true;
                }

                closeButtonElement.click();
                await delay(500);
                return result;
            };

            for (const course in LESSONS_CONVERTED) {
                for (const ticketType of Object.values(TYPES)) {
                    for (const parallel of LESSONS_CONVERTED[course][ticketType] ?? []) {
                        const ticket = getTicket(course, parallel);
                        await delay(1000);
                        if (!ticket) {
                            logStash.push(`${course.toUpperCase()}: Ticket "${parallel}" was not found, maybe there was misspell`);
                            continue;
                        }
                        if (ticket.isSelected)
                            break;
                        if (ticket.freeSlots > 0 && await selectTicket(ticket.element)) {
                            logStash.push(`${course}: Parallel "${parallel}" was successfully signed`);
                            break;
                        } else {
                            betterAvailable = true;
                        }
                    }
                }
            }

            return [logStash, betterAvailable];
        }, LESSONS_CONVERTED, TYPES)

        for (const message of logStash)
            console.log(message);

        if (!betterAvailable) {
            console.log('all parallels was signed successfully :)');
            return;
        }

        console.log('some prior parallels are not available yet, next try at: ' + new Date(Date.now() + waitTimeBetweenTries).toLocaleTimeString());
        await page.waitForTimeout(waitTimeBetweenTries);
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