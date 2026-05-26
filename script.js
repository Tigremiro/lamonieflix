// ==========================================
// CONFIGURAÇÃO DA NOSSA API LOCAL
// ==========================================
// Agora buscamos direto do nosso próprio arquivo JSON!
const BASE_URL = "./receitas.json";

// ==========================================
// ELEMENTOS DO DOM E ESTADO GLOBAL
// ==========================================
const recipeGrid = document.getElementById('recipe-grid');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categoryBtns = document.querySelectorAll('.cat-btn');
const btnFavorites = document.getElementById('btn-favorites');

const modal = document.getElementById('recipe-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');

let allRecipes = []; // Guarda todas as receitas do JSON
let currentRecipes = []; // Receitas sendo exibidas no momento
let favorites = JSON.parse(localStorage.getItem('receitasFlixFavs')) || [];

// ==========================================
// FUNÇÕES DE BUSCA E RENDERIZAÇÃO
// ==========================================
async function fetchRecipes(tag = 'under_30_minutes', query = '') {
    showLoader(true);
    recipeGrid.innerHTML = '';
    
    try {
        // Se ainda não carregamos as receitas, faz o fetch no JSON
        if (allRecipes.length === 0) {
            const response = await fetch(BASE_URL);
            if (!response.ok) throw new Error('Erro na requisição');
            allRecipes = await response.json();
        }

        // Simula uma espera de 500ms para mostrar a animação de loading
        setTimeout(() => {
            currentRecipes = [...allRecipes];

            if (query) {
                const search = query.toLowerCase();
                currentRecipes = currentRecipes.filter(r => 
                    r.name.toLowerCase().includes(search) || 
                    (r.description && r.description.toLowerCase().includes(search))
                );
            } else if (tag) {
                currentRecipes = currentRecipes.filter(r => r.tags && r.tags.includes(tag));
            }

            if (currentRecipes.length === 0) {
                showError("Nenhuma receita encontrada para essa categoria ou busca.");
            } else {
                renderRecipes(currentRecipes);
            }
            showLoader(false);
        }, 500);

    } catch (error) {
        console.error(error);
        showError("Erro ao carregar as receitas. Tente novamente.");
        showLoader(false);
    }
}

function renderRecipes(recipes) {
    recipeGrid.innerHTML = '';
    
    if (recipes.length === 0) {
        showError("Nenhuma receita para mostrar aqui.");
        return;
    }

    recipes.forEach((recipe) => {
        const time = recipe.total_time_minutes || recipe.prep_time_minutes || 'N/A';
        const timeText = time !== 'N/A' ? `${time} min` : 'Tempo não informado';
        const desc = recipe.description || 'Nenhuma descrição disponível para esta receita.';
        const isFav = favorites.some(fav => fav.id === recipe.id);

        const card = document.createElement('div');
        card.className = 'recipe-card';
        card.innerHTML = `
            <button class="btn-fav" data-id="${recipe.id}">${isFav ? '❤️' : '🤍'}</button>
            <img src="${recipe.thumbnail_url}" alt="${recipe.name}" class="card-img" loading="lazy">
            <div class="card-info">
                <h3 class="card-title">${recipe.name}</h3>
                <span class="card-meta">⏱ ${timeText}</span>
                <p class="card-desc">${desc}</p>
                <button class="btn-view">Ver Receita</button>
            </div>
        `;
        
        card.querySelector('.card-info').addEventListener('click', () => openModal(recipe));
        card.querySelector('.card-img').addEventListener('click', () => openModal(recipe));
        
        const favBtn = card.querySelector('.btn-fav');
        favBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(recipe, favBtn);
        });
        
        recipeGrid.appendChild(card);
    });
}

// ==========================================
// SISTEMA DE FAVORITOS
// ==========================================
function toggleFavorite(recipe, btnElement) {
    const index = favorites.findIndex(fav => fav.id === recipe.id);
    
    if (index > -1) {
        favorites.splice(index, 1);
        btnElement.textContent = '🤍';
    } else {
        favorites.push(recipe);
        btnElement.textContent = '❤️';
    }
    
    localStorage.setItem('receitasFlixFavs', JSON.stringify(favorites));
}

if(btnFavorites) {
    btnFavorites.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btnFavorites.classList.add('active');
        searchInput.value = '';
        errorMessage.classList.add('hidden');
        currentRecipes = favorites; 
        renderRecipes(favorites);
    });
}

// ==========================================
// CONTROLE DO MODAL E UTILS
// ==========================================
function openModal(recipe) {
    if (!recipe) return;

    const prep = recipe.prep_time_minutes ? `${recipe.prep_time_minutes} min` : '-';
    const cook = recipe.cook_time_minutes ? `${recipe.cook_time_minutes} min` : '-';
    const total = recipe.total_time_minutes ? `${recipe.total_time_minutes} min` : '-';
    const desc = recipe.description || 'Nenhuma descrição detalhada disponível.';

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

    let instructionsHTML = '';
    if (recipe.instructions && recipe.instructions.length > 0) {
        instructionsHTML = '<h4 class="modal-section-title">Modo de Preparo</h4><ol class="modal-list">';
        recipe.instructions.forEach(step => {
            instructionsHTML += `<li>${step.display_text}</li>`;
        });
        instructionsHTML += '</ol>';
    }

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
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.add('hidden');
    modalBody.innerHTML = '';
    document.body.style.overflow = 'auto';
}

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
        categoryBtns.forEach(btn => btn.classList.remove('active'));
        if(btnFavorites) btnFavorites.classList.remove('active');
        fetchRecipes(null, query);
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

// Eventos de Categoria
categoryBtns.forEach(btn => {
    if(btn.id === 'btn-favorites') return;
    btn.addEventListener('click', (e) => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        if(btnFavorites) btnFavorites.classList.remove('active');
        e.target.classList.add('active');
        searchInput.value = '';
        fetchRecipes(e.target.getAttribute('data-tag'), null);
    });
});

closeModalBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    fetchRecipes('under_30_minutes', null);
});
