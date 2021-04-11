var SSR_NODE = 1;
var TEXT_NODE = 3;
var EMPTY_OBJ = {};
var EMPTY_ARR = [];
var SVG_NS = "http://www.w3.org/2000/svg";

var id = (a) => a;
var map = EMPTY_ARR.map;
var isArray = Array.isArray;
var enqueue =
  typeof requestAnimationFrame !== "undefined"
    ? requestAnimationFrame
    : setTimeout;

var createClass = (obj) => {
  var out = "";

  if (typeof obj === "string") return obj

  if (isArray(obj)) {
    for (var k = 0, tmp; k < obj.length; k++) {
      if ((tmp = createClass(obj[k]))) {
        out += (out && " ") + tmp;
      }
    }
  } else {
    for (var k in obj) {
      if (obj[k]) out += (out && " ") + k;
    }
  }

  return out
};

var shouldRestart = (a, b) => {
  for (var k in { ...a, ...b }) {
    if (typeof (isArray(a[k]) ? a[k][0] : a[k]) === "function") {
      b[k] = a[k];
    } else if (a[k] !== b[k]) return true
  }
};

var patchSubs = (oldSubs, newSubs = EMPTY_ARR, dispatch) => {
  for (
    var subs = [], i = 0, oldSub, newSub;
    i < oldSubs.length || i < newSubs.length;
    i++
  ) {
    oldSub = oldSubs[i];
    newSub = newSubs[i];

    subs.push(
      newSub && newSub !== true
        ? !oldSub ||
          newSub[0] !== oldSub[0] ||
          shouldRestart(newSub[1], oldSub[1])
          ? [
              newSub[0],
              newSub[1],
              (oldSub && oldSub[2](), newSub[0](dispatch, newSub[1])),
            ]
          : oldSub
        : oldSub && oldSub[2]()
    );
  }
  return subs
};

var getKey = (vdom) => (vdom == null ? vdom : vdom.key);

var patchProperty = (node, key, oldValue, newValue, listener, isSvg) => {
  if (key === "key") ; else if (key === "style") {
    for (var k in { ...oldValue, ...newValue }) {
      oldValue = newValue == null || newValue[k] == null ? "" : newValue[k];
      if (k[0] === "-") {
        node[key].setProperty(k, oldValue);
      } else {
        node[key][k] = oldValue;
      }
    }
  } else if (key[0] === "o" && key[1] === "n") {
    if (
      !((node.events || (node.events = {}))[(key = key.slice(2))] = newValue)
    ) {
      node.removeEventListener(key, listener);
    } else if (!oldValue) {
      node.addEventListener(key, listener);
    }
  } else if (!isSvg && key !== "list" && key !== "form" && key in node) {
    node[key] = newValue == null ? "" : newValue;
  } else if (
    newValue == null ||
    newValue === false ||
    (key === "class" && !(newValue = createClass(newValue)))
  ) {
    node.removeAttribute(key);
  } else {
    node.setAttribute(key, newValue);
  }
};

var createNode = (vdom, listener, isSvg) => {
  var props = vdom.props;
  var node =
    vdom.type === TEXT_NODE
      ? document.createTextNode(vdom.tag)
      : (isSvg = isSvg || vdom.tag === "svg")
      ? document.createElementNS(SVG_NS, vdom.tag, { is: props.is })
      : document.createElement(vdom.tag, { is: props.is });

  for (var k in props) {
    patchProperty(node, k, null, props[k], listener, isSvg);
  }

  for (var i = 0; i < vdom.children.length; i++) {
    node.appendChild(
      createNode(
        (vdom.children[i] = maybeVNode(vdom.children[i])),
        listener,
        isSvg
      )
    );
  }

  return (vdom.node = node)
};

