# HarperHolistic website

Member site for **Boundaries are my Love Language**, Gillian Harper's 44 healing inspiration cards.

A plain static site: no build step. Open `index.html` through any web server, for example:

```bash
python3 -m http.server 8000
```

## Content

All of Gillian's words live in plain files, so the code never needs editing:

| What | Where |
|---|---|
| Boundaries are my Love Language: 44 cards and their guidebook messages | `content/cards.js` |
| Cancer Care Cards: what to say or text, with a Copy button | `content/cancer-care-deck.js` (artwork in `images/cancer-care/`) |
| Mommas Earth Magick: cards, their affirmations and Gillian's fuller words | `content/earth-magick-deck.js` (artwork in `images/earth-magick/`) |
| Momma's Earth Magik: 159 quotes and teachings, kept for the upcoming Earth Magik card deck (not shown on the site yet) | `content/earth-magik.js` |
| About Gillian, connect details, guidebook introduction, how to use the deck, the "about you" question choices | `content/site.js` |
| Card artwork | `images/cards/card-05.webp` … `card-44.webp`, then set `image` on that card |
| Guidebook PDF | `content/booklet/Boundaries_Companion_Booklet.pdf` |

Cards without artwork yet are drawn in the deck's purple-and-gold frame from their message.

## How it works

- **Daily card.** On the dashboard the member shuffles the deck (riffle, cut, riffle),
  the cards fan out face down, and they tap one. It flips to reveal a card chosen at
  random, skipping cards drawn in the past week. **One card per day.** A new card day
  starts at 5am on the member's own device clock (so it follows their time zone);
  until then they see today's card and a countdown to the next one. Change
  `DAY_START_HOUR` in `js/app.js` to move the 5am start. Once live, also enforce
  one draw per day on the server so it can't be bypassed by changing the device clock.
- **Sign in.** Members sign in with the email and password they chose when joining
  (entered twice to confirm). "Keep me signed in" keeps them signed in on that device;
  otherwise they sign in again each time they open the site.
- **Reading.** The card shows next to its guidebook message (stacked on phones).
  Tapping the card opens it full screen (true full screen on Android and desktop,
  an edge-to-edge overlay on iPhone). Tap or swipe down to close.
- **Weekly Reflections.** Seven tiles, one per day; tap any to reread it.
- **Full deck.** Members can browse all 44 cards and their guidebook messages.
- **Card Decks.** Each deck has its own page (`#dashboard` for Boundaries are my Love
  Language, `#earth-magick` for Mommas Earth Magick), reached from the Card Decks menu or
  the switcher at the top of the dashboard. Each deck has its own daily card, Weekly
  Reflections and full-deck grid, and keeps its own card shape. Cancer Care Cards is at `#cancer-care`. To add an Earth Magick card, add its image to
  `images/earth-magick/` and copy an entry in `content/earth-magick-deck.js`.
- **Tell Gillian about you.** After joining, members answer a few optional questions
  (name, birthday, location, where they are in their healing, areas they want support
  with, what's on their heart, what brings them peace, how to be contacted) so Gillian
  can write personal messages. Those appear under "Notes from Gillian" on the dashboard.
- **Plans (AUD).** Monthly per deck A$4.99, Monthly all decks A$9.99, Yearly per deck A$29,
  Yearly full (all decks) A$49. Shown on the home page and chosen when joining.

## Before going live: memberships, payments and profiles

`js/auth.js` is a **preview**: accounts, plans, "about you" answers and card history
are saved in the visitor's own browser. Nothing is charged, Gillian can't see the
answers yet, and the content isn't locked.

To go live, connect a membership service that handles AUD subscriptions through Stripe,
such as Memberstack, Outseta or a WordPress membership plugin:

1. Create four plans in it: Monthly per deck A$4.99, Monthly all decks A$9.99,
   Yearly per deck A$29 and Yearly full A$49.
2. Replace `signUp` / `signIn` / `signOut` / `current` in `auth.js` with its calls,
   and send the chosen plan to its checkout.
3. Save the "about you" answers (`saveProfile`) as member custom fields, or post them
   to a form service that emails Gillian, so she can read them.
4. Load Gillian's personal notes from there in `getNotes`.
5. Save each member's daily draws on the server.
