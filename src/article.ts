import translit from "./translit.js";

/**
 * Конфігурація даних про статтю
 */
export interface ArticleConfig {
  hasAbstract: boolean;
  hasUDC: boolean;
  hasEnVersion: boolean;
  hasSourceList: boolean;
}

export const defaultConfig: ArticleConfig = {
  hasAbstract: false,
  hasUDC: false,
  hasEnVersion: false,
  hasSourceList: false,
};

/**
 * Дані про статтю
 */
export default class Article {
  /**
   * Масив авторів
   */
  authors: string[] | null = null;
  /**
   * Список авторів у форматі І. Б. Прізвище
   */
  authors_str_v1: string = "no_data";
  /**
   * Список авторів у форматі Прізвище І. Б.
   */
  authors_str_v2: string = "no_data";
  /**
   * Прізвище автора англійською
   */
  author_en: string = "no_data";
  /**
   * Назва статті
   */
  title: string = "no_data";
  /**
   * Назва статті англійською
   */
  title_en: string = "no_data";
  /**
   * Сторінки статті у журналі
   */
  pages: string = "no_data";
  /**
   * УДК
   */
  udc: string = "no_data";
  /**
   * Кількість посилань у списку використаної літератури
   */
  sources: number | string = "no_data";
  /**
   * Анотація
   */
  abstracts: string = "no_data";
  /**
   * Анотація англійською
   */
  abstracts_en: string = "no_data";

  config: ArticleConfig;

  /**
   * Дані про статтю
   * @param year Рік номеру журналу
   * @param issueNumber Номер журналу
   * @param section Тематичний розділ статті
   * @param config Конфігурація даних про статтю
   */
  constructor(
    public year: number,
    public issueNumber: string,
    public section: string,
    config: Partial<ArticleConfig> = defaultConfig
  ) {
    this.config = {
      ...defaultConfig,
      ...config,
    };
  }

  /**
   * Опис статті для файлу "Опис-MUE-РРРР-NN"
   */
  get description(): string {
    // * Автори
    let description = "";
    // Якщо англомовна версія сторінки відсутня - Прізвище англійською отримується транслітерацією
    if (
      this.author_en === "no_data" &&
      this.authors &&
      this.authors.length > 0
    ) {
      this.author_en = translit(this.authors[0].split(" ")[0]);
    }
    // Прізвище англійською
    description += this.author_en + "\n";
    // І. Б. Прізвище
    if (this.authors) {
      this.authors_str_v1 = "";
      this.authors.forEach((author, index) => {
        const names = author.split(" ");
        names
          .slice(1)
          .forEach(
            (name, index) =>
              (this.authors_str_v1 += (index !== 0 ? " " : "") + name[0] + ".")
          );
        this.authors_str_v1 += " " + names[0];
        if (this.authors && index < this.authors.length - 1) {
          this.authors_str_v1 += ", ";
        }
      });
    }
    description += this.authors_str_v1 + "\n";
    // Прізвище І. Б.
    if (this.authors) {
      this.authors_str_v2 = "";
      this.authors.forEach((author, index) => {
        const names = author.split(" ");
        this.authors_str_v2 += names[0];
        names
          .slice(1)
          .forEach((name) => (this.authors_str_v2 += " " + name[0] + "."));
        if (this.authors && index < this.authors.length - 1) {
          this.authors_str_v2 += ", ";
        }
      });
    }
    description += this.authors_str_v2 + "\n";

    // * Назви
    description += "\n";
    description += this.title + "\n";
    if (this.config.hasEnVersion) {
      description += this.title_en + "\n";
    }

    // * Бібліогр. опис
    description += "\n";

    description +=
      `${this.title} / ${this.authors_str_v1} // Матеріали до української етнології: Зб. наук. пр. — К.: ІМФЕ ім. М.Т. Рильського НАН України, ${this.year}. — Вип. ${this.issueNumber}. — С. ${this.pages}.` +
      (this.config.hasSourceList ? ` — Бібліогр.: ${this.sources} назв.` : "") +
      ` — укр.\n`;

    // * УДК
    if (this.config.hasUDC) {
      description += "\n";
      description += this.udc + "\n";
    }

    // * Тематичний розділ
    const d_sentences = this.section.toLowerCase().split(". ");
    if (this.section != "no_data" && d_sentences.length > 0) {
      description += "\n";
      d_sentences.forEach(
        (sentence, index) =>
          (d_sentences[index] = sentence[0].toUpperCase() + sentence.slice(1))
      );
      description += d_sentences.join(". ") + "\n";
    }

    // * Анотації
    if (this.config.hasAbstract) {
      description += "\n";
      description += this.abstracts.trim() + "\n\n";
      if (this.config.hasEnVersion) {
        description += this.abstracts_en.trim() + "\n";
      }
    }

    // * роздільник
    description += "\n*****************************\n";

    return description;
  }
}
