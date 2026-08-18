document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ GOOGLE APPS SCRIPT WEB APP URL
    const API_URL = 'https://script.google.com/macros/s/AKfycbykBasezQeVMdXDlO4ZlLy9Djy5ArLlFtGnpeRLGwDV2OU5pIx_Dd827UMNgf_Jg4V_/exec';

    // 👉 LA VARIABLE DOIT ÊTRE ICI
    let currentLang = 'en';

    // Ton écouteur pour le bouton
    const langBtn = document.getElementById('lang-switch');
    if (langBtn) {
        langBtn.addEventListener('click', async (e) => {
            e.preventDefault(); 
            
            // 1. On active le mode "chargement" sur le bouton
            langBtn.classList.add('is-loading');
            langBtn.innerHTML = '<span class="desktop-text">Loading... ⏳</span><span class="mobile-text">⏳</span>';
            
            // 2. 🪄 LA MAGIE : On affiche un Loader ultra clean à la place des questions
            const mainContainer = document.querySelector('.faq-body');
            const tabsContainer = document.querySelector('.faq-category-tabs');
            
            if (mainContainer && tabsContainer) {
                tabsContainer.innerHTML = ''; // On cache les catégories le temps du chargement
                mainContainer.innerHTML = `
                    <div style="text-align: center; padding: 60px 0; opacity: 0; animation: fadeInUp 0.4s forwards;">
                        <div style="width: 40px; height: 40px; border: 4px solid #E8E9E5; border-top: 4px solid #509E2F; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                        <p style="margin-top: 20px; color: #509E2F; font-weight: 600; letter-spacing: 0.5px;">💎</p>
                    </div>
                `;
            }
            
            // 3. On bascule la langue
            currentLang = (currentLang === 'en') ? 'fr' : 'en';
            // 3.5 Traduction des textes fixes de la page
            // 3.5 Traduction des textes fixes de la page ET du Chatbot
            const mainTitle = document.getElementById('hero-title');
            const subtitle = document.getElementById('hero-subtitle');
            const searchInput = document.getElementById('search-input');
            
            // Les nouveaux sélecteurs pour le chatbot de Mathilde 🤖
            const chatTitle = document.getElementById('chatTitle');
            const chatSubtitle = document.getElementById('chatSubtitle');
            const chatWelcome = document.getElementById('chatWelcome');
            const chatInput = document.getElementById('chatInput');
            const chatFabText = document.getElementById('chatFabText');

            if (currentLang === 'fr') {
                // --- TEXTES PAGE ---
                if (mainTitle) mainTitle.innerText = "Des questions ? Nous avons les réponses.";
                if (subtitle) subtitle.innerText = "Tout ce que vous devez savoir pour rejoindre Enko Education en tant qu'enseignant — de la candidature à votre premier jour.";
                if (searchInput) searchInput.placeholder = "Rechercher une question, ex. 'Quels documents dois-je fournir ?'";
                
                // --- CHATBOT EN FRANÇAIS ---
                if (chatTitle) chatTitle.innerText = "Posez vos questions";
                if (chatSubtitle) chatSubtitle.innerText = "Assistant Enko Education • En ligne";
                if (chatWelcome) chatWelcome.innerText = "Bonjour ! 👋 Je suis GEM, votre guide Enko Education. Posez-moi toutes vos questions sur notre processus de candidature, nos postes d'enseignants ou nos avantages !";
                if (chatInput) chatInput.placeholder = "Tapez votre question ici...";
                if (chatFabText) chatFabText.innerText = "Posez vos questions";

            } else {
                // --- TEXTES PAGE ---
                if (mainTitle) mainTitle.innerText = "Got questions? We've got answers.";
                if (subtitle) subtitle.innerText = "Everything you need to know about joining Enko Education as a teacher — from application to your first day.";
                if (searchInput) searchInput.placeholder = "Search a question, e.g. 'What documents do I need?'";
                
                // --- CHATBOT EN ANGLAIS ---
                if (chatTitle) chatTitle.innerText = "Ask GEM";
                if (chatSubtitle) chatSubtitle.innerText = "Enko Education Assistant • Online";
                if (chatWelcome) chatWelcome.innerText = "Hi there! 👋 I'm GEM, your Enko Education guide. Ask me anything about our application process, teaching roles, or benefits!";
                if (chatInput) chatInput.placeholder = "Type your question here...";
                if (chatFabText) chatFabText.innerText = "Ask GEM";
            }
            
            // 4. On attend que Google Apps Script fasse son travail
            await fetchFAQData();
            
           // 5. Google a répondu ! On remet le bouton à la normale
            langBtn.classList.remove('is-loading');
            if (currentLang === 'fr') {
                langBtn.innerHTML = '<span class="desktop-text">Click here for English version!</span><span class="mobile-text">ENG</span>';
            } else {
                langBtn.innerHTML = '<span class="desktop-text">Cliquer ici pour la version française!</span><span class="mobile-text">FR</span>';
            }
        });
    }

    // Ensuite tes autres variables (categoryMap, styleMap, etc...)

    const categoryMap = {
        // 🇬🇧 Catégories Anglaises
        "Application Info": "application",
        "Platform Support": "platform",
        "Document Rules": "documents",
        "Recruitment & Pipeline": "recruitment",
        "Employment & Benefits": "employment",
        
        // 🇫🇷 Catégories Françaises (ajuste les noms si besoin)
        "Informations Candidature": "application",
        "Support Plateforme": "platform",
        "Règles Documentaires": "documents",
        "Recrutement & Vivier": "recruitment",
        "Emploi & Avantages": "employment"
    };

    // Map specific icons and colors to each category
    const styleMap = {
        "application": { icon: "ti-user-check", color: "icon-green" },
        "platform": { icon: "ti-settings", color: "icon-gold" },
        "documents": { icon: "ti-file-certificate", color: "icon-navy" },
        "recruitment": { icon: "ti-git-branch", color: "icon-red" },
        "employment": { icon: "ti-cash", color: "icon-green" },
        "default": { icon: "ti-help", color: "icon-green" } 
    };

    // 1. FETCH DATA FROM GOOGLE SHEETS
    async function fetchFAQData() {
        try {
            // On ajoute la langue à l'URL pour demander le bon onglet
            const response = await fetch(`${API_URL}?lang=${currentLang}`);
            const data = await response.json();
            renderFAQs(data);
            initializeInteractions(); 
        } catch (error) {
            console.error("Error fetching FAQ data:", error);
        }
    }

