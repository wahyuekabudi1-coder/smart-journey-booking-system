import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { Trip, Batch, Booking, DatabaseState } from "./src/types.js";

// Handle ESM dir paths since we are running as a custom ESM server
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "src", "db.json");

// Helper to generate a unique booking code: SJ-[6 RANDOM ALPHANUMERIC CHARACTERS]
// Alphanumeric: A-Z, 2-9; Exclude: I, O, 1, 0 to avoid confusion.
function generateUniqueBookingCode(existingCodes: string[]): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let attempt = 0;
  while (attempt < 1000) {
    let code = "SJ-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Case-insensitive check just in case, although generated codes are always uppercase
    const exists = existingCodes.some(c => c.toUpperCase() === code.toUpperCase());
    if (!exists) {
      return code;
    }
    attempt++;
  }
  // Fallback
  return "SJ-" + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Initial Mock/Pre-seeded DB
const defaultDB: DatabaseState = {
  trips: [
    {
      id: "trip-1",
      title: "Labuan Bajo Komodo Liveaboard Adventure",
      slug: "labuan-bajo",
      location: "Labuan Bajo, Nusa Tenggara Timur",
      duration: "3 Days 2 Nights",
      description: "Sail across the crystalline waters of Komodo National Park on a luxury pinisi boat. Hike up Padar Island, walk alongside ancient Komodo dragons on Rinca, relax on the vibrant Pink Beach, and swim with graceful manta rays at Manta Point.",
      coverImage: "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=80",
      included: [
        "Luxury AC Cabin Pinisi Boat (3D2N)",
        "Professional local diver guide & captain",
        "National Park entrance fees & ranger fees",
        "All meals (Breakfast, Lunch, Dinner) onboard",
        "Snorkeling gear & life jackets",
        "Airport or hotel pickup/drop-off"
      ],
      excluded: [
        "Flights to/from Labuan Bajo (LBJ)",
        "Personal travel insurance",
        "Alcoholic beverages & personal souvenir shopping",
        "Tipping for boat crew and guide"
      ],
      highlight: "Sail on a luxury double-deck Pinisi boat, conquer Padar Island's triple-bay viewpoints, snorkel with wild manta rays, and track prehistoric dragons guided by Rangers.",
      gallery: [
        "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1605538032432-a9f0c8d9baac?auto=format"
      ],
      faq: [
        {
          question: "When is the best season to sail Komodo?",
          answer: "The absolute best window is from April to December, offering blue skies, calm ocean currents, and maximal manta and turtle activity."
        },
        {
          question: "Are flights included in the pricing?",
          answer: "No, guests are responsible for booking their domestic or international flights to Labuan Bajo (LBJ) Airport."
        }
      ],
      status: "published",
      startingPrice: 250,
      price: 250,
      itinerary: [
        {
          day: 1,
          title: "Kelor Island Trekking & Kalong Bat Sunset",
          description: "Arrive at Labuan Bajo Airport. Meet our guide and transfer to the harbor. Board our Pinisi boat, enjoy welcome drinks, and start sailing. First stop is Kelor Island for a short uphill trek with panoramic ocean views. Snorkeling at Manjarite. Anchor next to Kalong Island to witness thousands of giant flying foxes fill the spectacular sunset sky.",
          timeSchedules: [
            { time: "09:00", activity: "Airport Meetup & Guided Harbor Transfer" },
            { time: "11:00", activity: "Trekking Kelor Island & Ocean Lookout" },
            { time: "14:30", activity: "Snorkeling at pristine Manjarite reef" },
            { time: "17:30", activity: "Kalong Island sunset bat migration watching" }
          ]
        },
        {
          day: 2,
          title: "Padar Island Hike, Pink Beach & Komodo Dragon Hunt",
          description: "Early morning hike to the summit of Padar Island for the legendary three-bay panoramic photo. Continue to Pink Beach for swimming and relaxing. Sail to Rinca Island/Komodo Island for a guided trek with rangers to observe Komodo dragons in their natural habitat. Head over to Manta Point for an unforgettable swim with wild manta rays.",
          timeSchedules: [
            { time: "05:00", activity: "Summit Sunrise Hike up Padar Island" },
            { time: "09:30", activity: "Lounge and swim at the unique Pink Beach" },
            { time: "13:00", activity: "Ranger-guided search for Komodo Dragons" },
            { time: "15:30", activity: "Snorkeling safari with Mantas at Manta Point" }
          ]
        },
        {
          day: 3,
          title: "Kanawa Island Relaxation & Airport Return",
          description: "Savor local breakfast on deck, then sail to Kanawa Island, a private paradise with white sandy beaches and an active house reef overflowing with vibrant marine life. After a final lunch onboard, transfer back to Labuan Bajo Harbor and proceed to the airport for your flight home.",
          timeSchedules: [
            { time: "07:30", activity: "Breakfast on deck and Kanawa island sailing" },
            { time: "11:00", activity: "House reef marine snorkeling safari" },
            { time: "14:00", activity: "Airport drops and guest departures" }
          ]
        }
      ]
    },
    {
      id: "trip-2",
      title: "Ancient Java: Bromo Sunrise & Mt. Ijen Blue Fire",
      slug: "bromo-ijen",
      location: "East Java (Probolinggo & Banyuwangi)",
      duration: "3 Days 2 Nights",
      description: "Witness the surreal sea of sand surrounding Mount Bromo, feel the cold mountain air as the sun rises over smoke-venting volcanos, and venture deep inside Mount Ijen to see the magical neon-blue sulfuric fire of Banyuwangi.",
      coverImage: "https://images.unsplash.com/photo-1605538032432-a9f0c8d9baac?auto=format&fit=crop&w=1200&q=80",
      included: [
        "AC Transport throughout Java tour (3 days)",
        "4x4 Private Jeep in Mount Bromo",
        "Local mountain guides for Bromo & Ijen",
        "Entrance fees for Bromo and Ijen National Parks",
        "1 Night at Bromo mountain lodge, 1 Night at Banyuwangi hotel",
        "Gas masks for Mt. Ijen sulfuric fumes",
        "Daily mineral water and breakfast"
      ],
      excluded: [
        "Lunch and Dinner meals",
        "Horse riding fees in Bromo",
        "Flights or trains to Surabaya/Malang",
        "Tips for guides and drivers"
      ],
      highlight: "Private 4x4 Jeep sunrise convoy across Bromo's whispering sand sea, and a midnight trek into Ijen crater to see the rare glowing sulfuric blue flame.",
      gallery: [
        "https://images.unsplash.com/photo-1605538032432-a9f0c8d9baac?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format"
      ],
      faq: [
        {
          question: "Do you supply protective equipment?",
          answer: "Yes, we provide professional active-carbon gas masks and headlamps for the Mt. Ijen sulfur hike."
        }
      ],
      status: "published",
      startingPrice: 150,
      price: 150,
      itinerary: [
        {
          day: 1,
          title: "Pick up from Surabaya & Bromo Mountain Check-in",
          description: "Pick up from Surabaya Airport/Train Station. Enjoy a private scenic 4-hour drive to Cemoro Lawang village. Check into your cozy room sitting directly on the rim of the Tengger Caldera. Feel the crisp mountain air and rest early for the pre-dawn expedition.",
          timeSchedules: [
            { time: "12:00", activity: "Surabaya airport pickup & meet private driver" },
            { time: "16:00", activity: "Check-in at mountain caldera overlook lodge" }
          ]
        },
        {
          day: 2,
          title: "Bromo Sunrise, Crater Trek & Banyuwangi Drive",
          description: "Wake up at 3:00 AM. Board your private 4x4 Jeep to Penanjakan viewpoint to witness the world-famous sunrise over Mt. Bromo, Mt. Batok, and Mt. Semeru. Afterward, cross the dramatic Whispering Sand and hike 250 steps to Bromo's active crater rim. Return, check out, and take a 6-hour scenic drive to Banyuwangi.",
          timeSchedules: [
            { time: "03:00", activity: "Board 4x4 Offroad Jeep to sunrise overlook" },
            { time: "08:00", activity: "Volcanic crater rim hike & Whispering Sand crossing" },
            { time: "12:00", activity: "Checkout and transfer drive to Banyuwangi" }
          ]
        },
        {
          day: 3,
          title: "Ijen Midnight Hike, Blue Flame Experience & Bali Ferry Transfer",
          description: "Start at 1:00 AM. Hike 2 hours up Mount Ijen. Descent safely into the crater alongside sulfur miners to see the stunning Neon Blue Acid Flames of Ijen. Walk around the giant turquoise acidic lake at sunrise. Return to base for breakfast, then transfer to Banyuwangi harbor or catch a ferry to Bali.",
          timeSchedules: [
            { time: "01:00", activity: "Midnight departure and trek up Mt. Ijen summit" },
            { time: "03:30", activity: "Sulfur crater descent & glowing blue fire viewing" },
            { time: "06:00", activity: "Sunrise view over toxic acid green lake" },
            { time: "11:00", activity: "Breakfast checkout & ferry transfer drop-off" }
          ]
        }
      ]
    },
    {
      id: "trip-3",
      title: "Nusa Penida Ultimate Tropical Gateway",
      slug: "nusa-penida",
      location: "Nusa Penida, Bali",
      duration: "2 Days 1 Night",
      description: "Take a fast boat from mainland Bali to discover the dramatic towering cliffs and pristine white beaches of Nusa Penida. Visit the famous T-Rex cliff of Kelingking beach, swim with marine life, and swim in natural pools.",
      coverImage: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
      included: [
        "Round-trip Fast Boat tickets from Sanur to Nusa Penida",
        "Private AC car & driver in Nusa Penida",
        "Entrance fees and island parking permits",
        "Snorkeling excursion (Manta Bay, Crystal Bay, Gamat Bay)",
        "1 Night stay at a tropical boutique hotel with pool",
        "Breakfast & 2x Local lunches"
      ],
      excluded: [
        "Dinner meals",
        "Personal shopping & tips",
        "Hotel pickup in mainland Bali (optional add-on)"
      ],
      highlight: "Visit the famous dinosaur head Kelingking cliff edge, ride a high-speed catamaran, and walk down the spectacular Diamond Beach staircase.",
      gallery: [
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"
      ],
      faq: [
        {
          question: "How long is the boat trip?",
          answer: "The modern fast catamaran ride takes approximately 40 minutes from Sanur beach harbor."
        }
      ],
      status: "published",
      startingPrice: 110,
      price: 110,
      itinerary: [
        {
          day: 1,
          title: "Fast Boat Cruise & West Penida Expedition",
          description: "Gather at Sanur beach harbor. Cross to Nusa Penida on a fast catamaran. Hop onto your private car to visit the legendary Kelingking Cliff (T-Rex ocean overlook), Broken Beach volcanic arch, and Angel's Billabong emerald infinity tide pool. Rest up in your Penida resort.",
          timeSchedules: [
            { time: "07:30", activity: "Sanur beach harbor checkout boarding" },
            { time: "09:30", activity: "Cliff side photography at Kelingking dinosaur head" },
            { time: "14:00", activity: "Tide pools exploring at Angel's Billabong" }
          ]
        },
        {
          day: 2,
          title: "Snorkeling Safari, Diamond Beach & Fast Boat to Bali",
          description: "Start the day Snorkeling from our custom boat with guides to look for Mantas at Manta Bay. Then visit the spectacular pristine sandy staircase of Diamond Beach and Tree House overlook. Cross back to Sanur beach Bali in the afternoon.",
          timeSchedules: [
            { time: "08:00", activity: "Ocean snorkeling for marine life and wild mantas" },
            { time: "11:00", activity: "Trekking down pristine Diamond beach staircase" },
            { time: "15:30", activity: "Fast catamaran sailing and back to mainland Bali" }
          ]
        }
      ]
    }
  ],
  batches: [
    {
      id: "batch-1",
      tripId: "trip-1",
      departureDate: "2026-07-15",
      quota: 12,
      availableSeats: 8,
      price: 250,
      status: "Open"
    },
    {
      id: "batch-2",
      tripId: "trip-1",
      departureDate: "2026-08-10",
      quota: 12,
      availableSeats: 12,
      price: 260,
      status: "Open"
    },
    {
      id: "batch-3",
      tripId: "trip-1",
      departureDate: "2026-09-05",
      quota: 12,
      availableSeats: 0,
      price: 250,
      status: "Closed"
    },
    {
      id: "batch-4",
      tripId: "trip-2",
      departureDate: "2026-07-22",
      quota: 12,
      availableSeats: 9,
      price: 150,
      status: "Open"
    },
    {
      id: "batch-5",
      tripId: "trip-2",
      departureDate: "2026-08-18",
      quota: 12,
      availableSeats: 12,
      price: 150,
      status: "Open"
    },
    {
      id: "batch-6",
      tripId: "trip-3",
      departureDate: "2026-07-01",
      quota: 12,
      availableSeats: 11,
      price: 110,
      status: "Open"
    },
    {
      id: "batch-7",
      tripId: "trip-3",
      departureDate: "2026-08-12",
      quota: 12,
      availableSeats: 12,
      price: 115,
      status: "Open"
    }
  ],
  bookings: [
    {
      id: "book-1",
      bookingCode: "SJ-W8F3T",
      tripId: "trip-1",
      tripTitle: "Labuan Bajo Komodo Liveaboard Adventure",
      batchId: "batch-1",
      departureDate: "2026-07-15",
      fullName: "Pratama Wijaya",
      email: "pratama@example.com",
      phone: "+62 812-3456-7890",
      participantsCount: 1,
      participantsNames: ["Pratama Wijaya"],
      proofOfPayment: "NOT_APPLICABLE_SLEEK_THEME",
      status: "Confirmed",
      totalPrice: 250,
      createdAt: "2026-06-01T10:00:00.000Z",
      participantData: {
        name: "Pratama Wijaya",
        englishName: "Pratama Wijaya",
        weChatId: "pratama_wx",
        xiaoHongShuId: "pratama_red",
        city: "Jakarta",
        whatsapp: "+62 812-3456-7890",
        email: "pratama@example.com",
        flightNumber: "GA412"
      }
    },
    {
      id: "book-2",
      bookingCode: "SJ-K2P9D",
      tripId: "trip-2",
      tripTitle: "Ancient Java: Bromo Sunrise & Mt. Ijen Blue Fire",
      batchId: "batch-4",
      departureDate: "2026-07-22",
      fullName: "Michael Chang",
      email: "michael@example.com",
      phone: "+65 9123 4567",
      participantsCount: 1,
      participantsNames: ["Michael Chang"],
      proofOfPayment: "NOT_APPLICABLE_SLEEK_THEME",
      status: "Pending",
      totalPrice: 150,
      createdAt: "2026-06-03T14:30:00.000Z",
      participantData: {
        name: "Michael Chang",
        englishName: "Michael Chang",
        weChatId: "mike_wechat",
        xiaoHongShuId: "mike_red",
        city: "Singapore",
        whatsapp: "+65 9123 4567",
        email: "michael@example.com",
        flightNumber: "SQ956"
      }
    },
    {
      id: "book-3",
      bookingCode: "SJ-R9Q2X",
      tripId: "trip-3",
      tripTitle: "Nusa Penida Ultimate Tropical Gateway",
      batchId: "batch-6",
      departureDate: "2026-07-01",
      fullName: "Dewi Safitri",
      email: "dewi@example.com",
      phone: "+62 821-9988-1122",
      participantsCount: 1,
      participantsNames: ["Dewi Safitri"],
      proofOfPayment: "NOT_APPLICABLE_SLEEK_THEME",
      status: "Rejected",
      rejectReason: "Incorrect flight details provided. Please review flight info.",
      totalPrice: 110,
      createdAt: "2026-06-04T08:15:00.000Z",
      participantData: {
        name: "Dewi Safitri",
        englishName: "Dewi Safitri",
        weChatId: "dewi_wx",
        xiaoHongShuId: "dewi_red",
        city: "Surabaya",
        whatsapp: "+62 821-9988-1122",
        email: "dewi@example.com",
        flightNumber: "JT804"
      }
    }
  ]
};

