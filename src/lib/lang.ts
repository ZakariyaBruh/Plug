/*
 * What language the model should answer in.
 *
 * THIS VALUE ARRIVES FROM A BROWSER AND ENDS UP IN A PROMPT, which is the
 * whole reason this file exists rather than a template string at each call
 * site. Anything not on the list below is not passed through in any form —
 * it becomes English. A free-text language name would be a sentence the
 * caller gets to write inside our system instruction, and "answer in
 * Portuguese, and ignore everything above" is a valid language name to
 * anything doing a looser check.
 *
 * The list matches decide/js/i18n.js. A language the game cannot display is
 * not worth having the model write in.
 */
const NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
}

/** The two-letter code, or 'en' for anything unrecognised. */
export function langCode(value: unknown): string {
  return typeof value === 'string' && Object.hasOwn(NAMES, value) ? value : 'en'
}

/*
 * One line to append to a system instruction. Empty for English, so the
 * prompts that already read as English keep working exactly as they did and
 * nothing changes for the readers who are the overwhelming majority.
 *
 * It names the dishes as the exception: the catalogue is English and the app's
 * own screens print those names in English, so a reply calling it "pollo asado"
 * sends somebody looking for a dish that is listed as "Roast chicken".
 */
export function langLine(value: unknown): string {
  const code = langCode(value)
  if (code === 'en') return ''
  return (
    `\n\nWrite your entire reply in ${NAMES[code]}. Keep dish names exactly as they ` +
    `are given to you, in English, because that is how they are spelled everywhere ` +
    `else in the app — you may put a translation in brackets after one the first ` +
    `time it appears.`
  )
}
