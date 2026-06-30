# Gidana — Monetization & Chat Flow

## Overview

Gidana uses a **freemium chat model**: browsing and initiating contact is free, but reading owner replies requires a paid subscription. The paywall hits at the moment of highest emotional investment — when the owner has already responded.

---

## User Roles & Plans

### Seekers (Locataires / Acheteurs)

| Plan | Price | Key capability |
|---|---|---|
| `basic` | Free | Browse + 1 auto-message per property. Owner replies are blurred. |
| `essential` | 1 500 XOF/mois | Unlimited chat. All replies visible. 5 property alerts. |
| `pro` | 4 000 XOF/mois | Everything in Essential + owner phone/WhatsApp shown directly + 20 alerts. |

### Landlords (Propriétaires)

| Plan | Price | Key capability |
|---|---|---|
| `free` | Free | 1 active listing. Can reply to all messages. Standard visibility. |
| `standard` | 3 000 XOF/mois | 3 listings. Featured in city search. Verified badge. |
| `agency` | 10 000 XOF/mois | Unlimited listings. Top placement. Detailed analytics. |

> **Landlords are never blocked.** They see and reply to all messages regardless of their plan. Only seekers face the paywall.

---

## Complete Seeker Flow

```
1. Seeker opens a property listing (PropertyDetailScreen)
         │
         ▼
2. Taps "Réserver"
   → messagingApi.startConversation(propertyId)
   → Backend creates conversation (or returns existing one)
   → Navigate to ChatScreen with { conversationId, name, autoMessage }
         │
         ▼
3. ChatScreen loads
   → If conversation has 0 messages AND autoMessage param present:
     auto-sends: "Bonjour, je suis intéressé(e) par votre annonce « [title] »..."
   → Message appears in chat as a normal sent bubble
         │
         ▼
4. Owner receives push notification
   → Notification body is HIDDEN (shows sender name only, no message content)
   → Owner replies from their own ChatScreen (never blocked)
         │
         ▼
5. Seeker opens ChatScreen (or app was already open via WebSocket)
   → Backend returns conversation with owner's reply
   → Frontend checks: user.subscription_plan === 'basic' (or undefined)
   → IF basic:
       • Owner messages rendered as ●●●●●● with dark blur overlay
       • PlansModal slides up automatically
       • Input bar replaced with locked "Débloquer pour lire" row
       • Tapping blurred bubble or locked input reopens PlansModal
   → IF essential or pro:
       • All messages visible, input active
         │
         ▼
6. Seeker selects a plan in PlansModal
   → Payment via CinetPay (Orange Money / Moov / Visa / Mastercard)
   → Backend updates user.subscription_plan
   → Frontend re-fetches user, updates authStore
   → Chat unlocks, messages visible
```

---

## API Contracts

### User object (updated)
```json
{
  "id": 1,
  "first_name": "Amadou",
  "subscription_plan": "basic",
  "landlord_plan": "free"
}
```
`subscription_plan` values: `basic` | `essential` | `pro`  
`landlord_plan` values: `free` | `standard` | `agency`

### Start conversation
```
POST /api/v1/conversations
Body: { "property_id": 42 }
Response: { "data": { "id": 7, ... } }
```
Returns existing conversation if one already exists for (user, property) pair.

### Send message
```
POST /api/v1/conversations/:id/messages
Body: { "content": "Bonjour..." }
```
- **No rate limiting** on the first message (auto-message).
- Backend does **not** enforce the one-message limit — the frontend handles it. Server-side enforcement is optional future hardening.

### Push notification for new message
```json
{
  "title": "Amadou vous a répondu",
  "body": ""
}
```
The `body` must be **empty or omitted**. Never include the message content in the push payload.

### Get conversation
```
GET /api/v1/conversations/:id
```
Returns the full conversation including all messages.

- For `basic` seekers: **do not redact messages server-side** — the frontend handles blurring. The backend returns the full content.
- For `pro` seekers: include `phone_contact` and `whatsapp_contact` on the Property object when fetching property detail.

### Property contact gating
```
GET /api/v1/properties/:id
```
- `phone_contact` and `whatsapp_contact` are only included in the response if:
  - The requesting user is the property owner, OR
  - The requesting user has `subscription_plan = 'pro'`
- All other users receive `null` for these fields.

### Subscription upgrade
```
POST /api/v1/subscriptions/upgrade
Body: {
  "plan": "essential",           // or "pro"
  "wallet_id": 3,
  "billing_period": "monthly"
}
Response: {
  "data": {
    "user": { ...updated user with new subscription_plan },
    "transaction": { ... }
  }
}
```

### Landlord plan upgrade
```
POST /api/v1/subscriptions/landlord-upgrade
Body: {
  "plan": "standard",            // or "agency"
  "wallet_id": 3,
  "billing_period": "monthly"
}
```

---

## Frontend State

### Auth store (`authStore`)
After a successful plan upgrade, the frontend calls `authStore.loadStoredAuth()` or equivalent to refresh the user object. The `subscription_plan` field on the user drives all gating logic.

### Gating logic (ChatScreen)
```typescript
const isBasic = !user?.subscription_plan || user?.subscription_plan === 'basic';
const ownerReplied = messages.some(m => m.sender_id !== user?.id);

// Show PlansModal immediately when both are true
if (isBasic && ownerReplied) → show PlansModal

// Block input
if (isBasic && ownerReplied) → show locked input bar instead of TextInput

// Blur bubbles
renderItem: blurred = !isMine && isBasic
```

---

## Notification Strategy

| Event | Title | Body |
|---|---|---|
| New message from owner | `[Owner name] vous a répondu` | *(empty)* |
| New message from seeker | `Nouveau message de [Seeker name]` | *(empty)* |
| Plan upgrade confirmed | `Plan activé` | `Votre plan [name] est maintenant actif.` |
| New matching property alert | `Nouvelle annonce` | `Un bien correspond à votre alerte à [city].` |

Message body is always hidden. This creates urgency when the owner replies — the seeker sees a notification but cannot read the response without opening the app.

---

## Files Involved

| Layer | File | Role |
|---|---|---|
| Types | `src/types/index.ts` | `SubscriptionPlan`, `LandlordPlan`, added to `User` |
| API | `src/api/properties.ts` | `checkUnlock`, `unlockContact` (available, not yet wired) |
| Component | `src/components/PlansModal.tsx` | Tabbed plan picker (Seekers / Landlords) |
| Screen | `src/screens/messages/ChatScreen.tsx` | Auto-message, blur, plans trigger, locked input |
| Screen | `src/screens/property/PropertyDetailScreen.tsx` | "Réserver" button → starts conversation |
| i18n | `src/i18n/locales/en.json` | `plans`, `reserve`, `autoMessage` |
| i18n | `src/i18n/locales/fr.json` | Same (French — primary language) |

---

## Open Items (Not Yet Implemented)

- [ ] `POST /api/v1/subscriptions/upgrade` endpoint in Go
- [ ] `POST /api/v1/subscriptions/landlord-upgrade` endpoint in Go
- [ ] CinetPay payment integration on the backend (webhook handler)
- [ ] `subscription_plan` field on User model in Go + DB migration
- [ ] Property contact gating server-side (hide `phone_contact` for non-pro users)
- [ ] Push notification body suppression
- [ ] Re-fetch user in authStore after plan upgrade (frontend)
- [ ] Plan expiry / recurring billing logic
