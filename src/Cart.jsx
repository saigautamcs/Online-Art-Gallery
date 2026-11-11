import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Cart.css";

const artworks = [
  { id: 1, title: "Golden Silence", artist: "Aria Bennett", price: 18500, image: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=700&q=80" },
  { id: 2, title: "Midnight Geometry", artist: "Noah Williams", price: 24000, image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=700&q=80" },
  { id: 3, title: "Quiet Morning", artist: "Maya Chen", price: 16200, image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=700&q=80" },
  { id: 4, title: "Fragments of Light", artist: "Ethan Cole", price: 29500, image: "https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=700&q=80" },
  { id: 5, title: "Velvet Horizon", artist: "Aria Bennett", price: 21800, image: "https://images.unsplash.com/photo-1578301978018-3005759f48f7?auto=format&fit=crop&w=700&q=80" },
  { id: 6, title: "Urban Echo", artist: "Maya Chen", price: 13200, image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=700&q=80" }
];

function readCart(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

const money = (amount) => "₹" + amount.toLocaleString("en-IN");

export default function Cart() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("artGalleryCurrentUser") || "null");
      return saved && typeof saved === "object"
        ? saved
        : { name: "User", email: "guest" };
    } catch {
      return { name: "User", email: "guest" };
    }
  });

  const userId = (user.email || user.name || "guest").replace(/[^a-z0-9]/gi, "_");
  const cartKey = `artGalleryCart_${userId}`;
  const [cart, setCart] = useState(() => readCart(cartKey));

  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  }, [cart, cartKey]);

  const validCart = useMemo(
    () => cart.filter((item) => artworks.some((art) => String(art.id) === String(item.id))),
    [cart]
  );

  const subtotal = validCart.reduce((sum, item) => {
    const art = artworks.find((entry) => String(entry.id) === String(item.id));
    const quantity = Math.max(1, Number(item.qty) || 1);
    return sum + (art?.price || 0) * quantity;
  }, 0);

  const serviceFee = Math.round(subtotal * 0.02);
  const total = subtotal + serviceFee;
  const cartCount = validCart.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
  const displayName = user.name || user.fullName || "User";
  const initial = displayName.charAt(0).toUpperCase();

  function updateQuantity(id, change) {
    setCart((current) =>
      current.map((item) => String(item.id) === String(id)
        ? { ...item, qty: Math.max(1, (Number(item.qty) || 1) + change) }
        : item)
    );
  }

  function removeItem(id) {
    setCart((current) => current.filter((item) => String(item.id) !== String(id)));
  }

  function logout() {
    localStorage.removeItem("artGalleryCurrentUser");
    navigate("/");
  }

  return (
    <div className="cart-layout">
      <aside className="cart-side">
        <div className="cart-logo">ART GALLERY<small>ONLINE ART COLLECTION</small></div>

        <nav className="cart-nav">
          <button onClick={() => navigate("/user#home")}>⌂ Home</button>
          <button onClick={() => navigate("/user#gallery")}>▣ Explore Gallery</button>
          <button onClick={() => navigate("/user#favorites")}>★ Favorites</button>
          <button onClick={() => navigate("/user#artists")}>♙ Artists</button>
          <button onClick={() => navigate("/user#recent")}>◷ Recently Viewed</button>
          <button onClick={() => navigate("/user#profile")}>● My Profile</button>
          <button className="active" onClick={() => navigate("/cart")}>🛒 Cart <b className="cart-nav-count">{cartCount ? `(${cartCount})` : ""}</b></button>
          <button onClick={() => navigate("/orders")}>▤ My Orders</button>
        </nav>

        <div className="cart-bottom">
          <div className="cart-user">
            <div className="cart-avatar">{initial}</div>
            <div><b>{displayName}</b><small>User Account</small></div>
          </div>
          <button className="cart-logout" onClick={logout}>LOGOUT</button>
        </div>
      </aside>

      <main className="cart-main">
        <div className="cart-top">
          <div className="cart-crumb">USER DASHBOARD / <b>CART</b></div>
        </div>

        <h1>Your Cart</h1>
        <div className="cart-sub">Review your selected artwork before checkout.</div>

        <div className="cart-layout2">
          <section className="cart-box cart-items">
            {validCart.length === 0 ? (
              <div className="cart-empty">
                <h2>Your cart is empty</h2>
                <p>Find an artwork you love and add it to your collection.</p>
                <button onClick={() => navigate("/user#gallery")}>EXPLORE GALLERY →</button>
              </div>
            ) : (
              validCart.map((item) => {
                const art = artworks.find((entry) => String(entry.id) === String(item.id));
                const quantity = Math.max(1, Number(item.qty) || 1);
                return (
                  <div className="cart-row" key={art.id}>
                    <img className="cart-pic" src={art.image} alt={art.title} />
                    <div className="cart-product-info">
                      <b>{art.title}</b>
                      <div className="cart-artist">by {art.artist}</div>
                      <div className="cart-qty">
                        <button onClick={() => updateQuantity(art.id, -1)} aria-label={`Decrease ${art.title} quantity`}>−</button>
                        <span>{quantity}</span>
                        <button onClick={() => updateQuantity(art.id, 1)} aria-label={`Increase ${art.title} quantity`}>+</button>
                      </div>
                    </div>
                    <div className="cart-end">
                      <div className="cart-price">{money(art.price * quantity)}</div>
                      <button className="cart-remove" onClick={() => removeItem(art.id)}>Remove</button>
                    </div>
                  </div>
                );
              })
            )}
          </section>

          <aside className="cart-box cart-summary">
            <h2>Order Summary</h2>
            <div className="cart-summary-line"><span>Items</span><b>{cartCount}</b></div>
            <div className="cart-summary-line"><span>Subtotal</span><b>{money(subtotal)}</b></div>
            <div className="cart-summary-line"><span>Gallery service (2%)</span><b>{money(serviceFee)}</b></div>
            <div className="cart-summary-line cart-total"><span>Total</span><b>{money(total)}</b></div>
            <button
              className="cart-checkout"
              disabled={validCart.length === 0}
              onClick={() => navigate("/orders?checkout=1")}
            >
              PROCEED TO CHECKOUT
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}
