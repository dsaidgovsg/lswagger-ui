import React, { cloneElement } from "react"
import PropTypes from "prop-types"

import {parseSearch, serializeSearch} from "core/utils"

class TopBar extends React.Component {

  render() {
    let { getComponent } = this.props
    const Logo = getComponent("Logo")

    return (
      <div className="header">
        <div className="header-content">
          <Logo/>
          <div class="email-copyright">
            <address class="email-container">
              <img class="email-icon" src="docs/assets/email.svg" alt="Email" />
              <a href="mailto:locus@tech.gov.sg">locus@tech.gov.sg</a>
            </address>
            <div class="copyright-container">
              <div class="copyright">© Data Science Artificial Intelligence Division, GovTech</div>
              <img class="copyright-logo" src="docs/assets/dsaid-logo.svg" alt="Copyright logo" />
            </div>
          </div>
        </div>
      </div>
    )
  }
}

export default TopBar
