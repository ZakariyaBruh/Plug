import { useCallback, useEffect, useMemo, useState } from 'react'

import { DISH_COUNT, track } from '#/lib/site'
import {
  PREVIEW_DISHES,
  PREVIEW_QUESTIONS,
  REAL_QUESTIONS,
  decide,
  replyWords,
  steersFor,
  stillStanding,
  withSteer,
  type Answers,
  type PreviewTag,
  type Reply,
  type Steer,
} from '#/lib/preview'

/*
 * THE PLAYABLE BIT OF THE LANDING PAGE.
 *
 * Five either-ors and one answer, on the page rather than one click away. The
 * engine and the dishes are in lib/preview.ts, which is pure and has no idea a
 * browser exists; everything here is the screen.
 *
 * THE SHAPE IS BORROWED FROM THE APP ON PURPOSE. Two big cards side by side, a
 * number and an icon on each, "either, honestly" underneath, a count of what is
 * still in play, one answer at the end. Somebody who plays this and then taps
 * through should recognise the second screen from the first — that is the whole
 * job of a preview, and a preview that looks like a different product is an
 * advert for a different product.
 *
 * WHAT IT DOES NOT DO. No streak, no XP, no clock, no saving, and nothing
 * written to the device: this is a thing to try, not an account to start. The
 * real one is behind one button at the end, and the end says honestly how much
 * bigger it is.
 */

/** A number and a word, so the count reads as a sentence rather than a gauge. */
function saying(left: number): string {
  if (left === 1) return 'One dish left. That is your answer.'
  if (left <= 3) return `Down to ${left}. Nearly there.`
  return `${left} dishes still in play.`
}

