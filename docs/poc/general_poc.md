POC-SPECSure — here is the complete Markdown file exactly as you requested.
You can copy-paste it directly into your repo as POC-SPEC.md, README.md, or any name you prefer.

⸻

Hotel POC Application – Technical Specification

Status: Draft
Languages: EN / RU support included

⸻

1. Purpose

This document defines the technical and functional requirements for the Hotel Management POC Application.
The POC demonstrates the full automated guest lifecycle for a single small hotel:
	1.	Guest visits website
	2.	Guest books a room
	3.	Guest completes online check-in
	4.	Application issues TTLock credentials
	5.	Guest receives instructions via email/WhatsApp
	6.	Guest opens the room using:
	•	PIN
	•	TTLock official app
	•	Webkey page (from this app)

The POC must be implemented as a Next.js application (App Router) with integrated backend API routes.

⸻

2. Scope

2.1 In Scope
	•	Single hotel, one location
	•	Simple booking flow
	•	Online check-in with guest data + add-ons
	•	Email + WhatsApp messaging
	•	TTLock cloud integration (PIN-based)
	•	Webkey unlock page
	•	Basic admin panel
	•	i18n with English and Russian

2.2 Out of Scope

(Not required for POC; may be added later)
	•	Multi-property support
	•	Booking.com / Airbnb integration
	•	Real payment provider
	•	Complex room pricing
	•	Housekeeping, reporting, invoicing
	•	Mobile applications
	•	Production-grade security hardening

⸻

3. Architecture Overview

3.1 Technologies
	•	Framework: Next.js (App Router)
	•	Language: TypeScript
	•	Backend: Next.js Route Handlers (app/api/...)
	•	Database: PostgreSQL (via Prisma ORM)
	•	i18n: English + Russian
	•	Communication: Abstracted providers:
	•	Email (SMTP / SendGrid / Resend / Mailgun)
	•	WhatsApp (Twilio / WhatsApp Cloud API)
	•	Lock Integration: TTLock Cloud API
	•	Deployment:
	•	POC: Vercel (recommended)
	•	Alt: Contabo VPS with Docker/Docker Compose

3.2 Major Modules
	•	Public Website
	•	Booking
	•	Check-In
	•	Communication
	•	TTLock Integration
	•	Webkey
	•	Admin Panel
	•	Infrastructure (env, logging, auth, DB)

⸻

4. Internationalization (i18n)

Requirements
	•	Two locales: en, ru
	•	Guest-facing pages must support translations
	•	Email + WhatsApp templates localized
	•	Language switcher required on public-facing UI

Implementation (recommended)

app/
  [locale]/
    page.tsx
    booking/
    check-in/
    webkey/
locales/
  en/
    common.json
  ru/
    common.json


⸻

5. Functional Modules

⸻

5.1 Public Website

Pages (all translatable)
	•	Home (/[locale])
	•	Rooms & Rates (/[locale]/rooms)
	•	About (/[locale]/about)
	•	Contact (/[locale]/contact)

Requirements
	•	Responsive layout
	•	SEO basics
	•	Links into booking flow

⸻

5.2 Booking Module

Booking Flow
	1.	Guest selects:
	•	Check-in date
	•	Check-out date
	•	Room type
	•	Number of guests
	2.	Availability check (simple inventory-based)
	3.	Display total price
	4.	Guest enters:
	•	Name
	•	Email
	•	Phone (optional)
	5.	Optional fake payment step
	6.	Booking is created with:
	•	6-character alphanumeric reference code (e.g., Q7F9XZ)
	7.	Confirmation screen shown
	8.	Confirmation is sent via email + WhatsApp

Booking Statuses
	•	PENDING_CHECKIN
	•	CONFIRMED
	•	CHECKIN_COMPLETED
	•	CHECKED_IN
	•	CHECKED_OUT
	•	CANCELLED

⸻

5.3 Check-In Module

Entry

Guest receives a magic-link token:

/[locale]/check-in?token=<signed-token>

Check-In Steps
	1.	Overview (booking summary)
	2.	Guest details
	•	Legal name
	•	Date of birth
	•	Passport/ID number
	•	Nationality
	•	Address (optional)
	3.	Additional services
	•	Early/late check-in/out
	•	Airport transfer
	•	Coworking add-ons
	4.	Confirmation

On Success
	•	Record check-in data
	•	Change booking → CHECKIN_COMPLETED
	•	Trigger TTLock key issuance
	•	After keys are created → send access instructions

⸻

5.4 Communication Module

Channels
	•	Email
	•	WhatsApp

Message Types
	•	Booking confirmation
	•	Check-in reminder
	•	Check-in completed (access instructions)
	•	Check-out reminder

Template Requirements
	•	Must support EN + RU
	•	Must support variables:
	•	Guest name
	•	Booking reference
	•	Dates
	•	Room number
	•	PIN code
	•	Webkey link
	•	Add-ons

Logging

Each message stored with:
	•	Channel
	•	Type
	•	Recipient
	•	Payload
	•	Status (SENT, FAILED)
	•	Provider message ID
	•	Timestamp

⸻

5.5 TTLock Integration Module

