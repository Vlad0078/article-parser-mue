import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import Article, { ArticleConfig, defaultConfig } from "./article.js";
import Content from "./content.js";

/**
 * Назва та тематичний розділ статті
 */
interface ContentLinksItem {
  link: string;
  section: string;
}

/**
 * Парсер статей MUE
 */
export default class ArticleParser {
  // посилання на сторінки з випусками журналів та назви кінцевих файлів
  static baseUrl = "https://mue.etnolog.org.ua";

  /**
   * назва файлу з описом статей
   */
  fileName: string;
  /**
   * назва файлу зі змістом номеру журналу
   */
  contentFileName: string;
  /**
   * зміст номеру журналу
   */
  content: Content;

  articleConfig: ArticleConfig;

  /**
   * Парсер статей MUE
   * @param year рік номеру журналу
   * @param issueNumber номер журналу
   * @param path частковий шлях до сторінки номеру журналу
   * @param config Конфігурація даних про статтю
   */
  constructor(
    public year: number,
    public issueNumber: string,
    public path: string,
    config: Partial<ArticleConfig> = defaultConfig
  ) {
    this.content = new Content();

    this.articleConfig = {
      ...defaultConfig,
      ...config,
    };

    this.fileName = `Опис-MUE-${year}-${parseInt(issueNumber)}.txt`;
    this.contentFileName = `Зміст-MUE-${year}-${parseInt(issueNumber)}.txt`;
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
    // * Отримуємо код сторінки
    const url = ArticleParser.baseUrl + this.path;
    const html = await this.getPageData(url);
    if (html) {
      const $ = cheerio.load(html);

      // * Отримуємо посилання та тематичні розділи статей
      const contentLinks: ContentLinksItem[] = [];

      $(".magazine__content__item").each((_index, element) => {
        const section =
          $(element).find("h3").first().text().trim() || "no_data"; // тематичний розід
        $(element)
          .find(".magazine__content__item__link a")
          .each((_index, element) => {
            const link = $(element).attr("href") as string; // посилання на статтю
            contentLinks.push({ link, section });
          });
      });

      // * Очищуємо текстовий файл опису статей
      fs.writeFileSync("output/" + this.fileName, "");

      // * Проходимо по всім статтям та парсимо їх
      for (let i = 0; i < contentLinks.length; i++) {
        await this.parseArticle(
          ArticleParser.baseUrl + contentLinks[i].link,
          i + 1,
          contentLinks[i].section
        );
      }

      // * Записуємо зміст до файлу
      // Зміст формується під час парсингу статей
      fs.writeFileSync("output/" + this.contentFileName, this.content.html);
    } else {
      console.log("Не вдалося завантажити HTML за посиланням", url);
    }
  };

  /**
   * Парсить статтю за посиланням
   * @param url Посилання на статтю
   * @param index Номер статті в журналі
   * @param section Тематичний розділ
   */
  parseArticle = async (url: string, index: number, section: string) => {
    const article = new Article(
      this.year,
      this.issueNumber,
      section,
      this.articleConfig
    );

    // * Отримуємо код сторінки
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
          // * Автори
          i++;
          const authors = fields_text[i].split(", ");
          // Приводимо до Title Case (Автори можуть бути вказані великими літерами)
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
          // * Сторінки
          i++;
          article.pages = fields_text[i];
        } else if (fields_text[i] === "УДК:") {
          // * УДК
          i++;
          article.udc = fields_text[i];
          break;
        }
      }

      if (this.articleConfig.hasAbstract || this.articleConfig.hasSourceList) {
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
        if (this.articleConfig.hasEnVersion) {
          const link_en = $(".lang-inline li a").eq(1).attr("href") as string;
          const html_en = await this.getPageData(
            ArticleParser.baseUrl + link_en
          );

          if (html_en) {
            const $ = cheerio.load(html_en);

            // * Назва
            article.title_en = $("h1").text().trim();

            // * Прізвище першого автора
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
            if (this.articleConfig.hasAbstract) {
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
            }
          } else {
            console.error(
              "Не вдалося завантажити англомовну версію сторінки",
              url
            );
          }
        }
      }

      // * Додаємо статтю до змісту
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
