// API Configuration
const API_CONFIG = {
    STAGING_URL: 'https://api.brilliantplus.app',
    PRODUCTION_URL: 'https://api.brilliantplus.app',
    ENDPOINTS: {
        CREATE_CONSULTANT: '/api/Consultants/CreateConsultant'
    }
};

// Initialize the form display
function initializeForm() {
    // Show the first step by default
    showStep(1);

    // Make sure the form container is visible
    const formContainer = document.querySelector('.form-container');
    if (formContainer) {
        formContainer.style.display = 'block';
        formContainer.style.opacity = '1';
    }

    // Initialize Google Places Autocomplete
    initializeGooglePlaces();

    // Add input event listeners for validation
    initializeValidation();

    // Initialize form event listeners
    initializeFormEventListeners();
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if returning from Stripe checkout
    if (urlParams.get('step') === 'thank-you') {
        // Hide the content column for thank you page
        const contentColumn = document.querySelector('.content-column');
        if (contentColumn) {
            contentColumn.style.display = 'none';
        }
        
        // Get the session ID from the URL
        const sessionId = urlParams.get('session_id');
        
        // Show success screen with the session ID
        showSuccess(sessionId || 'N/A');
    } else {
        // Initialize the form normally
        initializeForm();
    }
});

// Initialize authentication tokens
const authTokens = {
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIyNSIsInVuaXF1ZV9uYW1lIjoiTWF0dEhCcmlsbGlhbnQiLCJyb2xlIjoiQVBJIFVzZXIiLCJSb2xlSUQiOiI2IiwiTGFuZ3VhZ2VJRCI6IjEiLCJGaXJzdE5hbWUiOiJNYXR0IiwiUGVyc29uVHlwZUlEIjoiMyIsIkRhdGVGb3JtYXQiOiJNTS9kZC95eXl5IiwiQnVzaW5lc3NVbml0c19FbmFibGVkIjoiMCIsIm5iZiI6MTczODg2MTM5NSwiZXhwIjoxNzM4OTQ3Nzk1LCJpYXQiOjE3Mzg4NjEzOTV9.pri6_DR0AX8n-qXu_rxA1c3_WwRjMSJ7RaZ_b5prtyo',
    refresh_token: 'iHiJqqEMRuJDCIGNtraOtuUfn8+8sdHcmb2Wn4Xbfhq4dcDKLGI7LH8TS4Uct5qcQzpmNVwaSbtXGp9gl0LvDQ==',
    token_type: 'bearer',
    expires_in: 86399,
    expires_at: new Date('2025-02-07T17:03:15Z')
};

// Initialize all event listeners
function initializeFormEventListeners() {
    // ... rest of your existing code ...
}

// Validate address fields
function validateAddressFields() {
    const addressFields = ['city', 'province', 'postalCode', 'country'];
    let isValid = true;

    addressFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('invalid');
        }
    });

    return isValid;
}

// Initialize Stripe with configuration from server
let stripe;
let elements;
let cardElement;

