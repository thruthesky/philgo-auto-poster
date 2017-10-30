import { PuppeteerAutoPostExtension } from "./puppeteer-extension";

class GooglePlus extends PuppeteerAutoPostExtension {

    siteName;
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
                .then( async () => await this.philgo_auto_post_log(this.post, 'SUCCESS', this.siteName, this.url + '/' + this.id))
                .catch(async e => {
                    await this.error('fail', 'failed: ' + e.message);
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
        await this.page.waitForSelector('div[aria-label="Create a new post"]').then( a => console.log('Text area found..') );
    }

    async submit_post() {
        let content = this.post['subject'] + ' ' + 'https://www.philgo.com/?' + this.post['idx'];
        await this.page.click('div[aria-label="Create a new post"]').then( a => console.log('Tap to write post...'));
        await this.waitInCase(2);
        await this.page.type('#XPxXbf', content).then( a => console.log('Writing post..'));
        await this.page.tap('.O0WRkf.zZhnYe.e3Duub.C0oVfc').then( a => console.log('submit post..'));
    }
}

(new GooglePlus()).main()