(function () {
  "use strict";

  var FORM_ENDPOINT = "";

  var yearEls = document.querySelectorAll("[data-year]");
  Array.prototype.forEach.call(yearEls, function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  var header = document.querySelector(".site-header");
  if (header) {
    var updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
  }

  var navToggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (navToggle && nav) {
    var closeNav = function () {
      nav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    };

    navToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        closeNav();
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeNav();
      }
    });

    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target) && !navToggle.contains(event.target)) {
        closeNav();
      }
    });
  }

  var revealEls = document.querySelectorAll("[data-reveal]");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!prefersReduced && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    Array.prototype.forEach.call(revealEls, function (el) {
      observer.observe(el);
    });
  } else {
    Array.prototype.forEach.call(revealEls, function (el) {
      el.classList.add("is-visible");
    });
  }

  var form = document.getElementById("contact-form");
  if (!form) {
    return;
  }

  var status = document.getElementById("form-status");
  var submitBtn = form.querySelector('button[type="submit"]');
  var honeypot = document.getElementById("field-company");
  var startedInput = document.getElementById("field-started");
  var mathInput = document.getElementById("field-math");
  var mathQuestion = document.getElementById("math-question");
  var mathAnswer = 0;

  var mathA = 2 + Math.floor(Math.random() * 8);
  var mathB = 2 + Math.floor(Math.random() * 8);
  mathAnswer = mathA + mathB;
  if (mathQuestion) {
    mathQuestion.textContent = mathA + " plus " + mathB;
  }

  var loadedAt = Date.now();
  if (startedInput) {
    startedInput.value = String(loadedAt);
  }

  var fields = {
    name: {
      el: form.elements.namedItem("name"),
      error: document.getElementById("error-name"),
      validate: function (value) {
        if (value.trim().length < 2) {
          return "Please enter your name.";
        }
        return "";
      }
    },
    email: {
      el: form.elements.namedItem("email"),
      error: document.getElementById("error-email"),
      validate: function (value) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
          return "Please enter a valid email address.";
        }
        return "";
      }
    },
    message: {
      el: form.elements.namedItem("message"),
      error: document.getElementById("error-message"),
      validate: function (value) {
        if (value.trim().length < 10) {
          return "Please add a little more detail, at least 10 characters.";
        }
        return "";
      }
    },
    consent: {
      el: form.elements.namedItem("consent"),
      error: document.getElementById("error-consent"),
      validate: function (value, el) {
        if (el && !el.checked) {
          return "Please confirm you are happy for us to reply to your enquiry.";
        }
        return "";
      }
    },
    math: {
      el: mathInput,
      error: document.getElementById("error-math"),
      validate: function (value) {
        if (parseInt(value, 10) !== mathAnswer) {
          return "That is not quite right. Please try again.";
        }
        return "";
      }
    }
  };

  var setFieldError = function (field, message) {
    if (!field.el) {
      return;
    }
    if (message) {
      field.el.setAttribute("aria-invalid", "true");
    } else {
      field.el.removeAttribute("aria-invalid");
    }
    if (field.error) {
      field.error.textContent = message || "";
    }
  };

  var setStatus = function (message, type) {
    if (!status) {
      return;
    }
    status.textContent = message;
    status.classList.remove("form-status--ok", "form-status--error");
    if (type) {
      status.classList.add("form-status--" + type);
    }
  };

  Object.keys(fields).forEach(function (key) {
    var field = fields[key];
    if (!field.el) {
      return;
    }
    var eventName = field.el.type === "checkbox" ? "change" : "input";
    field.el.addEventListener(eventName, function () {
      if (field.el.getAttribute("aria-invalid") === "true") {
        setFieldError(field, field.validate(field.el.value, field.el));
      }
    });
  });

  var showSuccess = function (name) {
    form.reset();
    setStatus(
      "Thanks, " + name + ". Your message has been sent. We will reply as soon as we can.",
      "ok"
    );
  };

  var showPreviewSuccess = function (name) {
    form.reset();
    setStatus(
      "Thanks, " + name + ". Everything looks good and the form is working. " +
        "(Preview mode: no message was sent because the form endpoint is not connected yet.)",
      "ok"
    );
  };

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var elapsed = Date.now() - loadedAt;
    var isBot = (honeypot && honeypot.value !== "") || elapsed < 3000;
    if (isBot) {
      setStatus("Thanks, your message has been sent.", "ok");
      return;
    }

    var firstName = fields.name.el ? fields.name.el.value.trim() : "";
    var firstError = null;

    Object.keys(fields).forEach(function (key) {
      var field = fields[key];
      if (!field.el) {
        return;
      }
      var message = field.validate(field.el.value, field.el);
      setFieldError(field, message);
      if (message && !firstError) {
        firstError = field.el;
      }
    });

    if (firstError) {
      setStatus("Please check the highlighted fields and try again.", "error");
      firstError.focus();
      return;
    }

    if (!FORM_ENDPOINT) {
      showPreviewSuccess(firstName);
      return;
    }

    var payload = {
      name: firstName,
      email: fields.email.el.value.trim(),
      subject: form.elements.namedItem("subject").value,
      message: fields.message.el.value.trim(),
      consent: "yes",
      _subject: "New enquiry from the Kalamari website"
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }
    setStatus("Sending your message...", "");

    fetch(FORM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Request failed with status " + response.status);
        }
        showSuccess(firstName);
      })
      .catch(function () {
        setStatus(
          "Something went wrong and the message was not sent. Please try again.",
          "error"
        );
      })
      .then(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send message";
        }
      });
  });
})();
