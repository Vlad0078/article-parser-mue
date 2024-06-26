import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import Article from "./article.js";
import Content from "./content.js";

/**
 * Назва та тематичний розділ статті
 */
interface ContentLinksItem {
  link: string;
  section: string;
}

export default class ArticleParser {
  // посилання на сторінки з випусками журналів та назви кінцевих файлів
  static baseUrl = "https://mue.etnolog.org.ua";

  path: string;
  fileName: string;
  contentFileName: string;
  content: Content;

  /**
   *
   * @param year рік випуску журналу
   */
  constructor(public year: number) {
    this.content = new Content();
    switch (year) {
      case 1995:
        this.path = "/arkhiv-zhurnalu/1995-rik/1-4";
        this.fileName = "Опис-MUE-1995-1.txt";
        this.contentFileName = "Зміст-MUE-1995-1.txt";
        break;
      case 2002:
        this.path = "/arkhiv-zhurnalu/2002-rik/2-5";
        this.fileName = "Опис-MUE-2002-2.txt";
        this.contentFileName = "Зміст-MUE-2002-2.txt";
        break;
      case 2003:
        this.path = "/arkhiv-zhurnalu/2003-rik/3-6";
        this.fileName = "Опис-MUE-2003-3.txt";
        this.contentFileName = "Зміст-MUE-2003-3.txt";
        break;
      case 2018:
        this.path = "/arkhiv-zhurnalu/2018-rik/17-20";
        this.fileName = "Опис-MUE-2018-17.txt";
        this.contentFileName = "Зміст-MUE-2018-17.txt";
        break;

      default:
        this.path = "no_data";
        this.fileName = "no_data";
        this.contentFileName = "no_data";
        break;
    }
  }

  /**
   * Завантажує html-код сторінки
   * @param url посилання на сторінку
   * @returns html-код сторінки
   */
  getPageData = async (url: string) => {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error: any) {
      console.error("Помилка завантаження сторінки:", error.message);
      return null;
    }
  };

  /**
   * Парсить усі статті з випуску журналу
   */
  parseArticles = async () => {
    const url = ArticleParser.baseUrl + this.path;
    const html = await this.getPageData(url);
    if (html) {
      const $ = cheerio.load(html);

      // Отримуємо посилання на статті
      const contentLinks: ContentLinksItem[] = [];

      $(".magazine__content__item").each((_index, element) => {
        const section =
          $(element).find("h3").first().text().trim() || "no_data";
        $(element)
          .find(".magazine__content__item__link a")
          .each((_index, element) => {
            const link = $(element).attr("href") as string;
            contentLinks.push({ link, section });
          });
      });

      // Очищуємо текстовий файл опису статей
      fs.writeFileSync("output/" + this.fileName, "");

      // * Прохід по всім статтям
      for (let i = 0; i < contentLinks.length; i++) {
        await this.parseArticle(
          ArticleParser.baseUrl + contentLinks[i].link,
          i + 1,
          contentLinks[i].section
        );
      }

      // * Запис змісту до файлу
      fs.writeFileSync("output/" + this.contentFileName, this.content.html);
    } else {
      console.log("Не вдалося завантажити HTML за посиланням", url);
    }
  };

  /**
   * Парсить статтю за посиланням
   * @param url Посилання на статтю
   * @param index Номер статті в журналі
   */
  parseArticle = async (url: string, index: number, section: string) => {
    const article = new Article(this.year, section);

    const html = await this.getPageData(url);
    if (html) {
      const $ = cheerio.load(html);

      // * Назва
      article.title = $("h1").text().trim();

      // * Автори, сторінки, УДК
      const fields_text: string[] = [];
      $(".article__fields .row div").each((_index, element) => {
        fields_text.push($(element).text().trim());
      });

      for (let i = 0; i < fields_text.length; i++) {
        if (fields_text[i] === "Автори публікації:") {
          i++;
          const authors = fields_text[i].split(", ");
          // Приводимо до Title Case
          for (let i = 0; i < authors.length; i++) {
            const names = authors[i].split(" ");
            names.forEach((name, index) => {
              names[index] =
                name[0].toUpperCase() + name.slice(1).toLowerCase();
            });
            authors[i] = names.join(" ");
          }
          article.authors = authors;
        } else if (fields_text[i] === "Стор.:") {
          i++;
          article.pages = fields_text[i];
        } else if (fields_text[i] === "УДК:") {
          i++;
          article.udc = fields_text[i];
          break;
        }
      }

      if (this.year === 2018) {
        // * К-ть джерел та анотація
        $(".article__body h3").each((_index, element) => {
          if ($(element).text().trim() === "Джерела та література") {
            const nextList = $(element).next("ol");
            if (nextList.length) {
              article.sources = $(nextList).find("li").length;
            }
          } else if ($(element).text().trim() === "Анотація") {
            article.abstracts = "";
            let next = $(element).next();
            while (next.is("p")) {
              article.abstracts += $(next).text().trim() + "\n";
              next = next.next();
            }
          }
        });

        // * Англомовна версія сторінки
        const link_en = $(".lang-inline li a").eq(1).attr("href") as string;
        const html_en = await this.getPageData(ArticleParser.baseUrl + link_en);

        if (html_en) {
          const $ = cheerio.load(html_en);

          // * Назва
          article.title_en = $("h1").text().trim();

          // * Перший автор
          const fields_text: string[] = [];
          $(".article__fields .row div").each((_index, element) => {
            fields_text.push($(element).text().trim());
          });

          for (let i = 0; i < fields_text.length; i++) {
            if (fields_text[i] === "The authors of the publication:") {
              i++;
              article.author_en = fields_text[i].split(/ |,/)[0];
              break;
            }
          }
          // * Анотація
          $(".article__body h3").each((_index, element) => {
            if ($(element).text().trim() === "Abstract") {
              article.abstracts_en = "";
              let next = $(element).next();
              while (next.is("p")) {
                article.abstracts_en += $(next).text().trim() + "\n";
                next = next.next();
              }
            }
          });
        } else {
          console.error(
            "Не вдалося завантажити англомовну версію сторінки",
            url
          );
        }
      }

      // * Додаємо до змісту
      if (article.section in this.content.articles) {
        this.content.articles[article.section].articles.push(article);
      } else {
        this.content.articles[article.section] = {
          heading: article.section,
          articles: [article],
        };
      }

      // * Запис опису статті до файлу
      fs.appendFileSync(
        "output/" + this.fileName,
        index + ")\n" + article.description
      );
    } else {
      console.error("Не вдалося завантажити HTML за посиланням", url);
    }
  };
}
