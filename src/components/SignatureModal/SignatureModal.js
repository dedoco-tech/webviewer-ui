import React, { useEffect } from 'react';
import classNames from 'classnames';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FocusTrap } from '@pdftron/webviewer-react-toolkit';

import { Tabs, Tab, TabPanel } from 'components/Tabs';
import InkSignature from 'components/SignatureModal/InkSignature';
import TextSignature from 'components/SignatureModal/TextSignature';
import ImageSignature from 'components/SignatureModal/ImageSignature';
import SavedSignature from 'components/SignatureModal/SavedSignature';
import Button from 'components/Button';

import core from 'core';
import actions from 'actions';
import selectors from 'selectors';
import { Swipeable } from 'react-swipeable';
import './SignatureModal.scss';

const SignatureModal = () => {
  const [isDisabled, isOpen, activeToolName, displayedSignatures] = useSelector(state => [
    selectors.isElementDisabled(state, 'signatureModal'),
    selectors.isElementOpen(state, 'signatureModal'),
    selectors.getActiveToolName(state),
    selectors.getDisplayedSignatures(state),
  ]);

  const signatureTool = core.getTool('AnnotationCreateSignature');

  // Hack to close modal if hotkey to open other tool is used.
  useEffect(() => {
    if (activeToolName !== 'AnnotationCreateSignature') {
      dispatch(actions.closeElements(['signatureModal', 'signatureOverlay']));
    }
  }, [dispatch, activeToolName]);

  const dispatch = useDispatch();
  const [t] = useTranslation();

  useEffect(() => {
    if (isOpen) {
      dispatch(actions.closeElements(['printModal', 'loadingModal', 'progressModal', 'errorModal']));
    }
  }, [dispatch, isOpen]);

  const closeModal = () => {
    signatureTool.clearLocation();
    signatureTool.setSignature(null);
    const modalClosedEvent = new CustomEvent('SignatureModalClosed');
    window.parent.dispatchEvent(modalClosedEvent);
    dispatch(actions.closeElement('signatureModal'));
  };

  const createSignature = async () => {
    if (!(await signatureTool.isEmptySignature())) {
      signatureTool.saveSignatures(signatureTool.annot);

      dispatch(actions.setSelectedDisplayedSignatureIndex(displayedSignatures.length));
      core.setToolMode('AnnotationCreateSignature');

      if (signatureTool.hasLocation()) {
        await signatureTool.addSignature();
      }

      signatureTool.annot = null; // Clears the annotation on cursor for sign all feature

      dispatch(actions.closeElement('signatureModal'));
    }
  };

  const modalClass = classNames({
    Modal: true,
    SignatureModal: true,
    open: isOpen,
    closed: !isOpen,
  });

  return isDisabled ? null : (
    <Swipeable onSwipedUp={closeModal} onSwipedDown={closeModal} preventDefaultTouchmoveEvent>
      <FocusTrap locked={isOpen}>
        <div className={modalClass} data-element="signatureModal">
          <div className="container" onMouseDown={e => e.stopPropagation()}>
            <div className="swipe-indicator" />
            <Tabs id="signatureModal">
              <div className="header-container">
                <div className="header">
                  <p>{t(`option.signatureModal.modalName`)}</p>
                  <Button
                    className="signatureModalCloseButton"
                    dataElement="signatureModalCloseButton"
                    title="action.close"
                    img="ic_close_black_24px"
                    onClick={closeModal}
                  />
                </div>
                <div className="tab-list">
                  <Tab dataElement="savedSignaturePanelButton">
                    <button className="tab-options-button">Saved</button>
                  </Tab>
                  <div className="tab-options-divider" />
                  <Tab dataElement="inkSignaturePanelButton">
                    <button className="tab-options-button">{t('action.draw')}</button>
                  </Tab>
                  <div className="tab-options-divider" />
                  <Tab dataElement="textSignaturePanelButton">
                    <button className="tab-options-button">{t('action.type')}</button>
                  </Tab>
                  <div className="tab-options-divider" />
                  <Tab dataElement="imageSignaturePanelButton">
                    <button className="tab-options-button">{t('action.upload')}</button>
                  </Tab>
                </div>
              </div>
              <TabPanel dataElement="savedSignaturePanel">
                <SavedSignature isModalOpen={isOpen} createSignature={createSignature} />
              </TabPanel>
              <TabPanel dataElement="inkSignaturePanel">
                <InkSignature isModalOpen={isOpen} createSignature={createSignature} />
              </TabPanel>
              <TabPanel dataElement="textSignaturePanel">
                <TextSignature isModalOpen={isOpen} createSignature={createSignature} />
              </TabPanel>
              <TabPanel dataElement="imageSignaturePanel">
                <ImageSignature isModalOpen={isOpen} createSignature={createSignature} />
              </TabPanel>
            </Tabs>
          </div>
        </div>
      </FocusTrap>
    </Swipeable>
  );
};

export default SignatureModal;
