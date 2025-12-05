"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const app = (0, express_1.default)();
const PORT = 3000;
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use('/js', express_1.default.static(path_1.default.join(__dirname, '../dist')));
const server = http_1.default.createServer(app);
const wss = new ws_1.WebSocketServer({ server });
let cryptoPrice = 100;
setInterval(() => {
    const change = (Math.random() * 10) - 5;
    cryptoPrice = Math.max(0.1, cryptoPrice + change);
    const msg = {
        type: 'price-update',
        price: cryptoPrice.toFixed(2)
    };
    wss.clients.forEach(client => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
        }
    });
}, 3000);
wss.on('connection', (ws) => {
    ws.userData = { usd: 1000, crypto: 0 };
    const initialBalance = {
        type: 'balance-update',
        usd: ws.userData.usd.toFixed(2),
        crypto: ws.userData.crypto
    };
    ws.send(JSON.stringify(initialBalance));
    const initialPrice = {
        type: 'price-update',
        price: cryptoPrice.toFixed(2)
    };
    ws.send(JSON.stringify(initialPrice));
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.action === 'buy') {
                if (ws.userData.usd >= cryptoPrice) {
                    ws.userData.usd -= cryptoPrice;
                    ws.userData.crypto += 1;
                }
            }
            else if (data.action === 'sell') {
                if (ws.userData.crypto >= 1) {
                    ws.userData.crypto -= 1;
                    ws.userData.usd += cryptoPrice;
                }
            }
            const update = {
                type: 'balance-update',
                usd: ws.userData.usd.toFixed(2),
                crypto: ws.userData.crypto
            };
            ws.send(JSON.stringify(update));
        }
        catch (e) {
            console.error('Error processing message:', e);
        }
    });
});
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
