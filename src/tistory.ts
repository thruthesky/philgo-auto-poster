import { PuppeteerAutoPostExtension } from './puppeteer-extension';

class Tistory extends PuppeteerAutoPostExtension {

    id = 'thruthesky@daum.net';                     // 블로그 글 쓰기 아이디.
    password = 'fight9to2ql';                       // 블로그 글 쓰기 비밀번호.

    blogs = {
        philgo: '721808',
        manila: '723367',
        cebusell: '762802',
        angeleskorea: '635491',
        mindanao: '974631'
    };

    domain = '';
    url = '';             // 블로그 주소.
    category = '0';                            // 각 블로그 별 글 카테고리.
    countBlog = 0;

    timeoutForSelector = 30000; // 30 초 동안 기다리기.
    timeoutForRequest = 20000;
    timeoutSleep = 60; // 1분 동안 잠자기.

    constructor() {
        super();
    }

    async main() {
        await this.init();
        await this.chrome();

        await this.login().catch( e => this.fatal( 'tistory_login_failed', 'Tistory login failed: ' + e.message));
        this.acceptLeaveAlert();

        while (true) {
            await this.philgo_get_post('tistory-thrutheky@daum.net')
            .then( post => this.resetBlog() )
            .then(async () => await this.open_form().catch( async e => await this.failed_to_open_tistory_form()) )
            .then(async () => await this.submit_form())
            .then(async () => await this.philgo_auto_post_log(this.post, 'SUCCESS', 'tistory', this.url))
            .catch(async e => {
                await this.error('fail', 'failed: ' + e.message);
                await this.philgo_auto_post_log(this.post, 'ERROR', 'tistory', '');
            })

            await this.sleep(this.timeoutSleep);
            
        }
    }

    

    resetBlog() {
        const keys = Object.keys(this.blogs);
        this.domain = keys[this.countBlog];

        this.url = 'http://' + this.domain + '.tistory.com';
        this.category = this.blogs[this.domain];

        this.countBlog++;
        if (this.countBlog >= keys.length) this.countBlog = 0;
    }


    
    async submit_form() {

        if (!this.post) {
            console.log("OK: tistory: submit_form(). this.post is null. no more post? just return");
            return;
        }
        console.log("OK: tistory: submit_form() begins.");

        let post = this.post;

        await this.page.click('#tx_switchertoggle');
        await this.page.waitFor(500);

        await this.page.click('.btn_public');
        await this.page.waitFor(500);

        await this.page.select('select#category', this.category);
        await this.page.waitFor(500);


        await this.page.focus('#titleBox');
        await this.page.type('#titleBox', post.subject);
        await this.page.waitFor(500);
        await this.page.focus('#tx_canvas_source');


        post['content'] += this.philgoLink();
        await this.page.type('#tx_canvas_source', post.content);

        await this.page.click('.btn_comm.btn_save').then('OK: post button clicked.');
        await this.page.waitFor('.tit_cont', { timeout: this.timeoutForSelector })
            .then(() => console.log("Posting OK: "));

        return '';
    }
    /**
     * 
     * @return Promise of boolean.
     *      true on success,
     *      false on error.
     * 
     */
    async open_form() {
        await this.page.goto(this.url + '/admin/entry/post/?type=post&returnURL=/manage/posts/', { timeout: this.timeoutForRequest }).then(a => console.log('OK: tistory: open post form page'));
        await this.page.waitFor('.btn_provisionally', { timeout: this.timeoutForSelector }).then(a => console.log("OK: tistory: form opened"));
    }

    /**
     * IP 가 변경되면, 로그인이 풀리는 것 같음.
     */
    async failed_to_open_tistory_form() {
        console.log("ERROR: failed to open form. Login invalid? IP address of the computer has changed?");
        await this.page.waitFor(60 * 1000);
        await this.login();
        await this.open_form();
    }

    
    async login() {
        await this.page.goto('http://www.tistory.com/').then(a => console.log("OK: www.tistory.com has been opened"));
        await this.page.click('.link_login').then(a => console.log('OK: click login button'))
        await this.page.waitFor('#loginId').then(a => console.log('OK: login button found'))
        await this.page.focus('#loginId');
        await this.page.type('#loginId', this.id);
        await this.page.focus('#loginPw');
        await this.page.type('#loginPw', this.password);
        await this.waitInCase(2, 'wait after inputting id and password.');
        await this.page.click('button[type="submit"]').then(a => console.log('OK: Login button clicked'))

        /// 로그인 검사. Check login.
        await this.page.waitFor('.gnb_tistory', { timeout: this.timeoutForSelector }).then(a => console.log('OK: Login.'));
    }


}



let tistory = new Tistory();

tistory.main();
