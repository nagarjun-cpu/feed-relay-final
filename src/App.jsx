import { useState, useEffect, useRef } from "react";

// ─── Palette & Design Tokens ────────────────────────────────────────────────
// Earthy-modern: deep forest green + warm saffron + cream + charcoal
// Font: Clash Display (display) + DM Sans (body)

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
`;

// ─── Mock Data ───────────────────────────────────────────────────────────────
const MOCK_FOOD = [
  { id: 1, donor: "Taj Hotel", type: "veg", qty: 200, location: "MG Road, Bangalore", distance: 1.2, expiry: 45, status: "available", rating: 4.8, claimed: false, category: "Cooked Meals" },
  { id: 2, donor: "Wedding House Events", type: "non-veg", qty: 350, location: "Indiranagar, Bangalore", distance: 2.7, expiry: 90, status: "available", rating: 4.5, claimed: false, category: "Biryani & Curries" },
  { id: 3, donor: "Burger King Outlet", type: "non-veg", qty: 80, location: "Koramangala, Bangalore", distance: 0.8, expiry: 20, status: "urgent", rating: 4.2, claimed: false, category: "Fast Food" },
  { id: 4, donor: "Wholesale Vegetable Market", type: "veg", qty: 500, location: "KR Market, Bangalore", distance: 5.1, expiry: 360, status: "available", rating: 4.9, claimed: false, category: "Raw Produce" },
  { id: 5, donor: "Marriott Banquet", type: "veg", qty: 400, location: "Whitefield, Bangalore", distance: 8.3, expiry: 120, status: "available", rating: 4.7, claimed: false, category: "Cooked Meals" },
  { id: 6, donor: "Street Vendor Cluster", type: "veg", qty: 60, location: "HSR Layout, Bangalore", distance: 3.2, expiry: 15, status: "urgent", rating: 3.9, claimed: false, category: "Snacks" },
];

const MOCK_VOLUNTEERS = [
  { id: 1, name: "Arjun Mehta", tasks: 24, rating: 4.9, status: "available", area: "Koramangala" },
  { id: 2, name: "Priya Sharma", tasks: 18, rating: 4.7, status: "on-delivery", area: "Indiranagar" },
  { id: 3, name: "Kiran Reddy", tasks: 31, rating: 4.8, status: "available", area: "HSR Layout" },
];

const MOCK_STATS = [
  { label: "Meals Saved", value: "1,24,800", icon: "🍱", trend: "+12%" },
  { label: "Active NGOs", value: "238", icon: "🏢", trend: "+8%" },
  { label: "Volunteers", value: "1,450", icon: "🙌", trend: "+22%" },
  { label: "Waste Diverted", value: "48 Tons", icon: "", trend: "+5%" },
];

// ─── Utility Helpers ─────────────────────────────────────────────────────────
function cn(...classes) { return classes.filter(Boolean).join(" "); }
function expiryColor(mins) {
  if (mins <= 20) return "#ef4444";
  if (mins <= 60) return "#f59e0b";
  return "#22c55e";
}
function expiryLabel(mins) {
  if (mins < 60) return `${mins}m left`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m left`;
}

// ─── Components ──────────────────────────────────────────────────────────────

function StarRating({ rating, size = 12 }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(rating) ? "#f59e0b" : "#d1d5db"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 2 }}>{rating}</span>
    </span>
  );
}

function Badge({ children, color = "#16a34a", bg = "#dcfce7" }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px",
      borderRadius: 20, fontSize: 11, fontWeight: 600,
      color, background: bg, letterSpacing: "0.03em"
    }}>{children}</span>
  );
}

function Pill({ children, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 16px", borderRadius: 20, border: "none",
      background: active ? "#1a5c3a" : "#f3f4f6",
      color: active ? "#fff" : "#374151",
      fontSize: 13, fontWeight: 500, cursor: "pointer",
      transition: "all 0.2s", fontFamily: "inherit",
      flexShrink: 0,
    }}>{children}</button>
  );
}