async function initializeStripe() {
    try {
        // Fetch configuration from server
        const response = await fetch('/api/config');
        if (!response.ok) {
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const config = await response.json();
        
        if (!config.stripePublishableKey) {
            throw new Error('Stripe publishable key is missing');
        }

        // Initialize Stripe with publishable key
        stripe = Stripe(config.stripePublishableKey);

        // Create card Element with updated styling
        elements = stripe.elements();
        cardElement = elements.create('card', {
            style: {
                base: {
                    color: '#000',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                    fontSize: '16px',
                    fontSmoothing: 'antialiased',
                    '::placeholder': {
                        color: '#666'
                    },
                    ':-webkit-autofill': {
                        color: '#000'
                    }
                },
                invalid: {
                    color: '#ff4444',
                    iconColor: '#ff4444'
                }
            },
            hidePostalCode: true
        });

        // Mount the card element
        cardElement.mount('#card-element');

        // Handle real-time validation errors
        cardElement.on('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });
    } catch (error) {
        console.error('Failed to initialize Stripe:', error);
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = `Payment system error: ${error.message}. Please try again later or contact support.`;
        errorElement.style.color = '#ff4444';
    }
}

// Initialize Stripe when the page loads
document.addEventListener('DOMContentLoaded', initializeStripe);

// Store form data between steps
let formData = {};

// Validate step 1 form
function validateStep1() {
    const requiredFields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'street1',
        'city',
        'postalCode',
        'country',
        'province',
        'terms'
    ];

    let isValid = true;
    const errorMessages = [];

    // Check required fields
    requiredFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('invalid');
            errorMessages.push(`${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)} is required`);
        } else {
            input.classList.remove('invalid');
        }
    });

    // Validate email format
    const emailInput = document.getElementById('email');
    if (emailInput.value && !emailInput.value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        isValid = false;
        emailInput.classList.add('invalid');
        errorMessages.push('Please enter a valid email address');
    }

    // Validate phone format
    const phoneInput = document.getElementById('phone');
    if (phoneInput.value && !phoneInput.value.match(/^\+?[1-9]\d{1,14}$/)) {
        isValid = false;
        phoneInput.classList.add('invalid');
        errorMessages.push('Please enter a valid phone number');
    }

    // Show error messages if any
    if (errorMessages.length > 0) {
        const errorContainer = document.getElementById('messageContainer');
        errorContainer.innerHTML = `
            <div class="alert alert-error">
                <ul>
                    ${errorMessages.map(msg => `<li>${msg}</li>`).join('')}
                </ul>
            </div>
        `;
    } else {
        const errorContainer = document.getElementById('messageContainer');
        errorContainer.innerHTML = '';
    }

    return isValid;
}

// Step 1: Basic Information Form with Payment
document.getElementById('contactForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!validateStep1()) return;

    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';
    const errorElement = document.getElementById('card-errors');
    errorElement.textContent = '';

    try {
        // Store form data
        formData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            street1: document.getElementById('street1').value,
            street2: document.getElementById('street2').value,
            city: document.getElementById('city').value,
            postalCode: document.getElementById('postalCode').value,
            country: document.getElementById('country').value,
            province: document.getElementById('province').value
        };

        // Create payment method using the card element
        const { paymentMethod, error } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
            billing_details: {
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                phone: formData.phone,
                address: {
                    line1: formData.street1,
                    line2: formData.street2,
                    city: formData.city,
                    state: formData.province,
                    postal_code: formData.postalCode,
                    country: formData.country
                }
            }
        });

        if (error) {
            throw error;
        }

        // Send payment method ID to your server
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                payment_method_id: paymentMethod.id,
                formData: formData
            })
        });

        const result = await response.json();

        if (result.error) {
            throw new Error(result.error);
        }

        // Handle subscription confirmation
        if (result.status === 'requires_action') {
            const { error: confirmError } = await stripe.confirmCardPayment(
                result.client_secret
            );

            if (confirmError) {
                throw confirmError;
            }

            showSuccess(result.subscriptionId);
        }
        
    } catch (error) {
        console.error('Payment error:', error);
        errorElement.textContent = error.message;
        submitButton.disabled = false;
        submitButton.textContent = 'Confirm and Create Account';
    }
});

