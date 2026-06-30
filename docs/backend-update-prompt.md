# Backend Update Prompt — Gidana Go API

> Copy this prompt and feed it to your Go AI assistant (Claude, Cursor, etc.) with your backend codebase attached.

---

## Prompt

You are updating the Go REST API backend for **Gidana**, a pan-African property rental and sales app. The frontend is React Native + Expo. The API uses Gin (or similar), GORM, PostgreSQL, and push notifications via Expo or FCM.

We have implemented a **freemium chat monetization model** on the frontend. You need to make the backend support it. Here is everything you need to know:

---

### 1. User model — add subscription plan fields

Add two new optional fields to the `User` model and its corresponding database table:

```go
// SubscriptionPlan for seekers (renters/buyers)
// Values: "basic" (default/free), "essential", "pro"
SubscriptionPlan string `json:"subscription_plan" gorm:"default:'basic'"`

// LandlordPlan for property owners
// Values: "free" (default), "standard", "agency"
LandlordPlan string `json:"landlord_plan" gorm:"default:'free'"`
```

Write a GORM migration that adds these two columns to the `users` table with the defaults shown above. Existing rows should default to `basic` and `free` respectively.

The `GET /api/v1/auth/me` endpoint must return both fields in the user JSON response.

---

### 2. Property detail — gate contact info by subscription

In `GET /api/v1/properties/:id`, the response currently includes `phone_contact` and `whatsapp_contact` fields.

Change the behavior:
- If the requesting user is **the property owner** → include these fields as normal.
- If the requesting user has `subscription_plan = "pro"` → include these fields.
- In **all other cases** → return `null` for both `phone_contact` and `whatsapp_contact`.

If the request is unauthenticated, these fields must also be `null`.

---

### 3. Start conversation endpoint — idempotent

`POST /api/v1/conversations`  
Body: `{ "property_id": 42 }`

This must be **idempotent**: if a conversation already exists between this user and the property owner for this property, return the existing conversation instead of creating a new one. Return HTTP 200 in both cases (create or existing).

Response:
```json
{
  "success": true,
  "data": {
    "id": 7,
    "property_id": 42,
    "owner_id": 3,
    "tenant_id": 12,
    "created_at": "..."
  }
}
```

---

### 4. Push notifications — hide message body

When sending a push notification for a new chat message, **do not include the message body** in the notification payload. Only include the sender's name in the title.

**Current (wrong):**
```json
{ "title": "Amadou", "body": "Bonjour, est-ce disponible ?" }
```

**Required:**
```json
{ "title": "Amadou vous a répondu", "body": "" }
```

Apply this to all new-message push notifications regardless of sender type (seeker or landlord).

---

### 5. Subscription upgrade endpoints

Create two new endpoints:

#### 5a. Seeker plan upgrade
```
POST /api/v1/subscriptions/upgrade
Authorization: Bearer <token>
Body:
{
  "plan": "essential",      // "essential" or "pro"
  "wallet_id": 3,
  "billing_period": "monthly"
}
```

Logic:
1. Validate `plan` is one of `essential`, `pro`.
2. Look up the wallet by `wallet_id` — must belong to the authenticated user.
3. Determine the price in the wallet's currency:
   - `essential`: 1500 XOF / $2.50 USD (use a config map, not hardcoded strings)
   - `pro`: 4000 XOF / $4.00 USD
4. Deduct from wallet balance (or integrate CinetPay — see note below).
5. Create a `Transaction` record: `nature = "expense"`, `service = "subscription"`, `service_provider = "gidana"`.
6. Update `user.subscription_plan = plan`.
7. Set `subscription_expires_at = now + 30 days` (add this field to the User model).
8. Return the updated user object.

#### 5b. Landlord plan upgrade
```
POST /api/v1/subscriptions/landlord-upgrade
Authorization: Bearer <token>
Body:
{
  "plan": "standard",       // "standard" or "agency"
  "wallet_id": 3,
  "billing_period": "monthly"
}
```

Same logic as above but update `user.landlord_plan` instead of `user.subscription_plan`.

Prices:
- `standard`: 3000 XOF / $5.00 USD
- `agency`: 10000 XOF / $16.00 USD

---

### 6. CinetPay webhook (future, implement interface now)

CinetPay will call a webhook when a payment succeeds or fails. Create the endpoint now even if the payment logic is stubbed:

```
POST /api/v1/webhooks/cinetpay
```

This endpoint should:
1. Validate the CinetPay HMAC signature from the request headers.
2. Parse the `transaction_id`, `status`, and `metadata` fields.
3. If `status == "ACCEPTED"`, find the pending transaction by `transaction_id` and activate the corresponding plan upgrade.
4. Return HTTP 200 immediately (CinetPay retries on non-200).

Store a `cinetpay_transaction_id` field on the `Transaction` model for lookup.

---

### 7. Property listing limits by landlord plan

Enforce listing limits server-side in `POST /api/v1/properties`:

- `free`: max 1 active listing — reject with HTTP 403 and `{ "error": "listing_limit_reached" }` if already at limit.
- `standard`: max 3 active listings.
- `agency`: unlimited.

An "active listing" is a property where `is_available = true` and `deleted_at IS NULL`.

---

### 8. Subscription expiry — middleware check

Add a background job (or middleware check on auth endpoints) that:
- Checks if `subscription_expires_at < now`.
- If so, downgrades `subscription_plan` back to `basic` (or `landlord_plan` back to `free`).

A simple approach: run this check in the `GET /api/v1/auth/me` handler before returning the user, so the frontend always gets the current plan state.

---

### Summary of model changes

```go
// User model additions
SubscriptionPlan      string     `json:"subscription_plan" gorm:"default:'basic'"`
LandlordPlan          string     `json:"landlord_plan" gorm:"default:'free'"`
SubscriptionExpiresAt *time.Time `json:"subscription_expires_at"`
```

```go
// Transaction model addition
CinetpayTransactionID string `json:"cinetpay_transaction_id" gorm:"index"`
```

---

### Plan price reference (implement as a config, not hardcoded)

| Plan | XOF | USD |
|---|---|---|
| `essential` | 1500 | 2.50 |
| `pro` | 4000 | 4.00 |
| `standard` (landlord) | 3000 | 5.00 |
| `agency` (landlord) | 10000 | 16.00 |

---

### Non-goals (do not implement)

- Do **not** redact message content server-side for basic users — the frontend handles blurring.
- Do **not** rate-limit the first message in a conversation — the frontend sends exactly one auto-message and the backend should accept it normally.
- Do **not** change the messaging WebSocket logic.

---

### Existing endpoints that do NOT need changes

- `GET /api/v1/properties` (list)
- `GET /api/v1/conversations` (list user's conversations)
- `GET /api/v1/conversations/:id` (get messages — no gating needed)
- `POST /api/v1/conversations/:id/messages` (send message — no rate limiting needed)
- All auth endpoints except `GET /api/v1/auth/me` (add plan fields to response)
- All wallet endpoints
