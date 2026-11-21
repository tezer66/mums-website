/*
  Site text and settings for HarperHolistic (from the Companion Booklet).
  memberstack: the app ID and the four paid plans in Memberstack (memberstack.com),
  which handles accounts and takes payment through Stripe. These IDs are public;
  never put a secret key in this file, because the whole site is public.
  promo: the welcome code (shared on social media). The real discount is the
  Memberstack discount of the same name, entered on the payment page.
  showOnHomepage: true also shows the code in the homepage plans section.
  previewTools: true shows the "Reset today's card" test button. Set it to false
  (or delete the line) before the site goes live.
*/
window.HH_SITE = {
  "previewTools": true,
  "memberstack": {
    "appId": "app_cmwpxru3200lz0su3hnmd9nw9",
    "plans": {
      "deck-monthly": { "planId": "pln_one-deck-monthly-49m003tz", "priceId": "prc_one-deck-monthly-7vlg002g" },
      "all-monthly":  { "planId": "pln_all-decks-monthly-o4620cv4", "priceId": "prc_all-decks-monthly-84m103co" },
      "deck-yearly":  { "planId": "pln_one-deck-yearly-pom203ad", "priceId": "prc_one-deck-yearly-exm303dq" },
      "all-yearly":   { "planId": "pln_all-decks-yearly-ihlh00ah", "priceId": "prc_all-decks-yearly-71630cov" }
    }
  },
  "promo": { "code": "RIVER", "percent": 20, "note": "20% off your first payment", "showOnHomepage": false },
  "brand": "HarperHolistic",
  "owner": "Gillian Harper",
  "tagline": "Learning to set boundaries is ultimate self care.",
  "about": [
    "This deck was born as I started the deepest inner healing of my life — to save my life! Each card was created as I honestly acknowledged the lesson in my own life. My intention is to share my journey in hope it may help you on yours.",
    "October 2025 I was diagnosed with Stage 4 Cancer. The trauma our family, and all families experience when hearing that word, is life changing. Cancer is silent until it screams!",
    "For 15 years I worked in Wellness in Dubai & Koh Samui - teaching Yoga, Reiki, Sound healing, Hosting Retreats and Full Moon ceremonies. Cancer doesn't care how healthy your lifestyle is - your body will turn a boundary you won't say into a symptom you can't ignore!",
    "Boundaries are the clearest expression of Love you hold for yourself. May this deck encourage you to Speak your truth, Protect what matters to you and finally come home to yourself."
  ],
  "aboutSignoff": "With Love and Respect — Gill",
  "connect": {
    "instagram": "harper.holistic",
    "email": "reikihealinggh@gmail.com",
    "text": "Let’s connect and continue our healing journey. Follow along on Instagram, or email to book a Distant Reiki Healing session."
  },
  "introduction": [
    "Welcome to Boundaries are my Love Language.",
    "This healing inspiration card deck was created for every soul who has struggled to speak uncomfortable truths, set personal boundaries or walk away from situations and relationships that did not have the best intention for your highest good.",
    "This deck is lovingly intended to encourage everyone healing from unhealthy patterns built on silence, blame, or denial — to Reclaim your Voice, Step back into your Power and finally breathe easy with Peace and the Freedom you deserve!",
    "Each card names something most of us have lived through without ever having the words for it. It’s never one incident that makes you say “No more!”, it happens after years of “keeping the peace” and “breaking the ice.”",
    "Cycle breakers are labelled “the problem” because we speak the truth — which makes stepping away feel isolating especially if you’re the first in your Generational line to do it. The guilt you feel from setting a boundary shows how deeply you were trained to abandon yourself.",
    "The purpose of this deck is simple — to support you on your healing journey back to yourself, one truth at a time.",
    "Love Gill x"
  ],
  "howToUse": {
    "intro": "There is no right or wrong way to use this deck. You may like to follow the suggested steps or create your own special ritual.",
    "steps": [
      "Find a quiet place at home or sit outside in nature.",
      "Hold the cards close to your heart, let them feel your heart beat.",
      "Close your eyes and breathe slowly.",
      "Feel yourself connecting.",
      "In your mind and in your heart ask: “What do I need to hear today?”",
      "Shuffle the deck, stop when it feels right.",
      "Allow your intuition to guide you.",
      "Pull 1 or as many cards as you feel called to.",
      "Take your time to sit with each message.",
      "Say the affirmation.",
      "There is no need to rush."
    ],
    "outro": "These cards are for the days when your healing journey feels heavy. Keep the card/s visible all day as a reminder of how far you have come. Keep going! You've got this x"
  },
  "profileQuestions": {
    "stages": [
      "Just beginning",
      "Finding my voice",
      "Setting boundaries",
      "Grieving what was missing",
      "Rebuilding myself",
      "Feeling stronger every day"
    ],
    "areas": [
      "Family",
      "Parents",
      "Siblings",
      "Partner or ex-partner",
      "Friendships",
      "Work",
      "Grief and loss",
      "My health and body",
      "Speaking my truth",
      "Self-worth",
      "Saying no",
      "Letting go"
    ],
    "contact": [
      "Email",
      "Here in my dashboard",
      "Either is lovely"
    ]
  },
  "bookletPdf": "content/booklet/Boundaries_Companion_Booklet.pdf"
};
