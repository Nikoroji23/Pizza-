/* =====================================================================
   admin-login.js  —  STAFF LOGIN  (replaces pages/AdminLogin.jsx)
   Same as the customer login, but the account must have role "admin".
   ===================================================================== */
(function () {
  const el = id => document.getElementById(id);
  const target = Auth.safeRedirect(UI.param('redirect'));

  if (Auth.isAdmin()) { location.replace(target || 'admin-dashboard.html'); return; }

  const errorBox = el('admin-error');

  el('admin-form').addEventListener('submit', e => {
    e.preventDefault();
    errorBox.hidden = true;
    try {
      Auth.adminLogin(el('email').value, el('password').value);
      location.href = target || 'admin-dashboard.html';
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.hidden = false;
    }
  });

  el('fill-admin').addEventListener('click', () => {
    el('email').value = 'admin@anticrust.com';
    el('password').value = 'Admin@12345';
  });
})();
