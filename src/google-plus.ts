import { PuppeteerAutoPostExtension } from "./puppeteer-extension";

class GooglePlus extends PuppeteerAutoPostExtension {

    siteName = 'testgoogleplus';
    url = 'https://plus.google.com';
    id = 'renzmallari401';
    password = "Wc~6924432,'";
    communityId //= '110408989422420420231';
    category //= 'Tablet';   // should be exact and case sensitive.
    
        constructor() {
            super()
        }

    async main() {
        if ( this.communityId ){
            if ( !this.category ) throw { message: 'Requires category!' }
        }

        await this.init( false );
        await this.firefox();

        console.log("Google Plus Begin: ");
        const login =  await this.login().catch(e => this.fatal('login_failed', 'login failed: ' + e.message));
        this.acceptLeaveAlert();

        while (login) {
            await this.philgo_get_post(this.siteName)
                .then( async post => await this.goto_community() )
                .then( async category => await this.submit_post() )
                .then( async () => await this.philgo_auto_post_log(this.post, 'SUCCESS', this.siteName, this.url + '/' + this.id))
                .catch(async e => {
                    await this.error('fail', 'failed: ' + e.message);
                    await this.philgo_auto_post_log(this.post, 'ERROR', this.siteName, this.url + '/' + this.id);
                });

            await this.sleep(60);
        }
    }

    async goto_community() {
        // Need to handle buy and sell
        if ( !this.post ) return;
        if ( this.communityId ) {
            await this.page.waitForSelector('div[aria-label="Create a new post"]').then( a => console.log('Create post button found..') );
            await this.page.goto(this.url + '/communities/' + this.communityId, { timeout: 50000 }).then( a => console.log('OK: Go to community', this.communityId) );
        }
        if ( !this.communityId ) await this.page.goto(this.url, { timeout: 50000 }).then( a => console.log('OK: Public community') );

    }

    async submit_post( ) {
        if ( !this.post ) return;
        let link = 'https://www.philgo.com/?' + this.post['idx'];
        // open post editor
        await this.page.waitForSelector('div[aria-label="Create a new post"]').then( a => console.log('OK: Create post button found..') );
        await this.waitInCase(1);
        await this.page.click('div[aria-label="Create a new post"]').then( a => console.log('OK: Tap to write post...'));
        // wait for elements
        await this.waitInCase(15);
        await this.page.waitForSelector('#XPxXbf').then( a => console.log('OK: waiting for text area.'));
        await this.page.waitForSelector('div[aria-label="Add link"]').then( a => console.log('OK: waiting for text area.'));
        await this.waitInCase(1);
        await this.page.click('div[aria-label="Add link"]').then( a => console.log('OK: Input link...'));
        // input link
        await this.waitInCase(2);
        await this.page.type('.whsOnd.zHQkBf', link).then( a => console.log('OK: typing link...'));
        await this.page.keyboard.press('Enter').then( a => console.log('OK: submit link...'));
        // type title
        await this.waitInCase(1);
        await this.page.type('#XPxXbf', this.post['subject']).then( a => console.log('OK: Writing post..'));

        // Tap post button when available
        let re = await this.waitDisappear('div[aria-disabled="true"]')   //.then( a => console.log('Is post button enabled? ', a) );
        if ( re === false ) throw { message: 'Timeout for data to load for before posting exceeds!' }; // if ( !re ) -> not working as expected.
        await this.page.tap('.O0WRkf.zZhnYe.e3Duub.C0oVfc').then( a => console.log('OK: submit post..'));
        await this.waitInCase(1);
        let count = await this.waitAppear ( ['div:contains("Choose a category")', `div[data-name="${ this.category }"]`], 5 ).then( a => { console.log('OK: count: ', a ); return a; });
        if ( count > -1 )  await this.page.tap(`div[data-name="${ this.category }"]`);
    }


    async login() {
        this.page.goto('https://accounts.google.com/ServiceLogin?continue=' + this.url).then( a => console.log('Open', this.url) );

        await this.page.waitFor('#identifierId').then(a => console.log("OK: blogger: found login form box"));
        await this.waitInCase(5);

        await this.page.type('#identifierId', this.id).then(a => console.log("OK: type id"));
        await this.waitInCase(1);

        await this.page.click('#identifierNext').then(a => console.log("OK: blogger: click id submit button"));
        // password
        await this.page.waitFor('input[name="password"]').then(a => console.log("OK: blogger: found password input box"));
        await this.waitInCase(3);
        await this.page.type('input[name="password"]', this.password).then(a => console.log("OK: type password"));
        await this.waitInCase(1);
        await this.page.click('#passwordNext');
        await this.waitInCase(5);
        return true;
    }
}

(new GooglePlus()).main()