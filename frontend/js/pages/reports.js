import { api } from '../api.js';

export function render(container) {
    container.innerHTML = `
        <h2>Reports</h2>
        <div>
            <button id="pnl-report-btn">Profit & Loss</button>
            <button id="bs-report-btn">Balance Sheet</button>
        </div>
        <div id="report-content"></div>
    `;

    document.getElementById('pnl-report-btn').addEventListener('click', renderPnLReport);
    document.getElementById('bs-report-btn').addEventListener('click', renderBalanceSheetReport);
}

async function renderPnLReport() {
    const content = document.getElementById('report-content');
    try {
        const data = await api.get('/reports/pnl');
        content.innerHTML = `
            <h3>Profit & Loss</h3>
            <table>
                <thead>
                    <tr><th>Account</th><th>Amount</th></tr>
                </thead>
                <tbody>
                    <tr><td>Total Income</td><td>${data.income.total}</td></tr>
                    <tr><td>Total Expense</td><td>${data.expense.total}</td></tr>
                    <tr><td><strong>Net Profit</strong></td><td><strong>${data.net_profit}</strong></td></tr>
                </tbody>
            </table>
        `;
    } catch (error) {
        content.innerHTML = `<p>Could not load P&L report: ${error.message}</p>`;
    }
}

async function renderBalanceSheetReport() {
    const content = document.getElementById('report-content');
    try {
        const data = await api.get('/reports/balance-sheet');
        content.innerHTML = `
            <h3>Balance Sheet</h3>
            <table>
                <thead>
                    <tr><th>Category</th><th>Account</th><th>Amount</th></tr>
                </thead>
                <tbody>
                    ${renderBSSection(data.assets, 'Assets')}
                    <tr><td><strong>Total Assets</strong></td><td></td><td><strong>${data.total_assets}</strong></td></tr>
                    ${renderBSSection(data.liabilities, 'Liabilities')}
                     <tr><td><strong>Total Liabilities</strong></td><td></td><td><strong>${data.total_liabilities}</strong></td></tr>
                </tbody>
            </table>
        `;
    } catch (error) {
        content.innerHTML = `<p>Could not load Balance Sheet report: ${error.message}</p>`;
    }
}

function renderBSSection(sectionData, sectionName) {
    let html = `<tr><td rowspan="”${Object.keys(sectionData).length + 1}”><strong>${sectionName}</strong></td><td></td><td></td></tr>`;
    for (const account in sectionData) {
        html += `<tr><td>${account}</td><td>${sectionData[account]}</td></tr>`;
    }
    return html;
}