var patch = (parent, node, oldVNode, newVNode, listener, isSvg) => {
  if (oldVNode === newVNode) ; else if (
    oldVNode != null &&
    oldVNode.type === TEXT_NODE &&
    newVNode.type === TEXT_NODE
  ) {
    if (oldVNode.tag !== newVNode.tag) node.nodeValue = newVNode.tag;
  } else if (oldVNode == null || oldVNode.tag !== newVNode.tag) {
    node = parent.insertBefore(
      createNode((newVNode = maybeVNode(newVNode)), listener, isSvg),
      node
    );
    if (oldVNode != null) {
      parent.removeChild(oldVNode.node);
    }
  } else {
    var tmpVKid;
    var oldVKid;

    var oldKey;
    var newKey;

    var oldProps = oldVNode.props;
    var newProps = newVNode.props;

    var oldVKids = oldVNode.children;
    var newVKids = newVNode.children;

    var oldHead = 0;
    var newHead = 0;
    var oldTail = oldVKids.length - 1;
    var newTail = newVKids.length - 1;

    isSvg = isSvg || newVNode.tag === "svg";

    for (var i in { ...oldProps, ...newProps }) {
      if (
        (i === "value" || i === "selected" || i === "checked"
          ? node[i]
          : oldProps[i]) !== newProps[i]
      ) {
        patchProperty(node, i, oldProps[i], newProps[i], listener, isSvg);
      }
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
        (oldKey = getKey(oldVKids[oldHead])) == null ||
        oldKey !== getKey(newVKids[newHead])
      ) {
        break
      }

      patch(
        node,
        oldVKids[oldHead].node,
        oldVKids[oldHead],
        (newVKids[newHead] = maybeVNode(
          newVKids[newHead++],
          oldVKids[oldHead++]
        )),
        listener,
        isSvg
      );
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
        (oldKey = getKey(oldVKids[oldTail])) == null ||
        oldKey !== getKey(newVKids[newTail])
      ) {
        break
      }

      patch(
        node,
        oldVKids[oldTail].node,
        oldVKids[oldTail],
        (newVKids[newTail] = maybeVNode(
          newVKids[newTail--],
          oldVKids[oldTail--]
        )),
        listener,
        isSvg
      );
    }

    if (oldHead > oldTail) {
      while (newHead <= newTail) {
        node.insertBefore(
          createNode(
            (newVKids[newHead] = maybeVNode(newVKids[newHead++])),
            listener,
            isSvg
          ),
          (oldVKid = oldVKids[oldHead]) && oldVKid.node
        );
      }
    } else if (newHead > newTail) {
      while (oldHead <= oldTail) {
        node.removeChild(oldVKids[oldHead++].node);
      }
    } else {
      for (var keyed = {}, newKeyed = {}, i = oldHead; i <= oldTail; i++) {
        if ((oldKey = oldVKids[i].key) != null) {
          keyed[oldKey] = oldVKids[i];
        }
      }

      while (newHead <= newTail) {
        oldKey = getKey((oldVKid = oldVKids[oldHead]));
        newKey = getKey(
          (newVKids[newHead] = maybeVNode(newVKids[newHead], oldVKid))
        );

        if (
          newKeyed[oldKey] ||
          (newKey != null && newKey === getKey(oldVKids[oldHead + 1]))
        ) {
          if (oldKey == null) {
            node.removeChild(oldVKid.node);
          }
          oldHead++;
          continue
        }

        if (newKey == null || oldVNode.type === SSR_NODE) {
          if (oldKey == null) {
            patch(
              node,
              oldVKid && oldVKid.node,
              oldVKid,
              newVKids[newHead],
              listener,
              isSvg
            );
            newHead++;
          }
          oldHead++;
        } else {
          if (oldKey === newKey) {
            patch(
              node,
              oldVKid.node,
              oldVKid,
              newVKids[newHead],
              listener,
              isSvg
            );
            newKeyed[newKey] = true;
            oldHead++;
          } else {
            if ((tmpVKid = keyed[newKey]) != null) {
              patch(
                node,
                node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node),
                tmpVKid,
                newVKids[newHead],
                listener,
                isSvg
              );
              newKeyed[newKey] = true;
            } else {
              patch(
                node,
                oldVKid && oldVKid.node,
                null,
                newVKids[newHead],
                listener,
                isSvg
              );
            }
          }
          newHead++;
        }
      }

      while (oldHead <= oldTail) {
        if (getKey((oldVKid = oldVKids[oldHead++])) == null) {
          node.removeChild(oldVKid.node);
        }
      }

      for (var i in keyed) {
        if (newKeyed[i] == null) {
          node.removeChild(keyed[i].node);
        }
      }
    }
  }

  return (newVNode.node = node)
};

var propsChanged = (a, b) => {
  for (var k in a) if (a[k] !== b[k]) return true
  for (var k in b) if (a[k] !== b[k]) return true
};

