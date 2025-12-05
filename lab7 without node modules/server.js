const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/gallery', express.static(path.join(__dirname, 'gallery')));

const dbUsers = [
    { firstname: 'Ivan', lastname: 'Petrenko', score: 85, joinedDate: '15.01.2023' },
    { firstname: 'Mariia', lastname: 'Kovalenko', score: 92, joinedDate: '22.03.2023' },
    { firstname: 'Oleh', lastname: 'Sydorenko', score: 78, joinedDate: '10.05.2023' },
    { firstname: 'Hanna', lastname: 'Melnyk', score: 88, joinedDate: '01.02.2023' },
    { firstname: 'Dmytro', lastname: 'Bondar', score: 65, joinedDate: '19.06.2023' },
    { firstname: 'Yuliia', lastname: 'Tkachenko', score: 95, joinedDate: '12.04.2023' },
    { firstname: 'Andrii', lastname: 'Shevchenko', score: 99, joinedDate: '24.08.2022' },
    { firstname: 'Olena', lastname: 'Boiko', score: 74, joinedDate: '30.11.2023' },
    { firstname: 'Serhiy', lastname: 'Kravchenko', score: 81, joinedDate: '14.09.2023' },
    { firstname: 'Nataliia', lastname: 'Koval', score: 89, joinedDate: '05.07.2023' }
];

app.get('/api/users', (req, res) => {
    let users = [...dbUsers];
    const { sortBy, order } = req.query;

    if (sortBy) {
        users.sort((a, b) => {
            let valA = a[sortBy];
            let valB = b[sortBy];

            if (sortBy === 'joinedDate') {
                const [dA, mA, yA] = valA.split('.');
                const [dB, mB, yB] = valB.split('.');
                valA = `${yA}-${mA}-${dA}`;
                valB = `${yB}-${mB}-${dB}`;
            } 
            else if (typeof valA === 'string') {
                valA = valA.toLowerCase();
                valB = valB.toLowerCase();
            }

            if (valA < valB) return -1;
            if (valA > valB) return 1;
            return 0;
        });
    }

    if (order === 'desc') users.reverse();
    res.json(users.slice(0, 10));
});

app.get('/api/new-users', (req, res) => res.json(dbUsers.slice(0, 5)));
app.get('/weather', (req, res) => res.json({ city: 'Kyiv', temperature: Math.floor(Math.random() * 31) }));
app.get('/api/gallery', (req, res) => res.json(['img1.jpg', 'img2.jpg', 'img3.jpg']));

// --- CHAT WITH HISTORY ---
let sseClients = [];
const chatHistory = []; // Array to store messages

app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send history to new client immediately
    chatHistory.forEach(msg => {
        res.write(`data: ${JSON.stringify(msg)}\n\n`);
    });

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    req.on('close', () => {
        sseClients = sseClients.filter(c => c.id !== clientId);
    });
});

app.post('/chat/send', (req, res) => {
    const { username, message } = req.body;
    const time = new Date().toLocaleTimeString();
    const msgObject = { username, message, time };
    
    // Save to history
    chatHistory.push(msgObject);
    if (chatHistory.length > 50) chatHistory.shift(); // Keep last 50 messages

    const payload = JSON.stringify(msgObject);

    sseClients.forEach(client => {
        client.res.write(`data: ${payload}\n\n`);
    });

    res.json({ status: 'sent' });
});

// --- WS EXCHANGE ---
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let cryptoPrice = 100;

setInterval(() => {
    const change = (Math.random() * 10) - 5;
    cryptoPrice = Math.max(0.1, cryptoPrice + change);

    const updateMsg = JSON.stringify({ type: 'price-update', price: cryptoPrice.toFixed(2) });
    
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(updateMsg);
        }
    });
}, 3000);

wss.on('connection', (ws) => {
    ws.userData = { usd: 1000, crypto: 0 };

    ws.send(JSON.stringify({ 
        type: 'balance-update', 
        usd: ws.userData.usd.toFixed(2), 
        crypto: ws.userData.crypto 
    }));
    
    ws.send(JSON.stringify({ type: 'price-update', price: cryptoPrice.toFixed(2) }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);

            if (data.action === 'buy') {
                if (ws.userData.usd >= cryptoPrice) {
                    ws.userData.usd -= cryptoPrice;
                    ws.userData.crypto += 1;
                }
            } else if (data.action === 'sell') {
                if (ws.userData.crypto >= 1) {
                    ws.userData.crypto -= 1;
                    ws.userData.usd += cryptoPrice;
                }
            }

            ws.send(JSON.stringify({ 
                type: 'balance-update', 
                usd: ws.userData.usd.toFixed(2), 
                crypto: ws.userData.crypto 
            }));
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});