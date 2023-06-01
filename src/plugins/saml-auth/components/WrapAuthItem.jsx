/* eslint-disable react/prop-types */
import React from "react"
import SamlAuth from "./SamlAuth"

export default class WrappedAuthItem extends React.Component {
  constructor(props) {
    super(props)
  }

  render() {
    const {
      schema,
      getComponent,
      errSelectors,
      authorized,
      onAuthChange,
      name,
    } = this.props

    const type = schema.get("type")
    const saml = schema.get("saml")

    if (type === "apiKey" && !!saml) {
      return (
        <SamlAuth
          key={name}
          schema={schema}
          name={name}
          authSelectors={this.props.authSelectors}
          errSelectors={errSelectors}
          authorized={authorized}
          getComponent={getComponent}
          onChange={onAuthChange}
          samlAuthActions={this.props.samlAuthActions}
        />
      )
    }
  }
}