var maybeVNode = (newVNode, oldVNode) =>
  newVNode !== true && newVNode !== false && newVNode
    ? typeof newVNode.tag === "function"
      ? ((!oldVNode ||
          oldVNode.memo == null ||
          propsChanged(oldVNode.memo, newVNode.memo)) &&
          ((oldVNode = newVNode.tag(newVNode.memo)).memo = newVNode.memo),
        oldVNode)
      : newVNode
    : text("");

var recycleNode = (node) =>
  node.nodeType === TEXT_NODE
    ? text(node.nodeValue, node)
    : createVNode(
        node.nodeName.toLowerCase(),
        EMPTY_OBJ,
        map.call(node.childNodes, recycleNode),
        SSR_NODE,
        node
      );

var createVNode = (tag, props, children, type, node) => ({
  tag,
  props,
  key: props.key,
  children,
  type,
  node,
});

var text = (value, node) =>
  createVNode(value, EMPTY_OBJ, EMPTY_ARR, TEXT_NODE, node);

var h = (tag, props, children = EMPTY_ARR) =>
  createVNode(tag, props, isArray(children) ? children : [children]);

var app = ({
  node,
  view,
  subscriptions,
  dispatch = id,
  init = EMPTY_OBJ,
}) => {
  var vdom = node && recycleNode(node);
  var subs = [];
  var state;
  var busy;

  var update = (newState) => {
    if (state !== newState) {
      if ((state = newState) == null) dispatch = subscriptions = render = id;
      if (subscriptions) subs = patchSubs(subs, subscriptions(state), dispatch);
      if (view && !busy) enqueue(render, (busy = true));
    }
  };

  var render = () =>
    (node = patch(
      node.parentNode,
      node,
      vdom,
      (vdom = view(state)),
      listener,
      (busy = false)
    ));

  var listener = function (event) {
    dispatch(this.events[event.type], event);
  };

  return (
    (dispatch = dispatch((action, props) =>
      typeof action === "function"
        ? dispatch(action(state, props))
        : isArray(action)
        ? typeof action[0] === "function"
          ? dispatch(action[0], action[1])
          : action
              .slice(1)
              .map(
                (fx) => fx && fx !== true && fx[0](dispatch, fx[1]),
                update(action[0])
              )
        : update(action)
    ))(init),
    dispatch
  )
};

const NEXT = 0;
const TEXT = 1;
const TAG = 2;
const CLOSINGTAG = 3;
const TAGNAME = 4;
const PROPS = 5;
const SELFCLOSING = 6;
const PROPNAME = 7;
const PROPVAL = 8;
const PROPVALSTR = 9;

const ws = (c) => c == ' ' || c == '\t' || c == '\n' || c == '\r';

