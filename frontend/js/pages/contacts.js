import { api } from '../api.js';

export function render(container) {
    container.innerHTML = `
        <h2>Contacts</h2>
        <button id="new-contact-btn">New Contact</button>
        <div id="contact-form-container"></div>
        <table id="contacts-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    `;

    const newContactBtn = document.getElementById('new-contact-btn');
    newContactBtn.addEventListener('click', () => renderContactForm(document.getElementById('contact-form-container')));

    loadContacts();
}

async function loadContacts() {
    try {
        const contacts = await api.get('/masters/contacts');
        const tableBody = document.querySelector('#contacts-table tbody');
        tableBody.innerHTML = contacts.map(contact => `
            <tr>
                <td>${contact.name}</td>
                <td>${contact.email || ''}</td>
                <td>${contact.phone || ''}</td>
                <td>
                    <button class="edit-btn" data-id="${contact.id}">Edit</button>
                </td>
            </tr>
        `).join('');

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.dataset.id;
                const contact = contacts.find(c => c.id == id);
                renderContactForm(document.getElementById('contact-form-container'), contact);
            });
        });
    } catch (error) {
        console.error('Failed to load contacts:', error);
        alert('Could not load contacts.');
    }
}

function renderContactForm(container, contact = {}) {
    container.innerHTML = `
        <form id="contact-form">
            <h3>${contact.id ? 'Edit' : 'New'} Contact</h3>
            <input type="hidden" name="id" value="${contact.id || ''}">
            <label for="name">Name</label>
            <input type="text" name="name" value="${contact.name || ''}" required>
            <label for="email">Email</label>
            <input type="email" name="email" value="${contact.email || ''}">
            <label for="phone">Phone</label>
            <input type="text" name="phone" value="${contact.phone || ''}">
            <button type="submit">Save</button>
            <button type="button" id="cancel-btn">Cancel</button>
        </form>
    `;

    const form = document.getElementById('contact-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            if (data.id) {
                await api.put(`/masters/contacts/${data.id}`, data);
            } else {
                await api.post('/masters/contacts', data);
            }
            container.innerHTML = '';
            loadContacts();
        } catch (error) {
            console.error('Failed to save contact:', error);
            alert(`Error: ${error.message}`);
        }
    });

    document.getElementById('cancel-btn').addEventListener('click', () => {
        container.innerHTML = '';
    });
}