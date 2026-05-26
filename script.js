// ==========================================
// CONFIGURAÇÃO DA API
// ==========================================
const RAPIDAPI_KEY = "COLE_SUA_CHAVE_RAPIDAPI_AQUI";
const API_HOST = "tasty.p.rapidapi.com";
const BASE_URL = "https://tasty.p.rapidapi.com/recipes/list";

// ==========================================
// ELEMENTOS DO DOM
// ==========================================
const recipeGrid = document.getElementById('recipe-grid');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categoryBtns = document.querySelectorAll('.cat-btn');

// Elementos do Modal
const modal = document.getElementById('recipe-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');

// Estado Global
let currentRecipes = [];

// ==========================================
// FUNÇÕES DE BUSCA E RENDERIZAÇÃO
// ==========================================

// Função principal de fetch
async function fetchRecipes(tag = 'under_30_minutes', query = '') {
    showLoader(true);
    recipeGrid.innerHTML = '';
    
    let url = `${BASE_URL}?from=0&size=20`;
    
    if (query) {
        url += `&q=${encodeURIComponent(query)}`;
    } else if (tag) {
        url += `&tags=${tag}`;
    }

    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': API_HOST
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Erro na requisição');
        
        const data = await response.json();
        
        // Filtra receitas que tenham nome e imagem (ignora compilações vazias)
        currentRecipes = data.results.filter(r => r.name && r.thumbnail_url);
        
        if (currentRecipes.length === 0) {
            showError("Nenhuma receita encontrada. Tente outra busca.");
        } else {
            renderRecipes(currentRecipes);
        }
    } catch (error) {
        console.error(error);
        showError("Erro ao carregar as receitas. Verifique sua chave da API ou conexão.");
    } finally {
        showLoader(false);
    }
}

// Renderiza os cards no grid
function renderRecipes(recipes) {
    recipeGrid.innerHTML = '';
    
    recipes.forEach((recipe, index) => {
        // Calcula tempo
        const time = recipe.total_time_minutes || recipe.prep_time_minutes || 'N/A';
        const timeText = time !== 'N/A' ? `${time} min` : 'Tempo não informado';
        
        // Limita descrição
        const desc = recipe.description || 'Nenhuma descrição disponível para esta receita.';

        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <img src="${recipe.thumbnail_url}" alt="${recipe.name}" class="card-img" loading="lazy">
            <div class="card-info">
                <h3 class="card-title">${recipe.name}</h3>
                <span class="card-meta">⏱ ${timeText}</span>
                <p class="card-desc">${desc}</p>
                <button class="btn-view" data-index="${index}">Ver Receita</button>
            </div>
        `;
        
        // Evento para abrir modal (aplicado ao card inteiro)
        card.addEventListener('click', () => openModal(index));
        
        recipeGrid.appendChild(card);
    });
}

// ==========================================
// CONTROLE DO MODAL
// ==========================================

function openModal(index) {
    const recipe = currentRecipes[index];
    if (!recipe) return;

    // Tempos
    const prep = recipe.prep_time_minutes ? `${recipe.prep_time_minutes} min` : '-';
    const cook = recipe.cook_time_minutes ? `${recipe.cook_time_minutes} min` : '-';
    const total = recipe.total_time_minutes ? `${recipe.total_time_minutes} min` : '-';

    // Ingredientes (Mapeando sections)
    let ingredientsHTML = '';
    if (recipe.sections && recipe.sections.length > 0) {
        ingredientsHTML = '<h4 class="modal-section-title">Ingredientes</h4><ul class="modal-list">';
        recipe.sections.forEach(section => {
            if (section.components) {
                section.components.forEach(comp => {
                    ingredientsHTML += `<li>${comp.raw_text}</li>`;
                });
            }
        });
        ingredientsHTML += '</ul>';
    }

    // Instruções
    let instructionsHTML = '';
    if (recipe.instructions && recipe.instructions.length > 0) {
        instructionsHTML = '<h4 class="modal-section-title">Modo de Preparo</h4><ol class="modal-list">';
        recipe.instructions.forEach(step => {
            instructionsHTML += `<li>${step.display_text}</li>`;
        });
        instructionsHTML += '</ol>';
    }

    // Vídeo (se existir)
    let videoHTML = '';
    if (recipe.video_url) {
        videoHTML = `
            <h4 class="modal-section-title">Vídeo</h4>
            <video class="modal-video" controls>
                <source src="${recipe.video_url}" type="video/mp4">
                Seu navegador não suporta o elemento de vídeo.
            </video>
        `;
    }

    const desc = recipe.description || 'Nenhuma descrição detalhada disponível.';

    modalBody.innerHTML = `
        <img src="${recipe.thumbnail_url}" alt="${recipe.name}" class="modal-hero">
        <div class="modal-details">
            <h2 class="modal-title">${recipe.name}</h2>
            <div class="modal-meta">
                <span>⏱ Preparo: ${prep}</span> | 
                <span>🔥 Cozimento: ${cook}</span> | 
                <span>Total: ${total}</span>
            </div>
            <p class="modal-desc">${desc}</p>
            ${ingredientsHTML}
            ${instructionsHTML}
            ${videoHTML}
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Impede scroll do body
}

function closeModal() {
    modal.classList.add('hidden');
    modalBody.innerHTML = ''; // Limpa conteúdo para parar vídeos
    document.body.style.overflow = 'auto'; // Restaura scroll
}

// ==========================================
// UTILS & EVENT LISTENERS
// ==========================================

function showLoader(show) {
    loader.classList.toggle('hidden', !show);
    if (show) errorMessage.classList.add('hidden');
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
}

// Eventos de Busca
searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        // Remove active state dos botões de categoria
        categoryBtns.forEach(btn => btn.classList.remove('active'));
        fetchRecipes(null, query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchBtn.click();
    }
});

// Eventos de Categoria
categoryBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Atualiza UI
        categoryBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        searchInput.value = '';
        
        // Busca nova tag
        const tag = e.target.getAttribute('data-tag');
        fetchRecipes(tag, null);
    });
});

// Eventos do Modal
closeModalBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Carrega receitas iniciais
    fetchRecipes('under_30_minutes', null);
});
