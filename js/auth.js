/* =====================================================================
   auth.js  —  AUTHENTICATION
   ---------------------------------------------------------------------
   Replaces: authController.js, JWT tokens, bcrypt, AuthContext.jsx,
             ProtectedRoute.jsx.

   How it works now:
   - Users live in localStorage (via Store).
   - "Logged in" just means we saved the user's id under acp_session.
   - Page guards (requireLogin / requireAdmin) redirect if not allowed.

   ⚠ This is a DEMO. Anyone can open DevTools and read or change
   localStorage, so this is NOT real security. Real authentication
   always needs a server.
   ===================================================================== */

const Auth = (() => {

  /** The logged-in user object, or null */
  function currentUser() {
    const session = Store.read(Store.KEYS.session, null);
    if (!session) return null;
    return Store.getUsers().find(u => u.id === session.userId) || null;
  }

  const isLoggedIn = () => currentUser() !== null;
  const isAdmin = () => { const u = currentUser(); return !!u && u.role === 'admin'; };

  function startSession(user) {
    Store.write(Store.KEYS.session, { userId: user.id, loggedInAt: new Date().toISOString() });
  }

  function logout() {
    localStorage.removeItem(Store.KEYS.session);
    window.dispatchEvent(new CustomEvent('acp:change'));
  }

  /** Customer login. Returns the user or throws an Error. */
  function login(email, password) {
    const user = findByCredentials(email, password);
    if (!user) throw new Error('Invalid email or password.');
    startSession(user);
    return user;
  }

  /** Admin login — same check, but must have the admin role. */
  function adminLogin(email, password) {
    const user = findByCredentials(email, password);
    if (!user) throw new Error('Invalid admin credentials.');
    if (user.role !== 'admin') {
      throw new Error('Access Denied: This portal is strictly for Anti-Crust Pizza Administrators.');
    }
    startSession(user);
    return user;
  }

  function findByCredentials(email, password) {
    const cleanEmail = String(email).trim().toLowerCase();
    return Store.getUsers().find(u => u.email === cleanEmail && u.password === password) || null;
  }

  /** Create a customer account and log them in. */
  function register({ name, email, password, address }) {
    name = String(name || '').trim();
    email = String(email || '').trim().toLowerCase();

    if (!name || !email || !password) throw new Error('Please provide name, email, and password.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Please provide a valid email.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    const users = Store.getUsers();
    if (users.some(u => u.email === email)) throw new Error('An account with this email already exists.');

    const user = {
      id: Store.uid('user'),
      name,
      email,
      password,
      role: 'user',   // public sign-up can only ever create customers
      address: { street: '', city: '', state: '', zipCode: '', phone: '', ...(address || {}) }
    };
    users.push(user);
    Store.saveUsers(users);
    startSession(user);
    return user;
  }

  /** Save name + default delivery address from the dashboard */
  function updateProfile({ name, address }) {
    const users = Store.getUsers();
    const user = users.find(u => u.id === currentUser().id);
    user.name = name;
    user.address = { ...user.address, ...address };
    Store.saveUsers(users);
    return user;
  }

  /** Forgot-password step 1: does this email exist? */
  const emailExists = email =>
    Store.getUsers().some(u => u.email === String(email).trim().toLowerCase());

  /** Forgot-password step 2: set the new password */
  function resetPassword(email, newPassword) {
    if (newPassword.length < 6) throw new Error('Password must be at least 6 characters long.');
    const users = Store.getUsers();
    const user = users.find(u => u.email === String(email).trim().toLowerCase());
    if (!user) throw new Error('No account found with this email address.');
    user.password = newPassword;
    Store.saveUsers(users);
  }

  /* ---------- page guards (replace <ProtectedRoute>) ---------- */

  /** Only allow redirects to a plain page name on this site (e.g. "checkout.html") */
  function safeRedirect(target) {
    return /^[a-z0-9\-]+\.html(\?[\w=&\-%.]*)?$/i.test(target || '') ? target : null;
  }

  /** Call at the top of a page script. Returns true if the visitor may stay. */
  function requireLogin() {
    if (isLoggedIn()) return true;
    const here = location.pathname.split('/').pop() + location.search;
    location.replace('login.html?redirect=' + encodeURIComponent(here));
    return false;
  }

  function requireAdmin() {
    if (!isLoggedIn()) {
      const here = location.pathname.split('/').pop() + location.search;
      location.replace('admin-login.html?redirect=' + encodeURIComponent(here));
      return false;
    }
    if (!isAdmin()) {
      location.replace('index.html');
      return false;
    }
    return true;
  }

  return {
    currentUser, isLoggedIn, isAdmin,
    login, adminLogin, register, logout, updateProfile,
    emailExists, resetPassword,
    safeRedirect, requireLogin, requireAdmin
  };
})();
