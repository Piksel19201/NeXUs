// --- ZMIENNE GLOBALNE ---
let songs = [];
let currentIndex = 0;
let isAnimating = false;
let introActive = true; 
const audio = document.getElementById('audio-player');
audio.volume = 0.2; 

// --- FUNKCJE INTERFEJSU ---
function toggleMenu() {
    const menu = document.getElementById('side-menu'); // sprawdź czy masz takie ID
    const trigger = document.querySelector('.menu-trigger');
    
    menu.classList.toggle('active');
    trigger.classList.toggle('active');
}

function switchCard(cardType, event) {
    const targetCard = document.getElementById(`card-${cardType}`);
    const currentActive = document.querySelector('.active-card');
    const lastLeft = document.querySelector('.exit-left');

    if (!targetCard || targetCard === currentActive) return;
    if (lastLeft) lastLeft.classList.remove('exit-left');

    if (currentActive) {
        currentActive.classList.remove('active-card');
        currentActive.classList.add('exit-left');
    }

    targetCard.classList.remove('exit-left'); 
    targetCard.classList.add('active-card');

    // Aktualizacja podświetlenia przycisków (pills)
    document.querySelectorAll('.nav-pill').forEach(btn => btn.classList.remove('active'));
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// --- EKRAN POWITALNY (INTRO) ---
function startExperience() {
    if (!introActive) return;
    introActive = false;

    const introScreen = document.getElementById('intro-screen');
    const playBtn = document.getElementById('master-play');

    if (audio.src) {
        audio.play().then(() => {
            if (playBtn) playBtn.innerText = "⏸";
        }).catch(e => console.log("Autoplay error:", e));
    }

    introScreen.classList.add('fade-out');
    setTimeout(() => {
        introScreen.remove();
    }, 800);
}

// --- LOGIKA ODTWARZACZA I PROFILU ---

async function init() {
    // ... rok w stopce ...

    const params = new URLSearchParams(window.location.search);
    const userId = params.get('u'); // np. index.html?u=ID_Z_FIREBASE

    let data;

    try {
        if (userId && userId.length > 15) { // Jeśli to długie ID z Firebase
            const doc = await db.collection("public_bios").doc(userId).get();
            if (doc.exists) {
                data = doc.data();
            } else {
                throw new Error("Profil nie istnieje w chmurze");
            }
        } else {
            // Standardowe ładowanie z Twoich plików lokalnych
            const user = userId || 'default';
            const response = await fetch(`./profiles/${user}.json`);
            data = await response.json();
        }
        // 1. Podstawowe dane profilu (Top bar / Avatar)
        const nameEl = document.getElementById('user-name');
        const subtitleEl = document.getElementById('user-subtitle');
        const avatarImg = document.getElementById('user-avatar');
        const bannerImg = document.getElementById('user-banner');

        if (nameEl) nameEl.innerText = data.name || "Piksel";
        if (subtitleEl) subtitleEl.innerText = data.subtitle || "";
        if (avatarImg && data.avatar) avatarImg.src = data.avatar;
        if (bannerImg && data.banner) bannerImg.src = data.banner;

        // 2. DYNAMICZNE GENEROWANIE STRON (Pills i Kontenery)
        const navContainer = document.querySelector('.side-navigation') || document.querySelector('.nav-pills');
        const cardsParent = document.querySelector('.cards-wrapper');

        if (data.pages && navContainer && cardsParent) {
            navContainer.innerHTML = ''; 

            data.pages.forEach((page, index) => {
                // Generowanie przycisku (Pastylki)
                const pill = document.createElement('button');
                pill.className = `nav-pill ${index === 0 ? 'active' : ''}`;
                pill.onclick = (e) => switchCard(page.id, e);
                pill.innerHTML = `<span class="label">${page.label}</span>`;
                navContainer.appendChild(pill);

                // Tworzenie karty, jeśli nie istnieje
                let card = document.getElementById(`card-${page.id}`);
                if (!card) {
                    card = document.createElement('div');
                    card.id = `card-${page.id}`;
                    card.className = `glass-container ${index === 0 ? 'active-card' : ''}`;
                    cardsParent.appendChild(card);
                }

                // --- LOGIKA WYPEŁNIANIA TREŚCIĄ ---
                
                // TYP: BIO (Kafelki - uniwersalne dla Bio, Hardware, Setup itp.)
                if (page.type === 'bio') {
                    card.innerHTML = `<h2>${page.label}</h2>`;
                    const listDiv = document.createElement('div');
                    listDiv.className = 'bio-list';
                    
                    // Dynamiczny klucz danych: jeśli id to "hardware", szuka "hardware_tiles"
                    const dataKey = `${page.id}_tiles`;
                    const tiles = data[dataKey] || [];
                    
                    tiles.forEach(tile => {
                        listDiv.innerHTML += `
                            <div class="bio-section">
                                <h3 class="bio-header">${tile.title}</h3>
                                <div class="bio-box"><p>${tile.value}</p></div>
                            </div>`;
                    });
                    card.appendChild(listDiv);
                } 
                
                // TYP: LINKS (Social Media)
                else if (page.type === 'links') {
                    card.innerHTML = `<h2>${page.label}</h2>`;
                    const linksStack = document.createElement('div');
                    linksStack.className = 'links-stack';
                    
                    if (data.links) {
                        data.links.forEach(link => {
                            linksStack.innerHTML += `
                                <a href="${link.url}" target="_blank" class="link-item">
                                    <span class="icon">${link.icon || '🔗'}</span> ${link.title}
                                </a>`;
                        });
                    }
                    card.appendChild(linksStack);
                }
                
                // TYP: PROFILE (Oryginalny układ z banerem i avatarem wewnątrz karty)
                else if (page.type === 'profile') {
                    card.classList.add('profile-card-layout');
                    // Zakładamy, że struktura HTML profilu jest już częściowo w index.html
                    // Jeśli karta jest pusta, można tu wstrzyknąć strukturę banner/avatar
                }
            });
        }

        // 3. Inicjalizacja Muzyki
        if (data.songs && data.songs.length > 0) {
            songs = data.songs;
            updatePlayer(0);
            const playerBody = document.querySelector('.player-body');
            if (playerBody) playerBody.classList.add('active-track');
        }

    } catch (e) {
        console.error("Błąd ładowania danych:", e);
    }
}

// --- LOGIKA ODTWARZACZA ---
async function updatePlayer(index) {
    if (!songs[index]) return;
    
    const song = songs[index];
    const trackCover = document.getElementById('track-cover');
    const trackTitle = document.getElementById('track-title');
    const trackArtist = document.getElementById('track-artist');
    const playerMain = document.getElementById('music-card');

    if (playerMain) {
        playerMain.style.opacity = '0.7';
        playerMain.style.transform = 'translateY(-50%) scale(0.98)';
    }

    trackTitle.innerText = song.title;
    trackArtist.innerText = "by " + song.artist;
    
    audio.src = song.src;
    if (!introActive) {
        audio.play().catch(e => console.log("Autoplay blocked:", e));
    }

    if (song.cover && song.cover.trim() !== "") {
        trackCover.src = song.cover;
    } else {
        let query = `${song.artist} ${song.title}`.replace(/\(.*\)|\[.*\]/g, '').trim();
        try {
            const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`);
            const itunesData = await res.json();
            if (itunesData.results && itunesData.results.length > 0) {
                trackCover.src = itunesData.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
            } else {
                trackCover.src = 'assets/default-cover.png';
            }
        } catch (e) {
            trackCover.src = 'assets/default-cover.png';
        }
    }

    setTimeout(() => {
        if (playerMain) {
            playerMain.style.opacity = '1';
            playerMain.style.transform = 'translateY(-50%) scale(1)';
        }
    }, 150);
}

function changeTrack(direction) {
    if (!songs || songs.length === 0) return;
    currentIndex = direction === 'next' ? (currentIndex + 1) % songs.length : (currentIndex - 1 + songs.length) % songs.length;
    updatePlayer(currentIndex);
}

window.togglePlay = () => {
    if (introActive) return;
    const btn = document.getElementById('master-play');
    if (audio.paused) {
        audio.play();
        btn.innerText = "⏸";
    } else {
        audio.pause();
        btn.innerText = "▶";
    }
};

// Eventy Audio
audio.onended = () => changeTrack('next');
audio.onplay = () => { if (document.getElementById('master-play')) document.getElementById('master-play').innerText = "⏸"; };
audio.onpause = () => { if (document.getElementById('master-play')) document.getElementById('master-play').innerText = "▶"; };

window.onload = init;