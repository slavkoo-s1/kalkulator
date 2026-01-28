# Kalkulator Importu Pojazdów - Instrukcja Instalacji

## 📦 Zawartość pakietu

```
kalkulator-importu/
├── index.html          # Główny plik aplikacji
├── app.js             # Logika kalkulatora
├── manifest.json      # Konfiguracja PWA
├── sw.js             # Service Worker (offline mode)
├── icon-*.png        # Ikony aplikacji (różne rozmiary)
├── favicon-*.png     # Favicon dla przeglądarki
└── README.md         # Ta instrukcja
```

## 🚀 Instalacja na serwerze

### 1. Wgraj wszystkie pliki na serwer
- Prześlij wszystkie pliki do katalogu na swoim serwerze (np. `/public_html/kalkulator/`)
- Upewnij się, że **zachowujesz strukturę plików**

### 2. Wymagania serwera
- ✅ **HTTPS jest WYMAGANE** dla pełnej funkcjonalności PWA
- ✅ Serwer musi obsługiwać pliki `.json` i `.js`
- ✅ Poprawne nagłówki MIME (większość serwerów ma to domyślnie)

### 3. Opcjonalna konfiguracja (dla Apache)
Możesz stworzyć plik `.htaccess` z następującą zawartością:

```apache
# Cache control
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
</IfModule>

# MIME types
AddType application/manifest+json .json
AddType application/javascript .js
```

## 📱 Instalacja na iPhone

### Po wgraniu na serwer:

1. **Otwórz Safari** na iPhone (tylko Safari!)
2. Wejdź na adres: `https://twoja-domena.pl/kalkulator/`
3. Kliknij przycisk **Udostępnij** (⬆️ na dole ekranu)
4. Przewiń w dół i wybierz **"Dodaj do ekranu początkowego"**
5. Nazwij aplikację (np. "Import")
6. Kliknij **Dodaj**

### ✅ Gotowe!
Aplikacja pojawi się na ekranie głównym z ikoną 🚗 i będzie działać jak natywna aplikacja iOS!

## 🔧 Funkcje

- ✅ Automatyczne pobieranie kursu EUR/PLN z AUTO1.com (NBP + 0.4%)
- ✅ Obliczanie kosztów: pojazd, transport, dokumenty, akcyza
- ✅ Dodatkowe koszty: przegląd, ubezpieczenie, rejestracja, pranie, naprawy
- ✅ Walidacja pól z wizualnym podświetleniem błędów
- ✅ Działa offline po pierwszym załadowaniu
- ✅ Responsywny design dla iPhone 15 Pro

## 🌐 Testowanie lokalne

Jeśli chcesz przetestować przed wgraniem na serwer:

```bash
# Uruchom prosty serwer HTTP w katalogu z plikami:
python3 -m http.server 8000

# Otwórz w przeglądarce:
# http://localhost:8000
```

## 📊 Kraje i koszty dokumentów (EUR)

- Austria: 468
- Belgia: 448
- Niemcy: 448
- Dania: 408
- Hiszpania: 534
- Finlandia: 368
- Francja: 418
- Włochy: 628
- Holandia: 474
- Polska: 278
- Portugalia: 408
- Szwecja: 461

## 💰 Akcyza

- 3.1%
- 18.5%

## 🔄 Aktualizacje

Aby zaktualizować aplikację:
1. Podmień pliki na serwerze
2. Zmień wersję cache w `sw.js` (np. `v1` → `v2`)
3. Użytkownicy automatycznie pobiorą nową wersję przy następnym otwarciu

## ⚙️ Dostosowanie

### Zmiana domyślnych wartości:
Edytuj `index.html`, znajdź sekcję z inputami i zmień wartości `value=""`:

```html
<input type="number" id="inspection" value="149" step="0.01">
```

### Zmiana marży AUTO1:
Edytuj `app.js`, znajdź linię:

```javascript
const AUTO1_MARGIN = 1.004; // 0.4% margin
```

### Zmiana kolorów:
Edytuj `index.html`, znajdź sekcję `<style>` i zmień kolory w `:root` lub bezpośrednio w CSS.

## 🐛 Rozwiązywanie problemów

**Problem:** Aplikacja nie działa
- ✅ Sprawdź czy używasz HTTPS
- ✅ Sprawdź konsolę błędów w Safari (Ustawienia → Safari → Zaawansowane → Web Inspector)

**Problem:** Nie mogę dodać do ekranu głównego
- ✅ Musisz użyć Safari (nie Chrome ani inne przeglądarki)
- ✅ Sprawdź czy masz HTTPS

**Problem:** Kurs nie pobiera się automatycznie
- ✅ Sprawdź połączenie internetowe
- ✅ Użyj ręcznego wprowadzenia kursu
- ✅ API NBP może być czasowo niedostępne (fallback na inne źródła działa automatycznie)

## 📧 Wsparcie

Masz pytania? Potrzebujesz modyfikacji? Napisz!

---

**Wersja:** 1.0  
**Data:** 28.01.2026  
**Kompatybilność:** iOS 14+, Safari, Chrome, Firefox
