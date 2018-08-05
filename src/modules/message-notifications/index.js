import getUrls from 'get-urls-to-array';

import registerModule from '~/utils/module';
import { fetchApi } from '~/utils/fetch';
import { createElement, insertCss } from '~/utils/dom';

import style from './style.css';

const TRANSITION_TIME = 500; // milliseconds for fade in/out animations

let wrapperElem;
const displayedMessages = new Set();

const identifiers = {
  messageMain: style.locals['message-main'],
  controls: style.locals.controls,
  messageText: style.locals['message-text'],
};

const formatBodyText = text => {
  return text
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/<br>/g, ' ')
    .trim();
};
const isOnMessagesInbox = () => window.location.hash === '#message/inbox';


class MessageNotification {

  constructor(message, disappearTime) {
    const bodyText = formatBodyText(message.body);

    this.urls = getUrls(bodyText);
    this.message = message;
    this.disappearTime = disappearTime;

    this.messageElem = (
      <a
        href={`https://gannacademy.myschoolapp.com/app/student#message/conversation/${message.id}`}
        onClick={ () => this.removeMessage() }
      >
        <div className={identifiers.messageMain}>
          <div className={identifiers.messageText}>
            <b>{message.from}: </b>
            <span>
              {bodyText}
            </span>
          </div>
          <div className={identifiers.controls}>
            <i className="fa fa-archive" onClick={e => this.onArchiveClick(e)}></i>
            {
              this.urls.length ?
              <i
                className="fa fa-link"
                style={{ marginLeft: '50%', marginTop: '1px' }}
                onClick={ () => this.removeMessage() }
              ></i> :
              null
            }
          </div>
        </div>
      </a>
    );

    this.main = this.messageElem.children[0]; // eslint-disable-line prefer-destructuring
    this.show();
  }

  show() {
    this.fadeIn();
    setTimeout(() => this.fadeOut(), this.disappearTime * 1000);
  }

  onArchiveClick(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    this.archiveMessage();
    this.removeMessage();
  }
  onLinkClick(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    window.open(this.urls[0]);
    this.removeMessage();
  }

  removeMessage() {
    this.messageElem.children[0].style.opacity = '0';
    setTimeout(() => {
      if (this.messageElem.parentNode) {
        this.messageElem.remove();
      }
    }, TRANSITION_TIME);
  }

  archiveMessage() {
    if (isOnMessagesInbox()) {
      document
        .querySelector(`tr[data-messageid="${this.message.id}"] button[title="Archive"]`)
        .click();
    } else {
      fetchApi(`/api/message/conversationarchive/${this.message.id}?format=json`, {
        method: 'PUT',
        body: JSON.stringify({
          id: this.message.id,
          unarchive: false,
        }),
      });
    }
  }

  fadeOut() {
    if (!wrapperElem.matches(':hover')) {
      this.removeMessage();
    } else {
      wrapperElem.addEventListener('mouseleave', () => {
        this.removeMessage();
      }, {
        once: true,
      });
    }
  }
  fadeIn() {
    this.main.style.opacity = '1';
  }
}

function createWrapper() {
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.right = '60px';
  wrap.style.bottom = '50px';
  wrap.style.zIndex = '1';
  return wrap;
}

function generateNotifications(messages, disappearTime) {
  for (const message of messages) {
    if (!displayedMessages.has(message.id)) {
      displayedMessages.add(message.id);
      const notification = new MessageNotification(message, disappearTime);
      wrapperElem.appendChild(notification.messageElem);
    }
  }
}

async function getMessages() {
  try {
    const data = await fetchApi('/api/message/inbox/?format=json');
    return data
      .map(conversation => {
        return conversation.Messages.filter(message => !message.ReadInd)[0];
      })
      .filter(Boolean)
      .map(conversation => ({
        from: `${conversation.FromUser.FirstName} ${conversation.FromUser.LastName}`,
        body: conversation.Body,
        id: conversation.ConversationId,
      }));
  } catch (e) {
    // will throw if not signed in or servers are down
    // don't display error message, because errors are shown natively
    return [];
  }
}

function addStyles() {
  const transitionPropertyName = '--message-notifications--transition-time';
  document.documentElement.style.setProperty(transitionPropertyName, `${TRANSITION_TIME}ms`);
  insertCss(style.toString());
}

async function messageNotifications(options) {
  if (!wrapperElem) {
    addStyles();
    wrapperElem = createWrapper();
    document.body.appendChild(wrapperElem);
  }
  const messages = (await getMessages()).slice(0, options.maxMessages);
  generateNotifications(messages, options.disappearTime);
}

export default registerModule('Message Notifications', messageNotifications, {
  options: {
    maxMessages: {
      type: 'number',
      name: 'Maximum Messages to Display',
      defaultValue: 3,
      min: 0,
      validator: val => (
        Math.floor(val) === val
      ),
    },
    disappearTime: {
      type: 'number',
      name: 'Disappear Time (seconds)',
      defaultValue: 10,
      min: 0,
    },
  },
});