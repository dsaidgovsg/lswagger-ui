/**
 * @prettier
 */
import StandaloneLayoutPlugin from "standalone/plugins/stadalone-layout"
import LocusTopBarPlugin from "standalone/plugins/locus-top-bar"
import ConfigsPlugin from "core/plugins/configs"
import SafeRenderPlugin from "core/plugins/safe-render"

const StandalonePreset = [
  LocusTopBarPlugin,
  ConfigsPlugin,
  StandaloneLayoutPlugin,
  SafeRenderPlugin({
    fullOverride: true,
    componentList: ["Topbar", "StandaloneLayout", "onlineValidatorBadge"],
  }),
]

export default StandalonePreset