// 2. RENDER THE DATA INTO HTML
    function renderFAQs(faqData) {
        const tabsContainer = document.querySelector('.faq-category-tabs');
        const mainContainer = document.querySelector('.faq-body'); 
        
        // Le bon label selon la langue
        const allLabel = (currentLang === 'fr') ? 'Tout' : 'All';

        // 👉 On met LE BON TAG, et on ne l'écrase pas en dessous !
        tabsContainer.innerHTML = `<div class="tab active" data-target="all">${allLabel}</div>`;
        mainContainer.innerHTML = '';

        // THE SMART PARSER: Detects links and Drive files automatically
        function formatContent(text) {
            if (!text) return '';
            
            let html = String(text);

            // 1. FIRST: Convert Markdown links [Click Here](https://...) into clean HTML links
            html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, linkText, url) => {
                return `<a href="${url}" target="_blank" style="color: #509E2F; text-decoration: underline; font-weight: 600;">${linkText}</a>`;
            });

            // 2. SECOND: Handle standalone Google Drive Links for media embedding
            const driveRegex = /(?<!href=")(?<!href=')https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)(?:\/[^\s"<)]*)?/g;

            html = html.replace(driveRegex, (match, fileId) => {
                const isVideo = match.toLowerCase().includes('video') || 
                                match.toLowerCase().includes('.mp4') || 
                                match.toLowerCase().includes('.mov') ||
                                html.toLowerCase().includes('video');

                if (isVideo) {
                    return `
                        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; border-radius: 8px; margin: 12px 0; border: 1px solid #E8E9E5;">
                            <iframe src="https://drive.google.com/file/d/${fileId}/preview" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" allow="autoplay" allowfullscreen></iframe>
                        </div>
                    `;
                } else {
                    return `<img src="https://drive.google.com/thumbnail?id=${fileId}&sz=w800" style="max-width: 100%; border-radius: 8px; margin-top: 12px; margin-bottom: 12px; display: block; border: 1px solid #E8E9E5;" alt="FAQ visual">`;
                }
            });

            // 3. THIRD: Safely preserve paragraph line breaks from your Google Sheet
            html = html.replace(/\n/g, '<br>');

            return html;
        }

        faqData.forEach(item => {
            const sheetCategory = item.category.trim();
            let catKey = categoryMap[sheetCategory];

            // If it's a completely brand new category not in our map setup
            if (!catKey) {
                catKey = sheetCategory.toLowerCase().replace(/[^a-z0-9]/g, '-');
                categoryMap[sheetCategory] = catKey;
            }

            // 🔥 FIX: Build tabs using the exact same structure as the "All" div!
            if (!document.querySelector(`.tab[data-target="${catKey}"]`)) {
                
                // Don't duplicate the 'All' tab if it's already there
                if (catKey !== 'all') {
                    const tabHTML = `<div class="tab" data-target="${catKey}">${sheetCategory}</div>`;
                    tabsContainer.insertAdjacentHTML('beforeend', tabHTML);
                }

                const sectionHTML = `
                  <div class="faq-section" data-category="${catKey}" style="display: none;">
                    <div class="faq-section-label" style="margin-top:20px; font-weight:700; color:#509E2F; font-size:12px; letter-spacing:1px; margin-bottom:15px;">${sheetCategory}</div>
                  </div>
                `;
                mainContainer.insertAdjacentHTML('beforeend', sectionHTML);
            }

            const section = document.querySelector(`.faq-section[data-category="${catKey}"]`);

            if (section) {
                const styles = styleMap[catKey] || styleMap['default'];
                const formattedAnswer = formatContent(item.answer);
                
                const faqHTML = `
                  <div class="faq-item">
                    <div class="faq-item-header">
                      <div class="faq-item-icon ${styles.color}"><i class="ti ${styles.icon}"></i></div>
                      <span class="faq-question">${item.question}</span>
                      <i class="ti ti-chevron-down faq-chevron"></i>
                    </div>
                    <div class="faq-answer">${formattedAnswer}</div>
                  </div>
                `;
                section.insertAdjacentHTML('beforeend', faqHTML);
            }
        });
    }

    // 3. INITIALIZE UI INTERACTIONS 
    function initializeInteractions() {
        const faqItems = document.querySelectorAll('.faq-item');
        const faqSections = document.querySelectorAll('.faq-section');
        const tabs = document.querySelectorAll('.tab');
        const searchBar = document.querySelector('.faq-search-bar');

        // Accordion Setup
        faqItems.forEach(item => {
            const header = item.querySelector('.faq-item-header');
            header.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                faqItems.forEach(i => i.classList.remove('open'));
                if (!isOpen) item.classList.add('open');
            });
        });

        // Tabs Setup
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const targetCategory = tab.getAttribute('data-target');

                faqSections.forEach(section => {
                    const sectionCategory = section.getAttribute('data-category');
                    if (targetCategory === 'all' || targetCategory === sectionCategory) {
                        section.style.display = 'block';
                        section.querySelectorAll('.faq-item').forEach(i => i.style.display = 'block');
                    } else {
                        section.style.display = 'none';
                    }
                });
            });
        });

        // Search Setup
        if (searchBar) {
            searchBar.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                
                if (query.length > 0) {
                    tabs.forEach(t => t.classList.remove('active'));
                    const allTab = document.querySelector('.tab[data-target="all"]');
                    if(allTab) allTab.classList.add('active'); 
                }

                faqSections.forEach(section => {
                    let sectionHasMatches = false;
                    const items = section.querySelectorAll('.faq-item');

                    items.forEach(item => {
                        const question = item.querySelector('.faq-question').textContent.toLowerCase();
                        const answer = item.querySelector('.faq-answer').textContent.toLowerCase();

                        if (question.includes(query) || answer.includes(query)) {
                            item.style.display = 'block';
                            sectionHasMatches = true;
                        } else {
                            item.style.display = 'none';
                        }
                    });

                    section.style.display = sectionHasMatches ? 'block' : 'none';
                });
            });
        }

        // Auto-click 'All' tab to display everything beautifully on first launch
        const initialTab = document.querySelector('.tab[data-target="all"]');
        if (initialTab) {
            initialTab.click();
        }

        // --- CHAT MESSAGES LOGIC ---
        const chatInput = document.getElementById('chatInput');
        const sendChatBtn = document.getElementById('sendChatBtn');
        const chatMessages = document.getElementById('chatMessages');
        
        let chatHistory = []; // This array acts as GEM's short-term memory!

        async function handleUserMessage() {
            const messageText = chatInput.value.trim();
            if (!messageText) return; 

            // 1. Show user message
            chatMessages.insertAdjacentHTML('beforeend', `<div class="message user-message">${messageText}</div>`);
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // 2. Show thinking state
            const thinkingId = 'thinking-' + Date.now();
            chatMessages.insertAdjacentHTML('beforeend', `<div class="message gem-message" id="${thinkingId}"><i>GEM is thinking... 🤖</i></div>`);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // 3. Send request to your Apps Script Web App
            try {
                // 👉 1. GRAB THE CLOUDFLARE TOKEN
                const turnstileToken = turnstile.getResponse();

                const response = await fetch(API_URL, {
                    method: 'POST',
                    // Sending as text/plain prevents CORS preflight errors in Google Apps Script
                    body: JSON.stringify({ 
                        message: messageText, 
                        history: chatHistory,
                        lang: currentLang, // We added this earlier for translation
                        cfToken: turnstileToken // 👉 2. SEND TOKEN TO GOOGLE
                    })
                });

                const data = await response.json();
                
                // 👉 3. RESET THE WIDGET FOR THE NEXT QUESTION
                turnstile.reset();
                
                // Remove thinking bubble safely
                const thinkingElement = document.getElementById(thinkingId);
                if (thinkingElement) thinkingElement.remove();
                
                // 🚨 CHECK FOR BACKEND ERRORS BEFORE PROCEEDING
                if (data.error) {
                    console.error("GOOGLE APPS SCRIPT ERROR:", data.error);
                    chatMessages.insertAdjacentHTML('beforeend', `<div class="message gem-message" style="color:red;"><i>Backend error: ${data.error}</i></div>`);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    return; // Stop the function here
                }

                if (!data.reply) {
                    throw new Error("No reply received from server.");
                }

                // Clean up Gemini's markdown formatting using the ultimate utility function
                const formattedReply = formatChatReply(data.reply);
                
                // Show real answer
                chatMessages.insertAdjacentHTML('beforeend', `<div class="message gem-message">${formattedReply}</div>`);
                chatMessages.scrollTop = chatMessages.scrollHeight;

                // 5. Save the interaction to memory
                chatHistory.push({ role: 'user', text: messageText });
                chatHistory.push({ role: 'model', text: data.reply });

                // Keep memory light
                if(chatHistory.length > 6) chatHistory = chatHistory.slice(-6);

            } catch (error) {
                console.error("Chat Error:", error);
                const thinkingElement = document.getElementById(thinkingId);
                if (thinkingElement) thinkingElement.remove();
                
                chatMessages.insertAdjacentHTML('beforeend', `<div class="message gem-message" style="color:red;"><i>Oops! My connection dropped. Can you try asking again?</i></div>`);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }

        // Trigger message send via button or Enter key
        if (sendChatBtn && chatInput) {
            sendChatBtn.addEventListener('click', handleUserMessage);
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') handleUserMessage();
            });
        }

    // --- CHAT WIDGET TOGGLE ---
        const chatFab = document.querySelector('.ask-gem-fab');
        const chatWidget = document.getElementById('chatWidget');
        const closeChatBtn = document.getElementById('closeChatBtn');

        if (chatFab && chatWidget && closeChatBtn) {
            chatFab.addEventListener('click', () => {
                chatWidget.classList.add('open');
            });

            closeChatBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevents the FAB click from refiring immediately
                chatWidget.classList.remove('open');
            });
        }
    }

    // Run the fetch
    fetchFAQData();
});


