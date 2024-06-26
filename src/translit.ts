// правила транслітерації - https://www.kmu.gov.ua/npas/243262567
const rules: { [ua_letter: string]: string } = {
  А: "A",
  а: "a",
  Б: "B",
  б: "b",
  В: "V",
  в: "v",
  Г: "H",
  г: "h",
  Ґ: "G",
  ґ: "g",
  Д: "D",
  д: "d",
  Е: "E",
  е: "e",
  Є: "Ye",
  є: "ie",
  Ж: "Zh",
  ж: "zh",
  З: "Z",
  з: "z",
  И: "Y",
  и: "y",
  І: "I",
  і: "i",
  Ї: "Yi",
  ї: "i",
  Й: "Y",
  й: "i",
  К: "K",
  к: "k",
  Л: "L",
  л: "l",
  М: "M",
  м: "m",
  Н: "N",
  н: "n",
  О: "O",
  о: "o",
  П: "P",
  п: "p",
  Р: "R",
  р: "r",
  С: "S",
  с: "s",
  Т: "T",
  т: "t",
  У: "U",
  у: "u",
  Ф: "F",
  ф: "f",
  Х: "Kh",
  х: "kh",
  Ц: "Ts",
  ц: "ts",
  Ч: "Ch",
  ч: "ch",
  Ш: "Sh",
  ш: "sh",
  Щ: "Shch",
  щ: "shch",
  Ю: "Yu",
  ю: "iu",
  Я: "Ya",
  я: "ia",
  "'": "",
  "’": "",
  ь: "",
  " ": " ",
};

/**
 * Транслітерація українського тексту латиницею
 * @param text_ua український текст
 * @returns текст латиницею
 */
export default function translit(text_ua: string): string {
  let text_en: string = "";

  for (let i = 0; i < text_ua.length; i++) {
    // єдине правило для буквосполучень
    if (
      text_ua[i] === "З" &&
      i < text_ua.length - 1 &&
      text_ua[i + 1] === "г"
    ) {
      text_en += "Zgh";
      i++;
    } else if (
      text_ua[i] === "з" &&
      i < text_ua.length - 1 &&
      text_ua[i + 1] === "г"
    ) {
      text_en += "zgh";
      i++;
    } else {
      // інші летери - за загальним правилом
      if (text_ua[i] in rules) {
        text_en += rules[text_ua[i]];
      } else {
        text_en += "???"; // невідомі символи замінюються на ??? - для відслідковування помилок транслітерації
      }
    }
  }

  return text_en;
}
