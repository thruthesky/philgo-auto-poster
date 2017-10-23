import { PuppeteerAutoPostExtension } from "./puppeteer-extension";

const pTwitter = require('puppeteer');
const rpnTwitter = require('request-promise-native');
const $ = require('cheerio');

class Twitter extends PuppeteerAutoPostExtension {
    
    id = 'renz_anonuevo';                    // 블로그 글 쓰기 아이디.
    password = "Wc~6924432,'";              // 블로그 글 쓰기 비밀번호.
    url = 'https://mobile.twitter.com';        // 블로그 주소.
    group = 'renz_anonuevo';

    async run() {
        this.browser = await pTwitter.launch({ headless: false });
        this.page = await this.browser.newPage();
        await this.firefox();
        await this.english();

        console.log('Twitter Starts...');
        let login = await this.login().then(() => true).catch(e => { console.log("FAIL: Login failed: " + e.message); return false; });
        
        while (login) {
            
            // get data from philgo.
            let post = await this.philgo_get_post('twitter');
            if (post && post['subject']) {
                console.log(`Twitter: Going to post for ${post['subject']}`);

            }
            else {
                console.log(`OK: Failed to get philgo post. or may be No more post`);
            }

            // sleep and do it over again.
            console.log(`Twitter: sleeping for 2 minutes`);
            await this.sleep(120);
            console.log(`Twitter: begins new loop at: ` + (new Date).toLocaleString());
        }
    }

    async login() {
        return true;
    }

    async publish() {

    }

    async screenshot() {

    }


}

// Run twitter script
(new Twitter()).run();