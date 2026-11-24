# Gidana: Brand Positioning (v1.0)

**Status:** APPROVED by founder on 2026-11-24 (Option A). See `docs/decision-log.md` ADR-001 to ADR-004
**Date:** 2026-11-24
**Sources used:** `README.md`, `docs/monetization-flow.md`, `src/i18n/locales/fr.json` (onboarding, home, plans copy), `src/utils/theme.ts`. No market research, competitor analysis or user interviews exist in the repo, so everything about the market below is a **hypothesis** until it is checked.

---

## 1. What we know (confirmed from the product)

| Area | Fact | Source |
|---|---|---|
| Category | Mobile app for finding property to rent or buy (studio, apartment, house) | README |
| Geography | **Launch city: Abidjan, Côte d'Ivoire** (ADR-005). French first, priced in XOF | Founder, `fr.json` |
| Core flows | Filter by neighbourhood, price, type and rooms; photo galleries; favourites; search alerts; in-app chat with the owner; reviews; wallet and bill payments | README, code |
| Two-sided | Seekers (*locataires/acheteurs*) and listers: **independent owners and agencies** (ADR-006) | Founder, `monetization-flow.md` |
| Business model | Freemium. Seekers send 1 free message per property, owner replies are blurred until they pay (Essentiel 1 500 XOF/month, Pro 4 000 XOF/month). Landlords: Free / Standard 3 000 / Agence 10 000 XOF per month | `monetization-flow.md` |
| Visual | Primary colour deep green `#0d5c03`, Poppins font | `theme.ts` |
| Name | "Gidana" = **"my home"** in Hausa | Founder confirmed |

## 2. Unknowns (items 1, 4 and 2 resolved by ADR-005/006/007)

1. **Launch market:** which country and city come first (Niamey? Dakar? both?). The tone, examples and proof all depend on it.
2. **Verification:** is there an actual process for checking listings and owners (ID check, site visit, title check)? Today the "Badge vérifié" is part of the paid Standard landlord plan.
3. **Supply:** how many live listings are there, in which neighbourhoods?
4. **Primary customer:** who pays first, seekers or landlords? And are agencies a target or a competitor?
5. **Alternatives:** how people find housing today (assumed: *démarcheurs/coxeurs* charging visit or commission fees, Facebook/WhatsApp groups, walking around neighbourhoods, agencies, classifieds). **Not validated.** Next step: run `/competitor-analysis` and `/customer-personas`.

## 3. Claims audit (current copy)

Several claims already in the app cannot be backed up by anything in the codebase. They are a trust and consumer-protection risk and should be fixed whatever direction is chosen.

| Current claim (fr.json / README) | Evidence found | Risk | Recommendation |
|---|---|---|---|
| "Des milliers d'annonces vérifiées" | None (no listing count, no verification process) | **High**: false quantity and quality claim | Remove. Use a real number per city once one exists |
| "Visites virtuelles disponibles" | No virtual-tour feature found | **High**: feature does not exist | Remove until it ships |
| "Assistance juridique incluse" | None | **High**: implies a legal service | Remove |
| "Gestion administrative automatisée" / "On s'occupe de tout" / "Nous gérons toutes les formalités" | Contract tracking exists, nothing on formalities | **High**: overpromise | Replace with "Suivez vos contrats et paiements au même endroit" |
| "Propriétaires vérifiés" (README) / "Badge vérifié" sold in the Standard plan | The badge is bought, not earned through a check | **High**: "verified" that is really "paid" misleads seekers | Rename to "Annonce mise en avant" / "Pro", **or** add a real verification step before using the word |
| "Réserver" button | Only starts a chat, no reservation is made | Medium: misleading label | Rename to "Contacter le propriétaire" |
| Blurred owner reply + automatic paywall | Shipped as designed | Medium: if seekers learn the limit only *after* messaging, it reads as a bait-and-switch and goes against a trust brand | State the limit *before* the first message ("1 message gratuit, réponses visibles avec Essentiel"). Check local consumer law on disclosing paid features up front |
| "Trouver un studio n'a jamais été aussi simple" | Subjective | Low | Fine as tone, but weak because it is generic |

