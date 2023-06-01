import { createSelector } from "reselect"
import { Map } from "immutable"

const state = state => {
  return state || Map()
}

export const samlAuthState = createSelector(
  state,
  state => state.get("samlAuthState")
)

export const samlAuthEmail = createSelector(
  state,
  state => state.get("samlAuthEmail")
)
