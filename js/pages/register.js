/* =====================================================================
   register.js  —  CREATE ACCOUNT  (replaces pages/Register.jsx)
   Email verification was removed (it needed an email server), so the
   account is created and logged in straight away.
   ===================================================================== */
(function () {
  const el = id => document.getElementById(id);

  if (Auth.isLoggedIn()) { location.replace('dashboard.html'); return; }

  const errorBox = el('register-error');

  el('register-form').addEventListener('submit', e => {
    e.preventDefault();
    errorBox.hidden = true;

    if (el('password').value !== el('confirm').value) {
      errorBox.textContent = 'Passwords do not match.';
      errorBox.hidden = false;
      return;
    }

    try {
      Auth.register({
        name: el('name').value,
        email: el('email').value,
        password: el('password').value,
        address: {
          street: el('street').value.trim(),
          city: el('city').value.trim(),
          phone: el('phone').value.trim()
        }
      });
      location.href = Auth.safeRedirect(UI.param('redirect')) || 'dashboard.html';
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.hidden = false;
    }
  });
})();
