// === NAV HIGHLIGHT ===
export function refreshNavHighlight() {
  const highlight = document.getElementById('navHighlight');
  const active = document.querySelector('.nav-link.active');
  if (highlight && active) {
    highlight.style.top = active.offsetTop + 'px';
  }
}

function updateNavHighlight() {
  const activeLink = document.querySelector('.nav-link.active');
  const highlight = document.getElementById('navHighlight');
  if (activeLink && highlight) {
    highlight.style.top = activeLink.offsetTop + 'px';
  }
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    updateNavHighlight();
  });
});

// === FIREBASE CONFIGURATION MODULE ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBviwMdDCPO1UUovvdEwBjqcSM9qb6rxCA",
  authDomain: "andreaisaacwedding.firebaseapp.com",
  databaseURL: "https://andreaisaacwedding-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "andreaisaacwedding",
  storageBucket: "andreaisaacwedding.appspot.com",
  messagingSenderId: "759825528019",
  appId: "1:759825528019:web:c15e084ff9dcefbca345026",
  measurementId: "G-N9RZJFDCMS"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// === AUTH MODULE ===
export function login(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function authListener(callback) {
  onAuthStateChanged(auth, user => {
    if (user) callback(user);
    else location.reload();
  });
}

export function showLoggedInUser(user) {
  const welcomeText = document.getElementById('welcomeUser');
  if (welcomeText) welcomeText.textContent = `Logged in as: ${user.email}`;

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await signOut(auth);
    });
  }
}

// === FIREBASE WRITE MODULE ===
export function saveWeddingTask(taskValue, userEmail) {
  const taskId = Date.now();
  return set(ref(db, `wedding-tasks/${taskId}`), {
    task: taskValue,
    createdBy: userEmail,
    timestamp: new Date().toISOString()
  });
}

// === FIREBASE REALTIME LISTENER MODULE ===
export function initWeddingTaskListener() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  onValue(ref(db, 'wedding-tasks'), (snapshot) => {
    taskList.innerHTML = "";
    const data = snapshot.val();
    for (let key in data) {
      const item = data[key];
      const li = document.createElement("li");
      li.textContent = `${item.task} (by ${item.createdBy})`;
      taskList.appendChild(li);
    }
  });
}

// === FORM SUBMIT HANDLER ===
export function initWeddingFormListener(user) {
  const form = document.getElementById("weddingForm");
  const input = document.getElementById("task");

  if (!form || !input) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const taskValue = input.value.trim();
    if (!taskValue) return;
    await saveWeddingTask(taskValue, user.email);
    input.value = "";
  });
}

