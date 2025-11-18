// Chatbot Functionality - GOLDBOND LABORATORIES
document.addEventListener('DOMContentLoaded', function() {
    
    const chatbotButton = document.getElementById('chatbotButton');
    const chatbotContainer = document.getElementById('chatbotContainer');
    const closeChatbot = document.getElementById('closeChatbot');
    const chatbotMessages = document.getElementById('chatbotMessages');
    const chatbotInput = document.getElementById('chatbotInput');
    const sendMessage = document.getElementById('sendMessage');

    // Check if elements exist
    if (!chatbotButton || !chatbotContainer) {
        console.error('Chatbot elements not found!');
        return;
    }

    console.log('Chatbot initialized successfully!');

    // Open chatbot
    chatbotButton.addEventListener('click', function() {
        console.log('Chatbot button clicked');
        chatbotContainer.classList.add('active');
    });

    // Close chatbot
    closeChatbot.addEventListener('click', function() {
        console.log('Close button clicked');
        chatbotContainer.classList.remove('active');
    });

    // FAQ Database
    const faqDatabase = {
        "tests": "We offer a comprehensive range of tests including:\n• Complete Blood Count (CBC)\n• Thyroid Function Tests\n• Diabetes Screening (HbA1c, Fasting Glucose)\n• Lipid Profile\n• Liver Function Tests\n• Kidney Function Tests\n• Vitamin D & B12 Tests\n• Blood Banking Services\n• All Pathology Requests\n\nWould you like to book any of these tests?",
        
        "book": "Booking a test is easy! You have 3 options:\n\n1. 📅 Online Booking - Fill out our booking form on the website\n2. 💬 WhatsApp - Message us directly at 08035944767\n3. 📞 Call Us - Speak with our team at 08035944767 or 08023340925\n\nWould you like me to help you book now?",
        
        "results": "Our typical turnaround times are:\n• Routine Blood Tests: 24-48 hours\n• Specialized Tests: 3-5 days\n• Culture Tests: 5-7 days\n• Urgent Tests: Same day (on request)\n\nYou'll receive an SMS/email when results are ready, and can access them through our online portal.",
        
        "hours": "We're open:\n• Monday - Saturday: 7:00 AM - 9:00 PM\n• Sunday: Closed\n\nHome collection service is available 6 days a week from 7:00 AM - 8:00 PM.\n\nNeed to schedule a visit?",
        
        "home": "Yes! We offer FREE home sample collection service:\n• Available Monday - Saturday\n• Timing: 7:00 AM - 8:00 PM\n• Trained phlebotomists\n• Safe & hygienic procedures\n• No extra charges\n\nWould you like to book a home collection?",
        
        "reports": "Access your reports easily:\n\n1. 🔐 Online Portal - Create an account and login with your credentials\n2. 📧 Email - Reports are automatically emailed\n3. 📱 SMS - Receive notification with access link\n4. 🏥 Physical Copy - Collect from our laboratory\n\nAll reports are secured with password protection for your privacy.",
        
        "payment": "We accept all major payment methods:\n• Cash\n• Bank Transfer\n• POS (Debit/Credit Cards)\n• Mobile Money\n• Corporate Billing\n\nDo you need help with payment?",
        
        "accredited": "Yes! GOLDBOND LABORATORIES maintains the highest quality standards:\n• Fully licensed by relevant authorities\n• Experienced pathologists and technicians on staff\n• Regular quality control audits\n• State-of-the-art equipment\n\nYour health is in trusted hands!",
        
        "location": "We are located at:\n📍 Dialogue Close by Daraja Supermarket\nShehu Laminu Road by Tafawa Balewa Way\nU/Rimi, Kaduna\n\nYou can easily find us near Daraja Supermarket. Would you like directions?",
        
        "cost": "Our pricing is competitive and transparent:\n• Basic tests start from ₦2,000\n• Health packages: ₦10,000-₦50,000\n• Free home collection\n• Corporate discounts available\n\nFor specific test pricing, please visit our Services page or contact us directly at 08035944767."
    };

    // Add message to chat
    function addMessage(message, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.className = isUser ? 'user-message' : 'bot-message';
        
        const messageParagraph = document.createElement('p');
        messageParagraph.textContent = message;
        messageDiv.appendChild(messageParagraph);
        
        chatbotMessages.appendChild(messageDiv);
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }

    // Get bot response
    function getBotResponse(userMessage) {
        const message = userMessage.toLowerCase();
        
        // Greetings
        if (message.match(/^(hi|hello|hey)/)) {
            return "Hello! Welcome to GOLDBOND LABORATORIES. How can I help you today?";
        }
        
        // Thanks
        if (message.includes('thank')) {
            return "You're welcome! Is there anything else I can help you with?";
        }
        
        // Tests
        if (message.includes('test') || message.includes('available')) {
            return faqDatabase.tests;
        }
        
        // Booking
        if (message.includes('book') || message.includes('appointment')) {
            return faqDatabase.book;
        }
        
        // Results
        if (message.includes('result') || message.includes('timing') || message.includes('long')) {
            return faqDatabase.results;
        }
        
        // Hours
        if (message.includes('hour') || message.includes('time') || message.includes('open')) {
            return faqDatabase.hours;
        }
        
        // Home collection
        if (message.includes('home') || message.includes('collection')) {
            return faqDatabase.home;
        }
        
        // Reports
        if (message.includes('report') || message.includes('access')) {
            return faqDatabase.reports;
        }
        
        // Payment
        if (message.includes('payment') || message.includes('pay')) {
            return faqDatabase.payment;
        }
        
        // Accreditation
        if (message.includes('accredit') || message.includes('certified')) {
            return faqDatabase.accredited;
        }
        
        // Location
        if (message.includes('location') || message.includes('address') || message.includes('where')) {
            return faqDatabase.location;
        }
        
        // Cost
        if (message.includes('cost') || message.includes('price')) {
            return faqDatabase.cost;
        }
        
        // Default response
        return "I'm not sure about that, but I can help you with:\n• Available tests\n• Booking a test\n• Test results timing\n• Operating hours\n• Home collection\n• Report access\n• Payment methods\n• Our location\n\nOr contact us:\n📞 08035944767, 08023340925\n📧 info@goldbondlabs.com";
    }

    // Send message function
    function sendUserMessage() {
        const message = chatbotInput.value.trim();
        if (message === '') return;

        console.log('Sending message:', message);

        // Add user message
        addMessage(message, true);
        chatbotInput.value = '';

        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'bot-message';
        typingDiv.innerHTML = '<p>Typing...</p>';
        chatbotMessages.appendChild(typingDiv);

        // Get bot response after delay
        setTimeout(function() {
            typingDiv.remove();
            const response = getBotResponse(message);
            addMessage(response, false);
        }, 800);
    }

    // Send message on button click
    if (sendMessage) {
        sendMessage.addEventListener('click', sendUserMessage);
    }

    // Send message on Enter key
    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                sendUserMessage();
            }
        });
    }

    // Handle quick option buttons
    document.querySelectorAll('.quick-option').forEach(function(button) {
        button.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            console.log('Quick option clicked:', question);
            
            // Add user message
            addMessage(question, true);
            
            // Get bot response
            setTimeout(function() {
                const response = getBotResponse(question);
                addMessage(response, false);
            }, 500);
        });
    });

});