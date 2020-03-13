const superagent = require('superagent');
const cheerio = require('cheerio');

async function fetchPage(url) {
    return await
        superagent.get(url)
            .set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36')
            .redirects(5)
            .then((res) => {
                return res.body.toString();
            }).catch(err => {
                if (err) {
                    console.log(err);
                }
            });
}


async function fetchJSFromPage() {
    let url = "https://coronavirus.1point3acres.com";
    return await
        superagent.get(url)
            .set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36')
            .redirects(5)
            .then((res) => {
                const $ = cheerio.load(res.text);
                let links = [];
                $("script").map((i, el) => {
                    if (el.attribs.src) {

                        if (el.attribs.src.startsWith("/_next/static/chunks") &&

                            !el.attribs.src.includes("framework") &&
                            !el.attribs.src.includes("common") &&
                            !el.attribs.src.includes("style")


                        ) {
                            let l = url + el.attribs.src;
                            links.push(l);
                        }
                    }
                });
                return links;
            })
            .catch(err => {
                if (err) {
                    console.log(err);
                }
                return [];
            });
}

async function downloadTargetPageFromLinks(links) {
    for (let i = 0; i < links.length; i++) {
        let pagetext = await fetchPage(links[i]);
        if (pagetext) {
            if (pagetext.includes("first confirmed case of US")) {
                return pagetext;
            }
        }
    }
}

async function doit() {
    jsscripts = await fetchJSFromPage();
    pagetext = await downloadTargetPageFromLinks(jsscripts);
    console.log(pagetext);
    process.exit();
}

doit();
