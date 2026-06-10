import { DatabaseState, Trip, Batch, Booking } from "./types";

// Load data dari public/db.json
let localDB: DatabaseState | null = null;
let nextBookingId = 1;

async function loadDB(): Promise<DatabaseState> {
  if (localDB) return localDB;
  
  // Coba load dari localStorage dulu
  try {
    const saved = localStorage.getItem("smart-journey-db");
    if (saved) {
      localDB = JSON.parse(saved);
      return localDB;
    }
  } catch (e) {
    console.warn("Gagal load dari localStorage");
  }
  
  // Load dari public/db.json
  const res = await fetch("/db.json");
  if (!res.ok) throw new Error("Failed to load database");
  localDB = await res.json();
  nextBookingId = localDB.bookings.length + 1;
  return localDB;
}

function saveToStorage() {
  try {
    localStorage.setItem("smart-journey-db", JSON.stringify(localDB));
  } catch (e) {
    console.warn("localStorage tidak tersedia");
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchDB(): Promise<DatabaseState> {
  await delay(200);
  return await loadDB();
}

export async function createTrip(trip: Omit<Trip, "id">): Promise<Trip> {
  const db = await loadDB();
  await delay(300);
  const newTrip: Trip = { ...trip, id: `trip-${Date.now()}` } as Trip;
  db.trips.push(newTrip);
  saveToStorage();
  return newTrip;
}

export async function updateTrip(id: string, trip: Partial<Trip>): Promise<Trip> {
  const db = await loadDB();
  await delay(300);
  const index = db.trips.findIndex(t => t.id === id);
  if (index === -1) throw new Error("Trip not found");
  db.trips[index] = { ...db.trips[index], ...trip } as Trip;
  saveToStorage();
  return db.trips[index];
}

export async function deleteTrip(id: string): Promise<void> {
  const db = await loadDB();
  await delay(300);
  db.trips = db.trips.filter(t => t.id !== id);
  saveToStorage();
}

export async function createBatch(batch: Omit<Batch, "id">): Promise<Batch> {
  const db = await loadDB();
  await delay(300);
  const newBatch: Batch = { ...batch, id: `batch-${Date.now()}` } as Batch;
  db.batches.push(newBatch);
  saveToStorage();
  return newBatch;
}

export async function updateBatch(id: string, batch: Partial<Batch>): Promise<Batch> {
  const db = await loadDB();
  await delay(300);
  const index = db.batches.findIndex(b => b.id === id);
  if (index === -1) throw new Error("Batch not found");
  db.batches[index] = { ...db.batches[index], ...batch } as Batch;
  saveToStorage();
  return db.batches[index];
}

export async function deleteBatch(id: string): Promise<void> {
  const db = await loadDB();
  await delay(300);
  db.batches = db.batches.filter(b => b.id !== id);
  saveToStorage();
}

export async function createBooking(
  booking: Omit<Booking, "id" | "bookingCode" | "status" | "createdAt" | "tripTitle" | "departureDate">
): Promise<Booking> {
  const db = await loadDB();
  await delay(500);
  
  const batch = db.batches.find(b => b.id === booking.batchId);
  if (!batch) throw new Error("Batch not found");
  
  const trip = db.trips.find(t => t.id === batch.tripId);
  if (!trip) throw new Error("Trip not found");
  
  const bookingCode = "SJ-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const newBooking: Booking = {
    ...booking,
    id: `booking-${nextBookingId++}`,
    bookingCode,
    status: "pending",
    createdAt: new Date().toISOString(),
    tripTitle: trip.title,
    departureDate: batch.departureDate,
  } as Booking;
  
  db.bookings.push(newBooking);
  saveToStorage();
  return newBooking;
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
  const db = await loadDB();
  await delay(300);
  const index = db.bookings.findIndex(b => b.id === id);
  if (index === -1) throw new Error("Booking not found");
  db.bookings[index] = { ...db.bookings[index], ...updates } as Booking;
  saveToStorage();
  return db.bookings[index];
}

export async function adminLogin(email: string, password: string): Promise<{ token: string; success: boolean }> {
  await delay(500);
  if (email === "admin@smartjourney.com" && password === "admin123") {
    return { token: "mock-token-" + Date.now(), success: true };
  }
  throw new Error("Invalid credentials");
}

export async function purgeAllBookings(): Promise<void> {
  const db = await loadDB();
  await delay(300);
  db.bookings = [];
  saveToStorage();
}