// === FONCTIONNALITÉ DE LA BARRE DE RECHERCHE ===
    const searchInput = document.getElementById('search-input');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase(); // On passe tout en minuscules
            const allFaqItems = document.querySelectorAll('.faq-item'); // On récupère toutes les questions
            
            allFaqItems.forEach(item => {
                const questionText = item.querySelector('.faq-question').innerText.toLowerCase();
                const answerText = item.querySelector('.faq-answer').innerText.toLowerCase();
                
                // Si le texte tapé est dans la question OU dans la réponse, on l'affiche
                if (questionText.includes(searchTerm) || answerText.includes(searchTerm)) {
                    item.style.display = 'block';
                } else {
                    // Sinon on le cache
                    item.style.display = 'none';
                }
            });
        });
    }

// LE FORMATEUR ULTIME POUR LE CHATBOT (Texte, Liens, Images, Vidéos)
function formatChatReply(text) {
    if (!text) return '';

    let formatted = text;

    // 1. GESTION DES IMAGES : ![texte](url) -> Devient une vraie image visible
    formatted = formatted.replace(/!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, 
        '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">'
    );

    // 2. GESTION DES VIDÉOS DIRECTES : [titre](url.mp4) -> Devient un lecteur vidéo intégré
    formatted = formatted.replace(/\[(.*?)\]\((https?:\/\/[^\s)]+\.(mp4|webm|ogg))\)/g, 
        '<div style="margin: 8px 0;"><video controls style="max-width: 100%; border-radius: 8px; display:block;"><source src="$2" type="video/$3">Votre navigateur ne supporte pas la vidéo.</video></div>'
    );

    // 3. GESTION DES LIENS & HYPERTEXTES : [texte](url) -> Devient un beau lien vert cliquable
    formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, 
        '<a href="$2" target="_blank" style="color: #509E2F; text-decoration: underline; font-weight: 600; word-break: break-all;">$1 🔗</a>'
    );

    // 4. GESTION DU GRAS : **texte** -> <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // 5. GESTION DES LISTES À PUCES : Convertit les "*" ou "-" en vrais points propres
    formatted = formatted.replace(/^\s*[\*\-]\s+(.*)$/gm, '• $1');

    // 6. GESTION DES RETOURS À LIGNE
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}
