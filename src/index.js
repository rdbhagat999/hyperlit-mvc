import { app } from 'hyperapp'
import html from 'hyperlit'
import { focusEffect, textInput, renderList, AddItem, InputNewItem } from './lib'


app({
  init: [
    {
      newitem: null,
      items: [
        'milk', 'butter', 'tea', 'bread', 'jam'
      ],
      done: [
        false, false, true, false, true
      ],
      editing: null
    },
    focusEffect(`.newitementry input[type=text]`)
  ],
  view: (state) => html`
    <main>

      <header>
          <h1>HyperLit Todo MVC</h1>
      </header>

      <main>
      
        <section class="newitementry">        

          ${textInput({
            placeholder: "What do you need to do?",
            value: state.newitem,
            oninput: InputNewItem,
            onkeypress: AddItem
          })}

          <button onclick=${() => AddItem(state)}>+</button>
        </section>

        <section class="itemlist">
          <ul>
            ${ renderList(state) }
          </ul>
        </section>

      </main>


    </main>`,
  node: document.getElementById('app')
});
