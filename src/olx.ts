import { PuppeteerAutoPostExtension } from "./puppeteer-extension";

class Olx extends PuppeteerAutoPostExtension {
    private id = '09435075716';
    private password = "Wc~6924432,'";
    private url = 'https://www.olx.ph';
    private siteName = 'olx';

    private item = {
        category : 'category-mobile-phones-tablets.category-mobile-phones-smartphones',
        title : 'SamsungS7',
        condition : '2nd hand',
        price : '5000',
        description : 'Hello this is description, buy my phone it is good. around pampanga area only.',
        imgPath : `C:\\image\\samsung.jpg`,
        location : {
            region : 'metro manila',
            city : 'manila'
        }
    }

    private waitForSelectorOptions = {
        timeout : 5000,
    };

    async main() {
        await this.init( false );
        await this.firefox();

        console.log("Olx Begin: ");
        const login =  await this.login().catch(e => this.fatal('login_failed', 'login failed: ' + e.message));
        this.acceptLeaveAlert();

        while (login) {
            // await this.philgo_get_post(this.siteName)
            await this.olx_test_data()
                .then( async post => await this.open_form() )
                .then( async () => await this.submit_form() )
                .then( async () => await this.philgo_auto_post_log(this.post, 'SUCCESS', this.siteName, this.url + '/' + this.id))
                .catch(async e => {
                    await this.error('fail', 'failed: ' + e.message);
                    await this.philgo_auto_post_log(this.post, 'ERROR', this.siteName, this.url + '/' + this.id);
                });

            await this.sleep(10);
        }

    }

    private async login() {
        await this.page.goto(this.url + '/login').then( a => console.log('Loading login page') );
        await this.page.waitForSelector('#login_button', this.waitForSelectorOptions ).then( a => console.log('Login button found') );
        await this.page.type('input[name="mobile"]', this.id).then( a => console.log('Typing user id..') ); 
        await this.page.type('input[name="password"]', this.password).then( a => console.log('Typing password..') );
        await this.page.tap('#login_button').then( a => console.log('Tap login..') );
        await this.page.waitForSelector('a[href="/ad/post"]', this.waitForSelectorOptions).then( a => console.log('Link to /ad/post found.') );
        return true;
    }

    private async open_form() {
        await this.page.goto(this.url + '/ad/post').then( a => console.log('Loading sell form.') );
        await this.page.waitForSelector('.sell-button', this.waitForSelectorOptions).then( a => console.log('Sell button found.') );
    }

    private async submit_form() {
        console.log('submit form');
    }

    private async olx_test_data() {
        await this.page.waitFor(1000);
        return this.item;
    }
}

(new Olx()).main();