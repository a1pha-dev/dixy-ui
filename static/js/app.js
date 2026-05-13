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
        };

        const API = {
            catalog: () => fetch('/api/catalog').then(r => r.json()),
            products: () => fetch('/api/all-products').then(r => r.json()),
            promotions: () => fetch('/api/promotions').then(r => r.json()),
            profile: () => fetch('/api/profile').then(r => r.json()),
            mission: () => fetch('/api/mission/new').then(r => r.json()),
            completeMission: (id, stats) => fetch(`/api/mission/${id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stats)
            }).then(r => r.json()),
            trackClick: (from, to) => fetch('/api/click-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ from, to, timestamp: new Date().toISOString() })
            }).catch(e => console.log('Click logged locally')),
        };

        // Initialize app
        async function init() {
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
            let progress = 0;

            if (mission.type === 'screen') {
                // Check if user visited the screen
                progress = 50; // Placeholder
            } else if (mission.type === 'add_item') {
                // Count items in cart
                const itemCount = Object.keys(state.cart).length;
                progress = Math.min((itemCount / mission.items_count) * 100, 100);
            } else if (mission.type === 'checkout') {
                progress = 25; // Placeholder
            }

            const progressPercent = Math.round(progress);
            document.getElementById('progress-fill').style.width = progressPercent + '%';
            document.getElementById('progress-percent').textContent = progressPercent;

            // Sync drawer progress
            document.getElementById('drawer-progress-fill').style.width = progressPercent + '%';
            document.getElementById('drawer-progress-percent').textContent = progressPercent + '%';

            return progressPercent >= 100;
        }

        // Screen Navigation
        let currentScreen = 'home-screen';

        function switchScreen(event) {
            const target = event.target.closest('.nav-item');
            if (!target) return;

            state.totalClicks++;
            const screenId = target.dataset.screen;
            trackClick(currentScreen, screenId);
            switchToScreen(screenId);
        }

        function switchToScreen(screenId) {
            const screens = document.querySelectorAll('.screen');
            const navItems = document.querySelectorAll('.nav-item');

            screens.forEach(s => s.classList.remove('active'));
            navItems.forEach(n => n.classList.remove('active'));

            document.getElementById(screenId).classList.add('active');
            document.querySelector(`[data-screen="${screenId}"]`)?.classList.add('active');
            currentScreen = screenId;
            updateFloatingCartVisibility();

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
                <div class="profile-section">
                    <div class="profile-header">
                        <div class="profile-avatar">${user.avatar}</div>
                        <div class="profile-name">${user.name}</div>
                        <div class="profile-status">${user.status}</div>
                    </div>
                </div>

                <div class="profile-section">
                    <div class="points-display">
                        <div>🎁</div>
                        <div>
                            <div class="points-number">${user.loyalty_points}</div>
                            <div class="points-label">баллов</div>
                        </div>
                    </div>
                </div>

                <div class="profile-section loyalty-card-section">
                    <div class="loyalty-card-title">📇 Моя карта Дикси</div>
                    <div class="qr-wrapper">
                        <div class="qr-code">
                            <div class="qr-pattern"></div>
                            <div class="qr-center">
                                <div class="qr-center-inner"></div>
                            </div>
                        </div>
                    </div>
                    <div class="barcode-wrapper">
                        <div class="barcode-lines"></div>
                        <div class="barcode-number">2966107476486902</div>
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

            launchConfetti();
            completeMission();
        }

        // Mission Completion
        async function completeMission() {
            if (window.missionTimerInterval) clearInterval(window.missionTimerInterval);

            const timeSpent = Math.floor((Date.now() - state.missionStartTime) / 1000);
            const stats = {
                time_spent_seconds: timeSpent,
                total_clicks: state.totalClicks,
                unnecessary_clicks: state.unnecessaryClicks,
            };

            const result = await API.completeMission(state.currentMissionId, stats);

            // Show success modal
            document.getElementById('modal-time').textContent = `${timeSpent} сек`;
            document.getElementById('modal-total-clicks').textContent = state.totalClicks;
            document.getElementById('modal-unnecessary-clicks').textContent = state.unnecessaryClicks;
            document.getElementById('modal-accuracy').textContent = `${result.accuracy}%`;

            showModal();

            // Reset cart
            state.cart = {};
            state.cartCount = 0;
            updateCartBadge();

            // Update drawer badge
            const badge = document.getElementById('mission-floating-badge');
            if (badge) badge.style.display = 'none';
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
            trackClick(currentScreen, 'products-screen');
            switchToScreen('products-screen');
        }

        function switchToProducts() {
            trackClick(currentScreen, 'products-screen');
            switchToScreen('products-screen');
        }

        // Initialize on load
        window.addEventListener('load', init);

        // Update cart view when switching to cart screen
        document.getElementById('cart-screen').addEventListener('click', () => {
            setTimeout(renderCart, 0);
        });
