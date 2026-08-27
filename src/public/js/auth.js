/* ==========================================================================
   Autobahn Admin — login / signup screen
   All handlers live here; the EJS template carries no inline JS.
   ========================================================================== */
(function () {
  "use strict";

  const card = document.getElementById("authCard");
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const tabLogin = document.getElementById("tabLoginBtn");
  const tabSignup = document.getElementById("tabSignupBtn");

  if (!loginForm || !signupForm) return;

  /* ---------- tab switching ---------- */

  function showAuth(which) {
    const isLogin = which === "login";
    loginForm.classList.toggle("auth-hidden", !isLogin);
    signupForm.classList.toggle("auth-hidden", isLogin);
    tabLogin.classList.toggle("active", isLogin);
    tabSignup.classList.toggle("active", !isLogin);
  }

  /** Pins the card open (it is otherwise only visible while hovering the stage). */
  function openAuth(which) {
    showAuth(which);
    if (card) card.classList.add("pinned");
    const firstInput = (which === "login" ? loginForm : signupForm).querySelector("input:not([type=file])");
    if (firstInput) firstInput.focus();
  }

  document.querySelectorAll("[data-auth-tab]").forEach((btn) => {
    btn.addEventListener("click", () => showAuth(btn.dataset.authTab));
  });

  document.querySelectorAll("[data-auth-open]").forEach((btn) => {
    btn.addEventListener("mouseenter", () => showAuth(btn.dataset.authOpen));
    btn.addEventListener("click", () => openAuth(btn.dataset.authOpen));
  });

  /* ---------- signup: image preview ---------- */

  const fileInput = signupForm.querySelector(".upload-input");
  const VALID_TYPES = ["image/jpg", "image/jpeg", "image/png"];

  if (fileInput) {
    fileInput.addEventListener("change", function () {
      const file = this.files && this.files[0];
      if (!file) return;

      if (!VALID_TYPES.includes(file.type)) {
        alert("Please insert only jpeg, jpg and png!");
        this.value = "";
        return;
      }

      const frame = signupForm.querySelector(".upload-img-frame");
      const placeholder = signupForm.querySelector(".upload-placeholder");
      const preview = signupForm.querySelector(".upload-preview");

      frame.src = URL.createObjectURL(file);
      frame.classList.add("success");
      if (placeholder) placeholder.style.display = "none";
      if (preview) preview.classList.add("has-img");

      const btnText = signupForm.querySelector(".upload-btn-text");
      if (btnText) btnText.textContent = "Change photo";

      const nameField = signupForm.querySelector(".upload-name");
      if (nameField) nameField.value = file.name;
    });
  }

  /* ---------- validation ---------- */
  // The forms submit natively (the server redirects on success), so a failed
  // check must call preventDefault — returning false from an inline handler
  // was the old approach and silently blocked every valid submit too.

  loginForm.addEventListener("submit", function (e) {
    const nick = loginForm.querySelector("[name=memberNick]").value.trim();
    const password = loginForm.querySelector("[name=memberPassword]").value;

    if (!nick || !password) {
      e.preventDefault();
      alert("Please insert all required inputs");
    }
  });

  signupForm.addEventListener("submit", function (e) {
    const nick = signupForm.querySelector("[name=memberNick]").value.trim();
    const phone = signupForm.querySelector("[name=memberPhone]").value.trim();
    const password = signupForm.querySelector("[name=memberPassword]").value;

    if (!nick || !phone || !password) {
      e.preventDefault();
      alert("Please insert all required inputs");
      return;
    }

    const hasImage = fileInput && fileInput.files && fileInput.files.length > 0;
    if (!hasImage) {
      e.preventDefault();
      alert("Please insert Admin image");
    }
  });
})();
