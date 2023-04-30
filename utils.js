import slugify from 'slugify';
import chalk from 'chalk';

export function cleanFileName(filename) {
  let fixed = slugify(filename, {
    remove: /[/\\?%*:|"<>]/g,
    locale: 'en',
  });
  return fixed;
}
