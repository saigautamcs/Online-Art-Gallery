
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../Login.css";

const USERS_KEY = "artGalleryUsers";
const CURRENT_USER_KEY = "artGalleryCurrentUser";

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function checkPassword(password, confirm) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: password.length > 0 && password === confirm,
  };
}

// Password input is outside Login to prevent losing focus.
function PasswordInput({
  field,
  value,
  onChange,
  placeholder,
  showPassword,
  togglePassword,
}) {
  return (
    <div className="password-wrapper">
      <input
        type={showPassword[field] ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
      />

      <button
        type="button"
        className="eye-btn"
        onClick={() => togglePassword(field)}
      >
        {showPassword[field] ? "🙈" : "👁"}
      </button>
    </div>
  );
}

// Password rules are also outside Login.
function PasswordRules({ password, confirm }) {
  const rules = checkPassword(password, confirm);
  const passed = Object.values(rules).filter(Boolean).length;

  return (
    <div className="password-help">
      <div className="password-help-title">
        Password must contain:
      </div>

      <ul className="password-requirements">
        {[
          ["length", "At least 8 characters"],
          ["uppercase", "One uppercase letter"],
          ["lowercase", "One lowercase letter"],
          ["number", "One number"],
          ["special", "One special character"],
          ["match", "Passwords match"],
        ].map(([key, label]) => (
          <li key={key} className={rules[key] ? "valid" : ""}>
            {label}
          </li>
        ))}
      </ul>

      <div
        className={`password-strength ${
          password
            ? passed <= 2
              ? "weak"
              : passed <= 4
                ? "medium"
                : "strong"
            : ""
        }`}
      >
        {password
          ? `Password strength: ${
              passed <= 2
                ? "Weak"
                : passed <= 4
                  ? "Medium"
                  : "Strong"
            }`
          : ""}
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();

  const [page, setPage] = useState("login");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("User");
  const [resetEmail, setResetEmail] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState({});
  const [remember, setRemember] = useState(false);

  const requirements = checkPassword(password, confirm);
  const passwordValid = Object.values(requirements).every(Boolean);

  function showMessage(text, type = "error") {
    setMessage(text);
    setMessageType(type);
  }

  function changePage(nextPage) {
    setPage(nextPage);
    setMessage("");
    setMessageType("");
  }

  function togglePassword(field) {
    setShowPassword((old) => ({
      ...old,
      [field]: !old[field],
    }));
  }

  function loginUser(user) {
    const updatedUser = {
      ...user,
      role:
        user.role?.toLowerCase() === "merchant"
          ? "Artist"
          : user.role,
    };

    localStorage.setItem(
      CURRENT_USER_KEY,
      JSON.stringify(updatedUser)
    );

    setCurrentUser(updatedUser);
    changePage("welcome");
  }

  function handleRegister(event) {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const users = getUsers();

    if (cleanName.length < 4) {
      showMessage("Name must contain at least 4 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showMessage("Please enter a valid email address.");
      return;
    }

    if (!passwordValid) {
      showMessage("Please meet every password requirement.");
      return;
    }

    if (
      users.some(
        (u) =>
          u.email?.toLowerCase() === cleanEmail &&
          u.role?.toLowerCase() === role.toLowerCase()
      )
    ) {
      showMessage(
        `You already have a ${role} account with this email.`
      );
      return;
    }

    if (
      role === "Admin" &&
      users.filter((u) => u.role?.toLowerCase() === "admin")
        .length >= 3
    ) {
      showMessage(
        "Admin account limit reached. Maximum 3 Admin accounts are allowed."
      );
      return;
    }

    users.push({
      id: Date.now().toString(),
      name: cleanName,
      email: cleanEmail,
      password,
      role,
      createdAt: new Date().toISOString(),
    });

    saveUsers(users);

    setEmail(cleanEmail);
    setPassword("");
    setConfirm("");
    setName("");
    setRole("User");

    changePage("login");
    showMessage("Account created successfully!", "success");
  }

  function handleLogin(event) {
    event.preventDefault();

    const users = getUsers();

    const matching = users.filter(
      (u) =>
        u.email?.toLowerCase() === email.trim().toLowerCase()
    );

    if (matching.length === 0) {
      showMessage("No account found with this email.");
      return;
    }

    const valid = matching.filter(
      (u) => u.password === password
    );

    if (valid.length === 0) {
      showMessage("Incorrect email or password.");
      return;
    }

    if (valid.length === 1) {
      loginUser(valid[0]);
      return;
    }

    setAccounts(valid);
    changePage("roles");
  }

  function handleForgot(event) {
    event.preventDefault();

    const cleanEmail = resetEmail.trim().toLowerCase();

    const account = getUsers().find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (!account) {
      showMessage("No account found with this email.");
      return;
    }

    changePage("newPassword");
  }

  function handleReset(event) {
    event.preventDefault();

    if (!passwordValid) {
      showMessage("Please meet every password requirement.");
      return;
    }

    const users = getUsers();
    let found = false;

    users.forEach((user) => {
      if (
        user.email?.toLowerCase() ===
        resetEmail.trim().toLowerCase()
      ) {
        user.password = password;
        found = true;
      }
    });

    if (!found) {
      showMessage("Account not found.");
      return;
    }

    saveUsers(users);

    setEmail(resetEmail);
    setPassword("");
    setConfirm("");

    changePage("login");
    showMessage("Password reset successfully!", "success");
  }

  function goToDashboard() {
    if (!currentUser) return;

    const paths = {
      user: "/user",
      artist: "/artist",
      merchant: "/artist",
      admin: "/admin",
    };

    const path = paths[currentUser.role?.toLowerCase()];

    if (path) {
      navigate(path);
    } else {
      showMessage("Invalid account role.");
    }
  }

  function logout() {
    if (!window.confirm("Are you sure you want to log out?")) {
      return;
    }

    localStorage.removeItem(CURRENT_USER_KEY);
    setCurrentUser(null);
    setEmail("");
    setPassword("");

    changePage("login");
  }

  return (
    <div className="container">
      <div className="art-section">
        <div className="logo">ART GALLERY</div>

        <h1>
          Discover <span>Art.</span>
        </h1>

        <div className="line"></div>

        <p>
          Explore beautiful paintings, discover talented artists,
          shop unique artwork and participate in exciting auctions.
        </p>

        <div className="art-symbol">🎨 🖼️</div>
      </div>

      <div className="login-section">

        {page === "login" && (
          <div className="page">
            <h2>Welcome Back</h2>
            <p className="subtitle">
              Sign in to continue exploring.
            </p>

            <form onSubmit={handleLogin}>
              <div className="input-box">
                <label>Email Address</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="input-box">
                <label>Password</label>

                <PasswordInput
                  field="login"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  showPassword={showPassword}
                  togglePassword={togglePassword}
                />
              </div>

              <div className="options">
                <label>
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) =>
                      setRemember(e.target.checked)
                    }
                  />
                  Remember me
                </label>

                <a
                  onClick={() => {
                    setResetEmail(email);
                    changePage("forgot");
                  }}
                >
                  Forgot Password?
                </a>
              </div>

              <button className="login-btn" type="submit">
                LOGIN
              </button>
            </form>

            <div className={`message ${messageType}`}>
              {message}
            </div>

            <p className="register">
              Don't have an account?{" "}
              <a
                onClick={() => {
                  setPassword("");
                  setConfirm("");
                  changePage("register");
                }}
              >
                Create Account
              </a>
            </p>
          </div>
        )}

        {page === "register" && (
          <div className="page">
            <h2>Create Account</h2>

            <p className="subtitle">
              Choose the account that fits you.
            </p>

            <form onSubmit={handleRegister}>
              <div className="input-box">
                <label>Full Name</label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  minLength="4"
                  required
                />
              </div>

              <div className="input-box">
                <label>Email Address</label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="input-box">
                <label>Password</label>

                <PasswordInput
                  field="register"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  showPassword={showPassword}
                  togglePassword={togglePassword}
                />

                <PasswordRules
                  password={password}
                  confirm={confirm}
                />
              </div>

              <div className="input-box">
                <label>Confirm Password</label>

                <PasswordInput
                  field="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm your password"
                  showPassword={showPassword}
                  togglePassword={togglePassword}
                />
              </div>

              <div className="role-title">
                Choose Your Account Type
              </div>

              <div className="roles">
                {[
                  ["User", "👤", "Explore and discover artwork"],
                  ["Artist", "🎨", "Showcase and sell artwork"],
                  ["Admin", "⚙️", "Manage the gallery"],
                ].map(([value, icon, description]) => (
                  <div className="role" key={value}>
                    <input
                      type="radio"
                      name="role"
                      id={`${value}Role`}
                      value={value}
                      checked={role === value}
                      onChange={() => setRole(value)}
                    />

                    <label htmlFor={`${value}Role`}>
                      <div className="role-icon">{icon}</div>

                      <div>
                        <div className="role-name">
                          {value.toUpperCase()}
                        </div>

                        <div className="role-description">
                          {description}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <button
                className="login-btn"
                type="submit"
                disabled={!passwordValid}
              >
                CREATE ACCOUNT
              </button>
            </form>

            <div className={`message ${messageType}`}>
              {message}
            </div>

            <p className="register">
              Already have an account?{" "}
              <a onClick={() => changePage("login")}>
                Login
              </a>
            </p>
          </div>
        )}

        {page === "forgot" && (
          <div className="page">
            <h2>Reset Password</h2>

            <p className="subtitle">
              Enter your registered email.
            </p>

            <form onSubmit={handleForgot}>
              <div className="input-box">
                <label>Email Address</label>

                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  required
                />
              </div>

              <button className="login-btn" type="submit">
                VERIFY EMAIL
              </button>
            </form>

            <div className={`message ${messageType}`}>
              {message}
            </div>

            <p
              className="back"
              onClick={() => changePage("login")}
            >
              ← Back to Login
            </p>
          </div>
        )}

        {page === "newPassword" && (
          <div className="page">
            <h2>Create New Password</h2>

            <p className="subtitle">
              Enter your new password.
            </p>

            <form onSubmit={handleReset}>
              <div className="input-box">
                <label>New Password</label>

                <PasswordInput
                  field="new"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  showPassword={showPassword}
                  togglePassword={togglePassword}
                />

                <PasswordRules
                  password={password}
                  confirm={confirm}
                />
              </div>

              <div className="input-box">
                <label>Confirm New Password</label>

                <PasswordInput
                  field="confirmNew"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Confirm your password"
                  showPassword={showPassword}
                  togglePassword={togglePassword}
                />
              </div>

              <button
                className="login-btn"
                type="submit"
                disabled={!passwordValid}
              >
                RESET PASSWORD
              </button>
            </form>

            <div className={`message ${messageType}`}>
              {message}
            </div>
          </div>
        )}

        {page === "roles" && (
          <div className="page">
            <h2>Choose Account</h2>

            <p className="subtitle">
              Multiple accounts were found. Choose which account
              you want to use.
            </p>

            <div>
              {accounts.map((account) => (
                <button
                  key={account.id}
                  className="account-role-btn"
                  onClick={() => loginUser(account)}
                >
                  {account.role === "User"
                    ? "👤 User Account"
                    : account.role === "Artist" ||
                        account.role === "Merchant"
                      ? "🎨 Artist Account"
                      : "⚙️ Admin Account"}
                </button>
              ))}
            </div>

            <p
              className="back"
              onClick={() => changePage("login")}
            >
              ← Back to Login
            </p>
          </div>
        )}

        {page === "welcome" && currentUser && (
          <div className="page welcome-page">
            <div className="welcome-icon">
              {currentUser.role === "User"
                ? "👤"
                : currentUser.role === "Artist"
                  ? "🎨"
                  : "⚙️"}
            </div>

            <h2>
              Welcome,{" "}
              <span className="welcome-name">
                {currentUser.name}
              </span>
            </h2>

            <div className="account-card">
              <div className="account-label">
                ACCOUNT TYPE
              </div>

              <div className="account-role">
                {currentUser.role}
              </div>
            </div>

            <p className="account-description">
              {currentUser.role === "User"
                ? "You are logged in as a User. Explore artworks, discover artists and participate in auctions."
                : currentUser.role === "Artist"
                  ? "You are logged in as an Artist. Upload artwork, manage your gallery and track your sales."
                  : "You are logged in as an Admin. Manage users, artists, artworks and the Art Gallery platform."}
            </p>

            <button
              className="dashboard-btn"
              onClick={goToDashboard}
            >
              GO TO DASHBOARD →
            </button>

            <div className="logout-link" onClick={logout}>
              Logout
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Login;
