import { PuppeteerAutoPostExtension } from "./puppeteer-extension";

class Twitter extends PuppeteerAutoPostExtension {
    
    id = 'renz_anonuevo';                    // 블로그 글 쓰기 아이디.
    password = "Wc~6924432,'";              // 블로그 글 쓰기 비밀번호.
    url = 'https://mobile.twitter.com';        // 블로그 주소.
    group = 'renz_anonuevo';
    siteName = 'twitter';
    private composeTweet = "a[href='/compose/tweet']";
    private waitForSelectorOptions = {
        timeout : 5000,
    };
    async main() {
        await this.init( false );
        await this.firefox();

        console.log("Twitter Begin: ");
        const login =  await this.login().catch(e => this.fatal('login_failed', 'login failed: ' + e.message));
        this.acceptLeaveAlert();

        while (login) {
            await this.philgo_get_post(this.siteName)
                .then( async post => await this.openComposeTweet() )
                .then( async () => await this.submitTweet() )
                .then( async () => await this.philgo_auto_post_log(this.post, 'SUCCESS', this.siteName, this.url + '/' + this.id))
                .catch(async e => {
                    await this.error('fail', 'failed: ' + e.message);
                    await this.philgo_auto_post_log(this.post, 'ERROR', this.siteName, this.url);
                });

            await this.sleep(5);
        }

    }

    async login() {
        await this.page.goto(this.url + '/login')
            .then(a => console.log(`OK: Twitter open: ${this.url}/login`));
        await this.page.waitForSelector( 'input[name="session[username_or_email]"', this.waitForSelectorOptions ).then( a => console.log("OK: Login page navigation") );
        await this.page.type('input[name="session[username_or_email]"]', this.id).then(a => console.log("OK: input id"));
        await this.page.type('input[name="session[password]"]', this.password).then(a => console.log("OK: input password"));
        await this.page.tap('div[value="Log in"]').then(a => console.log("OK: click login"));
        await this.page.waitFor(1000).then(a => console.log("OK: wait for 1 sec just in case"));
        await this.page.waitForSelector( this.composeTweet,  this.waitForSelectorOptions ).then(a => console.log("OK: Page navigation finished after login."));

        return true;
        }

    async openComposeTweet() {
        if (!this.post) {
            console.log("OK: facebook: submit_form(). this.post is null. no more post? just return");
            return;
        }

        if (!this.page) {
            this.error('page_is_falsy', 'ERROR: this.page has become falsy! Had the browser started with headless: false and the browser closed?');
            return;
        }

        await this.page.tap(this.composeTweet).then(a => console.log("OK: Tap to compose tweet."));
        await this.page.waitForSelector('textarea', this.waitForSelectorOptions).then(a => console.log("OK: waiting for compose tweet page navigation."));

    }

    async submitTweet() {
        if (!this.post) {
            console.log("OK: Twitter: submit_form(). this.post is null. no more post? just return");
            return;
        }
        let content = this.post['subject'] + ' ' + 'https://www.philgo.com/?' + this.post['idx'];
        await this.page.type('textArea', content).then(a => console.log("OK: typing contents"));
        await this.page.tap('div[data-testid="tweet-button"]').then(a => console.log("OK: Tap tweet button"));
    }

}

// Run twitter script
(new Twitter()).main();