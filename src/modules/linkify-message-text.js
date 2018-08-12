import linkifyHtml from 'linkifyjs/html';

import registerModule from '~/module';
import { waitForLoad } from '~/utils/dom';

const selectors = {
  link: 'gocp_linkify-message-text_link',
};

function linkifyMessageBody(messageBody) {
  messageBody.innerHTML = linkifyHtml(messageBody.innerHTML, {
    className: selectors.link,
    attributes: {
      rel: 'noopener',
    },
  });
}

const domQuery = () => document.querySelector('.modal-dialog .message-list-body');

async function linkifyMessageText() {
  await waitForLoad(domQuery);
  const messageBodies = document.querySelectorAll('.modal-dialog .message-list-body');
  for (const messageBody of messageBodies) {
    linkifyMessageBody(messageBody);
  }
}

function unloadLinkifyMessageText() {
  const links = document.querySelectorAll(`.${selectors.link}`);
  for (const link of links) {
    // replaces link with text inside
    link.replaceWith(link.firstChild);
  }
}

export default registerModule('{a0bcd3b0-2b61-4cf9-8435-ee988bd2c95e}', {
  name: 'Message Links',
  description: 'Make links in messages clickable',
  main: linkifyMessageText,
  unload: unloadLinkifyMessageText,
});