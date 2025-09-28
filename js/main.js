// Portfolio Manager - Main Application
console.log('Portfolio Manager starting...');

// Global variables
let portfolioData = [];
let tickerMapping = {};

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
    
    // Check if we have a mapping
    if (tickerMapping[avanzaTicker]) {
        return tickerMapping[avanzaTicker];
    }
    
    // Return original if no mapping found
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

// Function to parse CSV content - DEBUG VERSION
function parseCSV(csvContent) {
    try {
        console.log('CSV Content length:', csvContent.length);
        console.log('First 200 characters:', csvContent.substring(0, 200));
        
        const lines = csvContent.split('\n');
        console.log('Number of lines:', lines.length);
        console.log('First line (headers):', lines[0]);
        
        const headers = lines[0].split(';');
        console.log('Headers found:', headers);
        
        portfolioData = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue; // Skip empty lines
            
            console.log('Processing line', i, ':', lines[i].substring(0, 100));
            
            const values = lines[i].split(';');
            const row = {};
            
            headers.forEach((header, index) => {
                row[header.trim()] = values[index] ? values[index].trim() : '';
            });
            
            portfolioData.push(row);
        }
        
        console.log('Successfully parsed', portfolioData.length, 'rows');
        console.log('First row:', portfolioData[0]);
        
        displayPortfolioData();
        
    } catch (error) {
        console.error('Detailed CSV parsing error:', error);
        console.error('Error stack:', error.stack);
        alert('Error parsing CSV file: ' + error.message);
    }
}

// Function to display the imported data
function displayPortfolioData() {
    const container = document.getElementById('portfolioData');
    
    if (portfolioData.length === 0) {
        container.innerHTML = '<p>No data imported yet.</p>';
        return;
        displayAccountSelection();
    }
    
    let html = `<p>Successfully imported ${portfolioData.length} holdings!</p>`;
    html += '<table border="1" style="width:100%; border-collapse: collapse;">';
    html += '<tr><th>Account</th><th>Name</th><th>Type</th><th>Avanza Ticker</th><th>Yahoo Ticker</th><th>Volume</th><th>Market Value</th><th>Currency</th><th>Action</th></tr>';
    
    portfolioData.forEach((row, index) => {
        const avanzaTicker = row['Kortnamn'] || '';
        const stockType = row['Typ'] || '';
        const yahooTicker = convertTicker(avanzaTicker);
        
        // Skip funds or empty tickers
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
        
        // Check if mapping exists or if it's already a valid ticker
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
    
    // Show account selection after displaying portfolio data
    displayAccountSelection();
}

// Function to update ticker mapping
function updateTicker(rowIndex, avanzaTicker) {
    const newYahooTicker = document.getElementById(`ticker_${rowIndex}`).value.trim();
    
    if (!newYahooTicker) {
        alert('Please enter a valid ticker');
        return;
    }
    
    // Save the mapping even if it's the same (confirms it's correct)
    saveTickerMapping(avanzaTicker, newYahooTicker);
    alert(`Mapping saved: ${avanzaTicker} -> ${newYahooTicker}`);
    
    // Refresh the display
    displayPortfolioData();
}
// Account selection functionality
let selectedAccounts = new Set();

// Function to display account selection checkboxes
function displayAccountSelection() {
    console.log('displayAccountSelection called');
    const container = document.getElementById('accountSelection');
    console.log('Container found:', container);
    
    if (portfolioData.length === 0) {
        console.log('No portfolio data available');
        container.innerHTML = '<p>Import CSV data first to see accounts.</p>';
        return;
    }
    
    console.log('Portfolio data length:', portfolioData.length);
    
    // Get unique accounts
    const accounts = [...new Set(portfolioData.map(row => row['Kontonummer']).filter(acc => acc))];
    console.log('Found accounts:', accounts);
    
    // Initialize all accounts as selected
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
    
    console.log('Setting HTML:', html);
    container.innerHTML = html;
}
    
    // Get unique accounts
    const accounts = [...new Set(portfolioData.map(row => row['Kontonummer']).filter(acc => acc))];
    
    // Initialize all accounts as selected
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
    console.log('Selected accounts:', Array.from(selectedAccounts));
}

// Function to create aggregated portfolio view
function updateAggregatedView() {
    const container = document.getElementById('aggregatedView');
    
    if (portfolioData.length === 0 || selectedAccounts.size === 0) {
        container.innerHTML = '<p>Select accounts and ensure data is imported to see aggregated view.</p>';
        return;
    }
    
    // Filter data by selected accounts and exclude funds
    const filteredData = portfolioData.filter(row => {
        const account = row['Kontonummer'];
        const type = row['Typ'];
        return selectedAccounts.has(account) && type !== 'FUND';
    });
    
    // Group by Yahoo ticker
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
    
    // Convert to array and sort by value
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
    html += '<p><strong>Note:</strong> Yellow rows need ticker mapping. Funds are ignored. US stocks (USD currency) typically don\'t need .ST suffix.</p>';
    container.innerHTML = html;
    
    // Show account selection after displaying portfolio data
    displayAccountSelection();
}
}
