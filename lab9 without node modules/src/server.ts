import express from 'express';
import path from 'path';
import http from 'http';
import { WebSocket, WebSocketServer } from 'ws';

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '../public')));
app.use('/js', express.static(path.join(__dirname, '../dist')));

interface UserState {
    usd: number;
    crypto: number;
}
interface IncomingMessage {
    action: "buy" | "sell";
}
interface OutgoingMessage {
    type: "price-update" | "balance-update";
    price?: string;
    usd?: string;
    crypto?: number;
}
interface CustomWebSocket extends WebSocket {
    userData: UserState;
}

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let cryptoPrice: number = 100;

setInterval(() => {
    const change = (Math.random() * 10) - 5;
    cryptoPrice = Math.max(0.1, cryptoPrice + change);

    const msg: OutgoingMessage = { 
        type: 'price-update', 
        price: cryptoPrice.toFixed(2) 
    };
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(msg));
        }
    });
}, 3000);
wss.on('connection', (ws: CustomWebSocket) => {

    ws.userData = { usd: 1000, crypto: 0 };

    const initialBalance: OutgoingMessage = { 
        type: 'balance-update', 
        usd: ws.userData.usd.toFixed(2), 
        crypto: ws.userData.crypto 
    };
    ws.send(JSON.stringify(initialBalance));

    const initialPrice: OutgoingMessage = {
        type: 'price-update',
        price: cryptoPrice.toFixed(2)
    };
    ws.send(JSON.stringify(initialPrice));

    ws.on('message', (message: string) => {
        try {
            const data: IncomingMessage = JSON.parse(message);

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
            const update: OutgoingMessage = { 
                type: 'balance-update', 
                usd: ws.userData.usd.toFixed(2), 
                crypto: ws.userData.crypto 
            };
            ws.send(JSON.stringify(update));
        } catch (e) {
            console.error('Error processing message:', e);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});