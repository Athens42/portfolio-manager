// Portfolio Manager - Main Application
console.log('Portfolio Manager starting...');

// Global variable to store portfolio data
let portfolioData = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Portfolio Manager loaded successfully!');
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
    html += '<tr><th>Account</th><th>Name</th><th>Avanza Ticker</th><th>Yahoo Ticker</th><th>Volume</th><th>Market Value</th><th>Currency</th><th>Action</th></tr>';
    
    portfolioData.forEach((row, index) => {
        const avanzaTicker = row['Kortnamn'] || '';
        const yahooTicker = convertTicker(avanzaTicker);
        const needsMapping = yahooTicker === avanzaTicker && avanzaTicker !== '' && avanzaTicker !== 'FUND';
        
        html += `<tr ${needsMapping ? 'style="background-color: #fff3cd;"' : ''}>
            <td>${row['Kontonummer'] || ''}</td>
            <td>${row['Namn'] || ''}</td>
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
    html += '<p><strong>Note:</strong> Yellow rows need ticker mapping. Orange borders indicate unmapped tickers.</p>';
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
