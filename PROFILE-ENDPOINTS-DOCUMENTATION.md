# 📋 API Documentation - Professional Profile Management

## Overview

Complete API documentation for managing professional profiles, including availability, reviews, and analytics endpoints.

**Base URL**: `/profiles`  
**Authentication**: JWT Bearer Token required for protected endpoints  
**Version**: 1.0  
**Last Updated**: October 17, 2025

---

## 📖 Table of Contents

1. [Core Profile Endpoints](#core-profile-endpoints)
2. [Availability Management](#availability-management)
3. [Reviews & Ratings](#reviews--ratings)
4. [Analytics & Statistics](#analytics--statistics)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Frontend Implementation Guide](#frontend-implementation-guide)

---

## 🔐 Core Profile Endpoints

### Create Professional Profile

```http
POST /profiles
```

**Auth**: JWT + Email Verified  
**Roles**: PROFESSIONAL  
**Body**: CreateProfileDto

### Get My Profile

```http
GET /profiles/me
```

**Auth**: JWT  
**Response**: Complete professional profile data

### Update My Profile

```http
PATCH /profiles/me
```

**Auth**: JWT  
**Body**: UpdateProfileDto (expanded with all fields)

### Get All Profiles (Public)

```http
GET /profiles?page=1&limit=12&sortBy=rating
```

**Auth**: Public  
**Query Params**:

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 12)
- `sortBy`: rating | name | price | createdAt

### Get Profile by Slug (Public)

```http
GET /profiles/slug/{slug}
```

**Auth**: Public

### Get Profile by ID (Public)

```http
GET /profiles/{id}
```

**Auth**: Public

### Update Specific Profile

```http
PATCH /profiles/{id}
```

**Auth**: JWT  
**Roles**: PROFESSIONAL

### Delete Profile

```http
DELETE /profiles/{id}
```

**Auth**: JWT  
**Roles**: PROFESSIONAL, ADMIN

### Toggle Active Status

```http
PATCH /profiles/me/toggle-active
```

**Auth**: JWT  
**Roles**: PROFESSIONAL

### Get Active Status

```http
GET /profiles/me/active-status
```

**Auth**: JWT  
**Roles**: PROFESSIONAL

### Configure MercadoPago

```http
PUT /profiles/me/mercadopago
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Body**: ConfigureMercadoPagoDto

### Get MercadoPago Config

```http
GET /profiles/me/mercadopago
```

**Auth**: JWT  
**Roles**: PROFESSIONAL

---

## 📅 Availability Management

### Create Availability Slot

```http
POST /profiles/me/availability
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Body**: CreateAvailabilitySlotDto

**Example - Recurring Slot**:

```json
{
  "type": "RECURRING",
  "dayOfWeek": "MONDAY",
  "startTime": "09:00",
  "endTime": "17:00",
  "isActive": true
}
```

**Example - One-time Slot**:

```json
{
  "type": "ONE_TIME",
  "specificDate": "2025-12-25",
  "specificStart": "2025-12-25T14:00:00Z",
  "specificEnd": "2025-12-25T16:00:00Z",
  "isActive": true
}
```

### Get My Availability

```http
GET /profiles/me/availability?type=RECURRING&dayOfWeek=MONDAY&isActive=true
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Query Params**:

- `type`: RECURRING | ONE_TIME
- `dayOfWeek`: MONDAY | TUESDAY | ... | SUNDAY
- `isActive`: boolean
- `fromDate`: ISO date string
- `toDate`: ISO date string

### Get Professional Availability (Public)

```http
GET /profiles/{professionalId}/availability
```

**Auth**: Public  
**Query Params**: Same as above

### Update Availability Slot

```http
PATCH /profiles/me/availability/{slotId}
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Body**: UpdateAvailabilitySlotDto

### Delete Availability Slot

```http
DELETE /profiles/me/availability/{slotId}
```

**Auth**: JWT  
**Roles**: PROFESSIONAL

---

## ⭐ Reviews & Ratings

### Get My Reviews

```http
GET /profiles/me/reviews?page=1&limit=10&rating=5&hasResponse=false&orderBy=createdAt&orderDirection=desc
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Query Params**:

- `page`: Page number
- `limit`: Items per page
- `rating`: Filter by rating (1-5)
- `hasResponse`: Filter by response status
- `orderBy`: createdAt | rating
- `orderDirection`: asc | desc

### Get My Review Statistics

```http
GET /profiles/me/reviews/stats
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Response**:

```json
{
  "totalReviews": 45,
  "averageRating": 4.7,
  "ratingDistribution": {
    "5": 30,
    "4": 10,
    "3": 3,
    "2": 1,
    "1": 1
  },
  "recentReviews": [...]
}
```

### Respond to Review

```http
POST /profiles/me/reviews/{reviewId}/respond
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Body**:

```json
{
  "response": "Thank you for your feedback! I'm glad you enjoyed our session."
}
```

### Get Professional Reviews (Public)

```http
GET /profiles/{professionalId}/reviews
```

**Auth**: Public  
**Query Params**: Same as "Get My Reviews"

---

## 📊 Analytics & Statistics

### Get Comprehensive Analytics

```http
GET /profiles/me/analytics?fromDate=2025-09-01&toDate=2025-10-17&period=month
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Query Params**:

- `fromDate`: Start date (ISO string)
- `toDate`: End date (ISO string)
- `period`: day | week | month | year

**Response**:

```json
{
  "bookingStats": {...},
  "revenueStats": {...},
  "profileStats": {...},
  "period": {
    "from": "2025-09-01T00:00:00Z",
    "to": "2025-10-17T23:59:59Z"
  },
  "lastUpdated": "2025-10-17T15:30:00Z"
}
```

### Get Booking Statistics

```http
GET /profiles/me/analytics/bookings
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Response**:

```json
{
  "totalBookings": 120,
  "completedBookings": 105,
  "cancelledBookings": 10,
  "pendingBookings": 5,
  "completionRate": 87.5,
  "averageSessionDuration": 60,
  "bookingsByPeriod": [
    { "period": "2025-09", "count": 45 },
    { "period": "2025-10", "count": 35 }
  ]
}
```

### Get Revenue Statistics

```http
GET /profiles/me/analytics/revenue
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Response**:

```json
{
  "totalRevenue": 2625000,
  "revenueThisMonth": 875000,
  "revenueLastMonth": 1125000,
  "averageSessionValue": 25000,
  "revenueByPeriod": [
    { "period": "2025-09", "amount": 1125000 },
    { "period": "2025-10", "amount": 875000 }
  ],
  "paymentMethodStats": {
    "mercadopago": 2625000,
    "other": 0
  }
}
```

### Get Profile Statistics

```http
GET /profiles/me/analytics/profile
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Response**:

```json
{
  "profileViews": 1250,
  "profileViewsThisMonth": 420,
  "conversionRate": 9.6,
  "averageRating": 4.7,
  "totalReviews": 45,
  "responseRate": 95.2,
  "averageResponseTime": 45
}
```

### Get Popular Times

```http
GET /profiles/me/analytics/popular-times
```

**Auth**: JWT  
**Roles**: PROFESSIONAL  
**Response**:

```json
{
  "dayOfWeek": [
    { "day": "Monday", "bookings": 25, "percentage": 20.8 },
    { "day": "Tuesday", "bookings": 30, "percentage": 25.0 }
  ],
  "hourOfDay": [
    { "hour": 9, "bookings": 15, "percentage": 12.5 },
    { "hour": 10, "bookings": 20, "percentage": 16.7 }
  ],
  "monthOfYear": [
    { "month": "January", "bookings": 35, "percentage": 14.6 },
    { "month": "February", "bookings": 40, "percentage": 16.7 }
  ]
}
```

---

## 📄 Data Models

### UpdateProfileDto (Expanded)

```typescript
{
  email?: string;                    // Professional email
  name?: string;                     // Professional name
  bio?: string;                      // Short bio (max 500 chars)
  description?: string;              // Long description (max 2000 chars)
  pricePerSession?: number;          // Price per session (decimal)
  standardDuration?: number;         // Duration in minutes (min 15)
  serviceCategoryId?: string;        // Service category ID
  tags?: string[];                   // Array of tags
  locationId?: string;               // Location ID
  avatar?: string;                   // Avatar URL
  phone?: string;                    // Phone number
  website?: string;                  // Website URL
  location?: string;                 // Location string
  isActive?: boolean;                // Active status
  // User fields for backward compatibility
  firstName?: string;
  lastName?: string;
}
```

### CreateAvailabilitySlotDto

```typescript
{
  type: 'RECURRING' | 'ONE_TIME';
  // For recurring slots
  dayOfWeek?: 'MONDAY' | 'TUESDAY' | ... | 'SUNDAY';
  startTime?: string;                // HH:mm format
  endTime?: string;                  // HH:mm format
  // For one-time slots
  specificDate?: string;             // ISO date string
  specificStart?: string;            // ISO datetime string
  specificEnd?: string;              // ISO datetime string
  isActive?: boolean;                // Default: true
}
```

### ReviewResponseDto

```typescript
{
  response: string; // 10-500 characters
}
```

### AnalyticsQueryDto

```typescript
{
  fromDate?: string;                 // ISO date string
  toDate?: string;                   // ISO date string
  period?: 'day' | 'week' | 'month' | 'year';
}
```

---

## ⚠️ Error Handling

### Common Error Responses

#### 401 Unauthorized

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

#### 403 Forbidden

```json
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}
```

#### 404 Not Found

```json
{
  "statusCode": 404,
  "message": "Professional profile not found for this user",
  "error": "Not Found"
}
```

#### 400 Bad Request

```json
{
  "statusCode": 400,
  "message": [
    "startTime must be in HH:mm format",
    "type must be one of the following values: RECURRING, ONE_TIME"
  ],
  "error": "Bad Request"
}
```

---

## 🚀 Frontend Implementation Guide

### 1. API Client Setup

```typescript
// Base configuration
const API_BASE_URL = 'https://your-api.com/profiles';
const authToken = localStorage.getItem('jwt_token');

// Headers for authenticated requests
const authHeaders = {
  Authorization: `Bearer ${authToken}`,
  'Content-Type': 'application/json',
};
```

### 2. TypeScript Interfaces

Create interfaces matching the DTOs:

- `ProfessionalProfile`
- `AvailabilitySlot`, `SlotType`, `DayOfWeek`
- `Review`, `ReviewStats`
- `Analytics`, `BookingStats`, `RevenueStats`

### 3. Key Features to Implement

#### Dashboard Overview

- Metrics cards (bookings, revenue, rating)
- Quick actions (toggle active, view reviews)
- Recent activity feed

#### Availability Management

- Calendar view for availability slots
- Form to create recurring/one-time slots
- Drag & drop to edit times
- Bulk enable/disable slots

#### Reviews Management

- List of reviews with pagination
- Response form for unanswered reviews
- Statistics dashboard with charts
- Filter and sort options

#### Analytics Dashboard

- Date range picker
- Charts for bookings/revenue trends
- Popular times heatmap
- Export functionality

### 4. UI/UX Recommendations

#### Components Needed

- **Calendar Component**: For availability management
- **Chart Components**: For analytics (Line, Bar, Pie, Heatmap)
- **Rating Component**: Star display for reviews
- **Form Components**: Validated forms for all CRUD operations
- **Table Component**: Sortable, filterable tables
- **Modal/Drawer**: For forms and details

#### Responsive Design

- Mobile-first approach
- Collapsible sidebar navigation
- Card-based layout for mobile
- Appropriate touch targets

#### State Management

- Loading states for all async operations
- Error handling with user-friendly messages
- Optimistic updates where appropriate
- Cache management for analytics data

### 5. Performance Considerations

- Lazy load heavy components
- Debounce search/filter inputs
- Cache analytics data (5-10 minutes)
- Virtual scrolling for large lists
- Image optimization for avatars

### 6. Security

- Validate JWT tokens
- Handle token refresh
- Sanitize user inputs
- Protect sensitive data display

---

## 📞 Support & Contact

For technical support or questions about this API:

- **Repository**: [profesional-api](https://github.com/marcosstevens2012/profesional-api)
- **Documentation**: This file
- **Last Updated**: October 17, 2025

---

## 🔄 Changelog

### v1.0.0 - October 17, 2025

- ✅ Initial implementation of all professional profile endpoints
- ✅ Availability management system (recurring and one-time slots)
- ✅ Reviews and ratings system with response capability
- ✅ Comprehensive analytics dashboard
- ✅ Expanded profile management
- ✅ MercadoPago integration
- ✅ Complete TypeScript DTOs and validation
