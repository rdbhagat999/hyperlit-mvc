import html from 'hyperlit'
import { StartEditing, InputEditing, StopEditing, ToggleDone, Delete } from './index.js'

const withEnterKey = (action) => (state, payload) => {
  if (payload.key && payload.key === 'Enter') return [action, payload]
  return state
}

const withTargetValue = (action) => (state, payload) => {
  if (payload.target && payload.target.value) return [action, payload.target.value]
  return state
}

const editable = ({editing, ...inputProps}, content) => (editing) ? textInput(inputProps) : content;

const listItem = (item, index, state) => html`
  <li id=${'li_' + index} key=${index}>

    ${editable(
      {
        editing: state.editing === index,
        id: `${'editing_' + index}`,
        value: item,
        oninput: InputEditing,
        onkeypress: StopEditing,
        onblur: StopEditing,
      },
      [
        html`
          <input id=${'input_' + index} type="checkbox" checked=${state.done[index]} oninput=${() => ToggleDone(state, index)} />
          <span class=${state.done[index] ? "done" : "no-cls"} ondblclick=${() => StartEditing(state, index)}>${item}</span>
          <button onclick=${() => Delete(state, index)}>X</button>
        `
      ]
    )}

  </li>
`;

export const textInput = (props) => {

  const inputProps = {
    ...props,
    id: props.id,
    value: props.value,
    oninput: withTargetValue(props.oninput),
    onkeypress: withEnterKey(props.onkeypress),
    onblur: props.onblur,
  };

  return html`<input type="text" ${inputProps} />`;
}

export const renderList = (state) => state.items.map((item, index) => listItem(item, index, state));
