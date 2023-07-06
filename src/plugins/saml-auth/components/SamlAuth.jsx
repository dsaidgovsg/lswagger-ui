import PropTypes from "prop-types"
import React from "react"

export class SamlAuth extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    authorized: PropTypes.object,
    getComponent: PropTypes.func.isRequired,
    schema: PropTypes.object.isRequired,
    samlAuthActions: PropTypes.object.isRequired,
  };

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const { authorized, samlAuthActions } = this.props

    if (authorized.size === 0) {
      samlAuthActions.loginSaml()
    }
  }

  handleLogoutClick = () => {
    const { samlAuthActions, name } = this.props
    samlAuthActions.logoutSaml(name)
  };

  render() {
    const { name, getComponent, authorized } = this.props

    const isAuthenticated = authorized && authorized.get(name)
    const Row = getComponent("Row")
    const Button = getComponent("Button")

    return (
      <Row className="saml-auth">
        {!isAuthenticated ? (
          <div className="loading-container saml-auth-info">
            <div className="loading"></div>
          </div>
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
