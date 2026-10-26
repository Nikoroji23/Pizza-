/* =====================================================================
   login.js  —  CUSTOMER LOGIN  (replaces pages/Login.jsx)
   ===================================================================== */
(function () {
  const el = id => document.getElementById(id);
  const target = Auth.safeRedirect(UI.param('redirect'));

  // Already logged in? Skip the form.
  if (Auth.isLoggedIn()) {
    location.replace(target || (Auth.isAdmin() ? 'admin-dashboard.html' : 'dashboard.html'));
    return;
  }

  const form = el('login-form');
  const errorBox = el('login-error');

  form.addEventListener('submit', e => {
    e.preventDefault();
    errorBox.hidden = true;
    try {
      const user = Auth.login(el('email').value, el('password').value);
      location.href = target || (user.role === 'admin' ? 'admin-dashboard.html' : 'dashboard.html');
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.hidden = false;
    }
  });

  // "Use demo account" helper so you don't have to type
  el('fill-demo').addEventListener('click', () => {
    el('email').value = 'user@anticrust.com';
    el('password').value = 'User@12345';
  });
})();
