(function () {
  "use strict";

  var WA_PHONE = "5491126072655";
  var STORAGE_KEY = "pastas-cart-v1";

  var PRICES = {
    fideo: { comun: 3000, morron: 4000, espinaca: 4000 },
    sorrentinoDocena: 7000,
    postre: { oreo: 4000, chocotorta: 4500 },
  };

  var FIDEO_LABELS = {
    comun: "Común",
    morron: "Morrón",
    espinaca: "Espinaca",
  };

  var POSTRE_LABELS = {
    oreo: "Postre de Oreo",
    chocotorta: "Postre de chocotorta",
  };

  var cart = [];

  var menuToggle = document.querySelector(".menu-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  function genId() {
    if (window.crypto && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "id-" + Date.now() + "-" + Math.random().toString(36).slice(2, 9);
  }

  function clampMedios(n) {
    var x = parseInt(String(n), 10);
    if (isNaN(x) || x < 1) return 1;
    if (x > 99) return 99;
    return x;
  }

  function clampDocenas(n) {
    var x = parseInt(String(n), 10);
    if (isNaN(x) || x < 1) return 1;
    if (x > 99) return 99;
    return x;
  }

  function formatMoney(n) {
    return (
      "$" +
      Math.round(n).toLocaleString("es-AR", { maximumFractionDigits: 0 })
    );
  }

  function formatKgFromMedios(mediosKg) {
    var kg = mediosKg * 0.5;
    var s = kg.toLocaleString("es-AR", {
      minimumFractionDigits: kg % 1 ? 1 : 0,
      maximumFractionDigits: 1,
    });
    return s + " kg";
  }

  /** Muestra el peso en el selector: 500 GR, 1 KG, 1,5 KG, … */
  function formatPesoSelector(mediosKg) {
    var m = clampMedios(mediosKg);
    if (m === 1) {
      return "500 GR";
    }
    var kg = m * 0.5;
    if (kg % 1 === 0) {
      return kg + " KG";
    }
    return (
      kg.toLocaleString("es-AR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + " KG"
    );
  }

  function getMediosDisplayEl(input) {
    if (!input || !input.id) return null;
    var dispId = input.id.replace(/^input-/, "display-");
    return document.getElementById(dispId);
  }

  function syncMediosUI(input) {
    if (!input || !input.classList.contains("input-medios")) return;
    var m = clampMedios(input.value);
    input.value = String(m);
    var disp = getMediosDisplayEl(input);
    if (disp) {
      disp.textContent = formatPesoSelector(m);
    }
  }

  function syncUnidadesUI(input) {
    if (!input || !input.classList.contains("input-unidades")) return;
    var m = clampMedios(input.value);
    input.value = String(m);
    var disp = getMediosDisplayEl(input);
    if (disp) {
      disp.textContent = m === 1 ? "1 u." : m + " u.";
    }
  }

  var toastTimer = null;
  var toastHideTimer = null;
  var toastEl = null;

  function getToastEl() {
    if (!toastEl) {
      toastEl = document.getElementById("cart-toast");
    }
    return toastEl;
  }

  function showCartToast(productName) {
    var el = getToastEl();
    if (!el) return;
    if (toastTimer) clearTimeout(toastTimer);
    if (toastHideTimer) clearTimeout(toastHideTimer);
    var name = String(productName || "Producto").trim();
    el.textContent = "Se sumó " + name + " al carro.";
    el.hidden = false;
    requestAnimationFrame(function () {
      el.classList.add("is-visible");
    });
    toastTimer = setTimeout(function () {
      el.classList.remove("is-visible");
      toastHideTimer = setTimeout(function () {
        el.hidden = true;
        toastTimer = null;
        toastHideTimer = null;
      }, 300);
    }, 3200);
  }

  function linePrice(item) {
    if (item.type === "fideo") {
      var unit = PRICES.fideo[item.fideoId];
      return item.mediosKg * (unit || 0);
    }
    if (item.type === "sorrentino") {
      return item.docenas * PRICES.sorrentinoDocena;
    }
    if (item.type === "postre") {
      var pu = PRICES.postre[item.postreId];
      return item.unidades * (pu || 0);
    }
    return 0;
  }

  function cartTotal() {
    return cart.reduce(function (sum, item) {
      return sum + linePrice(item);
    }, 0);
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      cart = data.filter(function (it) {
        if (it.type === "fideo") {
          return (
            it.fideoId &&
            typeof it.mediosKg === "number" &&
            it.mediosKg >= 1
          );
        }
        if (it.type === "sorrentino") {
          return (
            it.masa &&
            it.relleno &&
            typeof it.docenas === "number" &&
            it.docenas >= 1
          );
        }
        if (it.type === "postre") {
          return (
            it.postreId &&
            typeof it.unidades === "number" &&
            it.unidades >= 1
          );
        }
        return false;
      });
      cart.forEach(function (it) {
        if (!it.id) it.id = genId();
      });
    } catch (e) {
      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {}
  }

  function addFideo(fideoId, mediosKg) {
    mediosKg = clampMedios(mediosKg);
    var existing = cart.find(function (i) {
      return i.type === "fideo" && i.fideoId === fideoId;
    });
    if (existing) {
      existing.mediosKg += mediosKg;
    } else {
      cart.push({
        id: genId(),
        type: "fideo",
        fideoId: fideoId,
        mediosKg: mediosKg,
      });
    }
    saveCart();
    renderCart();
    var label = FIDEO_LABELS[fideoId] || fideoId;
    showCartToast(
      "Fideos " + label + " (" + formatPesoSelector(mediosKg) + ")"
    );
  }

  function addSorrentino(masa, relleno, docenas) {
    docenas = clampDocenas(docenas);
    var existing = cart.find(function (i) {
      return (
        i.type === "sorrentino" &&
        i.masa === masa &&
        i.relleno === relleno
      );
    });
    if (existing) {
      existing.docenas += docenas;
    } else {
      cart.push({
        id: genId(),
        type: "sorrentino",
        masa: masa,
        relleno: relleno,
        docenas: docenas,
      });
    }
    saveCart();
    renderCart();
    showCartToast("Sorrentino (" + masa + " · " + relleno + ")");
  }

  function addPostre(postreId, unidades) {
    unidades = clampMedios(unidades);
    var existing = cart.find(function (i) {
      return i.type === "postre" && i.postreId === postreId;
    });
    if (existing) {
      existing.unidades += unidades;
    } else {
      cart.push({
        id: genId(),
        type: "postre",
        postreId: postreId,
        unidades: unidades,
      });
    }
    saveCart();
    renderCart();
    var label = POSTRE_LABELS[postreId] || postreId;
    showCartToast(label + " (" + unidades + " u.)");
  }

  function removeItem(id) {
    cart = cart.filter(function (i) {
      return i.id !== id;
    });
    saveCart();
    renderCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
    renderCart();
  }

  var dialogCart = document.getElementById("dialog-cart");
  var cartList = document.getElementById("cart-list");
  var cartEmpty = document.getElementById("cart-empty");
  var cartFooter = document.getElementById("cart-footer");
  var cartTotalEl = document.getElementById("cart-total");
  var cartBadge = document.getElementById("cart-badge");
  var cartBadgeMobile = document.getElementById("cart-badge-mobile");

  function setBadgeCount(n) {
    var text = String(n);
    if (cartBadge) {
      cartBadge.textContent = text;
      cartBadge.hidden = n === 0;
    }
    if (cartBadgeMobile) {
      cartBadgeMobile.textContent = text;
      cartBadgeMobile.hidden = n === 0;
    }
  }

  function describeFideoLine(item) {
    var label = FIDEO_LABELS[item.fideoId] || item.fideoId;
    var kg = formatKgFromMedios(item.mediosKg);
    var packs =
      item.mediosKg === 1
        ? "1 × ½ kg"
        : item.mediosKg + " × ½ kg";
    return {
      title: "Fideos " + label,
      detail: kg + " (" + packs + ")",
      price: linePrice(item),
    };
  }

  function describeSorrentinoLine(item) {
    var docTxt =
      item.docenas === 1 ? "1 docena" : item.docenas + " docenas";
    return {
      title: "Sorrentinos",
      detail:
        "Masa: " +
        item.masa +
        " · Relleno: " +
        item.relleno +
        " · " +
        docTxt,
      price: linePrice(item),
    };
  }

  function describePostreLine(item) {
    var uTxt =
      item.unidades === 1 ? "1 unidad" : item.unidades + " unidades";
    return {
      title: POSTRE_LABELS[item.postreId] || item.postreId,
      detail: uTxt,
      price: linePrice(item),
    };
  }

  function renderCart() {
    setBadgeCount(cart.length);

    if (!cartList || !cartEmpty || !cartFooter || !cartTotalEl) return;

    cartList.innerHTML = "";

    if (cart.length === 0) {
      cartEmpty.hidden = false;
      cartList.hidden = true;
      cartFooter.hidden = true;
      return;
    }

    cartEmpty.hidden = true;
    cartList.hidden = false;
    cartFooter.hidden = false;

    cart.forEach(function (item) {
      var desc =
        item.type === "fideo"
          ? describeFideoLine(item)
          : item.type === "postre"
          ? describePostreLine(item)
          : describeSorrentinoLine(item);

      var li = document.createElement("li");
      li.className = "cart-line";
      li.dataset.itemId = item.id;

      var main = document.createElement("div");
      main.className = "cart-line-main";

      var title = document.createElement("strong");
      title.className = "cart-line-title";
      title.textContent = desc.title;

      var detail = document.createElement("p");
      detail.className = "cart-line-detail";
      detail.textContent = desc.detail;

      var price = document.createElement("span");
      price.className = "cart-line-price";
      price.textContent = formatMoney(desc.price);

      main.appendChild(title);
      main.appendChild(detail);

      var actions = document.createElement("div");
      actions.className = "cart-line-actions";
      actions.appendChild(price);

      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "cart-line-remove";
      rm.setAttribute("aria-label", "Quitar del carrito");
      rm.dataset.removeId = item.id;
      rm.textContent = "Quitar";
      actions.appendChild(rm);

      li.appendChild(main);
      li.appendChild(actions);
      cartList.appendChild(li);
    });

    cartTotalEl.textContent = formatMoney(cartTotal());
  }

  function buildWhatsAppMessage(datosCliente) {
    var lines = [];
    lines.push("Hola! Quiero confirmar este pedido:");
    lines.push("");

    if (datosCliente) {
      lines.push("Nombre: " + datosCliente.nombre);
      lines.push(
        "Dirección: " +
          (datosCliente.direccion && String(datosCliente.direccion).trim()
            ? datosCliente.direccion.trim()
            : "—")
      );
      lines.push(
        "Entrega: " +
          (datosCliente.entrega === "envio" ? "Envío" : "Retiro")
      );
      if (datosCliente.entrega === "envio") {
        lines.push("*El precio de envío se confirmará por WhatsApp.*");
      }
      lines.push("");
    }

    var fideos = cart.filter(function (i) {
      return i.type === "fideo";
    });
    var sorts = cart.filter(function (i) {
      return i.type === "sorrentino";
    });
    var postres = cart.filter(function (i) {
      return i.type === "postre";
    });

    if (fideos.length) {
      lines.push("Fideos:");
      fideos.forEach(function (item) {
        var d = describeFideoLine(item);
        lines.push(
          "• " +
            d.title.replace(/^Fideos /, "") +
            " — " +
            d.detail +
            " — " +
            formatMoney(d.price)
        );
      });
      lines.push("");
    }

    if (sorts.length) {
      lines.push("Sorrentinos:");
      sorts.forEach(function (item) {
        var d = describeSorrentinoLine(item);
        lines.push(
          "• Masa " +
            item.masa +
            ", relleno " +
            item.relleno +
            " — " +
            (item.docenas === 1
              ? "1 docena"
              : item.docenas + " docenas") +
            " — " +
            formatMoney(linePrice(item))
        );
      });
      lines.push("");
    }

    if (postres.length) {
      lines.push("Postres:");
      postres.forEach(function (item) {
        var d = describePostreLine(item);
        lines.push(
          "• " +
            d.title +
            " — " +
            d.detail +
            " — " +
            formatMoney(d.price)
        );
      });
      lines.push("");
    }

    lines.push("Total estimado: " + formatMoney(cartTotal()));
    lines.push("");
    lines.push("Gracias!");
    return lines.join("\n");
  }

  function openCart() {
    if (!dialogCart) return;
    renderCart();
    if (typeof dialogCart.showModal === "function") {
      dialogCart.showModal();
    }
    if (menuToggle && mobileNav && mobileNav.hidden === false) {
      menuToggle.setAttribute("aria-expanded", "false");
      mobileNav.hidden = true;
    }
  }

  function closeCart() {
    if (!dialogCart) return;
    if (typeof dialogCart.close === "function") {
      dialogCart.close();
    }
  }

  var dialogCheckout = document.getElementById("dialog-checkout");
  var formCheckout = document.getElementById("form-checkout");
  var inputCheckoutNombre = document.getElementById("checkout-nombre");
  var inputCheckoutDireccion = document.getElementById("checkout-direccion");
  var selectCheckoutEntrega = document.getElementById("checkout-entrega");
  var btnCheckoutClose = document.getElementById("checkout-close");
  var btnCheckoutBack = document.getElementById("checkout-back");

  function openCheckoutDialog() {
    if (!dialogCheckout) return;
    if (selectCheckoutEntrega) {
      updateDireccionRequired();
    }
    if (typeof dialogCheckout.showModal === "function") {
      dialogCheckout.showModal();
    }
    if (inputCheckoutNombre) {
      inputCheckoutNombre.focus();
    }
  }

  function closeCheckoutDialog() {
    if (!dialogCheckout) return;
    if (typeof dialogCheckout.close === "function") {
      dialogCheckout.close();
    }
  }

  function updateDireccionRequired() {
    if (!selectCheckoutEntrega) return;
    var isEnvio = selectCheckoutEntrega.value === "envio";
    if (inputCheckoutDireccion) {
      inputCheckoutDireccion.required = isEnvio;
    }
    var notice = document.getElementById("checkout-envio-notice");
    if (notice) {
      notice.hidden = !isEnvio;
    }
  }

  if (dialogCart) {
    dialogCart.addEventListener("click", function (e) {
      if (e.target === dialogCart) {
        closeCart();
      }
    });
  }

  if (cartList) {
    cartList.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest
        ? e.target.closest(".cart-line-remove")
        : null;
      if (btn && btn.dataset.removeId) {
        removeItem(btn.dataset.removeId);
      }
    });
  }

  function wireOpenCartButtons() {
    var ids = [
      "btn-cart-toggle",
      "btn-cart-toggle-mobile",
      "hero-open-cart",
      "cta-open-cart",
    ];
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("click", function () {
          openCart();
        });
      }
    });
  }

  var cartCloseBtn = document.getElementById("cart-dialog-close");
  if (cartCloseBtn) {
    cartCloseBtn.addEventListener("click", closeCart);
  }

  document.querySelectorAll("[data-cart-close-link]").forEach(function (a) {
    a.addEventListener("click", function () {
      closeCart();
    });
  });

  var cartClear = document.getElementById("cart-clear");
  if (cartClear) {
    cartClear.addEventListener("click", function () {
      clearCart();
    });
  }

  var cartCheckout = document.getElementById("cart-checkout");
  if (cartCheckout) {
    cartCheckout.addEventListener("click", function () {
      if (cart.length === 0) return;
      closeCart();
      openCheckoutDialog();
    });
  }

  if (selectCheckoutEntrega) {
    selectCheckoutEntrega.addEventListener("change", updateDireccionRequired);
  }

  if (btnCheckoutClose) {
    btnCheckoutClose.addEventListener("click", function () {
      closeCheckoutDialog();
    });
  }

  if (btnCheckoutBack) {
    btnCheckoutBack.addEventListener("click", function () {
      closeCheckoutDialog();
      openCart();
    });
  }

  if (dialogCheckout) {
    dialogCheckout.addEventListener("click", function (e) {
      if (e.target === dialogCheckout) {
        closeCheckoutDialog();
      }
    });
  }

  if (formCheckout) {
    formCheckout.addEventListener("submit", function (e) {
      e.preventDefault();
      updateDireccionRequired();
      if (!formCheckout.reportValidity()) return;

      var fd = new FormData(formCheckout);
      var nombre = String(fd.get("nombre") || "").trim();
      var direccion = String(fd.get("direccion") || "").trim();
      var entrega = fd.get("entrega");

      var datosCliente = {
        nombre: nombre,
        direccion: direccion,
        entrega: entrega,
      };

      var url =
        "https://wa.me/" +
        WA_PHONE +
        "?text=" +
        encodeURIComponent(buildWhatsAppMessage(datosCliente));
      window.open(url, "_blank", "noopener,noreferrer");
      formCheckout.reset();
      updateDireccionRequired();
      closeCheckoutDialog();
    });
  }

  document.querySelectorAll(".js-add-fideo").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var fid = btn.getAttribute("data-fideo");
      if (!fid) return;
      var card = btn.closest("[data-fideo-card]");
      var input = card
        ? card.querySelector(".input-medios")
        : document.getElementById("input-medios-" + fid);
      var medios = input ? clampMedios(input.value) : 1;
      addFideo(fid, medios);
      if (input) {
        input.value = "1";
        syncMediosUI(input);
      }
    });
  });

  function mediosInputFromButton(btn) {
    var id = btn.getAttribute("data-medios-target");
    return id ? document.getElementById(id) : null;
  }

  document.querySelectorAll(".js-medios-menos").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = mediosInputFromButton(btn);
      if (!input) return;
      var v = clampMedios((parseInt(input.value, 10) || 1) - 1);
      input.value = String(v);
      syncMediosUI(input);
    });
  });

  document.querySelectorAll(".js-medios-mas").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = mediosInputFromButton(btn);
      if (!input) return;
      var v = clampMedios((parseInt(input.value, 10) || 1) + 1);
      input.value = String(v);
      syncMediosUI(input);
    });
  });

  document.querySelectorAll(".input-medios").forEach(function (input) {
    syncMediosUI(input);
  });

  function unidadesInputFromButton(btn) {
    var id = btn.getAttribute("data-unidades-target");
    return id ? document.getElementById(id) : null;
  }

  document.querySelectorAll(".js-add-postre").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var pid = btn.getAttribute("data-postre");
      if (!pid) return;
      var card = btn.closest("[data-postre-card]");
      var input = card
        ? card.querySelector(".input-unidades")
        : document.getElementById("input-unidades-" + pid);
      var u = input ? clampMedios(input.value) : 1;
      addPostre(pid, u);
      if (input) {
        input.value = "1";
        syncUnidadesUI(input);
      }
    });
  });

  document.querySelectorAll(".js-unidades-menos").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = unidadesInputFromButton(btn);
      if (!input) return;
      var v = clampMedios((parseInt(input.value, 10) || 1) - 1);
      input.value = String(v);
      syncUnidadesUI(input);
    });
  });

  document.querySelectorAll(".js-unidades-mas").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var input = unidadesInputFromButton(btn);
      if (!input) return;
      var v = clampMedios((parseInt(input.value, 10) || 1) + 1);
      input.value = String(v);
      syncUnidadesUI(input);
    });
  });

  document.querySelectorAll(".input-unidades").forEach(function (input) {
    syncUnidadesUI(input);
  });

  var dialogArma = document.getElementById("dialog-arma-sorrentino");
  var btnArma = document.getElementById("btn-arma-sorrentino");
  var btnClose = document.getElementById("dialog-arma-close");
  var btnCancel = document.getElementById("dialog-arma-cancel");
  var formArma = document.getElementById("form-arma-sorrentino");
  var inputDocenas = document.getElementById("input-docenas");
  var docenasMenos = document.getElementById("docenas-menos");
  var docenasMas = document.getElementById("docenas-mas");

  function openArmaDialog() {
    if (!dialogArma) return;
    if (typeof dialogArma.showModal === "function") {
      dialogArma.showModal();
    }
  }

  function closeArmaDialog() {
    if (!dialogArma) return;
    if (typeof dialogArma.close === "function") {
      dialogArma.close();
    }
  }

  function stepDocenas(delta) {
    if (!inputDocenas) return;
    var v = clampDocenas((parseInt(inputDocenas.value, 10) || 1) + delta);
    inputDocenas.value = String(v);
  }

  if (btnArma && dialogArma) {
    btnArma.addEventListener("click", openArmaDialog);
  }

  if (btnClose) {
    btnClose.addEventListener("click", closeArmaDialog);
  }

  if (btnCancel) {
    btnCancel.addEventListener("click", closeArmaDialog);
  }

  if (dialogArma) {
    dialogArma.addEventListener("click", function (e) {
      if (e.target === dialogArma) {
        closeArmaDialog();
      }
    });
  }

  if (inputDocenas) {
    inputDocenas.addEventListener("change", function () {
      inputDocenas.value = String(clampDocenas(inputDocenas.value));
    });
    inputDocenas.addEventListener("blur", function () {
      inputDocenas.value = String(clampDocenas(inputDocenas.value));
    });
  }

  if (docenasMenos) {
    docenasMenos.addEventListener("click", function () {
      stepDocenas(-1);
    });
  }

  if (docenasMas) {
    docenasMas.addEventListener("click", function () {
      stepDocenas(1);
    });
  }

  if (formArma) {
    formArma.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!formArma.reportValidity()) return;

      var fd = new FormData(formArma);
      var masa = fd.get("masa");
      var relleno = fd.get("relleno");
      var docenas = clampDocenas(fd.get("docenas"));

      addSorrentino(masa, relleno, docenas);
      formArma.reset();
      closeArmaDialog();
    });
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function () {
      var expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      mobileNav.hidden = expanded;
    });

    mobileNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menuToggle.setAttribute("aria-expanded", "false");
        mobileNav.hidden = true;
      });
    });
  }

  loadCart();
  wireOpenCartButtons();
  renderCart();

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var revealEls = document.querySelectorAll(
      ".card, .step, .section-title + .section-lead, .cta-wrap"
    );

    revealEls.forEach(function (el) {
      el.classList.add("reveal");
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 }
    );

    document.querySelectorAll(".reveal").forEach(function (el) {
      observer.observe(el);
    });
  }
})();
