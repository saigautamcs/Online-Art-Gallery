import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

const readArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const money = (value) => "₹" + Number(value || 0).toLocaleString("en-IN");

export function ArtistDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem("artGalleryCurrentUser") || "null"); }
    catch { return null; }
  });
  const [section, setSection] = useState("home");
  const [artworks, setArtworks] = useState(() => readArray("artGalleryArtworks"));
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState("");

  const name = user?.name || user?.fullName || user?.username || "Artist";
  const email = user?.email || "Not available";

  const myArtworks = useMemo(
    () => artworks.filter((art) => (art.artistEmail || "").toLowerCase() === (email || "").toLowerCase()),
    [artworks, email]
  );

  if (!user || !["artist", "merchant"].includes(String(user.role || "").toLowerCase())) {
    return <div className="dash-guard"><h2>Artist account required</h2><p>Please sign in using an Artist account.</p><button className="dash-gold" onClick={() => navigate("/")}>GO TO LOGIN</button></div>;
  }

  const sections = {
    home: ["Artist Dashboard", "Manage your artwork and sales"],
    artworks: ["My Artworks", "Manage your published artwork"],
    upload: ["Upload Artwork", "Add a new artwork to the gallery"],
    sales: ["Sales", "Track your artwork sales"],
    profile: ["My Profile", "Manage your artist information"]
  };

  function changeSection(id) {
    setSection(id);
    setNotice("");
  }

  function uploadArtwork(event) {
    event.preventDefault();
    const amount = Number(price);
    let parsed;
    try {
      parsed = new URL(image.trim());
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      setNotice("Please enter a valid image URL beginning with http:// or https://.");
      return;
    }
    if (!title.trim() || !Number.isFinite(amount) || amount <= 0) {
      setNotice("Enter an artwork title and a price greater than zero.");
      return;
    }
    const newArt = {
      id: "art_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      title: title.trim(),
      artist: name,
      artistEmail: email,
      price: amount,
      image: parsed.href,
      description: description.trim(),
      createdAt: new Date().toISOString()
    };
    const updated = [...artworks, newArt];
    localStorage.setItem("artGalleryArtworks", JSON.stringify(updated));
    setArtworks(updated);
    setTitle(""); setPrice(""); setImage(""); setDescription("");
    setNotice("Artwork uploaded successfully. It is now saved in the gallery catalog.");
    setSection("artworks");
  }

  function deleteArtwork(id) {
    if (!window.confirm("Are you sure you want to delete this artwork?")) return;
    const updated = artworks.filter((art) => String(art.id) !== String(id));
    localStorage.setItem("artGalleryArtworks", JSON.stringify(updated));
    setArtworks(updated);
    setNotice("Artwork deleted.");
  }

  function logout() {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.removeItem("artGalleryCurrentUser");
    navigate("/");
  }

  const navItems = [
    ["home", "🏠", "Dashboard"], ["artworks", "🖼️", "My Artworks"],
    ["upload", "➕", "Upload Artwork"], ["sales", "💰", "Sales"], ["profile", "👤", "My Profile"]
  ];

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-logo">ART GALLERY<span>ARTIST PORTAL</span></div>
        <div className="dash-mini"><div className="dash-avatar">{name.charAt(0).toUpperCase()}</div><div><b>{name}</b><small>🎨 Artist Account</small></div></div>
        <div className="dash-nav-title">MENU</div>
        <nav className="dash-nav">{navItems.map(([id, icon, label]) => <button key={id} className={section === id ? "active" : ""} onClick={() => changeSection(id)}><span>{icon}</span>{label}</button>)}</nav>
        <div className="dash-bottom"><button className="dash-logout" onClick={logout}>🚪 LOGOUT</button></div>
      </aside>

      <main className="dash-main">
        <header className="dash-topbar"><div><h1>{sections[section][0]}</h1><p>{sections[section][1]}</p></div></header>
        {notice && <div className="dash-notice">{notice}</div>}

        {section === "home" && <>
          <section className="dash-welcome"><h2>Welcome, <span>{name}</span>!</h2><p>Manage your artwork, upload new creations, track your sales and build your presence in the gallery.</p></section>
          <div className="dash-stats">
            <div className="dash-stat"><div className="dash-stat-icon">🖼️</div><div className="dash-value">{myArtworks.length}</div><div className="dash-label">YOUR ARTWORKS</div></div>
            <div className="dash-stat"><div className="dash-stat-icon">💰</div><div className="dash-value">{money(0)}</div><div className="dash-label">TOTAL SALES</div></div>
            <div className="dash-stat"><div className="dash-stat-icon">❤️</div><div className="dash-value">—</div><div className="dash-label">LIKES</div></div>
            <div className="dash-stat"><div className="dash-stat-icon">👁️</div><div className="dash-value">—</div><div className="dash-label">VIEWS</div></div>
          </div>
          <div className="dash-section-head"><h2>Your Recent Artwork</h2><button className="dash-outline" onClick={() => changeSection("upload")}>+ UPLOAD ARTWORK</button></div>
          <div className="dash-art-grid">{myArtworks.slice(-3).reverse().map((art) => <article className="dash-art-card" key={art.id}><img src={art.image} alt={art.title}/><div className="dash-art-info"><h3>{art.title}</h3><p>{art.description || "Your artwork"}</p><b>{money(art.price)}</b></div></article>)}</div>
          {myArtworks.length === 0 && <div className="dash-empty">You have not uploaded any artwork yet. Choose “Upload Artwork” to add your first creation.</div>}
        </>}

        {section === "artworks" && <>
          <div className="dash-section-head"><h2>My Artworks</h2><button className="dash-gold" onClick={() => changeSection("upload")}>+ UPLOAD ARTWORK</button></div>
          {myArtworks.length ? <div className="dash-art-grid">{myArtworks.map((art) => <article className="dash-art-card" key={art.id}><img src={art.image} alt={art.title}/><div className="dash-art-info"><h3>{art.title}</h3><p>{art.description || "Published artwork"}</p><div className="dash-art-foot"><b>{money(art.price)}</b><button className="dash-delete" onClick={() => deleteArtwork(art.id)}>Delete</button></div></div></article>)}</div> : <div className="dash-empty">No artworks uploaded yet.</div>}
        </>}

        {section === "upload" && <form className="dash-panel dash-upload" onSubmit={uploadArtwork}>
          <h2>Upload New Artwork</h2>
          <label>ARTWORK TITLE<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter artwork title" required /></label>
          <label>PRICE (₹)<input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price" required /></label>
          <label>IMAGE URL<input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="Paste an image URL beginning with https://" required /></label>
          <label>DESCRIPTION<textarea rows="5" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your artwork" /></label>
          <button className="dash-gold" type="submit">UPLOAD ARTWORK</button>
        </form>}

        {section === "sales" && <><div className="dash-stats"><div className="dash-stat"><div className="dash-stat-icon">💰</div><div className="dash-value">{money(0)}</div><div className="dash-label">TOTAL REVENUE</div></div><div className="dash-stat"><div className="dash-stat-icon">🛒</div><div className="dash-value">0</div><div className="dash-label">SOLD ARTWORKS</div></div></div><div className="dash-empty">Sales information will appear here when customer orders are connected to artist accounts.</div></>}

        {section === "profile" && <section className="dash-panel dash-profile"><div className="dash-profile-top"><div className="dash-big-avatar">{name.charAt(0).toUpperCase()}</div><div><h2>{name}</h2><p>🎨 Artist Account</p></div></div><div className="dash-profile-field"><small>NAME</small><div>{name}</div></div><div className="dash-profile-field"><small>EMAIL</small><div>{email}</div></div><div className="dash-profile-field"><small>ACCOUNT TYPE</small><div>Artist</div></div></section>}
      </main>
    </div>
  );
}
