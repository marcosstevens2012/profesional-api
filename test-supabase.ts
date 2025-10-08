#!/usr/bin/env ts-node

// Test script to verify Supabase connection
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function testSupabaseConnection() {
  try {
    console.log("🔄 Testing Supabase connection...");

    // Test 1: Basic connection
    await prisma.$connect();
    console.log("✅ Successfully connected to Supabase database");

    // Test 2: Check if tables exist and get count
    const userCount = await prisma.user.count();
    console.log(`📊 Users in database: ${userCount}`);

    const categoryCount = await prisma.serviceCategory.count();
    console.log(`📊 Service categories in database: ${categoryCount}`);

    const locationCount = await prisma.location.count();
    console.log(`📊 Locations in database: ${locationCount}`);

    // Test 3: Query database info
    const dbInfo = await prisma.$queryRaw`SELECT version() as version`;
    console.log("🗄️  Database info:", dbInfo);

    console.log("🎉 All tests passed! Supabase is working correctly.");
  } catch (error) {
    console.error("❌ Error testing Supabase connection:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testSupabaseConnection();
