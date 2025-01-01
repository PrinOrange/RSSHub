import type { DataItem } from '@/types';

export const generateRssItemForUnsupportedLink = (title: string, date: string, url: string): DataItem => {
    const content = `
<p>
    抱歉，本文章 <u>${title}</u> 来源非兰州大学官方网站，不支持解析。<br/>
    请通过链接查看原文：<a href="${url}">${url}</a>
</p>
<p>
    Sorry, the provenance of article <u>${title}</u> is not from official website of Lanzhou University,
    and it's not supported to parse. <br/>
    Please read the origin website by link: <a href="${url}">${url}</a>
</p>
`;
    return {
        title,
        pubDate: date,
        link: url,
        description: title,
        category: ['university'],
        guid: url,
        id: url,
        image: 'https://www.lzu.edu.cn/images/ny/log2.png',
        content: {
            text: content,
            html: content,
        },
        updated: date,
        language: 'zh-cn',
    };
};
