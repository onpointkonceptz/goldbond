// Booking Modal Functionality
const bookingModal = document.getElementById('bookingModal');
const openBookingFormBtn = document.getElementById('openBookingForm');
const closeModalBtn = document.querySelector('.close-modal');
const bookingForm = document.getElementById('bookingForm');

// Open modal
openBookingFormBtn?.addEventListener('click', () => {
    bookingModal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

// Close modal
closeModalBtn?.addEventListener('click', () => {
    bookingModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Close modal when clicking outside
bookingModal?.addEventListener('click', (e) => {
    if (e.target === bookingModal) {
        bookingModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bookingModal.classList.contains('active')) {
        bookingModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Set minimum date to today
const appointmentDateInput = document.getElementById('appointmentDate');
if (appointmentDateInput) {
    const today = new Date().toISOString().split('T')[0];
    appointmentDateInput.setAttribute('min', today);
}

// Handle form submission
bookingForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        testType: document.getElementById('testType').value,
        appointmentDate: document.getElementById('appointmentDate').value,
        appointmentTime: document.getElementById('appointmentTime').value,
        location: document.getElementById('location').value,
        address: document.getElementById('address').value,
        notes: document.getElementById('notes').value
    };
    
    // Validate form
    if (!validateBookingForm(formData)) {
        return;
    }
    
    // Show loading
    showLoading();
    
    try {
        // Send booking request to backend
        const response = await fetch('http://localhost:3000/api/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        hideLoading();
        
        if (response.ok) {
            const result = await response.json();
            showNotification('Booking successful! You will receive a confirmation email shortly.', 'success');
            
            // Close modal
            bookingModal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Reset form
            bookingForm.reset();
            
            // Show booking confirmation details
            showBookingConfirmation(result);
        } else {
            const error = await response.json();
            showNotification(error.message || 'Booking failed. Please try again.', 'error');
        }
    } catch (error) {
        hideLoading();
        console.error('Booking error:', error);
        showNotification('Unable to process booking. Please contact us directly.', 'error');
    }
});

// Validate booking form
const validateBookingForm = (data) => {
    // Validate name
    if (!data.fullName || data.fullName.trim().length < 2) {
        showNotification('Please enter a valid name', 'error');
        return false;
    }
    
    // Validate email
    if (!validateEmail(data.email)) {
        showNotification('Please enter a valid email address', 'error');
        return false;
    }
    
    // Validate phone
    if (!validatePhone(data.phone)) {
        showNotification('Please enter a valid phone number', 'error');
        return false;
    }
    
    // Validate test type
    if (!data.testType) {
        showNotification('Please select a test type', 'error');
        return false;
    }
    
    // Validate date
    const selectedDate = new Date(data.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showNotification('Please select a future date', 'error');
        return false;
    }
    
    // Validate time
    if (!data.appointmentTime) {
        showNotification('Please select a time', 'error');
        return false;
    }
    
    // Validate location
    if (!data.location) {
        showNotification('Please select a collection location', 'error');
        return false;
    }
    
    // Validate address for home collection
    if (data.location === 'home' && !data.address.trim()) {
        showNotification('Please provide your address for home collection', 'error');
        return false;
    }
    
    return true;
};

// Show booking confirmation
const showBookingConfirmation = (bookingData) => {
    const confirmationModal = document.createElement('div');
    confirmationModal.className = 'modal active';
    confirmationModal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <div style="text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 4rem; color: #00a86b; margin-bottom: 1rem;"></i>
                <h2>Booking Confirmed!</h2>
                <p style="color: #666; margin-bottom: 2rem;">Your appointment has been successfully scheduled.</p>
                
                <div style="background: #f5f7fa; padding: 1.5rem; border-radius: 10px; text-align: left; margin-bottom: 1.5rem;">
                    <p><strong>Booking ID:</strong> ${bookingData.bookingId || 'MLAB' + Date.now()}</p>
                    <p><strong>Name:</strong> ${bookingData.fullName}</p>
                    <p><strong>Test:</strong> ${bookingData.testType}</p>
                    <p><strong>Date:</strong> ${new Date(bookingData.appointmentDate).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${bookingData.appointmentTime}</p>
                    <p><strong>Location:</strong> ${bookingData.location}</p>
                </div>
                
                <p style="font-size: 0.9rem; color: #666; margin-bottom: 1.5rem;">
                    A confirmation email has been sent to <strong>${bookingData.email}</strong>
                </p>
                
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <a href="index.html" class="btn btn-primary">Back to Home</a>
                    <button onclick="window.print()" class="btn btn-secondary">Print Details</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(confirmationModal);
};

// Auto-fill address field based on location selection
const locationSelect = document.getElementById('location');
const addressField = document.getElementById('address');
const addressGroup = addressField?.parentElement;

locationSelect?.addEventListener('change', () => {
    if (locationSelect.value === 'home') {
        addressGroup.style.display = 'block';
        addressField.setAttribute('required', 'required');
    } else {
        addressGroup.style.display = 'none';
        addressField.removeAttribute('required');
        addressField.value = '';
    }
});

// Initialize address field visibility
if (locationSelect && addressGroup) {
    addressGroup.style.display = locationSelect.value === 'home' ? 'block' : 'none';
}

// Add time slot suggestions based on location
const timeInput = document.getElementById('appointmentTime');
const createTimeSlotSuggestions = () => {
    if (!timeInput) return;
    
    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.style.cssText = 'display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;';
    
    const timeSlots = ['07:00', '08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
    
    timeSlots.forEach(slot => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = slot;
        button.style.cssText = 'padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 5px; background: white; cursor: pointer; font-size: 0.9rem;';
        button.onclick = () => {
            timeInput.value = slot;
            document.querySelectorAll('[data-time-slot]').forEach(b => b.style.background = 'white');
            button.style.background = '#0066cc';
            button.style.color = 'white';
        };
        button.setAttribute('data-time-slot', 'true');
        suggestionsDiv.appendChild(button);
    });
    
    timeInput.parentElement.appendChild(suggestionsDiv);
};

// Initialize time slot suggestions
createTimeSlotSuggestions();

// WhatsApp Quick Booking
const quickWhatsAppBooking = (testType) => {
    const message = `Hi, I would like to book a ${testType} test. Please help me schedule an appointment.`;
    const whatsappUrl = `https://wa.me/1234567890?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
};

// Export function for use in other pages
window.quickWhatsAppBooking = quickWhatsAppBooking;