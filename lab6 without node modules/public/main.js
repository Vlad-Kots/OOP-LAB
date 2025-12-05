let currentDisplayedUsers = [];
let isEditMode = false;
let currentSort = { field: null, order: 'asc' };

document.addEventListener('DOMContentLoaded', init);

function init() {
    const mainDiv = document.getElementById('main');
    const header = document.createElement('header');
    
    ['User Rating', 'News', 'Contacts', 'About', 'Gallery'].forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item;
        btn.className = 'nav-btn';
        btn.onclick = () => {
            document.getElementById('content-title').textContent = item;
            const contentDiv = document.getElementById('content');
            item === 'Gallery' ? loadGallery(contentDiv) : resetContentPanel(contentDiv);
        };
        header.appendChild(btn);
    });
    mainDiv.appendChild(header);

    const mainContainer = document.createElement('main');
    mainContainer.id = 'main-container';
    const leftPanel = createPanel('leftPanel');
    const content = createPanel('content');
    const rightPanel = createPanel('rightPanel');

    mainContainer.append(leftPanel, content, rightPanel);
    mainDiv.appendChild(mainContainer);

    const footer = document.createElement('footer');
    footer.innerHTML = `<div style="float:left;"><strong>Current users:</strong> <span id="current-users-count">0</span></div><div style="float:right;"><strong>New users:</strong> <span id="new-users-list">Loading...</span></div>`;
    mainDiv.appendChild(footer);
    
    fetch('/api/new-users').then(res => res.json()).then(users => {
        document.getElementById('new-users-list').textContent = users.map(u => `${u.firstname} (${u.joinedDate})`).join(', ');
    });

    const contentTitle = document.createElement('h2');
    contentTitle.id = 'content-title';
    contentTitle.textContent = 'User Rating';
    content.insertBefore(contentTitle, content.firstChild);

    setTimeout(() => {
        document.querySelectorAll('.loader').forEach(el => el.remove());
        resetContentPanel(content);
        setupLeftPanel(leftPanel);
        setupRightPanel(rightPanel);
    }, 1000);
}

function createPanel(id) {
    const div = document.createElement('div');
    div.id = id;
    div.innerHTML = '<div class="loader"></div>';
    return div;
}

function setupLeftPanel(panel) {
    const searchInput = document.createElement('input');
    searchInput.placeholder = 'Search...';
    const searchBtn = document.createElement('button');
    searchBtn.textContent = 'Find';
    searchBtn.onclick = () => {
        const query = searchInput.value.toLowerCase();
        document.querySelectorAll('#users-table tbody tr').forEach(row => {
            row.classList.remove('highlight');
            if (query !== '' && row.innerText.toLowerCase().includes(query)) row.classList.add('highlight');
        });
    };
    const weatherDiv = document.createElement('div');
    weatherDiv.className = 'weather-widget';
    weatherDiv.innerHTML = `<h3>Weather (Kyiv)</h3><p id="weather-info">Loading...</p>`;
    panel.append(searchInput, searchBtn, document.createElement('hr'), weatherDiv);
    updateWeather();
    setInterval(updateWeather, 60000);
}

function setupRightPanel(panel) {
    const scoreDiv = document.createElement('div');
    scoreDiv.id = 'total-score';
    scoreDiv.innerHTML = `<strong>Total Score:</strong> 0`;
    const editDiv = document.createElement('div');
    editDiv.style.marginTop = '20px';
    const editCheckbox = document.createElement('input');
    editCheckbox.type = 'checkbox';
    editCheckbox.id = 'edit-check';
    editCheckbox.onchange = (e) => {
        isEditMode = e.target.checked;
        if (document.getElementById('users-table')) renderTable(document.getElementById('content'));
    };
    editDiv.append(editCheckbox, Object.assign(document.createElement('label'), { htmlFor: 'edit-check', textContent: ' Edit table' }));
    panel.append(scoreDiv, editDiv);
}

function resetContentPanel(content) {
    while (content.childNodes.length > 1) content.removeChild(content.lastChild);
    const noUsersMsg = document.createElement('p');
    noUsersMsg.textContent = 'No users';
    content.appendChild(noUsersMsg);
    const btn = document.createElement('button');
    btn.textContent = 'Get Users';
    btn.onclick = async () => {
        noUsersMsg.textContent = 'Loading...';
        await loadUsersFromServer();
        noUsersMsg.style.display = 'none';
    };
    content.appendChild(btn);
}

async function loadUsersFromServer() {
    const { field, order } = currentSort;
    let url = '/api/users' + (field ? `?sortBy=${field}&order=${order}` : '');
    try {
        const res = await fetch(url);
        currentDisplayedUsers = await res.json();
        renderTable(document.getElementById('content'));
        updateFooterCount();
        updateScoreSum();
    } catch (err) { console.error(err); }
}

async function loadGallery(container) {
    while (container.childNodes.length > 1) container.removeChild(container.lastChild);
    const grid = document.createElement('div');
    grid.className = 'gallery-grid';
    container.appendChild(grid);
    try {
        const images = await (await fetch('/api/gallery')).json();
        images.forEach(imgName => {
            const img = document.createElement('img');
            img.src = `/gallery/${imgName}`;
            grid.appendChild(img);
        });
    } catch (err) { grid.innerText = "Error loading gallery"; }
}

async function updateWeather() {
    try {
        const data = await (await fetch('/weather')).json();
        const info = document.getElementById('weather-info');
        if (info) info.innerHTML = `Temp: ${data.temperature}°C`;
    } catch (err) { console.error(err); }
}

function renderTable(container) {
    const oldTable = document.getElementById('users-table');
    if (oldTable) oldTable.remove();
    const table = document.createElement('table');
    table.id = 'users-table';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    [{key:'firstname',name:'Firstname'}, {key:'lastname',name:'Lastname'}, {key:'score',name:'Score'}, {key:'joinedDate',name:'Date'}].forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.name;
        if (['firstname','lastname','joinedDate'].includes(col.key)) {
            if (currentSort.field === col.key) th.textContent += currentSort.order === 'asc' ? ' ▲' : ' ▼';
            th.onclick = () => {
                currentSort.order = (currentSort.field === col.key && currentSort.order === 'asc') ? 'desc' : 'asc';
                currentSort.field = col.key;
                loadUsersFromServer();
            };
        }
        headerRow.appendChild(th);
    });
    if (isEditMode) headerRow.appendChild(Object.assign(document.createElement('th'), { textContent: 'Action' }));
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    currentDisplayedUsers.forEach((user, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${user.firstname}</td><td>${user.lastname}</td><td>${user.score}</td><td>${user.joinedDate}</td>`;
        if (isEditMode) {
            const btn = document.createElement('button');
            btn.textContent = 'Delete';
            btn.style.cssText = 'background-color:#ff4444;color:white;';
            btn.onclick = () => {
                currentDisplayedUsers.splice(index, 1);
                renderTable(container);
                updateScoreSum();
                updateFooterCount();
            };
            const td = document.createElement('td');
            td.appendChild(btn);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    const title = document.getElementById('content-title');
    container.insertBefore(table, title.nextSibling || null);
}

function updateScoreSum() {
    const el = document.getElementById('total-score');
    if (el) el.innerHTML = `<strong>Total Score:</strong> ${currentDisplayedUsers.reduce((s, u) => s + u.score, 0)}`;
}

function updateFooterCount() {
    const el = document.getElementById('current-users-count');
    if (el) el.textContent = currentDisplayedUsers.length;
}