## 4. Positioning options

### Option A: "Search from your phone, not on foot" (time and effort) ⭐ recommended
- **For** young workers, students and families looking for a rental in the city
- **who** waste days visiting neighbourhoods, ringing numbers found on walls and paying visit fees for places that don't match their budget,
- **Gidana is** the property search app
- **that** shows you only homes within your budget, in the neighbourhood you want, with photos, and lets you message the owner before you travel.
- **Unlike** walking around, WhatsApp groups and *démarcheurs*, you filter first and visit only what fits.
- **Reasons to believe (all shipped):** budget, neighbourhood, type and room filters; photo galleries; in-app chat; alerts when a matching home comes up; favourites.
- **Trade-offs:** the claims are honest and easy to prove today. Less emotionally charged than "trust", and copyable by any competitor that has filters.

### Option B: "Deal directly with the owner" (no intermediary) — *ruled out (ADR-006: agencies are a target)*
- Position against *démarcheurs* and their fees.
- **Strength:** probably a sharp, well-known pain *(hypothesis)*.
- **Problems:** (1) the paywall blurs owner replies and hides phone numbers below Pro, so "direct" comes with a toll; (2) the product sells an **Agence** plan, so "no intermediary" contradicts your own landlord offer. Only workable if agencies are dropped or clearly labelled, and the seeker cost is stated openly ("1 500 XOF/mois au lieu de frais de démarcheur"). That needs fee data to support it.

### Option C: "Listings you can trust" (verification) — *dropped (ADR-007: no verification will be built)*
- Potentially the strongest moat against scams and ghost listings.
- **Not available today:** there is no verification process. Using this position now would be a false claim. Treat it as the **future** direction once a real check exists (for example ID plus proof of ownership plus a first photo audit).

## 5. Recommended direction

**Lead with A.** B is ruled out because agencies are a target. C is dropped because no verification will be built. Trust comes from transparency instead: photos, chat before the visit, and reviews.

**Positioning statement (FR, primary):**
> Pour ceux qui cherchent un logement en ville, Gidana est l'application qui vous montre seulement les biens dans votre budget et votre quartier, avec photos, et vous met en contact avec le propriétaire avant de vous déplacer. Fini les journées à tourner et les visites pour rien.

**Value proposition (one line):**
> **FR:** Trouvez votre chez-vous sans tourner en rond.
> **EN:** Find your home without the runaround.

(*Chez-vous* echoes the name: "Gidana" means "my home" in Hausa.)

### Message pillars

| Pillar | Message | Proof (shipped) | Do not say |
|---|---|---|---|
| 1. Your budget, your neighbourhood | "Filtrez par prix, quartier et type. Vous ne voyez que ce qui vous correspond." | Filters, categories, city search | "Des milliers d'annonces" |
| 2. Talk before you travel | "Posez vos questions au propriétaire dans l'app avant la visite." | Chat, auto-message | "Sans intermédiaire" / "sans démarcheur", "Gratuit" with no qualifier |
| 3. Never miss the right place | "Créez une alerte, on vous prévient dès qu'un bien correspond." | Search alerts, push notifications | Real-time guarantees |
| 4. Everything in one place | "Favoris, contrats et paiements suivis dans l'app." | Favourites, rentals, wallet | "On s'occupe de tout", "Assistance juridique" |
| Owners & agencies | "Propriétaires et agences : publiez votre premier bien gratuitement et recevez les demandes dans l'app." | Free plan, unlimited replies, Agence plan | "Vérifié", "locataires sérieux" (unproven) |