// Generate a random password that meets requirements
function generateRandomPassword() {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    
    // Ensure at least one uppercase, one lowercase, one number, and one special char
    password += 'A'; // uppercase
    password += 'a'; // lowercase
    password += '1'; // number
    password += '!'; // special
    
    // Fill the rest randomly
    for (let i = 0; i < length - 4; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// Get province ID from state code
function getProvinceID(stateCode) {
    const stateMapping = {
        'AL': 1, 'AK': 2, 'AZ': 3, 'AR': 4, 'CA': 5, 'CO': 6, 'CT': 7, 'DE': 8, 'FL': 9, 'GA': 10,
        'HI': 11, 'ID': 12, 'IL': 13, 'IN': 14, 'IA': 15, 'KS': 16, 'KY': 17, 'LA': 18, 'ME': 19, 'MD': 20,
        'MA': 21, 'MI': 22, 'MN': 23, 'MS': 24, 'MO': 25, 'MT': 26, 'NE': 27, 'NV': 28, 'NH': 29, 'NJ': 30,
        'NM': 31, 'NY': 32, 'NC': 33, 'ND': 34, 'OH': 35, 'OK': 36, 'OR': 37, 'PA': 38, 'RI': 39, 'SC': 40,
        'SD': 41, 'TN': 42, 'TX': 43, 'UT': 44, 'VT': 45, 'VA': 46, 'WA': 47, 'WV': 48, 'WI': 49, 'WY': 50,
        'DC': 51
    };
    
    return stateMapping[stateCode] || 5; // Default to California if not found
}

// Add back button functionality
document.querySelectorAll('.back-button').forEach(button => {
    button.addEventListener('click', function() {
        const currentStep = parseInt(this.closest('.form-step').dataset.step);
        showStep(currentStep - 1);
    });
});

// Username generation from email
const emailInput = document.querySelector('input[type="email"]');
const usernameInput = document.getElementById('username');

emailInput.addEventListener('input', function() {
    const email = this.value;
    if (email && email.includes('@')) {
        const username = email.split('@')[0].toLowerCase();
        usernameInput.value = username;
    } else {
        usernameInput.value = '';
    }
});

// Step navigation
function showStep(step) {
    // Update step indicator
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector(`[data-step="${step}"]`).classList.add('active');

    // Hide all form steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.style.display = 'none';
    });

    // Show the current step
    const currentStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (currentStep) {
        currentStep.style.display = 'block';
        
        // Handle form visibility within the step
        const forms = currentStep.querySelectorAll('.step-form');
        forms.forEach(form => {
            form.style.display = 'block';
            form.classList.add('active');
        });
    }
}

// Helper Functions
function generateReplicatedSiteURL(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15) + Math.floor(Math.random() * 1000);
}

function generateUsername(email) {
    return email.split('@')[0].replace(/[^a-z0-9]/gi, '') + 
           Math.floor(Math.random() * 100);
}

function getCountryID(countryName) {
    const countryMap = {
        'United States': 1,
        'US': 1
    };
    return countryMap[countryName] || 1;
}

function getProvinceID(provinceName) {
    if (!provinceName) return null;

    // Clean up the input
    const cleanName = provinceName.trim();

    // Handle state abbreviations
    const stateAbbreviations = {
        'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
        'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
        'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
        'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
        'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
        'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
        'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
        'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
        'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
        'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
        'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
        'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
        'WI': 'Wisconsin', 'WY': 'Wyoming'
    };

    // Updated map of state names to IDs with correct mappings
    const provinceMap = {
        'ALABAMA': 1, 'ALASKA': 2, 'ARIZONA': 3, 'ARKANSAS': 4,
        'CALIFORNIA': 5, 'COLORADO': 6, 'CONNECTICUT': 7, 'DELAWARE': 8,
        'FLORIDA': 9, 'GEORGIA': 10, 'HAWAII': 11, 'IDAHO': 12,
        'ILLINOIS': 13, 'INDIANA': 14, 'IOWA': 15, 'KANSAS': 16,
        'KENTUCKY': 17, 'LOUISIANA': 18, 'MAINE': 19, 'MARYLAND': 20,
        'MASSACHUSETTS': 21, 'MICHIGAN': 22, 'MINNESOTA': 23, 'MISSISSIPPI': 24,
        'MISSOURI': 25, 'MONTANA': 26, 'NEBRASKA': 27, 'NEVADA': 28,
        'NEW HAMPSHIRE': 29, 'NEW JERSEY': 30, 'NEW MEXICO': 31, 'NEW YORK': 32,
        'NORTH CAROLINA': 33, 'NORTH DAKOTA': 34, 'OHIO': 35, 'OKLAHOMA': 36,
        'OREGON': 37, 'PENNSYLVANIA': 38, 'RHODE ISLAND': 39, 'SOUTH CAROLINA': 40,
        'SOUTH DAKOTA': 41, 'TENNESSEE': 42, 'TEXAS': 43, 'UTAH': 44,
        'VERMONT': 45, 'VIRGINIA': 46, 'WASHINGTON': 47, 'WEST VIRGINIA': 48,
        'WISCONSIN': 49, 'WYOMING': 50
    };

    // First, try to match the exact input
    let id = provinceMap[cleanName.toUpperCase()];
    
    // If not found and it's a 2-letter code, try to convert it
    if (!id && cleanName.length === 2) {
        const fullName = stateAbbreviations[cleanName.toUpperCase()];
        if (fullName) {
            id = provinceMap[fullName.toUpperCase()];
        }
    }

    // Enhanced logging for debugging
    console.log('State/Province Resolution:', {
        received: provinceName,
        cleaned: cleanName,
        fullName: cleanName.length === 2 ? stateAbbreviations[cleanName.toUpperCase()] : cleanName,
        resolvedId: id,
        isAbbreviation: cleanName.length === 2
    });

    return id || null;
}

