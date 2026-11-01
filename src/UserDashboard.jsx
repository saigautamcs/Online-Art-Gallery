import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserDashboard.css";

const artists = [
  { name: "Aria Bennett", bio: "Contemporary painter exploring silence, light and memory.", specialty: "Painting", city: "London" },
  { name: "Noah Williams", bio: "Digital artist blending geometry with cinematic colour.", specialty: "Digital Art", city: "New York" },
  { name: "Maya Chen", bio: "Fine-art photographer inspired by quiet urban moments.", specialty: "Photography", city: "Singapore" },
  { name: "Ethan Cole", bio: "Sculptor working with texture, balance and natural forms.", specialty: "Sculpture", city: "Melbourne" }
];

const arts = [
  { id: 1, title: "Golden Silence", artist: "Aria Bennett", category: "Painting", price: 18500, image: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=900&q=80", desc: "A warm abstract study of stillness, golden light and quiet space." },
  { id: 2, title: "Midnight Geometry", artist: "Noah Williams", category: "Digital", price: 24000, image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=900&q=80", desc: "Layered geometric forms inspired by city lights after dark." },
  { id: 3, title: "Quiet Morning", artist: "Maya Chen", category: "Photography", price: 16200, image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=900&q=80", desc: "A soft photographic composition capturing a peaceful morning atmosphere." },
  { id: 4, title: "Fragments of Light", artist: "Ethan Cole", category: "Sculpture", price: 29500, image: "https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=900&q=80", desc: "A sculptural exploration of form, reflection and fragmented light." },
  { id: 5, title: "Velvet Horizon", artist: "Aria Bennett", category: "Painting", price: 21800, image: "https://images.unsplash.com/photo-1578301978018-3005759f48f7?auto=format&fit=crop&w=900&q=80", desc: "Rich tones meet a calm horizon in this atmospheric contemporary work." },
  { id: 6, title: "Urban Echo", artist: "Maya Chen", category: "Photography", price: 13200, image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=900&q=80", desc: "A study of architecture, movement and human traces in the modern city." }
];

const readStorage = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
};

const money = (amount) => "₹" + amount.toLocaleString("en-IN");

function ArtworkCard({ artwork, onView }) {
  return (
    <article className="ud-card ud-art">
      <img src={artwork.image} alt={artwork.title} />
      <div className="ud-art-body">
        <div className="ud-art-title">{artwork.title}</div>
        <div className="ud-artist">by {artwork.artist} · {artwork.category}</div>
        <div className="ud-art-foot">
          <span className="ud-price">{money(artwork.price)}</span>
          <button className="ud-view" onClick={() => onView(artwork.id)}>VIEW ARTWORK</button>
        </div>
      </div>
    </article>
  );
}

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("artGalleryCurrentUser") || "null") ||
        { name: "User", email: "user@example.com" };
    } catch {
      return { name: "User", email: "user@example.com" };
    }
  });

  const uid = (user.email || user.name).replace(/[^a-z0-9]/gi, "_");
  const cartKey = `artGalleryCart_${uid}`;
  const favoritesKey = `artGalleryFavorites_${uid}`;
  const recentKey = `artGalleryRecent_${uid}`;

  const [section, setSection] = useState("home");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [favorites, setFavorites] = useState(() => readStorage(favoritesKey));
  const [recent, setRecent] = useState(() => readStorage(recentKey));
  const [cart, setCart] = useState(() => readStorage(cartKey));
  const [selectedArt, setSelectedArt] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
  }, [favorites, favoritesKey]);

  useEffect(() => {
    localStorage.setItem(recentKey, JSON.stringify(recent));
  }, [recent, recentKey]);

  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (["gallery", "favorites", "artists", "recent", "profile", "home"].includes(hash)) {
      setSection(hash);
    }
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const filteredArts = useMemo(() => arts.filter((art) => {
    const matchesSearch = `${art.title} ${art.artist}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filter === "all" || art.category === filter;
    return matchesSearch && matchesCategory;
  }), [search, filter]);

  const favoriteArts = favorites.map((id) => arts.find((art) => Number(art.id) === Number(id))).filter(Boolean);
  const recentArts = recent.map((id) => arts.find((art) => Number(art.id) === Number(id))).filter(Boolean);
  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
  const initial = (user.name || "U").charAt(0).toUpperCase();

  function showSection(id) {
    setSection(id);
    window.history.replaceState(null, "", `#${id}`);
    if (id === "gallery") {
      setSearch("");
      setFilter("all");
    }
  }

  function showToast(message) {
    setToastMessage(message);
  }

  function openArtwork(id) {
    const artwork = arts.find((item) => item.id === Number(id));
    if (!artwork) return;
    setRecent((old) => [artwork.id, ...old.filter((item) => Number(item) !== artwork.id)].slice(0, 6));
    setSelectedArt(artwork);
  }

  function addToCart(artwork) {
    setCart((old) => {
      const existing = old.find((item) => Number(item.id) === artwork.id);
      return existing
        ? old.map((item) => Number(item.id) === artwork.id ? { ...item, qty: (item.qty || 1) + 1 } : item)
        : [...old, { id: artwork.id, qty: 1 }];
    });
    showToast("Artwork added to cart");
  }

  function toggleFavorite(artwork) {
    setFavorites((old) => old.some((id) => Number(id) === artwork.id)
      ? old.filter((id) => Number(id) !== artwork.id)
      : [...old, artwork.id]);
    showToast("Favorites updated");
  }

  function logout() {
    localStorage.removeItem("artGalleryCurrentUser");
    navigate("/");
  }

  const selectedArtist = selectedArt ? artists.find((artist) => artist.name === selectedArt.artist) : null;

  return (
    <div className="ud-app">
      <aside className="ud-sidebar">
        <div className="ud-logo">ART GALLERY<small>ONLINE ART COLLECTION</small></div>
        <div className="ud-nav-title">MENU</div>
        <nav className="ud-nav">
          <button className={section === "home" ? "active" : ""} onClick={() => showSection("home")}><span className="ud-icon">⌂</span>Home</button>
          <button className={section === "gallery" ? "active" : ""} onClick={() => showSection("gallery")}><span className="ud-icon">▣</span>Explore Gallery</button>
          <button className={section === "favorites" ? "active" : ""} onClick={() => showSection("favorites")}><span className="ud-icon">★</span>Favorites</button>
          <button className={section === "artists" ? "active" : ""} onClick={() => showSection("artists")}><span className="ud-icon">♙</span>Artists</button>
          <button className={section === "recent" ? "active" : ""} onClick={() => showSection("recent")}><span className="ud-icon">◷</span>Recently Viewed</button>
          <button className={section === "profile" ? "active" : ""} onClick={() => showSection("profile")}><span className="ud-icon">●</span>My Profile</button>
          <button onClick={() => navigate("/cart")}><span className="ud-icon">🛒</span>Cart <b className="ud-cart-count">{cartCount ? `(${cartCount})` : ""}</b></button>
          <button onClick={() => navigate("/orders")}><span className="ud-icon">▤</span>My Orders</button>
        </nav>
        <div className="ud-sidebar-bottom">
          <div className="ud-user">
            <div className="ud-avatar">{initial}</div>
            <div><strong>{user.name || "User"}</strong><span>User Account</span></div>
          </div>
          <button className="ud-logout" onClick={logout}>LOGOUT</button>
        </div>
      </aside>

      <main className="ud-main">
        <div className="ud-topbar">
          <div className="ud-crumb">USER DASHBOARD / <b>{section.toUpperCase()}</b></div>
        </div>

        {section === "home" && (
          <section className="ud-section">
            <div className="ud-hero">
              <div>
                <div className="ud-eyebrow">WELCOME BACK</div>
                <h1>Discover <span>Art.</span></h1>
                <p>Hello, <b>{user.name || "User"}</b>. Explore meaningful artwork, discover new artists and build your personal collection.</p>
                <div className="ud-actions">
                  <button className="ud-primary" onClick={() => showSection("gallery")}>EXPLORE GALLERY →</button>
                  <button className="ud-secondary" onClick={() => showSection("favorites")}>VIEW FAVORITES</button>
                </div>
              </div>
            </div>
            <div className="ud-stats">
              <div className="ud-stat"><div><small>GALLERY ARTWORK</small><strong>{arts.length}</strong></div><i>▣</i></div>
              <div className="ud-stat"><div><small>FEATURED ARTISTS</small><strong>{artists.length}</strong></div><i>♙</i></div>
              <div className="ud-stat"><div><small>MY FAVORITES</small><strong>{favorites.length}</strong></div><i>★</i></div>
              <div className="ud-stat"><div><small>RECENTLY VIEWED</small><strong>{recent.length}</strong></div><i>◷</i></div>
            </div>
          </section>
        )}

        {section === "gallery" && (
          <section className="ud-section">
            <div className="ud-section-head"><div><h2>Explore Gallery</h2><p>Curated artwork from our featured artists.</p></div></div>
            <div className="ud-toolbar">
              <input className="ud-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search artwork or artist..." />
              <select className="ud-select" value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="all">All Categories</option><option>Painting</option><option>Digital</option><option>Sculpture</option><option>Photography</option>
              </select>
            </div>
            {filteredArts.length ? <div className="ud-grid">{filteredArts.map((art) => <ArtworkCard key={art.id} artwork={art} onView={openArtwork} />)}</div> : <div className="ud-empty">No artwork matches your search.</div>}
          </section>
        )}

        {section === "favorites" && (
          <section className="ud-section">
            <div className="ud-section-head"><div><h2>Favorites</h2><p>Your personal collection.</p></div></div>
            {favoriteArts.length ? <div className="ud-grid">{favoriteArts.map((art) => <ArtworkCard key={art.id} artwork={art} onView={openArtwork} />)}</div> : <div className="ud-empty">Nothing here yet.</div>}
          </section>
        )}

        {section === "artists" && (
          <section className="ud-section">
            <div className="ud-section-head"><div><h2>Featured Artists</h2><p>Meet the people behind the artwork.</p></div></div>
            <div className="ud-grid">{artists.map((artist) => (
              <article className="ud-card ud-artist-card" key={artist.name}>
                <div className="ud-eyebrow">{artist.specialty}</div>
                <h3>{artist.name}</h3><p>{artist.bio}</p><small>{artist.city}</small>
              </article>
            ))}</div>
          </section>
        )}

        {section === "recent" && (
          <section className="ud-section">
            <div className="ud-section-head"><div><h2>Recently Viewed</h2><p>Artwork you've explored recently.</p></div></div>
            {recentArts.length ? <div className="ud-grid">{recentArts.map((art) => <ArtworkCard key={art.id} artwork={art} onView={openArtwork} />)}</div> : <div className="ud-empty">Nothing here yet.</div>}
          </section>
        )}

        {section === "profile" && (
          <section className="ud-section">
            <div className="ud-section-head"><div><h2>My Profile</h2><p>Your account information.</p></div></div>
            <div className="ud-card ud-profile">
              <div className="ud-avatar ud-profile-avatar">{initial}</div>
              <div><h3>{user.name || "User"}</h3><p>{user.email || "Not available"}</p><p>Account type: User</p></div>
            </div>
          </section>
        )}
      </main>

      {selectedArt && (
        <div className="ud-modal" onClick={(event) => { if (event.target === event.currentTarget) setSelectedArt(null); }}>
          <div className="ud-modal-box">
            <button className="ud-close" onClick={() => setSelectedArt(null)}>×</button>
            <div className="ud-detail">
              <img src={selectedArt.image} alt={selectedArt.title} />
              <div>
                <div className="ud-eyebrow">{selectedArt.category}</div>
                <h2>{selectedArt.title}</h2>
                <div className="ud-artist">by {selectedArt.artist}</div>
                <p>{selectedArt.desc}</p>
                {selectedArtist && <div className="ud-artist-box"><b>ABOUT THE ARTIST</b><p><strong>{selectedArtist.name}</strong> · {selectedArtist.city}<br />{selectedArtist.bio}</p></div>}
                <div className="ud-actions">
                  <button className="ud-primary" onClick={() => addToCart(selectedArt)}>ADD TO CART · {money(selectedArt.price)}</button>
                  <button className="ud-secondary" onClick={() => toggleFavorite(selectedArt)}>
                    {favorites.some((id) => Number(id) === selectedArt.id) ? "★ REMOVE FAVORITE" : "☆ ADD FAVORITE"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMessage && <div className="ud-toast">{toastMessage}</div>}
    </div>
  );
}
