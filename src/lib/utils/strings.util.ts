const capitalize = <T extends string>(s: T) =>
  ((s.at(0)?.toUpperCase() ?? "") + s.slice(1)) as Capitalize<T>;

const pluralize = (str: string, count: number, override?: string) =>
  count === 1 ? str : (override ?? str + "s");

// SOURCE: https://stackoverflow.com/questions/1053902/how-to-convert-a-title-to-a-url-slug-in-jquery
const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");

const ellipsify = (str: string, max_length: number) =>
  str.length > max_length ? str.slice(0, max_length) + "..." : str;

export const Strings = {
  pluralize,
  capitalize,
  ellipsify,

  slugify,
};
