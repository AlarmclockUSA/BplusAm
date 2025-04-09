let stripe;
let elements;
let card;
let formData = {};

// Get affiliate data
const getAffiliateData = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        source: 'Ambassador Only Funnel',
        source_url: window.location.href,
        utm_source: params.get('utm_source') || '',
        utm_medium: params.get('utm_medium') || '',
        utm_campaign: params.get('utm_campaign') || ''
    };
};

// Initialize Stripe Elements
const initialize = async () => {
    try {
        // Fetch the publishable key from the server
        const response = await fetch('/stripe-key');
        if (!response.ok) {
            throw new Error('Failed to fetch Stripe publishable key');
        }
        
        const { publishableKey } = await response.json();
        if (!publishableKey) {
            throw new Error('No publishable key returned from server');
        }
        
        // Initialize Stripe
        stripe = Stripe(publishableKey);
        
        // Create Stripe Elements instance
        elements = stripe.elements();
        
        // Custom styling for the card element
        const style = {
            base: {
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#aab7c4'
                }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        };
        
        // Create and mount the card element
        card = elements.create('card', { style });
        card.mount('#card-element');
        
        // Handle real-time validation errors
        card.on('change', (event) => {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });
        
        console.log('Stripe Elements initialized successfully');
    } catch (error) {
        console.error('Error initializing Stripe:', error);
        const cardErrors = document.getElementById('card-errors');
        if (cardErrors) {
            cardErrors.textContent = `Error: ${error.message}`;
        }
    }
};

// Collect form data
const collectFormData = () => {
    const fields = [
        'firstName',
        'lastName',
        'email',
        'phone',
        'street',
        'apt',
        'city',
        'zip',
        'country',
        'state'
    ];

    fields.forEach(field => {
        const element = document.getElementById(field);
        if (element) {
            formData[field] = element.value;
        }
    });
};

// Handle form submission
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Collect form data
    collectFormData();
    
    const errorElement = document.getElementById('card-errors');
    
    try {
        // Create payment intent on the server
        const createIntentResponse = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                affiliateData: getAffiliateData()
            })
        });
        
        if (!createIntentResponse.ok) {
            const errorData = await createIntentResponse.json();
            throw new Error(errorData.error || 'Failed to create payment intent');
        }
        
        const { clientSecret } = await createIntentResponse.json();
        
        // Confirm card payment
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
                card: card,
                billing_details: {
                    name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    phone: formData.phone,
                    address: {
                        line1: formData.street,
                        line2: formData.apt || '',
                        city: formData.city,
                        postal_code: formData.zip,
                        country: formData.country,
                        state: formData.state
                    }
                }
            }
        });
        
        if (error) {
            // Show error to customer
            errorElement.textContent = error.message;
        } else if (paymentIntent.status === 'succeeded') {
            // Payment successful - redirect to success page
            const ambassadorId = 'amb_' + Math.random().toString(36).substr(2, 9);
            window.location.href = `/success.html?id=${ambassadorId}`;
        }
    } catch (err) {
        console.error('Payment submission error:', err);
        errorElement.textContent = err.message || 'An unexpected error occurred. Please try again.';
    } finally {
        setLoading(false);
    }
};

// UI helpers
const setLoading = (isLoading) => {
    const submitButton = document.querySelector("#submit-button");
    const spinner = document.querySelector("#spinner");
    const buttonText = document.querySelector("#button-text");

    if (isLoading) {
        submitButton.disabled = true;
        spinner.classList.remove("hidden");
        buttonText.classList.add("hidden");
    } else {
        submitButton.disabled = false;
        spinner.classList.add("hidden");
        buttonText.classList.remove("hidden");
    }
};

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Stripe
    initialize();
    
    // Set up form submission handler
    document.querySelector("#payment-form").addEventListener("submit", handleSubmit);

    // Populate state dropdown
    const stateSelect = document.querySelector("#state");
    if (stateSelect) {
        const states = {
            'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
            'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
            'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
            'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
            'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
            'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
            'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
            'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
            'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
            'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming'
        };

        Object.entries(states).forEach(([code, name]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = name;
            stateSelect.appendChild(option);
        });
    }
}); 