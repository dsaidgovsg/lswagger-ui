import PropTypes from "prop-types"
import React from "react"

export class SamlAuth extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    authorized: PropTypes.object,
    getComponent: PropTypes.func.isRequired,
    schema: PropTypes.object.isRequired,
    authSelectors: PropTypes.object.isRequired,
    errSelectors: PropTypes.object.isRequired,
    authActions: PropTypes.func,
    samlAuthActions: PropTypes.func,
  };

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const { authSelectors, samlAuthActions, schema, name } = this.props

    const authorized = authSelectors.authorized()
    const isAuthenticated = authorized && authorized.get(name)
    // hide when it's authorized by other method
    const disabled = authorized.size > 0 && !isAuthenticated

    if (!isAuthenticated && !disabled) {
      samlAuthActions.loginSaml(name, schema)
    }
  }

  // hide when it's authorized by other method
  handleLogoutClick = () => {
    const { samlAuthActions, schema, name } = this.props
    samlAuthActions.logoutSaml(name, schema)
  };

  render() {
    const { name, getComponent, authSelectors } = this.props

    const authorized = authSelectors.authorized()

    const isAuthenticated = authorized && authorized.get(name)
    const Row = getComponent("Row")
    const Button = getComponent("Button")

    return (
      <Row className="saml-auth">
        {!isAuthenticated ? (
          <div className="saml-auth-info">Redirecting to SSO login...</div>
        ) : (
          <div className="field">
            <div className="input-group">
            <Button
              className="btn modal-btn auth authorize"
              onClick={this.handleLogoutClick}
            >
              Logout
            </Button>
            </div>
          </div>
        )}
      </Row>
    )
  }
}

export default SamlAuth
