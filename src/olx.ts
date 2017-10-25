import { PuppeteerAutoPostExtension } from "./puppeteer-extension";

class Olx extends PuppeteerAutoPostExtension {
    private id = '09435075716';
    private password = "Wc~6924432,'";
    private url = 'https://www.olx.ph';
    private siteName = 'olx';

    private item = {
        category : 'category-mobile-phones-tablets.category-mobile-phones-smartphones',
        title : 'SamsungS7'
        condition : '2nd hand',
        price : '5000',
        description : 'Hello this is description, buy my phone it is good. around pampanga area only.',
        imgPath : `C:\\image\\samsung.jpg`
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
            await this.philgo_get_post(this.siteName)
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
        return true
    }

    private async open_form() {

    }

    private async submit_form() {

    }
}