import React, { useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import { ResponsiveImage } from '../index';
import Field, { hasDataInFields } from '../../containers/PageBuilder/Field';
import { exposeImageProps } from '../../containers/PageBuilder/Field/Field.helpers';
import SectionContainer from '../../containers/PageBuilder/SectionBuilder/SectionContainer';
import bannerCss from './LandingBanner.module.css';

const SLIDE_INTERVAL_MS = 3000;
const BACKGROUND_IMAGE_SIZES = '100vw';

const collectBlockBackgroundImages = blocks => {
  if (!blocks?.length) {
    return [];
  }
  return blocks.reduce((acc, block, index) => {
    const picked = block?.media ? exposeImageProps(block.media) : null;
    if (picked?.image) {
      acc.push({
        image: picked.image,
        alt: picked.alt,
        key: block.blockId ?? `block-${index}`,
      });
    }
    return acc;
  }, []);
};

const LandingBanner = props => {
  const {
    sectionId,
    className,
    rootClassName,
    defaultClasses,
    title,
    description,
    appearance,
    callToAction,
    blocks = [],
    options,
  } = props;
  const sliderContainerId = `${sectionId}-container`;
  const numberOfBlocks = blocks?.length;
  const hasBlocks = numberOfBlocks > 0;

  const backgroundImages = useMemo(() => collectBlockBackgroundImages(blocks), [blocks]);
  const hasSlideshowBackgrounds = backgroundImages.length > 0;

  const sectionAppearance = useMemo(() => {
    if (!hasSlideshowBackgrounds || !appearance || appearance.fieldType !== 'customAppearance') {
      return appearance;
    }
    const rest = { ...appearance };
    delete rest.backgroundImage;
    return rest;
  }, [appearance, hasSlideshowBackgrounds]);

  const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(0);

  useEffect(() => {
    setActiveBackgroundIndex(0);
  }, [backgroundImages.length]);

  useEffect(() => {
    if (backgroundImages.length <= 1 || typeof window === 'undefined') {
      return undefined;
    }

    let intervalId;
    const tick = () => {
      setActiveBackgroundIndex(i => (i + 1) % backgroundImages.length);
    };
    const start = () => {
      intervalId = window.setInterval(tick, SLIDE_INTERVAL_MS);
    };
    const stop = () => {
      if (intervalId) {
        window.clearInterval(intervalId);
        intervalId = undefined;
      }
    };
    const onVisibility = () => {
      stop();
      if (document.visibilityState === 'visible') {
        start();
      }
    };
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [backgroundImages.length]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const setCarouselWidth = () => {
      if (hasBlocks) {
        const elem = window.document.getElementById(sliderContainerId);
        if (!elem) {
          return;
        }
        const windowWidth = window.innerWidth;
        const scrollbarWidth = window.innerWidth - document.body.clientWidth;
        const elementWidth =
          elem.clientWidth >= windowWidth - scrollbarWidth ? windowWidth : elem.clientWidth;
        const carouselWidth = elementWidth - scrollbarWidth;

        elem.style.setProperty('--carouselWidth', `${carouselWidth}px`);
      }
    };
    setCarouselWidth();

    window.addEventListener('resize', setCarouselWidth);
    return () => window.removeEventListener('resize', setCarouselWidth);
  }, [hasBlocks, sliderContainerId]);

  const extraBackground = hasSlideshowBackgrounds ? (
    <div className={bannerCss.slideshowRoot} aria-hidden="true">
      {backgroundImages.map((item, i) => (
        <div
          key={`${sectionId}-bg-${item.key}`}
          className={classNames(bannerCss.slide, {
            [bannerCss.slideActive]: i === activeBackgroundIndex,
          })}
        >
          <ResponsiveImage
            className={bannerCss.slideImage}
            alt={item.alt}
            image={item.image}
            variants={Object.keys(item.image.attributes?.variants || {})}
            sizes={BACKGROUND_IMAGE_SIZES}
          />
        </div>
      ))}
    </div>
  ) : null;

  const fieldComponents = options?.fieldComponents;
  const fieldOptions = { fieldComponents };

  const hasHeaderFields = hasDataInFields([title, description, callToAction], fieldOptions);

  return (
    <SectionContainer
      id={sectionId}
      className={className}
      rootClassName={rootClassName}
      appearance={sectionAppearance}
      options={fieldOptions}
      extraBackground={extraBackground}
    >
      {hasHeaderFields ? (
        <header
          className={classNames(defaultClasses.sectionDetails, bannerCss.centeredSectionDetails)}
        >
          <Field data={title} className={defaultClasses.title} options={fieldOptions} />
          <Field data={description} className={defaultClasses.description} options={fieldOptions} />
          <Field data={callToAction} className={defaultClasses.ctaButton} options={fieldOptions} />
        </header>
      ) : null}
    </SectionContainer>
  );
};

export default LandingBanner;
