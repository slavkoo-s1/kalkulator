// Mode switching
const modeBtns = document.querySelectorAll('.mode-btn');
const sections = document.querySelectorAll('.section');

modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(mode === 'simple' ? 'simpleSection' : 'aiSection').classList.add('active');
    });
});

// ========== SIMPLE CALCULATOR ==========

document.getElementById('simpleCalcForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const cost = parseFloat(document.getElementById('simpleCost').value) || 0;
    const transport = parseFloat(document.getElementById('simpleTransport').value) || 0;
    const countryData = document.getElementById('simpleCountry').value.split('|');
    const docs = parseFloat(countryData[1]) || 0;
    const engine = parseInt(document.getElementById('simpleEngine').value) || 0;
    const rate = parseFloat(document.getElementById('simpleRate').value) || 4.22;
    
    // Calculate excise
    const exciseRate = engine > 0 ? (engine <= 1999 ? 0.031 : 0.185) : 0.031;
    
    const costPLN = cost * rate;
    const transportPLN = transport * rate;
    const docsPLN = docs * rate;
    const excisePLN = costPLN * exciseRate;
    const additionalPLN = 660; // Fixed
    
    const total = costPLN + transportPLN + docsPLN + excisePLN + additionalPLN;
    
    document.getElementById('simpleResultCar').textContent = formatPLN(costPLN);
    document.getElementById('simpleResultTransport').textContent = formatPLN(transportPLN);
    document.getElementById('simpleResultDocs').textContent = formatPLN(docsPLN);
    document.getElementById('simpleResultExcise').textContent = formatPLN(excisePLN);
    document.getElementById('simpleResultAdditional').textContent = formatPLN(additionalPLN);
    document.getElementById('simpleResultTotal').textContent = formatPLN(total);
});

function formatPLN(value) {
    return new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value) + ' PLN';
}

// ========== AI ANALYSIS ==========

// Load OpenAI key
const savedKey = localStorage.getItem('openai_api_key');
if (savedKey) {
    document.getElementById('openaiKey').value = savedKey;
}

document.getElementById('openaiKey').addEventListener('change', (e) => {
    localStorage.setItem('openai_api_key', e.target.value);
    updateAnalyzeBtn();
});

// Image handling
let uploadedImages = [];
const uploadZone = document.getElementById('uploadZone');
const imageInput = document.getElementById('imageInput');
const thumbnailsContainer = document.getElementById('thumbnails');
const analyzeBtn = document.getElementById('analyzeBtn');

uploadZone.addEventListener('click', () => imageInput.click());

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragging');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragging');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragging');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleImageUpload(files);
});

imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleImageUpload(files);
});

async function handleImageUpload(files) {
    for (const file of files) {
        const base64 = await fileToBase64(file);
        const dataUrl = await fileToDataUrl(file);
        uploadedImages.push({ file, base64, dataUrl });
    }
    updateThumbnails();
    updateAnalyzeBtn();
}

function fileToBase64(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.readAsDataURL(file);
    });
}

function fileToDataUrl(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });
}

function updateThumbnails() {
    thumbnailsContainer.innerHTML = '';
    uploadedImages.forEach((img, index) => {
        const div = document.createElement('div');
        div.className = 'thumbnail';
        div.innerHTML = `
            <img src="${img.dataUrl}" alt="Screenshot ${index + 1}">
            <button class="thumbnail-remove" onclick="removeImage(${index})">×</button>
        `;
        thumbnailsContainer.appendChild(div);
    });
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    updateThumbnails();
    updateAnalyzeBtn();
}

function updateAnalyzeBtn() {
    const hasKey = document.getElementById('openaiKey').value.trim().length > 0;
    const hasImages = uploadedImages.length > 0;
    analyzeBtn.disabled = !hasKey || !hasImages;
}

// Main analysis
analyzeBtn.addEventListener('click', analyzeVehicle);

