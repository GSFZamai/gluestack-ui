import { Platform, StyleSheet } from 'react-native';
import { injectInStyle } from '../injectInStyle';
import {
  getComponentResolvedBaseStyle,
  getComponentResolvedVariantStyle,
  getDescendantResolvedBaseStyle,
  getDescendantResolvedVariantStyle,
  // getStyleIds,
  styledResolvedToOrderedSXResolved,
  styledToStyledResolved,
} from '../resolver';
import type {
  IWrapperType,
  OrderedSXResolved,
  StyledValueResolvedWithMeta,
} from '../types';
import { INTERNAL_updateCSSStyleInOrderedResolved } from '../updateCSSStyleInOrderedResolved';
import { deepMerge } from '../utils';

export class StyleInjector {
  #globalStyleMap: any;
  #globalStyleMapTemp: any;
  #stylesMap: any;
  platform: any;

  constructor() {
    this.#globalStyleMap = new Map();
    this.#globalStyleMapTemp = new Map();
    this.#stylesMap = new Map();
    this.platform = Platform.OS;
  }

  declare(
    _wrapperElementId: IWrapperType,
    componentHash: string,
    cssId: string,
    originalTheme: any,
    extednedConfig: any,
    componentStyleConfig: any
  ) {
    let previousStyleMap = new Map();
    if (
      this.#globalStyleMapTemp &&
      this.#globalStyleMapTemp?.get(_wrapperElementId)
    ) {
      previousStyleMap = this.#globalStyleMapTemp.get(_wrapperElementId);
    } else {
      this.#globalStyleMapTemp = new Map();
    }
    const val = `${componentHash}-${cssId}`;

    const themeData = {
      meta: {
        original: originalTheme,
        extendedConfig: extednedConfig,
        componentStyleConfig: componentStyleConfig,
      },
      value: undefined,
    };

    if (previousStyleMap) {
      const currentThemeMap = previousStyleMap.get(componentHash);

      if (currentThemeMap) {
        currentThemeMap.set(val, themeData);
        previousStyleMap.set(componentHash, currentThemeMap);
      } else {
        previousStyleMap.set(componentHash, new Map().set(val, themeData));
      }
      this.#globalStyleMapTemp.set(_wrapperElementId, previousStyleMap);
    } else {
      const compHash = new Map();
      this.#globalStyleMapTemp.set(
        _wrapperElementId,
        compHash.set(componentHash, new Map().set(val, themeData))
      );
    }
  }

  resolve(CONFIG: any) {
    if (this.#globalStyleMapTemp) {
      this.#globalStyleMapTemp.forEach((componentThemeHash: any) => {
        componentThemeHash.forEach(
          (componentThemes: any, componentThemesKey: any) => {
            componentThemes.forEach((componentTheme: any) => {
              const theme = componentTheme?.meta?.original;
              const ExtendedConfig = componentTheme?.meta?.extendedConfig;
              // const componentStyleConfig =
              //   componentTheme?.meta?.componentStyleConfig;

              let componentExtendedConfig = CONFIG;

              if (ExtendedConfig) {
                componentExtendedConfig = deepMerge(CONFIG, ExtendedConfig);
              }
              const styledResolved = styledToStyledResolved(
                theme,
                [],
                componentExtendedConfig
              );

              const orderedResolved =
                styledResolvedToOrderedSXResolved(styledResolved);

              INTERNAL_updateCSSStyleInOrderedResolved(
                orderedResolved,
                componentThemesKey
              );

              // const styleIds = getStyleIds(
              //   orderedResolved,
              //   componentStyleConfig
              // );
              const componentOrderResolvedBaseStyle =
                getComponentResolvedBaseStyle(orderedResolved);
              const componentOrderResolvedVariantStyle =
                getComponentResolvedVariantStyle(orderedResolved);

              const descendantOrderResolvedBaseStyle =
                getDescendantResolvedBaseStyle(orderedResolved);
              const descendantOrderResolvedVariantStyle =
                getDescendantResolvedVariantStyle(orderedResolved);

              this.update(
                componentOrderResolvedBaseStyle,
                'boot-base',
                componentThemesKey
                  ? componentThemesKey
                  : 'css-injected-boot-time'
              );
              this.update(
                descendantOrderResolvedBaseStyle,
                'boot-descendant-base',
                componentThemesKey
                  ? componentThemesKey
                  : 'css-injected-boot-time-descendant'
              );
              this.update(
                componentOrderResolvedVariantStyle,
                'boot-variant',
                componentThemesKey
                  ? componentThemesKey
                  : 'css-injected-boot-time'
              );
              this.update(
                descendantOrderResolvedVariantStyle,
                'boot-descendant-variant',
                componentThemesKey
                  ? componentThemesKey
                  : 'css-injected-boot-time-descendant'
              );
            });
          }
        );
      });
      this.#globalStyleMapTemp = undefined;
    }
  }

  update(
    orderedSXResolved: OrderedSXResolved,
    _wrapperElementId: IWrapperType,
    _styleTagId: any = 'css-injected-boot-time'
  ) {
    let previousStyleMap: any = new Map();
    let themeMap = new Map();

    if (this.#globalStyleMap.get(_wrapperElementId)) {
      previousStyleMap = this.#globalStyleMap.get(_wrapperElementId);
    }

    if (previousStyleMap) {
      if (themeMap.get(_styleTagId))
        themeMap = previousStyleMap.get(_styleTagId);
    }

    orderedSXResolved.forEach((styleResolved: StyledValueResolvedWithMeta) => {
      const styleData: any = {
        meta: {
          queryCondition: styleResolved?.meta?.queryCondition,
        },
      };

      if (this.platform === 'web') {
        styleData.value = styleResolved?.meta?.cssRuleset;
      } else {
        styleData.value = StyleSheet.create({
          [styleResolved.meta.cssId]: styleResolved?.resolved as any,
        });
      }
      const val = `${styleResolved.meta.cssId}`;

      themeMap.set(val, styleData);
      this.#stylesMap.set(styleResolved.meta.cssId, styleData);
    });

    if (themeMap.size > 0) previousStyleMap.set(_styleTagId, themeMap);

    if (previousStyleMap.size > 0)
      this.#globalStyleMap.set(_wrapperElementId, previousStyleMap);
  }

  getStyleMap() {
    return this.#stylesMap;
  }

  injectInStyle() {
    const styleSheetInjectInStyle = injectInStyle.bind(this);

    styleSheetInjectInStyle(this.#globalStyleMap);
  }
}

const stylesheet = new StyleInjector();

export const GluestackStyleSheet = {
  update: stylesheet.update.bind(stylesheet),
  declare: stylesheet.declare.bind(stylesheet),
  injectInStyle: stylesheet.injectInStyle.bind(stylesheet),
  getStyleMap: stylesheet.getStyleMap.bind(stylesheet),
  resolve: stylesheet.resolve.bind(stylesheet),
};
