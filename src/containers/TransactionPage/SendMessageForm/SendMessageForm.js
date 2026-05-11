import React, { Component } from 'react';
import { compose } from 'redux';
import { Form as FinalForm } from 'react-final-form';
import classNames from 'classnames';

import { FormattedMessage, injectIntl, intlShape } from '../../../util/reactIntl';
import { propTypes } from '../../../util/types';

import { Form, FieldTextInput, SecondaryButtonInline, IconSpinner } from '../../../components';

import css from './SendMessageForm.module.css';
import addImageIcon from './addImage.svg';
import { generatePresignedUrl } from '../../../util/api';

const BLUR_TIMEOUT_MS = 100;

const IconSendMessage = () => {
  return (
    <svg
      className={css.sendIcon}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      xmlns="http://www.w3.org/2000/svg"
      role="none"
    >
      <g className={css.strokeMatter} fill="none" fillRule="evenodd" strokeLinejoin="round">
        <path d="M12.91 1L0 7.003l5.052 2.212z" />
        <path d="M10.75 11.686L5.042 9.222l7.928-8.198z" />
        <path d="M5.417 8.583v4.695l2.273-2.852" />
      </g>
    </svg>
  );
};

const IconAddImage = () => {
  return (
    <img src={addImageIcon} alt="Add image" className={css.addImageIcon} width="16" height="16" />
  );
};

/**
 * Send message form
 *
 * @component
 * @param {Object} props - The props
 * @param {string} [props.className] - Custom class that extends the default class for the root element
 * @param {string} [props.rootClassName] - Custom class that extends the default class for the root element
 * @param {string} props.formId - The form id
 * @param {boolean} props.inProgress - Whether the form is in progress
 * @param {string} props.messagePlaceholder - The message placeholder
 * @param {Function} props.onSubmit - The on submit function
 * @param {Function} props.onFocus - The on focus function
 * @param {Function} props.onBlur - The on blur function
 * @param {propTypes.error} props.sendMessageError - The send message error
 * @param {intlShape} props.intl - The intl
 * @returns {JSX.Element} The SendMessageForm component
 */
class SendMessageFormComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uploadInProgress: false,
      uploadError: null,
    };

    this.handleFocus = this.handleFocus.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
    this.handleIconClick = this.handleIconClick.bind(this);
    this.blurTimeoutId = null;
    this.uploadInputRef = React.createRef();
  }

  componentWillUnmount() {
    if (this.uploadInputRef.current) {
      this.uploadInputRef.current.value = '';
    }
    window.clearTimeout(this.blurTimeoutId);
  }

  handleFocus() {
    if (this.props.onFocus) {
      this.props.onFocus();
    }
    window.clearTimeout(this.blurTimeoutId);
  }

  handleBlur() {
    // We only trigger a blur if another focus event doesn't come
    // within a timeout. This enables keeping the focus synced when
    // focus is switched between the message area and the submit
    // button.
    this.blurTimeoutId = window.setTimeout(() => {
      if (this.props.onBlur) {
        this.props.onBlur();
      }
    }, BLUR_TIMEOUT_MS);
  }

  async handleUpload(event, form, handleSubmit) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Clear any previous errors
    this.setState({ uploadError: null });

    // Validate file type (image or video)
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      this.setState({ uploadError: 'Please select a valid image or video file.' });
      return;
    }

    this.setState({ uploadInProgress: true, uploadError: null });

    try {
      // Step 1: Get presigned URL from backend
      const presignedResponse = await generatePresignedUrl({
        storagePath: `transactions/${this.props.txId}`,
        files: [
          {
            name: file.name,
            type: file.type,
          },
        ],
      });

      if (!presignedResponse.success || !presignedResponse.data?.[0]) {
        throw new Error('Failed to generate presigned URL');
      }

      const { url: presignedUrl, publicUrl } = presignedResponse.data[0];

      // Step 2: Upload file to R2 using PUT request
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Step 3: Set the media URL in the form and submit
      form.change(
        'mediaMessage',
        `New ${file.type.startsWith('image/') ? 'image' : 'video'} attached - ${publicUrl}`
      );

      // Reset the file input
      if (this.uploadInputRef.current) {
        this.uploadInputRef.current.value = '';
      }

      // Auto-submit the form with the media URL
      handleSubmit();
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.message || 'Failed to upload file. Please try again.';
      this.setState({ uploadError: errorMessage });

      // Reset the file input on error
      if (this.uploadInputRef.current) {
        this.uploadInputRef.current.value = '';
      }
    } finally {
      this.setState({ uploadInProgress: false });
    }
  }

  handleIconClick() {
    if (this.uploadInputRef.current) {
      this.uploadInputRef.current.click();
    }
  }

  render() {
    return (
      <FinalForm
        {...this.props}
        render={formRenderProps => {
          const {
            rootClassName,
            className,
            messagePlaceholder,
            handleSubmit,
            inProgress = false,
            sendMessageError,
            invalid,
            form,
            formId,
          } = formRenderProps;

          const classes = classNames(rootClassName || css.root, className);
          const { uploadInProgress, uploadError } = this.state;
          const submitInProgress = inProgress;
          const submitDisabled = invalid || submitInProgress || uploadInProgress;

          return (
            <Form className={classes} onSubmit={values => handleSubmit(values, form)}>
              <FieldTextInput
                inputRootClass={css.textarea}
                type="textarea"
                id={formId ? `${formId}.message` : 'message'}
                name="message"
                placeholder={messagePlaceholder}
                onFocus={this.handleFocus}
                onBlur={this.handleBlur}
              />
              <div className={css.submitContainer}>
                <div className={css.errorContainer}>
                  {sendMessageError ? (
                    <p className={css.error}>
                      <FormattedMessage id="SendMessageForm.sendFailed" />
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  className={css.uploadButton}
                  onClick={this.handleIconClick}
                  disabled={submitInProgress || uploadInProgress}
                >
                  {uploadInProgress ? (
                    <IconSpinner className={css.loadingIcon} />
                  ) : (
                    <span>
                      <IconAddImage /> Send media
                    </span>
                  )}
                  <input
                    type="file"
                    ref={this.uploadInputRef}
                    onChange={e =>
                      this.handleUpload(e, form, () => handleSubmit(formRenderProps.values, form))
                    }
                    className={css.imageUploader}
                    accept="image/*,video/*"
                  />
                </button>

                <SecondaryButtonInline
                  className={css.submitButton}
                  inProgress={submitInProgress}
                  disabled={submitDisabled}
                  onFocus={this.handleFocus}
                  onBlur={this.handleBlur}
                >
                  <IconSendMessage />
                  <FormattedMessage id="SendMessageForm.sendMessage" />
                </SecondaryButtonInline>
              </div>
            </Form>
          );
        }}
      />
    );
  }
}

const SendMessageForm = compose(injectIntl)(SendMessageFormComponent);

SendMessageForm.displayName = 'SendMessageForm';

export default SendMessageForm;
