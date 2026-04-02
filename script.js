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