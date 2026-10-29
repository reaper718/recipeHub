
const API_BASE = "http://localhost:3000";

const recipeForm = document.getElementById("recipeForm");
const ingredientsList = document.getElementById("ingredientsList");
const instructionsList = document.getElementById("instructionsList");
const addIngredientButton = document.getElementById("addIngredient");
const addInstructionButton = document.getElementById("addInstruction");
const submitButton = document.getElementById("submitRecipe");
const formMessage = document.getElementById("formMessage");

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
}

function showFormMessage(message, type = "danger") {
    formMessage.textContent = message;
    formMessage.className = `alert alert-${type}`;
}

function clearFormMessage() {
    formMessage.textContent = "";
    formMessage.className = "alert d-none";
}

function getToken() {
    return sessionStorage.getItem("token");
}

function createIngredientRow() {
    const row = document.createElement("div");
    row.className = "ingredient-row";

    row.innerHTML = `
        <input
            class="form-control ingredient-name"
            name="ingredientName"
            placeholder="Ingredient name"
            maxlength="150"
            required
        >

        <input
            class="form-control ingredient-quantity"
            name="ingredientQuantity"
            type="number"
            min="0"
            step="0.01"
            placeholder="Quantity"
            required
        >

        <input
            class="form-control ingredient-unit"
            name="ingredientUnit"
            placeholder="Unit (grams, cups)"
            maxlength="40"
            required
        >

        <button type="button" class="remove-row" aria-label="Remove ingredient">
            Remove
        </button>
    `;

    row.querySelector(".remove-row").addEventListener("click", () => {
        if (ingredientsList.children.length === 1) {
            showFormMessage("Add at least one ingredient.", "warning");
            return;
        }

        row.remove();
        clearFormMessage();
    });

    ingredientsList.appendChild(row);
}

function createInstructionRow() {
    const row = document.createElement("div");
    row.className = "instruction-row";

    const number = document.createElement("span");
    number.className = "instruction-number";

    const textarea = document.createElement("textarea");
    textarea.className = "form-control";
    textarea.name = "instruction";
    textarea.placeholder = "Describe this cooking step...";
    textarea.rows = 2;
    textarea.required = true;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-row";
    removeButton.textContent = "Remove";
    removeButton.setAttribute("aria-label", "Remove instruction");

    removeButton.addEventListener("click", () => {
        if (instructionsList.children.length === 1) {
            showFormMessage("Add at least one instruction.", "warning");
            return;
        }

        row.remove();
        updateInstructionNumbers();
        clearFormMessage();
    });

    row.append(number, textarea, removeButton);
    instructionsList.appendChild(row);

    updateInstructionNumbers();
}

function updateInstructionNumbers() {
    [...instructionsList.children].forEach((row, index) => {
        row.querySelector(".instruction-number").textContent = index + 1;
    });
}

function collectIngredients() {
    return [...ingredientsList.querySelectorAll(".ingredient-row")].map(row => ({
        name: row.querySelector('[name="ingredientName"]').value.trim(),
        quantity: Number(row.querySelector('[name="ingredientQuantity"]').value),
        unit: row.querySelector('[name="ingredientUnit"]').value.trim()
    }));
}

function collectInstructions() {
    return [...instructionsList.querySelectorAll(".instruction-row")].map((row, index) => ({
        stepNumber: index + 1,
        instruction: row.querySelector('[name="instruction"]').value.trim()
    }));
}

addIngredientButton.addEventListener("click", () => {
    createIngredientRow();
    clearFormMessage();
});

addInstructionButton.addEventListener("click", () => {
    createInstructionRow();
    clearFormMessage();
});

recipeForm.addEventListener("submit", async event => {
    event.preventDefault();
    clearFormMessage();

    const token = getToken();

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const ingredients = collectIngredients();
    const instructions = collectInstructions();

    if (ingredients.length === 0 || ingredients.some(item =>
        !item.name || !item.unit || !Number.isFinite(item.quantity) || item.quantity < 0
    )) {
        showFormMessage("Please enter valid details for every ingredient.");
        return;
    }

    if (instructions.length === 0 || instructions.some(item => !item.instruction)) {
        showFormMessage("Please complete every cooking instruction.");
        return;
    }

    const recipeData = {
        title: document.getElementById("title").value.trim(),
        description: document.getElementById("description").value.trim(),
        imageURL: document.getElementById("imageURL").value.trim() || null,
        category: document.getElementById("category").value,
        difficulty: document.getElementById("difficulty").value,
        dietaryPreferences: [
            ...document.querySelectorAll(
                'input[name="dietaryPreferences"]:checked'
            )
        ].map(input => input.value),
        prepTimeMinutes: Number(document.getElementById("prepTimeMinutes").value),
        cookTimeMinutes: Number(document.getElementById("cookTimeMinutes").value),
        servings: Number(document.getElementById("servings").value),
        ingredients,
        instructions
    };

    if (
        !recipeData.title ||
        !recipeData.description ||
        recipeData.prepTimeMinutes < 0 ||
        recipeData.cookTimeMinutes < 0 ||
        recipeData.servings < 1
    ) {
        showFormMessage("Please check the recipe details and try again.");
        return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Publishing...";

    try {
        const response = await fetch(`${API_BASE}/recipes`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(recipeData)
        });

        const result = await response.json();

        if (!response.ok || result.success !== true) {
            throw new Error(result.message || `Request failed: ${response.status}`);
        }

        showFormMessage("Recipe published successfully!", "success");

        recipeForm.reset();
        ingredientsList.innerHTML = "";
        instructionsList.innerHTML = "";

        createIngredientRow();
        createInstructionRow();

        setTimeout(() => {
            window.location.href = "home.html";
        }, 1000);
    } catch (error) {
        console.error("Unable to publish recipe:", error);
        showFormMessage(error.message || "Unable to publish recipe. Please try again.");
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i data-lucide="send"></i> Publish recipe';
        refreshIcons();
    }
});

// Start with one ingredient and one instruction.
createIngredientRow();
createInstructionRow();
refreshIcons();
