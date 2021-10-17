import { createStore, applyMiddleware } from 'redux'
import thunk from 'redux-thunk'
import { reducer, initialState } from './reducers/auto-reducer'
// import allReducer from './reducers'
export const store = createStore<StoreStates, StoreAction<StoreActionsKeys>, {}, {}>(
  reducer,
  initialState,
  applyMiddleware(thunk)
)
// 根仓库
// export const store = createStore(allReducer, initialState, applyMiddleware(thunk))
declare global {
  type AppStore = typeof store
}
