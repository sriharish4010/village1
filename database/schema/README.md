# Village1 Database Architecture & Entity Relationship (ER) Diagram

This document details the database schema design for **Village1**, optimized for MySQL in production with Prisma ORM and SQLite compatibility for local testing.

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| CustomerProfile : "has"
    User ||--o{ UserAddress : "maintains"
    User ||--o{ RefreshToken : "owns"
    User ||--o{ ShopMember : "is member of"
    User ||--o{ Order : "places"
    User ||--o{ Appointment : "books"
    User ||--o{ QueueToken : "holds"
    User ||--o{ Review : "writes"
    User ||--o{ Complaint : "files"
    User ||--o{ AuditLog : "triggers"

    ShopCategory ||--o{ Shop : "categorizes"
    
    Shop ||--o{ ShopMember : "employs"
    Shop ||--o{ Product : "sells"
    Shop ||--o{ Order : "receives"
    Shop ||--o{ ShopService : "offers"
    Shop ||--o{ Appointment : "schedules"
    Shop ||--o{ QueueToken : "issues"
    Shop ||--o{ Review : "reviewed by"
    Shop ||--o{ Complaint : "targeted by"

    Order ||--|{ OrderItem : "contains"
    Order ||--o{ OrderEvent : "logs"
    Order ||--o| CancellationRequest : "may have"
    Order ||--o{ ReplacementRequest : "may have"
    Order ||--o{ Payment : "settled with"

    Product ||--o{ OrderItem : "referenced in"
    ShopService ||--o{ Appointment : "reserved in"
    Appointment ||--o| QueueToken : "associated with"

    User {
        string id PK
        string phone UK
        string email UK
        string passwordHash
        enum role "CUSTOMER, SHOPKEEPER, ADMIN"
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }

    RefreshToken {
        string id PK
        string tokenHash UK
        string userId FK
        datetime expiresAt
        datetime revokedAt
        datetime createdAt
    }

    CustomerProfile {
        string id PK
        string userId FK, UK
        string fullName
        string village
        string district
        string state
        string pinCode
        string preferredLanguage
    }

    UserAddress {
        string id PK
        string userId FK
        string addressLine
        string village
        string district
        string state
        string pinCode
        boolean isDefault
    }

    ShopCategory {
        string id PK
        string name
        string slug UK
        string icon
        boolean isActive
    }

    Shop {
        string id PK
        string name
        string slug UK
        string categoryId FK
        string address
        string village
        string district
        string state
        string pinCode
        string phone
        string openingHours
        string closingHours
        enum verificationStatus "PENDING, APPROVED, REJECTED, SUSPENDED"
        boolean isActive
    }

    ShopMember {
        string id PK
        string shopId FK
        string userId FK
        enum role "OWNER, MANAGER, STAFF"
        string permissions
    }

    Product {
        string id PK
        string shopId FK
        string name
        float price
        int stock
        string unit
        boolean isAvailable
    }

    Order {
        string id PK
        string orderNumber UK
        string shopId FK
        string customerId FK
        enum status "PENDING, ACCEPTED, REJECTED, PREPARING, READY_FOR_PICKUP, COLLECTED, COMPLETED, CANCELLED"
        string pickupCode
        float totalAmount
        float subtotalAmount
        enum paymentMethod "CASH_ON_PICKUP, UPI_QR, ONLINE"
        enum paymentStatus "PENDING, PAID, REFUNDED"
    }

    OrderItem {
        string id PK
        string orderId FK
        string productId FK
        string productName "Snapshot"
        float unitPrice "Snapshot"
        int quantity
        float totalPrice "Snapshot"
    }

    ShopService {
        string id PK
        string shopId FK
        string name
        float price
        int durationMinutes
        boolean isAvailable
    }

    Appointment {
        string id PK
        string bookingNumber UK
        string shopId FK
        string customerId FK
        string serviceId FK
        datetime appointmentDate
        string startTime
        string endTime
        enum status "PENDING, CONFIRMED, CHECKED_IN, WAITING, IN_SERVICE, COMPLETED, CANCELLED"
    }
```

## Key Architectural Rules

1. **Snapshots for Orders**:
   - `OrderItem` preserves `productName`, `unitPrice`, and `totalPrice` as historical immutable snapshots. Modifying or deleting product definitions in the shop catalog never alters existing completed orders.
2. **Multi-Shop Ownership & Membership**:
   - Handled via `ShopMember` with a unique constraint on `(shopId, userId)`. A user can own multiple shops and be authorized staff for another shop.
3. **No Negative Stock**:
   - Inventory decrements execute in database transactions with strict non-negative condition checks.
4. **Token Security**:
   - Refresh tokens are cryptographically hashed using SHA-256 before storage in `RefreshToken`. Automatic token reuse detection revokes all active tokens upon compromise.
5. **Role & Verification Separation**:
   - Only shops with `verificationStatus = APPROVED` and `isActive = true` are displayed for public commerce.