// ========== SETUP FORM SYNC MODULE ==========
export function initSetupFormSync(user) {
  const db = firebase.database();
  const userPath = `setup/${user.uid}`;
  const fields = ["groomName", "brideName", "weddingDate", "weddingVenue", "currency"];

  // 1. Load saved values
  db.ref(userPath).once("value").then(snapshot => {
    const data = snapshot.val() || {};
    fields.forEach(field => {
      const input = document.getElementById(field);
      if (input && data[field]) input.value = data[field];
    });
    loadTags("guestTags", "guestTagsInput", "guestTagsContainer");
    loadTags("accommodations", "accommodationInput", "accommodationContainer");
  });

  // 2. Save on input change
  fields.forEach(field => {
    const input = document.getElementById(field);
    if (input) {
      input.addEventListener("input", () => {
        db.ref(`${userPath}/${field}`).set(input.value);
      });
    }
  });

  // 3. Tag logic
  function loadTags(key, inputId, containerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);
    if (!input || !container) return;

    db.ref(`${userPath}/${key}`).once("value").then(snapshot => {
      const tags = snapshot.val() || [];
      container.innerHTML = "";
      tags.forEach(tag => appendTag(tag, key, container));
    });

    input.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        const value = input.value.trim();
        if (!value) return;
        appendTag(value, key, container);
        updateTags(key, containerId);
        input.value = "";
      }
    });
  }

  function appendTag(value, key, container) {
    const tag = document.createElement("div");
    tag.className = "tag bg-pink-400 text-white px-3 py-1 rounded-full mr-2 mb-2";
    tag.innerHTML = `${value} <span class="ml-2 cursor-pointer" onclick="this.parentElement.remove(); updateTags('${key}', '${container.id}')">×</span>`;
    container.appendChild(tag);
  }

  window.updateTags = (key, containerId) => {
    const container = document.getElementById(containerId);
    const tags = Array.from(container.querySelectorAll(".tag")).map(el => el.textContent.slice(0, -1).trim());
    db.ref(`${userPath}/${key}`).set(tags);
  };
}
// === DASHBOARD MODULE ===
export function initDashboardView(user) {
  const db = firebase.database();
  const uid = user.uid;

  // Setup Info: Names & Wedding Date
  db.ref(`setup/${uid}`).once("value").then(snapshot => {
    const data = snapshot.val() || {};
    document.getElementById('groomDisplay').textContent = data.groomName || 'Groom';
    document.getElementById('brideDisplay').textContent = data.brideName || 'Bride';
    document.getElementById('weddingDateDisplay').textContent = data.weddingDate || 'Not set';
  });

  // Countdown Timer
  db.ref(`setup/${uid}/weddingDate`).on("value", snapshot => {
    const date = snapshot.val();
    const countdown = document.getElementById('countdown');
    if (!date) {
      countdown.textContent = "Wedding date not set.";
      return;
    }
    const today = new Date();
    const wedding = new Date(date);
    const daysLeft = Math.ceil((wedding - today) / (1000 * 60 * 60 * 24));
    countdown.textContent = `${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining`;
  });

  // Budget Summary (from Contributions & Expenses)
  function updateBudget() {
    const contribRef = db.ref(`budgetContributions/${uid}`);
    const expenseRef = db.ref(`budgetExpenses/${uid}`);

    Promise.all([contribRef.once("value"), expenseRef.once("value")]).then(([cSnap, eSnap]) => {
      const contributions = Object.values(cSnap.val() || {});
      const expenses = Object.values(eSnap.val() || {});

      const totalBudget = contributions.reduce((sum, c) => sum + Number(c.amount || 0), 0);
      const totalPaid = expenses.reduce((sum, e) => sum + Number(e.paid || 0), 0);
      const totalToPay = expenses.reduce((sum, e) => sum + (Number(e.contract || 0) - Number(e.paid || 0)), 0);
      const budgetLeft = totalBudget - totalToPay;

      document.getElementById('totalBudget').textContent = `₱${totalBudget.toLocaleString()}`;
      document.getElementById('amountSpent').textContent = `₱${totalPaid.toLocaleString()}`;
      document.getElementById('remainingBudget').textContent = `₱${budgetLeft.toLocaleString()}`;
    });
  }

  // Guest List Summary
  db.ref(`guests/${uid}`).on("value", snapshot => {
    const guests = Object.values(snapshot.val() || {});
    const total = guests.length;
    const confirmed = guests.filter(g => g.rsvp === "Attending").length;
    const sent = guests.filter(g => g.invitation === "Sent").length;

    document.getElementById('totalGuests').textContent = total;
    document.getElementById('rsvpsReceived').textContent = confirmed;
    document.getElementById('pendingRsvps').textContent = total - confirmed;
  });

  // Checklist Task Progress
  db.ref(`checklist/${uid}`).on("value", snapshot => {
    const tasks = snapshot.val() || [];
    const taskList = Array.isArray(tasks) ? tasks : Object.values(tasks);
    const completed = taskList.filter(task => task.completed).length;
    const total = taskList.length;
    const pending = total - completed;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    document.getElementById('tasksCompleted').textContent = completed;
    document.getElementById('tasksPending').textContent = pending;
    document.getElementById('taskProgressBar').style.width = `${progress}%`;
  });

  // Vendor Summary
  db.ref(`vendors/${uid}`).on("value", snapshot => {
    const vendors = Object.values(snapshot.val() || {});
    const confirmed = vendors.filter(v => v.final === true).length;
    const totalTypes = [...new Set(vendors.map(v => v.type))].length;

    document.getElementById('vendorsConfirmed').textContent = confirmed;
    document.getElementById('vendorsPending').textContent = totalTypes - confirmed;
  });

  // Trigger refresh
  updateBudget();
}


