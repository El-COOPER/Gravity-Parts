const CART_STORAGE_KEY = "gravity-parts-cart";

function setCartMessage(message) {
    document.querySelectorAll("[data-cart-message]").forEach((element) => {
        element.textContent = message;
    });
}

function isCartItem(value) {
    return value !== null
        && typeof value === "object"
        && typeof value.id === "string"
        && typeof value.name === "string"
        && typeof value.image === "string"
        && Number.isFinite(value.price)
        && value.price >= 0
        && Number.isInteger(value.quantity)
        && value.quantity > 0;
}

function readCart() {
    let storedCart;
    try {
        storedCart = localStorage.getItem(CART_STORAGE_KEY);
    } catch {
        setCartMessage("No se pudo acceder al carrito guardado en este navegador.");
        return null;
    }

    if (storedCart === null) {
        return [];
    }

    try {
        const cart = JSON.parse(storedCart);
        if (!Array.isArray(cart) || !cart.every(isCartItem)) {
            setCartMessage("El carrito guardado tiene datos inválidos. No se modificó.");
            return null;
        }
        return cart;
    } catch {
        setCartMessage("No se pudo leer el carrito guardado. No se modificó.");
        return null;
    }
}

function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        setCartMessage("");
        return true;
    } catch {
        setCartMessage("No se pudo guardar el carrito en este navegador.");
        return false;
    }
}

function formatPrice(price) {
    return `$ ${new Intl.NumberFormat("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price)}`;
}

function renderCart() {
    const cart = readCart();
    if (cart === null) {
        return;
    }

    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((element) => {
        element.textContent = String(count);
    });

    const container = document.querySelector("[data-cart-content]");
    if (!container) {
        return;
    }

    container.replaceChildren();
    if (cart.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-cart";
        empty.innerHTML = '<p>Tu carrito está vacío.</p><a class="button" href="catalogo.html">Explorar catálogo</a>';
        container.append(empty);
        return;
    }

    const itemList = document.createElement("div");
    itemList.className = "cart-items";
    cart.forEach((item) => {
        const row = document.createElement("article");
        row.className = "cart-item";

        const image = document.createElement("img");
        image.src = item.image;
        image.alt = item.name;

        const details = document.createElement("div");
        details.className = "cart-item-details";
        const name = document.createElement("h3");
        name.textContent = item.name;
        const price = document.createElement("p");
        price.textContent = `${formatPrice(item.price)} c/u`;
        details.append(name, price);

        const quantity = document.createElement("div");
        quantity.className = "quantity-control";
        quantity.setAttribute("aria-label", `Cantidad de ${item.name}`);
        quantity.append(
            createCartButton("decrease", item.id, "−", `Quitar una unidad de ${item.name}`),
            Object.assign(document.createElement("span"), { textContent: String(item.quantity) }),
            createCartButton("increase", item.id, "+", `Agregar una unidad de ${item.name}`)
        );

        const subtotal = document.createElement("strong");
        subtotal.className = "cart-item-subtotal";
        subtotal.textContent = formatPrice(item.price * item.quantity);

        const remove = createCartButton("remove", item.id, "Quitar", `Quitar ${item.name} del carrito`);
        remove.classList.add("text-button");

        row.append(image, details, quantity, subtotal, remove);
        itemList.append(row);
    });

    const summary = document.createElement("div");
    summary.className = "cart-summary";
    const totalLabel = document.createElement("strong");
    totalLabel.textContent = "Total";
    const total = document.createElement("strong");
    total.textContent = formatPrice(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
    summary.append(totalLabel, total);

    const continueLink = document.createElement("a");
    continueLink.className = "button button-secondary";
    continueLink.href = "catalogo.html";
    continueLink.textContent = "Seguir comprando";
    const actions = document.createElement("div");
    actions.className = "cart-actions";
    actions.append(continueLink);

    container.append(itemList, summary, actions);
}

function createCartButton(action, id, label, accessibleLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = action === "remove" ? "text-button" : "quantity-button";
    button.dataset.cartAction = action;
    button.dataset.id = id;
    button.textContent = label;
    button.setAttribute("aria-label", accessibleLabel);
    return button;
}

document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
        return;
    }

    const addButton = target.closest("[data-add-to-cart]");
    if (addButton instanceof HTMLButtonElement) {
        const { id, name, price, image } = addButton.dataset;
        const parsedPrice = Number(price);
        if (!id || !name || !image || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
            setCartMessage("No se pudo agregar el producto porque sus datos no son válidos.");
            return;
        }

        const cart = readCart();
        if (cart === null) {
            return;
        }
        const existingItem = cart.find((item) => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price: parsedPrice, image, quantity: 1 });
        }

        if (saveCart(cart)) {
            setCartMessage(`${name} se agregó al carrito.`);
            renderCart();
        }
        return;
    }

    const cartButton = target.closest("[data-cart-action]");
    if (!(cartButton instanceof HTMLButtonElement)) {
        return;
    }

    const cart = readCart();
    if (cart === null) {
        return;
    }
    const { cartAction, id } = cartButton.dataset;
    const item = cart.find((cartItem) => cartItem.id === id);
    if (!item) {
        setCartMessage("No se encontró ese producto en el carrito.");
        return;
    }

    if (cartAction === "remove" || (cartAction === "decrease" && item.quantity === 1)) {
        const itemIndex = cart.findIndex((cartItem) => cartItem.id === id);
        cart.splice(itemIndex, 1);
    } else if (cartAction === "decrease") {
        item.quantity -= 1;
    } else if (cartAction === "increase") {
        item.quantity += 1;
    } else {
        return;
    }

    if (saveCart(cart)) {
        renderCart();
    }
});

renderCart();