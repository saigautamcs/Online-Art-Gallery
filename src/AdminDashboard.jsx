import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const readArray = (key) => {
  try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; }
  catch { return []; }
};
const money = (value) => "₹" + Number(value || 0).toLocaleString("en-IN");

export function AdminDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("artGalleryCurrentUser") || "null"); }
    catch { return null; }
  });
  const [section, setSection] = useState("home");
  const [users, setUsers] = useState(() => readArray("artGalleryUsers"));
  const [artworks, setArtworks] = useState(() => readArray("artGalleryArtworks"));
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");

  const name = user?.name || user?.fullName || user?.username || "Admin";
  const email = user?.email || "Not available";
  const sections = {
    home: ["Admin Dashboard", "Manage the Art Gallery platform"],
    users: ["User Management", "Manage registered users"],
    artists: ["Artist Management", "Manage artists and their accounts"],
    artworks: ["Artwork Management", "Review and manage artwork"],
    sales: ["Sales Overview", "Monitor gallery transactions"],
    profile: ["My Profile", "Administrator account information"]
  };

  if (!user || String(user.role || "").toLowerCase() !== "admin") {
    return <div className="dash-guard"><h2>Administrator account required</h2><p>Please sign in using an Admin account.</p><button className="dash-gold" onClick={() => navigate("/")}>GO TO LOGIN</button></div>;
  }

  const registeredUsers = users.filter((entry) => String(entry.role || "").toLowerCase() !== "admin");
  const artists = registeredUsers.filter((entry) => ["artist", "merchant"].includes(String(entry.role || "").toLowerCase()));
  const customers = registeredUsers.filter((entry) => String(entry.role || "").toLowerCase() === "user");
  const filteredUsers = useMemo(() => registeredUsers.filter((entry) => `${entry.name || entry.fullName || ""} ${entry.email || ""} ${entry.role || ""}`.toLowerCase().includes(search.toLowerCase())), [registeredUsers, search]);

  function removeUser(target) {
    if (!window.confirm(`Remove ${target.email || "this account"}?`)) return;
    const updated = users.filter((entry) => !(entry.email === target.email && entry.role === target.role));
    localStorage.setItem("artGalleryUsers", JSON.stringify(updated));
    setUsers(updated);
    setNotice("User account removed.");
  }

  function removeArtwork(id) {
    if (!window.confirm("Remove this artwork from the gallery?")) return;
    const updated = artworks.filter((art) => String(art.id) !== String(id));
    localStorage.setItem("artGalleryArtworks", JSON.stringify(updated));
    setArtworks(updated);
    setNotice("Artwork removed from the gallery.");
  }

  function logout() {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.removeItem("artGalleryCurrentUser");
    navigate("/");
  }

  const navItems = [["home","🏠","Dashboard"],["users","👥","Users"],["artists","🎨","Artists"],["artworks","🖼️","Artworks"],["sales","💰","Sales"],["profile","👤","My Profile"]];
  const recentUsers = registeredUsers.slice(-5).reverse();

  return <div className="dash-layout">
    <aside className="dash-sidebar">
      <div className="dash-logo">ART GALLERY<span>ADMIN PORTAL</span></div>
      <div className="dash-mini"><div className="dash-avatar">{name.charAt(0).toUpperCase()}</div><div><b>{name}</b><small>⚙️ Administrator</small></div></div>
      <div className="dash-nav-title">ADMIN MENU</div>
      <nav className="dash-nav">{navItems.map(([id, icon, label]) => <button key={id} className={section === id ? "active" : ""} onClick={() => {setSection(id);setNotice("");}}><span>{icon}</span>{label}</button>)}</nav>
      <div className="dash-bottom"><button className="dash-logout" onClick={logout}>🚪 LOGOUT</button></div>
    </aside>
    <main className="dash-main">
      <header className="dash-topbar"><div><h1>{sections[section][0]}</h1><p>{sections[section][1]}</p></div></header>
      {notice && <div className="dash-notice">{notice}</div>}

      {section === "home" && <>
        <section className="dash-welcome"><h2>Welcome, <span>{name}</span>!</h2><p>Monitor users, artists, artwork and transactions from one central dashboard.</p></section>
        <div className="dash-stats">
          <div className="dash-stat"><div className="dash-stat-icon">👥</div><div className="dash-value">{customers.length}</div><div className="dash-label">TOTAL USERS</div></div>
          <div className="dash-stat"><div className="dash-stat-icon">🎨</div><div className="dash-value">{artists.length}</div><div className="dash-label">ARTISTS</div></div>
          <div className="dash-stat"><div className="dash-stat-icon">🖼️</div><div className="dash-value">{artworks.length}</div><div className="dash-label">ARTWORKS</div></div>
          <div className="dash-stat"><div className="dash-stat-icon">💰</div><div className="dash-value">—</div><div className="dash-label">TOTAL SALES</div></div>
        </div>
        <div className="dash-section-head"><h2>Recent Users</h2><button className="dash-outline" onClick={() => setSection("users")}>VIEW ALL USERS</button></div>
        <div className="dash-table-wrap"><table className="dash-table"><thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th></tr></thead><tbody>{recentUsers.map((entry, index) => <tr key={`${entry.email}-${index}`}><td>{entry.name || entry.fullName || "—"}</td><td>{entry.email || "—"}</td><td>{entry.role || "User"}</td></tr>)}</tbody></table>{recentUsers.length === 0 && <div className="dash-empty">No registered users found yet.</div>}</div>
      </>}

      {section === "users" && <>
        <input className="dash-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users by name, email or role..." />
        <div className="dash-table-wrap"><table className="dash-table"><thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>ACTION</th></tr></thead><tbody>{filteredUsers.map((entry, index) => <tr key={`${entry.email}-${index}`}><td>{entry.name || entry.fullName || "—"}</td><td>{entry.email || "—"}</td><td>{entry.role || "User"}</td><td><button className="dash-delete" onClick={() => removeUser(entry)}>Remove</button></td></tr>)}</tbody></table>{filteredUsers.length === 0 && <div className="dash-empty">No matching user accounts.</div>}</div>
      </>}

      {section === "artists" && <div className="dash-table-wrap"><table className="dash-table"><thead><tr><th>ARTIST</th><th>EMAIL</th><th>ARTWORKS</th><th>STATUS</th></tr></thead><tbody>{artists.map((artist, index) => <tr key={`${artist.email}-${index}`}><td>{artist.name || artist.fullName || "—"}</td><td>{artist.email || "—"}</td><td>{artworks.filter((art) => (art.artistEmail || "").toLowerCase() === (artist.email || "").toLowerCase()).length}</td><td><span className="dash-status">Active</span></td></tr>)}</tbody></table>{artists.length === 0 && <div className="dash-empty">No artist accounts found.</div>}</div>}

      {section === "artworks" && <div className="dash-table-wrap"><table className="dash-table"><thead><tr><th>TITLE</th><th>ARTIST</th><th>PRICE</th><th>ACTION</th></tr></thead><tbody>{artworks.map((art) => <tr key={art.id}><td>{art.title}</td><td>{art.artist || "—"}</td><td>{money(art.price)}</td><td><button className="dash-delete" onClick={() => removeArtwork(art.id)}>Remove</button></td></tr>)}</tbody></table>{artworks.length === 0 && <div className="dash-empty">No uploaded artworks found.</div>}</div>}

      {section === "sales" && <><div className="dash-stats"><div className="dash-stat"><div className="dash-stat-icon">💰</div><div className="dash-value">—</div><div className="dash-label">TOTAL REVENUE</div></div><div className="dash-stat"><div className="dash-stat-icon">🛒</div><div className="dash-value">—</div><div className="dash-label">TOTAL ORDERS</div></div></div><div className="dash-empty">Sales totals are not connected to a shared order database yet.</div></>}

      {section === "profile" && <section className="dash-panel dash-profile"><div className="dash-profile-top"><div className="dash-big-avatar">{name.charAt(0).toUpperCase()}</div><div><h2>{name}</h2><p>⚙️ Administrator Account</p></div></div><div className="dash-profile-field"><small>NAME</small><div>{name}</div></div><div className="dash-profile-field"><small>EMAIL</small><div>{email}</div></div><div className="dash-profile-field"><small>ACCOUNT TYPE</small><div>Administrator</div></div></section>}
    </main>
  </div>;
}
