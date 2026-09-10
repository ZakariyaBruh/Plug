/*
 * The shape of what vite.config.ts's recipeBook() plugin inlines.
 *
 * Kept in step with Recipe in lib/recipes.ts by hand, because a virtual module
 * has no source file for TypeScript to infer from. If a field is added to a
 * recipe in public/decide/js/recipes.js, both of these want it.
 */
declare module 'virtual:recipe-book' {
  const book: Record<
    string,
    Array<{
      name: string
      time: number
      serves: number
      level: string
      ingredients: string[]
      steps: string[]
    }>
  >
  export default book
}
