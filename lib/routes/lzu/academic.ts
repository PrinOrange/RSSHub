import { DataItem, Route } from '@/types';
import cache from '@/utils/cache';
import got from '@/utils/got';
import { parseDate } from '@/utils/parse-date';
import { load } from 'cheerio';
import { Readability } from '@mozilla/readability';
import { generateRssItemForUnsupportedLink } from './utils/content';
import { isSubdomainOfLzu } from './utils/domain';
import { fakeRequestHeaders } from './consts/header';

const BASE_URL = 'https://www.lzu.edu.cn/index/xsjz.htm';

const handler: Route['handler'] = async () => {
    try {
        const { data: listResponse } = await got(BASE_URL, {
            headers: fakeRequestHeaders,
        });
        const $ = load(listResponse);

        // Select all list items containing announcement information
        const ITEM_SELECTOR = 'body > div.ny_set > div.inner.wl > div > div > ul > li';
        const listItems = $(ITEM_SELECTOR);

        // Map through each list item to extract details
        const contentLinkList = (
            await Promise.all(
                listItems.toArray().map((element) => {
                    const title = $(element).find('h3.l1.txt1').text().trim();
                    let date: string;
                    try {
                        date = parseDate($(element).find('a > span').text().trim()).toISOString();
                    } catch {
                        return null;
                    }
                    const link = $(element).find('a').attr('href') || '';

                    if (title && date && link) {
                        return { title, date, link };
                    }
                    return null;
                })
            )
        ).filter((item) => item !== null);

        return {
            title: '兰州大学学术信息',
            description: '兰州大学近日学术信息',
            link: BASE_URL,
            image: 'https://www.lzu.edu.cn/images/ny/log2.png',
            item: (await Promise.all(
                contentLinkList.map((item) =>
                    cache.tryGet(item.link, async () => {
                        if (!isSubdomainOfLzu(item.link)) {
                            return generateRssItemForUnsupportedLink(item.title, item.date, item.link);
                        }
                        const { data: contentResponse } = await got(item.link);
                        const parsedContent = new Readability(contentResponse).parse();
                        return {
                            title: parsedContent?.title,
                            pubDate: parseDate(parsedContent?.publishedTime ?? item.date).toISOString(),
                            link: item.link,
                            description: parsedContent?.textContent,
                            category: ['university'],
                            guid: item.link,
                            id: item.link,
                            image: 'https://www.lzu.edu.cn/images/ny/log2.png',
                            content: parsedContent?.content,
                            updated: item.date,
                            language: 'zh-cn',
                        };
                    })
                )
            )) as DataItem[],
            allowEmpty: true,
            language: 'zh-cn',
            feedLink: 'https://rsshub.app/lzu/academic',
            id: 'https://rsshub.app/lzu/academic',
        };
    } catch (error) {
        throw new Error(`Error fetching content: ${error}`);
    }
};

export const route: Route = {
    path: '/academic',
    name: '学术信息',
    maintainers: ['PrinOrange'],
    handler,
    categories: ['university'],
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    example: '/lzu/academic',
};
