const container = document.getElementById('CryptoContainer');
const themeToggle = document.getElementById('themeToggle');
const searchInput = document.getElementById('searchInput');
const placeholder = [
  "🔍 Search Bitcoin...",
  "🔍 Search Ethereum...",
  "🔍 Search Dogecoin..."
];
let i = 0;

setInterval(()=>{
    searchInput.setAttribute("placeholder",placeholder[i]);
    i = (i+1)%placeholder.length;
},2000);   //2000ms = 2s

const prefersDark = window.matchMedia('(prefers-color-scheme:dark)').matches;

if(prefersDark){
    document.body.classList.add('dark-theme');
    themeToggle.textContent = '☀️';
}
else{
    themeToggle.textContent = '🌙';
}

document.getElementById("lastUpdated").textContent = 
"⏱️ Last Updated: " + new Date().toLocaleTimeString();

themeToggle.addEventListener('click',() =>{
    document.body.classList.toggle('dark-theme');

    if(document.body.classList.contains('dark-theme')){
        themeToggle.textContent = "☀️";
    }else{
        themeToggle.textContent = "🌙";
    }
});

searchInput.addEventListener('input',() =>{
    const value = searchInput.value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(value) ? 'block':'none';
    });
});


//fetch API data
async function fetchData(){
    container.innerHTML = "<p>Loading data...</p>";
    try{
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd')
        if(!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        displayData(data);
    }catch(err){
        container.innerHTML = `
        <p>⚠️ Unable to load data. Please try again later.</p>
        <button id = "retryBtn"> ↻ Retry </button> 
        `;
        document.getElementById("retryBtn").addEventListener("click",fetchData);
    }
}

function displayData(coins) {
    container.innerHTML = '';
    coins.forEach(coin => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div class="card-content">
                <img src="${coin.image}" alt="${coin.name}" class="crypto-logo">
                <div class="crypto-info">
                    <h3>${coin.name} (${coin.symbol.toUpperCase()})</h3>
                    <p>💰 Price: $${coin.current_price}</p>
                    <p>📈 Change: ${coin.price_change_percentage_24h.toFixed(2)}%</p>
                </div>
            </div>
        `;

        // ✅ Async click event
        card.addEventListener('click', async () => {
            const modal = document.getElementById('cryptoModal');
            const loadingText = document.getElementById('modalLoading');
            const modalBody = document.querySelector('.modal-body');

            // Show modal immediately with loading text
            modal.style.display = 'block';
            loadingText.style.display = 'block';
            modalBody.style.display = 'none';
            
            document.getElementById('modalTitle').textContent = coin.name;
            document.getElementById('modalImage').src = coin.image;
            document.getElementById('modalPrice').textContent = `💰 Price: $${coin.current_price}`;
            document.getElementById('modalChange').textContent = `📈 24h Change: ${coin.price_change_percentage_24h.toFixed(2)}%`;
            document.getElementById('modalMarketCap').textContent = `🏦 Market Cap: $${coin.market_cap.toLocaleString()}`;
            document.getElementById('modalVolume').textContent = `🔄 24h Volume: $${coin.total_volume.toLocaleString()}`;

            // ✅ Fetch chart data
            const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=7`);
            const chartData = await res.json();

            const prices = chartData.prices.map(p => p[1]);
            const labels = chartData.prices.map(p => {
                const date = new Date(p[0]);
                return `${date.getDate()}/${date.getMonth() + 1}`;
            });

            // ✅ Destroy old chart if exists
            if (window.cryptoChart) {
                window.cryptoChart.destroy();
            }

            // ✅ Create new chart
            const ctx = document.getElementById('priceChart').getContext('2d');
            window.cryptoChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Price (USD)',
                        data: prices,
                        borderColor: '#8a2be2',
                        backgroundColor: 'rgba(138, 43, 226, 0.2)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 0
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { display: true },
                        y: { display: true }
                    }
                }
            });

            // ✅ Show modal after chart is ready
            loadingText.style.display = 'none';
            modalBody.style.display = 'flex';
        });

        container.appendChild(card);
    });
}


document.getElementById('closeModal').addEventListener('click',() =>{
    document.getElementById('cryptoModal').style.display = 'none';
});

window.addEventListener('click', () =>{
    if(e.target.id == 'cryptoModal'){
        document.getElementById('cryptoModal').style.display = 'none';
    }
});

fetchData();
setInterval(fetchData,120000);