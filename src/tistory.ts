/**
 * 
 */
const pup2 = require('puppeteer');
const rpn = require('request-promise-native');

class Tistory {

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



    browser;
    page;

    timeoutForSelector = 30000; // 30 초 동안 기다리기.
    timeoutForRequest = 20000;
    timeoutSleep = 60; // 1분 동안 잠자기.

    constructor() {
    }

    async run() {
        this.browser = await pup2.launch({ headless: false });
        this.page = await this.browser.newPage();

        // 다음은, 크롬으로 로그인하려 하면, 로그인 창이 잘 안 뜸.
        await this.page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36");
        // await this.page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Safari/604.1.38");


        await this.login();

        this.page.on('dialog', async dialog => {
            console.log("Dialog Type: " + dialog.type);
            console.log("Dialog Message:  " + dialog.message());
            if (dialog.type === 'beforeunload') {
                console.log("Going to accept unload.");
                await dialog.accept();
            }
            else await dialog.dismiss();
        });


        while (true) {

            // get data from philgo.
            let post = await this.get_post_from_philgo();
            if (post && post['subject']) {

                this.resetBlog();
                console.log(`OK: TiStory: Going to post for ${this.url}:${this.category} with: (${post['idx']}) ${post['subject']}`);
                let form = await this.open_tistory_form(); // open tistory posting form
                if (form) { // post form open
                    await this.submit_post(post) // post data to tistory.
                        .then(async () => { // sucess
                            await this.auto_post_log(post, 'SUCESS');
                            // goto blog
                            await this.page.goto(this.url)
                                .then(() => console.log("OK: Go to blog after posting."))
                                .catch(e => console.log("Failed to move to blog home: " + e.message));
                        })
                        .catch(async e => { // failure
                            await this.auto_post_log(post, 'ERROR');
                            await this.screenshot('submit-error');
                            console.log("failed to post the post: " + e.message);
                        });
                }
                else {
                    await this.auto_post_log(post, 'ERROR');
                    console.log("Failed to open posting form.")
                }
            }
            else {
                console.log(`Failed to get philgo post. or may be No more post`);
            }

            // sleep and do it over again.
            console.log(`OK: TiStory Sleeping for 2 minutes`);
            await this.page.waitFor(this.timeoutSleep * 1000);
            console.log(`===>>> TiStory: Begins new loop at: ` + (new Date).toLocaleString());
        }
    }

    async screenshot(filename) {
        await this.page.screenshot({ path: `screenshots/tistory-${this.domain}-${filename}.png` });
    }

    resetBlog() {
        const keys = Object.keys(this.blogs);
        this.domain = keys[this.countBlog];

        this.url = 'http://' + this.domain + '.tistory.com';
        this.category = this.blogs[this.domain];

        this.countBlog++;
        if (this.countBlog >= keys.length) this.countBlog = 0;
    }


    /**
     * 서버에 성공 실패 여부를 남긴다.
     * @param post 글 데이터
     */
    async auto_post_log(post, re) {
        let url = `http://www.philgo.com/?module=post&action=auto_posting_log&submit=1&idx=${post['idx']}&site=tistory&re=${re} ` + (new Date).toLocaleString();
        let html = await rpn( url )
            .catch(e => console.log("failed to get post data from www.philgo.com: " + e.message));
        if (html) {
            try {
                let re = JSON.parse(html);
                return re;
            }
            catch (e) {
                console.log("Failed to get post from philgo server.");
                return null;
            }
        }
        else return null;
    }
    async submit_post(post) {
        console.log("Begin submit_post()");

        await this.page.click('#tx_switchertoggle')
        //.catch( e => console.log('failed to click html toggle button ') );
        await this.page.waitFor(500);

        await this.page.click('.btn_public')
        //.catch( e => console.log('failed to click public button ') );
        await this.page.waitFor(500);

        await this.page.select('select#category', this.category)
        //.catch( e => console.log('failed to select category ') );
        await this.page.waitFor(500);


        await this.page.focus('#titleBox');
        await this.page.type('#titleBox', post.subject)
        //.catch( e => console.log('failed to input title ') );
        await this.page.waitFor(500);
        await this.page.focus('#tx_canvas_source');


        post['content'] += this.philgoLink();
        await this.page.type('#tx_canvas_source', post.content)
        //.catch( e => console.log('failed to input content ') );

        await this.page.click('.btn_comm.btn_save').then('OK: post button clicked.')
        //.catch( e => console.log('failed to click .btn_comm.btn_save'))
        await this.page.waitFor('.tit_cont', { timeout: this.timeoutForSelector })
            .then(() => console.log("Posting OK: "));
        //.catch(e => console.log('failed after clicking post button'));

    }
    /**
     * 
     * @return Promise of boolean.
     *      true on success,
     *      false on error.
     * 
     */
    async open_tistory_form() {
        let re = await this.page.goto(this.url + '/admin/entry/post/?type=post&returnURL=/manage/posts/', {
            timeout: this.timeoutForRequest
        })
            .then(() => true)
            .catch(e => {
                console.log('failed to open write form page: ' + e.message);
                return false;
            });
        if (!re) return false;

        re = await this.page.waitFor('.btn_provisionally', { timeout: this.timeoutForSelector })
            .then(a => {
                console.log('OK: Opening Write FORM Page.');
                return true;
            }).catch(async e => {
                await this.screenshot('btn-provisionally');
                console.log('failed to wait for .btn_provisionally');
                return false;
            });

        if ( re ) return re;

        // 가끔씩 로그인이 풀림.
        this.failed_to_open_tistory_form();

    }

