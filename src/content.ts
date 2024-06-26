import Article from "./article.js";

export interface HeadingArticles {
  heading: string;
  articles: Article[];
}

export default class Content {
  articles: Record<string, HeadingArticles> = {};

  get html(): string {
    let html =
      '<h3>ЗМІСТ</h3>\
			\n<ul>\
			\n\n<a href="/dspace/handle/123456789/XXXXXX">Титульні сторінки та зміст</a><br />\
			\n<a href="/dspace/handle/123456789/XXXXXX">Автори</a>\
			\n\n</ul>';
    const articles = Object.values(this.articles);
    articles.forEach((section, index) => {
      html += `\n<b>${section.heading.toUpperCase()}</b>\n<ul>\n`;
      section.articles.forEach((article, index) => {
        html +=
          `\n<b>${article.authors_str_v2}</b><br/>` +
          `\n<a href="/dspace/handle/123456789/XXXXXX">${article.title}</a>` +
          (index < section.articles.length - 1 ? "<br/><br/>\n" : "\n\n</ul>");
      });
    });
    return html;
  }
}
