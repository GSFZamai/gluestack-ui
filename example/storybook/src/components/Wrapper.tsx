/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { config } from '../../gluestack.config';
import { StyledProvider } from '@dank-style/react';
import { View } from 'react-native';
export const Wrapper = ({ children }: any) => {
  return (
    <StyledProvider config={config}>
      <View style={{ justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        {children}
      </View>
    </StyledProvider>
  );
};
