
const rpn = require('request-promise-native');
const puppeteer = require('puppeteer');
import { PuppeteerAutoPostExtension } from './puppeteer-extension';

class Daum extends PuppeteerAutoPostExtension {

    name = 'daum-blog-jaehosong52';
    id = 'jaehosong52';                     // 블로그 글 쓰기 아이디.
    password = 'fight9to2ql';                       // 블로그 글 쓰기 비밀번호.
    url = 'http://blog.daum.net/jaehosong52';        // 블로그 주소.
    category = '721808';                            // 각 블로그 별 글 카테고리.

    browser;
    page;
    post = null;
    constructor() {
        super();
    }

    async main() {
        await this.setPuppeteer();
        await this.chrome();


        const login = await this.login().catch(e => this.fatal('login_failed', 'login failed: ' + e.message));
        while (login) {

            await this.get_post_from_philgo()
                .then(async post => {
                    this.post = post;
                    if (!this.post || !this.post['subject']) throw (new Error('post is empty'));
                    else return await this.open_posting_form();
                })
                .then(async re => {
                    return await this.submit_form();
                })
                .then(async re => {
                    await this.auto_post_log(this.post, 'SUCCESS');
                })
                .catch(async e => {
                    await this.error('fail', 'failed: ' + e.message);
                    await this.auto_post_log(this.post, 'ERROR');
                })


            await this.sleep(60);
            await this.page.goto( this.url ).catch( async e => this.error( 'failed_open_blog', "failed openning blog after sleep."));
        }
        

    }
    async setPuppeteer() {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        this.set(browser, page);
    }


    async submit_form() {
        console.log("OK: daum: submit_form() begins.");
        const frames = await this.page.frames();
        const frame = frames.find(f => f.name() === 'BlogMain');

        await frame.waitFor('.titleBox input').then(a => console.log("OK: subject input box found."));
        await frame.waitFor(1000).then(a => console.log("OK: writing form frame wait for 1 second just in case."));
        await frame.$('.titleBox input').then( handle => handle.type(this.post['subject']).then(a => console.log("OK: typing subject.")) );

        await frame.waitFor(5000).then(a => console.log("OK: wait for 5 seconds after typing subject just in case."));
        await frame.$('#tx_switchertoggle a').then( handle => handle.click() );


        await frame.waitFor(1000).then(a => console.log("OK: wait for 1 second after clicking HTML type just in case."));

        
        this.post['content'] += this.philgoLink();
        await frame.$('#tx_canvas_source').then( handle => handle.type( this.post['content'] ).then( a => console.log("OK: typing content")));
        
        await frame.waitFor(1000).then(a => console.log("OK: wait for 1 second after typing contents"));
        await frame.$('a[onclick*="RegArticle"]').then( handle => handle.click() );

        await frame.waitFor('#ProfileMenuMain').then( a => console.log("OK: posting on daum blog success") );

        return true;
    }



    async open_posting_form() {
        console.log("OK: daum: open_posting_form() begins.");
        await this.page.waitFor( 3000 ).then(a => console.log("OK: waited for 3 seconds because frames are late on loading."));
        const frames = await this.page.frames();
        const blogFrame = frames.find(f => f.name() === 'BlogMain');
        await blogFrame.waitFor('.ic_writer').then(a => console.log("OK: wait for post button"));
        await blogFrame.$eval('.ic_writer', el => el.click()).then(a => console.log("OK: clicked on post button"));
        await blogFrame.waitFor('.titleBox input').then(a => console.log("OK: posting form page opened."));

        return true;
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
        console.log("OK: daum: get_post_from_philgo() begins.");
        await this.page.waitFor(1000).then(a => console.log("OK: wait for 1 sec just in case"));
        let html = await rpn('http://www.philgo.com/?module=post&action=get_auto_poster_idx_submit&post_id=auto_posting&posting_id=' + this.name)
            .catch(e => console.log("failed to get post data from www.philgo.com: " + e.message));
        let re = null;
        if ( html ) html = (<string>html).trim();
        if (html) {
            try {
                re = JSON.parse(html);
                console.log("OK: got post from philgo.com: subject: " + re['subject']);
            }
            catch (e) {
                console.log("ERROR: JSON parsing error. Failed to get post from philgo server..");
                console.log("html: ", html);
            }
        }
        else {
            console.log("OK: daum: No more data.");
        }

        return re;
    }

    async login() {
        console.log("OK: daum: login() begins");

        // 페이지를 처음 열면, 블로그 첫 페이지에 <frameset><frame name='BlogMain'> 이 있다.
        await this.page.goto(this.url)
            .then(a => console.log(`OK: daum: Blog open: ${this.url}`));
        const frames = await this.page.frames();
        if ( frames ) console.log("OK: No of frames in daum blog site: " + frames.length);
        else this.fatal('failed_to_get_frames', "Failed to get frames on blog page.");
        const blogFrame = frames.find(f => f.name() === 'BlogMain');

        await blogFrame.$eval('.login_btn.minidaum_menu a', el => el.click()).then( a => console.log("OK: login button clicked"));

        // 로그인 페이지를 열면 #id 가 있다.
        await this.page.waitFor('#id').then(a => console.log("OK: login page open"));
        await this.page.type('#id', this.id);
        await this.page.type('#inputPwd', this.password);
        await this.page.click('#loginBtn').then(a => console.log("OK: login button clicked with ID & Password"));

        // 로그인을 성공하면, 블로그 첫 페이지로 돌아가는데, 다시 <frameset><frame name='BlogMain'> 를 볼 수 있다.
        await this.page.waitFor('frameset frame[name="BlogMain"]').then(a => console.log("OK: Login success"));

        return true;
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

        const facebook_url = encodeURIComponent(this.url);
        const time = (new Date).toLocaleString();
        re = `${re}||${facebook_url}||${time}`;

        let url = `http://www.philgo.com/?module=post&action=auto_posting_log&submit=1&idx=${post['idx']}&site=daumblog&re=${re}`;
        let html = await rpn({url: url, timeout: 15000})
            .catch(e => console.log("failed to get log data from www.philgo.com: " + e.message));
        if (html) {
            try {
                let re = JSON.parse(html);
                console.log("OK: got a post from philgo server");
                return re;
            }
            catch (e) {
                console.log("ERROR: failed to get post from philgo server.");
                return false;
            }
        }
        else {
            console.log("OK: No more data.")
            return false;
        }
    }

}



let daum = new Daum();

daum.main();
// tistory.get_post();


