import registerModule from '~/core/module';
import { UnloaderContext } from '~/core/module-loader';

import { waitForLoad, constructButton } from '~/utils/dom';
import { archiveMessage } from '~/shared/messages';

const isOnArchive = () => window.location.hash.endsWith('?archive');

const domQuery = {
  cancelLink: () => document.querySelector('#btnCancelLink') as HTMLElement,
  closeButton: () => document.querySelector('.close') as HTMLElement,
};

async function handleArchiveClick() {
  const onArchive = isOnArchive();
  let id = window.location.hash.split('/')[2];
  if (onArchive) {
    [id] = id.split('?');
  }
  await archiveMessage(id, isOnArchive());
  domQuery.closeButton().click();
}

function generateArchiveButton() {
  const text = isOnArchive() ? 'Unarchive' : 'Archive';
  return constructButton({
    textContent: text,
    onClick: handleArchiveClick,
  });
}

async function messageConversationControlsMain(opts: void, unloaderContext: UnloaderContext) {
  const cancelLink = await waitForLoad(domQuery.cancelLink);

  const archiveButton = generateArchiveButton();
  cancelLink.before(archiveButton);
  unloaderContext.addRemovable(archiveButton);
}

export default registerModule('{13aa861a-02a7-471d-9ee8-b30a0d62e45c}', {
  name: 'Message Conversation Archive',
  description: 'Archive button in the message conversation',
  main: messageConversationControlsMain,
});