async function analyzeVehicle() {
    const openaiKey = document.getElementById('openaiKey').value;
    
    if (!openaiKey || !openaiKey.startsWith('sk-')) {
        alert('Wprowadź prawidłowy klucz API OpenAI');
        return;
    }

    if (uploadedImages.length === 0) {
        alert('Dodaj przynajmniej jedno zdjęcie');
        return;
    }

    document.getElementById('analyzing').classList.add('show');

    try {
        const imageMessages = uploadedImages.map(img => ({
            type: 'image_url',
            image_url: {
                url: `data:image/jpeg;base64,${img.base64}`,
                detail: 'high'
            }
        }));

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{
                    role: 'user',
                    content: [
                        ...imageMessages,
                        {
                            type: 'text',
                            text: `Analizujesz screenshoty z AUTO1.com. Może być 1 lub więcej zdjęć tego samego pojazdu.

**ZADANIE 1: EKSTRAKCJA DANYCH**
1. Pełna nazwa: marka, model, wersja (np. "Volkswagen Polo 1.4 FSI Comfortline")
2. Rok produkcji
3. Przebieg (km, tylko liczba)
4. Pojemność silnika (ccm, tylko liczba)
5. Cena pojazdu (EUR, tylko liczba)
6. NAJTAŃSZY transport do Polski/Jasionka (EUR, tylko liczba)
7. Lokalizacja pojazdu (kraj, np. "IT", "DE")
8. Wyposażenie - NA PODSTAWIE WERSJI:
   - Comfortline/Comfort = średnie wyposażenie
   - Highline/Style/Premium = bogate wyposażenie
   - Trendline/Base = podstawowe wyposażenie

**ZADANIE 2: ANALIZA RYNKU (Polski rynek - Otomoto, OLX)**
Zakładamy BARDZO DOBRY stan wizualny i techniczny.

Oblicz koszty:
- Dokumenty: zobacz kraj pochodzenia, domyślnie 448 EUR (DE)
- Akcyza: 3.1% jeśli ≤1999ccm, 18.5% jeśli >1999ccm
- Dodatkowe: 660 PLN
- Kurs: 4.22 PLN

CAŁKOWITY KOSZT = (cena + transport + dokumenty) × 4.22 + akcyza + 660

**ZADANIE 3: STRATEGIA UWZGLĘDNIAJĄCA WYPOSAŻENIE**
- Jeśli Comfortline/Highline - podkreśl bogate wyposażenie w strategii
- Jeśli podstawowa wersja - sugeruj dodanie wyposażenia

**FORMAT JSON:**
{
  "vehicle": {
    "model": "Volkswagen Polo 1.4 FSI Comfortline",
    "year": 2009,
    "mileage": 224328,
    "engine": 1390,
    "priceEur": 1611,
    "transportEur": 454,
    "trim": "Comfortline",
    "equipment": "Średnie wyposażenie - klimatyzacja, elektryczne szyby, centralny zamek, ABS, ESP"
  },
  "costs": {
    "totalPln": 10500,
    "breakdown": {
      "vehicle": 6798,
      "transport": 1916,
      "documents": 1890,
      "excise": 236,
      "additional": 660
    }
  },
  "analysis": {
    "recommendation": "Jasna rekomendacja czy warto (2-3 zdania)",
    "salesPotential": "Potencjał sprzedaży, popularność (2-3 zdania)",
    "estimatedSalePrice": 12000,
    "profitMargin": 1500,
    "profitPercent": 14,
    "turnoverAssessment": "SZYBKI OBRÓT / ŚREDNIA ROTACJA / LEŻAK - uzasadnienie (2-3 zdania)",
    "pros": [
      "Konkretny plus bazujący na modelu i wyposażeniu",
      "Kolejny plus",
      "Trzeci plus"
    ],
    "cons": [
      "Konkretne ryzyko dla tego modelu",
      "Kolejne ryzyko",
      "Trzecie ryzyko"
    ],
    "salesStrategy": {
      "listingPrice": "11 500 - 12 500 PLN - uzasadnienie z uwzględnieniem wyposażenia",
      "improvements": "Co poprawić/wymienić, uwzględnij wersję wyposażenia",
      "marketingTips": "Jak opisać - podkreśl wyposażenie Comfortline jeśli jest",
      "targetBuyer": "Profil kupującego dla tego konkretnego modelu"
    }
  }
}

Bądź konkretny dla polskiego rynku. Uwzględnij wyposażenie w analizie.`
                        }
                    ]
                }],
                max_tokens: 2500,
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        const result = JSON.parse(data.choices[0].message.content);

        displayAIResults(result);

    } catch (error) {
        console.error('Error:', error);
        alert('❌ Błąd: ' + error.message);
    } finally {
        document.getElementById('analyzing').classList.remove('show');
    }
}

