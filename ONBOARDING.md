# 🚨 NaijaSafe — Team Onboarding & Project Overview

Welcome to **NaijaSafe**! If you are reading this, you are helping build a life-saving, crowdsourced intelligence network aimed at addressing public safety issues across Nigeria. 

This document serves as the "North Star" for our team and explains exactly what we are building, why it matters, and how the technology fits together under the hood.

---

## 🌍 The Problem
When people are in danger (boarding suspected fake taxis, witnessing theft at bus stops, or encountering scams), **internet access is rarely guaranteed or fast enough**. 
Most existing safety apps require:
1. Smartphones
2. Active data subscriptions
3. Deliberate app installations

These requirements shut out millions of people and fail exactly when they are needed most.

## 💡 The Solution
**NaijaSafe** is an **offline-first** safety alert and area monitoring system. We completely bypass the internet for the end-user by utilizing **Africa's Talking (AT) APIs** to communicate via **SMS and USSD**. 

If a user has a basic feature phone (mbukpa/palasa) and a cellular signal, they can instantly connect to our safety network. 

---

## 🔥 Core Capabilities & Workflow

Our backend is built on **Node.js + Express** and handles complex geographic routing via simple text interactions. Here is what the system does today:

### 1. SMS Command Engine (Push-Based Intelligence)
Users can text our shortcode to interact with the system without internet:
- **Checking Areas:** `CHECK Oshodi` returns active alerts.
- **Reporting Danger:** `REPORT, Ikeja, Fake LASTMA officers at the junction` logs a verified alert.
- **Getting Guides:** `GUIDE Lekki` provides basic safety orientations for unfamiliar areas.

### 2. Live Area Tracking & Broadcasting (The "Secret Weapon")
Users can text `ENTER Ikeja`. The system adds their phone number to a tracking array. If another user simultaneously reports a danger in `Ikeja`, our system catches the intersection and uses **Africa's Talking SMS API** to instantly broadcast a push warning to all active users currently tracked in that area. 

### 3. USSD Menu (Pull-Based Interactivity)
Users can dial a code like `*384*55#` to open an interactive menu to safely pull data, check alerts by neighborhood, and submit reports in a stepped, conversational UI.

### 4. Command Center Dashboard
While the end-user requires no internet, the local authorities or community leaders have access to a real-time, zero-refresh live web dashboard (`/dashboard`) that polls and visualizes crowdsourced alerts as they stream in from offline reporters.

---

## 🛠️ The Tech Stack

- **Backend:** Node.js / Express
- **API Integration:** Africa's Talking (SMS & USSD Gateways)
- **Frontend (Dashboard):** HTML/Vanilla JS (Async Polling)
- **Environment Management:** dotenv, CORS, body-parser

### File Structure Breakdown
- `index.js`: The main Express server entry point.
- `routes/sms.js`: The command parser and webhook receiver for all incoming SMS.
- `routes/ussd.js`: The multi-level interactive menu parser handling `CON` and `END` AT session states.
- `routes/dashboard.js`: The JSON feed for our live tracker.
- `services/alerts.js`: Master intelligence logic—holds alert state, categorizes dangers, and handles automated SMS broadcasts.
- `services/tracker.js`: Manages the geolocation arrays for "Entered" users to receive proximate warnings.
- `public/index.html`: The live map/dashboard UI.

---

## 🚀 The Hackathon Winning Pitch (Next Steps)

Our immediate goal to scale this and definitively win is integrating **Gamified Safety Economics**. 

We will integrate the **Africa's Talking Airtime API**. Why? Because crowdsourcing suffers from the "cold start" problem—people are lazy. By gamifying the platform, any user whose submitted report is verified will receive an instant **N50 Airtime Top-Up** automatically via the API. 

This creates a micro-economy for safety reporting. **We pay you airtime to keep your community safe.**

---

**Welcome to the team. Let's build something that matters.**
