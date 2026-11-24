# HarperHolistic website

Member site for **Boundaries are my Love Language**, Gillian Harper's 44 healing inspiration cards.

A plain static site: no build step. Open `index.html` through any web server, for example:

```bash
python3 -m http.server 8000
```

## Domain

Live at **https://www.harperholistic.xyz** (GitHub Pages). The `CNAME` file holds the
domain; keep it in the repository. DNS: A records for `@` → 185.199.108.153,
185.199.109.153, 185.199.110.153, 185.199.111.153 and CNAME `www` → tezer66.github.io.


## Memberships and payments (Memberstack + Stripe)

Accounts, passwords and the four paid plans are handled by **Memberstack** (app
`app_cmwpxru3200lz0su3hnmd9nw9`), which takes payment through Stripe. The IDs are in
`content/site.js` (`memberstack`); the code is in `js/auth.js`.

| Plan | Memberstack plan | Price |
|---|---|---|
| All decks, monthly US$9.99 | `pln_all-decks-monthly-o4620cv4` | `prc_all-decks-monthly-qm1bi03hv` |
| All decks, yearly US$59 | `pln_all-decks-yearly-ihlh00ah` | `prc_all-decks-yearly-eb1bj038j` |

- **Complimentary access:** the free plan **Complimentary** (`pln_complimentary-zum603w2`) opens all
  decks. Add it to a member in Memberstack (Members, open the member, Plans, Add). It can't be joined from the site.
- **Joining:** the member picks a plan (and their deck, on a one-deck plan), creates an account,
  then pays on Stripe's checkout. Stripe brings them back to "Tell Gillian about you".
  Someone who signs up but doesn't pay sees a "finish joining" form when they come back.
- **Monthly newsletter:** the join form has a tick-box (on by default). The choice is saved in the member JSON
  (`"newsletter": true`) and in a Memberstack custom field `newsletter` (yes/no) if that field exists.
- **Cancelling:** members email Gillian; cancel their subscription in Stripe (Customers, open the customer,
  cancel subscription at period end). The "Upgrade" buttons open Stripe's customer portal.
- **Forgot your password?** on the sign-in form: Memberstack emails a code.
- **Member data:** daily cards, journal, chosen deck and the "about you" answers are saved in each
  member's **Member JSON** in Memberstack, so they follow the member to any device. Gillian can
  read them in Memberstack (Members, open a member). To write a personal note, add to their
  Member JSON: `"notes": [ { "date": "21 November 2026", "text": "Her message" } ]`.
- **Test Mode:** until the Memberstack plan is upgraded and harperholistic.xyz is added as a live
  domain (Settings, Application domains), payments are Stripe test payments (card 4242 4242 4242 4242).

The old Stripe payment links (created before Memberstack) are no longer used by the site and can
be archived in Stripe.

## Giving back to cancer research

**Yearly membership only:** 20% of every yearly payment (the price paid, before payment fees) is donated to cancer research in Australia by Gillian herself. The promise is in `terms.html` (section 5).
There is no promo code. Monthly has no donation.
Settings: `"giving"` in `content/site.js` (percent, cause, and the charity's name once chosen).

The old **RIVER** discount (Memberstack, Plans, Discounts) should be archived so it can't be used on Stripe's payment page.

**Every month or quarter:**
1. In Stripe, add up the yearly payments received in the period (Payments, filter by the yearly product).
2. Donate 20% of that total to the charity, and keep the receipt.
3. Post the total donated on Instagram or the website (the Terms promise to share it).

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

- **Inner Work and Inner Play.** Two tabs above the deck. Inner Work is the card of the day (below), saved to the journal and Weekly Reflections. Inner Play lets members shuffle and pull as many cards as they like, with each card's message; nothing is saved.
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
- **My Journal.** Members write private reflections on the dashboard. The card they drew
  that day is attached automatically (they can remove it), with a rotating writing prompt.
  Entries appear under the card they belong to: tap a card in Weekly Reflections (or today's card) to see
  what was written that day, and edit or delete it there. The whole journal can be downloaded (Word or text) or printed / saved as PDF.
  Saved to the member's Memberstack account.
- **Weekly Reflections.** Seven tiles, one per day, in weeks that start on the day the member drew their first card from that deck (day 1), then a new week every 7 days. Tap any card to reread it.
- **Full deck.** Members can browse all 44 cards and their guidebook messages.
- **Card Decks.** Each deck has its own page (`#dashboard` for Boundaries are my Love
  Language, `#earth-magick` for Mommas Earth Magick), reached from the Card Decks menu or
  the switcher at the top of the dashboard. Each deck has its own daily card, Weekly
  Reflections and full-deck grid, and keeps its own card shape. Cancer Care Cards is at `#cancer-care`. To add an Earth Magick card, add its image to
  `images/earth-magick/` and copy an entry in `content/earth-magick-deck.js`.
- **Tell Gillian about you.** Notes from Gillian are part of the **yearly** plans (and Complimentary). Monthly members see an "Upgrade to yearly" note instead, and go straight to their cards after paying. After joining a yearly plan, members answer a few optional questions
  (name, birthday, location, where they are in their healing, areas they want support
  with, what's on their heart, what brings them peace, how to be contacted) so Gillian
  can write personal messages. Those appear under "Notes from Gillian" on the dashboard.
- **One-deck plans.** Members choose their deck when joining; it opens on their dashboard after payment and each time they sign in, on any device.
- **Plans (USD).** One deck monthly US$9.99, all decks monthly US$19.99, one deck yearly US$59,
  all decks yearly US$99. Shown on the home page and chosen when joining.

## Before going live

1. Upgrade the Memberstack plan, add `www.harperholistic.xyz` as a live app domain and switch to Live Mode.
2. In Stripe, turn on the customer portal and check business details, branding and receipts.
3. Terms (`terms.html`) and privacy policy (`privacy.html`) are live; their links are set in the Stripe customer portal. Update the date at the top when you change them.