function displayAIResults(result) {
    const { vehicle, costs, analysis } = result;

    // Vehicle info
    document.getElementById('aiVehicleModel').textContent = vehicle.model;
    document.getElementById('aiVehicleYear').textContent = vehicle.year;
    document.getElementById('aiVehicleMileage').textContent = 
        vehicle.mileage.toLocaleString('pl-PL') + ' km';
    document.getElementById('aiVehicleEngine').textContent = vehicle.engine + ' ccm';

    // Costs
    document.getElementById('aiCostCar').textContent = formatPLN(costs.breakdown.vehicle);
    document.getElementById('aiCostTransport').textContent = formatPLN(costs.breakdown.transport);
    document.getElementById('aiCostDocs').textContent = formatPLN(costs.breakdown.documents);
    document.getElementById('aiCostExcise').textContent = formatPLN(costs.breakdown.excise);
    document.getElementById('aiCostAdditional').textContent = formatPLN(costs.breakdown.additional);
    document.getElementById('aiCostTotal').textContent = formatPLN(costs.totalPln);

    // Analysis
    document.getElementById('aiRecommendation').textContent = analysis.recommendation;
    document.getElementById('aiSalePrice').textContent = formatPLN(analysis.estimatedSalePrice);
    
    const profitColor = analysis.profitMargin > 0 ? 'var(--success)' : 'var(--danger)';
    document.getElementById('aiProfit').innerHTML = 
        `Zysk: <span style="color: ${profitColor}">${formatPLN(analysis.profitMargin)} (${analysis.profitPercent}%)</span>`;
    
    document.getElementById('aiTurnover').textContent = analysis.turnoverAssessment;
    
    document.getElementById('aiPros').innerHTML = 
        '<ul>' + analysis.pros.map(item => `<li>${item}</li>`).join('') + '</ul>';
    
    document.getElementById('aiCons').innerHTML = 
        '<ul>' + analysis.cons.map(item => `<li>${item}</li>`).join('') + '</ul>';

    // Strategy
    const strategyGrid = document.getElementById('strategyGrid');
    strategyGrid.innerHTML = `
        <div class="strategy-card">
            <div class="strategy-icon">💵</div>
            <div class="strategy-title">Cena wywoławcza</div>
            <div class="strategy-content">${analysis.salesStrategy.listingPrice}</div>
        </div>
        <div class="strategy-card">
            <div class="strategy-icon">🔧</div>
            <div class="strategy-title">Poprawki</div>
            <div class="strategy-content">${analysis.salesStrategy.improvements}</div>
        </div>
        <div class="strategy-card">
            <div class="strategy-icon">📝</div>
            <div class="strategy-title">Marketing</div>
            <div class="strategy-content">${analysis.salesStrategy.marketingTips}</div>
        </div>
        <div class="strategy-card">
            <div class="strategy-icon">👤</div>
            <div class="strategy-title">Docelowy kupujący</div>
            <div class="strategy-content">${analysis.salesStrategy.targetBuyer}</div>
        </div>
    `;

    // Show results
    document.getElementById('analysisResults').classList.add('show');
    document.getElementById('analysisResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
