// Dashboard module for Cloud Accounting app

class DashboardService {
    constructor() {
        this.currentPeriod = '30d';
        this.initializeEventListeners();
        this.loadDashboardData();
    }

    initializeEventListeners() {
        // Time filter buttons
        const timeFilterBtns = document.querySelectorAll('.time-filter-btn');
        timeFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleTimeFilterChange(e.target.dataset.period);
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                Utils.clearCurrentUser();
                window.location.href = 'index.html';
            });
        }
    }

    async loadDashboardData() {
        try {
            const data = await API.getDashboardData(this.currentPeriod);
            this.updateStatsCards(data);
            this.updateRecentActivity(data.recentActivity);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            Utils.showSuccess('Error loading dashboard data', 5000);
        }
    }

    updateStatsCards(data) {
        // Update invoices
        const invoicesTotal = document.getElementById('invoicesTotal');
        const invoicesChange = document.getElementById('invoicesChange');
        if (invoicesTotal) {
            invoicesTotal.textContent = Utils.formatCurrency(data.invoices.total);
        }
        if (invoicesChange) {
            invoicesChange.textContent = `${data.invoices.count} invoices this period`;
        }

        // Update purchases
        const purchasesTotal = document.getElementById('purchasesTotal');
        const purchasesChange = document.getElementById('purchasesChange');
        if (purchasesTotal) {
            purchasesTotal.textContent = Utils.formatCurrency(data.purchases.total);
        }
        if (purchasesChange) {
            purchasesChange.textContent = `${data.purchases.count} purchases this period`;
        }

        // Update payments
        const paymentsTotal = document.getElementById('paymentsTotal');
        const paymentsChange = document.getElementById('paymentsChange');
        if (paymentsTotal) {
            paymentsTotal.textContent = Utils.formatCurrency(data.payments.total);
        }
        if (paymentsChange) {
            paymentsChange.textContent = `${data.payments.count} payments this period`;
        }
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div class="flex items-center space-x-3">
                    <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                        <p class="text-sm text-gray-900">${activity.description}</p>
                        <p class="text-xs text-gray-500">${Utils.formatDateTime(activity.timestamp)}</p>
                    </div>
                </div>
                ${activity.amount > 0 ? `
                    <span class="text-sm font-medium text-gray-900">
                        ${Utils.formatCurrency(activity.amount)}
                    </span>
                ` : ''}
            </div>
        `).join('');
    }

    async handleTimeFilterChange(period) {
        // Update active button
        document.querySelectorAll('.time-filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');

        // Update current period and reload data
        this.currentPeriod = period;
        await this.loadDashboardData();
    }
}

// Initialize dashboard service when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (Utils.requireAuth()) {
        new DashboardService();
    }
});