Config via Env
	•	TTLOCK_CLIENT_ID
	•	TTLOCK_CLIENT_SECRET
	•	TTLOCK_USERNAME
	•	TTLOCK_PASSWORD
	•	TTLOCK_BASE_URL

Workflow
	1.	Check-in completed
	2.	System selects a Room (simple POC allocator)
	3.	Generates validity window:
	•	e.g. 14:00 check-in time
	•	e.g. 11:00 check-out time
	4.	Calls TTLock API to create a PIN code
	5.	Stores key in DB
	6.	Sends access instructions to the guest

Revocation
	•	When booking is checked-out or cancelled:
	•	Delete/disable PIN via TTLock API

Error Handling
	•	Record failures
	•	Allow manual retry in admin panel

⸻

5.6 Webkey Module

Purpose

Guest receives a link to unlock room without app or PIN:

/[locale]/webkey?token=<signed-token>

Requirements
	•	Token contains booking, room, validity range
	•	Page checks:
	•	Token validity
	•	Booking status
	•	Current time within valid range
	•	Button “Open door”
	•	Backend calls TTLock unlock API
	•	Display success/error state

Security:
	•	Short-lived token
	•	Bound to booking + time window
	•	Only works for allocated room

⸻

5.7 Admin Panel

Admin Login
	•	Email + password
	•	Password stored as hash (bcrypt)
	•	Logged-in users stored via HTTP-only session cookie

Features
	1.	Dashboard
	•	Today’s arrivals
	•	Today’s departures
	•	Recent bookings
	2.	Rooms
	•	Manage room types
	•	Manage physical rooms
	•	Map room → TTLock lock ID
	3.	Bookings
	•	Search/bookings list
	•	Change status
	•	View full details
	•	Actions:
	•	Re-send booking confirmation
	•	Re-send check-in link
	•	Force key issuance
	•	Force key revocation
	4.	Communication Log
	•	See all messages
	•	Retry failed messages

UI for admin can be EN-only for POC.

⸻

6. Data Model (Draft)

RoomType
	•	id
	•	name
	•	description
	•	base_price
	•	max_occupancy
	•	total_units
	•	timestamps

Room
	•	id
	•	room_number
	•	room_type_id
	•	ttlock_lock_id
	•	is_active
	•	timestamps

Booking
	•	id
	•	reference_code (e.g. A2R9XZ)
	•	room_type_id
	•	room_id (nullable)
	•	check_in_date
	•	check_out_date
	•	status
	•	guest_name
	•	guest_email
	•	guest_phone
	•	base_price
	•	total_price
	•	locale
	•	timestamps

CheckInInfo
	•	Booking FK
	•	Legal name
	•	DOB
	•	Passport number
	•	Nationality
	•	Address
	•	Additional services (JSON)
	•	Completed timestamp

AdditionalService
	•	id
	•	code
	•	price
	•	is_active
	•	timestamps
(Localized names/descriptions come from i18n.)

LockKey
	•	id
	•	booking_id
	•	room_id
	•	ttlock_lock_id
	•	pin_code (masked/encrypted)
	•	valid_from
	•	valid_to
	•	status
	•	remote_id
	•	timestamps

CommunicationLog
	•	id
	•	booking_id
	•	channel
	•	type
	•	recipient
	•	status
	•	payload
	•	provider_message_id
	•	timestamps

AdminUser
	•	id
	•	email
	•	password_hash
	•	timestamps

⸻

7. API Endpoints (Internal)

Public API
	•	POST /api/booking
	•	GET /api/booking/[referenceCode]
	•	POST /api/check-in/complete
	•	POST /api/webkey/unlock

Admin API
	•	POST /api/admin/login
	•	GET /api/admin/bookings
	•	GET /api/admin/bookings/[id]
	•	POST /api/admin/bookings/[id]/status
	•	POST /api/admin/bookings/[id]/send-confirmation
	•	POST /api/admin/bookings/[id]/issue-keys
	•	POST /api/admin/bookings/[id]/revoke-keys
	•	GET /api/admin/communications
	•	POST /api/admin/communications/[id]/retry
	•	GET /api/admin/rooms
	•	POST /api/admin/rooms
	•	GET /api/admin/room-types
	•	POST /api/admin/room-types

⸻

8. Environment Variables

DATABASE_URL
APP_BASE_URL
JWT_SECRET
NEXT_PUBLIC_DEFAULT_LOCALE=en

TTLOCK_CLIENT_ID
TTLOCK_CLIENT_SECRET
TTLOCK_USERNAME
TTLOCK_PASSWORD
TTLOCK_BASE_URL

EMAIL_PROVIDER_*
WHATSAPP_PROVIDER_*

ADMIN_DEFAULT_EMAIL
ADMIN_DEFAULT_PASSWORD


⸻

9. POC Success Criteria

The POC is considered successful when:
	1.	App is accessible under the hotel domain
	2.	A booking can be made
	3.	Booking confirmation email/WhatsApp is received
	4.	Check-in link works end-to-end
	5.	TTLock PIN is created and valid
	6.	Access instructions (PIN + webkey link) are sent
	7.	Guest can unlock the door via:
	•	PIN
	•	TTLock mobile app (manual)
	•	Webkey page
	8.	Admin panel displays bookings, keys, communications
	9.	Keys are revoked properly on checkout

⸻