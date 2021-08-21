export default (url, joiner = '-') => {
  const result = url
    .replace(new URL(url).protocol, '')
    .split(/[^\d\sA-Z]/gi)
    .filter((el) => el !== '')
    .join(joiner);

  return result;
};
