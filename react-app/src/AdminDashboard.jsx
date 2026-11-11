
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

export function AdminDashboard() {
  const navigate = useNavigate();
  const [user] = useState(readUser);
  const [section, setSection] = useState("home");
  const [users, setUsers] = useState(() => readArray("artGalleryUsers"));
  const [artworks, setArtworks] = useState(() => readArray("artGalleryArtworks"));
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const [editingArtistEmail, setEditingArtistEmail] = useState(null);
  const [artistName, setArtistName] = useState("");
  const [artistEmail, setArtistEmail] = useState("");

  const [editingArtworkId, setEditingArtworkId] = useState(null);
  const [artworkTitle, setArtworkTitle] = useState("");
  const [artworkPrice, setArtworkPrice] = useState("");
  const [artworkImage, setArtworkImage] = useState("");
  const [artworkDescription, setArtworkDescription] = useState("");

  const name = user?.name || user?.fullName || user?.username || "Admin";
  const email = user?.email || "Not available";
  const isAdmin = user && String(user.role || "").toLowerCase() === "admin";

  const registeredUsers = useMemo(
    () => users.filter((entry) => String(entry.role || "").toLowerCase() !== "admin"),
    [users]
  );

  const artists = useMemo(
    () => registeredUsers.filter((entry) =>
      ["artist", "merchant"].includes(String(entry.role || "").toLowerCase())
    ),
    [registeredUsers]
  );

  const customers = registeredUsers.filter(
    (entry) => String(entry.role || "").toLowerCase() === "user"
  );

  const filteredUsers = useMemo(
    () => registeredUsers.filter((entry) =>
      `${entry.name || entry.fullName || ""} ${entry.email || ""} ${entry.role || ""}`
        .toLowerCase().includes(search.toLowerCase())
    ),
    [registeredUsers, search]
  );

  const pendingArtworks = artworks.filter(
    (art) => String(art.status || "approved").toLowerCase() === "pending"
  );

  const sections = {
    home: ["Admin Dashboard", "Manage the Art Gallery platform"],
    users: ["User Management", "Manage registered users"],
    artists: ["Artist Management", "Manage artists and their accounts"],
    approvals: ["Artwork Approvals", "Review artwork submitted by artists"],
    artworks: ["Artwork Management", "Review and manage all artwork"],
    editArtist: ["Edit Artist", "Update artist account information"],
    editArtwork: ["Edit Artwork", "Update artwork information"],
    sales: ["Sales Overview", "Monitor gallery transactions"],
    profile: ["My Profile", "Administrator account information"],
  };

  function showNotice(message, type = "success") {
    setNotice(message);
    setNoticeType(type);
  }

  function changeSection(id) {
    setSection(id);
    setNotice("");
  }

  function saveUsers(updated) {
    try {
      localStorage.setItem("artGalleryUsers", JSON.stringify(updated));
      setUsers(updated);
      return true;
    } catch {
      showNotice("Unable to save user information. Browser storage may be full.", "error");
      return false;
    }
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

  // ARTWORK APPROVAL
  function approveArtwork(id) {
    const updated = artworks.map((art) =>
      String(art.id) === String(id)
        ? { ...art, status: "approved", reviewedAt: new Date().toISOString() }
        : art
    );

    if (saveArtworks(updated)) {
      showNotice("Artwork approved. It is now visible in the customer gallery.");
    }
  }

  function rejectArtwork(id) {
    const confirmed = window.confirm("Are you sure you want to reject this artwork?");
    if (!confirmed) return;

    const updated = artworks.map((art) =>
      String(art.id) === String(id)
        ? { ...art, status: "rejected", reviewedAt: new Date().toISOString() }
        : art
    );

    if (saveArtworks(updated)) {
      showNotice("Artwork rejected. The artist can edit and resubmit it.");
    }
  }

  // EDIT ARTIST
  function editArtist(artist) {
    setEditingArtistEmail(artist.email);
    setArtistName(artist.name || artist.fullName || artist.username || "");
    setArtistEmail(artist.email || "");
    setNotice("");
    setSection("editArtist");
  }

  function clearArtistForm() {
    setEditingArtistEmail(null);
    setArtistName("");
    setArtistEmail("");
  }

  function cancelArtistEdit() {
    clearArtistForm();
    changeSection("artists");
  }

  function updateArtist(event) {
    event.preventDefault();

    const trimmedName = artistName.trim();
    const trimmedEmail = artistEmail.trim().toLowerCase();

    if (!trimmedName) return showNotice("Please enter the artist's name.", "error");

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      return showNotice("Please enter a valid email address.", "error");
    }

    const existingArtist = users.find(
      (entry) =>
        entry.email === editingArtistEmail &&
        ["artist", "merchant"].includes(String(entry.role || "").toLowerCase())
    );

    if (!existingArtist) return showNotice("Artist account not found.", "error");

    const emailAlreadyUsed = users.some(
      (entry) =>
        String(entry.email || "").toLowerCase() === trimmedEmail &&
        String(entry.email || "").toLowerCase() !== String(editingArtistEmail || "").toLowerCase()
    );

    if (emailAlreadyUsed) {
      return showNotice("This email address is already used by another account.", "error");
    }

    const oldEmail = editingArtistEmail;

    const updatedUsers = users.map((entry) => {
      if (entry.email === oldEmail) {
        return {
          ...entry,
          name: trimmedName,
          ...(Object.prototype.hasOwnProperty.call(entry, "fullName")
            ? { fullName: trimmedName }
            : {}),
          ...(Object.prototype.hasOwnProperty.call(entry, "username")
            ? { username: trimmedName }
            : {}),
          email: trimmedEmail,
          updatedAt: new Date().toISOString(),
        };
      }
      return entry;
    });

    const updatedArtworks = artworks.map((art) =>
      String(art.artistEmail || "").toLowerCase() === String(oldEmail || "").toLowerCase()
        ? { ...art, artist: trimmedName, artistEmail: trimmedEmail }
        : art
    );

    try {
      localStorage.setItem("artGalleryUsers", JSON.stringify(updatedUsers));
      localStorage.setItem("artGalleryArtworks", JSON.stringify(updatedArtworks));
      setUsers(updatedUsers);
      setArtworks(updatedArtworks);
      clearArtistForm();
      setSection("artists");
      showNotice("Artist account updated successfully!");
    } catch {
      showNotice("Unable to save changes. Browser storage may be full.", "error");
    }
  }

  // EDIT ARTWORK
  function editArtwork(art) {
    setEditingArtworkId(art.id);
    setArtworkTitle(art.title || "");
    setArtworkPrice(String(art.price ?? ""));
    setArtworkImage(art.image || "");
    setArtworkDescription(art.description || "");
    setNotice("");
    setSection("editArtwork");
  }

  function clearArtworkForm() {
    setEditingArtworkId(null);
    setArtworkTitle("");
    setArtworkPrice("");
    setArtworkImage("");
    setArtworkDescription("");
  }

  function cancelArtworkEdit() {
    clearArtworkForm();
    changeSection("artworks");
  }

  function updateArtwork(event) {
    event.preventDefault();

    const trimmedTitle = artworkTitle.trim();
    const amount = Number(artworkPrice);

    if (!trimmedTitle) return showNotice("Please enter an artwork title.", "error");
    if (!Number.isFinite(amount) || amount <= 0) {
      return showNotice("Please enter a valid price greater than zero.", "error");
    }

    let parsedImage;
    try {
      parsedImage = new URL(artworkImage.trim());
      if (!["http:", "https:"].includes(parsedImage.protocol)) throw new Error();
    } catch {
      return showNotice("Please enter a valid image URL.", "error");
    }

    const exists = artworks.some((art) => String(art.id) === String(editingArtworkId));
    if (!exists) return showNotice("Artwork not found.", "error");

    const updated = artworks.map((art) =>
      String(art.id) === String(editingArtworkId)
        ? {
            ...art,
            title: trimmedTitle,
            price: amount,
            image: parsedImage.href,
            description: artworkDescription.trim(),
            updatedAt: new Date().toISOString(),
          }
        : art
    );

    if (saveArtworks(updated)) {
      clearArtworkForm();
      setSection("artworks");
      showNotice("Artwork updated successfully!");
    }
  }

  function removeUser(target) {
    if (!window.confirm(`Remove ${target.email || "this account"}?`)) return;

    const updated = users.filter(
      (entry) => !(entry.email === target.email && entry.role === target.role)
    );

    if (saveUsers(updated)) showNotice("User account removed.");
  }

  function removeArtwork(id) {
    if (!window.confirm("Remove this artwork from the gallery?")) return;

    const updated = artworks.filter((art) => String(art.id) !== String(id));
    if (saveArtworks(updated)) showNotice("Artwork removed from the gallery.");
  }

  function logout() {
    if (!window.confirm("Are you sure you want to log out?")) return;
    localStorage.removeItem("artGalleryCurrentUser");
    navigate("/");
  }

  const navItems = [
    ["home", "🏠", "Dashboard"],
    ["users", "👥", "Users"],
    ["artists", "🎨", "Artists"],
    ["approvals", "✓", `Approvals (${pendingArtworks.length})`],
    ["artworks", "🖼️", "Artworks"],
    ["sales", "💰", "Sales"],
    ["profile", "👤", "My Profile"],
  ];

  const recentUsers = registeredUsers.slice(-5).reverse();

  if (!isAdmin) {
    return (
      <div className="dash-guard">
        <h2>Administrator account required</h2>
        <p>Please sign in using an Admin account.</p>
        <button className="dash-gold" onClick={() => navigate("/")}>GO TO LOGIN</button>
      </div>
    );
  }

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-logo">ART GALLERY<span>ADMIN PORTAL</span></div>

        <div className="dash-mini">
          <div className="dash-avatar">{name.charAt(0).toUpperCase()}</div>
          <div><b>{name}</b><small>⚙️ Administrator</small></div>
        </div>

        <div className="dash-nav-title">ADMIN MENU</div>
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
              <p>Monitor users, artists, artwork approvals and transactions from one central dashboard.</p>
            </section>

            <div className="dash-stats">
              <div className="dash-stat"><div className="dash-stat-icon">👥</div><div className="dash-value">{customers.length}</div><div className="dash-label">TOTAL USERS</div></div>
              <div className="dash-stat"><div className="dash-stat-icon">🎨</div><div className="dash-value">{artists.length}</div><div className="dash-label">ARTISTS</div></div>
              <div className="dash-stat"><div className="dash-stat-icon">🖼️</div><div className="dash-value">{artworks.length}</div><div className="dash-label">TOTAL ARTWORKS</div></div>
              <div className="dash-stat"><div className="dash-stat-icon">⏳</div><div className="dash-value">{pendingArtworks.length}</div><div className="dash-label">PENDING APPROVAL</div></div>
            </div>

            <div className="dash-section-head">
              <h2>Artwork Waiting for Approval</h2>
              <button className="dash-outline" onClick={() => changeSection("approvals")}>REVIEW ARTWORK</button>
            </div>

            {pendingArtworks.length === 0 ? (
              <div className="dash-empty">There are no artworks waiting for approval.</div>
            ) : (
              <div className="dash-art-grid">
                {pendingArtworks.slice(0, 3).map((art) => (
                  <article className="dash-art-card" key={art.id}>
                    <img src={art.image} alt={art.title} />
                    <div className="dash-art-info">
                      <h3>{art.title}</h3>
                      <p>Submitted by {art.artist || "Artist"}</p>
                      <span className="dash-status">Pending</span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="dash-section-head"><h2>Recent Users</h2><button className="dash-outline" onClick={() => changeSection("users")}>VIEW ALL USERS</button></div>
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th></tr></thead>
                <tbody>
                  {recentUsers.map((entry, index) => (
                    <tr key={`${entry.email}-${index}`}>
                      <td>{entry.name || entry.fullName || "—"}</td>
                      <td>{entry.email || "—"}</td>
                      <td>{entry.role || "User"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {recentUsers.length === 0 && <div className="dash-empty">No registered users found yet.</div>}
            </div>
          </>
        )}

        {section === "users" && (
          <>
            <input className="dash-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users by name, email or role..." />
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>ACTION</th></tr></thead>
                <tbody>
                  {filteredUsers.map((entry, index) => (
                    <tr key={`${entry.email}-${index}`}>
                      <td>{entry.name || entry.fullName || "—"}</td>
                      <td>{entry.email || "—"}</td>
                      <td>{entry.role || "User"}</td>
                      <td><button type="button" className="dash-delete" onClick={() => removeUser(entry)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <div className="dash-empty">No matching user accounts.</div>}
            </div>
          </>
        )}

        {section === "artists" && (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead><tr><th>ARTIST</th><th>EMAIL</th><th>ARTWORKS</th><th>STATUS</th><th>ACTION</th></tr></thead>
              <tbody>
                {artists.map((artist, index) => (
                  <tr key={`${artist.email}-${index}`}>
                    <td>{artist.name || artist.fullName || "—"}</td>
                    <td>{artist.email || "—"}</td>
                    <td>{artworks.filter((art) => String(art.artistEmail || "").toLowerCase() === String(artist.email || "").toLowerCase()).length}</td>
                    <td><span className="dash-status">Active</span></td>
                    <td><button type="button" className="dash-edit" onClick={() => editArtist(artist)}>✏️ Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {artists.length === 0 && <div className="dash-empty">No artist accounts found.</div>}
          </div>
        )}

        {/* ADMIN APPROVAL QUEUE */}
        {section === "approvals" && (
          <>
            <div className="dash-section-head">
              <h2>Pending Submissions ({pendingArtworks.length})</h2>
            </div>

            {pendingArtworks.length > 0 ? (
              <div className="dash-art-grid">
                {pendingArtworks.map((art) => (
                  <article className="dash-art-card" key={art.id}>
                    <img src={art.image} alt={art.title || "Artwork submission"} />
                    <div className="dash-art-info">
                      <h3>{art.title || "Untitled artwork"}</h3>
                      <p>Artist: {art.artist || "—"}</p>
                      <p>Email: {art.artistEmail || "—"}</p>
                      <p>Price: {money(art.price)}</p>
                      <p>{art.description || "No description provided."}</p>
                      <span className="dash-status">Pending Review</span>
                      <div className="dash-art-actions">
                        <button type="button" className="dash-gold" onClick={() => approveArtwork(art.id)}>✓ APPROVE</button>
                        <button type="button" className="dash-delete" onClick={() => rejectArtwork(art.id)}>✕ REJECT</button>
                        <button type="button" className="dash-edit" onClick={() => editArtwork(art)}>✏️ Edit</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="dash-empty">All caught up! No artwork is waiting for approval.</div>
            )}
          </>
        )}

        {section === "editArtist" && (
          <form className="dash-panel dash-upload" onSubmit={updateArtist}>
            <h2>✏️ Edit Artist Account</h2>
            <label>ARTIST NAME<input type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Enter artist name" maxLength={100} required /></label>
            <label>EMAIL ADDRESS<input type="email" value={artistEmail} onChange={(e) => setArtistEmail(e.target.value)} placeholder="Enter artist email" required /></label>
            <div className="dash-form-actions">
              <button type="submit" className="dash-gold">SAVE CHANGES</button>
              <button type="button" className="dash-cancel" onClick={cancelArtistEdit}>CANCEL</button>
            </div>
          </form>
        )}

        {section === "artworks" && (
          <div className="dash-table-wrap">
            <table className="dash-table">
              <thead><tr><th>TITLE</th><th>ARTIST</th><th>PRICE</th><th>STATUS</th><th>ACTION</th></tr></thead>
              <tbody>
                {artworks.map((art) => {
                  const status = String(art.status || "approved").toLowerCase();
                  return (
                    <tr key={art.id}>
                      <td>{art.title || "—"}</td>
                      <td>{art.artist || "—"}</td>
                      <td>{money(art.price)}</td>
                      <td><span className="dash-status">{status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending"}</span></td>
                      <td>
                        <div className="dash-art-actions">
                          <button type="button" className="dash-edit" onClick={() => editArtwork(art)}>✏️ Edit</button>
                          <button type="button" className="dash-delete" onClick={() => removeArtwork(art.id)}>Remove</button>
                          {status === "pending" && <button type="button" className="dash-gold" onClick={() => approveArtwork(art.id)}>Approve</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {artworks.length === 0 && <div className="dash-empty">No uploaded artworks found.</div>}
          </div>
        )}

        {section === "editArtwork" && (
          <form className="dash-panel dash-upload" onSubmit={updateArtwork}>
            <h2>✏️ Edit Artwork</h2>
            <label>ARTWORK TITLE<input type="text" value={artworkTitle} onChange={(e) => setArtworkTitle(e.target.value)} placeholder="Enter artwork title" maxLength={100} required /></label>
            <label>PRICE (₹)<input type="number" min="0.01" step="0.01" value={artworkPrice} onChange={(e) => setArtworkPrice(e.target.value)} placeholder="Enter price" required /></label>
            <label>IMAGE URL<input type="url" value={artworkImage} onChange={(e) => setArtworkImage(e.target.value)} placeholder="Paste image URL" required /></label>
            {artworkImage.trim() && <div className="dash-image-preview"><p>IMAGE PREVIEW</p><img src={artworkImage} alt="Artwork preview" onError={(e) => { e.currentTarget.style.display = "none"; }} onLoad={(e) => { e.currentTarget.style.display = "block"; }} /></div>}
            <label>DESCRIPTION<textarea rows="5" value={artworkDescription} onChange={(e) => setArtworkDescription(e.target.value)} placeholder="Describe your artwork" maxLength={1000} /></label>
            <div className="dash-form-actions">
              <button type="submit" className="dash-gold">SAVE CHANGES</button>
              <button type="button" className="dash-cancel" onClick={cancelArtworkEdit}>CANCEL</button>
            </div>
          </form>
        )}

        {section === "sales" && (
          <>
            <div className="dash-stats">
              <div className="dash-stat"><div className="dash-stat-icon">💰</div><div className="dash-value">—</div><div className="dash-label">TOTAL REVENUE</div></div>
              <div className="dash-stat"><div className="dash-stat-icon">🛒</div><div className="dash-value">—</div><div className="dash-label">TOTAL ORDERS</div></div>
            </div>
            <div className="dash-empty">Sales totals are not connected to a shared order database yet.</div>
          </>
        )}

        {section === "profile" && (
          <section className="dash-panel dash-profile">
            <div className="dash-profile-top">
              <div className="dash-big-avatar">{name.charAt(0).toUpperCase()}</div>
              <div><h2>{name}</h2><p>⚙️ Administrator Account</p></div>
            </div>
            <div className="dash-profile-field"><small>NAME</small><div>{name}</div></div>
            <div className="dash-profile-field"><small>EMAIL</small><div>{email}</div></div>
            <div className="dash-profile-field"><small>ACCOUNT TYPE</small><div>Administrator</div></div>
          </section>
        )}
      </main>
    </div>
  );
}
