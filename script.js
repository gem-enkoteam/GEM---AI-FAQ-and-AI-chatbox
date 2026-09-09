document.addEventListener('DOMContentLoaded', () => {
    // ⚠️ GOOGLE APPS SCRIPT WEB APP URL
    const API_URL = 'https://script.google.com/macros/s/AKfycbykBasezQeVMdXDlO4ZlLy9Djy5ArLlFtGnpeRLGwDV2OU5pIx_Dd827UMNgf_Jg4V_/exec';
 
    let currentLang = 'en';
 
    // Identifiant de session, utilisé par le backend pour limiter le débit
    // par visiteur. Anonyme, non persistant, jamais transmis à Gemini.
    const SESSION_ID = (() => {
        try {
            let id = sessionStorage.getItem('gem_session_id');
            if (!id) {
                id = (crypto.randomUUID && crypto.randomUUID()) ||
                     (Date.now() + '-' + Math.random().toString(36).slice(2));
                sessionStorage.setItem('gem_session_id', id);
            }
            return id;
        } catch (e) {
            return Date.now() + '-' + Math.random().toString(36).slice(2);
        }
    })();
 
    const langBtn = document.getElementById('lang-switch');
    if (langBtn) {
        langBtn.addEventListener('click', async (e) => {
            e.preventDefault();
 
            langBtn.classList.add('is-loading');
            langBtn.innerHTML = '<span class="desktop-text">Loading... ⏳</span><span class="mobile-text">⏳</span>';
 
            const mainContainer = document.querySelector('.faq-body');
            const tabsContainer = document.querySelector('.faq-category-tabs');
 
            if (mainContainer && tabsContainer) {
                tabsContainer.innerHTML = '';
                mainContainer.innerHTML = `
                    <div style="text-align: center; padding: 60px 0; opacity: 0; animation: fadeInUp 0.4s forwards;">
                        <div style="width: 40px; height: 40px; border: 4px solid #E8E9E5; border-top: 4px solid #509E2F; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                        <p style="margin-top: 20px; color: #509E2F; font-weight: 600; letter-spacing: 0.5px;">💎</p>
                    </div>
                `;
            }
 
            currentLang = (currentLang === 'en') ? 'fr' : 'en';
 
            const mainTitle = document.getElementById('hero-title');
            const subtitle = document.getElementById('hero-subtitle');
            const searchInputEl = document.getElementById('search-input');
 
            const chatTitle = document.getElementById('chatTitle');
            const chatSubtitle = document.getElementById('chatSubtitle');
            const chatWelcome = document.getElementById('chatWelcome');
            const chatInputEl = document.getElementById('chatInput');
            const chatFabText = document.getElementById('chatFabText');
 
            if (currentLang === 'fr') {
                if (mainTitle) mainTitle.innerText = "Des questions ? Nous avons les réponses.";
                if (subtitle) subtitle.innerText = "Tout ce que vous devez savoir pour rejoindre Enko Education en tant qu'enseignant — de la candidature à votre premier jour.";
                if (searchInputEl) searchInputEl.placeholder = "Rechercher une question, ex. 'Quels documents dois-je fournir ?'";
 
                if (chatTitle) chatTitle.innerText = "Posez vos questions";
                if (chatSubtitle) chatSubtitle.innerText = "Assistant Enko Education • En ligne";
                if (chatWelcome) chatWelcome.innerText = "Bonjour ! 👋 Je suis GEM, votre guide Enko Education. Posez-moi toutes vos questions sur notre processus de candidature, nos postes d'enseignants ou nos avantages !";
                if (chatInputEl) chatInputEl.placeholder = "Tapez votre question ici...";
                if (chatFabText) chatFabText.innerText = "Posez vos questions";
 
            } else {
                if (mainTitle) mainTitle.innerText = "Got questions? We've got answers.";
                if (subtitle) subtitle.innerText = "Everything you need to know about joining Enko Education as a teacher — from application to your first day.";
                if (searchInputEl) searchInputEl.placeholder = "Search a question, e.g. 'What documents do I need?'";
 
                if (chatTitle) chatTitle.innerText = "Ask GEM";
                if (chatSubtitle) chatSubtitle.innerText = "Enko Education Assistant • Online";
                if (chatWelcome) chatWelcome.innerText = "Hi there! 👋 I'm GEM, your Enko Education guide. Ask me anything about our application process, teaching roles, or benefits!";
                if (chatInputEl) chatInputEl.placeholder = "Type your question here...";
                if (chatFabText) chatFabText.innerText = "Ask GEM";
            }
 
            await fetchFAQData();
 
            langBtn.classList.remove('is-loading');
            if (currentLang === 'fr') {
                langBtn.innerHTML = '<span class="desktop-text">Click here for English version!</span><span class="mobile-text">ENG</span>';
            } else {
                langBtn.innerHTML = '<span class="desktop-text">Cliquer ici pour la version française!</span><span class="mobile-text">FR</span>';
            }
        });
    }
 
    const categoryMap = {
        "Application Info": "application",
        "Platform Support": "platform",
        "Document Rules": "documents",
        "Recruitment & Pipeline": "recruitment",
        "Employment & Benefits": "employment",
 
        "Informations Candidature": "application",
        "Support Plateforme": "platform",
        "Règles Documentaires": "documents",
        "Recrutement & Vivier": "recruitment",
        "Emploi & Avantages": "employment"
    };
 
    const styleMap = {
        "application": { icon: "ti-user-check", color: "icon-green" },
        "platform":    { icon: "ti-settings", color: "icon-gold" },
        "documents":   { icon: "ti-file-certificate", color: "icon-navy" },
        "recruitment": { icon: "ti-git-branch", color: "icon-red" },
        "employment":  { icon: "ti-cash", color: "icon-green" },
        "default":     { icon: "ti-help", color: "icon-green" }
    };
 
    // ============================================================
    // 1. FETCH DATA FROM GOOGLE SHEETS
    // ============================================================
    async function fetchFAQData() {
        const mainContainer = document.querySelector('.faq-body');
 
        try {
            const response = await fetch(`${API_URL}?lang=${currentLang}`);
 
            // ⚠️ fetch() ne lève AUCUNE erreur sur un 404 ou un 500 : il ne
            // rejette que si la requête réseau elle-même échoue. Sans ce test,
            // une page d'erreur HTML est traitée comme une réponse valide, et
            // c'est response.json() qui casse plus loin — avec un message
            // trompeur ("Unexpected token '<'") qui masque la vraie cause.
            if (!response.ok) {
                throw new Error(`Backend injoignable (HTTP ${response.status})`);
            }
 
            const data = await response.json();
 
            // Le backend renvoie {error: ...} plutôt qu'une exception.
            if (data && data.error) {
                throw new Error(`Backend: ${data.error}`);
            }
 
            renderFAQs(data);
            initializeInteractions();
 
        } catch (error) {
            console.error("Error fetching FAQ data:", error);
 
            // Rendre la panne VISIBLE. Sans ça, le visiteur reste devant un
            // spinner qui tourne indéfiniment, repart, et personne n'est
            // jamais prévenu. C'est ce qui a laissé passer six semaines.
            if (mainContainer) {
                const msg = (currentLang === 'fr')
                    ? `Notre FAQ est momentanément indisponible.<br>
                       Écrivez-nous à <a href="mailto:gem@enkoeducation.com" style="color:#509E2F;font-weight:600;">gem@enkoeducation.com</a>,
                       nous vous répondrons directement.`
                    : `Our FAQ is temporarily unavailable.<br>
                       Please email us at <a href="mailto:gem@enkoeducation.com" style="color:#509E2F;font-weight:600;">gem@enkoeducation.com</a>
                       and we'll get back to you.`;
 
                mainContainer.innerHTML = `
                    <div style="text-align:center; padding:60px 20px; color:#5A5F68; line-height:1.7; font-size:15px;">
                        ${msg}
                    </div>`;
            }
        }
    }
 
    // ============================================================
    // 2. RENDER THE DATA INTO HTML
    // ============================================================
    function renderFAQs(faqData) {
        const tabsContainer = document.querySelector('.faq-category-tabs');
        const mainContainer = document.querySelector('.faq-body');
 
        const allLabel = (currentLang === 'fr') ? 'Tout' : 'All';
 
        tabsContainer.innerHTML = `<div class="tab active" data-target="all">${allLabel}</div>`;
        mainContainer.innerHTML = '';
 
        function formatContent(text) {
            if (!text) return '';
 
            let html = String(text);
 
            html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (match, linkText, url) => {
                return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #509E2F; text-decoration: underline; font-weight: 600;">${linkText}</a>`;
            });
 
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
 
            html = html.replace(/\n/g, '<br>');
 
            return html;
        }
 
        (faqData || []).forEach(item => {
            const sheetCategory = String(item.category || '').trim();
            let catKey = categoryMap[sheetCategory];
 
            if (!catKey) {
                catKey = sheetCategory.toLowerCase().replace(/[^a-z0-9]/g, '-');
                categoryMap[sheetCategory] = catKey;
            }
 
            if (!document.querySelector(`.tab[data-target="${catKey}"]`)) {
 
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
 
    // ============================================================
    // 3. INITIALIZE UI INTERACTIONS
    // ============================================================
    function initializeInteractions() {
        const faqItems = document.querySelectorAll('.faq-item');
        const faqSections = document.querySelectorAll('.faq-section');
        const tabs = document.querySelectorAll('.tab');
        const searchBar = document.querySelector('.faq-search-bar');
 
        faqItems.forEach(item => {
            const header = item.querySelector('.faq-item-header');
            header.addEventListener('click', () => {
                const isOpen = item.classList.contains('open');
                faqItems.forEach(i => i.classList.remove('open'));
                if (!isOpen) item.classList.add('open');
            });
        });
 
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
 
        if (searchBar) {
            searchBar.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
 
                if (query.length > 0) {
                    tabs.forEach(t => t.classList.remove('active'));
                    const allTab = document.querySelector('.tab[data-target="all"]');
                    if (allTab) allTab.classList.add('active');
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
 
        const initialTab = document.querySelector('.tab[data-target="all"]');
        if (initialTab) {
            initialTab.click();
        }
 
        // ============================================================
        // CHAT
        // ============================================================
        const chatInput = document.getElementById('chatInput');
        const sendChatBtn = document.getElementById('sendChatBtn');
        const chatMessages = document.getElementById('chatMessages');
 
        let chatHistory = [];
        let isSending = false;   // évite les doubles envois (clic + Entrée)
 
        function chatSay(html, isError) {
            const style = isError ? ' style="color:#C0392B;"' : '';
            chatMessages.insertAdjacentHTML('beforeend',
                `<div class="message gem-message"${style}>${html}</div>`);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
 
        /**
         * Récupère un jeton Turnstile.
         *
         * Rappels sur Turnstile, qui expliquent la plupart des échecs :
         *  - un jeton est À USAGE UNIQUE ;
         *  - il EXPIRE au bout de 5 minutes ;
         *  - il faut donc turnstile.reset() après CHAQUE envoi, réussi ou non,
         *    faute de quoi seul le premier message d'une session fonctionne.
         */
        function getTurnstileToken() {
            if (typeof turnstile === 'undefined') {
                console.error('Turnstile non chargé — le script Cloudflare est absent ou bloqué.');
                return null;
            }
            const token = turnstile.getResponse();
            return (token && token.length) ? token : null;
        }
 
        function resetTurnstile() {
            try {
                if (typeof turnstile !== 'undefined') turnstile.reset();
            } catch (e) {
                console.warn('turnstile.reset() a échoué :', e);
            }
        }
 
        async function handleUserMessage() {
            if (isSending) return;
 
            const messageText = chatInput.value.trim();
            if (!messageText) return;
 
            const token = getTurnstileToken();
            if (!token) {
                chatSay(currentLang === 'fr'
                    ? "<i>La vérification de sécurité n'est pas prête. Patientez une seconde et réessayez.</i>"
                    : "<i>The security check isn't ready yet. Please wait a moment and try again.</i>", true);
                resetTurnstile();
                return;
            }
 
            isSending = true;
            if (sendChatBtn) sendChatBtn.disabled = true;
 
            chatMessages.insertAdjacentHTML('beforeend',
                `<div class="message user-message">${messageText}</div>`);
            chatInput.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;
 
            const thinkingId = 'thinking-' + Date.now();
            chatMessages.insertAdjacentHTML('beforeend',
                `<div class="message gem-message" id="${thinkingId}"><i>GEM is thinking... 🤖</i></div>`);
            chatMessages.scrollTop = chatMessages.scrollHeight;
 
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    // Content-Type explicite. En text/plain, la requête reste une
                    // "simple request" : pas de preflight OPTIONS, que Google Apps
                    // Script ne sait pas traiter (il n'existe pas de doOptions()).
                    // Le backend lit e.postData.contents puis JSON.parse : aucun
                    // changement nécessaire côté serveur.
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        message: messageText,
                        history: chatHistory,
                        lang: currentLang,
                        cfToken: token,
                        sessionId: SESSION_ID
                    })
                });
 
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
 
                const data = await response.json();
 
                const thinkingElement = document.getElementById(thinkingId);
                if (thinkingElement) thinkingElement.remove();
 
                if (data.error) {
                    console.error('GOOGLE APPS SCRIPT ERROR:', data.error, data.codes || '');
 
                    // Message lisible pour le visiteur, détail technique en console.
                    chatSay(currentLang === 'fr'
                        ? "<i>Je n'arrive pas à répondre pour le moment. Écrivez-nous à <a href='mailto:gem@enkoeducation.com' style='color:#509E2F;'>gem@enkoeducation.com</a>.</i>"
                        : "<i>I can't answer right now. Please email us at <a href='mailto:gem@enkoeducation.com' style='color:#509E2F;'>gem@enkoeducation.com</a>.</i>", true);
                    return;
                }
 
                if (!data.reply) {
                    throw new Error('No reply received from server.');
                }
 
                chatSay(formatChatReply(data.reply));
 
                chatHistory.push({ role: 'user',  text: messageText });
                chatHistory.push({ role: 'model', text: data.reply });
                if (chatHistory.length > 6) chatHistory = chatHistory.slice(-6);
 
            } catch (error) {
                console.error('Chat Error:', error);
 
                const thinkingElement = document.getElementById(thinkingId);
                if (thinkingElement) thinkingElement.remove();
 
                chatSay(currentLang === 'fr'
                    ? "<i>Oups ! Ma connexion a lâché. Vous pouvez reposer votre question ?</i>"
                    : "<i>Oops! My connection dropped. Can you try asking again?</i>", true);
 
            } finally {
                // Dans le finally : le jeton doit être renouvelé même après un
                // échec, sinon la tentative suivante repart avec un jeton déjà
                // consommé et échoue en timeout-or-duplicate.
                resetTurnstile();
                isSending = false;
                if (sendChatBtn) sendChatBtn.disabled = false;
            }
        }
 
        if (sendChatBtn && chatInput) {
            sendChatBtn.addEventListener('click', handleUserMessage);
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUserMessage();
                }
            });
        }
 
        // --- CHAT WIDGET TOGGLE ---
        const chatFab = document.querySelector('.ask-gem-fab');
        const chatWidget = document.getElementById('chatWidget');
        const closeChatBtn = document.getElementById('closeChatBtn');
 
        if (chatFab && chatWidget && closeChatBtn) {
            chatFab.addEventListener('click', () => {
                chatWidget.classList.add('open');
                // Jeton neuf à l'ouverture : si la page est restée ouverte
                // plus de 5 minutes, celui d'origine est déjà périmé.
                resetTurnstile();
            });
 
            closeChatBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                chatWidget.classList.remove('open');
            });
        }
    }
 
    // Run the fetch
    fetchFAQData();
});
 
 
// === BARRE DE RECHERCHE (hero) ===
const searchInput = document.getElementById('search-input');
 
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const allFaqItems = document.querySelectorAll('.faq-item');
 
        allFaqItems.forEach(item => {
            const questionText = item.querySelector('.faq-question').innerText.toLowerCase();
            const answerText = item.querySelector('.faq-answer').innerText.toLowerCase();
 
            if (questionText.includes(searchTerm) || answerText.includes(searchTerm)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
}
 
 
// === FORMATEUR DES RÉPONSES DU CHATBOT ===
function formatChatReply(text) {
    if (!text) return '';
 
    let formatted = text;
 
    // 1. IMAGES : ![texte](url)
    formatted = formatted.replace(/!\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g,
        '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; display: block; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">'
    );
 
    // 2. VIDÉOS DIRECTES : [titre](url.mp4)
    formatted = formatted.replace(/\[(.*?)\]\((https?:\/\/[^\s)]+\.(mp4|webm|ogg))\)/g,
        '<div style="margin: 8px 0;"><video controls style="max-width: 100%; border-radius: 8px; display:block;"><source src="$2" type="video/$3">Votre navigateur ne supporte pas la vidéo.</video></div>'
    );
 
    // 3. LIENS : [texte](url)
    formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #509E2F; text-decoration: underline; font-weight: 600; word-break: break-all;">$1 🔗</a>'
    );
 
    // 4. GRAS : **texte**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
 
    // 5. LISTES À PUCES
    formatted = formatted.replace(/^\s*[\*\-]\s+(.*)$/gm, '• $1');
 
    // 6. RETOURS À LIGNE
    formatted = formatted.replace(/\n/g, '<br>');
 
    return formatted;
