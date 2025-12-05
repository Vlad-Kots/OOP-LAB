interface ServerMsg {
    type: "price-update" | "balance-update";
    price?: string;
    usd?: string;
    crypto?: number;
}

const socket = new WebSocket('ws://' + window.location.host);

const priceEl = document.getElementById('price') as HTMLElement;
const usdEl = document.getElementById('usd') as HTMLElement;
const cryptoEl = document.getElementById('crypto') as HTMLElement;
const btnBuy = document.getElementById('btn-buy') as HTMLButtonElement;
const btnSell = document.getElementById('btn-sell') as HTMLButtonElement;

socket.onmessage = (event: MessageEvent) => {
    const data: ServerMsg = JSON.parse(event.data);

    if (data.type === 'price-update' && data.price) {
        if(priceEl) priceEl.innerText = `${data.price} $`;
        updateButtons(parseFloat(data.price));
    } 
    else if (data.type === 'balance-update' && data.usd && data.crypto !== undefined) {
        if(usdEl) usdEl.innerText = data.usd;
        if(cryptoEl) cryptoEl.innerText = data.crypto.toString();
    }
};

function trade(action: "buy" | "sell"): void {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action }));
    }
}

function updateButtons(currentPrice: number): void {
    if (usdEl && cryptoEl) {
        const usd = parseFloat(usdEl.innerText);
        const crypto = parseFloat(cryptoEl.innerText);

        if(btnBuy) btnBuy.disabled = usd < currentPrice;
        if(btnSell) btnSell.disabled = crypto < 1;
    }
}

if (btnBuy) btnBuy.onclick = () => trade('buy');
if (btnSell) btnSell.onclick = () => trade('sell');