function Notification({ msg, onClose }) {
  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: "#1a5c3a", color: "#fff", padding: "12px 24px",
      borderRadius: 12, fontSize: 14, fontWeight: 500, zIndex: 999,
      boxShadow: "0 8px 32px rgba(26,92,58,0.35)",
      display: "flex", alignItems: "center", gap: 10, maxWidth: "90vw",
      animation: "slideUp 0.3s ease",
    }}>
      <span>✓</span> {msg}
      <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", marginLeft: 8, fontSize: 16 }}>×</button>
    </div>
  );
}

// ─── Food Card ───────────────────────────────────────────────────────────────
function FoodCard({ item, onAction, actionLabel = "Request Pickup", claimed }) {
  const isUrgent = item.expiry <= 20;
  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: isUrgent ? "1.5px solid #fca5a5" : "1.5px solid #e5e7eb",
      overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
    >
      {/* Top accent bar */}
      <div style={{ height: 4, background: isUrgent ? "linear-gradient(90deg,#ef4444,#f97316)" : "linear-gradient(90deg,#1a5c3a,#4ade80)" }} />

      <div style={{ padding: "16px 16px 14px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 2 }}>{item.donor}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{item.category}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <Badge color={item.type === "veg" ? "#15803d" : "#b45309"} bg={item.type === "veg" ? "#dcfce7" : "#fef3c7"}>
              {item.type === "veg" ? "🥦 Veg" : "🍗 Non-Veg"}
            </Badge>
            {isUrgent && <Badge color="#dc2626" bg="#fee2e2">⚡ Urgent</Badge>}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
          {[
            { icon: "👥", val: `${item.qty} people`, label: "Serves" },
            { icon: "📍", val: `${item.distance} km`, label: "Distance" },
            { icon: "⏱", val: expiryLabel(item.expiry), label: "Expires", color: expiryColor(item.expiry) },
          ].map(s => (
            <div key={s.label} style={{ background: "#f9fafb", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 16 }}>{s.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: s.color || "#111827" }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#9ca3af" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Location */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 12, color: "#6b7280" }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {item.location}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <StarRating rating={item.rating} />
          <button
            onClick={() => onAction(item)}
            disabled={claimed}
            style={{
              background: claimed ? "#e5e7eb" : "linear-gradient(135deg,#1a5c3a,#2d8a5e)",
              color: claimed ? "#9ca3af" : "#fff",
              border: "none", borderRadius: 10, padding: "8px 16px",
              fontSize: 13, fontWeight: 600, cursor: claimed ? "default" : "pointer",
              fontFamily: "inherit", transition: "opacity 0.2s",
            }}
          >{claimed ? "✓ Claimed" : actionLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Donor Form ───────────────────────────────────────────────────────────────
function DonorModule({ onNotify, onAddFood }) {
  const [form, setForm] = useState({ name: "", type: "veg", qty: "", address: "", expiry: "", category: "", wasteCategory: "" });
  const [submitted, setSubmitted] = useState(false);

  const expiryMap = {
    "30 min": 30,
    "1 hour": 60,
    "2 hours": 120,
    "6+ hours": 360,
  };

  const handleSubmit = () => {
    if (!form.name || !form.qty || !form.address || !form.expiry) {
      onNotify("Please fill all required fields.");
      return;
    }

    const newFood = {
      id: Date.now(),
      donor: form.name,
      type: form.type,
      qty: Number(form.qty),
      location: form.address,
      distance: Math.round((Math.random() * 6 + 0.8) * 10) / 10,
      expiry: expiryMap[form.expiry] || 60,
      status: "available",
      rating: 4.7,
      claimed: false,
      category: form.category || "Cooked Meals",
      wasteCategory: form.wasteCategory || "",
      isWaste: !!form.wasteCategory,
    };

    onAddFood(newFood);
    setSubmitted(true);
    const destination = form.wasteCategory ? "Recycle section" : "Find Food section";
    onNotify(`🎉 Food listing submitted! It is now visible in ${destination}.`);
    setTimeout(() => setSubmitted(false), 3000);
    setForm({ name: "", type: "veg", qty: "", address: "", expiry: "", category: "", wasteCategory: "" });
  };

  const inputStyle = {
    width: "100%", padding: "12px 14px", border: "1.5px solid #e5e7eb",
    borderRadius: 10, fontSize: 14, fontFamily: "inherit",
    background: "#f9fafb", outline: "none", boxSizing: "border-box",
    color: "#111827", transition: "border-color 0.2s",
  };

  const labelStyle = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6, display: "block" };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Donate Food</h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>Share surplus food — feed lives, not landfills.</p>
      </div>

      {/* Impact Banner */}
      <div style={{ background: "linear-gradient(135deg,#1a5c3a,#2d8a5e)", borderRadius: 14, padding: 16, marginBottom: 20, color: "#fff" }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>Your donation today could feed</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>200+ families 🍛</div>
        <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>1,24,800 meals saved so far this month</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={labelStyle}>Organization / Name *</label>
          <input style={inputStyle} placeholder="e.g. Taj Hotel, Rohan's Wedding" value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Food Type *</label>
            <select style={{ ...inputStyle, appearance: "none" }} value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="veg">🥦 Vegetarian</option>
              <option value="non-veg">🍗 Non-Vegetarian</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Serves (people) *</label>
            <input style={inputStyle} type="number" placeholder="e.g. 150" value={form.qty}
              onChange={e => setForm(p => ({ ...p, qty: e.target.value }))} />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Category</label>
          <select style={{ ...inputStyle, appearance: "none" }} value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
            <option value="">Select category...</option>
            <option>Cooked Meals</option>
            <option>Raw Produce</option>
            <option>Bakery Items</option>
            <option>Fast Food</option>
            <option>Snacks</option>
            <option>Beverages</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Food Status (for waste routing)</label>
          <select style={{ ...inputStyle, appearance: "none" }} value={form.wasteCategory}
            onChange={e => setForm(p => ({ ...p, wasteCategory: e.target.value }))}>
            <option value="">Regular / Fresh Food</option>
            <option value="Left Over Food">Left Over Food → Animal Feeders</option>
            <option value="Spoiled Food">Spoiled Food → Composting</option>
            <option value="Waste Food">Waste Food → Food Processing Units</option>
          </select>
        </div>

        <div>
          <label style={labelStyle}>Pickup Address *</label>
          <input style={inputStyle} placeholder="Full address with landmark" value={form.address}
            onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
        </div>

        <div>
          <label style={labelStyle}>Food Valid For *</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {["30 min", "1 hour", "2 hours", "6+ hours"].map(t => (
              <button key={t} onClick={() => setForm(p => ({ ...p, expiry: t }))}
                style={{
                  padding: "10px 4px", border: "1.5px solid",
                  borderColor: form.expiry === t ? "#1a5c3a" : "#e5e7eb",
                  background: form.expiry === t ? "#dcfce7" : "#f9fafb",
                  color: form.expiry === t ? "#1a5c3a" : "#374151",
                  borderRadius: 10, fontSize: 12, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit",
                }}>{t}</button>
            ))}
          </div>
        </div>

        <button onClick={handleSubmit} style={{
          background: "linear-gradient(135deg,#1a5c3a,#4ade80)",
          color: "#fff", border: "none", borderRadius: 12,
          padding: "14px", fontSize: 15, fontWeight: 700,
          cursor: "pointer", fontFamily: "inherit", marginTop: 4,
          boxShadow: "0 4px 16px rgba(26,92,58,0.3)",
          transition: "transform 0.15s",
        }}>
          🚀 Submit Food Listing
        </button>
      </div>

      {/* Recent donations */}
      <div style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#374151" }}>Your Recent Listings</h3>
        {[
          { name: "Taj Banquet Hall", status: "Claimed", qty: 200, time: "2h ago" },
          { name: "Your Company Canteen", status: "Delivered", qty: 85, time: "Yesterday" },
        ].map((d, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f3f4f6" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{d.qty} people · {d.time}</div>
            </div>
            <Badge color={d.status === "Delivered" ? "#15803d" : "#1d4ed8"} bg={d.status === "Delivered" ? "#dcfce7" : "#dbeafe"}>
              {d.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NGO Dashboard ────────────────────────────────────────────────────────────
function NGOModule({ food, setFood, onNotify }) {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("expiry");
  const [claimedIds, setClaimedIds] = useState([]);

  const filtered = food
    .filter(f => filter === "all" || f.type === filter || (filter === "urgent" && f.expiry <= 30))
    .sort((a, b) => sortBy === "expiry" ? a.expiry - b.expiry : a.distance - b.distance);

  const handleClaim = (item) => {
    setClaimedIds(p => [...p, item.id]);
    onNotify(`📦 Pickup requested for ${item.donor}! Volunteer being assigned.`);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>NGO Dashboard</h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>Real-time food availability near you</p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Available", val: food.filter(f => f.expiry > 30).length, color: "#16a34a" },
          { label: "Urgent", val: food.filter(f => f.expiry <= 30).length, color: "#dc2626" },
          { label: "Claimed", val: claimedIds.length, color: "#2563eb" },
        ].map(s => (
          <div key={s.label} style={{ background: "#f9fafb", borderRadius: 12, padding: "12px 8px", textAlign: "center", border: "1.5px solid #e5e7eb" }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 12 }}>
        {["all","veg","non-veg","urgent"].map(f => (
          <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
            {f === "all" ? "🌐 All" : f === "veg" ? "🥦 Veg" : f === "non-veg" ? "🍗 Non-Veg" : "⚡ Urgent"}
          </Pill>
        ))}
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <select onChange={e => setSortBy(e.target.value)} value={sortBy} style={{
            border: "1.5px solid #e5e7eb", borderRadius: 20, padding: "6px 14px",
            fontSize: 13, fontFamily: "inherit", background: "#fff", cursor: "pointer",
          }}>
            <option value="expiry">⏱ Expiry First</option>
            <option value="distance">📍 Nearest First</option>
          </select>
        </div>
      </div>

      {/* Smart match notice */}
      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
        <span style={{ fontSize: 16 }}>🧠</span>
        <span style={{ color: "#92400e" }}>Smart matching active — showing nearest + soonest expiry first</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {filtered.map(item => (
          <FoodCard key={item.id} item={item} onAction={handleClaim} claimed={claimedIds.includes(item.id)} />
        ))}
      </div>
    </div>
  );
}

// ─── Volunteer Module ─────────────────────────────────────────────────────────
function VolunteerModule({ onNotify }) {
  const tasks = [
    { id: 1, donor: "Taj Hotel", ngo: "Feeding India", from: "MG Road", to: "Shivajinagar Shelter", qty: 200, status: "pending", distance: 3.4 },
    { id: 2, donor: "Wedding House", ngo: "Asha Foundation", from: "Indiranagar", to: "Whitefield NGO", qty: 350, status: "pending", distance: 6.1 },
    { id: 3, donor: "Burger King", ngo: "City Feeders", from: "Koramangala", to: "HSR Orphanage", qty: 80, status: "in-progress", distance: 2.2 },
  ];

  const [statuses, setStatuses] = useState({});

  const advance = (id, current) => {
    const next = current === "pending" ? "picked-up" : current === "picked-up" ? "delivered" : "delivered";
    setStatuses(p => ({ ...p, [id]: next }));
    onNotify(next === "picked-up" ? "🚗 Pickup confirmed! En route to NGO." : "✅ Delivered successfully! Thank you!");
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Volunteer Hub</h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>Accept delivery tasks near you</p>
      </div>

      {/* Volunteer profile */}
      <div style={{ background: "linear-gradient(135deg,#1e40af,#3b82f6)", borderRadius: 14, padding: 16, marginBottom: 20, color: "#fff", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ffffff30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>🙌</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Arjun Mehta</div>
          <div style={{ fontSize: 12, opacity: 0.85 }}>Koramangala Area · 24 deliveries completed</div>
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <Badge color="#fff" bg="rgba(255,255,255,0.2)">⭐ 4.9 Rating</Badge>
            <Badge color="#fff" bg="rgba(255,255,255,0.2)">🏅 Top Volunteer</Badge>
          </div>
        </div>
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Available Tasks</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {tasks.map(task => {
          const s = statuses[task.id] || task.status;
          return (
            <div key={task.id} style={{ background: "#fff", borderRadius: 16, border: "1.5px solid #e5e7eb", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              <div style={{ height: 4, background: s === "delivered" ? "#22c55e" : s === "picked-up" ? "#3b82f6" : "#f59e0b" }} />
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{task.donor}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>→ {task.ngo}</div>
                  </div>
                  <Badge
                    color={s === "delivered" ? "#15803d" : s === "picked-up" ? "#1d4ed8" : "#92400e"}
                    bg={s === "delivered" ? "#dcfce7" : s === "picked-up" ? "#dbeafe" : "#fef3c7"}
                  >{s === "delivered" ? "✓ Delivered" : s === "picked-up" ? "🚗 En Route" : "⏳ Pending"}</Badge>
                </div>

                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  <div style={{ flex: 1, background: "#f9fafb", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                    <div style={{ color: "#9ca3af", marginBottom: 2 }}>PICKUP</div>
                    <div style={{ fontWeight: 600, color: "#374151" }}>📦 {task.from}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", color: "#9ca3af", fontSize: 16 }}>→</div>
                  <div style={{ flex: 1, background: "#f9fafb", borderRadius: 8, padding: "8px 10px", fontSize: 12 }}>
                    <div style={{ color: "#9ca3af", marginBottom: 2 }}>DROP-OFF</div>
                    <div style={{ fontWeight: 600, color: "#374151" }}>🏢 {task.to}</div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    👥 {task.qty} people · 📍 {task.distance} km away
                  </div>
                  {s !== "delivered" && (
                    <button onClick={() => advance(task.id, s)} style={{
                      background: s === "pending" ? "linear-gradient(135deg,#f59e0b,#f97316)" : "linear-gradient(135deg,#3b82f6,#6366f1)",
                      color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px",
                      fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    }}>
                      {s === "pending" ? "Accept & Pickup →" : "Mark Delivered ✓"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Waste Management ─────────────────────────────────────────────────────────
function WasteModule({ food, onNotify }) {
  const [requestedIds, setRequestedIds] = useState([]);

  const wasteItems = food.filter(f => f.isWaste);
  
  const groupedByCategory = {
    "Left Over Food": wasteItems.filter(f => f.wasteCategory === "Left Over Food"),
    "Spoiled Food": wasteItems.filter(f => f.wasteCategory === "Spoiled Food"),
    "Waste Food": wasteItems.filter(f => f.wasteCategory === "Waste Food"),
  };

  const destinations = {
    "Left Over Food": { icon: "🐄", label: "Animal Feeders", color: "#fef9c3", textColor: "#92400e" },
    "Spoiled Food": { icon: "🌱", label: "Composting", color: "#d1fae5", textColor: "#065f46" },
    "Waste Food": { icon: "🏭", label: "Food Processing Units", color: "#f3f4f6", textColor: "#374151" },
  };

  const handleRequestPickup = (item) => {
    setRequestedIds(prev => [...prev, item.id]);
    const dest = destinations[item.wasteCategory];
    onNotify(`📍 Pickup requested for ${item.donor}! Routing to ${dest.label}.`);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Waste Management</h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>Redirect food waste efficiently — nothing goes to waste</p>
      </div>

      {/* Flow diagram */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e5e7eb", padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 12 }}>🔄 Smart Waste Routing</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {[
            { label: "Left Over", icon: "🐄", color: "#fef9c3" },
            { label: "Animal Feeders", icon: "🐄", color: "#fef9c3" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ background: s.color, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                {s.icon} {s.label}
              </div>
              {i === 0 && <span style={{ color: "#d1d5db", fontSize: 18 }}>→</span>}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {[
            { label: "Spoiled", icon: "🌱", color: "#d1fae5" },
            { label: "Composting", icon: "🌱", color: "#d1fae5" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ background: s.color, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                {s.icon} {s.label}
              </div>
              {i === 0 && <span style={{ color: "#d1d5db", fontSize: 18 }}>→</span>}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {[
            { label: "Waste", icon: "🏭", color: "#f3f4f6" },
            { label: "Food Processing", icon: "🏭", color: "#f3f4f6" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ background: s.color, borderRadius: 8, padding: "6px 10px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                {s.icon} {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waste items by category */}
      {Object.entries(groupedByCategory).map(([category, items]) => {
        if (items.length === 0) return null;
        const dest = destinations[category];
        return (
          <div key={category}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 12, marginTop: 20 }}>
              {dest.icon} {category} → {dest.label}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {items.map(item => (
                <div key={item.id} style={{ background: "#fff", borderRadius: 14, border: `1.5px solid ${dest.color}`, overflow: "hidden" }}>
                  <div style={{ height: 3, background: dest.color }} />
                  <div style={{ padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{item.donor}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>{item.category || "Food Item"} · {item.qty} servings</div>
                      </div>
                      <Badge color={dest.textColor} bg={dest.color}>📍 {category}</Badge>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: 12, color: "#6b7280" }}>
                      <span>📍 {item.location}</span>
                      <span>•</span>
                      <span>{item.distance} km away</span>
                    </div>
                    <button
                      onClick={() => handleRequestPickup(item)}
                      disabled={requestedIds.includes(item.id)}
                      style={{
                        width: "100%",
                        background: requestedIds.includes(item.id) ? "#e5e7eb" : dest.color,
                        color: requestedIds.includes(item.id) ? "#9ca3af" : dest.textColor,
                        border: `1.5px solid ${dest.color}`,
                        borderRadius: 10,
                        padding: "10px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: requestedIds.includes(item.id) ? "default" : "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {requestedIds.includes(item.id) ? "✓ Pickup Requested" : "📦 Request Pickup"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {wasteItems.length === 0 && (
        <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: 14, padding: 20, textAlign: "center", color: "#166534" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>✨</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>No waste items yet</div>
          <div style={{ fontSize: 12, color: "#4b5563", marginTop: 4 }}>Food waste items will appear here when donated</div>
        </div>
      )}
    </div>
  );
}

// ─── Ratings ──────────────────────────────────────────────────────────────────
function RatingsModule({ onNotify }) {
  const [selected, setSelected] = useState({});
  const [comment, setComment] = useState({});

  const toRate = [
    { id: 1, name: "Taj Hotel", delivery: "Yesterday, 2 PM", qty: 200 },
    { id: 2, name: "Wedding Events Co.", delivery: "2 days ago", qty: 350 },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: "#111827", margin: 0 }}>Trust & Ratings</h2>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 4 }}>Rate donors to build a trusted network</p>
      </div>

      {/* Top donors */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 12 }}>🏆 Top Donors This Month</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {[
          { rank: 1, name: "Taj Hotels Group", meals: 4200, rating: 4.9, badge: "Gold" },
          { rank: 2, name: "Wholesale Market", meals: 3800, rating: 4.8, badge: "Gold" },
          { rank: 3, name: "City Events Co.", meals: 2100, rating: 4.6, badge: "Silver" },
        ].map(d => (
          <div key={d.rank} style={{ display: "flex", alignItems: "center", gap: 12, background: "#fff", borderRadius: 12, padding: 14, border: "1.5px solid #e5e7eb" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: d.rank === 1 ? "#fef3c7" : d.rank === 2 ? "#f3f4f6" : "#fef9c3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: d.rank === 1 ? "#d97706" : "#6b7280" }}>
              {d.rank}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: "#9ca3af" }}>{d.meals.toLocaleString()} meals donated</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <StarRating rating={d.rating} size={11} />
              <Badge color={d.badge === "Gold" ? "#92400e" : "#374151"} bg={d.badge === "Gold" ? "#fef3c7" : "#f3f4f6"} style={{ marginTop: 4 }}>
                {d.badge === "Gold" ? "🥇" : "🥈"} {d.badge}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Rate donors */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#374151", marginBottom: 12 }}>📝 Rate Recent Pickups</h3>
      {toRate.map(d => (
        <div key={d.id} style={{ background: "#fff", borderRadius: 14, border: "1.5px solid #e5e7eb", padding: 16, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{d.name}</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 12 }}>{d.delivery} · {d.qty} people served</div>

          <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Your rating</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[1,2,3,4,5].map(n => (
              <button key={n} onClick={() => setSelected(p => ({ ...p, [d.id]: n }))} style={{
                width: 40, height: 40, borderRadius: 10, border: "1.5px solid",
                borderColor: (selected[d.id] || 0) >= n ? "#f59e0b" : "#e5e7eb",
                background: (selected[d.id] || 0) >= n ? "#fef3c7" : "#f9fafb",
                fontSize: 18, cursor: "pointer",
              }}>⭐</button>
            ))}
          </div>

          <textarea
            placeholder="Add a comment (optional)..."
            value={comment[d.id] || ""}
            onChange={e => setComment(p => ({ ...p, [d.id]: e.target.value }))}
            style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 10, padding: 10, fontSize: 13, fontFamily: "inherit", resize: "none", background: "#f9fafb", boxSizing: "border-box", outline: "none", color: "#111827" }}
            rows={2}
          />

          <button onClick={() => { if (selected[d.id]) onNotify(`⭐ Rated ${d.name} ${selected[d.id]}/5 stars!`); else onNotify("Please select a star rating first."); }}
            style={{ marginTop: 10, background: "linear-gradient(135deg,#1a5c3a,#4ade80)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Submit Rating
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Home / Dashboard ─────────────────────────────────────────────────────────
function HomeModule({ setTab }) {
  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(145deg,#1a5c3a 0%,#0f3d28 100%)", borderRadius: 20, padding: "24px 20px", marginBottom: 24, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />
        <div style={{ position: "absolute", bottom: -30, right: 20, width: 80, height: 80, borderRadius: "50%", background: "rgba(74,222,128,0.15)" }} />
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", opacity: 0.75, marginBottom: 6 }}>WELCOME TO</div>
        <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.2, marginBottom: 8 }}>Feed Relay<br />Connect 🥘</div>
        <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.5 }}>Bridging surplus food to those who need it most — one meal at a time.</div>
        <button onClick={() => setTab("donor")} style={{ marginTop: 16, background: "#4ade80", color: "#1a5c3a", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          Donate Food Now →
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {MOCK_STATS.map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: 14, padding: 16, border: "1.5px solid #e5e7eb", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginTop: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{s.label}</div>
            <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 600, marginTop: 2 }}>{s.trend} this month</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 12 }}>Quick Actions</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {[
          { label: "Donate Food", icon: "🍱", tab: "donor", color: "#dcfce7", accent: "#1a5c3a" },
          { label: "Find Food", icon: "🔍", tab: "ngo", color: "#dbeafe", accent: "#1d4ed8" },
          { label: "Volunteer", icon: "🚗", tab: "volunteer", color: "#fef3c7", accent: "#92400e" },
          { label: "Waste Mgmt", icon: "♻️", tab: "waste", color: "#d1fae5", accent: "#065f46" },
        ].map(a => (
          <button key={a.label} onClick={() => setTab(a.tab)} style={{
            background: a.color, border: "none", borderRadius: 14, padding: "16px 12px",
            cursor: "pointer", textAlign: "left", fontFamily: "inherit",
          }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>{a.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: a.accent }}>{a.label}</div>
          </button>
        ))}
      </div>

      {/* Live feed */}
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 12 }}>🔴 Live Activity</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {[
          { msg: "Taj Hotel listed 200 meals", time: "2 min ago", icon: "🍱", color: "#dcfce7" },
          { msg: "Feeding India claimed Wedding biryani", time: "8 min ago", icon: "✅", color: "#dbeafe" },
          { msg: "Arjun delivered to Shivajinagar shelter", time: "15 min ago", icon: "🚗", color: "#fef3c7" },
          { msg: "Bakery items redirected to animal feeders", time: "32 min ago", icon: "🐄", color: "#d1fae5" },
        ].map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderBottom: i < 3 ? "1px solid #f3f4f6" : "none" }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: f.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{f.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{f.msg}</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>{f.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const [prevTab, setPrevTab] = useState(null);
  const [food, setFood] = useState(MOCK_FOOD);
  const [notification, setNotification] = useState(null);

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const changeTab = (newTab) => {
    if (newTab !== tab) {
      setPrevTab(tab);
      setTab(newTab);
    }
  };

  const goBack = () => {
    if (prevTab && prevTab !== tab) {
      setTab(prevTab);
      setPrevTab(null);
    } else {
      setTab("home");
    }
  };

  const tabs = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "donor", label: "Donate", icon: "🍱" },
    { id: "ngo", label: "Find Food", icon: "🔍" },
    { id: "volunteer", label: "Volunteer", icon: "🚗" },
    { id: "waste", label: "Recycle", icon: "♻️" },
    { id: "ratings", label: "Ratings", icon: "⭐" },
  ];

  return (
    <div style={{
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      minHeight: "100vh",
      background: "#f8fafc",
      width: "100%",
      maxWidth: "100%",
      margin: "0 auto",
      position: "relative",
      padding: "0 12px",
    }}>
      <style>{`
        ${FONTS}
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { display: none; }
        @keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        input:focus, select:focus, textarea:focus { border-color: #1a5c3a !important; box-shadow: 0 0 0 3px rgba(26,92,58,0.1) !important; }
        .desktop-tabbar {
          display: none;
          gap: 8px;
          margin: 0 0 18px;
          width: 100%;
          max-width: 100%;
        }
        .desktop-tabbar button {
          flex: 1;
          min-width: 110px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 12px 14px;
          border-radius: 14px;
          font-family: inherit;
          transition: background 0.2s, color 0.2s, transform 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #6b7280;
        }
        .desktop-tabbar button.active {
          background: #d1fae5;
          color: #065f46;
          transform: translateY(-1px);
        }
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 100%;
          background: #fff;
          border-top: 1px solid #f3f4f6;
          display: flex;
          padding: 8px 4px 16px;
          box-shadow: 0 -4px 24px rgba(0,0,0,0.08);
          z-index: 100;
        }
        @media (min-width: 768px) {
          .desktop-tabbar {
            display: flex;
          }
          .bottom-nav {
            display: none;
          }
        }
        @media (min-width: 1000px) {
          .app-content {
            padding-bottom: 24px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #f3f4f6",
        padding: "14px 20px", position: "sticky", top: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {tab !== "home" && (
            <button onClick={goBack} type="button" style={{
              background: "#eef2ff", border: "none", borderRadius: 12,
              padding: "8px 10px", color: "#1d4ed8", fontWeight: 700,
              cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 6,
            }}>
              ← Back
            </button>
          )}
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#1a5c3a,#4ade80)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🥘</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#111827", lineHeight: 1 }}>Feed Relay</div>
            <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500 }}>Connect · Bangalore</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { changeTab("ngo"); notify("Showing urgent food listings now."); }} type="button" style={{ background: "#fee2e2", border: "none", borderRadius: 10, padding: "6px 10px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", color: "#dc2626", fontWeight: 600 }}>
            🔴 2 Urgent
          </button>
          <button onClick={() => notify("🔔 You have new notifications coming soon!")} type="button" style={{ width: 34, height: 34, background: "#f9fafb", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer", border: "1.5px solid #e5e7eb" }}>
            🔔
          </button>
        </div>
      </div>

      <div className="desktop-tabbar">
        {tabs.map(t => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => changeTab(t.id)}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="app-content" style={{ padding: "20px 16px 100px" }}>
        {tab === "home" && <HomeModule setTab={changeTab} />}
        {tab === "donor" && <DonorModule onNotify={notify} onAddFood={(item) => { setFood((prev) => [item, ...prev]); changeTab("ngo"); }} />}
        {tab === "ngo" && <NGOModule food={food.filter(f => !f.isWaste)} setFood={setFood} onNotify={notify} />}
        {tab === "volunteer" && <VolunteerModule onNotify={notify} />}
        {tab === "waste" && <WasteModule food={food} onNotify={notify} />}
        {tab === "ratings" && <RatingsModule onNotify={notify} />}
      </div>

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        {tabs.map(t => (
          <button key={t.id} onClick={() => changeTab(t.id)} style={{
            flex: 1, background: "none", border: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
            padding: "4px 2px", fontFamily: "inherit",
            transition: "transform 0.15s",
          }}>
            <div style={{
              fontSize: 20, lineHeight: 1,
              filter: tab === t.id ? "none" : "grayscale(1) opacity(0.5)",
              transform: tab === t.id ? "scale(1.15)" : "scale(1)",
              transition: "all 0.15s",
            }}>{t.icon}</div>
            <div style={{
              fontSize: 10, fontWeight: tab === t.id ? 700 : 400,
              color: tab === t.id ? "#1a5c3a" : "#9ca3af",
              transition: "all 0.15s",
            }}>{t.label}</div>
            {tab === t.id && (
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#1a5c3a", marginTop: -2 }} />
            )}
          </button>
        ))}
      </div>

      {/* Notification */}
      {notification && <Notification msg={notification} onClose={() => setNotification(null)} />}
    </div>
  );
}
