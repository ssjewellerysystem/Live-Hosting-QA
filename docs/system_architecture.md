# BharatBasket System Architecture Design Document

Welcome to the architectural overview of **BharatBasket**, a modern e-commerce web application featuring User and Admin panels, a product catalog, shopping cart, coupon discount system, customer support ticketing with live chat, and a robust OTP & Google OAuth 2.0 authentication system.

This document acts as a professional reference guide. It translates the code workflow into intuitive flow diagrams and structured explanations, making it simple to present to anyone—from developers to business leads.

---

## 1. High-Level System Architecture Diagram

This diagram displays the multi-tier architecture of BharatBasket. Each request travels down from the browser through security checkpoints to the logic and database tiers, occasionally communicating with external integrations.

```mermaid
graph TD
    subgraph ClientTier ["Client Tier (Frontend - React + Vite)"]
        UserBrowser["User Browser"]
        ReactApp["React Application"]
        ReactRouter["React Router (SPA Routing)"]
        AuthCtx["Auth Context (JWT State)"]
        CartCtx["Cart Context (Shopping Cart State)"]
        Pages["Pages (Home, ProductDetails, Cart, Checkout, Admin, Support, etc.)"]
        Components["Components (Navbar, LiveChat, ProductCard, etc.)"]
    end

    subgraph APITier ["API & Gateway Tier (Backend - Flask)"]
        FlaskServer["Flask App Server (app.py)"]
        CORSMw["CORS Middleware"]
        JWTMw["JWT Authentication Middleware"]
    end

    subgraph LogicTier ["Application Logic Tier (Blueprints)"]
        AuthBP["Auth Blueprint (/api/auth)"]
        ProductBP["Products Blueprint (/api/products)"]
        OrderBP["Orders Blueprint (/api/orders)"]
        AdminBP["Admin Blueprint (/api/admin)"]
        SupportBP["Support Blueprint (/api/support)"]
        CouponBP["Coupons Blueprint (/api/coupons)"]
    end

    subgraph DataTier ["Data & Storage Tier"]
        SQLAlchemy["SQLAlchemy ORM (Models)"]
        MySQLDB[(MySQL DB)]
    end

    subgraph ExternalTier ["External Services Tier"]
        GoogleOAuth["Google OAuth 2.0 Identity Server"]
        SMTPServer["SMTP Email Server (Flask-Mail)"]
        SMSPlaceholder["SMS Gateway (Future MSG91 Integration)"]
    end

    %% Client and Frontend flows
    UserBrowser --> ReactApp
    ReactApp --> ReactRouter
    ReactRouter --> Pages
    Pages --> Components
    Pages --> AuthCtx
    Pages --> CartCtx

    %% Frontend to API calls
    AuthCtx -- "API Requests (JWT / Auth Header)" --> CORSMw
    CartCtx -- "Checkout & Orders" --> CORSMw
    Pages -- "Product / Coupon Requests" --> CORSMw

    %% API Routing
    CORSMw --> JWTMw
    JWTMw --> FlaskServer
    FlaskServer --> AuthBP
    FlaskServer --> ProductBP
    FlaskServer --> OrderBP
    FlaskServer --> AdminBP
    FlaskServer --> SupportBP
    FlaskServer --> CouponBP

    %% Logic to DB ORM
    AuthBP --> SQLAlchemy
    ProductBP --> SQLAlchemy
    OrderBP --> SQLAlchemy
    AdminBP --> SQLAlchemy
    SupportBP --> SQLAlchemy
    CouponBP --> SQLAlchemy

    SQLAlchemy --> MySQLDB

    %% Logic to External Services
    AuthBP -- "Google Auth Callback & Profile Fetch" --> GoogleOAuth
    AuthBP -- "Send Registration OTP / Password Reset" --> SMTPServer
    FlaskServer -- "Send OTP SMS" --> SMSPlaceholder
```

---

## 2. The Tech Stack Breakdown

Here is a summary of the technology stack choices and their role in the platform:

| Tier | Technology | Purpose | Key Details |
| :--- | :--- | :--- | :--- |
| **Frontend** | **React (Vite)** | User Interface (SPA) | Provides a fast, dynamic, and responsive shopping interface with instant state transitions. |
| **Styling** | **TailwindCSS** | Design & Layout | Utility-first styling for a clean, modern grid and responsive mobile/desktop layouts. |
| **State** | **React Context API** | Client-State Management | `AuthContext` holds the logged-in user profile/token; `CartContext` updates cart items dynamically. |
| **Backend** | **Flask (Python)** | REST API Server | Fast, lightweight server framework routing JSON data to blueprints. |
| **Database** | **MySQL** | Persistent Storage | Stores relational data safely (users, products, orders, categories, coupons, tickets). |
| **ORM** | **SQLAlchemy** | Database Mapping | Map Python model objects (`UserModel`, `ProductModel`, etc.) directly to MySQL tables without writing manual SQL query strings. |
| **Auth** | **JWT (JSON Web Tokens)** | Stateless Sessions | Frontend stores a JWT string. It passes this in request headers for authenticated operations (placing orders, editing products). |
| **Notifications** | **SMTP (Flask-Mail)** | Emailing & Verification Codes | Dispatches OTPs (One-Time Passwords) and password reset instructions. |

---

## 3. Core Workflow Sequence Diagrams

### Workflow A: OTP Authentication (Signup / Verification)
When a user signs up or requests verification, the system uses email-based OTPs (with custom options to switch to phone SMS in production).

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer (Browser)
    participant FE as React Frontend
    participant BE as Flask App Server
    participant SMTP as SMTP Email Server
    participant DB as MySQL DB

    User->>FE: Enters Email & Clicks "Send OTP"
    FE->>BE: POST /api/send-otp { email: "user@example.com" }
    Note over BE: Generate 6-digit random code<br/>Save code in OtpVerification model
    BE->>DB: Save OTP code + expiry timestamp
    BE->>SMTP: Send Email containing code
    SMTP-->>User: User receives Email with OTP
    BE-->>FE: Return JSON success response
    FE-->>User: Show OTP entry form
    User->>FE: Enters 6-digit OTP code & Clicks "Verify"
    FE->>BE: POST /api/verify-otp { email: "user@example.com", otp: "123456" }
    Note over BE: Validate matching code<br/>Check expiry time (e.g., <5 mins)
    alt OTP is valid
        BE->>DB: Update UserModel is_verified = TRUE
        BE-->>FE: Return success response
        FE-->>User: Mark account verified & redirect to Login/Home
    else OTP is invalid or expired
        BE-->>FE: Return 400 Error (Invalid OTP)
        FE-->>User: Show error message "Try again"
    end
```

---

### Workflow B: Google OAuth 2.0 Social Sign-In
To simplify registration and logins, users can authenticate using their Google Account.

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer (Browser)
    participant FE as React Frontend
    participant BE as Flask App Server
    participant Google as Google Identity Server
    participant DB as MySQL DB

    User->>FE: Clicks "Sign in with Google"
    FE->>BE: Redirects to /api/auth/google/login
    Note over BE: Prepares client_id & redirect_uri callback
    BE-->>User: Redirects browser to Google Consent Page
    User->>Google: Grants permission / logs in
    Google-->>BE: Redirects to /api/auth/google/callback?code=AUTH_CODE
    BE->>Google: Exchange AUTH_CODE for Access Token (Back-channel API call)
    Google-->>BE: Returns Access Token
    BE->>Google: Request user profile (name, email, unique Google ID)
    Google-->>BE: Returns User Profile details
    Note over BE: Checks DB if user exists with this Google ID
    alt User exists
        BE->>DB: Fetch user profile (ensure account not suspended)
    else User is new
        BE->>DB: Create new UserModel row (provider="google", is_verified=TRUE)
    end
    Note over BE: Generate stateless JWT Token containing user metadata
    BE-->>User: Redirect back to Frontend with JWT token & profile
    FE->>FE: Save JWT token to local storage / state
    FE-->>User: Update state to Logged In (Redirect to Home)
```

---

