# saml-auth

This plugin provides SAML authentication option for swagger-ui. Please note there is some customized step addtion to saml auth flow, e.g. authenticating SAML token.

## Customization

### Component: `AuthorizationPopup`

`AuthorizationPopup` is customized to add:
1. Login options screen.  e.g. otp, saml
2. SAML Login info, errors. e.g. authenticating,  error
3. Logged-in auth option's component. e.g. to compensate (1)

### Component: `WrapAuthItem`

`WrapAuthItem` is customized to add:
1. The entry point of SamlAuth component when definition matches SAML auth type.

### New Component: `DefinitionSelect`

`DefinitionSelect` is a new component to add:
1. A list of available auth options as buttons
2. Auth definitions' title, description as button text.

### New Component: `SamlAuth`

`SamlAuth` is a new component to add:
1. SAML login message and form. e.g. redirecting, logout button.
2. Logout action for SamlAuth

### StatePlugins

#### SamlAuth.actions

`SamAuth.actions` adds:
1. `setSamlAuthState` - set different auth state
3. `authenticateWithSAMLToken` - authenticate with SAML token returned
4. `loginSaml` - redirect to saml login page
5. `logoutSaml` - redirect to saml logout page

`authId` is set as `SamlAuth` to simplify the implementation.

### SamlAuth.reducers

`SamlAuth.reducers` reduces:
1. `samlAuthState` - state of SAML auth
2. `samlAuthEmail` - email of SAML auth

### SamlAuth.selectors

`SamlAuth.selectors` selects:
1. `samlAuthState` - state of SAML auth
2. `samlAuthEmail` - email of SAML auth
