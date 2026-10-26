/* =====================================================================
   forgot-password.js  —  PASSWORD RESET
   (replaces pages/ForgotPassword.jsx + ResetPassword.jsx)
   The real app emailed a reset link. With no email server we do both
   steps on one page:  1) enter email   2) choose a new password.
   ===================================================================== */
(function () {
  const el = id => document.getElementById(id);
  let emailToReset = '';

  const stepEmail = el('step-email');
  const stepReset = el('step-reset');
  const stepDone = el('step-done');

  /* step 1 */
  el('email-form').addEventListener('submit', e => {
    e.preventDefault();
    const err = el('email-error');
    err.hidden = true;

    const email = el('fp-email').value;
    if (!Auth.emailExists(email)) {
      err.textContent = 'No account found with this email address.';
      err.hidden = false;
      return;
    }
    emailToReset = email;
    el('reset-for').textContent = email.trim().toLowerCase();
    stepEmail.hidden = true;
    stepReset.hidden = false;
  });

  /* step 2 */
  el('reset-form').addEventListener('submit', e => {
    e.preventDefault();
    const err = el('reset-error');
    err.hidden = true;

    if (el('new-password').value !== el('new-confirm').value) {
      err.textContent = 'Passwords do not match.';
      err.hidden = false;
      return;
    }
    try {
      Auth.resetPassword(emailToReset, el('new-password').value);
      stepReset.hidden = true;
      stepDone.hidden = false;
    } catch (ex) {
      err.textContent = ex.message;
      err.hidden = false;
    }
  });
})();
