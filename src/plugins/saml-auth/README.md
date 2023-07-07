# saml-auth

This plugin provides SAML authentication option for swagger-ui. Please note there is some customized step addtion to saml auth flow, e.g. authenticating SAML token.

## Customization

### Component: `AuthorizationPopup`

`AuthorizationPopup` is customized to add:
1. Login options screen.  e.g. otp, saml
2. SAML Login info, errors. e.g. saml error
3. Show Logged-in auth option's component. e.g. to compensate (1) after logged in

### New Component: `DefinitionSelect`

`DefinitionSelect` is a new component to add:
1. A list of available auth options as buttons.

### New Component: `SamlAuth`

`SamlAuth` is a new component to add:
1. SAML login form. e.g. loading state, logout button.
2. Login and logout action for SamlAuth

### StatePlugins

#### SamlAuth.actions

`SamAuth.actions` adds:
1. `setSamlAuthState` - set different auth state
2. `newSamlAuthErr` - show error when SAML auth failed
3. `authenticateWithSAMLToken` - authenticate with SAML token returned
4. `loginSaml` - redirect to saml login page
5. `logoutSaml` - redirect to saml logout page

### SamlAuth.reducers

`SamlAuth.reducers` reduces:
1. `samlAuthState` - state of SAML auth

### SamlAuth.selectors

`SamlAuth.selectors` selects:
1. `samlAuthState` - state of SAML auth
