// script.js

document.addEventListener('DOMContentLoaded', function () {

    // ============================
    // 1. MENU RESPONSIVO
    // ============================
    const toggleBtn = document.querySelector('.menu-toggle');
    const menu = document.getElementById('menu');

    if (toggleBtn && menu) {
        toggleBtn.addEventListener('click', function () {
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            menu.classList.toggle('show');
            toggleBtn.classList.toggle('open');
        });
    }

    // ============================
    // 2. BOTÃO "VOLTAR AO TOPO"
    // ============================
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    const scrollThreshold = 500;

    if (scrollToTopBtn) {
        window.addEventListener("scroll", () => {
            scrollToTopBtn.style.display =
                window.scrollY > scrollThreshold ? "flex" : "none";
        });

        scrollToTopBtn.addEventListener("click", () => {
            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    // ============================
    // 3. CONFIGURAÇÃO DA BÍBLIA
    // ============================
    const VERSAO_BIBLIA = 'ACF (Local)'; // mantém o dado original se precisar
    const DISPLAY_VERSION = 'ACF'; // o texto que será mostrado na referência
    const JSON_FILE_PATH = 'bible_data.json';

    // Achata o JSON da Bíblia
    function flattenBibleData(bibleData) {
        const flattenedList = [];

        if (!Array.isArray(bibleData)) {
            console.error("ERRO: O arquivo JSON não é um Array válido.");
            return [];
        }

        bibleData.forEach(book => {
            const bookName = book.name;
            const chapters = book.chapters;

            if (chapters) {
                for (const chapterKey in chapters) {
                    const chapterNumber = parseInt(chapterKey);
                    const verses = chapters[chapterKey];

                    for (const verseNumber in verses) {
                        flattenedList.push({
                            text: verses[verseNumber],
                            book: bookName,
                            chapter: chapterNumber,
                            number: parseInt(verseNumber),
                            version: VERSAO_BIBLIA
                        });
                    }
                }
            }
        });

        return flattenedList;
    }

    // Normaliza referência antiga para o novo formato "Livro Cap:V – ACF"
    function normalizeReferencia(referenciaRaw) {
        if (!referenciaRaw || typeof referenciaRaw !== 'string') return referenciaRaw || '';
        // Remove parênteses finais e tudo que estiver dentro e corta espaços finais
        // Ex.: "Salmos 23:1 (ACF (Local))" -> "Salmos 23:1"
        // Depois adiciona " – ACF"
        const withoutParen = referenciaRaw.replace(/\s*\(.*\)\s*$/, '').trim();
        return `${withoutParen} – ${DISPLAY_VERSION}`;
    }

    // Carrega e exibe o versículo do dia
    async function buscarVersiculoDoDia() {
        const hoje = new Date();
        const dataAtual = hoje.toDateString();

        const textoEl = document.getElementById('texto-versiculo');
        const referenciaEl = document.getElementById('referencia-versiculo');

        if (!textoEl || !referenciaEl) {
            console.error("Elementos HTML do versículo não encontrados.");
            return;
        }

        // Verifica cache
        const versiculoSalvo = localStorage.getItem('versiculoDoDia');
        const dataSalva = localStorage.getItem('dataVersiculo');

        if (versiculoSalvo && dataSalva === dataAtual) {
            try {
                const dados = JSON.parse(versiculoSalvo);
                textoEl.textContent = dados.texto || '';
                // Normaliza caso esteja no formato antigo
                referenciaEl.textContent = normalizeReferencia(dados.referencia || '');
                return;
            } catch (e) {
                console.warn("Cache corrompido ou inválido — irá recarregar.", e);
                // continua para recarregar do JSON
            }
        }

        textoEl.textContent = "Carregando a Bíblia...";
        referenciaEl.textContent = "Processando...";

        try {
            const response = await fetch(JSON_FILE_PATH);

            if (!response.ok) {
                throw new Error(
                    `Não foi possível carregar ${JSON_FILE_PATH} (status: ${response.status}).`
                );
            }

            const rawBibleData = await response.json();
            const dadosVersiculos = flattenBibleData(rawBibleData);

            if (dadosVersiculos.length === 0) {
                throw new Error("Nenhum versículo encontrado no JSON.");
            }

            const diaDoAno =
                Math.floor((hoje - new Date(hoje.getFullYear(), 0, 0)) / 86400000);

            const indiceSorteado = diaDoAno % dadosVersiculos.length;
            const v = dadosVersiculos[indiceSorteado];

            const textoVersiculo = v.text;
            // Novo formato: "Livro Capítulo:Versículo – ACF"
            const referenciaVersiculo = `${v.book} ${v.chapter}:${v.number} – ${DISPLAY_VERSION}`;

            // Salva cache (já no novo formato)
            localStorage.setItem('versiculoDoDia',
                JSON.stringify({ texto: textoVersiculo, referencia: referenciaVersiculo })
            );
            localStorage.setItem('dataVersiculo', dataAtual);

            // Atualiza HTML
            textoEl.textContent = textoVersiculo;
            referenciaEl.textContent = referenciaVersiculo;

        } catch (erro) {
            console.error("Erro ao carregar versículo:", erro);
            textoEl.textContent =
                "Não foi possível carregar o Versículo. Verifique o arquivo JSON.";
            referenciaEl.textContent = "⚠️ ERRO ⚠️";
        }
    }

    // Chama o versículo após a página carregar
    buscarVersiculoDoDia();

});