    /**
     * IP 가 변경되면, 로그인이 풀리는 것 같음.
     */
    async failed_to_open_tistory_form() {
        console.log("ERROR: failed to open form. IP address of the computer has changed?");
        await this.page.waitFor(60 * 1000);
        await this.login();
        await this.open_tistory_form();
    }

    /**
     * 
     * 필고 게시판으로 부터 하나의 글을 얻는다.
     * 
     * 
     * 
     * 
     * @code
        let tistory = new Tistory();
        tistory.get_post();
     * @endcode
     * 
     * @return Promise of HTML string.
     *      null if error.
     * 
     */
    async get_post_from_philgo() {
        let html = await rpn('http://www.philgo.com/?module=post&action=get_auto_poster_idx_submit&post_id=auto_posting&posting_id=tistory-thrutheky@daum.net')
            .catch(e => console.log("failed to get post data from www.philgo.com: " + e.message));
        if (html) {
            try {
                let re = JSON.parse(html);
                return re;
            }
            catch (e) {
                console.log("Failed to get post from philgo server.");
                return null;
            }
        }
        else return null;

    }
    async login() {
        await this.page.goto('http://www.tistory.com/')
            .then(a => console.log("www.tistory.com has been opened")).catch(e => console.log("failed to open tistory site: " + e.message));
        await this.page.click('.link_login');
        await this.page.waitFor('#loginId').then(a => { }).catch(e => { });

        await this.page.focus('#loginId');
        await this.page.type('#loginId', this.id);
        await this.page.focus('#loginPw').catch(e => console.log('password focus failed'));
        await this.page.type('#loginPw', this.password).catch(e => console.log('password type failed'));
        await this.page.waitFor(2000);
        await this.page.click('button[type="submit"]')
            .then(a => console.log('OK: Login button clicked'))
            .catch(e => console.log('failed to click login submit button'));

        /// 로그인 검사. Check login.
        await this.page.waitFor('.gnb_tistory', { timeout: this.timeoutForSelector }) // 
            .then(a => console.log('OK: Login.'))
            .catch(async e => { // failed to login.
                await this.screenshot('login-failed');
                await this.page.$('.tit_error')
                    .then(a => console.log('failed to login. You may need authentication. see tistory screenshot.png'))
                    .catch(e => console.log('failed to login. Unknown error. see tistory-screenshot.png'));
                this.browser.close();
                process.exit(1);
            });
    }

    philgoLink() {
        return `
<p>
<a href="http://www.philgo.com/" target="_blank">#필리핀사이트</a>
<a href="http://www.philgo.com/" target="_blank">#필리핀교민사이트</a>
<a href="http://www.philgo.com/" target="_blank">#마닐라</a>
<a href="http://www.philgo.com/" target="_blank">#세부</a>
<a href="http://www.philgo.com/" target="_blank">#앙헬레스</a>
  <a href="http://www.philgo.com/" target="_blank">#필고</a>
</p>
        `;
    }

}



let tistory = new Tistory();

tistory.run();
// tistory.get_post();


