function toggleMenu() {
    const menu = document.getElementById('side-menu');
    menu.classList.toggle('active');
}

// Funkcja ładująca dane
async function loadProfile() {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('u') || 'default'; // Pobiera ?u=nazwa, domyślnie 'default'

    try {
        const response = await fetch(`./profiles/${user}.json`);
        
        if (!response.ok) throw new Error('Profil nie znaleziony');
        
        const data = await response.json();

        // Podmiana danych w HTML
        document.getElementById('user-name').innerText = data.name;
        document.getElementById('user-bio').innerText = data.bio;
        document.getElementById('user-avatar').src = data.avatar;
        document.title = `${data.name} | Bio`;

        // Generowanie linków
        const linksContainer = document.getElementById('links-container');
        linksContainer.innerHTML = ''; // Czyścimy loader

        data.links.forEach(link => {
            const a = document.createElement('a');
            a.className = 'link-item';
            a.href = link.url;
            a.target = '_blank';
            a.innerHTML = `<span>${link.icon} ${link.title}</span>`;
            linksContainer.appendChild(a);
        });

    } catch (error) {
        console.error(error);
        document.getElementById('user-name').innerText = "Profil nie istnieje";
        document.getElementById('user-bio').innerText = "Sprawdź poprawność linku.";
    }
}

// Uruchom ładowanie po wczytaniu strony
window.onload = loadProfile;

/* --- LOGIKA PRZEŁĄCZANIA KART --- */

function switchCard(cardType, event) {
    // 1. Znajdź wszystkie karty i przyciski
    const allCards = document.querySelectorAll('.glass-container');
    const allButtons = document.querySelectorAll('.dock-item');
    const targetCard = document.getElementById(`card-${cardType}`);

    // 2. Jeśli karta już jest aktywna, nic nie rób
    if (targetCard.classList.contains('active-card')) return;

    // 3. Obecna aktywna karta dostaje efekt wyjścia w lewo
    const currentActive = document.querySelector('.active-card');
    if (currentActive) {
        currentActive.classList.remove('active-card');
        currentActive.classList.add('exit-left');
        
        // Resetujemy jej pozycję po zakończeniu animacji (ukrywamy ją)
        setTimeout(() => {
            currentActive.classList.remove('exit-left');
        }, 600);
    }

    // 4. Aktywujemy nową wybraną kartę
    targetCard.classList.add('active-card');

    // 5. Zmieniamy wygląd przycisków w menu bocznym
    allButtons.forEach(btn => btn.classList.remove('active'));
    if (event) {
        event.currentTarget.classList.add('active');
    }
}
