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
- **Joining:** the member picks monthly or yearly, creates an account, then pays on Stripe's checkout.
  Stripe brings them back to their cards. Someone who signs up but doesn't pay sees a "finish joining" form
  when they come back.
- **Monthly newsletter:** the join form has a tick-box (on by default). The choice is saved in the member JSON
  (`"newsletter": true`) and in a Memberstack custom field `newsletter` (yes/no) if that field exists.
- **Cancelling:** members email Gillian; cancel their subscription in Stripe (Customers, open the customer,
  cancel subscription at period end). The "Upgrade" buttons open Stripe's customer portal.
- **Forgot your password?** on the sign-in form: Memberstack emails a code.
- **Member data:** the daily card and journal are saved in each member's **Member JSON** in Memberstack, so
  they follow the member to any device.
- **Test Mode:** until the Memberstack plan is upgraded and harperholistic.xyz is added as a live
  domain (Settings, Application domains), payments are Stripe test payments (card 4242 4242 4242 4242).

The old Stripe payment links (created before Memberstack) are no longer used by the site and can
be archived in Stripe.

## Giving back to cancer research

**Yearly membership only:** US$5 from every yearly membership payment is donated to cancer research by Gillian herself. The promise is in `terms.html` (section 5).
There is no promo code. Monthly has no donation.
Settings: `"giving"` in `content/site.js` (amount, cause, and the charity's name once chosen).

The old **RIVER** discount (Memberstack, Plans, Discounts) should be archived so it can't be used on Stripe's payment page.

**Every month or quarter:**
1. In Stripe, add up the yearly payments received in the period (Payments, filter by the yearly product).
2. Donate US$5 for each yearly payment received (for example 12 payments = US$60), and keep the receipt.
3. Post the total donated on Instagram or the website (the Terms promise to share it).

## Newsletter

Issues live in `content/newsletter/`: an email version (`issue-01-full-moon-boundary-ritual.html`, paste it into
the email tool; it uses `{$unsubscribe}` for MailerLite) and a PDF. To link a PDF from the site, set
`"newsletterPdf"` in `content/site.js`. Images load from `www.harperholistic.xyz/content/newsletter/img/`.

## Visitor statistics and tracked links

Statistics are off until a Plausible account exists for harperholistic.xyz: set `"analytics": { "provider":
"plausible", ... }` in `content/site.js` and add a line to `privacy.html`. Give each post its own link, e.g.
`https://www.harperholistic.xyz/?utm_source=instagram&utm_medium=reel&utm_campaign=launch`, and Plausible shows which
posts bring visitors.

## Speed and search

- Small card pictures (the full deck, Weekly Reflections, journal) use 320 px thumbnails in `images/sm/`; the full-size
  card opens only when a card is drawn or enlarged. After adding a card image, make its thumbnail the same way
  (320 px wide webp in the matching `images/sm/` folder). A missing thumbnail falls back to the full image.
- The homepage uses 520 px thumbnails in `images/thumbs/`.
- The video downloads only when it is about to be seen, Memberstack's script loads deferred, and the Google Fonts
  load without blocking the first paint.
- `robots.txt`, `sitemap.xml` and `404.html` are in the root.

## Content

All of Gillian's words live in plain files, so the code never needs editing:

| What | Where |
|---|---|
| Boundaries are my Love Language: 44 cards and their guidebook messages | `content/cards.js` |
| Cancer Care Cards: what to say or text, with a Copy button | `content/cancer-care-deck.js` (artwork in `images/cancer-care/`) |
| Momma’s Earth Magick: cards, their affirmations and Gillian's fuller words | `content/earth-magick-deck.js` (artwork in `images/earth-magick/`) |
| Momma's Earth Magik: 159 quotes and teachings, kept for the upcoming Earth Magik card deck (not shown on the site yet) | `content/earth-magik.js` |
| About Gillian, connect details, guidebook introduction, how to use the deck | `content/site.js` |
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
  Language, `#earth-magick` for Momma’s Earth Magick), reached from the switcher at the top of the dashboard. Each deck has its own daily card, Weekly
  Reflections and full-deck grid, and keeps its own card shape. Cancer Care Cards is at `#cancer-care`. To add an Earth Magick card, add its image to
  `images/earth-magick/` and copy an entry in `content/earth-magick-deck.js`.
- **Plans (USD).** All decks monthly US$9.99 or all decks yearly US$59. Both include every deck, Cancer Care
  Cards included. Shown on the home page and chosen when joining.

## Phone app (iOS and Android)

The `app/` folder is the HarperHolistic app for iPhone and Android, made with Capacitor. The app opens
this same website (`https://www.harperholistic.xyz/?app=1`) inside a native shell, so it looks the same
and members' cards, journal and history are shared between the website and the app. Website changes
show up in the app straight away, without a new app release.

In the app (`?app=1`):
- There is no homepage and no buying. Apple and Google require their own in-app payments for digital
  subscriptions, so people join on the website and only sign in in the app. A signed-in account with
  no membership sees "No active membership" with no buy link.
- "Your account" at the bottom of each deck page has a daily reminder (a phone notification at a time
  they choose) and "Delete my account", which Apple and Google require. Delete is on the website too.
- With no internet, the app shows a branded "You're offline" page (`app/www/offline.html`).

Building and publishing (needs a Mac for iPhone):
1. Install Node.js, Xcode (Mac App Store) and Android Studio.
2. In `app/`: `npm install`, then `npx cap sync`.
3. iPhone: `npx cap open ios`, choose your Apple team under Signing, then Product → Archive and upload
   to App Store Connect. Needs an Apple Developer account (US$99 a year).
4. Android: `npx cap open android`, then Build → Generate Signed App Bundle and upload to Google Play
   Console. Needs a Google Play developer account (US$25 once).
5. Icons and splash screens come from `app/assets/`; after changing them run `npm run assets`.

For the store listings you need: screenshots, a short description, the privacy policy link
(`https://www.harperholistic.xyz/privacy.html`), a support email, and a demo member account (email and
password with an active membership) so the reviewers can sign in.

## Before going live

1. Upgrade the Memberstack plan, add `www.harperholistic.xyz` as a live app domain and switch to Live Mode.
2. In Stripe, turn on the customer portal and check business details, branding and receipts.
3. Terms (`terms.html`) and privacy policy (`privacy.html`) are live; their links are set in the Stripe customer portal. Update the date at the top when you change them.
