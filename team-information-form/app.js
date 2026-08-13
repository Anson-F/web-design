const receiverEmail = String(window.FORM_RECEIVER_EMAIL || "").trim();
const form = document.querySelector("#participant-form");
const peopleFields = document.querySelector("#people-fields");
const template = document.querySelector("#person-template");
const alertBox = document.querySelector("#form-alert");
const submitButton = document.querySelector("#submit-button");

const fieldMessages = {
  first_name: "Enter a first name.",
  last_name: "Enter a last name.",
  university_email: "Enter a valid university email ending in .edu.",
  phone: "Enter a valid phone number.",
  university: "Enter the university name.",
  academic_level: "Select an academic level.",
  linkedin: "Enter a valid LinkedIn profile URL.",
  survey_consent: "Select one option."
};

const fragment = template.content.cloneNode(true);

fragment.querySelectorAll("[data-field]").forEach((control) => {
  const fieldName = control.dataset.field;
  control.name = fieldName;
  control.id = fieldName;
});

fragment.querySelectorAll("[data-for]").forEach((label) => {
  label.htmlFor = label.dataset.for;
});

fragment.querySelectorAll("[data-error-for]").forEach((error) => {
  const fieldName = error.dataset.errorFor;
  error.id = `${fieldName}_error`;
  fragment.querySelectorAll(`[name="${fieldName}"]`).forEach((control) => {
    control.setAttribute("aria-describedby", error.id);
  });
});

peopleFields.appendChild(fragment);

const cards = [...document.querySelectorAll(".person-card")];

function isFieldValid(control) {
  const value = control.value.trim();

  if (control.type === "radio") {
    return Boolean(form.querySelector(`[name="${control.name}"]:checked`));
  }

  if (!value) return false;

  if (control.dataset.field === "university_email") {
    return /^[^\s@]+@[^\s@]+\.edu$/i.test(value);
  }

  if (control.dataset.field === "phone") {
    return value.replace(/\D/g, "").length >= 7;
  }

  if (control.dataset.field === "linkedin") {
    try {
      const url = new URL(value);
      return /^https?:$/.test(url.protocol) && /(^|\.)linkedin\.com$/i.test(url.hostname);
    } catch {
      return false;
    }
  }

  return control.checkValidity();
}

function setFieldValidity(control, showError) {
  const valid = isFieldValid(control);
  const fieldName = control.dataset.field;
  const card = control.closest(".person-card");
  const error = card.querySelector(`[data-error-for="${fieldName}"]`);
  const matchingControls = card.querySelectorAll(`[name="${control.name}"]`);

  matchingControls.forEach((item) => {
    item.setAttribute("aria-invalid", String(showError && !valid));
  });

  if (error) {
    error.textContent = showError && !valid ? fieldMessages[fieldName] : "";
  }

  return valid;
}

function getUniqueControls(card) {
  const seenNames = new Set();
  return [...card.querySelectorAll("[data-field]")].filter((control) => {
    if (seenNames.has(control.name)) return false;
    seenNames.add(control.name);
    return true;
  });
}

function updateCompletionStatus() {
  cards.forEach((card) => {
    const complete = getUniqueControls(card).every(isFieldValid);
    card.classList.toggle("is-complete", complete);
    card.querySelector("[data-person-status]").textContent = complete ? "Complete" : "Incomplete";
  });
}

function showAlert(message, type = "error") {
  alertBox.textContent = message;
  alertBox.classList.toggle("success", type === "success");
  alertBox.hidden = false;
  alertBox.focus();
}

function hideAlert() {
  alertBox.hidden = true;
  alertBox.textContent = "";
  alertBox.classList.remove("success");
}

form.addEventListener("input", (event) => {
  if (event.target.matches("[data-field]")) {
    if (!alertBox.hidden && !alertBox.classList.contains("success")) hideAlert();
    setFieldValidity(event.target, false);
    updateCompletionStatus();
  }
});

form.addEventListener("change", (event) => {
  if (event.target.matches("[data-field]")) {
    if (!alertBox.hidden && !alertBox.classList.contains("success")) hideAlert();
    setFieldValidity(event.target, false);
    updateCompletionStatus();
  }
});

form.addEventListener("focusout", (event) => {
  if (event.target.matches("[data-field]")) {
    setFieldValidity(event.target, true);
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideAlert();

  const controls = cards.flatMap(getUniqueControls);
  const invalidControls = controls.filter((control) => !setFieldValidity(control, true));

  if (invalidControls.length > 0) {
    showAlert(`Please complete ${invalidControls.length} required field${invalidControls.length === 1 ? "" : "s"} before submitting.`);
    invalidControls[0].focus();
    return;
  }

  if (!receiverEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiverEmail)) {
    showAlert("The form is ready, but the organizer has not connected a receiving email yet.");
    return;
  }

  submitButton.disabled = true;
  submitButton.classList.add("is-loading");

  const payload = Object.fromEntries(new FormData(form));
  payload._subject = `Participant information submission — ${payload.first_name} ${payload.last_name}`;
  payload._template = "table";
  payload._captcha = "false";

  try {
    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(receiverEmail)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success === false) {
      throw new Error("Submission service returned an error.");
    }

    form.reset();
    controls.forEach((control) => control.removeAttribute("aria-invalid"));
    updateCompletionStatus();
    showAlert("Thank you. Your information was submitted successfully.", "success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    showAlert("We could not submit the form. Check your connection and try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.classList.remove("is-loading");
  }
});

updateCompletionStatus();
