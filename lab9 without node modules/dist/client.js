"use strict";
const socket = new WebSocket('ws://' + window.location.host);
const priceEl = document.getElementById('price');
const usdEl = document.getElementById('usd');
const cryptoEl = document.getElementById('crypto');
const btnBuy = document.getElementById('btn-buy');
const btnSell = document.getElementById('btn-sell');
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'price-update' && data.price) {
        if (priceEl)
            priceEl.innerText = `${data.price} $`;
        updateButtons(parseFloat(data.price));
    }
    else if (data.type === 'balance-update' && data.usd && data.crypto !== undefined) {
        if (usdEl)
            usdEl.innerText = data.usd;
        if (cryptoEl)
            cryptoEl.innerText = data.crypto.toString();
    }
};
function trade(action) {
    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action }));
    }
}
function updateButtons(currentPrice) {
    if (usdEl && cryptoEl) {
        const usd = parseFloat(usdEl.innerText);
        const crypto = parseFloat(cryptoEl.innerText);
        if (btnBuy)
            btnBuy.disabled = usd < currentPrice;
        if (btnSell)
            btnSell.disabled = crypto < 1;
    }
}
if (btnBuy)
    btnBuy.onclick = () => trade('buy');
if (btnSell)
    btnSell.onclick = () => trade('sell');
