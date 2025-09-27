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

// Function to display the imported data
function displayPortfolioData() {
    const container = document.getElementById('portfolioData');
    
    if (portfolioData.length === 0) {
        container.innerHTML = '<p>No data imported yet.</p>';
        return;
    }
    
    let html = `<p>Successfully imported ${portfolioData.length} holdings!</p>`;
    html += '<table border="1" style="width:100%; border-collapse: collapse;">';
    html += '<tr><th>Account</th><th>Name</th><th>Ticker</th><th>Volume</th><th>Market Value</th><th>Currency</th></tr>';
    
    portfolioData.forEach(row => {
        html += `<tr>
            <td>${row['Kontonummer'] || ''}</td>
            <td>${row['Namn'] || ''}</td>
            <td>${row['Kortnamn'] || ''}</td>
            <td>${row['Volym'] || ''}</td>
            <td>${row['Marknadsvärde'] || ''}</td>
            <td>${row['Valuta'] || ''}</td>
        </tr>`;
    });
    
    html += '</table>';
    container.innerHTML = html;
}
