import Article from "./article.js";

/**
 * Статті, розділені за тематичними розділами
 */
export interface HeadingArticles {
  heading: string; // Назва тематичного розділу
  articles: Article[]; // Статті цього розділу
}

/**
 * Зміст номеру журналу
 */
export default class Content {
  /**
   * Статті, розділені за тематичними розділами (ключ запису співпадає зі значенням heading)
   */
  articles: Record<string, HeadingArticles> = {};

  /**
   * Зміст номеру журналу з html-розміткою
   */
  get html(): string {
    // * Початок змісту
    let html =
      '<h3>ЗМІСТ</h3>\
			\n<ul>\
			\n\n<a href="/dspace/handle/123456789/XXXXXX">Титульні сторінки та зміст</a><br />\
			\n<a href="/dspace/handle/123456789/XXXXXX">Автори</a>\
			\n\n</ul>';

    const articles = Object.values(this.articles);

    // * Тематичні розділи
    articles.forEach((section, _index) => {
      if (section.heading !== "no_data") {
        html += `\n<b>${section.heading.toUpperCase()}</b>`; // тематичний розділ
      }
      html += "\n<ul>\n";

      // * Статті
      section.articles.forEach((article, index) => {
        // * Автор
        if (article.authors_str_v2 !== "no_data") {
          html += `\n<b>${article.authors_str_v2}</b><br/>`;
        }
        // * Назва статті
        html +=
          `\n<a href="/dspace/handle/123456789/XXXXXX">${article.title}</a>` +
          (index < section.articles.length - 1 ? "<br/><br/>\n" : "\n\n</ul>");
      });
    });

    return html;
  }
}
