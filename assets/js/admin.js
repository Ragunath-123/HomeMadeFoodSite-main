/* ============================================
   Amma's Homemade Foods - Admin Panel JS
   ============================================ */

(function () {
  'use strict';

  var STORAGE_KEY = 'ammas_menu_data';
  var DEFAULT_JSON = 'data/menu.json';

  var menuData = [];
  var nextId = 1;

  // ---- Init ----
  document.addEventListener('DOMContentLoaded', function () {
    if (!window.AmmaAuth || !window.AmmaAuth.requireAdmin()) return;

    initTheme();
    loadAdminMenu();
    loadAdminUsers();
    bindEvents();
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
    if (icon) icon.className = theme === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  }

  // ---- Load Menu ----
  function loadAdminMenu() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        var data = JSON.parse(stored);
        menuData = data.menu || [];
        recalcNextId();
        renderTable();
        renderStats();
        return;
      } catch (e) {
        console.warn('Invalid stored data, loading defaults');
      }
    }

    fetch(DEFAULT_JSON)
      .then(function (res) {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(function (data) {
        menuData = data.menu || [];
        recalcNextId();
        saveData();
        renderTable();
        renderStats();
      })
      .catch(function () {
        menuData = [];
        renderTable();
        renderStats();
      });
  }

  function recalcNextId() {
    var maxId = 0;
    menuData.forEach(function (item) {
      if (item.id > maxId) maxId = item.id;
    });
    nextId = maxId + 1;
  }

  // ---- Save to localStorage ----
  function saveData() {
    var data = {
      date: new Date().toISOString().split('T')[0],
      whatsappNumber: '918825467578',
      menu: menuData,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  // ---- Render Stats ----
  function renderStats() {
    var container = document.getElementById('adminStats');
    if (!container) return;

    var total = menuData.length;
    var veg = menuData.filter(function (i) { return i.type === 'Veg'; }).length;
    var nonVeg = menuData.filter(function (i) { return i.type === 'Non-Veg'; }).length;
    var available = menuData.filter(function (i) { return i.available; }).length;
    var specials = menuData.filter(function (i) { return i.special; }).length;

    container.innerHTML =
      '<div class="col-6 col-md">' +
        '<div class="admin-stat-card">' +
          '<div class="stat-number">' + total + '</div>' +
          '<div class="stat-label">Total Items</div>' +
        '</div>' +
      '</div>' +
      '<div class="col-6 col-md">' +
        '<div class="admin-stat-card veg-border">' +
          '<div class="stat-number" style="color:var(--leaf-green)">' + veg + '</div>' +
          '<div class="stat-label">Veg</div>' +
        '</div>' +
      '</div>' +
      '<div class="col-6 col-md">' +
        '<div class="admin-stat-card nonveg-border">' +
          '<div class="stat-number" style="color:#DC2626">' + nonVeg + '</div>' +
          '<div class="stat-label">Non-Veg</div>' +
        '</div>' +
      '</div>' +
      '<div class="col-6 col-md">' +
        '<div class="admin-stat-card">' +
          '<div class="stat-number" style="color:var(--curry-orange)">' + available + '</div>' +
          '<div class="stat-label">Available</div>' +
        '</div>' +
      '</div>' +
      '<div class="col-6 col-md">' +
        '<div class="admin-stat-card">' +
          '<div class="stat-number" style="color:var(--curry-orange)">' + specials + '</div>' +
          '<div class="stat-label">Special</div>' +
        '</div>' +
      '</div>';
  }

  // ---- Render Table ----
  function renderTable() {
    var tbody = document.getElementById('menuTableBody');
    if (!tbody) return;

    if (!menuData.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="text-center py-5" style="color:var(--gray-400)">' +
        '<i class="fa-solid fa-bowl-rice" style="font-size:2rem;display:block;margin-bottom:8px"></i>' +
        'No menu items yet. Click "Add New Item" to get started.</td></tr>';
      return;
    }

    tbody.innerHTML = menuData.map(function (item) {
      var imgSrc = item.image || 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=100';
      var typeClass = item.type === 'Veg' ? 'veg' : 'non-veg';

      return '<tr>' +
        '<td><span style="color:var(--gray-400);font-size:0.85rem">#' + item.id + '</span></td>' +
        '<td><img src="' + imgSrc + '" alt="' + item.name + '" style="width:50px;height:50px;object-fit:cover;border-radius:8px" loading="lazy"></td>' +
        '<td><strong>' + item.name + '</strong>' +
          (item.description ? '<br><small style="color:var(--gray-400)">' + truncate(item.description, 40) + '</small>' : '') +
        '</td>' +
        '<td><span class="badge rounded-pill" style="background:rgba(217,119,6,0.1);color:var(--curry-orange);font-size:0.75rem">' + item.category + '</span></td>' +
        '<td><span class="badge rounded-pill ' + typeClass + '" style="font-size:0.75rem">' + item.type + '</span></td>' +
        '<td><strong>&#8377;' + item.price + '</strong></td>' +
        '<td>' + (item.available
          ? '<span style="color:var(--leaf-green)"><i class="fa-solid fa-circle-check"></i></span>'
          : '<span style="color:#DC2626"><i class="fa-solid fa-circle-xmark"></i></span>') + '</td>' +
        '<td>' + (item.special
          ? '<span style="color:var(--curry-orange)"><i class="fa-solid fa-star"></i></span>'
          : '<span style="color:var(--gray-300)"><i class="fa-regular fa-star"></i></span>') + '</td>' +
        '<td>' +
          '<div class="d-flex gap-1">' +
            '<button class="btn btn-sm btn-outline-primary btn-edit" data-id="' + item.id + '" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger btn-delete" data-id="' + item.id + '" title="Delete"><i class="fa-solid fa-trash"></i></button>' +
          '</div>' +
        '</td>' +
      '</tr>';
    }).join('');

    bindTableButtons();
  }

  function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
  }

  // ---- Load Admin Users Table ----
  function loadAdminUsers() {
    if (!window.AmmaAuth) return;
    window.AmmaAuth.getAdminUsers(function (admins) {
      renderAdminUsersTable(admins);
    });
  }

  function renderAdminUsersTable(admins) {
    var tbody = document.getElementById('adminUsersBody');
    if (!tbody) return;

    var currentUser = window.AmmaAuth.getCurrentUser();

    if (!admins.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4" style="color:var(--gray-400)">No admin numbers found.</td></tr>';
      return;
    }

    tbody.innerHTML = admins.map(function (admin) {
      var isSelf = currentUser && currentUser.mobile === admin.mobile;
      return '<tr>' +
        '<td><code style="font-size:0.9rem">+91 ' + admin.mobile + '</code>' +
          (isSelf ? ' <span class="badge rounded-pill" style="background:var(--leaf-green);color:white;font-size:0.65rem">You</span>' : '') +
        '</td>' +
        '<td>' + admin.name + '</td>' +
        '<td>' +
          (isSelf
            ? '<span style="color:var(--gray-400);font-size:0.8rem"><i class="fa-solid fa-lock me-1"></i>Current</span>'
            : '<button class="btn btn-sm btn-outline-danger btn-remove-admin" data-mobile="' + admin.mobile + '" title="Remove">' +
              '<i class="fa-solid fa-user-minus"></i></button>') +
        '</td>' +
      '</tr>';
    }).join('');

    // Bind remove admin buttons
    document.querySelectorAll('.btn-remove-admin').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mobile = this.getAttribute('data-mobile');
        if (confirm('Remove admin access for +91 ' + mobile + '?')) {
          window.AmmaAuth.removeAdmin(mobile, function (err) {
            if (err) {
              showToast(err, 'danger');
            } else {
              loadAdminUsers();
              showToast('Admin removed');
            }
          });
        }
      });
    });
  }

  // ---- Bind Events ----
  function bindEvents() {
    // Add New menu item
    var btnAdd = document.getElementById('btnAddNew');
    if (btnAdd) {
      btnAdd.addEventListener('click', function () {
        openModal();
      });
    }

    // Form submit (menu item)
    var form = document.getElementById('itemForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.classList.add('was-validated');
          return;
        }
        saveItem();
      });
    }

    // Reset button
    var btnReset = document.getElementById('btnReset');
    if (btnReset) {
      btnReset.addEventListener('click', function () {
        if (confirm('Reset all menu data to defaults? Your changes will be lost.')) {
          localStorage.removeItem(STORAGE_KEY);
          loadAdminMenu();
          showToast('Menu reset to defaults', 'warning');
        }
      });
    }

    // Delete confirm button
    var btnConfirmDelete = document.getElementById('btnConfirmDelete');
    if (btnConfirmDelete) {
      btnConfirmDelete.addEventListener('click', function () {
        var id = parseInt(document.getElementById('deleteId').value, 10);
        deleteItem(id);
        var modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        if (modal) modal.hide();
      });
    }

    // Add admin number button
    var btnAddAdmin = document.getElementById('btnAddAdmin');
    if (btnAddAdmin) {
      btnAddAdmin.addEventListener('click', function () {
        var modal = new bootstrap.Modal(document.getElementById('adminUserModal'));
        modal.show();
      });
    }

    // Add admin form submit
    var adminUserForm = document.getElementById('adminUserForm');
    if (adminUserForm) {
      adminUserForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = document.getElementById('newAdminName').value.trim();
        var mobile = document.getElementById('newAdminMobile').value.trim();
        var errorEl = document.getElementById('adminUserError');

        if (!name || !/^[0-9]{10}$/.test(mobile)) {
          adminUserForm.classList.add('was-validated');
          return;
        }

        window.AmmaAuth.addAdmin(mobile, name, function (err, user) {
          if (err) {
            errorEl.textContent = err;
            errorEl.classList.remove('d-none');
            return;
          }

          errorEl.classList.add('d-none');
          adminUserForm.classList.remove('was-validated');
          document.getElementById('newAdminName').value = '';
          document.getElementById('newAdminMobile').value = '';

          var modal = bootstrap.Modal.getInstance(document.getElementById('adminUserModal'));
          if (modal) modal.hide();

          loadAdminUsers();
          showToast('Admin number added: +91 ' + mobile);
        });
      });
    }
  }

  function bindTableButtons() {
    document.querySelectorAll('.btn-edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.getAttribute('data-id'), 10);
        editItem(id);
      });
    });

    document.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(this.getAttribute('data-id'), 10);
        document.getElementById('deleteId').value = id;
        var modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
      });
    });
  }

  // ---- Open Modal (Add / Edit) ----
  function openModal(item) {
    var form = document.getElementById('itemForm');
    form.classList.remove('was-validated');

    var label = document.getElementById('itemModalLabel');
    label.textContent = item ? 'Edit Menu Item' : 'Add Menu Item';

    document.getElementById('editId').value = item ? item.id : '';
    document.getElementById('itemName').value = item ? item.name : '';
    document.getElementById('itemPrice').value = item ? item.price : '';
    document.getElementById('itemCategory').value = item ? item.category : '';
    document.getElementById('itemType').value = item ? item.type : 'Veg';
    document.getElementById('itemAvailable').checked = item ? item.available : true;
    document.getElementById('itemSpecial').checked = item ? item.special : false;
    document.getElementById('itemDescription').value = item ? item.description || '' : '';
    document.getElementById('itemImage').value = item ? item.image || '' : '';

    var modal = new bootstrap.Modal(document.getElementById('itemModal'));
    modal.show();
  }

  // ---- Save Item ----
  function saveItem() {
    var editId = document.getElementById('editId').value;
    var name = document.getElementById('itemName').value.trim();
    var price = parseInt(document.getElementById('itemPrice').value, 10);
    var category = document.getElementById('itemCategory').value;
    var type = document.getElementById('itemType').value;
    var available = document.getElementById('itemAvailable').checked;
    var special = document.getElementById('itemSpecial').checked;
    var description = document.getElementById('itemDescription').value.trim();
    var image = document.getElementById('itemImage').value.trim();

    if (!image) {
      image = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=600';
    }

    if (editId) {
      var idx = menuData.findIndex(function (i) { return i.id === parseInt(editId, 10); });
      if (idx !== -1) {
        menuData[idx].name = name;
        menuData[idx].price = price;
        menuData[idx].category = category;
        menuData[idx].type = type;
        menuData[idx].available = available;
        menuData[idx].special = special;
        menuData[idx].description = description;
        menuData[idx].image = image;
      }
      showToast('Item updated successfully');
    } else {
      menuData.push({
        id: nextId++,
        name: name,
        category: category,
        type: type,
        price: price,
        available: available,
        special: special,
        description: description,
        image: image,
      });
      showToast('Item added successfully');
    }

    saveData();
    renderTable();
    renderStats();

    var modal = bootstrap.Modal.getInstance(document.getElementById('itemModal'));
    if (modal) modal.hide();
  }

  // ---- Edit Item ----
  function editItem(id) {
    var item = menuData.find(function (i) { return i.id === id; });
    if (item) openModal(item);
  }

  // ---- Delete Item ----
  function deleteItem(id) {
    menuData = menuData.filter(function (i) { return i.id !== id; });
    saveData();
    renderTable();
    renderStats();
    showToast('Item deleted', 'danger');
  }

  // ---- Toast ----
  function showToast(message, type) {
    var toastEl = document.getElementById('adminToast');
    var msgEl = document.getElementById('toastMessage');
    if (!toastEl || !msgEl) return;

    msgEl.textContent = message;
    toastEl.className = 'toast align-items-center border-0 text-bg-' + (type || 'success');

    var toast = new bootstrap.Toast(toastEl, { delay: 2500 });
    toast.show();
  }

})();
