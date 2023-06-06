import React from "react"
import PropTypes from "prop-types"

export default class DefinitionSelect extends React.Component {
  static propTypes = {
    definitions: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    onSelect: PropTypes.func.isRequired,
    getComponent: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props)
  }

  handleSelect(key) {
    return () => this.props.onSelect(key)
  }

  render() {
    const { definitions, getComponent } = this.props
    const Button = getComponent("Button")

    if (!definitions) return null

    return (
      <div className="definition-select">
        {definitions.map((definition) => {
          const [key] = definition.keys()
          const schema = definition.first()
          return (
            <Button
              className="btn definition-option-btn"
              role="button"
              key={key}
              onClick={this.handleSelect(key)}
            >
              <strong>{schema.get("title") || key + ".title"}</strong>
              <p>{schema.get("description") || key + ".description"}</p>
            </Button>
          )
        })}
      </div>
    )
  }
}
