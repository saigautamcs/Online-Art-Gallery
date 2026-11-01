import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Orders.css";

const artworkList = [
  { id: 1, title: "Golden Silence", artist: "Aria Bennett", price: 18500, image: "https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=700&q=80" },
  { id: 2, title: "Midnight Geometry", artist: "Noah Williams", price: 24000, image: "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=700&q=80" },
  { id: 3, title: "Quiet Morning", artist: "Maya Chen", price: 16200, image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=700&q=80" },
  { id: 4, title: "Fragments of Light", artist: "Ethan Cole", price: 29500, image: "https://images.unsplash.com/photo-1577083288073-40892c0860a4?auto=format&fit=crop&w=700&q=80" },
  { id: 5, title: "Velvet Horizon", artist: "Aria Bennett", price: 21800, image: "https://images.unsplash.com/photo-1578301978018-3005759f48f7?auto=format&fit=crop&w=700&q=80" },
  { id: 6, title: "Urban Echo", artist: "Maya Chen", price: 13200, image: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=700&q=80" }
];

const readArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const money = (amount) => "₹" + Number(amount || 0).toLocaleString("en-IN");

export default function Orders() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("artGalleryCurrentUser") || "null");
      return saved && typeof saved === "object" ? saved : { name: "User", email: "guest" };
    } catch {
      return { name: "User", email: "guest" };
    }
  });

  const userId = (user.email || user.name || "guest").replace(/[^a-z0-9]/gi, "_");
  const cartKey = `artGalleryCart_${userId}`;
  const ordersKey = `artGalleryOrders_${userId}`;

  const [cart, setCart] = useState(() => readArray(cartKey));
  const [orders, setOrders] = useState(() => readArray(ordersKey));
  const [payment, setPayment] = useState("UPI");
  const [fullName, setFullName] = useState(user.name || user.fullName || "");
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");

  const isCheckout = new URLSearchParams(location.search).get("checkout") === "1";

  const items = useMemo(() => cart.map((item) => {
    const art = artworkList.find((entry) => String(entry.id) === String(item.id));
    return art ? { ...art, qty: Math.max(1, Number(item.qty) || 1) } : null;
  }).filter(Boolean), [cart]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const serviceFee = Math.round(subtotal * 0.02);
  const total = subtotal + serviceFee;

  function placeOrder(event) {
    event.preventDefault();
    if (!items.length) {
      setMessage("Your cart is empty. Add artwork before placing an order.");
      return;
    }

    const order = {
      id: `AG${Date.now().toString().slice(-8)}`,
      date: new Date().toLocaleString("en-IN"),
      items: items.map(({ id, title, artist, price, qty, image }) => ({ id, title, artist, price, qty, image })),
      subtotal,
      serviceFee,
      total,
      payment,
      customer: { fullName, email, phone, address, city },
      status: "Order Placed"
    };

    const updated = [order, ...orders];
    localStorage.setItem(ordersKey, JSON.stringify(updated));
    localStorage.setItem(cartKey, JSON.stringify([]));
    setOrders(updated);
    setCart([]);
    setMessage(`Your order ${order.id} has been placed successfully!`);
    window.history.replaceState({}, "", "/orders");
  }

  function logout() {
    localStorage.removeItem("artGalleryCurrentUser");
    navigate("/");
  }

  const displayName = user.name || user.fullName || "User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="orders-layout">
      <aside className="orders-side">
        <div className="orders-logo">ART GALLERY<small>ONLINE ART COLLECTION</small></div>
        <nav className="orders-nav">
          <button onClick={() => navigate("/user#home")}>⌂ Home</button>
          <button onClick={() => navigate("/user#gallery")}>▣ Explore Gallery</button>
          <button onClick={() => navigate("/user#favorites")}>★ Favorites</button>
          <button onClick={() => navigate("/user#artists")}>♙ Artists</button>
          <button onClick={() => navigate("/user#recent")}>◷ Recently Viewed</button>
          <button onClick={() => navigate("/user#profile")}>● My Profile</button>
          <button onClick={() => navigate("/cart")}>🛒 Cart</button>
          <button className="active" onClick={() => navigate("/orders")}>▤ My Orders</button>
        </nav>
        <div className="orders-bottom">
          <div className="orders-user">
            <div className="orders-avatar">{initial}</div>
            <div><b>{displayName}</b><small>User Account</small></div>
          </div>
          <button className="orders-logout" onClick={logout}>LOGOUT</button>
        </div>
      </aside>

      <main className="orders-main">
        <div className="orders-crumb">USER DASHBOARD / <b>{isCheckout ? "CHECKOUT" : "MY ORDERS"}</b></div>
        {message && <div className="orders-message">{message}</div>}

        {isCheckout ? (
          <>
            <h1>Checkout</h1>
            <p className="orders-sub">Enter your details and review your order.</p>
            {items.length === 0 ? (
              <section className="orders-panel orders-empty">
                <h2>Your cart is empty</h2>
                <p>Add artwork to your cart before checkout.</p>
                <button className="orders-gold-btn" onClick={() => navigate("/user#gallery")}>EXPLORE GALLERY</button>
              </section>
            ) : (
              <div className="checkout-grid">
                <form className="orders-panel checkout-form" onSubmit={placeOrder}>
                  <h2>Customer Details</h2>
                  <label>Full Name<input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></label>
                  <label>Email Address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
                  <label>Phone Number<input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required /></label>
                  <label>Delivery Address<textarea value={address} onChange={(e) => setAddress(e.target.value)} rows="3" required /></label>
                  <label>City<input value={city} onChange={(e) => setCity(e.target.value)} required /></label>

                  <h2 className="payment-heading">Payment Method</h2>
                  <div className="payment-options">
                    {["UPI", "Credit / Debit Card", "Cash on Delivery"].map((method) => (
                      <label className="payment-option" key={method}>
                        <input type="radio" name="payment" value={method} checked={payment === method} onChange={(e) => setPayment(e.target.value)} />
                        {method}
                      </label>
                    ))}
                  </div>
                  <p className="orders-demo-note">Demo checkout only. No real payment will be collected.</p>
                  <button className="orders-gold-btn" type="submit">PLACE ORDER · {money(total)}</button>
                </form>

                <aside className="orders-panel checkout-summary">
                  <h2>Order Summary</h2>
                  {items.map((item) => (
                    <div className="checkout-item" key={item.id}>
                      <img src={item.image} alt={item.title} />
                      <div><b>{item.title}</b><small>Qty: {item.qty}</small></div>
                      <strong>{money(item.price * item.qty)}</strong>
                    </div>
                  ))}
                  <div className="orders-total-line"><span>Subtotal</span><b>{money(subtotal)}</b></div>
                  <div className="orders-total-line"><span>Gallery service (2%)</span><b>{money(serviceFee)}</b></div>
                  <div className="orders-total-line final"><span>Total</span><b>{money(total)}</b></div>
                </aside>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="orders-heading-row">
              <div><h1>My Orders</h1><p className="orders-sub">View your artwork purchases and order status.</p></div>
              <button className="orders-outline-btn" onClick={() => navigate("/cart")}>VIEW CART</button>
            </div>
            {orders.length === 0 ? (
              <section className="orders-panel orders-empty">
                <h2>No orders yet</h2>
                <p>Your placed orders will appear here.</p>
                <button className="orders-gold-btn" onClick={() => navigate("/user#gallery")}>EXPLORE GALLERY</button>
              </section>
            ) : (
              <div className="orders-history">
                {orders.map((order) => (
                  <section className="orders-panel order-card" key={order.id}>
                    <div className="order-card-top">
                      <div><small>ORDER ID</small><b>{order.id}</b></div>
                      <div><small>ORDER DATE</small><b>{order.date}</b></div>
                      <span className="order-status">{order.status}</span>
                    </div>
                    {order.items.map((item) => (
                      <div className="history-item" key={`${order.id}-${item.id}`}>
                        <img src={item.image} alt={item.title} />
                        <div><b>{item.title}</b><small>by {item.artist} · Qty {item.qty}</small></div>
                        <strong>{money(item.price * item.qty)}</strong>
                      </div>
                    ))}
                    <div className="order-card-bottom"><span>Paid by / Method: {order.payment}</span><b>Total: {money(order.total)}</b></div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