// Secure SSN handling
function sanitizeDataForLogging(data) {
    // Create a deep copy of the data
    const sanitizedData = JSON.parse(JSON.stringify(data));
    
    // Recursively remove SSN from any nested objects
    function removeSSN(obj) {
        for (let key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                removeSSN(obj[key]);
            } else if (key === 'SSN') {
                obj[key] = '***REDACTED***';
            }
        }
    }
    
    removeSSN(sanitizedData);
    return sanitizedData;
}

// UI Helper Functions
function toggleLoadingState(isLoading) {
    const submitButtons = document.querySelectorAll('.submit-button');
    submitButtons.forEach(button => {
        if (isLoading) {
            button.disabled = true;
            button.textContent = 'Creating account...';
        } else {
            button.disabled = false;
            button.textContent = button.closest('[data-step="1"]') ? 'Continue to Account Setup' : 'Create Account';
        }
    });
}

function showSuccess(subscriptionId) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.style.display = 'none';
    });

    // Show thank you step
    const thankYouStep = document.querySelector('.thank-you-step');
    thankYouStep.style.display = 'block';

    // Set subscription ID
    document.getElementById('subscriptionId').textContent = subscriptionId;

    // Update step indicator
    updateStepIndicator(2);
}

function showError(message, details = null) {
    let errorMessage = `Error: ${message}`;
    if (details) {
        errorMessage += '\n\nTechnical Details:\n' + 
            Object.entries(details)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
    }
    console.error(errorMessage);
    alert(errorMessage);
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    element.select();
    document.execCommand('copy');
    const button = element.nextElementSibling;
    button.textContent = 'Copied!';
    setTimeout(() => {
        button.textContent = 'Copy';
    }, 2000);
}

// Modal Functions
function openTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Disable the agree button initially
        const agreeButton = modal.querySelector('.modal-button.agree');
        if (agreeButton) {
            agreeButton.disabled = true;
            agreeButton.classList.add('disabled');
        }
        
        // Start the timer
        setTimeout(() => {
            if (agreeButton) {
                agreeButton.disabled = false;
                agreeButton.classList.remove('disabled');
                
                // Show timer message
                const footer = modal.querySelector('.modal-footer');
                if (footer) {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'timer-message';
                    messageElement.textContent = 'You can now agree to the terms';
                    footer.insertBefore(messageElement, agreeButton);
                    
                    // Remove the message after 5 seconds
                    setTimeout(() => {
                        if (messageElement.parentNode) {
                            messageElement.parentNode.removeChild(messageElement);
                        }
                    }, 5000);
                }
            }
        }, 3000);
    }
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openAmbassadorModal() {
    const modal = document.getElementById('ambassadorModal');
    if (modal) {
        modal.style.display = 'block';
        
        // Disable the agree button initially
        const agreeButton = modal.querySelector('.modal-button.agree');
        if (agreeButton) {
            agreeButton.disabled = true;
            agreeButton.classList.add('disabled');
        }
        
        // Start the timer
        setTimeout(() => {
            if (agreeButton) {
                agreeButton.disabled = false;
                agreeButton.classList.remove('disabled');
                
                // Show timer message
                const footer = modal.querySelector('.modal-footer');
                if (footer) {
                    const messageElement = document.createElement('div');
                    messageElement.className = 'timer-message';
                    messageElement.textContent = 'You can now agree to the terms';
                    footer.insertBefore(messageElement, agreeButton);
                    
                    // Remove the message after 5 seconds
                    setTimeout(() => {
                        if (messageElement.parentNode) {
                            messageElement.parentNode.removeChild(messageElement);
                        }
                    }, 5000);
                }
            }
        }, 3000);
    }
}

