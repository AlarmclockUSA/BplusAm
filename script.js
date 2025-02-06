// API Configuration
const API_CONFIG = {
    STAGING_URL: 'https://api.brilliantplus.app',
    PRODUCTION_URL: 'https://api.brilliantplus.app',
    ENDPOINTS: {
        CREATE_CONSULTANT: '/api/Consultants/CreateConsultant'
    }
};

// Initialize authentication tokens
const authTokens = {
    access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1laWQiOiIyNSIsInVuaXF1ZV9uYW1lIjoiTWF0dEhCcmlsbGlhbnQiLCJyb2xlIjoiQVBJIFVzZXIiLCJSb2xlSUQiOiI2IiwiTGFuZ3VhZ2VJRCI6IjEiLCJGaXJzdE5hbWUiOiJNYXR0IiwiUGVyc29uVHlwZUlEIjoiMyIsIkRhdGVGb3JtYXQiOiJNTS9kZC95eXl5IiwiQnVzaW5lc3NVbml0c19FbmFibGVkIjoiMCIsIm5iZiI6MTczODg2MTM5NSwiZXhwIjoxNzM4OTQ3Nzk1LCJpYXQiOjE3Mzg4NjEzOTV9.pri6_DR0AX8n-qXu_rxA1c3_WwRjMSJ7RaZ_b5prtyo',
    refresh_token: 'iHiJqqEMRuJDCIGNtraOtuUfn8+8sdHcmb2Wn4Xbfhq4dcDKLGI7LH8TS4Uct5qcQzpmNVwaSbtXGp9gl0LvDQ==',
    token_type: 'bearer',
    expires_in: 86399,
    expires_at: new Date('2025-02-07T17:03:15Z')
};

// Initialize the form display
function initializeForm() {
    // Show the first step by default
    showStep(1);

    // Initialize SSN input handling
    const ssnInput = document.getElementById('ssn');
    if (!ssnInput) return; // Guard clause if element not found
    
    // Prevent copy/paste on SSN field
    ssnInput.addEventListener('copy', e => e.preventDefault());
    ssnInput.addEventListener('paste', e => e.preventDefault());
    ssnInput.addEventListener('cut', e => e.preventDefault());
    
    // Clear SSN value when tab loses focus
    window.addEventListener('blur', () => {
        if (document.activeElement !== ssnInput) {
            ssnInput.value = ssnInput.value.replace(/\d/g, '*');
        }
    });

    // Handle SSN formatting
    ssnInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 9) {
            value = value.slice(0, 9);
        }
        if (value.length >= 3 && value.length < 5) {
            value = value.slice(0, 3) + '-' + value.slice(3);
        } else if (value.length >= 5) {
            value = value.slice(0, 3) + '-' + value.slice(3, 5) + '-' + value.slice(5);
        }
        e.target.value = value;
    });

    // Add SSN validation
    ssnInput.addEventListener('blur', function() {
        const value = this.value;
        const isValid = /^\d{3}-\d{2}-\d{4}$/.test(value);
        if (!isValid && value) {
            this.classList.add('invalid');
        } else {
            this.classList.remove('invalid');
        }
    });

    // Clear SSN when moving back to step 1
    document.querySelector('.back-button').addEventListener('click', function() {
        document.getElementById('ssn').value = '';
    });

    // Initialize Google Places Autocomplete
    const street1Input = document.getElementById('street1');
    if (street1Input && window.google && window.google.maps && window.google.maps.places) {
        const autocomplete = new google.maps.places.Autocomplete(street1Input, {
            types: ['address'],
            componentRestrictions: { country: ['US'] },
            fields: ['address_components', 'formatted_address']
        });

        // Handle place selection
        autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
            
            if (!place.address_components) {
                console.error('No address details available for input');
                return;
            }

            // Extract address components
            for (const component of place.address_components) {
                const type = component.types[0];
                
                switch (type) {
                    case 'street_number':
                        document.getElementById('street1').value = component.long_name;
                        break;
                    case 'route':
                        const street = document.getElementById('street1').value;
                        document.getElementById('street1').value = 
                            street ? `${street} ${component.long_name}` : component.long_name;
                        break;
                    case 'locality':
                        document.getElementById('city').value = component.long_name;
                        break;
                    case 'administrative_area_level_1':
                        document.getElementById('province').value = component.long_name;
                        break;
                    case 'postal_code':
                        document.getElementById('postalCode').value = component.long_name;
                        break;
                    case 'country':
                        document.getElementById('country').value = component.long_name;
                        break;
                }
            }
        });
    }

    // Add input event listeners for validation
    const addressFields = ['city', 'province', 'postalCode', 'country'];
    addressFields.forEach(fieldId => {
        const input = document.getElementById(fieldId);
        if (input) {
            input.addEventListener('input', function() {
                this.classList.remove('invalid');
                validateAddressFields();
            });
        }
    });

    // Initialize form event listeners
    initializeFormEventListeners();
}

