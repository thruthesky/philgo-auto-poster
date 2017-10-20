const pup2 = require('puppeteer');
const sleep = require('sleep');
const rpn = require('request-promise-native');

class Tistory {

    id = 'thruthesky@daum.net';                     // 블로그 글 쓰기 아이디.
    password = 'fight9to2ql';                       // 블로그 글 쓰기 비밀번호.
    sub_domain = 'philgo';                          // 블로그의 서브 도메인.
    url_blog = 'http://philgo.tistory.com/';        // 블로그 주소.
    category = '721808';                            // 각 블로그 별 글 카테고리.

    browser;
    page;
    constructor() {
    }

    async run() {
        this.browser = await pup2.launch({ headless: false });
        this.page = await this.browser.newPage();

        await this.login();

        while (true) {

            // get data from philgo.
            let post = await this.get_post();
            if (post && post['subject'] ) {

                console.log(`Going to post for ${post['subject']}`);

                // open tistory posting form
                await this.open_tistory_form();

                // post it on tistory
                await this.post_post( post );

                // goto blog
                await this.page.goto( this.url_blog );
            }
            else {
                console.log(`No more post`);
            }

            // sleep and do it over again.
            console.log(`Sleeping for 1 minutes`);
            sleep.sleep(60);
            console.log(`Begins new loop`);
        }
    }

    async post_post( post ) {

        await this.page.click('#tx_switchertoggle').catch( e => console.log('failed to click html toggle button ') );
        await this.page.waitFor(500);
    
        await this.page.click('.btn_public').catch( e => console.log('failed to click public button ') );
        await this.page.waitFor(500);

        await this.page.select('select#category', this.category);
        await this.page.waitFor(500);

    
        await this.page.focus('#titleBox');
        await this.page.type('#titleBox', post.subject).catch( e => console.log('failed to input title ') );
        await this.page.waitFor(500);
        await this.page.focus('#tx_canvas_source');
        await this.page.type('#tx_canvas_source', post.content).catch( e => console.log('failed to input content ') );
        await this.page.waitFor(1000);
    
        await this.page.click('.btn_comm.btn_save');
        await this.page.waitFor('.tit_cont').then(a => console.log('success')).catch(e => console.log('failed after clicking post button'));

        await this.page.waitFor(5000); // simple wait for 5 seconds.
    }
    async open_tistory_form() {
        await this.page.goto('http://' + this.sub_domain + '.tistory.com/admin/entry/post/?type=post&returnURL=/manage/posts/');
        await this.page.waitFor('.btn_provisionally').then(a => console.log('open write page ok')).catch(e => console.log('failed to open write page'));
    }

    /**
     * 
     * 필고 게시판으로 부터 하나의 글을 얻는다.
     * 
     * @code
        let tistory = new Tistory();
        tistory.get_post();
     * @endcode
     */
    async get_post() {
        let html = await rpn('http://www.philgo.com/?module=post&action=get_auto_poster_idx_submit&post_id=buyandsell&posting_id=tistory-thrutheky@daum.net-philgo');
        try {
            let re = JSON.parse( html );
            return re;
        }
        catch( e ) {
            console.log("Failed to get post from philgo server.");
            return null;
        }
    }
    async login() {
        await this.page.goto('http://www.tistory.com/')
            .then( a => console.log("www.tistory.com has been opened") ).catch( e => console.log("failed to open tistory site: " + e.message ));
        await this.page.click('.link_login');
        await this.page.waitFor('#loginId').then(a => { }).catch(e => { });

        await this.page.focus('#loginId');
        await this.page.type('#loginId', this.id);
        await this.page.focus('#loginPw').catch(e => console.log('password focus failed'));
        await this.page.type('#loginPw', this.password).catch(e => console.log('password type failed'));
        await this.page.waitFor(2000);
        await this.page.click('button[type="submit"]')
            .then(a => console.log('login button clicked'))
            .catch(e => console.log('failed to click login submit button'));

        /// 로그인 검사. Check login.
        await this.page.waitFor('.gnb_tistory') // 
            .then(a => console.log('login ok'))
            .catch(async e => { // failed to login.
                await this.page.screenshot({ path: 'screenshots/tistory-screenshot.png' });
                await this.page.$('.tit_error')
                    .then(a => console.log('failed to login. You may need authentication. see tistory screenshot.png'))
                    .catch(e => console.log('failed to login. Unknown error. see tistory-screenshot.png'));
            });
    }
}



let tistory = new Tistory();

tistory.run();
// tistory.get_post();


