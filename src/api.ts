import { DatabaseState, Trip, Batch, Booking } from "./types";
import dbData from "./db.json";

// In-memory storage
let localDB: DatabaseState = dbData as DatabaseState;
let nextBookingId = localDB.bookings.length + 1;

// Simpan ke localStorage
function saveToStorage() {
  try {
    localStorage.setItem("smart-journey-db", JSON.stringify(localDB));
  } catch (e) {
    console.warn("localStorage tidak tersedia");
  }
}

// Load dari localStorage
function loadFromStorage() {
  try {
    const saved = localStorage.getItem("smart-journey-db");
    if (saved) {
      localDB = JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Gagal load dari localStorage");
  }
}

loadFromStorage();

// Helper delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchDB(): Promise<DatabaseState> {
  await delay(200);
  return { ...localDB };
}

export async function createTrip(trip: Omit<Trip, "id">): Promise<Trip> {
  await delay(300);
  const newTrip: Trip = { ...trip, id: `trip-${Date.now()}` } as Trip;
  localDB.trips.push(newTrip);
  saveToStorage();
  return newTrip;
}

export async function updateTrip(id: string, trip: Partial<Trip>): Promise<Trip> {
  await delay(300);
  const index = localDB.trips.findIndex(t => t.id === id);
  if (index === -1) throw new Error("Trip not found");
  localDB.trips[index] = { ...localDB.trips[index], ...trip } as Trip;
  saveToStorage();
  return localDB.trips[index];
}

export async function deleteTrip(id: string): Promise<void> {
  await delay(300);
  localDB.trips = localDB.trips.filter(t => t.id !== id);
  saveToStorage();
}

export async function createBatch(batch: Omit<Batch, "id">): Promise<Batch> {
  await delay(300);
  const newBatch: Batch = { ...batch, id: `batch-${Date.now()}` } as Batch;
  localDB.batches.push(newBatch);
  saveToStorage();
  return newBatch;
}

export async function updateBatch(id: string, batch: Partial<Batch>): Promise<Batch> {
  await delay(300);
  const index = localDB.batches.findIndex(b => b.id === id);
  if (index === -1) throw new Error("Batch not found");
  localDB.batches[index] = { ...localDB.batches[index], ...batch } as Batch;
  saveToStorage();
  return localDB.batches[index];
}

export async function deleteBatch(id: string): Promise<void> {
  await delay(300);
  localDB.batches = localDB.batches.filter(b => b.id !== id);
  saveToStorage();
}

export async function createBooking(
  booking: Omit<Booking, "id" | "bookingCode" | "status" | "createdAt" | "tripTitle" | "departureDate">
): Promise<Booking> {
  await delay(500);
  
  const batch = localDB.batches.find(b => b.id === booking.batchId);
  if (!batch) throw new Error("Batch not found");
  
  const trip = localDB.trips.find(t => t.id === batch.tripId);
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
  
  localDB.bookings.push(newBooking);
  saveToStorage();
  return newBooking;
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
  await delay(300);
  const index = localDB.bookings.findIndex(b => b.id === id);
  if (index === -1) throw new Error("Booking not found");
  localDB.bookings[index] = { ...localDB.bookings[index], ...updates } as Booking;
  saveToStorage();
  return localDB.bookings[index];
}

export async function adminLogin(email: string, password: string): Promise<{ token: string; success: boolean }> {
  await delay(500);
  if (email === "admin@smartjourney.com" && password === "admin123") {
    return { token: "mock-token-" + Date.now(), success: true };
  }
  throw new Error("Invalid credentials");
}

export async function purgeAllBookings(): Promise<void> {
  await delay(300);
  localDB.bookings = [];
  saveToStorage();
}