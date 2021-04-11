import { focusEffect } from './index.js'

export const InputNewItem = (state, input) => ({
  ...state,
  newitem: input
})

export const AddItem = (state) => !state.newitem ? state : {
  ...state,
  items: [state.newitem, ...state.items],
  done: [false, ...state.done],
  newitem: null,
}

export const ToggleDone = (state, index) => {
  let done = [...state.done]
  done[index] = !done[index]
  return {...state, done}
}

export const Delete = (state, index) => {
  let items = [...state.items]
  let done = [...state.done]
  items.splice(index, 1)
  done.splice(index, 1)
  return {...state, items, done}
}

export const StartEditing = (state, index) => {
  return [
    { ...state, editing: index },
    focusEffect(`#editing_${index}`)
  ]
}

export const StopEditing = (state) => {
  return {...state, editing: null}
}

export const InputEditing = (state, input) => {
  let items = [...state.items]
  items[state.editing] = input;
  return {...state, items}
}