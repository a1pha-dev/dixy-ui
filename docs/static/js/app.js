        // Global state
        const state = {
            currentMission: null,
            currentMissionId: null,
            cart: {},
            cartCount: 0,
            missionStartTime: null,
            totalClicks: 0,
            unnecessaryClicks: 0,
            products: {},
            categories: {},
            promotions: {},
            profile: {},
            completedMissions: [],
            visitedScreens: new Set(),
            abGroup: null,
            checkoutCompleted: false,
            missionCompleting: false,
            sessionId: 'sess-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36),
            screenEnterTime: Date.now(),
        };

        // Use inline static data if available (GitHub Pages deployment)
        const STATIC = window.STATIC_DATA || null;

        const API = {
            catalog: () => STATIC ? Promise.resolve({categories: STATIC.categories}) : fetch('/api/catalog').then(r => r.json()),
            products: () => STATIC ? Promise.resolve({products: STATIC.products}) : fetch('/api/all-products').then(r => r.json()),
            promotions: () => STATIC ? Promise.resolve({promotions: STATIC.promotions}) : fetch('/api/promotions').then(r => r.json()),
            profile: () => STATIC ? Promise.resolve({user: STATIC.profile}) : fetch('/api/profile').then(r => r.json()),
            mission: () => {
                if (STATIC) {
                    // Static deployment: generate a random mission locally
                    const types = ['screen', 'add_item', 'checkout', 'combo'];
                    const type = types[Math.floor(Math.random() * types.length)];
                    const screens = [
                        {id: 'catalog-screen', name: 'Каталог'},
                        {id: 'promo-screen', name: 'Акции'},
                        {id: 'profile-screen', name: 'Профиль'},
                        {id: 'summer-screen', name: 'Скоро лето'},
                    ];
                    let mission = {
                        id: 'm-' + Date.now(),
                        title: 'Тестовое задание',
                        description: 'Выполните цель',
                        type,
                    };
                    if (type === 'screen') {
                        const target = screens[Math.floor(Math.random() * screens.length)];
                        mission.title = `Перейдите на экран «${target.name}»`;
                        mission.description = `Откройте экран ${target.name}`;
                        mission.target_screen = target.id.replace('-screen', '');
                    } else if (type === 'add_item') {
                        const count = Math.floor(Math.random() * 2) + 1;
                        mission.title = `Добавьте ${count} товар(а) в корзину`;
                        mission.description = `Найдите и добавьте ${count} товар(а) в корзину`;
                        mission.items_count = count;
                    } else if (type === 'checkout') {
                        mission.title = 'Оформите покупку';
                        mission.description = 'Перейдите в корзину и оформите покупку';
                    } else if (type === 'combo') {
                        mission.title = 'Комбо задание';
                        mission.description = 'Посетите каталог, добавьте товар и оформите покупку';
                        mission.required_subtasks = ['screen_catalog', 'add_item', 'checkout'];
                    }
                    return Promise.resolve(mission);
                }
                return fetch('/api/mission/new').then(r => r.json());
            },
            completeMission: (id, stats) => {
                if (STATIC) {
                    // Simulate completion on static deployment
                    return Promise.resolve({ accuracy: 100, status: 'completed' });
                }
                return fetch(`/api/mission/${id}/complete`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stats)
                }).then(r => r.json());
            },
            trackClick: (from, to, extra = {}) => {
                const cartValue = Object.values(state.cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const payload = {
                    from,
                    to,
                    timestamp: new Date().toISOString(),
                    ab_group: state.abGroup || 'unknown',
                    session_id: state.sessionId,
                    cart_value: cartValue,
                    cart_count: Object.keys(state.cart).length,
                    ...extra,
                };
                if (STATIC) {
                    console.log('[Analytics]', payload);
                    return Promise.resolve();
                }
                return fetch('/api/click-log', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(e => console.log('Click logged locally'));
            },
        };

        // A/B Testing assignment
        function assignABGroup() {
            let group = localStorage.getItem('dixy_ab_group');
            if (!group) {
                group = Math.random() < 0.5 ? 'A' : 'B';
                localStorage.setItem('dixy_ab_group', group);
            }
            state.abGroup = group;
            document.body.classList.add(group === 'A' ? 'ui-a' : 'ui-b');
            return group;
        }

        // Initialize app
        async function init() {
            assignABGroup();
            await Promise.all([
                loadCatalog(),
                loadProducts(),
                loadPromotions(),
                loadProfile(),
            ]);
            startNewMission();
        }

        // Mission Management
        async function startNewMission() {
            hideModal();
            const response = await API.mission();
            state.currentMission = response;
            state.currentMissionId = response.id;
            state.missionStartTime = Date.now();
            state.totalClicks = 0;
            state.unnecessaryClicks = 0;
            state.visitedScreens.clear();
            state.checkoutCompleted = false;
            state.missionCompleting = false;

            // Update UI
            document.getElementById('mission-title').textContent = response.title;
            document.getElementById('mission-description').textContent = response.description || '';
            updateMissionProgress();
            startMissionTimer();
            updateDrawerContent();
            switchScreen({ target: document.querySelector('[data-screen="mission-screen"]') });
        }

        function startMissionTimer() {
            if (window.missionTimerInterval) clearInterval(window.missionTimerInterval);

            window.missionTimerInterval = setInterval(() => {
                if (!state.missionStartTime) return;

                const elapsed = Math.floor((Date.now() - state.missionStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;

                document.getElementById('mission-timer').textContent =
                    `${minutes}:${String(seconds).padStart(2, '0')}`;

                document.getElementById('stat-clicks').textContent = state.totalClicks;
                document.getElementById('stat-unnecessary').textContent = state.unnecessaryClicks;

                // Sync drawer if open
                if (document.getElementById('mission-drawer').classList.contains('open')) {
                    document.getElementById('drawer-mission-timer').textContent =
                        `${minutes}:${String(seconds).padStart(2, '0')}`;
                    document.getElementById('drawer-stat-clicks').textContent = state.totalClicks;
                    document.getElementById('drawer-stat-unnecessary').textContent = state.unnecessaryClicks;
                }
            }, 100);
        }

        function updateMissionProgress() {
            const mission = state.currentMission;
            if (!mission) return false;

            let progress = 0;

            if (mission.type === 'screen') {
                const targetScreen = mission.target_screen + '-screen';
                if (state.visitedScreens.has(targetScreen)) {
                    progress = 100;
                }
            } else if (mission.type === 'add_item') {
                const itemCount = Object.keys(state.cart).length;
                progress = Math.min((itemCount / mission.items_count) * 100, 100);
            } else if (mission.type === 'checkout') {
                progress = 0; // Will be set to 100 in checkout()
            } else if (mission.type === 'combo') {
                // For combo, calculate based on completed subtasks
                let completed = 0;
                const subtasks = mission.required_subtasks || [];
                subtasks.forEach(sub => {
                    if (sub.startsWith('screen_') && state.visitedScreens.has(sub.replace('screen_', '') + '-screen')) completed++;
                    else if (sub === 'add_item' && Object.keys(state.cart).length >= 1) completed++;
                    else if (sub === 'checkout' && state.checkoutCompleted) completed++;
                });
                progress = subtasks.length > 0 ? (completed / subtasks.length) * 100 : 0;
            }

            const progressPercent = Math.round(progress);
            const progressEl = document.getElementById('progress-fill');
            const progressText = document.getElementById('progress-percent');
            const drawerProgressEl = document.getElementById('drawer-progress-fill');
            const drawerProgressText = document.getElementById('drawer-progress-percent');

            if (progressEl) progressEl.style.width = progressPercent + '%';
            if (progressText) progressText.textContent = progressPercent;
            if (drawerProgressEl) drawerProgressEl.style.width = progressPercent + '%';
            if (drawerProgressText) drawerProgressText.textContent = progressPercent + '%';

            return progressPercent >= 100;
        }

        function checkMissionCompletion() {
            if (!state.currentMission || state.currentMission.completed || state.missionCompleting) return false;
            if (updateMissionProgress()) {
                // Auto-complete mission after a short delay to show 100%
                setTimeout(() => {
                    if (window.missionTimerInterval) clearInterval(window.missionTimerInterval);
                    launchConfetti();
                    completeMission();
                }, 800);
                return true;
            }
            return false;
        }

        // Screen Navigation
        let currentScreen = 'home-screen';

        function switchScreen(event) {
            const target = event.target.closest('.nav-item');
            if (!target) return;

            state.totalClicks++;
            const screenId = target.dataset.screen;
            switchToScreen(screenId);
        }

        function switchToScreen(screenId) {
            // Log time spent on previous screen
            const now = Date.now();
            const timeOnScreen = now - state.screenEnterTime;
            if (currentScreen && timeOnScreen > 0) {
                API.trackClick(currentScreen, screenId, { time_on_screen_ms: timeOnScreen });
            } else {
                API.trackClick(currentScreen || 'start', screenId);
            }
            state.screenEnterTime = now;

            const screens = document.querySelectorAll('.screen');
            const navItems = document.querySelectorAll('.nav-item');

            screens.forEach(s => s.classList.remove('active'));
            navItems.forEach(n => n.classList.remove('active'));

            document.getElementById(screenId).classList.add('active');
            document.querySelector(`[data-screen="${screenId}"]`)?.classList.add('active');
            currentScreen = screenId;
            updateFloatingCartVisibility();

            // Track visited screens for mission progress
            if (!state.visitedScreens.has(screenId)) {
                state.visitedScreens.add(screenId);
            }
            updateMissionProgress();
            checkMissionCompletion();

            if (screenId === 'cart-screen') {
                renderCart();
            }
        }

        function trackClick(from, to) {
            state.totalClicks++;
            API.trackClick(from, to).catch(err => console.log('Click tracked locally'));
        }

        // Data Loading
        async function loadCatalog() {
            const data = await API.catalog();
            state.categories = data.categories;
            renderCategories();
        }

        function renderCategories() {
            const grid = document.getElementById('category-grid');
            grid.innerHTML = state.categories.map(cat => `
                <div class="category-card" onclick="navigateToProducts()">
                    <div class="category-circle">
                        <div class="category-emoji">${cat.emoji}</div>
                    </div>
                    <div class="category-name">${cat.name}</div>
                    <div class="category-count">${cat.count} товаров</div>
                </div>
            `).join('');
        }

        async function loadProducts() {
            const data = await API.products();
            state.products = data.products;
            renderProducts();
            renderSummerProducts();
            renderPopularProductsHome();
        }

        function renderProducts() {
            const grid = document.getElementById('product-grid');
            grid.innerHTML = state.products.map(prod => `
                <div class="product-card">
                    <div class="product-emoji">${prod.emoji}</div>
                    <div class="product-name">${prod.name}</div>
                    <div class="product-price">
                        ${prod.old_price ? `<span class="product-old-price">${prod.old_price}₽</span>` : ''}
                        ${prod.price}₽
                    </div>
                    ${prod.discount ? `<div class="product-discount">${prod.discount}</div>` : ''}
                    <button class="add-btn" onclick="addToCart(${prod.id}, '${prod.name}', ${prod.price})">
                        + Добавить
                    </button>
                </div>
            `).join('');
        }

        function renderSummerProducts() {
            const fruits = state.products.filter(p =>
                ['Фрукты', 'Овощи'].includes(p.category)
            ).slice(0, 4);

            const grid = document.getElementById('summer-fruits');
            grid.innerHTML = fruits.map(prod => `
                <div class="product-card">
                    <div class="product-emoji">${prod.emoji}</div>
                    <div class="product-name">${prod.name}</div>
                    <div class="product-price">
                        ${prod.old_price ? `<span class="product-old-price">${prod.old_price}₽</span>` : ''}
                        ${prod.price}₽
                    </div>
                    ${prod.discount ? `<div class="product-discount">${prod.discount}</div>` : ''}
                    <button class="add-btn" onclick="addToCart(${prod.id}, '${prod.name}', ${prod.price})">
                        + Добавить
                    </button>
                </div>
            `).join('');
        }

        function renderPopularProductsHome() {
            const grid = document.getElementById('popular-products-home');
            if (!grid) return;
            const popular = state.products.slice(0, 6);
            grid.innerHTML = popular.map(prod => `
                <div class="product-card-home">
                    ${prod.discount ? `<div class="product-home-discount">${prod.discount}</div>` : ''}
                    <div class="product-home-img">${prod.emoji}</div>
                    <div class="product-home-name">${prod.name}</div>
                    <div class="product-home-bottom">
                        <div class="product-home-price">
                            ${prod.old_price ? `<span class="product-home-old-price">${prod.old_price}₽</span>` : ''}
                            ${prod.price}₽
                        </div>
                        <button class="product-home-add" onclick="addToCart(${prod.id}, '${prod.name}', ${prod.price}); showToast('${prod.name} добавлен');">+</button>
                    </div>
                </div>
            `).join('');
        }

        function showToast(message) {
            let toast = document.getElementById('toast');
            if (!toast) {
                toast = document.createElement('div');
                toast.id = 'toast';
                toast.className = 'toast';
                document.body.appendChild(toast);
            }
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        }

        async function loadPromotions() {
            const data = await API.promotions();
            state.promotions = data.promotions;
            renderPromotions();
        }

        function renderPromotions() {
            const list = document.getElementById('promo-list');
            list.innerHTML = state.promotions.map(promo => `
                <div class="promotion-promo">
                    <div class="promo-emoji">${promo.emoji}</div>
                    <div class="promo-title">${promo.title}</div>
                    <div class="promo-desc">${promo.description}</div>
                    <span class="promo-badge">${promo.discount}</span>
                </div>
            `).join('');
        }

        async function loadProfile() {
            const data = await API.profile();
            state.profile = data.user;
            renderProfile();
        }

        function renderProfile() {
            const user = state.profile;
            const content = document.getElementById('profile-content');
            content.innerHTML = `
                <!-- Loyalty Card -->
                <div class="profile-loyalty-card">
                    <div class="loyalty-card-top">
                        <div class="loyalty-card-labels">
                            <div class="loyalty-card-label">уровень</div>
                            <div class="loyalty-card-label">кэшбэк</div>
                        </div>
                        <div class="loyalty-card-coins">
                            <span>🪙</span>
                            <span class="coin-count">0</span>
                        </div>
                    </div>
                    <div class="loyalty-card-values">
                        <div class="loyalty-card-value">Друг</div>
                        <div class="loyalty-card-value">1,5%</div>
                    </div>
                    <div class="loyalty-barcode-block">
                        <div class="barcode-lines-large"></div>
                    </div>
                    <div class="loyalty-date">23.04.2026 11:55:08</div>
                    <div class="loyalty-hint-row">
                        <span>Ещё 12 дней с покупками до 2% кешбэка в следу...</span>
                        <span class="hint-arrow">›</span>
                    </div>
                </div>

                <!-- Quick Actions (3 items) -->
                <div class="profile-quick-actions">
                    <div class="profile-quick-item" onclick="trackClick('profile->purchases'); switchToScreen('catalog-screen')">
                        <div class="profile-quick-circle">
                            <span>📝</span>
                        </div>
                        <span class="profile-quick-label">Покупки</span>
                    </div>
                    <div class="profile-quick-item" onclick="trackClick('profile->favorites')">
                        <div class="profile-quick-circle">
                            <span>🏷️</span>
                        </div>
                        <span class="profile-quick-label">Избранное</span>
                    </div>
                    <div class="profile-quick-item" onclick="trackClick('profile->promocodes')">
                        <div class="profile-quick-circle">
                            <span>🎁</span>
                        </div>
                        <span class="profile-quick-label">Промокоды</span>
                    </div>
                </div>

                <!-- Profile Sections List -->
                <div class="profile-sections-list">
                    <div class="profile-section-card">
                        <div class="profile-section-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="1 6 1 22 8 18 16 22 21 18 21 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                        </div>
                        <div class="profile-section-text">
                            <div class="profile-section-title">Регион</div>
                            <div class="profile-section-desc">Москва</div>
                        </div>
                        <div class="profile-section-arrow">›</div>
                    </div>
                    <div class="profile-section-card">
                        <div class="profile-section-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                        <div class="profile-section-text">
                            <div class="profile-section-title">Мои адреса</div>
                            <div class="profile-section-desc">Адреса доставки, магазины самовывоза</div>
                        </div>
                        <div class="profile-section-arrow">›</div>
                    </div>
                    <div class="profile-section-card">
                        <div class="profile-section-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                        </div>
                        <div class="profile-section-text">
                            <div class="profile-section-title">Способы оплаты</div>
                            <div class="profile-section-desc">Твои сохраненные банковские карты</div>
                        </div>
                        <div class="profile-section-arrow">›</div>
                    </div>
                    <div class="profile-section-card">
                        <div class="profile-section-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        </div>
                        <div class="profile-section-text">
                            <div class="profile-section-title">Мои карты лояльности</div>
                            <div class="profile-section-desc">Пластиковые и социальные карты</div>
                        </div>
                        <div class="profile-section-arrow">›</div>
                    </div>
                    <div class="profile-section-card">
                        <div class="profile-section-icon">
                            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <div class="profile-section-text">
                            <div class="profile-section-title">Бонусы за друзей</div>
                            <div class="profile-section-desc">Приглашай друзей и получай бонусы</div>
                        </div>
                        <div class="profile-section-arrow">›</div>
                    </div>
                </div>

                <div class="profile-section">
                    <div class="profile-field">
                        <div class="profile-label">Телефон</div>
                        <div class="profile-value">${user.phone}</div>
                    </div>
                    <div class="profile-field">
                        <div class="profile-label">Email</div>
                        <div class="profile-value">${user.email}</div>
                    </div>
                    <div class="profile-field">
                        <div class="profile-label">Кэшбэк</div>
                        <div class="profile-value">${user.cashback_rate} на каждую покупку</div>
                    </div>
                    <div class="profile-field">
                        <div class="profile-label">Участник с</div>
                        <div class="profile-value">${user.member_since}</div>
                    </div>
                </div>
            `;
        }

        // Cart Management
        function addToCart(productId, name, price) {
            state.totalClicks++;

            if (state.cart[productId]) {
                state.cart[productId].quantity += 1;
            } else {
                state.cart[productId] = {
                    id: productId,
                    name: name,
                    price: price,
                    quantity: 1,
                };
            }

            state.cartCount = Object.keys(state.cart).length;
            updateCartBadge();
            updateMissionProgress();
            updateCartOnScreen();
            showCartUpdated();
            animateFloatingCart();
        }

        function animateFloatingCart() {
            const btn = document.getElementById('floating-cart-btn');
            if (!btn) return;
            btn.style.transform = 'scale(1.15)';
            setTimeout(() => { btn.style.transform = 'scale(1)'; }, 200);
        }

        function removeFromCart(productId) {
            state.totalClicks++;
            state.unnecessaryClicks++; // Counted as potentially unnecessary
            delete state.cart[productId];
            state.cartCount = Object.keys(state.cart).length;
            updateCartBadge();
            renderCart();
        }

        function updateCartQuantity(productId, delta) {
            state.totalClicks++;
            if (state.cart[productId]) {
                state.cart[productId].quantity += delta;
                if (state.cart[productId].quantity <= 0) {
                    removeFromCart(productId);
                } else {
                    renderCart();
                }
            }
        }

        function updateCartBadge() {
            const badge = document.getElementById('floating-cart-badge');
            if (state.cartCount > 0) {
                badge.style.display = 'flex';
                badge.textContent = state.cartCount;
            } else {
                badge.style.display = 'none';
            }
        }

        function updateFloatingCartVisibility() {
            const fab = document.getElementById('floating-cart-btn');
            if (!fab) return;
            if (currentScreen === 'cart-screen') {
                fab.classList.add('hidden');
            } else {
                fab.classList.remove('hidden');
            }
        }

        function renderCart() {
            const content = document.getElementById('cart-content');
            const items = Object.values(state.cart);

            if (items.length === 0) {
                content.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-emoji">🛒</div>
                        <div class="empty-text">Ваша корзина пуста</div>
                        <div class="empty-subtext">Добавьте товары из каталога</div>
                    </div>
                `;
                return;
            }

            let totalPrice = 0;
            let discount = 0;

            items.forEach(item => {
                totalPrice += item.price * item.quantity;
            });

            // Simple 10% discount
            discount = Math.round(totalPrice * 0.1);

            const itemsHtml = items.map(item => `
                <div class="cart-item">
                    <div class="cart-item-emoji">${state.products.find(p => p.id === item.id)?.emoji || '📦'}</div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-price">${item.price}₽</div>
                    </div>
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, -1)">−</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateCartQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="removeFromCart(${item.id})">✕</button>
                </div>
            `).join('');

            content.innerHTML = `
                <div class="cart-items">${itemsHtml}</div>
                <div class="cart-summary">
                    <div class="summary-row">
                        <span>Товаров: ${items.length}</span>
                        <span>${totalPrice}₽</span>
                    </div>
                    <div class="summary-row">
                        <span>Скидка</span>
                        <span>-${discount}₽</span>
                    </div>
                    <div class="summary-row">
                        <span>Итого</span>
                        <span>${totalPrice - discount}₽</span>
                    </div>
                </div>
                <button class="checkout-btn" onclick="checkout()">Оформить покупку</button>
            `;
        }

        function updateCartOnScreen() {
            if (document.getElementById('cart-screen').classList.contains('active')) {
                renderCart();
            }
        }

        function showCartUpdated() {
            // Could add a toast here
        }

        // Checkout
        function checkout() {
            state.totalClicks++;

            if (Object.keys(state.cart).length === 0) {
                alert('Корзина пуста!');
                return;
            }

            state.checkoutCompleted = true;

            // Try auto-complete if there is an active mission
            if (state.currentMission && !state.currentMission.completed && !state.missionCompleting) {
                updateMissionProgress();
                if (checkMissionCompletion()) {
                    return; // auto-complete handled
                }
                // Mission not yet complete — fallback to manual completion
                launchConfetti();
                completeMission();
                return;
            }

            // Regular checkout (no active mission or mission already done)
            launchConfetti();
            state.cart = {};
            state.cartCount = 0;
            updateCartBadge();
            updateCartOnScreen();
        }

        // Mission Completion
        async function completeMission() {
            if (state.missionCompleting) return;
            state.missionCompleting = true;

            if (window.missionTimerInterval) clearInterval(window.missionTimerInterval);

            const timeSpent = Math.floor((Date.now() - state.missionStartTime) / 1000);
            const stats = {
                time_spent_seconds: timeSpent,
                total_clicks: state.totalClicks,
                unnecessary_clicks: state.unnecessaryClicks,
            };

            try {
                const result = await API.completeMission(state.currentMissionId, stats);

                // Show success modal
                document.getElementById('modal-time').textContent = `${timeSpent} сек`;
                document.getElementById('modal-total-clicks').textContent = state.totalClicks;
                document.getElementById('modal-unnecessary-clicks').textContent = state.unnecessaryClicks;
                document.getElementById('modal-accuracy').textContent = `${result.accuracy}%`;

                showModal();
            } catch (e) {
                console.error('Mission completion failed', e);
            }

            // Mark mission as completed locally
            if (state.currentMission) state.currentMission.completed = true;

            // Reset cart
            state.cart = {};
            state.cartCount = 0;
            updateCartBadge();

            // Update drawer badge
            const badge = document.getElementById('mission-floating-badge');
            if (badge) badge.style.display = 'none';

            // Reset mission completion guard after a delay
            setTimeout(() => { state.missionCompleting = false; }, 2000);
        }

        // Confetti
        function launchConfetti() {
            for (let i = 0; i < 50; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.backgroundColor = ['#FF6B00', '#FF8A38', '#FFB366', '#34c759', '#007AFF'][Math.floor(Math.random() * 5)];
                confetti.style.animationDelay = Math.random() * 0.3 + 's';
                document.body.appendChild(confetti);

                setTimeout(() => confetti.remove(), 2300);
            }
        }

        // Modal
        function showModal() {
            document.getElementById('success-modal').classList.add('show');
        }

        function hideModal() {
            document.getElementById('success-modal').classList.remove('show');
        }

        // Mission Drawer
        function openMissionDrawer() {
            document.getElementById('mission-drawer-overlay').classList.add('show');
            document.getElementById('mission-drawer').classList.add('open');
            updateDrawerContent();
        }

        function closeMissionDrawer() {
            document.getElementById('mission-drawer-overlay').classList.remove('show');
            document.getElementById('mission-drawer').classList.remove('open');
        }

        function updateDrawerContent() {
            const mission = state.currentMission;
            if (!mission) return;
            document.getElementById('drawer-mission-title').textContent = mission.title || 'Без названия';
            document.getElementById('drawer-mission-desc').textContent = mission.description || '';
            if (state.missionStartTime) {
                const elapsed = Math.floor((Date.now() - state.missionStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                document.getElementById('drawer-mission-timer').textContent =
                    `${minutes}:${String(seconds).padStart(2, '0')}`;
            }
            const progressFill = document.getElementById('drawer-progress-fill');
            const progressPercent = document.getElementById('drawer-progress-percent');
            const percentVal = document.getElementById('progress-percent')?.textContent || '0';
            progressFill.style.width = percentVal + '%';
            progressPercent.textContent = percentVal + '%';
            document.getElementById('drawer-stat-clicks').textContent = state.totalClicks;
            document.getElementById('drawer-stat-unnecessary').textContent = state.unnecessaryClicks;
            const badge = document.getElementById('mission-floating-badge');
            if (badge) {
                badge.style.display = (state.currentMission && !state.currentMission.completed) ? 'flex' : 'none';
            }
        }

        function goToMissionScreen() {
            closeMissionDrawer();
            switchToScreen('mission-screen');
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        }

        async function startNewMissionFromDrawer() {
            closeMissionDrawer();
            await startNewMission();
        }

        // Helpers
        function navigateToProducts() {
            switchToScreen('products-screen');
        }

        function switchToProducts() {
            switchToScreen('products-screen');
        }

        // Initialize on load
        window.addEventListener('load', init);

        // Update cart view when switching to cart screen
        document.getElementById('cart-screen').addEventListener('click', () => {
            setTimeout(renderCart, 0);
        });
