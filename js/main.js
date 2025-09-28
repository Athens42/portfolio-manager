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
