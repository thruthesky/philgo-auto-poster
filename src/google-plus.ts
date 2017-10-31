import { PuppeteerAutoPostExtension } from "./puppeteer-extension";

class GooglePlus extends PuppeteerAutoPostExtension {

    siteName = 'testgoogleplus';
    url = 'https://plus.google.com';
    id = 'renzmallari401';
    password = "Wc~6924432,'";

    
        constructor() {
            super()
        }

    async main() {
        await this.init();
        await this.firefox();

        console.log("Google Plus Begin: ");
        const login =  await this.login().catch(e => this.fatal('login_failed', 'login failed: ' + e.message));
        this.acceptLeaveAlert();

        while (login) {
            await this.philgo_get_post(this.siteName)
                .then( async post => await this.goto_community() )
                .then( async () => await this.submit_post() )
                .then( async () => await this.philgo_auto_post_log(this.post['subject'], 'SUCCESS', this.siteName, this.url + '/' + this.id))
                .catch(async e => {
                    if ( !e.code ) await this.error('fail', 'failed: ' + e.message);
                    if ( e.code = 'no-data' ) await this.error(e.code, 'OK: ' + e.message);
                    await this.philgo_auto_post_log(this.post, 'ERROR', this.siteName, this.url + '/' + this.id);
                });

            await this.sleep(60);
        }
    }

    async login() {
        this.page.goto('https://accounts.google.com/ServiceLogin?continue=' + this.url).then( a => console.log('Open', this.url) );

        await this.page.waitFor('#identifierId').then(a => console.log("OK: blogger: found login form box"));
        await this.waitInCase(3);

        await this.page.type('#identifierId', this.id).then(a => console.log("OK: type id"));
        await this.waitInCase(1);

        await this.page.click('#identifierNext').then(a => console.log("OK: blogger: click id submit button"));
        // password
        await this.page.waitFor('input[name="password"]').then(a => console.log("OK: blogger: found password input box"));
        await this.waitInCase(3);
        await this.page.type('input[name="password"]', this.password).then(a => console.log("OK: type password"));
        await this.waitInCase(1);
        await this.page.click('#passwordNext');

        return true;
    }

    async goto_community( communityId? ) {
        if( communityId )await this.page.goto(this.url + '/' + communityId).then( a => console.log('Go to community', communityId) );
    }

    async submit_post() {
        if ( !this.post ) throw { message: 'No data to post!', code: 'no-data' };
        let link = 'https://www.philgo.com/?' + this.post['idx'];
        await this.page.waitForSelector('div[aria-label="Create a new post"]').then( a => console.log('Create post button found..') );
        await this.waitInCase(1);
        await this.page.click('div[aria-label="Create a new post"]').then( a => console.log('Tap to write post...'));
        
        await this.waitInCase(5);
        await this.page.waitForSelector('#XPxXbf').then( a => console.log('waiting for text area.'));
        await this.waitInCase(1);
        await this.page.type('#XPxXbf', this.post['subject']).then( a => console.log('Writing post..'));
        
        await this.page.click('div[aria-label="Add link"]').then( a => console.log('Input link...'));
        await this.waitInCase(2);
        // await this.page.waitForSelector('.whsOnd.zHQkBf').then( a => console.log('waiting for text area.'));;
        await this.page.type('.whsOnd.zHQkBf', link).then( a => console.log('typing link...'));
        await this.page.keyboard.press('Enter').then( a => console.log('submit link...'));

        // await this.page.waitForNavigation('.mx8eub', {timeout: 30000}).then( a => console.log('wait for preview to load..'));
        await this.waitInCase(8);
        await this.page.tap('.O0WRkf.zZhnYe.e3Duub.C0oVfc').then( a => console.log('submit post..'));
    }
}

(new GooglePlus()).main()