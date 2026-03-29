    <footer class="site-footer">
        <div class="container">
            <span class="footer-text">
                Powered by <strong>SpaceIS SDK</strong> v0.1.4
            </span>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/@spaceis/sdk@0.1.4/dist/spaceis.global.js"></script>
    <script>
    /**
     * SpaceIS PHP Example — Client-side interactivity.
     * Uses the SDK IIFE (window.SpaceIS) for cart, quantity steppers, etc.
     */
    (function() {
        'use strict';

        // ── Initialize SDK ──
        var client = SpaceIS.createSpaceIS({
            baseUrl: '<?= e($api->getBaseUrl()) ?>',
            shopUuid: '<?= e($api->getShopUuid()) ?>',
        });

        var cart = client.createCartManager({ autoLoad: true });

        // ── Helper: format price ──
        function fp(cents) {
            return SpaceIS.formatPrice(cents);
        }

        // ── Helper: placeholder SVG ──
        function placeholderSvg(size) {
            return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
        }

        // ── Helper: get error message ──
        function getErrorMessage(err) {
            if (!err) return 'An error occurred';
            if (err instanceof SpaceIS.SpaceISError) {
                if (err.isValidation) {
                    var all = err.allFieldErrors ? err.allFieldErrors() : [];
                    if (all.length > 0) return all[0];
                }
                return err.message || 'An error occurred';
            }
            if (err instanceof Error) return err.message || 'An error occurred';
            return 'An error occurred';
        }

        // ── Helper: escape HTML ──
        function esc(str) {
            var div = document.createElement('div');
            div.textContent = str || '';
            return div.innerHTML;
        }

        // ── Cart badge update ���─
        function updateBadge() {
            var badge = document.getElementById('cart-badge');
            if (!badge) return;
            var qty = cart.totalQuantity;
            if (qty > 0) {
                badge.textContent = qty;
                badge.className = 'cart-badge-dot visible';
            } else {
                badge.textContent = '';
                badge.className = 'cart-badge-dot';
            }
        }

        // Expose core globals early (before onChange fires immediately)
        window.SpaceISApp = {
            client: client,
            cart: cart,
            fp: fp,
            esc: esc,
            getErrorMessage: getErrorMessage,
            placeholderSvg: placeholderSvg,
        };

        // Subscribe to cart changes
        cart.onChange(function() {
            updateBadge();
            renderDrawer();
            // Also update cart page if visible
            if (typeof window.renderCartPage === 'function') {
                window.renderCartPage();
            }
            if (typeof window.renderCheckoutPage === 'function') {
                window.renderCheckoutPage();
            }
        });

        // Initial badge
        updateBadge();

        // ── Cart Drawer ──
        var drawerOpen = false;

        function renderDrawer() {
            var drawer = document.getElementById('cart-drawer');
            if (!drawer) return;

            var items = cart.items;
            var totalQuantity = cart.totalQuantity;
            var finalPrice = cart.finalPrice;
            var regularPrice = cart.regularPrice;
            var hasDiscount = cart.hasDiscount;
            var discount = cart.discount;
            var isEmpty = cart.isEmpty;
            var isLoading = cart.isLoading;
            var discountAmount = regularPrice - finalPrice;

            var html = '';

            // Header
            html += '<div class="drawer-header">';
            html += '<span class="drawer-title">CART' + (totalQuantity > 0 ? ' (' + totalQuantity + ')' : '') + '</span>';
            html += '<button class="close-btn" onclick="SpaceISApp.closeDrawer()" aria-label="Close">&#10005;</button>';
            html += '</div>';

            // Body
            html += '<div class="drawer-body">';
            if (isLoading && !cart.cart) {
                html += '<div class="spinner"></div>';
            } else if (isEmpty) {
                html += '<div class="empty-state">';
                html += '<div class="icon">&#128722;</div>';
                html += '<p>Your cart is empty</p>';
                html += '<button class="cart-action-secondary" onclick="SpaceISApp.closeDrawer()" style="margin-top:16px">Continue Shopping</button>';
                html += '</div>';
            } else {
                html += '<ul class="cart-items-list">';
                items.forEach(function(item) {
                    var variantUuid = item.variant ? item.variant.uuid : '';
                    var imgSrc = SpaceIS.getCartItemImage(item);
                    var displayQty = SpaceIS.getItemQty(item);
                    var showVariant = item.variant && item.shop_product && item.variant.name !== item.shop_product.name;

                    html += '<li class="cart-item">';
                    html += '<div class="cart-item-img-wrap">';
                    if (imgSrc) {
                        html += '<img class="cart-item-img" src="' + esc(imgSrc) + '" alt="">';
                    } else {
                        html += '<div class="cart-item-img-placeholder">' + placeholderSvg(24) + '</div>';
                    }
                    html += '</div>';

                    html += '<div class="cart-item-details">';
                    html += '<div class="cart-item-top">';
                    html += '<div class="cart-item-info">';
                    html += '<div class="cart-item-name">' + esc(item.shop_product ? item.shop_product.name : '') + '</div>';
                    if (showVariant) {
                        html += '<div class="cart-item-variant">' + esc(item.variant.name) + '</div>';
                    }
                    if (item.package) {
                        html += '<div class="cart-item-package">Package: ' + esc(item.package.name) + '</div>';
                    }
                    html += '</div>';
                    html += '<button class="cart-item-remove" aria-label="Remove" onclick="SpaceISApp.removeItem(\'' + esc(variantUuid) + '\')">';
                    html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
                    html += '</button>';
                    html += '</div>';

                    html += '<div class="cart-item-bottom">';
                    html += '<div class="cart-item-prices">';
                    html += '<span class="cart-item-price-current">' + fp(item.final_price_value) + '</span>';
                    if (item.regular_price_value !== item.final_price_value) {
                        html += '<span class="cart-item-price-old">' + fp(item.regular_price_value) + '</span>';
                    }
                    html += '</div>';
                    html += '<div class="qty-stepper">';
                    html += '<button class="qty-step-btn" onclick="SpaceISApp.decrementItem(\'' + esc(variantUuid) + '\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg></button>';
                    html += '<input class="qty-input" type="text" inputmode="numeric" value="' + displayQty + '" onblur="SpaceISApp.setItemQty(\'' + esc(variantUuid) + '\',this.value,this)" onkeydown="if(event.key===\'Enter\')this.blur()">';
                    html += '<button class="qty-step-btn" onclick="SpaceISApp.incrementItem(\'' + esc(variantUuid) + '\')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></button>';
                    html += '</div>';
                    html += '</div>';
                    html += '</div>';
                    html += '</li>';
                });
                html += '</ul>';
            }
            html += '</div>';

            // Footer
            if (!isEmpty) {
                html += '<div class="drawer-footer">';

                // Discount section
                if (hasDiscount && discount) {
                    html += '<div class="discount-active">';
                    html += '<span>Code: <strong>' + esc(discount.code) + '</strong></span>';
                    html += '<span class="discount-active-pct">-' + discount.percentage_discount + '%</span>';
                    html += '<button class="discount-remove" onclick="SpaceISApp.removeDiscount()">Remove</button>';
                    html += '</div>';
                } else {
                    html += '<div class="discount-row">';
                    html += '<input type="text" id="drawer-discount-input" placeholder="Discount code" onkeydown="if(event.key===\'Enter\')SpaceISApp.applyDrawerDiscount()">';
                    html += '<button class="discount-apply" onclick="SpaceISApp.applyDrawerDiscount()">Apply</button>';
                    html += '</div>';
                }

                // Summary
                html += '<div class="cart-summary-panel">';
                html += '<div class="cart-summary-header">Subtotal (' + totalQuantity + ')</div>';
                html += '<div class="cart-summary-row"><span>Subtotal</span><span>' + fp(regularPrice) + '</span></div>';
                if (discountAmount > 0) {
                    html += '<div class="cart-summary-row cart-summary-discount"><span>Discount';
                    if (hasDiscount && discount) {
                        html += ' (' + discount.percentage_discount + '%)';
                    }
                    html += '</span><span>-' + fp(discountAmount) + '</span></div>';
                }
                html += '<div class="cart-summary-total"><span>Total</span><span>' + fp(finalPrice) + '</span></div>';
                html += '</div>';

                // Actions
                html += '<div class="cart-actions">';
                html += '<button class="cart-action-primary" onclick="SpaceISApp.closeDrawer();window.location.href=\'/checkout.php\'">Proceed to checkout <span style="margin-left:6px">&rarr;</span></button>';
                html += '<button class="cart-action-secondary" onclick="SpaceISApp.closeDrawer();window.location.href=\'/cart.php\'">View cart</button>';
                html += '</div>';

                html += '</div>';
            }

            drawer.innerHTML = html;
        }

        function openDrawer() {
            drawerOpen = true;
            document.getElementById('cart-overlay').classList.add('open');
            document.getElementById('cart-drawer').classList.add('open');
            renderDrawer();
        }

        function closeDrawer() {
            drawerOpen = false;
            document.getElementById('cart-overlay').classList.remove('open');
            document.getElementById('cart-drawer').classList.remove('open');
        }

        function toggleDrawer() {
            if (drawerOpen) closeDrawer();
            else openDrawer();
        }

        // ── Mobile menu ──
        var mobileMenuOpen = false;

        function toggleMobileMenu() {
            mobileMenuOpen = !mobileMenuOpen;
            var btn = document.getElementById('mobile-menu-btn');
            var overlay = document.getElementById('mobile-menu-overlay');
            var menu = document.getElementById('mobile-menu');
            if (mobileMenuOpen) {
                btn.classList.add('active');
                overlay.classList.add('open');
                menu.classList.add('open');
                document.body.style.overflow = 'hidden';
            } else {
                btn.classList.remove('active');
                overlay.classList.remove('open');
                menu.classList.remove('open');
                document.body.style.overflow = '';
            }
        }

        function closeMobileMenu() {
            if (!mobileMenuOpen) return;
            mobileMenuOpen = false;
            document.getElementById('mobile-menu-btn').classList.remove('active');
            document.getElementById('mobile-menu-overlay').classList.remove('open');
            document.getElementById('mobile-menu').classList.remove('open');
            document.body.style.overflow = '';
        }

        // ── Toast notifications ──
        var toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.id = 'toast-container';
        document.body.appendChild(toastContainer);

        function showToast(message, type) {
            var toast = document.createElement('div');
            toast.className = 'toast' + (type === 'error' ? ' error' : type === 'success' ? ' success' : '');
            toast.textContent = message;
            toastContainer.appendChild(toast);
            requestAnimationFrame(function() { toast.classList.add('show'); });
            setTimeout(function() {
                toast.classList.remove('show');
                setTimeout(function() { toast.remove(); }, 300);
            }, 3500);
        }

        // ── Cart operations (exposed globally) ──

        function addToCart(variantUuid, quantity) {
            return cart.add(variantUuid, quantity || 1).catch(function(err) {
                showToast(getErrorMessage(err), 'error');
            });
        }

        function removeItem(variantUuid) {
            cart.remove(variantUuid).catch(function(err) {
                showToast(getErrorMessage(err), 'error');
            });
        }

        function incrementItem(variantUuid) {
            cart.increment(variantUuid).catch(function(err) {
                showToast(getErrorMessage(err), 'error');
            });
        }

        function decrementItem(variantUuid) {
            cart.decrement(variantUuid).catch(function(err) {
                showToast(getErrorMessage(err), 'error');
            });
        }

        function applyDrawerDiscount() {
            var input = document.getElementById('drawer-discount-input');
            if (!input) return;
            var code = input.value.trim();
            if (!code) return;
            cart.applyDiscount(code).then(function() {
                input.value = '';
            }).catch(function(err) {
                showToast(getErrorMessage(err) || 'Invalid code', 'error');
            });
        }

        // Cache product limits per slug
        var limitsCache = {};

        function fetchProductLimits(slug) {
            if (limitsCache[slug]) return Promise.resolve(limitsCache[slug]);
            return client.products.get(slug).then(function(product) {
                var limits = SpaceIS.getProductLimits(product);
                limitsCache[slug] = limits;
                return limits;
            }).catch(function() {
                return { min: 1, max: 99, step: 1 };
            });
        }

        function setItemQty(variantUuid, val, inputEl) {
            var n = parseInt(val, 10);
            var item = cart.findItem(variantUuid);
            if (!item) return;
            var currentQty = SpaceIS.fromApiQty(item.quantity);
            if (isNaN(n)) { if (inputEl) inputEl.value = currentQty; return; }
            if (n === currentQty) return;

            var slug = item.shop_product ? (item.shop_product.slug || item.shop_product.uuid) : null;
            if (!slug) {
                cart.setQuantity(variantUuid, Math.max(1, n)).then(function() {
                    showToast('Quantity updated', 'success');
                }).catch(function(err) {
                    showToast(getErrorMessage(err), 'error');
                    if (inputEl) inputEl.value = currentQty;
                });
                return;
            }

            fetchProductLimits(slug).then(function(limits) {
                var snapped = SpaceIS.snapQuantity(n, limits);
                if (inputEl) inputEl.value = snapped;
                if (snapped === currentQty) return;
                return cart.setQuantity(variantUuid, snapped).then(function() {
                    showToast('Quantity updated', 'success');
                });
            }).catch(function(err) {
                showToast(getErrorMessage(err), 'error');
                if (inputEl) inputEl.value = currentQty;
            });
        }

        function removeDiscount() {
            cart.removeDiscount().catch(function(err) {
                showToast(getErrorMessage(err), 'error');
            });
        }

        // ── Expose global API ──
        window.SpaceISApp = {
            client: client,
            cart: cart,
            fp: fp,
            esc: esc,
            getErrorMessage: getErrorMessage,
            placeholderSvg: placeholderSvg,
            toggleDrawer: toggleDrawer,
            openDrawer: openDrawer,
            closeDrawer: closeDrawer,
            toggleMobileMenu: toggleMobileMenu,
            closeMobileMenu: closeMobileMenu,
            addToCart: addToCart,
            removeItem: removeItem,
            incrementItem: incrementItem,
            decrementItem: decrementItem,
            applyDrawerDiscount: applyDrawerDiscount,
            removeDiscount: removeDiscount,
            setItemQty: setItemQty,
            showToast: showToast,
        };

        // Initial drawer render
        renderDrawer();
    })();
    </script>
</body>
</html>
