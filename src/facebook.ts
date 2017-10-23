const pFacebook = require('puppeteer');
const rpnFacebook = require('request-promise-native');
const cheerio = require('cheerio');


class Facebook {

    id = 'thruthesky@hanmail.net';                    // 블로그 글 쓰기 아이디.
    password = 'Asdf99**,*,*';              // 블로그 글 쓰기 비밀번호.
    url = 'https://m.facebook.com';        // 블로그 주소.
    group = '261102127412333';

    browser;
    page;
    constructor() {
    }

    async run() {
        this.browser = await pFacebook.launch({ headless: true });
        this.page = await this.browser.newPage();
        // 다음은, 크롬으로 로그인하려 하면, 로그인 창이 잘 안 뜸.
        // 크롬
        // await this.page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36");

        // 사파리
        // await this.page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Safari/604.1.38");

        // 파이어폭스 모바일
        await this.page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0");



        console.log("Facebook Begin: ");
        let login = await this.login().then(() => true).catch(e => { console.log("FAIL: Login failed: " + e.message); return false; });

        // let login = true;
        while (login) {

            // get data from philgo.
            let post = await this.get_post_from_philgo();
            if (post && post['subject']) {
                console.log(`Facebook: Going to post for ${post['subject']}`);

                // open tistory posting form
                await this.open_facebook_form().catch( async e => {
                    await this.screenshot('form');
                    console.log("ERROR: failed on opening form page. Please check form png");
                });

                // post it on tistory
                await this.post_post( post ).catch( async e => {
                    await this.screenshot('post');
                    console.log("ERROR: failed on posting. Please check post png");
                });


                await this.auto_post_log( post, 'SUCCESS');
            }
            else {
                console.log(`OK: Failed to get philgo post. or may be No more post`);
            }

            // sleep and do it over again.
            console.log(`facebook: sleeping for 2 minutes`);
            await this.page.waitFor(120);
            console.log(`facebook: begins new loop at: ` + (new Date).toLocaleString());
        }
    }


    async screenshot(filename) {
        await this.page.screenshot({ path: `screenshots/facebook-${this.group}-${filename}.png` });
    }

    async post_post(post) {

        if ( ! this.page ) {
            console.log('ERROR: this.page has become falsy! Had the browser started with headless: false and the browser closed?');
            return;
        }

        // 간단하게 제목과 URL 만 입력해도 자동으로 Site Preview 가 적절하게 보인다.
        let content = post['subject'] + ' ' + 'https://www.philgo.com/?' + post['idx'];
        await this.page.type('textarea[name="xc_message"]', content).then( a => console.log("OK: typing contents") );
        await this.page.waitFor(5000).then(a => console.log("OK: Wait for 5 seconds just in case") );
        await this.page.click('input[name="view_post"]').then(a => console.log("OK: click post button"));
        await this.page.waitFor(1000).then(a => console.log("OK: wait for 1 sec just in case"));
        await this.page.waitForNavigation().then(a => console.log("OK: wait for navigation after clicking post button"));
        const html = await this.get_raw_html();
        if ( html.indexOf( post['idx'] ) ) {
            console.log(`OK: post success. found post.idx [${post['idx']}] in the facebook.`);
        }
        else {
            console.log("ERROR: failed to post");
        }
    }


    get_group_url() {
        return this.url + '/groups/' + this.group;
    }
    async open_facebook_form() {
        await this.page.goto( this.get_group_url() ).then(a => console.log("OK: open post form page"));
        await this.page.waitFor( 3000 ).then(a => console.log("OK: wait for 3 sec just in case"));
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
        let html = await rpnFacebook('http://www.philgo.com/?module=post&action=get_auto_poster_idx_submit&post_id=auto_posting&posting_id=facebook3')
            .catch(e => console.log("failed to get post data from www.philgo.com: " + e.message));
        let re = null;
        if (html) {
            html = (<string>html).trim();
            try {
                re = JSON.parse(html);
            }
            catch (e) {
                console.log("ERROR: JSON parsing error. Failed to get post from philgo server..");
                console.log("html: ", html);
            }
        }
        else {
            console.log("OK: No more data");
        }

        return re;
    }

    async login() {
        await this.page.goto(this.url)
            .then(a => console.log(`OK: facebook open: ${this.url}`));
        await this.page.type('input[name="email"]', this.id).then(a => console.log("OK: input id"));
        await this.page.type('input[name="pass"]', this.password).then(a => console.log("OK: input password"));
        await this.page.click('input[name="login"]').then(a => console.log("OK: click login"));
        await this.page.waitFor(1000).then(a => console.log("OK: wait for 1 sec just in case"));
        await this.page.waitForNavigation().then(a => console.log("OK: waiting for navigation after login button clicked."));
        let $html = await this.html();
        const freeModeButton = 'input[type="submit"][value="OK"]';
        if ( $html.find( freeModeButton ).length ) {
            await this.page.click( freeModeButton ).then( a => console.log("OK: click free mode OK button") );
        }
    }

        /**
     * 서버에 성공 실패 여부를 남긴다.
     * @param post 글 데이터
     */
    async auto_post_log(post, re) {
        console.log("OK: begin auto_post_log() with: " + re);
        if ( !post || !post.idx ) {
            console.log("ERROR: post has wrong value. return. ");
            return;
        }
        const facebook_url = encodeURIComponent(this.get_group_url());
        const time = (new Date).toLocaleString();
        re = `${re}||${facebook_url}||${time}`;
        let url = `http://www.philgo.com/?module=post&action=auto_posting_log&submit=1&idx=${post['idx']}&site=facebook&re=${re}`;
        let html = await rpnFacebook( url )
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


    async html() {
        const html = this.get_raw_html();
        const $html = cheerio.load(html)('html');
        return $html;
    }
    /**
     * HTML 태그를 그대로 리턴한다.
     */
    async get_raw_html(): Promise<string> {
        const html: any = await this.page.$eval('html', (html: any) => html.outerHTML); // HTML 얻기
        return html;
    }

}



let facebook = new Facebook();

facebook.run();
// tistory.get_post();