// Initialize all event listeners
function initializeFormEventListeners() {
    // ... rest of your existing code ...
}

// Call initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the form without authentication
    initializeForm();
});

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

// Store form data between steps
let formData = {};

// Step 1: Basic Information Form
document.getElementById('contactForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validate SSN
    const ssnInput = document.getElementById('ssn');
    const ssnValue = ssnInput.value;
    const isValidSSN = /^\d{3}-\d{2}-\d{4}$/.test(ssnValue);
    
    if (!isValidSSN) {
        ssnInput.classList.add('invalid');
        showError('Please enter a valid Social Security Number (XXX-XX-XXXX).');
        return;
    }

    // Get all required inputs
    const requiredInputs = this.querySelectorAll('[required]');
    let isValid = true;

    // Check each required field
    requiredInputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('invalid');
        } else {
            input.classList.remove('invalid');
        }
    });

    // Check terms checkbox
    const termsCheckbox = document.getElementById('terms');
    if (!termsCheckbox.checked) {
        isValid = false;
        termsCheckbox.parentElement.classList.add('invalid');
    } else {
        termsCheckbox.parentElement.classList.remove('invalid');
    }

    if (!isValid) {
        showError('Please fill in all required fields and accept the Terms of Service.');
        return;
    }

    // Store step 1 data (excluding SSN)
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

    // Generate and set username
    const username = generateUsername(formData.email);
    document.getElementById('username').value = username;

    // Show step 2
    showStep(2);
});

// Step 2: Account Setup Form
document.getElementById('accountSetupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    if (!this.checkValidity()) {
        return;
    }

    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    try {
        // Show loading state before API call
        toggleLoadingState(true);

        // Format the data exactly as it worked in curl
        const requestData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone.replace(/\D/g, ''),
            address: formData.street1,
            city: formData.city,
            state: formData.province,
            zipCode: formData.postalCode,
            country: formData.country || "United States"
        };

        console.log('API Request Payload:', JSON.stringify(requestData, null, 2));

        // Call the API
        const success = await createConsultant(requestData);
        
        if (success) {
            showSuccess(document.getElementById('username').value, password);
        }
    } catch (error) {
        showError('An unexpected error occurred. Please try again.', {
            errorType: error.name,
            errorMessage: error.message,
            timestamp: new Date().toISOString()
        });
        console.error('Form submission error:', error);
    } finally {
        // Hide loading state after API call completes
        toggleLoadingState(false);
    }
});

// Password validation
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const passwordRequirements = document.querySelectorAll('.password-requirements li');

passwordInput.addEventListener('input', validatePassword);
confirmPasswordInput.addEventListener('input', validatePasswordMatch);

function validatePassword() {
    const password = passwordInput.value;
    
    // Check each requirement
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[@$!%*?&]/.test(password)
    };

    // Update requirement list UI
    passwordRequirements.forEach(item => {
        const requirement = item.dataset.requirement;
        if (requirements[requirement]) {
            item.classList.add('valid');
        } else {
            item.classList.remove('valid');
        }
    });

    // Return true if all requirements are met
    return Object.values(requirements).every(req => req);
}

function validatePasswordMatch() {
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;
    
    if (confirmPassword === '') {
        confirmPasswordInput.setCustomValidity('');
    } else if (password !== confirmPassword) {
        confirmPasswordInput.setCustomValidity('Passwords do not match');
    } else {
        confirmPasswordInput.setCustomValidity('');
    }
}

// Password visibility toggle
const togglePasswordButtons = document.querySelectorAll('.toggle-password');

