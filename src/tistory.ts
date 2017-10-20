const pup2 = require('puppeteer');
var sleep = require('sleep');

class Tistory {

    id = 'thruthesky@daum.net';
    password = 'fight9to2ql';
    browser;
    page;
    constructor() {
    }

    async run() {
        this.browser = await pup2.launch({ headless: false });
        this.page = await this.browser.newPage();

        await this.login();

        while ( true ) {
            // get data from philgo.

            // post it on tistory


            // sleep and do it over again.
            sleep.sleep(60);
        }
    }

    async login() {
        await this.page.goto('http://www.tistory.com/');
        await this.page.click('.link_login');
        await this.page.waitFor('#loginId').then(a => { }).catch(e => {});

        await this.page.focus('#loginId');
        await this.page.type('#loginId', this.id);
        await this.page.focus('#loginPw').catch(e => console.log('password focus failed'));
        await this.page.type('#loginPw', this.password).catch(e => console.log('password type failed'));
        await this.page.waitFor(2000);
        await this.page.click('button[type="submit"]')
            .then(a => console.log('login button clicked'))
            .catch(e => console.log('failed to click login submit button'));

    }
}



let tistory = new Tistory();

tistory.run();