### Workflow C: Cart & Checkout (Coupon & Order Flow)
How a user builds a cart, applies a discount coupon, and places an order.

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer (Browser)
    participant FE as React Frontend
    participant BE as Flask App Server
    participant DB as MySQL DB

    User->>FE: Adds items to Cart (updates local CartContext state)
    User->>FE: Applies promo coupon (e.g., "WELCOME10")
    FE->>BE: POST /api/coupons/apply { code: "WELCOME10", order_amount: 1200 }
    BE->>DB: Fetch coupon model & check active flag, expiry, & min_order_amount
    alt Coupon matches rules
        BE-->>FE: Return coupon details (discount type, discount value)
        FE->>FE: Apply discount & update display order total
    else Coupon rules not met
        BE-->>FE: Return invalid coupon message
    end
    User->>FE: Clicks "Place Order" (Enters shipping details)
    FE->>BE: POST /api/orders/place (Cart Items, Address, Applied Coupon) with Bearer JWT
    Note over BE: Middleware checks & decodes user JWT token
    BE->>DB: Check inventory stock for products in order
    alt Sufficient Stock
        BE->>DB: Create new Order record (Order Items, Applied discounts)
        BE->>DB: Deduct stock from ProductModel
        BE->>DB: Clear user's active shopping cart data if stored
        BE-->>FE: Return order confirmation + Order ID
        FE->>FE: Clear local CartContext state
        FE-->>User: Show "Order Placed Successfully" page
    else Out of Stock
        BE-->>FE: Return 400 Error ("Sorry, item X is out of stock")
        FE-->>User: Show error & let user adjust quantities
    end
```

---

### Workflow D: Customer Support & Live Chat Ticket
Users can file support tickets or initiate live chats with admins.

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant FE as React Frontend
    participant BE as Flask App Server
    participant DB as MySQL DB
    actor Admin as Admin (Dashboard)

    User->>FE: Fills support form / enters live chat message
    FE->>BE: POST /api/support/ticket (subject, message)
    BE->>DB: Insert ticket record (status="open")
    BE-->>FE: Return ticket created confirmation
    Note over Admin: Admin refreshes/polls Admin Dashboard Support section
    Admin->>FE: Views open tickets
    FE->>BE: GET /api/admin/tickets (using Admin Bearer JWT)
    BE->>DB: Query support tickets where status="open"
    DB-->>BE: Return list of tickets
    BE-->>FE: Show tickets to Admin
    Admin->>FE: Types reply and clicks "Send Answer"
    FE->>BE: POST /api/admin/tickets/reply { ticket_id: 101, message: "..." }
    BE->>DB: Insert response & change status to "replied" / "closed"
    BE-->>FE: Return response updated
```

---

## 4. Easy Explanation Strategy (Elevator Pitch)

If you need to explain this codebase to a developer, client, or stakeholder, you can use these **three simple concepts**:

### 1. The Separated "Brain" and "Body"
*   **The Frontend (Vite + React) is the "Body":** It is responsible solely for rendering views, keeping the UI fast and snappy, storing the current items you want to buy (using a local React state called `CartContext`), and checking if you are logged in (using `AuthContext`).
*   **The Backend (Flask) is the "Brain":** It runs on a server and handles all logic—verifying logins, validating coupon formulas, calculating order totals, checking database stock, and sending out emails.

### 2. The JWT Passcard (Stateless Security)
*   Instead of the server remembering who you are in a session file, once you log in (either via standard email/OTP verification or Google OAuth), the server hands you a digital passcard called a **JWT (JSON Web Token)**.
*   The frontend stores this JWT card. Every time the frontend calls the backend to place an order, apply a coupon, or fetch dashboard metrics, it places this card in the request headers. The server inspects the card, verifies its digital signature, checks your role (user or admin), and grants access dynamically.

### 3. The ORM Translator (Database communication)
*   We use a MySQL relational database to hold products, users, coupons, and orders.
*   Instead of writing raw, complex database query commands in the code, we use **SQLAlchemy ORM**. It serves as a translator, allowing developers to write simple Python code (e.g. `UserModel.query.filter_by(...)`) to write to and read from MySQL tables, keeping code clean and highly readable.