const parse = (strs, vals) => {
    let tagname,
        propname,
        props,
        parent,
        list = [],
        ch,
        buffer = '',
        mode = NEXT,
        newline = true;

    const listpush = (x) => (x || x === 0)  && list.push(typeof x == 'string' ? text(x) : typeof x == 'number' ? text(''+x) : x);

    const pushnode = (ch, children = ch.flat(2)) => {
        listpush(tagname.call ? tagname(props, children) : h(tagname, props, children));
        mode = NEXT;
    };

    const gotText = (trim) => {
        if (trim) buffer = buffer.trimEnd();
        buffer && listpush(buffer);
        newline = false;
        buffer = '';
    };

    const open = () => {
        parent = [list, tagname, props, parent];
        list = [];
        mode = NEXT;
    };

    const gotTagName = (m = mode) => {
        tagname = buffer;
        buffer = '';
        props = {};
        mode = m;
    };

    const defaultProp = (m = mode) => {
        props[buffer] = true;
        mode = m;
        buffer = '';
    };

    const gotProp = (v) => {
        props[propname] = v;
        mode = PROPS;
        buffer = '';
    };

    const close = () => {
        let children = list
        ;[list, tagname, props, parent] = parent;
        pushnode(children);
    };

    for (let j = 0; j < strs.length; j++) {
        for (let i = 0; i < strs[j].length; i++) {
            ch = strs[j][i];
            if (mode == NEXT) {
                if (ch == '<') {
                    mode = TAG;
                } else if (!ws(ch)) {
                    mode = TEXT;
                    buffer = ch;
                } else if (ch =='\n') {
                    newline = true;
                } else if (!newline) {
                    mode = TEXT;
                    buffer = ch;
                }
            } else if (mode == TEXT) {
                if (ch == '<') {
                    mode = TAG;
                } else if (ch == '\n') {
                    gotText(false);
                    newline = true;
                    mode = NEXT;
                } else {
                    buffer += ch;
                }
            } else if (mode == TAG) {
                if (ch == '/') {
                    mode = CLOSINGTAG;
                    gotText(true);
                } else {
                    mode = TAGNAME;
                    gotText(false);
                    buffer = ch;
                }
            } else if (mode == CLOSINGTAG) {
                if (ch == '>') close();
            } else if (mode == TAGNAME) {
                if (ws(ch)) {
                    gotTagName(PROPS);
                } else if (ch == '/') {
                    gotTagName(SELFCLOSING);
                } else if (ch == '>') {
                    gotTagName();
                    open();
                } else {
                    buffer += ch;
                }
            } else if (mode == SELFCLOSING) {
                if (ch == '>') {
                    pushnode([]);
                }
            } else if (mode == PROPS) {
                if (ch == '.') ; else if (ch == '/') {
                    mode = SELFCLOSING;
                } else if (ch == '>') {
                    open();
                } else if (!ws(ch)) {
                    buffer = ch;
                    mode = PROPNAME;
                }
            } else if (mode == PROPNAME) {
                if (ch == '=') {
                    propname = buffer;
                    mode = PROPVAL;
                } else if (ch == '>') {
                    defaultProp();
                    open();
                } else if (ch == '/') {
                    defaultProp(SELFCLOSING);
                } else if (ws(ch)) {
                    defaultProp(PROPS);
                } else {
                    buffer += ch;
                }
            } else if (mode == PROPVAL) {
                if (ch == '"') {
                    mode = PROPVALSTR;
                    buffer = '';
                }
            } else if (mode == PROPVALSTR) {
                if (ch == '"') {
                    gotProp(buffer);
                } else {
                    buffer += ch;
                }
            }
        }
        if (mode == TAG) {
            tagname = vals[j];
            props = {};
            mode = PROPS;
        } else if (mode == TEXT) {
            gotText(!vals[j]);
            listpush(vals[j]);
        } else if (mode == PROPS) {
            props = { ...props, ...vals[j] };
        } else if (mode == PROPVAL) {
            gotProp(vals[j]);
        } else if (mode == PROPVALSTR) {
            buffer += vals[j];
        } else if (mode == NEXT && vals[j] != null) {
            listpush(vals[j]);
        }
    }
    list = list.flat(2);
    return list.length > 1 ? list : list[0]
};

var html = (strs, ...vals) => parse(strs, vals);

const _handleFocusEffect = (dispatch, options) => {

  requestAnimationFrame(_ => requestAnimationFrame(_ => {
    const el = document.querySelector(options.selector);

    if (el) {
      el.focus();
      console.log(options.selector);
    }

  }));

};

const focusEffect = (selector) => [_handleFocusEffect, { selector }];

const withEnterKey = (action) => (state, payload) => {
  if (payload.key && payload.key === 'Enter') return [action, payload]
  return state
};

const withTargetValue = (action) => (state, payload) => {
  if (payload.target && payload.target.value) return [action, payload.target.value]
  return state
};

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

const textInput = (props) => {

  const inputProps = {
    ...props,
    id: props.id,
    value: props.value,
    oninput: withTargetValue(props.oninput),
    onkeypress: withEnterKey(props.onkeypress),
    onblur: props.onblur,
  };

  return html`<input type="text" ${inputProps} />`;
};

const renderList = (state) => state.items.map((item, index) => listItem(item, index, state));

const InputNewItem = (state, input) => ({
  ...state,
  newitem: input
});

const AddItem = (state) => !state.newitem ? state : {
  ...state,
  items: [state.newitem, ...state.items],
  done: [false, ...state.done],
  newitem: null,
};

const ToggleDone = (state, index) => {
  let done = [...state.done];
  done[index] = !done[index];
  return {...state, done}
};

const Delete = (state, index) => {
  let items = [...state.items];
  let done = [...state.done];
  items.splice(index, 1);
  done.splice(index, 1);
  return {...state, items, done}
};

const StartEditing = (state, index) => {
  return [
    { ...state, editing: index },
    focusEffect(`#editing_${index}`)
  ]
};

const StopEditing = (state) => {
  return {...state, editing: null}
};

const InputEditing = (state, input) => {
  let items = [...state.items];
  items[state.editing] = input;
  return {...state, items}
};

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