togglePasswordButtons.forEach(button => {
    button.addEventListener('click', function() {
        const input = this.previousElementSibling;
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        
        // Update icon (optional - if you want to change the icon)
        const path = this.querySelector('path');
        if (type === 'text') {
            path.setAttribute('d', 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z');
        } else {
            path.setAttribute('d', 'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z');
        }
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

// Form submission handling
const accountSetupForm = document.getElementById('accountSetupForm');

accountSetupForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Validate password requirements
    if (!validatePassword()) {
        alert('Please ensure all password requirements are met.');
        return;
    }
    
    // Validate password match
    if (passwordInput.value !== confirmPasswordInput.value) {
        alert('Passwords do not match.');
        return;
    }
    
    // If all validations pass, proceed with form submission
    // Add your form submission logic here
    console.log('Form submitted successfully');
});

// Step navigation
function showStep(step) {
    // Update step indicator
    document.querySelectorAll('.step').forEach(el => {
        el.classList.remove('active');
    });
    document.querySelector(`[data-step="${step}"]`).classList.add('active');

    // Hide all forms and show the current step
    document.querySelectorAll('.step-form').forEach(form => {
        form.style.display = 'none';
        form.classList.remove('active');
    });
    const currentForm = document.querySelector(`.step-form[data-step="${step}"]`);
    currentForm.style.display = 'block';
    
    // Clear SSN when showing step 1
    if (step === 1) {
        document.getElementById('ssn').value = '';
    }
    
    // Use setTimeout to ensure display: block is applied before adding the active class
    setTimeout(() => {
        currentForm.classList.add('active');
    }, 10);
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

    // Map of state names to IDs
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

    // Add logging to help debug
    console.log('Province name received:', provinceName);
    console.log('Cleaned name:', cleanName);
    console.log('Resolved ID:', id);

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

// Update the API call to use the simple structure
async function createConsultant(requestData) {
    // Use the local API endpoint
    const url = '/api/create-consultant';
    
    try {
        // Log the request details
        console.log('Making API request to:', url);
        console.log('Request data:', JSON.stringify(requestData, null, 2));

        // Make the API call through our proxy
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the response
        const result = await response.json();
        console.log('API Response:', result);

        // Check if the API call was successful
        if (result.ResultCode === 0) {
            showMessage('Success! Your application has been submitted. Your consultant ID is: ' + result.Value.DisplayID, 'success');
            return true;
        } else {
            const errorMessage = result.Notifications && result.Notifications.length > 0 
                ? result.Notifications[0].Message 
                : 'Failed to submit application. Please try again.';
            showMessage(errorMessage, 'error');
            return false;
        }
    } catch (error) {
        console.error('API Call Failed:', {
            url,
            error: error.message,
            type: error.name,
            stack: error.stack,
            online: navigator.onLine,
            readyState: document.readyState
        });
        
        showMessage('Failed to submit application. Please try again.', 'error');
        return false;
    }
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

function showSuccess(username, password) {
    document.getElementById('createdUsername').value = username;
    document.getElementById('createdPassword').value = password;
    document.getElementById('successModal').style.display = 'flex';
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
function openModal() {
    const modal = document.getElementById('termsModal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.style.opacity = '1';
        modal.querySelector('.modal-content').style.transform = 'translateY(0)';
    }, 10);
}

function closeModal() {
    const modal = document.getElementById('termsModal');
    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'translateY(20px)';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.opacity = '0';
    modal.querySelector('.modal-content').style.transform = 'translateY(20px)';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const termsModal = document.getElementById('termsModal');
    const successModal = document.getElementById('successModal');
    
    if (event.target === termsModal) {
        closeModal();
    } else if (event.target === successModal) {
        closeSuccessModal();
    }
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

// ... existing code ...
document.getElementById('applicationForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    try {
        // Format the data exactly as it worked in curl
        const requestData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value.replace(/\D/g, ''),
            address: document.getElementById('street1').value,
            city: document.getElementById('city').value,
            state: document.getElementById('province').value,
            zipCode: document.getElementById('postalCode').value,
            country: document.getElementById('country').value || "United States"
        };
        
        // Call the createConsultant function
        const success = await createConsultant(requestData);
        
        if (success) {
            // Form was submitted successfully and has been reset
            submitButton.textContent = 'Success!';
            setTimeout(() => {
                submitButton.textContent = originalButtonText;
                submitButton.disabled = false;
            }, 2000);
        } else {
            // Error was already handled in createConsultant
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    } catch (error) {
        console.error('Form submission error:', error);
        showMessage('An unexpected error occurred. Please try again.', 'error');
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
});

// Helper function to show messages to the user
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        console.error('Message container not found');
        return;
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `alert alert-${type}`;
    messageElement.textContent = message;
    
    // Clear any existing messages
    messageContainer.innerHTML = '';
    messageContainer.appendChild(messageElement);
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    }
}
// ... existing code ...