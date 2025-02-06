# Brilliant Plus API Documentation

## API Domains
- **Staging:** `https://api-staging-brillaintplus.app`
- **Production:** `https://api-brillaintplus.app`

## Available Endpoints

### 1. Create Consultant/Ambassador
**Endpoint:** `/api/Consultants/CreateConsultant`
**Full URLs:**
- Staging: `https://api-staging-brillaintplus.app/api/Consultants/CreateConsultant`
- Production: `https://api-brillaintplus.app/api/Consultants/CreateConsultant`
**Purpose:** Creates a new consultant/ambassador and places them in the genealogy.

#### Example Payload
```json
{
    "Person_Name": {
        "FirstName": "Fred",
        "LastName": "Porter"
    },
    "Person_OtherInformation": {
        "ReplicatedSiteURL": "FPorter2",
        "TranslationLanguageID": 1,
        "ConsultantStatusID": 1,
        "ConsultantTypeID": 1,
        "Username": "FPorter2",
        "Password": "T3xtb0x!",
        "ConfirmPassword": "T3xtb0x!"
    },
    "Person_Identification": {
        "SSN": "719304439"
    },
    "DoNotSendAutoresponder": true,
    "DoNotSendWebhook": true,
    "DisplayID": null,
    "Person_SponsorDisplayId": "1001",
    "Person_ContactInfo": {
        "Email": "FPorter2@example.com",
        "Person_Phones": [
            {
                "PhoneTypeID": 1,
                "PhoneNumber": "9184969920",
                "Primary": true
            }
        ]
    },
    "Person_Addresses": [
        {
            "NickName": "Home Address",
            "FirstName": "Fred",
            "LastName": "Porter",
            "CountryID": 1,
            "ProvinceID": 12,
            "Street1": "1820 Gocgo Square",
            "Street2": "Suite 222",
            "City": "Tampa",
            "PostalCode": "33601",
            "Primary": true,
            "Mailing": true
        }
    ]
}
```

#### Important Notes for Consultant Creation
- DisplayID: Optional. If not provided, system will generate one
- Email addresses must be unique in the system
- Webhooks/Autoresponders: Set `DoNotSendAutoresponder` or `DoNotSendWebhook` to `false` to enable
- ConsultantTypeID: May vary based on comp plan (1 = Consultant in Sweetskies)
- ReplicatedSiteURL: Only allows letters, numbers, and dashes
- Additional IDs (countries, provinces) can be retrieved via separate API calls

### 2. Create Order
**Endpoint:** `/api/Orders/CreateCompleteOrder`
**Full URLs:**
- Staging: `https://api-staging-brillaintplus.app/api/Orders/CreateCompleteOrder`
- Production: `https://api-brillaintplus.app/api/Orders/CreateCompleteOrder`
**Purpose:** Creates a new order in the system

#### Example Payload
```json
{
    "DisplayID": null,
    "PostedDate": "2025-01-29T16:35:10.963Z",
    "OrderDate": "2025-01-29T16:35:10.963Z",
    "ShoppingCartID": 1,
    "CurrencyTypeAbbrev": "USD",
    "Locked": true,
    "Commissionable": true,
    "OrderStatusID": 5,
    "OrderPaymentStatusID": 3,
    "PersonDisplayID": "9076",
    "PersonTypeID": 1,
    "OrderLines": [
        {
            "SequenceNumber": 0,
            "SKU": "10-1002",
            "Price": 11.00,
            "Quantity": 1,
            "OrderLineStatusID": 3,
            "VirtualProduct": true,
            "LineVolumes": [
                {
                    "VolumeTypeAbbrev": "PV",
                    "Volume": 11.00
                }
            ],
            "LineDiscounts": [],
            "WarehouseDisplayID": "001",
            "WarehouseBinDisplayID": "1"
        }
    ],
    "CommissionOwnerDisplayID": "1001",
    "TaxInDisplayPrice": false,
    "OrderAddress": {
        "ProvinceID": 12
    }
}
```

#### Important Notes for Order Creation
- DisplayID: Optional. If not provided, system will generate one
- Volume determines compensation based on compensation plan
- Default Status Values:
  - Order Status: Set to Shipped
  - Order Payment Status: Set to Paid
- Required Fields (may be adjusted in future):
  - WarehouseDisplayID
  - WarehouseBinDisplayID
  - OrderAddress (minimum requirement: province)
  - LineDiscounts (can be empty array)

## Status Codes and IDs
- ConsultantTypeID: 1 (Consultant in Sweetskies)
- OrderStatusID: 5 (Shipped)
- OrderPaymentStatusID: 3 (Paid)
- PersonTypeID: 1

## Additional Information
- All dates should be in ISO 8601 format
- Currency is specified in USD
- Volume types use PV (Point Value) for compensation calculations 