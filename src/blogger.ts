
const rpn = require('request-promise-native');
const puppeteer = require('puppeteer');
import { PuppeteerAutoPostExtension } from './puppeteer-extension';

class Blogger extends PuppeteerAutoPostExtension {

    name = 'blogger';
    id = 'eunsujung79@gmail.com';                     // 블로그 글 쓰기 아이디.
    password = 'Asdf99**';                              // 블로그 글 쓰기 비밀번호.
    url = 'https://www.blogger.com';        // 블로그 글 쓰기 주소.
    url_blog_home = 'http://aboutphil28.blogspot.com';                             // 블로그 홈 주소
    category = '3804997078465626362';                            // 각 블로그 별 글 카테고리.

    browser;
    page;
    post = null;
    constructor() {
        super();
    }

    async main() {
        await this.setPuppeteer();
        await this.chrome();
        await this.korean();



        const login = await this.login().catch(e => this.fatal('login_failed', 'login failed: ' + e.message));


        this.page.on('dialog', async dialog => {
            console.log("Dialog Type: " + dialog.type);
            console.log("Dialog Message:  " + dialog.message());
            if (dialog.type === 'beforeunload') {
                console.log("OK: ======> Stay | Leave box appers. Going to accept Leave.");
                await dialog.accept();
            }
            else await dialog.dismiss();
        });


        while (login) {

            await this.philgo_get_post( this.name )
                .then(async post => {
                    this.post = post;
                    if (!this.post || !this.post['subject']) return null;
                    else return await this.submit_form();
                })
                .then(async url => {
                    if ( url ) {
                        await this.philgo_auto_post_log(this.post, 'SUCCESS', this.name, url);
                    }
                })
                .catch(async e => {
                    await this.error('blogger-fail', 'failed: ' + e.message);
                    await this.philgo_auto_post_log(this.post, 'ERROR', this.name, this.url_blog_home);
                })

            await this.sleep(60);
            await this.page.goto( this.url ).catch( async e => this.error( 'blog-failed-goto-home', "failed openning blog after sleep."));
        }
        

    }
    async setPuppeteer() {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        this.set(browser, page);
    }


    


    async submit_form() {

        let $html = await this.jQuery();
        let firstTitle = $html.find('a[href*="#editor/target=post"]').first().text();
        console.log('OK: first title: ' + firstTitle);

        await this.waitInCase(1, "OK: blogger: open_posting_form() begins.");
        await this.page.click('.blogg-button.blogg-primary').then(a => console.log('OK: post button clicked'));

        await this.page.waitFor('.titleField').then(a => console.log('OK: found title box'));
        await this.waitInCase(7);
        await this.page.type('.titleField', this.post['subject']).then(a => console.log('OK: title typed: ' + this.post['subject']));

        this.post['content'] += this.philgoLink();
        await this.page.type('#postingHtmlBox', this.post['content']).then(a => console.log('OK: content typed') );
        await this.waitInCase(2);

        // submit
        await this.page.click('.blogg-button.blogg-primary').then(a => 'OK: post submit button clicked');

        // wait for submit. blogger is SPA.
        await this.waitInCase(12, 'wait after form submitting. it is SPA. so, it is not easy that page has changed.');

        

        let $newHtml = await this.jQuery();
        let afterTitle = $newHtml.find('a[href*="#editor/target=post"]').first().text();
        console.log('OK: new first title after posting: ' + afterTitle);

        if ( firstTitle == afterTitle ) this.error('blogger-posting-failed-after-clicking-post-button', "post failed");
        else console.log("OK: success. post success.");


        let url = $newHtml.find('.blogg-visible-on-select').first().find('a').eq(1).attr('href');

        console.log('OK: post url: ', url);
        
        return url;
    }



    
    async login() {
        console.log("OK: blogger: login() begins");

        // 페이지를 처음 열면, 블로그 첫 페이지에 <frameset><frame name='BlogMain'> 이 있다.
        await this.page.goto(this.url + '/go/signin')
            .then(a => console.log(`OK: blogger: blog login page open: ${this.url}/go/signin`));
        
        await this.page.waitFor('#identifierId').then(a => console.log("OK: blogger: found login form box"));
        await this.waitInCase(3);

        await this.page.type('#identifierId', this.id).then(a => console.log("OK: type id"));
        await this.waitInCase(1);


        await this.page.click('#identifierNext').then(a => console.log("OK: blogger: click id submit button"));
        


        // password
        await this.page.waitFor('input[name="password"]').then(a => console.log("OK: blogger: found password input box"));
        await this.waitInCase(3);
        await this.page.type('input[name="password"]', this.password).then(a => console.log("OK: type password"));
        await this.waitInCase(1);
        await this.page.click('#passwordNext');

        // move to blog home
        await this.page.waitFor("#blogger-app").then(a => console.log("OK: login success"));
        await this.page.waitForNavigation().then(a => console.log("OK: you are now on blog home."))

        // await this.waitInCase(3);
        return true;
    }


    
}



let app = new Blogger();

app.main();