function closeAmbassadorModal() {
    const modal = document.getElementById('ambassadorModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function handleTermsAgree() {
    // Check the terms checkbox
    const termsCheckbox = document.getElementById('terms');
    if (termsCheckbox) {
        termsCheckbox.checked = true;
        termsCheckbox.dispatchEvent(new Event('change'));
    }
    closeTermsModal();
}

function handleTermsDisagree() {
    // Uncheck the terms checkbox
    const termsCheckbox = document.getElementById('terms');
    if (termsCheckbox) {
        termsCheckbox.checked = false;
        termsCheckbox.dispatchEvent(new Event('change'));
    }
    closeTermsModal();
}

function handleAmbassadorAgree() {
    // Check the ambassador agreement checkbox
    const ambassadorCheckbox = document.getElementById('ambassadorAgreement');
    if (ambassadorCheckbox) {
        ambassadorCheckbox.checked = true;
        ambassadorCheckbox.dispatchEvent(new Event('change'));
    }
    closeAmbassadorModal();
}

function handleAmbassadorDisagree() {
    // Uncheck the ambassador agreement checkbox
    const ambassadorCheckbox = document.getElementById('ambassadorAgreement');
    if (ambassadorCheckbox) {
        ambassadorCheckbox.checked = false;
    }
    closeAmbassadorModal();
}

// Initialize all modal events
document.addEventListener('DOMContentLoaded', function() {
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        const termsModal = document.getElementById('termsModal');
        const ambassadorModal = document.getElementById('ambassadorModal');
        
        if (event.target === termsModal) {
            closeTermsModal();
        } else if (event.target === ambassadorModal) {
            closeAmbassadorModal();
        }
    });
    
    // Make the handler functions globally available
    window.openTermsModal = openTermsModal;
    window.closeTermsModal = closeTermsModal;
    window.openAmbassadorModal = openAmbassadorModal;
    window.closeAmbassadorModal = closeAmbassadorModal;
    window.handleTermsAgree = handleTermsAgree;
    window.handleTermsDisagree = handleTermsDisagree;
    window.handleAmbassadorAgree = handleAmbassadorAgree;
    window.handleAmbassadorDisagree = handleAmbassadorDisagree;
    
    // Add event listeners to modals
    const termsLinks = document.querySelectorAll('.terms-link');
    termsLinks.forEach(link => {
        if (link.textContent.includes('Terms of Service')) {
            link.addEventListener('click', openTermsModal);
        } else if (link.textContent.includes('Ambassador Agreement')) {
            link.addEventListener('click', openAmbassadorModal);
        }
    });
    
    // Close buttons
    const closeButtons = document.querySelectorAll('.modal-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal.id === 'termsModal') {
                closeTermsModal();
            } else if (modal.id === 'ambassadorModal') {
                closeAmbassadorModal();
            }
        });
    });
});

// Add CSS class for invalid inputs
const style = document.createElement('style');
style.textContent = `
    .invalid {
        border-color: #ff4444 !important;
        box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.1) !important;
    }
    .checkbox-label.invalid .checkbox-custom {
        border-color: #ff4444 !important;
    }
`;
document.head.appendChild(style); 

// Wait for DOM to load before mounting
document.addEventListener('DOMContentLoaded', function() {
    // Mount the card Element
    const cardMount = document.getElementById('card-element');
    if (cardMount) {
        cardElement.mount('#card-element');

        // Handle real-time validation errors
        cardElement.on('change', function(event) {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
                cardMount.classList.add('StripeElement--invalid');
            } else {
                displayError.textContent = '';
                cardMount.classList.remove('StripeElement--invalid');
            }
        });

        // Handle focus/blur states
        cardElement.on('focus', function() {
            cardMount.classList.add('focused');
        });

        cardElement.on('blur', function() {
            cardMount.classList.remove('focused');
        });
    }

    // Initialize form display
    initializeForm();
});