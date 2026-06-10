import { DatabaseState, Trip, Batch, Booking } from "./types";

const API_BASE = "/api";

export async function fetchDB(): Promise<DatabaseState> {
  const res = await fetch(`${API_BASE}/db`);
  if (!res.ok) throw new Error("Failed to load Smart Journey booking database");
  return res.json();
}

export async function createTrip(trip: Omit<Trip, "id">): Promise<Trip> {
  const res = await fetch(`${API_BASE}/trips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trip),
  });
  if (!res.ok) throw new Error("Failed to create trip");
  return res.json();
}

export async function updateTrip(id: string, trip: Partial<Trip>): Promise<Trip> {
  const res = await fetch(`${API_BASE}/trips/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(trip),
  });
  if (!res.ok) throw new Error("Failed to update trip");
  return res.json();
}

export async function deleteTrip(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/trips/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete trip");
}

export async function createBatch(batch: Omit<Batch, "id">): Promise<Batch> {
  const res = await fetch(`${API_BASE}/batches`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(batch),
  });
  if (!res.ok) throw new Error("Failed to create batch");
  return res.json();
}

export async function updateBatch(id: string, batch: Partial<Batch>): Promise<Batch> {
  const res = await fetch(`${API_BASE}/batches/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(batch),
  });
  if (!res.ok) throw new Error("Failed to update batch");
  return res.json();
}

export async function deleteBatch(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/batches/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete batch");
}

export async function createBooking(
  booking: Omit<Booking, "id" | "bookingCode" | "status" | "createdAt" | "tripTitle" | "departureDate">
): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to submit booking registration");
  }
  return res.json();
}

export async function updateBooking(id: string, updates: Partial<Booking>): Promise<Booking> {
  const res = await fetch(`${API_BASE}/bookings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update booking verification status");
  return res.json();
}

export async function adminLogin(email: string, password: string): Promise<{ token: string; success: boolean }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Authentication failed");
  }
  return res.json();
}

export async function purgeAllBookings(): Promise<void> {
  const res = await fetch(`${API_BASE}/bookings/purge`, {
    method: "POST"
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to purge booking history");
  }
}
