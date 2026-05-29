/* ============================================
   Amma's Homemade Foods - Main JavaScript
   ============================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'ammas_menu_data';

  // ---- State ----
  let menuData = [];
  let whatsappNumber = '918825467578';
  let activeCategory = 'All';
  let activeType = 'All';
  let searchQuery = '';

  // ---- Loading Spinner ----
  window.addEventListener('load', function () {
    var loader = document.getElementById('loader');
    if (loader) {
      loader.classList.add('fade-out');
      setTimeout(function () {
        loader.style.display = 'none';
      }, 500);
    }
  });

  // ---- AOS Init ----
  document.addEventListener('DOMContentLoaded', function () {
    if (typeof AOS !== 'undefined') {
      AOS.init({
        duration: 700,
        once: true,
        offset: 80,
      });
    }

    initTheme();
    initNavbar();
    initScrollTop();
    initMobileNav();
    initCounters();
    loadMenu();
    initWhatsAppLinks();
  });

  // ---- Theme Toggle ----
  function initTheme() {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    var saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    updateThemeIcon(saved);

    toggle.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      var next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      updateThemeIcon(next);
    });
  }

  function updateThemeIcon(theme) {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    var icon = toggle.querySelector('i');
    if (icon) {
      icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    }
  }

  // ---- Navbar Scroll Effect ----
  function initNavbar() {
    var navbar = document.getElementById('mainNav');
    if (!navbar) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    var navLinks = navbar.querySelectorAll('.nav-link');
    var collapse = navbar.querySelector('.navbar-collapse');
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        if (collapse && collapse.classList.contains('show')) {
          var bsCollapse = bootstrap.Collapse.getInstance(collapse);
          if (bsCollapse) bsCollapse.hide();
        }
      });
    });
  }

  // ---- Scroll to Top ----
  function initScrollTop() {
    var btn = document.getElementById('scrollTop');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ---- Mobile Bottom Nav Active State ----
  function initMobileNav() {
    var items = document.querySelectorAll('.mobile-bottom-nav .nav-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        items.forEach(function (i) { i.classList.remove('active'); });
        this.classList.add('active');
      });
    });
  }

  // ---- Animated Counters ----
  function initCounters() {
    var counters = document.querySelectorAll('.counter-number');
    if (!counters.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(function (counter) {
      observer.observe(counter);
    });
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    var duration = 2000;
    var startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.floor(eased * target) + '+';
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  // ---- WhatsApp Links ----
  function initWhatsAppLinks() {
    var base = 'https://wa.me/' + whatsappNumber + '?text=';
    var message = encodeURIComponent('Hi, I want to order homemade food!');

    var floats = ['heroWhatsApp', 'contactWhatsApp', 'aboutWhatsApp', 'whatsappFloat'];
    floats.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.href = base + message;
    });
  }

  function orderItem(name) {
    var base = 'https://wa.me/' + whatsappNumber + '?text=';
    var message = encodeURIComponent('Hi, I want to order ' + name);
    window.open(base + message, '_blank');
  }

  // ---- Menu Loading (localStorage first, then JSON fallback) ----
  function loadMenu() {
    var container = document.getElementById('menuContainer');
    var specialsContainer = document.getElementById('specialsContainer');
    if (!container) return;

    // Check localStorage for admin-edited data first
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        var data = JSON.parse(stored);
        menuData = data.menu || [];
        whatsappNumber = data.whatsappNumber || '918825467578';
        initWhatsAppLinks();
        displayDate(data.date);
        if (specialsContainer) {
          renderSpecials(menuData.filter(function (item) { return item.special; }));
        }
        renderMenu(menuData);
        initFilters();
        return;
      } catch (e) {
        console.warn('Stored menu data invalid, loading from JSON');
      }
    }

    // Fallback: fetch from menu.json
    fetch('../data/menu.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Menu not found');
        return res.json();
      })
      .then(function (data) {
        menuData = data.menu || [];
        whatsappNumber = data.whatsappNumber || '918825467578';
        initWhatsAppLinks();
        displayDate(data.date);
        if (specialsContainer) {
          renderSpecials(menuData.filter(function (item) { return item.special; }));
        }
        renderMenu(menuData);
        initFilters();
      })
      .catch(function (err) {
        console.error('Menu load error:', err);
        showEmptyState(container);
      });
  }

  function displayDate(dateStr) {
    var dateEls = document.querySelectorAll('#menuDate, #menuDateHome');
    if (!dateStr) return;
    var formatted = new Date(dateStr).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    dateEls.forEach(function (el) {
      el.innerHTML = '<i class="fa-regular fa-calendar"></i> ' + formatted;
    });
  }

  // ---- Render Specials ----
  function renderSpecials(items) {
    var container = document.getElementById('specialsContainer');
    if (!container) return;

    if (!items.length) {
      container.innerHTML = '<div class="col-12 text-center" style="color:var(--gray-400)"><p>No specials today. Check back tomorrow!</p></div>';
      return;
    }

    container.innerHTML = items.map(function (item) {
      return buildCard(item, true);
    }).join('');
  }

  // ---- Render Menu ----
  function renderMenu(items) {
    var container = document.getElementById('menuContainer');
    var emptyEl = document.getElementById('emptyMenu');
    if (!container) return;

    var filtered = filterItems(items || menuData);

    if (!filtered.length) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('d-none');
      return;
    }

    if (emptyEl) emptyEl.classList.add('d-none');

    container.innerHTML = filtered.map(function (item) {
      return buildCard(item, false);
    }).join('');

    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }
  }

  function filterItems(items) {
    return items.filter(function (item) {
      var matchCategory = activeCategory === 'All' || item.category === activeCategory;
      var matchType = activeType === 'All' || item.type === activeType;
      var matchSearch = !searchQuery || item.name.toLowerCase().indexOf(searchQuery) !== -1 ||
        (item.description && item.description.toLowerCase().indexOf(searchQuery) !== -1);
      return matchCategory && matchType && matchSearch;
    });
  }

  // ---- Build Card HTML ----
  function buildCard(item, isSpecial) {
    var typeClass = item.type === 'Veg' ? 'veg' : 'non-veg';
    var typeLabel = item.type === 'Veg' ? 'VEG' : 'NON-VEG';
    var soldOut = !item.available;

    return '<div class="col-sm-6 col-lg-4 col-xl-3" data-aos="fade-up">' +
      '<div class="card food-card">' +
        (isSpecial ? '<span class="special-badge"><i class="fa-solid fa-star"></i> Today\'s Special</span>' : '') +
        '<div class="card-img-wrapper">' +
          '<img src="' + item.image + '" alt="' + item.name + ' - homemade ' + item.type.toLowerCase() + ' food" loading="lazy">' +
          '<span class="type-badge ' + typeClass + '">' + typeLabel + '</span>' +
          (soldOut ? '<div class="sold-out-overlay"><span>SOLD OUT</span></div>' : '') +
        '</div>' +
        '<div class="card-body">' +
          '<div class="card-category">' + item.category + '</div>' +
          '<h5 class="card-title">' + item.name + '</h5>' +
          '<p class="card-text">' + (item.description || '') + '</p>' +
          '<div class="d-flex justify-content-between align-items-center">' +
            '<span class="price-badge">&#8377;' + item.price + '</span>' +
            '<button class="order-btn" ' + (soldOut ? 'disabled' : 'onclick="orderItem(\'' + item.name.replace(/'/g, "\\'") + '\')"') + '>' +
              (soldOut ? '<i class="fa-solid fa-ban me-1"></i>Sold Out' : '<i class="fa-brands fa-whatsapp me-1"></i>Order') +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function showEmptyState(container) {
    if (!container) return;
    container.innerHTML = '<div class="col-12 empty-menu">' +
      '<i class="fa-solid fa-bowl-rice"></i>' +
      '<h4>Menu unavailable</h4>' +
      '<p>Please try again later or contact us directly on WhatsApp</p>' +
    '</div>';
  }

  // ---- Filters ----
  function initFilters() {
    var filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        activeCategory = this.getAttribute('data-category');
        renderMenu(menuData);
      });
    });

    var typeBtns = document.querySelectorAll('.type-toggle .toggle-btn');
    typeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        typeBtns.forEach(function (b) { b.classList.remove('active'); });
        this.classList.add('active');
        activeType = this.getAttribute('data-type');
        renderMenu(menuData);
      });
    });

    var searchInput = document.getElementById('menuSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchQuery = this.value.toLowerCase().trim();
        renderMenu(menuData);
      });
    }
  }

  window.orderItem = orderItem;

})();
