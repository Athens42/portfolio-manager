// Portfolio Manager - Main Application
console.log(‘Portfolio Manager starting…’);

// Global variables
let portfolioData = [];
let tickerMapping = {};
let selectedAccounts = new Set();

// Currency conversion functionality
let exchangeRates = {
‘SEK’: 1.0,
‘USD’: 10.5,
‘EUR’: 11.5,
‘DKK’: 1.55
};

// Load ticker mapping from JSON file
async function loadTickerMapping() {
try {
const response = await fetch(‘data/ticker-mapping.json’);
tickerMapping = await response.json();
console.log(‘Ticker mapping loaded:’, Object.keys(tickerMapping).length, ‘mappings’);
} catch (error) {
console.error(‘Error loading ticker mapping:’, error);
tickerMapping = {};
}
}

// Convert Avanza ticker to Yahoo Finance ticker
function convertTicker(avanzaTicker) {
if (!avanzaTicker || avanzaTicker === ‘’) return ‘’;

```
if (tickerMapping[avanzaTicker]) {
    return tickerMapping[avanzaTicker];
}

return avanzaTicker;
```

}

// Save a new ticker mapping
function saveTickerMapping(avanzaTicker, yahooTicker) {
tickerMapping[avanzaTicker] = yahooTicker;
console.log(‘Saved mapping:’, avanzaTicker, ‘->’, yahooTicker);
}

// Convert amount to SEK
function convertToSEK(amount, currency) {
if (!currency || currency === ‘SEK’) return amount;
const rate = exchangeRates[currency] || 1;
return amount * rate;
}

// Initialize when page loads
document.addEventListener(‘DOMContentLoaded’, function() {
console.log(‘Portfolio Manager loaded successfully!’);
loadTickerMapping();
});

// Function to import CSV file
function importCSV() {
const fileInput = document.getElementById(‘csvFileInput’);
const file = fileInput.files[0];

```
if (!file) {
    alert('Please select a CSV file first!');
    return;
}

if (!file.name.toLowerCase().endsWith('.csv')) {
    alert('Please select a CSV file!');
    return;
}

const reader = new FileReader();
reader.onload = function(e) {
    const csvContent = e.target.result;
    parseCSV(csvContent);
};
reader.readAsText(file);
```

}

