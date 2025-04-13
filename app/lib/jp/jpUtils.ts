export const containsJapaneseCharacters = (input: string): boolean =>
  /[一-龯ぁ-んァ-ンｧ-ﾝﾞﾟ]/g.test(input);
