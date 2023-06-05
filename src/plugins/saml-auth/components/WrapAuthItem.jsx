import React from "react"
import PropTypes from "prop-types"
import SamlAuth from "./SamlAuth"

export default class WrappedAuthItem extends React.Component {
  static propTypes = {
    schema: PropTypes.object.isRequired,
    getSystem: PropTypes.func.isRequired,
    getComponent: PropTypes.func.isRequired,
    errSelectors: PropTypes.object.isRequired,
    authSelectors: PropTypes.object.isRequired,
    authorized: PropTypes.object,
    onAuthChange: PropTypes.func,
    name: PropTypes.string,
  }

  constructor(props) {
    super(props)
  }

  render() {
    const {
      schema,
      getComponent,
      authSelectors,
      errSelectors,
      authorized,
      onAuthChange,
      name,
      getSystem,
    } = this.props

    const type = schema.get("type")
    const saml = schema.get("saml")

    if (type === "apiKey" && !!saml) {
      return (
        <SamlAuth
          key={name}
          schema={schema}
          name={name}
          authSelectors={authSelectors}
          errSelectors={errSelectors}
          authorized={authorized}
          getComponent={getComponent}
          onChange={onAuthChange}
          samlAuthActions={getSystem().samlAuthActions}
        />
      )
    }
  }
}
