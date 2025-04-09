// URL Parameter Handling
function getPathParameter() {
    const path = window.location.pathname;
    // Remove leading slash and return the parameter
    return path.substring(1);
}

// US States data
const states = {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'FL': 'Florida',
    'GA': 'Georgia',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PA': 'Pennsylvania',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
};

// Populate state dropdown
function populateStateDropdown() {
    const stateSelect = document.getElementById('state');
    if (!stateSelect) return; // Guard against missing element
    
    stateSelect.innerHTML = '<option value="">Select a state</option>';
    
    Object.entries(states).forEach(([abbr, name]) => {
        const option = document.createElement('option');
        option.value = abbr;
        option.textContent = name;
        stateSelect.appendChild(option);
    });
}

// Store URL parameters in localStorage
function storeUrlParameters() {
    const pathParam = getPathParameter();
    if (pathParam) {
        localStorage.setItem('affiliate_path', pathParam);
    }
    
    // Also store any query parameters if needed
    const params = new URLSearchParams(window.location.search);
    const storedParams = {};
    
    for (const [key, value] of params.entries()) {
        storedParams[key] = value;
        localStorage.setItem(`affiliate_${key}`, value);
    }
    
    return {
        path: pathParam,
        ...storedParams
    };
}

// Store URL parameters on page load
const affiliateParams = storeUrlParameters();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Populate states immediately
    populateStateDropdown();
    
    // Initialize Stripe once we have the key
    if (!window.stripePublishableKey) {
        console.error('Stripe publishable key not found');
        return;
    }
    
    const stripe = Stripe(window.stripePublishableKey);
    const elements = stripe.elements();
    
    // Create card Element
    const card = elements.create('card', {
        style: {
            base: {
                color: '#32325d',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#aab7c4'
                }
            },
            invalid: {
                color: '#dc3545',
                iconColor: '#dc3545'
            }
        }
    });

    // Mount the card Element
    card.mount('#card-element');

    // Handle real-time validation errors
    card.addEventListener('change', function(event) {
        const displayError = document.getElementById('card-errors');
        if (event.error) {
            displayError.textContent = event.error.message;
        } else {
            displayError.textContent = '';
        }
    });

    // Handle form submission
    const form = document.getElementById('payment-form');
    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        // Disable the submit button
        const submitButton = document.getElementById('submit-button');
        submitButton.disabled = true;

        try {
            // Create payment intent with affiliate data
            const response = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    affiliateData: affiliateParams
                })
            });

            const { clientSecret } = await response.json();

            // Get the state abbreviation
            const stateSelect = document.getElementById('state');
            const stateValue = stateSelect.value;

            // Confirm the payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: card,
                    billing_details: {
                        name: document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value,
                        email: document.getElementById('email').value,
                        phone: document.getElementById('phone').value,
                        address: {
                            line1: document.getElementById('street').value,
                            city: document.getElementById('city').value,
                            state: stateValue,
                            postal_code: document.getElementById('zip').value
                        }
                    }
                }
            });

            if (error) {
                // Show error to customer
                const errorElement = document.getElementById('card-errors');
                errorElement.textContent = error.message;
                submitButton.disabled = false;
            } else {
                // Payment successful - include affiliate data
                const successResponse = await fetch('/payment-success', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        paymentIntent,
                        affiliateData: affiliateParams
                    })
                });
                
                const { redirectUrl } = await successResponse.json();
                
                // Redirect to success page
                window.location.href = redirectUrl;
            }
        } catch (error) {
            console.error('Error:', error);
            const errorElement = document.getElementById('card-errors');
            errorElement.textContent = 'An error occurred. Please try again.';
            submitButton.disabled = false;
        }
    });
}); 