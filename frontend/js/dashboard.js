// GOLDBOND LABORATORIES Dashboard JavaScript
// Updated to match current backend routes and user dashboard HTML

class GoldbondDashboard {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
        this.authToken = localStorage.getItem('authToken') || null;
        this.currentUser = null;
        this.currentSection = 'profile';

        // Optional pricing map (only used if you later add a price display)
        this.testPrices = {
            'blood-count': 5000,
            'lipid': 6000,
            'glucose': 4000,
            'liver': 8000,
            'kidney': 7500,
            'thyroid': 9000,
            'urine': 3000,
            'hiv': 5000
        };

        this.init();
    }

    // ========== INIT ==========

    init() {
        if (!this.authToken) {
            this.redirectToLogin();
            return;
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeDashboard());
        } else {
            this.initializeDashboard();
        }
    }

    async initializeDashboard() {
        try {
            await this.loadUserProfile();
            this.setupEventListeners();
            this.showSection('profile');
            console.log('✅ Dashboard initialized');
        } catch (err) {
            console.error('Dashboard init error:', err);
            this.showMessage('Error', 'Failed to load your dashboard. Please refresh the page.', 'error');
        }
    }

    redirectToLogin() {
        console.log('🔒 No token found, redirecting to login...');
        window.location.href = 'login.html';
    }

    // ========== GENERIC API HELPER ==========

    async makeRequest(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            }
        };

        const finalOptions = { ...defaultOptions, ...options };
        if (finalOptions.body && typeof finalOptions.body === 'object') {
            finalOptions.body = JSON.stringify(finalOptions.body);
        }

        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, finalOptions);

            if (res.status === 401) {
                // Token invalid or expired
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                this.redirectToLogin();
                return null;
            }

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Request failed with status ${res.status}`);
            }

            return data;
        } catch (err) {
            console.error('API error:', err);
            this.showMessage('Error', err.message, 'error');
            return null;
        }
    }

    // ========== EVENT LISTENERS ==========

    setupEventListeners() {
        this.setupSidebarNavigation();
        this.setupProfileManagement();
        this.setupTestBooking();
        this.setupPasswordManagement();
        this.setupLogout();
        this.setupModals();
        this.setupPasswordToggles();
        this.setupMobileSidebar();
        this.setupMarkAllNotificationsRead();
        this.setupFormValidations();
    }

    setupSidebarNavigation() {
        const items = document.querySelectorAll('.sidebar-item[data-section]');
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.getAttribute('data-section');
                this.showSection(section);

                items.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    setupMobileSidebar() {
        const toggleBtn = document.getElementById('mobileSidebarToggle');
        const sidebar = document.getElementById('dashboardSidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (!sidebar) return;

        toggleBtn?.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay?.classList.toggle('active');
        });

        sidebarOverlay?.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    setupLogout() {
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn?.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleLogout();
        });
    }

    handleLogout() {
        if (!confirm('Are you sure you want to logout?')) return;

        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');

        if (window.GOLDBOND?.showNotification) {
            window.GOLDBOND.showNotification('Logged out successfully', 'success');
        }

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    setupPasswordToggles() {
        const toggles = document.querySelectorAll('.password-toggle');
        toggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const targetId = toggle.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = toggle.querySelector('i');

                if (!input) return;

                if (input.type === 'password') {
                    input.type = 'text';
                    if (icon) icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    if (icon) icon.className = 'fas fa-eye';
                }
            });
        });
    }

    setupFormValidations() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });
            });
        });
    }

    validateField(field) {
        const isValid = field.checkValidity();
        field.classList.toggle('invalid', !isValid);
        return isValid;
    }

    // ========== SECTION HANDLING ==========

    showSection(sectionName) {
        const sections = document.querySelectorAll('.dashboard-section');
        sections.forEach(s => s.classList.remove('active'));

        const target = document.getElementById(`${sectionName}-section`);
        if (target) {
            target.classList.add('active');
            this.currentSection = sectionName;
        }

        this.updateSectionHeader(sectionName);
        this.loadSectionData(sectionName);
    }

    updateSectionHeader(sectionName) {
        const map = {
            'profile': {
                title: 'Profile Information',
                subtitle: 'Manage your personal information and account settings'
            },
            'test-results': {
                title: 'Your Test Results',
                subtitle: 'View and download your laboratory test results'
            },
            'bookings': {
                title: 'My Appointments',
                subtitle: 'View and manage your test bookings'
            },
            'book-test': {
                title: 'Book New Test',
                subtitle: 'Schedule a new laboratory test with GOLDBOND Labs'
            },
            'payments': {
                title: 'Payment History',
                subtitle: 'View your past payments and receipts'
            },
            'notifications': {
                title: 'Notifications',
                subtitle: 'Updates about your tests, results, and appointments'
            },
            'change-password': {
                title: 'Change Password',
                subtitle: 'Update your account security settings'
            }
        };

        const header = map[sectionName];
        if (!header) return;

        const titleEl = document.getElementById('sectionTitle');
        const subtitleEl = document.getElementById('sectionSubtitle');

        if (titleEl) titleEl.textContent = header.title;
        if (subtitleEl) subtitleEl.textContent = header.subtitle;
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'test-results':
                this.loadTestResults();
                break;
            case 'bookings':
                this.loadBookings();
                break;
            case 'payments':
                this.loadPaymentHistory();
                break;
            case 'notifications':
                this.loadNotifications();
                break;
        }
    }

    // ========== PROFILE ==========

    async loadUserProfile() {
        try {
            const stored = localStorage.getItem('currentUser');

            if (stored) {
                this.currentUser = JSON.parse(stored);
            }

            // Try backend profile to get fresher data if token is valid
            const profileRes = await this.makeRequest('/auth/profile', {
                method: 'GET'
            });

            if (profileRes?.success && profileRes.user) {
                // Merge local + backend
                this.currentUser = {
                    ...this.currentUser,
                    ...profileRes.user
                };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }

            if (!this.currentUser) {
                this.redirectToLogin();
                return;
            }

            this.displayUserProfile(this.currentUser);
            this.updateSidebarUser(this.currentUser);

        } catch (err) {
            console.error('Profile load error:', err);
            this.showMessage('Error', 'Unable to load your profile.', 'error');
        }
    }

    getDisplayName(user) {
        if (!user) return 'User';
        if (user.fullName) return user.fullName;
        if (user.firstName || user.lastName) {
            return [user.firstName, user.lastName].filter(Boolean).join(' ');
        }
        return 'User';
    }

    displayUserProfile(user) {
        const displayName = this.getDisplayName(user);

        const map = {
            displayName: displayName,
            displayEmail: user.email || 'Not provided',
            displayPhone: user.phone || 'Not provided',
            displayDob: user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided',
            displayGender: user.gender || 'Not provided',
            displayBloodGroup: user.bloodGroup || 'Not provided',
            displayAddress: user.address || 'Not provided'
        };

        Object.entries(map).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    }

    updateSidebarUser(user) {
        const welcomeEl = document.getElementById('userWelcome');
        const emailEl = document.getElementById('userEmail');

        const name = this.getDisplayName(user);
        const firstName = name.split(' ')[0];

        if (welcomeEl) welcomeEl.textContent = `Welcome, ${firstName}`;
        if (emailEl && user.email) emailEl.textContent = user.email;
    }

    setupProfileManagement() {
        const editBtn = document.getElementById('editProfileBtn');
        const cancelBtn = document.getElementById('cancelEditBtn');
        const form = document.getElementById('updateProfileForm');

        editBtn?.addEventListener('click', () => this.toggleProfileEdit(true));
        cancelBtn?.addEventListener('click', () => this.toggleProfileEdit(false));
        form?.addEventListener('submit', (e) => this.handleProfileUpdate(e));
    }

    toggleProfileEdit(isEditing) {
        const view = document.getElementById('profileView');
        const edit = document.getElementById('profileEdit');
        const editBtn = document.getElementById('editProfileBtn');

        if (!view || !edit || !editBtn) return;

        if (isEditing) {
            view.style.display = 'none';
            edit.style.display = 'block';
            editBtn.style.display = 'none';
            this.populateEditForm();
        } else {
            view.style.display = 'block';
            edit.style.display = 'none';
            editBtn.style.display = 'inline-flex';
        }
    }

    populateEditForm() {
        if (!this.currentUser) return;

        const name = this.getDisplayName(this.currentUser);

        const fields = {
            editName: name,
            editPhone: this.currentUser.phone || '',
            editDob: this.currentUser.dateOfBirth ? this.currentUser.dateOfBirth.split('T')[0] : '',
            editGender: this.currentUser.gender || '',
            editBloodGroup: this.currentUser.bloodGroup || '',
            editAddress: this.currentUser.address || ''
        };

        Object.entries(fields).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el !== null && el !== undefined) {
                el.value = value;
            }
        });
    }

    async handleProfileUpdate(e) {
        e.preventDefault();

        const nameVal = document.getElementById('editName')?.value.trim() || '';
        const phoneVal = document.getElementById('editPhone')?.value.trim() || '';

        if (!nameVal || !phoneVal) {
            this.showMessage('Error', 'Full name and phone are required', 'error');
            return;
        }

        // Split full name into first & last (backend expects firstName, lastName, phone)
        const parts = nameVal.split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ');

        try {
            const res = await this.makeRequest('/auth/profile', {
                method: 'PUT',
                body: {
                    firstName,
                    lastName,
                    phone: phoneVal
                }
            });

            if (res?.success && res.user) {
                this.currentUser = {
                    ...this.currentUser,
                    ...res.user,
                    fullName: nameVal // keep a local full name for display
                };
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                this.displayUserProfile(this.currentUser);
                this.updateSidebarUser(this.currentUser);
                this.toggleProfileEdit(false);
                this.showMessage('Success', 'Profile updated successfully', 'success');
            }
        } catch (err) {
            console.error('Profile update error:', err);
        }
    }

    // ========== TEST RESULTS ==========

    async loadTestResults() {
        const container = document.getElementById('testResultsList');
        if (!container) return;

        if (!this.currentUser?.id && !this.currentUser?._id) {
            container.innerHTML = this.getErrorStateHTML('User ID not found. Please log in again.');
            return;
        }

        const patientId = this.currentUser.id || this.currentUser._id;

        container.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i> Loading your test results...
            </div>
        `;

        try {
            const data = await this.makeRequest(`/results/patient/${patientId}`, {
                method: 'GET'
            });

            if (data?.success && data.results && data.results.length > 0) {
                this.displayTestResults(data.results);
            } else {
                container.innerHTML = this.getEmptyStateHTML(
                    'test results',
                    'file-medical-alt',
                    'No test results found yet. Your results will appear here once available.'
                );
            }
        } catch (err) {
            console.error('Load results error:', err);
            container.innerHTML = this.getErrorStateHTML('Failed to load test results.');
        }
    }

    displayTestResults(results) {
        const container = document.getElementById('testResultsList');
        if (!container) return;
    
        const html = results.map(result => {
            const statusClass = (result.status || 'completed').toLowerCase();
            const statusLabel = this.capitalizeFirst(result.status || 'completed');
    
            const sampleDate = result.sampleCollectionDate
                ? new Date(result.sampleCollectionDate).toLocaleDateString()
                : 'Not available';
    
            const reportDate = result.reportDate
                ? new Date(result.reportDate).toLocaleDateString()
                : 'Not available';
    
            const category = result.testCategory || 'General';
    
            // FIX PDF PATH HERE
            let pdfUrl = '';
            if (result.reportPdfUrl) {
                // Extract filename only
                const fileName = result.reportPdfUrl.split('/').pop();
                // Serve from Express static /uploads
                pdfUrl = `/uploads/${fileName}`;
            }
    
            return `
                <div class="list-item">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${result.testName || 'Laboratory Test'}</div>
                            <div class="list-item-subtitle">
                                ${category} • Reg No: ${result.registrationNumber || 'N/A'}
                            </div>
                        </div>
                        <span class="status-badge ${statusClass}">${statusLabel}</span>
                    </div>
    
                    <div>
                        <p class="list-item-subtitle">
                            <strong>Sample Date:</strong> ${sampleDate} &nbsp; | &nbsp;
                            <strong>Report Date:</strong> ${reportDate}
                        </p>
                        ${result.overallSummary ? `<p style="margin-top: 0.5rem;">${result.overallSummary}</p>` : ''}
                    </div>
    
                    <div class="list-item-actions">
                        ${pdfUrl ? `
                            <a href="${pdfUrl}" target="_blank" class="action-btn primary">
                                <i class="fas fa-download"></i> Download Report (PDF)
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    
        container.innerHTML = html;
    }
    
    // ========== BOOKINGS ==========

    async loadBookings() {
        const container = document.getElementById('bookingsList');
        if (!container) return;

        if (!this.currentUser?.email) {
            container.innerHTML = this.getErrorStateHTML('Email not found. Please log in again.');
            return;
        }

        container.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i> Loading your bookings...
            </div>
        `;

        try {
            const data = await this.makeRequest(`/booking/user/${encodeURIComponent(this.currentUser.email)}`, {
                method: 'GET'
            });

            if (data?.success && data.bookings && data.bookings.length > 0) {
                this.displayBookings(data.bookings);
            } else {
                container.innerHTML = this.getEmptyStateHTML(
                    'appointments',
                    'calendar-alt',
                    'You do not have any booked tests yet.'
                );
            }
        } catch (err) {
            console.error('Load bookings error:', err);
            container.innerHTML = this.getErrorStateHTML('Failed to load your bookings.');
        }
    }

    displayBookings(bookings) {
        const container = document.getElementById('bookingsList');
        if (!container) return;

        const html = bookings.map(booking => {
            const status = booking.status || 'pending';
            const statusClass = status.toLowerCase();
            const statusLabel = this.capitalizeFirst(status);

            const date = booking.appointmentDate
                ? new Date(booking.appointmentDate).toLocaleDateString()
                : 'Not set';

            const time = booking.appointmentTime || 'Not set';
            const location = booking.location || 'Lab';

            const isFuture =
                booking.appointmentDate &&
                new Date(booking.appointmentDate).setHours(23, 59, 59, 999) > Date.now();

            return `
                <div class="list-item">
                    <div class="list-item-header">
                        <div>
                            <div class="list-item-title">${booking.testType || 'Lab Test'}</div>
                            <div class="list-item-subtitle">
                                Booking ID: ${booking.bookingId || 'N/A'}
                            </div>
                        </div>
                        <span class="status-badge ${statusClass}">${statusLabel}</span>
                    </div>
                    <p class="list-item-subtitle">
                        <strong>Date:</strong> ${date} &nbsp; | &nbsp;
                        <strong>Time:</strong> ${time} &nbsp; | &nbsp;
                        <strong>Location:</strong> ${location}
                    </p>
                    ${booking.specialInstructions ? `
                        <p style="margin-top: 0.5rem;">
                            <strong>Notes:</strong> ${booking.specialInstructions}
                        </p>
                    ` : ''}
                    <div class="list-item-actions">
                        ${status !== 'cancelled' && isFuture ? `
                            <button class="action-btn danger" onclick="dashboard.cancelBooking('${booking.bookingId}')">
                                <i class="fas fa-times"></i> Cancel Booking
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    async cancelBooking(bookingId) {
        if (!bookingId) return;
        if (!confirm('Are you sure you want to cancel this booking?')) return;

        try {
            const res = await this.makeRequest(`/booking/${bookingId}`, {
                method: 'DELETE'
            });

            if (res?.success) {
                this.showMessage('Success', 'Booking cancelled successfully.', 'success');
                this.loadBookings();
            }
        } catch (err) {
            console.error('Cancel booking error:', err);
        }
    }

    // ========== BOOK NEW TEST ==========

    setupTestBooking() {
        const form = document.getElementById('bookingForm');
        if (!form) return;

        const dateInput = document.getElementById('bookingDate');

        // Set minimum date to today or tomorrow as you prefer
        if (dateInput) {
            const today = new Date();
            dateInput.min = today.toISOString().split('T')[0];
        }

        form.addEventListener('submit', (e) => this.handleTestBooking(e));
    }

    async handleTestBooking(e) {
        e.preventDefault();

        if (!this.currentUser) {
            this.showMessage('Error', 'User information not found. Please log in again.', 'error');
            return;
        }

        const testTypeEl = document.getElementById('bookingTestType');
        const dateEl = document.getElementById('bookingDate');
        const timeEl = document.getElementById('bookingTime');
        const collectionEl = document.getElementById('collectionType');
        const notesEl = document.getElementById('bookingNotes');

        const testType = testTypeEl?.value || '';
        const appointmentDate = dateEl?.value || '';
        const appointmentTime = timeEl?.value || '';
        const collectionType = collectionEl?.value || '';
        const specialInstructions = notesEl?.value.trim() || '';

        if (!testType || !appointmentDate || !appointmentTime || !collectionType) {
            this.showMessage('Error', 'Please fill in all required fields.', 'error');
            return;
        }

        const fullName = this.getDisplayName(this.currentUser);

        const bookingData = {
            fullName,
            email: this.currentUser.email,
            phone: this.currentUser.phone,
            testType,
            appointmentDate,
            appointmentTime,
            location: collectionType, // "lab" or "home"
            specialInstructions
        };

        try {
            const res = await this.makeRequest('/booking', {
                method: 'POST',
                body: bookingData
            });

            if (res?.success) {
                const bookingId = res.bookingId || 'N/A';
                this.showMessage(
                    'Success',
                    `Your test has been booked successfully. Booking ID: ${bookingId}`,
                    'success'
                );

                e.target.reset();
                this.loadBookings();
                this.showSection('bookings');
            }
        } catch (err) {
            console.error('Booking error:', err);
        }
    }

    // ========== PAYMENTS (PLACEHOLDER) ==========

    async loadPaymentHistory() {
        const container = document.getElementById('paymentsList');
        if (!container) return;

        container.innerHTML = this.getEmptyStateHTML(
            'payments',
            'credit-card',
            'Payment history will be available soon. Please pay at the lab for now.'
        );
    }

    // ========== NOTIFICATIONS ==========

    async loadNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        // For now, using static sample notifications
        const notifications = [
            {
                id: 1,
                title: 'Test Result Ready',
                message: 'One of your laboratory test results is now available for download.',
                date: new Date(),
                read: false
            },
            {
                id: 2,
                title: 'Appointment Reminder',
                message: 'You have a booked test tomorrow. Please arrive 15 minutes early.',
                date: new Date(Date.now() - 86400000),
                read: true
            }
        ];

        this.displayNotifications(notifications);
        this.updateNotificationBadge(notifications.filter(n => !n.read).length);
    }

    displayNotifications(notifications) {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        if (!notifications.length) {
            container.innerHTML = this.getEmptyStateHTML(
                'notifications',
                'bell',
                'No notifications at the moment.'
            );
            return;
        }

        const html = notifications.map(n => `
            <div class="list-item ${n.read ? 'read' : 'unread'}">
                <div class="list-item-header">
                    <div>
                        <div class="list-item-title">${n.title}</div>
                        <div class="list-item-subtitle">${new Date(n.date).toLocaleString()}</div>
                    </div>
                    <span class="status-badge ${n.read ? 'completed' : 'pending'}">
                        ${n.read ? 'Read' : 'New'}
                    </span>
                </div>
                <p>${n.message}</p>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        if (count > 0) {
            badge.style.display = 'inline-block';
            badge.textContent = count;
        } else {
            badge.style.display = 'none';
        }
    }

    setupMarkAllNotificationsRead() {
        const btn = document.getElementById('markAllReadBtn');
        btn?.addEventListener('click', () => {
            // Just hide badge and visually mark as read for now
            this.updateNotificationBadge(0);
            const items = document.querySelectorAll('#notificationsList .list-item');
            items.forEach(item => item.classList.add('read'));
            this.showMessage('Success', 'All notifications marked as read.', 'success');
        });
    }

    // ========== PASSWORD CHANGE ==========

    setupPasswordManagement() {
        const form = document.getElementById('changePasswordForm');
        form?.addEventListener('submit', (e) => this.handlePasswordChange(e));
    }

    async handlePasswordChange(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword')?.value || '';
        const newPassword = document.getElementById('newPassword')?.value || '';
        const confirmPassword = document.getElementById('confirmPassword')?.value || '';

        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showMessage('Error', 'Please fill all password fields.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showMessage('Error', 'New passwords do not match.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showMessage('Error', 'Password must be at least 6 characters.', 'error');
            return;
        }

        try {
            const res = await this.makeRequest('/auth/change-password', {
                method: 'PUT',
                body: { currentPassword, newPassword }
            });

            if (res?.success) {
                this.showMessage('Success', 'Password changed successfully.', 'success');
                e.target.reset();
            }
        } catch (err) {
            console.error('Change password error:', err);
        }
    }

    // ========== MODALS & MESSAGES ==========

    setupModals() {
        const messageModal = document.getElementById('messageModal');
        const closeModal = document.getElementById('closeModal');
        const okBtn = document.getElementById('modalOkBtn');

        [closeModal, okBtn].forEach(btn => {
            btn?.addEventListener('click', () => {
                if (messageModal) messageModal.style.display = 'none';
            });
        });

        const paymentModal = document.getElementById('paymentModal');
        const closePaymentModal = document.getElementById('closePaymentModal');
        const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');

        [closePaymentModal, cancelPaymentBtn].forEach(btn => {
            btn?.addEventListener('click', () => {
                if (paymentModal) paymentModal.style.display = 'none';
            });
        });

        paymentModal?.addEventListener('click', (e) => {
            if (e.target === paymentModal) paymentModal.style.display = 'none';
        });

        messageModal?.addEventListener('click', (e) => {
            if (e.target === messageModal) messageModal.style.display = 'none';
        });
    }

    showMessage(title, message, type = 'info') {
        const modal = document.getElementById('messageModal');
        const titleEl = document.getElementById('messageTitle');
        const textEl = document.getElementById('messageText');
        const iconEl = document.getElementById('messageIcon');

        if (!modal || !titleEl || !textEl || !iconEl) {
            alert(`${title}: ${message}`);
            return;
        }

        titleEl.textContent = title;
        textEl.textContent = message;

        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        iconEl.className = `message-icon ${type}`;
        const iconInner = document.createElement('i');
        iconInner.className = iconMap[type] || iconMap.info;
        iconEl.innerHTML = '';
        iconEl.appendChild(iconInner);

        modal.style.display = 'flex';
    }

    // ========== UTILS ==========

    getEmptyStateHTML(typeLabel, icon, message) {
        return `
            <div class="empty-state">
                <i class="fas fa-${icon}"></i>
                <h3>No ${typeLabel}</h3>
                <p>${message}</p>
            </div>
        `;
    }

    getErrorStateHTML(message) {
        return `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    capitalizeFirst(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Initialize globally
let dashboard;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        dashboard = new GoldbondDashboard();
        window.dashboard = dashboard;
    });
} else {
    dashboard = new GoldbondDashboard();
    window.dashboard = dashboard;
}

console.log('🚀 GOLDBOND Dashboard JS loaded');
