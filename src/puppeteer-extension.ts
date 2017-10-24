const puppeteer = require('puppeteer');
const rpn = require('request-promise-native');
import { Page, Browser } from 'puppeteer';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';

export class PuppeteerAutoPostExtension {
    browser: Browser;
    page: Page;
    post = null;

    ua = {
        firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.12; rv:54.0) Gecko/20100101 Firefox/54.0",
        chrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36",
        safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Safari/604.1.38"

    };
    
    constructor() {

    }


    async init() {
        this.browser = await puppeteer.launch({ headless: true });
        this.page = await this.browser.newPage();
    }



    async firefox() {
        await this.page.setUserAgent(this.ua.firefox);
    }
    async chrome() {
        await this.page.setUserAgent(this.ua.chrome);
    }
    async safari() {
        await this.page.setUserAgent( this.ua.safari );
    }
    async english() {

        await this.page.setExtraHTTPHeaders({
            'accept-language': 'en-US;q=0.6,en;q=0.4'
          });
    }
    /**
     * 웹브라우저를 한글로 변경한다.
     * 웹브라우저에 나오는 언어가 영어나 한글이 아닌 경우 사용하면 좋다.
     */
    async korean() {
        await this.page.setExtraHTTPHeaders({
            'accept-language': 'ko-KR,ko;q=0.8,en-US;q=0.6,en;q=0.4'
          });
    }
    


    async error( code, msg ) {
        let dir = path.join(__dirname, 'screenshots');
        let file = `daum-${code}.png`
        let fullPath = path.join( dir, file );
        
        console.log(`ERROR: CODE: ${code} MESSAGE: ${msg}. See ${fullPath}`);
        if( fs.existsSync(dir) ) fs.mkdirSync(dir);
        await this.page.screenshot({ path: fullPath });
    
    }

    async fatal( code, msg ) {
        await this.error( code, msg );
        console.log("Going to exit since it is fatal error.");
        process.exit(1);
    }

    async sleep( sec ) {
        // sleep and do it over again.
        console.log(`OK: Sleeping for ${sec} seconds.`);
        await this.page.waitFor( sec * 1000 );
        console.log(`===>>> Wake up on: ` + (new Date).toLocaleString());
    }


    /**
     * 현재 페이지의 HTML 을 cheeario 객체로 리턴한다.
     * 
     * @code
            async getHtmlTitle() {
                const $html = await this.html();
                console.log('html title: ', $html.find('title').text())
            }
     * @endcode
     */

    async jQuery() {
        const html = await this.html();
        const $html = cheerio.load(html)('html');
        return $html;
    }
    /**
     * HTML 태그를 그대로 리턴한다.
     */
    async html(): Promise<string> {
        const html: any = await this.page.$eval('html', (html: any) => html.outerHTML); // HTML 얻기
        return html;
    }

    
    /**
     * Returns a promise of number indicating which selector has been appeared.
     * ( 여러 selector 들을 배열로 입력하고 그 중에 하나가 30 초 이내에 나타나면 0 부터 ... 배열.length 값 중 하나를 리턴한다. )
     * 
     * 만약, selector 가 timeout 될 때까지 나타나지 않으면 -1 일 리턴된다.
     * 
     * @return
     *      Promise(-1) - If none of the selectors are appeared.
     *      Promise( 0 ) - If the first selector appeared.
     *      Promise( 1 ) - If the second selector appeared.
     *      Promise( 2 ) - If the third selector appeared.
     *      and so on.
     * 
     * @code
     *      const n = await this.waitAppear( [ '.error', '.home-form-header' ] );
     * @endcode
     * 
     * @code
     
            let url = "https://accounts.kakao.com/login?continue=https://center-pf.kakao.com/signup";
            await this.page.goto( url );
            let re = await this.waitAppear(['#recaptcha_area', '#email', 'input[name="email"]']);
            if ( re === -1 ) protocol.end('fail', 'login page open failed');
            else if ( re === 0 ) protocol.end('fail', 'capture appeared');
            else protocol.send('login page open ok');

     * @endcode
     */
    async waitAppear(selectors: Array<string>, timeout = 30) {
        let $html = null;
        const maxWaitCount = timeout * 1000 / 100;
        for (let i = 0; i < maxWaitCount; i++) {
            await this.page.waitFor(100);
            $html = await this.html();
            for (let i = 0; i < selectors.length; i++) {
                if ($html.find(selectors[i]).length > 0) return i;
            }
        }
        return -1;
    }


    /**
     * Waits until the selector disappears.
     * 
     * @use
     *      - when you do not know what will appear next page,
     *      - you only know that some in this page will disappear if page chages.
     * 
     * @param selector <string> Selector to be disappears.
     * @param timeout timeout. defualt 30 seconds.
     * @return true if disappeared.
     *          false otherwise.
     * 
     * @code
     *     let re = await page.waitDisappear( passwordField );
            if ( re ) {
                console.log("You are NOT in login page");
            }
            else {
                console.log("You are STILL in login page");
            }
            await page.waitFor( 'body' );
     * @endcode
     */
    async waitDisappear(selector: string, timeout = 30) {
        let $html = null;
        let maxWaitCount = timeout * 1000 / 100;
        for (let i = 0; i < maxWaitCount; i++) {
            await this.page.waitFor(100);
            $html = await this.html();
            if ($html.find(selector).length === 0) return true;
        }
        return false;
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
     * @return
     *      Promise of HTML string on sucess
     *      Promise of null on error.
     * 
     */
    async philgo_get_post( posting_id ) {
        console.log("OK: get_post_from_philgo() begins.");
        await this.waitInCase(1);
        this.post = null;
        let html = await rpn('http://www.philgo.com/?module=post&action=get_auto_poster_idx_submit&post_id=auto_posting&posting_id=' + posting_id )
            .catch(e => console.log("failed to get post data from www.philgo.com: " + e.message));
        if ( html ) html = (<string>html).trim();
        if (html) {
            try {
                this.post = JSON.parse(html);
                console.log("OK: got post from philgo.com: subject: " + this.post['subject']);
            }
            catch (e) {
                console.log("ERROR: JSON parsing error. Failed to get post from philgo server..");
                console.log("html: ", html);
            }
        }
        else {
            console.log("OK: No more data.");
        }

        return this.post;
    }


    
    /**
     * 
     * 필고 서버에 성공 실패 여부를 남긴다.
     * 
     * @param post 글 데이터
     * @param re 성공 또는 실패. 값. SUCCESS 또는 ERROR 중 하나 입력.
     * @param site 사이트 이름. 예) naverblog, daumblog, blogger, 네이버블로그, 네이버카페, 다음블로그,티스토리,구글블로그
     * @param site_url 홈페이지 주소. 블로그 주소. 또는 글이 등록된 URL 주소.
     */
    async philgo_auto_post_log(post, re, site, site_url) {
        console.log("OK: begin auto_post_log() with: " + re);
        if ( !post || !post.idx ) {
            console.log("ERROR: post has wrong value. return. ");
            return;
        }

        site_url = encodeURIComponent(site_url);
        const time = (new Date).toLocaleString();
        re = `${re}||${site_url}||${time}`;

        const url = `http://www.philgo.com/?module=post&action=auto_posting_log&submit=1&idx=${post['idx']}&site=${site}&re=${re}`;
        let html = await rpn({url: url, timeout: 15000})
            .catch(e => console.log("failed to get log data from www.philgo.com: " + e.message));
        if (html) {
            try {
                let re = JSON.parse(html);
                console.log("OK: scucess on logging into philgo server");
                return re;
            }
            catch (e) {
                console.log("ERROR: failed to get post from philgo server.");
                return false;
            }
        }
        else {
            console.log("OK: No more posts from philgo server.")
            return false;
        }
    }
    



    /**
     * 잠시 대기한다.
     * @param n 초 단위. 잠시 쉴 시간을 입력한다. 소수점으로 입력하여 0.5 초 와 같이 대기 할 수 있다.
     */
    async waitInCase(n, msg='') {
        n = n * 1000;
        console.log(`OK: wait ${n} ms. ${msg}`);
        await this.page.waitFor(n).then(a => {});
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


    /**
     * Some cases the brwoser shows 'Stay? or Leave' when there is un-published post.
     * This method sets a handler to accept 'Leave' always.
     * 
     */
    acceptLeaveAlert() {


        this.page.on('dialog', async dialog => {
            console.log("Dialog Type: " + dialog.type);
            console.log("Dialog Message:  " + dialog.message());
            if (dialog.type === 'beforeunload') {
                console.log("OK: ======> Stay | Leave box appers. Going to accept Leave.");
                await dialog.accept();
            }
            else await dialog.dismiss();
        });


    }
}
