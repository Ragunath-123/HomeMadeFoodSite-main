/* ============================================
   Amma's Homemade Foods - Admin Auth System
   Admin-only mobile number login with JSON + localStorage
   ============================================ */

(function () {
  'use strict';

  var USERS_KEY = 'ammas_users';
  var AUTH_KEY = 'ammas_auth';
  var USERS_JSON = '/users.json';

  // ---- Get current logged-in admin ----
  function getCurrentUser() {
    var stored = localStorage.getItem(AUTH_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }

  // ---- Check if admin is logged in ----
  function isLoggedIn() {
    var user = getCurrentUser();
    return user !== null && user.role === 'admin';
  }

  // ---- Load admin users (localStorage first, then JSON fallback) ----
  function loadUsers() {
    var stored = localStorage.getItem(USERS_KEY);
    if (stored) {
      try {
        return Promise.resolve(JSON.parse(stored).users || []);
      } catch (e) {
        // Fall through to fetch
      }
    }

    return fetch(USERS_JSON)
      .then(function (res) {
        if (!res.ok) throw new Error('Users file not found');
        return res.json();
      })
      .then(function (data) {
        localStorage.setItem(USERS_KEY, JSON.stringify(data));
        return data.users || [];
      });
  }

  // ---- Login with mobile number (admin only) ----
  function login(mobile, callback) {
    loadUsers().then(function (users) {
      var userList = Array.isArray(users) ? users : [];

      var user = userList.find(function (u) {
        return u.mobile === mobile && u.role === 'admin';
      });

      if (user) {
        var authData = {
          mobile: user.mobile,
          name: user.name,
          role: 'admin',
          loggedInAt: new Date().toISOString()
        };
        localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
        callback(null, authData);
      } else {
        callback('This mobile number is not authorized as admin.', null);
      }
    }).catch(function () {
      callback('Error loading data. Please try again.', null);
    });
  }

  // ---- Logout ----
  function logout() {
    localStorage.removeItem(AUTH_KEY);
    updateUI();
    if (window.location.pathname.indexOf('admin') !== -1) {
      window.location.href = 'index.html';
    }
  }

  // ---- Update UI based on auth state ----
  function updateUI() {
    var user = getCurrentUser();
    var isAdmin = user && user.role === 'admin';

    // Admin link in navbar
    var adminLinks = document.querySelectorAll('.admin-link');
    adminLinks.forEach(function (el) {
      el.style.display = isAdmin ? '' : 'none';
    });

    // Login/user elements in navbar
    var loginBtns = document.querySelectorAll('.login-btn');
    var userInfoEls = document.querySelectorAll('.user-info');
    var logoutBtns = document.querySelectorAll('.logout-btn');
    var userNameEls = document.querySelectorAll('.user-name');

    if (isAdmin) {
      loginBtns.forEach(function (el) { el.style.display = 'none'; });
      userInfoEls.forEach(function (el) { el.style.display = ''; });
      logoutBtns.forEach(function (el) { el.style.display = ''; });
      userNameEls.forEach(function (el) { el.textContent = user.name; });
    } else {
      loginBtns.forEach(function (el) { el.style.display = ''; });
      userInfoEls.forEach(function (el) { el.style.display = 'none'; });
      logoutBtns.forEach(function (el) { el.style.display = 'none'; });
    }
  }

  // ---- Protect admin page ----
  function requireAdmin() {
    if (!isLoggedIn()) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }

  // ---- Bind logout buttons ----
  function bindLogout() {
    document.querySelectorAll('.logout-btn').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    });
  }

  // ---- Get all admin users (for admin panel) ----
  function getAdminUsers(callback) {
    loadUsers().then(function (users) {
      var userList = Array.isArray(users) ? users : [];
      callback(userList.filter(function (u) { return u.role === 'admin'; }));
    });
  }

  // ---- Add admin mobile number ----
  function addAdmin(mobile, name, callback) {
    loadUsers().then(function (users) {
      var userList = Array.isArray(users) ? users : [];

      var existing = userList.find(function (u) {
        return u.mobile === mobile;
      });

      if (existing) {
        // Upgrade to admin if already customer, or error if already admin
        if (existing.role === 'admin') {
          callback('This number is already an admin.', null);
          return;
        }
        existing.role = 'admin';
        existing.name = name;
      } else {
        userList.push({ mobile: mobile, name: name, role: 'admin' });
      }

      localStorage.setItem(USERS_KEY, JSON.stringify({ users: userList }));
      callback(null, { mobile: mobile, name: name, role: 'admin' });
    });
  }

  // ---- Remove admin mobile number ----
  function removeAdmin(mobile, callback) {
    loadUsers().then(function (users) {
      var userList = Array.isArray(users) ? users : [];

      // Don't allow removing all admins
      var adminCount = userList.filter(function (u) { return u.role === 'admin'; }).length;
      if (adminCount <= 1) {
        callback('Cannot remove the last admin.', null);
        return;
      }

      var idx = userList.findIndex(function (u) {
        return u.mobile === mobile && u.role === 'admin';
      });

      if (idx === -1) {
        callback('Admin not found.', null);
        return;
      }

      userList.splice(idx, 1);
      localStorage.setItem(USERS_KEY, JSON.stringify({ users: userList }));

      // If removing self, logout
      var current = getCurrentUser();
      if (current && current.mobile === mobile) {
        localStorage.removeItem(AUTH_KEY);
      }

      callback(null, mobile);
    });
  }

  // ---- Init auth on page load ----
  function init() {
    updateUI();
    bindLogout();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ---- Expose to global ----
  window.AmmaAuth = {
    getCurrentUser: getCurrentUser,
    isLoggedIn: isLoggedIn,
    isAdmin: isLoggedIn,
    login: login,
    logout: logout,
    updateUI: updateUI,
    requireAdmin: requireAdmin,
    getAdminUsers: getAdminUsers,
    addAdmin: addAdmin,
    removeAdmin: removeAdmin,
    init: init
  };

})();
