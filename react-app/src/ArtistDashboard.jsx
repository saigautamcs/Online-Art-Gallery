
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

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("artGalleryCurrentUser") || "null");
  } catch {
    return null;
  }
};

const money = (value) =>
  "₹" + Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

export function ArtistDashboard() {
  const navigate = useNavigate();
  const [user] = useState(readUser);
  const [section, setSection] = useState("home");
  const [artworks, setArtworks] = useState(() => readArray("artGalleryArtworks"));

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");

  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [editingId, setEditingId] = useState(null);

  const name = user?.name || user?.fullName || user?.username || "Artist";
  const email = user?.email || "Not available";

  const isArtist = ["artist", "merchant"].includes(
    String(user?.role || "").toLowerCase()
  );

  const myArtworks = useMemo(
    () =>
      artworks
        .filter((art) =>
          String(art.artistEmail || "").toLowerCase() === email.toLowerCase()
        )
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [artworks, email]
  );

  const totalRevenue = myArtworks.reduce(
    (total, art) => total + Number(art.soldPrice || 0) * Number(art.quantitySold || 0),
    0
  );

  const soldArtworks = myArtworks.reduce(
    (total, art) => total + Number(art.quantitySold || 0),
    0
  );

  const pendingCount = myArtworks.filter(
    (art) => String(art.status || "approved").toLowerCase() === "pending"
  ).length;

  const isEditing = editingId !== null;

  function showNotice(message, type = "success") {
    setNotice(message);
    setNoticeType(type);
  }

  function changeSection(id) {
    setSection(id);
    setNotice("");
  }

  function saveArtworks(updated) {
    try {
      localStorage.setItem("artGalleryArtworks", JSON.stringify(updated));
      setArtworks(updated);
      return true;
    } catch {
      showNotice("Unable to save artwork. Browser storage may be full.", "error");
      return false;
    }
  }

  function clearForm() {
    setTitle("");
    setPrice("");
    setImage("");
    setDescription("");
    setEditingId(null);
  }

  function editArtwork(art) {
    setEditingId(art.id);
    setTitle(art.title || "");
    setPrice(String(art.price || ""));
    setImage(art.image || "");
    setDescription(art.description || "");
    setNotice("");
    setSection("upload");
  }

  function cancelEdit() {
    clearForm();
    setNotice("");
    setSection("artworks");
  }

  function uploadArtwork(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const amount = Number(price);

    if (!trimmedTitle) {
      return showNotice("Please enter an artwork title.", "error");
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return showNotice("Please enter a valid price greater than zero.", "error");
    }

    let parsedImage;
    try {
      parsedImage = new URL(image.trim());
      if (!["http:", "https:"].includes(parsedImage.protocol)) throw new Error();
    } catch {
      return showNotice("Please enter a valid image URL.", "error");
    }

    if (isEditing) {
      const existingArtwork = artworks.find(
        (art) => String(art.id) === String(editingId)
      );

      if (
        !existingArtwork ||
        String(existingArtwork.artistEmail || "").toLowerCase() !== email.toLowerCase()
      ) {
        return showNotice("Artwork not found or permission denied.", "error");
      }

      const updated = artworks.map((art) =>
        String(art.id) === String(editingId)
          ? {
              ...art,
              title: trimmedTitle,
              price: amount,
              image: parsedImage.href,
              description: description.trim(),
              status: "pending",
              reviewedAt: null,
              updatedAt: new Date().toISOString(),
            }
          : art
      );

      if (saveArtworks(updated)) {
        clearForm();
        setSection("artworks");
        showNotice("Artwork updated and sent to the admin for approval.");
      }
    } else {
      const newArtwork = {
        id: "art_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
        title: trimmedTitle,
        artist: name,
        artistEmail: email,
        price: amount,
        image: parsedImage.href,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        quantitySold: 0,
        soldPrice: 0,
        status: "pending",
      };

      if (saveArtworks([newArtwork, ...artworks])) {
        clearForm();
        setSection("artworks");
        showNotice("Artwork submitted successfully! Waiting for admin approval.");
      }
    }
  }

  function deleteArtwork(id) {
    if (!window.confirm("Are you sure you want to delete this artwork?")) return;

    const artwork = artworks.find((art) => String(art.id) === String(id));

    if (
      !artwork ||
      String(artwork.artistEmail || "").toLowerCase() !== email.toLowerCase()
    ) {
      return showNotice("Artwork not found or permission denied.", "error");
    }

    const updated = artworks.filter((art) => String(art.id) !== String(id));

    if (saveArtworks(updated)) {
      if (String(editingId) === String(id)) clearForm();
      showNotice("Artwork deleted successfully.");
    }
  }

  function logout() {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.removeItem("artGalleryCurrentUser");
    navigate("/");
  }

  const sections = {
    home: ["Artist Dashboard", "Manage your artwork and sales"],
    artworks: ["My Artworks", "Manage your submitted artwork and approval status"],
    upload: [isEditing ? "Edit Artwork" : "Upload Artwork", isEditing ? "Update your artwork information" : "Submit a new artwork for approval"],
    sales: ["Sales", "Track your artwork sales"],
    profile: ["My Profile", "Manage your artist information"],
  };

  const navItems = [
    ["home", "🏠", "Dashboard"],
    ["artworks", "🖼️", "My Artworks"],
    ["upload", "➕", "Upload Artwork"],
    ["sales", "💰", "Sales"],
    ["profile", "👤", "My Profile"],
  ];

  if (!user || !isArtist) {
    return (
      <div className="dash-guard">
        <h2>Artist Account Required</h2>
        <p>Please sign in using an Artist account.</p>
        <button className="dash-gold" onClick={() => navigate("/")}>GO TO LOGIN</button>
      </div>
    );
  }

  function statusLabel(art) {
    const status = String(art.status || "approved").toLowerCase();
    if (status === "pending") return "⏳ Pending Approval";
    if (status === "rejected") return "✕ Rejected — Edit to Resubmit";
    return "✓ Approved";
  }

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-logo">ART GALLERY<span>ARTIST PORTAL</span></div>

        <div className="dash-mini">
          <div className="dash-avatar">{name.charAt(0).toUpperCase()}</div>
          <div><b>{name}</b><small>🎨 Artist Account</small></div>
        </div>

        <div className="dash-nav-title">MENU</div>
        <nav className="dash-nav">
          {navItems.map(([id, icon, label]) => (
            <button key={id} className={section === id ? "active" : ""} onClick={() => changeSection(id)}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>

        <div className="dash-bottom">
          <button className="dash-logout" onClick={logout}>🚪 LOGOUT</button>
        </div>
      </aside>

      <main className="dash-main">
        <header className="dash-topbar">
          <div><h1>{sections[section][0]}</h1><p>{sections[section][1]}</p></div>
        </header>

        {notice && (
          <div className="dash-notice" role="status" style={{
            borderLeft: `4px solid ${noticeType === "error" ? "#dc3545" : "#198754"}`,
          }}>
            {notice}
          </div>
        )}

        {section === "home" && (
          <>
            <section className="dash-welcome">
              <h2>Welcome, <span>{name}</span>!</h2>
              <p>Manage your artwork, submit new creations for approval, track your sales and build your presence in the gallery.</p>
            </section>

            <div className="dash-stats">
              <div className="dash-stat"><div className="dash-stat-icon">🖼️</div><div className="dash-value">{myArtworks.length}</div><div className="dash-label">YOUR ARTWORKS</div></div>
              <div className="dash-stat"><div className="dash-stat-icon">💰</div><div className="dash-value">{money(totalRevenue)}</div><div className="dash-label">TOTAL SALES</div></div>
              <div className="dash-stat"><div className="dash-stat-icon">🛒</div><div className="dash-value">{soldArtworks}</div><div className="dash-label">SOLD ARTWORKS</div></div>
              <div className="dash-stat"><div className="dash-stat-icon">⏳</div><div className="dash-value">{pendingCount}</div><div className="dash-label">PENDING APPROVAL</div></div>
            </div>

            <div className="dash-section-head">
              <h2>Your Recent Artwork</h2>
              <button className="dash-outline" onClick={() => { clearForm(); changeSection("upload"); }}>+ UPLOAD ARTWORK</button>
            </div>

            {myArtworks.length ? (
              <div className="dash-art-grid">
                {myArtworks.slice(0, 3).map((art) => (
                  <article className="dash-art-card" key={art.id}>
                    <img src={art.image} alt={art.title} loading="lazy" />
                    <div className="dash-art-info">
                      <h3>{art.title}</h3>
                      <p>{art.description || "Your artwork"}</p>
                      <b>{money(art.price)}</b>
                      <p>{statusLabel(art)}</p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dash-empty">You have not uploaded any artwork yet. Choose Upload Artwork to add your first creation.</div>
            )}
          </>
        )}

        {section === "artworks" && (
          <>
            <div className="dash-section-head">
              <h2>My Artworks</h2>
              <button className="dash-gold" onClick={() => { clearForm(); changeSection("upload"); }}>+ UPLOAD ARTWORK</button>
            </div>

            {myArtworks.length ? (
              <div className="dash-art-grid">
                {myArtworks.map((art) => (
                  <article className="dash-art-card" key={art.id}>
                    <img src={art.image} alt={art.title} loading="lazy" />
                    <div className="dash-art-info">
                      <h3>{art.title}</h3>
                      <p>{art.description || "Your artwork"}</p>
                      <b>{money(art.price)}</b>
                      <p>{statusLabel(art)}</p>
                      <div className="dash-art-actions">
                        <button type="button" className="dash-edit" onClick={() => editArtwork(art)}>✏️ Edit</button>
                        <button type="button" className="dash-delete" onClick={() => deleteArtwork(art.id)}>🗑️ Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dash-empty">No artworks uploaded yet. Click Upload Artwork to get started.</div>
            )}
          </>
        )}

        {section === "upload" && (
          <form className="dash-panel dash-upload" onSubmit={uploadArtwork}>
            <h2>{isEditing ? "✏️ Edit Artwork" : "Upload New Artwork"}</h2>

            <label>ARTWORK TITLE
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter artwork title" maxLength={100} required />
            </label>

            <label>PRICE (₹)
              <input type="number" min="1" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Enter price" required />
            </label>

            <label>IMAGE URL
              <input type="url" value={image} onChange={(e) => setImage(e.target.value)} placeholder="Paste image URL" required />
            </label>

            {image.trim() && (
              <div className="dash-image-preview">
                <p>IMAGE PREVIEW</p>
                <img src={image} alt="Artwork preview" onError={(e) => { e.currentTarget.style.display = "none"; }} onLoad={(e) => { e.currentTarget.style.display = "block"; }} />
              </div>
            )}

            <label>DESCRIPTION
              <textarea rows="5" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your artwork" maxLength={1000} />
            </label>

            {isEditing && (
              <p className="dash-empty">After saving your changes, this artwork will return to Pending Approval until the admin reviews it.</p>
            )}

            <div className="dash-form-actions">
              <button className="dash-gold" type="submit">{isEditing ? "SAVE & RESUBMIT" : "SUBMIT FOR APPROVAL"}</button>
              {isEditing && <button type="button" className="dash-cancel" onClick={cancelEdit}>CANCEL</button>}
            </div>
          </form>
        )}

        {section === "sales" && (
          <>
            <div className="dash-stats">
              <div className="dash-stat"><div className="dash-stat-icon">💰</div><div className="dash-value">{money(totalRevenue)}</div><div className="dash-label">TOTAL REVENUE</div></div>
              <div className="dash-stat"><div className="dash-stat-icon">🛒</div><div className="dash-value">{soldArtworks}</div><div className="dash-label">SOLD ARTWORKS</div></div>
            </div>
            <div className="dash-empty">Sales information will appear here when customer orders are connected to artist accounts.</div>
          </>
        )}

        {section === "profile" && (
          <section className="dash-panel dash-profile">
            <div className="dash-profile-top">
              <div className="dash-big-avatar">{name.charAt(0).toUpperCase()}</div>
              <div><h2>{name}</h2><p>🎨 Artist Account</p></div>
            </div>
            <div className="dash-profile-field"><small>NAME</small><div>{name}</div></div>
            <div className="dash-profile-field"><small>EMAIL</small><div>{email}</div></div>
            <div className="dash-profile-field"><small>ACCOUNT TYPE</small><div>Artist</div></div>
          </section>
        )}
      </main>
    </div>
  );
}