// Ensure db directory structure and seed file
function readDB(): DatabaseState {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const parentDir = path.dirname(DB_PATH);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2), "utf8");
      return defaultDB;
    }
    const raw = fs.readFileSync(DB_PATH, "utf8");
    const db = JSON.parse(raw) as DatabaseState;
    // Check if db is using rupiah prices instead of USD (startingPrice > 50000)
    const needsUSDConversion = db.trips.some(t => t.startingPrice > 10000);
    if (needsUSDConversion) {
      console.log("Upgrading Smart Journey database to sleek USD structure...");
      fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2), "utf8");
      return defaultDB;
    }
    return db;
  } catch (error) {
    console.error("Error reading database file, returning default map:", error);
    return defaultDB;
  }
}

function writeDB(data: DatabaseState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing database file:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with a larger limit for proof of payment strings
  app.use(express.json({ limit: "15mb" }));

  // API Endpoints
  // Get database state
  app.get("/api/db", (req, res) => {
    try {
      const db = readDB();
      res.json(db);
    } catch {
      res.status(500).json({ error: "Failed to read database state" });
    }
  });

  // Trip endpoints
  app.post("/api/trips", (req, res) => {
    try {
      const db = readDB();
      const newTrip: Trip = {
        ...req.body,
        id: "trip-" + Date.now().toString()
      };
      db.trips.push(newTrip);
      writeDB(db);
      res.status(201).json(newTrip);
    } catch {
      res.status(500).json({ error: "Failed to save trip" });
    }
  });

  app.put("/api/trips/:id", (req, res) => {
    try {
      const db = readDB();
      const index = db.trips.findIndex((t) => t.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Trip not found" });
      }
      db.trips[index] = { ...db.trips[index], ...req.body };
      writeDB(db);
      res.json(db.trips[index]);
    } catch {
      res.status(500).json({ error: "Failed to update trip" });
    }
  });

  app.delete("/api/trips/:id", (req, res) => {
    try {
      const db = readDB();
      db.trips = db.trips.filter((t) => t.id !== req.params.id);
      db.batches = db.batches.filter((b) => b.tripId !== req.params.id);
      writeDB(db);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete trip" });
    }
  });

  // Batch endpoints
  app.post("/api/batches", (req, res) => {
    try {
      const db = readDB();
      const newBatch: Batch = {
        ...req.body,
        id: "batch-" + Date.now().toString()
      };
      db.batches.push(newBatch);
      writeDB(db);
      res.status(201).json(newBatch);
    } catch {
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  app.put("/api/batches/:id", (req, res) => {
    try {
      const db = readDB();
      const index = db.batches.findIndex((b) => b.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Batch not found" });
      }
      db.batches[index] = { ...db.batches[index], ...req.body };
      writeDB(db);
      res.json(db.batches[index]);
    } catch {
      res.status(500).json({ error: "Failed to update batch" });
    }
  });

  app.delete("/api/batches/:id", (req, res) => {
    try {
      const db = readDB();
      db.batches = db.batches.filter((b) => b.id !== req.params.id);
      writeDB(db);
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: "Failed to delete batch" });
    }
  });

  // Booking endpoints
  app.post("/api/bookings", (req, res) => {
    try {
      const db = readDB();
      const payload = req.body;
      
      const batchIndex = db.batches.findIndex((b) => b.id === payload.batchId);
      if (batchIndex === -1) {
        return res.status(404).json({ error: "Departure batch not found" });
      }
      
      const batch = db.batches[batchIndex];
      const count = Number(payload.participantsCount);

      if (batch.status === "Closed" || batch.availableSeats < count) {
        return res.status(400).json({ error: "Requested batch quota is insufficient" });
      }

      // Decrement available seats as a soft reserve (can be verified later by admin)
      batch.availableSeats -= count;
      if (batch.availableSeats <= 0) {
        batch.status = "Closed";
      }

      const trip = db.trips.find((t) => t.id === payload.tripId);

      const newBooking: Booking = {
        id: "book-" + Date.now().toString(),
        bookingCode: generateUniqueBookingCode(db.bookings.map(b => b.bookingCode)),
        tripId: payload.tripId,
        tripTitle: trip ? trip.title : "Unknown Trip",
        batchId: payload.batchId,
        departureDate: batch.departureDate,
        fullName: payload.fullName || payload.participantData?.name || "Unknown traveler",
        email: payload.email || payload.participantData?.email || "unknown@example.com",
        phone: payload.phone || payload.participantData?.whatsapp || "N/A",
        participantsCount: count || 1,
        participantsNames: payload.participantsNames || [payload.fullName || payload.participantData?.name || "Unknown traveler"],
        proofOfPayment: payload.proofOfPayment || "NOT_APPLICABLE_SLEEK_THEME",
        status: "Pending",
        totalPrice: payload.totalPrice || (batch ? batch.price : 0),
        createdAt: new Date().toISOString(),
        participantData: payload.participantData,
        adminNotes: payload.adminNotes || ""
      };

      db.bookings.push(newBooking);
      writeDB(db);

      res.status(201).json(newBooking);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to register booking" });
    }
  });

  app.put("/api/bookings/:id", (req, res) => {
    try {
      const db = readDB();
      const index = db.bookings.findIndex((b) => b.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: "Booking code not found" });
      }

      const originalBooking = db.bookings[index];
      const nextBooking = { ...originalBooking, ...req.body };

      // If transition from Pending/Confirmed to Rejected, restore seats
      if (nextBooking.status === "Rejected" && originalBooking.status !== "Rejected") {
        const bIdx = db.batches.findIndex((b) => b.id === originalBooking.batchId);
        if (bIdx !== -1) {
          db.batches[bIdx].availableSeats += originalBooking.participantsCount;
          // reopen if was marked closed automatically
          if (db.batches[bIdx].availableSeats > 0) {
            db.batches[bIdx].status = "Open";
          }
        }
      }
      // If transition from Rejected back to Confirmed/Pending, re-reserve seats
      if (originalBooking.status === "Rejected" && nextBooking.status !== "Rejected") {
        const bIdx = db.batches.findIndex((b) => b.id === originalBooking.batchId);
        if (bIdx !== -1) {
          db.batches[bIdx].availableSeats -= originalBooking.participantsCount;
          if (db.batches[bIdx].availableSeats < 0) db.batches[bIdx].availableSeats = 0;
          if (db.batches[bIdx].availableSeats <= 0) {
            db.batches[bIdx].status = "Closed";
          }
        }
      }

      db.bookings[index] = nextBooking;
      writeDB(db);
      res.json(db.bookings[index]);
    } catch {
      res.status(500).json({ error: "Failed to update booking" });
    }
  });

  // Purge all bookings endpoint to clear mock records and restore batch quotas
  app.post("/api/bookings/purge", (req, res) => {
    try {
      const db = readDB();
      db.bookings = [];
      // Restore all batch seats back to their maximum original quota
      db.batches.forEach((b) => {
        b.availableSeats = b.quota;
        b.status = "Open";
      });
      writeDB(db);
      res.json({ success: true, message: "All bookings cleared and batch quotas reset." });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to purge bookings database" });
    }
  });

  // Express Admin Login verification (email & password check)
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const validEmails = ["sawahjayagroup@gmail.com", "admin@smartjourney.com"];
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are both required." });
    }

    if (validEmails.includes(email.trim().toLowerCase()) && password === "smartjourney2026") {
      res.json({ token: "admin-smart-journey-token", success: true });
    } else {
      res.status(401).json({ error: "Invalid email or passcode. Please try again." });
    }
  });

  // Mount Vite middleware for development or fallback in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
