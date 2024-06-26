import fs from "fs";
import ArticleParser from "./src/parse.js";
import { ArticleConfig } from "./src/article.js";

// * Конфігурація парсера
interface Config {
  year: number;
  issueNumber: string;
  path: string;
  articleConfig: Partial<ArticleConfig>;
}
const config: Config = JSON.parse(
  fs.readFileSync("parser-config.json", "utf-8")
);

const year = config.year; // рік номеру журналу
const issueNumber = config.issueNumber; // номер журналу
const path = config.path; // частковий шлях до сторінки номеру журналу
const articleConfig = config.articleConfig;

// * Привітання
console.log("hello"); // чому б ні

// * Папка для кінцевих файлів
if (!fs.existsSync("output")) {
  fs.mkdirSync("output");
}

// * Парcинг
const articleParser = new ArticleParser(year, issueNumber, path, articleConfig);
articleParser.parseArticles();
