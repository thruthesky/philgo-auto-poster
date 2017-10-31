import { PuppeteerAutoPostExtension } from './puppeteer-extension';

class NaverCafe extends PuppeteerAutoPostExtension {

    id = 'ionickorea';                            // 블로그 글 쓰기 아이디.
    password = 'fight9to2ql,*';                               // 블로그 글 쓰기 비밀번호.
    url = 'https://m.cafe.naver.com/ArticleWrite.nhn?m=write&clubid=20584210&menuid=';     // 글쓰기 FORM Page URL
    url_login = 'https://nid.naver.com/nidlogin.login?svctype=262144&url=http%3A%2F%2Fm.cafe.naver.com%2FArticleAllList.nhn%3Fcluburl%3Dphilgocom';
    url_home = 'https://cafe.naver.com/philgocom';             // 홈페이지 URL
    name = 'navercafe';
    display_name = encodeURIComponent('네이버카페');
    category = 8;




    timeoutSleep = 300; // 5분 동안 잠자기.

    constructor() {
        super();
    }

    async main() {
        await this.init(false);
        await this.chromeMobile();

        await this.login().catch(e => this.fatal('naver_cafe_login_failed', 'naver cafe login failed: ' + e.message));

        this.acceptLeaveAlert();

        while (true) {
            await this.philgo_get_post(this.name)
                .then(async () => await this.open_form())
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

        await this.page.select('#menuid_list', this.category);
        await this.waitInCase(1);

        await this.page.type('#subject', this.post['subject']).then(a => console.log("OK: title typed"));
        await this.waitInCase(1, 'wait 1 second after title input');


        await this.page.click('#se2_attach').then(a => console.log("OK: Openning media box"));
        await this.waitInCase(2);

        await this.page.click('.se2_oglink ').then(a => console.log("OK: Openning link preview box"));
        await this.waitInCase(2);

        await this.page.type('#attachLinkUrl', 'https://www.philgo.com/?' + this.post['idx']).then(a => console.log('OK: typing url for site preview'));
        await this.waitInCase(5);

        for (let i = 0; i < 4; i++) {
            await this.page.click('#attachLinkInput a.btn_confirm').then(a => console.log(`OK: ${i}st/nd/th click of site preview button`));
            await this.waitInCase(5);

            let $html = await this.jQuery();
            if ( $html.find('#attachLinkPreview').length ) {
                console.log("OK: site preview is okay");
                break;
            }
        }
        




        await this.page.click('#attachLinkApplyBtn').then(a => console.log('OK: click apply button for site preview'));
        await this.waitInCase(1);

        await this.page.click('#openyn_all').then(a => console.log("OK: open all button clicked."));
        await this.waitInCase(1);

        await this.page.click('.btn_primary').then(a => console.log("OK: post button clicked"));

        await this.page.waitFor('.post_title').then(a => console.log("OK: post success"));


        let url = <string>this.page.url();
        if ( url ) url = url.replace('://m.', '://');
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
        await this.page.goto(this.url).then(a => console.log('OK: naver cafe: open post form page'));
        await this.waitInCase(1);
        await this.page.waitFor('#subject').then(a => console.log('OK: opening post form'));
    }



    async login() {

        await this.page.goto(this.url_login).then(a => console.log("OK: naver cafe login page has been opened"));
        await this.waitInCase(1);

        await this.page.type('#id', this.id).then(a => console.log("OK: Type id"));
        await this.waitInCase(1);
        await this.page.type('#pw', this.password).then(a => console.log("OK: type password"));
        await this.waitInCase(3, 'wait after password typing. wait before clicking login button');
        await this.page.click('.btn_global').then(a => console.log("OK: Login button clicked"));

        // 로그인 검사. Check login.
        await this.page.waitFor('.ico_write').then(a => console.log('OK: Login.'));
    }


}



let nc = new NaverCafe();

nc.main();
