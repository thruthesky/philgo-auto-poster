
import { PuppeteerAutoPostExtension } from './puppeteer-extension';

class JobAdFacebook extends PuppeteerAutoPostExtension {

    id = 'renz.mallari.547';
    password = "Wc~6924432,'";

    groups = ['1665333727088421',
              '890662181065226', 
              'pampanga.jobs.only',
              'angelescityjobs',
              'jobs.pampanga'];

    url = 'https://m.facebook.com';        // 블로그 주소.
    constructor() {
        super();
    }

    async main() {
        await this.init();
        await this.firefox();

        console.log("Facebook Begin: ");
        const login = await this.login().catch(e => this.fatal('login_failed', 'login failed: ' + e.message));
        this.acceptLeaveAlert();

        while (login) {
            let post = this.get_job_ad_post();
            try {
                for ( let re of this.groups ){
                    await this.open_form( re );
                    await this.waitInCase(3);
                    await this.submit_form( post );
                    await this.waitInCase(5);
                }
            }
            catch(e) {
                await this.error('fail', 'failed: ' + e.message);
            }
            post = null;
            await this.sleep(259200); // 3 days before posting again -> to avoid spam
        }
    }

    async submit_form( post ) {

        console.log("OK: facebook: submit_form() begins.");
        console.log(post.referrence)

        if (!this.page) {
            this.error('page_is_falsy', 'ERROR: this.page has become falsy! Had the browser started with headless: false and the browser closed?');
            return;
        }
        await this.page.type('textarea[name="xc_message"]', post.description).then(a => console.log("OK: typing contents"));
        await this.page.waitFor(5000).then(a => console.log("OK: Wait for 5 seconds just in case"));
        
        await this.upload_photo( post.file ).then( a => console.log('OK: Image uploaded.') );
        await this.waitInCase(5);

        await this.page.click('input[name="view_post"]').then(a => console.log("OK: click post button"));
        await this.page.waitFor(1000).then(a => console.log("OK: wait for 1 sec just in case"));
        await this.page.waitForNavigation().then(a => console.log("OK: wait for navigation after clicking post button"));

        const html = await this.html();
        if (html.indexOf(post.referrence)) {
            console.log(`OK: post success. content found in the facebook.`);
        }
        else {
            console.log("ERROR: failed to post or post still pending");
        }

    }

    get_group_url( group ) {
        return this.url + '/groups/' + group;
    }

    async open_form( groupId ) {
        await this.page.goto(this.get_group_url( groupId )).then(a => console.log("OK: open post form page"));
        await this.page.waitFor(3000).then(a => console.log("OK: wait for 3 sec just in case"));
    }

    async upload_photo( file: string ) {
        await this.page.click('input[name="view_photo"]').then( a => console.log('OK: Uploading image..') );
        await this.page.waitForNavigation().then( a => console.log('OK: Wait for upload image page.') );
        let input = await this.page.$('input[name="file1"]')
        await input.uploadFile( file ).then( a => console.log('OK: Input image.') );
        await this.waitInCase(3);
        await this.page.click('input[name="add_photo_done"]');
    }

    async login() {
        await this.page.goto(this.url)
            .then(a => console.log(`OK: facebook open: ${this.url}`));
        await this.page.type('input[name="email"]', this.id).then(a => console.log("OK: input id"));
        await this.page.type('input[name="pass"]', this.password).then(a => console.log("OK: input password"));
        await this.page.click('input[name="login"]').then(a => console.log("OK: click login"));
        await this.page.waitFor(1000).then(a => console.log("OK: wait for 1 sec just in case"));
        await this.page.waitForNavigation().then(a => console.log("OK: waiting for navigation after login button clicked."));
        let $html = await this.jQuery();
        const freeModeButton = 'input[type="submit"][value="OK"]';
        if ($html.find(freeModeButton).length) {
            await this.page.click(freeModeButton).then(a => console.log("OK: click free mode OK button"));
        }

        let count = await this.waitAppear([`a[href="/recover/initiate"]`], 5);
        if ( count > -1 ) throw { message: 'FAILED LOGIN: Facebook suggests to recover your password.' };
        return true;
    }
}



let jobAd = new JobAdFacebook();

jobAd.main();