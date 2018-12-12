# pizza-delivery-api
Homework Assignment #2 for Pirple's NodeJS Masterclass

# API Reference
## Introduction
This API allows user to create account, log in, log out, order pizza from menu and pay for that order. All API's responses are in JSON format, including error. 

## Status Code
| Code | Description              |
|:----:|--------------------------|
| 200  | OK                       |
| 400  | Bad request              |
| 500  | Server's technical error |

## /users
Acceptable method: POST, GET, PUT, DELETE
### POST
**Create new user with unique email address**
- **Required fields:** `firstName`, `lastName`, `email`, `password`, `address`
- **Optional fields:** none
- **Response:**  user's object if all parameters pass the validation.
- **Error:**
    - `400` - Required fields are missing or invalid.
    - `400` - This email has already used
    - `500` - Could not create user
    - `500` - Could not hash password

### GET
**Get user's data, only user with privilege can see their information**
- **Required fields:** none
- **Optional fields:** none
- `token` - must be included in request's header.
- `email` - must be included in request's query string. Example: `localhost:3000/users?email=user.email@mail.com`.
- **Return:** user's object without password if all validation passed.
- **Error:**
    - `400` - Required fields are missing or invalid
    - `400` - Invalid token
    - `404` - User not found

### PUT
**Update user's data. Only user with privilege can update their information and at least one of the optional fields must be presented**
- **Required fields:** `email`
- **Optional fields:** `firstName`, `lastName`, `password`, `address`
- `token` - must be included in request's header.
- **Return:** nothing if success.
- **Error:**
    - `400` - Required fields are missing or invalid
    - `400` - Missing fields to update
    - `400` - Invalid token
    - `400` - Could not find specified user
    - `500` - Could not create user

### DELETE
**Delete user's data, only user with privilege can update their information. All user's associated data will also be removed**
- **Required fields:** none
- **Optional fields:** none
- `token` - must be included in request's header.
- `email` - must be included in request's query string. Example: `localhost:3000/users?email=user.email@mail.com`.
- **Return:** nothing if success.
- **Error:**
    - `400` - Required fields are missing or invalid
    - `400` - Invalid token
    - `400` - Could not find specified user
    - `500` - Could not delete user

## /tokens
Acceptable method: POST, GET, PUT, DELETE

### POST
**Create token when users log in. Generated token id is a string which contains 20 random selected character and number. Token will expired 1 hour after created, use PUT request to extend the token.**
- **Required fields:** `email`, `password`
- **Optional fields:** none
- **Return:** the menu for user.
- **Error:**
    - `400` - Required fields are missing or invalid
    - `400` - Could not find specified user
    - `400` - Invalid password
    - `500` - Could not get menu items
    - `500` - Could not create token

### GET
**Get the token's information.**
- **Required fields:** none
- **Optional fields:** none
- `id` - token's id must be included in request's query string
- **Return:** token's object including `id`, `email`, `expired`
- **Error:**
    - `400` - Required field is missing or invalid
    - `404` - Token not found

### PUT
**Extend token duration to 1 hour from now.**
- **Required fields:** `id`, `extend`
- **Optional fields:** none
- **Return:** nothing if success
- **Error:**
    - `400` - Required fields are missing or invalid
    - `400` - Could not find specified token
    - `400` - Token has already expired
    - `500` - Could not update token

### DELETE
**Delete token when users log out.**
- **Required fields:** none
- **Optional fields:** none
- `id` - token's id must be included in request's query string
- **Return:** nothing if success
- **Error:**
    - `400` - Required field is missing or invalid
    - `400` - Could not find the specified token
    - `500` - Could not delete token

## /orders
Acceptable method: POST, GET, PUT, DELETE

### POST
**Create a shopping cart with items in the menu. Generated order's id is a string constructed from 20 random characters and numbers. Only user has logged in can create an order.**
- **Required fields:** `email`, `items`
- **Optional fields:** none
- `token` - must be included in the requrest's header.
- **Return:** oder's object including:
    - `id` - order's id
    - `email` - email of user creating this shopping cart
    - `items` - items in the shopping cart, including `id`, `size` and `quantity` of the pizza in the menu
    - `totalItem` - number of items in the shopping cart
    - `totalPrice` - amount of money user has to pay
    - `paid` - boolean variable indicates whether the shopping cart has been paid or not
- **Error:**
    - `400` - Required fields are missing or invalid
    - `400` - Invalid token
    - `400` - Could not find specified user
    - `400` - Shopping cart contains invalid item(s)
    - `500` - Could not get menu items
    - `500` - Could not create order

### GET
**Get the shopping cart's information. Only user with privilege can see their order.**
- **Required fields:** none
- **Optional fields:** none
- `id` - order's id must be included in the request's query string
- `token` - must be included in the request's header
- **Return:** order's object if success
- **Error:**
    - `400` - Required fields are missing or invalid
    - `400` - Invalid token
    - `404` - Order not found

### PUT
**Update items in the shopping cart. Only user with privilege can update their shooping cart**
- **Required fields:** `id`, `items`
- **Optional fields:** none
- `token` - must be included in the request's header
- **Return:** updated order's object
- **Error:**
    - `400` - Required fields are missing or invalid
    - `400` - Could not find order to update
    - `400` - Invalid token
    - `500` - Could not get the menu
    - `500` - Could not update order

### DELETE
**Delete the order. Only user with privilege can delete their order.**
- **Required fields:** none
- **Optional fields:** none
- `id` - order's id must be included in the request's query string
- `token` - must be included in the request's header
- **Return:** nothing if success
- **Error:**
    - `400` - Required fields are missing or invalid
    - `400` - Invalid token
    - `400` - Could not find specified order
    - `500` - Could not delete order

## /checkout
Acceptable method: POST
### POST
**Confirm order and check out. This will call the Stripe API to charge specified user's card which included in payload and send email to user using Mailgun API if the payment has been success. Only user with privilege can pay for their order.**
- **Required data:** `id`, `stripeToken`
- **Optional data:** none
- `token` - must be included in the request's header.
- **Return:** nothing if success or a warning if payment has been accepted but email has not been sent to user.
- **Error:**
    - `400` - Required fields are missing or invalid
    - `400` - Could not find specified order
    - `400` - Order has already been paid
    - `400` - Invalid token
    - `500` - Error from stripe call