export function GamePreview() {
  const [answers, setAnswers] = useState<Answers>({})
  const [at, setAt] = useState(0)
  const [done, setDone] = useState(false)
  /* What the last steer said back, so the answer acknowledges being pointed. */
  const [said, setSaid] = useState<string | null>(null)
  /*
   * Axes already pushed. Without this the direction you just took gets offered
   * straight back to you — every answer here is stated, so a steer flips one,
   * and the flip is itself flippable. Two taps and you are back where you were,
   * which reads as a broken toy rather than as steering. One push per axis.
   */
  const [pushed, setPushed] = useState<PreviewTag[]>([])

  const question = PREVIEW_QUESTIONS[at]
  const left = useMemo(() => stillStanding(answers).length, [answers])
  const verdict = useMemo(() => (done ? decide(answers) : null), [done, answers])
  const steers = useMemo(
    () =>
      verdict
        ? steersFor(answers, verdict.dish)
            .filter((pick) => !pushed.includes(pick.tag))
            .slice(0, 3)
        : [],
    [answers, pushed, verdict],
  )

  const answer = useCallback(
    (said: Reply) => {
      if (done) return
      const next = { ...answers, [PREVIEW_QUESTIONS[at].tag]: said }
      setAnswers(next)
      setSaid(null)
      setPushed([])
      if (at + 1 < PREVIEW_QUESTIONS.length) {
        setAt(at + 1)
        return
      }
      setDone(true)
      // The one thing worth measuring here: somebody played the preview all the
      // way to an answer. Whether they then went through is the funnel's job.
      track('preview_finished', { dish: decide(next).dish.name })
    },
    [answers, at, done],
  )

  const again = useCallback(() => {
    setAnswers({})
    setAt(0)
    setDone(false)
    setSaid(null)
    setPushed([])
  }, [])

  /*
   * POINTING, WHICH IS THE WHOLE PRODUCT.
   *
   * An answer you can only accept or refuse is a machine saying no at you. One
   * you can push — lighter, hotter, sooner — is the thing this app actually
   * does, so the preview has to do it too or it is advertising the old version.
   * A steer changes one answer and re-decides; nothing is thrown away and the
   * count of what is still standing moves with it.
   */
  const steer = useCallback(
    (pick: Steer) => {
      const next = withSteer(answers, pick)
      setAnswers(next)
      setSaid(pick.said)
      setPushed((was) => [...was, pick.tag])
      track('preview_steered', { toward: pick.label, dish: decide(next).dish.name })
    },
    [answers],
  )

  /*
   * The keyboard, because the app plays entirely from the keyboard and a
   * preview that does not is a preview of something slightly worse. 1 and 2
   * are the cards, the arrows are the same two, 3 or E is "either".
   *
   * Bound on the document rather than on the cards: the interesting case is
   * somebody who has scrolled to this section and not clicked into it, and
   * requiring focus on a particular button first would mean the keys work only
   * after the mouse has been used. Nothing fires once the answer is up, and
   * nothing fires while somebody is typing in a field elsewhere on the page.
   */
  useEffect(() => {
    if (done) return
    function onKey(event: KeyboardEvent) {
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return

      const key = event.key.toLowerCase()
      if (key === '1' || key === 'arrowleft') answer('yes')
      else if (key === '2' || key === 'arrowright') answer('no')
      else if (key === '3' || key === 'e') answer('either')
      else return
      event.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [answer, done])

  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-raised)] py-16" id="try-it">
      <div className="mx-auto max-w-3xl px-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
          Try it here
        </p>
        <h2 className="mt-2 text-3xl font-bold">
          {done ? 'Now push it around.' : 'Five questions. One answer.'}
        </h2>
        <p className="mt-3 max-w-xl text-[var(--text-dim)]">
          {done
            ? 'Not quite it? Point it lighter, hotter, sooner — it answers again. That is the whole app: you never have to know what you want, only which way to lean.'
            : `A short version of the real thing — five of its questions over ${PREVIEW_DISHES.length} of its ${DISH_COUNT} dishes. Nothing is saved and there is nothing to fill in.`}
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 sm:p-8">
          {!done && question ? (
            <>
              {/* Where we are, and how much is left — the app shows both, and
                  the shrinking number is the thing people say they like. */}
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-dim)]">
                  Question {at + 1} of {PREVIEW_QUESTIONS.length}
                </p>
                <p aria-live="polite" className="text-xs text-[var(--text-dim)]">
                  {saying(left)}
                </p>
              </div>

              <ol className="mt-3 flex gap-1.5" aria-hidden="true">
                {PREVIEW_QUESTIONS.map((q, i) => (
                  <li
                    key={q.tag}
                    className={`h-0.5 w-7 rounded-full ${
                      i === at
                        ? 'bg-[var(--amber)]'
                        : i < at
                          ? 'bg-[var(--amber)] opacity-40'
                          : 'bg-[var(--border)]'
                    }`}
                  />
                ))}
              </ol>

              <h3 className="mt-6 text-2xl font-bold sm:text-3xl">{question.text}</h3>

              {/* Two cards, a hairline between them, the way the app deals a
                  pair. The grid is 1-up on a phone so neither card is ever too
                  narrow to hold its own label. */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ['yes', question.yes, question.yesIcon, '01'],
                    ['no', question.no, question.noIcon, '02'],
                  ] as const
                ).map(([said, label, icon, number]) => (
                  <button
                    key={said}
                    type="button"
                    onClick={() => answer(said)}
                    className="group flex min-h-[7.5rem] items-start gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-raised)] p-5 text-left hover:border-[var(--amber)] hover:bg-[var(--amber-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
                  >
                    <span className="text-xs font-semibold text-[var(--text-dim)] group-hover:text-[var(--amber)]">
                      {number}
                    </span>
                    <span>
                      <span className="block text-2xl" aria-hidden="true">
                        {icon}
                      </span>
                      <span className="mt-2 block text-lg font-semibold">{label}</span>
                    </span>
                  </button>
                ))}
              </div>

              {/* The third reply. It is in the real game and it is the reason
                  the questions never feel like a form: you are allowed not to
                  mind, and saying so costs nothing. */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => answer('either')}
                  className="text-sm text-[var(--text-dim)] underline underline-offset-4 hover:text-[var(--text)]"
                >
                  Either, honestly
                </button>
                {/* Not on a phone. The keys work wherever there are keys,
                    but offering them to a thumb is clutter on the screen with
                    the least room for it. */}
                <p className="hidden text-xs text-[var(--text-dim)] sm:block">
                  Or press <kbd className="font-semibold">1</kbd> /{' '}
                  <kbd className="font-semibold">2</kbd> /{' '}
                  <kbd className="font-semibold">3</kbd>
                </p>
              </div>
            </>
          ) : verdict ? (
            <div className="fade-in-up text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--amber)]">
                {said ?? 'You should eat'}
              </p>
              <p className="mt-4 text-6xl" aria-hidden="true">
                {verdict.dish.icon}
              </p>
              {/* aria-live so the answer is announced rather than silently
                  replacing the question for anybody not watching the screen. */}
              <h3 className="mt-3 text-3xl font-bold" aria-live="polite">
                {verdict.dish.name}
              </h3>
              <p className="mx-auto mt-3 max-w-md text-[var(--text-dim)]">{verdict.dish.blurb}</p>

              {/* Said out loud, because the real game says it and because an
                  answer that quietly ignored one of five answers is worse than
                  one that admits which. Only one of the thirty-two ways
                  through gets here. */}
              {verdict.letGo.length > 0 ? (
                <p className="mx-auto mt-5 max-w-md rounded-xl border border-[var(--border)] px-4 py-3 text-sm text-[var(--text-dim)]">
                  <b className="text-[var(--text)]">Had to let one go: </b>
                  {verdict.letGo
                    .map((tag) => replyWords(tag, answers[tag] ?? 'either').toLowerCase())
                    .join(', ')}
                  . Nothing on the menu is all five of those at once.
                </p>
              ) : null}

              {/*
                  POINT IT SOMEWHERE. Up to three directions, each one a real
                  answer changed and the whole thing decided again — not a
                  shortlist, not a "no thanks". The directions offered are only
                  the ones that would actually move: a dish already crunchy is
                  never offered crunchier.
              */}
              {steers.length > 0 ? (
                <div className="mt-7">
                  <p className="text-sm text-[var(--text-dim)]">Close? Point me somewhere.</p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2.5">
                    {steers.map((pick) => (
                      <button
                        key={pick.tag}
                        type="button"
                        onClick={() => steer(pick)}
                        className="rounded-full border border-[var(--border)] bg-[var(--bg-raised)] px-5 py-2.5 text-sm font-semibold hover:border-[var(--amber)] hover:bg-[var(--amber-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--amber)]"
                      >
                        {pick.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Five axes, five pushes, then this preview has nothing left to
                   lean on — which is a fact about the trailer, not the app, and
                   saying so is better than the row quietly vanishing. */
                <p className="mt-7 text-sm text-[var(--text-dim)]">
                  That is every direction this little version has. The real one has more of them,
                  and more menu to move through.
                </p>
              )}

              {/*
                  THE HOOK, AND WHY IT IS A YES RATHER THAN A "PLAY MORE".
                  Most people who got an answer here left with it: the only
                  button said "play the real one", which asks somebody who
                  has just been answered to start again. Saying yes to the
                  dish should take them to the dish — its recipe, what goes
                  in it, somewhere nearby that does it — in the real app, so
                  the tap that agrees is also the one that shows them what
                  else is there. Free, and it says so.
              */}
              <div className="mt-8 border-t border-[var(--border)] pt-8">
                <a
                  href={`/decide/?dish=${encodeURIComponent(verdict.dish.name)}`}
                  onClick={() => track('preview_to_app', { dish: verdict.dish.name, via: 'the_one' })}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
                >
                  That&rsquo;s the one <span aria-hidden="true">→</span>
                </a>
                <p className="mx-auto mt-3 max-w-md text-sm text-[var(--text-dim)]">
                  Opens the recipe for {verdict.dish.name.toLowerCase()} and a search for it near
                  you. Free — no account.
                </p>
                <p className="mx-auto mt-6 max-w-md text-[var(--text-dim)]">
                  That was five of {REAL_QUESTIONS} questions over a fifth of the menu. The real one
                  has <b className="text-[var(--text)]">{DISH_COUNT} dishes</b>, a recipe behind
                  every one of them, more directions to push in, and it remembers what you picked.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="/decide/"
                    onClick={() => track('preview_to_app', { dish: verdict.dish.name, via: 'play' })}
                    className="inline-block rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold hover:border-[var(--amber)]"
                  >
                    Play the real one
                  </a>
                  <button
                    type="button"
                    onClick={again}
                    className="rounded-full border border-[var(--border)] px-6 py-3 text-sm font-semibold hover:border-[var(--amber)]"
                  >
                    Go again
                  </button>
                </div>
                <p className="mt-5 text-sm text-[var(--text-dim)]">
                  No account, no email. It opens on a question.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
