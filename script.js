const supabaseUrl = 'https://ppatcnnpfqutcyvwxycj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXRjbm5wZnF1dGN5dnd4eWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxOTM4MzUsImV4cCI6MjA5NDc2OTgzNX0.w6Ajd1qhiZ8qy8ElQCl6bnIPWul0qt8-LI32jOvN0go';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('add-form');
    const input = document.getElementById('item-input');
    const list = document.getElementById('shopping-list');
    const totalCount = document.getElementById('total-count');
    const clearCompletedBtn = document.getElementById('clear-completed');

    let items = [];

    // Fetch initial list
    async function fetchItems() {
        const { data, error } = await supabase
            .from('shopping_items')
            .select('*')
            .order('created_at', { ascending: true });
            
        if (!error && data) {
            items = data;
            renderList();
        } else {
            console.error('Error fetching items:', error);
        }
    }

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

    async function addItem(text) {
        const id = Date.now().toString();
        const newItem = {
            id: id,
            text,
            completed: false
        };
        
        // Optimistic UI update
        items.push(newItem);
        const li = createListItem(newItem);
        list.appendChild(li);
        updateStats();
        lucide.createIcons();
        
        // Save to DB
        const { error } = await supabase
            .from('shopping_items')
            .insert([newItem]);
            
        if (error) {
            console.error('Error inserting item:', error);
            // Revert on error
            items = items.filter(i => i.id !== id);
            li.remove();
            updateStats();
        }
    }

    async function toggleItemStatus(id, element) {
        const item = items.find(i => i.id === id);
        if (item) {
            const newStatus = !item.completed;
            item.completed = newStatus;
            
            if (newStatus) {
                element.classList.add('completed');
            } else {
                element.classList.remove('completed');
            }
            
            const { error } = await supabase
                .from('shopping_items')
                .update({ completed: newStatus })
                .eq('id', id);
                
            if (error) {
                console.error('Error updating status:', error);
                // Revert
                item.completed = !newStatus;
                if (!newStatus) element.classList.add('completed');
                else element.classList.remove('completed');
            }
        }
    }

    async function deleteItem(id, element) {
        element.classList.add('item-leave');
        
        // Wait for animation
        setTimeout(async () => {
            const itemElement = element;
            itemElement.remove();
            items = items.filter(i => i.id !== id);
            updateStats();
            
            const { error } = await supabase
                .from('shopping_items')
                .delete()
                .eq('id', id);
                
            if (error) {
                console.error('Error deleting item:', error);
                // Can't easily revert DOM here, but in a real app we'd handle it better
            }
        }, 300);
    }

    function updateStats() {
        totalCount.textContent = items.length;
    }

    async function clearCompleted() {
        const completedItems = items.filter(i => i.completed);
        if(completedItems.length === 0) return;

        const idsToDelete = completedItems.map(i => i.id);
        
        // Optimistic UI
        items = items.filter(i => !i.completed);
        
        const elements = list.querySelectorAll('.list-item.completed');
        elements.forEach(el => {
            el.classList.add('item-leave');
        });

        setTimeout(() => {
            renderList();
        }, 300);
        
        // Delete from DB
        const { error } = await supabase
            .from('shopping_items')
            .delete()
            .in('id', idsToDelete);
            
        if (error) {
            console.error('Error clearing completed:', error);
            // Re-fetch to sync
            fetchItems();
        }
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

    // Initial load
    fetchItems();
});