// Portfolio Manager - Main Application
console.log('Portfolio Manager starting...');

// Global variables
let portfolioData = [];
let tickerMapping = {};
let selectedAccounts = new Set();

// Load ticker mapping from JSON file
async function loadTickerMapping() {
    try {
        const response = await fetch('data/ticker-mapping.json');
        tickerMapping = await response.json();
        console.log('Ticker mapping loaded:', Object.keys(tickerMapping).length, 'mappings');
    } catch (error) {
        console.error('Error loading ticker mapping:', error);
        tickerMapping = {};
    }
}

// Convert Avanza ticker to Yahoo Finance ticker
function convertTicker(avanzaTicker) {
    if (!avanzaTicker || avanzaTicker === '') return '';
    
    if (tickerMapping[avanzaTicker]) {
        return tickerMapping[avanzaTicker];
    }
    
    return avanzaTicker;
}

// Save a new ticker mapping
function saveTickerMapping(avanzaTicker, yahooTicker) {
    tickerMapping[avanzaTicker] = yahooTicker;
    console.log('Saved mapping:', avanzaTicker, '->', yahooTicker);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Portfolio Manager loaded successfully!');
    loadTickerMapping();
});

// Function to import CSV file
function importCSV() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
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
}

// Function to parse CSV content
function parseCSV(csvContent) {
    try {
        const lines = csvContent.split('\n');
        const headers = lines[0].split(';');
        
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
}

// Function to display the imported data
function displayPortfolioData() {
    const container = document.getElementById('portfolioData');
    
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
}

// Function to update ticker mapping
function updateTicker(rowIndex, avanzaTicker) {
    const newYahooTicker = document.getElementById(`ticker_${rowIndex}`).value.trim();
    
    if (!newYahooTicker) {
        alert('Please enter a valid ticker');
        return;
    }
    
    saveTickerMapping(avanzaTicker, newYahooTicker);
    alert(`Mapping saved: ${avanzaTicker} -> ${newYahooTicker}`);
    
    displayPortfolioData();
}

// Function to display account selection checkboxes
function displayAccountSelection() {
    const container = document.getElementById('accountSelection');
    
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
}

// Function to toggle account selection
function toggleAccount(accountNumber) {
    if (selectedAccounts.has(accountNumber)) {
        selectedAccounts.delete(accountNumber);
    } else {
        selectedAccounts.add(accountNumber);
    }
}

// Function to create aggregated portfolio view
function updateAggregatedView() {
    const container = document.getElementById('aggregatedView');
    
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
                totalValue: 0,
                currency: currency,
                accounts: new Set()
            };
        }
        
        aggregated[yahooTicker].totalVolume += volume;
        aggregated[yahooTicker].totalValue += marketValue;
        aggregated[yahooTicker].accounts.add(row['Kontonummer']);
    });
    
    const sortedStocks = Object.values(aggregated).sort((a, b) => b.totalValue - a.totalValue);
    
    let html = `<p>Aggregated view for ${selectedAccounts.size} selected accounts:</p>`;
    html += '<table border="1" style="width:100%; border-collapse: collapse;">';
    html += '<tr><th>Stock Name</th><th>Yahoo Ticker</th><th>Total Volume</th><th>Total Value</th><th>Currency</th><th>Accounts</th></tr>';
    
    let totalPortfolioValue = 0;
    
    sortedStocks.forEach(stock => {
        totalPortfolioValue += stock.totalValue;
        html += `<tr>
            <td>${stock.name}</td>
            <td>${stock.ticker}</td>
            <td>${stock.totalVolume.toLocaleString()}</td>
            <td>${stock.totalValue.toLocaleString()} ${stock.currency}</td>
            <td>${stock.currency}</td>
            <td>${Array.from(stock.accounts).join(', ')}</td>
        </tr>`;
    });
    
    html += '</table>';
    html += `<p><strong>Total Portfolio Value: ${totalPortfolioValue.toLocaleString()} (mixed currencies)</strong></p>`;
    
    container.innerHTML = html;
}