// Function to parse CSV content
function parseCSV(csvContent) {
try {
const lines = csvContent.split(’\n’);
const headers = lines[0].split(’;’);

```
    portfolioData = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = lines[i].split(';');
        const row = {};
        
        headers.forEach((header, index) => {
            row[header.trim()] = values[index] ? values[index].trim() : '';
        });
        
        portfolioData.push(row);
    }
    
    displayPortfolioData();
    console.log('Imported', portfolioData.length, 'holdings');
    
} catch (error) {
    alert('Error parsing CSV file: ' + error.message);
    console.error('CSV parsing error:', error);
}
```

}

// Function to display the imported data
function displayPortfolioData() {
const container = document.getElementById(‘portfolioData’);

```
if (portfolioData.length === 0) {
    container.innerHTML = '<p>No data imported yet.</p>';
    return;
}

let html = `<p>Successfully imported ${portfolioData.length} holdings!</p>`;
html += '<table border="1" style="width:100%; border-collapse: collapse;">';
html += '<tr><th>Account</th><th>Name</th><th>Type</th><th>Avanza Ticker</th><th>Yahoo Ticker</th><th>Volume</th><th>Market Value</th><th>Currency</th><th>Action</th></tr>';

portfolioData.forEach((row, index) => {
    const avanzaTicker = row['Kortnamn'] || '';
    const stockType = row['Typ'] || '';
    const yahooTicker = convertTicker(avanzaTicker);
    
    if (stockType === 'FUND' || avanzaTicker === '') {
        html += `<tr style="background-color: #f8f9fa; color: #6c757d;">
            <td>${row['Kontonummer'] || ''}</td>
            <td>${row['Namn'] || ''}</td>
            <td>${stockType}</td>
            <td>${avanzaTicker}</td>
            <td><em>N/A (Fund)</em></td>
            <td>${row['Volym'] || ''}</td>
            <td>${row['Marknadsvärde'] || ''}</td>
            <td>${row['Valuta'] || ''}</td>
            <td><em>Ignored</em></td>
        </tr>`;
        return;
    }
    
    const hasMapping = tickerMapping[avanzaTicker] !== undefined;
    const isUSStock = yahooTicker === avanzaTicker && (yahooTicker.match(/^[A-Z]{1,5}$/) && row['Valuta'] === 'USD');
    const needsMapping = !hasMapping && !isUSStock && yahooTicker === avanzaTicker;
    
    html += `<tr ${needsMapping ? 'style="background-color: #fff3cd;"' : ''}>
        <td>${row['Kontonummer'] || ''}</td>
        <td>${row['Namn'] || ''}</td>
        <td>${stockType}</td>
        <td>${avanzaTicker}</td>
        <td>
            <input type="text" id="ticker_${index}" value="${yahooTicker}" 
                   style="width: 100px; ${needsMapping ? 'border: 2px solid orange;' : ''}" />
        </td>
        <td>${row['Volym'] || ''}</td>
        <td>${row['Marknadsvärde'] || ''}</td>
        <td>${row['Valuta'] || ''}</td>
        <td>
            <button onclick="updateTicker(${index}, '${avanzaTicker}')" style="font-size: 12px; padding: 5px;">Save</button>
        </td>
    </tr>`;
});

html += '</table>';
html += '<p><strong>Note:</strong> Yellow rows need ticker mapping. Funds are ignored. US stocks (USD currency) typically don\'t need .ST suffix.</p>';
container.innerHTML = html;

displayAccountSelection();
```

}

// Function to update ticker mapping
function updateTicker(rowIndex, avanzaTicker) {
const newYahooTicker = document.getElementById(`ticker_${rowIndex}`).value.trim();

```
if (!newYahooTicker) {
    alert('Please enter a valid ticker');
    return;
}

saveTickerMapping(avanzaTicker, newYahooTicker);
alert(`Mapping saved: ${avanzaTicker} -> ${newYahooTicker}`);

displayPortfolioData();
```

}

// Function to display account selection checkboxes
function displayAccountSelection() {
const container = document.getElementById(‘accountSelection’);

```
if (portfolioData.length === 0) {
    container.innerHTML = '<p>Import CSV data first to see accounts.</p>';
    return;
}

const accounts = [...new Set(portfolioData.map(row => row['Kontonummer']).filter(acc => acc))];

if (selectedAccounts.size === 0) {
    accounts.forEach(acc => selectedAccounts.add(acc));
}

let html = '<p>Select accounts to include in analysis:</p>';

accounts.forEach(account => {
    const isChecked = selectedAccounts.has(account);
    html += `
        <label style="display: block; margin: 5px 0;">
            <input type="checkbox" ${isChecked ? 'checked' : ''} 
                   onchange="toggleAccount('${account}')" />
            Account: ${account}
        </label>
    `;
});

html += '<br><button onclick="updateAggregatedView()" style="margin-top: 10px;">Update Aggregated View</button>';

container.innerHTML = html;
```

}

// Function to toggle account selection
function toggleAccount(accountNumber) {
if (selectedAccounts.has(accountNumber)) {
selectedAccounts.delete(accountNumber);
} else {
selectedAccounts.add(accountNumber);
}
}

// Function to create aggregated portfolio view with currency conversion
function updateAggregatedView() {
const container = document.getElementById(‘aggregatedView’);

```
if (portfolioData.length === 0 || selectedAccounts.size === 0) {
    container.innerHTML = '<p>Select accounts and ensure data is imported to see aggregated view.</p>';
    return;
}

const filteredData = portfolioData.filter(row => {
    const account = row['Kontonummer'];
    const type = row['Typ'];
    return selectedAccounts.has(account) && type !== 'FUND';
});

const aggregated = {};

filteredData.forEach(row => {
    const avanzaTicker = row['Kortnamn'] || '';
    const yahooTicker = convertTicker(avanzaTicker);
    const volume = parseFloat(row['Volym']) || 0;
    const marketValue = parseFloat(row['Marknadsvärde'].replace(',', '.')) || 0;
    const currency = row['Valuta'] || '';
    const name = row['Namn'] || '';
    
    if (!yahooTicker || yahooTicker === '') return;
    
    if (!aggregated[yahooTicker]) {
        aggregated[yahooTicker] = {
            name: name,
            ticker: yahooTicker,
            totalVolume: 0,
            totalValueOriginal: 0,
            totalValueSEK: 0,
            currency: currency,
            accounts: new Set()
        };
    }
    
    aggregated[yahooTicker].totalVolume += volume;
    aggregated[yahooTicker].totalValueOriginal += marketValue;
    aggregated[yahooTicker].totalValueSEK += convertToSEK(marketValue, currency);
    aggregated[yahooTicker].accounts.add(row['Kontonummer']);
});

const sortedStocks = Object.values(aggregated).sort((a, b) => b.totalValueSEK - a.totalValueSEK);

let html = `<p>Aggregated view for ${selectedAccounts.size} selected accounts (converted to SEK):</p>`;
html += '<table border="1" style="width:100%; border-collapse: collapse;">';
html += '<tr><th>Stock Name</th><th>Yahoo Ticker</th><th>Total Volume</th><th>Value (Original)</th><th>Value (SEK)</th><th>Currency</th><th>Accounts</th></tr>';

let totalPortfolioValueSEK = 0;

sortedStocks.forEach(stock => {
    totalPortfolioValueSEK += stock.totalValueSEK;
    html += `<tr>
        <td>${stock.name}</td>
        <td>${stock.ticker}</td>
        <td>${stock.totalVolume.toLocaleString()}</td>
        <td>${stock.totalValueOriginal.toLocaleString()} ${stock.currency}</td>
        <td>${stock.totalValueSEK.toLocaleString('sv-SE')} SEK</td>
        <td>${stock.currency}</td>
        <td>${Array.from(stock.accounts).join(', ')}</td>
    </tr>`;
});

html += '</table>';
html += `<p><strong>Total Portfolio Value: ${totalPortfolioValueSEK.toLocaleString('sv-SE')} SEK</strong></p>`;

container.innerHTML = html;
```

}

// Fetch current exchange rates
async function fetchExchangeRates() {
const statusDiv = document.getElementById(‘exchangeRateStatus’);
statusDiv.innerHTML = ‘<p>Fetching exchange rates…</p>’;

```
try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/SEK');
    const data = await response.json();
    
    exchangeRates = {
        'SEK': 1.0,
        'USD': 1 / data.rates.USD,
        'EUR': 1 / data.rates.EUR,
        'DKK': 1 / data.rates.DKK
    };
    
    let html = '<p><strong>Exchange rates updated:</strong></p>';
    html += '<ul>';
    Object.entries(exchangeRates).forEach(([currency, rate]) => {
        if (currency !== 'SEK') {
            html += `<li>1 ${currency} = ${rate.toFixed(4)} SEK</li>`;
        }
    });
    html += '</ul>';
    html += `<p><em>Last updated: ${new Date().toLocaleString()}</em></p>`;
    
    statusDiv.innerHTML = html;
    
    // Update aggregated view if it exists
    if (portfolioData.length > 0) {
        updateAggregatedView();
    }
    
} catch (error) {
    console.error('Error fetching exchange rates:', error);
    statusDiv.innerHTML = '<p style="color: red;">Error fetching exchange rates. Using default rates.</p>';
}
```

}

// Placeholder for stock prices (we’ll add this next)
function fetchStockPrices() {
alert(‘Stock price fetching will be added in the next step!’);
}
