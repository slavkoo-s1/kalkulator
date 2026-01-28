let exchangeRate = null;
let nbpRate = null;
const AUTO1_MARGIN = 1.004; // AUTO1.com adds ~0.4% margin to NBP rate

async function fetchExchangeRate() {
    const sources = [
        {
            url: 'https://api.nbp.pl/api/exchangerates/rates/a/eur/?format=json',
            parse: (data) => data.rates[0].mid
        },
        {
            url: 'https://api.exchangerate-api.com/v4/latest/EUR',
            parse: (data) => data.rates.PLN
        },
        {
            url: 'https://api.frankfurter.app/latest?from=EUR&to=PLN',
            parse: (data) => data.rates.PLN
        }
    ];

    for (const source of sources) {
        try {
            const response = await fetch(source.url);
            if (!response.ok) continue;
            const data = await response.json();
            nbpRate = source.parse(data);
            if (nbpRate && nbpRate > 0) {
                // Calculate AUTO1.com rate with margin
                exchangeRate = nbpRate * AUTO1_MARGIN;
                document.getElementById('exchangeRate').textContent = exchangeRate.toFixed(4);
                return;
            }
        } catch (error) {}
    }

    exchangeRate = 4.30;
    document.getElementById('exchangeRate').textContent = exchangeRate.toFixed(4);
}

function formatPLN(value) {
    return new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value) + ' zł';
}

function calculateCosts(event) {
    event.preventDefault();

    // Clear previous errors
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));

    // Validate required fields
    let hasErrors = false;
    const requiredFields = [
        { id: 'carCost', name: 'Koszt pojazdu' },
        { id: 'transport', name: 'Transport' },
        { id: 'country', name: 'Kraj' },
        { id: 'exciseTax', name: 'Akcyza' }
    ];

    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        const value = element.value.trim();
        if (!value || value === '') {
            element.classList.add('error');
            hasErrors = true;
        }
    });

    if (hasErrors) {
        return;
    }

    if (!exchangeRate) {
        alert('Ustaw kurs EUR/PLN');
        return;
    }

    const carCost = parseFloat(document.getElementById('carCost').value) || 0;
    const countryData = document.getElementById('country').value.split('|');
    const countryCost = parseFloat(countryData[1]) || 0;
    const exciseTaxRate = parseFloat(document.getElementById('exciseTax').value) || 0;
    const transport = parseFloat(document.getElementById('transport').value) || 0;
    const repairs = parseFloat(document.getElementById('repairs').value) || 0;
    const other = parseFloat(document.getElementById('other').value) || 0;
    const inspection = parseFloat(document.getElementById('inspection').value) || 0;
    const insurance = parseFloat(document.getElementById('insurance').value) || 0;
    const registration = parseFloat(document.getElementById('registration').value) || 0;
    const cleaning = parseFloat(document.getElementById('cleaning').value) || 0;

    const carCostPLN = carCost * exchangeRate;
    const countryCostPLN = countryCost * exchangeRate;
    const transportPLN = transport * exchangeRate;
    const exciseTaxPLN = carCostPLN * exciseTaxRate;
    const additionalCosts = repairs + other + inspection + insurance + registration + cleaning;

    const totalCost = carCostPLN + countryCostPLN + transportPLN + exciseTaxPLN + additionalCosts;

    document.getElementById('resultCarCost').textContent = formatPLN(carCostPLN);
    document.getElementById('resultCountryCost').textContent = formatPLN(countryCostPLN);
    document.getElementById('resultTransport').textContent = formatPLN(transportPLN);
    document.getElementById('resultExcise').textContent = formatPLN(exciseTaxPLN);
    document.getElementById('resultAdditional').textContent = formatPLN(additionalCosts);
    document.getElementById('resultTotal').textContent = formatPLN(totalCost);

    document.getElementById('results').classList.add('show');
}

document.addEventListener('DOMContentLoaded', () => {
    fetchExchangeRate();
    document.getElementById('calculatorForm').addEventListener('submit', calculateCosts);
    
    // Clear error state when user starts typing
    const inputs = ['carCost', 'transport', 'country', 'exciseTax'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            this.classList.remove('error');
        });
    });
    
    document.getElementById('updateRate').addEventListener('click', () => {
        const manualRate = parseFloat(document.getElementById('manualRate').value);
        if (manualRate && manualRate > 0) {
            exchangeRate = manualRate;
            document.getElementById('exchangeRate').textContent = exchangeRate.toFixed(4);
        } else {
            alert('Wpisz prawidłowy kurs');
        }
    });

    // Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
});