document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-form');
    const input = document.getElementById('item-input');
    const list = document.getElementById('shopping-list');
    const totalCount = document.getElementById('total-count');
    const clearCompletedBtn = document.getElementById('clear-completed');

    let items = JSON.parse(localStorage.getItem('shopping-items')) || [];

    // Initialize list
    function renderList() {
        list.innerHTML = '';
        items.forEach(item => {
            const li = createListItem(item);
            list.appendChild(li);
        });
        updateStats();
        // re-initialize lucide icons for newly added elements
        lucide.createIcons();
    }

    function saveToLocalStorage() {
        localStorage.setItem('shopping-items', JSON.stringify(items));
    }

    function createListItem(item) {
        const li = document.createElement('li');
        li.className = `list-item ${item.completed ? 'completed' : ''}`;
        li.dataset.id = item.id;

        li.innerHTML = `
            <label class="checkbox-wrapper">
                <input type="checkbox" class="status-toggle" ${item.completed ? 'checked' : ''}>
                <div class="checkmark">
                    <i data-lucide="check" width="16" height="16"></i>
                </div>
            </label>
            <span class="item-text">${item.text}</span>
            <button class="delete-btn" aria-label="Delete item">
                <i data-lucide="trash-2" width="18" height="18"></i>
            </button>
        `;

        // Event listeners for this item
        const toggle = li.querySelector('.status-toggle');
        toggle.addEventListener('change', () => toggleItemStatus(item.id, li));

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => deleteItem(item.id, li));

        return li;
    }

    function addItem(text) {
        const newItem = {
            id: Date.now().toString(),
            text,
            completed: false
        };
        items.push(newItem);
        saveToLocalStorage();
        
        const li = createListItem(newItem);
        list.appendChild(li);
        updateStats();
        
        // Render new icons
        lucide.createIcons();
    }

    function toggleItemStatus(id, element) {
        const item = items.find(i => i.id === id);
        if (item) {
            item.completed = !item.completed;
            saveToLocalStorage();
            if (item.completed) {
                element.classList.add('completed');
            } else {
                element.classList.remove('completed');
            }
        }
    }

    function deleteItem(id, element) {
        element.classList.add('item-leave');
        
        // Wait for animation
        setTimeout(() => {
            items = items.filter(i => i.id !== id);
            saveToLocalStorage();
            element.remove();
            updateStats();
        }, 300);
    }

    function updateStats() {
        totalCount.textContent = items.length;
    }

    function clearCompleted() {
        const completedItems = items.filter(i => i.completed);
        if(completedItems.length === 0) return;

        items = items.filter(i => !i.completed);
        saveToLocalStorage();
        
        // Add leave animation to completed elements
        const elements = list.querySelectorAll('.list-item.completed');
        elements.forEach(el => {
            el.classList.add('item-leave');
        });

        setTimeout(() => {
            renderList();
        }, 300);
    }

    // Event Listeners
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (text) {
            addItem(text);
            input.value = '';
        }
    });

    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Initial render
    renderList();
});