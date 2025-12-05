let currentDisplayedUsers = [];
let isEditMode = false;
let currentSort = { field: null, order: 'asc' };

let activeEventSource = null;
let activeWebSocket = null;
let chatUser = null;

document.addEventListener('DOMContentLoaded', init);

function init() {
    const mainDiv = document.getElementById('main');

    const header = document.createElement('header');
    header.id = 'header';
    
    const navItems = [
        { name: 'User Rating' },
        { name: 'News' },
        { name: 'Contacts' },
        { name: 'About' },
        { name: 'Gallery' },
        { name: 'Chat (SSE)' },
        { name: 'Exchange (WS)' }
    ];

    navItems.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item.name;
        btn.className = 'nav-btn';
        
        btn.onclick = () => {
            const contentDiv = document.getElementById('content');
            const title = document.getElementById('content-title');
            if (title) title.textContent = item.name;
            
            closeActiveConnections();
            contentDiv.innerHTML = ''; 

            if (!document.getElementById('content-title')) {
                const newTitle = document.createElement('h2');
                newTitle.id = 'content-title';
                newTitle.textContent = item.name;
                contentDiv.appendChild(newTitle);
            }

            if (item.name === 'Gallery') {
                loadGallery(contentDiv);
            } else if (item.name === 'Chat (SSE)') {
                loadChat(contentDiv);
            } else if (item.name === 'Exchange (WS)') {
                loadExchange(contentDiv);
            } else if (item.name === 'User Rating') {
                loadUserRating(contentDiv);
            } else {
                contentDiv.innerHTML += `<p>Content for ${item.name}...</p>`;
            }
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
    footer.innerHTML = `
        <div style="float:left; width: 45%;">
            <strong>Current users:</strong> <span id="current-users-count">0</span>
        </div>
        <div style="float:right; width: 45%;">
            <strong>New users:</strong> <span id="new-users-list">Loading...</span>
        </div>
    `;
    mainDiv.appendChild(footer);
    
    fetch('/api/new-users')
        .then(res => res.json())
        .then(users => {
            document.getElementById('new-users-list').textContent = 
                users.map(u => `${u.firstname} (${u.joinedDate})`).join(', ');
        });

    setTimeout(() => {
        document.querySelectorAll('.loader').forEach(el => el.remove());
        const contentDiv = document.getElementById('content');
        
        const title = document.createElement('h2');
        title.id = 'content-title';
        title.textContent = 'User Rating';
        contentDiv.insertBefore(title, contentDiv.firstChild);
        
        loadUserRating(contentDiv);
        setupLeftPanel(leftPanel);
        setupRightPanel(rightPanel);
    }, 1000);
}

function closeActiveConnections() {
    if (activeEventSource) {
        activeEventSource.close();
        activeEventSource = null;
    }
    if (activeWebSocket) {
        activeWebSocket.close();
        activeWebSocket = null;
    }
}

function loadUserRating(container) {
    const noUsersMsg = document.createElement('p');
    noUsersMsg.textContent = 'No users';
    container.appendChild(noUsersMsg);

    const getUsersBtn = document.createElement('button');
    getUsersBtn.textContent = 'Get Users';
    getUsersBtn.onclick = async () => {
        noUsersMsg.textContent = 'Loading...';
        await loadUsersFromServer();
        noUsersMsg.style.display = 'none';
    };
    container.appendChild(getUsersBtn);
}

function loadChat(container) {
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    
    if (!chatUser) {
        chatContainer.innerHTML = `
            <div id="login-screen">
                <p>Enter username to join:</p>
                <div class="input-group">
                    <input type="text" id="username-input">
                    <button id="join-btn">Join</button>
                </div>
            </div>
        `;
        container.appendChild(chatContainer);
        
        document.getElementById('join-btn').onclick = () => {
            const val = document.getElementById('username-input').value;
            if(val) {
                chatUser = val;
                container.innerHTML = '';
                const title = document.createElement('h2');
                title.textContent = 'Chat (SSE)';
                container.appendChild(title);
                loadChat(container); 
            }
        };
    } else {
        chatContainer.innerHTML = `
            <div id="chat-screen">
                <div id="messages-list"></div>
                <div class="input-group">
                    <input type="text" id="msg-input" placeholder="Message...">
                    <button id="send-btn">Send</button>
                </div>
            </div>
        `;
        container.appendChild(chatContainer);

        activeEventSource = new EventSource('/events');
        activeEventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            const list = document.getElementById('messages-list');
            if(list) {
                const div = document.createElement('div');
                div.className = 'message';
                div.innerHTML = `<strong>${data.username}</strong> <small>(${data.time})</small>: ${data.message}`;
                list.appendChild(div);
                list.scrollTop = list.scrollHeight;
            }
        };

        document.getElementById('send-btn').onclick = async () => {
            const inp = document.getElementById('msg-input');
            if(inp.value) {
                await fetch('/chat/send', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ username: chatUser, message: inp.value })
                });
                inp.value = '';
            }
        };
    }
}

