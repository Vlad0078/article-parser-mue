import fs from "fs";
import ArticleParser from "./src/parse.js";

console.log("hello");
fs.mkdirSync("output");

const articleParser = new ArticleParser(2003);
articleParser.parseArticles();
