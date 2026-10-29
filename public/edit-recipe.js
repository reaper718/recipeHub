
const API_BASE = "http://localhost:3000";

const form = document.getElementById("editRecipeForm");
const loadingMessage = document.getElementById("loadingMessage");
const formMessage = document.getElementById("formMessage");
const ingredientsList = document.getElementById("ingredientsList");
const instructionsList = document.getElementById("instructionsList");
const saveButton = document.getElementById("saveRecipeBtn");

const params = new URLSearchParams(window.location.search);
const recipeId = params.get("id");

let originalRecipe = null;

function showMessage(message, type = "error") {
    formMessage.textContent = message;
    formMessage.className = type;
}

function hideMessage() {
    formMessage.textContent = "";
    formMessage.className = "d-none";
}

function addIngredientRow(ingredient = {}) {
    const row = document.createElement("div");
    row.className = "ingredient-row";

    row.innerHTML = `
        <input name="ingredientName" placeholder="Ingredient name"
               required maxlength="255">
        <input name="ingredientQuantity" type="number" min="0"
               step="any" placeholder="Quantity" required>
        <input name="ingredientUnit" placeholder="Unit"
               required maxlength="50">
        <button type="button" class="remove-row">Remove</button>
    `;

    row.querySelector('[name="ingredientName"]').value =
        ingredient.name ?? "";

    row.querySelector('[name="ingredientQuantity"]').value =
        ingredient.quantity ?? "";

    row.querySelector('[name="ingredientUnit"]').value =
        ingredient.unit ?? "";

    row.querySelector(".remove-row").addEventListener("click", () => {
        row.remove();
    });

    ingredientsList.appendChild(row);
}

function addInstructionRow(instruction = {}) {
    const row = document.createElement("div");
    row.className = "instruction-row";

    row.innerHTML = `
        <textarea name="instruction" placeholder="Enter cooking step"
                  required></textarea>
        <button type="button" class="remove-row">Remove</button>
    `;

    row.querySelector('[name="instruction"]').value =
        typeof instruction === "string"
            ? instruction
            : instruction.instruction ?? "";

    row.querySelector(".remove-row").addEventListener("click", () => {
        row.remove();
    });

    instructionsList.appendChild(row);
}

function populateForm(recipe) {
    form.elements.title.value = recipe.title ?? "";
    form.elements.description.value = recipe.description ?? "";
    form.elements.imageURL.value = recipe.imageURL ?? "";
    form.elements.category.value = recipe.category ?? "";
    form.elements.difficulty.value = recipe.difficulty ?? "Easy";
    form.elements.prepTimeMinutes.value = recipe.prepTimeMinutes ?? 0;
    form.elements.cookTimeMinutes.value = recipe.cookTimeMinutes ?? 0;
    form.elements.servings.value = recipe.servings ?? 1;

    ingredientsList.replaceChildren();
    instructionsList.replaceChildren();

    (recipe.ingredients ?? []).forEach(addIngredientRow);
    (recipe.instructions ?? []).forEach(addInstructionRow);

    if (ingredientsList.children.length === 0) {
        addIngredientRow();
    }

    if (instructionsList.children.length === 0) {
        addInstructionRow();
    }
}

async function loadRecipe() {
    const token = sessionStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    if (!recipeId || !/^\d+$/.test(recipeId)) {
        loadingMessage.textContent = "Invalid recipe ID.";
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/recipes/${encodeURIComponent(recipeId)}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok || data.success !== true || !data.recipe) {
            throw new Error(data.message || "Unable to load recipe.");
        }

        originalRecipe = data.recipe;
        populateForm(originalRecipe);

        loadingMessage.classList.add("d-none");
        form.classList.remove("d-none");
    } catch (error) {
        console.error("Load recipe error:", error);
        loadingMessage.textContent = error.message;
    }
}

document.getElementById("addIngredient").addEventListener("click", () => {
    addIngredientRow();
});

document.getElementById("addInstruction").addEventListener("click", () => {
    addInstructionRow();
});

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideMessage();

    if (!originalRecipe) {
        showMessage("The recipe has not loaded yet.");
        return;
    }

    const token = sessionStorage.getItem("token");

    const ingredients = [
        ...ingredientsList.querySelectorAll(".ingredient-row")
    ].map(row => ({
        name: row.querySelector('[name="ingredientName"]').value.trim(),
        quantity: Number(
            row.querySelector('[name="ingredientQuantity"]').value
        ),
        unit: row.querySelector('[name="ingredientUnit"]').value.trim()
    }));

    const instructions = [
        ...instructionsList.querySelectorAll(".instruction-row")
    ].map((row, index) => ({
        stepNumber: index + 1,
        instruction: row.querySelector('[name="instruction"]').value.trim()
    }));

    if (!ingredients.length || !instructions.length) {
        showMessage("Add at least one ingredient and one instruction.");
        return;
    }

    if (ingredients.some(item => !item.name || !item.unit) ||
        instructions.some(item => !item.instruction)) {
        showMessage("Please complete all ingredient and instruction fields.");
        return;
    }

    const recipeData = {
        title: form.elements.title.value.trim(),
        description: form.elements.description.value.trim(),
        imageURL: form.elements.imageURL.value.trim() || null,
        category: form.elements.category.value.trim(),
        difficulty: form.elements.difficulty.value,
        prepTimeMinutes: Number(form.elements.prepTimeMinutes.value),
        cookTimeMinutes: Number(form.elements.cookTimeMinutes.value),
        servings: Number(form.elements.servings.value),
        ingredients,
        instructions
    };

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(
            `${API_BASE}/recipes/${encodeURIComponent(recipeId)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(recipeData)
            }
        );

        const data = await response.json();

        if (!response.ok || data.success !== true) {
            throw new Error(data.message || "Unable to update recipe.");
        }

        showMessage("Recipe updated successfully!", "success");

        setTimeout(() => {
            window.location.href =
                `recipe-details.html?id=${encodeURIComponent(recipeId)}`;
        }, 800);
    } catch (error) {
        console.error("Update recipe error:", error);
        showMessage(error.message);
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Changes";
    }
});

loadRecipe();