function loadExchange(container) {
    const box = document.createElement('div');
    box.className = 'exchange-box';
    box.innerHTML = `
        <div class="price-display" id="price">Waiting...</div>
        <div class="wallet">
            <p>USD: <span id="usd">0.00</span></p>
            <p>Coins: <span id="crypto">0</span></p>
        </div>
        <div class="btn-group">
            <button class="btn-buy" id="btn-buy" disabled>BUY</button>
            <button class="btn-sell" id="btn-sell" disabled>SELL</button>
        </div>
    `;
    container.appendChild(box);

    activeWebSocket = new WebSocket('ws://' + window.location.host);
    
    activeWebSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'price-update') {
            const el = document.getElementById('price');
            if(el) el.innerText = data.price + ' $';
            
            const usdEl = document.getElementById('usd');
            if(usdEl) {
                const usd = parseFloat(usdEl.innerText);
                const btnBuy = document.getElementById('btn-buy');
                if(btnBuy) btnBuy.disabled = usd < parseFloat(data.price);
            }
        } 
        else if (data.type === 'balance-update') {
            const elUsd = document.getElementById('usd');
            const elCry = document.getElementById('crypto');
            if(elUsd) elUsd.innerText = data.usd;
            if(elCry) elCry.innerText = data.crypto;
            
            const btnSell = document.getElementById('btn-sell');
            if(btnSell) btnSell.disabled = data.crypto < 1;
        }
    };

    document.getElementById('btn-buy').onclick = () => {
        if (activeWebSocket && activeWebSocket.readyState === WebSocket.OPEN) {
            activeWebSocket.send(JSON.stringify({action: 'buy'}));
        }
    };
    
    document.getElementById('btn-sell').onclick = () => {
        if (activeWebSocket && activeWebSocket.readyState === WebSocket.OPEN) {
            activeWebSocket.send(JSON.stringify({action: 'sell'}));
        }
    };
}

function loadGallery(container) {
    const galleryGrid = document.createElement('div');
    galleryGrid.className = 'gallery-grid';
    container.appendChild(galleryGrid);

    fetch('/api/gallery')
        .then(res => res.json())
        .then(images => {
            images.forEach(imgName => {
                const img = document.createElement('img');
                img.src = `/gallery/${imgName}`;
                img.alt = imgName;
                galleryGrid.appendChild(img);
            });
        })
        .catch(() => {
            galleryGrid.innerText = "Error loading gallery";
        });
}

function createPanel(id) {
    const div = document.createElement('div');
    div.id = id;
    const loader = document.createElement('div');
    loader.className = 'loader';
    div.appendChild(loader);
    return div;
}

function setupLeftPanel(panel) {
    const searchInput = document.createElement('input');
    searchInput.placeholder = 'Search...';
    
    const searchBtn = document.createElement('button');
    searchBtn.textContent = 'Find';
    searchBtn.onclick = () => {
        const query = searchInput.value.toLowerCase();
        const rows = document.querySelectorAll('#users-table tbody tr');
        rows.forEach(row => {
            row.classList.remove('highlight');
            if (query !== '' && row.innerText.toLowerCase().includes(query)) {
                row.classList.add('highlight');
            }
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
    
    const editLabel = document.createElement('label');
    editLabel.htmlFor = 'edit-check';
    editLabel.textContent = ' Edit table';

    editCheckbox.onchange = (e) => {
        isEditMode = e.target.checked;
        const container = document.getElementById('content');
        if (document.getElementById('users-table')) {
            renderTable(container);
        }
    };

    editDiv.append(editCheckbox, editLabel);
    panel.append(scoreDiv, editDiv);
}

async function loadUsersFromServer() {
    const { field, order } = currentSort;
    let url = '/api/users';
    if (field) url += `?sortBy=${field}&order=${order}`;

    try {
        const res = await fetch(url);
        currentDisplayedUsers = await res.json();
        const content = document.getElementById('content');
        renderTable(content);
        updateFooterCount();
        updateScoreSum();
    } catch (err) {
        console.error("Error fetching users:", err);
    }
}

async function updateWeather() {
    try {
        const res = await fetch('/weather');
        const data = await res.json();
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
    
    const columns = [
        { key: 'firstname', name: 'Firstname' },
        { key: 'lastname', name: 'Lastname' },
        { key: 'score', name: 'Score' },
        { key: 'joinedDate', name: 'Date' }
    ];

    columns.forEach((col) => {
        const th = document.createElement('th');
        th.textContent = col.name;
        
        if (['firstname', 'lastname', 'joinedDate'].includes(col.key)) {
            th.style.cursor = "pointer";
            if (currentSort.field === col.key) {
                th.textContent += currentSort.order === 'asc' ? ' ▲' : ' ▼';
            }
            th.onclick = () => {
                if (currentSort.field === col.key) {
                    currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
                } else {
                    currentSort.field = col.key;
                    currentSort.order = 'asc';
                }
                loadUsersFromServer();
            };
        }
        headerRow.appendChild(th);
    });

    if (isEditMode) {
        const thAction = document.createElement('th');
        thAction.textContent = 'Action';
        headerRow.appendChild(thAction);
    }

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    currentDisplayedUsers.forEach((user, index) => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${user.firstname}</td>
            <td>${user.lastname}</td>
            <td>${user.score}</td>
            <td>${user.joinedDate}</td>
        `;

        if (isEditMode) {
            const tdAction = document.createElement('td');
            const delBtn = document.createElement('button');
            delBtn.textContent = 'Delete';
            delBtn.style.backgroundColor = '#ff4444';
            delBtn.style.color = 'white';
            delBtn.onclick = () => {
                currentDisplayedUsers.splice(index, 1);
                renderTable(container);
                updateScoreSum();
                updateFooterCount();
            };
            tdAction.appendChild(delBtn);
            tr.appendChild(tdAction);
        }
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    const title = document.getElementById('content-title');
    if (title && title.nextSibling) {
        container.insertBefore(table, title.nextSibling);
    } else {
        container.appendChild(table);
    }
}

function updateScoreSum() {
    const scoreDiv = document.getElementById('total-score');
    if (scoreDiv) {
        const total = currentDisplayedUsers.reduce((sum, user) => sum + user.score, 0);
        scoreDiv.innerHTML = `<strong>Total Score:</strong> ${total}`;
    }
}

function updateFooterCount() {
    const footerCount = document.getElementById('current-users-count');
    if (footerCount) footerCount.textContent = currentDisplayedUsers.length;
}