// === TIMELINE MODULE ===
export function initTimelineTasks(user) {
  const db = firebase.database();
  const uid = user.uid;

  const tbody = document.getElementById("taskTableBody");
  if (!tbody) return;

  const taskRef = db.ref(`checklist/${uid}`);

  taskRef.on("value", snapshot => {
    const tasks = snapshot.val() || {};
    tbody.innerHTML = "";

    Object.entries(tasks).forEach(([id, task]) => {
      const row = document.createElement("tr");
      row.className = task.completed ? 'bg-purple-100' : 'bg-white';

      const priorityColor = {
        Low: 'text-green-600',
        Medium: 'text-yellow-600',
        High: 'text-red-600'
      }[task.priority] || 'text-gray-700';

      row.innerHTML = `
        <td class="p-2">${task.date}</td>
        <td class="p-2">${task.description}</td>
        <td class="p-2">${task.owner}</td>
        <td class="p-2 font-bold ${priorityColor}">${task.priority}</td>
        <td class="p-2">
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${id}')"/>
        </td>
        <td class="p-2">
          <button onclick="deleteTask('${id}')" class="text-red-500 hover:underline">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  });

  window.addTask = function () {
    const date = document.getElementById('taskDate').value;
    const description = document.getElementById('taskDesc').value;
    const owner = document.getElementById('taskOwner').value;
    const priority = document.getElementById('taskPriority').value;
    if (!date || !description) return alert('Please fill out all fields.');

    const id = Date.now().toString();
    const taskData = { date, description, owner, priority, completed: false };
    taskRef.child(id).set(taskData);

    document.getElementById('taskDate').value = '';
    document.getElementById('taskDesc').value = '';
  }

  window.toggleTask = function (id) {
    taskRef.child(id).once("value").then(snapshot => {
      const task = snapshot.val();
      taskRef.child(id).update({ completed: !task.completed });
    });
  }

  window.deleteTask = function (id) {
    if (confirm("Are you sure you want to delete this task?")) {
      taskRef.child(id).remove();
    }
  }
}

// === CALENDAR MODULE ===
export function initCalendar(user) {
  const db = firebase.database();
  const uid = user.uid;

  const calendar = document.getElementById('calendar');
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

function getTaskColor(task) {
  const style = {
    backgroundColor: '',
    color: ''
  };

  if (task.owner === 'Isaac') {
    style.backgroundColor = '#cbeef3'; // teal
    style.color = '#000000';           // black
  } else if (task.owner === 'Andrea') {
    style.backgroundColor = '#fb6f92'; // pink
    style.color = '#ffffff';           // white
  } else {
    switch (task.priority) {
      case 'High':
        style.backgroundColor = '#dc2626';
        style.color = '#ffffff';
        break;
      case 'Medium':
        style.backgroundColor = '#f59e0b';
        style.color = '#000000';
        break;
      case 'Low':
        style.backgroundColor = '#10b981';
        style.color = '#000000';
        break;
      default:
        style.backgroundColor = '#9ca3af'; // gray
        style.color = '#000000';
    }
  }

  return style;
}

  function renderYearOptions() {
    const yearSelect = document.getElementById('yearSelect');
    if (!yearSelect) return;
    yearSelect.innerHTML = '';
    for (let y = 2024; y <= 2034; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      yearSelect.appendChild(opt);
    }
    yearSelect.value = currentYear;
  }

  function renderCalendar(tasks) {
    if (!calendar) return;
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    document.getElementById('monthYear').textContent =
      `${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })} ${currentYear}`;

    calendar.innerHTML = '';

    for (let i = 0; i < firstDay; i++) {
      const spacer = document.createElement('div');
      spacer.className = 'calendar-day invisible';
      calendar.appendChild(spacer);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const ownerFilter = document.getElementById('filterOwner')?.value || '';
      const priorityFilter = document.getElementById('filterPriority')?.value || '';

      const dayTasks = tasks.filter(t =>
        t.date === fullDate &&
        (!ownerFilter || t.owner === ownerFilter) &&
        (!priorityFilter || t.priority === priorityFilter)
      );

      const div = document.createElement('div');
      div.className = 'calendar-day cursor-pointer';
      div.innerHTML = `<strong>${day}</strong>`;

      dayTasks.forEach(t => {
        const pill = document.createElement('div');
        pill.className = `task-pill mt-1`;
        const colorStyle = getTaskColor(t);
        pill.style.backgroundColor = colorStyle.backgroundColor;
        pill.style.color = colorStyle.color;
        pill.textContent = t.description;
        pill.title = `👤 ${t.owner} | ⚠️ ${t.priority} | ✅ ${t.completed ? 'Done' : 'Pending'}`;

        pill.onclick = () => {
          alert(
            `📅 ${t.date}\n📝 ${t.description}\n👤 ${t.owner}\n⚠️ ${t.priority}\n✅ ${t.completed ? 'Done' : 'Pending'}`
          );
        };

        div.appendChild(pill);
      });

      div.addEventListener('click', e => {
        if (e.target !== div) return;
        const desc = prompt(`Add a task for ${fullDate}:`);
        if (!desc) return;
        const owner = prompt("Who is assigned? (Isaac/Andrea)", "Isaac");
        const priority = prompt("Priority? (Low/Medium/High)", "Medium");

        const newTask = {
          date: fullDate,
          description: desc,
          owner: owner || 'Isaac',
          priority: priority || 'Medium',
          completed: false
        };

        const taskRef = firebase.database().ref(`checklist/${uid}`);
        const id = Date.now().toString();
        taskRef.child(id).set(newTask).then(() => fetchTasksAndRender());
      });

      calendar.appendChild(div);
    }
  }

  function fetchTasksAndRender() {
    db.ref(`checklist/${uid}`).once("value").then(snapshot => {
      const data = snapshot.val() || {};
      const taskArray = Object.values(data);
      renderCalendar(taskArray);
    });
  }

  // Event listeners
  document.getElementById('prevMonth')?.addEventListener('click', () => {
    currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
    if (currentMonth === 11) currentYear--;
    document.getElementById('yearSelect').value = currentYear;
    fetchTasksAndRender();
  });

  document.getElementById('nextMonth')?.addEventListener('click', () => {
    currentMonth = (currentMonth === 11) ? 0 : currentMonth + 1;
    if (currentMonth === 0) currentYear++;
    document.getElementById('yearSelect').value = currentYear;
    fetchTasksAndRender();
  });

  document.getElementById('yearSelect')?.addEventListener('change', e => {
    currentYear = parseInt(e.target.value);
    fetchTasksAndRender();
  });

  document.getElementById('filterOwner')?.addEventListener('change', fetchTasksAndRender);
  document.getElementById('filterPriority')?.addEventListener('change', fetchTasksAndRender);

  renderYearOptions();
  fetchTasksAndRender();
}

export function initContactModule(user) {
  const db = firebase.database();
  const uid = user.uid;

  const contactRef = db.ref(`contacts/${uid}`);
  const vendorRef = db.ref(`vendors/${uid}`);
  const setupRef = db.ref(`setup/${uid}`);

  const contactTable = document.getElementById('contactTableBody');
  const vendorTable = document.getElementById('vendorTableBody');

  // === Inline Edit Handler ===
  const attachInlineEdit = (td, path, key, isPrice = false) => {
    td.setAttribute('contenteditable', 'true');
    td.classList.add('hover:underline', 'cursor-pointer');

    td.addEventListener('focus', () => {
      if (isPrice) {
        td.innerText = td.innerText.replace(/[₱,]/g, '').trim();
      }
    });

    td.addEventListener('blur', () => {
      let newValue = td.innerText.trim();
      if (isPrice) {
        const num = parseFloat(newValue.replace(/[^\d.]/g, '')) || 0;
        firebase.database().ref(path).child(key).set(num);
        td.innerText = `₱${num.toLocaleString()}`;
      } else {
        firebase.database().ref(path).child(key).set(newValue);
      }
    });

    td.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        td.blur();
      }
    });
  };

  // === Add Contact ===
  window.addContact = () => {
    const name = document.getElementById('contactName').value.trim();
    const relationship = document.getElementById('relationship').value.trim();
    const contact1 = document.getElementById('contact1').value.trim();
    const contact2 = document.getElementById('contact2').value.trim();
    const email = document.getElementById('email').value.trim();

    if (!name || !relationship || !contact1) {
      alert("Please fill out Name, Relationship, and Contact 1.");
      return;
    }

    const id = Date.now().toString();
    contactRef.child(id).set({ name, relationship, contact1, contact2, email });

    document.getElementById('contactName').value = '';
    document.getElementById('relationship').value = '';
    document.getElementById('contact1').value = '';
    document.getElementById('contact2').value = '';
    document.getElementById('email').value = '';
  };

  // === Add Vendor ===
  window.addVendorContact = () => {
    const type = document.getElementById('vendorType').value.trim();
    const name = document.getElementById('vendorName').value.trim();
    const contact = document.getElementById('vendorContact').value.trim();
    const email = document.getElementById('vendorEmail').value.trim();
    const pkg = document.getElementById('vendorPackage').value.trim();
    const price = parseFloat(document.getElementById('vendorPrice').value.trim());

    if (!type || !name || !contact || isNaN(price)) {
      alert("Please fill out all required vendor fields including price.");
      return;
    }

    const id = Date.now().toString();
    vendorRef.child(id).set({ type, name, contact, email, package: pkg, price });

    document.getElementById('vendorType').value = '';
    document.getElementById('vendorName').value = '';
    document.getElementById('vendorContact').value = '';
    document.getElementById('vendorEmail').value = '';
    document.getElementById('vendorPackage').value = '';
    document.getElementById('vendorPrice').value = '';
  };

  // === Delete Handlers ===
  window.deleteContact = id => {
    if (confirm("Delete this contact?")) contactRef.child(id).remove();
  };

  window.deleteVendor = id => {
    if (confirm("Delete this vendor?")) vendorRef.child(id).remove();
  };

  // === Render Contact Table ===
  contactRef.on('value', snap => {
    const data = snap.val() || {};
    contactTable.innerHTML = '';

    Object.entries(data).forEach(([id, c]) => {
      const row = document.createElement('tr');

      const fields = ['name', 'relationship', 'contact1', 'contact2', 'email'];
      fields.forEach(field => {
        const td = document.createElement('td');
        td.className = 'p-2';
        td.innerText = c[field] || '';
        attachInlineEdit(td, `contacts/${uid}/${id}`, field);
        row.appendChild(td);
      });

      const delTd = document.createElement('td');
      delTd.className = 'p-2 text-center';
      delTd.innerHTML = `<i class="fas fa-trash-alt text-[#cdb4db] cursor-pointer" onclick="deleteContact('${id}')"></i>`;
      row.appendChild(delTd);

      contactTable.appendChild(row);
    });
  });

  // === Render Vendor Table ===
  vendorRef.on('value', snap => {
    const data = snap.val() || {};
    vendorTable.innerHTML = '';

    Object.entries(data).forEach(([id, v]) => {
      const row = document.createElement('tr');

      const fields = ['type', 'name', 'contact', 'email', 'package'];
      fields.forEach(field => {
        const td = document.createElement('td');
        td.className = 'p-2';
        td.innerText = v[field] || '';
        attachInlineEdit(td, `vendors/${uid}/${id}`, field);
        row.appendChild(td);
      });

      const priceTd = document.createElement('td');
      priceTd.className = 'p-2 text-right';
      priceTd.innerText = `₱${Number(v.price || 0).toLocaleString()}`;
      attachInlineEdit(priceTd, `vendors/${uid}/${id}`, 'price', true);
      row.appendChild(priceTd);

      const delTd = document.createElement('td');
      delTd.className = 'p-2 text-center';
      delTd.innerHTML = `<i class="fas fa-trash-alt text-[#cdb4db] cursor-pointer" onclick="deleteVendor('${id}')"></i>`;
      row.appendChild(delTd);

      vendorTable.appendChild(row);
    });
  });

  // === Populate Dropdowns ===
  setupRef.once('value').then(snap => {
    const setup = snap.val() || {};
    const accoms = setup.accommodations || [];
    const tags = setup.guestTags || [];

    const vendorDropdown = document.getElementById('vendorType');
    const relDropdown = document.getElementById('relationship');

    if (vendorDropdown) {
      vendorDropdown.innerHTML = '<option value="">Select Vendor Type</option>';
      accoms.forEach(tag => {
        const opt = document.createElement('option');
        opt.value = tag;
        opt.textContent = tag;
        vendorDropdown.appendChild(opt);
      });
    }

    if (relDropdown) {
      relDropdown.innerHTML = '<option value="">Select Relationship</option>';
      tags.forEach(tag => {
        const opt = document.createElement('option');
        opt.value = tag;
        opt.textContent = tag;
        relDropdown.appendChild(opt);
      });
    }
  });
}


// === CHECKLIST MODULE ===
export function initChecklistModule(user) {
  const db = firebase.database();
  const uid = user.uid;
  const checklistRef = db.ref(`checklistItems/${uid}`);
  const container = document.getElementById('checklistContainer');
  if (!container) return;

  const categories = [
    "Legalities", "Family & Friends", "Outfits & Attire", "Others",
    "Flowers & Decor", "Ceremony", "Reception", "Linen & Furniture",
    "Stationery", "Photography", "Bridal Essentials", "Groom Essentials",
    "Emergency Kits", "Name Changing Checklist"
  ];

  function renderChecklist(data) {
    container.innerHTML = '';
    categories.forEach(category => {
      const section = document.createElement('section');
      section.className = 'bg-[#ffc8dd] p-4 rounded-lg shadow';

      const title = document.createElement('h3');
      title.className = 'text-xl font-semibold mb-2 text-center';
      title.textContent = category;

      const list = document.createElement('ul');
      list.className = 'space-y-1';
      const items = data[category] || [];

      items.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = item.done;
        checkbox.className = 'mr-2';
        checkbox.onchange = () => {
          data[category][index].done = checkbox.checked;
          checklistRef.set(data);
        };

        const span = document.createElement('span');
        span.textContent = item.name;
        if (item.done) span.classList.add('line-through', 'text-green-600');

        const removeBtn = document.createElement('button');
        removeBtn.textContent = '✕';
        removeBtn.className = 'text-red-500 font-bold ml-2';
        removeBtn.onclick = () => {
          data[category].splice(index, 1);
          checklistRef.set(data);
        };

        const itemContainer = document.createElement('div');
        itemContainer.className = 'flex items-center';
        itemContainer.appendChild(checkbox);
        itemContainer.appendChild(span);

        li.appendChild(itemContainer);
        li.appendChild(removeBtn);
        list.appendChild(li);
      });

      const input = document.createElement('input');
      input.placeholder = `Add to ${category}`;
      input.className = 'mt-2 w-full p-1 border rounded bg-white';
      input.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const value = input.value.trim();
          if (!value) return;
          data[category] = data[category] || [];
          data[category].push({ name: value, done: false });
          checklistRef.set(data);
          input.value = '';
        }
      };

      section.appendChild(title);
      section.appendChild(list);
      section.appendChild(input);
      container.appendChild(section);
    });
  }

  // Load initial data from Firebase
  checklistRef.on('value', snapshot => {
    const data = snapshot.val() || {};
    renderChecklist(data);
  });
}

export function initBudgetModule(user) {
  const db = firebase.database();
  const uid = user.uid;

  const contribRef = db.ref(`budgetContributions/${uid}`);
  const expenseRef = db.ref(`budgetExpenses/${uid}`);
  const accomRef = db.ref(`setup/${uid}/accommodations`);

  const contributionList = document.getElementById('contributionList');
  const expenseTable = document.getElementById('expenseTableBody');
  const vendorTypeSelect = document.getElementById('expenseVendorType');

  if (!contributionList || !expenseTable || !vendorTypeSelect) return;

  // === Editable Cell Helper
  const attachInlineEdit = (td, path, key, isPrice = false) => {
    td.setAttribute('contenteditable', 'true');
    td.classList.add('hover:underline', 'cursor-pointer');

    td.addEventListener('focus', () => {
      if (isPrice) td.innerText = td.innerText.replace(/[₱,]/g, '').trim();
    });

    td.addEventListener('blur', () => {
      let val = td.innerText.trim();
      if (isPrice) {
        const num = parseFloat(val.replace(/[^\d.]/g, '')) || 0;
        firebase.database().ref(path).child(key).set(num);
        td.innerText = `₱${num.toLocaleString()}`;
      } else {
        firebase.database().ref(path).child(key).set(val);
      }
    });

    td.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        td.blur();
      }
    });
  };

  // === Add contribution
  window.addContributor = () => {
    const name = document.getElementById('contributorName').value.trim();
    const amount = parseFloat(document.getElementById('contributionAmount').value.trim());
    if (!name || isNaN(amount)) return alert('Fill in name and valid amount.');

    const id = Date.now().toString();
    contribRef.child(id).set({ name, amount });

    document.getElementById('contributorName').value = '';
    document.getElementById('contributionAmount').value = '';
  };

  // === Add expense
  window.addExpense = () => {
    const date = document.getElementById('expenseDate').value;
    const vendorType = document.getElementById('expenseVendorType').value;
    const vendor = document.getElementById('expenseVendor').value.trim();
    const paidBy = document.getElementById('expensePaidBy').value;
    const contract = parseFloat(document.getElementById('expenseContract').value.trim());
    const paid = parseFloat(document.getElementById('expensePaid').value.trim());

    if (!date || !vendorType || !vendor || isNaN(contract) || isNaN(paid)) {
      return alert('Fill in all fields correctly.');
    }

    const id = Date.now().toString();
    expenseRef.child(id).set({ date, vendorType, vendor, paidBy, contract, paid });

    document.getElementById('expenseDate').value = '';
    document.getElementById('expenseVendorType').value = '';
    document.getElementById('expenseVendor').value = '';
    document.getElementById('expensePaidBy').value = 'Isaac';
    document.getElementById('expenseContract').value = '';
    document.getElementById('expensePaid').value = '';
  };

  // === Delete expense
  window.deleteBudgetItem = id => {
    if (confirm('Delete this expense?')) expenseRef.child(id).remove();
  };

  // === Refresh all data
  function refreshBudget() {
    Promise.all([contribRef.once('value'), expenseRef.once('value')]).then(([contribSnap, expenseSnap]) => {
      const contributions = contribSnap.val() || {};
      const expenses = expenseSnap.val() || {};

      // Contributions
      contributionList.innerHTML = '';
      let budgetTotal = 0;
      Object.entries(contributions).forEach(([id, c]) => {
        const row = document.createElement('div');
        row.className = 'flex justify-between bg-[#ffe5ec] p-2 rounded gap-4';

        const nameEl = document.createElement('span');
        nameEl.innerText = c.name || '';
        attachInlineEdit(nameEl, `budgetContributions/${uid}/${id}`, 'name');

        const amtEl = document.createElement('span');
        const amount = Number(c.amount || 0);
        budgetTotal += amount;
        amtEl.innerText = `₱${amount.toLocaleString()}`;
        attachInlineEdit(amtEl, `budgetContributions/${uid}/${id}`, 'amount', true);

        row.appendChild(nameEl);
        row.appendChild(amtEl);
        contributionList.appendChild(row);
      });
      document.getElementById('weddingBudgetTotal').textContent = `₱${budgetTotal.toLocaleString()}`;

      // Expenses
      let paidTotal = 0;
      let totalBalance = 0;
      expenseTable.innerHTML = '';
      Object.entries(expenses).forEach(([id, e]) => {
        const balance = Number(e.contract || 0) - Number(e.paid || 0);
        paidTotal += Number(e.paid || 0);
        totalBalance += balance;

        const row = document.createElement('tr');

        const fields = [
          { key: 'date', value: e.date },
          { key: 'vendorType', value: e.vendorType },
          { key: 'vendor', value: e.vendor },
          { key: 'paidBy', value: e.paidBy },
          { key: 'contract', value: `₱${Number(e.contract).toLocaleString()}`, isPrice: true },
          { key: 'paid', value: `₱${Number(e.paid).toLocaleString()}`, isPrice: true }
        ];

        fields.forEach(f => {
          const td = document.createElement('td');
          td.className = f.key === 'contract' || f.key === 'paid' ? 'p-2 text-right' : 'p-2';
          td.innerText = f.value || '';
          attachInlineEdit(td, `budgetExpenses/${uid}/${id}`, f.key, f.isPrice || false);
          row.appendChild(td);
        });

        const balTd = document.createElement('td');
        balTd.className = 'p-2 text-right';
        balTd.innerText = `₱${balance.toLocaleString()}`;
        row.appendChild(balTd);

        const delTd = document.createElement('td');
        delTd.className = 'p-2 text-center cursor-pointer';
        delTd.style.color = '#cdb4db';
        delTd.innerText = 'Delete';
        delTd.onclick = () => deleteBudgetItem(id);
        row.appendChild(delTd);

        expenseTable.appendChild(row);
      });

      // Summary
      document.getElementById('budgetPaid').textContent = `₱${paidTotal.toLocaleString()}`;
      document.getElementById('budgetLeftToPay').textContent = `₱${totalBalance.toLocaleString()}`;
      document.getElementById('budgetLeftFromBudget').textContent = `₱${(budgetTotal - totalBalance).toLocaleString()}`;
    });
  }

  // === Populate Vendor Type Dropdown
  function populateVendorTypes() {
    accomRef.once('value').then(snapshot => {
      const types = snapshot.val() || [];
      vendorTypeSelect.innerHTML = '<option value="">Select Vendor Type</option>';
      types.forEach(type => {
        const opt = document.createElement('option');
        opt.value = type;
        opt.textContent = type;
        vendorTypeSelect.appendChild(opt);
      });
    });
  }

  contribRef.on('value', refreshBudget);
  expenseRef.on('value', refreshBudget);
  populateVendorTypes();
}

// === VENDORS MODULE ===
export function initVendorsModule(user) {
  const db = firebase.database();
  const uid = user.uid;

  const contactRef = db.ref(`vendors/${uid}`);
  const summaryTable = document.getElementById('vendorSummaryBody');
  const vendorTypeFilter = document.getElementById('vendorTypeFilter');
  const vendorTableContainer = document.getElementById('vendorTableContainer');

  if (!summaryTable || !vendorTypeFilter || !vendorTableContainer) return;

  // === Render Summary Table & Vendor Type Filter
  function refreshSummaryAndFilter() {
    contactRef.once('value').then(snapshot => {
      const data = snapshot.val() || {};
      const grouped = {};

      // Group vendors by type
      Object.entries(data).forEach(([id, v]) => {
        if (!v.type) return;
        if (!grouped[v.type]) grouped[v.type] = [];
        grouped[v.type].push({ ...v, id });
      });

      summaryTable.innerHTML = '';
      vendorTypeFilter.innerHTML = '<option value="">Select Vendor Type</option>';

      Object.entries(grouped).forEach(([type, vendors]) => {
        const selected = vendors.find(v => v.final === true);
        const amount = selected ? Number(selected.price || 0) : 0;

        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="p-2">${type}</td>
          <td class="p-2 text-right">₱${amount.toLocaleString()}</td>
        `;
        summaryTable.appendChild(row);

        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        vendorTypeFilter.appendChild(option);
      });
    });
  }

  // === Final Choice Selector
  window.selectFinalChoice = (type, id) => {
    contactRef.once('value').then(snapshot => {
      const vendors = snapshot.val() || {};
      const updates = {};

      Object.entries(vendors).forEach(([key, v]) => {
        if (v.type === type) {
          updates[`${key}/final`] = key === id;
        }
      });

      contactRef.update(updates).then(() => {
        refreshSummaryAndFilter();
        refreshVendorTable(type);
      });
    });
  };

  // === Show Vendor Table Based on Type
  function refreshVendorTable(type) {
    contactRef.once('value').then(snapshot => {
      const data = snapshot.val() || {};
      const filtered = Object.entries(data).filter(([_, v]) => v.type === type);

      const table = document.createElement('table');
      table.className = 'w-full table-auto text-sm border mt-2';
      table.innerHTML = `
        <thead class="bg-pink-200">
          <tr>
            <th class="p-2">Final</th>
            <th class="p-2">Name</th>
            <th class="p-2">Contact</th>
            <th class="p-2">Email</th>
            <th class="p-2 text-right">Contract Price</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(([id, v]) => `
            <tr>
              <td class="p-2 text-center">
                <input type="radio" name="final_${type}" ${v.final ? 'checked' : ''} onclick="selectFinalChoice('${type}', '${id}')" />
              </td>
              <td class="p-2">${v.name || ''}</td>
              <td class="p-2">${v.contact || ''}</td>
              <td class="p-2">${v.email || ''}</td>
              <td class="p-2 text-right">₱${Number(v.price || 0).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      `;

      vendorTableContainer.innerHTML = '';
      vendorTableContainer.appendChild(table);
    });
  }

  // === Change Event for Dropdown
  vendorTypeFilter.addEventListener('change', () => {
    const selected = vendorTypeFilter.value;
    if (selected) refreshVendorTable(selected);
    else vendorTableContainer.innerHTML = '';
  });

  // === Init
  refreshSummaryAndFilter();
}


// === GUEST LIST MODULE ========================================================================================================
export function initGuestListModule(user) {
  const db = firebase.database();
  const uid = user.uid;
  const userPath = `setup/${uid}`;
  const guestRef = db.ref(`guests/${uid}`);

  const guestTableBody = document.getElementById('guestTableBody');
  const addGuestBtn = document.getElementById('addGuestBtn');
  const filterModal = document.getElementById('filterModal');

  let guestTags = [];
  let guestList = {};

  // Load guestTags from Setup
  db.ref(`${userPath}/guestTags`).once('value').then(snapshot => {
    guestTags = snapshot.val() || [];
    populateFilterOptions();
  });

  // Load existing guests
  guestRef.on('value', snapshot => {
    guestList = snapshot.val() || {};
    renderGuestList();
  });

  function createDropdown(options, value = '') {
    const select = document.createElement('select');
    select.className = 'border p-1 w-full rounded bg-white';
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt;
      option.textContent = opt;
      if (opt === value) option.selected = true;
      select.appendChild(option);
    });
    return select;
  }

  function createTextInput(value = '', saveFn) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'border p-1 w-full rounded bg-white';
    input.value = value;
    input.onblur = () => saveFn(input.value);
    return input;
  }

  function renderGuestList() {
    if (!guestTableBody) return;
    guestTableBody.innerHTML = '';

    const filterTag = document.getElementById('filterTag')?.value || '';
    const filterRSVP = document.getElementById('filterRSVP')?.value || '';
    const filterTransport = document.getElementById('filterTransport')?.value || '';
    const filterInvitation = document.getElementById('filterInvitation')?.value || '';
    const filterAccommodation = document.getElementById('filterAccommodation')?.value || '';

    Object.entries(guestList).forEach(([id, guest], index) => {
      if (
        (filterTag && guest.tag !== filterTag) ||
        (filterRSVP && guest.rsvp !== filterRSVP) ||
        (filterTransport && guest.transport !== filterTransport) ||
        (filterInvitation && guest.invitation !== filterInvitation) ||
        (filterAccommodation && guest.accommodation !== filterAccommodation)
      ) return;

      const row = document.createElement('tr');

      const idCell = document.createElement('td');
      idCell.className = 'p-2 border text-center';
      idCell.textContent = index + 1;

      const nameInput = createTextInput(guest.name, val => saveGuest(id, { ...guest, name: val }));
      const tagDropdown = createDropdown(guestTags, guest.tag);
      tagDropdown.onchange = () => saveGuest(id, { ...guest, tag: tagDropdown.value });

      const inviteDropdown = createDropdown(['Sent', 'Not Sent'], guest.invitation);
      inviteDropdown.onchange = () => saveGuest(id, { ...guest, invitation: inviteDropdown.value });

      const rsvpDropdown = createDropdown(['Attending', "Won't Attend", 'No Response'], guest.rsvp);
      rsvpDropdown.onchange = () => saveGuest(id, { ...guest, rsvp: rsvpDropdown.value });

      const accomDropdown = createDropdown(['Hotel', 'No Hotel'], guest.accommodation);
      accomDropdown.onchange = () => saveGuest(id, { ...guest, accommodation: accomDropdown.value });

      const transportDropdown = createDropdown(['Van Rental', 'Own Mode'], guest.transport);
      transportDropdown.onchange = () => saveGuest(id, { ...guest, transport: transportDropdown.value });

      const addressInput = createTextInput(guest.address, val => saveGuest(id, { ...guest, address: val }));
      const phoneInput = createTextInput(guest.phone, val => saveGuest(id, { ...guest, phone: val }));
      const emailInput = createTextInput(guest.email, val => saveGuest(id, { ...guest, email: val }));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '✕';
      deleteBtn.className = 'text-red-500 font-bold';
      deleteBtn.onclick = () => {
        if (confirm("Delete this guest?")) guestRef.child(id).remove();
      };

      const cells = [idCell, nameInput, tagDropdown, inviteDropdown, rsvpDropdown,
        accomDropdown, transportDropdown, addressInput, phoneInput, emailInput].map(el => {
        const td = document.createElement('td');
        td.className = 'p-2 border';
        td.appendChild(el);
        return td;
      });

      const deleteCell = document.createElement('td');
      deleteCell.className = 'text-center p-2 border';
      deleteCell.appendChild(deleteBtn);

      row.append(...cells, deleteCell);
      row.className = 'border border-gray-300';
      guestTableBody.appendChild(row);
    });

    updateSummary();
  }

  function updateSummary() {
    const guests = Object.values(guestList || {});
    document.getElementById('totalGuest').textContent = guests.length;
    document.getElementById('totalInvSent').textContent = guests.filter(g => g.invitation === 'Sent').length;
    document.getElementById('totalConfirmed').textContent = guests.filter(g => g.rsvp === 'Attending').length;
    document.getElementById('totalHotel').textContent = guests.filter(g => g.accommodation === 'Hotel').length;
    document.getElementById('totalTransport').textContent = guests.filter(g => g.transport === 'Van Rental').length;
  }

  function populateFilterOptions() {
    const tagSelect = document.getElementById('filterTag');
    const accomSelect = document.getElementById('filterAccommodation');

    if (tagSelect) {
      tagSelect.innerHTML = '<option value="">All Guest Tags</option>';
      guestTags.forEach(tag => {
        const opt = document.createElement('option');
        opt.value = tag;
        opt.textContent = tag;
        tagSelect.appendChild(opt);
      });
    }

    if (accomSelect) {
      accomSelect.innerHTML = '<option value="">All Accommodations</option>';
      ['Hotel', 'No Hotel'].forEach(a => {
        const opt = document.createElement('option');
        opt.value = a;
        opt.textContent = a;
        accomSelect.appendChild(opt);
      });
    }
  }

  function saveGuest(id, guestData) {
    guestRef.child(id).set(guestData);
  }

  addGuestBtn?.addEventListener('click', () => {
    const id = Date.now().toString();
    const newGuest = {
      name: '', tag: guestTags[0] || '',
      invitation: 'Not Sent', rsvp: 'No Response',
      accommodation: 'No Hotel',
      transport: 'Own Mode',
      address: '', phone: '', email: ''
    };
    guestRef.child(id).set(newGuest);
  });

  // Filter modal logic
  document.getElementById('filterGuestListBtn')?.addEventListener('click', () => {
    populateFilterOptions();
    filterModal?.classList.remove('hidden');
  });

  document.getElementById('applyFilterBtn')?.addEventListener('click', () => {
    filterModal?.classList.add('hidden');
    renderGuestList();
  });

  document.getElementById('clearFilterBtn')?.addEventListener('click', () => {
    ['filterTag', 'filterRSVP', 'filterTransport', 'filterInvitation', 'filterAccommodation'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    filterModal?.classList.add('hidden');
    renderGuestList();
  });
}
