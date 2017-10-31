import { PuppeteerAutoPostExtension } from './puppeteer-extension';

class KakaoPlusHome extends PuppeteerAutoPostExtension {

    id = 'thruthesky@gmail.com';                            // 블로그 글 쓰기 아이디.
    password = 'Liltl3dk~73';                               // 블로그 글 쓰기 비밀번호.
    url = 'https://center-pf.kakao.com/_Jxcwrxl/posts';     // 글쓰기 URL
    url_home = 'https://pf.kakao.com/_Jxcwrxl';             // 홈페이지 URL
    name = 'kakaohomeplus';
    display_name = encodeURIComponent('카카오톡 친구 홈페이지');

    
    timeoutForSelector = 30000; // 30 초 동안 기다리기.
    timeoutForRequest = 20000;
    timeoutSleep = 300; // 5분 동안 잠자기.

    constructor() {
        super();
    }

    async main() {
        await this.init();
        await this.chrome();

        await this.login().catch( e => this.fatal( 'kakaoplushome_login_failed', 'Kakao plus home login failed: ' + e.message));

        while (true) {
            await this.philgo_get_post( this.name )
            .then(async () => await this.open_form() )
            .then(async () => await this.submit_form())
            .then(async url => await this.philgo_auto_post_log(this.post, 'SUCCESS', this.display_name, url))
            .catch(async e => {
                await this.error(this.name + '-fail', 'failed: ' + e.message);
                await this.philgo_auto_post_log(this.post, 'ERROR', this.display_name, '');
            })

            await this.sleep(this.timeoutSleep);
            
        }
    }

    
    
    
    async submit_form() {

        if (!this.post) {
            console.log("OK: tistory: submit_form(). this.post is null. no more post? just return");
            return;
        }
        console.log("OK: tistory: submit_form() begins.");

        

        await this.page.type('.box_write .tit_tf input', this.post['subject']).then(a => console.log("OK: title typed"));
        await this.waitInCase(1, 'wait 1 second after title input');

        
        await this.page.type('.outlink_write input', 'https://www.philgo.com/?' + this.post['idx']).then(a => console.log('OK: typing url') );
        await this.waitInCase(15, 'wait 15 seconds after site preview link');


        
        await this.page.click('.btn_g2').then( a => console.log("OK: write button clicked"));
        await this.waitInCase( 10, "wait 10 seconds after submitting the form for the new post completely posted");


        const html = await this.html();
        if (html.indexOf(this.post['idx'])) {
            console.log(`OK: post success. found post.idx [${this.post['idx']}] in the facebook.`);
        }
        else {
            console.log("ERROR: failed to post");
            throw new Error('post was not created');
        }

        const $html = await this.jQuery();
        
        const admin_url = 'https://pf.kakao.com' + $html.find('.link_txt').first().attr('href');
        const url = admin_url.replace('/posts/', '/');


        return url;
    }
    /**
     * 
     * @return Promise of boolean.
     *      true on success,
     *      false on error.
     * 
     */
    async open_form() {
        await this.page.goto(this.url, { timeout: this.timeoutForRequest }).then(a => console.log('OK: tistory: open post form page'));
        
        // console.log("POST: ", this.post);

        await this.page.waitFor('.tab_g').then( a => console.log('OK: opening link tab') );
        await this.page.click('.tab_g li:nth-child(3) button').then( a => console.log("OK: click link input button") );
        await this.page.waitFor('.outlink_write input').then( a => console.log('OK: url preview box open ok') );
        await this.page.waitFor('.box_write .tit_tf input').then( a => console.log("OK: title input box") );
        
    }

    
    
    async login() {
        const url = "https://accounts.kakao.com/login?continue=https://center-pf.kakao.com/signup";
        
        await this.page.goto(url).then(a => console.log("OK: kakao plus home has been opened"));

        await this.page.type( '#email', this.id ).then( a => console.log("OK: Type email") );
        await this.page.type( '#password', this.password ).then( a => console.log("OK: type password") );
        await this.page.click( '#btn_login' ).then( a => console.log("Login button clicked") );
        
        /// 로그인 검사. Check login.
        await this.page.waitFor('.tit_plus', { timeout: this.timeoutForSelector }).then(a => console.log('OK: Login.'));
    }


}



let tistory = new KakaoPlusHome();

tistory.main();