### Tone principles
1. **Clear before clever.** Plain French, short sentences, *vouvoiement*. Many users will read this on a small screen with a weak connection.
2. **Local, not generic.** Name real Abidjan neighbourhoods (Cocody, Marcory, Yopougon, Plateau…) and prices in XOF, not "your dream home". Use standard French that Ivorian readers find natural; avoid Nouchi slang unless a native writer reviews it.
3. **Honest about price.** Never call a paid feature free. (Founder decision ADR-004: the in-app limit is not shown before the first message.)
4. **Warm and reassuring.** Finding housing is stressful, so sound like a helpful cousin who knows the city, not like an estate agent.
5. **No hype.** No unbacked superlatives ("le n°1", "des milliers", "jamais été aussi simple").

## 6. Homepage / store-page message hierarchy

1. **H1:** Trouvez votre chez-vous sans tourner en rond.
2. **Subhead:** Studios, appartements et maisons à Abidjan, à louer ou à acheter, filtrés selon votre budget et votre quartier. Discutez avec le propriétaire avant de vous déplacer.
3. **Primary CTA:** Télécharger l'app (App Store / Google Play) · **Secondary:** Explorer sans compte
4. **How it works (3 steps):** Filtrez → Discutez avec le propriétaire → Visitez seulement ce qui vous plaît
5. **Pillars 1–4** with app screenshots (real UI, demo data)
6. **Proof strip:** *empty until we have real data:* number of live listings per city, neighbourhoods covered, verified reviews
7. **Pricing:** Gratuit / Essentiel / Pro, with what each plan includes (the website/store page lists plans; in the app the limit is not shown before the first message, see ADR-004)
8. **Owners & agencies section:** "Propriétaire ou agence ? Publiez votre premier bien gratuitement." with a CTA
9. **FAQ:** Is it free? Who publishes the listings (owners and agencies)? How do I report a suspicious listing? (Needs a reporting flow; none was found in the app. Without verification, this matters more.)

## 7. Decisions (2026-11-24)

- [x] **Option A** approved as the lead positioning
- [x] Name means **"my home"** (Hausa)
- [x] High-risk claims removed (see the changes below)
- [x] Free-plan limit **not** shown before the first message. Accepted risk, see ADR-004
- [x] Launch city: **Abidjan** (ADR-005)
- [x] Listers: **agencies and independent owners** (ADR-006)
- [x] **No verification** will be built; Option C dropped (ADR-007)

### Claim changes applied
| Where | Before | After |
|---|---|---|
| Onboarding slide 1 | "Trouvez votre logement idéal" / "n'a jamais été aussi simple" / "Des milliers d'annonces vérifiées" | "Trouvez votre chez-vous" / "Sans tourner en rond : seulement les biens dans votre budget et votre quartier" / "Photos de chaque bien" |
| Onboarding slide 2 | "Visites virtuelles disponibles" | "Visitez seulement ce qui vous plaît" |
| Onboarding slide 3 | "On s'occupe de tout" / formalités / gestion administrative / assistance juridique | "Tout au même endroit": favoris, contrats, paiements |
| Property detail | Hardcoded "Vérifié" badge on **every** owner | Removed |
| Property detail button | "Réserver" + calendar icon | "Contacter le propriétaire" + message icon |
| Landlord Standard plan | "Badge vérifié" | "Badge Standard sur vos annonces" |
| Guest modal | "des milliers de propriétaires…" / "des milliers d'acheteurs" / "en toute sécurité" | "Publiez votre premier bien gratuitement" / real benefits |
| README | "verified owners", "book appointments", "verified reviews" | Wording matches the shipped features |
| Home hero / sign-up | "logement idéal" / "Découvrez des studios… à louer" | "chez-vous" / "Studios, appartements et maisons à louer ou à acheter, dans votre budget" |
| Phone placeholder | `+221XXXXXXXXX` | `+225XXXXXXXXXX` |
| Guest modal subtitle | "Publiez votre premier bien gratuitement" | "Propriétaires et agences : publiez votre premier bien gratuitement" |

**Next skills:** `/competitor-analysis` and `/customer-personas` for Abidjan, `/copywriting` for the store listing and website, `/visual-direction`.
