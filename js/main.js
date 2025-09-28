// Portfolio Manager - Main Application
console.log('Portfolio Manager starting...');

// Global variable to store portfolio data
let portfolioData = [];

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
        // Global variable to store portfolio data
let portfolioData = [];

// Ticker mapping functionality
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
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue; // Skip empty lines
            
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

// Function to display the imported data with ticker mapping
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
}
// Function to update ticker mapping
function updateTicker(rowIndex, avanzaTicker) {
    const newYahooTicker = document.getElementById(`ticker_${rowIndex}`).value.trim();
    
    if (newYahooTicker && newYahooTicker !== avanzaTicker) {
        saveTickerMapping(avanzaTicker, newYahooTicker);
        alert(`Mapping saved: ${avanzaTicker} -> ${newYahooTicker}`);
        
        // Refresh the display
        displayPortfolioData();
    }
}
