import translit from "./translit.js";

export default class Article {
  authors: string[] | null = null;
  authors_str_v1: string = "no_data";
  authors_str_v2: string = "no_data";
  author_en: string = "no_data";
  title: string = "no_data";
  title_en: string = "no_data";
  pages: string = "no_data";
  udc: string = "no_data";
  sources: number | string = "no_data";
  abstracts: string = "no_data";
  abstracts_en: string = "no_data";

  constructor(public year: number, public section: string) {}

  get description(): string {
    // * Автори
    let description = "";
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
    if (this.year === 2018) {
      description += this.title_en + "\n";
    }

    // * Бібліогр. опис
    description += "\n";
    let issueNumber = ""; // номер випуску
    switch (this.year) {
      case 1995:
        issueNumber = "1(4)";
        break;
      case 2002:
        issueNumber = "2(5)";
        break;
      case 2003:
        issueNumber = "3(6)";
        break;
      case 2018:
        issueNumber = "17(20)";
        break;

      default:
        issueNumber = "no_data";
        break;
    }

    description += `${this.title} / ${this.authors_str_v1} // Матеріали до української етнології: Зб. наук. пр. — К.: ІМФЕ ім. М.Т. Рильського НАН України, ${this.year}. — Вип. ${issueNumber}. — С. ${this.pages}. — Бібліогр.: ${this.sources} назв. — укр.\n`;

    // * УДК
    if (this.year === 2018) {
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
    if (this.year === 2018) {
      description += "\n";
      description += this.abstracts;
      description += this.abstracts_en;
    }

    // * роздільник
    description += "\n*****************************\n";

    return description;
  }
}
