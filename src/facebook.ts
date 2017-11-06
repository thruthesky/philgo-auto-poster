import { PuppeteerAutoPostExtension } from './puppeteer-extension';

class Facebook extends PuppeteerAutoPostExtension {

    id = 'thruthesky@hanmail.net'; // 블로그 글 쓰기 아이디.
    password = 'Asdf99**,*,*';     // 블로그 글 쓰기 비밀번호.
    groups = ['261102127412333'];   // Array of group id.
    url = 'https://m.facebook.com';        // 블로그 주소.
    constructor() {
        super()
    }

    async main() {
        await this.init();
        await this.firefox();

        console.log("Facebook Begin: ");
        const login = await this.login().catch(e => this.fatal('login_failed', 'login failed: ' + e.message));
        this.acceptLeaveAlert();

        while (login) {
            await this.philgo_get_post('facebook3')
                .then(async () => await this.post_each_group())
                .catch(async e => {
                    await this.error('fail', 'failed: ' + e.message);
                    await this.philgo_auto_post_log(this.post, 'ERROR', 'facebook', '');
                })
            await this.sleep(60); //300 for 5 mins
        }
    }

    async post_each_group() {
        for ( let re of this.groups ){
            await this.open_form( re );
            await this.waitInCase(3);
            await this.submit_form();
            await this.waitInCase(3);
            await this.philgo_auto_post_log(this.post, 'SUCCESS', 'facebook', this.get_group_url( re ));
            await this.waitInCase(5);
        }
    }

    async submit_form() {

        if (!this.post) {
            console.log("OK: facebook: submit_form(). this.post is null. no more post? just return");
            return;
        }

        console.log("OK: facebook: submit_form() begins.");

        const post = this.post;

        if (!this.page) {
            this.error('page_is_falsy', 'ERROR: this.page has become falsy! Had the browser started with headless: false and the browser closed?');
            return;
        }

        // 간단하게 제목과 URL 만 입력해도 자동으로 Site Preview 가 적절하게 보인다.
        let content = post['subject'] + ' ' + 'https://www.philgo.com/?' + post['idx'];
        await this.page.type('textarea[name="xc_message"]', content).then(a => console.log("OK: typing contents"));
        await this.page.waitFor(5000).then(a => console.log("OK: Wait for 5 seconds just in case"));
        await this.page.click('input[name="view_post"]').then(a => console.log("OK: click post button"));
        await this.page.waitFor(1000).then(a => console.log("OK: wait for 1 sec just in case"));
        await this.page.waitForNavigation().then(a => console.log("OK: wait for navigation after clicking post button"));

        const html = await this.html();
        if (html.indexOf(post['idx'])) {
            console.log(`OK: post success. found post.idx [${post['idx']}] in the facebook.`);
        }
        else {
            console.log("ERROR: failed to post");
        }

    }

    get_group_url( group ) {
        return this.url + '/groups/' + group;
    }

    async open_form( groupId ) {
        await this.page.goto(this.get_group_url( groupId )).then(a => console.log("OK: open post form page"));
        await this.page.waitFor(3000).then(a => console.log("OK: wait for 3 sec just in case"));
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
        if ( count > -1 ) throw { message: 'Login Failed: Facebook suggests to recover your password.' };
        return true;
    }
}



let facebook = new Facebook();

facebook.main();
// tistory.get_post();


