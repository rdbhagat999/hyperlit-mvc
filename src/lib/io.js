const _handleFocusEffect = (dispatch, options) => {

  requestAnimationFrame(_ => requestAnimationFrame(_ => {
    const el = document.querySelector(options.selector);

    if (el) {
      el.focus();
      console.log(options.selector);
    }

  }));

}

export const focusEffect = (selector) => [_handleFocusEffect, { selector }]