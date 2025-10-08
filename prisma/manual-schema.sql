-- Script SQL manual para crear tablas de Profesional
-- Ejecutar en PostgreSQL

-- Tipos ENUM
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'PROFESSIONAL', 'ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');
CREATE TYPE "SlotType" AS ENUM ('RECURRING', 'ONE_TIME');
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'APPROVED', 'AUTHORIZED', 'IN_PROCESS', 'IN_MEDIATION', 'REJECTED', 'CANCELLED', 'REFUNDED', 'CHARGED_BACK');
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'FILE');
CREATE TYPE "NotificationType" AS ENUM ('BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'PAYMENT_RECEIVED', 'REVIEW_RECEIVED', 'MESSAGE_RECEIVED', 'SYSTEM_NOTIFICATION');

-- Tabla Users
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role "UserRole" NOT NULL,
    status "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP(3)
);

-- Tabla Profiles
CREATE TABLE profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    avatar TEXT,
    phone TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP(3),
    CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla Service Categories
CREATE TABLE service_categories (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    brand_id TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP(3)
);

-- Tabla Locations
CREATE TABLE locations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Professional Profiles
CREATE TABLE professional_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT UNIQUE NOT NULL,
    bio TEXT,
    description TEXT,
    price_per_session DECIMAL(10,2) NOT NULL,
    standard_duration INTEGER NOT NULL,
    service_category_id TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    location_id TEXT NOT NULL,
    rating DOUBLE PRECISION NOT NULL DEFAULT 0,
    review_count INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    brand_id TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP(3),
    CONSTRAINT professional_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT professional_profiles_service_category_id_fkey FOREIGN KEY (service_category_id) REFERENCES service_categories(id),
    CONSTRAINT professional_profiles_location_id_fkey FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- Crear índices
CREATE INDEX users_email_idx ON users(email);
CREATE INDEX users_status_idx ON users(status);
CREATE INDEX users_role_idx ON users(role);
CREATE INDEX users_created_at_idx ON users(created_at);

CREATE INDEX service_categories_slug_idx ON service_categories(slug);
CREATE INDEX service_categories_brand_id_idx ON service_categories(brand_id);

CREATE INDEX locations_province_city_idx ON locations(province, city);

CREATE INDEX professional_profiles_service_category_id_idx ON professional_profiles(service_category_id);
CREATE INDEX professional_profiles_location_id_idx ON professional_profiles(location_id);
CREATE INDEX professional_profiles_is_verified_idx ON professional_profiles(is_verified);
CREATE INDEX professional_profiles_rating_idx ON professional_profiles(rating);
CREATE INDEX professional_profiles_tags_idx ON professional_profiles USING GIN (tags);
CREATE INDEX professional_profiles_brand_id_idx ON professional_profiles(brand_id);

-- Prisma _prisma_migrations para tracking
CREATE TABLE _prisma_migrations (
    id VARCHAR(36) PRIMARY KEY NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE,
    migration_name VARCHAR(255) NOT NULL,
    logs TEXT,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    applied_steps_count INTEGER NOT NULL DEFAULT 0
);
